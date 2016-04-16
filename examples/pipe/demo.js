/*global console, document, Matrix, Colorspaces, CIE, open */
/*jshint indent: 4, unused: true, white: true */

(function () {
    "use strict";
    var SC, IMAGE_BUFFERS = {"length": 0}, CURRENT_BUFFER;

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

    var initPlot = function () {
        'use strict';
        var diagram = "xyY", addScatter = false;
        var plotProperties = {
            'ticks-display': false,
            'preserve-ratio': true
        };
        var plot1 = new Plot('plot1', [$('plot1Container').clientWidth - 20, $('plot1Container').clientHeight - 20], 'plot1Container');//, plotProperties);
        //plot.addChromaticityDiagram(diagram).setXLabel().setYLabel().setTitle();
        //plot.remove("Standards illuminants");
        //plot.remove("Spectrum locus");

        var plot2 = new Plot('plot2', [$('plot2Container').clientWidth - 20, $('plot2Container').clientHeight - 20], 'plot2Container');//.setXLabel("Mean").setYLabel("Std.");
        $S("plot1Container").display = "none";
        $S("plot2Container").display = "none";
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

            var p = $('plot1Container').getPlot();
            if (!addScatter) {
                while (p.remove('scatter')) {
    	        // Do nothing
                }
            }
            p.addChromaticitiesFromRgb(points[0], points[1], points[2], {}, diagram, [0.3457, 0.3585, 1]);
        };

        SC = new SuperCanvas(document.body);
        window.SC = SC;

        SC.bufferChange = function (newBuffer) {
            // Activate option of newly selected buffer
            for (var name in IMAGE_BUFFERS) {
                if (name === "length") {
                    continue;
                }
                if (IMAGE_BUFFERS[name].buffer === newBuffer) {
                    if (IMAGE_BUFFERS[name].type === "dng") {
                      displayExifData(IMAGE_BUFFERS[name].data["ExifTag"].value, IMAGE_BUFFERS[name].data);
                    }
                    CURRENT_BUFFER = name;
                    IMAGE_BUFFERS[name].option.selected = true;
                    break;
                }
            }
        };
        SC.selectArea = function (start, end) {
            var image = IMAGE_BUFFERS[CURRENT_BUFFER];
            var CFA = image.CFA;
            if (!(CFA instanceof Matrix)) {
                console.log("Measures are only done on CFA data, use View CFA function beforehand.")
                return;
            }
            var x1 = start[0], y1 = start[1], x2 = end[0], y2 = end[1];
            var m = Math.min, M = Math.max, r = Math.round, f = Math.floor, c = Math.ceil;
            y1 = f(M(m(y1, y2), 0) / 2) * 2;
            y2 = c(m(M(y1, y2), CFA.getSize(0) - 1) / 2) * 2;
            x1 = f(M(m(x1, x2), 0) / 2) * 2;
            x2 = c(m(M(x2, x2), CFA.getSize(1) - 1) / 2) * 2;

            window.patch = CFA.get([y1, y2 - 1], [x1, x2 - 1]);
            var patch = CFA.get([y1, y2 - 1], [x1, x2 - 1]).reshape(2, (y2 - y1) / 2, 2, (x2 - x1) / 2);
            patch = patch.permute([1, 3, 0, 2]).reshape((y2 - y1) * (x2 - x1) / 4, 4);

            image.measures.push({
                    "patch": patch,
                "mean":  patch.mean(0).getData(),
                "std":   patch.std(0).getData(),
                "min":   patch.min(0).getData(),
                "max":   patch.max(0).getData(),
                "coordinates": [x1, y1 - 1, x2, y2 - 1]
                });
            console.log("Measure done !", image.measures[image.measures.length - 1]);
            /*
                var option = addOption($("measures"), MEASURES.length - 1, MEASURES.length - 1);
                option.selected = true;
            setMeasure();
            plotScatter(x1, y1, x2, y2);
            plot2();
            if ($V("Shift+click") === "wb") {
                parameters.awbScales = scales;
                $V("awbScalesVal", parameters.awbScales[0].toFixed(4) + ", " + parameters.awbScales[1].toFixed(4));
            }*/
        };
    };

    var displayExifData = function (exif, dng) {
        var data = {}, out = "";
        var S, p, t, d;
        for (var f in exif) {
            data[f] = ImagePipe.readField(exif[f]);
            if (f === "FNumber") {
                out += "FNumber:   " + data[f] + "<br>";
            } else if (f === "ISOSpeedRatings") {
                out += "ISO Speed: " + data[f] + "<br>";
                out += "Gain: " + ((4/15) + (11/750) * data[f]).toFixed(2) + "<br>";
                S = (4/15) + (11/750) * data[f];
            } else if (f === "ExposureTime") {
                out += "Exp. Time: " + (data[f] * 1e3).toFixed(2) + "ms<br>";
                t = data[f] * 1e3;
            } else if (f === "Flash") {
                out += "Flash: " + (data[f] === 0x0020 ? "No" : "Yes") + "<br>";
            } else if (f === "FlashEnergy") {
                out += "Flash energy: " + data[f] + "us<br>";
                p = data[f];
            } else if (f === "DateTimeOriginal") {
                out += "Date: " + data[f] + "<br>";
            } else if (f === "BodySerialNumber") {
                out += "Serial: " + data[f] + "<br>";
            }
        }

        for (var f in dng) {
            if (f === "ImageData" || dng[f].value === undefined) {
                continue;
            }
            data[f] = ImagePipe.readField(dng[f]);
            if (f === "SubjectDistance") {
                out += "Distance:   " + data[f] + "m<br>";
                d = data[f];
            }
        }
        out += "Size:   " + data["ImageWidth"] + "x" + data["ImageLength"] + "<br>";
        t = t * 1e3;
        if (p && d && p > 0 && d > 0) {
            out += "EV:       " + Math.round(S * (t + 2634 * p / (d * d))) + "<br>";
            out += "log EV:   " + Math.log2(Math.round(S * (t + 2634 * p / (d * d)))).toFixed(2) + "<br>";
        } else if (p === 0 || d === 0) {
            out += "EV:       " + Math.round(S * t) + "<br>";
            out += "log EV:   " + Math.log2(Math.round(S * (t))).toFixed(2) + "<br>";
        }
        $("ExifData").innerHTML = out;
        return data;
    };

    var setImageBuffer = function (name) {
        CURRENT_BUFFER = name;
        var image = IMAGE_BUFFERS[name],
            type = IMAGE_BUFFERS[name].type;
        if (image === undefined) {
            return;
        }
        SC.clear();
        if (type === "dng") {
            var dng = image.data, images = getImageList(dng);
            if (dng["ExifTag"] !== undefined) {
                displayExifData(dng["ExifTag"].value, dng);
            }
            if (image.canvas !== undefined) {
              SC.displayImage(image.canvas, image.buffer, undefined);
            }
        } else if (type === "jpeg" || type === "png") {
            SC.displayImage(image.data, image.buffer, undefined);
            image.data = SC.getCanvas();
        }
    };

    var initUI = function () {
        $S("rawMeasures", "display", "none");
        $S("ui", "top", 10);

        $("buffers").addEventListener("change", function () {
            setImageBuffer(this.value, IMAGE_BUFFERS[this.value].type);
        });

        $("computeHistogram").addEventListener("click", function () {
            drawImageHistogram("histogram", SC.getCanvas());
        });

        $("zoomFactor").addEventListener("click", function () {
            var scale = parseInt(this.value);
            if (this.value === "fit") {
                SC.autoView();
            } else {
                var coord = [SC.canvas.width / 2, SC.canvas.height / 2];
                SC.translate(-coord[0], -coord[1]);
                var currentScaleFactor = SC.matrix.diag().getData();
                SC.zoom(scale / currentScaleFactor[0], scale / currentScaleFactor[1]);
                SC.translate(coord[0], coord[1]);
            }
            SC.update();
        });
        $("resetBuffers").addEventListener("click", function () {
            SC.buffers = [];
            SC.currentBuffer = 0;
            SC.update();
            IMAGE_BUFFERS     = {"length": 0};
            $("buffers").innerHTML = "";
        });
    };

    var initImageFunctions = function () {
        var getCFA = function (buffer) {
            var dng = IMAGE_BUFFERS[buffer].data,
                buffer = IMAGE_BUFFERS[buffer].buffer,
                images = getImageList(dng);
            var data = {
                "dng": dng,
                "buffer": buffer
            };
            images.forEach(function (im, i, images) {
                if (im.PhotometricInterpretation.value !== 32803) {
                    return;
                }
                data.image = im;
            });
            return data;
        };
        var actions = {
            "none" : function (buffer) {
                $S("plot1Container").display = "none";
                $S("plot2Container").display = "none";
            },
            "Fast develop (~4s)" : function (name) {
                var dng = IMAGE_BUFFERS[name].data,
                    buffer = IMAGE_BUFFERS[name].buffer,
                    images = getImageList(dng);

                var options = {
                    // "CUSTUMCM": Matrix.toMatrix([2.482000000000007, -0.3672000000000005, -0.16319999999999923, -0.0899999999999992, 1.8100000000000007, -0.5700000000000003, -0.8967000000000023, -0.6588000000000014, 2.0618000000000034]).reshape(3, 3),
                    // "CUSTUMCM": Matrix.toMatrix([2.10, -0.44, -0.36, -0.36, 1.44, -0.60, -0.44, -0.56, 2.16]).reshape(3, 3),
                    // "CUSTUMCM": Matrix.toMatrix([2.4283856000000106, -0.40721440000000353, -0.6407344000000041, -0.6672400000000008, 1.0487600000000032, -0.6672400000000009, -0.10693200000000268, 0.3272279999999997, 2.8517880000000106]).reshape(3, 3),
                    // "CUSTUMCM": Matrix.toMatrix([2.8070, -0.5875, -0.4807, -0.7470, 1.6019, -0.5105, -0.6137, -0.5741, 2.6658]).reshape(3, 3)
                };

                images.forEach(function (im, i, images) {
                    if (im.PhotometricInterpretation.value !== 32803) {
                        return;
                    }
                    Tools.tic();
                    var RGB = ImagePipe.developDNG(dng, im, options);
                    console.log("Image processed in", Tools.toc(), "ms");
                    SC.displayImage(RGB, buffer, undefined);
                    IMAGE_BUFFERS[name].canvas = SC.getCanvas();
                });
            },
            "Develop (~1m30)": function (name) {
                var dng = IMAGE_BUFFERS[name].data,
                    buffer = IMAGE_BUFFERS[name].buffer,
                    images = getImageList(dng);
                images.forEach(function (im, i, images) {
                    if (im.PhotometricInterpretation.value !== 32803) {
                        return;
                    }
                    var iso = ImagePipe.readField(dng.ExifTag.value.ISOSpeedRatings);
                    var gain = (4 / 15) + (11 / 750) * iso;
                    var oldValue = ImagePipe.readField(im.BlackLevel);
                    var newValue = [
                        parseFloat((oldValue[0] + gain - 1).toFixed(2)),
                        parseFloat((oldValue[1] + gain - 1).toFixed(2)),
                        parseFloat((oldValue[2] + gain - 1).toFixed(2)),
                        parseFloat((oldValue[3] + gain - 1).toFixed(2))
                    ];
                    ImagePipe.writeField(im.BlackLevel, newValue);
                    var options = {};
                    Tools.tic();
                    var RGB = ImagePipe.developDNG(dng, im, options);
                    console.log("Image processed in", Tools.toc(), "ms");
                    SC.displayImage(RGB, 0);

                    // var CM = Matrix.toMatrix([2.7604, -0.4556, -0.6834, -0.9500, 1.1200, -0.6700, -0.1529, 0.3058, 3.0302]).reshape(3, 3);
                    var CM = Matrix.toMatrix([1.7225298000000082, -0.7537902000000027, -0.4884702000000011, -0.36797000000000024, 1.588030000000004, -0.6019700000000011, 0.11467499999999775, -0.03544500000000317, 2.733435000000009]).reshape(3, 3)
                    var sat = Math.pow((11 - gain - 1) / 11, 2) / 2 + 0.5;
                    console.log("Saturation correction", sat);
                    CM = ImagePipe.saturateColorMatrix(CM, sat, sat);

                    Tools.tic();
                    options = {
                        "NONLMDENOISE": false,
                        "NLMSTRENGTH": 120,
                        "NOGAINMAP": false,
                        "MAPFACTOR": 1.0 - gain / 18,
                        "NOSHARPEN": false,
                        "TONECURVE": true,
                        "GAMMACURVE": "REC709",
                    //    "CUSTUMCM": CM,
                        "COLORENHANCEMENT": gain < 8
                    };
                    var RGB = ImagePipe.developDNG(dng, im, options);
                    console.log("Image processed in", Tools.toc(), "ms");
                    SC.displayImage(RGB, 1);
                    ImagePipe.writeField(im.BlackLevel, oldValue);
                });
            },
            "View CFA" : function (name) {
                var dng = IMAGE_BUFFERS[name].data,
                    buffer = IMAGE_BUFFERS[name].buffer,
                    images = getImageList(dng);
                images.forEach(function (im, i, images) {
                    if (im.PhotometricInterpretation.value !== 32803) {
                        return;
                    }
                    Tools.tic();
                    var CFA = ImagePipe.reshapeCFA(dng, im);
                    IMAGE_BUFFERS[name].CFA = CFA;
                    CFA = ImagePipe.blackAndWhiteLevels(CFA.getCopy(), dng);
                    console.log("Image processed in", Tools.toc(), "ms");
                    SC.displayImage(CFA, buffer, undefined);
                    IMAGE_BUFFERS[name].canvas = SC.getCanvas();
                });
            },
            "Adjust contrast" : function (name) {
                var dng = IMAGE_BUFFERS[name].data,
                    buffer = IMAGE_BUFFERS[name].buffer,
                    images = getImageList(dng);
                images.forEach(function (im, i, images) {
                    if (im.PhotometricInterpretation.value !== 32803) {
                        return;
                    }
                    Tools.tic();
                    var options = {};
                    var RGB = ImagePipe.developDNG(dng, im, options);
                    console.log("Image processed in", Tools.toc(), "ms");
                    SC.displayImage(RGB, 0, undefined);

                    Tools.tic();
                    RGB.imadjust(0.0001);
                    SC.displayImage(RGB, 1, undefined);
                    IMAGE_BUFFERS[name].canvas = SC.getCanvas();
                });
            },
            "Compute black image profile": function (buffer) {
                var data = getCFA(buffer);
                var dng = data.dng,
                    CFA = ImagePipe.reshapeCFA(dng, data.image);

                var BlackLevel = ImagePipe.readField(dng.BlackLevel);
                // CFA = CFA.get([0, 2, -1], [0, 2, -1]);
                console.log("Black level from DNG:", BlackLevel);
                var Gb = CFA.get([0, 2, -1], [0, 2, -1]),
                    B  = CFA.get([0, 2, -1], [1, 2, -1]),
                    R  = CFA.get([1, 2, -1], [0, 2, -1]),
                    Gr = CFA.get([1, 2, -1], [1, 2, -1]);
                Gr.mean().display("Gr mean");
                R.mean().display("R mean");
                B.mean().display("B mean");
                Gb.mean().display("Gb mean");
                Gr.std().display("Gr std");
                R.std().display("Gr std");
                B.std().display("Gr std");
                Gb.std().display("Gb std");

                var prof = CFA.mean(1).reshape();
                var profL = prof.gaussian(140, 0);
                var mean = prof.mean();
                // CFA.set(Matrix.bsxfun("minus", CFA, profL));
                prof["-="](profL["-"](mean));
                window.prof = prof;
                $S("plot1Container").display = "";
                $S("plot2Container").display = "";
                var p = $('plot2').getPlot().clear();
                var p2 = $('plot1').getPlot().clear();
                p2.addPath(Matrix.colon(1, prof.size(0)), prof.get([], 0), {"stroke": "red"});
                p2.addPath(Matrix.colon(1, profL.size(0)), profL.get([], 0), {"stroke": "blue"});
                // p2.setAxis([0, 60, 2560, 85]);
                var proffft = prof.fft().abs().fftshift().fliplr();
                p.addPath(Matrix.colon(1, proffft.size(0)), proffft.get([], 0), {"stroke": "red"});
                p.setAxis([0, 0, 5368, 500]);

                CFA = CFA["-="](70)["/="](50)["+="](0.5);
                //CFA = CFA["/="](50)["+="](0.5);
                SC.setImageBuffer(CFA, data.buffer);
                SC.update(data.buffer);
            },
            "Compute black level map" : function (buffer) {
                var data = getCFA(buffer);
                var dng = data.dng,
                    CFA = ImagePipe.reshapeCFA(dng, data.image);

                var Gb = CFA.get([0, 2, -1], [0, 2, -1]),
                    B  = CFA.get([0, 2, -1], [1, 2, -1]),
                    R  = CFA.get([1, 2, -1], [0, 2, -1]),
                    Gr = CFA.get([1, 2, -1], [1, 2, -1]);

                var GrBlur = Gr.fastBlur(25, 25, 10),
                    BBlur  = B.fastBlur(25, 25, 10),
                    RBlur  = R.fastBlur(25, 25, 10),
                    GbBlur = Gb.fastBlur(25, 25, 10);

                // var GrBlur = Gr.gaussian(50, 50),
                    // BBlur  = B.gaussian(50, 50),
                    // RBlur  = R.gaussian(50, 50),
                    // GbBlur = Gb.gaussian(50, 50);

                var GrMean = GrBlur.mean(),
                    BMean = BBlur.mean(),
                    RMean = RBlur.mean(),
                    GbMean = GbBlur.mean();

                var correctedGr = Gr["-="](GrBlur)["+="](GrMean),
                    correctedB  = B["-="](BBlur)["+="](BMean),
                    correctedR  = R["-="](RBlur)["+="](RMean),
                    correctedGb = Gb["-="](GbBlur)["+="](GbMean);

                var ysel = Matrix.linspace(0, CFA.size(0) / 2 - 1, 5).round(),
                    xsel = Matrix.linspace(0, CFA.size(1) / 2 - 1, 5).round();

                GrMean.display("Gr mean");
                BMean.display("B mean");
                RMean.display("R mean");
                GbMean.display("Gb mean");

                console.warn("Maps are rotated to match sensor orientation !")
                GrBlur.get(ysel, xsel).fliplr().flipud().display("Gr map");
                BBlur.get(ysel, xsel).fliplr().flipud().display("B map");
                RBlur.get(ysel, xsel).fliplr().flipud().display("R map");
                GbBlur.get(ysel, xsel).fliplr().flipud().display("Gb map");

                var CFABlurred = Matrix.zeros(CFA.size());
                CFABlurred.set([0, 2, -1], [0, 2, -1], GrBlur);
                CFABlurred.set([1, 2, -1], [0, 2, -1], BBlur);
                CFABlurred.set([0, 2, -1], [1, 2, -1], RBlur);
                CFABlurred.set([1, 2, -1], [1, 2, -1], GbBlur);

                var corrected = Matrix.zeros(CFA.size());
                corrected.set([0, 2, -1], [0, 2, -1], correctedGr);
                corrected.set([1, 2, -1], [0, 2, -1], correctedB);
                corrected.set([0, 2, -1], [1, 2, -1], correctedR);
                corrected.set([1, 2, -1], [1, 2, -1], correctedGb);

                SC.displayImage(CFA["./"](128), 0);
                SC.displayImage(CFABlurred["./"](128), 1);
                SC.displayImage(corrected["./"](128), 2);

                var prof = corrected.mean(1).reshape();
                var profL = CFABlurred.mean(1).reshape();

                $S("plot1Container").display = "";
                $S("plot2Container").display = "";
                var p2 = $('plot1').getPlot().clear()
                    .addPath(Matrix.colon(1, prof.size(0)), prof.get([], 0), {"stroke": "red"})
                    .addPath(Matrix.colon(1, profL.size(0)), profL.get([], 0), {"stroke": "blue"});

                var proffft = prof.fft().abs().fftshift().fliplr();
                var p = $('plot2').getPlot().clear()
                    .addPath(Matrix.colon(1, proffft.size(0)), proffft.get([], 0), {"stroke": "red"})
                    .setAxis([0, 0, 5368, 500]);
            },
            "Compute black level data for DNG" : function (buffer) {
                $S("plot1Container").display = "";
                $S("plot2Container").display = "";
                var data = getCFA(buffer),
                    CFA = ImagePipe.reshapeCFA(data.dng, data.image);

                var Gb = CFA.get([0, 2, -1], [0, 2, -1]),
                    B  = CFA.get([0, 2, -1], [1, 2, -1]),
                    R  = CFA.get([1, 2, -1], [0, 2, -1]),
                    Gr = CFA.get([1, 2, -1], [1, 2, -1]);

                var GrMean = Gr.mean().display("Gr mean"),
                    BMean = B.mean().display("B mean"),
                    RMean = R.mean().display("R mean"),
                    GbMean = Gb.mean().display("Gb mean");
                Gr.std().display("Gr std");
                R.std().display("R std");
                B.std().display("B std");
                Gb.std().display("Gb std");

                var correctedGr = Gr["-="](GrMean),
                    correctedB  = B["-="](BMean),
                    correctedR  = R["-="](RMean),
                    correctedGb = Gb["-="](GbMean);

                var corrected = Matrix.zeros(CFA.size());
                corrected.set([0, 2, -1], [0, 2, -1], correctedGr);
                corrected.set([1, 2, -1], [0, 2, -1], correctedB);
                corrected.set([0, 2, -1], [1, 2, -1], correctedR);
                corrected.set([1, 2, -1], [1, 2, -1], correctedGb);

                var profV = corrected.mean(1).gaussian(140 * corrected.size(1) / 7152, 0);
                var correctedV = Matrix.bsxfun("minus", corrected, profV);
                var profV2 = correctedV.mean(1);

                var profH = correctedV.mean(0).gaussian(0, 140 * corrected.size(0) / 5368);
                var correctedVH = Matrix.bsxfun("minus", correctedV, profH);
                var profH2 = correctedVH.mean(0);

                var CFAMean = CFA.mean().getDataScalar();
                SC.displayImage(corrected["+"](CFAMean)["./"](CFAMean * 2), 0);
                //SC.displayImage(correctedV["+"](CFAMean)["./"](CFAMean[".*"](2)), 2);
                //SC.displayImage(correctedVH["+"](CFAMean)["./"](CFAMean[".*"](2)), 3);
                //SC.displayImage(CFA["./"](CFAMean[".*"](2)), 0);
                console.log("CFA global mean", CFAMean);
                var p1 = $('plot1').getPlot().clear()
                    .addPath(Matrix.colon(1, profV2.numel()), profV2["+"](CFAMean), {"stroke": "red"})
                    .addPath(Matrix.colon(1, profV.numel()), profV["+"](CFAMean), {"stroke": "blue"});
                p1.setAxis([0, CFAMean - 4, profV2.numel(), CFAMean + 4]);
                var p2 = $('plot2').getPlot().clear()
                    .addPath(Matrix.colon(1, profH2.numel()), profH2["+"](CFAMean), {"stroke": "red"})
                    .addPath(Matrix.colon(1, profH.numel()), profH["+"](CFAMean), {"stroke": "blue"});
                p2.setAxis([0, CFAMean - 3,  profH2.numel(), CFAMean + 3]);
            },
            "Test pedestal bug fix" : function (buffer) {
                  var dng = IMAGE_BUFFERS[buffer].data,
                      images = getImageList(dng);

                  images.forEach(function (im, i, images) {
                      if (im.PhotometricInterpretation.value !== 32803) {
                          return;
                      }
                      var iso = ImagePipe.readField(dng.ExifTag.value.ISOSpeedRatings);
                      var gain = (4 / 15) + (11 / 750) * iso;
                      var oldValue = ImagePipe.readField(im.BlackLevel);
                      var newValue = [
                          parseFloat((oldValue[0] + gain - 1).toFixed(2)),
                          parseFloat((oldValue[1] + gain - 1).toFixed(2)),
                          parseFloat((oldValue[2] + gain - 1).toFixed(2)),
                          parseFloat((oldValue[3] + gain - 1).toFixed(2))
                      ];
                      var userValue = window.prompt("New blackLevel value ?", "[" + newValue + "]");
                      if (userValue === null) {
                          return;
                      }
                      var userValue = eval(userValue);
                      if (userValue !== undefined) {
                          newValue = Tools.isArrayLike(userValue) ? userValue : [userValue, userValue, userValue, userValue];
                      }
                      var options = {};

                      console.log("Old BlackLevel value:", ImagePipe.readField(im.BlackLevel));
                      Tools.tic();
                      var RGB = ImagePipe.developDNG(dng, im, options);
                      console.log("Image processed in", Tools.toc(), "ms");
                      SC.displayImage(RGB, 0);

                      ImagePipe.writeField(im.BlackLevel, newValue);
                      console.log("New BlackLevel value:", ImagePipe.readField(im.BlackLevel));
                      Tools.tic();
                      var RGB = ImagePipe.developDNG(dng, im, options);
                      console.log("Image processed in", Tools.toc(), "ms");
                      SC.displayImage(RGB, 1);

                      ImagePipe.writeField(im.BlackLevel, oldValue);
                  });
            },
            "Test custom color matrix" : function (buffer) {
                var dng = IMAGE_BUFFERS[buffer].data,
                images = getImageList(dng);

                images.forEach(function (im, i, images) {
                    if (im.PhotometricInterpretation.value !== 32803) {
                        return;
                    }
                    var oldValue = im.BlackLevel;
                    var iso = ImagePipe.readField(dng.ExifTag.value.ISOSpeedRatings);
                    var gain = (4 / 15) + (11 / 750) * iso;
                    var _BlackLevel = im.BlackLevel.value;
                    var newBlackLevel = [
                        parseFloat((_BlackLevel[0] + gain - 1).toFixed(2)),
                        parseFloat((_BlackLevel[1] + gain - 1).toFixed(2)),
                        parseFloat((_BlackLevel[2] + gain - 1).toFixed(2)),
                        parseFloat((_BlackLevel[3] + gain - 1).toFixed(2))
                    ];
                    im.BlackLevel.value = newBlackLevel;
                    im.BlackLevel.type = "LONG";

                    var CM = Matrix.toMatrix([2.2487667793554644, -0.38466426797036285, -0.3305283133344476, -0.610950519543035, 1.7654483438833015, -0.675921245425138, -0.2792743017103192, -0.6383721400294416, 2.7200140728934974]).reshape(3, 3);
                    var newValue = CM.getData().toString();
                    var userValue = window.prompt("Please enter the new color matrix values ?", "[" + newValue + "]").replace("\n", "");
                    var userValue = eval(userValue);
                    if (userValue !== undefined) {
                        newValue = newValue;
                    }
                    CM = Matrix.toMatrix(userValue).reshape(3, 3);
                    var options = {};

                    Tools.tic();
                    var RGB = ImagePipe.developDNG(dng, im, options);
                    console.log("Image processed in", Tools.toc(), "ms");
                    SC.displayImage(RGB, 0);

                    Tools.tic();
                    var RGB = ImagePipe.developDNG(dng, im, {"CUSTUMCM": CM});
                    console.log("Image processed in", Tools.toc(), "ms");
                    SC.displayImage(RGB, 1);
                    global.CUSTUMCM = undefined;
                    im.BlackLevel = oldValue;
                });
            },
            "Test lens shading correction" : function (buffer) {
                var dng = IMAGE_BUFFERS[buffer].data,
                images = getImageList(dng);

                images.forEach(function (im, i, images) {
                    if (im.PhotometricInterpretation.value !== 32803) {
                        return;
                    }
                    var oldValue = im.BlackLevel.value;
                    var iso = ImagePipe.readField(dng.ExifTag.value.ISOSpeedRatings);
                    var gain = (4 / 15) + (11 / 750) * iso;
                    var _BlackLevel = im.BlackLevel.value;

                    var correction = 1 - gain / 18;
                    var userValue = window.prompt("Please enter the wished lens shading correction ?", correction.toFixed(2)).replace("\n", "");
                    if (userValue === null) {
                        return;
                    }
                    var userValue = eval(userValue);
                    if (userValue !== undefined) {
                        correction = userValue;
                    }
                    var options = {};

                    Tools.tic();
                    var RGB = ImagePipe.developDNG(dng, im, options);
                    console.log("Image processed in", Tools.toc(), "ms");
                    SC.displayImage(RGB, 0);

                    options["MAPFACTOR"] = correction;
                    Tools.tic();
                    var RGB = ImagePipe.developDNG(dng, im, options);
                    console.log("Image processed in", Tools.toc(), "ms");
                    SC.displayImage(RGB, 1);
                });
            },
            "Compare REC709 vs sRGB" : function (name) {
                var dng = IMAGE_BUFFERS[name].data,
                    buffer = IMAGE_BUFFERS[name].buffer,
                    images = getImageList(dng);

                images.forEach(function (im, i, images) {
                    if (im.PhotometricInterpretation.value !== 32803) {
                        return;
                    }
                    Tools.tic();
                    var REC709 = ImagePipe.developDNG(dng, im, {"GAMMACURVE": "sRGB"});
                    console.log("Image processed in", Tools.toc(), "ms");
                    SC.displayImage(REC709, 0, undefined);
                    Tools.tic();
                    var sRGB = ImagePipe.developDNG(dng, im, {"GAMMACURVE": "REC709"});
                    console.log("Image processed in", Tools.toc(), "ms");
                    SC.displayImage(sRGB, 1, undefined);
                });
            },
            "Apply linear gain" : function (buffer) {
                var dng = IMAGE_BUFFERS[buffer].data,
                    images = getImageList(dng);

                var iso = ImagePipe.readField(dng.ExifTag.value.ISOSpeedRatings);
                var gain = (4 / 15) + (11 / 750) * iso;
                var estimation = (1.45 - (gain / 26.6666)).toFixed(2);
                var userValue = window.prompt("Linear gain to apply ?", estimation);
                // Cancel action
                if (userValue === null) {
                  return;
                }
                var options = {};
                images.forEach(function (im, i, images) {
                    if (im.PhotometricInterpretation.value !== 32803) {
                        return;
                    }
                    Tools.tic();
                    var RGB = ImagePipe.developDNG(dng, im, options);
                    console.log("Image processed in", Tools.toc(), "ms");
                    SC.displayImage(RGB, 0);
                    options["LINEARGAIN"] = parseFloat(userValue);
                    Tools.tic();
                    var RGB = ImagePipe.developDNG(dng, im, options);
                    console.log("Image processed in", Tools.toc(), "ms");
                    SC.displayImage(RGB, 1);
                });
            },
            "Apply NLM denoise": function (name) {
                var dng = IMAGE_BUFFERS[name].data,
                    buffer = IMAGE_BUFFERS[name].buffer,
                    images = getImageList(dng);
                images.forEach(function (im, i, images) {
                    if (im.PhotometricInterpretation.value !== 32803) {
                        return;
                    }
                    // var iso = ImagePipe.readField(dng.ExifTag.value.ISOSpeedRatings);
                    // var gain = (4 / 15) + (11 / 750) * iso;
                    // var estimation = parseFloat((70 - (gain - 1) * 5).toFixed(2));
                    var estimation = 120;
                    var userValue = window.prompt("Denoising strength max = 0, min = 300 ?", estimation);
                    // Cancel action
                    if (userValue === null) {
                        return;
                    }
                    var userValue = eval(userValue);

                    var options = {};
                    Tools.tic();
                    var RGB = ImagePipe.developDNG(dng, im, options);
                    console.log("Image processed in", Tools.toc(), "ms");
                    SC.displayImage(RGB, 2);

                    options["NONLMDENOISE"] = false;
                    options["NLMSTRENGTH"] = userValue !== undefined ? userValue : estimation;
                    Tools.tic();
                    var RGBDenoise = ImagePipe.developDNG(dng, im, options);
                    console.log("Image processed in", Tools.toc(), "ms");
                    SC.displayImage(RGBDenoise, 0);
                    IMAGE_BUFFERS[name].canvas = SC.getCanvas();

                    var diff = RGB["-="](RGBDenoise)["*="](8)["+="](0.5);
                    SC.displayImage(diff, 1);
                    SC.update(0);
                });
            },
            "Plot Raw histogram": function (buffer) {
                $S("plot1Container").display = "";
                var data = getCFA(buffer);
                var dng = data.dng,
                CFA = ImagePipe.reshapeCFA(dng, data.image);
                CFA = CFA.uint16();
                var wl = ImagePipe.readField(dng.WhiteLevel);
                var hist = CFA.imhist(65536).get([0, 1023]);
                var p = $('plot1').getPlot().clear();
                p.addHistogram(Matrix.colon(0, hist.size(0) - 1), hist, {"stroke": "blue"});
            },
            "Apply histogram equalization" : function (buffer) {
                var dng = IMAGE_BUFFERS[buffer].data,
                    images = getImageList(dng);

                var iso = ImagePipe.readField(dng.ExifTag.value.ISOSpeedRatings);
                var gain = (4 / 15) + (11 / 750) * iso;
                var estimation = (1.45 - (gain / 26.6666)).toFixed(2);
                // var userValue = window.prompt("Percentage to apply ?", 0.1);

                images.forEach(function (im, i, images) {
                    if (im.PhotometricInterpretation.value !== 32803) {
                        return;
                    }
                    var options = {};
                    Tools.tic();
                    var RGB = ImagePipe.developDNG(dng, im, options);
                    console.log("Image processed in", Tools.toc(), "ms");
                    SC.displayImage(RGB, 0);

                    options["NOHISTEQ"] = false;
                    Tools.tic();
                    var RGB = ImagePipe.developDNG(dng, im, options);
                    console.log("Image processed in", Tools.toc(), "ms");
                    SC.displayImage(RGB, 1);
                });
            },
            "Compute CFA stats" : function (name) {
                var dng = IMAGE_BUFFERS[name].data,
                    buffer = IMAGE_BUFFERS[name].buffer,
                    images = getImageList(dng);
                images.forEach(function (im, i, images) {
                    if (im.PhotometricInterpretation.value !== 32803) {
                        return;
                    }
                    var iso = ImagePipe.readField(dng.ExifTag.value.ISOSpeedRatings);
                    var gain = (4 / 15) + (11 / 750) * iso;
                    var CFA = ImagePipe.reshapeCFA(dng, im);
                    CFA = ImagePipe.blackAndWhiteLevels(CFA, dng);
                    var mean = CFA.mean().getDataScalar();
                    console.log(name,
                        "gain", parseFloat(gain.toFixed(2)),
                        "ratio", parseFloat((mean / gain).toFixed(5)),
                        "mean", parseFloat(mean.toFixed(2)),
                        "std", parseFloat(CFA.std().getDataScalar().toFixed(2)),
                        "min", parseFloat(CFA.min().getDataScalar().toFixed(2)),
                        "max", parseFloat(CFA.max().getDataScalar().toFixed(2))
                    );
                });
            },
            "Compute color matrix" : function (name) {
                var dng = IMAGE_BUFFERS[name].data,
                    buffer = IMAGE_BUFFERS[name].buffer,
                    images = getImageList(dng);
                images.forEach(function (im, i, images) {
                    if (im.PhotometricInterpretation.value !== 32803) {
                        return;
                    }
                    var iso = ImagePipe.computeColorMatrix(dng);
                });
            },
            "Get colorchecker values": function (name) {colorchecker
                var measures = IMAGE_BUFFERS[name].measures;
                var getColorchecker = function (measures) {
                    var colorchecker = [];
                    var concat = function(v, i, t) {
                        colorchecker = colorchecker.concat(Array.prototype.slice.call(t[i].mean));
                    };
                    measures.forEach(concat);
                    colorchecker = Matrix.toMatrix(colorchecker).reshape(4, 24).transpose().display();

                    var Gr = colorchecker.get([], 0);
                    var R  = colorchecker.get([], 1);
                    var B  = colorchecker.get([], 2);
                    var Gb = colorchecker.get([], 3);
                    var G  = Gr['+'](Gb)['/='](2);

                    // var scaleR = G.get(20)['./'](R.get(20))['+'](G.get(21)['./'](R.get(21)))['.*'](0.5).display();
                    // var scaleB = G.get(20)['./'](B.get(20))['+'](G.get(21)['./'](B.get(21)))['.*'](0.5).display();
                    var scaleR = G.get(18)['./'](R.get(18))['+'](G.get(19)['./'](R.get(19)))['.*'](0.5).display();
                    var scaleB = G.get(18)['./'](B.get(18))['+'](G.get(19)['./'](B.get(19)))['.*'](0.5).display();

                    R['*='](scaleR);
                    B['*='](scaleB);
                    return  R.cat(1, G, B);
                };
                var sRGBPatches = Matrix.toMatrix([
                    115,  82,  68,  //  1. Dark skin
                    194, 150, 130,  //  2. Light Skin
                     98, 122, 157,  //  3. Blue Sky
                     87, 108,  67,  //  4. Foliage
                    133, 128, 177,  //  5. Blue flower
                    103, 189, 170,  //  6. Bluish green
                    214, 126,  44,  //  7. Orange
                     80,  91, 166,  //  8. Purplish blue
                    193,  90,  99,  //  9. Moderate red
                     94,  60, 108,  // 10. Purple
                    157, 188,  64,  // 11. Yellow green
                    224, 163,  46,  // 12. Orange yellow
                     56,  61, 150,  // 13. Blue
                     70, 148,  73,  // 14. Green
                    175,  54,  60,  // 15. Red
                    231, 199,  31,  // 16. Yellow
                    187,  86, 149,  // 17. Magenta
                      8, 133, 161,  // 18. Cyan
                    243, 243, 243,  // 19. White
                    200, 200, 200,  // 20. Neutral 8
                    160, 160, 160,  // 21. Neutral 6.5
                    122, 122, 122,  // 22. Neutral 5
                     85,  85,  85,  // 23. Neutral 3.5
                     52,  52,  52   // 24. Black 1.50
                ]).reshape(3, 24).transpose()['/='](255);
                var linearPatches = Matrix.Colorspaces['sRGB to LinearRGB'](new Float64Array(sRGBPatches.getData()), 24, 24, 1);
                var XYZPatches = Matrix.Colorspaces['RGB to XYZ'](new Float64Array(sRGBPatches.getData()), 24, 24, 1);
                // sRGBPatches = Matrix.bsxfun("rdivide", sRGBPatches, sRGBPatches.mean(1));

                var colorchecker = getColorchecker(measures);
                // colorchecker['/='](colorchecker.max());
                // colorchecker = Matrix.bsxfun("rdivide", colorchecker, colorchecker.mean(1));
                var M = sRGBPatches.transpose().mrdivide(colorchecker.transpose()).display("sRGB to cRGB");
            },
            /*"Correct row noise": function (buffer) {
                if (RGB_BUFFERS[CURRENT_BUFFER] === undefined) {
                    return;
                }
                var RGB = RGB_BUFFERS[CURRENT_BUFFER].data;
                var prof = RGB.mean(1);
                var profL = prof.gaussian(7, 0);
                prof = Matrix.bsxfun("minus", prof, profL);
                prof.set([], [], [0, 1], 0);
                prof.set(prof[">="](0.1), 0);
                RGB = Matrix.bsxfun("minus", RGB, prof);
                var p = $('plot2').getPlot().clear();
                var p2 = $('plot1').getPlot().clear();
                p2.addPath(Matrix.colon(1, prof.size(0)), prof.get([], [], 0), {"stroke": "red"});
                p2.addPath(Matrix.colon(1, prof.size(0)), prof.get([], [], 1), {"stroke": "green"});
                p2.addPath(Matrix.colon(1, prof.size(0)), prof.get([], [], 2), {"stroke": "blue"});
                // p2.addPath(Matrix.colon(1, profL.size(0)), profL.get([], 0)["+="](mean), {"stroke": "blue"});
                // p2.addHistogram(Matrix.colon(1, hist.size(0)), hist.get([], 0));
                // var proffft = prof.fft().abs().fftshift().fliplr();
                // Tools.tic();
                // window.imfft = RGB.fft2();
                // console.log(Tools.toc(), "ms");
                // p.addPath(Matrix.colon(1, proffft.size(0)), proffft.get([], 0), {"stroke": "red"});
                // p.setAxis([0, 0, 2560, 500]);
                //p2.addHistogram(Matrix.colon(1, 256), RGB.imhist(256), {"stroke": "red"});
                SC.displayImage(RGB, 0, undefined);
            }*/
        };

        for (var f in actions) {
            addOption("imfuncs", f, f);
        }
        $("imfuncs").addEventListener("change", function () {
            Tools.tic();
            if ($("applyFunction").checked) {
                for (var b in IMAGE_BUFFERS) {
                    if (b === "length" || IMAGE_BUFFERS[b].type !== "dng") {
                      continue;
                    }
                    actions[this.value](b);
                }
                $("applyFunction").checked = false;
            } else {
                actions[this.value](CURRENT_BUFFER);
            }
            console.log("Actions", this.value, "applied in", Tools.toc(), "ms");
        });
    };

    window.onload = function () {
        "use strict";
        initInputs();
        initSuperCanvas();
        initPlot();
        initUI();
        initImageFunctions();

        var addImageBuffer = function (image, name, type) {
            type = type.toLowerCase();
            var option = addOption($("buffers"), name, name);
            option.selected = true;
            IMAGE_BUFFERS[name] = {
                "data": image,
                "name": name,
                "type": type,
                "buffer": IMAGE_BUFFERS.length++,
                "option": option,
                "measures": []
            };
            CURRENT_BUFFER = name;
            setImageBuffer(CURRENT_BUFFER, type);
        };

        var callbackInit = function (evt) {
            IMAGE_BUFFERS         = IMAGE_BUFFERS || {"length": 0};
            window.IMAGE_BUFFERS  = IMAGE_BUFFERS;
        };

        var callbackEnd = function (evt) {
            setImageBuffer(CURRENT_BUFFER, "dng");
        };

        var callback = function (evt, type, file) {
            if (type === "bin") {
                if (DNGReader.isDNG(this)) {
                    Tools.tic();
                    var dng = DNGReader.readDNG(this);
                    /*
                    // Set calibration 1 to A illuminant
                    ImagePipe.writeField(dng.CalibrationIlluminant1, 17);
                    var CM1 = Matrix.toMatrix([0.5778048000000022, -0.44363519999999973, -0.5588351999999998, 0.06745999999999922, 1.2634599999999991, -0.8925399999999994, 0.562122000000004, 0.3377220000000041, 4.206922000000033]).reshape(3, 3);

                    // Set calibration 1 to CWF illuminant
                    // ImagePipe.writeField(dng.CalibrationIlluminant1, 14);
                    // var CM1 = Matrix.toMatrix([1.950648400000006, -0.5823516000000002, -0.42143159999999946, -0.5677599999999998, 1.0002400000000002, -0.5197599999999993, 0.4163460000000029, 0.628866000000005, 2.9021860000000244]).reshape(3, 3);

                    // Set calibration 1 to D65 illuminant
                    ImagePipe.writeField(dng.CalibrationIlluminant2, 21);
                    var CM2 = Matrix.toMatrix([1.7735944000000168, -0.4436856000000022, -0.28624560000000066, -0.2749899999999992, 1.1130100000000005, -0.3109899999999991, 0.21094769999999957, 0.17170769999999946, 1.6192277000000006]).reshape(3, 3);

                    // Compute sRGB -> ProPhoto -> XYZ matrices
                    var PPH2XYZ = Matrix.Colorspaces.getXYZTransform(false, Matrix.CIE.getIlluminant("D50"), Matrix.CIE.getPrimaries("Pro Photo"));
                    var sRGB2PPH = Matrix.toMatrix([2.034289, -0.727308, -0.306981, -0.228925, 1.231717, -0.002792, -0.008469, -0.153326, 1.161795]).reshape(3, 3).transpose();
                    CM1 = PPH2XYZ["*"](sRGB2PPH.inv())["*"](CM1).inv().display();
                    CM2 = PPH2XYZ["*"](sRGB2PPH.inv())["*"](CM2).inv().display();

                    ImagePipe.writeField(dng.ColorMatrix1, CM1.transpose().getData());
                    ImagePipe.writeField(dng.ColorMatrix2, CM2.transpose().getData());
                    */
                    console.log("DNG read in", Tools.toc(), "ms");
                    addImageBuffer(dng, file.name, "dng");
                } else {
                    console.warn("Unknown file: ", file.name);

                    var dng = {"ProcessingSoftware":{"tag":11,"type":"ASCII","count":5,"value":"eXom\u0000"},"NewSubfileType":{"tag":254,"type":"LONG","count":1,"value":0},"ImageWidth":{"tag":256,"type":"SHORT","count":1,"value":7152},"ImageLength":{"tag":257,"type":"SHORT","count":1,"value":5368},"BitsPerSample":{"tag":258,"type":"SHORT","count":1,"value":10},"Compression":{"tag":259,"type":"SHORT","count":1,"value":1},"PhotometricInterpretation":{"tag":262,"type":"SHORT","count":1,"value":32803},"ImageDescription":{"tag":270,"type":"ASCII","count":14,"value":"eXom Snapshot\u0000"},"Make":{"tag":271,"type":"ASCII","count":9,"value":"senseFly\u0000"},"Model":{"tag":272,"type":"ASCII","count":5,"value":"eXom\u0000"},"StripOffsets":{"tag":273,"type":"LONG","count":1,"value":624750},"Orientation":{"tag":274,"type":"SHORT","count":1,"value":3},"SamplesPerPixel":{"tag":277,"type":"SHORT","count":1,"value":1},"RowsPerStrip":{"tag":278,"type":"SHORT","count":1,"value":5368},"StripByteCounts":{"tag":279,"type":"LONG","count":1,"value":47989920},"PlanarConfiguration":{"tag":284,"type":"SHORT","count":1,"value":1},"Software":{"tag":305,"type":"ASCII","count":5,"value":"eXom\u0000"},"CFARepeatPatternDim":{"tag":33421,"type":"SHORT","count":2,"value":[2,2]},"CFAPattern":{"tag":33422,"type":"BYTE","count":4,"value":[1,0,2,1]},"ExifTag":{"tag":34665,"type":"LONG","count":1,"value":{"ExposureTime":{"tag":33434,"type":"RATIONAL","count":1,"value":{"numerator":[200],"denominator":[100000]}},"FNumber":{"tag":33437,"type":"RATIONAL","count":1,"value":{"numerator":[240000],"denominator":[100000]}},"ISOSpeedRatings":{"tag":34855,"type":"SHORT","count":1,"value":97},"ExifVersion":{"tag":36864,"type":"UNDEFINED","count":4,"value":[48,50,50,48]},"DateTimeOriginal":{"tag":36867,"type":"ASCII","count":20,"value":"2016:03:24 16:30:35\u0000"},"DateTimeDigitized":{"tag":36868,"type":"ASCII","count":20,"value":"2016:03:24 16:30:35\u0000"},"ApertureValue":{"tag":37378,"type":"RATIONAL","count":1,"value":{"numerator":[4294967295],"denominator":[1700257408]}},"MaxApertureValue":{"tag":37381,"type":"RATIONAL","count":1,"value":{"numerator":[4294967295],"denominator":[1700257408]}},"Flash":{"tag":37385,"type":"SHORT","count":1,"value":32},"FocalLength":{"tag":37386,"type":"RATIONAL","count":1,"value":{"numerator":[802000],"denominator":[100000]}},"ColorSpace":{"tag":40961,"type":"SHORT","count":1,"value":1},"FocalPlaneXResolution":{"tag":41486,"type":"RATIONAL","count":1,"value":{"numerator":[714285693],"denominator":[100000]}},"FocalPlaneYResolution":{"tag":41487,"type":"RATIONAL","count":1,"value":{"numerator":[714285693],"denominator":[100000]}},"FocalPlaneResolutionUnit":{"tag":41488,"type":"SLONG","count":1,"value":3},"SensingMethod":{"tag":41495,"type":"SHORT","count":1,"value":2},"CustomRendered":{"tag":41985,"type":"SHORT","count":1,"value":0},"DigitalZoomRatio":{"tag":41988,"type":"RATIONAL","count":1,"value":{"numerator":[0],"denominator":[1]}},"FocalLengthIn35mmFilm":{"tag":41989,"type":"SHORT","count":1,"value":25},"SceneCaptureType":{"tag":41990,"type":"SHORT","count":1,"value":1},"SubjectDistanceRange":{"tag":41996,"type":"SHORT","count":1,"value":3},"BodySerialNumber":{"tag":42033,"type":"ASCII","count":12,"value":"EX-01-09573\u0000"}}},"SubjectDistance":{"tag":37382,"type":"SRATIONAL","count":1,"value":{"numerator":[0],"denominator":[100]}},"DNGVersion":{"tag":50706,"type":"BYTE","count":4,"value":[1,4,0,0]},"DNGBackwardVersion":{"tag":50707,"type":"BYTE","count":4,"value":[1,4,0,0]},"UniqueCameraModel":{"tag":50708,"type":"ASCII","count":14,"value":"senseFly eXom\u0000"},"CFAPlaneColor":{"tag":50710,"type":"BYTE","count":3,"value":[0,1,2]},"CFALayout":{"tag":50711,"type":"SHORT","count":1,"value":1},"BlackLevelRepeatDim":{"tag":50713,"type":"SHORT","count":2,"value":[2,2]},"BlackLevel":{"tag":50714,"type":"LONG","count":4,"value":[63,64,64,64]},"WhiteLevel":{"tag":50717,"type":"LONG","count":1,"value":1023},"DefaultScale":{"tag":50718,"type":"RATIONAL","count":2,"value":{"numerator":[1,1],"denominator":[1,1]}},"ColorMatrix1":{"tag":50721,"type":"SRATIONAL","count":9,"value":{"numerator":[2147483647,-703945152,-499075200,-1325212160,2147483647,-168147968,37580964,848470784,985909760],"denominator":[1624420224,2147483647,2147483647,2147483647,1293898624,2147483647,2147483647,2147483647,2147483647]}},"ColorMatrix2":{"tag":50722,"type":"SRATIONAL","count":9,"value":{"numerator":[2147483647,-47888884,-1054199744,-2147483647,2147483647,-1301804544,495853984,268220704,399431968],"denominator":[1782291968,2147483647,2147483647,1969445760,841622400,2147483647,2147483647,2147483647,2147483647]}},"BayerGreenSplit":{"tag":50733,"type":"LONG","count":1,"value":0},"CalibrationIlluminant1":{"tag":50778,"type":"SHORT","count":1,"value":21},"CalibrationIlluminant2":{"tag":50779,"type":"SHORT","count":1,"value":14}};
                    var file = new Matrix([7728, 5368], new Uint16Array(this)).fliplr().flipud();
                    file = file.get([288, 7439]).permute([0, 1])["/="](64);
                    dng.ImageData = file.getData();
                    addImageBuffer(dng, file.name, "dng");
                    window.LAST_FILE = file.getData();
                }
            } else if (type === "url") {
                Tools.tic();
                var image = new Image();
                image.src = this;
                image.onload = function (evt) {
                    addImageBuffer(image, file.name, "png");
                };
            } else {
                return;
            }
        };
        initFileUpload("loadFile", callback, callbackInit, callbackEnd);
    };
})();












/*


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

    var plot2 = function () {
        var p = $('plot2Container').getPlot().clear();
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

            // var coefs = Matrix.polyfit(ALL.get([], 0), ALL.get([], 1).power(2), 2);
            // console.log(coefs.display());
            // var fit = Matrix.polyval(coefs, ALL.get([], 0)).sqrt();


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

    $("resetMeasures").addEventListener("click", function () {
        MEASURES = [];
        var p = $('plot2Container').getPlot().clear();
        $("measures").innerHTML = "";
    });

    $("measures").addEventListener("change", setMeasure);
    $("channelMeasures").addEventListener("change", setMeasure);
    */
