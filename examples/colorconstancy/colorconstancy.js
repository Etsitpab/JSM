/*global console, document, Matrix, Colorspaces, CIE, open */
/*jshint indent: 4, unused: true, white: true */

var IMAGE;
var $ = function (id) {
    'use strict';
    return document.getElementById(id);
};

function exportImage() {
    "use strict";
    var outputCanvas = $("outputImage");
    open(outputCanvas.toDataURL());
}

function updateOutput(image) {
    'use strict';

    var outputCanvas = $("outputImage");
    var div = $("image");
    var canvasXSize = div.offsetWidth;
    var canvasYSize = div.offsetHeight;
    outputCanvas.width = canvasXSize;
    outputCanvas.height = canvasYSize;
    if (image instanceof Matrix) {
        image.display('Illuminant');
    }
    var view = $("view");
    if (view.value === 'im') {
        IMAGE.imshow(outputCanvas, "fit");
    } else if (view.value === 'mask') {
        image.mask.imshow(outputCanvas, "fit");
    } else if (view.value === 'im_used') {
        image.im.imagesc(outputCanvas, "fit");
    } else if (view.value === 'imcor') {
        image.imcor.imshow(outputCanvas, "fit");
    }
    outputCanvas.style.marginTop = (div.offsetHeight - outputCanvas.height) / 2;
}

function hideFieldset() {
    'use strict';
    var i, ei;
    var legends = document.getElementsByTagName("legend");

    var hide = function () {
        var toHide = this.childNodes;
        for (i = 0, ei = toHide.length; i < ei; i++) {
            if (toHide[i].tagName !== "LEGEND" && toHide[i].style) {
                toHide[i].style.display = "none";
            }
        }
    };
    var show = function () {
        var toHide = this.childNodes;
        for (i = 0, ei = toHide.length; i < ei; i++) {
            if (toHide[i].tagName !== "LEGEND" && toHide[i].style) {
                toHide[i].style.display = "";
            }
        }
    };
    var hideAll = function () {
        var i, ei;
        for (i = 0, ei = legends.length; i < ei; i++) {
            hide.bind(legends[i].parentNode)();
        }
    };
    hideAll();

    var f = function () {
        hideAll();
        show.bind(this.parentNode)();
    };

    for (i = 0, ei = legends.length; i < ei; i++) {
        legends[i].addEventListener("click", f);
    }
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

window.onload = function () {
    'use strict';
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

    var algo = document.getElementById('wbAlgo');
    var njet = document.getElementById('njet');
    var mink = document.getElementById('mink');
    var sigma = document.getElementById('sigma');
    var apply = document.getElementById('apply');
    var view = document.getElementById('view');
    var changeParameters = function () {
        console.log(parseFloat(njet.value),
                    parseFloat(mink.value),
                    parseFloat(sigma.value));
        var im = IMAGE.im2double();
        if (algo.value === 'ppl') {
            var ill = im.miredHistogram();
            ill.imcor = correctImage(im, ill.modes[0].illxy);
            im = ill;
        } else {
            im = im
                .general_cc(parseFloat(njet.value),
                            parseFloat(mink.value) || -1,
                            parseFloat(sigma.value));
        }
        updateOutput(im);
    };
    var changeView = function () {
        changeParameters();
    };
    view.addEventListener('change', changeView);

    var changeAlgo = function () {
        if (algo.value === 'grey_world') {
            njet.selectedIndex = 0;
            mink.value = 1;
            sigma.value = 0;
        } else if (algo.value === 'max_rgb') {
            njet.selectedIndex = 0;
            mink.value = -1;
            sigma.value = 0;
        } else if (algo.value === 'shades_of_grey') {
            njet.selectedIndex = 0;
            mink.value = 5;
            sigma.value = 0;
        } else if (algo.value === 'grey_edge') {
            njet.selectedIndex = 1;
            mink.value = 5;
            sigma.value = 2;
        }
        changeParameters();
    };


    apply.addEventListener('click', changeParameters);
    algo.addEventListener('change', changeAlgo);

    var read = function (evt) {

        var callback = function (evt) {
            var onread = function () {
                updateOutput({imcor: this});
                var outputCanvas = document.getElementById("outputImage");
                IMAGE = Matrix.imread(outputCanvas).im2double();
                //changeParameters();
            };
            Matrix.imread(this, onread);
        };

        // Only call the handler if 1 or more files was dropped.
        if (this.files.length) {
            var i;
            for (i = 0; i < this.files.length; i++) {
                readFile(this.files[i], callback, "url");
            }
        }

    };
    $("loadFile").addEventListener("change", read, false);

    hideFieldset();
};
