import * as esprima from 'esprima';

let input_vector = [[]];
let local_vars = [[]];
let ss_code = [];
let counter = 0;
let color = [];
let before_it_ctr = counter;

const parseCode = (codeToParse, inp_vec) => {

    input_vector = [[]];
    local_vars = [[]];
    ss_code = [];
    color = [];
    counter = 0;
    input_vector[counter] = inp_vec;
    let parsed_code = esprima.parseScript(codeToParse, {loc: true});
    symbolic_substitution(parsed_code);

    return [esprima.parseScript(codeToParse), ss_code, color];

};

const deep_copy = function(json){
    return JSON.parse(JSON.stringify(json));
};

let type_to_function_handler = {
    'Program': program_handler,
    'FunctionDeclaration': function_handler,
    'VariableDeclaration': variable_handler,
    'BlockStatement': block_handler,
    'BinaryExpression': binary_handler,
    'Literal' : literal_handler,
    'Identifier' : identifier_handler,
    'IfStatement': if_handler,
    'ReturnStatement': return_handler,
    'ExpressionStatement': expression_handler,
    'WhileStatement': while_handler,
    'ArrayExpression': array_handler,
    'AssignmentExpression': assignment_handler,
    'MemberExpression': member_handler,
};

function symbolic_substitution(parsed_code){
    type_to_function_handler[parsed_code.type](parsed_code);
}

function program_handler(parsed_code){
    if(parsed_code.body.length == 0)return;
    if(parsed_code.body[0].type === 'VariableDeclaration'){
        parsed_code.body[0].declarations.forEach(function (variable) {
            input_vector[counter].push({
                key: variable.id.name,
                value: type_to_function_handler[variable.init.type](variable.init)

            });
            ss_code += 'let ' + variable.id.name + ' = ' + type_to_function_handler[variable.init.type](variable.init) + ';\n' ;
        });
        parsed_code = parsed_code.body.slice(1);
    }
    else{
        parsed_code = parsed_code.body;
    }
    parsed_code.forEach(function (statement) {
        type_to_function_handler[statement.type](statement);
    });
}

function function_handler(parsed_code){
    let line = 'function ' + parsed_code.id.name + '(';
    parsed_code.params.forEach(function(param){
        line += param.name + ', ';
    });
    line = parsed_code.params.length==0 ? line+= '){\n' : line.substring(0,line.length-2) + ( '){\n');
    ss_code += line;
    type_to_function_handler[parsed_code.body.type](parsed_code.body);
    ss_code += '}\n';
}

function variable_handler(parsed_code){
    parsed_code.declarations.forEach(function (variable) {
        local_vars[counter].push({
            key: variable.id.name,
            value: type_to_function_handler[variable.init.type](variable.init)
        });
    });

}

function block_handler(parsed_code){
    parsed_code.body.forEach(function (param) {
        type_to_function_handler[param.type](param);
    });
}

function binary_handler(parsed_code){
    let left = type_to_function_handler[parsed_code.left.type](parsed_code.left);
    let right = type_to_function_handler[parsed_code.right.type](parsed_code.right);
    let operator = parsed_code.operator.replace('<', ' < ').replace('>',' > ');

    return '(' + left + operator + right + ')';
}

function literal_handler(parsed_code){
    return parsed_code.value;
}
function identifier_handler(parsed_code, value = true){
    let id = parsed_code.name;
    let variable = local_vars[counter].filter(x=>x.key==id)[0];
    if(variable!=undefined){
        return value == true ? variable.value :variable.key;
    }
    return input_vector[counter].filter(x=>x.key==id)[0].key;
}

function if_handler(parsed_code, type = 'if', green=false){
    let test_left = type_to_function_handler[parsed_code.test.left.type](parsed_code.test.left);
    let test_right = type_to_function_handler[parsed_code.test.right.type](parsed_code.test.right);
    let operator = parsed_code.test.operator.replace('<', ' < ').replace('>',' > ');
    let tab = parsed_code.loc.start.column;
    if(type == 'if'){
        before_it_ctr = counter;
        green = is_green(test_left,test_right,operator);paint(green);
        type_if_helper(parsed_code, test_left, operator, test_right, tab, green);
    }
    else{ //if(type == 'else if'){
        type_else_if_helper(parsed_code, test_left, operator, test_right, tab, green);

    }
    if(parsed_code.alternate != undefined && parsed_code.alternate.test == undefined) {
        type_else_helper(parsed_code, tab);
    }
}

function paint(green){
    color.push({
        line: ss_code.split('\n').length - 1,
        color:  green == true ? 'green' : 'red'
    });
}

function type_if_helper(parsed_code, test_left, operator, test_right, tab, green){
    ss_code += ' '.repeat(tab) +'if(' + test_left + operator + test_right +'){\n';
    copy_vars_branch();
    type_to_function_handler[parsed_code.consequent.type](parsed_code.consequent);
    ss_code += ' '.repeat(tab) +'}\n';
    if(parsed_code.alternate!=undefined && parsed_code.alternate.test != undefined) {
        if_handler(parsed_code.alternate, 'else if', green);
    }
}
function type_else_if_helper(parsed_code, test_left, operator, test_right, tab, green){
    let curr_green;
    paint(curr_green = (is_green(test_left,test_right,operator) && !green));
    curr_green = green === true ? true: curr_green;
    ss_code += ' '.repeat(tab-5) +'else if(' + test_left + operator + test_right +'){\n';
    copy_vars_branch();
    type_to_function_handler[parsed_code.consequent.type](parsed_code.consequent);
    ss_code += ' '.repeat(tab-5) +'}\n';
    if(parsed_code.alternate!=undefined && parsed_code.alternate.test != undefined){
        if_handler(parsed_code.alternate, 'else if', curr_green);
    }
}

function type_else_helper(parsed_code,tab){
    ss_code += ' '.repeat(tab-5) +'else{\n';
    copy_vars_branch();
    type_to_function_handler[parsed_code.alternate.type](parsed_code.alternate);
    ss_code += ' '.repeat(tab-5) +'}\n';
}
function copy_vars_branch(){
    counter +=1;
    input_vector[counter] = [];
    local_vars[counter] = [];
    input_vector[counter] = deep_copy(input_vector[before_it_ctr]);
    local_vars[counter] = deep_copy(local_vars[before_it_ctr]);
}

function is_green(test_left,test_right,operator){
    let expression = test_left + operator + test_right;
    let expression_vars = (test_left + operator + test_right).match(/[a-zA-Z]+/g);
    let numeric_expression = expression;
    if(expression_vars !=undefined){
        for (let variable of expression_vars){
            numeric_expression = numeric_expression.replace(variable, input_vector[counter].filter(x=>x.key==variable)[0].value);
        }
    }
    return eval(numeric_expression);
}


function expression_handler(parsed_code){
    type_to_function_handler[parsed_code.expression.type](parsed_code.expression);

}

function return_handler(parsed_code){
    let tab = parsed_code.loc.start.column;
    let id = type_to_function_handler[parsed_code.argument.type](parsed_code.argument);
    ss_code += ' '.repeat(tab) + 'return ' + id + ';\n';
}

function while_handler(parsed_code){
    let test_left = type_to_function_handler[parsed_code.test.left.type](parsed_code.test.left);
    let test_right = type_to_function_handler[parsed_code.test.right.type](parsed_code.test.right);
    let operator = parsed_code.test.operator.replace('<', ' < ').replace('>',' > ');
    let tab = parsed_code.loc.start.column;
    ss_code += ' '.repeat(tab) + 'while(' + test_left + operator + test_right +'){\n';
    type_to_function_handler[parsed_code.body.type](parsed_code.body);
    ss_code += ' '.repeat(tab) + '}\n';
}

function array_handler(parsed_code){
    let arr = [];
    parsed_code.elements.forEach(function (elem) {
        arr.push(type_to_function_handler[elem.type](elem));
    });
    return arr;
}

function assignment_handler(parsed_code){
    let id = type_to_function_handler[parsed_code.left.type](parsed_code.left, false);
    let variable;
    let equal_to = type_to_function_handler[parsed_code.right.type](parsed_code.right);
    let input_vector_assign = false;
    if(id.length > 1){ //array expression
        let arr_name = id[0];
        let arr_idx = id[1];
        variable = input_vector[counter].filter(x=>x.key==arr_name)[0];
        if(variable != undefined) input_vector_assign = true;
        else variable = local_vars[counter].filter(x=>x.key==arr_name)[0] ;
        variable.value[arr_idx] = equal_to; id = arr_name + '[' + arr_idx + ']';
    }
    else{
        variable = input_vector[counter].filter(x=>x.key==id)[0];
        if(variable != undefined) input_vector_assign = true;
        else variable = local_vars[counter].filter(x=>x.key==id)[0]; variable.value = equal_to;
    }
    if(input_vector_assign)ss_code += ' '.repeat(parsed_code.loc.start.column) + id + ' = ' + equal_to +';\n';
}
function member_handler(parsed_code, value = true){
    let arr_id = parsed_code.object.name;
    let ele_idx = type_to_function_handler[parsed_code.property.type](parsed_code.property);
    if(!value){
        return [arr_id, ele_idx];
    }
    let arr_obj = input_vector[counter].filter(x=>x.key==arr_id)[0];
    arr_obj = arr_obj === undefined ? local_vars[counter].filter(x=>x.key==arr_id)[0] : arr_obj;
    return arr_obj.value[ele_idx];
}

export {parseCode};


