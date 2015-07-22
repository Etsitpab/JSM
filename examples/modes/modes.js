/*global conso, document, Matrix, Colorspaces, CIE, open, $, $I, $F, $V, window, fieldset */
/*jshint indent: 4, unused: true, white: true */

function exportImage() {
    "use strict";
    open($("outputImage").toDataURL());
}

var Plot = Plot || {};
Plot.prototype = Plot.prototype || {};

Plot.prototype.drawMode = function (h, s, m, c) {
    "use strict";
    var nBin = h.numel();
    var hm = Matrix.zeros(nBin, 1);

    var a = Math.round(m.bins[0]), b = Math.round(m.bins[1]);
    var sum;
    if (b >= a) {
        sum = h.get([a, b]).sum()["./"](b - a + 1);
        hm.set([a, b], sum);
        this.addHistogram(s.getData(), hm.getData(), {fill: c, "fill-opacity": 0.33});
    } else {
        sum = h.get([a, -1]).sum();
        sum["+="](h.get([0, b]).sum());
        sum["/="](nBin - a + b + 1);
        hm.set([a, -1], sum);
        hm.set([0, b], sum);
        this.addHistogram(s.getData(), hm.getData(), {fill: c, "fill-opacity": 0.33});
    }
};

var ORIGINAL, IMAGE, SEGMENTED, WEIGHTS, MODES, HIST, HISTW, METHOD = 0, phase, norm;
var MAT, MASK;
//Matrix.matlabExport();

function bin2color(im, c) {
    "use strict";
    var R = im[".*"](c[0]), G = im[".*"](c[1]), B = im[".*"](c[2]);
    return R.cat(2, G, B);
}

var colorsName = [
    "red",
    "lime",
    "blue",
    "yellow",
    "fuchsia",
    "aqua",
    "olive",
    "purple",
    "teal",
    "maroon",
    "green",
    "navy",
    "black",
    "gray",
    "silver",
    "cyan",
    "DeepPink",
    "GreenYellow",
    "DarkKhaki",
    "LightGray",
    "deeppink"
];

var colorsRGB = {
    "red":     [1, 0, 0],
    "lime":    [0, 1, 0],
    "blue":    [0, 0, 1],
    "yellow":  [1, 1, 0],
    "fuchsia": [1, 0, 1],
    "aqua":    [0, 1, 1],
    "olive":   [0.5, 0.5, 0],
    "purple":  [0.5, 0, 0.5],
    "teal":    [0, 0.5, 0.5],
    "maroon":  [0.5, 0, 0],
    "green":   [0, 0.5, 0],
    "navy":    [0, 0, 0.5],
    "black":   [0, 0, 0],
    "gray":    [0.5, 0.5, 0.5],
    "silver":  [0.75, 0.75, 0.75],
    "cyan":    [0,255,255],
    "DeepPink": [255 / 255, 20 / 255, 147 / 255],
    "GreenYellow": [173 / 255, 255 / 255, 47 / 255],
    "DarkKhaki": [189 / 255,183 / 255,107 / 255],
    "LightGray": [211 / 255, 211 / 255, 211 / 255],
    "deeppink":[255/255, 20/255, 147/255],
};

function updateOutput(image) {
    "use strict";
    var outputCanvas = $("outputImage"), pH = $("HISTOGRAM");
    pH.setAttribute("display", "none");
    outputCanvas.setAttribute("display", "");

    var div = $("image");
    var canvasXSize = div.offsetWidth;
    var canvasYSize = div.offsetHeight;
    outputCanvas.width = canvasXSize;
    outputCanvas.height = canvasYSize;
    image.imshow(outputCanvas, "fit");
    outputCanvas.style.marginTop = (div.offsetHeight - outputCanvas.height) / 2;
}

var histogramDisplay;
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
    var bin, np, ns = 6;

    histogramDisplay = function () {
        var outputCanvas = $('outputImage');

        outputCanvas.width = 0;
        outputCanvas.height = 0;
        outputCanvas.style.marginTop = 0;

        //var modes = window.extractModes(h.getData(), $("circular").value === "yes");
        var s = Matrix.colon(1, bin);
        var pH = $("HISTOGRAM").getPlot().clear();
        $("HISTOGRAM").setAttribute("display", "");
        $("outputImage").setAttribute("display", "none");
        if (METHOD === 0) {
            var c = 1;
            if (HISTW && HISTW.sum().getDataScalar() !== 0) {
                c = HISTW.sum()["./"](HIST.sum()).getDataScalar();
            }
            
            var pdf = HIST['.*'](c).getData();
            pH.addHistogram(s.getData(), pdf, {"fill": "deepskyblue", "fill-opacity": 0.5, colormap: true});
        } else if (HISTW.sum().getDataScalar()) {
            pH.addHistogram(s.getData(), HISTW.getData(), {"fill": "orange", "fill-opacity": 0.5, colormap: true});
        }

        if (MODES) {
            var i, ei;
            for (i = 0; i < MODES.length; i++) {
                if (HISTW.sum().getDataScalar()) {
                    pH.drawMode(HISTW, s, MODES[i], "black");
                } else {
                    pH.drawMode(HIST, s, MODES[i], "black"/*colorsName[i]*/);
                }
            }
        }

        /*
         var div = $('image');
         var canvasXSize = div.offsetWidth;
         var canvasYSize = div.offsetHeight;
         $('outputImage').drawHistogram(h.getData(), 10, "", modes, true);
        */
    };

    var addGaussian = function () {
        var sigma = $F('sigma'), mu = $F('mu');
        np = Math.pow(10, $I('points'));
        MAT = Matrix.randn(np, 1)['.*'](sigma)['+'](2 * ns * mu);
        MAT = MAT.get(MAT['>='](0)['&&'](MAT['<='](2 * ns)));
        MAT = MAT['.*']((bin) / (2 * ns)).arrayfun(Math.floor);
        HIST = HIST['+'](Matrix.accumarray(MAT, Matrix.ones(MAT.size()), [bin, 1]));
        MODES = HIST.getModes($V("circular") === "yes", 0);

        histogramDisplay();
    };
    var addUniform = function () {
        np = Math.pow(10, $I('points'));
        MAT = Matrix.randi([0, bin - 1], np, 1);
        HIST = HIST['+'](Matrix.accumarray(MAT, Matrix.ones(MAT.size()), [bin, 1]));
        histogramDisplay();
        MODES = HIST.getModes($V("circular") === "yes", 0);
    };
    var reset = function () {
        bin = $I('bin');
        HIST = Matrix.zeros([bin, 1]);
        HISTW = Matrix.zeros([bin, 1]);
        histogramDisplay();
    };

    var enlargeMode = function (mode, n) {
        var c = parseInt(bin.value, 10);

        var c = bin;
        var a = mode[0], b = mode[1];
        if (a <= b) {
            a = a - n;
            b = b + n;
            if (a < 0) {
                a = c - a
            }
            if (b > c - 1) {
                b = b - c;
            }
        } else {
            b = b - n;
            a = a + n;
            if (b < 0) {
                b = c - b
            }
            if (a > c - 1) {
                a = a - c;
            }
        }
        mode[0] = a;
        mode[1] = b;
    };
    var isInMode = function (p, mode) {
        var c = parseInt(bin.value, 10);
        var a = mode[0], b = mode[1];
        if (a <= b) {
            return p['>='](a)['&&'](p['<='](b));
        }
        return p['<='](a)['+'](p['>='](b))['==='](1);
    };

    var changeView = function () {
        var view = $("imageView")
        if (view.value === "histogram") {
            histogramDisplay();
        } else if (view.value === "original") {
            updateOutput(ORIGINAL);
        } else if (view.value === "segmented") {
            updateOutput(IMAGE);
        } else if (view.value === "mask") {
            if ($("modes").value === "ALL") {
                updateOutput(MASK);
            } else {
                updateOutput(MODES[$I("modes")].mask);
            }
        }
    }.bind($("imageView"));

    var print = function () {
        $("HISTOGRAM").getPlot().print();
    };

    var method = function () {
        METHOD = parseInt($V("method"));
        applySeg();
    };

    $("print").addEventListener("click", print);
    $("method").addEventListener("change", method);
    $("cs").addEventListener("change", method);

    $("addGaussian").addEventListener('click', addGaussian);
    $("addUniform").addEventListener('click', addUniform);
    $("reset").addEventListener('click', reset);
    $("imageView").addEventListener('change', changeView);
    $("modes").addEventListener('change', changeView);

    var applySeg = function () {
        $V('bin', 45);
        reset();
        var cs = $V("cs");

        var CS = Matrix.Colorspaces;
        var RGB_HSL = CS["RGB to " + cs];
        var HSL_RGB = CS[cs + " to RGB"];
        var f = CS["HSL to RGB"];

        IMAGE = Matrix.applycform(ORIGINAL, "RGB to HSL");
        var H = IMAGE.get([], [], [0]).get();
        var S = IMAGE.get([], [], [1]).get();
        var L = IMAGE.get([], [], [2]).get();

        var bins = H['.*'](bin).floor();

        var weights = S['.^'](1);

        var S0 = weights['>'](0)['&&'](L['>'](0));
        bins = H.get(S0)['.*'](bin).floor();
        bins.set(bins['==='](bin), 0);
        weights = S.get(S0);

        HIST = Matrix.accumarray(bins, Matrix.ones(bins.size()), [bin, 1]);
        HISTW = Matrix.accumarray(bins, weights, [bin, 1]);

        //HIST = HIST.conv(Matrix.fspecial("gaussian", [15, 1], 3), "same").transpose();
        var mu = weights.mean().getData()[0], sig = weights.variance().getData()[0];
        var M = bins.numel();
        if (METHOD === 0) {
            MODES = HIST.getModes(true, 0);
        } else if (METHOD === 1) {
            MODES = HISTW.getModes(true, 0, M, mu, sig);
        } else if (METHOD === 2) {
            MODES = HISTW.getModes(true, 0, M, mu, sig, HIST);
        }
        SEGMENTED = undefined;
        MASK = undefined;

        bins = H['.*'](bin).floor();
        var size = [IMAGE.size(0), IMAGE.size(1)];
        var removed = S['>'](0)['&&'](L['>'](0));
        $("modes").innerHTML = "";
        addOption("modes", "ALL", "ALL");

        var i, ei;
        for (i = 0, ei = MODES.length; i < ei; i++) {
            enlargeMode(MODES[i].bins, 0);
            MODES[i].color = f([MODES[i].phase, 1, 0.5]);
            var mask = isInMode(bins, MODES[i].bins);
            SEGMENTED = SEGMENTED ? SEGMENTED['||'](mask) : mask;
            H.set(mask.get(), MODES[i].phase);
            mask = bin2color(mask['&&'](removed).single(), MODES[i].color);
            MODES[i].mask = mask.reshape(size.concat(3));
            MASK = MASK ? MASK['+'](mask) : mask;
            addOption("modes", i, i);
        }

        S = S.set(SEGMENTED.neg().get(), 0).reshape(size);
        MASK = MASK.reshape(size.concat(3));
        IMAGE = Matrix.applycform(IMAGE.set([], [], [0, 1], H.cat(2, S)), "HSL to RGB");

        changeView();

        fieldset.hideAll();
        fieldset.show("view");
    }
    var read = function (evt) {

        var callback = function (evt, type) {
            if (type === 'url') {
                var onread = function () {
                    ORIGINAL = this.im2double();
                    applySeg();
                };
                Matrix.imread(this, onread);
            } else if (type === 'txt') {
                MAT = Matrix.dlmread(this).display();
            }
        };

        // Only call the handler if 1 or more files was dropped.
        if (this.files.length) {
            var i;
            for (i = 0; i < this.files.length; i++) {
                window.readFile(this.files[i], callback);
            }
        }

    };
    $("loadFile").addEventListener("change", read, false);
    var plotProperties = {
        'ticks-display': false,
        'preserve-ratio': false,
        'legend-display': 'none'
    };
    var pH = new Plot(
        'HISTOGRAM',
        [$('image').clientWidth, $('image').clientHeight],
        'image', plotProperties
    );
    // pH.getDrawing().setAttribute("display", "none");
    $("outputImage").addEventListener("click", exportImage);
    window.hideFieldset();
    fieldset.show("addPoints");
    reset();
};
