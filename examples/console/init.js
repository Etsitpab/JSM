/*global Dom, JsConsole, ScriptArea, OutTable, Plot, Disk, Matrix, console, document, FileReader, Tools*/

var plotA, plotB, canvas;
window.addEventListener("load", function () {
    'use strict';
    canvas = new SuperCanvas(document.body);
    var size = [$('plot1').clientWidth - 20, $('plot1').clientHeight - 20]
    plotA = new Plot('plotA', size, 'plot1');

    size = [$('plot2').clientWidth - 20, $('plot2').clientHeight - 20]
    plotB = new Plot('plotB', size, 'plot2');
    $S("uiLeft").display = "none";
    $S("imageSelector").display = "none";
    $S("plot1").display = "none";
    $S("plot2").display = "none";
}, false);
