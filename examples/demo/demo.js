/*global console, document, Matrix, Colorspaces, CIE, open */
/*jshint indent: 4, unused: true, white: true */

var IMAGE;
var $ = function (id) {
    return document.getElementById(id);
};

function updateOutput(image) {
    "use strict";
    var outputCanvas = $("outputImage");
    var div = $("image");
    var canvasXSize = div.offsetWidth;
    var canvasYSize = div.offsetHeight;
    outputCanvas.width = canvasXSize;
    outputCanvas.height = canvasYSize;
    image.imshow(outputCanvas, "fit");
    outputCanvas.style.marginTop = (div.offsetHeight - outputCanvas.height) / 2;
}

function hideFieldset() {
    "use strict";
    var i, ei;
    var legends = document.getElementsByTagName("legend");

    var hide = function () {
        var toHide = this.childNodes;
        for (i = 0, ei = toHide.length; i < ei; i++) {
            if (toHide[i].tagName !== "LEGEND" && toHide[i].style) {
                toHide[i].style.display = "none";
            }
        }
    };
    var show = function () {
        var toHide = this.childNodes;
        for (i = 0, ei = toHide.length; i < ei; i++) {
            if (toHide[i].tagName !== "LEGEND" && toHide[i].style) {
                toHide[i].style.display = "";
            }
        }
    };
    var hideAll = function () {
        var i, ei;
        for (i = 0, ei = legends.length; i < ei; i++) {
            hide.bind(legends[i].parentNode)();
        }
    };
    hideAll();

    var f = function () {
        hideAll();
        show.bind(this.parentNode)();
    };

    for (i = 0, ei = legends.length; i < ei; i++) {
        legends[i].addEventListener("click", f);
    }
}

var readFile = function (file, callback, type) {
    // Deal with arguments
    type = type.toLowerCase();

    // File handling functions
    var reader = new FileReader();
    reader.onload = function (evt) {
        callback = callback.bind(evt.target.result);
        callback(evt);
    };

    switch (type) {
    case 'dataurl':
    case 'url':
        reader.readAsDataURL(file);
        break;
    case 'text':
    case 'txt':
        reader.readAsText(file);
        break;
    case 'arraybuffer':
    case 'binary':
    case 'bin':
        reader.readAsArrayBuffer(file);
        break;
    default:
        throw new Error("readFile: unknown type " + type + ".");
    }
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
    var read = function (evt) {

        var callback = function (evt) {
            var onread = function () {
                IMAGE = this.im2double();
                updateOutput(IMAGE);
            };
            Matrix.imread(this, onread);
        };

        // Only call the handler if 1 or more files was dropped.
        if (this.files.length) {
            var i;
            for (i = 0; i < this.files.length; i++) {
                readFile(this.files[i], callback, "url");
            }
        }

    };
    $("loadFile").addEventListener("change", read, false);

    hideFieldset();
};

