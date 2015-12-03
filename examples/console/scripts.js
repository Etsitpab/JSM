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

var K, gamma, w, nIter, bin;
window.processImages = function () {
    var i = 0, src;
    Tools.tic();
    console.log("gamma =", gamma, "w = ", w, "nIter", nIter, "bin", bin);
    var lut = getLUT(K, w, gamma, [bin, bin], nIter);
    console.log("LUT time", Tools.toc());

    for (src in sources) {
        Matrix.imread(sources[src], function () {
            Matrix.dataType = Float32Array;
            var df = 1;
            var image = this.im2single().get([0, df, -1], [0, df, -1], []);

            Tools.tic();
            var scales = image.computeScaleSpace();
            console.log("Scalespace time", Tools.toc());

            var outColor = Matrix.gaussianColorEnhancementLUT(scales, lut, 0.15);
            var diffColor = outColor['-'](image).im2single();
            var dMax = diffColor.getCopy().abs().max()['*='](2);
            diffColor["/="](dMax)["+="](0.5);
            var outColor2 = outColor.getCopy();
            outColor2["-="](outColor2.min())["/="](outColor2.max());
            /*var mean = outColor2.mean();
            outColor2["-="](mean);
            var min = Matrix.cat(0, outColor2.min(), outColor2.max()).abs();
            min.display("min");
            outColor2["/="](min.max()["*"](2))["+="](mean);*/
            
            /*
            var outGrey = Matrix.applycform(image, "RGB to Ohta");
            var channel = 0;
            var L = outGrey.get([], [], channel)            
            L = L.gaussianColorEnhancementLUT(0.5, 10 / 255, Infinity, 0.1);
            outGrey.set([], [], channel, L).applycform("Ohta to RGB");
            var diffGrey = outGrey['-'](image).im2single();
            dMax = diffGrey.getCopy().abs().max()['*='](2);
            diffGrey["/="](dMax)["+="](0.5);
            */
            // var outGrey2 = outGrey.getCopy();
            // outGrey2["-="](outGrey2.min())["/="](outGrey2.max());
            canvas.displayImage(diffColor,     i, true);
            canvas.displayImage(outColor,  i + 1, true);
            canvas.displayImage(image,     i + 2, true);
            canvas.displayImage(outColor2, i + 3, true);
            // canvas.displayImage(outGrey,   i + 4, true);
            // canvas.displayImage(diffGrey,  i + 5, true);
            // canvas.displayImage(out2, i + 2, true);
            i += 4;
        });
    }
};

var createRange = function (values, def, onChange, id) {
    var input = document.createElement("input");
    input.setAttribute("type", "range");
    input.setAttribute("id", id);
    input.setAttribute("min", 0);
    input.setAttribute("step", 1);
    input.setAttribute("max", values.length - 1);
    if (def === undefined) {
        def = Math.floor(values.length / 2);
    }
    input.setAttribute("value", def);
    input.setAttribute("class", "val2");
    input.addEventListener("change", function () {
        console.log(this.id, this.value);
        $(this.id + "Val").setAttribute("value", values[this.value]);
    });
    input.addEventListener("change", onChange);
    $("uiLeft").appendChild(input);

    var text = document.createElement("input");        
    text.setAttribute("id", id + "Val");
    text.setAttribute("value", values[input.value]);
    text.setAttribute("class", "val2");
    text.setAttribute("type", "text");
    $("uiLeft").appendChild(text);

    return input;
};
var createButton = function (value, onMouseDown, onMouseUp, id) {
    var input = document.createElement("input");
    input.setAttribute("type", "button");
    input.setAttribute("id", id);
    input.setAttribute("value", value);
    input.addEventListener("mousedown", onMouseDown);
    input.addEventListener("mouseup", onMouseUp);
    $("uiLeft").appendChild(input);
    return input;
};

var createLabel = function (value) {
    var label = document.createElement("label");
    label.innerHTML = value
    $("uiLeft").appendChild(label);
    return label;
};

var plotDetailsAmplification = function (plot, K, w, gamma, nIter) {
    "use strict"
    console.log("K", K);
    var bin = 1024;
    var values = [bin / 16, bin / 2, bin * 15 / 16],
        colors = ["blue", "red", "green"];
    var part = [1, bin - 1];
    var D = Matrix.ones(bin, 1).cumsum(0)["-="](1)["/="](bin * 4 - 1);
    plotA.clear();
    for (var v in values) {
        if (wRange[w] <= 0) {
            continue;
        }
        var Dp = D.getCopy();
        var A = Matrix.ones(bin, 1)["/="](values[v]);
        processCoeffs(Dp.getData(), A.getData(), K, w, gamma, nIter);
        plot.addPath(
            D.get(part),
            Dp.get(part)["./"](D.get(part)),
            {"stroke": colors[v]}
        )
    }
};

window.processImages2 = function () {
    var gammaRange = [0.5, 0.75, 1.0],
        wRange     = [0.001, 0.003, 0.005],
        alphaRange = [0.0, 0.15, 0.3];

    var onChange = function () {
        var w     = $I("wRange"), gamma = $I("gammaRange"), alpha = $I("alphaRange");
        var bufferIndex = 1 + (gamma * wRange.length + w) * alphaRange.length + alpha; 
        canvas.update(bufferIndex);
        plotDetailsAmplification(plotA, K, wRange[w], gammaRange[gamma], nIter);
        console.log("w", wRange[w], "gamma", gammaRange[gamma], "alpha", alphaRange[alpha]);
    };
    var onMouseDown = function () {
        canvas.update(0);
    };
    createButton("Original", onMouseDown, onChange);
    createRange(alphaRange, undefined, onChange, "alphaRange");    
    createRange(wRange, undefined, onChange, "wRange");
    createRange(gammaRange, undefined, onChange, "gammaRange");

    Matrix.dataType = Float32Array;
    var image;
    var process = function () {
        image = this.im2single();
        Tools.tic();
        var scales = image.computeScaleSpace();
        console.log("Scalespace time", Tools.toc());
        var bin = 2048, nIter = 1, K = Infinity, i = 1;
        USE_CST = false;
        for (var g in gammaRange) {
            for (var w in wRange) {
                Tools.tic();
                var lut = getLUT(K, wRange[w], gammaRange[g], [bin, bin], nIter);
                console.log("LUT time", Tools.toc());
                console.log("gamma =", gammaRange[g], "w = ", wRange[w], "alpha", alphaRange[a], "nIter", nIter, "bin", bin, "USE_CST", USE_CST);
                for (var a in alphaRange) {
                    var out = Matrix.gaussianColorEnhancementLUT(scales, lut, alphaRange[a]);
                    canvas.displayImage(out, i++, true);
                }
            }
        }
        onChange();
    };

    $S("uiLeft").display = "";
    var callback = function (evt) {
        var im = new Image();
        im.src = this;
        im.onload = function () {
            canvas.displayImage(im, 0, true);
            im.height = 50;
            im.style.marginRight = "3px";
            $("images").appendChild(im);
        }
        im.onclick = function () {
            Matrix.imread(im.src, process);
        }
    };
    initFileUpload('loadFile', callback);
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
    var gammaRange = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5],
        wRange     = [0.0, 0.0001, 0.0003, 0.0005, 0.001, 0.002, 0.003, 0.005, 0.01, 0.03, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
        alphaRange = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        KRange     = [1, 3, 5, 10, 30, 50, 100, 300, 500, 1000, Infinity],
        nIterRange = [1, 3, 5, 10, 30, 50];

    var onChange = function () {
        var w = wRange[$I("wRange")], 
            gamma = gammaRange[$I("gammaRange")], 
            alpha = alphaRange[$I("alphaRange")], 
            nIter = nIterRange[$I("nIterRange")], 
            K = KRange[$I("KRange")];
        plotDetailsAmplification(plotA, K, w, gamma, nIter);
        console.log("w", w, "gamma", gamma, "alpha", alpha, "nITer", nIter, "K", K);
    };
    var onMouseDown = function () {
        canvas.update(0);
    };
    // createButton("Original", onMouseDown, onChange);
    createLabel("Alpha")
    createRange(alphaRange, 1, onChange, "alphaRange");    
    createLabel("w")
    createRange(wRange, 7, onChange, "wRange");
    createLabel("gamma")
    createRange(gammaRange, 4, onChange, "gammaRange");
    createLabel("K")
    createRange(KRange, 10, onChange, "KRange");
    createLabel("Iterations")
    createRange(nIterRange, 0, onChange, "nIterRange");
    onChange();

    Matrix.dataType = Float32Array;
    var currentImage, scales;
    var process = function () {
        var space = "Opponent", channel = 0;
        var image = Matrix.applycform(currentImage, "RGB to " + space);
        if (!scales) {
            Tools.tic();
            scales = image.get([], [], channel).computeScaleSpace();
            console.log("Scalespace time", Tools.toc());
        }
        var bin = 2048;
        USE_CST = false;
        var w     = wRange[$I("wRange")], 
            gamma = gammaRange[$I("gammaRange")], 
            alpha = alphaRange[$I("alphaRange")],
            nIter = nIterRange[$I("nIterRange")],
            K     = KRange[$I("KRange")];
        Tools.tic();
        var lut = getLUT(K, w, gamma, [bin, bin], nIter);
        console.log("LUT time", Tools.toc());
        console.log("gamma =", gamma, "w = ", w, "alpha", alpha, "nIter", nIter, "bin", bin, "USE_CST", USE_CST);
        var out = Matrix.gaussianColorEnhancementLUT(scales, lut, alpha);
        out = image.set([], [], channel, out).applycform(space + " to RGB");
        out["-="](out.min())["/="](out.max());
        canvas.displayImage(out, 1, true);
        onChange();
    };
    createButton("Process", process);

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
                currentImage = this.im2single()
                scales = undefined;
            });
        }
    };
    initFileUpload('loadFile', callback);
};

window.init = function () {
    $S("plot1").display = "";
    $S("plot2").display = "";
    $S("imageSelector").display = "";
    processImages3();
    // K = Infinity, gamma = 0.75, w = 0.005, nIter = 1, bin = 2048;
    // processImages();
};
