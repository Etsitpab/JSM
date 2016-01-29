/*global console, document, Matrix, Colorspaces, CIE, open */
/*jshint indent: 4, unused: true, white: true */

(function () {
    "use strict";
    var DNG, RAW, INFOS, DNG_BUFFERS, MEASURES = [], SC;
    var diagram = "xyY", addScatter = false;

    var parameters = {
        'bp': 64,
        'awbScales': [1.0, 1.0],
        // 'colorMatrix': [1.322, -0.3278, 0.0175, -0.6171, 1.6597, -0.0783, -0.2324, 0.3951, 0.4591],
        'colorMatrix': Matrix.eye(3).getData(),
        'saturation': 1.0,
        'gain': 1.0
    };
    window.parameters = parameters;
    function updateOutput(image, init, buffer) {
        "use strict";
        Tools.tic();
        SC.displayImage(image, buffer, init);
        console.log("Image displayed in", Tools.toc(), "ms");
        drawImageHistogram("histogram", image);
    }

    var develop = function () {
        if (!DNG) {
            return;
        }
        Tools.tic();
        var IMAGE = processRaw(DNG, RAW);
        console.log("Image processed in", Tools.toc(), "ms");
        updateOutput(IMAGE.image, false);
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
        window.SC = SC;

        SC.selectArea = function (start, end) {
            var x1 = start[0], y1 = start[1], x2 = end[0], y2 = end[1];
            var m = Math.min, M = Math.max, r = Math.round;
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
            /*
            var coefs = Matrix.polyfit(ALL.get([], 0), ALL.get([], 1).power(2), 2);
            console.log(coefs.display());
            var fit = Matrix.polyval(coefs, ALL.get([], 0)).sqrt();
            */

            var glv = ALL.get([], 0),
                std = ALL.get([], 1);
            var W = Matrix.ldivide(glv.cat(1, glv.mean(0)["./"](10)).max(1), 1);
            var coefs = Matrix.diag(W).mtimes(Matrix.toMatrix(glv).vander(2)).mldivide(Matrix.toMatrix(std).power(2).times(W));
            console.log(coefs.display());
            var fit = Matrix.polyval(coefs, glv).sqrt();

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
            var coord = [SC.canvas.width / 2, SC.canvas.height / 2], scale = parseInt(this.value);
            SC.translate(-coord[0], -coord[1]);
            var currentScaleFactor = SC.matrix.diag().display().getData();
            SC.zoom(scale / currentScaleFactor[0], scale / currentScaleFactor[1]);
            SC.translate(coord[0], coord[1]);
            SC.update();
        });

        var callbackInit = function (evt) {
            DNG_BUFFERS = DNG_BUFFERS || [];
            window.DNG_BUFFERS = DNG_BUFFERS;
        };

        $("resetBuffers").addEventListener("click", function () {
            SC.images = [];
            SC.currentBuffer = 0;
            SC.update();
            DNG_BUFFERS = [];
            $("buffers").innerHTML = "";
        });

        $("resetMeasures").addEventListener("click", function () {
            MEASURES = [];
            var p = $('plotNoise').getPlot().clear();
            $("measures").innerHTML = "";
        });

        $("measures").addEventListener("change", setMeasure);
        $("channelMeasures").addEventListener("change", setMeasure);

        $("buffersView").addEventListener("change", function () {
            SC.images = [];
            var IMAGE = DNG_BUFFERS[DNG_BUFFERS.length - 1];
            if (this.value === "PLANS") {
                for (var p of [0, 1, 2, 3]) {
                    var C = IMAGE.CFAPlans.get([], [], p);
                    C['-='](C.min())["/="](C.max());
                    // var option = addOption($("buffers"), SC.images.length, file.name + "0");
                    // option.selected = true;
                    updateOutput(C, true, p);
                }
            } else if (this.value === "CFA") {
                var C = IMAGE.CFA.getCopy();
                C['-='](C.min())["/="](C.max());
                // var option = addOption($("buffers"), SC.images.length, file.name + "0");
                // option.selected = true;
                updateOutput(C, true, 0);
            } else if (this.value === "RGB") {
                updateOutput(IMAGE.image, true, 0);
            }
        });
        var callback = function (evt, type, file) {
            var addImageBuffer = function (image, name) {
                var option = addOption($("buffers"), SC.images.length, file.name);
                option.selected = true;
                updateOutput(image, true);
            };
            if (type === "bin") {
                Tools.tic();
                var dng = readDNG(this);
                DNG = dng;
                window.DNG = dng;
                console.log("DNG read in", Tools.toc(), "ms");

                var getImageList = function (dng, images) {
                    images = images || [];
                    images.push(dng);
                    if (dng.SubIFDs !== undefined) {
                        var values = Tools.isArrayLike(dng.SubIFDs.value) ? dng.SubIFDs.value : [dng.SubIFDs.value];
                        for (var v in values) {
                            getImageList(values[v], images);
                        }
                    }
                    return images;
                };

                var images = getImageList(dng);
                images.forEach(function (im, i, images) {
                    if (im.PhotometricInterpretation.value === 32803) {
                        RAW = im;
                        window.RAW = im;
                        Tools.tic();
                        var IMAGE = ImagePipe.developDNG(dng, im);
                        var CFA = IMAGE.CFA;
                        var ny = CFA.size(0), nx = CFA.size(1);
                        IMAGE.CFAPlans = CFA.reshape(2, ny / 2, 2, nx / 2).permute([1, 3, 0, 2]).reshape(ny / 2, nx / 2 , 4);
                        IMAGE.CFA.reshape(ny, nx);
                        DNG_BUFFERS.push(IMAGE);
                        console.log("Image processed in", Tools.toc(), "ms");
                        window.IMAGE = IMAGE.image;
                        /*
                        var p = $('plotNoise').getPlot().clear();
                        var prof = IMAGE.image.mean(1).reshape(5368, 3);
                        var profGauss = IMAGE.image.mean(1).reshape(5368, 3).gaussian(7, 0);
                        var s = profGauss["-"](prof).reshape(5368, 1, 3).repmat(1, 7152, 1);

                        IMAGE.image["+="](s);
                        p.clear();
                        p.addPath(Matrix.colon(1, prof.size(0)), prof.get([], 0), {"stroke": "red"});
                        p.addPath(Matrix.colon(1, prof.size(0)), prof.get([], 1), {"stroke": "green"});
                        p.addPath(Matrix.colon(1, prof.size(0)), prof.get([], 2), {"stroke": "blue"});
                        p.addPath(Matrix.colon(1, prof.size(0)), profGauss.get([], 0), {"stroke": "black"});
                        p.addPath(Matrix.colon(1, prof.size(0)), profGauss.get([], 1), {"stroke": "black"});
                        p.addPath(Matrix.colon(1, prof.size(0)), profGauss.get([], 2), {"stroke": "black"});
                        */
                        updateOutput(IMAGE.image, true);

                        /*
                        Tools.tic();
                        var ohtaImage = Matrix.applycform(IMAGE.image, "RGB to Ohta").im2single();
                        var luminance = ohtaImage.get([], [], 0);
                        var scales = luminance.computeScaleSpace();
                        var out = Matrix.gaussianColorEnhancement(scales, 0.1, 0.04, Infinity, 0.25);
                        var gain = out['./'](luminance), gainSaturation = gain[".*"](1.3);
                        ohtaImage.set([], [], 0, ohtaImage.get([], [], 0).times(gain));
                        ohtaImage.set([], [], 1, ohtaImage.get([], [], 1).times(gainSaturation));
                        ohtaImage.set([], [], 2, ohtaImage.get([], [], 2).times(gainSaturation));
                        var image = ohtaImage.applycform("Ohta to RGB");
                        console.log("Color enhancement applied in", Tools.toc(), "ms");
                        updateOutput(image, true);
                        */
                        /*
                        Tools.tic();
                        var denoised = IMAGE.image.sqrt().wdenoise(0.5, "cdf97").power(2);
                        console.log("Wavelet denoising applied in", Tools.toc(), "ms");
                        updateOutput(denoised, true);*/
                        /*
                        RAW = CFA;
                        console.log(parameters, RAW);
                        var C = RAW.getCopy();
                        C['-='](C.min())["/="](C.max());
                        BUFFERS.push(C);
                        var option = addOption($("buffers"), SC.images.length, file.name + "0");
                        option.selected = true;
                        updateOutput(BUFFERS[0], true);*/
                        return;

                        RAW = readRAW(this).double();
                        // console.log("RAW of size", RAW.size(), "read in", Tools.toc(), "ms");
                        // Tools.tic();
                        // IMAGE = processRaw(RAW.getCopy(), parameters);
                        // console.log("Image processed in", Tools.toc(), "ms");
                        var C1 = RAW.get([], [], 0);//,
                            /*C2 = RAW.get([], [], 1),
                            C3 = RAW.get([], [], 2),
                            C4 = RAW.get([], [], 3);*/

                        C1['-='](C1.min())["/="](C1.max());
                        /*C2['-='](C2.min())["/="](C2.max());
                        C3['-='](C3.min())["/="](C3.max());
                        C4['-='](C4.min())["/="](C4.max());*/
                        BUFFERS.push(C1);
                        /*BUFFERS.push(C2);
                        BUFFERS.push(C3);
                        BUFFERS.push(C4);*/
                        var option = addOption($("buffers"), SC.images.length, file.name + "0");
                        option.selected = true;
                        updateOutput(BUFFERS[0], true);
                        /*var option = addOption($("buffers"), SC.images.length, file.name + "1");
                        updateOutput(BUFFERS[1], true);
                        var option = addOption($("buffers"), SC.images.length, file.name + "2");
                        updateOutput(BUFFERS[2], true);
                        var option = addOption($("buffers"), SC.images.length, file.name + "3");
                        updateOutput(BUFFERS[3], true);*/
                   } else {
                   }
                });
                return;
            } else if (type === "url") {
                Tools.tic();
                var image = new Image();
                image.src = this;
                console.log(this);
                image.onload = function (evt) {
                    Matrix.imread(this, function () {
                        IMAGE = this.im2double();
                        BUFFERS.push(IMAGE);
                        console.log("Image processed in", Tools.toc(), "ms");
                        addImageBuffer(IMAGE, file.name);
                    });
                }
                return;
            } else {
                return;
            }
            addImageBuffer(IMAGE, file.name);
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
        return;
        var glv = Matrix.toMatrix([
                0.0011819154024124146,
                0.011310584843158722,
                0.046297885477542877,
                0.12497371435165405,
                0.16532610356807709,
                0.19624066352844238,
                0.26719647645950317,
                0.35253793001174927,
                0.40119442343711853,
                0.54355931282043457,
                0.66823941469192505,
                0.89584565162658691
            ]),
            std = Matrix.toMatrix([
                0.0030973609536886215,
                0.0048409318551421165,
                0.0085341725498437881,
                0.013085655868053436,
                0.015321914106607437,
                0.01649029552936554,
                0.019927067682147026,
                0.022173978388309479,
                0.024384701624512672,
                0.027702733874320984,
                0.030221376568078995,
                0.031410649418830872
            ]);
        var scatterProperties = {
            'stroke': 'none',
            'marker': {
                'shape':  'circle',
                'fill':   'red',
                'stroke': 'none'
            }
        };



        Matrix.fgls = function (x, y, name) {
            var beta = x.mldivide(y);
            console.log(beta.size(), x.size(), y.size());
            var epsh = x["*"](beta)["-="](y)['.^'](2);
            return coefs;
        };
        var x = Matrix.linspace(0, 256, 256)["./"](256);

        var a = 10;
        var W = Matrix.ldivide(glv.cat(1, glv.mean(0)["./"](a)).max(1), 1);

        var coefs = Matrix.diag(W).mtimes(glv.vander(2)).mldivide(std['.^'](2)['.*'](W));
        console.log(coefs.getData());
        var fit = Matrix.polyval(coefs, x).abs().sqrt();

        var p = $('plotNoise').getPlot().clear();
        p.addPath(glv.getData(), std.getData(), scatterProperties);
        p.addPath(x.getData(), fit.getData(), {'stroke': "black"});

        var coefs = Matrix.fgls(glv.vander(2), std['.^'](2));
        console.log(coefs.getData());
        var fit = Matrix.polyval(coefs, x).abs().sqrt();

        p.addPath(x.getData(), fit.getData(), {'stroke': "blue"});



        var coefs = glv.vander(2).mldivide(std['.^'](2));
        console.log(coefs.getData());
        var fit = Matrix.polyval(coefs, x).abs().sqrt();

        p.addPath(x.getData(), fit.getData(), {'stroke': "red"});


    };
})();
