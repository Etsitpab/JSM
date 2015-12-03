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

(function () {
    'use strict';

    /* When set to true, allow to reproduce results from the paper.
     * - The first one appears when adapting the alorithm to image 
     *   with 0-1 dynamic instead of 0-255. 
     * - The second apply some processing on approximation coefficients
     *   that are not described in the paper.
     */
    var root = this;
    root.USE_CST = true; 
    root.EDO_RES = false;
    root.processCoeffs = function (D, A, K, w, gamma, nIter) {
        nIter = nIter || 1;
        var max = D[0] > 0 ? D[0] : -D[0];
        for (var i = 1, ei = D.length; i < ei; i++) {
            var v = D[i] > 0 ? D[i] : -D[i];
            if (v > max) {
                max = v;
            }
        }
        var T = Math.max(1.01 / 255, max / K);
        var c = root.USE_CST ? 1 / (Math.pow(255, gamma - 1)) : 1;
        for (i = 0; i < ei; i++) {
            var sign = D[i] > 0 ? 1 : -1, d0 = sign === 1 ? D[i] : -D[i];
            if (d0 <= T) {
                continue;
            }
           
            var a = A[i] > 0 ? A[i] : -A[i], d = d0;
            var c1 = w * gamma, c2 = c1 * gamma * a * c;
            // var c1 = w * gamma * a, c2 = c1 * gamma * c;
            for (var n = 0; n < nIter; n++) {
                var y = d - d0 - c1 * Math.pow(a / d, gamma);
                var yp = 1 + c2 / Math.pow(d, 1 + gamma);
                // var cst = 1 / Math.pow(d, gamma);
                // var y = d - d0 - c1 * cst;
                // var yp = 1 + c2 * cst / d;
                d = d - y / yp;
            }
            D[i] = d * sign;
        }        
        return D;
    };
    root.getLUT = function (K, w, gamma, sz, nIter) {
        sz = sz || [256, 256];
        var A = Matrix.ones(sz).cumsum(0)["-="](1)["/="](sz[0] - 1);
        var D = Matrix.ones(sz).cumsum(1)["-="](1)["/="](sz[1] * 2 - 1);
        processCoeffs(D.getData(), A.getData(), K, w, gamma, nIter);
        return D;
    };
    var processCoeffsLUT = function (D, A, lut) {
        var nx = lut.getSize(1), ny = lut.getSize(0), lut = lut.getData();
        var cst = (nx - 1) * ny;
        for (var i = 1, ei = D.length; i < ei; i++) {
            var a = A[i], d = D[i];
            var sign = d > 0 ? true : false;
            a = (a < 0 ? 0 : (a < 1 ? a : 1));
            d = d = sign ? d : -d
            d *= 2;
            d = d < 1 ? d : 1;
            var index = (d * cst | 0) + (a * (nx - 1) | 0);
            D[i] = sign ? lut[index] : -lut[index];
        }
        return D;
    };

    Matrix.prototype.colorEnhancementTest = function (gamma, w, K, name, alpha, average, stretch) {
        // Default parameters
        alpha = (alpha === undefined) ? 0.1 : alpha;
        gamma = (gamma  === undefined) ? 0.5 : gamma;
        w = (w === undefined) ? 15 / 255 : w;
        name = (name === undefined) ? 'sym4' : name;
        K = (K === undefined) ? 20 : K;
        average = (average === undefined) ? "channel" : average;

        var im = this.im2double(), out = Matrix.zeros(im.size());
        var J = Matrix.dwtmaxlev([this.size(0), this.size(1)], name);
        if (root.EDO_RES) {
            J = J - 1;
        }
        var nChannel = im.size(2), wt = [];
        var mean = [], max = [], min = [];
        var wNorm = Matrix.wfilters(name, 'd')[0].sum().getDataScalar();
        wNorm = Math.pow(wNorm, 2 * J);
        var norm;

        var A, imMean = 0;
        for (var c = 0; c < nChannel; c++) {
            wt[c] = Matrix.wavedec2(im.get([], [], c), J, name);
            A = Matrix.appcoef2(wt[c], name, J);
            mean[c] = A.mean().getDataScalar();
            min[c] = A.min().getDataScalar();
            max[c] = A.max().getDataScalar();
            imMean += mean[c] / nChannel;
        }
        var imMin = Math.min(min[0], min[1], min[2]),
            imMax = Math.max(max[0], max[1], max[2]);
   
        for (c = 0; c < nChannel; c++) {
            A = Matrix.appcoef2(wt[c], name, J);
            if (average === "image") {
                norm = imMean;
            } else if (average === "channel") {
                norm = mean[c];
            } else if (average === "half") {
                norm = wNorm * 0.5; 
            }
            if (stretch === "color") {
                A["-="](min[c])["*="](wNorm / (max[c] - min[c]));
            } else if (stretch === "luminance") {
                A["-="](imMin)["*="](wNorm / (imMax - imMin));
            }
            A["*="](1 - alpha)["+="](norm * alpha);
        }

        for (c = 0; c < nChannel; c++) {
            for (var j = J - 1; j >= 0; j--) { 
                var d = wt[c][0].getData();
                var sb = wt[c][1].value([0, 0]) * wt[c][1].value([0, 1]);
                A = d.subarray(0, sb);
                var cst = w * (1 + 100 * Math.pow((j / (J - 1)), 10));
                processCoeffs(d.subarray(2 * sb, 3 * sb), A, K, cst, gamma);
                processCoeffs(d.subarray(sb, 2 * sb), A, K, cst, gamma);
                processCoeffs(d.subarray(3 * sb, 4 * sb), A, K, cst, gamma);
                wt[c] = Matrix.upwlev2(wt[c], name);
            }
            var channel = wt[c][0].reshape(wt[c][1].get(0).getData());
            out.set([], [], c, channel);
        }

        return out;
    };
    
    Matrix.prototype.colorEnhancement = function(gamma, w, K, name, alpha) {
        // Default parameters
        alpha = (alpha === undefined) ? 0.1 : alpha;
        gamma = (gamma  === undefined) ? 0.5 : gamma;
        w = (w === undefined) ? 15 / 255 : w;
        name = (name === undefined) ? 'sym4' : name;
        K = (K === undefined) ? 20 : K;

        var im = this.im2double();
        var out = Matrix.zeros(im.size());
        var J = Matrix.dwtmaxlev([this.size(0), this.size(1)], name);
        for (var c = 0; c < im.size(2); c++) {
            var channel = im.get([], [], c);
            var wt = Matrix.wavedec2(channel, J, name);
            var A = Matrix.appcoef2(wt, name, J);
            A["*="](1 - alpha)["+="](A.mean()[".*"](alpha));
            for (var j = J - 1; j >= 0; j--) { 
                var d = wt[0].getData();
                var sb = wt[1].value([0, 0]) * wt[1].value([0, 1]);
                A = d.subarray(0, sb);
                processCoeffs(d.subarray(2 * sb, 3 * sb), A, K, w, gamma);
                processCoeffs(d.subarray(sb, 2 * sb), A, K, w, gamma);
                processCoeffs(d.subarray(3 * sb, 4 * sb), A, K, w, gamma);
                wt = Matrix.upwlev2(wt, name);
            }
            channel = wt[0].reshape(wt[1].get(0).getData());
            out.set([], [], c, channel);
        }
        return out;
    };
    Matrix.prototype.computeScaleSpace = function (sigmaInit, nScale, scaleRatio) {
        var computeScale = function (image, sigma) {
            // var approx = image.gaussian(sigma).im2single();
            var approx = image.fastBlur(sigma, sigma, 1);
            var detail = image['-='](approx);
            return {approx: approx, detail: detail, sigma: sigma};
        };

        var nScale = nScale || 18,
            sigmaInit = sigmaInit || 1.00,
            scaleRatio = scaleRatio || Math.sqrt(2);
        
        var image = this.im2single(), i;
        // First scale
        var scales = [computeScale(image, sigmaInit)];
        for (i = 1; i < nScale; i++) {
            var s2old = Math.pow(scales[i - 1].sigma, 2);
            var s2new = Math.pow(sigmaInit * Math.pow(scaleRatio, i), 2);
            var sigma = Math.sqrt(s2new - s2old);
            scales.push(computeScale(scales[i - 1].approx, sigma));
            delete scales[i - 1].approx;
        }
        return scales;
    };
    Matrix.reconstruct = function (scales) {
        var approx = scales[scales.length - 1].approx.getCopy();
        for (var i = scales.length - 1; i >= 0; i--) {
            approx["+="](scales[i].detail)
        }
        return approx;
    };
    /*
    Matrix.prototype.gaussianColorEnhancement = function(gamma, w, K, alpha) {
        // Default parameters
        alpha = (alpha === undefined) ? 0.1 : alpha;
        gamma = (gamma  === undefined) ? 0.5 : gamma;
        w = (w === undefined) ? 15 / 255 : w;
        K = (K === undefined) ? 20 : K;

        var image = this.im2single();
        var out = Matrix.zeros(this.size()).im2single();
        
        for (var c = 0; c < image.size(2); c++) {
            Tools.tic();
            var scales = image.get([], [], c).computeScaleSpace();
            console.log("Scalespace time", Tools.toc());

            Tools.tic();
            var A = scales[scales.length - 1].approx;
            // A.max().display("max approx");
            var mean = A.mean()[".*"](alpha);
            A["*="](1 - alpha)["+="](mean).im2single();
            for (var j = scales.length - 1; j >= 0; j--) { 
                // scales[j].detail.max().display("max details");
                processCoeffs(scales[j].detail.getData(), A.getData(), K, w, gamma);
                A["+="](scales[j].detail).im2single();
            }
            out.set([], [], c, A);
            console.log("Processing time", Tools.toc());
        }
        return out;
    };*/
    
    Matrix.gaussianColorEnhancement = function(scales, gamma, w, K, alpha) {
        // Default parameters
        alpha = (alpha === undefined) ? 0.1 : alpha;
        gamma = (gamma  === undefined) ? 0.75 : gamma;
        w = (w === undefined) ? 0.004 : w;
        K = (K === undefined) ? Infinity : K;

        Tools.tic();
        var A = scales[scales.length - 1].approx.getCopy();
        var mean = A.mean()[".*"](alpha);
        A["*="](1 - alpha)["+="](mean);
        for (var j = scales.length - 1; j >= 0; j--) {
            var details = scales[j].detail.getCopy();
            processCoeffs(details.getData(), A.getData(), K, w, gamma);
            A["+="](details);
        }
        console.log("Processing time", Tools.toc());
        
        return A;
    };
    Matrix.gaussianColorEnhancementLUT = function(scales, lut, alpha) {
        // Default parameters
        alpha = (alpha === undefined) ? 0.1 : alpha;
        Tools.tic();
        var A = scales[scales.length - 1].approx.getCopy();
        var mean = A.mean()[".*"](alpha);
        A["*="](1 - alpha)["+="](mean);
        var details = Matrix.zeros(A.getSize());
        for (var j = scales.length - 1; j >= 0; j--) { 
            details.set(scales[j].detail);
            processCoeffsLUT(details.getData(), A.getData(), lut);
            A["+="](details);
        }
        console.log("Processing time", Tools.toc());
        return A;
    };
}).bind((typeof module !== 'undefined' && module.exports) ? GLOBAL : window)();
