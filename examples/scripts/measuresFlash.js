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
        } else if (f === "Flash") {
            data["flash"] = v !== 32;
        } else if (f === "FlashEnergy") {
            data["pulse"] = v;
        }
    }
    for (var f in dng) {
        if (f.value === undefined) {
            continue;
        }
        var v = ImagePipe.readField(dng[f]);
        if (f === "SubjectDistance") {
            data["distance"] = v;
        }
    }
    return data;
};


var processImage = function (DNG, im, name) {
    "use strict";
    var CFA = ImagePipe.reshapeCFA(im);
    var data = getExifData(DNG["ExifTag"].value, DNG);
    var mean = CFA.mean().getDataScalar();
    // Image is too over exposed
    if (mean > 400) {
        return;
    }
    console.log(data.gain + ", " + data.time * 1000 + ", " + data.pulse + ", " + mean.toFixed(6) + ", " + i);
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
        processImage(DNG, im, i);
    });
}
