/*global console, document, Matrix, Colorspaces, CIE, open */
/*jshint indent: 4, unused: true, white: true */

var IMAGE_ORIG, IMAGE_PROCESSED, DIFF, MAX_SIZE = 1200;

var stretchLuminance = function (im) {
    "use strict"
    var l = im.mean(2), lm = l.min(), lM = l.max();
    var ls = l["-"](lm)["./"](lM["-"](lm));
    var ld = l.getData(), lsd = ls.getData(), od = im.getData();
    var e = ld.length;
    for (var r = 0, g = e, b = 2 * e; r < e; r++, g++, b++) {
        var cst = lsd[r] / ld[r];
        od[r] *= cst;
        od[g] *= cst;
        od[b] *= cst;
    }
};

var stretchColorChannels = function (im) {
    "use strict";
    for (var c = 0; c < 3; c++) {
        var channel = im.get([], [], c);
        var min = channel.min(), max = channel.max();
        channel["-="](min)["/="](max["-"](min));
        im.set([], [], c, channel);
    }
};

function updateOutput() {
    "use strict";
    var image;
    if ($V("view") === "proc") {
        image = IMAGE_PROCESSED;
        if ($V('stretchDyn') === "lum") {
            image = image.get();
            stretchLuminance(image);
        } else if ($V('stretchDyn') === "color") {
            image = image.get();
            stretchColorChannels(image);
        }
    } else if ($V("view") === "orig") {
        image = IMAGE_ORIG;
    } else if ($V("view") === "diff") {
        DIFF = IMAGE_PROCESSED["-"](IMAGE_ORIG).abs();
        var min = DIFF.min(), max = DIFF.max();
        image = DIFF["-="](min)["/="](max["-"](min));
    }
    
    var canvas = $("outputImage");
    var div = $("image");
    var canvasXSize = div.offsetWidth;
    var canvasYSize = div.offsetHeight;
    canvas.width = canvasXSize;
    canvas.height = canvasYSize;
    image.imshow(canvas, "fit");
    canvas.style.marginTop = (div.offsetHeight - canvas.height) / 2;
}

var colEn = function () {
    "use strict";
    
    var getParameters = function () {
        return {
            K: $F("K"),
            gamma: $F("gamma"),
            alpha: $F("alpha"),
            w: $F("w") / 255,
            wav: $V("wavelet")
        };
    };
    
    colEn.reset = function () {
        Tools.tic();
        $F("K", 10);
        $F("gamma", 1.0);
        $F("alpha", 0.1);
        $F("w", 1.0);
        $("wavelet").getElementsByTagName("option")[0].selected = "selected";
        onChange();
    };

    colEn.fun = function (img, p) {
        var out = img.colorEnhancement(p.gamma, p.w, p.K, p.wav, p.alpha);

        return out;
    };

    var onApply = function () {
        IMAGE_PROCESSED = colEn.fun(IMAGE_ORIG, getParameters());
        $("view").getElementsByTagName("option")[0].selected = "selected";
        $("view").focus();
        updateOutput();
    };
    var onChange = function () {
        $V("KVal", $F("K"));
        $V("gammaVal", $F("gamma"));
        $V("alphaVal", $F("alpha"));
        $V("wVal", $F("w"));
    };
    onChange();
    $("K").addEventListener("change", onChange, false);
    $("w").addEventListener("change", onChange, false);
    $("alpha").addEventListener("change", onChange, false);
    $("gamma").addEventListener("change", onChange, false);
    $("applyColEn").addEventListener("click", onApply, false);
    $("resetColEn").addEventListener("click", colEn.reset, false);
};

window.onload = function () {
    "use strict";
    var callback = function (evt) {
        var onread = function () {
            IMAGE_ORIG = limitImageSize(this.im2double(), MAX_SIZE);
            IMAGE_PROCESSED = IMAGE_ORIG;
            $("view").getElementsByTagName("option")[1].selected = "selected";
            updateOutput();
        };
        Matrix.imread(this, onread);
    };
    initFileUpload("loadFile", callback);
    initInputs();
    initHelp();
    colEn();

    $("view").addEventListener("change", updateOutput, false);
    $('stretchDyn').addEventListener("change", updateOutput, false);
    document.body.onresize = updateOutput;
    //hideFieldset();
};

