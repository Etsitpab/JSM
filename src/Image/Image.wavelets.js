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
    var filter1DPer = function (yx0, o, oys, nyx, dy, ody, orig, K, kdy, ly, isOdd, kernelL, kernelH, idL, idH, odL, odH) {
        var y, oy, k, s, sumL, sumH, sTmp;
        for (y = yx0, oy = o + oys; y < nyx; y += dy, oy += ody) {
            for (k = 0, s = y + orig, sumL = 0, sumH = 0; k < K; k++, s -= kdy) {
                sTmp = s;
                while (sTmp < yx0) {
                    sTmp += ly;
                }
                while (sTmp >= nyx) {
                    sTmp -= ly;
                }
                if (isOdd && sTmp === nyx - kdy) {
                    sTmp -= kdy; 
                }
                sumL += kernelL[k] * idL[sTmp];
                sumH += kernelH[k] * idH[sTmp];
            }
            odL[oy] += sumL;
            odH[oy] += sumH;
        }
    };
    var filter1DSym = function (y0, o, oys, ny, dy, ody, orig, K, kdy, ly, isOdd, kernelL, kernelH, idL, idH, odL, odH) {
        var y, oy, k, s, sumL, sumH, sTmp;
        y0 += (K - 1) * kdy - orig;
        ny -= orig;// + (isOdd ? 1 : 0)
        for (y = y0, oy = o + oys; y < ny; y += dy, oy += ody) {
            for (k = 0, s = y + orig, sumL = 0, sumH = 0; k < K; k++, s -= kdy) {
                sumL += kernelL[k] * idL[s];
                sumH += kernelH[k] * idH[s];
            }
            odL[oy] += sumL;
            odH[oy] += sumH;
        }
    };
    var filter1DSymDebug = function (y0, o, oys, ny, dy, ody, orig, K, kdy, ly, isOdd, kernelL, kernelH, idL, idH, odL, odH) {
        var y, oy, k, s, sumL, sumH, sTmp;
        console.log("y0", y0, "ny", ny, "dy", dy, "oys", oys, "ody", ody);
        console.log("orig", orig, "K", K, "Kdy", kdy);
        y0 += (K - 1) * kdy - orig;
        ny -= orig;// + (isOdd ? 1 : 0)
        console.log("y0", y0, "ny", ny);
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
    var filter1D, dwtmode;
    Matrix.dwtmode = function (mode) {
        if (mode === undefined) {
            return dwtmode;
        }
        mode = mode.toLowerCase();
        switch (mode) {
        case "per":
            filter1D = filter1DPer;
            break;
        case "sym":
        case "symw":
        case "zpd":
        case "nn":
            filter1D = filter1DSym;
            break;
        case "debug_sym":
        case "debug_symw":
        case "debug_zpd":
        case "debug_nn":
            mode = mode.substr(6);
            filter1D = filter1DSymDebug;
            break;
        default:
            throw new Error("Matrix.dwtmode: invalid mode " + mode + "."); 
        }
        dwtmode = mode;
    };
    Matrix.dwtmode("per");
    
    var filterND = function (inL, inH, vI, kL, kH, origin, sub, outL, outH, vO) {

        var K = kL.length;
        origin = (origin === 'cl' ? Math.floor : Math.ceil)((K - 1) / 2);
        var isOdd = vI.getSize(0) % 2 ? true : false; 
     
        var ys = vI.getFirst(0), dy = vI.getStep(0);
        var ly = vI.getEnd(0) + ((isOdd && dwtmode === "per") ? dy : 0);
        var oys = vO.getFirst(0), ody = vO.getStep(0);

        var idL = inL.getData(),  idH = inH.getData(),
            odL = outL.getData(), odH = outH.getData();

        var orig = origin * dy;
        var kdy = dy;
        dy *= sub;

        var itI = vI.getIterator(1), itO = vO.getIterator(1);
        var y, i, it = itI.iterator, bi = itI.begin, ei = itI.end();
        var oy, o, ot = itO.iterator, bo = itO.begin;

        var k, s, sTmp, sumL, sumH;
        for (i = bi(), o = bo(); i !== ei; i = it(), o = ot()) {
            var yx0 = ys + i, nyx = ly + i;
            filter1D(yx0, o, oys, nyx, dy, ody, orig, K, kdy, ly, isOdd, kL, kH, idL, idH, odL, odH);
        }
    };

    var zeros = Matrix.zeros;
    
    var getPaddingInfos = function (K, s) {
        var isOdd = s % 2 ? true : false;
        var f = Math.floor, c = Math.ceil;
        // left and right part of filter (computed on reversed filter)
        var lk = f((K - 1) / 2),
            rk = c((K - 1) / 2);
        // Left and right input padding
        var li = c(rk / 2) * 2 + lk - 1,
            ri = isOdd ? c(lk / 2) * 2 + rk - 1 : f(lk / 2) * 2 + rk;
        // Left and right output padding
        var lo = c(rk / 2),
            ro = isOdd ? c(lk / 2) : f(lk / 2);
        if (K === 2) {
            li = 0;
            ri = isOdd ? 1 : 0;
            lo = 0;
            ro = isOdd ? 1 : 0;
        }
        return {"lk": lk, "rk": rk, "li": li, "lo": lo, "ri": ri, "ro": ro};
    };
    var padTest = function (isOdd) {
        console.log("For " + (isOdd ? "odd" : "even") + " signal");
        var data = {}, f = Math.floor, c = Math.ceil;
        for (var K = 2; K < 20; K += 2) {
            data[K] = getPaddingInfos(K, isOdd ? 1 : 2);
        }
        console.table(data, ["lk", "rk", "li", "ri", "lo", "ro"]);
    };


    var dwt = function (s, name, dim) {
        var wav = Matrix.wfilters(name, 'd');
        var fL = wav[0].getData(), fH = wav[1].getData();
        var size = s.getSize();
        if (dwtmode !== 'per') {
            var p = getPaddingInfos(fL.length, size[dim]);
            size[dim] = Math.floor(size[dim] / 2) + p.ro + p.lo;
            s = s.paddim(dwtmode, dim, [p.li, p.ri]);
        } else {
            size[dim] = Math.ceil(size[dim] / 2);
        }
        // Create output data
        var dL = zeros(size), dH = zeros(size);
        var v = dL.getView().swapDimensions(0, dim);
        var iV = s.getView().swapDimensions(0, dim);
        // H filtering from signal to output
        filterND(s, s, iV, fL, fH, 'cr', 2, dL, dH, v);
        // s.transpose().display("signal padded");
        return [dL, dH];
    };

    var idwt = function (bands, name, dim) {
        var wav = Matrix.wfilters(name, 'r');
        var fL = wav[0].getData(), fH = wav[1].getData();

        if (dwtmode !== 'per') {
            var p = getPaddingInfos(fL.length, bands[0].getSize(dim));
            // bands[0] = bands[0].paddim(dwtmode, dim, [0, 1]);
            // bands[1] = bands[1].paddim(dwtmode, dim, [0, 1]);
        }
        var size = bands[0].getSize();

        var start = dwtmode === 'per' ? 0 : 1;
        size[dim] = size[dim] * 2 + start; 

        var L = zeros(size), H = zeros(size);
        var v = L.getView().selectDimension(dim, [start, 2, -1]);
        bands[0].extractViewTo(v, L);
        bands[1].extractViewTo(v, H);
        v.restore().swapDimensions(0, dim);
        
        // Out array
        if (dwtmode !== 'per') {
            size[dim] -= p.rk + p.lk; // +1 is due to padding
        }
        var out = zeros(size);
        var vO = out.getView().swapDimensions(0, dim);

        // Process scale
        filterND(L, H, v, fL, fH, 'cl', 1, out, out, vO);
        return out;
    };
    var dwt2 = function (im, name) {
        var wav = Matrix.wfilters(name, 'd');
        var fL = wav[0].getData(), fH = wav[1].getData();
        var h = im.getSize(0), w = im.getSize(1), c = im.getSize(2);
        
        // Create output image
        var hw, hh;
        if (dwtmode !== 'per') {
            var ph = getPaddingInfos(fL.length, h);
            im = im.padarray(dwtmode, [ph.li, ph.ri]);            
            hh = Math.floor(h / 2) + ph.ro + ph.lo;
            // im.display();
        } else {
            hh = Math.ceil(h / 2);
        }
        
        // Buffer image
        var bL = zeros(hh, w, c), bH = zeros(hh, w, c);
        var vB = bL.getView();

        // H filtering from image to buffer
        var vI = im.getView();
        filterND(im, im, vI, fL, fH, 'cr', 2, bL, bH, vB);
        
        if (dwtmode !== 'per') {
            var pw = getPaddingInfos(fL.length, w);
            bL = bL.padarray(dwtmode, [], [pw.li, pw.ri]);
            bH = bH.padarray(dwtmode, [], [pw.li, pw.ri]);
            hw = Math.floor(w / 2) + pw.ro + pw.lo;
            vB = bL.getView();
        } else {
            hw = Math.ceil(w / 2);
        }

        // V filtering from buffer to data
        var dA = zeros(hh, hw, c), dV = zeros(hh, hw, c),
            dH = zeros(hh, hw, c), dD = zeros(hh, hw, c);

        var v = dA.getView().swapDimensions(0, 1);

        vB.swapDimensions(0, 1);
        filterND(bL, bL, vB, fL, fH, 'cr', 2, dA, dH, v);
        filterND(bH, bH, vB, fL, fH, 'cr', 2, dV, dD, v);
        return [dA, dH, dV, dD];
    };

    var idwt2 = function (bands, name) {
        var wav = Matrix.wfilters(name, 'r');
        var fL = wav[0].getData(), fH = wav[1].getData();
        var oh = 0, ow = 0;
        if (dwtmode !== 'per') {
            var ph = getPaddingInfos(fL.length, bands[0].getSize(0));
            var pw = getPaddingInfos(fL.length, bands[0].getSize(1));
            bands[0] = bands[0].padarray(dwtmode, [0, 1], [0, 1]);
            bands[1] = bands[1].padarray(dwtmode, [0, 1], [0, 1]);
            bands[2] = bands[2].padarray(dwtmode, [0, 1], [0, 1]);
            bands[3] = bands[3].padarray(dwtmode, [0, 1], [0, 1]);
            oh = ph.rk + ph.lk + 1;
            ow = pw.rk + pw.lk + 1;
        }
        
        var h = bands[0].getSize(0), w = bands[0].getSize(1), c = bands[0].getSize(2);
        var dL = zeros(2 * h, w, c), dH = zeros(2 * h, w, c);
        var bL = zeros(2 * h - oh, 2 * w, c), bH = zeros(2 * h - oh, 2 * w, c);
        var dV = dL.getView(), B = bL.getView();

        var start = dwtmode === 'per' ? 0 : 1;
        B.select([], [start, 2, -1]);

        dL.set([start, 2, -1], bands[0]);
        dH.set([start, 2, -1], bands[2]);

        filterND(dL, dH, dV, fL, fH, 'cl', 1, bL, bL, B);

        dL.set([start, 2, -1], [], bands[1]);
        dH.set([start, 2, -1], [], bands[3]);
        filterND(dL, dH, dV, fL, fH, 'cl', 1, bH, bH, B);

        var out = zeros(2 * h - oh, 2 * w - ow, c);
        var O = out.getView().swapDimensions(0, 1);
        B.restore().swapDimensions(0, 1);
        filterND(bL, bH, B, fL, fH, 'cl', 1, out, out, O);
        return out;
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
    Matrix.dwt = function (im, name, dim) {
        dim = dim || 0;
        return dwt(im, name, dim);
    };
    /** Compute the 1D inverse DWT (Discrete Wavelet Transform).
     *n
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
    Matrix.idwt = function (bands, name, dim) {
        dim = dim || 0;
        return idwt(bands, name, dim);
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
        var sd = new Uint16Array(n + 2), outSize = 0;
        sd[n + 1] = s.getSize(dim);
        var l;
        for (l = n; l >= 1; l--) {
            sd[l] = Math.ceil(sd[l + 1] / 2);
            outSize += sd[l];
        }
        sd[0] = sd[1];
        outSize += sd[0];

        var cumsize = [0, sd[0]];
        for (l = 2; l < n + 2; l++) {
            cumsize[l] = sd[l - 1] + cumsize[l - 1];
        }

        var size = s.getSize();
        size[dim] = outSize;
        var matOut = zeros(size), outView = matOut.getView();
        var matIn = s, dL, dH;
        for (l = n; l >= 1; l--) {
            var wt = dwt(matIn, name, dim);
            outView.selectDimension(dim, [cumsize[l], cumsize[l + 1] - 1]);
            wt[1].extractViewTo(outView, matOut);
            outView.restore();
            matIn = wt[0];
        }
        outView.selectDimension(dim, [cumsize[0], cumsize[1] - 1]);
        wt[0].extractViewTo(outView, matOut);
        return [matOut, new Matrix([sd.length], sd)];
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
    Matrix.waverec = function (lc, name, dim) {
        dim = dim || 0;
        var sd = lc[1].getData();
        var cumsize = [0, sd[0]];
        var l, n = sd.length - 2;
        for (l = 2; l < n + 2; l++) {
            cumsize[l] = sd[l - 1] + cumsize[l - 1];
        }
        var input = lc[0];
        var dLView = input.getView().selectDimension(dim, [cumsize[0], cumsize[1] - 1]);
        var dL = input.extractViewFrom(dLView);

        for (l = 1; l < cumsize.length - 1; l++) {
            var dHView = input.getView().selectDimension(dim, [cumsize[l], cumsize[l + 1] - 1]);
            var dH = input.extractViewFrom(dHView);
            if (dL.size(dim) === dH.size(dim) + 1) {
                dLView = dL.getView().selectDimension(dim, [0, -2]);
                dL = dL.extractViewFrom(dLView);
            }
            dL = idwt([dL, dH], name, dim);
        }
        
        if (dL.size(dim) === sd[sd.length - 1] + 1) {
            dLView = dL.getView().selectDimension(dim, [0, -2]);
            dL = dL.extractViewFrom(dLView);
        }
        return dL;
    };

    
    var createStruct = function (s, n) {
        var xSizes = new Array(n + 2);
        var ySizes = new Array(n + 2);
        var cSizes = new Array(n + 2);
        ySizes[n + 1] = s.getSize(0);
        xSizes[n + 1] = s.getSize(1);
        cSizes[n + 1] = s.getSize(2);
        var l;
        for (l = n; l >= 1; l--) {
            ySizes[l] = Math.ceil(ySizes[l + 1] / 2);
            xSizes[l] = Math.ceil(xSizes[l + 1] / 2);
            cSizes[l] = cSizes[l + 1];
        }
        ySizes[0] = ySizes[1];
        xSizes[0] = xSizes[1];
        cSizes[0] = cSizes[1];
        return Matrix.toMatrix([ySizes, xSizes, cSizes])
    };

    var getSubbandsCoordinates = function (lc) {
        var ySizes = lc.get([], 0).getData(),
            xSizes = lc.get([], 1).getData(),
            cSizes = lc.get([], 2).getData();

        var outSize = xSizes[0] * ySizes[0] * cSizes[0];
        var bands = [0, outSize], subSizes = [];
        
        var j, J = ySizes.length - 2;
        for (j = 1; j < J + 1; j++) {
            subSizes.push([ySizes[j], xSizes[j], cSizes[j]]);
            var subBandSize = ySizes[j] * xSizes[j] * cSizes[j];
            for (var b = 0; b < 3; b++) {
                outSize += subBandSize;
                bands.push(outSize)
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
            A = A.get([0, ds.ySizes[l + 1] - 1], [0, ds.xSizes[l + 1] - 1], [])
        }
        return A;
    };
    
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
        var sizes = createStruct(input, n);
        var ds = getSubbandsCoordinates(sizes);
        var out = new Float64Array(ds.outSize);
        for (var l = n - 1, s = 3 * l; l >= 0; l--, s -= 3) {
            var wt = dwt2(input, name);
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
    Matrix.waverec2 = function (lc, name) {
        var ds = getSubbandsCoordinates(lc[1]), data = lc[0].getData();
        var A, H, V, D;
        A = new Matrix(ds.subSizes[0], data.subarray(ds.bands[0], ds.bands[1]))
        for (var l = 0, s = 0, J = ds.J; l < J; l++, s += 3) {
            H = new Matrix(ds.subSizes[l], data.subarray(ds.bands[s + 1], ds.bands[s + 2]));
            V = new Matrix(ds.subSizes[l], data.subarray(ds.bands[s + 2], ds.bands[s + 3]));
            D = new Matrix(ds.subSizes[l], data.subarray(ds.bands[s + 3], ds.bands[s + 4]));
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
    Matrix.upwlev2 = function (lc, name) {
        if (lc[1].getSize(0) === 2) {
            return [new Matrix(), new Matrix()];
        }

        var ds = getSubbandsCoordinates(lc[1]), data = lc[0].getData();
        var Am = new Matrix(ds.subSizes[0], data.subarray(ds.bands[0], ds.bands[1]))
        var H = new Matrix(ds.subSizes[0], data.subarray(ds.bands[1], ds.bands[2]));
        var V = new Matrix(ds.subSizes[0], data.subarray(ds.bands[2], ds.bands[3]));
        var D = new Matrix(ds.subSizes[0], data.subarray(ds.bands[3], ds.bands[4]));
        var A = idwt2([Am, H, V, D], name);
        A = resizeMatrix(A, ds, 1);

        var sizes = lc[1].get([1, -1]);
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
     *  Wavelet name.
     * @return {Matrix}
     *  If the level corresponds to the last level of decomposition, 
     *  the coefficients returned will be a view on the coefficient
     *  provided. Therefore, a modification on one will affect both.
     * @matlike
     */
    Matrix.appcoef2 = function (lc, name, j) {
        var J = lc[1].size(0) - 2;
        while (J > j + 1) {
            lc = Matrix.upwlev2(lc, name);
            J = lc[1].size(0) - 2;
        }
        var sizes = lc[1].get([1, -1]).prod(1).getData();
        var data = lc[0].getData();
        var size = lc[1].get(0).getData();
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
     *  The level of the subband.
     * @return {Matrix}
     *  Returns the coefficients required. The Matrix returned is a 
     *  view on the coefficient provided. Therefore, a modification 
     *  on one will affect both.
     * @matlike
     */
    Matrix.detcoef2 = function (type, lc, j) {
        if (type === 'all') {
            return [
                Matrix.detcoef2('h', lc, j),
                Matrix.detcoef2('v', lc, j),
                Matrix.detcoef2('d', lc, j)
            ];
        }
        var ds = getSubbandsCoordinates(lc[1]), data = lc[0].getData();
        var scale = ds.J - (j + 1);
        var size = lc[1].get([scale + 1], []).getData();
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

    /** Reconstruct a signal from a given subband. 
     * To be implemented efficiently.
     */
    Matrix.wrcoef2 = function (type, lc, name, N) {
        var ds = getSubbandsCoordinates(lc[1]), J = ds.J;
        for (var l = 0; l < N; l++) {
            lc = Matrix.upwlev2(lc, name);
        }

        var ds = getSubbandsCoordinates(lc[1]), data = lc[0].getData();
        var A, H, V, D;
        var Z = new Matrix(ds.subSizes[0]);
        A = H = V = D = Z;
        if (type === 'a') {
            A = new Matrix(ds.subSizes[0], data.subarray(ds.bands[0], ds.bands[1]))
        } else if (type === 'h') {
            H = new Matrix(ds.subSizes[0], data.subarray(ds.bands[1], ds.bands[2]));
        } else if (type === 'v') {
            V = new Matrix(ds.subSizes[0], data.subarray(ds.bands[2], ds.bands[3]));
        } else if (type === 'd') {
            D = new Matrix(ds.subSizes[0], data.subarray(ds.bands[3], ds.bands[4]));
        }

        var A = idwt2([A, H, V, D], name);
        A = resizeMatrix(A, ds, 1);

        var sizes = lc[1].get([1, -1]);
        sizes.set(0, [], sizes.get(1, []));

        var Asize = A.numel(), remaining = data.length - ds.bands[4];
        var out = new Float64Array(Asize + remaining);
        out.subarray(0, Asize).set(A.getData());

        lc = [new Matrix([out.length], out), sizes, A];

        for (var l = N + 1; l < J; l++) {
            lc = Matrix.upwlev2(lc, name);
        }
        return lc[0].reshape(lc[1].get(0).getData());
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
        return maxlev;
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
                var length = s + l + r, sel = new Uint32Array(length);
                var i, j;
                i = 0;
                for (j = l; j > 0; j--, i++) {
                    sel[i] = s - j;
                }
                for (j = 0; j < s; j++, i++) {
                    sel[i] = j;
                }
                for (j = 0; j < r; j++, i++) {
                    sel[i] = j;
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
            if (mode !== 'zpd') {
                var fun = padIndices[mode];
                if (fun === undefined) {
                    throw new Error("Matrix.padarray: Unimplemented mode " + mode + ".");
                }
                for (var args = [], d = 0; d < arguments.length; d++) {
                    var s = arguments[d], sel;
                    if (Tools.isInteger(s)) {
                        sel = [fun(this.getSize(d), s, s)]
                    } else if (Tools.isArrayLike(s) && s.length === 0) {
                        sel = [];
                    } else {
                        sel = [fun(this.getSize(d), s[0], s[1])]
                    }
                    args.push(sel);
                }
                return this.get.apply(this, args);
            }
            var args = [], size = this.getSize();
            for (var d = 0; d < arguments.length; d++) {
                var s = arguments[d];
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
    
    window.addEventListener("load", function () {

        var test = function () {
            var names = [
                'haar',
                // 'coif1', 'bi13',
                'db2', 'db4', 'db8',
                'coif2', 'coif4', 'coif4', 
                'sym2', 'sym4', 'sym8'
            ];
            var modes = ["sym", "symw", "per", "zpd", "nn"];
            var tests = {}, time;
            var max = 8;
            for (var m = 0; m < Math.max(names.length, modes.length); m++) {
                var mode = modes[m % modes.length];
                var name = names[m % names.length];
                Matrix.dwtmode(mode);
                Tools.tic();
                console.log(name, mode, time);
                for (var sz = 2; sz <= max; sz *= 2) {
                    var s = Matrix.rand(sz, sz);
                    s.display();
                    Tools.tic();
                    var wt1 = dwt(s, name, 0);
                    var iwt = idwt(wt1, name, 0);
                    iwt.display();
                    var wt2 = dwt(wt1[0], name, 1).concat(dwt(wt1[1], name, 1));
                    var iwt1 = idwt([wt2[0], wt2[1]], name, 1);
                    var iwt2 = idwt([wt2[2], wt2[3]], name, 1);
                    var iwt3 = idwt([iwt1, iwt2], name, 0);

                    time = Tools.toc();
                    var n1 = Matrix.minus(iwt1, wt1[0]).norm(),
                        n2 = Matrix.minus(iwt2, wt1[1]).norm(),
                        n3 = Matrix.minus(iwt, s).norm(),
                        n4 = Matrix.minus(iwt3, s).norm();
                    tests[sz] = {
                        "n1": parseFloat(n1.toExponential(2)),
                        "n2": parseFloat(n2.toExponential(2)),
                        "n3": parseFloat(n3.toExponential(2)), 
                        "n4": parseFloat(n4.toExponential(2)) ,
                        "status": (n1 + n2 + n3 + n4) / 4 < 1e8 ? "ok": "NOK",
                        "time": time
                    };
                }
                time = Tools.toc();
                console.table(tests, ["status", "time", "n1", "n2", "n3", "n4"]);
            }

            Matrix.dwtmode("per");
        };

        var test2 = function () {
            var name = 'coif2';
            var mode = "debug_zpd"; 
            Matrix.dwtmode(mode);
            var s = Matrix.ones(3, 1).cumsum(0).cumsum(1);
            s.display("s");
            var wt1 = dwt(s, name, 0);
            wt1[0].display("L");
            wt1[1].display("H");
            Matrix.dwtmode("zpd");
            // var iwt = idwt(wt1, name, 0);
            // iwt.display("iwt");
            // Matrix.dwtmode("per");
            // padTest(false);
            // padTest(true);
        };

        var test3 = function () {
            var name = 'sym4';
            var im = Matrix.ones(3).cumsum(0).cumsum(1);
            
            im.display("image");
            var mode = ["sym"];
            for (var x in mode) {
                Matrix.dwtmode(mode[x]);
                var wt = Matrix.dwt2(im, name);
                wt[0].display("LL");
                // wt[1].display("LH");
                // wt[2].display("HL");
                // wt[3].display("HH");
                var iwt = Matrix.idwt2(wt, name);
                iwt.display("iwt");
            }
            // Matrix.psnr(s, iwt).display("PSNR");
            Matrix.dwtmode("per");
        };

        // test();
        test2();
        // test3();
    }, false);
})(Matrix, Matrix.prototype);
