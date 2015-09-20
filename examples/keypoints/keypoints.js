/*global console, document, Matrix, Colorspaces, CIE, open, ScaleSpace, extractModes, Blob, URL, $, $F, $I, window */
/*jshint indent: 4, unused: true, white: true */
var IMAGE, SCALESPACE, KNUM, sCanvas;

function exportImage() {
    "use strict";
    open(sCanvas.images[0].toDataURL());
}

function exportKeypoints() {
    'use strict';
    var out = SCALESPACE.keypointsToString();
    var blob = new Blob([out], {type: 'text'});
    var url = URL.createObjectURL(blob);
    var a = document.getElementById("export");

    var textFileAsBlob = new Blob([out], {type: 'text/plain'});

    var downloadLink = document.createElement("a");
    downloadLink.download = "keypoints.txt";
    downloadLink.innerHTML = "Download File";
    downloadLink.href = URL.createObjectURL(textFileAsBlob);
    downloadLink.click();
}


function updateOutput(image) {
    "use strict";
    sCanvas.setImageBuffer(image, 0);
    sCanvas.displayImageBuffer(0, false);
}

HTMLCanvasElement.prototype.plotKeypoint = function (k, ring, orientation, color1, color2) {
    "use strict";
    var context = this.getContext('2d');
    var sin = Math.sin, cos = Math.cos;
    var drawArrow = function (startX, startY, angle, size) {
        angle = (angle > 0.5 ? angle - 1 : angle) * 2 * Math.PI;
        this.beginPath();
        this.moveTo(startX, startY);
        this.lineTo(startX + size * cos(angle), startY + size * sin(angle));
        this.stroke();
    }.bind(context);

    var drawRing = function (x, y, size) {
        this.beginPath();
        this.arc(x, y, size, 0, 2 * Math.PI, false);
        this.arc(x, y, size, 0, 2 * Math.PI, false);
        this.stroke();
    }.bind(context);

    var drawPoint = function (x, y) {
        this.beginPath();
        this.fillStyle = color2;
        this.arc(x, y, 2, 0, 2 * Math.PI, false);
        this.fill();
    }.bind(context);



    context.strokeStyle = "black";
    context.fillStyle = "black";
    context.lineWidth = 3;
    if (ring) {
        drawRing(k.x, k.y, k.sigma * k.factorSize);
    }
    if (orientation) {
        drawArrow(k.x, k.y, k.orientation, k.sigma * k.factorSize);
    }
    drawPoint(k.x, k.y);

    color1 = color2 || color1 || "magenta";
    color1 = color1 || "lime";
    context.strokeStyle = color1;
    context.fillStyle = color1;
    context.lineWidth = 1;
    if (ring) {
        drawRing(k.x, k.y, k.sigma * k.factorSize);
    }
    if (orientation) {
        drawArrow(k.x, k.y, k.orientation, k.sigma * k.factorSize);
    }
    drawPoint(k.x, k.y);
    return this;
};

var plotKeypoints = function (scale, color) {
    "use strict";
    if (!SCALESPACE || !SCALESPACE.keypoints) {
        //return;
    }
    var keypoints = SCALESPACE.keypoints;
    var canvas = sCanvas.images[0];
    if (scale === true) {
        scale = parseInt($("scaleView").value, 10);
    }
    var i, ei;
    for (i = 0, ei = keypoints.length; i < ei; i++) {
        if (scale && keypoints[i].nScale !== scale) {
            continue;
        }
        canvas.plotKeypoint(keypoints[i], false, false, color);
    }
};

var changeImage = function () {
    "use strict";
    var scale = parseInt($("scaleView").value, 10);
    var filter = $("filter").value;
    var cMap = $("colormap").value;
    if (!SCALESPACE) {
        return;
    }
    var image;
    if (filter !== "blur" && cMap !== "GRAY" && filter !== "hybrid") {
        image = SCALESPACE.getImage(scale, filter, true);
        image = image.toColormap(cMap);
    } else if (filter === "hybrid") {
        var norm = SCALESPACE.getImage(scale, "norm", true);
        var phase = SCALESPACE.getImage(scale, "phase");
        image = window.phaseNormImage(phase, norm);
    } else {
        image = SCALESPACE.getImage(scale, filter, true);
    }
    updateOutput(image);
};

var changeView = function () {
    "use strict";
    changeImage();
    plotKeypoints(true);
};

var changeKeypoint = function () {
    "use strict";
    var k = $("keypoint").value, key = SCALESPACE.keypoints[k - 1];
    var h = key.histogram, l = h.lambda;
    var modes = extractModes(h, true, 0, h.nPoints, l, l * l);
    $("scaleView").value = key.nScale;
    changeView();
    sCanvas.images[0].plotKeypoint(key, true, true, "white");
    $("histogram").drawHistogram(h, 0.1, "", modes, true);
};

var threshold = function () {
    "use strict";
    var lap = parseFloat($("lapThresh").value);
    var harris = parseFloat($("harrisThresh").value);
    console.log("Threshold:", lap, harris);
    if (!SCALESPACE) {
        return;
    }
    SCALESPACE.laplacianThreshold(lap);
    SCALESPACE.harrisThreshold(harris);
    changeImage();
    plotKeypoints(true);
};

var computeOrientations = function () {
    "use strict";
    if (!SCALESPACE || !SCALESPACE.keypoints) {
        return;
    }
    threshold();
    var algo = $("orientation").value;
    console.log(algo);
    SCALESPACE.extractMainOrientations(algo);
    var keypoint = $("keypoint");
    keypoint.max = SCALESPACE.keypoints.length;
    keypoint.value = 1;
    changeKeypoint();
    console.log("Keypoints:", SCALESPACE.keypoints.length);
    window.fieldset.hideAll();
    window.fieldset.show("image view");
};

function computeScaleSpace() {
    "use strict";
    var sigmaInit = parseFloat($("sigmaInit").value);
    var scaleRatio = parseFloat($("scaleRatio").value);
    var scaleNumber = parseFloat($("scaleNumber").value);
    console.log("Params: ", sigmaInit, scaleRatio, scaleNumber);
    $("scaleView").max = scaleNumber - 2;
    if (!IMAGE) {
        return;
    }
    SCALESPACE = new Matching.ScaleSpace(IMAGE, scaleNumber, sigmaInit, scaleRatio);
    SCALESPACE
        .computeScaleSpace()
        .precomputeMaxLaplacian()
        .precomputeHarris();
    threshold();

    window.fieldset.hideAll();
    window.fieldset.show("keypoints detection");
}

window.onload = function () {
    "use strict";
    $("computeScaleSpace").addEventListener("click", computeScaleSpace);

    $("lapThresh").addEventListener("change", threshold);
    $("harrisThresh").addEventListener("change", threshold);

    $("scaleView").addEventListener("change", changeView);
    $("keypoint").addEventListener("change", changeKeypoint);
    $("filter").addEventListener("change", changeView);
    $("colormap").addEventListener("change", changeView);

    $("computeOrientations").addEventListener("click", computeOrientations);

    var callback = function (evt) {
        var onread = function () {
            IMAGE = this.im2single();
            KNUM = undefined;
            updateOutput(IMAGE);
            // var legends = document.getElementsByTagName("legend");
            // var evObj = document.createEvent('Events');
            // evObj.initEvent("click", true, false);
            // fieldset.show("scalespace");
        };
        Matrix.imread(this, onread);
    };

    initFileUpload("loadFile", callback);
    initInputs();
    hideFieldset();
    sCanvas = new SuperCanvas(document.body);
};
