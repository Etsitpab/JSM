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
     * @param {float[]} h
     *  A filter.
     * @param {String} action
     *  - 'rescale': multiply the filter by a constant.
     *  - 'normalize': normalize the filter (L2 norm).
     *  - 'conjugate': return the filter h[0], -h[1], .., h[n]*(-1)^n.
     *  - 'mirror': return the filter h[n-1] .. h[0].
     * @param {float} [factor=1]
     *  Multiplicative constant.
     * @return {float[]}
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

    var filterND = function (inL, inH, vI, kernelL, kernelH, origin, sub, outL, outH, vO) {

        var K = kernelL.length;
        origin = (origin === 'cl' ? Math.floor : Math.ceil)((K - 1) / 2);
        var isOdd = vI.getSize(0) % 2 ? true : false; 
        
        var ys = vI.getFirst(0), dy = vI.getStep(0);
        var ly = vI.getEnd(0), ny = vI.getSize(0);
        var oys = vO.getFirst(0), ody = vO.getStep(0);

        var idL = inL.getData(),  idH = inH.getData(),
            odL = outL.getData(), odH = outH.getData();

        var ndy = ny * dy + isOdd ? dy : 0;
        ly += isOdd ? dy : 0;
        var orig = origin * dy;
        var kdy = dy;
        dy *= sub;

        var itI = vI.getIterator(1), itO = vO.getIterator(1);
        var y, i, it = itI.iterator, bi = itI.begin, ei = itI.end();
        var oy, o, ot = itO.iterator, bo = itO.begin;

        var k, s, sTmp, sumL, sumH;
        for (i = bi(), o = bo(); i !== ei; i = it(), o = ot()) {
            var yx0 = ys + i, nyx = ly + i;
            for (y = i + ys, oy = o + oys; y < nyx; y += dy, oy += ody) {
                for (k = 0, s = y + orig, sumL = 0, sumH = 0; k < K; k++, s -= kdy) {
                    sTmp = s;
                    while (sTmp < yx0) {
                        sTmp += ndy;
                    }
                    while (sTmp >= nyx) {
                        sTmp -= ndy;
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
        }
    };

    var zeros = Matrix.zeros;

    /** Compute the 1D DWT (Discrete Wavelet Transform)
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
     */
    Matrix.dwt2 = function (im, name) {
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
        var dLL = zeros(hh, hw, c), dHL = zeros(hh, hw, c),
            dLH = zeros(hh, hw, c), dHH = zeros(hh, hw, c);

        var v = dLL.getView().swapDimensions(0, 1);

        vB.swapDimensions(0, 1);
        filterND(bL, bL, vB, fL, fH, 'cr', 2, dLL, dLH, v);
        filterND(bH, bH, vB, fL, fH, 'cr', 2, dHL, dHH, v);
        return [dLL, dLH, dHL, dHH];
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
     */
    Matrix.idwt2 = function (bands, name) {
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
     */
    Matrix.dwt = function (im, name, dim) {
        dim = dim || 0;
        var wav = new Wavelet(name);
        var fL = wav.filterL, fH = wav.filterH;
        var size = im.getSize();
        size[dim] = Math.ceil(size[dim] / 2);

        // Create output image
        var dL = zeros(size), dH = zeros(size);
        var v = dL.getView().swapDimensions(0, dim);
        var iV = im.getView().swapDimensions(0, dim);

        // H filtering from image to buffer
        filterND(im, im, iV, fL, fH, 'cr', 2, dL, dH, v);

        return [dL, dH];
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
     */
    Matrix.idwt = function (bands, name, dim) {
        dim = dim || 0;
        var wav = new Wavelet(name);
        var fL = wav.invFilterL, fH = wav.invFilterH;
        var size = bands[0].getSize();
        size[dim] = size[dim] * 2;
        var L = zeros(size), H = zeros(size);

        var v = L.getView().selectDimension(dim, [0, 2, -1]);
        bands[0].extractViewTo(v, L);
        bands[1].extractViewTo(v, H);
        v.restore().swapDimensions(0, dim);

        // Buffer image
        var O = zeros(size), vO = O.getView().swapDimensions(0, dim);

        // Process scale
        filterND(L, H, v, fL, fH, 'cl', 1, O, O, vO);
        return O;
    };
})();
