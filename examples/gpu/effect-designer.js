function init() {
    makeColumnResizable();
    var fl = new FileLoader('images');
    fl.appendWebcams();
}

// Allow the left column to be resized
function makeColumnResizable() {
    'use strict';
    var resizer = document.getElementById('resizer');
    var leftBox = document.getElementsByClassName('left-column')[0];
    var rightBoxes = [].slice.call(document.getElementsByClassName('right-column'));
    var getIntStyle = function (elmt, property) {
        return parseInt(getComputedStyle(elmt).getPropertyValue(property), 10);
    }
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