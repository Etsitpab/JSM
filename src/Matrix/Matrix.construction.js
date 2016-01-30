/*
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @author Baptiste Mazin     <baptiste.mazin@telecom-paristech.fr>
 * @author Guillaume Tartavel <guillaume.tartavel@telecom-paristech.fr>
 */

/*
 * This module provides basic Matrix constructor interface
 * such as `rand`, 'randi', 'eye', 'zeros', 'ones', etc.
 * to build Matrix in matlab-like way.
 */

/** @class Matrix */

(function (Matrix, Matrix_prototype) {
    "use strict";

    // Check if nodejs or browser
    var isNode = (typeof module !== 'undefined' && module.exports) ? true : false;
    var fs, Canvas, NewImage;
    if (isNode) {
        fs = require("fs");
        // Do not forget: export NODE_PATH=/usr/local/lib/node_modules
        Canvas = require("canvas");
        NewImage = Canvas.Image;
    } else {
        NewImage = Image;
    }

    var createCanvas = function (width, height) {
        var canvas;
        if (isNode) {
            canvas = new Canvas();
        } else {
            canvas = document.createElement("canvas");
        }
        canvas.width = width || 0;
        canvas.height = height || 0;
        return canvas;
    };

    /** Creates a row vector filled ordered values.
     * Actually it acts like Matlab colon (:) operator.
     *
     * __Also see:__
     *  {@link Matrix#linspace}.
     *
     * @param {Array} colon
     *  Colon array can have 2, or 3 parameters:
     *
     *  - the first value indicates the first value of the output vector,
     *  - if there is two parameters, then they designate respectively
     *  - the first and the last value of the output vector (the step between
     *    two values is -1 or +1,
     *  - If there is three parameters, then they indicate respectively
     *    the first, the step and the last values.
     *
     * @param {String} [type=Matrix.dataType]
     *  Defined the numerical class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.colon = function () {
        var col = Tools.checkColon(arguments);

        var first = col[0], step = col[1], last = col[2];

        // Special cases
        if (!isFinite(first) || !isFinite(step) || !isFinite(last)) {
            throw new Error("Parameters are invalid number (Infitity or NaN).");
        }

        // Minimum difference between 2 double precision values
        var eps = 2.2204e-16;
        // Tolerance value
        var tol = 2.0 * eps * Math.max(Math.abs(first), Math.abs(last));
        // Step sign
        var stepSign = step > 0 ? 1 : -1;

        // Determine interval number
        var n;
        var isInteger = Tools.isInteger;

        if (isInteger(first) && step === 1) {
            // Consecutive integers.
            n = Math.floor(last) - first;
        } else if (isInteger(first) && isInteger(step)) {
            // Integers with spacing > 1.
            var q = Math.floor(first / step);
            var r = first - q * step;
            n = Math.floor((last - r) / step) - q;
        } else {
            // General case.
            n =  Math.round((last - first) / step);
            if (stepSign * (first + n * step - last) > tol) {
                n = n - 1;
            }
        }

        var right = first + n * step;
        if (stepSign * (right - last) > -tol) {
            right = last;
        }
        var out = new Matrix(n + 1);
        var dOut = out.getData();
        var x, k = Math.floor(n / 2) + 1;
        var v1 = first, v2 = right;
        for (x = 0; x < k; x++, v1 += step, v2 -= step) {
            dOut[x]     = v1;
            dOut[n - x] = v2;
        }

        if (n % 2 === 0) {
            dOut[n / 2] = (first + right) / 2;
        }

        return out;
    };

    /** Creates a column vector filled with linealy spaced values.
     * It acts similarly to the colon operator, but with a control on
     * the number of values.
     *
     * __Also see:__
     *  {@link Matrix#colon}.
     *
     * @param {Integer[]} size
     * A sequence of integers indicating the size of the output matrix.
     *
     * @param {String} [type=Matrix.dataType]
     * Defined the numerical class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.linspace = function (min, max, bins) {
        if (!Tools.isNumber(min)) {
            throw new Error();
        }
        if (!Tools.isNumber(max)) {
            throw new Error();
        }
        if (bins === undefined) {
            bins = 100;
        } else if (!Tools.isInteger(bins, 1)) {
            throw new Error("Matrix.linspace: Bins should be an integer > 1.");
        }

        var binsm1 = bins - 1;
        return Matrix.colon(min, (max - min) / binsm1, max);
    };

    /** Creates a Matrix filled with zeros.
     *
     * __Also see:__
     *  {@link Matrix#ones}.
     *
     * @param {Integer[]} size
     * A sequence of integers indicating the size of the output matrix.
     *
     * @param {String} [type=Matrix.dataType]
     * Defined the numerical class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.zeros = function () {
        var size, type;

        // Get type;
        if (typeof arguments[arguments.length - 1] === 'string') {
            type = Array.prototype.pop.apply(arguments);
        }

        // Check size
        size = Tools.checkSize(arguments, 'square');

        return new Matrix(size, type);
    };

    /** Creates a Matrix filled with ones.
     * Actually it acts like Matlab ones constructor.
     *
     * __Also see:__
     *  {@link Matrix#zeros}.
     *
     * @param {Integer[]} size A sequence of integers indicating
     * the size of the output matrix.
     *
     * @param {String} [type=Matrix.dataType] Defined the numerical
     * class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.ones = function () {
        var type;
        // Get type;
        if (typeof arguments[arguments.length - 1] === 'string') {
            type = Array.prototype.pop.apply(arguments);
        }

        // Check size
        var size = Tools.checkSize(arguments, 'square');

        var mat = new Matrix(size, type), data = mat.getData();
        var i, ie;
        for (i = 0, ie = data.length; i < ie; ++i) {
            data[i] = 1;
        }

        return mat;
    };

    /** Creates a Matrix filled with random walues uniformely
     * distributed in range [0, 1].
     *
     * __Also see:__
     *  {@link Matrix#randn},
     *  {@link Matrix#randi}.
     *
     * @param {Integer[]} size
     *  A sequence of integers indicating the size of the
     *  output matrix.
     *
     * @param {String} [type=Matrix.dataType]
     *  Defined the numerical class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.rand = function () {
        var size, type;
        // Get type;
        if (typeof arguments[arguments.length - 1] === 'string') {
            type = Array.prototype.pop.apply(arguments);
        }

        // Check size
        size = Tools.checkSize(arguments, 'square');
        var mat = new Matrix(size, type), data = mat.getData();
        var i, ie, random = Math.random;
        for (i = 0, ie = data.length; i < ie; ++i) {
            data[i] = random();
        }
        return mat;
    };

    /** Creates a Matrix filled with random walues following
     * the gaussian low of parameters (0, 1).
     *
     * __Also see:__
     *  {@link Matrix#rand},
     *  {@link Matrix#randi}.
     *
     * @param {Integer[]} size
     *  A sequence of integers indicating the size of the
     *  output matrix.
     *
     * @param {String} [type=Matrix.dataType]
     *  Defined the numerical class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.randn = function () {
        var size, type;
        // Get type;
        if (typeof arguments[arguments.length - 1] === 'string') {
            type = Array.prototype.pop.apply(arguments);
        }

        // Check size
        size = Tools.checkSize(arguments, 'square');
        var mat = new Matrix(size, type), data = mat.getData();
        var i, ie;
        var rand = Math.random, PI2 = Math.PI * 2;
        var sqrt = Math.sqrt, sin = Math.sin, log = Math.log;
        for (i = 0, ie = data.length; i < ie; ++i) {
            var t = PI2 * rand();
            var r = sqrt(-2 * log(1 - rand()));
            data[i] = r * sin(t);
        }

        return mat;
    };

    /** Creates a Matrix filled with random walues uniformely distributed
     * in a specified range.
     *
     * __Also see:__
     *  {@link Matrix#rand},
     *  {@link Matrix#randi}.
     *
     * @param {Integer|Integer[]} range
     *  Can be :
     *
     *  - An integer greater than 1, then the range for radom values will
     *    be [0, range],
     *  - An array-like of length 2, then the range for radom values will
     *    be [range[0], range[1]],
     *
     * @param {Integer[]} size
     *  A sequence of integers indicating the size of the output matrix.
     *
     * @param {String} [type=Matrix.dataType]
     * Defined the numerical class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.randi = function () {
        var range, size, type;

        // Check range
        range = Array.prototype.shift.apply(arguments);
        range = Tools.checkRange(range);

        // Get type
        if (typeof arguments[arguments.length - 1] === 'string') {
            type = Array.prototype.pop.apply(arguments);
        }

        // Check size
        size = (arguments.length === 0) ? [1] : arguments;
        size = Tools.checkSize(size, 'square');

        var mat = new Matrix(size, type), data = mat.getData();
        var i, ie, min = range[0], c = range[1] - min + 1;
        var random = Math.random, floor = Math.floor;
        for (i = 0, ie = data.length; i < ie; ++i) {
            data[i] = floor(random() * c) + min;
        }
        return mat;
    };

    /** Creates a Matrix with ones the main diagonal.
     *
     * __Also see:__
     * {@link Matrix#zeros},
     * {@link Matrix#ones}.
     *
     * @param {Integer[]} size
     * A sequence of integers indicating the size of the output matrix.
     *
     * @param {String} [type=Matrix.dataType]
     * Defined the numerical class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.eye = function () {
        var size, type;

        // Get type;
        if (typeof arguments[arguments.length - 1] === 'string') {
            type = Array.prototype.pop.apply(arguments);
        }

        // Check size
        size = Tools.checkSize(arguments, 'square');

        var mat = new Matrix(size, type);
        var data = mat.getData();

        // Scaning the from the second dimension (dim = 1)
        var view = mat.getView(), iterator = mat.getIterator(2);
        var it = iterator.iterator, b = iterator.begin, e = iterator.isEnd;

        var fy = view.getFirst(1), dy = view.getStep(1);
        var fx = view.getFirst(0), dx = view.getStep(0);
        var N = Math.min(view.getSize(1), view.getSize(0));
        var i, y, n;
        for (i = b(); !e(); i = it()) {
            for (y = i + fy + fx, n = 0; n < N; y += dy, n++) {
                data[y + n * dx] = 1;
            }
        }
        return mat;
    };

    /** Creates a complex Matrix from a 2 Matrix.
     *
     * @method complex
     *
     * @param {Matrix} real
     * Matrix used are real part.
     *
     * @param {Matrix} imag
     * Matrix used are imaginary part.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.complex = function (real, imag) {

        real = Matrix.toMatrix(real);
        imag = Matrix.toMatrix(imag);

        if (!(real instanceof Matrix)) {
            throw new Error('Matrix.complex: real argument must be a matrix.');
        }
        if (!real.isreal()) {
            throw new Error('Matrix.complex: real argument must be a real matrix.');
        }

        if (!(imag instanceof Matrix)) {
            throw new Error('Matrix.complex: imag argument must be a matrix.');
        }
        if (!imag.isreal()) {
            throw new Error('Matrix.complex: imag argument must be a real matrix.');
        }
        if (!Tools.checkSizeEquals(real.getSize(), imag.getSize(), Matrix.ignoreTrailingDims)) {
            throw new Error('Matrix.complex: imag and real Matrix must ' +
                            'have the same size.');
        }
        var realData = real.getData(), imagData = imag.getData();
        var od = new Matrix.dataType(realData.length * 2);
        od.subarray(0, realData.length).set(realData);
        od.subarray(realData.length).set(imagData);
        return new Matrix(real.getSize(), od, true);
    };

    /** Reads image data in order to creates a Matrix.
     *
     * @param {String|Image|HTMLCanvasElement} source
     *  Source of the image. It can be the image path, an Image element
     *  or a Canvas element respectively.
     *
     * @param {Function} callback
     *  Function to call once the image is loaded.
     *
     * @param {Function} errorCallback
     *  Function to call if an error occurs while loading.
     *
     * @return {Matrix}
     *
     * @matlike
     * @todo Should this function make use of Matrix.initialize ?
     */
    Matrix.imread = function (source, callback, errCallback) {
        var errMsg = 'Matrix.imread: ';
        var imOut = new Matrix();

        // If source is a canvas
        if (!isNode && typeof source === 'string' && document.getElementById(source)) {
            source = document.getElementById(source);
        }

        var readFromCanvas = function (source) {
            var imageData, ctx = source.getContext('2d');
            var width = source.width, height = source.height;
            try {
                imageData = ctx.getImageData(0, 0, width, height);
            } catch (e) {
                if (errCallback !== undefined) {
                    errCallback.call(this, e);
                    return;
                }
                throw e;
            }
            var data = new Uint8ClampedArray(imageData.data);

            var view = new MatrixView([4, width, height])
                    .select([0, 2], [0, -1], [0, -1])
                    .permute([2, 1, 0]);
            this.initialize(view.getSize(), view.extractFrom(data));

            if (callback) {
                callback.call(this, this);
            }
        }.bind(imOut);

        var readFromImage = function (image) {
            if (!isNode) {
                image = image instanceof Event ? this : image;
            }
            var canvas = createCanvas(image.width, image.height);
            canvas.getContext('2d').drawImage(image, 0, 0, image.width, image.height);
            readFromCanvas(canvas);
        };

        var readFromFileName = function (name) {
            var im = new NewImage();
            im.onerror = errCallback || function () {
                throw new Error(errMsg + 'Error occuring while loading image.');
            };
            if (isNode) {
                im.src = fs.readFileSync(name);
                readFromImage(im);
            } else {
                im.src = name;
                im.onload = readFromImage;
            }
        };

        if (typeof source === 'string') {
            readFromFileName(source);
        } else if (!isNode && source instanceof Image) {
            readFromImage(source);
        } else if (!isNode && source instanceof HTMLCanvasElement) {
            readFromCanvas(source);
        } else if (isNode && source instanceof Canvas) {
            readFromCanvas(source);
        } else {
            throw new Error(errMsg + 'invalid source argument');
        }
        return imOut;
    };

    /** Creates a square diagonal Matrix from a vector.
     *
     * @param {Matrix} vector
     *
     * @return {Matrix}
     *
     * @matlike
     * @todo This function must works with complex Matrix and array.
     */
    Matrix.diag = function (d) {
        d = Matrix.toMatrix(d);
        var l = d.numel();
        d = d.getData();
        var out = Matrix.zeros(l);
        var data = out.getData();
        var i, ei, j;
        for (i = 0, ei = data.length, j = 0; i < ei; i += l + 1, j++) {
            data[i] = d[j];
        }
        return out;
    };

    /** Load several images from an array of path and once all the images are
     * loaded call a callback function. Each image is loaded in a `Matrix`
     * container.
     * @param {Array} names
     *  The names of the images corresponding to their paths.
     * @param {Function} callback
     *  The function to be called when the images are loaded.
     *  The pointer `this` of the function is the array of images.
     * @return {Array}
     *  The array of images.
     */
    Matrix.loadImages = function loadImages(images, callback) {
        /*
        var tab = [], i, ie;
        callback = callback.bind(tab);
        var f_file = function (i) {
            return function (evt) {
                tab[i] = evt.target.result;
                for (var j = 0, je = images.length; j < je; j++) {
                    if (!tab[j]) {
                        return;
                    }
                }
                callback();
            };
        };
        for (i = 0, ie = images.length; i < ie; i++) {
            var reader = new FileReader();
            reader.onload = f_file(i);
            reader.readAsDataURL(images[i]);
        }
        return tab;
         */

        var tab = [], i, ie;
        callback = callback.bind(tab);
        var f = function (i) {
            return function () {
                tab[i] = this;
                for (var j = 0, je = images.length; j < je; j++) {
                    if (!tab[j] || tab[j].isempty()) {
                        return;
                    }
                }
                callback();
            };
        };
        for (i = 0, ie = images.length; i < ie; i++) {
            if (images[i] instanceof Image) {
                Matrix.imread(images[i], f(i));
            }
        }
        return tab;
    };


})(Matrix, Matrix.prototype);
