/*global Image, Matrix, GLEffect, $, readFile */
/*exported init */

// Global variables
var IMAGE, MATRIX;

// Create and run the GLEffect
var applyEffect = function () {
    try {
        var start = new Date().getTime();
        var effect = new GLEffect($('outputCanvas'), $('shaderCode').value);
        effect.importGLImage(IMAGE);
        effect.run();
        var end = new Date().getTime();
        console.log('Run in ' + (end-start) + 'ms');
    } catch (e) {
        alert(e);
    }
};

// Callback function: process the image once loaded
var processLoadedImage = function (image) {
    IMAGE = image;
    MATRIX = Matrix.imread(image).im2double();
    MATRIX.imshow('inputCanvas');
    applyEffect();
}

// Callback function: create and display the uploaded image
var loadImageFromUrl = function () {
    var im = new Image();
    im.onload = function () {
        processLoadedImage(this);
    };
    im.src = this;
};

// Callback function: load the selected image
var fileSelectionCallback = function () {
    if (this.files.length) {
        readFile(this.files[0], loadImageFromUrl, 'url');
    }
};

// Initialize the demo
var init = function () {
    $('shaderCode').value = GLEffect.prototype.fragmentShaderCode;
    $('inputFile').addEventListener('change', fileSelectionCallback, false);
};
