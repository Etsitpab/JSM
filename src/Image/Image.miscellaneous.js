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

/**  Implementation of the Guided filter.
 * @param{Matrix} guidance 
 *  Guidance image
 * @param{Number} radius
 *  Half of the patch size
 * @param{Numer} epsilon
 *  Parameter that determine "what is an edge/a high variance patch
 *  that should be preserved”
 */
Matrix.prototype.guidedFilter = function (p, r, eps) {
    "use strict";
    var d = 2 * Math.round(r) + 1;
    var mI = this.boxFilter(d),
        mII = this[".*"](this).boxFilter(d),
        vI = mII["-"](mI[".*"](mI));
    var mp = mI, mIp = mII, cIp = vI;
    if (this !== p) {
        mp = p.boxFilter(d);
        mIp = this[".*"](p).boxFilter(d);
        cIp = mIp["-"](mI[".*"](mp));
    }
    var A = cIp["./"](vI["+"](eps)), B = mp["-"](A[".*"](mI)); 
    return A.boxFilter(d)[".*"](this)["+"](B.boxFilter(d));
};
