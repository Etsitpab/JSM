/*global console, document, Matrix, Colorspaces, CIE, open */
/*jshint indent: 4, unused: true, white: true */

var IMAGE, RAW, BUFFERS, MEASURES, SC;
var diagram = "xyY", addScatter = false;

function updateOutput(image, noinit, buffer) {
    "use strict";
    Tools.tic();
    SC.setImageBuffer(image, buffer);
    SC.displayImageBuffer(buffer, noinit);
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
    console.log("type:", type);
    console.log("nChannels:", c);
    console.log(padding);
    var constructor = Tools.checkType(type);
    var data = new constructor(RAW, 64);
    var im = new Matrix([w, h, c], data).permute([1, 0, 2]);
    window.im = im;
    return im;
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
    /* // IMX 135
    'colorMatrix': [
        1.993689, -0.151371, -0.023086,
       -1.152317,  1.359525, -0.796688,
        0.158628, -0.208153,  1.819774
    ], // sRGB
    'colorMatrix': [
        1.325756, -0.256835,  0.013652,
       -0.300399,  1.483152, -0.591961,
       -0.175381, -0.348768,  1.452619
     ],*/
    // sRGB v2
    'colorMatrix': [
        1.389051, -0.323627, -0.023491,
       -0.352992,  1.585821, -0.613056,
       -0.180360, -0.376975,  1.519571
    ],
    // Ambarella
    /*'colorMatrix': [
        1.605270, -0.246497, -0.011966,
       -0.379197,  1.752761, -0.677406,
       -0.323313, -0.575602,  1.656377
    ],*/
    /*'colorMatrix': [
        1.704094, -0.379028, -0.096490,
       -0.518158,  1.768472, -0.841104,
       -0.283853, -0.456980,  1.907634
     ],*/
    // Ambarella even more saturated
    /*'colorMatrix': [
        1.734368, -0.425490, -0.081870,
       -0.528965,  1.858041, -0.754530,
       -0.308531, -0.506031,  1.798920
    ],*/
    'saturation': 1.0,
    'gain': 2.0
};

var changeParameters = function () {
    parameters.bp = $F("bpVal");
    parameters.awbScales = Matrix.dlmread($V("awbScalesVal")).getData();
    parameters.colorMatrix = eval($V('colorMatrixVal'));
    parameters.saturation = $F("saturationVal");
    parameters.gain =  $F("gainVal");
};

var initParameters = function () {
    $V("bpVal", parameters.bp);
    $V("awbScalesVal", parameters.awbScales[0].toFixed(4) + ", " + parameters.awbScales[1].toFixed(4));
    $V("saturationVal", parameters.saturation);
    $V("colorMatrixVal", "[" + parameters.colorMatrix.toString() + "]");
    $V("gainVal", parameters.gain);

    $("bpVal").addEventListener("change", changeParameters);
    $("awbScalesVal").addEventListener("change", changeParameters);
    $("scaleBVal").addEventListener("change", changeParameters);
    $("saturationVal").addEventListener("change", changeParameters);
    $("colorMatrixVal").addEventListener("change", changeParameters);
    $("gainVal").addEventListener("change", changeParameters);
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
    var O = Matrix.toMatrix([
        0.33, 0.34, 0.33,
        0.50, 0.00, -0.5,
            -0.25, 0.5, -0.25
    ]).reshape(3, 3).transpose();
    var s = 0, S = Matrix.toMatrix([
        1.00, 0.00, 0.00,
        0.00, parameters.saturation,  0.00,
        0.00, 0.00,  parameters.saturation
    ]).reshape(3, 3).transpose();
    S = O.inv().mtimes(S).mtimes(O);
    CM.display();
    IMAGE.applycform(S.mtimes(CM).mtimes(WB));
    max = IMAGE.max().display("MAX").times(1 / parameters.gain);
    IMAGE['/='](max);
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
    updateOutput(IMAGE, true, SC.currentBuffer);
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

function plotScatter(x1, y1, x2, y2) {
    'use strict';
    var min = Math.min, max = Math.max, round = Math.round;
    var Y1 = round(max(min(y1, y2), 0));
    var Y2 = round(min(max(y1, y2), IMAGE.getSize(0) - 1));
    var X1 = round(max(min(x1, x2), 0));
    var X2 = round(min(max(x2, x2), IMAGE.getSize(1) - 1));

    var subIm = IMAGE.get([Y1, 16, Y2], [X1, 16, X2]);

    var points = [
        subIm.get([], [], 0).getData(),
        subIm.get([], [], 1).getData(),
        subIm.get([], [], 2).getData()
    ];
    
    var p = $('plotSVG').getPlot();
    if (!addScatter) {
        while (p.remove('scatter')) {
	    // Do nothing
        }
    }
    p.addChromaticitiesFromRgb(points[0], points[1], points[2], {}, diagram, [0.3457, 0.3585, 1]);
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
    $("buffers").addEventListener(
        "change",
        function () {
            SC.currentBuffer = $I("buffers")
            SC.update();
        }
    );
    var callbackInit = function (evt) {
        SC.images = [];
        SC.currentBuffer = 0;
        BUFFERS = [];
    };
    var callback = function (evt, type) {
        if (type === "bin") {
            Tools.tic();
            RAW = readRAW(this).double();
            BUFFERS.push(RAW);
            console.log("RAW of size", RAW.size(), "read in", Tools.toc(), "ms");
            MEASURES = [];
            Tools.tic();
            IMAGE = processRaw(RAW.getCopy());
            console.log("Image processed in", Tools.toc(), "ms");
            addOption($("buffers"), SC.images.length, "Buffer " + SC.images.length);
            updateOutput(IMAGE);
        } else if (type === "url") {
            Tools.tic();
            // console.profile();
            IMAGE = new Image();
            IMAGE.src = this;
            IMAGE.onload = function () {
                console.log("Image processed in", Tools.toc(), "ms");
                addOption($("buffers"), SC.images.length, "Buffer " + SC.images.length);
                // console.profileEnd();
                updateOutput(IMAGE);
            };
        }
    };
    initFileUpload("loadFile", callback, callbackInit);

    SC = new SuperCanvas(document.body);
    
    SC.selectArea = function (start, end) {
        var x1 = start[0], y1 = start[1], x2 = end[0], y2 = end[1];
        var m = Math.min, M = Math.max, r = Math.round;
        y1 = M(m(y1, y2), 0);
        y2 = m(M(y1, y2), IMAGE.getSize(0) - 1);
        x1 = M(m(x1, x2), 0);
        x2 = m(M(x2, x2), IMAGE.getSize(1) - 1);
        var patch = RAW.get([r(y1 / 2), r(y2 / 2)], [r(x1 / 2), r(x2 / 2)]);
        patch.reshape([patch.size(0) * patch.size(1), patch.size(2)]);
        var pMean = patch.mean(0),
            pStd = patch.std(0),
            pMin = patch.min(0),
            pMax = patch.max(0);
        var wp = pMean['-'](parameters.bp).getData();
        var G = (wp[0] + wp[3]) * 0.5;
        var scales = [G / wp[1], G / wp[2]];
        MEASURES.push({
            "patch": patch,
            "mean": pMean.getData(),
            "std": pStd.getData(),
            "min": pMin.getData(),
            "max": pMax.getData(),
            "scales": scales,
            "coordinates": [x1, y1, x2, y2]
        });
        console.log("Measure done !");
        plotScatter(x1, y1, x2, y2);
        if ($V("Shift+click") === "wb") {
            parameters.awbScales = scales;
            $V("awbScalesVal", parameters.awbScales[0].toFixed(4) + ", " + parameters.awbScales[1].toFixed(4));
            develop();            
        }
    };
    var setElementOpacity = function (id, min, max) {
        $(id).style.opacity = min;
        $(id).addEventListener("mouseover", function () {
            this.style.opacity = max;
        });
        $(id).addEventListener("mouseout", function () {
            this.style.opacity = min;
        });

    };
    // setElementOpacity("ui", 0.2, 1);
    // setElementOpacity("plot", 0.0, 1);

    var plotProperties = {
        'ticks-display': false,
        'preserve-ratio': true
    };
    var plot = new Plot('plotSVG', [$('plot').clientWidth - 20, $('plot').clientHeight - 20], 'plot', plotProperties);
    plot.addChromaticityDiagram(diagram).setXLabel().setYLabel().setTitle();
    plot.remove("Standards illuminants");
    plot.remove("Spectrum locus");
    
    initParameters();
    $("resetView").addEventListener("click", function () {
        SC.displayImageBuffer(undefined, false);
    })
    // hideFieldsetx();
};
