/*global window, console, document, Matrix, Colorspaces, CIE, open, $, $F */
/*jshint indent: 4, unused: true, white: true */

var IMAGE, IMC, IMG, TIMER;
function updateOutput(image) {
    "use strict";
    var outputCanvas = $("outputImage");
    var div = $("image");
    var canvasXSize = div.offsetWidth;
    var canvasYSize = div.offsetHeight;
    outputCanvas.width = canvasXSize;
    outputCanvas.height = canvasYSize;
    image.imshow(outputCanvas, "fit");
    outputCanvas.style.marginTop = (div.offsetHeight - outputCanvas.height) / 2;
}

function exportImage() {
    "use strict";
    var outputCanvas = $("outputImage");
    open(outputCanvas.toDataURL());
}

window.onload = function () {
    "use strict";
    var inputs = document.getElementsByTagName('input');
    var focus = function () {
        this.focus();
    };
    var i;
    for (i = 0; i < inputs.length; i++) {
        if (inputs[i].type == 'range') {
            inputs[i].addEventListener('click', focus);
        }
    }

    var onread = function () {
        IMAGE = this.im2double();
        updateOutput(IMAGE);
        IMC = IMAGE.getCopy()
            .applycform("RGB to CMY")
            .applycform("RGB to Ohta")
            .set([], [], 0, 0.5)
            .applycform("Ohta to RGB");
        IMG = IMAGE.rgb2gray(2);
    };

    var run = function () {
        if (TIMER) {
            window.clearTimeout(TIMER);
        }
        updateOutput(IMC["-"](0.5)[".*"]($F("contrast"))["+"]($F("luminosity")));
        var canvas = $('outputImage');
        var context = canvas.getContext('2d');
        context.beginPath();
        context.arc(canvas.width / 2, canvas.height / 2, 5, 0, 2 * Math.PI, false);
        context.fillStyle = 'black';
        context.fill();

        var f = function () {
            updateOutput(IMG);
        };
        TIMER = window.setTimeout(f, $F("time") * 1000);
    };
    $("start").addEventListener("click", run);
    $("export").addEventListener("click", exportImage);

    var read = function (evt) {

        var callback = function (evt) {
            Matrix.imread(this, onread);
        };

        // Only call the handler if 1 or more files was dropped.
        if (this.files.length) {
            var i;
            for (i = 0; i < this.files.length; i++) {
                window.readFile(this.files[i], callback, "url");
            }
        }

    };
    $("loadFile").addEventListener("change", read, false);

    window.hideFieldset();
    //Matrix.imread("castle.jpg", onread);

};
