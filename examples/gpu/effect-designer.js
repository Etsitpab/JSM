/*jslint vars: true, nomen: true, plusplus: true, browser: true */
/*global Shortcuts, FileLoader, FileSlot, Effects, GLEffect */

// Create the shortcuts
function createShortcuts() {
    'use strict';
//    Shortcuts.create(document);
    Shortcuts.create('sourceCode', 'Escape', function () { Effects.stopEditing(); });
    Shortcuts.create('sourceCode', 'Ctrl+Enter', function () { Effects.fromHTML(); });
    Shortcuts.create('effects', 'Delete', function () { Effects.remove(); });
    Shortcuts.create('effects', 'Escape', function () { Effects.stopEditing(); });
    Shortcuts.create('effects', 'Ctrl+Shift+Arrowup', function () { Effects.move(-1, true); });
    Shortcuts.create('effects', 'Ctrl+Shift+ArrowDown', function () { Effects.move(+1, true); });
    Shortcuts.create('effects', 'Ctrl+Shift+PageUp', function () { Effects.move(0, false); });
    Shortcuts.create('effects', 'Ctrl+Shift+PageDown', function () { Effects.move(-1, false); });
    Shortcuts.create('parameter', 'Enter', function () { Effects.updateParameter(); });
}

// Create the file loader
function createFileLoader() {
    'use strict';
    var nloaded = 0;
    var fl = new FileLoader('images', FileLoader.MULTIPLE, 'image/*,video/*');
    fl.appendWebcams();
    fl.onchange = function (slot, nowSelected) {
        if (!nowSelected || slot.type !== 'webcam') {
            Effects.run(fl);
        }
    };
    fl.onload = function (slot) {
        if (slot.type === 'webcam') {
            Effects.run(fl);
        } else if (nloaded++ === 0 && fl.isSelectionEmpty()) {
            slot.select();
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

// Initialize the interface
function init() {
    'use strict';
    createShortcuts();
    createFileLoader();
    makeColumnResizable();
    Effects.loadSampleList();
    Effects.loadReductionList();
}

