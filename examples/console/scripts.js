var f1 = function () {
    return;
    Matrix.imread("/home/mazin/Images/images_test/pout.png", function () {
        var canvas = createCanvas([500, 500], "test");
        /*
         var sCanvas = new SuperCanvas(canvas);
         sCanvas.displayImage(this, 0);
         */
        var kernel = Matrix.fspecial("gaussian", [5, 1], 1.5).display("kernel");

        console.log(Tools.tic());
        Matrix.prototype.cornermetric = function (method) {
            method = method || "Harris";
            var image = this.im2double().rgb2gray();
            var gradient = image.gradient(true, true);
            var Ix2 = Matrix.times(gradient.x, gradient.x),
                Iy2 = Matrix.times(gradient.y, gradient.y),
                Ixy = Matrix.times(gradient.x, gradient.y);

            var Sx2 = Ix2.separableFilter(kernel, kernel).getData(),
                Sy2 = Iy2.separableFilter(kernel, kernel).getData(),
                Sxy = Ixy.separableFilter(kernel, kernel).getData();

            var R = Matrix.zeros(image.size()), rd = R.getData();
            var kappa = 0.04;
            if (method === "Harris") {
                for (var i = 0, ie = rd.length; i < ie; i++) {
                    var det = Sx2[i] * Sy2[i] - Sxy[i] * Sxy[i];
                    var trace = (Sx2[i] + Sy2[i]) * (Sx2[i] + Sy2[i]);
                    rd[i] = det - kappa * trace * trace;
                }
            } else if (method === "MinimumEigenvalue") {
                for (var i = 0, ie = rd.length; i < ie; i++) {
                    var ApB = Sx2[i] + Sy2[i], AmB = Sx2[i] - Sy2[i];
                    var C4 = 4 * Sxy[i] * Sxy[i];
                    AmB *= AmB;
                    rd[i] = (ApB - Math.sqrt(AmB + C4)) / 2;
                }
            }
            return R;
        };
        var map = this.cornermetric("MinimumEigenvalue");
        map.min().display();
        map.max().display();
        map["-="](map.min())['/='](map.max());
        map.imagesc(canvas);
        console.log(Tools.toc());
    })
};

var f2 = function () {
    var src = "/home/mazin/Images/images_test/J7/1.png";
    Matrix.imread(src, function () {
        window.canvas = new SuperCanvas(document.body);
        Tools.tic()
        console.log(Tools.toc());
        Tools.tic()
        // m.display();
        window.patches = this.im2double().im2col([15, 15]);//.reshape([2, 2, 3, 4]).display();
        console.log(patches.size());
        canvas.displayImage(patches, 0, true)
        console.log(Tools.toc());
    });
    return;

    var down = m.bin(2, 2).display("down");
    var up = down.expand(2, 2).get([0, m.getSize(0) - 1], [0, m.getSize(1) - 1]).display("up");
    var details = m["-"](up).display("details");
};

var sources = [
    /*"GOPR1610.JPG", "GOPR1622.JPG", "GOPR1623.JPG", "GOPR1628.JPG",
    */"GOPR1629.JPG"/*, "GOPR1688.JPG", "GOPR1709.JPG", "GOPR1715.JPG",
    "GOPR1169.JPG", "GOPR1232.JPG", "GOPR1243.JPG", "GOPR1244.JPG",
    "GOPR1258.JPG", "GOPR1275.JPG", "GOPR1310.JPG", "GOPR1314.JPG",
    "GOPR1720.JPG", "GOPR1734.JPG", "GOPR1879.JPG", "G0021094.JPG"*/
];


var path;
if (navigator.platform.match("Linux") === null) {
    path = "C:/Users/bmazin/Pictures/100GOPRO/";
    for (var s in sources) {
        sources[s] = path + sources[s]
    }
} else {
    path = "/home/mazin/Images/";
    var dates = [
        "2015/08/05/", "2015/08/05/", "2015/08/05/", "2015/08/05/",
        "2015/08/05/", "2015/08/05/", "2015/08/05/", "2015/08/05/",
        "2015/08/01/", "2015/08/02/", "2015/08/02/", "2015/08/02/",
        "2015/08/02/", "2015/08/02/", "2015/08/02/", "2015/08/02/",
        "2015/08/06/", "2015/08/06/", "2015/08/15/", "2015/08/01/"
    ];
    for (var s in sources) {
        sources[s] = path + dates[s] + sources[s];
    }
}
/*
 TODO:
 - [ ] What about the lut, is it correctly read ?
 - [ ] diff vs. gain ?
 - [ ] box filter vs Gaussian ?
 - [ ] plot details change level lines
 - [ ] influence of iteration number
 - [ ] histogram of details w.r.t. the luminance (less details in the dark part ?)
 - [ ] target histogram for the details ?
 - [ ] LTM in linear or post gamma curve ?
 - [ ] How to handle multi-
 */


var plotDetailsAmplification = function (plot, K, w, gamma, nIter) {
    "use strict";

    var bin = 2048;
    var values = [bin / 16, bin / 2, bin * 15 / 16],
        colors = ["blue", "red", "green"];
    var part = [1, bin - 1];
    var D = Matrix.ones(bin, 1).cumsum(0)["-="](1)["/="](bin * 4 - 1);
    plot.clear();
    console.log("w", w, "gamma", gamma, "nITer", nIter, "K", K);

    for (var v in values) {
        if (wRange[w] <= 0) {
            continue;
        }
        var Dp = D.getCopy();
        var A = Matrix.ones(bin, 1)["*="](values[v] / bin);
        processCoeffs(Dp.getData(), A.getData(), K, w, gamma, nIter);
        plot.addPath(
            D.get(part),
            Dp.get(part)["./"](D.get(part)),
            {"stroke": colors[v]}
        )
    }
    var bBox = plot.getCurvesBBox();
    bBox.height = 1.0;
    bBox.y = -2;
    plot.setAxis(bBox);
};

var ploGammaFunc = function (plot, k, theta) {
    "use strict"
    var bin = 1024;
    var D = Matrix.ones(bin, 1).cumsum(0)["-="](1)["/="](bin * 4 - 1);
    plot.clear();
    var Dp = D.getCopy().power(k - 1).times(D[".*"](theta).uminus().exp()).plus(1);
    // Dp.times(1e10).times(Matrix.ones(bin, 1).minus(D.getCopy().uminus().times(100).exp()));
    plot.addPath(
        D,
        Dp,
        {"stroke": "blue"}
    )
};

var computesDetailsHistogram = function () {
    var acc = Matrix.accumarray, cat = Matrix.cat;
    var bin = 256, res;
    var fun = function () {
        var scales = this.im2single().get([], [], 1).computeScaleSpace();
        for (var i = scales.length - 1; i >= 0; i--) {
            var d = scales[i].detail.reshape().abs()[".*"](bin - 1).round();
            var a = scales[i].approx.reshape()[".*"](0.5 * (bin - 1)).round();

            var sizeOut = [bin, bin];
            if (res instanceof Matrix) {
                res = res["+="](acc(cat(1, a, d), 1, sizeOut));
            } else {
                res = acc(cat(1, a, d), 1, sizeOut)
            }
        }
        res.sum(0).display()
        plotB.addHistogram(
            Matrix.colon(1, res.size(1)),
            res.sum(0)
        )
        canvas.displayImage(res["./"](res.max()).sqrt().toColormap("JET"), 4, true);
    };

    for (var src in sources) {
        console.log(src);
        Matrix.imread(sources[src], fun);
    }
};

window.processImages3 = function () {
    "use strict";
    $S("plot1").display = "";
    $S("plot2").display = "";
    $S("imageSelector").display = "";

    USE_CST = false;
    var gammaRange = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5],
        wRange     = [0.0, 0.0001, 0.0002, 0.0003, 0.0004, 0.0005, 0.001, 0.002, 0.003, 0.004, 0.005, 0.01, 0.02, 0.03, 0.04, 0.05, 0.1],
        alphaRange = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        KRange     = [1, 3, 5, 10, 30, 50, 100, 300, 500, 1000, Infinity],
        nIterRange = [1, 3, 5, 10, 30, 50],
        gainLuminanceRange = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5],
        gainSaturationRange = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5],
        scaleRatioRange = [Math.pow(2, 3), Math.pow(2, 2), Math.pow(2, 1), Math.pow(2, 1/2), Math.pow(2, 1/3)];
    var hasLutChanged = false;
    var onChangeLut = function () {
        hasLutChanged = true;
        var w = wRange[$I("wRange")],
            gamma = gammaRange[$I("gammaRange")],
            alpha = alphaRange[$I("alphaRange")],
            nIter = nIterRange[$I("nIterRange")],
            K = KRange[$I("KRange")],
            gainLuminance = gainLuminanceRange[$I("gainLuminanceRange")];
        plotDetailsAmplification(plotA, K, w, gamma, nIter);
        console.log("w", w, "gamma", gamma, "alpha", alpha, "nITer", nIter, "K", K, "gain", gainLuminance);
    };
    var onChangeAlpha = function () {
        var alpha = alphaRange[$I("alphaRange")];
        console.log("alpha", alpha);
    };
    var onMouseDown = function () {
        canvas.update(0);
    };
    // createButton("Original", onMouseDown, onChange);
    var hasScaleRatioChanged = false;
    var onChangeScaleRatio = function () {
        hasScaleRatioChanged = true;
    };
    createLabel("Scale ratio")
    createRange(scaleRatioRange, 4, onChangeScaleRatio, "scaleRatioRange");

    createLabel("alpha")
    createRange(alphaRange, 2, onChangeAlpha, "alphaRange");
    createLabel("w")
    createRange(wRange, 6, onChangeLut, "wRange");
    createLabel("gamma")
    createRange(gammaRange, 4, onChangeLut, "gammaRange");
    createLabel("K")
    createRange(KRange, 10, onChangeLut, "KRange");
    createLabel("Iterations")
    createRange(nIterRange, 1, onChangeLut, "nIterRange");

    Matrix.dataType = Float32Array;
    var space = "Ohta", channel = 0;
    var currentImageRGB, workingImage, scales, lut, gainMap;
    var process = function () {
        var luminance = workingImage.get([], [], channel)["*="](Math.sqrt(3) / 3);
        window.luminance = luminance;
        if (!scales || hasScaleRatioChanged) {
            Tools.tic();
            scales = luminance.computeScaleSpace(undefined, Infinity, scaleRatioRange[$I("scaleRatioRange")]);
            plotB.clear();
            plotB.addHistogram(Matrix.linspace(0, 1, 128), luminance.imhist(128), {"fill": "red"});
            plotB.addHistogram(Matrix.linspace(0, 1, 128), scales[scales.length - 1].approx.imhist(128), {"fill": "blue", "opacity": 0.5});
            window.scales = scales;
            hasScaleRatioChanged = false;
            console.log("Scalespace time", Tools.toc(), "with scale ratio", scaleRatioRange[$I("scaleRatioRange")]);
        }
        var bin = 2048;
        var w     = wRange[$I("wRange")],
            gamma = gammaRange[$I("gammaRange")],
            alpha = alphaRange[$I("alphaRange")],
            nIter = nIterRange[$I("nIterRange")],
            K     = KRange[$I("KRange")];
        Tools.tic();
        if (!lut || hasLutChanged) {
            lut = getLUT(K, w, gamma, [bin, bin], nIter);
            hasLutChanged = false;
            console.log("LUT time", Tools.toc());
            console.log("gamma =", gamma, "w = ", w, "alpha", alpha, "nIter", nIter, "bin", bin, "USE_CST", USE_CST);
        }
        var out = Matrix.gaussianColorEnhancementLUT(scales, lut, alpha);
        // out.min().display("min");
        // out.max().display("max");
        //out["-="](out.min())["/="](out.max());
        gainMap = out['./'](luminance);
        applyGainMap();
    };
    createButton("Process", process);

    var applyGainMap = function() {
      Tools.tic();
      //gain.set(gain.isfinite().neg(), 1);
      var gainLuminance = gainLuminanceRange[$I("gainLuminanceRange")],
          gainSaturation = gainSaturationRange[$I("gainSaturationRange")];
      var gain = gainMap.getCopy()
      // gain.set(gain[">"](100), 100).set(gain["<"](0.01), 0.01);
      // gain.set(gain[">"](5), 5).set(gain["<"](0.2), 0.2);
      // gain = gain.gaussian(1);

      // gainLuminance = gain["-"](1)["*="](gainLuminance)["+="](1);
      gainLuminance = gain[".*"](gainLuminance);

      if (1) { // Gain applied in Opponent colorspace
          // gainSaturation = gain["-"](1)["*="](gainSaturation)["+="](1);
          gainSaturation = gain[".*"](gainSaturation);
          var image = workingImage.getCopy();
          image.set([], [], 0, image.get([], [], 0).times(gainLuminance));
          image.set([], [], 1, image.get([], [], 1).times(gainSaturation));
          image.set([], [], 2, image.get([], [], 2).times(gainSaturation));
          image = image.applycform(space + " to RGB");

      } else if (0) { // Gain applied in RGB colorspace
          var image = workingImage.getCopy().applycform(space + " to RGB");
          image.set([], [], 0, image.get([], [], 0).times(gainLuminance));
          image.set([], [], 1, image.get([], [], 1).times(gainLuminance));
          image.set([], [], 2, image.get([], [], 2).times(gainLuminance));
      }

      gain['-='](0.25)['/='](3);
      console.log("Apply gain time", Tools.toc());
      // gain['-='](gain.min())['/='](gain.max());
      // image["-="](image.min())["/="](image.max());
      canvas.displayImage(gain, 2);
      canvas.displayImage(image, 1);
    };
    createLabel("Luminance gain")
    createRange(gainLuminanceRange, undefined, onChangeLut, "gainLuminanceRange");
    createLabel("Color gain")
    createRange(gainLuminanceRange, undefined, onChangeLut, "gainSaturationRange");
    createButton("Apply gain", applyGainMap);
    onChangeLut();

    $S("uiLeft").display = "";
    var callback = function (evt) {
        var im = new Image();
        im.src = this;
        im.onload = function () {
            im.height = 50;
            im.style.marginRight = "3px";
            $("images").appendChild(im);
        }
        im.onclick = function () {
            Matrix.imread(im.src, function () {
                canvas.displayImage(this, 0, true);
                currentImageRGB = this.im2single();
                workingImage = Matrix.applycform(currentImageRGB, "RGB to " + space);
                scales = undefined;
            });
        }
    };
    initFileUpload('loadFile', callback);
};

window.testGammaFit = function () {
    "use strict";
    var a = 1, b = 1.5;
    var x = Matrix.rand(2000, 1), y = Matrix.power(x, b).times(a);
    var X = x.getCopy().log(),  Y = y.getCopy().log();
    var fit = Matrix.polyfit(X, Y, 1).display("fit").getData();
    console.log("a =", a, "b =", b);
    console.log("ah =", fit[0], "bh =", Math.exp(fit[1]));
};

window.testPatchDecomposition = function () {
    "use strict";
    $S("plot1").display = "";
    // $S("plot2").display = "";
    $S("imageSelector").display = "";
    $S("uiLeft").display = "";

    var callback = function (evt) {
        var im = new Image();
        im.src = this;
        im.onload = function () {
            im.height = 50;
            im.style.marginRight = "3px";
            $("images").appendChild(im);
        }
        im.onclick = function () {
            Matrix.imread(im.src, function () {
                window.image = limitImageSize(this, 256).im2double();
                Tools.tic();
                var patchSize = [7, 7];
                var patches = image.im2col(patchSize, "sliding");
                window.patches = patches;
                console.log("Time required to compute patches:", Tools.toc());
                var patchIndices = Matrix.colon(1, patches.getSize(1)).getData();
                createLabel("Patches");
                var onChangePatches = function () {
                    var pSize = patchSize.slice()
                    pSize.push(3);
                    var patch = patches.get([], $I(this)).reshape(pSize);
                    canvas.displayImage(patch, 0);
                };
                createRange(patchIndices, 0, onChangePatches, "scaleRatioRange");
                console.log("test");
                canvas.displayImage(image, 0);
            });
        }
    };
    initFileUpload('loadFile', callback);
};

window.init = function () {
    processImages3();
    // testPatchDecomposition();
};
