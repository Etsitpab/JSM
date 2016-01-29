/*global console, document, Matrix, Colorspaces, CIE, open */
/*jshint indent: 4, unused: true, white: true */

var path = "mypath",
    imagePrefixes = [
        "image1",
        "image2",
        "image3",
        "image4"
    ],
    referenceImagesPath = "";

var IMAGES, SC;

var parameters = {
    'parameter1': ["0.7", "0.8", "0.9", "1.0", "1.1"],
    'parameter2': ["0.7", "0.8", "0.9", "1.0", "1.1"],
    'parameter3': ["0.2", "0.3", "0.4", "0.5", "0.6"],
    'parameter4': ["0.2", "0.3", "0.4", "0.5", "0.6"],
    'parameter5': ["0.5", "0.75", "1.0", "1.25", "1.5"]
};
var parameterNames = {
    'parameter1': "name1",
    'parameter2': "name2",
    'parameter3': "name3",
    'parameter4': "name4",
    'parameter5': "name5"
}

var currentParameterIndices = {};

function updateImage(name) {
    "use strict";
    if (typeof name !== "string") {
        name = path + $("imagePrefix").value;

        for (var p in parameters) {
            name += "_" + parameterNames[p] + parameters[p][currentParameterIndices[p]];
        }
        //name += "_0000.jpg";
        name += ".jpg";
    }
    console.log(name);
    var image = new Image();
    image.onload = function () {
        SC.displayImage(this, 0, SC.matrix === undefined ? true : false);
    };
    image.src = name;
    window.image = image;
    return;
}


var initParameters = function () {
    "use strict";
    for (var p in imagePrefixes) {
        addOption($("imagePrefix"), imagePrefixes[p], imagePrefixes[p]);
    }
    $("imagePrefix").addEventListener("change", updateImage);

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
        range.max = parameters[p].length - 1;
        range.value = Math.floor((parameters[p].length - 1) / 2);
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
        addOption($("bestTunings"), value, name);
    });
    $("bestTunings").addEventListener("change", function () {
        currentParameterIndices = JSON.parse(this.value);
        for (var p in parameters) {
            $(p).value = parseInt(currentParameterIndices[p]);
            $(p + "Val").value = parameters[p][currentParameterIndices[p]];
        }
        updateImage();
    });
    document.addEventListener("keydown", function (e) {
        if (e.keyCode === 82) {
            console.log("Down");
            updateImage(referenceImagesPath + $("imagePrefix").value + ".JPG");
        }
    });
    document.addEventListener("keyup", function (e) {
        if (e.keyCode === 82) {
            console.log("Up");
            updateImage();
        }
    });
};


window.onload = function () {
    "use strict";
    initInputs();
    initParameters();
    for (var p in parameters) {

    }
    var callbackInit = function (evt) {
    };
    var callback = function (evt, type) {
    };
    SC = new SuperCanvas(document.body);
};
