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
    var newton = function (C, A, w, gamma) {
        // Maximal number of iterations
        // Tolerance for the precision of Newton's method solution
        var maxIt = 25, tol = 0.001;
        
        // It will be useful to know if the Newton method oscillates
        //var Alt = Matrix.ones(maxIt, 1)[".*"](Infinity);
        var Alt = new Float64Array(maxIt);
        // First column=original wavelet coefficient
        var x = new Float64Array(C);
        var y, y_pr;
        
        for (var n = 2; n <= maxIt; n++) {
            for (var i = 0, ei = x.length, norm = 0; i < ei; i++) {
                var t = x[i], a = A[i];
                a = a > 0 ? a : -a;
                y = t - C[i] - w * gamma * Math.pow(a / t, gamma);
                y_pr = 1 + w * gamma * gamma * Math.pow(a / t, 1 + gamma);
                norm += x[i] * x[i];
                x[i] = t - y / y_pr;
                Alt[n] += (x[i] - t) * (x[i] - t);
            }
            Alt[n] = Math.sqrt(Alt[n] / norm);
            if (Alt[n] >= Alt[n - 1]) {
                //console.log('Oscillations in the Newton process.');
            } else if (Alt[n] < tol) {
                break;
            }
        }
        return x;
    };
    var processCoeffs = function (D, A, K, w, gamma) {
        var C = D.get().abs(), T = D.max().getDataScalar();
        T = Math.max(0.003, T / K);
        //T = T / K;
        var CPbool = C[">"](T);
        if (CPbool.sum().getDataScalar() !== 0) {
            var CP = C.get(CPbool);
            var AP = A.get(CPbool);
            var sign = D.get(CPbool).sign();
            var x = newton(CP.getData(), AP.getData(), w, gamma);
            x = Matrix.toMatrix(x);
            D.set(CPbool, x.abs()[".*"](sign));
        }
        return D;
    };

    var illNorm = function (A, alpha) {
        var cm = A.mean();
        A["*="](1 - alpha)["+="](cm[".*"](alpha));
    };
    var correctSubband = function (A, D, w) {
        var ad = A.getData(), dd = D.getData();

        var d0, a;
        var newton = function (x, a) {
            return x - (x - d0 - w * a / x) / (1 + w * a / (x * x));
        }
        console.assert(ad.length === dd.length, "subbands");
        var T = D.max().getDataScalar() / 25;
        for (var i = 0, ie = ad.length; i < ie; i++) {
            
            d0 = dd[i];
            var sig = d0 > 0 ? 1 : 0;
            d0 = d0 > 0 ? d0 : -d0;

            if (d0 < T) {
                continue;
            }

            a = ad[i];
            
            var d = d0, du = newton(d, a);
            while (Math.abs(du - d) > 1e-3) {
                d = du;
                du = newton(d, a);
            }
            
            dd[i] = sig ? du : -du;
        }
    };

    Matrix.prototype.colorEnhancement = function(gamma, w, K, name, alpha) {
        var alpha = alpha || 0.01, gamma = gamma || 1.0, w = w || 4e-3, name = name || 'sym8', K = K || 10;
        var im = this.im2double().applycform("sRGB to LinearRGB");
        var out = Matrix.zeros(im.size());
        var maxlev = Matrix.dwtmaxlev([this.size(0), this.size(1)], name) - 1;
        for (var i = 0; i < 3; i++) {
            var wt = [Matrix.dwt2(im.get([], [], i), name)];
            for (var l = 1; l < maxlev; l++) {
                wt[l] = Matrix.dwt2(wt[l - 1][0], name);
            }
            illNorm(wt[wt.length - 1][0], alpha);
            for (var l = wt.length - 1; l > 0; l--) {
                if (wt[l][0].size(0) > wt[l][1].size(0) || wt[l][0].size(1) > wt[l][1].size(1)) {
                    wt[l][0] = wt[l][0].get([0, wt[l][1].size(0) - 1], [0, wt[l][1].size(1) - 1]);
                }
                processCoeffs(wt[l][1], wt[l][0], K, w, gamma);
                processCoeffs(wt[l][2], wt[l][0], K, w, gamma);
                processCoeffs(wt[l][3], wt[l][0], K, w, gamma);
                wt[l - 1][0] = Matrix.idwt2(wt[l], name);
            }
            if (wt[l][0].size(0) > wt[l][1].size(0) || wt[l][0].size(1) > wt[l][1].size(1)) {
                wt[l][0] = wt[l][0].get([0, wt[l][1].size(0) - 1], [0, wt[l][1].size(1) - 1]);
            }
            var channel = Matrix.idwt2(wt[0], name);
            if (channel.size(0) > im.size(0) || channel.size(1) > im.size(1)) {
                channel = channel.get([0, im.size(0) - 1], [0, im.size(1) - 1]);
            }
            out.set([], [], i, channel);
        }
        return out.applycform("LinearRGB to sRGB");;
    };
})();
