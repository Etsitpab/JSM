/*global console, document, Matrix, Colorspaces, CIE, open */
/*jshint indent: 4, unused: true, white: true */

var IMAGE;
var $ = function (id) {
    return document.getElementById(id);
};

function displayImage(image) {
    'use strict';

    // image = limitImageSize(image, MAX_SIZE);
    // imgOrig = image.im2double();
    // imgCurrent = image.im2double();

    
    var imagePlot = $('imagePlot').getPlot().clear();
    image.toImage(function () {
        imagePlot.addImage(this, 0, 0, {id: 'workingImage'});
    });
}

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

Matrix.prototype.demosaic = function () {
    var size = this.size();
    var ni = size[0], nj = size[1],
        ny = ni * 2, nx = nj * 2;
    var demosaiced = Matrix.zeros(size[0] * 2, size[1] * 2, 3);
    
    var Gr = this.get([], [], 0),
        R  = this.get([], [], 1),
        B  = this.get([], [], 2),
        Gb = this.get([], [], 3);
    var out = Matrix.zeros(ny, nx, 3), od = out.getData();
    
    // R Channel
    var ox = 0, oy = 1;
    var i, j, _j, ij, _je, ije, y, x, _x, yx;
    for (_j = 0, _x = ox * ny, _je = ni * nj; _j < _je; _j += ni, _x += ny) {
        for (ij = _j, yx = _x, ije = _j + ny; ij < ije; ij++, yx += 2) {
            
        }                
    }
    // NN Demosaicing
    demosaiced.set([0, 2, -1], [0, 2, -1], 1, Gr);
    demosaiced.set([1, 2, -1], [0, 2, -1], 1, Gr);
    demosaiced.set([0, 2, -1], [1, 2, -1], 1, Gb);
    demosaiced.set([1, 2, -1], [1, 2, -1], 1, Gb);
    
    demosaiced.set([0, 2, -1], [0, 2, -1], 0, R);
    demosaiced.set([1, 2, -1], [0, 2, -1], 0, R);
    demosaiced.set([0, 2, -1], [1, 2, -1], 0, R);
    demosaiced.set([1, 2, -1], [1, 2, -1], 0, R);
    
    demosaiced.set([0, 2, -1], [0, 2, -1], 2, B);
    demosaiced.set([1, 2, -1], [0, 2, -1], 2, B);
    demosaiced.set([0, 2, -1], [1, 2, -1], 2, B);
    demosaiced.set([1, 2, -1], [1, 2, -1], 2, B);
    return demosaiced;
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

    var createPlot = function () {
        var plotProperties = {
            'ticks-display': false,
            'preserve-ratio': true
        };
        window.imagePlot = new Plot('imagePlot', [$('image').clientWidth, $('image').clientHeight], 'image', plotProperties);
    };
    createPlot();
    var read = function (evt) {
        var callback = function (evt) {
            Tools.tic();
            IMAGE = readRAW(this);
            console.log("RAW of size", IMAGE.size(), "read in", Tools.toc(), "ms");
            Tools.tic();
            var size = IMAGE.size();
            var ni = size[0], nj = size[1],
                ny = ni * 2, nx = nj * 2;
            var demosaiced = Matrix.zeros(size[0] * 2, size[1] * 2, 3);
            var Gr = IMAGE.get([], [], 0), grd = Gr.getData(),
                R  = IMAGE.get([], [], 1), rd = Gr.getData(),
                B  = IMAGE.get([], [], 2), bd = Gr.getData(),
                Gb = IMAGE.get([], [], 3), gbd = Gr.getData();

            // Base
            // demosaiced.set([0, 2, -1], [0, 2, -1], 1, Gr);
            // demosaiced.set([0, 2, -1], [1, 2, -1], 0, R);
            // demosaiced.set([1, 2, -1], [0, 2, -1], 2, B);
            // demosaiced.set([1, 2, -1], [1, 2, -1], 1, Gb);

            // NN Demosaicing
            demosaiced.set([0, 2, -1], [0, 2, -1], 1, Gr);
            demosaiced.set([1, 2, -1], [0, 2, -1], 1, Gr);
            demosaiced.set([0, 2, -1], [1, 2, -1], 1, Gb);
            demosaiced.set([1, 2, -1], [1, 2, -1], 1, Gb);

            demosaiced.set([0, 2, -1], [0, 2, -1], 0, R);
            demosaiced.set([1, 2, -1], [0, 2, -1], 0, R);
            demosaiced.set([0, 2, -1], [1, 2, -1], 0, R);
            demosaiced.set([1, 2, -1], [1, 2, -1], 0, R);

            demosaiced.set([0, 2, -1], [0, 2, -1], 2, B);
            demosaiced.set([1, 2, -1], [0, 2, -1], 2, B);
            demosaiced.set([0, 2, -1], [1, 2, -1], 2, B);
            demosaiced.set([1, 2, -1], [1, 2, -1], 2, B);
            
            IMAGE = demosaiced;
            // Simplest way;
            /* 
            IMAGE = IMAGE.get([], [], 1).cat(
                2,
                IMAGE.get([], [], 0)["+="](IMAGE.get([], [], 3))["/="](2),
                IMAGE.get([], [], 2)
            ).im2double();
             */
            var max = IMAGE.max().display(),
                min = IMAGE.min().display();
            IMAGE["-="](min)["/="](max["-"](min));
            var max = IMAGE.max().display(),
                min = IMAGE.min().display();
            var CM = Matrix.toMatrix([
                1.993689, -1.152317, 0.158628,
               -0.151371, 1.359525, -0.208153,
               -0.023086, -0.796688, 1.819774
            ]).reshape(3, 3).transpose();
            var CM2 = Matrix.toMatrix([
                1,    0, 0,
                0, 0.66, 0,
                0,    0, 1
            ]).reshape(3, 3)
            
            IMAGE.applycform(CM.mtimes(CM2));
            console.log("RAW demosaiced in", Tools.toc(), "ms");
            console.log(IMAGE.size());
            IMAGE = IMAGE.get([350, -2200], [1650, -1650]);
            // updateOutput(IMAGE);
            displayImage(IMAGE);
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
