/*global Dom, JsConsole, ScriptArea, OutTable, Plot, Disk, Matrix, console, document, FileReader, Tools*/

var plotA, plotB, canvas;
window.addEventListener("load", function () {
    'use strict';
    canvas = new SuperCanvas(document.body);
    var size = [$('plot1Container').clientWidth - 20, $('plot1Container').clientHeight - 20]
    plotA = new Plot('plotA', size, 'plot1Container');

    size = [$('plot2Container').clientWidth - 20, $('plot2Container').clientHeight - 20]
    plotB = new Plot('plotB', size, 'plot2Container');
    $S("uiLeft").display = "none";
    $S("imageSelector").display = "none";
    $S("plot1Container").display = "none";
    $S("plot2Container").display = "none";
}, false);
