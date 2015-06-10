/*global GLEffect, FileReader, Uint8Array, Float32Array, Float64Array */
/*jslint vars: true, nomen: true, browser: true, plusplus: true */
/*exported init */

'use strict';


// Global variables
var REDUCER;
var IMAGE;
var CLICKED;

// Shortcut for 'getElementById'
function $(str) {
    return window.document.getElementById(str);
}

// Remove all the children of a node
function removeAllChildren(elmt) {
    while (elmt.lastChild) {
        elmt.removeChild(elmt.lastChild);
    }
}

// Sum all the values of an array
function sumAll(array) {
    var sum, k, n = array.length;
    for (sum = 0, k = 0; k < n; ++k) {
        sum += array[k];
    }
    return sum;
}

// Convert an array to a float array
function toFloatArray(array, OutType) {
    OutType = OutType || Float32Array;
    var out = new OutType(array);
    var k, n = out.length;
    for (k = 0; k < n; ++k) {
        out[k] /= 255;
    }
    return out;
}

// Sum of an image's values
function imageSum(im) {
    var c = document.createElement('canvas');
    c.width = im.width;
    c.height = im.height;
    var ctx = c.getContext('2d');
    ctx.drawImage(im, 0, 0, im.width, im.height);
    return sumAll(ctx.getImageData(0, 0, im.width, im.height).data);
}

// The time, in ms
function theTime() {
    return new Date().getTime();
}

// Relative error
function display(str, ref, t, value) {
    t = theTime() - t;
    console.log('[' + t + 'ms] ' + str);
    if (ref) {
        console.log(Math.abs(value / ref - 1));
    }
}

// Create and run the GLEffect
function runEffect() {
    var sum = imageSum(IMAGE);
    var im = new GLEffect.Image(IMAGE);
    console.log('--- Precision ---')
    display('Manual, Float32', sum, theTime(),
        255 * sumAll(toFloatArray(im.toArray(Uint8Array), Float32Array)));
    display('Manual, Float64', sum, theTime(),
        255 * sumAll(toFloatArray(im.toArray(Uint8Array), Float64Array)));
    display('GLImage, Uint8', sum, theTime(),
        sumAll(im.toArray(Uint8Array)));
    display('GLImage, Float32', sum, theTime(),
        255 * sumAll(im.toArray(Float32Array)));
    display('Reducer, GPU', sum, theTime(),
        255 * sumAll(REDUCER.run(im, {'maxIterCPU': 0})));
    display('Reducer, CPU', sum, theTime(),
        255 * sumAll(REDUCER.run(im, {'maxIterCPU': Infinity})));
    display('Reducer, hybrid', sum, theTime(),
        255 * sumAll(REDUCER.run(im)));
    console.log('--- Number of CPU operations ---')
    var iterCPU;
    for (iterCPU = 1; iterCPU <= im.width * im.height; iterCPU *= 2) {
        display(iterCPU, null, theTime(),
            255 * sumAll(REDUCER.run(im, iterCPU)));
    }
}

// Callback function: load the image
function loadImageFromUrl() {
    var im = new Image();
    im.onload = function () {
        IMAGE = im;
        var container = $('content');
        removeAllChildren(container);
        container.appendChild(im);
        runEffect();
    };
    im.src = this;
}

// Callback function: handle the selected file
function fileSelectionCallback() {
    if (this.files.length) {
        var file = this.files[0];
        var type = file.type.match(new RegExp('^[^/]*'))[0];
        if (type !== 'image') {
            throw new Error('Invalid image type');
        }
        var reader = new FileReader();
        reader.onerror = function () {
            throw new Error('Cannot load the selected file');
        };
        reader.onload = function () {
            loadImageFromUrl.call(reader.result);
        };
        reader.readAsDataURL(file);
    }
}

// Allow this element to be dropped on
function makeDropArea(elmt) {
    elmt.ondrop = function (evt) {
        evt.preventDefault();
        fileSelectionCallback.call(evt.dataTransfer);
    };
    elmt.ondragover = function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
    };
}

// Initialize the demo
function init() {
    makeDropArea(document);
    document.ondblclick = function (evt) {
        CLICKED = evt.target;
        console.log(CLICKED);
    };
    REDUCER = GLEffect.Reducer.fromFunctions(
        function (a, b) {
            return a + b;
        },
        [
            'vec4 function(vec4 a, vec4 b, vec4 c, vec4 d) {',
            '    return a+b+c+d;',
            '}'
        ]
    );
}