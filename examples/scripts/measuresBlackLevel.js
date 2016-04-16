#!/usr/bin/env node

var JSM = require('../../modules/JSM.js');
GLOBAL.Matrix = JSM.Matrix;
GLOBAL.MatrixView = JSM.MatrixView;
GLOBAL.Tools = JSM.Tools;

require('../../modules/Image.js');
require('../../modules/Linalg.js');
require("../../projects/colorEnhancement.js");
require("../../projects/DNGReader.js");
require("../../projects/wDenoising.js");
require("../pipe/pipe.js");
// console.log(JSM);

var fs = require('fs')
    path = require('path');

var src = process.argv[2];
var dst = process.argv[3];

var getExifData = function (exif, dng) {
    var data = {};
    for (var f in exif) {
        var v = ImagePipe.readField(exif[f]);
        if (f === "ISOSpeedRatings") {
            data["gain"] = ((4/15) + (11/750) * v).toFixed(4);
        } else if (f === "ExposureTime") {
            data["time"] = (v * 1e3).toFixed(4);
        }
    }
    return data;
};

var processImage = function (DNG, im, name) {
    "use strict";
    var CFA = ImagePipe.reshapeCFA(im);

    var Gb = CFA.get([0, 2, -1], [0, 2, -1]),
        B  = CFA.get([0, 2, -1], [1, 2, -1]),
        R  = CFA.get([1, 2, -1], [0, 2, -1]),
        Gr = CFA.get([1, 2, -1], [1, 2, -1]);

    var GrMean = Gr.mean(),
        BMean = B.mean(),
        RMean = R.mean(),
        GbMean = Gb.mean();

    var GrBlur = Gr.fastBlur(50, 50, 10),
        BBlur  = B.fastBlur(50, 50, 10),
        RBlur  = R.fastBlur(50, 50, 10),
        GbBlur = Gb.fastBlur(50, 50, 10);

    var ysel = Matrix.linspace(0, CFA.size(0) / 2 - 1, 5).round(),
        xsel = Matrix.linspace(0, CFA.size(1) / 2 - 1, 5).round();

    var GrMap = GrBlur.get(ysel, xsel),
        BMap = BBlur.get(ysel, xsel),
        RMap = RBlur.get(ysel, xsel),
        GbMap = GbBlur.get(ysel, xsel);

    var correctedGr = Gr["-="](GrMean),
        correctedB  = B["-="](BMean),
        correctedR  = R["-="](RMean),
        correctedGb = Gb["-="](GbMean);

    var corrected = Matrix.zeros(CFA.size());
    corrected.set([0, 2, -1], [0, 2, -1], correctedGr);
    corrected.set([1, 2, -1], [0, 2, -1], correctedB);
    corrected.set([0, 2, -1], [1, 2, -1], correctedR);
    corrected.set([1, 2, -1], [1, 2, -1], correctedGb);

    var profV = corrected.mean(1).gaussian(140, 0);
    var correctedV = Matrix.bsxfun("minus", corrected, profV);
    // var profVresidual = correctedV.mean(1);

    var profH = correctedV.mean(0).gaussian(0, 140);
    // var correctedVH = Matrix.bsxfun("minus", correctedV, profH);
    // var profHresidual = correctedVH.mean(0);

    return {
        "exif": getExifData(DNG["ExifTag"].value, DNG),
        "mean": {
            "Gr": GrMean.getDataScalar(),
            "B": BMean.getDataScalar(),
            "R": RMean.getDataScalar(),
            "Gb": GbMean.getDataScalar()
        },
        "profiles": {
            "horizontal": Array.prototype.slice.call(profH.fliplr().getData()),
            "vertical": Array.prototype.slice.call(profV.flipud().getData())
        },
        "maps": {
            "Gr": Array.prototype.slice.call(GrMap.fliplr().flipud().getData()),
            "B": Array.prototype.slice.call(BMap.fliplr().flipud().getData()),
            "R": Array.prototype.slice.call(RMap.fliplr().flipud().getData()),
            "Gb": Array.prototype.slice.call(GbMap.fliplr().flipud().getData())
        }
    };
};

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

var files = fs.readdirSync(src);
var dataOut = {};
for (var i of files) {
    if (i.slice(-4).toLowerCase() !== ".dng")  {
        continue;
    }
    var file = path.join(src, i);
    var data = fs.readFileSync(file);
    var DNG = DNGReader.readDNG(new Uint8Array(data).buffer)
    var images = getImageList(DNG);
    images.forEach(function (im, n, images) {
        if (im.PhotometricInterpretation.value !== 32803) {
            return;
        }
        console.log("Process image", i);
        dataOut[i] = processImage(DNG, im, i);
    });
}
fs.writeFile(path.join(src, "BlackLevelMeasures.json"), JSON.stringify(dataOut, null, 4), function(err) {
    if (err) {
        return console.log(err);
    }
});

// var p2 = $('plotSVG').getPlot().clear();
// for (var n in d) {prof = d[n].profiles.vertical; p2.addPath(Matrix.colon(1, prof.length), prof, {"stroke": "red"})}
// p = $('plotNoise').getPlot().clear();
// for (var n in d) {prof = d[n].profiles.horizontal; p.addPath(Matrix.colon(1, prof.length), prof, {"stroke": "red"})}
