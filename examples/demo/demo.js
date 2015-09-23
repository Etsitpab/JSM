/*global console, document, Matrix, Colorspaces, CIE, open */
/*jshint indent: 4, unused: true, white: true */

var image, canvas;

function updateOutput(image, init) {
    "use strict";
    canvas.displayImage(image, 0, init);
    drawImageHistogram("histogram", image);
}

window.onload = function () {
    "use strict";
    var callback = function (evt) {
        var onread = function () {
            image = this.im2double()
            updateOutput(image, true);
        };
        var im = new Image();
        im.src = this;
        im.onload = function() {
            im.height = 50;
            im.style.marginRight = "3px";
            $("images").appendChild(im);
        }
        im.onclick = function () {
            Matrix.imread(im.src, onread);
        }
    };
    initFileUpload('loadFile', callback);
    canvas = new SuperCanvas(document.body);
    hideFieldset();
    initInputs();
    document.body.onresize = updateOutput;
};

