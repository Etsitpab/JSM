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
    var filter1DPerMono = function (yx0, o, oys, nyx, dy, ody, orig, K, kdy, ly, isOdd, kernelL, idL, odL) {
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
            }
            odL[oy] += sumL;
        }
    };
    var filter1DPad = function (y0, o, oys, ny, dy, ody, orig, K, kdy, ly, isOdd, kernelL, kernelH, idL, idH, odL, odH) {
        var y, oy, k, s, sumL, sumH;
        y0 += (K - 1) * kdy - orig;
        ny -= orig;
        for (y = y0, oy = o + oys; y < ny; y += dy, oy += ody) {
            for (k = 0, s = y + orig, sumL = 0, sumH = 0; k < K; k++, s -= kdy) {
                sumL += kernelL[k] * idL[s];
                sumH += kernelH[k] * idH[s];
            }
            odL[oy] += sumL;
            odH[oy] += sumH;
        }
    };
    var filter1DPadMono = function (y0, o, oys, ny, dy, ody, orig, K, kdy, ly, isOdd, kernel, id, od) {
        var y, oy, k, s, sum;
        y0 += (K - 1) * kdy - orig;
        ny -= orig;
        for (y = y0, oy = o + oys; y < ny; y += dy, oy += ody) {
            for (k = 0, s = y + orig, sum = 0; k < K; k++, s -= kdy) {
                sum += kernel[k] * id[s];
            }
            od[oy] += sum;
        }
    };

    var filter1DPadDebug = function (y0, o, oys, ny, dy, ody, orig, K, kdy, ly, isOdd, kernelL, kernelH, idL, idH, odL, odH) {
        var y, oy, k, s, sumL, sumH;
        console.log("y0", y0, "ny", ny, "dy", dy, "oys", oys, "ody", ody);
        console.log("orig", orig, "K", K, "Kdy", kdy);
        y0 += (K - 1) * kdy - orig;
        ny -= orig;// + (isOdd ? 1 : 0)
        console.log("y0", y0, "ny", ny, orig);
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
    var filter1DPadCheck = function (y0, o, oys, ny, dy, ody, orig, K, kdy, ly, isOdd, kernelL, kernelH, idL, idH, odL, odH) {
        var y, oy, k, s, sumL, sumH;
        y0 += (K - 1) * kdy - orig;
        ny -= orig;
        if (odL.length !== odH.length) {
            throw new Error("Output length error");
        }
        if (idL.length !== idH.length) {
            throw new Error("input length error");
        }
        for (y = y0, oy = o + oys; y < ny; y += dy, oy += ody) {
            for (k = 0, s = y + orig, sumL = 0, sumH = 0; k < K; k++, s -= kdy) {
                if (k < 0 || k >= kernelL.length) {
                    throw new Error("Kernel error");
                }
                if (s < 0 || s >= idL.length) {
                    throw new Error("Input error");
                }
                sumL += kernelL[k] * idL[s];
                sumH += kernelH[k] * idH[s];
            }
            if (oy < 0 || oy >= odL.length) {
                throw new Error("Output error");
            }
            odL[oy] += sumL;
            odH[oy] += sumH;
        }
    };
    var filter1D, filter1DMono, dwtmode;
    
    /** Select or return the mode used for bordering management.
     *   Available modes are :
     *   - "per", for periodic, it leads to the shortest representation,
     *   - "sym", for symmetric boundary (default mode),
     *   - "nn", for nearest neighbour boundary,
     *   - "symw", for symmetric boundary with whole point,
     *   - "zpd". zero padding boundary.
     *
     *  @param {string} mode
     *   The mode to be used.
     *  @return {String} 
     *   Returns the current or new mode.
     */
    Matrix.dwtmode = function (mode) {
        mode = mode.toLowerCase();
        switch (mode) {
        case "per":
            filter1D = filter1DPer;
            filter1DMono = filter1DPerMono;
            break;
        case "per2":
        case "sym":
        case "symw":
        case "zpd":
        case "nn":
            filter1D = filter1DPad;
            filter1DMono = filter1DPadMono;
            break;
        case "debug_sym":
        case "debug_symw":
        case "debug_zpd":
        case "debug_nn":
            mode = mode.substr(6);
            filter1D = filter1DPadDebug;
            break;
        case "check_sym":
        case "check_symw":
        case "check_zpd":
        case "check_nn":
            mode = mode.substr(6);
            filter1D = filter1DPadCheck;
            break;
        default:
            throw new Error("Matrix.dwtmode: invalid mode " + mode + "."); 
        }
        dwtmode = mode;
        return dwtmode;
    };
    Matrix.dwtmode("sym");

    var filterND = function (inL, inH, vI, name, forward, origin, sub, outL, outH, vO) {
        var wav = Matrix.wfilters(name, forward ? 'd' : 'r');
        var kL = wav[0].getData(), kH = wav[1].getData(), K = kL.length;
        
        origin = (origin === 'cl' ? Math.floor : Math.ceil)((K - 1) / 2);
        var isOdd = vI.getSize(0) % 2 ? true : false; 
     
        var ys = vI.getFirst(0), dy = vI.getStep(0);
        var ly = vI.getEnd(0) + ((isOdd && dwtmode === "per") ? dy : 0);
        var oys = vO.getFirst(0), ody = vO.getStep(0);

        var orig = origin * dy;
        var kdy = dy;
        dy *= sub;

        var itI = vI.getIterator(1), itO = vO.getIterator(1);
        var y, i, it = itI.iterator, bi = itI.begin, ei = itI.end();
        var oy, o, ot = itO.iterator, bo = itO.begin;

        var k, s, sTmp, sumL, sumH;
        if (!inL || !inH) {
            var id = (inL || inH).getData(), 
                od = (inL ? outL : outH).getData(),
                k = inL ? kL : kH;
            for (i = bi(), o = bo(); i !== ei; i = it(), o = ot()) {
                var yx0 = ys + i, nyx = ly + i;
                filter1DMono(yx0, o, oys, nyx, dy, ody, orig, K, kdy, ly, isOdd, k, id, od);
            }
        } else {
            var idL = inL.getData(),  idH = inH.getData(),
                odL = outL.getData(), odH = outH.getData();
            for (i = bi(), o = bo(); i !== ei; i = it(), o = ot()) {
                var yx0 = ys + i, nyx = ly + i;
                filter1D(yx0, o, oys, nyx, dy, ody, orig, K, kdy, ly, isOdd, kL, kH, idL, idH, odL, odH);
            }
        }
    };

    var zeros = Matrix.zeros;
    
    var getPaddingInfos = function (name, s) {
        var wav = Matrix.wfilters(name, 'd');
        var K = wav[0].getData().length;

        var isOdd = s % 2 ? true : false;
        var f = Math.floor, c = Math.ceil;
        // left and right part of filter (computed on reversed filter)
        var lk = f((K - 1) / 2), rk = c((K - 1) / 2);
        // Left and right input padding
        var li = K - 2, ri = K - 2 + (isOdd ? 1 : 0);
        // Left and right output padding
        var lo = f(li / 4), ro = c(ri / 4);
        // On odd signal, the length of output corresponding to
        // the signal without considering padding depend if we start
        // on the first or on the second value. This starting point
        // depends itself on if we have K % 4 equal to zero or not. 
        if (isOdd && (K % 4) !== 0) {
            ro--;
        }
        if (dwtmode === 'per') {
            li = 0;
            ri = 0;
            lo = 0;
            ro = 0;
        } else if (dwtmode === 'per2') {
        } 
        return {"lk": lk, "rk": rk, "li": li, "lo": lo, "ri": ri, "ro": ro};
    };
    var padTest = function (isOdd) {
        console.log("For " + (isOdd ? "odd" : "even") + " signal");
        var data = {}, f = Math.floor, c = Math.ceil;
        for (var K = 2; K < 16; K += 2) {
            data[K] = getPaddingInfos(K, isOdd ? 1 : 2);
        }
        console.table(data, ["lk", "rk", "li", "ri", "lo", "ro"]);
    };

    var dwt = function (s, name, dim) {
        dim = dim || 0;
        var size = s.getSize();
        var p = getPaddingInfos(name, size[dim]);
        size[dim] = Math.ceil(size[dim] / 2) + p.ro + p.lo;
        if (p.li !== 0 || p.ri !== 0) {
            s = s.paddim(dwtmode, dim, [p.li, p.ri]);
        }
        // Create output data
        var dL = zeros(size), dH = zeros(size);
        var v = dL.getView().swapDimensions(0, dim);
        var iV = s.getView().swapDimensions(0, dim);
        // H filtering from signal to output
        filterND(s, s, iV, name, true, 'cr', 2, dL, dH, v);
        if (dwtmode === "per2") {
            var K = Matrix.wfilters(name)[0].numel();
            var lc = Math.ceil((K - 2) / 4), rc = Math.floor((K - 2) / 4);
            v = v.restore().selectDimension(dim, [lc, -rc - 1]);
            dL = dL.extractViewFrom(v);
            dH = dH.extractViewFrom(v);
        }   
        return [dL, dH];
    };
    var idwt = function (bands, name, dim, out) {
        dim = dim || 0;
        var n = bands[0] ? 0 : 1;
        var bL = bands[0], bH = bands[1];
        if (dwtmode === "per2") {
            var K = Matrix.wfilters(name)[0].numel();
            var lc = Math.ceil((K - 2) / 4), rc = Math.floor((K - 2) / 4);
            bL = bL ? bL.paddim("per", dim, [lc, rc]) : undefined;
            bH = bH ? bH.paddim("per", dim, [lc, rc]) : undefined;
        }   

        var p = getPaddingInfos(name, (bL || bH).getSize(dim));
        var start = dwtmode === 'per' ? 0 : 1,
            offset = dwtmode === 'per' ? 0 : p.lk + p.rk;

        var size = (bL || bH).getSize();
        size[dim] = 2 * size[dim] + start; 
        var dL = bL ? zeros(size) : undefined,
            dH = bH ? zeros(size) : undefined,
            dV = new MatrixView(size).selectDimension(dim, [start, 2, -1])

        if (dL) {
            bL.extractViewTo(dV, dL);
        }
        if (dH) {
            bH.extractViewTo(dV, dH);
        }

        // Out array
        dV.restore().swapDimensions(0, dim);
        size[dim] -= offset;
        if (out !== undefined && !Tools.checkSizeEquals(out.getSize(), size)) {
            throw new Error("idwt: Wrong output size.");
        }
        var out = out || zeros(size), vO = out.getView().swapDimensions(0, dim);

        // Process scale
        filterND(dL, dH, dV, name, false, 'cl', 1, out, out, vO);
        return out;
    };
    
    var dwt2 = function (im, name) {
        var h = im.getSize(0), w = im.getSize(1), c = im.getSize(2);
        
        // Create output image
        var ph = getPaddingInfos(name, h);
        var hh = Math.ceil(h / 2) + ph.ro + ph.lo;
        if (ph.li !== 0 || ph.ri !== 0) {
            im = im.paddim(dwtmode, 0, [ph.li, ph.ri]);
        }
        
        // Buffer image
        var bL = zeros(hh, w, c), bH = zeros(hh, w, c);
        var vB = bL.getView();

        // H filtering from image to buffer
        var vI = im.getView();
        filterND(im, im, vI, name, true, 'cr', 2, bL, bH, vB);

        var pw = getPaddingInfos(name, w);
        var hw = Math.ceil(w / 2) + pw.ro + pw.lo;
        if (pw.li !== 0 || pw.ri !== 0) {
            bH = bH.paddim(dwtmode, 1, [pw.li, pw.ri]);
            bL = bL.paddim(dwtmode, 1, [pw.li, pw.ri]);
            vB = bL.getView();
        }

        // V filtering from buffer to data
        var dA = zeros(hh, hw, c), dV = zeros(hh, hw, c),
            dH = zeros(hh, hw, c), dD = zeros(hh, hw, c);

        var v = dA.getView().swapDimensions(0, 1);

        vB.swapDimensions(0, 1);
        filterND(bL, bL, vB, name, true, 'cr', 2, dA, dH, v);
        filterND(bH, bH, vB, name, true, 'cr', 2, dV, dD, v);
        return [dA, dH, dV, dD];
    };
    var idwt2 = function (bands, name) {
        var n = bands[0] ? 0 : (bands[1] ? 1 : (bands[2] ? 2 : 3));
        var ph = getPaddingInfos(name, bands[n].getSize(0)),
            pw = getPaddingInfos(name, bands[n].getSize(1));
        var oh = 0, ow = 0, start = 0;
        if (dwtmode !== 'per') {
            oh = ph.rk + ph.lk;
            ow = pw.rk + pw.lk;
            start = 1;
        }

        var size = bands[n].getSize();
        size[0] = 2 * size[0] + start
        var dL = (bands[0] || bands[1]) ? zeros(size) : undefined,
            dH = (bands[2] || bands[3]) ? zeros(size) : undefined,
            dV = new MatrixView(size);

        size[0] -= oh;
        size[1] = 2 * size[1] + start;
        /*
        var bL = (bands[0] || bands[2]) ? zeros(size) : undefined,
            bH = (bands[1] || bands[3]) ? zeros(size) : undefined,
            B = new MatrixView(size).select([], [start, 2, -1]);
         */
        var bL, bH, B;
        if (bands[0] || bands[2]) {
            if (dL) {
                dL.set([start, 2, -1], bands[0]);
            }
            if (dH) {
                dH.set([start, 2, -1], bands[2]);
            }
            bL = zeros(size);
            B = bL.getView().select([], [start, 2, -1]);
            filterND(dL, dH, dV, name, false, 'cl', 1, bL, bL, B);
        }
        if (bands[1] || bands[3]) {
            if (dL) {
                dL.set([start, 2, -1], bands[1]);
            }
            if (dH) {
                dH.set([start, 2, -1], bands[3]);
            }      
            bH = zeros(size),
            B = bH.getView().select([], [start, 2, -1]);
            filterND(dL, dH, dV, name, false, 'cl', 1, bH, bH, B);
        }

        size[1] -= ow;
           

        var out = zeros(size), vO = new MatrixView(size).swapDimensions(0, 1);
        B.restore().swapDimensions(0, 1);
        filterND(bL, bH, B, name, false, 'cl', 1, out, out, vO);
        return out;
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
        return maxlev < 0 ? 0 : maxlev;
    };
  
    var createStruct1D = function (s, n, name, dim) {
        var sizes = new Uint16Array(n + 2);
        sizes[n + 1] = s.getSize(dim);
        for (var l = n; l >= 1; l--) {
            var py = getPaddingInfos(name, sizes[l + 1]);
            sizes[l] = Math.ceil(sizes[l + 1] / 2) + py.ro + py.lo;
        }
        sizes[0] = sizes[1];
        return Matrix.toMatrix(sizes)
    };
    var getSubbandsCoordinates1D = function (wt, dim) {
        var sizes = wt.get([], 0).getData();

        var outSize = sizes[0];
        var bands = [0, outSize], subSizes = [];
        
        var j, J = sizes.length - 2;
        for (j = 1; j < J + 1; j++) {
            subSizes.push(sizes[j]);
            outSize += sizes[j];
            bands.push(outSize)
        }
        return {
            "bands": bands,
            "outSize": outSize,
            "subSizes": subSizes,
            "sizes": sizes,
            "J": J
        };
    };
    var resizeMatrix1d = function (A, ds, l, dim) {
        if (A.getSize(dim) !== ds.sizes[l + 1]) {
            var AView = A.getView().selectDimension(dim, [0, ds.sizes[l + 1] - 1]);
            A = A.extractViewFrom(AView);
        }
        return A;
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
    Matrix.dwt = dwt
    /** Compute the 1D inverse DWT (Discrete Wavelet Transform).
     *
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
    Matrix.idwt = idwt
    
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
        var sd = createStruct1D(s, n, name, dim);
        var ds = getSubbandsCoordinates1D(sd, dim);

        var size = s.getSize();
        size[dim] = ds.outSize;
        var matOut = zeros(size), outView = matOut.getView();
        var matIn = s, dL, dH;
        for (var l = n; l >= 1; l--) {
            var wt = dwt(matIn, name, dim);
            outView.selectDimension(dim, [ds.bands[l], ds.bands[l + 1] - 1]);
            wt[1].extractViewTo(outView, matOut);
            outView.restore();
            matIn = wt[0];
        }
        outView.selectDimension(dim, [ds.bands[0], ds.bands[1] - 1]);
        wt[0].extractViewTo(outView, matOut);
        return [matOut, sd];
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
    Matrix.waverec = function (wt, name, dim) {
        dim = dim || 0;
        var ds = getSubbandsCoordinates1D(wt[1], dim);
        var input = wt[0], iV = input.getView();
        var dLView = iV.selectDimension(dim, [ds.bands[0], ds.bands[1] - 1]);
        var dL = input.extractViewFrom(dLView);

        for (var l = 1; l < ds.bands.length - 1; l++) {
            var dHView = iV.restore().selectDimension(dim, [ds.bands[l], ds.bands[l + 1] - 1]);
            var dH = input.extractViewFrom(dHView);
            dL = idwt([dL, dH], name, dim);
            dL = resizeMatrix1d(dL, ds, l, dim);
        }
        return dL;
    };
    /** Reconstruct the signal from a 1D DWT (Discrete Wavelet Transform)
     * at the coarsest level.
     *
     * __See also :__
     * {@link Matrix#wavedec},
     * {@link Matrix#waverec},
     * {@link Matrix#idwt}.
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
    Matrix.upwlev = function (wt, name, dim) {
        if (wt[1].getSize(0) === 2) {
            return [new Matrix(), new Matrix()];
        }
        dim = dim || 0;
        var ds = getSubbandsCoordinates1D(wt[1], dim);
        var input = wt[0], iV = input.getView();
        var dLView = iV.selectDimension(dim, [ds.bands[0], ds.bands[1] - 1]);
        var dLm = input.extractViewFrom(dLView);
        var dHView = iV.restore().selectDimension(dim, [ds.bands[1], ds.bands[2] - 1]);
        var dH = input.extractViewFrom(dHView);
        var dL = idwt([dLm, dH], name, dim);
        dL = resizeMatrix1d(dL, ds, 1, dim);

        var bSize = dL.getSize(dim);
        var oV = iV.restore().selectDimension(dim, [ds.bands[2] - bSize, -1]);
        var o = input.extractViewFrom(oV);
        oV = o.getView().selectDimension(dim, [0, bSize - 1]);
        dL.extractViewTo(oV, o);

        var sizes = wt[1].get([1, -1]);
        sizes.set(0, [], sizes.get(1, []));

        return [o, sizes, dLm];
    };
    /** Returns the coefficients corresponding to the approximation subband
     * at a given level.
     *
     * __See also :__
     * {@link Matrix#wrcoef},
     * {@link Matrix#detcoef},
     * {@link Matrix#upwlev},
     * {@link Matrix#wavedec},
     * {@link Matrix#waverec},
     * {@link Matrix#idwt2}.
     *
     * @param {Array} dwt
     *  Array of two elements, one contains the dwt coefficients 
     *  while the seconds contains the sizes of each subbands.
     * @param {String} name
     *  Wavelet name.
     * @param {Number} dim
     *  Dimension along which the signal must be reconstructed.
     * @param {Number} level
     *  The level of the subband between 0 (the original signal) and 
     *  N the decomposition level.
     * @return {Matrix}
     *  If the level corresponds to the last level of decomposition, 
     *  the coefficients returned will be a view on the coefficient
     *  provided. Therefore, a modification on one will affect both.
     * @matlike
     */
    Matrix.appcoef = function (wt, name, dim, j) {
        j = j === undefined ? wt[1].size()[0] - 2 : j;
        var J = wt[1].size(0) - 2;
        if (j > J || j < 0) {
            throw new Error("Matrix.appcoef2: Invalid decomposition level.");
        }
        while (J > j) {
            wt = Matrix.upwlev(wt, name);
            J = wt[1].size(0) - 2;
        }
        var ds = getSubbandsCoordinates1D(wt[1], dim);
        var input = wt[0], iV = input.getView();
        var dLView = iV.selectDimension(dim, [ds.bands[0], ds.bands[1] - 1]);
        return input.extractViewFrom(dLView);
    };
    /** Returns the coefficients corresponding to a detail subband
     * at a given level.
     *
     * __See also :__
     * {@link Matrix#wavedec},
     * {@link Matrix#waverec},
     * {@link Matrix#wrcoef},
     * {@link Matrix#appcoef}.
     *
     * @param {Array} dwt
     *  Array of two elements, one contains the dwt coefficients 
     *  while the seconds contains the sizes of each subbands.
     * @param {Number} level
     *  The level of the subband between 1 (the coarser) and N the 
     *  decomposition level.
     * @return {Matrix}
     *  Returns the coefficients required. The Matrix returned is a 
     *  view on the coefficient provided. Therefore, a modification 
     *  on one will affect both.
     * @matlike
     */
    Matrix.detcoef = function (wt, dim, j) {
        var ds = getSubbandsCoordinates1D(wt[1], dim);
        if (j > ds.J || j < 1) {
            throw new Error("Matrix.detcoef2: Invalid decomposition level.");
        }
        var scale = ds.J - j;
        var input = wt[0], iV = input.getView();
        var dHView = iV.selectDimension(dim, [ds.bands[1 + scale], ds.bands[2 + scale] - 1]);
        return input.extractViewFrom(dHView);
    };
    /** Reconstruct the signal using only one subband.
     *
     * __See also :__
     * {@link Matrix#appcoef},
     * {@link Matrix#detcoef},
     * {@link Matrix#upwlev},
     * {@link Matrix#wavedec},
     * {@link Matrix#waverec}.
     *
     * @param {String} type
     *  Give the subband to use for the reconstruction ('l' or 'h').
     *  The value 'l' corresponds to the approximation coefficients (low-pass filter)
     *  while the seconds corresponds to the detail coefficients (high-pass filter).
     * @param {Array} dwt
     *  Array of two elements, one contains the dwt coefficients 
     *  while the seconds contains the sizes of each subbands.
     * @param {String} name
     *  The wavelet filters to use for the reconstruction.
     * @param {Number} dimension
     *  Dimension along which the reconstruction will occur.
     * @param {Number} level
     *  The level of the subband between 1 (the coarser) and N the 
     *  decomposition level.
     * @return {Matrix}
     *  Returns the coefficients required. The Matrix returned is a 
     *  view on the coefficient provided. Therefore, a modification 
     *  on one will affect both.
     * @matlike
     */
    Matrix.wrcoef = function (type, wt, name, dim, N) {
        var L, H;
        if (type === 'l') {
            L = Matrix.appcoef(wt, name, dim, N);
        }  else if (type === 'h') {
            H = Matrix.detcoef(wt, dim, N)
        } 
        var ds = getSubbandsCoordinates1D(wt[1]);
        for (var n = 0; n < N; n++) {
            L = idwt([L, H], name, dim);
            L = resizeMatrix1d(L, ds, ds.J - N + n + 1, dim);
            H = undefined; 
        }
        return L;
    };
   
    var createStruct = function (s, n, name) {
        var xSizes = new Array(n + 2);
        var ySizes = new Array(n + 2);
        var cSizes = new Array(n + 2);
        ySizes[n + 1] = s.getSize(0);
        xSizes[n + 1] = s.getSize(1);
        cSizes[n + 1] = s.getSize(2);
        for (var l = n; l >= 1; l--) {
            var py = getPaddingInfos(name, ySizes[l + 1]),
                px = getPaddingInfos(name, xSizes[l + 1]);
            ySizes[l] = Math.ceil(ySizes[l + 1] / 2) + py.ro + py.lo;
            xSizes[l] = Math.ceil(xSizes[l + 1] / 2) + px.ro + px.lo;
            cSizes[l] = cSizes[l + 1];
        }
        ySizes[0] = ySizes[1];
        xSizes[0] = xSizes[1];
        cSizes[0] = cSizes[1];
        return Matrix.toMatrix([ySizes, xSizes, cSizes])
    };
    var getSubbandsCoordinates = function (wt) {
        var ySizes = wt.get([], 0).getData(),
            xSizes = wt.get([], 1).getData(),
            cSizes = wt.get([], 2).getData();

        var outSize = xSizes[0] * ySizes[0] * cSizes[0];
        var bands = [0, outSize], subSizes = [];
        
        var j, J = ySizes.length - 2;
        for (j = 1; j < J + 1; j++) {
            subSizes.push([ySizes[j], xSizes[j], cSizes[j]]);
            var subBandSize = ySizes[j] * xSizes[j] * cSizes[j];
            for (var b = 0; b < 3; b++) {
                outSize += subBandSize;
                bands.push(outSize);
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
        var sizes = createStruct(input, n, name);
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
    Matrix.waverec2 = function (wt, name) {
        var ds = getSubbandsCoordinates(wt[1]), data = wt[0].getData();
        var A, H, V, D;
        A = new Matrix(ds.subSizes[0], data.subarray(ds.bands[0], ds.bands[1]))
        for (var l = 0, s = 0, J = ds.J; l < J; l++, s += 3) {
            var size = ds.subSizes[l];
            H = new Matrix(size, data.subarray(ds.bands[s + 1], ds.bands[s + 2]));
            V = new Matrix(size, data.subarray(ds.bands[s + 2], ds.bands[s + 3]));
            D = new Matrix(size, data.subarray(ds.bands[s + 3], ds.bands[s + 4]));
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
    Matrix.upwlev2 = function (wt, name) {
        if (wt[1].getSize(0) === 2) {
            return [new Matrix(), new Matrix()];
        }

        var ds = getSubbandsCoordinates(wt[1]), data = wt[0].getData();
        var Am = new Matrix(ds.subSizes[0], data.subarray(ds.bands[0], ds.bands[1]))
        var H = new Matrix(ds.subSizes[0], data.subarray(ds.bands[1], ds.bands[2]));
        var V = new Matrix(ds.subSizes[0], data.subarray(ds.bands[2], ds.bands[3]));
        var D = new Matrix(ds.subSizes[0], data.subarray(ds.bands[3], ds.bands[4]));
        var A = idwt2([Am, H, V, D], name);
        A = resizeMatrix(A, ds, 1);

        var sizes = wt[1].get([1, -1]);
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
     *  The level of the subband between 0 (the original signal) and 
     *  N the decomposition level.
     * @return {Matrix}
     *  If the level corresponds to the last level of decomposition, 
     *  the coefficients returned will be a view on the coefficient
     *  provided. Therefore, a modification on one will affect both.
     * @matlike
     */
    Matrix.appcoef2 = function (wt, name, j) {
        j = j === undefined ? wt[1].size()[0] - 2 : j;
        var J = wt[1].size(0) - 2;
        if (j > J || j < 0) {
            throw new Error("Matrix.appcoef2: Invalid decomposition level.");
        }
        while (J > j) {
            wt = Matrix.upwlev2(wt, name);
            J = wt[1].size(0) - 2;
        }
        var sizes = wt[1].get([1, -1]).prod(1).getData();
        var data = wt[0].getData();
        var size = wt[1].get(0).getData();
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
     *  The level of the subband between 1 (the coarser) and N the 
     *  decomposition level.
     * @return {Matrix}
     *  Returns the coefficients required. The Matrix returned is a 
     *  view on the coefficient provided. Therefore, a modification 
     *  on one will affect both.
     * @matlike
     */
    Matrix.detcoef2 = function (type, wt, j) {
        if (type === 'all') {
            return [
                Matrix.detcoef2('h', wt, j),
                Matrix.detcoef2('v', wt, j),
                Matrix.detcoef2('d', wt, j)
            ];
        }
        var ds = getSubbandsCoordinates(wt[1]), data = wt[0].getData();
        if (j > ds.J || j < 1) {
            throw new Error("Matrix.detcoef2: Invalid decomposition level.");
        }
        var scale = ds.J - j;
        var size = wt[1].get([scale + 1], []).getData();
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
    /** Reconstruct the image using only one subband.
     *
     * __See also :__
     * {@link Matrix#appcoef2},
     * {@link Matrix#detcoef2},
     * {@link Matrix#upwlev2},
     * {@link Matrix#wavedec2},
     * {@link Matrix#waverec2}.
     *
     * @param {String} type
     *  Give the subband to use for the reconstruction ('a' or 'h', 'v' or 'd').
     *  The value 'a' corresponds to the approximation coefficients (low-pass filter)
     *  while the others correspond to the detail coefficients (horizontal, vertical and diagonal).
     * @param {Array} dwt
     *  Array of two elements, one contains the dwt coefficients 
     *  while the seconds contains the sizes of each subbands.
     * @param {String} name
     *  The wavelet filters to use for the reconstruction.
     * @param {Number} level
     *  The level of the subband between 1 (the coarser) and N the 
     *  decomposition level.
     * @return {Matrix}
     *  Returns the coefficients required. The Matrix returned is a 
     *  view on the coefficient provided. Therefore, a modification 
     *  on one will affect both.
     * @matlike
     */
    Matrix.wrcoef2 = function (type, wt, name, N) {
        var A, H, V, D;
        if (type === 'a') {
            A = Matrix.appcoef2(wt, name, N);
        }  else if (type === 'h') {
            H = Matrix.detcoef2('h', wt, N)
        } else if (type === 'v') {
            V = Matrix.detcoef2('v', wt, N)
        } else if (type === 'd') {
            D = Matrix.detcoef2('d', wt, N)
        }
        var ds = getSubbandsCoordinates(wt[1]);
        for (var l = 0; l < N; l++) {
            A = idwt2([A, H, V, D], name);
            A = resizeMatrix(A, ds, ds.J - N + l + 1);
            H = V = D = undefined; 
        }
        return A;
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
                var length = s + l + r, sel = new Int32Array(length);
                var i, j;
                for (i = 0, j = l; j > 0; j--, i++) {
                    sel[i] = s - (j - 1) % s - 1;
                }
                for (j = 0; j < s; j++, i++) {
                    sel[i] = j;
                }
                for (j = 0; j < r; j++, i++) {
                    sel[i] = j % s;
                }
                return sel;
            },
            per2: function (s, l, r) {
                var isOdd = s % 2;
                s += isOdd ? 1 : 0;
                var length = s + l + r, sel = new Int32Array(length);
                var i, j;
                for (i = 0, j = l; j > 0; j--, i++) {
                    sel[i] = s - (j - 1) % s - 1;
                }
                for (j = 0; j < s; j++, i++) {
                    sel[i] = j;
                }
                for (j = 0; j < r; j++, i++) {
                    sel[i] = j % s;
                }
                if (isOdd) {
                    for (i = 0; i < sel.length; i++) {
                        if (sel[i] == s - 1) {
                            sel[i]--;
                        }
                    }                    
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
        // var s = Matrix.colon(1, 1);
        // s.paddim("per2", 0, [0, 12]).display();
        /*
        var test6 = function (s, name, N, M, dim) {
            Tools.tic();
            var wt = Matrix.wavedec(s, N, name, dim);
            var rec = Matrix.wrcoef('l', wt, name, dim, N - M);
            for (var n = N - M; n > 0; n--) {
                rec["+="](Matrix.wrcoef('h', wt, name, dim, n));
            }
            var time = Tools.toc();
            return {
                psnr: Matrix.psnr(s, rec).getDataScalar(),
                time: time
            };
        };
        var name = 'haar', dim = 0;
        var s = Matrix.ones(1, 2, 3).display();
        test6(s, name, 2, 0, 0);
        return;*/
        var sz = 1;
        var s = Matrix.ones(sz, 2, 3).cumsum(0).cumsum(1).display();

        var name = 'coif1', dim = 0;
        Matrix.dwtmode("per");
        var wt = Matrix.dwt(s, name, dim);
        wt[0].display();
        Matrix.dwtmode("per2");
        wt = Matrix.dwt(s, name, dim);
        wt[0].display();
        var iwt = Matrix.idwt(wt, name, dim);
        iwt.display();
        /*
        var K = Matrix.wfilters(name)[0].numel();
        var lc = Math.ceil((K - 2) / 4), rc = Math.floor((K - 2) / 4);
        console.log(lc, rc);
        wt[0] = wt[0].get([lc, -rc - 1]);
        wt[0].display();
        wt[0] = wt[0].paddim("per", dim, [lc, rc]);
        wt[0].display();
        */
        Matrix.dwtmode("sym");
        
    }, false);


})(Matrix, Matrix.prototype);