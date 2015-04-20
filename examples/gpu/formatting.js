/*jslint vars: true, nomen: true, browser: true, plusplus: true */
/*exported formatSourceCode */

'use strict';


// Split a text into an array of lines
var textToLines = function (str) {
    str += '\n';
    var lines = str.split(/[ \t\r]*\n/);
    lines.pop();
    return lines;
};

// Remove trailing empty lines
var removeTrailingLines = function (lines) {
    while (lines.length && lines[lines.length - 1] === '') {
        lines.pop();
    }
};

// Re-indent the lines (remove extra leading spaces)
var reindent = function (lines) {
    var k, n, match;
    var indent = 9999;
    for (k = 0; k < lines.length; k++) {
        if (lines[k].length) {
            match = lines[k].match(/^\s*/);
            n = match[0].length;
            if (n === 0) {
                return;  // no space to be removed
            }
            if (n < indent) {
                indent = n;
            }
        }
    }
    for (k = 0; k < lines.length; k++) {
        lines[k] = lines[k].substring(indent);
    }
};

// Format source code by removing extra spaces
var formatSourceCode = function (str) {
    var lines = textToLines(str);

    removeTrailingLines(lines);
    lines.reverse();
    removeTrailingLines(lines);
    lines.reverse();

    reindent(lines);
    return lines.join('\n');
};
