/*global Image, Matrix, GLEffect, $, readFile */
/*jslint vars: true, nomen: true, browser: true */
/*exported init */


// Global variables
'use strict';
var IMAGE, VIDEO, MATRIX;
var SRC;
var TIMER;

// Create and run the GLEffect
var applyEffect = function () {
    try {
        var effect = new GLEffect($('outputCanvas'), $('shaderCode').value);
        var start = new Date().getTime();
        effect.importGLImage(SRC);
        effect.run();
        var end = new Date().getTime();
        $('outputFPS').value = 'Run in ' + (end-start) + 'ms';  // Load image + run effect
    } catch (e) {
        window.alert(e);
    }
};

// Reset input to 1x1 pixel
var resetInputs = function () {
    var image = $('inputCanvas');
    image.width = '1';
    image.height = '1';
    var video = $('inputVideo');
    video.width = '1';
    video.height = '1';
};

// Callback function: process the image once loaded
var processLoadedImage = function (image) {
    resetInputs();
    SRC = IMAGE = image;
    MATRIX = Matrix.imread(image).im2double();
    MATRIX.imshow('inputCanvas');
    applyEffect();
};

// Callback function: process a frame of the VIDEO
var processVideoFrame = function () {
    SRC = VIDEO;
    applyEffect();
    if (VIDEO.paused && TIMER) {
        clearInterval(TIMER);
        TIMER = null;
    }
};

// Callback function: create and display the uploaded image
var loadImageFromUrl = function () {
    var im = new Image();
    im.onload = function () {
        processLoadedImage(this);
    };
    im.src = this;
};

// Callback function: TODO: doc
var loadVideoFromUrl = function () {
    var video = $('inputVideo');
    video.src = this;
    var runEffectLoop = function () {
        if (!TIMER) {
            TIMER = setInterval(processVideoFrame, 1);
        }
    };
    video.onloadedmetadata = function () {
        resetInputs();
        video.width = video.videoWidth;
        video.height = video.videoHeight;
    };
    video.oncanplaythrough = function () {
        video.ontimeupdate = runEffectLoop;
        runEffectLoop();
    };
    VIDEO = video;
    video.load();
};

// Callback function: load the selected image
var fileSelectionCallback = function () {
    if (this.files.length) {
        var file = this.files[0];
        var type = file.type.split('/')[0];
        switch (type) {
        case 'image':
            readFile(this.files[0], loadImageFromUrl, 'url');
            break;
        case 'video':
            readFile(this.files[0], loadVideoFromUrl, 'url');
            break;
        default:
            throw new Error('Unknown data type: ' + type);
        }
    }
};

// Initialize the demo
var init = function () {
    var shaderCode = GLEffect.prototype.fragmentShaderCode;
    if (typeof formatSourceCode !== 'undefined') {
        shaderCode = formatSourceCode(shaderCode);
    }
    $('shaderCode').value = shaderCode;
    $('inputFile').addEventListener('change', fileSelectionCallback, false);
};
