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

    var processCoeffsHard = function (D, t) {
        for (var i = 0, ei = D.length; i < ei; i++) {
            var sign = D[i] > 0 ? 1 : -1, d = sign === 1 ? D[i] : -D[i];
            if (d < t) {
                D[i] = 0;
            }
        }
        return D;
    };

    Matrix.prototype.wdenoise = function (t, name) {
        // Default parameters
        var im = this;
        var out = Matrix.zeros(im.size());
        var J = Matrix.dwtmaxlev([this.size(0), this.size(1)], name);
        for (var c = 0; c < im.size(2); c++) {
            var channel = im.get([], [], c);
            var wt = Matrix.wavedec2(channel, J, name);
            for (var j = J - 1; j >= 0; j--) {
                var d = wt[0].getData();
                var sb = wt[1].value([0, 0]) * wt[1].value([0, 1]);
                processCoeffs(d.subarray(sb, 4 * sb), t);
                wt = Matrix.upwlev2(wt, name);
            }
            channel = wt[0].reshape(wt[1].get(0).getData());
            out.set([], [], c, channel);
        }
        return out;
    };
})();
