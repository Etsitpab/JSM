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

var readRAW = function (RAW) {
    'use strict';
    var tab2char = function (tab) {
        var str  = '';
        for (var i = 0; i < tab.length; i++) {
            str += String.fromCharCode(tab[i]);
        }
        return str;
    };
    var title = tab2char(new Uint8Array(RAW, 0, 4));
    var hint = tab2char(new Uint8Array(RAW, 4, 16));
    var infos = new Uint32Array(RAW, 20, 6);
    var padding = tab2char(new Uint32Array(RAW, 44, 20));
    var types = [
        null, null,
        'uint8', 'int8',
        'uint16', 'int16', 'uint32', 'int32',
        null, null, null, null, null,
        'single', 'double',
        null
    ];
    var w = infos[0], h = infos[1], c = infos[4],
        prec = infos[2], type = types[infos[3]];
    
    console.log(title);
    console.log(hint);
    console.log("width:", w);
    console.log("height:", h);
    console.log("prec:", prec);
    console.log("type:", type);
    console.log("nChannels:", c);
    console.log(padding);
    var constructor = Tools.checkType(type);
    var data = new constructor(RAW, 64);
    var im = new Matrix([w, h, c], data).permute([1, 0, 2]);
    window.im = im;
    return im;
};

var readFile = function (file, callback, type) {
    // Deal with arguments
    type = type.toLowerCase();

    // File handling functions
    var reader = new FileReader();
    reader.onload = function (evt) {
        callback = callback.bind(evt.target.result);
        callback(evt);
    };
    console.log(type);
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
            Tools.tic();
            IMAGE = readRAW(this);
            console.log("RAW of size", IMAGE.size(), "read in", Tools.toc(), "ms");
            Tools.tic();
            IMAGE = IMAGE.get([], [], 1).cat(
                2,
                IMAGE.get([], [], 0)["+="](IMAGE.get([], [], 3))["/="](2),
                IMAGE.get([], [], 2)
            ).im2double();
            IMAGE["/="](IMAGE.max());
            console.log("RAW demosaiced in", Tools.toc(), "ms");
            console.log(IMAGE.size());
            updateOutput(IMAGE);
        };

        // Only call the handler if 1 or more files was dropped.
        if (this.files.length) {
            var i;
            for (i = 0; i < this.files.length; i++) {
                readFile(this.files[i], callback, "bin");
            }
        }

    };
    $("loadFile").addEventListener("change", read, false);

    hideFieldset();
};

