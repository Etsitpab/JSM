/*global console, document, Matrix, Colorspaces, CIE, open */
/*jshint indent: 4, unused: true, white: true */

var IMAGE, RAW, MEASURES, SC;

function displayImage(image) {
    'use strict';
    var imagePlot = $('imagePlot').getPlot().clear();
    Tools.tic();
    image.toImage(function () {
        imagePlot.addImage(this, 0, 0, {id: 'workingImage'});
        console.log("Image displayed in", Tools.toc(), "ms");
    }, 'image/jpeg', 0.7);
    drawImageHistogram("histogram", image);
}

function updateOutput(image) {
    "use strict";
    Tools.tic();
    SC.setImage(image);
    console.log("Image displayed in", Tools.toc(), "ms");
    // drawImageHistogram("histogram", image);
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
        'uint16', 'int16',
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
    console.log("type:", type, infos[3]);
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

Matrix.prototype.applySRGBGamma = function (resolution) {
    var lut = new Float64Array(resolution);
    var a = 0.055, I2D4 = 1 / 2.4, v, ires = 1 / resolution;
    for (var i = 0; i < resolution; i++) {
        v = i * ires;
        lut[i] = (v > 0.0031308) ? (1.055 * Math.pow(v, I2D4) - a) : (v * 12.92);
    }
    var data = this.getData(), dLength = data.length;
    for (var i = 0; i < dLength; i++) {
        v = Math.floor(data[i] * resolution);
        if (v > 0 && v < resolution) {
            data[i] = lut[v];
        }
    }
    return this;
};

var parameters = {
    'bp': 200,
    'awbScales': [1.8, 1.5],
    'colorMatrix': [1.82421875, -0.10546875, 0.009765625, -0.978515625, 1.283203125, -0.658203125, 0.154296875, -0.17578125, 1.6484375]
    // 'colorMatrix': [2.52773308,  0.25255637, 0.456801887, -1.187522717, 1.282750378, -1.717001308, 0.531574993,  0.29519138, 3.1736645]
    //'colorMatrix': [1.50040757, -1.09400685, -0.821907892, 2.4726743960199724, 5.5861898074911025, 3.980233823833764, -1.6973025709652312, -1.7503258349248325, -0.7896378620413816]
    // 'colorMatrix': [2.873079181990579, -2.259509600516003, -1.4947969746811658, 3.8773990971906374, 9.980523004501183, 6.644431507344027, -3.8417120823170383, -3.851354503867207, -2.0165997425226587]
    // 'colorMatrix': [2.6188478147662946, -0.3490482043425507, 0.6491755198871962, -0.6053859282024999, 2.6462704898824474, -3.2805723249583476, 0.5764082596919458, 0.5250529842158762, 5.330607239358602]
    // 'colorMatrix':[2.4845042444757817, -0.4321723102360087, 0.6278390282791709, -0.6056796601790841, 2.6198328547568783, -3.331207796322422, 0.5048008807512255, 0.39041046281402697, 5.08720600257353]
    //'colorMatrix':[1.8822833041294111, -0.757891263314495, -0.30761510659279917, 1.4334357463628882, 4.283124157908033, 2.4312801936179476, -0.8423291580634884, -0.9042177794394357, 0.006550670018218689]
};

var changeParameters = function () {
    parameters.bp = $F("bpVal");
    parameters.awbScales = Matrix.dlmread($V("awbScalesVal")).getData();
};

var initParameters = function () {
    $V("bpVal", parameters.bp);
    $V("awbScalesVal", parameters.awbScales[0].toFixed(4) + ", " + parameters.awbScales[1].toFixed(4));
    $("bpVal").addEventListener("change", changeParameters);
    $("awbScalesVal").addEventListener("change", changeParameters);
    $("scaleBVal").addEventListener("change", changeParameters);
    $("develop").addEventListener("click", develop);
};

var processRaw = function (RAW) {
    Tools.tic();
    var bp = parameters.bp, max = RAW.max().getDataScalar() - bp;
    IMAGE = RAW.blackPoint(bp, bp, bp, bp, max);
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
        parameters.awbScales[0], 0.00,                    0.00,
        0.00,                    1.00,                    0.00,
        0.00,                    0.00, parameters.awbScales[1]
    ]).reshape(3, 3);
    var CM = Matrix.toMatrix(parameters.colorMatrix).reshape(3, 3);
    IMAGE.applycform(CM.mtimes(WB));
    console.log("Color Matrix applied in", Tools.toc(), "ms");
    
    
    Tools.tic();
    IMAGE.applySRGBGamma(4096);
    console.log("sRGB tone curve applied in", Tools.toc(), "ms");
    
    // Tools.tic();
    // IMAGE = IMAGE.colorEnhancement(0.5, 15, 10, "sym4", 0.1)
    // console.log("Wavelet enhancement applied in", Tools.toc(), "ms");
    
    return IMAGE;
};

var develop = function () {
    Tools.tic();
    IMAGE = processRaw(RAW.getCopy());
    console.log("Image processed in", Tools.toc(), "ms");
    updateOutput(IMAGE);
    // displayImage(IMAGE);
};

var wbTuningFromMeasures = function () {
    var p01 = MEASURES[0].scales,
        p02 = MEASURES[1].scales,
        p03 = MEASURES[2].scales,
        p04 = MEASURES[3].scales,
        p04 = MEASURES[3].scales,
        p15 = MEASURES[14].scales,
        p16 = MEASURES[15].scales,
        p21 = MEASURES[20].scales,
        p22 = MEASURES[21].scales;

    var gretag = []
    var concat = function(v, i, t) {
        gretag = gretag.concat(Array.prototype.slice.call(t[i].mean));
    };
    MEASURES.forEach(concat);
    return {
        grey: [
            0.5 * p21[0] + 0.5 * p22[0],
            0.5 * p21[1] + 0.5 * p22[1]
        ],
        skin: [
            0.5 * p01[0] + 0.5 * p02[0],
            0.5 * p01[1] + 0.5 * p02[1]
        ],
        green: [
            0.09 * p03[0] + 0.74 * p04[0] + 0.12 * p16[0] + 0.05 * p21[0],
            0.09 * p03[1] + 0.74 * p04[1] + 0.12 * p16[1] + 0.05 * p21[1]
        ],
        blue: [
            0.59 * p03[0] + 0.06 * p04[0] + 0.06 * p15[0] + 0.29 * p21[0],
            0.59 * p03[1] + 0.06 * p04[1] + 0.06 * p15[1] + 0.29 * p21[1]
        ],
        gretag: gretag
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

    var createPlot = function () {
        var plotProperties = {
            'ticks-display': false,
            'preserve-ratio': true
        };
        window.imagePlot = new Plot('imagePlot', [$('image').clientWidth, $('image').clientHeight], 'image', plotProperties);
        imagePlot.selectarea = function (x1, y1, x2, y2) {
            var m = Math.min, M = Math.max, r = Math.round;
            var Y1 = r(M(m(-y1, -y2), 0) / 2);
            var Y2 = r(m(M(-y1, -y2), IMAGE.getSize(0) - 1) / 2);
            var X1 = r(M(m(x1, x2), 0) / 2);
            var X2 = r(m(M(x2, x2), IMAGE.getSize(1) - 1) / 2);
            var patch = RAW.get([Y1, Y2], [X1, X2]);
            patch.reshape([patch.size(0) * patch.size(1), patch.size(2)]);
            var pMean = patch.mean(0),
                pStd = patch.std(0),
                pMin = patch.min(0),
                pMax = patch.max(0);
            var wp = pMean['-'](parameters.bp).getData();
            var G = (wp[0] + wp[
3]) * 0.5;
            var scales = [G / wp[1], G / wp[2]];
            MEASURES.push({
                "patch": patch,
                "mean": pMean.getData(),
                "std": pStd.getData(),
                "min": pMin.getData(),
                "max": pMax.getData(),
                "scales": scales
            });
            if ($V("Shift+click") === "wb") {
                parameters.awbScales = scales;
                $V("awbScalesVal", parameters.awbScales[0].toFixed(4) + ", " + parameters.awbScales[1].toFixed(4));
                develop();            
            }
        };
        imagePlot.click = function () {
        };
    };
    // createPlot();
    var read = function (evt) {
        var callback = function (evt) {
            Tools.tic();
            RAW = readRAW(this).double();
            console.log("RAW of size", RAW.size(), "read in", Tools.toc(), "ms");
            MEASURES = [];
            develop();
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

    var outputCanvas = $("outputImage");
    SC = new SuperCanvas(outputCanvas);
    var div = $("image");
    var canvasXSize = div.offsetWidth;
    var canvasYSize = div.offsetHeight;
    outputCanvas.width = canvasXSize;
    outputCanvas.height = canvasYSize;
    initParameters();
    // hideFieldset();
};
