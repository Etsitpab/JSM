/*global console, document, Matrix, Colorspaces, CIE, open */
/*jshint indent: 4, unused: true, white: true */

var IMAGE_ORIG, IMAGE_PROCESSED, DIFF, MAX_SIZE = 1200;
var sCanvas;
var STRETCH = false;

var stretchLuminance = function (im) {
    "use strict"
    var l = im.mean(2), lm = l.min(), lM = l.max();
    var ls = l["-"](lm)["./"](lM["-"](lm));
    var ld = l.getData(), lsd = ls.getData(), od = im.getData();
    var e = ld.length;
    for (var r = 0, g = e, b = 2 * e; r < e; r++, g++, b++) {
        var cst = ld[r] <= 0 ? 0 : lsd[r] / ld[r];
        cst = cst > 1 ? 1 : cst;
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

function updateOutput(init) {
    "use strict";
    if (!IMAGE_ORIG) {
        return;
    }
    var image;
    if ($V("view") === "proc") {
        image = IMAGE_PROCESSED;
    } else if ($V("view") === "orig") {
        image = IMAGE_ORIG;
    } else if ($V("view") === "diff") {
        DIFF = IMAGE_PROCESSED["-"](IMAGE_ORIG).abs();
        var min = DIFF.min(), max = DIFF.max();
        image = DIFF["-="](min)["/="](max["-"](min));
    }
    sCanvas.displayImage(image, 0, init);
    drawImageHistogram("histogram", image);
}

var colEn = function () {
    "use strict";
    Matrix.dwtmode("sym");
    var getParameters = function () {
        return {
            K: $F("K"),
            gamma: $F("gamma"),
            alpha: $F("alpha"),
            w: $F("w") / 255,
            wav: $V("wavelet"),
            colorspace: $V("colorspace"),
            averageValue: $V("averageValue"),
            stretch: $V("stretchDyn")
        };
    };
    
    colEn.reset = function () {
        Tools.tic();
        $F("K", 20);
        $F("gamma", 0.5);
        $F("alpha", 0.1);
        $F("w", 15.0);
        $("wavelet").getElementsByTagName("option")[0].selected = "selected";
        $("wavelet").getElementsByTagName("option")[0].selected = "selected";
        $("stretchDyn").getElementsByTagName("option")[0].selected = "selected";
        $("colorspace").getElementsByTagName("option")[0].selected = "selected";
        onChange();
    };

    colEn.fun = function (img, p) {
        console.log(p);
        if (p.colorspace === "Gray") {
            img = Matrix.applycform(img, "RGB to Ohta");
            var L = img.get([], [], 0);
            L = L.colorEnhancementTest(
                p.gamma, p.w, p.K, p.wav, p.alpha, p.averageValue, p.stretch
            );
            return img.set([], [], 0, L).applycform("Ohta to RGB");
        }
        if (p.colorspace !== "RGB") {
            img = Matrix.applycform(img, "RGB to " + p.colorspace);
        }
        img = img.colorEnhancementTest(
            p.gamma, p.w, p.K, p.wav, p.alpha, p.averageValue, p.stretch
        );
        if (p.colorspace !== "RGB") {
            img = img.applycform(p.colorspace + " to RGB");
        }
        return img;
    };

    var onApply = function () {
        Tools.tic();
        var img = IMAGE_ORIG.get();
        IMAGE_PROCESSED = colEn.fun(img, getParameters());
        console.log("Time elapsed:", Tools.toc(), "(ms)");
        $("view").getElementsByTagName("option")[0].selected = "selected";
        $("view").focus();
        updateOutput(false);
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
    var onread = function () {
        IMAGE_ORIG = limitImageSize(this.im2double(), MAX_SIZE);
        IMAGE_PROCESSED = IMAGE_ORIG;
        $("view").getElementsByTagName("option")[1].selected = "selected";
        $("applyColEn").focus();
        updateOutput(true);
    };
    var addImage = function (src) {
        var im = new Image();
        im.src = this;
        im.onload = function() {
            im.height = 50;
            im.style.marginRight = "3px";
            $("images").appendChild(im);
        }
        im.onclick = function () {
            Matrix.imread(im.src, onread);
        }
    };

    var pinImage = function () {
        IMAGE_PROCESSED.toImage(function () {
            addImage.bind(this.src)();
        });
    };

    var paperResults = function () {
        if ($V("paperResults") === "YES") {
            window.EDO_RES = true;
        } else {
            window.EDO_RES = false;
        }
    };
    
    initFileUpload("loadFile", addImage);
    initInputs();
    var displayHelp = initHelp();
    displayHelp();
    colEn();

    sCanvas = new SuperCanvas(document.body);

    $("view").addEventListener("change", updateOutput, false);
    $('pinImage').addEventListener("click", pinImage, false);
    $('paperResults').addEventListener("change", paperResults, false);
    
    document.body.onresize = updateOutput;
    // var fieldsets = initFieldset();
    // fieldsets.hideAll();
};

