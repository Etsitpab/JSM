/*global console, document, Matrix, Colorspaces, CIE, open */
/*jshint indent: 4, unused: true, white: true */

var path = "D:\\Hardweird\\DxO-ISP\\Scripts\\Batch\\_iso1600_global2\\Hero4_BATCH_CFAST2\\",
    imagePrefixes = [
        "GOPR0004_HCT_ISO1600",
        "GOPR0004_LCT_ISO1600"
    ];

var IMAGES, SC;


var parameters = {
    'hGreen':      ["0.7",  "0.9",  "1.1"],
    'hRedBlue':    ["0.7",  "0.9",  "1.1"],
    'alphaLuma':   ["0.15", "0.3",  "0.45"],
    'alphaChroma': ["0.2",  "0.35", "0.5"],
    'nMod':        ["0.75", "1.0",  "1.25"]
};
var parameterNames = {
    'hGreen':      "h",
    'hRedBlue':    "h2",
    'alphaLuma':   "al",
    'alphaChroma': "ac",
    'nMod':        "nmod"
}

var currentParameterIndices = {};

function updateImage() {
    "use strict";
        
    var name = path + imagePrefixes[0];
        
    for (var p in parameters) {
        name += "_" + parameterNames[p] + parameters[p][currentParameterIndices[p]];
    }
     /*
    var i = 1;
    for (var p in parameters) {
        console.log(p, parseInt(currentParameterIndices[p]));
        i += parseInt(currentParameterIndices[p]);
    }*/
    name += ".jpg";
    console.log(name);
    var image = new Image();
    image.src = name;
    image.onload = function () {
        SC.setImageBuffer(this, 0);
        SC.displayImageBuffer(0, SC.matrix === undefined ? false : true);
    };
    return;
}


var initParameters = function () {
    "use strict";
    var onChange = function () {
        currentParameterIndices[this.id] = this.value;
        console.log(parameters[this.id][this.value]);
        $(this.id + "Val").value = parameters[this.id][this.value];
        $("currentTuning").value = JSON.stringify(currentParameterIndices);
        updateImage();
    };
    for (var p in parameters) {
        var label = document.createElement("label");
        label.innerHTML = p;
        $("ui").appendChild(label);

        var range = document.createElement("input");
        range.type = "range";
        range.id = p
        range.min = 0;
        range.value = 0;
        range.max = parameters[p].length - 1;
        range.className = "val2";
        range.type = "range";
        range.addEventListener("change", onChange);
        $("ui").appendChild(range);

        var text = document.createElement("input");        
        text.id = p + "Val";
        text.value = parameters[p][range.value];
        text.className = "val2";
        text.type = "text";
        $("ui").appendChild(text);

        currentParameterIndices[p] = 0;
    }
    $("currentTuning").value = JSON.stringify(currentParameterIndices);
    
    $("saveTuning").addEventListener("click", function () {
        var value = JSON.stringify(currentParameterIndices);
        var name = $V("tuningName");
        addOption($("bestTuning"), value, name);
    });
    $("bestTuning").addEventListener("change", function () {
        currentParameterIndices = JSON.parse(this.value);
        for (var p in parameters) {
            $(p).value = parseInt(currentParameterIndices[p]);
            $V(p + "Val", parameters[p][currentParameterIndices[p]]);
        }
        updateImage();
    });
};


window.onload = function () {
    "use strict";
    var inputs = document.getElementsByTagName('input');
    var focus = function () {
        this.focus();
    };
    var i;
    for (i = 0; i < inputs.length; i++) {
        if (inputs[i].type == 'range') {
            inputs[i].addEventListener('click', focus);
        }
    }
    for (var p in parameters) {

    }
    var callbackInit = function (evt) {
    };
    var callback = function (evt, type) {
    };
    var outputCanvas = $("outputImage");
    SC = new SuperCanvas(outputCanvas);
    var canvasXSize = outputCanvas.parentElement.offsetWidth;
    var canvasYSize = outputCanvas.parentElement.offsetHeight;
    outputCanvas.width = canvasXSize;
    outputCanvas.height = canvasYSize;
    var canvasXSize = outputCanvas.parentElement.offsetWidth;
    var canvasYSize = outputCanvas.parentElement.offsetHeight;
    outputCanvas.width = canvasXSize;
    outputCanvas.height = canvasYSize;
    initParameters();
    updateImage();
};
