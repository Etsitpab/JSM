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

/** @class Matrix */

(function (Matrix, Matrix_prototype) {
    "use strict";

    // Check if nodejs or browser
    var isNode = (typeof module !== 'undefined' && module.exports) ? true : false;
    var fs, Canvas, newImage;
    if (isNode) {
        fs = require("fs");
        // Do not forget: export NODE_PATH=/usr/local/lib/node_modules
        Canvas = require("canvas");
        newImage = Canvas.Image;
    } else {
        newImage = Image;
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

    //////////////////////////////////////////////////////////////////
    //                    IMAGES CONVERSION MODULE                  //
    //////////////////////////////////////////////////////////////////


    /** Image cast function.
     * @param {Object} image
     * @param {String} type
     * @return {Matrix}
     * @private
     */
    Matrix_prototype.convertImage = function (type) {
        var output = new Matrix(this.getSize(), type);
        var inputRange, outputRange;
        if (this.isfloat() || this.islogical()) {
            inputRange = [0, 1];
        } else if (this.isinteger()) {
            inputRange = [Matrix.intmin(this.type()), Matrix.intmax(this.type())];
        }
        var a = inputRange[0], b = 1 / (inputRange[1] - inputRange[0]);

        if (output.isfloat() || this.islogical()) {
            outputRange = [0, 1];
        } else if (output.isinteger()) {
            outputRange = [Matrix.intmin(output.type()), Matrix.intmax(output.type())];
        }
        var c = outputRange[0], d = b * (outputRange[1] - outputRange[0]);

        var id = this.getData(), od = new output.getData();
        var i, ie;
        for (i = 0, ie = id.length; i < ie; i++) {
            od[i] = (id[i] - a) * d - c;
        }
        return new Matrix(this.getSize(), od);
    };
    /** Cast image to `double` type
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.im2double = function () {
        return this.convertImage('double');
    };
    /** Cast image to `single` type
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.im2single = function () {
        return this.convertImage('single');
    };
    /** Cast image to uint8 type
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.im2uint8 = function () {
        return this.convertImage('uint8');
    };
    /** Cast image to uint8c type
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.im2uint8c = function () {
        return this.convertImage('uint8c');
    };
    /** Return the image in a array who can be displayed in
     * a `Canvas` element.
     *
     * @return {Uint8ClampedArray}
     */
    Matrix_prototype.getImageData = function () {
        // Input image range
        var range;
        if (this.isfloat()  || this.islogical()) {
            range = [0, 1];
        } else if (this.isinteger()) {
            range = [Matrix.intmin(this.type()), Matrix.intmax(this.type())];
        }
        var a = range[0], b = 255 / (range[1] - range[0]);

        // Ouptut iterator
        var width = this.getSize(1), height = this.getSize(0);
        var imageData = createCanvas().getContext('2d')
                .createImageData(width, height);
        var nx = height * width, nx0;
        var dI = this.getData(), dO = imageData.data;

        var xo, y, x0, x1, x2, x3, vTmp;
        switch (this.getSize(2)) {
        case 1:
            for (y = 0, xo = 0; y < height; y++) {
                for (x0 = y, nx0 = y + nx; x0 < nx0; x0 += height) {
                    vTmp = (dI[x0] - a) * b;
                    dO[xo++] = vTmp;
                    dO[xo++] = vTmp;
                    dO[xo++] = vTmp;
                    dO[xo++] = 255;
                }
            }
            break;
        case 2:
            for (y = 0, xo = 0; y < height; y++) {
                for (x0 = y, x1 = y + nx, nx0 = y + nx; x0 < nx0; x0 += height, x1 += height) {
                    vTmp = (dI[x0] - a) * b;
                    dO[xo++] = vTmp;
                    dO[xo++] = vTmp;
                    dO[xo++] = vTmp;
                    dO[xo++] = (dI[x1] - a) * b;
                }
            }
            break;
        case 3:
            for (y = 0, xo = 0; y < height; y++) {
                for (x0 = y, x1 = y + nx, x2 = y + 2 * nx, nx0 = x1; x0 < nx0; x0 += height, x1 += height, x2 += height) {
                    dO[xo++] = (dI[x0] - a) * b;
                    dO[xo++] = (dI[x1] - a) * b;
                    dO[xo++] = (dI[x2] - a) * b;
                    dO[xo++] = 255;
                }
            }
            break;
        case 4:
            for (y = 0, xo = 0; y < height; y++) {
                for (x0 = y, x1 = x0 + nx, x2 = x1 + nx, x3 = x2 + nx, nx0 = x1; x0 < nx0; x0 += height, x1 += height, x2 += height, x3 += height) {
                    dO[xo++] = (dI[x0] - a) * b;
                    dO[xo++] = (dI[x1] - a) * b;
                    dO[xo++] = (dI[x2] - a) * b;
                    dO[xo++] = (dI[x3] - a) * b;
                }
            }
            break;
        }
        return imageData;
    };
    /** Transform a Matrix into an `Image` element.
     *
     * @param {Function} callback
     *  Function to call when the conversion is done.
     */
    Matrix_prototype.toImage = function (callback) {
        if (isNode) {
            throw new Error("Matrix.toImage: Canvas doesn't exist.");
        }
        var canvas = createCanvas(this.getSize(1), this.getSize(0));
        var id = this.getImageData();
        canvas.getContext('2d').putImageData(id, 0, 0);
        var im = new Image();
        im.src = canvas.toDataURL();
        im.onload = callback;
        return im;
    };

    if (isNode) {
        /** Allow to save an image on the Disk.
         * File extension must be be either a png or jpg valid extension.
         *
         * __FOR NODEJS USE ONLY, THIS FUNCTION IS NOT AVAILABLE IN A BROWSER.__
         *
         * @param {String} name
         *  Name of the file
         * @param {Function} callback
         *  Function to call when the conversion is done.
         * @matlike
         */
        Matrix.prototype.imwrite = function (name, callback) {
            var canvas = createCanvas(this.getSize(1), this.getSize(0));
            canvas.getContext('2d').putImageData(this.getImageData(), 0, 0);

            var out = fs.createWriteStream(name), stream;
            if ((/\.(png)$/i).test(name.toLowerCase())) {
                stream = canvas.pngStream();
            } else if ((/\.(jpeg|jpg)$/i).test(name.toLowerCase())) {
                stream = canvas.jpegStream();
            } else {
                throw new Error("Matrix.imwrite: invalid file extension.");
            }
            stream.on('data', function (chunk) {
                out.write(chunk);
            });
            if (callback) {
                stream.on('end', callback.bind(this));
            }
        };
    }


    //////////////////////////////////////////////////////////////////
    //                        FILTERING MODULE                      //
    //////////////////////////////////////////////////////////////////


    /** Return some kernels.
     *
     * __Also see:__
     * {@link Matrix#imfilter}
     *
     * @param {String} type
     *  Can be 'average', 'disk', 'gaussian', 'log', 'unsharp', 'prewitt'
     *  or'sobel'.
     *
     * @param {String} parameter1
     *
     * @param {String} parameter2
     *
     * @return {Matrix}
     *
     * @todo
     *  Not every filter works add documentation on filter parameters.
     *  Meanwhile, have a look to the matlab documentation.
     */
    Matrix.fspecial = function (type, p1, p2) {
        var a, xsize, ysize, sigma;
        var data, n1, n2, _j, ij, e_j, eij, sum;
        var tmp, i, ei;
        var gaussian = function (n1, n2) {
            return Math.exp(-(n1 * n1 + n2 * n2) / (2 * sigma * sigma));
        };
        // var log = function (n1, n2) {
        //     return (n1 * n1 + n2 * n2 - 2 * sigma * sigma) * gaussian(n1, n2) / (2 * Math.PI * Math.pow(sigma, 6));
        // };
        switch (type.toLowerCase()) {
        case 'average':
            if (Tools.isArrayLike(p1)) {
                ysize = p1[0];
                xsize = p1[1];
            } else {
                ysize = (p1 === undefined) ? 3 : p1;
                xsize = ysize;
            }
            return Matrix.ones([ysize, xsize])['./'](ysize * xsize);
        case 'disk':
            break;
        case 'gaussian':
            if (Tools.isArrayLike(p1)) {
                ysize = p1[0];
                xsize = p1[1];
            } else {
                ysize = (p1 === undefined) ? 3 : p1;
                xsize = ysize;
            }
            sigma = (p2 === undefined) ? 0.5 : p2;
            data = [];
            sum = 0;
            for (_j = 0, n1 = -(xsize - 1) / 2, e_j = xsize * ysize; _j < e_j; _j += ysize, n1++) {
                for (ij = _j, eij = _j + ysize, n2 = -(ysize - 1) / 2; ij < eij; ij++, n2++) {
                    tmp = gaussian(n1, n2);
                    data[ij] = tmp;
                    sum += tmp;
                }
            }
            for (i = 0, ei = data.length; i < ei; i++) {
                data[i] /= sum;
            }

            return new Matrix([ysize, xsize], data);
        case 'laplacian':
            a = (p1 === undefined) ? 0.2 : p1;
            return new Matrix([3, 3], [a / 4, (1 - a) / 4, a / 4, (1 - a) / 4, -1, (1 - a) / 4, a / 4, (1 - a) / 4, a / 4])['.*'](4 / (a + 1));
        case 'log':
            if (Tools.isArrayLike(p1)) {
                ysize = p1[0];
                xsize = p1[1];
            } else {
                ysize = (p1 === undefined) ? 3 : p1;
                xsize = ysize;
            }
            sigma = (p2 === undefined) ? 0.5 : p2;
            data = [];
            sum = 0;
            for (_j = 0, n1 = -(xsize - 1) / 2, e_j = xsize * ysize; _j < e_j; _j += ysize, n1++) {
                for (ij = _j, eij = _j + ysize, n2 = -(ysize - 1) / 2; ij < eij; ij++, n2++) {
                    tmp = gaussian(n1, n2);
                    data[ij] = (n1 * n1 + n2 * n2 - 2 * sigma * sigma) * tmp / Math.pow(sigma, 4);
                    sum += tmp;
                }
            }
            for (i = 0, ei = data.length; i < ei; i++) {
                data[i] /= sum;
            }
            sum = 0;
            for (i = 0, ei = data.length; i < ei; i++) {
                sum += data[i];
            }
            sum /= xsize * ysize;
            for (i = 0, ei = data.length; i < ei; i++) {
                data[i] -= sum;
            }
            return new Matrix([ysize, xsize], data);
        case 'unsharp':
            a = (p1 === undefined) ? 0.2 : p1;
            return new Matrix([3, 3], [-a, a - 1, -a, a - 1, a + 5, a - 1, -a, a - 1, -a])['.*'](1 / (a + 1));
        case 'prewitt':
            return new Matrix([3, 3], [1, 0, -1, 1, 0, -1, 1, 0, -1]);
        case 'sobel':
            return new Matrix([3, 3], [1, 0, -1, 2, 0, -2, 1, 0, -1]);
        default:
            return;
        }
    };

    Matrix_prototype.filter1d = function (kernel, origin) {

        // 1. ARGUMENTS
        var errMsg = this.constructor.name + '.filter1d: ';

        // origin
        if (origin === undefined) {
            origin = 'C';
        }

        if (!kernel.isvector()) {
            throw new Error("Matrix.filter1d: Kernel must be a vector");
        }
        var K = kernel.getLength(), kd = kernel.getData();
        if (typeof origin === 'string') {
            switch (origin.toUpperCase()) {
            case 'C':
            case 'CL':
                origin = Math.floor((K - 1) / 2);
                break;
            case 'CR':
                origin = Math.ceil((K - 1) / 2);
                break;
            case 'L':
                origin = 0;
                break;
            case 'R':
                origin = K - 1;
                break;
            default:
                throw new Error(errMsg + "unknown origin position '" + origin + "'");
            }
        } else if (typeof origin  === 'number') {
            if (origin < 0) {
                origin += K;
            }
            if (origin < 0 || origin >= K) {
                throw new Error(errMsg + "origin value must satisfy : |origin| < kernel.length");
            }
        }

        // 2. Filtering
        var output = new Matrix(this.getSize(), this.getDataType());
        var id = this.getData(), od = output.getData();

        // Iterator to scan the view
        var view = output.getView();
        var dc = view.getStep(2), lc = view.getEnd(2);
        var dx = view.getStep(1), lx = view.getEnd(1);
        var ly = view.getEnd(0);

        if (origin >= ly / 2) {
            throw new Error('Matrix.filter1d: Kernel is too large.');
        }

        var sum, stop = ly - origin;
        var c, x, nx, y, ny, j, k;
        for (c = 0; c !== lc; c += dc) {
            for (x = c, nx = c + lx; x !== nx; x += dx) {
                for (y = x, ny = x + origin; y < ny; y++) {
                    // This loop code the symmetry
                    for (sum = 0, k = 0, j = 2 * x + origin - y; j > x; k++, j--) {
                        sum += kd[k] * id[j];
                    }
                    for (j = x; k < K; k++, j++) {
                        sum += kd[k] * id[j];
                    }
                    od[y] = sum;
                }
                for (y = x + origin, ny = x + stop; y < ny; y++) {
                    for (sum = 0, k = 0, j = y - origin; k < K; k++, j++) {
                        sum += kd[k] * id[j];
                    }
                    od[y] = sum;
                }
                for (y = x + stop, ny = x + ly; y < ny; y++) {
                    for (sum = 0, k = 0, j = y - origin; j < ny; k++, j++) {
                        sum += kd[k] * id[j];
                    }
                    // This loop code the symmetry
                    for (j = ny - 2; k < K; k++, j--) {
                        sum += kd[k] * id[j];
                    }
                    od[y] = sum;
                }
            }
        }

        // Return the result
        return output;
    };
    /** Apply different filters on rows and columns.
     *
     * @param {Matrix} filterX
     *
     * @param {Matrix} [filterY=filterX]
     *
     * @return {Matrix}
     */
    Matrix_prototype.separableFilter = function (hKernel, vKernel) {
        if (vKernel === undefined) {
            vKernel = hKernel;
        }
        return this
            .filter1d(hKernel).permute([1, 0, 2])
            .filter1d(vKernel).permute([1, 0, 2]);
    };
    /** 2D gaussian blur.
     *
     * __Also see:__
     * {@link Matrix#fastBlur}.
     *
     * @param {Number} sigmaX
     *
     * @param {Number} [sigmaY=sigmaX]
     *
     * @param {Integer} [precision=3]
     *  High number increases the computational time as well as the
     *  quality of the filtering.
     *
     * @return {Matrix}
     */
    Matrix_prototype.gaussian = function (sigmaX, sigmaY, precision) {
        precision = precision || 3;
        var kernelX = Kernel.gaussian(sigmaX, 0, precision);
        var kernelY;
        if (typeof sigmaY === "number") {
            kernelY = Kernel.gaussian(sigmaY, 0, precision);
        } else {
            kernelY = kernelX;
        }
        return this.separableFilter(kernelX, kernelY);
    };
    /** Compute image derivative using a gaussian kernel.
     * Gaussian kernel is computed with 'kernel.gaussian (sigma, 3)'
     * which ensures a good accuracy but takes time.
     *
     * @param {Number} sigma
     *  Derivative order (0, 1) for the X kernel.
     *
     * @returns {Object}
     *  Out image derivatives (Object.{x, y, norm, phase}).
     *
     *     // Compute the gradient
     *     var gradient = im.gaussianGradient(1);
     */
    Matrix_prototype.gaussianGradient = function (sigma) {
        if (!sigma) {
            sigma = 2;
        }
        var kernel1 = Kernel.gaussian(sigma, 1, 3);
        var kernel2 = Kernel.gaussian(sigma, 0, 3);

        var x = this.separableFilter(kernel2, kernel1);
        var y = this.separableFilter(kernel1, kernel2);

        var IPI2 = 0.5 / Math.PI;

        var n = Matrix.zeros(this.getSize()), p = Matrix.zeros(this.getSize());
        var xData = x.getData(), yData = y.getData();
        var nData = n.getData(), pData = p.getData();

        var i, ie;
        for (i = 0, ie = xData.length; i < ie; i++) {
            var a = xData[i], b = yData[i];
            nData[i] = Math.sqrt(a * a + b * b);
            var ph = Math.atan2(b, a) * IPI2;
            pData[i] = ph < 0 ? ph + 1 : ph;
        }

        return {x: x, y: y, norm: n, phase: p};
    };
    /** Compute various differential operators on an image
     * with discret schemes.
     *
     * @param {Boolean} gradx
     *
     * @param {Boolean} grady
     *
     * @param {Boolean} norm
     *
     * @param {Boolean} phase
     *
     * @param {Boolean} laplacian
     *
     * @return {Object}
     *  Return an object with the requested properties.
     *
     * @author
     *  This function was imported from the [Megawave library][1].
     *  And then adapted to work with the Matrix class.
     *  [1]: http://megawave.cmla.ens-cachan.fr/
     */
    Matrix_prototype.gradient = function (gradx, grady, norm, phase, laplacian) {

        var IRAC2   = 0.70710678, RAC8P4  = 6.8284271, IRAC8 = 0.35355339;
        var IRAC2P2 = 0.29289322, IRAC8P4 = 1 / RAC8P4, IPI2 =  0.5 / Math.PI;

        var gradient = {}, xData, yData, nData, pData, lData;
        var size = this.getSize();
        var type = this.getDataType();
        if (gradx) {
            gradient.x = new Matrix(size, type);
            xData = gradient.x.getData();
        }
        if (grady) {
            gradient.y = new Matrix(size, type);
            yData = gradient.y.getData();
        }
        if (norm) {
            gradient.norm = new Matrix(size, type);
            nData = gradient.norm.getData();
        }
        if (phase) {
            gradient.phase = new Matrix(size, type);
            pData = gradient.phase.getData();
        }
        if (laplacian) {
            gradient.laplacian = new Matrix(size, type);
            lData = gradient.laplacian.getData();
        }

        var id = this.getData();

        // Iterator to scan the view
        var view = this.getView();
        var dc = view.getStep(2), lc = view.getEnd(2);
        var dx = view.getStep(1), lx = view.getEnd(1);
        var ly = view.getEnd(0);

        var c, x, nx, y, ny, y0, y1;
        for (c = 0; c !== lc; c += dc) {
            for (x = c + dx, nx = c + lx - dx; x !== nx; x += dx) {
                for (y0 = x - dx, y = x, y1 = x + dx, ny = x + ly - 2; y < ny; y) {
                    var a00 = id[y0], a01 = id[++y0], a02 = id[y0 + 1];
                    var a10 = id[y],  a11 = id[++y],  a12 = id[y  + 1];
                    var a20 = id[y1], a21 = id[++y1], a22 = id[y1 + 1];

                    var c1 = a22 - a00, d1 = a02 - a20;
                    var ax = IRAC2P2 * (a21 - a01 + IRAC8 * (c1 - d1));
                    var ay = IRAC2P2 * (a10 - a12 - IRAC8 * (c1 + d1));

                    if (gradx) {
                        xData[y] = ax;
                    }
                    if (grady) {
                        yData[y] = ay;
                    }
                    if (norm) {
                        nData[y] = Math.sqrt(ax * ax + ay * ay);
                    }
                    if (phase) {
                        var ap = Math.atan2(-ay, ax) * IPI2;
                        pData[y] = (ap < 0) ? (ap + 1) : ap;
                    }
                    if (laplacian) {
                        lData[y] =
                            (IRAC2 * (a00 + a02 + a20 + a22) + (a10 + a01 + a21 + a12)) *
                            IRAC8P4 - a11;
                    }
                }
            }
        }

        return gradient;
    };

    /** Performs an 1D convolution between two vectors.
     *
     * @param {Function} vect
     *
     * @param {String} shape
     *  Can be "full", "same" or "valid".
     *
     * @return {Matrix}
     * @fixme This function must not be in image processing group.
     */
    Matrix_prototype.conv = function (vect, shape) {
        if (!this.isvector() || !vect.isvector()) {
            throw new Error("Matrix.conv: Input must be vector.");
        }

        var id1 = this.getData(), n1 = id1.length;
        var id2 = vect.getData(), n2 = id2.length;

        if (n1 < n2) {
            return vect.conv(this, shape);
        }
        var Type = Tools.checkType(this.getDataType());
        var od = new Type(n1 + n2 - 1), no = od.length;

        var j0, j, nj, i, x, nx, sum;

        // Initial zero padding
        for (x = 0, nx = n2 - 1; x < nx; x++) {
            for (sum = 0, j = 0, nj = x + 1, i = x; j < nj; j++, i--) {
                sum += id1[j] * id2[i];
            }
            od[x] = sum;
        }
        // Central part
        for (x = n2 - 1, j0 = 0, nx = n1; x < nx; x++, j0++) {
            for (sum = 0, j = j0, nj = x + 1, i = n2 - 1; j < nj; j++, i--) {
                sum += id1[j] * id2[i];
            }
            od[x] = sum;
        }
        // Final zero padding
        for (x = n1, j0 = n1 - n2 + 1; x < no; x++, j0++) {
            for (sum = 0, j = j0, i = n2 - 1; j < n1; j++, i--) {
                sum += id1[j] * id2[i];
            }
            od[x] = sum;
        }

        switch (shape) {
        case undefined:
        case 'full':
            return new Matrix(no, od);
        case 'same':
            var orig = Math.ceil(n2 / 2);
            return new Matrix(n1, od.subarray(orig, orig + n1));
        case 'valid':
            return new Matrix(n1 - n2 + 1, od.subarray(n2 - 1, n1));
        default:
            throw new Error("Matrix.conv: Invalid shape parameter.");
        }
    };
    
    var computeImageIntegral = function(im) {
        var view = im.getView(), d = im.getData();
        var dc = view.getStep(2), lc = view.getEnd(2);
        var dx = view.getStep(1), lx = view.getEnd(1), nx;
        var ly = view.getEnd(0), ny;
        var c, y, x;
        for (c = 0; c < lc; c += dc) {
            for (y = c + 1, ny = c + ly; y < ny; y++) {
                d[y] += d[y - 1];
            }
            for (x = c + dx, nx = c + lx; x < nx; x += dx) {
                var sum = d[x];
                d[x] += d[x - dx];
                for (y = x + 1, ny = x + ly; y < ny; y++) {
                    sum += d[y];     
                    d[y] = d[y - dx] + sum;
                }
            }
        }
    };
    /** Gaussian bluring based on box filtering. 
     * It computes a fast approximation of gaussian blur 
     * in constant time.
     *
     * @param {Number} sigmaX
     *  Standard deviation of the gausian.
     * @param {Number} [sigmaY=sigmaX]
     * @param {Number} [k=2]
     *  Number of times than the image is boxfiltered.
     * @return {Matrix}
     */
    Matrix_prototype.fastBlur = function (sx, sy, k) {
        k = k || 3;
        sy = sy || sx;
        var wx = Math.round(Math.sqrt(12 / k * sx * sx + 1) / 2) * 2 + 1;
        var wy = Math.round(Math.sqrt(12 / k * sy * sy + 1) / 2) * 2 + 1;
        var imout = Matrix.zeros(this.getSize());
        // Iterator to scan the view
        var view = this.getView();
        var dc = view.getStep(2), lc = view.getEnd(2);
        var dx = view.getStep(1), lx = view.getEnd(1);
        var ly = view.getEnd(0);

        sy = (wy / 2) | 0;
        sx = ((wx / 2) | 0) * dx;
        var sx2 = ((wx / 2) | 0);

	var nx, ny, c, x, y, y_, yx;
        var cst, csty, cste;

        var imcum = this.im2double();
        for (var p = 0; p < k; p++) {

            computeImageIntegral(imcum);

            var din = imcum.getData(), dout = imout.getData();
            var e = (sx + sy + dx + 1), f = sx + sy, g = -(sx + dx) + sy, h = sx - sy - 1;
            var dinf = din.subarray(f), dinh = din.subarray(h);

            for (c = 0; c < lc; c += dc) {            

                // First rows
                for (y_ = c, y = 0, ny = c + sy + 1; y_ < ny; y_++, y++) {
                    csty = (y + sy + 1);
                    // First columns
                    for (yx = y_, x = 0, nx = y_ + sx + dx; yx < nx; yx += dx, x++) {
                        dout[yx] = dinf[yx] / ((x + sx2 + 1) * csty);
                    }
                    cst = 1 / (wx * csty);
                    // Central columns
                    for (yx = y_ + sx + dx, nx = y_ + lx - sx; yx < nx; yx += dx) {
                        dout[yx] = (dinf[yx] - din[yx + g]) * cst;
                    }
                    cste = din[y_ + lx - dx + sy];
                    // Last columns
                    for (yx = y_ + lx - sx, nx = y_ + lx; yx < nx; yx += dx) {
                        dout[yx] =  cste - din[yx + g];
                        dout[yx] /= ((sx + nx - yx) / dx) * csty;
                    }
                }
                
                // First columns
                for (x = c, nx = c + sx + dx; x < nx; x += dx) {
                    // Central part
                    cst = 1 / (((x - c + sx) / dx + 1) * wy);
                    for (y = x + sy + 1, ny = x + ly - sy; y < ny; y++) {
                        dout[y] = dinf[y] - dinh[y];
                        dout[y] *= cst;
                    }
                }
                // Central part
                cst = 1 / (wx * wy);
                for (x = c + sx + dx, nx = c + lx - sx; x < nx; x += dx) {
                    // Central part
                    for (y = x + sy + 1, ny = x + ly - sy; y < ny; y++) {
                        dout[y] = (din[y - e] + dinf[y] - din[y + g] - dinh[y]) * cst;
                    }
                }
                // Last columns
                for (x = c + lx - sx, nx = c + lx; x < nx; x += dx) {
                    // Central part
                    cst = 1 / (((c + lx - x + sx) / dx) * wy);
                    for (y = x + sy + 1, ny = x + ly - sy; y < ny; y++) {
                        dout[y] = din[y - e] + din[c + lx - dx + y - x + sy] - din[c + lx - dx + y - x - sy - 1] - din[y + g];
                        dout[y] *= cst;
                    }
                }
                
                // last rows
                for (y = c + ly - sy, ny = c + ly; y < ny; y++) {
                    // First columns
                    for (x = y, nx = y + sx + dx; x < nx; x += dx) {
                        dout[x] = din[x - y + c + ly - 1 + sx] - dinh[x];
                        dout[x] /= ((x - y + sx) / dx + 1) * (sy + (ly - (y - c)));
                    }
                    cst = 1 / (wx * (sy + (ly - (y - c))));
                    // Central columns
                    for (x = y + sx + dx, nx = y + lx - sx; x < nx; x += dx) {
                        dout[x] = din[x - y + c + ly - 1 + sx] - din[x - y + c + ly - 1 - sx - dx] + din[x - e] - dinh[x];
                        dout[x] *= cst;
                    }
                    // Last columns
                    for (x = y + lx - sx, nx = y + lx; x < nx; x += dx) {
                        dout[x] = din[c + lx - dx + ly - 1] + din[x - e] - din[c + x - y + ly - 1 - sx - dx] - din[c + lx - dx + y - c - sy - 1];
                        dout[x] /= ((lx - (x - y) + sx) / dx) * (sy + (ly - (y - c)));
                    }
                }
            }
            var tmp = imout;
            imout = imcum;
            imcum = tmp;
        }
        return tmp;
    };

    
    //////////////////////////////////////////////////////////////////
    //                          KERNEL TOOLS                        //
    //////////////////////////////////////////////////////////////////


    /** Holds kernels generation for filtering.
     * @private
     */
    var Kernel = {};
    /** Normalize a kernel.
     * Normalization such that its L1 norm is 1.
     *
     * @param {Array} kernel
     *  The kernel.
     *
     * @return {Array}
     *  The same array, but normalized.
     */
    Kernel.normalize = function (kernel) {
        var i;
        var N = kernel.length;

        // L1 norm of the kernel
        var sum = 0;
        for (i = 0; i < N; i++) {
            sum += Math.abs(kernel[i]);
        }

        // Normalize
        if (sum !== 0) {
            for (i = 0; i < N; i++) {
                kernel[i] /= sum;
            }
        }

        // Return it
        return kernel;
    };
    /** Compute a gaussian kernel and its derivatives.
     *
     * @param {Number} sigma
     *   Standard deviation of kernel
     *
     * @param {Integer} [order=0]
     *   Derivative order: 0, 1 or 2
     *
     * @param {Number} [precision=3.0]
     *   Precision of the kernel
     *
     * @return {Float32Array}
     *   The gaussian Kernel
     */
    Kernel.gaussian = function (sigma, order, precision) {
        var i, x;

        // Kernel parameters
        if (precision === undefined) {
            precision = 3;
        }
        if (order === undefined) {
            order = 0;
        }

        var size = 1 + 2 * Math.ceil(sigma * Math.sqrt(precision * 2 * Math.log(10)));
        var kerOut = new Matrix.dataType(size);
        var shift = (size - 1) / 2;
        var sum = 0, abs = Math.abs;
        for (i = 0; i < (size + 1) / 2; i++) {
            x = i - shift;
            var tmp = 1 / (Math.sqrt(2 * Math.PI) * sigma);
            tmp *= Math.exp(-(x * x) / (2 * sigma * sigma));
            kerOut[i] = kerOut[size - 1 - i] = tmp;
        }

        // Generate the kernel
        switch (order) {

        case 0:
            for (i = 0, sum = 0; i < kerOut.length; i++) {
                sum += abs(kerOut[i]);
            }
            break;

        case 1:
            for (i = 0, sum = 0; i < kerOut.length; i++) {
                x = i - shift;
                kerOut[i] *= -x / Math.pow(sigma, 2);
                sum += abs(x * kerOut[i]);
            }
            break;

        case 2:
            for (i = 0, sum = 0; i < kerOut.length; i++) {
                x = i - shift;
                kerOut[i] *= (x * x / Math.pow(sigma, 4) - 1 / Math.pow(sigma, 2));
                sum += abs(kerOut[i]);
            }
            sum /= kerOut.length;
            for (i = 0; i < kerOut.length; i++) {
                kerOut[i] -= abs(sum);
            }
            for (i = 0, sum = 0; i < kerOut.length; i++) {
                x = i - shift;
                sum += abs(0.5 * x * x * kerOut[i]);
            }
            break;

        default:
            throw new Error('Kernel.gaussian: Derive order can be 0,1 or 2 but not ' + order);
        }

        if (sum !== 0) {
            for (i = 0; i < kerOut.length; i++) {
                kerOut[i] /= sum;
            }
        }

        return new Matrix(kerOut.length, kerOut);
    };


    //////////////////////////////////////////////////////////////////
    //                     MISCELLANEOUS FUNCTIONS                  //
    //////////////////////////////////////////////////////////////////


    /** @class Matrix */

    /** Display an image into an HTML5 canvas element.
     *
     * __Also see:__
     *  {@link Matrix#imagesc},
     *  {@link Matrix#imread}.
     *
     * @param {String|HTMLCanvasElement} canvas
     *  Can be either a canvas `id` or a canvas object.
     *
     * @param {Number|String} [scale=1]
     *  Can be a number providing the magnification factor or `fit`
     *  specifying that the image will fit the canvas dimension.
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.imshow = function (canvas, scale) {
        if (isNode) {
            console.warn("Matrix.imshow: function not available in nodejs.");
            return;
        }

        var errMsg = this.constructor.name + '.imshow: ';
        var width = this.getSize(1);
        var height = this.getSize(0);

        // Optional parameters
        if (typeof canvas === 'string' && document.getElementById(canvas)) {
            canvas = document.getElementById(canvas);
        }
        var w;
        if (canvas === undefined || canvas === null) {
            canvas = document.createElement("canvas");
            w = window.open("", "", "width=" + width, "height=" + height);
            w.document.body.appendChild(canvas);
        }

        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new Error(errMsg + 'Invalid canvas.');
        }

        var imageData = this.getImageData();
        if (scale === undefined || scale === 1) {
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').putImageData(imageData, 0, 0);
        } else {
            if (scale === 'fit') {
                // Compute the scale
                var hScale = canvas.width / width;
                var vScale = canvas.height / height;
                scale = Math.min(hScale, vScale);
                scale = scale > 1 ? 1 : scale;
            } else if (typeof scale !== 'number') {
                throw new Error(errMsg + 'scale must be a number or \'fit\'');
            }
            canvas.width = Math.round(width * scale);
            canvas.height = Math.round(height * scale);

            var canvasTmp = document.createElement('canvas');
            canvasTmp.width = width;
            canvasTmp.height = height;
            var ctxTmp = canvasTmp.getContext('2d');
            ctxTmp.putImageData(imageData, 0, 0);
            canvas.getContext('2d')
                .drawImage(canvasTmp,
                           0, 0, width, height,
                           0, 0, canvas.width, canvas.height);
        }

        return w || this;
    };
    /** Display a Matrix into an HTML5 canvas element in a popup
     * and open the the print menu.
     *
     * __Also see:__
     *  {@link Matrix#imshow}.
     *
     * @chainable
     */
    Matrix_prototype.print = function () {
        var w = this.imshow();
        w.print();
        w.close();
        return this;
    };
    /** Display a Matrix into an HTML5 canvas element by streching
     * the values in order to fit the display range.
     *
     * __Also see:__
     *  {@link Matrix#imshow}.
     *
     * @param {String|HTMLCanvasElement} canvas
     *  Can be either a canvas `id` or a canvas object.
     *
     * @param {Number|String} [scale=1]
     *  Can be a number providing the magnification factor or `fit`
     *  specifying that the image will fit the canvas dimension.
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.imagesc = function (canvas, scale) {
        var min = this.min().getDataScalar(), max = this.max().getDataScalar();
        if (min - max === 0) {
            return this['-'](min).imshow(canvas, scale);
        }
        return this['-'](min)['./'](max - min).imshow(canvas, scale);
    };
    /** Apply an affine transformation to an Image.
     * __Only works with `Uint8` images.__
     *
     * @param {Matrix} transform
     *  3x3 Matrix.
     *
     * @return {Matrix}
     */
    Matrix_prototype.imtransform = function (transform) {

        transform = Matrix.toMatrix(transform);

        var h = this.getSize(0), w = this.getSize(1);
        var c1 = createCanvas(w, h), ctx1 = c1.getContext("2d");
        var c2 = createCanvas(), ctx2 = c2.getContext("2d");

        var p = Matrix.toMatrix([0, 0, 1, w, 0, 1, w, h, 1, 0, h, 1]).reshape([3, 4]);
        var pp = transform.mtimes(p).transpose();
        var max = pp.max(0).getData(), min = pp.min(0).getData();
        var imageData = this.getImageData();
        ctx1.putImageData(imageData, 0, 0);

        var d = transform.getData();
        c2.width = max[0] - min[0];
        c2.height = max[1] - min[1];
        ctx2.translate(-min[0], -min[1]);
        ctx2.transform(d[0], d[1], d[3], d[4], d[6], d[7]);
        ctx2.drawImage(c1, 0, 0);
        return Matrix.imread(c2).convertImage(this.type());
    };
    /** Compute the histogram of a grey-level image.
     *
     * @param {Matrix} [bins=256]
     * number of bins used for the histogram.
     *
     * @return {Matrix}
     */
    Matrix_prototype.imhist = function (bins) {

        if (!this.ismatrix()) {
            throw new Error("Matrix.imhist: This function only works on grey-level images.");
        }

        bins = bins || 256;
        var data = this.getData();
        var hist = Matrix.zeros(bins, 1), hd = hist.getData();

        var M;
        if (this.isinteger()) {
            M = Matrix.intmax(this.type());
        } else if (this.islogical()) {
            M = 1;
            bins = 2;
        } else if (this.isfloat()) {
            M = 1;
        } else {
            throw new Error("Matrix.imhist: unknow data type.");
        }
        var i, ie, cst = 1 / M * bins;
        for (i = 0, ie = data.length; i < ie; i++) {
            hd[data[i] * cst | 0]++;
        }
        return hist;
    };
    
    (function () {
        var computeCDF = function (src, n) {
            var srcLength = src.length;

            // Compute histogram and histogram sum:
            var hist = new Float32Array(n);
            var i, floor = Math.floor;
            for (i = 0; i < srcLength; ++i) {
                var bin = floor(src[i] * n);
                bin = bin >= n ? n - 1 : bin;
                ++hist[bin];
            }
            var norm = 1 / srcLength;
            // Compute integral histogram:
            for (i = 1; i < n; ++i) {
                hist[i] += hist[i - 1];
                hist[i - 1] *= norm;
            }
            hist[i - 1] *= norm;
            return hist;
        };

        /** Perform an histogram equalisation.
         * __Until now it only works with Uint8 images.__
         *
         * @param {Matrix} bins
         * number of bins used for the histogram.
         *
         * @return {Matrix}
         */
        Matrix_prototype.histeq = function (n) {
            var im = this.im2double();
            var src = im;
            if (this.getSize(2) > 1) {
                src = im.applycform("RGB to HSL").get([], [], 2);
            } 
            src = src.getData();
            var hist = computeCDF(src, n);

            // Equalize image:
            var floor = Math.floor;
            for (var i = 0; i < src.length; ++i) {
                src[i] = hist[floor(src[i] * (n - 1))];
            }
            var lumOut = new Matrix([im.size(0), im.size(1)], src);
            im.set([], [], 2, lumOut);
            if (this.getSize(2) > 1) {
                im.applycform("HSL to RGB");
            }
            return im;
        };
    })();

    /** Transform a RGB image to a gray level image.
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.rgb2gray = function () {
        if (this.ndims() !== 3 || this.getSize(2) < 3) {
            throw new Error('Matrix.rgb2gray: Matrix must be an ' +
                            'image with RGB components.');
        }

        // Scaning the from the second dimension (dim = 1)
        var sizeOut = this.getSize();
        sizeOut[2] -= 2;
        var imOut = new Matrix(sizeOut, this.getDataType());
        var id = this.getData(), od = imOut.getData();

        // Iterator to scan the view
        var view = this.getView();
        var ly = view.getEnd(0), ny;
        var dx = view.getStep(1), lx = view.getEnd(1), nx;
        var dc = view.getStep(2);

        var x, y0, y1, y2;
        for (x = 0, nx = lx; x !== nx; x += dx) {
            y0 = x;
            y1 = x + dc;
            y2 = x + 2 * dc;
            for (ny = x + ly; y0 < ny; y0++, y1++, y2++) {
                od[y0] = 0.3 * id[y0] + 0.59 * id[y1] + 0.11 * id[y2];
            }
        }

        // Copy alpha channel
        if (this.getSize(2) === 4) {
            var alphaOut = od.subarray(dc);
            var alphaIn = id.subarray(3 * dc);
            alphaOut.set(alphaIn);
        }

        return imOut;
    };

})(Matrix, Matrix.prototype);


//////////////////////////////////////////////////////////////////
//                  REGION AND IMAGE PROPERTIES                 //
//////////////////////////////////////////////////////////////////


(function () {

    /* Class for Tree creation */
    var Node = function (x, y, parent) {
        this.x = x;
        this.y = y;
	this.parent = parent;
    };
    Node.prototype.initChildren = function (w, h) {
        var x = this.x, y = this.y;
        if (y + 1 < h) {
	    this.top = new Node(x, y + 1, this);
        }
        if (y - 1 >= 0) {
	    this.bottom = new Node(x, y - 1, this);
        }
        if (x + 1 < w) {
	    this.left = new Node(x + 1, y, this);
        }
        if (x - 1 >= 0) {
	    this.right = new Node(x - 1, y, this);
        }
    }; 
    Node.prototype.remove = function (n) {
        if (this.bottom === n) {
            this.bottom = undefined;
        } else if (this.top === n) {
            this.top = undefined;
        } else if (this.right === n) {
            this.right = undefined;
        } else if (this.left === n) {
            this.left = undefined;
        }
        return this;
    };
    Node.prototype.getNext = function () {
        if (this.top) {
	    return this.top;
        }
        if (this.bottom) {
	    return this.bottom;
        }
        if (this.left) {
	    return this.left;
        }
        if (this.right) {
	    return this.right;
        }
        if (this.parent) {
            return this.parent.remove(this).getNext();
        }
        return undefined;
    };
    
    /** From an image and a pixel request select neighbour pixels with a similar values
     * (RGB or grey level).
     * @param{Number} xRef 
     *  x coordinate of the pixel.
     * @param{Number} yRef 
     *  x coordinate of the pixel.
     * @param{Number} t 
     *  threshold on the distance
     * @return{Matrix}
     *  Return a Matrix with boolean values.
     */
    Matrix.prototype.getConnectedComponent = function (xRef, yRef, t) {
        
        // Get image height, width and depth
        var h = this.getSize(0), w = this.getSize(1), d = this.getSize(2);
        
        // Squared threshold
        var t2 = t * t;
        
        // Connected component and visited pixels
        var cc = new Matrix([h, w], 'logical'), isVisited = new Matrix([h, w], 'logical');
        var ccd = cc.getData(), imd = this.getData(), ivd = isVisited.getData();

        // For debug, has to be removed
        window.CC = cc;
        window.IV = isVisited;

        var cRef = yRef + h * xRef;
        var compare_pixels;
        if (d === 1) {
            if (this.type() === "logical") {
                
            } else  {
	        // Grey value of pixel request
	        var v = imd[cRef];
	        compare_pixels = function (c) {
	            var dTmp = imd[c] - v;
	            return dTmp * dTmp < t2;
	        };
            }
        } else if (d === 3) {
	    // RGB values of pixel request
	    var rRef = imd[cRef], gRef = imd[cRef + h * w], bRef = imd[cRef + h * w * 2];
	    // Image channel subarrays
	    var rd = imd, gd = imd.subarray(h * w), bd = imd.subarray(h * w * 2);
	    compare_pixels = function (c) {
	        var dTmp1 = rd[c] - rRef, dTmp2 = gd[c] - gRef, dTmp3 = bd[c] - bRef;
	        return dTmp1 * dTmp1 + dTmp2 * dTmp2 + dTmp3 * dTmp3 < t2;
	    };
        } else {
	    throw new Error("Matrix.getConnectedComponent: This function only support " +
                            "images with depth 1 or 3.");
        }

        var root = new Node(xRef, yRef), current = root;
        
        while (current !== undefined) {
            var x = current.x, y = current.y, c = y + h * x;
            
	    if (ivd[c] === 1) {
	        current = current.parent.remove(current).getNext();
                continue;
	    }
	    ivd[c] = 1;
	    if (compare_pixels(c)) {
	        ccd[c] = 1;
                current.initChildren(w, h);
	    }
            current = current.getNext();
        }

        return cc;
    };

    Matrix.prototype.bwconncomp = function () {};
    
})();


//////////////////////////////////////////////////////////////////
//                   MORPHOLOGICAL OPERATIONS                   //
//////////////////////////////////////////////////////////////////


(function (Matrix, Matrix_prototype) {
    "use strict";

    var getLoopIndices = function (FX, FY, w, h) {
        var HFY = FY >> 1, HFX = FX >> 1;
        return {
            xS: new Int32Array([0, 0, 0, HFX, HFX, HFX, w - HFX, w - HFX, w - HFX]),
	    xE: new Int32Array([HFX, HFX, HFX, w - HFX, w - HFX, w - HFX, w, w, w]),
            yS: new Int32Array([0, HFY, h - HFY, 0, HFY, h - HFY, 0, HFY, h - HFY]),
	    yE: new Int32Array([HFY, h - HFY, h, HFY, h - HFY, h, HFY, h - HFY, h]),
        
	    jS: new Int32Array([0, 0, 0, -HFX, -HFX, -HFX, -HFX, -HFX, -HFX]),
	    jE: new Int32Array([HFX + 1, HFX + 1, HFX + 1, HFX + 1, HFX + 1, HFX + 1, w, w, w]),
	    iS: new Int32Array([0, -HFY, -HFY, 0, -HFY, -HFY, 0, -HFY, -HFY]),
	    iE: new Int32Array([HFY + 1, HFY + 1, h, HFY + 1, HFY + 1, h, HFY + 1, HFY + 1, h]),
        
	    lS: new Int32Array([HFX, HFX, HFX,  0,  0,  0 ,      0,       0,       0]),
	    lE: new Int32Array([ FX,  FX,  FX, FX, FX, FX, HFX + w, HFX + w, HFX + w]),
	    kS: new Int32Array([HFY,  0,       0, HFY,  0,       0, HFY,  0,       0]),
	    kE: new Int32Array([ FY, FY, HFY + h,  FY, FY, HFY + h,  FY, FY, HFY + h]),
            
            jxS: new Int32Array([0, 0, 0, 1, 1, 1, 1, 1, 1]),
	    jxE: new Int32Array([1, 1, 1, 1, 1, 1, 0, 0, 0]),
	    iyS: new Int32Array([0, 1, 1, 0, 1, 1, 0, 1, 1]),
	    iyE: new Int32Array([1, 1, 0, 1, 1, 0, 1, 1, 0])
        };
    };
    
    var f_dilate = function (d, m, h, fh, yx, is, js, ks, ie, ls, _je) {
        var max = -Infinity;
        for (var _j = js, _l = ls; _j < _je; _j += h, _l += fh) {
	    for (var ij = is + _j, kl = ks + _l, ije = ie + _j; ij < ije; ij++, kl++) {
                if (d[ij] > max && m[kl]) {
		    max = d[ij];
                }
	    }
        }
        return max;
    };
    var f_erode = function (d, m, h, fh, yx, is, js, ks, ie, ls, _je) {
        var min = Infinity;
        for (var _j = js, _l = ls; _j < _je; _j += h, _l += fh) {
	    for (var ij = is + _j, kl = ks + _l, ije = ie + _j; ij < ije; ij++, kl++) {
                if (d[ij] < min && m[kl]) {
		    min = d[ij];
                }
	    }
        }
        return min;
    };
    var f_filt = function (d, m, h, fh, yx, is, js, ks, ie, ls, _je) {
        var sum = 0;
        for (var _j = js, _l = ls; _j < _je; _j += h, _l += fh) {
	    for (var ij = is + _j, kl = ks + _l, ije = ie + _j; ij < ije; ij++, kl++) {
		sum += d[ij] * m[kl];
	    }
        }
        return sum;
    };
    var applyFilter = function (im, mask, f) {
        mask = Matrix.toMatrix(mask);
        var h = im.getSize(0), w = im.getSize(1), d = im.getSize(2), id = im.getData();
        var out = new Matrix(im.getSize(), im.type()), od = out.getData();

        // Filter size and data
        var FY = mask.getSize(0), FX = mask.getSize(1), md = mask.getData();
        
        // Loop indices
        var li = getLoopIndices(FX, FY, w, h);
        // Loop start (S) and end (E) indices
        var xS  = li.xS,  xE  = li.xE,   yS  = li.yS,  yE  = li.yE,
	    jS  = li.jS,  jE  = li.jE,   iS  = li.iS,  iE  = li.iE,
	    lS  = li.lS,  kS  = li.kS,
            jxS = li.jxS, jxE = li.jxE, iyS = li.iyS, iyE = li.iyE;

        // Loop indices
        var b, c, x, y, _x, yx, _j, ij, _l, kl;
        // Loop end indices
        var ce, xe, ye, ije;
        for (c = 0, ce = id.length; c < ce; c += w * h) {
            var idc = id.subarray(c, c + w * h), odc = od.subarray(c, c + w * h);
            for (b = 0; b < 9; b++) {
	        for (x = xS[b], xe = xE[b], _x = x * h; x < xe; x++, _x += h) {
                    var js = (jS[b] + (jxS[b] ? x : 0)) * h, _je = (jE[b] + (jxE[b] ? x : 0)) * h;
                    var ls = (lS[b] - (jxS[b] ? 0 : x)) * FY;
	            for (y = yS[b], ye = yE[b], yx = y + _x; y < ye; y++, yx++) {
                        var is = iS[b] + (iyS[b] ? y : 0), ie = iE[b] + (iyE[b] ? y : 0);
                        var ks = kS[b] - (iyS[b] ? 0 : y);
                        odc[yx] = f(idc, md, h, FY, yx, is, js, ks, ie, ls, _je);
		    }
	        }
	    }
        }
        return out;
    };

    /** Perform an image dilation with a given structuring element.
     *
     * __Also see:__
     * {@link Matrix#imerode},
     * {@link Matrix#imopen},
     * {@link Matrix#imclose}.
     * @param{Matrix} elem
     *  The structuring element
     * @return{Matrix}
     * @matlike
     */
    Matrix_prototype.imdilate = function (mask) {
        return applyFilter(this, mask, f_dilate);
    };
    /** Perform an image erosion with a given structuring element.
     *
     * __Also see:__
     * {@link Matrix#imdilate},
     * {@link Matrix#imopen},
     * {@link Matrix#imclose}.
     * @param{Matrix} elem
     *  The structuring element
     * @return{Matrix}
     * @matlike
     */
    Matrix_prototype.imerode = function (mask) {
        return applyFilter(this, mask, f_erode);
    };
    /** Perform an image opening with a given structuring element.
     *
     * __Also see:__
     * {@link Matrix#imdilate},
     * {@link Matrix#imerode},
     * {@link Matrix#imclose}.
     *
     * @param{Matrix} elem
     *  The structuring element
     * @return{Matrix}
     */
    Matrix_prototype.imopen = function (mask) {
        return applyFilter(applyFilter(this, mask, f_erode), mask, f_dilate);
    };
    /** Perform an image closing with a given structuring element.
     *
     * __Also see:__
     * {@link Matrix#imdilate},
     * {@link Matrix#imerode},
     * {@link Matrix#imopen}.
     *
     * @param{Matrix} elem
     *  The structuring element
     * @return{Matrix}
     * @matlike
     */
    Matrix_prototype.imclose = function (mask) {
        return applyFilter(applyFilter(this, mask, f_dilate), mask, f_erode);
    };
    /** Filter an image.
     * @param{Matrix} filter
     *  The filter to apply (2D kernel).
     * @return{Matrix}
     * @matlike
     * @todo should check if the kernel is separable with an SVD.
     */
    Matrix_prototype.imfilter = function (mask) {
        return applyFilter(this, mask, f_filt);
    };
    /** Median filter.
     *
     * /!\ This function si currently Very slow.
     *
     * @param{Matrix} mask
     *  Boolean mask.
     * @return {Matrix} 
     */ 
    Matrix_prototype.median = function (mask) {
        var arg = (mask.length * 0.5) | 0;
        var f_med = function (d, m, h, fh, yx, is, js, ks, ie, ls, _je) {
            var values = [];
            for (var _j = js, _l = ls; _j < _je; _j += h, _l += fh) {
	        for (var ij = is + _j, kl = ks + _l, ije = ie + _j; ij < ije; ij++, kl++) {
                    if (m[kl]) {
		        values.push(d[ij]);
                    }
	        }
            }
            return values.sort()[arg];
        };
        return applyFilter(this, mask, f_med);
    };
    /** Bilateral filtering.
     *
     * __Also see:__
     * {@link Matrix#imfilter}.
     *
     * @param {Number} sigma_s
     *  Value for spacial sigma.
     *
     * @param {Number} sigma_i
     *  Value for intensity sigma.
     *
     * @param {Number} [precision=3]
     *  used to compute the window size (size = precision * sigma_s).
     *
     * @return {Matrix}
     */
    Matrix_prototype.imbilateral = function (sigma_s, sigma_i, prec) {
        prec = prec || 3;
        var mask = Matrix.fspecial('gaussian', Math.round(prec * sigma_s / 2) * 2 + 1, sigma_s);
        var cst = -1 / (2 * sigma_i);
        var f_bilat = function (d, m, h, fh, yx, is, js, ks, ie, ls, _je) {
            var sum = 0, val = 0, v = d[yx];
            for (var _j = js, _l = ls; _j < _je; _j += h, _l += fh) {
	        for (var ij = is + _j, kl = ks + _l, ije = ie + _j; ij < ije; ij++, kl++) {
    	            var tmp = v - d[ij];
                    var weight = m[kl] * Math.exp(cst * tmp * tmp);
                    sum += weight;
                    val += d[ij] * weight;
		    //sum += d[ij] * m[kl];
	        }
            }
            return val / sum;
        };
        return applyFilter(this, mask, f_bilat);
    }
    
    /** Compute the PSNR of two signal of the same size.
     * __See also :__
     * {@link Matrix#norm}.
     * @param {Matrix} signal
     * @param {Matrix} ref
     * @return {Matrix}
     *  Scalar Matrix containing the PSNR value.
     * @method psnr
     */
    Matrix.psnr = function (A, B, peakval) {
        A = Matrix.toMatrix(A);
        B = Matrix.toMatrix(B);
        Tools.checkSizeEquals(A.size(), B.size());
        if (!Tools.isSet(peakval)) {
            var tA = A.type(), tB = B.type();
            var peakval1 = A.isfloat() ? 1 : Matrix.intmax(tA) - Matrix.intmin(tB);
            var peakval2 = B.isfloat() ? 1 : Matrix.intmax(tB) - Matrix.intmin(tB);
            peakval = Math.max(peakval1, peakval2);
        } else {
            peakval = 1;
        }
        var dRef = B.getData(), d2 = A.getData();
        var i, ie, ssd = 0;
        for (i = 0, ie = d2.length; i < ie; i++) {
            var tmp = dRef[i] - d2[i];
            ssd += tmp * tmp;
        }
        return Matrix.toMatrix(10 * Math.log10(peakval * peakval * ie / ssd));
    };
    
})(Matrix, Matrix.prototype);
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

(function (Matrix, Matrix_prototype) {
    'use strict';
    
    /** @class Matrix */
    var filter1DPad = function (y0, o, oys, ny, dy, ody, orig, K, kdy, ly, isOdd, kernelL, kernelH, idL, idH, odL, odH) {
        var y, oy, k, s, sumL, sumH;
        y0 += (K - 1) * kdy - orig;
        ny -= orig;
        for (y = y0, oy = o + oys; y < ny; y += dy, oy += ody) {
            for (k = 0, s = y + orig, sumL = 0, sumH = 0; k < K; k++, s -= kdy) {
                sumL += kernelL[k] * idL[s];
                sumH += kernelH[k] * idH[s];
            }
            odL[oy] += sumL;
            odH[oy] += sumH;
        }
    };
    var filter1DPadMono = function (y0, o, oys, ny, dy, ody, orig, K, kdy, ly, isOdd, kernel, id, od) {
        var y, oy, k, s, sum;
        y0 += (K - 1) * kdy - orig;
        ny -= orig;
        for (y = y0, oy = o + oys; y < ny; y += dy, oy += ody) {
            for (k = 0, s = y + orig, sum = 0; k < K; k++, s -= kdy) {
                sum += kernel[k] * id[s];
            }
            od[oy] += sum;
        }
    };

    var filter1DPadDebug = function (y0, o, oys, ny, dy, ody, orig, K, kdy, ly, isOdd, kernelL, kernelH, idL, idH, odL, odH) {
        var y, oy, k, s, sumL, sumH;
        console.log("y0", y0, "ny", ny, "dy", dy, "oys", oys, "ody", ody);
        console.log("orig", orig, "K", K, "Kdy", kdy);
        y0 += (K - 1) * kdy - orig;
        ny -= orig;// + (isOdd ? 1 : 0)
        console.log("y0", y0, "ny", ny, orig);
        for (y = y0, oy = o + oys; y < ny; y += dy, oy += ody) {
            var sig = [], fil = [], valL = [], valk = [];
            for (k = 0, s = y + orig, sumL = 0, sumH = 0; k < K; k++, s -= kdy) {
                sig.push(s);
                fil.push(k);
                valL.push(idL[s]);
                valk.push(kernelL[k]);
                sumL += kernelL[k] * idL[s];
                sumH += kernelH[k] * idH[s];
            }
            console.log("y =", y, "oy =", oy, sig);
            // console.log(oy, valL, y, ny);
            // console.log(oy, valk, y, ny);
            // console.log(sumL, sumH, sumH + sumL);
            odL[oy] += sumL;
            odH[oy] += sumH;
        }
        console.log("");
    };
    var filter1DPadCheck = function (y0, o, oys, ny, dy, ody, orig, K, kdy, ly, isOdd, kernelL, kernelH, idL, idH, odL, odH) {
        var y, oy, k, s, sumL, sumH;
        y0 += (K - 1) * kdy - orig;
        ny -= orig;
        if (odL.length !== odH.length) {
            throw new Error("Output length error");
        }
        if (idL.length !== idH.length) {
            throw new Error("input length error");
        }
        for (y = y0, oy = o + oys; y < ny; y += dy, oy += ody) {
            for (k = 0, s = y + orig, sumL = 0, sumH = 0; k < K; k++, s -= kdy) {
                if (k < 0 || k >= kernelL.length) {
                    throw new Error("Kernel error");
                }
                if (s < 0 || s >= idL.length) {
                    throw new Error("Input error");
                }
                sumL += kernelL[k] * idL[s];
                sumH += kernelH[k] * idH[s];
            }
            if (oy < 0 || oy >= odL.length) {
                throw new Error("Output error");
            }
            odL[oy] += sumL;
            odH[oy] += sumH;
        }
    };
    var filter1DPadMonoCheck = function (y0, o, oys, ny, dy, ody, orig, K, kdy, ly, isOdd, kernel, id, od) {
        var y, oy, k, s, sum;
        y0 += (K - 1) * kdy - orig;
        ny -= orig;
        for (y = y0, oy = o + oys; y < ny; y += dy, oy += ody) {
            for (k = 0, s = y + orig, sum = 0; k < K; k++, s -= kdy) {
                if (k < 0 || k >= kernel.length) {
                    throw new Error("Kernel error");
                }
                if (s < 0 || s >= id.length) {
                    throw new Error("Input error");
                }
                sum += kernel[k] * id[s];
            }
            if (oy < 0 || oy >= od.length) {
                throw new Error("Output error");
            }
            od[oy] += sum;
        }
    };
    var filter1D, filter1DMono, dwtmode;
    
    /** Select or return the mode used for bordering management.
     *   Available modes are :
     *   - "per", for periodic, it leads to the shortest representation,
     *   - "sym", for symmetric boundary (default mode),
     *   - "nn", for nearest neighbour boundary,
     *   - "symw", for symmetric boundary with whole point,
     *   - "zpd". zero padding boundary.
     *
     *  @param {string} mode
     *   The mode to be used.
     *  @return {String} 
     *   Returns the current or new mode.
     */
    Matrix.dwtmode = function (mode) {
        if (mode === undefined) {
            return dwtmode;
        }
        mode = mode.toLowerCase();
        switch (mode) {
        case "per":
        case "sym":
        case "symw":
        case "zpd":
        case "nn":
            filter1D = filter1DPad;
            filter1DMono = filter1DPadMono;
            break;
        case "debug_sym":
        case "debug_symw":
        case "debug_zpd":
        case "debug_nn":
            mode = mode.substr(6);
            filter1D = filter1DPadDebug;
            break;
        case "check_sym":
        case "check_symw":
        case "check_zpd":
        case "check_nn":
        case "check_per":
            mode = mode.substr(6);
            filter1D = filter1DPadCheck;
            filter1DMono = filter1DPadMonoCheck;
            break;
        default:
            throw new Error("Matrix.dwtmode: invalid mode " + mode + "."); 
        }
        dwtmode = mode;
        return dwtmode;
    };
    Matrix.dwtmode("sym");

    var filterND = function (inL, inH, vI, name, forward, origin, sub, outL, outH, vO) {
        var wav = Matrix.wfilters(name, forward ? 'd' : 'r');
        var kL = wav[0].getData(), kH = wav[1].getData(), K = kL.length;
        
        origin = (origin === 'cl' ? Math.floor : Math.ceil)((K - 1) / 2);
        var isOdd = vI.getSize(0) % 2 ? true : false; 
     
        var ys = vI.getFirst(0), dy = vI.getStep(0);
        var ly = vI.getEnd(0);
        var oys = vO.getFirst(0), ody = vO.getStep(0);

        var orig = origin * dy;
        var kdy = dy;
        dy *= sub;

        var itI = vI.getIterator(1), itO = vO.getIterator(1);
        var y, i, it = itI.iterator, bi = itI.begin, ei = itI.end();
        var oy, o, ot = itO.iterator, bo = itO.begin;

        var s, sTmp, sumL, sumH;
        var yx0, nyx;
        if (!inL || !inH) {
            var id = (inL || inH).getData(), 
                od = (inL ? outL : outH).getData(),
                k = inL ? kL : kH;
            for (i = bi(), o = bo(); i !== ei; i = it(), o = ot()) {
                yx0 = ys + i;
                nyx = ly + i;
                filter1DMono(yx0, o, oys, nyx, dy, ody, orig, K, kdy, ly, isOdd, k, id, od);
            }
        } else {
            var idL = inL.getData(),  idH = inH.getData(),
                odL = outL.getData(), odH = outH.getData();
            for (i = bi(), o = bo(); i !== ei; i = it(), o = ot()) {
                yx0 = ys + i;
                nyx = ly + i;
                filter1D(yx0, o, oys, nyx, dy, ody, orig, K, kdy, ly, isOdd, kL, kH, idL, idH, odL, odH);
            }
        }
    };

    var zeros = Matrix.zeros;
    
    var getPaddingInfos = function (name, s) {
        var wav = Matrix.wfilters(name, 'd');
        var K = wav[0].getData().length;

        var isOdd = s % 2 ? true : false;
        var f = Math.floor, c = Math.ceil;
        // left and right part of filter (computed on reversed filter)
        var lk = f((K - 1) / 2), rk = c((K - 1) / 2);
        // Left and right input padding
        var li = K - 2, ri = K - 2 + (isOdd ? 1 : 0);
        // Left and right output padding
        var lo = f(li / 4), ro = c(ri / 4);
        // On odd signal, the length of output corresponding to
        // the signal without considering padding depend if we start
        // on the first or on the second value. This starting point
        // depends itself on if we have K % 4 equal to zero or not. 
        if (isOdd && (K % 4) !== 0) {
            ro--;
        }
        if (dwtmode === 'per') {
        } 
        return {"lk": lk, "rk": rk, "li": li, "lo": lo, "ri": ri, "ro": ro};
    };
    var padTest = function (isOdd) {
        console.log("For " + (isOdd ? "odd" : "even") + " signal");
        var data = {}, f = Math.floor, c = Math.ceil;
        for (var K = 2; K < 16; K += 2) {
            data[K] = getPaddingInfos(K, isOdd ? 1 : 2);
        }
        console.table(data, ["lk", "rk", "li", "ri", "lo", "ro"]);
    };

    var dwt = function (s, name, dim) {
        dim = dim || 0;
        var size = s.getSize();
        var p = getPaddingInfos(name, size[dim]);
        size[dim] = Math.ceil(size[dim] / 2) + p.ro + p.lo;
        if (p.li !== 0 || p.ri !== 0) {
            s = s.paddim(dwtmode === "per" ? "per2" : dwtmode, dim, [p.li, p.ri]);
        }
        // Create output data
        var dL = zeros(size), dH = zeros(size);
        var v = dL.getView().swapDimensions(0, dim);
        var iV = s.getView().swapDimensions(0, dim);
        // H filtering from signal to output
        filterND(s, s, iV, name, true, 'cr', 2, dL, dH, v);
        if (dwtmode === "per") {
            var K = Matrix.wfilters(name)[0].numel();
            var lc = Math.ceil((K - 2) / 4), rc = Math.floor((K - 2) / 4);
            v = v.restore().selectDimension(dim, [lc, -rc - 1]);
            dL = dL.extractViewFrom(v);
            dH = dH.extractViewFrom(v);
        }   
        return [dL, dH];
    };
    var idwt = function (bands, name, dim, out) {
        dim = dim || 0;
        var n = bands[0] ? 0 : 1;
        var bL = bands[0], bH = bands[1];
        if (dwtmode === "per") {
            var K = Matrix.wfilters(name)[0].numel();
            var lc = Math.ceil((K - 2) / 4), rc = Math.floor((K - 2) / 4);
            bL = bL ? bL.paddim(dwtmode, dim, [lc, rc]) : undefined;
            bH = bH ? bH.paddim(dwtmode, dim, [lc, rc]) : undefined;
        }   

        var p = getPaddingInfos(name, (bL || bH).getSize(dim));
        var offset = p.lk + p.rk;

        var size = (bL || bH).getSize();
        size[dim] = 2 * size[dim] + 1; 
        var dL = bL ? zeros(size) : undefined,
            dH = bH ? zeros(size) : undefined,
            dV = new MatrixView(size).selectDimension(dim, [1, 2, -1]);

        if (dL) {
            bL.extractViewTo(dV, dL);
        }
        if (dH) {
            bH.extractViewTo(dV, dH);
        }

        // Out array
        dV.restore().swapDimensions(0, dim);
        size[dim] -= offset;
        if (out !== undefined && !Tools.checkSizeEquals(out.getSize(), size)) {
            throw new Error("idwt: Wrong output size.");
        }
        out = out || zeros(size);
        var vO = out.getView().swapDimensions(0, dim);

        // Process scale
        filterND(dL, dH, dV, name, false, 'cl', 1, out, out, vO);
        return out;
    };
    
    var dwt2 = function (im, name) {
        var h = im.getSize(0), w = im.getSize(1), c = im.getSize(2);
        
        // Create output image
        var ph = getPaddingInfos(name, h);
        var hh = Math.ceil(h / 2) + ph.ro + ph.lo;
        if (ph.li !== 0 || ph.ri !== 0) {
            im = im.paddim(dwtmode === "per" ? "per2" : dwtmode, 0, [ph.li, ph.ri]);
        }
        
        // Buffer image
        var bL = zeros(hh, w, c), bH = zeros(hh, w, c);
        var vB = bL.getView();

        // H filtering from image to buffer
        var vI = im.getView();
        filterND(im, im, vI, name, true, 'cr', 2, bL, bH, vB);

        var pw = getPaddingInfos(name, w);
        var hw = Math.ceil(w / 2) + pw.ro + pw.lo;
        if (pw.li !== 0 || pw.ri !== 0) {
            bH = bH.paddim(dwtmode, 1, [pw.li, pw.ri]);
            bL = bL.paddim(dwtmode, 1, [pw.li, pw.ri]);
            vB = bL.getView();
        }

        // V filtering from buffer to data
        var dA = zeros(hh, hw, c), dV = zeros(hh, hw, c),
            dH = zeros(hh, hw, c), dD = zeros(hh, hw, c);

        var v = dA.getView().swapDimensions(0, 1);

        vB.swapDimensions(0, 1);
        filterND(bL, bL, vB, name, true, 'cr', 2, dA, dH, v);
        filterND(bH, bH, vB, name, true, 'cr', 2, dV, dD, v);
        if (dwtmode === "per") {
            var K = Matrix.wfilters(name)[0].numel();
            var lc = Math.ceil((K - 2) / 4), rc = Math.floor((K - 2) / 4);
            dA = dA.get([lc, -rc - 1], [lc, -rc - 1]);
            dH = dH.get([lc, -rc - 1], [lc, -rc - 1]);
            dV = dV.get([lc, -rc - 1], [lc, -rc - 1]);
            dD = dD.get([lc, -rc - 1], [lc, -rc - 1]);
        }         
        return [dA, dH, dV, dD];
    };
    var idwt2 = function (bands, name) {
        bands = bands.slice();
        if (dwtmode === "per") {
            var K = Matrix.wfilters(name)[0].numel();
            var lc = Math.ceil((K - 2) / 4), rc = Math.floor((K - 2) / 4);
            for (var b = 0; b < 4; b++) {
                bands[b] = bands[b] ? bands[b].padarray(dwtmode === "per" ? "per" : dwtmode, [lc, rc], [lc, rc]) : undefined;
            }
        }   
        var size = (bands[0] || bands[1] || bands[2] || bands[3]).getSize();

        var ph = getPaddingInfos(name, size[0]),
            pw = getPaddingInfos(name, size[1]);
        var oh = ph.rk + ph.lk;
        var ow = pw.rk + pw.lk;

        size[0] = 2 * size[0] + 1;
        var dL = (bands[0] || bands[1]) ? zeros(size) : undefined,
            dH = (bands[2] || bands[3]) ? zeros(size) : undefined,
            dV = new MatrixView(size);

        size[0] -= oh;
        size[1] = 2 * size[1] + 1;
        var bL = (bands[0] || bands[2]) ? zeros(size) : undefined, 
            bH = (bands[1] || bands[3]) ? zeros(size) : undefined,
            bV = new MatrixView(size).select([], [1, 2, -1]);
        
        if (bL) {
            if (dL) {
                dL.set([1, 2, -1], bands[0]);
            }
            if (dH) {
                dH.set([1, 2, -1], bands[2]);
            }
            filterND(dL, dH, dV, name, false, 'cl', 1, bL, bL, bV);
        }
        if (bH) {
            if (dL) {
                dL.set([1, 2, -1], bands[1]);
            }
            if (dH) {
                dH.set([1, 2, -1], bands[3]);
            }      
            filterND(dL, dH, dV, name, false, 'cl', 1, bH, bH, bV);
        }

        size[1] -= ow;
        var out = zeros(size), oV = new MatrixView(size).swapDimensions(0, 1);
        bV.restore().swapDimensions(0, 1);
        filterND(bL, bH, bV, name, false, 'cl', 1, out, out, oV);
        return out;
    };

    /** Returns the maximum level of the decomposition according 
     * to a mother wavelet name.
     *
     * __See also :__
     * {@link Matrix#wavedec2},
     * {@link Matrix#waverec2},
     * {@link Matrix#idwt2}.
     *
     * @param {Matrix} sizes
     *  Matrix containing the size(s) of the signal to decompose.
     * @param {String} name
     *  Wavelet name.
     * @return {Number}
     * @matlike
     */
    Matrix.dwtmaxlev = function (s, name) {
        s = Matrix.toMatrix(s).min().getDataScalar();
        var wav = Matrix.wfilters(name);
        var dl = wav[0].numel(),
            dh = wav[1].numel(),
            rl = wav[2].numel(),
            rh = wav[3].numel();
        var w = Math.max(dl, dh, rl, rh);
        var maxlev = Math.floor(Math.log(s / (w - 1)) / Math.log(2));
        return maxlev < 0 ? 0 : maxlev;
    };
  
    var createStruct1D = function (s, n, name, dim) {
        var sizes = new Uint16Array(n + 2);
        sizes[n + 1] = s.getSize(dim);

        var K = Matrix.wfilters(name)[0].numel();
        var lc = Math.ceil((K - 2) / 4), rc = Math.floor((K - 2) / 4);
        
        for (var l = n; l >= 1; l--) {
            var py = getPaddingInfos(name, sizes[l + 1]);
            sizes[l] = Math.ceil(sizes[l + 1] / 2) + py.ro + py.lo - (dwtmode === "per" ? lc + rc : 0);
        }
        sizes[0] = sizes[1];
        return Matrix.toMatrix(sizes);
    };
    var getSubbandsCoordinates1D = function (wt, dim) {
        var sizes = wt.get([], 0).getData();

        var outSize = sizes[0];
        var bands = [0, outSize], subSizes = [];
        
        var j, J = sizes.length - 2;
        for (j = 1; j < J + 1; j++) {
            subSizes.push(sizes[j]);
            outSize += sizes[j];
            bands.push(outSize);
        }
        return {
            "bands": bands,
            "outSize": outSize,
            "subSizes": subSizes,
            "sizes": sizes,
            "J": J
        };
    };
    var resizeMatrix1d = function (A, ds, l, dim) {
        if (A.getSize(dim) !== ds.sizes[l + 1]) {
            var AView = A.getView().selectDimension(dim, [0, ds.sizes[l + 1] - 1]);
            A = A.extractViewFrom(AView);
        }
        return A;
    };
   
    /** Compute the 1D DWT (Discrete Wavelet Transform)
     * of a column vector.
     * __See also :__
     * {@link Matrix#idwt},
     * {@link Matrix#dwt2}.
     *
     * @param {Matrix} signal
     * @param {String} [name='haar']
     *  Wavelet name.
     * @param {Number} [dim=0]
     *  Dimension on which perform th dwt.
     * @return {Array}
     *  Array containing approximation coefficients and details.
     * @matlike
     */
    Matrix.dwt = dwt;
    /** Compute the 1D inverse DWT (Discrete Wavelet Transform).
     *
     * __See also :__
     * {@link Matrix#dwt},
     * {@link Matrix#idwt2}.
     * @param {Array} bands
     *  Array containing approximation and details coefficients.
     * @param {String} [name='haar']
     *  Wavelet name.
     * @param {Number} [dim=0]
     *  Dimension on which perform th idwt.
     * @return {Matrix}
     *  Matrix with the reconstructed signal.
     * @matlike
     */
    Matrix.idwt = idwt;
    
    /** Perform a DWT (Discrete Wavelet Transform)
     * on each vector presents on a given Matrix dimension.
     *
     * __See also :__
     * {@link Matrix#waverec},
     * {@link Matrix#dwt}.
     *
     * @param {Matrix} signal
     * @param {Number} n
     *  Number of level of the decomposition.
     * @param {String} name
     *  Wavelet name.
     * @param {Number} [dimension=0] 
     *  Dimension on which the transformation is performed.
     * @return {Array}
     *  Array of two elements, one contains the coefficients 
     *  while the seconds contains the sizes of each subbands.
     * @matlike
     */
    Matrix.wavedec = function (s, n, name, dim) {
        dim = dim || 0;
        var sd = createStruct1D(s, n, name, dim);
        var ds = getSubbandsCoordinates1D(sd, dim);

        var size = s.getSize();
        size[dim] = ds.outSize;
        var matOut = zeros(size), outView = matOut.getView();
        var matIn = s, dL, dH, wt;
        for (var l = n; l >= 1; l--) {
            wt = dwt(matIn, name, dim);
            outView.selectDimension(dim, [ds.bands[l], ds.bands[l + 1] - 1]);
            wt[1].extractViewTo(outView, matOut);
            outView.restore();
            matIn = wt[0];
        }
        outView.selectDimension(dim, [ds.bands[0], ds.bands[1] - 1]);
        wt[0].extractViewTo(outView, matOut);
        return [matOut, sd];
    };
    /** Reconstruct the signal from a DWT (Discrete Wavelet Transform)
     * on many of a column vector.
     *
     * __See also :__
     * {@link Matrix#wavedec},
     * {@link Matrix#idwt}.
     *
     * @param {Array} dwt
     *  Array of two elements, one contains the dwt coefficients 
     *  while the seconds concontains the sizes of each subbands.
     * @param {String} name
     *  Wavelet name.
     * @param {Number} [dimension=0] 
     *  Dimension on which the transformation has been performed.
     * @return {Matrix}
     *  The reconstructed signal.
     * @matlike
     */
    Matrix.waverec = function (wt, name, dim) {
        dim = dim || 0;
        var ds = getSubbandsCoordinates1D(wt[1], dim);
        var input = wt[0], iV = input.getView();
        var dLView = iV.selectDimension(dim, [ds.bands[0], ds.bands[1] - 1]);
        var dL = input.extractViewFrom(dLView);

        for (var l = 1; l < ds.bands.length - 1; l++) {
            var dHView = iV.restore().selectDimension(dim, [ds.bands[l], ds.bands[l + 1] - 1]);
            var dH = input.extractViewFrom(dHView);
            dL = idwt([dL, dH], name, dim);
            dL = resizeMatrix1d(dL, ds, l, dim);
        }
        return dL;
    };
    /** Reconstruct the signal from a 1D DWT (Discrete Wavelet Transform)
     * at the coarsest level.
     *
     * __See also :__
     * {@link Matrix#wavedec},
     * {@link Matrix#waverec},
     * {@link Matrix#idwt}.
     *
     * @param {Array} dwt
     *  Array of two elements, one contains the dwt coefficients 
     *  while the seconds contains the sizes of each subbands.
     * @param {String} name
     *  Wavelet name.
     * @return {Array}
     *  Array of three elements, one contains the coefficients 
     *  the second contains the sizes of each subbands, and the third 
     *  contains the approximation coefficients at the scale j-1.
     * @matlike
     */
    Matrix.upwlev = function (wt, name, dim) {
        if (wt[1].getSize(0) === 2) {
            return [new Matrix(), new Matrix()];
        }
        dim = dim || 0;
        var ds = getSubbandsCoordinates1D(wt[1], dim);
        var input = wt[0], iV = input.getView();
        var dLView = iV.selectDimension(dim, [ds.bands[0], ds.bands[1] - 1]);
        var dLm = input.extractViewFrom(dLView);
        var dHView = iV.restore().selectDimension(dim, [ds.bands[1], ds.bands[2] - 1]);
        var dH = input.extractViewFrom(dHView);
        var dL = idwt([dLm, dH], name, dim);
        dL = resizeMatrix1d(dL, ds, 1, dim);

        var bSize = dL.getSize(dim);
        var oV = iV.restore().selectDimension(dim, [ds.bands[2] - bSize, -1]);
        var o = input.extractViewFrom(oV);
        oV = o.getView().selectDimension(dim, [0, bSize - 1]);
        dL.extractViewTo(oV, o);

        var sizes = wt[1].get([1, -1]);
        sizes.set(0, [], sizes.get(1, []));

        return [o, sizes, dLm];
    };
    /** Returns the coefficients corresponding to the approximation subband
     * at a given level.
     *
     * __See also :__
     * {@link Matrix#wrcoef},
     * {@link Matrix#detcoef},
     * {@link Matrix#upwlev},
     * {@link Matrix#wavedec},
     * {@link Matrix#waverec},
     * {@link Matrix#idwt2}.
     *
     * @param {Array} dwt
     *  Array of two elements, one contains the dwt coefficients 
     *  while the seconds contains the sizes of each subbands.
     * @param {String} name
     *  Wavelet name.
     * @param {Number} dim
     *  Dimension along which the signal must be reconstructed.
     * @param {Number} level
     *  The level of the subband between 0 (the original signal) and 
     *  N the decomposition level.
     * @return {Matrix}
     *  If the level corresponds to the last level of decomposition, 
     *  the coefficients returned will be a view on the coefficient
     *  provided. Therefore, a modification on one will affect both.
     * @matlike
     */
    Matrix.appcoef = function (wt, name, dim, j) {
        j = j === undefined ? wt[1].size()[0] - 2 : j;
        var J = wt[1].size(0) - 2;
        if (j > J || j < 0) {
            throw new Error("Matrix.appcoef: Invalid decomposition level.");
        }
        while (J > j) {
            wt = Matrix.upwlev(wt, name);
            J = wt[1].size(0) - 2;
        }
        var ds = getSubbandsCoordinates1D(wt[1], dim);
        var input = wt[0], iV = input.getView();
        var dLView = iV.selectDimension(dim, [ds.bands[0], ds.bands[1] - 1]);
        return input.extractViewFrom(dLView);
    };
    /** Returns the coefficients corresponding to a detail subband
     * at a given level.
     *
     * __See also :__
     * {@link Matrix#wavedec},
     * {@link Matrix#waverec},
     * {@link Matrix#wrcoef},
     * {@link Matrix#appcoef}.
     *
     * @param {Array} dwt
     *  Array of two elements, one contains the dwt coefficients 
     *  while the seconds contains the sizes of each subbands.
     * @param {Number} level
     *  The level of the subband between 1 (the coarser) and N the 
     *  decomposition level.
     * @return {Matrix}
     *  Returns the coefficients required. The Matrix returned is a 
     *  view on the coefficient provided. Therefore, a modification 
     *  on one will affect both.
     * @matlike
     */
    Matrix.detcoef = function (wt, dim, j) {
        var ds = getSubbandsCoordinates1D(wt[1], dim);
        if (j > ds.J || j < 1) {
            throw new Error("Matrix.detcoef2: Invalid decomposition level.");
        }
        var scale = ds.J - j;
        var input = wt[0], iV = input.getView();
        var dHView = iV.selectDimension(dim, [ds.bands[1 + scale], ds.bands[2 + scale] - 1]);
        return input.extractViewFrom(dHView);
    };
    /** Reconstruct the signal using only one subband.
     *
     * __See also :__
     * {@link Matrix#appcoef},
     * {@link Matrix#detcoef},
     * {@link Matrix#upwlev},
     * {@link Matrix#wavedec},
     * {@link Matrix#waverec}.
     *
     * @param {String} type
     *  Give the subband to use for the reconstruction ('l' or 'h').
     *  The value 'l' corresponds to the approximation coefficients (low-pass filter)
     *  while the seconds corresponds to the detail coefficients (high-pass filter).
     * @param {Array} dwt
     *  Array of two elements, one contains the dwt coefficients 
     *  while the seconds contains the sizes of each subbands.
     * @param {String} name
     *  The wavelet filters to use for the reconstruction.
     * @param {Number} dimension
     *  Dimension along which the reconstruction will occur.
     * @param {Number} level
     *  The level of the subband between 1 (the coarser) and N the 
     *  decomposition level.
     * @return {Matrix}
     *  Returns the coefficients required. The Matrix returned is a 
     *  view on the coefficient provided. Therefore, a modification 
     *  on one will affect both.
     * @matlike
     */
    Matrix.wrcoef = function (type, wt, name, dim, N) {
        var L, H;
        if (type === 'l') {
            L = Matrix.appcoef(wt, name, dim, N);
        }  else if (type === 'h') {
            H = Matrix.detcoef(wt, dim, N);
        } 
        var ds = getSubbandsCoordinates1D(wt[1]);
        for (var n = 0; n < N; n++) {
            L = idwt([L, H], name, dim);
            L = resizeMatrix1d(L, ds, ds.J - N + n + 1, dim);
            H = undefined; 
        }
        return L;
    };
   
    var createStruct = function (s, n, name) {
        var K = Matrix.wfilters(name)[0].numel();
        var lc = Math.ceil((K - 2) / 4), rc = Math.floor((K - 2) / 4);
        var xSizes = new Array(n + 2);  
        var ySizes = new Array(n + 2);
        var cSizes = new Array(n + 2);
        ySizes[n + 1] = s.getSize(0);
        xSizes[n + 1] = s.getSize(1);
        cSizes[n + 1] = s.getSize(2);
        for (var l = n; l >= 1; l--) {
            var py = getPaddingInfos(name, ySizes[l + 1]),
                px = getPaddingInfos(name, xSizes[l + 1]);
            ySizes[l] = Math.ceil(ySizes[l + 1] / 2) + py.ro + py.lo - (dwtmode === "per" ? lc + rc : 0);
            xSizes[l] = Math.ceil(xSizes[l + 1] / 2) + px.ro + px.lo - (dwtmode === "per" ? lc + rc : 0);
            cSizes[l] = cSizes[l + 1];
        }
        ySizes[0] = ySizes[1];
        xSizes[0] = xSizes[1];
        cSizes[0] = cSizes[1];
        return Matrix.toMatrix([ySizes, xSizes, cSizes]);
    };
    var getSubbandsCoordinates = function (wt) {
        var ySizes = wt.get([], 0).getData(),
            xSizes = wt.get([], 1).getData(),
            cSizes = wt.get([], 2).getData();

        var outSize = xSizes[0] * ySizes[0] * cSizes[0];
        var bands = [0, outSize], subSizes = [];
        
        var j, J = ySizes.length - 2;
        for (j = 1; j < J + 1; j++) {
            subSizes.push([ySizes[j], xSizes[j], cSizes[j]]);
            var subBandSize = ySizes[j] * xSizes[j] * cSizes[j];
            for (var b = 0; b < 3; b++) {
                outSize += subBandSize;
                bands.push(outSize);
            }
        }
        return {
            "bands": bands,
            "outSize": outSize,
            "subSizes": subSizes,
            "ySizes": ySizes,
            "xSizes": xSizes,
            "cSizes": cSizes,
            "J": J
        };
    };
    // Function used to resize approximation coefficient matrix
    // to its original size after reconstruction.
    var resizeMatrix = function (A, ds, l) {
        if (A.getSize(0) !== ds.ySizes[l + 1] || A.getSize(1) !== ds.xSizes[l + 1]) {
            A = A.get([0, ds.ySizes[l + 1] - 1], [0, ds.xSizes[l + 1] - 1], []);
        }
        return A;
    };

    /** Compute the 2D DWT (Discrete Wavelet Transform)
     * of a column vector.
     * __See also :__
     * {@link Matrix#idwt},
     * {@link Matrix#dwt2}.
     *
     * @param {Matrix} signal
     * @param {String} name
     *  Wavelet name.
     * @return {Array}
     *  Array containing approximation coefficients and details.
     * @matlike
     */
    Matrix.dwt2 = dwt2;
    /** Compute the 2D inverse DWT (Discrete Wavelet Transform).
     *
     * __See also :__
     * {@link Matrix#dwt},
     * {@link Matrix#idwt2}.
     * @param {Array} bands
     *  Array containing approximation and details coefficients.
     * @param {String} name
     *  Wavelet name.
     * @return {Matrix}
     *  Matrix with the reconstructed signal.
     * @matlike
     */
    Matrix.idwt2 = idwt2;

    /** Perform a 2D DWT (Discrete Wavelet Transform)
     *
     * __See also :__
     * {@link Matrix#waverec2},
     * {@link Matrix#dwt2}.
     *
     * @param {Matrix} signal
     * @param {Number} n
     *  Number of level of the decomposition.
     * @param {String} name
     *  Wavelet name.
     * @return {Array}
     *  Array of two elements, one contains the coefficients 
     *  while the seconds contains the sizes of each subbands.
     * @matlike
     */
    Matrix.wavedec2 = function (input, n, name) {
        var sizes = createStruct(input, n, name),
            ds = getSubbandsCoordinates(sizes),
            out = new Float64Array(ds.outSize),
            wt;
        for (var l = n - 1, s = 3 * l; l >= 0; l--, s -= 3) {
            wt = dwt2(input, name);
            out.subarray(ds.bands[s + 1], ds.bands[s + 2]).set(wt[1].getData());
            out.subarray(ds.bands[s + 2], ds.bands[s + 3]).set(wt[2].getData());
            out.subarray(ds.bands[s + 3], ds.bands[s + 4]).set(wt[3].getData());
            input = wt[0];
        }
        out.subarray(ds.bands[0], ds.bands[1]).set(wt[0].getData());
        return [new Matrix([out.length], out), sizes];
    };
    /** Reconstruct the signal from a 2D DWT (Discrete Wavelet Transform).
     *
     * __See also :__
     * {@link Matrix#wavedec2},
     * {@link Matrix#idwt2}.
     *
     * @param {Array} dwt
     *  Array of two elements, one contains the dwt coefficients 
     *  while the seconds contains the sizes of each subbands.
     * @param {String} name
     *  Wavelet name.
     * @return {Array}
     *  The reconstructed signal.
     * @matlike
     */
    Matrix.waverec2 = function (wt, name) {
        var ds = getSubbandsCoordinates(wt[1]), data = wt[0].getData();
        var A, H, V, D;
        A = new Matrix(ds.subSizes[0], data.subarray(ds.bands[0], ds.bands[1]));
        for (var l = 0, s = 0, J = ds.J; l < J; l++, s += 3) {
            var size = ds.subSizes[l];
            H = new Matrix(size, data.subarray(ds.bands[s + 1], ds.bands[s + 2]));
            V = new Matrix(size, data.subarray(ds.bands[s + 2], ds.bands[s + 3]));
            D = new Matrix(size, data.subarray(ds.bands[s + 3], ds.bands[s + 4]));
            A = idwt2([A, H, V, D], name);
            A = resizeMatrix(A, ds, l + 1);
        }
        return A;
    };
    /** Reconstruct the signal from a 2D DWT (Discrete Wavelet Transform)
     * at the coarsest level.
     *
     * __See also :__
     * {@link Matrix#wavedec2},
     * {@link Matrix#waverec2},
     * {@link Matrix#idwt2}.
     *
     * @param {Array} dwt
     *  Array of two elements, one contains the dwt coefficients 
     *  while the seconds contains the sizes of each subbands.
     * @param {String} name
     *  Wavelet name.
     * @return {Array}
     *  Array of three elements, one contains the coefficients 
     *  the second contains the sizes of each subbands, and the third 
     *  contains the approximation coefficients at the scale j-1.
     * @matlike
     */
    Matrix.upwlev2 = function (wt, name) {
        if (wt[1].getSize(0) === 2) {
            return [new Matrix(), new Matrix()];
        }

        var ds = getSubbandsCoordinates(wt[1]), data = wt[0].getData();
        var Am = new Matrix(ds.subSizes[0], data.subarray(ds.bands[0], ds.bands[1]));
        var H = new Matrix(ds.subSizes[0], data.subarray(ds.bands[1], ds.bands[2]));
        var V = new Matrix(ds.subSizes[0], data.subarray(ds.bands[2], ds.bands[3]));
        var D = new Matrix(ds.subSizes[0], data.subarray(ds.bands[3], ds.bands[4]));
        var A = idwt2([Am, H, V, D], name);
        A = resizeMatrix(A, ds, 1);

        var sizes = wt[1].get([1, -1]);
        sizes.set(0, [], sizes.get(1, []));

        var Asize = A.numel(), remaining = data.length - ds.bands[4];
        var out = new Float64Array(Asize + remaining);
        out.subarray(0, Asize).set(A.getData());
        out.subarray(Asize).set(data.subarray(ds.bands[4]));
        return [new Matrix([out.length], out), sizes, Am];
    };
    /** Returns the coefficients corresponding to the approximation subband
     * at a given level.
     *
     * __See also :__
     * {@link Matrix#detcoef2},
     * {@link Matrix#wavedec2},
     * {@link Matrix#waverec2},
     * {@link Matrix#idwt2}.
     *
     * @param {Array} dwt
     *  Array of two elements, one contains the dwt coefficients 
     *  while the seconds contains the sizes of each subbands.
     * @param {String} name
     *  Wavelet name.
     * @param {Number} level
     *  The level of the subband between 0 (the original signal) and 
     *  N the decomposition level.
     * @return {Matrix}
     *  If the level corresponds to the last level of decomposition, 
     *  the coefficients returned will be a view on the coefficient
     *  provided. Therefore, a modification on one will affect both.
     * @matlike
     */
    Matrix.appcoef2 = function (wt, name, j) {
        j = j === undefined ? wt[1].size()[0] - 2 : j;
        var J = wt[1].size(0) - 2;
        if (j > J || j < 0) {
            throw new Error("Matrix.appcoef2: Invalid decomposition level.");
        }
        while (J > j) {
            console.log("upwlev");
            wt = Matrix.upwlev2(wt, name);
            J = wt[1].size(0) - 2;
        }
        var sizes = wt[1].get([1, -1]).prod(1).getData();
        var data = wt[0].getData();
        var size = wt[1].get(0).getData();
        return new Matrix(size, data.subarray(0, sizes[0]));
    };
    /** Returns the coefficients corresponding to a detail subband
     * at a given level.
     *
     * __See also :__
     * {@link Matrix#wavedec2},
     * {@link Matrix#waverec2},
     * {@link Matrix#appcoef2}.
     *
     * @param {String} type
     *  Can be either 'h', 'v' or 'd'.'
     * @param {Array} dwt
     *  Array of two elements, one contains the dwt coefficients 
     *  while the seconds contains the sizes of each subbands.
     * @param {Number} level
     *  The level of the subband between 1 (the coarser) and N the 
     *  decomposition level.
     * @return {Matrix}
     *  Returns the coefficients required. The Matrix returned is a 
     *  view on the coefficient provided. Therefore, a modification 
     *  on one will affect both.
     * @matlike
     */
    Matrix.detcoef2 = function (type, wt, j) {
        if (type === 'all') {
            return [
                Matrix.detcoef2('h', wt, j),
                Matrix.detcoef2('v', wt, j),
                Matrix.detcoef2('d', wt, j)
            ];
        }
        var ds = getSubbandsCoordinates(wt[1]), data = wt[0].getData();
        if (j > ds.J || j < 1) {
            throw new Error("Matrix.detcoef2: Invalid decomposition level.");
        }
        var scale = ds.J - j;
        var size = wt[1].get([scale + 1], []).getData();
        var band = 1 + scale * 3;
        if (type === 'v') {
            band += 1;
        } else if (type === 'd') {
            band += 2;
        } else if (type !== 'h') {
            throw new Error("Matrix.detcoef2: Wrong type argument");
        }
        return new Matrix(size, data.subarray(ds.bands[band], ds.bands[band + 1]));
    };
    /** Reconstruct the image using only one subband.
     *
     * __See also :__
     * {@link Matrix#appcoef2},
     * {@link Matrix#detcoef2},
     * {@link Matrix#upwlev2},
     * {@link Matrix#wavedec2},
     * {@link Matrix#waverec2}.
     *
     * @param {String} type
     *  Give the subband to use for the reconstruction ('a' or 'h', 'v' or 'd').
     *  The value 'a' corresponds to the approximation coefficients (low-pass filter)
     *  while the others correspond to the detail coefficients (horizontal, vertical and diagonal).
     * @param {Array} dwt
     *  Array of two elements, one contains the dwt coefficients 
     *  while the seconds contains the sizes of each subbands.
     * @param {String} name
     *  The wavelet filters to use for the reconstruction.
     * @param {Number} level
     *  The level of the subband between 1 (the coarser) and N the 
     *  decomposition level.
     * @return {Matrix}
     *  Returns the coefficients required. The Matrix returned is a 
     *  view on the coefficient provided. Therefore, a modification 
     *  on one will affect both.
     * @matlike
     */
    Matrix.wrcoef2 = function (type, wt, name, N) {
        var A, H, V, D;
        if (type === 'a') {
            A = Matrix.appcoef2(wt, name, N);
        }  else if (type === 'h') {
            H = Matrix.detcoef2('h', wt, N);
        } else if (type === 'v') {
            V = Matrix.detcoef2('v', wt, N);
        } else if (type === 'd') {
            D = Matrix.detcoef2('d', wt, N);
        }
        var ds = getSubbandsCoordinates(wt[1]);
        for (var l = 0; l < N; l++) {
            A = idwt2([A, H, V, D], name);
            A = resizeMatrix(A, ds, ds.J - N + l + 1);
            H = V = D = undefined; 
        }
        return A;
    };

    (function () {
        var padIndices = {
            sym: function (s, l, r) {
                var length = s + l + r, sel = new Uint32Array(length);
                var i, j, j2, s2 = 2 * s;
                for (j = l, i = 0; j > 0; j--, i++) {
                    j2 = (j - 1) % s2;
                    sel[i] = j2 >= s ? s2 - j2 - 1: j2;
                }
                for (j = 0; j < s; j++, i++) {
                    sel[i] = j;
                }
                for (j = 0; j < r; j++, i++) {
                    j2 = (j + s) % s2;
                    sel[i] = j2 >= s ? s2 - j2 - 1: j2;
                }
                return sel;
            },
            symw: function (s, l, r) {
                var length = s + l + r, sel = new Uint32Array(length);
                var i, j, j2, s2 = 2 * s;
                i = 0;
                for (j = l; j > 0; j--, i++) {
                    j2 = (j - 1) % (s2 - 2);
                    sel[i] = j2 >= s - 1 ? s2 - 3 - j2 : j2 + 1;
                }
                for (j = 0; j < s; j++, i++) {
                    sel[i] = j;
                }
                for (j = 0; j < r; j++, i++) {
                    j2 = (j + s) % (s2 - 2);
                    sel[i] = j2 >= s - 1? s2 - j2 - 2: j2;
                }
                return sel;
            },
            per: function (s, l, r) {
                var length = s + l + r, sel = new Int32Array(length);
                var i, j;
                for (i = 0, j = l; j > 0; j--, i++) {
                    sel[i] = s - (j - 1) % s - 1;
                }
                for (j = 0; j < s; j++, i++) {
                    sel[i] = j;
                }
                for (j = 0; j < r; j++, i++) {
                    sel[i] = j % s;
                }
                return sel;
            },
            per2: function (s, l, r) {
                var isOdd = s % 2;
                s += isOdd ? 1 : 0;
                r -= isOdd ? 1 : 0;
                var length = s + l + r, sel = new Int32Array(length);
                var i, j;
                for (i = 0, j = l; j > 0; j--, i++) {
                    sel[i] = s - (j - 1) % s - 1;
                }
                for (j = 0; j < s; j++, i++) {
                    sel[i] = j;
                }
                for (j = 0; j < r; j++, i++) {
                    sel[i] = j % s;
                }
                if (isOdd) {
                    for (i = 0; i < sel.length; i++) {
                        if (sel[i] == s - 1) {
                            sel[i]--;
                        }
                    }                    
                }
                return sel;
            },
            nn: function (s, l, r) {
                var length = s + l + r, sel = new Uint32Array(length);
                var i, j, i0, ie;
                i = 0;
                for (j = l; j > 0; j--, i++) {
                    sel[i] = 0;
                }
                for (j = 0; j < s; j++, i++) {
                    sel[i] = j;
                }
                for (j = 0; j < r; j++, i++) {
                    sel[i] = s - 1;
                }
                return sel;
            }
        };

        Matrix_prototype.paddim = function (mode, dim, s) {
            var args = [mode];
            for (var d = 0; d < dim; d++) {
                args.push([]);
            }
            args.push(s);
            return this.padarray.apply(this, args);
        };
        
        Matrix_prototype.padarray = function () {
            var mode = Array.prototype.shift.apply(arguments);
            var sel, args = [], d, s;
            if (mode !== 'zpd') {
                var fun = padIndices[mode];
                if (fun === undefined) {
                    throw new Error("Matrix.padarray: Unimplemented mode " + mode + ".");
                }
                for (d = 0; d < arguments.length; d++) {
                    s = arguments[d];
                    if (Tools.isInteger(s)) {
                        sel = [fun(this.getSize(d), s, s)];
                    } else if (Tools.isArrayLike(s) && s.length === 0) {
                        sel = [];
                    } else {
                        sel = [fun(this.getSize(d), s[0], s[1])];
                    }
                    args.push(sel);
                }
                return this.get.apply(this, args);
            }
            var size = this.getSize();
            for (d = 0; d < arguments.length; d++) {
                s = arguments[d];
                size[d] = size[d] ? size[d] : 1;
                if (Tools.isInteger(s)) {
                    sel = [s, -s - 1];
                    size[d] += 2 * s;
                } else if (Tools.isArrayLike(s) && s.length === 0) {
                    sel = [];
                } else {
                    sel = [s[0], -s[1] - 1];
                    size[d] += s[0] + s[1];
                }
                args.push(sel);
            }
            args.push(this);
            var out = Matrix.zeros(size);
            return out.set.apply(out, args);
        };
    })();

})(Matrix, Matrix.prototype);
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

/** @class Matrix */

//////////////////////////////////////////////////////////////////
//                 FAST FOURIER TRANSFORM MODULE                //
//////////////////////////////////////////////////////////////////


(function (Matrix, Matrix_prototype) {
    'use strict';
    
    // Prime numbers from 2 to 3257
    var primes = Tools.arrayFromBase64(
        "AgADAAUABwALAA0AEQATABcAHQAfACUAKQArAC8ANQA7AD0AQwBHAEkATwBTAFkAYQBlAGcAawBt\
        AHEAfwCDAIkAiwCVAJcAnQCjAKcArQCzALUAvwDBAMUAxwDTAN8A4wDlAOkA7wDxAPsAAQEHAQ0B\
        DwEVARkBGwElATMBNwE5AT0BSwFRAVsBXQFhAWcBbwF1AXsBfwGFAY0BkQGZAaMBpQGvAbEBtwG7\
        AcEByQHNAc8B0wHfAecB6wHzAfcB/QEJAgsCHQIjAi0CMwI5AjsCQQJLAlECVwJZAl8CZQJpAmsC\
        dwKBAoMChwKNApMClQKhAqUCqwKzAr0CxQLPAtcC3QLjAucC7wL1AvkCAQMFAxMDHQMpAysDNQM3\
        AzsDPQNHA1UDWQNbA18DbQNxA3MDdwOLA48DlwOhA6kDrQOzA7kDxwPLA9ED1wPfA+UD8QP1A/sD\
        /QMHBAkEDwQZBBsEJQQnBC0EPwRDBEUESQRPBFUEXQRjBGkEfwSBBIsEkwSdBKMEqQSxBL0EwQTH\
        BM0EzwTVBOEE6wT9BP8EAwUJBQsFEQUVBRcFGwUnBSkFLwVRBVcFXQVlBXcFgQWPBZMFlQWZBZ8F\
        pwWrBa0FswW/BckFywXPBdEF1QXbBecF8wX7BQcGDQYRBhcGHwYjBisGLwY9BkEGRwZJBk0GUwZV\
        BlsGZQZ5Bn8GgwaFBp0GoQajBq0GuQa7BsUGzQbTBtkG3wbxBvcG+wb9BgkHEwcfBycHNwdFB0sH\
        TwdRB1UHVwdhB20Hcwd5B4sHjQedB58HtQe7B8MHyQfNB88H0wfbB+EH6wftB/cHBQgPCBUIIQgj\
        CCcIKQgzCD8IQQhRCFMIWQhdCF8IaQhxCIMImwifCKUIrQi9CL8IwwjLCNsI3QjhCOkI7wj1CPkI\
        BQkHCR0JIwklCSsJLwk1CUMJSQlNCU8JVQlZCV8JawlxCXcJhQmJCY8JmwmjCakJrQnHCdkJ4wnr\
        Ce8J9Qn3Cf0JEwofCiEKMQo5Cj0KSQpXCmEKYwpnCm8KdQp7Cn8KgQqFCosKkwqXCpkKnwqpCqsK\
        tQq9CsEKzwrZCuUK5wrtCvEK8woDCxELFQsbCyMLKQstCz8LRwtRC1cLXQtlC28LewuJC40LkwuZ\
        C5sLtwu5C8MLywvPC90L4QvpC/UL+wsHDAsMEQwlDC8MMQxBDFsMXwxhDG0Mcwx3DIMMiQyRDJUM\
        nQyzDLUMuQw=", Uint16Array);
    var SIZE_PRIME = primes.length;

    /**
     * decompose n into prime factors and returns the number of terms
     * tab should be large enough to contain all factors (32 seems enough)
     * Note: returns 0 if n==1, and do not work if n > MAX_PRIME^2
     */
    var decompose = function (n) {
        if (n === 1) {
            return 0;
        }
        var tab = [], count, i, p;

        // search factors
        for (count = i = 0; i < SIZE_PRIME; i++) {
            if ((n % primes[i]) === 0) {
                p = primes[i];
                do {
                    tab[count] = p;
                    count++;
                    n = n / p;
                } while ((n % p) === 0);
            }
        }
        // If n is prime
        if (n !== 1) {
            tab[count] = n;
            count++;
        }

        return tab;
    };

    var SWAP = function (tab, a, b) {
        var tmp = tab[a];
        tab[a] = tab[b];
        tab[b] = tmp;
    };

    var storeResult = function (data, real, imag, isign) {
        var n = data.length / 2, i, j;
        if (isign === 1) {
            for (i = 0, j = 0; i < n; i++) {
                real[i] = data[j++];
                imag[i] = -data[j++];
            }
        } else {
            var i_n = 1 / n;
            for (i = 0, j = 0; i < n; i++) {
                real[i] = data[j++] * i_n;
                imag[i] = -data[j++] * i_n;
            }
        }
    };

    var storeInput = function (Xr, Xi) {
        var size = Xr.length, i, j;
        var data = new Float64Array(2 * size);
        if (Xi) {
            for (i = 0, j = 0; i < size; i++) {
                data[j++] = Xr[i];
                data[j++] = -Xi[i];
            }
        } else {
            for (i = 0, j = 0; i < size; i++, j++) {
                data[j++] = Xr[i];
            }
        }
        return data;
    };

    // Faster algorithm when the signal size is a power of two (original code)
    var fft1d_2n = function (Xr, Xi, isign) {
        var m, l, j, istep, i;
        var wtemp, wr, wpr, wpi, wi, theta;
        var tempr, tempi;

        var size = Xr.length, data = storeInput(Xr, Xi);

        // Compute FFT of "data" array
        var n = size << 1;
        for (i = 1, j = 1; i < n; i += 2) {
            if (j > i) {
                SWAP(data, j - 1, i - 1);
                SWAP(data, j, i);
            }
            m = n >> 1;
            while (m >= 2 && j > m) {
                j = j - m;
                m >>= 1;
            }
            j = j + m;
        }

        var mmax = 2;

        while (n > mmax) {
            istep = 2 * mmax;
            theta = 2 * Math.PI / (isign * mmax);
            wtemp = Math.sin(0.5 * theta);
            wpr = -2.0 * wtemp * wtemp;
            wpi = Math.sin(theta);
            wr = 1.0;
            wi = 0.0;
            for (m = 1; m < mmax; m += 2) {
                for (i = m - 1; i <= n - 1; i += istep) {
                    j = i + mmax;
                    tempr = wr * data[j] - wi * data[j + 1];
                    tempi = wr * data[j + 1] + wi * data[j];
                    data[j] = data[i] - tempr;
                    data[j + 1] = data[i + 1] - tempi;
                    data[i] += tempr;
                    data[i + 1] += tempi;
                }
                wr = (wtemp = wr) * wpr - wi * wpi + wr;
                wi = wi * wpr + wtemp * wpi + wi;
            }
            mmax = istep;
        }
        return data;
    };

    var fft1d_full = function (Xr, Xi, isign, tab) {

        var size = Xr.length, i;

        var mc = new Float64Array(size), ms = new Float64Array(size);
        var PI2IN = 2 * Math.PI / size;
        for (i = 0; i < size; i++) {
            mc[i] = Math.cos(i * PI2IN);
            ms[i] = isign * Math.sin(i * PI2IN);
        }

        var data = storeInput(Xr, Xi), d = new Float64Array(2 * size);

        var j, k, l, p, nsmp, mp;
        var m = 1, e, t = tab.length;
        for (e = 0; e < t; e++) {
            p = tab[e];
            nsmp = size / m / p;
            mp = m * p;
            for (k = 0; k < 2 * size; k++) {
                d[k] = 0;
            }
            for (j = 0; j < p; j++) {
                for (l = 0; l < mp; l++) {
                    var indice = ((l * j) % mp) * nsmp;
                    var wljx = mc[indice], wljy = ms[indice];
                    var idxd = 2 * nsmp * l, idxs = 2 * nsmp * (j + (l % m) * p);
                    for (i = 0; i < nsmp; i++, idxd += 2, idxs += 2) {
                        d[idxd] += data[idxs] * wljx - data[idxs + 1] * wljy;
                        d[idxd + 1] += data[idxs] * wljy + data[idxs + 1] * wljx;
                    }
                }
            }
            var tmpf = data;
            data = d;
            d = tmpf;
            m *= p;
        }
        return data;
    };

    var fft1d = function (Xr, Xi, Yr, Yi, inverse) {
        var n = Xr.length, tab = decompose(n), t = tab.length;
        var isign = !inverse ? 1 : -1, data;
        if (n > 1 && tab[t - 1] !== 2) {
            data = fft1d_full(Xr, Xi, isign, tab);
        } else {
            data = fft1d_2n(Xr, Xi, isign);
        }
        return storeResult(data, Yr, Yi, isign);
    };

    var matrix_fft = function (X, inverse) {
        if (X.isreal()) {
            X.toComplex();
        }
        // Output matrix
        var Y = new Matrix(X.getSize(), Float64Array, true);
        var Xr = X.getRealData(), Xi = X.getImagData();
        var Yr = Y.getRealData(), Yi = Y.getImagData();

        // This will apply the fft on each column vector of the matrix
        var j, _j, m = X.getSize(0), n = X.numel() / m;
        for (j = 0, _j = 0; j < n; j++, _j += m) {
            var cXr = Xr.subarray(_j, m + _j), cXi = Xi.subarray(_j, m + _j);
            var cYr = Yr.subarray(_j, m + _j), cYi = Yi.subarray(_j, m + _j);
            fft1d(cXr, cXi, cYr, cYi, inverse);
        }
        return Y;
    };

    /** Compute the FFT of a vector.
     *
     * __See also :__
     * {@link Matrix#ifft},
     * {@link Matrix#fft2}.
     *
     *     var sz = 1024;
     *     var ar = Matrix.rand(sz, 1), ai = Matrix.rand(sz, 1);
     *     var a = Matrix.complex(ar, ai);
     *
     *     Tools.tic();
     *     for (var i = 0; i < sz; i++) {
     *       var fft = a.fft();
     *       var ifft = fft.ifft();
     *     }
     *     var t = Tools.toc()
     *     var err = a['-'](ifft).abs().mean().getDataScalar();
     *     console.log("Average Error", err, "Time:", t);
     *
     * @author
     *  This code came from the Megawave image processing toolbox.
     *  The authors credited for this module are :
     *  Chiaa Babya, Jacques Froment, Lionel Moisan and Said Ladjal.
     */
    Matrix_prototype.fft = function () {
        return matrix_fft(this, false);
    };
    Matrix.fft = function (X) {
        return matrix_fft(Matrix.toMatrix(X), false);
    };
    /** Compute the 2D FFT of a matrix.
     *
     * __See also :__
     * {@link Matrix#fft},
     * {@link Matrix#ifft2}.
     */
    Matrix_prototype.fft2 = function () {
        var Y = matrix_fft(this, false);
        Y = matrix_fft(Y.transpose(), false);
        return Y.transpose();
    };
    Matrix.fft2 = function (X) {
        var Y = matrix_fft(Matrix.toMatrix(X), false);
        Y = matrix_fft(Y.transpose(), false);
        return Y.transpose();
    };

    (function () {
        var shift = function (fft, dim, fun) {
            var size = fft.getSize();
            if (Tools.isSet(dim)) {
                if (!Tools.isInteger(dim, 0)) {
                    throw new Error("Matrix.fftshift: Dimension must be a positive integer");
                }
                return this.circshift(fun(size[dim] / 2), dim);
            }
            for (var i = 0, ie = size.length; i < ie ; i++) {
                size[i] = fun(size[i] / 2)
            }
            return fft.circshift(size);
        };
        /** This function moves the zero-frequency of the fft of a 
         * signal to the center of the array.
         *
         * @param {Integer} [dimension] It defines the dimension 
         *  along which the signal is rearranged. Otherwise, the 
         *  operation is done along all dimension.
         *
         * __See also :__
         * {@link Matrix#ifftshift},
         * {@link Matrix#fft},
         * {@link Matrix#fft2}.
         *
         * @chainable
         */
        Matrix.prototype.fftshift = function (dim) {
            return shift(this, dim, Math.floor);
        };

        /** This function inverts the action of fftshift.
         *
         * @param {Integer} [dimension] It defines the dimension 
         *  along which the signal is rearranged. Otherwise, the 
         *  operation is done along all dimension.
         *
         * __See also :__
         * {@link Matrix#fftshift},
         * {@link Matrix#fft},
         * {@link Matrix#fft2}.
         *
         * @chainable
         */
        Matrix.prototype.ifftshift = function (dim) {
            return shift(this, dim, Math.ceil);
        };
    })();
    
    /** Compute the inverse FFT of a vector.
     *
     * __See also :__
     * {@link Matrix#fft},
     * {@link Matrix#fft2}
     *
     * @author
     *  This code came from the Megawave image processing toolbox.
     *  The authors credited for this module are :
     *  Chiaa Babya, Jacques Froment, Lionel Moisan and Said Ladjal.
     */
    Matrix_prototype.ifft = function () {
        return matrix_fft(this, true);
    };
    Matrix.ifft = function (X) {
        return matrix_fft(Matrix.toMatrix(X), true);
    };
    /** Compute the inverse 2D FFT of a matrix.
     *
     * __See also :__
     * {@link Matrix#fft2},
     * {@link Matrix#ifft}.
     */
    Matrix_prototype.ifft2 = function () {
        return this.fft().transpose().fft().transpose();
    };
    Matrix.ifft2 = function (X) {
        return Matrix.toMatrix(X).ifft().transpose().ifft().transpose();
    };

})(Matrix, Matrix.prototype);
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

(function (Matrix) {
    /** Define a wavelet.
     * @class
     *  Provide several wavelets functions.
     *  A wavelet can be either a common wavelet (called by its name)
     *  or any user-defined wavelet from its recursive filters.
     * @param {string} [name='haar']
     *  Name of the wavelet.
     * @return {Wavelet}
     *  The wavelet definition (containing filters and some properties).
     * @private
     */
    function Wavelet(name) {
        var errMsg = this.constructor.name + ': ';

        // Default arguments
        if (name  === undefined) {
            this.name = 'haar';
        } else {
            /** Name of the wavelet. */
            this.name = name.toLowerCase();
        }

        // Pre-defined wavelets
        if (Wavelet.list[this.name]) {
            var wav = Wavelet.list[this.name];
            var normalize =
                    (wav.normalized !== undefined && !wav.normalized) ?
                    function (h) { return Wavelet.filter(h, 'norm'); } : function (h) { return h; };
            /** Low-pass recursive decomposition filter. */
            this.filterL = normalize(wav.filterL);
            /** Is the wavelet orthogonal? */
            this.orthogonal = (wav.orthogonal) ? true : false;
            if (wav.filterH) {
                /** High-pass recursive decomposition filter. */
                this.filterH = normalize(wav.filterH);
            }
            if (wav.invFilterL) {
                /** Low-pass recursive reconstruction filter. */
                this.invFilterL = normalize(wav.invFilterL);
            }
            if (wav.invFilterH) {
                /** High-pass recursive reconstruction filter. */
                this.invFilterH = normalize(wav.invFilterH);
            }
        }

        // User-define wavelet
        if (this.filterL === undefined) {
            var errMsgFull = errMsg + "unknown wavelet '" + name + "'. \n";
            errMsgFull += 'User-defined wavelets not implemented yet.';
            throw new Error(errMsgFull);
        }

        // Compute complementary filter
        var conj = function (h, offset) {
            return Wavelet.filter(h, 'conjugate', (offset) ? -1 : 1);
        };
        if (!this.filterH && this.orthogonal) {
            this.filterH = Wavelet.filter(conj(this.filterL), 'mirror');
        }
        if (!this.invFilterL) {
            this.invFilterL = conj(this.filterH, true);
        }
        if (!this.invFilterH) {
            this.invFilterH = conj(this.filterL, false);
        }

        // Return the object
        return this;
    }

    /** List of wavelets. */
    Wavelet.list = {
        'haar': {
            'orthogonal': true,
            'normalized': false,
            'filterL': new Float64Array([1, 1])
        },
        // Daubechies
        'db2': {
            'name': 'Daubechies 2',
            'orthogonal': true,
            'normalized': false,
            'filterL': new Float64Array([
                1 + Math.sqrt(3),
                3 + Math.sqrt(3),
                3 - Math.sqrt(3),
                1 - Math.sqrt(3)])
        },
        'db4': {
            'name': 'Daubechies 4',
            'orthogonal': true,
            'filterL': new Float64Array([
               -0.010597401784997278,
                0.032883011666982945,
                0.030841381835986965,
               -0.18703481171888114,
               -0.027983769416983849,
                0.63088076792959036,
                0.71484657055254153,
                0.23037781330885523
            ])
        },
        'db8': {
            'name': 'Daubechies 8',
            'orthogonal': true,
            'filterL': new Float64Array([
               -0.00011747678400228192,
                0.00067544940599855677,
               -0.00039174037299597711,
               -0.0048703529930106603,
                0.0087460940470156547,
                0.013981027917015516,
               -0.044088253931064719,
               -0.017369301002022108,
                0.12874742662018601,
                0.00047248457399797254,
               -0.28401554296242809,
               -0.015829105256023893,
                0.58535468365486909,
                0.67563073629801285,
                0.31287159091446592,
                0.054415842243081609
            ])
        },
        // Symlets
        'sym2': {
            'name': 'Symlets 2',
            'orthogonal': true,
            'filterL': new Float64Array([
               -0.12940952255092145,
                0.22414386804185735,
                0.83651630373746899,
                0.48296291314469025
            ])
        },
        'sym4': {
            'name': 'Symlets 4',
            'orthogonal': true,
            'filterL': new Float64Array([
               -0.075765714789273325,
               -0.02963552764599851,
                0.49761866763201545,
                0.80373875180591614,
                0.29785779560527736,
               -0.099219543576847216,
               -0.012603967262037833,
                0.032223100604042702
            ])
        },
        'sym8': {
            'name': 'Symlets 8',
            'orthogonal': true,
            'filterL': ([
               -0.0033824159510061256,
               -0.00054213233179114812,
                0.031695087811492981,
                0.0076074873249176054,
               -0.14329423835080971,
               -0.061273359067658524,
                0.48135965125837221,
                0.77718575170052351,
                0.3644418948353314,
               -0.051945838107709037,
               -0.027219029917056003,
                0.049137179673607506,
                0.0038087520138906151,
               -0.014952258337048231,
               -0.0003029205147213668,
                0.0018899503327594609
            ])
        },
        // Coiflets
        'coif1': {
            'name': 'Coiflets 1',
            'orthogonal': true,
            'filterL': new Float64Array([
               -0.01565572813546454,
               -0.072732619512853897,
                0.38486484686420286,
                0.85257202021225542,
                0.33789766245780922,
               -0.072732619512853897
            ])
        },
        'coif2': {
            'name': 'Coiflets 2',
            'orthogonal': true,
            'filterL': new Float64Array([
               -0.00072054944536451221,
               -0.0018232088707029932,
                0.0056114348193944995,
                0.023680171946334084,
               -0.059434418646456898,
               -0.076488599078306393,
                0.41700518442169254,
                0.81272363544554227,
                0.38611006682116222,
               -0.067372554721963018,
               -0.041464936781759151,
                0.016387336463522112
            ])
        },
        'coif4': {
            'name': 'Coiflets 4',
            'orthogonal': true,
            'filterL': new Float64Array([
               -1.7849850030882614e-06,
               -3.2596802368833675e-06,
                3.1229875865345646e-05,
                6.2339034461007128e-05,
               -0.00025997455248771324,
               -0.00058902075624433831,
                0.0012665619292989445,
                0.0037514361572784571,
               -0.0056582866866107199,
               -0.015211731527946259,
                0.025082261844864097,
                0.039334427123337491,
               -0.096220442033987982,
               -0.066627474263425038,
                0.4343860564914685,
                0.78223893092049901,
                0.41530840703043026,
               -0.056077313316754807,
               -0.081266699680878754,
                0.026682300156053072,
                0.016068943964776348,
               -0.0073461663276420935,
               -0.0016294920126017326,
                0.00089231366858231456
            ])
        },
        // Bi-orthogonal
        'bi13': {
            'name': 'Biorthogonal 1-3',
            'orthogonal': false,
            'filterL': new Float64Array([
               -0.088388347648318447,
                0.088388347648318447,
                0.70710678118654757,
                0.70710678118654757,
                0.088388347648318447,
               -0.088388347648318447
            ]),
            'filterH': new Float64Array([
                0,
                0,
               -0.70710678118654757,
                0.70710678118654757,
                0,
                0
            ])
        },
        'bi31': {
            'name': 'Biorthogonal 3-1',
            'orthogonal': false,
            'filterL': new Float64Array([
               -0.35355339059327379,
                1.0606601717798214,
                1.0606601717798214,
               -0.35355339059327379
            ]),
            'filterH': new Float64Array([
               -0.17677669529663689,
                0.53033008588991071,
               -0.53033008588991071,
                0.17677669529663689
            ])
        },
        'bi68': {
            'name': 'Biorthogonal 6-8',
            'orthogonal': false,
            'filterL': new Float64Array([
                0.0,
                0.0019088317364812906,
               -0.0019142861290887667,
               -0.016990639867602342,
                0.01193456527972926,
                0.04973290349094079,
               -0.077263173167204144,
               -0.09405920349573646,
                0.42079628460982682,
                0.82592299745840225,
                0.42079628460982682,
               -0.09405920349573646,
               -0.077263173167204144,
                0.04973290349094079,
                0.01193456527972926,
               -0.016990639867602342,
               -0.0019142861290887667,
                0.0019088317364812906
            ]),
            'filterH': new Float64Array([
                0.0,
                0.0,
                0.0,
                0.014426282505624435,
               -0.014467504896790148,
               -0.078722001062628819,
                0.040367979030339923,
                0.41784910915027457,
               -0.75890772945365415,
                0.41784910915027457,
                0.040367979030339923,
               -0.078722001062628819,
               -0.014467504896790148,
                0.014426282505624435,
                0.0,
                0.0,
                0.0,
                0.0
            ])
        },
        // Cohen-Daubechies-Feauveau
        'cdf97': {
            'name': 'Cohen-Daubechies-Feauveau 9-7',
            'orthogonal': false,
            'filterL': new Float64Array([
                0.0,
                0.02674875741080976,
               -0.01686411844287495,
               -0.07822326652898785,
                0.2668641184428723,
                0.6029490182363579,
                0.2668641184428723,
               -0.07822326652898785,
               -0.01686411844287495,
                0.02674875741080976
            ]),
            'filterH': new Float64Array([
                0.0,
               -0.09127176311424948,
                0.05754352622849957,
                0.5912717631142470,
               -1.115087052456994,
                0.5912717631142470,
                0.05754352622849957,
               -0.09127176311424948,
                0.0,
                0.0
            ])
        },
        // Reverse bi-orthogonal
        'rbio13': {
            'name': 'Reverse biorthogonal 1-3',
            'orthogonal': false,
            'filterL': new Float64Array([
                0.0,
                0.0,
                0.7071067811865476,
                0.7071067811865476,
                0.0,
                0.0,
            ]),
            'filterH': new Float64Array([
                0.08838834764831845,
                0.08838834764831845,
               -0.7071067811865476,
                0.7071067811865476,
               -0.08838834764831845,
               -0.08838834764831845
            ])
        },
        'rbio31': {
            'name': 'Reverse biorthogonal 3-1',
            'orthogonal': false,
            'filterL': new Float64Array([
                0.1767766952966369,
                0.5303300858899107,
                0.5303300858899107,
                0.1767766952966369
            ]),
            'filterH': new Float64Array([
                0.3535533905932738,
                1.0606601717798214,
               -1.0606601717798214,
               -0.3535533905932738
            ])
        },
        'rbio33': {
            'name': 'Reverse biorthogonal 3-3',
            'orthogonal': false,
            'filterL': new Float64Array([
                0.0,
                0.0,
                0.1767766952966369,
                0.5303300858899107,
                0.5303300858899107,
                0.1767766952966369,
                0.0,
                0.0
            ]),
            'filterH': new Float64Array([
               -0.06629126073623884,
               -0.19887378220871652,
                0.15467960838455727,
                0.9943689110435825,
               -0.9943689110435825,
               -0.15467960838455727,
                0.19887378220871652,
                0.06629126073623884
            ])
        },
        'rbio35': {
            'name': 'Reverse biorthogonal 3-5',
            'orthogonal': false,
            'filterL': new Float64Array([
                0.0,
                0.0,
                0.0,
                0.0,
                0.1767766952966369,
                0.5303300858899107,
                0.5303300858899107,
                0.1767766952966369,
                0.0,
                0.0,
                0.0,
                0.0
            ]),
            'filterH': new Float64Array([
                0.013810679320049757,
                0.04143203796014927,
               -0.052480581416189075,
               -0.26792717880896527,
                0.07181553246425874,
                0.966747552403483,
               -0.966747552403483,
               -0.07181553246425874,
                0.26792717880896527,
                0.052480581416189075,
               -0.04143203796014927,
               -0.013810679320049757
            ])
        },
        'rbio39': {
            'name': 'Reverse biorthogonal 3-9',
            'orthogonal': false,
            'filterL': new Float64Array([
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.1767766952966369,
                0.5303300858899107,
                0.5303300858899107,
                0.1767766952966369,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0
            ]),
            'filterH': new Float64Array([
                0.000679744372783699,
                0.002039233118351097,
               -0.005060319219611981,
               -0.020618912641105536,
                0.014112787930175846,
                0.09913478249423216,
               -0.012300136269419315,
               -0.32019196836077857,
               -0.0020500227115698858,
                0.9421257006782068,
               -0.9421257006782068,
                0.0020500227115698858,
                0.32019196836077857,
                0.012300136269419315,
               -0.09913478249423216,
               -0.014112787930175846,
                0.020618912641105536,
                0.005060319219611981,
               -0.002039233118351097,
               -0.000679744372783699
            ])
        }
    };

    /** Perform an operation on a filter.
     * @param {Number[]} h
     *  A filter.
     * @param {String} action
     *  - 'rescale': multiply the filter by a constant.
     *  - 'normalize': normalize the filter (L2 norm).
     *  - 'conjugate': return the filter h[0], -h[1], .., h[n]*(-1)^n.
     *  - 'mirror': return the filter h[n-1] .. h[0].
     * @param {Number} [factor=1]
     *  Multiplicative constant.
     * @return {Number[]}
     *  A transformed filter.
     */
    Wavelet.filter = function (h, action, factor) {
        var errMsg = 'Wavelet.filter: ';
        if (factor === undefined || factor === 0) {
            factor = 1;
        }
        if (typeof factor !== 'number') {
            throw new Error(errMsg + "argument 'factor' must be a number");
        }
        if (typeof action !== 'string') {
            throw new Error(errMsg + "argument 'action' must be a string");
        }
        action = action.toLowerCase().substr(0, 3);

        var k;
        var N = h.length;
        var out = [];
        var sign = 1, dsign = 1;
        if (action === 'mir') {
            for (k = 0; k < N; k++) {
                out[k] = factor * h[N - 1 - k];
            }
            return out;
        }
        if (action === 'nor') {
            var sum2 = 0;
            for (k = 0; k < N; k++) {
                sum2 += h[k] * h[k];
            }
            factor = (!sum2) ? 1 : 1 / Math.sqrt(sum2);
        } else if (action === 'con') {
            dsign = -1;
        } else if (action !== 'res') {
            throw new Error(errMsg + 'unknown action');
        }

        for (k = 0; k < N; k++, sign *= dsign) {
            out[k] = factor * sign * h[k];
        }

        return out;
    };
    /** Returns wavelet filters.
     * Currently implemented filters are :
     *
     * + "haar" ;
     * + "db1", "db2", "db4", "db8" ;
     * + "sym2", "sym4", "sym8" ;
     * + "coif1", "coif2", "coif4" ;
     * + "bi13", "bi31", "bi68", "bi97" ;
     *
     * @param{String} name
     *  Name of the filters.
     * @param{String} [type]
     *  Can be either :
     *
     * + "d" for decomposition filters ;
     * + "r" for recomposition filters ;
     * + "l" for low-pass filters ;
     * + "h" for high-pass filters.
     * @return{Array}
     */
    Matrix.wfilters = function (name, type) {
        var wav = new Wavelet(name);
        var dl = Matrix.toMatrix(wav.filterL),
            dh = Matrix.toMatrix(wav.filterH),
            rl = Matrix.toMatrix(wav.invFilterL),
            rh = Matrix.toMatrix(wav.invFilterH);
        switch (type) {
        case 'd':
            return [dl, dh];
        case 'r':
            return [rl, rh];
        case 'l':
            return [dl, rl];
        case 'h':
            return [dh, rh];
        case undefined:
            return [dl, dh, rl, rh];
        default:
            throw new Error("Matrix.wfilters: wrong type argument.");
        }
    };

})(Matrix);
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

/** @class Matrix */
(function (global) {
    "use strict";

    /** This object provides tools for colorspace conversion.
     * It works on array storing color information in different ways.
     * the way they are stored is specified by three parameters: 
     *
     * + `sc` specify the space between 2 channels for the same pixel position,
     * + `sp` specify the space between 2 pixels for the same channel,
     * + `N` specify the number of pixels.
     *
     * For instance they can be stored as :
     *
     * + RGBRGB...RGB, `sc = 1, sp = 3` (default)
     * + RGBARGBA...RGBA, `sc = 1, sp = 4`
     * + RRR...GGG...BBB, `sc = N, sp = 1`
     * + RRR...GGG...BBB...AAA, `sc = N, sp = 1`
     *
     * Despite that these functions are designed for work on images, 
     * they can be used to work with every kind of data.
     *
     * **Warning:** The data are always converted on place.
     * 
     * @class Matrix.Colorspaces
     * @singleton 
     */
    var CS = {
        /** Apply a 3x3 matrix to the color.
         */
        "matrix": function (color, mat, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var m00 = mat[0], m01 = mat[3], m02 = mat[6];
            var m10 = mat[1], m11 = mat[4], m12 = mat[7];
            var m20 = mat[2], m21 = mat[5], m22 = mat[8];
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                color[r] = m00 * R + m01 * G + m02 * B;
                color[g] = m10 * R + m11 * G + m12 * B;
                color[b] = m20 * R + m21 * G + m22 * B;
            }
            return color;
        },
        "RGB to RGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                // Do something with RGB values
                color[r] = R;
                color[g] = G;
                color[b] = B;
            }
            return color;
        },
        /** Conversion function.
         */
        "applyFunctionRGB": function (color, fun, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var c = fun(color[r], color[g], color[b]);
                color[r] = c[0];
                color[g] = c[1];
                color[b] = c[2];
            }
            return color;
        },
        /** Conversion function.
         */
        "applyFunctionColor": function (color, fun, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                var c = fun([R, G, B]);
                color[r] = c[0];
                color[g] = c[1];
                color[b] = c[2];
            }
            return color;
        },
        /** Conversion function.
         */
        "RGB to GRAY": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                var gray = 0.2989 * R + 0.5870 * G + 0.1140 * B;
                color[r] = gray;
                color[g] = gray;
                color[b] = gray;
            }
            return color;
        },
        /** Conversion function.
         */
        "RGB to HSV":  function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var I6 = 1 / 6;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                var v = (R > G ? R : G) > B ? (R > G ? R : G) : B;
                var s = v - ((R < G ? R : G) < B ? (R < G ? R : G) : B), h = 0;
                if (s !== 0) {
                    if (v === R) {
                        h = ((G - B) / s) * I6;
                    } else if (v === G) {
                        h = (2 + (B - R) / s) * I6;
                    } else if (v === B) {
                        h = (4 + (R - G) / s) * I6;
                    }
                    if (h < 0) {
                        h += 1;
                    }
                    if (v !== 0) {
                        s /= v;
                    }
                }
                color[r] = h;
                color[g] = s;
                color[b] = v;
            }
            return color;
        },
        /** Conversion function.
         */
        "HSV to RGB":  function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var H = color[r], S = color[g], V = color[b];
                var t = (H * 6 | 0) % 6;
                var f = H * 6 - t;
                var l = V * (1 - S);
                var m = V * (1 - f * S);
                var n = V * (1 - (1 - f) * S);
                switch (t) {
                case 0:
                    color[r] = V;
                    color[g] = n;
                    color[b] = l;
                    break;
                case 1:
                    color[r] = m;
                    color[g] = V;
                    color[b] = l;
                    break;
                case 2:
                    color[r] = l;
                    color[g] = V;
                    color[b] = n;
                    break;
                case 3:
                    color[r] = l;
                    color[g] = m;
                    color[b] = V;
                    break;
                case 4:
                    color[r] = n;
                    color[g] = l;
                    color[b] = V;
                    break;
                case 5:
                    color[r] = V;
                    color[g] = l;
                    color[b] = m;
                    break;
                }
            }
            return color;
        },
        /** Conversion function.
         */
        "RGB to HSL":  function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var SQRT3 = Math.sqrt(3), IPI2 = 1 / (2 * Math.PI), I3 = 1 / 3;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                var h = Math.atan2(SQRT3 * (G - B), 2 * R - G - B) * IPI2;
                color[r] = h < 0 ? (h + 1) : h;
                var M = (R > G ? R : G) > B ? (R > G ? R : G) : B;
                var m = (R < G ? R : G) < B ? (R < G ? R : G) : B;
                color[g] = M - m;
                color[b] = (R + G + B) * I3;
            }
            return color;
        },
        /** Conversion function.
         */
        "HSL to RGB":  function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var PI = Math.PI, PIMI3 = PI / 3, PI2 = PI * 2, PIM2I3 = 2 * PI / 3;
            var I3 = 1 / 3;
            var SQRT3I2 = Math.sqrt(3) / 2, ISQRT3 = 1 / Math.sqrt(3);
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var H = color[r], S = color[g], L = color[b];
                var h = H * PI2;
                var hstar = h;
                while (hstar > PIMI3) {
                    hstar -= PIMI3;
                }
                var c = SQRT3I2 * S / Math.sin(PIM2I3 - hstar);
                var c1 = c * Math.cos(h) * I3, c2 = c * Math.sin(h) * ISQRT3;
                color[r] = L + c1 * 2;
                color[g] = L - c1 + c2;
                color[b] = L - c1 - c2;
            }
            return color;
        },
        /** Conversion function.
         * @todo 
         * Normalize values between [0, 1] in HSI conversion.
         */
        "RGB to HSI": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var ISQRT3 = 1 / Math.sqrt(3), ISQRT2 = 1 / Math.sqrt(2), ISQRT6 = 1 / Math.sqrt(6);
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                var O2 = (G - B) * ISQRT2;
                var O3 = (2 * R - G - B) * ISQRT6;
                color[r] = Math.atan2(O2, O3);
                color[g] = Math.sqrt(O2 * O2 + O3 * O3);
                color[b] = (R + G + B) * ISQRT3;
            }
            return color;
        },
        /** Conversion function.
         * @todo 
         * Normalize values between [0, 1] in HSI conversion.
         */
        "HSI to RGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var SQRT3 = Math.sqrt(3), SQRT2 = Math.sqrt(2), SQRT6 = Math.sqrt(6);
            var I6 = 1 / 6, I3 = 1 / 3;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var H = color[r], S = color[g], O1 = color[b];
                var O2 = S * Math.sin(H);
                var O3 = S * Math.cos(H);
                var c1 = O1 * SQRT3, c2 = O2 * SQRT2, c3 = O3 * SQRT6;
                var R = (c1 + c3) * I3;
                var G = (2 * c1 + 3 * c2 - c3) * I6;
                var B = (2 * c1 - 3 * c2 - c3) * I6;
                color[r] = R;
                color[g] = G;
                color[b] = B;
            }
            return color;
        },
        /** Conversion function.
         */
        "LinearRGB to sRGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var a = 0.055, I2D4 = 1 / 2.4;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                color[r] = (R > 0.0031308) ? (1.055 * Math.pow(R, I2D4) - a) : (R * 12.92);
                color[g] = (G > 0.0031308) ? (1.055 * Math.pow(G, I2D4) - a) : (G * 12.92);
                color[b] = (B > 0.0031308) ? (1.055 * Math.pow(B, I2D4) - a) : (B * 12.92);
            }
            return color;
        },
        /** Conversion function.
         */
        "sRGB to LinearRGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var I12D92 = 1 / 12.92, a = 0.055, I1PA = 1 / 1.055;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var sR = color[r], sG = color[g], sB = color[b];
                color[r] = sR > 0.04045 ? Math.pow((sR + a) * I1PA, 2.4) : sR * I12D92;
                color[g] = sG > 0.04045 ? Math.pow((sG + a) * I1PA, 2.4) : sG * I12D92;
                color[b] = sB > 0.04045 ? Math.pow((sB + a) * I1PA, 2.4) : sB * I12D92;
            }
            return color;
        },
        /** Conversion function.
         */
        "RGB to CMY":  function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                color[r] = 1 - color[r];
                color[g] = 1 - color[g];
                color[b] = 1 - color[b];
            }
            return color;
        },
        /** Conversion function.
         */
        "CMY to RGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                color[r] = 1 - color[r];
                color[g] = 1 - color[g];
                color[b] = 1 - color[b];
            }
            return color;
        },
        /** Conversion function.
         */
        "RGB to Opponent": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var ISQRT3 = 1 / Math.sqrt(3), ISQRT2 = 1 / Math.sqrt(2), ISQRT6 = 1 / Math.sqrt(6);
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                color[r] = (R + G + B) * ISQRT3;
                color[g] = (R - G) * ISQRT2;
                color[b] = (R + G - 2 * B) * ISQRT6;
            }
            return color;
        },
        /** Conversion function.
         */
        "Opponent to RGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var SQRT3 = Math.sqrt(3), SQRT2 = Math.sqrt(2), SQRT6 = Math.sqrt(6);
            var I6 = 1 / 6, I3 = 1 / 3;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var O1 = color[r], O2 = color[g], O3 = color[b];
                var c1 = O1 * SQRT3, c2 = O2 * SQRT2, c3 = O3 * SQRT6;
                color[r] = (2 * c1 + 3 * c2 + c3) * I6;
                color[g] = (2 * c1 - 3 * c2 + c3) * I6;
                color[b] = (c1 - c3) * I3;
            }
            return color;
        },
        /** Conversion function.
         */
        "RGB to Ohta": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var ISQRT3 = 1 / Math.sqrt(3), ISQRT2 = 1 / Math.sqrt(2), ISQRT6 = 1 / Math.sqrt(6);
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                color[r] = (R + G + B) * ISQRT3;
                color[g] = (R - B) * ISQRT2;
                color[b] = (-R + 2 * G - B) * ISQRT6;
            }
            return color;
        },
        /** Conversion function.
         */
        "Ohta to RGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var SQRT3 = Math.sqrt(3), SQRT2 = Math.sqrt(2), SQRT6 = Math.sqrt(6);
            var I6 = 1 / 6, I3 = 1 / 3;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var O1 = color[r], O2 = color[g], O3 = color[b];
                var c1 = O1 * SQRT3, c2 = O2 * SQRT2, c3 = O3 * SQRT6;
                color[g] = (c1 + c3) * I3;
                color[r] = (2 * c1 + 3 * c2 - c3) * I6;
                color[b] = (2 * c1 - 3 * c2 - c3) * I6;
            }
            return color;
        },
        /** Conversion function.
         */
        "LinearRGB to rgY": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                var Y = R + G + B;
                if (Y > 0) {
                    var iY = 1 / Y;
                    color[r] = R * iY ;
                    color[g] = G * iY;
                    color[b] = Y;
                } else {
                    color[r] = 1 / 3;
                    color[g] = 1 / 3;
                    color[b] = 0;
                }
            }
            return color;
        },
        /** Conversion function.
         */
        "rgY to LinearRGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], Y = color[b];
                color[r] = R * Y;
                color[g] = G * Y;
                color[b] = (1 - R - G) * Y;
            }
            return color;
        },

        // CIE colorspace
        /** Conversion function.
         * @private
         */
        getXYZTransform: function (inverse, illuminant, primaries) {
            illuminant = illuminant || [0.31271, 0.32902, 1]; // D65 xyY
            primaries = primaries || [0.64, 0.33, 1, 0.30, 0.60, 1, 0.15, 0.06, 1]; // sRGB xyY
            // White Point conversion
            var XYZWP = CS["xyY to XYZ"](illuminant);
            XYZWP = Matrix.toMatrix(XYZWP);
            
            // Primaries conversion
            var primaries = CS["xyY to XYZ"](primaries, 3);
            primaries = new Matrix([3, 3], primaries);
            
            var S = Matrix.diag(primaries.inv().mtimes(XYZWP));
            
            var XYZMat = primaries.mtimes(S);
            return inverse ? XYZMat.inv() : XYZMat;
        },
        /** Conversion function.
         */
        "LinearRGB to XYZ": function (color, N, sc, sp, wp, prim) {
            var mat = CS.getXYZTransform(false, wp, prim).getData();
            CS.matrix(color, mat, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        "XYZ to LinearRGB": function (color, N, sc, sp, wp, prim) {
            var mat = CS.getXYZTransform(true, wp, prim).getData();
            CS.matrix(color, mat, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        "XYZ to Lab": function (color, N, sc, sp, wp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;

            wp = wp || [0.31271, 0.32902, 1];
            var x = wp[0], y = wp[1], Yn = wp[2];
            var Xn = x * Yn / y;
            var Zn = (1 - x - y) * Yn / y;
            var IXn = 1 / Xn, IYn = 1 / Yn, IZn = 1 / Zn;

            var I3 = 1 / 3, I116M16 = 16 / 116;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var X = color[r], Y = color[g], Z = color[b];
                var c1 = X  * IXn;
                if (c1 > 0.008856) {
                    c1 = Math.pow(c1, I3);
                } else {
                    c1 = 7.787 * c1 + I116M16;
                }
                var c2 = Y * IYn;
                if (c2 > 0.008856) {
                    c2 = Math.pow(c2, I3);
                } else {
                    c2 = 7.787 * c2 + I116M16;
                }
                var c3 = Z  * IZn;
                if (c3 > 0.008856) {
                    c3 = Math.pow(c3, I3);
                } else {
                    c3 = 7.787 * c3 + I116M16;
                }

                color[r] = 116 * c2 - 16;
                color[g] = 500 * (c1 - c2);
                color[b] = 200 * (c2 - c3);
            }
            return color;
        },
        /** Conversion function.
         */
        "Lab to XYZ": function (color, N, sc, sp, wp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;

            wp = wp || [0.31271, 0.32902, 1];
            var x = wp[0], y = wp[1], Yn = wp[2];
            var Xn = x * Yn / y;
            var Zn = (1 - x - y) * Yn / y;

            var CST1 = Math.pow(0.008856, 1 / 3), CST2 = 1 / 7.787;
            var I116 = 1 / 116, I500 = 1 / 500, I200 = 1 / 200;
            var I116M16 = 16 / 116;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var L = color[r], as = color[g], bs = color[b];
                var YTmp = (L  + 16) * I116;
                var XTmp = YTmp + as  * I500;
                var ZTmp = YTmp - bs  * I200;
                if (YTmp > CST1) {
                    YTmp = Math.pow(YTmp, 3);
                } else {
                    YTmp = (YTmp - I116M16) * CST2;
                }
                if (XTmp > CST1) {
                    XTmp = Math.pow(XTmp, 3);
                } else {
                    XTmp = (XTmp - I116M16) * CST2;
                }
                if (ZTmp > CST1) {
                    ZTmp = Math.pow(ZTmp, 3);
                } else {
                    ZTmp = (ZTmp - I116M16) * CST2;
                }

                color[r] = XTmp * Xn;
                color[g] = YTmp * Yn;
                color[b] = ZTmp * Zn;
            }
            return color;
        },
        /** Conversion function.
         */
        "XYZ to Luv": function (color, N, sc, sp, wp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;

            wp = wp || [0.31271, 0.32902, 1];
            var x = wp[0], y = wp[1], Yn = wp[2];
            var Xn = x * Yn / y;
            var Zn = (1 - x - y) * Yn / y;
            var IYn = 1 / Yn;
            var un = 4 * Xn / (Xn + 15 * Yn + 3 * Zn);
            var vn = 9 * Yn / (Xn + 15 * Yn + 3 * Zn);

            var I3 = 1 / 3;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var X = color[r], Y = color[g], Z = color[b];
                var LTmp = Y * IYn;

                if (LTmp > 0.008856) {
                    LTmp = 116 * Math.pow(LTmp, I3) - 16;
                } else {
                    LTmp *= 903.3;
                }

                var tmp = 1 / (X + 15 * Y + 3 * Z);
                tmp = isFinite(tmp) ? tmp : 0;
                var uTmp = 4 * tmp * X;
                var vTmp = 9 * tmp * Y;

                tmp = 13 * LTmp;
                color[r] = LTmp;
                color[g] = tmp * (uTmp - un);
                color[b] = tmp * (vTmp - vn);
            }
            return color;
        },
        /** Conversion function.
         */
        "Luv to XYZ": function (color, N, sc, sp, wp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;

            wp = wp || [0.31271, 0.32902, 1];
            var x = wp[0], y = wp[1], Yn = wp[2];
            var Xn = x * Yn / y;
            var Zn = (1 - x - y) * Yn / y;
            var un = 4 * Xn / (Xn + 15 * Yn + 3 * Zn);
            var vn = 9 * Yn / (Xn + 15 * Yn + 3 * Zn);

            var CST1 = Math.pow(0.008856, 1 / 3), CST2 = 1 / 7.787;
            var I116 = 1 / 116, I116M16 = 16 / 116;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var L = color[r], u = color[g], v = color[b];
                var YTmp = (L + 16) * I116;
                if (YTmp > CST1) {
                    YTmp = Math.pow(YTmp, 3);
                } else {
                    YTmp = (YTmp - I116M16) * CST2;
                }
                var tmp = 1 / (13 * L);
                tmp = isFinite(tmp) ? tmp : 0;
                var uTmp = u * tmp + un;
                var vTmp = v * tmp + vn;
                tmp = YTmp / (4 * vTmp);

                color[r] = 9 * uTmp * tmp;
                color[g] = YTmp;
                color[b] = (12 - 3 * uTmp - 20 * vTmp) * tmp;
            }
            return color;
        },
        /** Conversion function.
         */
        'Lab to Lch': function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var IPI2 = 1 / (2 * Math.PI);
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var L = color[r], au = color[g], bv = color[b];
                var hTmp = Math.atan2(bv, au) * IPI2;
                color[r] = L;
                color[g] = Math.sqrt(au * au + bv * bv);
                color[b] = hTmp < 0 ? hTmp + 1 : hTmp;
            }
            return color;
        },
        /** Conversion function.
         */
        'Lch to Lab': function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var PI2 = Math.PI * 2;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var L = color[r], c = color[g], h = color[b];
                var hTmp = h * PI2;
                var auTmp = Math.cos(hTmp) * c;
                var bvTMP = Math.sin(hTmp) * c;
                color[r] = L;
                color[g] = auTmp;
                color[b] = bvTMP;
            }
            return color;
        },
        // CIE function combinations
        /** Conversion function.
         */
        "RGB to XYZ": function (color, N, sc, sp) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        "XYZ to RGB": function (color, N, sc, sp) {
            CS['XYZ to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        "RGB to Lab": function (color, N, sc, sp, wp) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp, wp);
            CS['XYZ to Lab'](color, N, sc, sp, wp);
            return color;
        },
        /** Conversion function.
         */
        "Lab to RGB": function (color, N, sc, sp) {
            CS['Lab to XYZ'](color, N, sc, sp);
            CS['XYZ to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'RGB to Luv': function (color, N, sc, sp, wp) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp);
            CS['XYZ to Luv'](color, N, sc, sp, wp);
            return color;
        },
        /** Conversion function.
         */
        'Luv to RGB': function (color, N, sc, sp, wp) {
            CS['Luv to XYZ'](color, N, sc, sp, wp);
            CS['XYZ to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'RGB to Lch': function (color, N, sc, sp, wp) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp);
            CS['XYZ to Lab'](color, N, sc, sp, wp);
            CS['Lab to Lch'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'Lch to RGB': function (color, N, sc, sp, wp) {
            CS['Lch to Lab'](color, N, sc, sp);
            CS['Lab to XYZ'](color, N, sc, sp, wp);
            CS['XYZ to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        },

        // Chromaticity spaces
        /** Conversion function.
         */
        "XYZ to xyY": function (color, N, sc, sp, wp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;

            wp = wp || [0.31271, 0.32902, 1];
            var xn = wp[0], yn = wp[1];

            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var X = color[r], Y = color[g], Z = color[b];
                var IL = 1 / (X + Y + Z);
                if (isFinite(IL)) {
                    color[r] = X * IL;
                    color[g] = Y * IL;
                    color[b] = Y;
                } else {
                    color[r] = xn;
                    color[g] = yn;
                    color[b] = 0;
                }
            }
            return color;
        },
        /** Conversion function.
         */
        "xyY to XYZ": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var x = color[r], y = color[g], Y = color[b];
                var tmp = Y / y;
                color[r] = x * tmp;
                color[g] = Y;
                color[b] = (1 - x - y) * tmp;
            }
            return color;
        },
        /** Conversion function.
         */
        "XYZ to 1960 uvY": function (color, N, sc, sp, wp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;

            wp = wp || [0.31271, 0.32902, 1];
            var x = wp[0], y = wp[1], Yn = wp[2];
            var Xn = x * Yn / y, Zn = (1 - x - y) * Yn / y;
            var un = 4 * Xn / (Xn + 15 * Yn + 3 * Zn);
            var vn1 = 6 * Yn / (Xn + 15 * Yn + 3 * Zn);

            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var X = color[r], Y = color[g], Z = color[b];
                if (Y === 0) {
                    color[r] = un;
                    color[g] = vn1;
                    color[b] = 0;
                } else {
                    var IL = 1 / (X + 15 * Y + 3 * Z);
                    color[r] = 4 * X * IL;
                    color[g] = 6 * Y * IL;
                    color[b] = Y;
                }
            }
            return color;
        },
        /** Conversion function.
         */
        "1960 uvY to XYZ": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var I4M6 = 6 / 4, I3 = 1 / 3;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var u = color[r], v = color[g], Y = color[b];
                var iv = 1 / v;
                var X = I4M6 * Y * u * iv;
                color[r] = X;
                color[g] = Y;
                color[b] = (6 * Y * iv - X - 15 * Y) * I3;
            }
            return color;
        },
        /** Conversion function.
         */
        "XYZ to 1976 u'v'Y": function (color, N, sc, sp, wp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;

            wp = wp || [0.31271, 0.32902, 1];
            var x = wp[0], y = wp[1], Yn = wp[2];
            var Xn = x * Yn / y, Zn = (1 - x - y) * Yn / y;
            var un = 4 * Xn / (Xn + 15 * Yn + 3 * Zn);
            var vn = 9 * Yn / (Xn + 15 * Yn + 3 * Zn);

            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var X = color[r], Y = color[g], Z = color[b];
                if (Y === 0) {
                    color[r] = un;
                    color[g] = vn;
                    color[b] = 0;
                } else {
                    var iL = 1 / (X + 15 * Y + 3 * Z);
                    color[r] = 4 * X * iL;
                    color[g] = 9 * Y * iL;
                    color[b] = Y;
                }
            }
            return color;
        },
        /** Conversion function.
         */
        "1976 u'v'Y to XYZ": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var I4M9 = 9 / 4, I3 = 1 / 3;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var u = color[r], v = color[g], Y = color[b];
                var iv = 1/ v;
                var X = I4M9 * Y * u  * iv;
                color[r] = X;
                color[g] = Y;
                color[b] = (9 * Y * iv - X - 15 * Y) * I3;
            }
            return color;
        },
        /** Conversion function.
         */
        "xyY to 1960 uvY": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var x = color[r], y = color[g];
                var tmp = 1 / (-2 * x + 12 * y + 3);
                color[r] = 4 * x * tmp;
                color[g] = 6 * y * tmp;
            }
            return color;
        },
        /** Conversion function.
         */
        "1960 uvY to xyY": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var u = color[r], v = color[g];
                var tmp = 1 / (2 * u - 8 * v + 4);
                // Do something with RGB values
                color[r] = 3 * u * tmp;
                color[g] = 2 * v * tmp;
            }
            return color;
        },
        /** Conversion function.
         */
        "1976 u'v'Y to xyY": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var u = color[r], v = color[g];
                var tmp = 1 / (6 * u - 16 * v + 12);
                color[r] = 9 * u * tmp;
                color[g] = 4 * v * tmp;
            }
            return color;
        },
        /** Conversion function.
         */
        "xyY to 1976 u'v'Y": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var x = color[r], y = color[g];
                var tmp = 1 / (-2 * x + 12 * y + 3);
                color[r] = 4 * x * tmp;
                color[g] = 9 * y * tmp;
            }
            return color;
        },
        /** Conversion function.
         */
        "1976 u'v'Y to 1960 uvY": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp + sc;
            var I3M2 = 2 / 3;
            for (var g = sc; g < N; g += sp) {
                color[g] *= I3M2;
            }
            return color;
        },
        /** Conversion function.
         */
        "1960 uvY to 1976 u'v'Y": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp + sc;
            var I2M3 = 3 / 2;
            for (var g = sc; g < N; g += sp) {
                color[g] *= I2M3;
            }
            return color;
        },
        // Chromaticity function combinations
        /** Conversion function.
         */
        'RGB to rgY': function (color, N, sc, sp) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to rgY'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'rgY to RGB': function (color, N, sc, sp) {
            CS['rgY to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'rgY to xyY': function (color, N, sc, sp) {
            CS['rgY to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp);
            CS['XYZ to xyY'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'xyY to rgY': function (color, N, sc, sp) {
            CS['xyY to XYZ'](color, N, sc, sp);
            CS['XYZ to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to rgY'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'RGB to xyY': function (color, N, sc, sp) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp);
            CS['XYZ to xyY'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'xyY to RGB': function (color, N, sc, sp) {
            CS['xyY to XYZ'](color, N, sc, sp);
            CS['XYZ to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'RGB to 1960 uvY': function (color, N, sc, sp) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp);
            CS['XYZ to xyY'](color, N, sc, sp);
            CS['xyY to 1960 uvY'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        '1960 uvY to RGB': function (color, N, sc, sp) {
            CS['1960 uvY to xyY'](color, N, sc, sp);
            CS['xyY to XYZ'](color, N, sc, sp);
            CS['XYZ to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        "RGB to 1976 u'v'Y": function (color, N, sc, sp) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp);
            CS["XYZ to 1976 u'v'Y"](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        "1976 u'v'Y to RGB": function (color, N, sc, sp) {
            CS["1976 u'v'Y to XYZ"](color, N, sc, sp);
            CS['XYZ to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        }
    };

    global.Colorspaces = CS;

})(Matrix);

(function (Matrix, Matrix_prototype) {
    "use strict";

    //////////////////////////////////////////////////////////////////
    //                       COLOR IMAGES MODULE                    //
    //////////////////////////////////////////////////////////////////


    var matlabEquivalence = {
        "lab2lch":   "Lab to Lch",
        "lab2srgb":  "Lab to RGB",
        "lab2xyz":   "Lab to XYZ",
        "lch2lab":   "Lch to Lab",
        "srgb2cmyk": "RGB to CMY",
        "srgb2lab":  "RGB to Lab",
        "srgb2xyz":  "RGB to XYZ",
        "upvpl2xyz": "1976 u'v'Y to XYZ",
        "uvl2xyz":   "1960 uvY to XYZ",
        "xyl2xyz":   "xyY to XYZ",
        "xyz2lab":   "XYZ to Lab",
        "xyz2srgb":  "XYZ to RGB",
        "xyz2upvpl": "XYZ to 1976 u'v'",
        "xyz2uvl":   "XYZ to 1960 uv",
        "xyz2xyl":   "XYZ to xyY"
    };


    /** @class Matrix */


    /** Apply a transformation to each RGB triplet of an image.
     *
     * @param {String | Function | Matrix} cform
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.applycform = function (cform) {
        if (this.ndims() !== 3 || this.getSize(2) < 3) {
            throw new Error("Matrix.applycform: Matrix must be an " +
                            "image with RGB components.");
        }
        var N = this.getSize(0) * this.getSize(1);
        if (typeof(cform) === "string") {
            if (Matrix.Colorspaces[cform]) {
                Matrix.Colorspaces[cform](this.getData(), N, N, 1);
            } else if (Matrix.Colorspaces[matlabEquivalence[cform]]) {
                Matrix.Colorspaces[matlabEquivalence[cform]](this.getData(), N, N, 1);
            } else {
                throw new Error("Matrix.applycform: Unknown color transformation " + cform);
            }
        } else if (typeof(cform) === "function") {
            if (cform.length === 3) {
                Matrix.Colorspaces.applyFunctionRGB(this.getData(), cform, N, N, 1);
            } else if (cform.length === 1) {
                Matrix.Colorspaces.applyFunctionColor(this.getData(), cform, N, N, 1);
            }
        } else {
            cform = Matrix.toMatrix(cform);
            if (!Tools.checkSizeEquals(cform.size(), [3, 3], Matrix.ignoreTrailingDims)) {
                throw new Error("Matrix.applycform: Matrix argument must be 3x3.");
            }
            Matrix.Colorspaces.matrix(this.getData(), cform.getData(), N, N, 1);
        }
        return this;
    };

    Matrix.applycform = function (im, cform) {
        return im.getCopy().applycform(cform);
    };


    /** Convert an gray-level image to a color image given a colormap.
     *
     * @param {String} colormap
     *  Can be "JET", or "HUE".
     *
     * @return {Matrix}
     */
    Matrix_prototype.toColormap = function (cMap) {
        var data = this.getData(), size = this.getSize(), dc = data.length;
        size[2] = 3;
        var out = new Matrix(size), dOut = out.getData();
        var R = dOut.subarray(0, dc), G = dOut.subarray(dc, 2 * dc), B = dOut.subarray(2 * dc, 3 * dc);
        var i, t, floor = Math.floor;
        if (cMap === "JET") {
            for (i = 0; i < dc; i++) {

                t = data[i] * 4;

                if (t >= 4) {
                    t = 3.99;
                } else if (t < 0) {
                    t = 0;
                }
                switch (floor(t * 2) % 8) {
                case 0:
                    R[i] = 0;
                    G[i] = 0;
                    B[i] = t + 0.5;
                    break;
                case 1:
                case 2:
                    R[i] = 0;
                    B[i] = 1;
                    G[i] = t - 0.5;
                    break;
                case 3:
                case 4:
                    R[i] = t - 1.5;
                    G[i] = 1;
                    B[i] = 2.5 - t;
                    break;
                case 5:
                case 6:
                    R[i] = 1;
                    G[i] = 3.5 - t;
                    B[i] = 0;
                    break;
                case 7:
                    R[i] = 4.5 - t;
                    G[i] = 0;
                    B[i] = 0;
                    break;
                }
            }

        } else if (cMap === "HUE") {

            for (i = 0; i < dc; i++) {
                var H = data[i];
                t = floor(H * 6) % 6;
                var f = H * 6 - t;
                switch (t) {
                case 0:
                    R[i] = 1;
                    G[i] = f;
                    B[i] = 0;
                    break;
                case 1:
                    R[i] = 1 - f;
                    G[i] = 1;
                    B[i] = 0;
                    break;
                case 2:
                    R[i] = 0;
                    G[i] = 1;
                    B[i] = f;
                    break;
                case 3:
                    R[i] = 0;
                    G[i] = 1 - f;
                    B[i] = 1;
                    break;
                case 4:
                    R[i] = f;
                    G[i] = 0;
                    B[i] = 1;
                    break;
                case 5:
                    R[i] = 1;
                    G[i] = 0;
                    B[i] = 1 - f;
                    break;
                }
            }

        } else if (cMap === "HUE") {
            dOut.set(data);
        }
        return out;
    };


    Matrix_prototype.correctImage = function (ill, illout) {
        illout = illout || Matrix.CIE.getIlluminant('D65');
        var mat = Matrix.CIE.getIlluminantConversionMatrix(illout, ill);
        this.applycform('sRGB to LinearRGB')
            .applycform(mat)
            .applycform('LinearRGB to sRGB');
        return this;
    };

    Matrix.correctImage = function (im, ill, illout) {
        return im.getCopy().correctImage(ill, illout);
    };

    Matrix_prototype.im2CCT = function () {
        var cform = Matrix.CIE['xyY to CCT'];

        var sizeOut = this.getSize();
        sizeOut.pop();
        var imOut = new Matrix(sizeOut, 'single');

        var id = this.getData(), od = imOut.getData();

        // Iterator to scan the view
        var view = this.getView();
        var dy = view.getStep(0), ly = view.getEnd(0), ny;
        var dx = view.getStep(1), lx = view.getEnd(1), nx;
        var dc = view.getStep(2);

        var x, y0, y1, y2, CCT, color = [];
        for (x = 0, nx = lx; x !== nx; x += dx) {
            y0 = x;
            y1 = x + dc;
            y2 = x + 2 * dc;
            for (ny = x + ly; y0 !== ny; y0 += dy, y1 += dy, y2 += dy) {
                color[0] = id[y0];
                color[1] = id[y1];
                color[2] = id[y2];
                CCT = cform(color);
                CCT = CCT < 1668 ? 1668 : (CCT > 20000 ? 20000 : CCT);
                CCT = isNaN(CCT)  ? 24999 : CCT;
                od[y0] = CCT;
            }
        }
        return imOut;
    };

    Matrix_prototype.CCT2im = function () {
        var cform = Matrix.CIE['CCT to xyY'];

        var sizeOut = this.getSize();
        sizeOut[2] = 3;
        var imOut = new Matrix(sizeOut, 'single');

        var id = this.getData(), od = imOut.getData();

        // Iterator to scan the view
        var view = imOut.getView();
        var dy = view.getStep(0), ly = view.getEnd(0), ny;
        var dx = view.getStep(1), lx = view.getEnd(1), nx;
        var dc = view.getStep(2);

        var x, y0, y1, y2, color = [];
        for (x = 0, nx = lx; x !== nx; x += dx) {
            y0 = x;
            y1 = x + dc;
            y2 = x + 2 * dc;
            for (ny = x + ly; y0 !== ny; y0 += dy, y1 += dy, y2 += dy) {
                color = cform(id[y0]);
                od[y0] = color[0];
                od[y1] = color[1];
                od[y2] = color[2];
            }
        }
        return imOut;
    };

})(Matrix, Matrix.prototype);
