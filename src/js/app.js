import $ from 'jquery';
import {parseCode} from './code-analyzer';

function paint(ss_code, colors) {
    let ss_painted = ss_code.split('\n');
    for(let color of colors){
        ss_painted[color.line] = color.color == 'green' ? '<span style="background:green;">' + ss_painted[color.line] + '</span>' :
            '<span style="background:red;">' + ss_painted[color.line]  + '</span>';
    }
    return ss_painted.join('\n');
}


$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let input_vector = [];
        let input_vector_text = document.getElementById('inputVector').value.replace(/\s/g,'');
        input_vector_text.split(';').forEach(function (args){
            args = args.split('=');
            input_vector.push({
                key: args[0],
                value: parseFloat(args[1])
            });
        });
        let ret =  parseCode(codeToParse, input_vector);
        let parsedCode = ret[0]; let ss_code = ret[1]; let colors = ret[2];
        ss_code = paint(ss_code,colors);
        $('#parsedCode').html(ss_code);
        parsedCode;
    });

});


