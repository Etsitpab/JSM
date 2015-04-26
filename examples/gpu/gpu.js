/*global GLEffect, Image, FileReader */
/*jslint vars: true, nomen: true, browser: true, plusplus: true */
/*exported init, viewFilter, compileFilter */

'use strict';


// Global variables
var IMAGE, VIDEO, IS_VIDEO;
var TIMER;
var FILTERS;

// Shortcut for 'getElementById'
function $(str) {
    return window.document.getElementById(str);
}

// Create and run the GLEffect
function runFilters() {
    var start = new Date().getTime();
    var image = IS_VIDEO ? VIDEO : IMAGE;
    if (!image) {
        return;
    }
    var k;
    for (k = 0; k < FILTERS.length; k++) {
        image = FILTERS[k].run(image);
    }
    var end = new Date().getTime();
    $('outputStatus').value = 'Run in ' + (end - start) + 'ms';  // Load image + apply filters
}


/********** DATA LOADING FUNCTIONS **********/

// Reset input to 1x1 pixel
function resetInputs() {
    var image = $('inputImage');
    image.width = '1px';
    image.height = '1px';
    var video = $('inputVideo');
    video.width = '1px';
    video.height = '1px';
}

// Callback function: process a frame of the VIDEO
function processVideoFrame() {
    runFilters();
    if (VIDEO.paused && TIMER) {
        clearInterval(TIMER);
        TIMER = null;
    }
}

// Callback function: load the image
function loadImageFromUrl() {
    var im = new Image();
    im.onload = function () {
        resetInputs();
        IS_VIDEO = false;
        IMAGE = im;
        var img = $('inputImage');
        img.width = im.width;
        img.height = im.height;
        img.src = im.src;
        // MATRIX = Matrix.imread(image).im2double();
        runFilters();
    };
    im.src = this;
}

// Callback function: load the video
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
        VIDEO = video;
        IS_VIDEO = true;
        video.ontimeupdate = runEffectLoop;
        runEffectLoop();
    };
    video.load();
}

// Callback function: handle the selected file
function fileSelectionCallback() {
    if (this.files.length) {
        var file = this.files[0];
        var type = file.type.match(new RegExp('^[^/]*'))[0];
        var callbackList = {'image': loadImageFromUrl, 'video': loadVideoFromUrl};
        var callback = callbackList[type];
        if (!callback) {
            throw new Error('Unknown file type, must be an image or video');
        }
        var reader = new FileReader();
        reader.onerror = function () {
            throw new Error('Cannot load the selected file');
        };
        reader.onload = function () {
            callback.call(reader.result);
        };
        reader.readAsDataURL(file);
    }
}

// Allow this element to be dropped on
function makeDropArea(elmt) {
    elmt.ondragover = function (evt) {
        elmt.style.border = '2px dotted black';
        evt.preventDefault();
        evt.stopPropagation();
    };
    elmt.ondrop = function (evt) {
        evt.preventDefault();
        fileSelectionCallback.call(evt.dataTransfer);
    };
    document.ondragover = function () {
        elmt.style.border = '2px dotted gray';
    };
    document.ondrop = function() {
        elmt.style.border = '';
    };
}

// Allow TAB to insert spaces
function configureTabKey(elmt, spaces) {
    var tab = '\t';
    if (spaces) {
        tab = new Array(spaces + 1).join(' ');
    }
    elmt.onkeydown = function (evt) {
        if (evt.keyCode === 9) {
            var index = this.selectionStart;
            var txt = elmt.value;
            elmt.value = txt.substr(0, index) + tab + txt.substr(elmt.selectionEnd);
            elmt.selectionStart = elmt.selectionEnd = index + tab.length;
            evt.preventDefault();
        }
    };
}


/********** UI FUNCTIONS **********/

// Remove all the children of a node
function removeAllChildren(elmt) {
    while (elmt.lastChild) {
        elmt.removeChild(elmt.lastChild);
    }
}

// Get the selected filter, or null if no selection
function getSelectedFilter() {
    var filter = $('filterList');
    var id = filter.selectedIndex;
    return (id < 0) ? null : FILTERS[filter.options[id].value];
}

// Remove the spaces at the end of a line
function removeTrailingSpaces(str) {
    var lines = (str + '\n').split(/[ \t\r]*\n/);
    do {
        lines.pop();
    } while (lines.length && !lines[lines.length - 1].length);
    return lines.join('\n');
}

// Refresh the list of filters
function refreshFilterList() {
    $('filterDetails').style.display = 'none';
    var outdiv = $('outputArea');
    var filtersList = $('filterList');
    var paramList = $('paramList');
    removeAllChildren(outdiv);
    removeAllChildren(filtersList);
    removeAllChildren(paramList);
    var n, filter, name, group, opt, params;
    for (n = 0; n < FILTERS.length; n++) {
        filter = FILTERS[n];
        name = filter.ui_name || 'Default';
        // output canvas
        if (!filter.ui_nodisplay) {
            outdiv.appendChild(filter.getCanvas());
        }
        // filters list
        opt = document.createElement('option');
        opt.appendChild(document.createTextNode(name));
        opt.value = n;
        filtersList.appendChild(opt);
        // parameters list
        $('paramValue').value = '';
        params = filter.getParametersList();
        if (params.length) {
            group = document.createElement('optgroup');
            group.label = name;
            group.id = 'filter-no-' + n;
            params.reverse();
            while (params.length) {
                opt = document.createElement('option');
                opt.appendChild(document.createTextNode(params.pop()));
                group.appendChild(opt);
            }
            paramList.appendChild(group);
        }
    }
}

// Compile the selected filter
function compileFilter() {
    var filter = null;
    try {
        filter = new GLEffect($('shaderCode').value);
    } catch (e) {
        window.alert('Compilation failed---see console for more details');
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
        $('filterDetails').style.display = '';
        $('shaderName').value = filter.ui_name || 'Default';
        $('shaderCode').value = removeTrailingSpaces(filter.sourceCode);
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

// Display a filter parameter
function setParam() {
    var list = $('paramList');
    var data = $('paramValue');
    var index = list.selectedIndex;
    if (index < 0) {
        return;
    }
    var opt = list.options[index];
    var n = opt.parentElement.id.match(/\d+$/)[0];
    var value;
    try {
        value = eval(data.value);
    } catch (e) {
        alert('Invalid parameter value');
        return;
    }
    FILTERS[n].setParameters(opt.value, eval(data.value));
    refreshFilterList();
    list.selectedIndex = index;
    data.focus();
    runFilters();
}

// Handle event on 'setParam' field
function setParamKeydown(evt) {
    if (evt.keyCode === 13) {
        setParam();
    }
}


/********** INITIALIZATION **********/

// Initialize the demo
function init() {
    appendNewFilter();
    makeDropArea($('dropZone'));
    configureTabKey($('shaderCode'), 4);
    $('inputFile').onchange = fileSelectionCallback;
}
