/*global Image, Matrix, GLEffect, $, readFile, formatSourceCode */
/*jslint vars: true, nomen: true, browser: true */
/*exported init */

'use strict';


// Global variables
var IMAGE, VIDEO, MATRIX;
var SRC;
var TIMER;
var FILTERS;


/********** DATA LOADING FUNCTIONS **********/

// Reset input to 1x1 pixel
function resetInputs() {
    var image = $('inputCanvas');
    image.width = '1';
    image.height = '1';
    var video = $('inputVideo');
    video.width = '1';
    video.height = '1';
}

// Callback function: process the image once loaded
function processLoadedImage(image) {
    resetInputs();
    SRC = IMAGE = image;
    MATRIX = Matrix.imread(image).im2double();
    MATRIX.imshow('inputCanvas');
    runFilters();
}

// Callback function: process a frame of the VIDEO
function processVideoFrame() {
    SRC = VIDEO;
    runFilters();
    if (VIDEO.paused && TIMER) {
        clearInterval(TIMER);
        TIMER = null;
    }
}

// Callback function: create and display the uploaded image
function loadImageFromUrl() {
    var im = new Image();
    im.onload = function () {
        processLoadedImage(this);
    };
    im.src = this;
}

// Callback function: TODO: doc
function loadVideoFromUrl() {
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
}

// Callback function: load the selected image
function fileSelectionCallback() {
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
}


/********** UI FUNCTIONS **********/

// Remove all the children of a node
function removeAllChildren(elmt) {
    while (elmt.lastChild) {
        elmt.removeChild(elmt.lastChild);
    }
}

// Get the selected filter, or null if no selection
function getSelectedFilter(filter) {
    var filter = $('filterList');
    var id = filter.selectedIndex;
    return (id < 0) ? null : FILTERS[filter.options[id].value];
}

// Add a new filter in the list
function appendNewFilter() {
    var filter = new GLEffect();
    FILTERS = FILTERS || [];
    FILTERS.push(filter);
    refreshFilterList();
}

// Display or hide the filter informations
function viewFilter(doView) {
    var filter = getSelectedFilter();
    if (doView && filter) {
        // View
        var name = filter.ui_name;
        var shader = filter.fragmentShaderCode;
        $('filterDetails').style.display = '';
        $('shaderName').value = name || "Default";
        $('shaderCode').value = formatSourceCode(shader);
        $('shaderDisplay').checked = !filter.ui_nodisplay;
    } else {
        // Hide
        $('filterDetails').style.display = 'none';
        var k, opts = $('filterList').options;
        for (k = 0; k < opts.length; k++) {
            opts[k].selected = false;
        }
    }
}

// Compile the selected filter
function compileFilter() {
    try {
        var filter = new GLEffect($('shaderCode').value);
    } catch (e) {
        alert('Compilation failed---see console for more details');
        throw e;
    }
    filter.ui_name = $('shaderName').value;
    filter.ui_nodisplay = !$('shaderDisplay').checked;
    var id = $('filterList').selectedIndex;
    if (id < 0) {
        FILTERS.push(filter);
    } else {
        FILTERS[id] = filter;
    }
    refreshFilterList();
    runFilters();
}

// Refresh the list of filters
function refreshFilterList() {
    'use strict';
    $('filterDetails').style.display = 'none';
    var outdiv = $('outputArea');
    removeAllChildren(outdiv);
    var select = $('filterList');
    removeAllChildren(select);
    var k, name, opt;
    for (k = 0; k < FILTERS.length; k++) {
        name = FILTERS[k].ui_name;
        opt = document.createElement('option');
        opt.value = k;
        opt.appendChild(document.createTextNode(name || "Default"));
        select.appendChild(opt);
        if (!FILTERS[k].ui_nodisplay) {
            outdiv.appendChild(FILTERS[k].canvas);
        }
    }
}


/********** OVERALL FUNCTIONS **********/

// Create and run the GLEffect
function runFilters() {
    var start = new Date().getTime();
    var image = SRC;
    var k;
    for (k = 0; k < FILTERS.length; k++) {
        FILTERS[k].importGLImage(image);
        FILTERS[k].run();
        image = FILTERS[k].canvas;
    }
    var end = new Date().getTime();
    $('outputStatus').value = 'Run in ' + (end - start) + 'ms';  // Load image + apply filters
}


// Initialize the demo
function init() {
    appendNewFilter();
    $('inputFile').addEventListener('change', fileSelectionCallback, false);
}
