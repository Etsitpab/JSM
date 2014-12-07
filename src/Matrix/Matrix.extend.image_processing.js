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
            stream.on('data', function(chunk) {
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
     * {@link Matrix#filter}
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
    /** 2D filtering.
     *
     * __Also see:__
     * {@link Matrix#separableFilter}.
     *
     * @param {Matrix} 2D kernel
     *
     * @return {Matrix}
     *
     * @todo should check if the kernel is separable with an SVD.
     */
    Matrix_prototype.filter = function (K) {

        // 1. ARGUMENTS
        var errMsg = 'Matrix.filter: ';


        if (!K.ismatrix()) {
            throw new Error(errMsg + "Kernel must be a vector.");
        }

        // 2. Filtering
        var output = new Matrix(this.getSize(), this.getDataType());
        var id = this.getData(), od = output.getData();

        // Iterator to scan the view
        var view = output.getView();
        var dc = view.getStep(2), lc = view.getEnd(2);
        var dx = view.getStep(1), lx = view.getEnd(1);
        var ly = view.getEnd(0);

        var nky = K.getSize(0), nkx = K.getSize(1), kd = K.getData();
        var viewK = K.getView();
        var kdx = viewK.getStep(1), klx = viewK.getEnd(1);
        var kly = viewK.getEnd(0);

        var floor = Math.floor, ceil = Math.ceil;
        var xstart = floor((nkx - 1) / 2), ystart = floor((nky - 1) / 2);
        var xstop = ceil((nkx - 1) / 2), ystop = ceil((nky - 1) / 2);

        /*
         if (xstart >= lx / 2 || ystart >= ly / 2) {
         throw new Error(errMsg + 'Kernel is too large.');
         }
         */

        var sum;
        var c, x, _x, nx, y, yx, ny, j, ij, kx, k_x, kyx, knx, kny;
        for (c = 0; c !== lc; c += dc) {

            for (x = 0, _x = c, nx = c + xstart * dx; _x !== nx; x++, _x += dx) {

                for (y = 0, yx = _x, ny = _x + ystart; yx !== ny; y++, yx++) {
                    sum = 0;
                    for (j = c, kx = xstart - x, k_x = kx * kdx; k_x !== klx; kx++, k_x += kdx, j += dx) {
                        for (ij = j, kyx = k_x + ystart - y, kny = k_x + kly; kyx !== kny; kyx++, ij++) {
                            sum += id[ij] * kd[kyx];
                        }
                    }
                    od[yx] = sum;
                }
                for (ny = _x + ly - ystop; yx !== ny; y++, yx++) {
                    sum = 0;
                    for (j = c, kx = xstart - x, k_x = kx * kdx; k_x !== klx; kx++, k_x += kdx, j += dx) {
                        for (ij = j + y - ystart, kyx = k_x, kny = k_x + kly; kyx !== kny; kyx++, ij++) {
                            sum += id[ij] * kd[kyx];
                        }
                    }
                    od[yx] = sum;
                }
                for (ny = _x + ly; yx !== ny; y++, yx++) {
                    sum = 0;
                    for (j = c, kx = xstart - x, k_x = kx * kdx; k_x !== klx; kx++, k_x += kdx, j += dx) {
                        for (ij = j + y - ystart, kyx = k_x, nky =  k_x + kly + (ly - (y + ystop + 1)); kyx !== nky; kyx++, ij++) {
                            sum += id[ij] * kd[kyx];
                        }
                    }
                    od[yx] = sum;
                }
            }
            for (nx = c + lx - xstop * dx; _x !== nx; x++, _x += dx) {
                for (y = 0, yx = _x, ny = _x + ystart; yx !== ny; y++, yx++) {
                    sum = 0;
                    for (j = _x - xstart * dx, kx = 0, k_x = kx * kdx; k_x !== klx; kx++, k_x += kdx, j += dx) {
                        for (ij = j, kyx = k_x + ystart - y, kny = k_x + kly; kyx !== kny; kyx++, ij++) {
                            sum += id[ij] * kd[kyx];
                        }
                    }
                    od[yx] = sum;
                }
                for (ny = _x + ly - ystop; yx !== ny; y++, yx++) {
                    sum = 0;
                    for (j = _x - xstart * dx, kx = 0, k_x = kx * kdx; k_x !== klx; kx++, k_x += kdx, j += dx) {
                        for (ij = j + y - ystart, kyx = k_x, kny = k_x + kly; kyx !== kny; kyx++, ij++) {
                            sum += id[ij] * kd[kyx];
                        }
                    }
                    od[yx] = sum;
                }
                for (ny = _x + ly; yx !== ny; y++, yx++) {
                    sum = 0;
                    for (j = _x - xstart * dx, kx = 0, k_x = kx * kdx; k_x !== klx; kx++, k_x += kdx, j += dx) {
                        for (ij = j + y - ystart, kyx = k_x, nky =  k_x + kly + (ly - (y + ystop + 1)); kyx !== nky; kyx++, ij++) {
                            sum += id[ij] * kd[kyx];
                        }
                    }
                    od[yx] = sum;
                }
            }

            for (nx = c + lx; _x !== nx; x++, _x += dx) {
                for (y = 0, yx = _x, ny = _x + ystart; yx !== ny; y++, yx++) {
                    sum = 0;
                    for (j = _x - xstart * dx, kx = 0, k_x = 0, knx = klx + (lx / dx - (x + xstop + 1)) * kdx; k_x !== knx; kx++, k_x += kdx, j += dx) {
                        for (ij = j, kyx = k_x + ystart - y, kny = k_x + kly; kyx !== kny; kyx++, ij++) {
                            sum += id[ij] * kd[kyx];
                        }
                    }
                    od[yx] = sum;
                }
                for (ny = _x + ly - ystop; yx !== ny; y++, yx++) {
                    sum = 0;
                    for (j = _x - xstart * dx, kx = 0, k_x = 0, knx = klx + (lx / dx - (x + xstop + 1)) * kdx; k_x !== knx; kx++, k_x += kdx, j += dx) {
                        for (ij = j + y - ystart, kyx = k_x, kny = k_x + kly; kyx !== kny; kyx++, ij++) {
                            sum += id[ij] * kd[kyx];
                        }
                    }
                    od[yx] = sum;
                }
                for (ny = _x + ly; yx !== ny; y++, yx++) {
                    sum = 0;
                    for (j = _x - xstart * dx, kx = 0, k_x = 0, knx = klx + (lx / dx - (x + xstop + 1)) * kdx; k_x !== knx; kx++, k_x += kdx, j += dx) {
                        for (ij = j + y - ystart, kyx = k_x, nky =  k_x + kly + (ly - (y + ystop + 1)); kyx !== nky; kyx++, ij++) {
                            sum += id[ij] * kd[kyx];
                        }
                    }
                    od[yx] = sum;
                }
            }
        }
        // Return the result
        return output;
    };

    /** Bilateral filtering.
     *
     * __Also see:__
     * {@link Matrix#filter}.
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
    Matrix_prototype.bilateral = function (sigma_s, sigma_i, prec) {

        // 1. ARGUMENTS
        var errMsg = 'Matrix.filter: ';

        var prec = prec || 3;
        var K = Matrix.fspecial('gaussian', Math.round(prec * sigma_s), sigma_s);
        var cst = -1 / (2 * sigma_i);

        if (!K.ismatrix()) {
            throw new Error(errMsg + "Kernel must be a vector.");
        }

        // 2. Filtering
        var output = new Matrix(this.getSize(), this.getDataType());
        var id = this.getData(), od = output.getData();

        // Iterator to scan the view
        var view = output.getView();
        var dc = view.getStep(2), lc = view.getEnd(2);
        var dx = view.getStep(1), lx = view.getEnd(1);
        var ly = view.getEnd(0);

        var nky = K.getSize(0), nkx = K.getSize(1), kd = K.getData();
        var viewK = K.getView();
        var kdx = viewK.getStep(1), klx = viewK.getEnd(1);
        var kly = viewK.getEnd(0);

        var floor = Math.floor, ceil = Math.ceil;
        var xstart = floor((nkx - 1) / 2), ystart = floor((nky - 1) / 2);
        var xstop = ceil((nkx - 1) / 2), ystop = ceil((nky - 1) / 2);

        /*
         if (xstart >= lx / 2 || ystart >= ly / 2) {
         throw new Error(errMsg + 'Kernel is too large.');
         }
         */
        var exp = Math.exp;
        var sum;
        var c, x, _x, nx, y, yx, ny, j, ij, kx, k_x, kyx, knx, kny, v, val, weight, tmp;
        for (c = 0; c !== lc; c += dc) {

            for (x = 0, _x = c, nx = c + xstart * dx; _x !== nx; x++, _x += dx) {

                for (y = 0, yx = _x, ny = _x + ystart; yx !== ny; y++, yx++) {
                    v = id[yx];
                    sum = 0;
                    val = 0;
                    for (j = c, kx = xstart - x, k_x = kx * kdx; k_x !== klx; kx++, k_x += kdx, j += dx) {
                        for (ij = j, kyx = k_x + ystart - y, kny = k_x + kly; kyx !== kny; kyx++, ij++) {
    	                    tmp = v - id[ij];
                            weight = kd[kyx] * exp(cst * tmp * tmp);
                            sum += weight;
                            val += id[ij] * weight;
                        }
                    }
                    od[yx] = val / sum;
                }
                for (ny = _x + ly - ystop; yx !== ny; y++, yx++) {
                    v = id[yx];
                    sum = 0;
                    val = 0;
                    for (j = c, kx = xstart - x, k_x = kx * kdx; k_x !== klx; kx++, k_x += kdx, j += dx) {
                        for (ij = j + y - ystart, kyx = k_x, kny = k_x + kly; kyx !== kny; kyx++, ij++) {
    	                    tmp = v - id[ij];
                            weight = kd[kyx] * exp(cst * tmp * tmp);
                            sum += weight;
                            val += id[ij] * weight;
                        }
                    }
                    od[yx] = val / sum;
                }
                for (ny = _x + ly; yx !== ny; y++, yx++) {
                    v = id[yx];
                    sum = 0;
                    val = 0;
                    for (j = c, kx = xstart - x, k_x = kx * kdx; k_x !== klx; kx++, k_x += kdx, j += dx) {
                        for (ij = j + y - ystart, kyx = k_x, nky =  k_x + kly + (ly - (y + ystop + 1)); kyx !== nky; kyx++, ij++) {
    	                    tmp = v - id[ij];
                            weight = kd[kyx] * exp(cst * tmp * tmp);
                            sum += weight;
                            val += id[ij] * weight;
                        }
                    }
                    od[yx] = val / sum;
                }
            }
            for (nx = c + lx - xstop * dx; _x !== nx; x++, _x += dx) {
                for (y = 0, yx = _x, ny = _x + ystart; yx !== ny; y++, yx++) {
                    v = id[yx];
                    sum = 0;
                    val = 0;
                    for (j = _x - xstart * dx, kx = 0, k_x = kx * kdx; k_x !== klx; kx++, k_x += kdx, j += dx) {
                        for (ij = j, kyx = k_x + ystart - y, kny = k_x + kly; kyx !== kny; kyx++, ij++) {
    	                    tmp = v - id[ij];
                            weight = kd[kyx] * exp(cst * tmp * tmp);
                            sum += weight;
                            val += id[ij] * weight;
                        }
                    }
                    od[yx] = val / sum;
                }
                for (ny = _x + ly - ystop; yx !== ny; y++, yx++) {
                    v = id[yx];
                    sum = 0;
                    val = 0;
                    for (j = _x - xstart * dx, kx = 0, k_x = kx * kdx; k_x !== klx; kx++, k_x += kdx, j += dx) {
                        for (ij = j + y - ystart, kyx = k_x, kny = k_x + kly; kyx !== kny; kyx++, ij++) {
    	                    tmp = v - id[ij];
                            weight = kd[kyx] * exp(cst * tmp * tmp);
                            sum += weight;
                            val += id[ij] * weight;
                        }
                    }
                    od[yx] = val / sum;
                }
                for (ny = _x + ly; yx !== ny; y++, yx++) {
                    v = id[yx];
                    sum = 0;
                    val = 0;
                    for (j = _x - xstart * dx, kx = 0, k_x = kx * kdx; k_x !== klx; kx++, k_x += kdx, j += dx) {
                        for (ij = j + y - ystart, kyx = k_x, nky =  k_x + kly + (ly - (y + ystop + 1)); kyx !== nky; kyx++, ij++) {
    	                    tmp = v - id[ij];
                            weight = kd[kyx] * exp(cst * tmp * tmp);
                            sum += weight;
                            val += id[ij] * weight;
                        }
                    }
                    od[yx] = val / sum;
                }
            }

            for (nx = c + lx; _x !== nx; x++, _x += dx) {
                for (y = 0, yx = _x, ny = _x + ystart; yx !== ny; y++, yx++) {
                    v = id[yx];
                    sum = 0;
                    val = 0;
                    for (j = _x - xstart * dx, kx = 0, k_x = 0, knx = klx + (lx / dx - (x + xstop + 1)) * kdx; k_x !== knx; kx++, k_x += kdx, j += dx) {
                        for (ij = j, kyx = k_x + ystart - y, kny = k_x + kly; kyx !== kny; kyx++, ij++) {
    	                    tmp = v - id[ij];
                            weight = kd[kyx] * exp(cst * tmp * tmp);
                            sum += weight;
                            val += id[ij] * weight;
                        }
                    }
                    od[yx] = val / sum;
                }
                for (ny = _x + ly - ystop; yx !== ny; y++, yx++) {
                    sum = 0;
                    val = 0;
                    v = id[yx];
                    for (j = _x - xstart * dx, kx = 0, k_x = 0, knx = klx + (lx / dx - (x + xstop + 1)) * kdx; k_x !== knx; kx++, k_x += kdx, j += dx) {
                        for (ij = j + y - ystart, kyx = k_x, kny = k_x + kly; kyx !== kny; kyx++, ij++) {
    	                    tmp = v - id[ij];
                            weight = kd[kyx] * exp(cst * tmp * tmp);
                            sum += weight;
                            val += id[ij] * weight;
                        }
                    }
                    od[yx] = val / sum;
                }
                for (ny = _x + ly; yx !== ny; y++, yx++) {
                    v = id[yx];
                    sum = 0;
                    val = 0;
                    for (j = _x - xstart * dx, kx = 0, k_x = 0, knx = klx + (lx / dx - (x + xstop + 1)) * kdx; k_x !== knx; kx++, k_x += kdx, j += dx) {
                        for (ij = j + y - ystart, kyx = k_x, nky =  k_x + kly + (ly - (y + ystop + 1)); kyx !== nky; kyx++, ij++) {
    	                    tmp = v - id[ij];
                            weight = kd[kyx] * exp(cst * tmp * tmp);
                            sum += weight;
                            val += id[ij] * weight;
                        }
                    }
                    od[yx] = val / sum;
                }
            }
        }
        // Return the result
        return output;
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
     * {@link Matrix#fastGaussian}.
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
    /** 2D Fast gaussian blur.
     *
     * @param {Number} sigmaX
     *
     * @param {Number} [sigmaY=sigmaX]
     *
     * @param {Integer} [numsteps=4]
     *  High number increases the computational time as well as the
     *  quality of the filtering.
     *
     * @return {Matrix}
     *
     * @todo Actually it should be faster.
     */
    Matrix_prototype.fastGaussian = function (sigmaX, sigmaY, numsteps) {

        if (!sigmaY) {
            sigmaY = sigmaX;
        }
        if (!numsteps) {
            numsteps = 4;
        }

        if (sigmaX <= 0 || numsteps < 1) {
            throw new Error('Matrix.fastGaussian: sigma and' +
                            ' numsteps values have to be positives');
        }

        var filter = function (imOut, sigma) {
            var dataOut = imOut.getData();

            var lambda = (sigma * sigma) / (2 * numsteps);
            var nu = (1 + 2 * lambda - Math.sqrt(1 + 4 * lambda)) / (2 * lambda);
            var boundaryscale = 1 / (1 - nu);
            var postscale = Math.pow(nu / lambda, numsteps);
            var c, x;

            var f = function (data, l) {
                var y, ey, step;
                for (step = 0; step < numsteps; step++) {
                    data[0] *= boundaryscale;
                    // Filter rightwards
                    for (y = 1; y < l; y++) {
                        data[y] +=  nu * data[y - 1];
                    }
                    data[l - 1] *= boundaryscale;
                    // Filter leftwards
                    for (y--; y > 0; y--) {
                        data[y - 1] += nu * data[y];
                    }
                }
                for (y = 0, ey = l; y < ey; y++) {
                    data[y] *= postscale;
                }
            };

            // Iterator to scan the view
            var view = imOut.getView();
            var dc = view.getStep(2), lc = view.getEnd(2);
            var dx = view.getStep(1), lx = view.getEnd(1);
            var ly = view.getEnd(0);

            var nx;
            for (c = 0; c !== lc; c += dc) {
                for (x = c, nx = c + lx; x !== nx; x += dx) {
                    var data = dataOut.subarray(x);
                    f(data, ly);
                }
            }
            return imOut;
        };

        var imOut = filter(this.getCopy(), sigmaX).permute([1, 0, 2]);
        return filter(imOut, sigmaY).permute([1, 0, 2]);
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

    Matrix_prototype.fastGaussian = function (sigmaX, sigmaY, numsteps) {

        if (!sigmaY) {
            sigmaY = sigmaX;
        }
        if (!numsteps) {
            numsteps = 4;
        }

        if (sigmaX <= 0 || numsteps < 1) {
            throw new Error('Matrix.fastGaussian: sigma and' +
                            ' numsteps values have to be positives');
        }

        var filter = function (imOut, sigma) {
            var dataOut = imOut.getData();

            var lambda = (sigma * sigma) / (2 * numsteps);
            var nu = (1 + 2 * lambda - Math.sqrt(1 + 4 * lambda)) / (2 * lambda);
            var boundaryscale = 1 / (1 - nu);
            var postscale = Math.pow(nu / lambda, numsteps);
            var c, x;

            var f = function (data, l) {
                var y, ey, step;
                for (step = 0; step < numsteps; step++) {
                    data[0] *= boundaryscale;
                    // Filter rightwards
                    for (y = 1; y < l; y++) {
                        data[y] +=  nu * data[y - 1];
                    }
                    data[l - 1] *= boundaryscale;
                    // Filter leftwards
                    for (y--; y > 0; y--) {
                        data[y - 1] += nu * data[y];
                    }
                }
                for (y = 0, ey = l; y < ey; y++) {
                    data[y] *= postscale;
                }
            };

            // Iterator to scan the view
            var view = imOut.getView();
            var dc = view.getStep(2), lc = view.getEnd(2);
            var dx = view.getStep(1), lx = view.getEnd(1);
            var ly = view.getEnd(0);

            var nx;
            for (c = 0; c !== lc; c += dc) {
                for (x = c, nx = c + lx; x !== nx; x += dx) {
                    var data = dataOut.subarray(x);
                    f(data, ly);
                }
            }
            return imOut;
        };

        var imOut = filter(this.getCopy(), sigmaX).permute([1, 0, 2]);
        return filter(imOut, sigmaY).permute([1, 0, 2]);
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
    
    var getImageColumnArray = function (A) {
        var m = A.getSize(0), n = A.getSize(1), c = A.getSize(2);
        var dc = m * n;
        var ad = A.getData(), col = [];
        for (var c = 0, lc = ad.length; c < lc; c += dc) {
            var tmp = []
            for (var j = 0, _j = 0; j < n; j++, _j += m) {
                tmp[j] = ad.subarray(_j, m + _j);
            }
            col.push(tmp);
        }
        return col;
    };

    /** Fast block filtering function. allow to compute block average.
     *
     * @param {Number} sigmaX
     * @param {Number} [sigmaY=sigmaX]
     * @param {Matrix} [imcum]
     *  Image cumulated. It can be used to avoid this step.
     *
     * @return {Matrix}
     */
    Matrix_prototype.blockFilter = function (wx, wy, iscum, k) {
        var imcum;
        if (iscum !== true) {
            imcum = this.im2double().cumsum(0).cumsum(1);
        } else {
            imcum = this.getCopy();
        }
        var imout = Matrix.zeros(imcum.getSize());
        var din = imcum.getData(), dout = imout.getData();
        // Iterator to scan the view
        var view = imcum.getView();
        var dc = view.getStep(2), lc = view.getEnd(2);
        var dx = view.getStep(1), lx = view.getEnd(1);
        var dy = view.getStep(0), ly = view.getEnd(0);

        var sy = (wy / 2) | 0, sx = ((wx / 2) | 0) * dx;

	var nx, ny, c, x, y;
        var y00, y02, y20, y22;

        var e = (sx + sy + dx + 1), f = sx + sy, g = -(sx + dx) + sy, h = sx - sy - 1;
        var dinf = din.subarray(f), dinh = din.subarray(h);
        var cst, cst2 = 1 / (wx * wy);
        
        for (c = 0; c < lc; c += dc) {            
            if (k === 0) {
                // First rows
                for (y = c, ny = c + sy + 1; y < ny; y++) {
                    // First columns
                    for (x = y, nx = y + sx + dx; x < nx; x += dx) {
                        dout[x] = dinf[x] / (((x - y + sx) / dx + 1) * (sy + 1 + y - c));
                    }
                    cst = 1  /(wx * (sy + 1 + y - c));
                    // Central columns
                    for (x = y + sx + dx, nx = y + lx - sx; x < nx; x += dx) {
                        dout[x] = (dinf[x] - din[x + g]) * cst;
                    }
                    // Last columns
                    for (x = y + lx - sx, nx = y + lx; x < nx; x += dx) {
                        dout[x] = din[y + lx - dx + sy] - din[x + g];
                        dout[x] /= ((sx + nx - x) / dx) * (y - c + sy + 1);
                    }
                }
                
                // First columns
                for (x = c, nx = c + sx + dx; x < nx; x += dx) {
                    // Central part
                    cst = 1 / (((x - c + sx) / dx + 1) * wy)
                    for (y = x + sy + 1, ny = x + ly - sy; y < ny; y++) {
                        dout[y] = dinf[y] - dinh[y];
                        dout[y] *= cst;
                    }
                }
                // Central part
                for (x = c + sx + dx, nx = c + lx - sx; x < nx; x += dx) {
                    // Central part
                    for (y = x + sy + 1, ny = x + ly - sy; y < ny; y++) {
                        dout[y] = (din[y - e] + dinf[y] - din[y + g] - dinh[y]) * cst2;
                    }
                }
                // Last columns
                for (x = c + lx - sx, nx = c + lx; x < nx; x += dx) {
                    // Central part
                    cst = 1 / (((c + lx - x + sx) / dx) * wy)
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
                        dout[x] *= cst
                    }
                    // Last columns
                    for (x = y + lx - sx, nx = y + lx; x < nx; x += dx) {
                        dout[x] = din[c + lx - dx + ly - 1] + din[x - e] - din[c + x - y + ly - 1 - sx - dx] - din[c + lx - dx + y - c - sy - 1];
                        dout[x] /= ((lx - (x - y) + sx) / dx) * (sy + (ly - (y - c)));
                    }
                }
            } else {
                // First columns
                for (x = c, nx = c + sx + dx; x < nx; x += dx) {
                    // First rows
                    for (y = x, ny = x + sy + 1; y < ny; y++) {
                        dout[y] = dinf[y]
                        dout[y] /= ((x - c + sx) / dx + 1) * (sy + 1 + y - x);
                    }
                    // Central part
                    cst = 1 / (((x - c + sx) / dx + 1) * wy)
                    for (y = x + sy + 1, ny = x + ly - sy; y < ny; y++) {
                        dout[y] = dinf[y] - dinh[y];
                        dout[y] *= cst;
                    }
                    // Last rows
                    for (y = x + ly - sy, ny = x + ly; y < ny; y++) {
                        dout[y] = din[x + ly - 1 + sx] - dinh[y];
                        dout[y] /= ((x - c + sx) / dx + 1) * (sy + (x + ly - y));
                    }
                }
                // Central part
                for (x = c + sx + dx, nx = c + lx - sx; x < nx; x += dx) {
                    // First rows
                    for (y = x, ny = x + sy + 1; y < ny; y++) {
                        dout[y] = dinf[y] - din[y + g];
                        dout[y] /= wx * (sy + 1 + y - x);
                    }
                    // Central part
                    for (y = x + sy + 1, ny = x + ly - sy; y < ny; y++) {
                        dout[y] = (din[y - e] + dinf[y] - din[y + g] - dinh[y]) * cst2;
                    }
                    // last rows
                    for (y = x + ly - sy, ny = x + ly; y < ny; y++) {
                        dout[y] = din[x + ly - 1 + sx] - din[x + ly - 1 - sx - dx] + din[y - e] - dinh[y];
                        dout[y] /= wx * (sy + (x + ly - y));
                    }
                }
                // Last columns
                for (x = c + lx - sx, nx = c + lx; x < nx; x += dx) {
                    // First rows
                    for (y = x, ny = x + sy + 1; y < ny; y++) {
                        dout[y] = din[c + lx - dx + y - x + sy] - din[y + g];
                        dout[y] /= ((c + lx - x + sx) / dx) * (sy + 1 + y - x);
                    }
                    // Central part
                    cst = 1 / (((c + lx - x + sx) / dx) * wy)
                    for (y = x + sy + 1, ny = x + ly - sy; y < ny; y++) {
                        dout[y] = din[y - e] + din[c + lx - dx + y - x + sy] - din[c + lx - dx + y - x - sy - 1] - din[y + g];
                        dout[y] *= cst;
                    }
                    // last rows
                    for (y = x + ly - sy, ny = x + ly; y < ny; y++) {
                        dout[y] = din[c + lx + ly - dx - 1] - din[x + ly - 1 - sx - dx] + din[y - e] - din[c + lx - dx + y - x - sy - 1];
                        dout[y] /= ((c + lx - x + sx) / dx) * (sy + (x + ly - y));
                    }
                }
            }
        }
        return imout;
    };

    //////////////////////////////////////////////////////////////////
    //                          KERNEL TOOLS                        //
    //////////////////////////////////////////////////////////////////


    /**
     * Holds kernels generation for filtering.
     *
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

    /** Compute the histogram of an grey-level image.
     *
     * @param {Matrix} bins
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
        var computeHistogram = function (src, n) {
            var srcLength = src.length;

            // Compute histogram and histogram sum:
            var hist = new Float32Array(n);
            var i, floor = Math.floor;
            for (i = 0; i < srcLength; ++i) {
                var bin = floor(src[i] * n);
                bin = bin >= n ? n - 1 : bin;
                ++hist[bin];
            }

            // Compute integral histogram:
            var prev = hist[0];
            for (i = 1; i < n; ++i) {
                prev = hist[i] += prev;
            }
            hist.sum = src.length;
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

            var im = this.im2double().applycform("RGB to HSL");
            var src = im.select([], [], 2).getData();

            var hist = computeHistogram(src, n);

            // Equalize image:
            var norm = 1 / hist.sum, floor = Math.floor;
            for (var i = 0; i < src.length; ++i) {
                src[i] = hist[floor(src[i] * n)] * norm;
            }
            var lumOut = new Matrix([im.size(0), im.size(1)], src);
            return im.set([], [], 2, lumOut).applycform("HSL to RGB");
        };
    })();


    /** Transform a RGB image to a gray level image.
     *
     * @chainablec
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
//                 FAST FOURIER TRANSFORM MODULE                //
//////////////////////////////////////////////////////////////////


(function (Matrix, Matrix_prototype) {
    'use strict';

    var SIZE_PRIME = 460
    var primes = new Uint16Array([2,3,5,7,11,13,17,19,23,29
                                  ,31,37,41,43,47,53,59,61,67,71
                                  ,73,79,83,89,97,101,103,107,109,113
                                  ,127,131,137,139,149,151,157,163,167,173
                                  ,179,181,191,193,197,199,211,223,227,229
                                  ,233,239,241,251,257,263,269,271,277,281
                                  ,283,293,307,311,313,317,331,337,347,349
                                  ,353,359,367,373,379,383,389,397,401,409
                                  ,419,421,431,433,439,443,449,457,461,463
                                  ,467,479,487,491,499,503,509,521,523,541
                                  ,547,557,563,569,571,577,587,593,599,601
                                  ,607,613,617,619,631,641,643,647,653,659
                                  ,661,673,677,683,691,701,709,719,727,733
                                  ,739,743,751,757,761,769,773,787,797,809
                                  ,811,821,823,827,829,839,853,857,859,863
                                  ,877,881,883,887,907,911,919,929,937,941
                                  ,947,953,967,971,977,983,991,997,1009,1013
                                  ,1019,1021,1031,1033,1039,1049,1051,1061,1063,1069
                                  ,1087,1091,1093,1097,1103,1109,1117,1123,1129,1151
                                  ,1153,1163,1171,1181,1187,1193,1201,1213,1217,1223
                                  ,1229,1231,1237,1249,1259,1277,1279,1283,1289,1291
                                  ,1297,1301,1303,1307,1319,1321,1327,1361,1367,1373
                                  ,1381,1399,1409,1423,1427,1429,1433,1439,1447,1451
                                  ,1453,1459,1471,1481,1483,1487,1489,1493,1499,1511
                                  ,1523,1531,1543,1549,1553,1559,1567,1571,1579,1583
                                  ,1597,1601,1607,1609,1613,1619,1621,1627,1637,1657
                                  ,1663,1667,1669,1693,1697,1699,1709,1721,1723,1733
                                  ,1741,1747,1753,1759,1777,1783,1787,1789,1801,1811
                                  ,1823,1831,1847,1861,1867,1871,1873,1877,1879,1889
                                  ,1901,1907,1913,1931,1933,1949,1951,1973,1979,1987
                                  ,1993,1997,1999,2003,2011,2017,2027,2029,2039,2053
                                  ,2063,2069,2081,2083,2087,2089,2099,2111,2113,2129
                                  ,2131,2137,2141,2143,2153,2161,2179,2203,2207,2213
                                  ,2221,2237,2239,2243,2251,2267,2269,2273,2281,2287
                                  ,2293,2297,2309,2311,2333,2339,2341,2347,2351,2357
                                  ,2371,2377,2381,2383,2389,2393,2399,2411,2417,2423
                                  ,2437,2441,2447,2459,2467,2473,2477,2503,2521,2531
                                  ,2539,2543,2549,2551,2557,2579,2591,2593,2609,2617
                                  ,2621,2633,2647,2657,2659,2663,2671,2677,2683,2687
                                  ,2689,2693,2699,2707,2711,2713,2719,2729,2731,2741
                                  ,2749,2753,2767,2777,2789,2791,2797,2801,2803,2819
                                  ,2833,2837,2843,2851,2857,2861,2879,2887,2897,2903
                                  ,2909,2917,2927,2939,2953,2957,2963,2969,2971,2999
                                  ,3001,3011,3019,3023,3037,3041,3049,3061,3067,3079
                                  ,3083,3089,3109,3119,3121,3137,3163,3167,3169,3181
                                  ,3187,3191,3203,3209,3217,3221,3229,3251,3253,3257]);


    /**
     * decompose n into prime factors and returns the number of terms
     * tab should be large enough to contain all factors (32 seems enough)
     * Note: returns 0 if n==1, and do not work if n > MAX_PRIME^2
     */
    var decompose = function (n) {
        if (n == 1) {
            return 0;
        }
        var tab = [], count, i, p;

        // search factors
        for (count = i = 0; i < SIZE_PRIME; i++) {
            if ((n % primes[i]) == 0) {
                p = primes[i];
                do {
	            tab[count] = p;
	            count++;
	            n = n / p;
                } while ((n%p) == 0);
            }
        }
        // If n is prime
        if (n != 1) {
            tab[count]=n;
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

        var size = Xr.length;

        var mc = new Float64Array(size), ms = new Float64Array(size);
        var PI2IN = 2 * Math.PI / size;
        for (i = 0; i < size; i++) {
            mc[i] = Math.cos(i * PI2IN);
            ms[i] = isign * Math.sin(i * PI2IN);
        }

        var data = storeInput(Xr, Xi), d = new Float64Array(2 * size);

        var i, j, k, l, p, nsmp, mp;
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
        if (n > 1 && tab[t - 1] != 2) {
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
        // Ouptut matrix
        var Y = new Matrix(X.getSize(), Float64Array, true);
        var Xr = X.getRealData(), Xi = X.getImagData();
        var Yr = Y.getRealData(), Yi = Y.getImagData();

        // This will apply the fft on each column vector of the matrix
        var m = X.getSize(0), n = X.numel() / m;
        for (var j = 0, _j = 0; j < n; j++, _j += m) {
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
    Matrix_prototype.fft2 = function () {
        var Y = matrix_fft(this, false);
        Y = matrix_fft(Y.transpose(), false);
        return Y.transpose();
    };
    /** Compute the 2D FFT of a matrix.
     *
     * __See also :__
     * {@link Matrix#fft},
     * {@link Matrix#ifft2}.
     */
    Matrix.fft2 = function (X) {
        var Y = matrix_fft(Matrix.toMatrix(X), false);
        Y = matrix_fft(Y.transpose(), false);
        return Y.transpose();
    };

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
    }
    Matrix.ifft = function (X) {
        return matrix_fft(Matrix.toMatrix(X), false);
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
        return Matrix.toMatrix(X).fft().transpose().fft().transpose();
    };

})(Matrix, Matrix.prototype);
