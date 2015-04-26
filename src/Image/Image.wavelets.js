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
    /* ********** WAVELET CLASS *************** */

    /** Define a wavelet.
     * @class
     *  Provide several wavelets functions.
     *  A wavelet can be either a common wavelet (called by its name)
     *  or any user-defined wavelet from its recursive filters.
     * @param {string} [name='haar']
     *  Name of the wavelet.
     * @return {Wavelet}
     *  The wavelet definition (containing filters and some properties).
     * @private
     */
    function Wavelet(name) {
        var errMsg = this.constructor.name + ': ';

        // Default arguments
        if (name  === undefined) {
            this.name = 'haar';
        } else {
            /** Name of the wavelet. */
            this.name = name.toLowerCase();
        }

        // Pre-defined wavelets
        if (Wavelet.list[this.name]) {
            var wav = Wavelet.list[this.name];
            var normalize = (wav.normalized !== undefined && !wav.normalized)
                    ? function (h) { return Wavelet.filter(h, 'norm'); }
                    : function (h) { return h; };
            /** Low-pass recursive decomposition filter. */
            this.filterL = normalize(wav.filterL);
            /** Is the wavelet orthogonal? */
            this.orthogonal = (wav.orthogonal) ? true : false;
            if (wav.filterH) {
                /** High-pass recursive decomposition filter. */
                this.filterH = normalize(wav.filterH);
            }
            if (wav.invFilterL) {
                /** Low-pass recursive reconstruction filter. */
                this.invFilterL = normalize(wav.invFilterL);
            }
            if (wav.invFilterH) {
                /** High-pass recursive reconstruction filter. */
                this.invFilterH = normalize(wav.invFilterH);
            }
        }

        // User-define wavelet
        if (this.filterL === undefined) {
            var errMsgFull = errMsg + "unknown wavelet '" + name + "'. \n";
            errMsgFull += 'User-defined wavelets not implemented yet.';
            throw new Error(errMsgFull);
        }

        // Compute complementary filter
        var conj = function (h, offset) {
            return Wavelet.filter(h, 'conjugate', (offset) ? -1 : 1);
        };
        if (!this.filterH && this.orthogonal) {
            this.filterH = Wavelet.filter(conj(this.filterL), 'mirror');
        }
        if (!this.invFilterL) {
            this.invFilterL = conj(this.filterH, true);
        }
        if (!this.invFilterH) {
            this.invFilterH = conj(this.filterL, false);
        }

        // Return the object
        return this;
    }

    /** Public List of wavelets. */
    Wavelet.list = {
        'haar': {
            'orthogonal': true,
            'normalized': false,
            'filterL': new Float64Array([1, 1])
        },
        'db2': {
            'name': 'Daubechies 2',
            'orthogonal': true,
            'normalized': false,
            'filterL': new Float64Array([
                1 + Math.sqrt(3),
                3 + Math.sqrt(3),
                3 - Math.sqrt(3),
                1 - Math.sqrt(3)])
        },
        'db4': {
            'name': 'Daubechies 4',
            'orthogonal': true,
            'filterL': new Float64Array([
                -0.010597401784997278,
                0.032883011666982945,
                0.030841381835986965,
                -0.18703481171888114,
                -0.027983769416983849,
                0.63088076792959036,
                0.71484657055254153,
                0.23037781330885523
            ])
        },
        'db8': {
            'name': 'Daubechies 8',
            'orthogonal': true,
            'filterL': new Float64Array([
                -0.00011747678400228192,
                0.00067544940599855677,
                -0.00039174037299597711,
                -0.0048703529930106603,
                0.0087460940470156547,
                0.013981027917015516,
                -0.044088253931064719,
                -0.017369301002022108,
                0.12874742662018601,
                0.00047248457399797254,
                -0.28401554296242809,
                -0.015829105256023893,
                0.58535468365486909,
                0.67563073629801285,
                0.31287159091446592,
                0.054415842243081609
            ])
        },
        /* Symlets*/
        'sym2': {
            'name': 'Symlets 2',
            'orthogonal': true,
            'filterL': new Float64Array([
                -0.12940952255092145,
                0.22414386804185735,
                0.83651630373746899,
                0.48296291314469025
            ])
        },
        'sym4': {
            'name': 'Symlets 4',
            'orthogonal': true,
            'filterL': new Float64Array([
                -0.075765714789273325,
                -0.02963552764599851,
                0.49761866763201545,
                0.80373875180591614,
                0.29785779560527736,
                -0.099219543576847216,
                -0.012603967262037833,
                0.032223100604042702
            ])
        },
        'sym8': {
            'name': 'Symlets 8',
            'orthogonal': true,
            'filterL': ([
                -0.0033824159510061256,
                -0.00054213233179114812,
                0.031695087811492981,
                0.0076074873249176054,
                -0.14329423835080971,
                -0.061273359067658524,
                0.48135965125837221,
                0.77718575170052351,
                0.3644418948353314,
                -0.051945838107709037,
                -0.027219029917056003,
                0.049137179673607506,
                0.0038087520138906151,
                -0.014952258337048231,
                -0.0003029205147213668,
                0.0018899503327594609
            ])
        },
        /* Coiflets */
        'coif1': {
            'name': 'Coiflets 1',
            'orthogonal': true,
            'filterL': new Float64Array([
                -0.01565572813546454,
                -0.072732619512853897,
                0.38486484686420286,
                0.85257202021225542,
                0.33789766245780922,
                -0.072732619512853897
            ])
        },
        'coif2': {
            'name': 'Coiflets 2',
            'orthogonal': true,
            'filterL': new Float64Array([
                -0.00072054944536451221,
                -0.0018232088707029932,
                0.0056114348193944995,
                0.023680171946334084,
                -0.059434418646456898,
                -0.076488599078306393,
                0.41700518442169254,
                0.81272363544554227,
                0.38611006682116222,
                -0.067372554721963018,
                -0.041464936781759151,
                0.016387336463522112
            ])
        },
        'coif4': {
            'name': 'Coiflets 4',
            'orthogonal': true,
            'filterL': new Float64Array([
                -1.7849850030882614e-06,
                -3.2596802368833675e-06,
                3.1229875865345646e-05,
                6.2339034461007128e-05,
                -0.00025997455248771324,
                -0.00058902075624433831,
                0.0012665619292989445,
                0.0037514361572784571,
                -0.0056582866866107199,
                -0.015211731527946259,
                0.025082261844864097,
                0.039334427123337491,
                -0.096220442033987982,
                -0.066627474263425038,
                0.4343860564914685,
                0.78223893092049901,
                0.41530840703043026,
                -0.056077313316754807,
                -0.081266699680878754,
                0.026682300156053072,
                0.016068943964776348,
                -0.0073461663276420935,
                -0.0016294920126017326,
                0.00089231366858231456
            ])
        },
        /* Bi-orthogonal */
        'bi13': {
            'name': 'Biorthogonal 1-3',
            'orthogonal': false,
            'filterL': new Float64Array([
                -0.088388347648318447,
                0.088388347648318447,
                0.70710678118654757,
                0.70710678118654757,
                0.088388347648318447,
                -0.088388347648318447
            ]),
            'filterH': new Float64Array([
                -0.70710678118654757,
                0.70710678118654757
            ])
        },
        'bi31': {
            'name': 'Biorthogonal 3-1',
            'orthogonal': false,
            'filterL': new Float64Array([
                -0.35355339059327379,
                1.0606601717798214,
                1.0606601717798214,
                -0.35355339059327379
            ]),
            'filterH': new Float64Array([
                -0.17677669529663689,
                0.53033008588991071,
                -0.53033008588991071,
                0.17677669529663689
            ])
        },
        'bi68': {
            'name': 'Biorthogonal 6-8',
            'orthogonal': false,
            'filterL': new Float64Array([
                0.0,
                0.0019088317364812906,
                -0.0019142861290887667,
                -0.016990639867602342,
                0.01193456527972926,
                0.04973290349094079,
                -0.077263173167204144,
                -0.09405920349573646,
                0.42079628460982682,
                0.82592299745840225,
                0.42079628460982682,
                -0.09405920349573646,
                -0.077263173167204144,
                0.04973290349094079,
                0.01193456527972926,
                -0.016990639867602342,
                -0.0019142861290887667,
                0.0019088317364812906
            ]),
            'filterH': new Float64Array([
                0.0,
                0.014426282505624435,
                -0.014467504896790148,
                -0.078722001062628819,
                0.040367979030339923,
                0.41784910915027457,
                -0.75890772945365415,
                0.41784910915027457,
                0.040367979030339923,
                -0.078722001062628819,
                -0.014467504896790148,
                0.014426282505624435,
                0.0,
                0.0
            ])
        },
        'bi97': {
            'name': 'Biorthogonal 9-7',
            'orthogonal': false,
            'filterL': new Float64Array([
                0.0,
                0.02674875741080976,
                -0.01686411844287495,
                -0.07822326652898785,
                0.2668641184428723,
                0.6029490182363579,
                0.2668641184428723,
                -0.07822326652898785,
                -0.01686411844287495,
                0.02674875741080976
            ]),
            'filterH': new Float64Array([
                0.0,
                -0.09127176311424948,
                0.05754352622849957,
                0.5912717631142470,
                -1.115087052456994,
                0.5912717631142470,
                0.05754352622849957,
                -0.09127176311424948,
                0.0,
                0.0
            ])
        }
    };

    /** Perform an operation on a filter.
     * @param {Number[]} h
     *  A filter.
     * @param {String} action
     *  - 'rescale': multiply the filter by a constant.
     *  - 'normalize': normalize the filter (L2 norm).
     *  - 'conjugate': return the filter h[0], -h[1], .., h[n]*(-1)^n.
     *  - 'mirror': return the filter h[n-1] .. h[0].
     * @param {Number} [factor=1]
     *  Multiplicative constant.
     * @return {Number[]}
     *  A transformed filter.
     */
    Wavelet.filter = function (h, action, factor) {
        var errMsg = 'Wavelet.filter: ';
        if (factor === undefined || factor === 0) {
            factor = 1;
        }
        if (typeof factor !== 'number') {
            throw new Error(errMsg + "argument 'factor' must be a number");
        }
        if (typeof action !== 'string') {
            throw new Error(errMsg + "argument 'action' must be a string");
        }
        action = action.toLowerCase().substr(0, 3);

        var k;
        var N = h.length;
        var out = [];
        var sign = 1, dsign = 1;
        if (action === 'mir') {
            for (k = 0; k < N; k++) {
                out[k] = factor * h[N - 1 - k];
            }
            return out;
        }
        if (action === 'nor') {
            var sum2 = 0;
            for (k = 0; k < N; k++) {
                sum2 += h[k] * h[k];
            }
            factor = (!sum2) ? 1 : 1 / Math.sqrt(sum2);
        } else if (action === 'con') {
            dsign = -1;
        } else if (action !== 'res') {
            throw new Error(errMsg + 'unknown action');
        }

        for (k = 0; k < N; k++, sign *= dsign) {
            out[k] = factor * sign * h[k];
        }

        return out;
    };

    /** @class Matrix */

    /** Returns wavelet filters.
     * Currently implemented filters are :
     *
     * + "haar" ;
     * + "db1", "db2", "db4", "db8" ;
     * + "sym2", "sym4", "sym8" ;
     * + "coif1", "coif2", "coif4" ;
     * + "bi13", "bi31", "bi68", "bi97" ;
     *
     * @param{String} name
     *  Name of the filters.
     * @param{String} [type]
     *  Can be either :
     *
     * + "d" for decomposition filters ;
     * + "r" for recomposition filters ;
     * + "l" for low-pass filters ;
     * + "h" for high-pass filters ;
     * @return{Array}
     */
    Matrix.wfilters = function (name, type) {
        var wav = new Wavelet(name);
        var dl = Matrix.toMatrix(wav.filterL),
            dh = Matrix.toMatrix(wav.filterH),
            rl = Matrix.toMatrix(wav.invFilterL),
            rh = Matrix.toMatrix(wav.invFilterH);
        switch (type) {
        case 'd':
            return [dl, dh];
        case 'r':
            return [rl, rh];
        case 'l':
            return [dl, rl];
        case 'h':
            return [dh, rh];
        case undefined:
            return [dl, dh, rl, rh];
        default:
            throw new Error("Matrix.wfilters: wrong type argument.");
        }
    };

    /*
        for (y = ys, ny = c(ys + K / 2), oy = oys; y < ny; y += dy, oy += ody) {
            for (k = 0, s = y + o, sum = 0; k < K; k++, s -= kdy) {
                sTmp = s;
                while (sTmp < ys) {
                    sTmp += nydy;
                }
                while (sTmp >= ly) {
                    sTmp -= nydy;
                }
                sum += kernel[k] * id[sTmp];
            }
            if (add) {
                od[oy] += sum;
            } else  {
                od[oy] = sum;
            }
        }
        for (ny = ly - o; y < ny; y += dy, oy += ody) {
            for (k = 0, s = y + o, sum = 0; k < K; k++, s -= kdy) {
                sum += kernel[k] * id[s];
            }
            if (add) {
                od[oy] += sum;
            } else  {
                od[oy] = sum;
            }
        }
        for (; y < ly; y += dy, oy += ody) {
            console.log(y);
            for (k = 0, s = y + o, sum = 0; k < K; k++, s -= kdy) {
                sTmp = s;
                while (sTmp < ys) {
                    sTmp += nydy;
                }
                while (sTmp >= ly) {
                    sTmp -= nydy;
                }
                sum += kernel[k] * id[sTmp];
            }
            if (add) {
                od[oy] += sum;
            } else  {
                od[oy] = sum;
            }
         }*/
    /*
    var filter = function (inL, inH, vI, kernelL, kernelH, origin, sub, outL, outH, vO) {
        // 1. ARGUMENTS
        var ce = Math.ceil, fl = Math.floor;

        var K = kernelL.length;
        origin = (origin === 'cl' ? fl : ce)((K - 1) / 2);

        // 2. Filtering
        var cs = vI.getFirst(2), ocs = vO.getFirst(2);
        var xs = vI.getFirst(1), oxs = vO.getFirst(1);
        var ys = vI.getFirst(0), dy = vI.getStep(0);
        var ly = vI.getEnd(0), ny = vI.getSize(0);
        var dc = vI.getStep(2), odc = vO.getStep(2);
        var dx = vI.getStep(1), odx = vO.getStep(1);
        var oys = vO.getFirst(0), ody = vO.getStep(0);
        var idL = inL.getData(),  idH = inH.getData(),
            odL = outL.getData(), odH = outH.getData();

        var lc = vI.getEnd(2);
        var lx = vI.getEnd(1);

        var c, oc, o_x;
        var _x, nx, yx;
        var y, oy;
        var k, s, sTmp, sumL, sumH;

        var nydy = ny * dy;
        var o = origin * dy;
        var kdy = dy;
        dy *= sub;
        for (c = 0, oc = 0; c < lc; c += dc, oc += odc) {
            for (_x = c + xs, nx = c + lx, o_x = oc + oxs; _x < nx; _x += dx, o_x += odx) {
                var yx0 = ys + _x, nyx = ly + _x;
                for (y = _x + ys, oy = o_x + oys; y < nyx; y += dy, oy += ody) {
                    for (k = 0, s = y + o, sumL = 0, sumH = 0; k < K; k++, s -= kdy) {
                        sTmp = s;
                        while (sTmp < yx0) {
                            sTmp += nydy;
                        }
                        while (sTmp >= nyx) {
                            sTmp -= nydy;
                        }
                        sumL += kernelL[k] * idL[sTmp];
                        sumH += kernelH[k] * idH[sTmp];
                    }
                    odL[oy] += sumL;
                    odH[oy] += sumH;
                }
            }
        }
    };
 */
    /*
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
     }*/
    
    var filter1D = function (yx0, o, oys, nyx, dy, ody, orig, K, kdy, ly, isOdd, kernelL, kernelH, idL, idH, odL, odH) {
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
    var filterND = function (inL, inH, vI, kernelL, kernelH, origin, sub, outL, outH, vO) {

        var K = kernelL.length;
        origin = (origin === 'cl' ? Math.floor : Math.ceil)((K - 1) / 2);
        var isOdd = vI.getSize(0) % 2 ? true : false; 
        
        var ys = vI.getFirst(0), dy = vI.getStep(0);
        var ly = vI.getEnd(0) + (isOdd ? dy : 0);
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
            filter1D(yx0, o, oys, nyx, dy, ody, orig, K, kdy, ly, isOdd, kernelL, kernelH, idL, idH, odL, odH);
        }
    };

    var zeros = Matrix.zeros;
    
    var dwt = function (s, name, dim) {
        var wav = new Wavelet(name), fL = wav.filterL, fH = wav.filterH;
        var size = s.getSize();
        size[dim] = Math.ceil(size[dim] / 2);

        // Create output data
        var dL = zeros(size), dH = zeros(size);
        var v = dL.getView().swapDimensions(0, dim);
        var iV = s.getView().swapDimensions(0, dim);

        // H filtering from siganl to output
        filterND(s, s, iV, fL, fH, 'cr', 2, dL, dH, v);
        return [dL, dH];
    };
    var idwt = function (bands, name, dim) {
        var wav = new Wavelet(name);
        var fL = wav.invFilterL, fH = wav.invFilterH;
        var size = bands[0].getSize();
        size[dim] = size[dim] * 2;
        var L = zeros(size), H = zeros(size);

        var v = L.getView().selectDimension(dim, [0, 2, -1]);
        bands[0].extractViewTo(v, L);
        bands[1].extractViewTo(v, H);
        v.restore().swapDimensions(0, dim);

        // Out array
        var out = zeros(size);
        var vO = out.getView().swapDimensions(0, dim);

        // Process scale
        filterND(L, H, v, fL, fH, 'cl', 1, out, out, vO);
        return out;
    };

    var dwt2 = function (im, name) {
        var wav = new Wavelet(name);
        var fL = wav.filterL, fH = wav.filterH;
        var h = im.getSize(0), w = im.getSize(1), c = im.getSize(2);
        
        // Create output image
        var hw = Math.ceil(w / 2), hh = Math.ceil(h / 2);
        
        // Buffer image
        var bL = zeros(hh, w, c), bH = zeros(hh, w, c);
        var vB = bL.getView();

        // H filtering from image to buffer
        var vI = im.getView();
        filterND(im, im, vI, fL, fH, 'cr', 2, bL, bH, vB);

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
        var wav = new Wavelet(name);
        var fL = wav.invFilterL, fH = wav.invFilterH;
        var h = bands[0].getSize(0), w = bands[0].getSize(1), c = bands[0].getSize(2);
        var dL = zeros(2 * h, w, c), dH = zeros(2 * h, w, c);
        var bL = zeros(2 * h, 2 * w, c), bH = zeros(2 * h, 2 * w, c);
        var out = zeros(2 * h, 2 * w, c);
        var dV = dL.getView(), B = bL.getView();
        var O = out.getView().swapDimensions(0, 1);

        B.select([], [0, 2, -1]);
        dL.set([0, 2, -1], bands[0]);
        dH.set([0, 2, -1], bands[2]);
        filterND(dL, dH, dV, fL, fH, 'cl', 1, bL, bL, B);
        dL.set([0, 2, -1], [], bands[1]);
        dH.set([0, 2, -1], [], bands[3]);
        filterND(dL, dH, dV, fL, fH, 'cl', 1, bH, bH, B);
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
    Matrix.dwt2 = function (im, name) {
        return dwt2(im, name);
    };
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
    Matrix.idwt2 = function (bands, name) {
        return idwt2(bands, name);
    };

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
        var sdx = new Array(n + 2);
        var sdy = new Array(n + 2);
        var sdc = new Array(n + 2);
        sdy[n + 1] = s.getSize(0);
        sdx[n + 1] = s.getSize(1);
        sdc[n + 1] = s.getSize(2);
        var l;
        for (l = n; l >= 1; l--) {
            sdy[l] = Math.ceil(sdy[l + 1] / 2);
            sdx[l] = Math.ceil(sdx[l + 1] / 2);
            sdc[l] = sdc[l + 1];
        }
        sdy[0] = sdy[1];
        sdx[0] = sdx[1];
        sdc[0] = sdc[1];
        return Matrix.toMatrix([sdy, sdx, sdc])
    };

    var getSubbandsCoordinates = function (lc) {
        var sdy = lc.get([], 0).getData();
        var sdx = lc.get([], 1).getData();
        var sdc = lc.get([], 2).getData();

        var outSize = sdx[0] * sdy[0] * sdc[0];
        var cSize = [0, outSize];
        
        var l, n = sdy.length - 2;
        for (l = 2; l < n + 2; l++) {
            var subBandSize = sdy[l - 1] * sdx[l - 1] * sdc[l - 1];
            for (var b = 0; b < 3; b++) {
                outSize += subBandSize;
                cSize.push(outSize)
            }
        }
        return {
            "cSize": cSize,
            "outSize": outSize,
            "sdy": sdy,
            "sdx": sdx,
            "sdc": sdc,
            "n": n
        };
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
    Matrix.wavedec2 = function (s, n, name) {
        var sizes = createStruct(s, n);
        var ds = getSubbandsCoordinates(sizes);
        var out = new Float64Array(ds.outSize);
        var matIn = s, dL, dH;
        var l;
        for (l = n; l >= 1; l--) {
            var wt = dwt2(matIn, name);
            var s = 1 + 3 * (l - 1);
            out.subarray(ds.cSize[s], ds.cSize[s + 1]).set(wt[1].getData());
            out.subarray(ds.cSize[s + 1], ds.cSize[s + 2]).set(wt[2].getData());
            out.subarray(ds.cSize[s + 2], ds.cSize[s + 3]).set(wt[3].getData());
            matIn = wt[0];
        }
        out.subarray(ds.cSize[0], ds.cSize[1]).set(wt[0].getData());
        return [new Matrix([ds.outSize], out), sizes];
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
        var ds = getSubbandsCoordinates(lc[1]);
        var data = lc[0].getData();
        var subSize = [ds.sdy[0], ds.sdx[0], ds.sdc[0]];
        var A, H, V, D;
        A = new Matrix(subSize, data.subarray(ds.cSize[0], ds.cSize[1]))
        var l, n = ds.n;
        for (l = 1; l < n + 1; l++) {
            if (A.getSize(0) !== ds.sdy[l] || A.getSize(1) !== ds.sdx[l]) {
                A = A.get([0, ds.sdy[l] - 1], [0, ds.sdx[l] - 1], [])
            }
            var s = 1 + 3 * (l - 1);
            subSize = [ds.sdy[l], ds.sdx[l], ds.sdc[l]];
            H = new Matrix(subSize, data.subarray(ds.cSize[s], ds.cSize[s + 1]));
            V = new Matrix(subSize, data.subarray(ds.cSize[s + 1], ds.cSize[s + 2]));
            D = new Matrix(subSize, data.subarray(ds.cSize[s + 2], ds.cSize[s + 3]));
            A = idwt2([A, H, V, D], name);
        }
        if (A.getSize(0) !== ds.sdy[l] || A.getSize(1) !== ds.sdx[l]) {
            A = A.get([0, ds.sdy[l] - 1], [0, ds.sdx[l] - 1], [])
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
        var sdx = lc[1].get([], 1).getData();
        // If there no possible reconstruction
        if (sdx.length === 2) {
            return [new Matrix(), new Matrix(), Matrix.reshape(lc[0], lc[1].get(0, []).getData())];
        }

        var ds = getSubbandsCoordinates(lc[1]), data = lc[0].getData();
        var subSize = [ds.sdy[0], ds.sdx[0], ds.sdc[0]];
        var Am = new Matrix(subSize, data.subarray(ds.cSize[0], ds.cSize[1]))
        subSize = [ds.sdy[1], ds.sdx[1], ds.sdc[1]];
        var H = new Matrix(subSize, data.subarray(ds.cSize[1], ds.cSize[2]));
        var V = new Matrix(subSize, data.subarray(ds.cSize[2], ds.cSize[3]));
        var D = new Matrix(subSize, data.subarray(ds.cSize[3], ds.cSize[4]));
        var A = idwt2([Am, H, V, D], name);
        
        if (A.getSize(0) !== ds.sdy[1] || A.getSize(1) !== ds.sdx[1]) {
            A = A.get([0, ds.sdy[2] - 1], [0, ds.sdx[2] - 1], []);
        }

        var sizes = lc[1].get([1, -1]);
        sizes.set(0, [], sizes.get(1, []));

        var out = new Float64Array(A.numel() + ds.cSize[ds.cSize.length - 1] - ds.cSize[4]);
        out.subarray(0, A.numel()).set(A.getData());
        out.subarray(A.numel(), A.numel() + ds.cSize[ds.cSize.length - 1] - ds.cSize[4]).set(data.subarray(ds.cSize[4]));
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
        var outSize = sizes[0];
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
        var sizes = lc[1].get([1, -1]).prod(1).getData();
        var J = lc[1].size(0) - 2;
        var outSize = sizes[0], cSize = [0, outSize];
        var n;
        for (n = 0; n < J; n++) {
            for (var b = 0; b < 3; b++) {
                outSize += sizes[n];
                cSize.push(outSize)
            }
        }
        var data = lc[0].getData();
        var scale = J - (j + 1);
        var size = lc[1].get([scale + 1], []).getData();
        var band = 1 + scale * 3; 
        if (type === 'h') {
            var start = cSize[band], end = cSize[band + 1];
        } else if (type === 'v') {
            var start = cSize[band + 1], end = cSize[band + 2];
        } else if (type === 'd') {
            var start = cSize[band + 2], end = cSize[band + 3];
        } else if (type === 'all') {
            return [
                Matrix.detcoef2('h', lc, j),
                Matrix.detcoef2('v', lc, j),
                Matrix.detcoef2('d', lc, j)
            ];
        }
        return new Matrix(size, data.subarray(start, end));
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
        var wav = new Wavelet(name);
        var dl = wav.filterL.length,
            dh = wav.filterH.length,
            rl = wav.invFilterL.length,
            rh = wav.invFilterH.length;
        var w = Math.max(dl, dh, rl, rh);
        var maxlev = Math.floor(Math.log(s / (w - 1)) / Math.log(2));
        return maxlev;
    };

    /** Reconstruct a signal from a given subband. 
     * To be implemented.
     */
    Matrix.wrcoef2 = function (type, lc, name, n) {
        
    };

})();
