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


Matrix.prototype.bin = function (wy, wx) {
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


/**  Convert an image to a set of patches represented as a 2D matrix.
 * @param{Matrix} psize
 *  patchSize
 * @param{String} type
 *  Can be distinct or sliding.
 * @matlike
 */
Matrix.prototype.im2col = function (psize, type) {
    "use strict";
    psize = Matrix.toMatrix(psize);
    var wy = psize.getDataScalar(0), wx = psize.getDataScalar(1), is = this.getSize();

    // # patches for distinct type
    var nx = Math.floor(is[1] / wx), ny = Math.floor(is[0] / wy), dwx = wx, dwy = wy;
    if (type === "sliding") {
        nx = is[1] - wx + 1;
        ny = is[0] - wy + 1;
        dwx = 1;
        dwy = 1;
    } else if (type !== undefined || type !== "distinct") {
        throw new Error("Matrix.imcol: Valid types are distinct or sliding.");
    }

    var input = this, id = this.getData();
    var output = Matrix.zeros([wx * wy * this.getSize(2), nx * ny]), od = output.getData();

    var iView = input.getView().select([0, ny * dwy - 1], [0, nx * dwx - 1]),
        oView = output.getView();

    var dic = iView.getStep(2), lic = iView.getEnd(2), doc = oView.getStep(2);
    var dix = iView.getStep(1), lix = iView.getEnd(1), dox = oView.getStep(1);
    var diy = iView.getStep(0), liy = iView.getEnd(0), doy = oView.getStep(0);

    var ic, nic, oc, ix, nix, iy, niy, v, nv, u, nu, ox, oy, o;
    for (o = 0, ix = 0, nix = lix; ix < nix; ix += dix * dwx) {
        for (iy = ix, niy = ix + liy; iy < niy; iy += dwy) {
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

/**  Apply a function to all block of psize of the image.
 * @param{Matrix} psize
 *  patchSize
 * @param{Function} fun
 *  A function which a patch as an argument and return a value as output.
 * @matlike
 */
Matrix.prototype.nlfilter = function (psize, fun) {
    "use strict";
    // Patch size
    psize = Matrix.toMatrix(psize);
    var wy = psize.getDataScalar(0), wx = psize.getDataScalar(1),
        hwy = Math.floor(wy / 2), hwx = Math.floor(wx / 2),
        ny = this.getSize(0), nx = this.getSize(1), nPatches = ny * nx;
    var input = this.padarray("symw", [hwy, hwy], [hwx, hwx]);

    // # Patches
    var is = input.getSize(), id = input.getData(), iView = input.getView();

    var dic = iView.getStep(2), lic = iView.getEnd(2),
        dix = iView.getStep(1), lix = iView.getEnd(1),
        liy = iView.getEnd(0);

    if (is[2] === 1) { // For grey level images
        var patch = Matrix.zeros(wy, wx), pd = patch.getData();
        var output = Matrix.zeros(ny, nx), od = output.getData();
        var ic, nic, oc, ix, nix, iy, niy, v, nv, u, nu, ox, oy, o, n;
        for (n = 0, ix = 0, nix = lix - (wx - 1) * dix; ix < nix; ix += dix) {
            for (iy = ix, niy = ix + liy - (wy - 1); iy < niy; iy++, n++) {
                // Copy patch into patch data variable
                for (v = iy, nv = iy + wx * dix; v < nv; v += dix) {
                    for (u = v, nu = v + wy; u < nu; u++) {
                        pd[o++] = id[u];
                    }
                }
                od[n] = fun(patch); // Expect a value output
            }
        }
    } else if (is[2] === 3) { // For color images
        var patch = Matrix.zeros(wy, wx, 3), pd = patch.getData();
        var output = Matrix.zeros(ny, nx, 3), od = output.getData();
        var rod = od.subarray(0,                nPatches),
            god = od.subarray(nPatches,     2 * nPatches),
            bod = od.subarray(2 * nPatches, 3 * nPatches);
        var ic, nic, oc, ix, nix, iy, niy, v, nv, u, nu, ox, oy, o, n;
        for (n = 0, ix = 0, nix = lix - (wx - 1) * dix; ix < nix; ix += dix) {
            for (iy = ix, niy = ix + liy - (wy - 1); iy < niy; iy++, n++) {
                // Copy patch into patch data variable
                for (o = 0, ic = iy, nic = iy + lic; ic < nic; ic += dic) {
                    for (v = ic, nv = ic + wx * dix; v < nv; v += dix) {
                        for (u = v, nu = v + wy; u < nu; u++) {
                            pd[o++] = id[u];
                        }
                    }
                }
                var patchVal = fun(patch); // Expect a color output;
                rod[n] = patchVal[0];
                god[n] = patchVal[1];
                bod[n] = patchVal[2];
            }
        }
    }
    return output;
};

Matrix.prototype.imadjust = function (th) {
    "use strict";
    var nBins = 65535;
    var size = this.getSize();
    var hist = this.reshape().imhist(nBins).cumsum()
    this.reshape(size);
    var hd = hist["/="](hist.get(-1)).getData();
    //console.log(hd);
    var iMin = 0, iMax = hd.length - 1;
    for (var i = 0, ie = hd.length; i < ie; i++) {
        // console.log(hd[i], th);
        if (hd[i] > th) {
            iMin = i;
            break;
        }
    }
    for (var i = hd.length - 1, ie = -1; i > ie; i--) {
        // console.log(hd[i], 1 - th);
        if (hd[i] < 1 - th) {
            iMax = i;
            break;
        }
    }
    console.log(iMin, hd[iMin], iMax, hd[iMax]);
    var id = this.getData();
    iMax = nBins / (iMax - iMin);
    iMin = iMin / nBins;
    for (var i = 0, ie = id.length; i < ie; i++) {
        var v = (id[i] - iMin) * iMax;
        id[i] = v < 0 ? 0 : (v > 1 ? 1 : v);
    }
    return this;
};
