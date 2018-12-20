import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';

describe('The javascript parser', () => {
    it('example 1 test', () => {
        let code = 'function foo(x, y, z){\n    let a = x + 1;\n    let b = a + y;\n    let c = 0;\n    \n    if (b < z) {\n        c = c + 5;\n' +
            '        return x + y + z + c;\n' +
            '    } else if (b < z * 2) {\n' +
            '        c = c + x + 5;\n' +
            '        return x + y + z + c;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' +
            '        return x + y + z + c;\n' +
            '    }\n' +
            '}\n';
        let inp_vector =  [
            {key: 'x', value: 1},            {key: 'y', value: 2},            {key: 'z', value: 3}] ;
        assert.equal(
            parseCode(code,inp_vector)[1],
            'function foo(x, y, z){\n    if(((x+1)+y) < z){\n        return (((x+y)+z)+(0+5));\n    }\n      else if(((x+1)+y) < (z*2)){\n        return (((x+y)+z)+((0+x)+5));\n      }\n      else{\n        return (((x+y)+z)+((0+z)+5));\n      }\n}\n'
        );
    });
});

describe('The javascript parser', () => {
    it('example 2 test', () => {
        let code = 'function foo(x, y, z){\n    let a = x + 1;\n    let b = a + y;\n    let c = 0;\n    \n' +
            '    while (a < z) {\n' +
            '        c = a + b;\n' +
            '        z = c * 2;\n' +
            '    }\n' +
            '    \n' +
            '    return z;\n' +
            '}\n';

        let inp_vector =  [
            {key: 'x', value: 1},            {key: 'y', value: 2},            {key: 'z', value: 3}] ;
        assert.equal(
            parseCode(code,inp_vector)[1],
            'function foo(x, y, z){\n    while((x+1) < z){\n        z = (((x+1)+((x+1)+y))*2);\n    }\n    return z;\n}\n'
        );
    });

});

describe('The javascript parser', () => {
    it('global vars', () => {
        let code = 'let z = 5;\n' +
            'function foo(x){\n' +
            '    let c = x + z;\n' +
            '    return c;\n' +
            '}';
        let inp_vector = [{key: 'x', value: 1}];
        assert.equal(
            parseCode(code, inp_vector)[1],
            'let z = 5;\nfunction foo(x){\n    return (x+z);\n}\n'
        );
    });
});
describe('The javascript parser', () => {
    it('else if concatenations', () => {
        let code = 'let z = 5;\nfunction foo(x){\n    let c = 4;\n    if(c<1){\n       return c + 1;\n    }\n' +
            '    else if(c<5){\n' +
            '       return c + 5;\n' +
            '    }\n' +
            '    else if(c<10){\n' +
            '       return c + 10;\n' +
            '    }\n' +
            '    else{\n' +
            '       return c;\n' +
            '    }\n' +
            '}\n';
        let inp_vector = [{key: 'x', value: 1}];
        assert.equal(
            parseCode(code, inp_vector)[1],
            'let z = 5;\nfunction foo(x){\n    if(4 < 1){\n       return (4+1);\n    }\n    else if(4 < 5){\n       return (4+5);\n    }\n    else if(4 < 10){\n       return (4+10);\n    }\n    else{\n       return 4;\n    }\n}\n'
        );
    });
});

describe('The javascript parser', () => {
    it('just one if statement', () => {
        let code = 'function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;    \n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '        return x + y + z + c;\n' +
            '    }\n' +
            '    return 0\n' +
            '}\n';
        let inp_vector =  [
            {key: 'x', value: 1},{key: 'y', value: 2},{key: 'z', value: 3}] ;
        assert.equal(
            parseCode(code, inp_vector)[1],
            'function foo(x, y, z){\n    if(((x+1)+y) < z){\n        return (((x+y)+z)+(0+5));\n    }\n    return 0;\n}\n'
        );
    });
});

describe('The javascript parser', () => {
    it('no globals', () => {
        let code = 'function foo(){\n' +
            '    let c = 5;\n' +
            '    return c;\n' +
            '}';
        let inp_vector = [];
        assert.equal(
            parseCode(code, inp_vector)[1],
            'function foo(){\n    return 5;\n}\n'
        );
    });
});

describe('The javascript parser', () => {
    it('empty', () => {
        let code = '';
        let inp_vector = [];
        assert.equal(
            parseCode(code, inp_vector)[1],
            ''
        );
    });
});

describe('The javascript parser', () => {
    it('simple func', () => {
        let code = 'function foo(x){\n' +
            '    let c = 3;\n' +
            '    return x + 5;\n' +
            '}';
        let inp_vector = [{key: 'x', value: 5}];
        assert.equal(
            parseCode(code, inp_vector)[1],
            'function foo(x){\n    return (x+5);\n}\n'
        );
    });
});

describe('The javascript parser', () => {
    it('simple func', () => {
        let code = 'function foo(){\n' +
            '    let y = 4;\n' +
            '    return y;\n' +
            '}';
        let inp_vector = [{key: 'x', value: 5}];
        assert.equal(
            parseCode(code, inp_vector)[1],
            'function foo(){\n    return 4;\n}\n'
        );
    });
});

describe('The javascript parser', () => {
    it('global vars', () => {
        let code = 'let z = 5;\n' +
            'function foo(x){\n' +
            '    let c = x + z;\n' +
            '    return c;\n' +
            '}';
        let inp_vector = [{key: 'x', value: 1}, {key: 'z', value: 3}];
        assert.equal(
            parseCode(code, inp_vector)[1],
            'let z = 5;\nfunction foo(x){\n    return (x+z);\n}\n'
        );
    });
});

describe('The javascript parser', () => {
    it('arrays', () => {
        let code = 'function foo(){\n' +
            '    let arr = [1,4,5,6];\n' +
            '    if(arr[3] < 5){\n' +
            '        return 5;\n' +
            '    }\n' +
            '    return arr[3];\n' +
            '}';
        let inp_vector = [];
        assert.equal(
            parseCode(code, inp_vector)[1],
            'function foo(){\n    if(6 < 5){\n        return 5;\n    }\n    return 6;\n}\n'
        );
    });
});

describe('The javascript parser', () => {
    it('arrays', () => {
        let code = 'function foo(){\n' +
            '    let arr = [1,4,5,6];\n' +
            '    arr[0] = arr[3]\n' +
            '    return arr;\n' +
            '}';
        let inp_vector = [];
        assert.equal(
            parseCode(code, inp_vector)[1],
            'function foo(){\n    return 6,4,5,6;\n}\n'
        );
    });
});

describe('The javascript parser', () => {
    it('global array', () => {
        let code = 'let arr = [1,4,5,6];\n' +
            'function foo(){  \n' +
            '    arr[0] = arr[3]\n' +
            '    return arr;\n' +
            '}';
        let inp_vector = [];
        assert.equal(
            parseCode(code, inp_vector)[1],
            'let arr = 1,4,5,6;\nfunction foo(){\n    arr[0] = 6;\n    return arr;\n}\n'
        );
    });
});