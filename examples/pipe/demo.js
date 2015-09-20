/*global console, document, Matrix, Colorspaces, CIE, open */
/*jshint indent: 4, unused: true, white: true */

(function () {
    "use strict";
    /** This function returns a Vandermonde Matrix corresponding to
    * to the provided vector.
    * @param {Matrix} x 
    * Vector used as basis to compute Vandermonde Matrix
    * @param {Integer} degree 
    * used to limit the size of the output.
    */
    Matrix.vander = function (x, degree) {
        if (!x.isvector()) {
            throw new Error("Matrix.vander: Input must be a vector.");
        }
        // Test if vector is provided
        var id = x.getData(), N = id.length;
        degree = degree === undefined ? N - 1 : degree;
        var out = Matrix.zeros(N, degree + 1), od = out.getData();
        for (var y = 0; y < N; y++) {
            var tmp = 1;
            for (var oxy = y + N * degree; oxy >= y; oxy -= N) {
                od[oxy] = tmp;
                tmp *= id[y];
            }
        }
        return out;
    };
    Matrix.prototype.vander = function (degree) {
        return Matrix.vander(this, degree);
    };
    
    Matrix.polyfit = function (x, y, degree) {
        // x = x["-"](x.mean())["./"](x.std());
        return x.vander(degree).mldivide(y);
    };

    Matrix.polyval = function (p, x) {
        x = Matrix.toMatrix(x);
        p = Matrix.toMatrix(p);
        if (!p.isvector()) {
            throw new Error("Matrix.polyval: Parameter \"p\" must be a vector.");
        }
        if (!x.isvector()) {
            throw new Error("Matrix.polyval: Parameter \"x\" must be a vector.");
        }
        return x.vander(p.numel() - 1).mtimes(p);
    };

    /*  
    for (var np = 1; np < 10; np++) {
        for (var i = 0; i < 10; i++) {
            var N = 10000 + Math.floor(Math.random() * 50)
            var p = Matrix.randi([-100, 100], np, 1);
            var x = Matrix.colon(1, N), y = Matrix.polyval(p, x);
            var pp = Matrix.polyfit(x, y, p.numel() - 1);
            console.log(N, np, p['-'](pp).abs().mean().getDataScalar());
        }
    }*/

})();

var IMAGE, RAW, BUFFERS, MEASURES = [], SC;
var diagram = "xyY", addScatter = false;
var parameters = {
    'bp': 212,
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
    drawImageHistogram("histogram", image);
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
    var plot = new Plot('plotSVG', [$('plot1').clientWidth - 20, $('plot1').clientHeight - 20], 'plot1', plotProperties);
    plot.addChromaticityDiagram(diagram).setXLabel().setYLabel().setTitle();
    plot.remove("Standards illuminants");
    plot.remove("Spectrum locus");

    var plot2 = new Plot('plotNoise', [$('plot2').clientWidth - 20, $('plot2').clientHeight - 20], 'plot2').setXLabel("Mean").setYLabel("Std.");
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
        plotNoise();
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

var plotNoise = function () {
    var p = $('plotNoise').getPlot().clear();
    if (MEASURES.length > 1) {
        var R = [], Gr = [], Gb = [], B = [];
        var concat = function(v, i, t) {
            Gr.push(t[i].mean[0], t[i].std[0]);
            R.push(t[i].mean[1], t[i].std[1]);
            B.push(t[i].mean[2], t[i].std[2]);
            Gb.push(t[i].mean[3], t[i].std[3]);
        };
        MEASURES.forEach(concat);
        Gr = Matrix.toMatrix(Gr).reshape(2, MEASURES.length).transpose();
        R = Matrix.toMatrix(R).reshape(2, MEASURES.length).transpose();
        B = Matrix.toMatrix(B).reshape(2, MEASURES.length).transpose();
        Gb = Matrix.toMatrix(Gb).reshape(2, MEASURES.length).transpose();
        var ALL = Gr.cat(0, R, B, Gb);
        var order;
        order = Gr.asort(0, 'ascend').get([], 0);
        Gr = Gr.get(order, []);
        order = R.asort(0, 'ascend').get([], 0);
        R = R.get(order, []);
        order = B.asort(0, 'ascend').get([], 0);
        B = B.get(order, []);
        order = Gb.asort(0, 'ascend').get([], 0);
        Gb = Gb.get(order, []);
        order = ALL.asort(0, 'ascend').get([], 0);
        ALL = ALL.get(order, []);
        //p.addPath(Gr.get([], 0).getData(), Gr.get([], 1).getData());
        // p.addPath(R.get([], 0).getData(), R.get([], 1).getData());
        // p.addPath(B.get([], 0).getData(), B.get([], 1).getData());
        // p.addPath(Gb.get([], 0).getData(), Gb.get([], 1).getData());
        var scatterProperties = {
            'stroke': 'none',
            'marker': {
                'shape': 'circle',
                'fill': 'red',
                'stroke': 'none',
            }
        };        
        p.addPath(ALL.get([], 0).getData(), ALL.get([], 1).getData(), scatterProperties);
        
        var coefs = Matrix.polyfit(ALL.get([], 0), ALL.get([], 1).power(2), 2);
        coefs.display();
        var fit = Matrix.polyval(coefs, ALL.get([], 0)).sqrt();
        if (MEASURES.length > 7) {
            p.addPath(ALL.get([], 0).getData(), fit.getData(), {'stroke': "black"});
        }
    }
};
window.onload = function () {
    "use strict";
    initInputs();
    initSuperCanvas();
    initPlot();
    initParameters();
    $S("ui", "top", 10);

    $("buffers").addEventListener("change", function () {
        SC.currentBuffer = $I("buffers");
        SC.update();
    });
    
    $("resetView").addEventListener("click", function () {
        SC.displayImageBuffer(undefined, false);
    });
    
   
    $("zoomFactor").addEventListener("click", function () {
        var coord = [SC.canvas.width / 2, SC.canvas.height / 2],
            scale = parseInt(this.value);
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
        var p = $('plotNoise').getPlot().clear();
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
    /*
    var x = Matrix.linspace(0, 24, 100);
    var y = x.getCopy().sin(x);
    var p = Matrix.polyfit(x, y, 11);
    var x1 = Matrix.linspace(0,24, 100);
    var y1 = Matrix.polyval(p, x1);    
    var plot = $('plotNoise').getPlot().clear();
    plot.addPath(x.getData(), y.getData());
    plot.addPath(x1.getData(), y1.getData(), {'stroke': "black"});*/
    // setElementOpacity("ui", 0.2, 1);
    // setElementOpacity("plot", 0.0, 1);
};
