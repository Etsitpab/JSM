/*global window, console, document, Matrix, Colorspaces, CIE, open */
/*jshint indent: 4, unused: true, white: true */

var IMAGE, TIMER;
var $ = function (id) {
    return document.getElementById(id);
};

function updateOutput(image) {
    'use strict';
    var outputCanvas = $("outputImage");
    var div = $("image");
    var canvasXSize = div.offsetWidth;
    var canvasYSize = div.offsetHeight;
    outputCanvas.width = canvasXSize;
    outputCanvas.height = canvasYSize;
    image.imshow(outputCanvas, "fit");
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

window.GAME_OF_LIFE = 1;
window.GAME_OF_LIFE_ID = 0;
window.GAME_OF_LIFE_SPEED = 0;
window.GAME_OF_LIFE_ZOOM = 3;

function createGameOfLife(image) {
    'use strict';
    // Game controls
    var A = image.getCopy();
    // Parameters
    var xsize = image.getSize(1), ysize = image.getSize(0);

    // Patterns
    var cross = Matrix.fromArray([[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                  [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
                                  [0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
                                  [0, 1, 1, 1, 0, 0, 1, 1, 1, 0],
                                  [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
                                  [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
                                  [0, 1, 1, 1, 0, 0, 1, 1, 1, 0],
                                  [0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
                                  [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
                                  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]);


    //var A = Matrix.zeros(ysize, xsize);
    //A.set([ysize / 2, ysize / 2 + cross.size(0) - 1],
    //          [xsize / 2, xsize / 2 + cross.size(1) - 1],
    //          cross);

    /*
    var A = Matrix.zeros(ysize, xsize);
    A.set([ysize / 2, ysize / 2 + 6], [xsize / 2, xsize / 2 + 6], replicator);
    */
    var H = Matrix.fromArray([[1, 1, 1], [1, 0, 1], [1, 1, 1]]);


    var id = 'outputImage';

    function display(z) {
        // Zoom
        if (z > 1) {
            var out = Matrix.zeros([z * ysize, z * xsize]);
            var i, j;
            for (i = 0; i < z; i++) {
                for (j = 0; j < z; j++) {
                    out.set([i, z, -1], [j, z, -1], A);
                }
            }
            out.imshow(id, 'fit');
        } else {
            A.imshow(id, 'fit');
        }
    }

    function iteration() {
        if (window.GAME_OF_LIFE) {
            // B3S23 rule
            // Neighborhood for each cell
            var N = A.imfilter(H), N3 = N['==='](3), N2 = N['==='](2);
            // Update step
            A = N3['||'](A['&&'](N2));

            // B36/S23 rule
            //var N = A.filter(H), N3 = N['==='](3), N2 = N['==='](2);
            //var N6 = N['==='](6);
            //var D = A['==='](0);
            // Update step
            //var B = D['&&'](N3['||'](N6)), S = A['&&'](N2['||'](N3));
            //A = B['||'](S);

            display(window.GAME_OF_LIFE_ZOOM);
        }
        window.TIMER = window.setTimeout(iteration, window.GAME_OF_LIFE_SPEED);
    }

    iteration();
}

var random = function () {
    'use strict';
    window.GAME_OF_LIFE_SPEED = parseFloat($('speed').value);
    window.GAME_OF_LIFE_ZOOM = parseFloat($('zoom').value);

    var xsize = Math.floor($('image').offsetWidth / window.GAME_OF_LIFE_ZOOM);
    var ysize = Math.floor($('image').offsetHeight / window.GAME_OF_LIFE_ZOOM);
    var p = 1 - parseFloat($('proba').value);

    // Initialization
    var A = Matrix.rand(ysize, xsize)['>'](p);
    if (window.TIMER !== undefined) {
        window.clearTimeout(window.TIMER);
    }
    createGameOfLife(A);
};

window.onload = function () {
    'use strict';

    $('random').addEventListener('click', random);
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

        var callback = function (evt) {
            var onread = function () {
                if (window.TIMER !== undefined) {
                    window.clearTimeout(window.TIMER);
                }
                updateOutput(this);
                var proba = Math.round((1 - $('proba').value) * 255);
                IMAGE = Matrix.imread($("outputImage")).rgb2gray()[">"](proba);
                updateOutput(IMAGE);
                createGameOfLife(IMAGE);
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
    $('outputImage').height = $('image').offsetHeight;
    $('outputImage').width = $('image').offsetWidth;
};
