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
    window.USE_CST = true; 
    window.EDO_RES = false;
    var nBin = 100;
    // window.histApprox = new Uint32Array(nBin * 4);
    // window.histDetails = new Uint32Array(nBin * 4);
    var processCoeffs = function (D, A, K, w, gamma) {
        var max = D[0] > 0 ? D[0] : -D[0];
        for (var i = 1, ei = D.length; i < ei; i++) {
            var v = D[i] > 0 ? D[i] : -D[i];
            if (v > max) {
                max = v;
            }
        }
        var T = Math.max(1.01 / 255, max / K);
        var c = window.USE_CST ? 1 / (Math.pow(255, gamma - 1)) : 1;
        for (i = 0; i < ei; i++) {
            var sign = D[i] > 0 ? 1 : -1, d0 = sign === 1 ? D[i] : -D[i];
            if (d0 <= T) {
                continue;
            }
           
            var a = A[i] > 0 ? A[i] : -A[i], d = d0;
            /*var ai = ((a < 0 ? 0 : (a > 1 ? 1 : a)) * (nBin - 1)) | 0;
            var di = ((d < 0 ? 0 : (d > 1 ? 1 : d)) * (nBin - 1)) | 0;
            window.histApprox[ai]++;
            window.histDetails[di]++;
             */
            var c1 = w * gamma, c2 = c1 * gamma * a * c;
            for (var n = 0; n < 5; n++) {
                var y = d - d0 - c1 * Math.pow(a / d, gamma);
                var yp = 1 + c2 / Math.pow(d, 1 + gamma);
                d = d - y / yp;
            }
            D[i] = d * sign;
        }
        return D;
    };
    window.getLUT = function (K, w, gamma, bin) {
        bin = bin || 256;
        var A = Matrix.ones(bin).cumsum(0)["-="](1)["/="](bin / 2 - 1);
        //A.display();
        var D = Matrix.ones(bin).cumsum(1)["-="](1)["/="](bin - 1);
        processCoeffs(D.getData(), A.getData(), K, w, gamma);
        return D;
    };
    var processCoeffsLUT = function (D, A, lut, K, w, gamma) {
        //var lut = getLUT(K, w, gamma);
        var nx = lut.getSize(1), ny = lut.getSize(0), lut = lut.getData();
        for (var i = 1, ei = D.length; i < ei; i++) {
            var sign = D[i] > 0 ? 1 : -1, d = sign === 1 ? D[i] : -D[i];
            var a = A[i] > 0 ? A[i] : -A[i];
            a /= 2;
            var t = lut[Math.floor(d * (nx - 1)) * ny + Math.floor(a * (nx - 1)) ] * sign;
            // console.log(a, d, t, processCoeffs([D[i]], [A[i]], K, w, gamma));
            D[i] = t;
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
        if (window.EDO_RES) {
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

    Matrix.prototype.scaleDown = function () {
        var a = this.get([0, 2, -1], [0, 2, -1]),
            b = this.get([1, 2, -1], [0, 2, -1]),
            c = this.get([0, 2, -1], [1, 2, -1]),
            d = this.get([1, 2, -1], [1, 2, -1]);
        console.log(a.size(), b.size());
        return a["+="](b)["+="](c)["+="](d)["/="](4);
    };
    Matrix.prototype.scaleUp = function () {
        var sizeOut = [
            this.getSize(0) * 2,
            this.getSize(1) * 2,
            this.getSize(2)
        ];
        var out = Matrix.zeros(sizeOut);
        out.set([0, 2, -1], [0, 2, -1], this);
        out.set([1, 2, -1], [0, 2, -1], this);
        out.set([0, 2, -1], [1, 2, -1], this);
        out.set([1, 2, -1], [1, 2, -1], this);
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
            var approx = image.fastBlur(sigma, sigma, 1).im2single();
            var detail = image['-'](approx).im2single();
            return {approx: approx, detail: detail, sigma: sigma};
        };

        var nScale = nScale || 5,
            sigmaInit = sigmaInit || 1.00,
            scaleRatio = scaleRatio || 4.0;
        
        var image = this.im2single(), i;
        // First scale
        var scales = [computeScale(image, sigmaInit)];
        for (i = 1; i < nScale; i++) {
            var s2old = Math.pow(scales[i - 1].sigma, 2);
            var s2new = Math.pow(sigmaInit * Math.pow(scaleRatio, i), 2);
            var sigma = Math.sqrt(s2new - s2old);
            scales.push(computeScale(scales[i - 1].approx, sigma));
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
    };
    Matrix.prototype.gaussianColorEnhancementLUT = function(gamma, w, K, alpha) {
        Tools.tic();
        // Default parameters
        alpha = (alpha === undefined) ? 0.1 : alpha;
        gamma = (gamma  === undefined) ? 0.5 : gamma;
        w = (w === undefined) ? 15 / 255 : w;
        K = (K === undefined) ? 20 : K;

        var image = this.im2single();
        var out = Matrix.zeros(this.size()).im2single();
        Tools.tic();
        var lut = window.getLUT(K, w, gamma, 1024);
        console.log("LUT time", Tools.toc());
        for (var c = 0; c < image.size(2); c++) {
            Tools.tic();
            var scales = image.get([], [], c).computeScaleSpace();
            console.log("Scalespace time", Tools.toc());

            Tools.tic();
            var A = scales[scales.length - 1].approx;
            // A.max().display("max approx");
            var mean = A.mean()[".*"](alpha);
            A["*="](1 - alpha)["+="](mean).im2single();
            // A.max().display("max approx");
            for (var j = scales.length - 1; j >= 0; j--) { 
                // scales[j].detail.max().display("max details");
                processCoeffsLUT(scales[j].detail.getData(), A.getData(), lut, K, w, gamma);
                A["+="](scales[j].detail).im2single();
                // A.max().display("max approx");
            }
            out.set([], [], c, A);
            console.log("Processing time", Tools.toc());
        }
        console.log("Whole Processing time", Tools.toc());
        return out;
    };
})();
