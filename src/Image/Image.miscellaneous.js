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


Matrix.prototype.bin = function (wx, wy) {
    "use strict";
    var is = this.getSize();
    var os = [Math.ceil(is[0] / wy), Math.ceil(is[1] / wx), this.getSize(2)];
    
    var output = Matrix.zeros(os), od = output.getData();
    var input = this.padarray(
        "nn",
        [0, os[0] * wx - is[0]],
        [0, os[1] * wx - is[1]]
    ), id = input.getData();
    
    var iView = input.getView(), oView = output.getView();
    var dic = iView.getStep(2), lic = iView.getEnd(2), doc = oView.getStep(2);
    var dix = iView.getStep(1), lix = iView.getEnd(1), dox = oView.getStep(1);
    var diy = iView.getStep(0), liy = iView.getEnd(0), doy = oView.getStep(0);
    
    var ic, oc, ix, nix, iy, niy, v, nv, u, nu, ox, oy, sum;
    var cst = 1 / (wx * wy);
    for (ic = 0, oc = 0; ic !== lic; ic += dic, oc += doc) {
        for (ix = ic, nix = ic + lix, ox = oc; ix !== nix; ix += dix * wx, ox += dox) {
            for (iy = ix, oy = ox, niy = ix + liy; iy < niy; iy += wy, oy++) {
                for (sum = 0, v = iy, nv = iy + wx * dix; v !== nv; v += dix) {
                    for (u = v, nu = v + wy; u < nu; u++) {
                        sum += id[u];
                    }
                }
                od[oy] = sum * cst;
            }
        }
    }
    return output;
};

Matrix.prototype.expand = function (wx, wy) {
    "use strict";
    var is = this.getSize();
    var os = [is[0] * wy, is[1] * wx, this.getSize(2)];
    
    var output = Matrix.zeros(os), od = output.getData();
    var input = this, id = input.getData();
    
    var iView = input.getView(), oView = output.getView();
    var dic = iView.getStep(2), lic = iView.getEnd(2), doc = oView.getStep(2);
    var dix = iView.getStep(1), lix = iView.getEnd(1), dox = oView.getStep(1);
    var diy = iView.getStep(0), liy = iView.getEnd(0), doy = oView.getStep(0);
    
    var ic, oc, ix, nix, iy, niy, v, nv, u, nu, ox, oy, val;
    for (ic = 0, oc = 0; ic !== lic; ic += dic, oc += doc) {
        for (ix = ic, nix = ic + lix, ox = oc; ix !== nix; ix += dix, ox += dox * wx) {
            for (iy = ix, oy = ox, niy = ix + liy; iy < niy; iy++, oy += wy) {
                for (val = id[iy], v = oy, nv = oy + wx * dox; v !== nv; v += dox) {
                    for (u = v, nu = v + wy; u < nu; u++) {
                        od[u] = val;
                    }
                }
            }
        }
    }
    return output;
};

Matrix.prototype.im2col = function (psize, type) {
    "use strict";
    var wy = psize[0], wx = psize[1];
    var is = this.getSize();

    // # patches
    var nx = Math.floor(is[0] / wx), ny = Math.floor(is[0] / wy);
    
    var input = this, id = input.getData();
    var output = Matrix.zeros([wx * wy * this.getSize(2), nx * ny]), od = output.getData();
    
    var iView = input.getView().select([0, ny * wy - 1], [0, nx * wx - 1]),
        oView = output.getView();

    var dic = iView.getStep(2), lic = iView.getEnd(2), doc = oView.getStep(2);
    var dix = iView.getStep(1), lix = iView.getEnd(1), dox = oView.getStep(1);
    var diy = iView.getStep(0), liy = iView.getEnd(0), doy = oView.getStep(0);
    
    var ic, nic, oc, ix, nix, iy, niy, v, nv, u, nu, ox, oy, o;
    for (o = 0, ix = 0, nix = lix; ix < nix; ix += dix * wx) {
        for (iy = ix, niy = ix + liy; iy < niy; iy += wy) {
            for (ic = iy, nic = iy + lic; ic < nic; ic += dic) {
                for (v = ic, nv = ic + wx * dix; v < nv; v += dix) {
                    for (u = v, nu = v + wy; u < nu; u++) {
                        od[o++] = id[u];
                    }
                }
            }
        }
    }
    return output;
};

