/*global MatrixView, Matrix, console, document, window */
/*global Float64Array, Float32Array, Uint32Array */
/*global Int32Array, Uint16Array, Int16Array */
/*global Uint8ClampedArray, Uint8Array, Int8Array */
/*jshint indent: 4, unused: true, white: true */
function createCanvas(n, x, y) {
    var canvas = document.createElement("canvas");
    var id = 'myCanvas_' + n;
    canvas.setAttribute("id", id);
    document.body.appendChild(canvas);
    canvas.height = x || 100;
    canvas.width = y || 100;
    return id;
}

function check() {
    'use strict';
    var a = new MatrixView([2, 2]);
    a.iteratorSamples();
}
// check();

function checkSet() {
    'use strict';
    var A = Matrix.ones(5).display("A");
    var B = Matrix.zeros(3).display("B");
    var C = A.set([0, 2, 4], [0, 2, 4], B).display("C");

    B = Matrix.complex(Matrix.ones(3), Matrix.ones(3)).times(2).display("B");
    //A = Matrix.complex(A, A).display("A");
    C = A.set([0, 2, 4], [0, 2, 4], B).display("C");

}
//checkSet();

function checkBooleanView() {
    'use strict';
    var A = Matrix.randi(5, 4).display("A");
    var data = A.getData();
    var data2 = A.getView()
        .select([false, true, false, true], [true, true, false, false])
        .extract(data);

    console.log(data);
    console.log(data2);
}
//checkBooleanView();

function checkBooleanMatrix() {
    'use strict';
    // var A = Matrix.randi(4, 4).display();
    // var s = Matrix.toMatrix([1, 0, 1, 0]).cast('logical');
    // A.select([], s).display();
    var A = Matrix.randi(4, 4).display("A");
    var S = A['>'](2).display("A > 2");
    A.select(S).display("S");
}
//checkBooleanMatrix();

function checkExtraction() {
    'use strict';
    var A, B, view;
    A = Matrix.ones(4, 1).getData();
    B = Matrix.zeros(8, 1).getData();
    view = new MatrixView([4, 2]);
    console.log("A = ", A);
    console.log("B = ", B);
    view.select([0, 2, -1], []).extractTo(A, B);
    console.log(B);

    A = Matrix.zeros(4, 1).getData();
    B = Matrix.colon(1, 8).getData();
    view = new MatrixView([8, 1]);
    console.log("A = ", A);
    console.log("B = ", B);
    view.select([0, 2, -1], []).extractFrom(B, A);
    console.log(A);

    B = Matrix.zeros(8, 1).getData();
    view = new MatrixView([4, 2]);
    console.log("B = ", B);
    view.select([0, 2, -1], []).extractTo(9, B);
    console.log(B);


}
//checkExtraction();

function checkSet() {
    'use strict';
    var A, S, V, B;
    A = Matrix.randi(9, 4).display("A");
    S = A['>'](2).display("S");
    V = A.select(S)[".*"](0).display("V");
    B = A.set(S, V);
    B.display("B");

    A = Matrix.randi(4, 4).display("A");
    B = A.set(A['>'](2), -1);
    B.display("B");
}
//checkSet();

function checkAccumarray() {
    'use strict';
    var n = 100;
    var subs = Matrix.randi([0, 9], n, 2);
    var val = Matrix.ones(n, 1);
    Matrix.accumarray(subs, val, [15, 15]).display("Hist");
}
//checkAccumarray();

function checkIndices() {
    'use strict';
    var A = Matrix.rand(4).display("A");
    var B = A.sort();
    B[0].display("S");
    B[1].display("I");
    A.select(B[1]).display("A(I)");
    var C = Matrix.randi(4, 4).display("C");
    A.set(B[1], C).display("A(I) = C");
    C.select(B[1]).display("C(I)");

    var code = "A = rand(4), [S I] = sort(A), A(I)";
    console.log(code);
}
//checkIndices();

function checkFilter() {
    'use strict';
    //var A = Matrix.ones(6, 6);
    //var A = [1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1];
    //A = new Matrix([6, 6], A).display("A");;
    var A = Matrix.randi([0, 1], 10, 10).display("A");
    //console.log(A.getData());
    //var A = ones(10, 10).display("A");
    //var H = Matrix.ones(5, 5).display("H");
    var H = Matrix.randi([0, 1], 4, 4).display("H");
    A.filter(H).display("out");
/*
    H = ones(5, 4).display("H");
    A.filter(H).display("out");
    H = ones(5, 3).display("H");
    A.filter(H).display("out");
    H = ones(5, 2).display("H");
    A.filter(H).display("out");
    H = ones(5, 1).display("H");
    A.filter(H).display("out");
*/
}
//checkFilter();

function createGameOfLife() {
    'use strict';
    // Game controls
    window.GAME_OF_LIFE = 1;
    window.GAME_OF_LIFE_ID = 0;
    window.GAME_OF_LIFE_SPEED = 0;
    window.GAME_OF_LIFE_ZOOM = 2;

    // Parameters
    var xsize = 300, ysize = 300;
    var p = 0.5;

    // Initialization
    var A = Matrix.rand(ysize, xsize)['>'](p);

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
    //A = A.set([ysize / 2, ysize / 2 + cross.size(0) - 1],
    //          [xsize / 2, xsize / 2 + cross.size(1) - 1],
    //          cross);

    /*
    var A = Matrix.zeros(ysize, xsize);
    A = A.set([ysize / 2, ysize / 2 + 6], [xsize / 2, xsize / 2 + 6], replicator);
    */
    var H = Matrix.fromArray([[1, 1, 1], [1, 0, 1], [1, 1, 1]]);

    var id = createCanvas(window.GAME_OF_LIFE_ID++,
                          window.GAME_OF_LIFE_ZOOM * ysize,
                          window.GAME_OF_LIFE_ZOOM * xsize);

    function display(z) {
        // Zoom
        if (z > 1) {
            var out = Matrix.zeros([z * ysize, z * xsize]);
            var i, j;
            for (i = 0; i < z; i++) {
                for (j = 0; j < z; j++) {
                    out = out.set([i, z, -1], [j, z, -1], A);
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
            var N = A.filter(H), N3 = N['==='](3), N2 = N['==='](2);
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
        window.setTimeout(iteration, window.GAME_OF_LIFE_SPEED);
    }

    iteration();
}
//window.onload = createGameOfLife;

function test() {
    'use strict';
    var A = Matrix.randi(4, 4).display("A");
    var B = Matrix.zeros(8).display("B");
    B.set([0, 2, -1], [0, 2, -1], A).display();
}
//test();
function filtering2D() {
    'use strict';
    var c0 = createCanvas(0);
    var c1 = createCanvas(1);
    var c2 = createCanvas(2);
    var c3 = createCanvas(3);
    var tic = Tools.tic, toc = Tools.toc;
    function f(A) {
        A = A.im2double();
        A.imshow(c0);

        tic();
        var B = A.filter(Matrix.fspecial('unsharp'));
        console.log("time unsharp: ", toc());
        B.imshow(c1);

        tic();
        var C = A.filter(Matrix.fspecial('gaussian'));
        console.log("time gaussian: ", toc());
        C.imshow(c2);

        tic();
        var D = A.filter(Matrix.fspecial('log'));
        console.log("time log: ", toc());
        D.imshow(c3);
    }

    //var name = '/home/mazin/workspace/mazin/trunk/JavaScript/ipij/examples/images/J7_1.png';
    var name = '/home/mazin/workspace/mazin/trunk/JavaScript/ipij/examples/images/cana_2.jpg';
    Matrix.imread(name, f);
}
//window.onload = filtering2D;

function checkSVD() {
    "use strict";
    var i, ei;
    var t = [];
    for (i = 0; i < 1; i++) {
        var A = Matrix.rand(30);
        Tools.tic();
        var USV = A.svd(); var U = USV[0], S = USV[1], V = USV[2];
        console.log("time:", t[i] = Tools.toc(), "norm:", U.mtimes(S).mtimes(V.transpose()).minus(A).norm());
    }
}
var W;
var workerTest = function () {
    "use strict";
    var blob = new Blob([
        "onmessage = function(e) { postMessage('msg from worker'); }"]);
    
    // Obtain a blob URL reference to our worker 'file'.
    var blobURL = window.URL.createObjectURL(blob);
    
    var worker = new Worker(blobURL);
    worker.onmessage = function (e) {
        e.data == 'msg from worker';
    };
    worker.postMessage(); // Start the worker.
    W = worker;
};

window.onload = function () {
    workerTest();
    // checkSVD();
    // solveur(true);
};
