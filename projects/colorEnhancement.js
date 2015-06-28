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

    window.USE_CST = true;
    var processCoeffs = function (D, A, K, w, gamma) {
        var max = D[0] > 0 ? D[0] : -D[0];
        for (var i = 1, ei = D.length; i < ei; i++) {
            var v = D[i] > 0 ? D[i] : -D[i];
            if (v > max) {
                max = v;
            }
        }
        var T = Math.max(1.01 / 255, max / K);
        var y, yp, pow = Math.pow;
        var c = window.USE_CST ? 1 / (pow(255, gamma - 1)) : 1;
        for (var i = 0; i < ei; i++) {
            var sign = D[i] > 0 ? 1 : -1, d0 = sign === 1 ? D[i] : -D[i];
            if (d0 <= T) {
                continue;
            }
            var a = A[i] > 0 ? A[i] : -A[i], d = d0;
            for (var n = 0; n < 5; n++) {
                y = d - d0 - w * gamma * pow(a / d, gamma);
                yp = 1 + w * gamma * gamma * a / pow(d, 1 + gamma) * c;
                d = d - y / yp;
            }
            D[i] = d * sign;
        }
        return D;
    };

    Matrix.prototype.colorEnhancementTest = function (gamma, w, K, name, alpha, average) {
        // Default parameters
        alpha = (alpha === undefined) ? 0.1 : alpha;
        gamma = (gamma  === undefined) ? 0.5 : gamma;
        w = (w === undefined) ? 15 / 255 : w;
        name = (name === undefined) ? 'sym4' : name;
        K = (K === undefined) ? 20 : K;
        average = (average === undefined) ? "channel" : average;

        var initialMode = Matrix.dwtmode();
        Matrix.dwtmode("sym");

        var im = this.im2double(), out = Matrix.zeros(im.size());
        var J = Matrix.dwtmaxlev([this.size(0), this.size(1)], name);
        
        var nChannel = im.size(2), wt = [];
        var mean = [], max = [], min = [];
        var imApprox;
        var wNorm = Matrix.wfilters(name, 'd')[0].sum().getDataScalar();
        wNorm = Math.pow(wNorm, 2 * J);
        var norm;

        var imMean = 0;
        for (var c = 0; c < nChannel; c++) {
            wt[c] = Matrix.wavedec2(im.get([], [], c), J, name);
            var A = Matrix.appcoef2(wt[c], name, J - 1);
            mean[c] = A.mean().getDataScalar();
            min[c] = A.min().getDataScalar();
            max[c] = A.max().getDataScalar();
            imMean += mean[c] / nChannel;
        }
        var imMin = Math.min(min[0], min[1], min[2]);
        var imMax = Math.max(max[0], max[1], max[2]);
   
        for (var c = 0; c < nChannel; c++) {
            var A = Matrix.appcoef2(wt[c], name, J - 1);
            if (average === "image") {
                norm = imMean;
            } else if (average === "channel") {
                norm = mean[c];
            } else if (average === "half") {
                norm = wNorm * 0.5; 
            }
            // A["-="](imMin)["*="](wNorm / (imMax - imMin));
            // A["-="](min[c])["*="](wNorm / (max[c] - min[c]));
            A["*="](1 - alpha)["+="](norm * alpha);
        }

        for (var c = 0; c < nChannel; c++) {
            for (var j = J - 1; j >= 0; j--) { 
                var d = wt[c][0].getData();
                var sb = wt[c][1].value([0, 0]) * wt[c][1].value([0, 1]);
                A = d.subarray(0, sb);
                processCoeffs(d.subarray(2 * sb, 3 * sb), A, K, w, gamma);
                processCoeffs(d.subarray(sb, 2 * sb), A, K, w, gamma);
                processCoeffs(d.subarray(3 * sb, 4 * sb), A, K, w, gamma);
                wt[c] = Matrix.upwlev2(wt[c], name);
            }
            var channel = wt[c][0].reshape(wt[c][1].get(0).getData());
            out.set([], [], c, channel);
        }

        Matrix.dwtmode(initialMode);
        return out;
    };
    
    Matrix.prototype.colorEnhancement = function(gamma, w, K, name, alpha) {
        // Default parameters
        alpha = (alpha === undefined) ? 0.1 : alpha;
        gamma = (gamma  === undefined) ? 0.5 : gamma;
        w = (w === undefined) ? 15 / 255 : w;
        name = (name === undefined) ? 'sym4' : name;
        K = (K === undefined) ? 20 : K;

        var initialMode = Matrix.dwtmode();
        Matrix.dwtmode("sym");

        var im = this.im2double()
        var out = Matrix.zeros(im.size());
        var J = Matrix.dwtmaxlev([this.size(0), this.size(1)], name);
        for (var c = 0; c < im.size(2); c++) {
            var channel = im.get([], [], c);
            var wt = Matrix.wavedec2(channel, J, name);
            var A = Matrix.appcoef2(wt, name, J - 1);
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
            var channel = wt[0].reshape(wt[1].get(0).getData());
            out.set([], [], c, channel);
        }
        Matrix.dwtmode(initialMode);
        return out;
    };
})();
