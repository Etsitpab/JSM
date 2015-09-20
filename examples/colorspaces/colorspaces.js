/*global console, document, Matrix, Colorspaces, CIE, open */
/*jshint indent: 4, unused: true, white: true */

var stack, stackIt, image, mask, modules, canvas;

var onclick, onmousewheel;

function exportImage() {
    "use strict";
    var output = stack[stackIt].image;

    if ($V("stretchGlobal") === "YES") {
        var min = output.min(); 
        var max = output.max();
        output = output["-"](min)["./"](max - min);
    }
    output.toImage(function () {
        open(this.src, '_blank');
    });
}

function updateOutput(image, init) {
    "use strict";

    if (!stack) {
        return;
    }

    if (!(image instanceof Matrix)) {
        image = stack[stackIt].image;
    } 
    if (mask instanceof Matrix) {
        var m = mask.double().set(mask["<"](1), 0.25).repmat([1, 1, 3]);
        image = image[".*"](m);
    }
    var noinit = init === true ? false : true;
    canvas.setImageBuffer(image, 0);
    canvas.displayImageBuffer(0, noinit);
    drawImageHistogram("histogram", image);
}

function initProcess () {
    "use strict";
    if (!window.Disk) {
        return;
    }
    
    var updateProcessList = function () {
        $("filters").innerHTML = "";
        var process = Disk.getItemList(".ps");
        var i, option;
        for (i = 0; i < process.length; i++) {
            option = document.createElement('option');
            option.setAttribute('value', Disk.load(process[i]));
            option.text = process[i].replace(".ps", "");
            $("filters").appendChild(option);
        }
    };
    var onChange = function () {
        if (this.value) {
            applyProcess(JSON.parse(this.value));
        }
    };
    function saveProcess () {
        var process = getProcess();
        var name = window.prompt("Filter name ?");
        if (name) {
            Disk.save(name + ".ps", JSON.stringify(getProcess()), true);
        }
        updateProcessList();
    };
    function removeProcess () {
        var name = window.prompt("Filter name ?");
        Disk.remove(name + ".ps");
        updateProcessList();
    };
    
    $("filters").addEventListener("click", onChange);
    $("saveProcess").addEventListener("click", saveProcess);
    $("removeProcess").addEventListener("click", removeProcess);
    updateProcessList();
};

function getProcess () {
    "use strict";
    var i, process = [];
    for (i = 0; i < stackIt; i++) {
        var step = {
            module: stack[i].module, 
            parameters: stack[i].parameters
        };
        process.push(step);
    }
    return process;
};

function applyProcess (process) {
    "use strict";
    var i, ie;
    for (i = 0, ie = process.length; i < ie; i++) {
        var module = process[i].module;
        var parameters = process[i].parameters;
        console.log("Applying module " + module + " (" + i + "/" + ie + ")");
        apply(module, parameters);
    }
    updateOutput();
};

function apply (module, parameters) {
    "use strict";

    if (stackIt < stack.length - 1) {
        stack = stack.slice(0, stackIt + 1);
    }
    var img = stack[stackIt].image;
    var fun = window[module].fun;
    stack[stackIt].parameters = parameters;
    stack[stackIt].module = module;
    stackIt++;
    Tools.tic();
    stack[stackIt] = {image: fun(img, parameters)};
    console.log("Applying module " + module + " in:", Tools.toc());
}

function change (module, parameters) {
    "use strict";
    var img = stack[stackIt].image;
    var fun = window[module].fun;
    Tools.tic();
    updateOutput(fun(img, parameters));
    console.log("Applying module " + module + " in:", Tools.toc());
}

var undoRedo = function () {
    "use strict";
    var undo = function () {
        if (stackIt > 0) {
            stackIt--;
        }
        updateOutput();
    };
    var redo = function () {
        if (stackIt < stack.length - 1) {
            stackIt++;
        }
        updateOutput();
    };

    $("undo").addEventListener("click", undo);
    $("redo").addEventListener("click", redo);
};


var crop = function () {
    "use strict";

    crop.reset = function () {
        $F("x1", 0);
        $F("x2", 1);
        $F("y1", 0);
        $F("y2", 1);
        $F("rotation", 0);
        updateParameters();
        updateOutput();
    };

    var getParameters = function () {
        return  {
            x1: $F("x1"),
            x2: $F("x2"),
            y1: $F("y1"),
            y2: $F("y2"),
            rotation: $F("rotation")
        };
    };
    var updateParameters = function () {
        var r = Math.round;
        $V("x1Val", r($F("x1") * 100) + "%");
        $V("x2Val", r($F("x2") * 100) + "%");
        $V("y1Val", r($F("x1") * 100) + "%");
        $V("y2Val", r($F("y2") * 100) + "%");
        $V("rotationVal", $I("rotation") * 90 + "°");
    };
    updateParameters();
    crop.fun = function (img, p) {
        img = img.rot90(p.rotation);
        var x = img.getSize(1) - 1, y = img.getSize(0) - 1;
        var f = Math.floor;
        x = [f(x * p.x1), f(x * p.x2)];
        y = [f(y * p.y1), f(y * p.y2)];
        return img.get(y, x);
    };

    var onChange = function () {
        updateParameters();
        change("crop", getParameters());
    };
    var onApply = function () {
        apply("crop", getParameters());
        crop.reset();
    };

    $("resetCrop").addEventListener("click", crop.reset);
    $("applyCrop").addEventListener("click", onApply);
    $("x1").addEventListener("change", onChange);
    $("x2").addEventListener("change", onChange);
    $("y1").addEventListener("change", onChange);
    $("y2").addEventListener("change", onChange);
    $("rotation").addEventListener("change", onChange);
};

var contrast = function () {
    "use strict";

    var getParameters = function () {
        return {
            gamma: $F("gamma"), 
            histeq: $V("histeq_contrast"), 
            brightness: $F("brightness"),
            contrast: $F("contrast"),
            channel: JSON.parse($("channels_contrast").value)
        };
    };
    var updateParameters = function () {
        var r = Math.round;
        $V("gammaVal", $F("gamma"));
        $V("brightnessVal", $F("brightness") - 0.5);
        $V("contrastVal", $F("contrast") - 0.5);
    };
    updateParameters();

    contrast.reset = function () {
        $("channels_contrast").getElementsByTagName("option")[0].selected = "selected";
        $("histeq_contrast").getElementsByTagName("option")[0].selected = "selected";
        $F("gamma", 1);
        $F("brightness", 0.5);
        $F("contrast", 0.5);
        updateParameters();
        updateOutput();
    };
    contrast.fun = function (img, p) {
        var im = img;
        if (p.channel.length !== 0) {
            im = im.get([], [], p.channel);
        }
        if (p.gamma !== 1) {
            im = im[".^"](p.gamma);
        }
        if (p.brightness !== 0.5) {
            im = im["+"](p.brightness - 0.5);
        }
        if (p.contrast !== 0.5) {
            im = im[".*"](p.contrast * 2)["-"](p.contrast - 0.5);
        }
        if (p.channel.length !== 0) {
            im = Matrix.set(img, [], [], p.channel, im);
        }
        if (p.histeq === "uniform") {
            im = im.histeq(1023);
        }
        return im;
    };
    
    var onChange = function () {
        updateParameters();
        change("contrast", getParameters());
    };
    var onApply = function () {
        apply("contrast", getParameters());
        contrast.reset();
    };

    $("resetContrast").addEventListener("click", contrast.reset);
    $("applyContrast").addEventListener("click", onApply);
    $("histeq_contrast").addEventListener("change", onChange);
    $("channels").addEventListener("change", onChange);
    $("contrast").addEventListener("change", onChange);
    $("brightness").addEventListener("change", onChange);
    $("gamma").addEventListener("change", onChange);
};

var colEn = function () {
    'use strict';
    
    var stretchLuminance = function (im) {
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
        for (var c = 0; c < 3; c++) {
            var channel = im.get([], [], c);
            var min = channel.min(), max = channel.max();
            channel["-="](min)["/="](max["-"](min));
            im.set([], [], c, channel);
        }
    };
    
    var getParameters = function () {
        return {
            K: $F("K"),
            gamma: $F("ceGamma"),
            alpha: $F("alpha"),
            w: $F("w") / 255,
            wav: $V("wavelet")
        };
    };
    
    colEn.reset = function () {
        Tools.tic();
        $F("K", 20);
        $F("ceGamma", 0.5);
        $F("alpha", 0.0);
        $F("w", 15);
        $("wavelet").getElementsByTagName("option")[0].selected = "selected";
        onChange();
    };

    colEn.fun = function (img, p) {
        console.log(p.gamma, p.w, p.K, p.wav, p.alpha);
        var out = img.colorEnhancementTest(p.gamma, p.w, p.K, p.wav, p.alpha, 'image');
        updateOutput(out);
        return out;
    };

    var onApply = function () {
        apply("colEn", getParameters());
    };
    var onChange = function () {
        $V("KVal", $F("K"));
        $V("ceGammaVal", $F("ceGamma"));
        $V("alphaVal", $F("alpha"));
        $V("wVal", $F("w"));
    };
    onChange();
    $("K").addEventListener("change", onChange, false);
    $("w").addEventListener("change", onChange, false);
    $("alpha").addEventListener("change", onChange, false);
    $("ceGamma").addEventListener("change", onChange, false);
    $("applyColEn").addEventListener("click", onApply, false);
    $("resetColEn").addEventListener("click", colEn.reset, false);
};

var thresholding = function () {
    "use strict";
    thresholding.reset = function () {
        $F("min", 0);
        $F("max", 1);
        updateOutput();
    };

    var getParameters = function () {
        return  {
            min: $F("min"),
            max: $F("max"),
        };
    };
   thresholding.fun = function (img, p) {
        var m = p.min;
        var M = p.max;
        if (m <= M) {
            img = img['>='](m)['&&'](img['<'](M));
        } else {
            img = img['<'](M)['||'](img['>='](m));
        }
        return img;
    };
    var onChange = function () {
        change("thresholding", getParameters());
    };
    var onApply = function () {
        apply("thresholding", getParameters());
        thresholding.reset();
    };
  
    $("resetThreshold").addEventListener("click", thresholding.reset);
    $("applyThreshold").addEventListener("click", onApply);
    $("min").addEventListener("change", onChange);
    $("max").addEventListener("change", onChange);
};

var selection = function () {
    "use strict";

    var coord;
    
    selection.reset = function () {
        $F("select_threshold", 0.25);
        mask = undefined;
        updateOutput();
    };

    var getParameters = function () {
        return  {
            threshold: $F("select_threshold"),
            coord: coord
        };
    };
    
    selection.fun = function (img, p) {
        if (p.threshold > 0) {
	    mask = img.getConnectedComponent(p.coord[0], p.coord[1], p.threshold * 2);
        }
        return img;
    };
    
    var onChange = function () {
        change("selection", getParameters());
    };

    onclick = function (c) {
        coord = c;
        onChange();
    };

    onmousewheel = function (direction) {
        $F("select_threshold", $F("select_threshold") + direction);
        onChange();
    };
    
    var invert = function () {
        mask = mask.neg();
        updateOutput();
    };

    $("resetSelect").addEventListener("click", selection.reset);
    $("invertSelect").addEventListener("click", invert);
};

var colorBalance = function () {
    "use strict";
    colorBalance.reset = function () {
        $F("cyanRed", 0.5);
        $F("yellowBlue", 0.5);
        $F("magentaGreen", 0.5);
        updateOutput();
    };
    var getParameters = function () {
        return  {
            cyanRed: $F("cyanRed"),
            yellowBlue: $F("yellowBlue"),
            magentaGreen: $F("magentaGreen")
        };
    };
    colorBalance.fun = function (img, p) {
        var imgRGY = Matrix.applycform(img, "LinearRGB to rgY");
        var v1 = 1, v2 = 1;
        if (p.cyanRed > 0.5) {
            v1 += (p.cyanRed - 0.5) * 4;
            v2 -= (p.cyanRed - 0.5) * 2;
        } else {
            v1 -= (0.5 - p.cyanRed) * 2;
            v2 += (0.5 - p.cyanRed);
        }
        if (p.yellowBlue > 0.5) {
            v1 -= (p.yellowBlue - 0.5) * 2;
            v2 -= (p.yellowBlue - 0.5) * 2;
        } else {
            v1 += (0.5 - p.yellowBlue);
            v2 += (0.5 - p.yellowBlue);
        }
        if (p.magentaGreen > 0.5) {
            v1 -= (p.magentaGreen - 0.5) * 2;
            v2 += (p.magentaGreen - 0.5) * 4;
        } else {
            v1 += (0.5 - p.magentaGreen);
            v2 -= (0.5 - p.magentaGreen) * 2;
        }
        imgRGY.set([], [], 0, imgRGY.get([], [], 0)[".*"](v1));
        imgRGY.set([], [], 1, imgRGY.get([], [], 1)[".*"](v2));
        return imgRGY.applycform("rgY to LinearRGB");
    };
    var onChange = function () {
        change("colorBalance", getParameters());
    };
    var onApply = function () {
        apply("colorBalance", getParameters());
        colorBalance.reset();
    };

    $("resetColorBalance").addEventListener("click", colorBalance.reset);
    $("applyColorBalance").addEventListener("click", onApply);
    $("cyanRed").addEventListener("change", onChange);
    $("magentaGreen").addEventListener("change", onChange);
    $("yellowBlue").addEventListener("change", onChange);
};

var hueSaturation = function () {
    "use strict";

    hueSaturation.reset = function () {
        $F("hue", 0.5);
        $F("saturation", 1);
        $F("hue_f0", 0.5);
        $F("hue_sigma", 0);
        updateOutput();
    };
    var getParameters = function () {
        return {
            hue: $F("hue"),
            saturation: $F("saturation"),
            f0: $F("hue_f0"),
            sigma: $F("hue_sigma")
        };
    };
    hueSaturation.fun = function (img, p) {
        var f = function (H, S, L) {
            H = H + p.hue - 0.5;
            if (H > 1) {
                H -= 1;
            } else if (H < 0) {
                H += 1;
            }  
            S *= p.saturation;
            return [H, S, L];
        };
        var m = p.f0 - p.sigma, M = p.f0 + p.sigma;
        var f2 = function (H, S, L) {
            if (H < m || H > M) {
                S = 0;
            }  
            return [H, S, L];
        };
        if (p.hue !== 0.5 || p.saturation !== 1) {
            img = Matrix.applycform(img, "RGB to HSL")
                .applycform(f)
                .applycform("HSL to RGB");
        }
        if (p.sigma !== 0) {
            img = Matrix.applycform(img, "RGB to HSL")
                .applycform(f2)
                .applycform("HSL to RGB");
        }

        return img;
    };
    var onChange = function () {
        change("hueSaturation", getParameters());
    };
    var onApply = function () {
        apply("hueSaturation", getParameters());
        hueSaturation.reset();
    };

    $("applyHueSat").addEventListener("click", onApply);
    $("resetHueSat").addEventListener("click", hueSaturation.reset);
    $("hue").addEventListener("change", onChange);
    $("hue_f0").addEventListener("change", onChange);
    $("hue_sigma").addEventListener("change", onChange);
    $("saturation").addEventListener("change", onChange);
};

var colorTemp = function () {
    "use strict";

    var getParameters = function () {
        return {
            tIn: $F("inputCCT"),
            tOut: $F("outputCCT")
        };
    };
    var updateParameters = function () {
        $V("inputCCTVal", Math.round(1e6 / $F("inputCCT")));
        $V("outputCCTVal", Math.round(1e6 / $F("outputCCT")));
    };
    updateParameters();

    colorTemp.reset = function () {
        $F("inputCCT", 153);
        $F("outputCCT", 153);
        updateParameters();
        updateOutput();
    };
    colorTemp.fun = function (img, p) {
        if (p.tIn !== p.tOut) {
            var t1 = Math.round(1e6 / p.tOut), t2 = Math.round(1e6 / p.tIn);
            var mat = Matrix.CIE.getIlluminantConversionMatrix(t1, t2);
            img = Matrix.applycform(img, "sRGB to LinearRGB")
                .applycform(mat)
                .applycform("LinearRGB to sRGB");
        }
        return img;
    };
    var onChange = function () {
        updateParameters();
        change("colorTemp", getParameters());
    };
    var onApply = function () {
        apply("colorTemp", getParameters());
        colorTemp.reset();
    };

    $("applyCCT").addEventListener("click", onApply);;
    $("resetCCT").addEventListener("click", colorTemp.reset);
    $("inputCCT").addEventListener("change", onChange);
    $("outputCCT").addEventListener("change", onChange);
};

var noise = function () {
    "use strict";

    noise.reset = function () {
        $F("noiseVar", 0);
        updateOutput();
    };

    var getParameters = function () {
        return {
            noise: $F("noiseVar"),
            law: $V("noiseLaw")
        };
    };
    noise.fun = function (img, p) {
        if (p.noise !== 0) {
            if (p.law === "gaussian") {
                var gNoise = Matrix.randn(img.getSize())[".*"](p.noise);
                img = img["+"](gNoise);
                return img;
            }
            if (p.law === "poisson") {
                return Matrix.poissrnd(img[".*"](p.noise * 255))["./"](p.noise * 255);
            }
        }
        return img;
    };
    var onChange = function () {
        change("noise", getParameters());
    };
    var onApply = function () {
        apply("noise", getParameters());
        noise.reset();
    };

    $("applyNoise").addEventListener("click", onApply);
    $("resetNoise").addEventListener("click", noise.reset);
    $("noiseVar").addEventListener("change", onChange);
    $("noiseLaw").addEventListener("change", onChange);
};

var filter = function () {
    "use strict";

    var getParameters = function () {
       return {
           filter: $V("filter"), 
           filter2: $V("filter2"),
           bilateral_sigmaS: $F("bilateral_sigmaS"),
           bilateral_sigmaR: $F("bilateral_sigmaR")
       };
    };
    var updateParameters = function () {
        $V("sigmaSVal", $F("bilateral_sigmaS") * 10);
        var sigmaR = 1 / (101 - $F("bilateral_sigmaR") * 100);
        $V("sigmaRVal", sigmaR.toFixed(3));
    };
    updateParameters();

    filter.reset = function () {
        $F("bilateral_sigmaS", 0);
        $F("bilateral_sigmaR", 1);
        $("filter").getElementsByTagName("option")[0].selected = "selected";
        $("filter2").getElementsByTagName("option")[0].selected = "selected";
        updateParameters();
        updateOutput();
    };

    filter.fun = function (img, p) {
        if (p.bilateral_sigmaS > 0) {
            if (p.bilateral_sigmaR === 1) {
                img = img.fastBlur(p.bilateral_sigmaS * 10);
            } else {
                img = img.imbilateral(p.bilateral_sigmaS * 10, 1 / (101 - p.bilateral_sigmaR * 100), 1.5);
            }
        }
        if (p.filter !== "none") {
            img = img.imfilter(Matrix.fspecial(p.filter));
        }
        if (p.filter2 !== "none") {
            img = img.gradient(1, 1, 1, 1, 1)[p.filter2];
        }
        return img;
    };
    var onChange = function () {
        updateParameters();
        change("filter", getParameters());
    };
    var onApply = function () {
        apply("filter", getParameters());
        filter.reset();
    };

    $("applyFilter").addEventListener("click", onApply);
    $("resetFilter").addEventListener("click", filter.reset);
    $("bilateral_sigmaS").addEventListener("change", onChange);
    $("bilateral_sigmaR").addEventListener("change", onChange);
    $("filter2").addEventListener("change", onChange);
    $("filter").addEventListener("change", onChange);
};

var geometric = function () {
    "use strict";

    geometric.reset = function () {
        $F("fullRotation", 0);
        $F("tilt", 0);
        $F("scale", 0.5);
        updateOutput();
    };

    var getParameters = function () {
       return {
           rotation: $F("fullRotation"),
           tilt: $F("tilt"),
           scale: $F("scale")
       };
    };
    var getRotation = function (t) {
        var mat = [
            [Math.cos(t),  Math.sin(t), 0],
            [-Math.sin(t), Math.cos(t), 0],
            [0,            0,           1]
        ];
        return Matrix.toMatrix(mat);
    };
    var getSkew = function (t) {
        var matX = [
            [1,            0, 0],
            [Math.tan(t),  1, 0],
            [0,            0, 1]
        ];
        matX = Matrix.toMatrix(matX).display();
        var matY = [
            [1, Math.tan(t), 0],
            [0,           1, 0],
            [0,           0, 1]
        ];
        matY = Matrix.toMatrix(matY).display();
        return matX.mtimes(matY);
    };
    var getTilt = function (t) {
        var mat = [
            [1,            0, 0],
            [Math.tan(t),  1, 0],
            [0,            0, 1]
        ];
        mat = Matrix.toMatrix(mat);
        return mat.mtimes(mat.transpose());
    };
    var getScale = function (s) {
        var mat = [
            [s, 0, 0],
            [0, s, 0],
            [0, 0, 1]
        ];
        return Matrix.toMatrix(mat);
    };
    geometric.fun = function (img, p) {
        var mat = Matrix.eye(3);
        if (p.rotation > 0 || p.tilt > 0 || p.scale !== 0.5) {
            mat = mat.mtimes(getRotation(p.rotation * Math.PI));
            mat = mat.mtimes(getTilt(p.tilt * Math.PI));
            mat = mat.mtimes(getScale(p.scale * 2));
        }
        return img.imtransform(mat);
    };
    var onChange = function () {
        change("geometric", getParameters());
    };
    var onApply = function () {
        apply("geometric", getParameters());
        geometric.reset();
    };

    $("applyGeometric").addEventListener("click", onApply);
    $("resetGeometric").addEventListener("click", geometric.reset);
    $("fullRotation").addEventListener("change", onChange);
    $("tilt").addEventListener("change", onChange);
    $("scale").addEventListener("change", onChange);
};

var sharpening = function () {
    "use strict";

    sharpening.reset = function () {
        $F("gradSharp", 0);
        $F("propSharp", 0);
        updateOutput();
    };

    var getParameters = function () {
       return {
           gradient: $F("gradSharp"),
           proportion: $F("propSharp")
       };
    };
    sharpening.fun = function (img, p) {
        var blur = img.fastBlur(p.gradient * 5);
        var grad = img['-'](blur);
        return img['+'](grad['.*'](p.proportion * 5));
    };
    var onChange = function () {
        change("sharpening", getParameters());
    };
    var onApply = function () {
        apply("sharpening", getParameters());
        sharpening.reset();
    };

    $("applySharp").addEventListener("click", onApply);
    $("resetSharp").addEventListener("click", sharpening.reset);
    $("gradSharp").addEventListener("change", onChange);
    $("propSharp").addEventListener("change", onChange);
};

var colorspace = function () {
    "use strict";
    colorspace.reset = function () {
        $("inputColorspaces").getElementsByTagName("option")[0].selected = "selected";
        $("outputColorspaces").getElementsByTagName("option")[0].selected = "selected";
        $("channels").getElementsByTagName("option")[0].selected = "selected";
        $("colormap").getElementsByTagName("option")[0].selected = "selected";
        $("stretch").getElementsByTagName("option")[0].selected = "selected";
        updateOutput();
    };

    var getParameters = function () {
        return {
            inputCs: $V("inputColorspaces"),
            outputCs: $V("outputColorspaces"),
            channels: JSON.parse($V("channels")),
            colormap: $V("colormap"),
            stretch: $V("stretch")
        };
    };
    colorspace.fun = function (img, p) {
        if (p.inputCs !== p.outputCs) {
            img = Matrix.applycform(img, p.inputCs + " to " + p.outputCs);
        }
        var min, max;
        if (p.channels.length !== 0) {
            img = img.get([], [], p.channels);
            if (p.stretch === "YES") {
                min = img.min().getDataScalar(); 
                max = img.max().getDataScalar();
                img = img["-"](min)["./"](max - min);
            }
            if (p.colormap !== "GRAY") {
                img = img.toColormap(p.colormap);
            }
        } else if (p.stretch === "YES") {
            min = img.min();
            max = img.max();
            img = img["-"](min)["./"](max["-"](min));
        }
        return img;
    };
    var onChange = function () {
        change("colorspace", getParameters());
    };
    var onApply = function () {
        apply("colorspace", getParameters());
        colorspace.reset();
    };

    $("inputColorspaces").addEventListener("change", onChange);
    $("outputColorspaces").addEventListener("change", onChange);
    $("channels").addEventListener("change", onChange);
    $("colormap").addEventListener("change", onChange);
    $("stretch").addEventListener("change", onChange);

    $("applyColorspace").addEventListener("click", onApply);
    $("resetColorspace").addEventListener("click", colorspace.reset);
};

var morphology = function () {
    "use strict";

    filter.reset = function () {
        $F("strElemSize", 0);
        $("morphOp").getElementsByTagName("option")[0].selected = "selected";
        $("strElem").getElementsByTagName("option")[0].selected = "selected";
        updateOutput();
    };

    var getParameters = function () {
       return {
           operation: $V("morphOp"),
           strElem: $V("strElem"),
           strElemSize: $F("strElemSize") 
       };
    };
    
    morphology.fun = function (img, p) {
        var s = Math.round(p.strElemSize * 12.5) * 2 + 1;
        if (s > 0) {
            var strElem;
            if (p.strElem === "square") {
  	        strElem = Matrix.ones(s, 'logical');
            } else if (p.strElem === "circle") {
                var Y = Matrix.ones(s).cumsum(0)["-"]((s >> 1) + 1);
  	        strElem = Y[".^"](2)["+"](Y.transpose()[".^"](2))[".^"](0.5)["<="](s >> 1);
            } 
            img = img[p.operation](strElem);
        }
        return img;
    };
    var onChange = function () {
        change("morphology", getParameters());
    };
    var onApply = function () {
        apply("morphology", getParameters());
        filter.reset();
    };

    $("applyMorph").addEventListener("click", onApply);
    $("resetMorph").addEventListener("click", filter.reset);
    $("morphOp").addEventListener("change", onChange);
    $("strElem").addEventListener("change", onChange);
    $("strElemSize").addEventListener("change", onChange);
};

window.onload = function () {
    "use strict";
    modules =  [
        crop,
        contrast,
        hueSaturation,
        colorTemp,
        colorBalance,
        colEn,
        noise,
        filter,
        thresholding,
        // selection,
        colorspace,
        geometric,
        morphology,
        sharpening,
        undoRedo
    ];

    var i;
    for (i in modules) {
        if (modules.hasOwnProperty(i)) {
            modules[i]();
        }
    }

    var callback = function (evt) {
        var onread = function () {
            stack = [];
            stackIt = 0;
            image = this.im2double()
            stack[0] = {image: image};
            mask = undefined;
            updateOutput(image, true);
            var legends = document.getElementsByTagName("legend");
            var evObj = document.createEvent('Events');
            evObj.initEvent("click", true, false);
            legends[1].dispatchEvent(evObj);
        };
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

    initFileUpload('loadFile', callback);
    canvas = new SuperCanvas(document.body);
    hideFieldset();
    initInputs();
    initProcess();
    document.body.onresize = updateOutput;
};

