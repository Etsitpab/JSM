#!/usr/bin/env node

var JSM = require('../../modules/JSM.js');
GLOBAL.Matrix = JSM.Matrix;
GLOBAL.MatrixView = JSM.MatrixView;
GLOBAL.Tools = JSM.Tools;

require('../../modules/Image.js');
require('../../modules/Linalg.js');
require('../../projects/CIE.js')
require("../../projects/colorEnhancement.js");
require("../../projects/DNGReader.js");
require("../../projects/wDenoising.js");
require("../pipe/pipe.js");
// console.log(JSM);

var fs = require('fs');
var path = require('path');

var src = process.argv[2];
var dst = process.argv[3];

var processImageFast = function (DNG, im, dirDst, name) {
    "use strict";
    var options = {
        "NOWAVDENOISE": true,
        "NONLMDENOISE": true,
        "NLMSTRENGTH": 120,
        "NOISETHRESH": 1,
        "NOGAINMAP": false,
        "MAPFACTOR": 1.0,
        "LINEARGAIN": 1.0,
        "NOSHARPEN": true,
        "NOHISTEQ": true,
        "NOAWB": true,
    };

    Tools.tic();
    var RGB = ImagePipe.developDNG(DNG, im, options);
    console.log("Image processed in", Tools.toc(), "ms");

    Tools.tic();
    var dst = path.join(dirDst, name + ".jpg");
    RGB.imwrite(dst);
    console.log("Image saved in", Tools.toc(), "ms", "as", dst);
};

var processImageFine = function (dng, im, dirDst, name) {
    "use strict";
    Tools.tic();
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
    var options = {
        "NONLMDENOISE": false,
        "NLMSTRENGTH": 120,
        "NOGAINMAP": false,
        "MAPFACTOR": 1.0 - gain / 18,
        "NOSHARPEN": false,
        "COLORENHANCEMENT": gain < 8
    };

    Tools.tic();
    var RGB = ImagePipe.developDNG(dng, im, options);
    console.log("Image processed in", Tools.toc(), "ms");

    ImagePipe.writeField(im.BlackLevel, oldValue);

    Tools.tic();
    var dst = path.join(dirDst, name + "_v2.jpg");
    RGB.imwrite(dst);
    console.log("Image saved in", Tools.toc(), "ms", "as", dst);
};

var readImage = function (src, dirDst, name) {
    fs.readFile(src, function (err, data) {
        if (err) {
            throw err;
        }
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

        var DNG = DNGReader.readDNG(new Uint8Array(data).buffer)
        var images = getImageList(DNG);
        images.forEach(function (im, i, images) {
            if (im.PhotometricInterpretation.value !== 32803) {
                return;
            }
            // processImageFast(DNG, im, dirDst, name);
            processImageFine(DNG, im, dirDst, name);
        });
    });
};

if (fs.lstatSync(src).isDirectory()) {
    var files = fs.readdirSync(src);
    var dataOut = {};
    for (var i of files) {
        if (i.slice(-4).toLowerCase() !== ".dng")  {
            continue;
        }
        readImage(path.join(src, i), src, path.parse(i).name);
    }
} else if (fs.lstatSync(src).isFile()) {
    readImage(src, path.parse(src).dir, path.parse(src).name);
}
