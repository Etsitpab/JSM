#!/usr/bin/env node
/*
var JSM = require('../../modules/JSM.js');
GLOBAL.Matrix = JSM.Matrix;
GLOBAL.MatrixView = JSM.MatrixView;
GLOBAL.Tools = JSM.Tools;

require('../../modules/Image.js');
*/
var fs = require('fs'),
    Canvas = require('canvas'),
    Image = Canvas.Image;

var src = process.argv[2];
/*
var write = function (canvas, name) {
    var data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)
    // console.log(data.constructor);
    // data = new Uint8ClampedArray(data);
    // data = canvas.getContext('2d').createImageData(canvas.width, canvas.height);
    var canvasOut = new Canvas(canvas.width, canvas.height);
    canvasOut.getContext('2d').putImageData(data, 0, 0);

    var out = fs.createWriteStream(name),
        stream = canvasOut.syncJPEGStream();
    stream.on('data', function (chunk) {
        console.log("Write chunk for ", name)
        out.write(chunk);
    });
    stream.on('end', function () {
        console.log("End stream for", name)
    });
};*/
/*var write2 = function (data, width, height, name) {
    var canvasOut = new Canvas(width, height);
    canvasOut.getContext('2d').putImageData(data, 0, 0);

    var out = fs.createWriteStream(name),
        stream = canvasOut.syncJPEGStream();
    stream.on('data', function (chunk) {
        console.log("Write chunk for", name)
        out.write(chunk);
    });
    stream.on('end', function () {
        console.log("End stream for", name)
    });
};
*/
/*
(function () {
    "use strict";
    var write = function (canvasOut, name) {
        var out = fs.createWriteStream(name),
            stream = canvasOut.syncJPEGStream();
        stream.on('data', function (chunk) {
            console.log("Write chunk for", name)
            out.write(chunk);
        });
        stream.on('end', function () {
            console.log("End stream for", name)
        });
    };
    write(new Canvas(500, 500), "out11.jpg");
    write(new Canvas(500, 500), "out21.jpg");
})();*/

(function () {
    "use strict";
    var out, stream;
    out = fs.createWriteStream("test1.jpg");
    stream = new Canvas(500, 500).syncJPEGStream();
    stream.on('data', function (chunk) {
        console.log("Write chunk for", "test1.jpg")
        out.write(chunk);
    });
    stream.on('end', function () {
        console.log("End stream for", "test1.jpg")
    });
    out = fs.createWriteStream("test2.jpg");
    stream = new Canvas(500, 500).syncJPEGStream();
    stream.on('data', function (chunk) {
        console.log("Write chunk for", "test2.jpg")
        out.write(chunk);
    });
    stream.on('end', function () {
        console.log("End stream for", "test2.jpg")
    });
})();

/*
Matrix.imread(src, function () {
    // var data = this.getImageData(),
    var width = this.size(1), height = this.size(0);
    data = new Canvas(width, height).getContext('2d').createImageData(width, height);

    write2(data, width, height, "out11.jpg");
    write2(data, width, height, "out21.jpg");
    // this.imwrite("out1.jpg");
    // this.imwrite("out2.jpg");
});

fs.readFile(src, function (err, data) {
     if (err) {
         throw err;
     }
    var img = new Image();
    img.src = data;
    var width = img.width, height = img.height;
    var canvasIn = new Canvas(width, height);
    var ctx = canvasIn.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);
    var data = canvasIn.getContext('2d').getImageData(0, 0, width, height);

    write2(data, width, height, "out12.jpg");
    write2(data, width, height, "out22.jpg");
    // write(canvasIn, 'out1.jpg');
    // write(canvasIn, 'out2.jpg');
});
*/
