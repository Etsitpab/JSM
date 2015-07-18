/*jslint vars: true, nomen: true, browser: true */
/*global FileLoader, FileSlot, Effects, GLEffect */

// Allow the left column to be resized
function makeColumnResizable() {
    'use strict';
    var resizer = document.getElementById('resizer');
    var leftBox = document.getElementsByClassName('left-column')[0];
    var rightBoxes = [].slice.call(document.getElementsByClassName('right-column'));
    var getIntStyle = function (elmt, property) {
        return parseInt(window.getComputedStyle(elmt).getPropertyValue(property), 10);
    };
    var space = getIntStyle(rightBoxes[0], 'margin-left') - getIntStyle(leftBox, 'width');
    // Set mouse listener
    var offset = null;
    resizer.addEventListener('mousedown', function (evt) {
        evt.preventDefault();
        offset = getIntStyle(leftBox, 'width') - evt.clientX;
    });
    document.addEventListener('mousemove', function (evt) {
        if (offset !== null) {
            leftBox.style.width = (evt.clientX + offset) + 'px';
        }
    });
    document.addEventListener('mouseup', function (evt) {
        if (offset !== null) {
            var width = evt.clientX + offset, margin = width + space;
            offset = null;
            leftBox.style.width = width + 'px';
            rightBoxes.forEach(function (box) {
                box.style.marginLeft = margin + 'px';
            });
        }
    });
}

// Create the file loader
function createFileLoader() {
    'use strict';
    var fl = new FileLoader('images', FileLoader.MULTIPLE, 'image/*,video/*');
    fl.appendWebcams();

    // Run when selection change
    fl.onchange = function (slot, nowSelected) {
        if (!nowSelected || slot.type !== 'webcam') {
            Effects.run(fl);
        }
    };
    fl.onload = function (slot) {
        if (slot.type === 'webcam') {
            Effects.run(fl);
        }
    };

    // Load output image when double-clicked
    var canvas = GLEffect._getDefaultContext().canvas;
    canvas.addEventListener('dblclick', function () {
        var inputs = Effects._getInputs();
        if (inputs) {
            var image = Effects._runOnce(inputs, true);
            var slot = fl.createSlot(null, 'js-fileloader-loading');
            FileSlot.Loader.image.call(slot, image.toCanvas().toDataURL());
        }
    });
}

// Initialize the interface
function init() {
    'use strict';
    makeColumnResizable();
    createFileLoader();
    Effects.loadSampleList();
}

