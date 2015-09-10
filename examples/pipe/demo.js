/*global console, document, Matrix, Colorspaces, CIE, open */
/*jshint indent: 4, unused: true, white: true */

var IMAGE, RAW, BUFFERS, MEASURES, SC;
var diagram = "xyY", addScatter = false;
var parameters = {
    'bp': 200,
    'awbScales': [1.8, 1.5],
    // IMX 135
    /*'colorMatrix': [
        1.993689, -0.151371, -0.023086,
       -1.152317,  1.359525, -0.796688,
        0.158628, -0.208153,  1.819774
    ],*/
    // sRGB
    /*'colorMatrix': [
        1.514050, -0.361103, -0.152946, 
       -0.385799,  1.881091, -0.495292, 
       -0.051240, -0.625889,  1.677129
     ],*/
    // Ambarella D65 official
    'colorMatrix': [
        1.6326, -0.3223, -0.0356, 
       -0.3665,	 1.6866, -0.5566, 
       -0.2661, -0.3643,  1.5921
    ],
    // Ambarella D65 ownfit
    /*'colorMatrix': [
         1.658619, -0.446258, -0.113345, 
        -0.442214,  2.136863, -0.829164, 
        -0.216405, -0.690605,  1.942510
    ],*/
    'saturation': 0.8,
    'gain': 1.0
};

function updateOutput(image, noinit, buffer) {
    "use strict";
    Tools.tic();
    SC.setImageBuffer(image, buffer);
    SC.displayImageBuffer(buffer, noinit);
    console.log("Image displayed in", Tools.toc(), "ms");
    // drawImageHistogram("histogram", image);
}

var develop = function () {
    if (!RAW) {
        return;
    }
    Tools.tic();
    IMAGE = processRaw(RAW.getCopy());
    console.log("Image processed in", Tools.toc(), "ms");
    updateOutput(IMAGE, true, SC.currentBuffer);
};

var initParameters = function () {
    var changeParameters = function () {
        parameters.bp = $F("bpVal");
        parameters.awbScales = Matrix.dlmread($V("awbScalesVal")).getData();
        parameters.colorMatrix = eval($V('colorMatrixVal'));
        parameters.saturation = $F("saturationVal");
        parameters.gain =  $F("gainVal");
    };
    $V("bpVal", parameters.bp);
    $V("awbScalesVal", parameters.awbScales[0].toFixed(4) + ", " + parameters.awbScales[1].toFixed(4));
    $V("saturationVal", parameters.saturation);
    $V("colorMatrixVal", "[" + parameters.colorMatrix.toString() + "]");
    $V("gainVal", parameters.gain);

    $("bpVal").addEventListener("change", changeParameters);
    $("awbScalesVal").addEventListener("change", changeParameters);
    $("saturationVal").addEventListener("change", changeParameters);
    $("colorMatrixVal").addEventListener("change", changeParameters);
    $("gainVal").addEventListener("change", changeParameters);
    $("develop").addEventListener("click", develop);
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


var initPlot = function () {
    'use strict';

    var plotProperties = {
        'ticks-display': false,
        'preserve-ratio': true
    };
    var plot = new Plot('plotSVG', [$('plot').clientWidth - 20, $('plot').clientHeight - 20], 'plot', plotProperties);
    plot.addChromaticityDiagram(diagram).setXLabel().setYLabel().setTitle();
    plot.remove("Standards illuminants");
    plot.remove("Spectrum locus");
};

var initSuperCanvas = function () {
    'use strict';
    function plotScatter(x1, y1, x2, y2) {
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
    
    SC = new SuperCanvas(document.body);
    SC.imageSmoothing(false);

    SC.selectArea = function (start, end) {
        var x1 = start[0], y1 = start[1], x2 = end[0], y2 = end[1];
        var m = Math.min, M = Math.max, r = Math.round;
        console.log(IMAGE);
        y1 = M(m(y1, y2), 0);
        y2 = m(M(y1, y2), IMAGE.getSize(0) - 1);
        x1 = M(m(x1, x2), 0);
        x2 = m(M(x2, x2), IMAGE.getSize(1) - 1);
        if (RAW instanceof Matrix) {
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
            var option = addOption($("measures"), MEASURES.length - 1, MEASURES.length - 1);
            option.selected = true;
            setMeasure();
            console.log("Measure done !");
        }
        plotScatter(x1, y1, x2, y2);
        if ($V("Shift+click") === "wb") {
            parameters.awbScales = scales;
            $V("awbScalesVal", parameters.awbScales[0].toFixed(4) + ", " + parameters.awbScales[1].toFixed(4));
        }
    };
};
var setMeasure = function (n) {
    var m = MEASURES[$("measures").value];
    var channel = $("channelMeasures").value;
    if (channel !== "All") {
        channel = {Gr: 0, R: 1, B: 2, Gb: 3, All: 4}[channel];
        $V("meanVal", m.mean[channel].toFixed(4));
        $V("stdVal", m.std[channel].toFixed(4));
        $V("minVal", m.min[channel]);
        $V("maxVal", m.max[channel]);
    } else {
    }
};
    
window.onload = function () {
    "use strict";
    initInputs();
    initSuperCanvas();
    initPlot();
    initParameters();
   
    $("buffers").addEventListener("change", function () {
        SC.currentBuffer = $I("buffers");
        SC.update();
    });
    
    $("resetView").addEventListener("click", function () {
        SC.displayImageBuffer(undefined, false);
    });
    
   
    $("zoomFactor").addEventListener("click", function () {
        var coord = [SC.canvas.width / 2, SC.canvas.height / 2], scale = parseInt(this.value);
        SC.translate(-coord[0], -coord[1]);
        var currentScaleFactor = SC.matrix.diag().display().getData();
        SC.zoom(scale / currentScaleFactor[0], scale / currentScaleFactor[1]);
        SC.translate(coord[0], coord[1]);
        SC.update();
    });
    
    var callbackInit = function (evt) {
        BUFFERS = BUFFERS || [];
    };
    
    $("resetBuffers").addEventListener("click", function () {
        SC.images = [];
        SC.currentBuffer = 0;
        SC.update();
        BUFFERS = [];
        $("buffers").innerHTML = "";
    });
    
    $("resetMeasures").addEventListener("click", function () {
        MEASURES = [];
        $("measures").innerHTML = "";
    });

    $("measures").addEventListener("change", setMeasure);
    $("channelMeasures").addEventListener("change", setMeasure);

    var callback = function (evt, type, file) {
        if (type === "bin") {
            Tools.tic();
            RAW = readRAW(this).double();
            BUFFERS.push(RAW);
            console.log("RAW of size", RAW.size(), "read in", Tools.toc(), "ms");
            MEASURES = [];
            Tools.tic();
            IMAGE = processRaw(RAW.getCopy());
            console.log("Image processed in", Tools.toc(), "ms");
        } else if (type === "url") {
            Tools.tic();
            var image = new Image();
            image.src = this;
            Matrix.imread(image, function () {
                var image = this.im2double();
                IMAGE = image;
                BUFFERS.push(IMAGE);
                console.log("Image processed in", Tools.toc(), "ms");
            });
        } else {
            return;
        }
        var option = addOption($("buffers"), SC.images.length, file.name);
        option.selected = true;
        updateOutput(IMAGE);
    };
    initFileUpload("loadFile", callback, callbackInit);

    setElementOpacity("ui", 0.2, 1);
    setElementOpacity("plot", 0.0, 1);
};
