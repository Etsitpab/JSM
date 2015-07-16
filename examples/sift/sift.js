/*global console, document, Matrix, Colorspaces, CIE, open */
/*jshint indent: 4, unused: true, white: true */

var IMAGES = [], NAMES = [], S, VIEW, WIN;
function exportAll() {
    var imName1 = NAMES[0].match(/(.*)\.[^.]+$/)[1],
        imName2 = NAMES[1].match(/(.*)\.[^.]+$/)[1],
        s;
    s = S.scaleSpaces[0];
    Tools.stringToDownload(s.keypointsToString(), imName1 + "_descriptors_keypoints.txt");
    Tools.stringToDownload(s.descriptorsToString("SIFT"), imName1 + "_descriptors_SIFT.txt");
    Tools.stringToDownload(s.descriptorsToString("HUE-NORM"), imName1 + "_descriptors_HUE-NORM.txt");
    Tools.stringToDownload(s.descriptorsToString("OHTA1"), imName1 + "_descriptors_OHTA1.txt");
    Tools.stringToDownload(s.descriptorsToString("OHTA2"), imName1 + "_descriptors_OHTA2.txt");

    s = S.scaleSpaces[1];
    Tools.stringToDownload(s.keypointsToString(), imName2 + "_keypoints.txt");
    Tools.stringToDownload(s.descriptorsToString("SIFT"), imName2 + "_descriptors_SIFT.txt");
    Tools.stringToDownload(s.descriptorsToString("HUE-NORM"), imName2 + "_descriptors_HUE-NORM.txt");
    Tools.stringToDownload(s.descriptorsToString("OHTA1"), imName2 + "_descriptors_OHTA1.txt");
    Tools.stringToDownload(s.descriptorsToString("OHTA2"), imName2 + "_descriptors_OHTA2.txt");

    var value, name;
    value = "SIFT";
    name = imName1 + "_" + imName2 + "_matchs_" + value + ".txt";
    Tools.stringToDownload(S.matchsToString(0, 1, value), name);
    value = "SIFT+HUE-Norm";
    name = imName1 + "_" + imName2 + "_matchs_" + value + ".txt";
    Tools.stringToDownload(S.matchsToString(0, 1, value), name);
    value = "Ohta-SIFT";
    name = imName1 + "_" + imName2 + "_matchs_" + value + ".txt";
    Tools.stringToDownload(S.matchsToString(0, 1, value), name);
    value = "Ohta-SIFT+HUE-Norm";
    name = imName1 + "_" + imName2 + "_matchs_" + value + ".txt";
    Tools.stringToDownload(S.matchsToString(0, 1, value), name);

}

function exportData() {
    "use strict";
    var n = this.id === "export1" ?  0 : 1,
        s = S.scaleSpaces[n], value = $V(this.id),
        str = "", name,
        imName = NAMES[n].match(/(.*)\.[^.]+$/)[1];
    switch (value) {
        case "keypoints":
        name = imName + "_keypoints.txt";
        str =  s.keypointsToString();
        break;
        default:
        name = imName + "_descriptors_" + value + ".txt";
        str = s.descriptorsToString(value);
    }
    Tools.stringToDownload(str, name);
}

function exportMatchs() {
    "use strict";
    var value = $V(this.id),
        name1 = NAMES[0].match(/(.*)\.[^.]+$/)[1],
        name2 = NAMES[1].match(/(.*)\.[^.]+$/)[1],
        str = S.matchsToString(0, 1, value),
        name = name1 + "_" + name2 + "_matchs_" + value + ".txt";
    Tools.stringToDownload(str, name);
}

function updateOutput(image) {
    "use strict";
    var outputCanvas = $("outputImage"),
        div = $("image"),
        canvasXSize = div.offsetWidth,
        canvasYSize = div.offsetHeight;
    outputCanvas.width = canvasXSize;
    outputCanvas.height = canvasYSize;
    image.imshow(outputCanvas, "fit");
    outputCanvas.style.marginTop = (div.offsetHeight - outputCanvas.height) / 2;
}

var readFile = function (file, callback, type) {
    // Deal with arguments
    type = type.toLowerCase();

    // File handling functions
    var reader = new FileReader();
    reader.onload = function (evt) {
        callback = callback.bind(evt.target.result);
        callback(evt);
    };

    switch (type) {
    case 'dataurl':
    case 'url':
        reader.readAsDataURL(file);
        break;
    case 'text':
    case 'txt':
        reader.readAsText(file);
        break;
    case 'arraybuffer':
    case 'binary':
    case 'bin':
        reader.readAsArrayBuffer(file);
        break;
    default:
        throw new Error("readFile: unknown type " + type + ".");
    }
};

var run = function() {
    console.log('loaded !');
    var ds = [
        Matching.descriptorDB['SIFT'],
        //Matching.descriptorDB['HUE-NORM'],
        Matching.descriptorDB['OHTA1'],
        Matching.descriptorDB['OHTA2']
    ];
    var combinations = {
        "SIFT": ["SIFT"],
        //"SIFT+HUE-Norm": ["SIFT", "HUE-NORM"],
        "Ohta-SIFT": ["SIFT", "OHTA1", "OHTA2"],
        // "Ohta-SIFT+HUE-Norm": ["SIFT", "OHTA1", "OHTA2", "HUE-NORM"]
    };
    var computeSift = function () {
        Matching.Descriptor.prototype.distance = $("distance").value;
        Matching.Keypoint.prototype.descriptors = ds;
        Matching.Keypoint.prototype.criterion = "NN-DR";
        Matching.ScaleSpace.prototype.harrisThresh = $F("harris");

        var mat, proj = false;
        if (IMAGES.length === 1) {
            IMAGES = IMAGES[0];
            mat = Matching.getSkewMatrix(IMAGES, $F('matrix'));
            proj = true;
            mat.display();
        }

        // console.profile();
        S = Matching.benchmark(IMAGES, mat, function () {return this;}, proj, {}, combinations);
        // console.profileEnd();

        VIEW = S.createView($("image"));
        VIEW.thresholdMatchs(parseFloat($("threshold").value), $V("combination"));

    }
    computeSift();
    var changeThreshold = function () {
        VIEW.thresholdMatchs(parseFloat($V("threshold")), $V("combination"));
    };

    var changeDistance = function () {
        Matching.Descriptor.prototype.distance = $("distance").value;
        S.computeDescriptors(ds);
        VIEW.computeMatchs(this.value.split(','), parseFloat($("threshold").value));
        VIEW.thresholdMatchs(parseFloat(this.value));
    };

    $("threshold").addEventListener("change", changeThreshold);
    $("combination").addEventListener("change", changeThreshold);
    $("distance").addEventListener("change", changeDistance);
    $("export1").addEventListener("change", exportData);
    $("export2").addEventListener("change", exportData);
    $("export3").addEventListener("change", exportMatchs);
};

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
    var read = function (evt) {

        var files = this.files;

        var callback = function (evt) {
            var onread = function () {
                IMAGES.push(this.im2double());
                if (IMAGES.length === files.length) {
                    run();
                }
            };
            Matrix.imread(this, onread);
        };
        // Only call the handler if 1 or more files was dropped.
        if (files.length > 0 && files.length < 3) {
            IMAGES = [];
            var i;
            for (i = 0; i < files.length; i++) {
                NAMES[i] = files[i].name;
                readFile(files[i], callback, "url");
            }
        }

    };
    $("loadFile").addEventListener("change", read, false);

    hideFieldset();
};

