/*global window, console, document, Matrix, Colorspaces, CIE, open */
/*jshint indent: 4, unused: true, white: true */

var IMAGE, TIMER, sCanvas;

function updateOutput(image, init) {
    'use strict';
    sCanvas.setImageBuffer(image, 0);
    sCanvas.displayImageBuffer(0, init === true ? false : true);
}

window.GAME_OF_LIFE = 1;
window.GAME_OF_LIFE_ID = 0;
window.GAME_OF_LIFE_SPEED = 0;

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

    var isFirst = true;
    function display() {
        sCanvas.setImageBuffer(A, 0);
        sCanvas.displayImageBuffer(0, !isFirst);
        if (isFirst === true) {
            isFirst = false;
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

            display();
        }
        window.TIMER = window.setTimeout(iteration, window.GAME_OF_LIFE_SPEED);
    }

    iteration();
}

var random = function () {
    'use strict';
    window.GAME_OF_LIFE_SPEED = parseFloat($('speed').value);

    var ratio = sCanvas.canvas.width / sCanvas.canvas.height;
    var xsize = Math.floor($I("size"));
    var ysize = Math.floor($I("size") / ratio);
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
    $('speed').addEventListener('change', function () {
        window.GAME_OF_LIFE_SPEED = parseFloat($('speed').value);
    });
    var callback = function (evt) {
        var onread = function () {
            if (window.TIMER !== undefined) {
                window.clearTimeout(window.TIMER);
            }
            var proba = Math.round((1 - $('proba').value) * 255);
            IMAGE = this.rgb2gray()[">"](proba);
            updateOutput(IMAGE, true);
            createGameOfLife(IMAGE);
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

    sCanvas = new SuperCanvas(document.body);
    initFileUpload("loadFile", callback);
    initInputs();
    hideFieldset();
    document.body.onresize = updateOutput;
};
