#!/usr/bin/env node


var JSM = require('../../modules/JSM.js');


GLOBAL.Matrix = JSM.Matrix;
GLOBAL.Tools = JSM.Tools;
require('../../modules/Image.js');
require("../../projects/colorEnhancement.js");


var src = "/home/mazin/Images/NZ - 2015/koalichat/GOPR1899.JPG";
Matrix.imread(src, function () {
    var scales;
    console.log("Read !");
    var space = "Opponent", channel = 0;
    this.imwrite("00 - original.jpg");
    var image = Matrix.applycform(this.im2double(), "RGB to " + space);
    if (!scales) {
        Tools.tic();
        scales = image.get([], [], channel).computeScaleSpace();
        console.log("Scalespace time", Tools.toc());
    }
    var bin = 2048;
    USE_CST = false;
    var w     = 0.01, 
        gamma = 0.5,
        alpha = 0.0,
        nIter = 1,
        K = Infinity;
    Tools.tic();
    var lut = getLUT(K, w, gamma, [bin, bin], nIter);
    console.log("LUT time", Tools.toc());
    console.log("gamma =", gamma, "w = ", w, "alpha", alpha, "nIter", nIter, "bin", bin, "USE_CST", USE_CST);

    var out = Matrix.gaussianColorEnhancementLUT(scales, lut, alpha);
    out = image.set([], [], channel, out).applycform(space + " to RGB");
    out.imwrite("01 - output.jpg");
    out["-="](out.min())["/="](out.max());
    out.imwrite("01 - output_norm.jpg");
});
// console.log(JSM);
