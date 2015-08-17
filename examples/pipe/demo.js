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
    var size = this.size(), ni = size[0], nj = size[1];

    var id = this.getData(),
        Gr = id.subarray(0, ni * nj),
        R  = id.subarray(ni * nj, 2 * ni * nj),
        B  = id.subarray(2 * ni * nj, 3 * ni * nj),
        Gb = id.subarray(3 * ni * nj, 4 * ni * nj);

    var ny = ni * 2,  nx = nj * 2,
        out = Matrix.zeros(ny, nx, 3), od = out.getData(),
        Ro = od.subarray(0, ny * nx),
        Go = od.subarray(ny * nx, 2 * ny * nx),
        Bo = od.subarray(2 * ny * nx, 3 * ny * nx);

    var i, j, _j, ij, _je, ije, y, x, _x, yx;
    for (_j = ni, _x = ny * 2, _je = ni * nj - ni; _j < _je; _j += ni, _x += (ny * 2)) {
        for (ij = _j + 1, yx = _x + 2, ije = _j + ni - 1; ij < ije; ij++, yx += 2) {
            var g0 = Gr[ij], g3 = Gb[ij]; 
            Go[yx] = g0;
            Go[yx + 1] = 0.25 * (g0 + g3 + Gr[ij + 1] + Gb[ij - ni]);
            Go[yx + ny] = 0.25 * (g0 + g3 + Gr[ij + ni] + Gb[ij - 1]);
            Go[yx + ny + 1] = g3;
            var r2 = R[ij];
            Ro[yx] = 0.5 * (r2 + R[ij - ni]);
            Ro[yx + 1] = 0.25 * (r2 + R[ij - ni + 1] + R[ij - ni] + R[ij + 1]);
            Ro[yx + ny] = r2;
            Ro[yx + ny + 1] = 0.5 * (r2 + R[ij + 1]);
            var b1 = B[ij]
            Bo[yx] = 0.5 * (b1 + B[ij - 1]);
            Bo[yx + 1] = b1
            Bo[yx + ny] = 0.25 * (b1 + B[ij + ni - 1] + B[ij + ni] + B[ij - 1]);
            Bo[yx + ny + 1] = 0.5 * (b1 + B[ij + ni]);
        }                
    }
    return out;
};

Matrix.prototype.demosaicTrivial = function () {
    var size = this.size();
    var ni = size[0], nj = size[1],
        ny = ni, nx = nj;
    var Gr = this.get([], [], 0),
        R  = this.get([], [], 1),
        B  = this.get([], [], 2),
        Gb = this.get([], [], 3);
    var out = Matrix.zeros(ny, nx, 3);
    out.set([], [], 1, Gr['+'](Gb)['/='](2));
    out.set([], [], 0, R);
    out.set([], [], 2, B);
    return out;
};

Matrix.prototype.blackPoint = function (Grm, Rm, Bm, Gbm, max) {
    var size = this.size(), ni = size[0], nj = size[1];
    var id = this.getData(),
        Gr = id.subarray(0 * ni * nj, 1 * ni * nj),
        R  = id.subarray(1 * ni * nj, 2 * ni * nj),
        B  = id.subarray(2 * ni * nj, 3 * ni * nj),
        Gb = id.subarray(3 * ni * nj, 4 * ni * nj);
    var imax = 1 / max;
    for (var i = 0, ei = Gr.length; i < ei; i++) {
        Gr[i] = Gr[i] < Grm ? 0 : (Gr[i] - Grm) * imax;
        R[i] = R[i] < Rm ? 0 : (R[i] - Rm) * imax;
        B[i] = B[i] < Bm ? 0 : (B[i] - Bm) * imax;
        Gb[i] = Gb[i] < Gbm ? 0 : (Gb[i] - Gbm) * imax;
    }
    return this;
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
            IMAGE = readRAW(this).double();
            console.log("RAW of size", IMAGE.size(), "read in", Tools.toc(), "ms");
            Tools.tic();
            {
                Tools.tic();
                var bp = 135, max = IMAGE.max().getDataScalar() - bp;
                IMAGE.blackPoint(bp, bp, bp, bp, max);
                console.log("Black point removed in", Tools.toc(), "ms");
                
                Tools.tic();
                // IMAGE = IMAGE.demosaicTrivial();
                IMAGE = IMAGE.demosaic();
                console.log("RAW demosaiced in", Tools.toc(), "ms");
                
                // Tools.tic();
                // IMAGE = IMAGE.sqrt().imbilateral(3, 0.0001, 3).power(2);
                // console.log("Bilateral denoising applied in", Tools.toc(), "ms");
                
                // Tools.tic();
                // IMAGE = IMAGE.sqrt().wdenoise(0.025, 'sym4').power(2);
                // console.log("Wavelet denoising applied in", Tools.toc(), "ms");
                
                Tools.tic();
                var WB = Matrix.toMatrix([
                    1.50, 0.00, 0.00,
                    0.00, 1.00, 0.00,
                    0.00, 0.00, 1.50
                ]).reshape(3, 3);
                var CM = Matrix.toMatrix([
                    1.993689, -1.152317,  0.158628,
                   -0.151371,  1.359525, -0.208153,
                   -0.023086, -0.796688,  1.819774
                ]).reshape(3, 3).transpose();
                IMAGE.applycform(WB);
                // IMAGE.applycform(WB.mtimes(CM));
                console.log("Color Matrix applied in", Tools.toc(), "ms");
                
                
                Tools.tic();
                // IMAGE.applycform('LinearRGB to sRGB');
                // IMAGE = IMAGE['.^'](0.42);
                IMAGE = IMAGE.sqrt();
                console.log("sRGB tone curve applied in", Tools.toc(), "ms");
            }
            console.log("Image processed in", Tools.toc(), "ms");
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
