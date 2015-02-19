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

/** @class Matrix */

(function (Matrix, Matrix_prototype) {
    'use strict';


    //////////////////////////////////////////////////////////////////
    //                            TOOLS                             //
    //////////////////////////////////////////////////////////////////


    var getRealColumnArray = function (A) {
        var m = A.getSize(0), n = A.getSize(1), ad = A.getData(), col = [];
        for (var j = 0, _j = 0; j < n; j++, _j += m) {
            col[j] = ad.subarray(_j, m + _j);
        }
        return col;
    };

    var getImagColumnArray = function (A) {
        var m = A.getSize(0), n = A.getSize(1);
        var aid = A.getImagData(), col = [];
        for (var j = 0, _j = 0; j < n; j++, _j += m) {
            col[j] = aid.subarray(_j, m + _j);
        }
        return col;
    };

    var resizeRealMatrix = function (A, m, n) {
        var o = Math.min(A.getSize(1), n);
        var X = new Matrix([m, n]);
        var Xcol = getRealColumnArray(X);
        var Acol = getRealColumnArray(A);
        for (var i = 0; i < o; i++) {
            Xcol[i].set(Acol[i].subarray(0, m));
        }
        return X;
    };

    var resizeComplexMatrix = function (A, m, n) {
        var o = Math.min(A.getSize(1), n);
        var X = new Matrix([m, n], undefined, true);
        var Xcolr = getRealColumnArray(X);
        var Xcoli = getImagColumnArray(X);
        var Acolr = getRealColumnArray(A);
        var Acoli = getImagColumnArray(A);
        for (var i = 0; i < o; i++) {
            Xcolr[i].set(Acolr[i].subarray(0, m));
            Xcoli[i].set(Acoli[i].subarray(0, m));
        }
        return X;
    };

    var swap = function (t, a, b) {
        var v = t[a];
        t[a] = t[b];
        t[b] = v;
    };

    var swapColumn = function (t, r, k, col) {
        col.set(t[r]);
        t[r].set(t[k]);
        t[k].set(col);
    };

    var findMax = function (tab, iMax) {
        var i, ie, vMax;
        vMax = tab[iMax];
        for (i = iMax + 1, ie = tab.length; i < ie; i++) {
            if (tab[i] > vMax) {
                iMax = i;
                vMax = tab[i];
            }
        }
        return iMax;
    };

    var normFro = function (c, r) {
        var i, ei, norm = 0;
        for (i = r, ei = c.length; i < ei; i++) {
            norm += c[i];
        }
        return Math.sqrt(norm);
    };

    var getRowVector = function (cols, i) {
        var j, ej = cols.length, row = new Array(ej);
        for (j = 0; j < ej; j++) {
            row[j] = cols[j][i];
        }
        return row;
    };

    var setRowVector = function (cols, i, row) {
        for (var j = 0, ej = cols.length; j < ej; j++) {
            cols[j][i] = row[j];
        }
    };

    var dotproduct = function (cxArray, nx, ria, sk, ek, i, cst) {
        // l = [0, N - 1]
        for (var l = 0; l < nx; l++) {
            var clx = cxArray[l];
            // k = [0, i]
            for (var vr = 0, k = sk; k < ek; k++) {
                vr += clx[k] * ria[k];
            }
            clx[i] -= vr;
            clx[i] *= cst;
        }
    };
    /*
     var dotproduct_cplx = function (cxrArray, cxiArray, nx, riar, riai, sk, ek, i, rd, id, cst) {
     var a, b, c, d;
     // l = [0, N - 1]
     for (var l = 0; l < nx; l++) {
     var clxr = cxrArray[l];
     var clxi = cxiArray[l];

     // k = [0, i]
     for (var vr = 0, vi = 0, k = sk; k < ek; k++) {
     a = clxr[k];
     b = clxi[k];
     c = riar[k];
     d = riai[k];
     vr += a * c - b * d;
     vi += b * c + a * d;
     }

     a = clxr[i] - vr;
     b = clxi[i] - vi;
     clxr[i] = (a * rd + b * id) * cst;
     clxi[i] = (b * rd - a * id) * cst;
     }
     };
     */


    //////////////////////////////////////////////////////////////////
    //                   MATRIX MULTIPLICATIONS                     //
    //////////////////////////////////////////////////////////////////


    var mtimes_real_real = function (a, bcols, out, M, N, K) {
        var i, j, l, ij, il, bl, tmp;
        var rowTmp = new Float64Array(N);
        for (i = 0; i < M; i++) {
            // Copy the i-th row of matrix A.
            for (j = 0, ij = i; j < N; j++, ij += M) {
                rowTmp[j] = a[ij];
            }
            // Dot product between the i-th row of matrix A and the l-th row of matrix B.
            for (il = i, l = 0; l < K; il += M, l++) {
                bl = bcols[l];
                for (tmp = 0, j = 0; j < N; j++) {
                    tmp += rowTmp[j] * bl[j];
                }
                out[il] = tmp;
            }
        }
    };

    var mtimes_real_cplx = function (a, brcols, bicols, outr, outi, M, N, K) {
        var i, j, l, ij, il, brl, bil, tmpr, tmpi, ar;
        var rowTmp = new Float64Array(N);
        for (i = 0; i < M; i++) {
            // Copy the i-th row of matrix A.
            for (j = 0, ij = i; j < N; j++, ij += M) {
                rowTmp[j] = a[ij];
            }
            // Dot product between the i-th row of matrix A and the l-th row of matrix B.
            for (il = i, l = 0; l < K; il += M, l++) {
                brl = brcols[l];
                bil = bicols[l];
                for (tmpr = 0, tmpi = 0, j = 0; j < N; j++) {
                    ar = rowTmp[j];
                    tmpr += ar * brl[j];
                    tmpi += ar * bil[j];
                }
                outr[il] = tmpr;
                outi[il] = tmpi;
            }
        }
    };

    var mtimes_cplx_real = function (ar, ai, bcols, outr, outi, M, N, K) {
        var i, j, l, ij, il, bl, tmpr, tmpi, br;
        var rowrTmp = new Float64Array(N);
        var rowiTmp = new Float64Array(N);
        for (i = 0; i < M; i++) {
            // Copy the i-th row of matrix A.
            for (j = 0, ij = i; j < N; j++, ij += M) {
                rowrTmp[j] = ar[ij];
                rowiTmp[j] = ai[ij];
            }
            // Dot product between the i-th row of matrix A and the l-th row of matrix B.
            for (l = 0, il = i; l < K; l++, il += M) {
                bl = bcols[l];
                for (tmpr = 0, tmpi = 0, j = 0; j < N; j++) {
                    br = bl[j];
                    tmpr += rowrTmp[j] * br;
                    tmpi += rowiTmp[j] * br;
                }
                outr[il] = tmpr;
                outi[il] = tmpi;
            }
        }
    };

    var mtimes_cplx_cplx = function (ard, aid, brcols, bicols, outr, outi, M, N, K) {
        var i, j, l, ij, il, brl, bil, tmpr, tmpi, ar, ai, br, bi;
        var rowr = new Matrix.dataType(N);
        var rowi = new Matrix.dataType(N);
        for (i = 0; i < M; i++) {
            // Copy the i-th row of matrix A.
            for (j = 0, ij = i; j < N; j++, ij += M) {
                rowr[j] = ard[ij];
                rowi[j] = aid[ij];
            }
            // Dot product between the i-th row of matrix A and the l-th row of matrix B.
            for (il = i, l = 0; l < K; il += M, l++) {
                brl = brcols[l];
                bil = bicols[l];
                for (tmpr = 0, tmpi = 0, j = 0; j < N; j++) {
                    ar = rowr[j];
                    ai = rowi[j];
                    br = brl[j];
                    bi = bil[j];
                    tmpr += ar * br - ai * bi;
                    tmpi += ar * bi + ai * br;
                }
                outr[il] = tmpr;
                outi[il] = tmpi;
            }
        }
    };


    //////////////////////////////////////////////////////////////////
    //                   GAUSSIAN SUBSTITUTIONS                     //
    //////////////////////////////////////////////////////////////////


    var gaussianSubstitution_real_real = function (forward, A, X, rdiag) {
        // Matrix A iterators
        var viewA = A.getView();
        var m = viewA.getSize(0), n = viewA.getSize(1), dn = viewA.getStep(1);

        var rank = Math.min(m, n);
        var Float = Tools.checkType(A.getDataType());

        // Matrix X
        var viewX = X.getView();
        var nx = viewX.getSize(1);

        var cxArray = getRealColumnArray(X);
        var ad = A.getData();

        // Main loop variables
        var i, j;
        // Composed loop variables
        var ij, ii;
        // End loop variables
        var ei, ek, eij;

        // Row i matrix a, real and imaginary parts
        var ria = new Float(rank);

        var si = forward ? 0 : rank - 1;
        ei = forward ? rank : -1;
        var di = forward ? 1 : -1;
        var dii = forward ? dn + 1 : -dn - 1;

        for (i = si, ii = i + i * dn; i !== ei; i += di, ii += dii) {

            var rd = (rdiag === undefined) ? ad[ii] : rdiag[i];
            var cst = 1 / rd;
            var sk = forward ? 0 : i + 1;
            ek = forward ? i + 1 : rank;
            var sj = forward ? 0 : i;
            var sij = forward ? i : ii;
            eij = forward ? ii: i + rank * dn;

            for (j = sj, ij = sij; ij < eij; j++, ij += dn) {
                ria[j] = ad[ij];
            }

            // l = [0, N - 1]
            dotproduct(cxArray, nx, ria, sk, ek, i, cst);
        }
    };

    var gaussianSubstitution_real_cplx = function (forward, A, X, rdiag) {
        // Matrix A iterators
        var viewA = A.getView();
        var m = viewA.getSize(0), n = viewA.getSize(1), dn = viewA.getStep(1);
        var rank = Math.min(m, n);
        var Float = Tools.checkType(A.getDataType());

        // Matrix X
        var viewX = X.getView();
        var nx = viewX.getSize(1);

        var cxrArray = getRealColumnArray(X);
        var cxiArray = getImagColumnArray(X);
        var ad = A.getData();

        // Main loop variables
        var i, j, k, l;
        // Composed loop variables
        var ij, ii;
        // End loop variables
        var ei, ek, eij;

        var si = forward ? 0 : rank - 1;
        ei = forward ? rank : -1;
        var di = forward ? 1 : -1;
        var dii = forward ? dn + 1 : -dn - 1;

        var vr, vi;
        var ria = new Float(rank);


        for (i = si, ii = i + i * dn; i !== ei; i += di, ii += dii) {

            var rd = (rdiag === undefined) ? ad[ii] : rdiag[i];
            var cst = 1 / rd;

            var sk = forward ? 0 : i + 1;
            ek = forward ? i + 1 : rank;
            var sj = forward ? 0 : i;
            var sij = forward ? i : ii;
            eij = forward ? ii: i + rank * dn;

            for (j = sj, ij = sij; ij < eij; j++, ij += dn) {
                ria[j] = ad[ij];
            }

            // l = [0, N - 1]
            for (l = 0; l < nx; l++) {
                var clxr = cxrArray[l];
                var clxi = cxiArray[l];

                // k = [0, i]
                for (vr = 0, vi = 0, k = sk; k < ek; k++) {
                    var c = ria[k];
                    vr += clxr[k] * c;
                    vi += clxi[k] * c;
                }

                clxr[i] -= vr;
                clxi[i] -= vi;
                clxr[i] *= cst;
                clxi[i] *= cst;

            }

        }

    };

    var gaussianSubstitution_cplx_cplx = function (forward, A, X, rdiag, idiag) {
        // Matrix A iterators
        var viewA = A.getView();
        var m = viewA.getSize(0), n = viewA.getSize(1), dn = viewA.getStep(1);
        var rank = Math.min(m, n);
        var Float = Tools.checkType(A.getDataType());

        // Matrix X
        var viewX = X.getView();
        var nx = viewX.getSize(1);

        if (X.isreal()) {
            X.toComplex();
        }

        var ard = A.getRealData(), aid = A.getImagData();
        var cxrArray = getRealColumnArray(X), cxiArray = getImagColumnArray(X);

        // Main loop variables
        var i, j, k, l;
        // Composed loop variables
        var ij, ii;
        // End loop variables
        var ei, ek, eij;

        var si, di, dii;
        si = forward ? 0 : rank - 1;
        ei = forward ? rank : -1;
        di = forward ? 1 : -1;
        dii = forward ? dn + 1 : -dn - 1;

        var riar = new Float(rank), riai = new Float(rank);


        var vr, vi, a, b, c, d;
        for (i = si, ii = i + i * dn; i !== ei; i += di, ii += dii) {

            var rd = (rdiag === undefined) ? ard[ii] : rdiag[i];
            var id = (idiag === undefined) ? aid[ii] : idiag[i];
            var cst = 1 / (rd * rd + id * id);

            var sk = forward ? 0 : i + 1;
            ek = forward ? i + 1 : rank;
            var sj = forward ? 0 : i;
            var sij = forward ? i : ii;
            eij = forward ? ii : i + rank * dn;

            for (j = sj, ij = sij; ij < eij; j++, ij += dn) {
                riar[j] = ard[ij];
                riai[j] = aid[ij];
            }
            // dotproduct_cplx(cxrArray, cxiArray, nx, riar, riai, sk, ek, i, rd, id, cst);

            // l = [0, N - 1]
            for (l = 0; l < nx; l++) {
                var clxr = cxrArray[l];
                var clxi = cxiArray[l];

                // k = [0, i]
                for (vr = 0, vi = 0, k = sk; k < ek; k++) {
                    a = clxr[k];
                    b = clxi[k];
                    c = riar[k];
                    d = riai[k];
                    vr += a * c - b * d;
                    vi += b * c + a * d;
                }

                a = clxr[i] - vr;
                b = clxi[i] - vi;
                clxr[i] = (a * rd + b * id) * cst;
                clxi[i] = (b * rd - a * id) * cst;

            }

        }
    };

    var gaussianSubstitution = function (forward, A, X, rdiag, idiag) {
        if (A.isreal()) {
            if  (X.isreal()) {
                gaussianSubstitution_real_real(forward, A, X, rdiag);
            } else {
                gaussianSubstitution_real_cplx(forward, A, X, rdiag);
            }
        } else {
            gaussianSubstitution_cplx_cplx(forward, A, X, rdiag, idiag);
        }
        return X;
    };


    //////////////////////////////////////////////////////////////////
    //                   CHOLESKY DECOMPOSITION                     //
    //////////////////////////////////////////////////////////////////


    var cholesky_real = function (cArray, n) {
        var k, p, i, ck, ci, v, cst;
        for (k = 0; k < n; k++) {
            ck = cArray[k];
            for (v = 0, p = 0; p < k; p++) {
                v += ck[p] * ck[p];
            }
            if (ck[k] - v < 0) {
                throw new Error("Matrix.chol: Input must be positive definite.");
            }
            ck[k] = Math.sqrt(ck[k] - v);
            cst = 1 / ck[k];
            for (p = k + 1; p < n; p++) {
                ck[p] = 0;
            }

            for (i = k + 1; i < n; i++) {
                ci = cArray[i];
                for (v = 0, p = 0; p < k; p++) {
                    v += ci[p] * ck[p];
                }
                ci[k] -= v;
                ci[k] *= cst;
            }
        }
    };

    var cholesky_cplx = function (crArray, ciArray, n) {
        var crk, cik, cri, cii;
        var vr, vi, a, b, c, d;
        var k, p, i, cst;
        for (k = 0; k < n; k++) {
            crk = crArray[k];
            cik = ciArray[k];
            for (vr = 0, p = 0; p < k; p++) {
                c = crk[p];
                d = cik[p];
                vr += c * c + d * d;
            }
            if (crk[k] - vr < 0) {
                throw new Error("Matrix.chol: Input must be positive definite.");
            }
            if (cik[k] !== 0) {
                throw new Error("Matrix.chol: Diagonal must be real positive.");
            }
            crk[k] = Math.sqrt(crk[k] - vr);
            cik[k] = 0;
            cst = 1 / (crk[k] * crk[k]);
            for (p = k + 1; p < n; p++) {
                crk[p] = 0;
                cik[p] = 0;
            }

            for (i = k + 1; i < n; i++) {
                cri = crArray[i];
                cii = ciArray[i];
                for (vr = 0, vi = 0, p = 0; p < k; p++) {
                    a = cri[p];
                    b = cii[p];
                    c = crk[p];
                    d = cik[p];
                    vr += a * c + b * d;
                    vi += b * c - a * d;
                }
                cri[k] -= vr;
                cii[k] -= vi;
                a = cri[p];
                b = cii[p];
                c = crk[p];
                d = cik[p];
                cri[k] = (a * c + b * d) * cst;
                cii[k] = (b * c - a * d) * cst;
            }
        }
    };


    //////////////////////////////////////////////////////////////////
    //                       FULL LU MODULE                         //
    //////////////////////////////////////////////////////////////////

    /*
     var cmtl = function (cArray, ck, k, m, n) {
     var i, j, v = 1 / ck[k];
     for (i = k + 1; i < m; i++) {
     ck[i] *= v;
     }
     for (j = k + 1; j < n; j++) {
     var cj = cArray[j];
     v = cj[k];
     for (i = k + 1; i < m; i++) {
     cj[i] -= ck[i] * v;
     }
     }
     };
     */
    var computeLU_real = function (cArray, m, n, piv) {
        var i, j, k, abs = Math.abs, pivsign = 1;
        for (k = 0; k < n; k++) {
            var ck = cArray[k];
            var p = k;
            for (i = k + 1; i < m; i++) {
                if (abs(ck[i]) > abs(ck[p])) {
                    p = i;
                }
            }
            if (p !== k) {
                for (j = 0; j < n; j++) {
                    swap(cArray[j], p, k);
                }
                swap(piv, p, k);
                pivsign = -pivsign;
            }

            //cmtl(cArray, ck, k, m, n);
            var v = 1 / ck[k];
            for (i = k + 1; i < m; i++) {
                ck[i] *= v;
            }

            for (j = k + 1; j < n; j++) {
                var cj = cArray[j];
                v = cj[k];
                for (i = k + 1; i < m; i++) {
                    cj[i] -= ck[i] * v;
                }
            }

        }
    };

    var computeLU = function (A) {

        var LU = A.getCopy();

        // Scaning the from the second dimension (dim = 1)
        var view = LU.getView();
        var dn = view.getStep(1), m = view.getSize(0), n = view.getSize(1);

        var k, _k, i, j, p;

        var Float = Tools.checkType(A.getDataType());
        var piv = new Float(A.getSize(0)), pivsign = 1;
        for (i = 0; i < m; i++) {
            piv[i] = i;
        }

        if (LU.isreal()) {

            var lud = LU.getData(), cArray = [];
            for (k = 0, _k = 0; k < n; _k += dn, k++) {
                cArray[k] = lud.subarray(_k, m + _k);
            }

            computeLU_real(cArray, m, n, piv);
            /*
             for (k = 0; k < n; k++) {
             ck = cArray[k];
             p = k;
             for (i = k + 1; i < m; i++) {
             if (abs(ck[i]) > abs(ck[p])) {
             p = i;
             }
             }
             if (p !== k) {
             for (j = 0; j < n; j++) {
             swap(cArray[j], p, k);
             }
             swap(piv, p, k);
             pivsign = -pivsign;
             }

             v = 1 / ck[k];
             for (i = k + 1; i < m; i++) {
             ck[i] *= v;
             }
             for (j = k + 1; j < n; j++) {
             cj = cArray[j];
             v = cj[k];
             for (i = k + 1; i < m; i++) {
             cj[i] -= ck[i] * v;
             }
             }
             }
             */

        } else {

            var lurd = LU.getRealData(), crArray = [], crk, crj, vr;
            var luid = LU.getImagData(), ciArray = [], cik, cij, vi;
            for (k = 0, _k = 0; k < n; _k += dn, k++) {
                crArray[k] = lurd.subarray(_k, m + _k);
                ciArray[k] = luid.subarray(_k, m + _k);
            }
            var mod, a, b, c, d;

            for (k = 0; k < n; k++) {
                crk = crArray[k];
                cik = ciArray[k];
                p = k;
                for (i = k + 1; i < m; i++) {
                    a = crk[i];
                    b = cik[i];
                    c = crk[p];
                    d = cik[p];
                    if (a * a + b * b > c * c + d * d) {
                        p = i;
                    }
                }
                if (p !== k) {
                    for (j = 0; j < n; j++) {
                        swap(crArray[j], p, k);
                        swap(ciArray[j], p, k);
                    }
                    swap(piv, p, k);
                    pivsign = -pivsign;
                }
                vr = crk[k];
                vi = cik[k];
                mod = vr * vr + vi * vi;
                vr = vr / mod;
                vi = -vi / mod;
                for (i = k + 1; i < m; i++) {
                    a = crk[i];
                    b = cik[i];
                    crk[i] = a * vr - b * vi;
                    cik[i] = a * vi + b * vr;
                }
                for (j = k + 1; j < n; j++) {
                    crj = crArray[j];
                    cij = ciArray[j];

                    vr = crj[k];
                    vi = cij[k];
                    for (i = k + 1; i < m; i++) {
                        a = crk[i];
                        b = cik[i];
                        crj[i] -= a * vr - b * vi;
                        cij[i] -= b * vr + a * vi;
                    }
                }
            }

        }
        return {LU: LU, piv: piv, pivsign: pivsign};
    };

    var isNonsingular = function (LU) {
        var view = LU.getView(), lud = LU.getData();
        var n = view.getSize(0);
        var ij, eij, d;
        for (ij = 0, eij = n * n, d = n + 1; ij < eij; ij += d) {
            if (lud[ij] === 0) {
                return false;
            }
        }
        return true;
    };

    var getLU = function (param, P) {
        var L, U;
        var m = param.LU.getSize(0);
        var n = param.LU.getSize(1);
        if (m === n) {
            L = param.LU.getCopy();
            U = param.LU.getCopy();
        } else if (m < n) {
            L = param.LU.get([], [0, m - 1]);
            U = param.LU.get([0, m - 1], []);
        } else {
            L = param.LU.get([], [0, n - 1]);
            U = param.LU.get([0, n - 1], []);
        }
        var view, lm;
        var dn, ln;

        // Loop variables
        var i, j, _j;
        // Composed loop variables
        var ij;
        // End Loop variables
        var ei, e_j, eij;

        // L matrix
        view = L.getView();
        lm = view.getEnd(0);
        dn = view.getStep(1);
        ln = view.getEnd(1);
        if (param.LU.isreal()) {
            var ld = L.getData();
            // j = [0, min(M, N) - 1]
            for (j = 0, _j = 0, e_j = ln, j = 0; _j < e_j; j++, _j += dn) {
                // i = [0, j - 1], i < j
                for (ij = _j, eij = j + _j; ij < eij; ij++) {
                    ld[ij] = 0;
                }
                // i = j
                ld[ij] = 1;
            }
        } else {
            var ldr = L.getRealData(), ldi = L.getImagData();
            // j = [0, min(M, N) - 1]
            for (j = 0, _j = 0, e_j = ln, j = 0; _j < e_j; j++, _j += dn) {
                // i = [0, j - 1], i < j
                for (ij = _j, eij = j + _j; ij < eij; ij++) {
                    ldr[ij] = 0;
                    ldi[ij] = 0;
                }
                // i = j
                ldr[ij] = 1;
                ldi[ij] = 0;
            }
        }

        // U matrix
        view = U.getView();
        lm = view.getEnd(0);
        dn = view.getStep(1);
        ln = view.getEnd(1);
        if (param.LU.isreal()) {

            var ud = U.getData();
            // j = [0, N - 1]
            for (j = 0, _j = 0, e_j = ln, j = 0; _j < e_j; j++, _j += dn) {
                // i = [j + 1, M - 1], i > j
                for (ij = (j + 1) + _j, eij = lm + _j; ij < eij; ij++) {
                    ud[ij] = 0;
                }
            }

        } else {

            var urd = U.getRealData(), uid = U.getImagData();
            // j = [0, N - 1]
            for (j = 0, _j = 0, e_j = ln, j = 0; _j < e_j; j++, _j += dn) {
                // i = [j + 1, M - 1], i > j
                for (ij = (j + 1) + _j, eij = lm + _j; ij < eij; ij++) {
                    urd[ij] = 0;
                    uid[ij] = 0;
                }
            }

        }

        var piv = param.piv;
        if (P === false) {
            var Float = Tools.checkType(L.getDataType());
            var ipiv = new Float(m);
            for (i = 0, ei = piv.length; i < ei; i++) {
                ipiv[piv[i]] = i;
            }
            L = L.get([ipiv]);
            return [L, U];
        }

        // P matrix
        P = new Matrix([m, m]);
        var pd = P.getData();
        view = P.getView();
        lm = view.getEnd(0);
        dn = view.getStep(1);
        ln = view.getEnd(1);
        for (i = 0; i < m; i++) {
            pd[i + piv[i] * dn] = 1;
        }
        return [L, U, P];

    };

    var solveLU = function (A, B) {
        var params = computeLU(A);
        var LU = params.LU, piv = params.piv;

        if (!isNonsingular(LU)) {
            throw new Error("Matrix.mldivide: Matrix is singular.");
        }

        // Data
        B = B.get([piv]);
        var rdiag = Matrix.ones(LU.getSize(0)).getData();
        var idiag = Matrix.zeros(LU.getSize(0)).getData();
        gaussianSubstitution(true, LU, B, rdiag, idiag);
        return gaussianSubstitution(false, LU, B);
    };


    //////////////////////////////////////////////////////////////////
    //                       FULL QR MODULE                         //
    //////////////////////////////////////////////////////////////////


    var house_real = function (real, j) {
        var i, m = real.length;

        // Determiation of x normalization factor
        var M = -Infinity, mod;
        for (i = j; i < m; i++) {
            mod = Math.abs(real[i]);
            if (mod > M) {
                M = mod;
            }
        }

        // Vector v computation from x normalized
        var iM = (M !== 0) ? 1 / M : 0;
        var sigma = 0, x1 = real[j] * iM;
        for (real[j] = 1, i = j + 1; i < m; i++) {
            real[i] *= iM;
            sigma += real[i] * real[i];
        }

        // Compute sqrt(x1^2 + sigma)
        var mu = Math.sqrt(x1 * x1 + sigma);

        // Compute 2 * v1^2 / (sigma + v1^2)
        var sig = (x1 > 0) ? 1 : -1;
        var v1 = x1 + sig * mu;
        var v12 = v1 * v1;
        var beta = 2 * v12 / (sigma + v12);

        // Compute 1 / V1
        var iv1 = 1 / v1;

        // Normalize vector by 1 / v1
        for (i = j + 1; i < m; i++) {
            real[i] *= iv1;
        }

        real[j] = - sig * mu * M;

        return beta;
    };

    var update_real = function (v, c, beta, j, start) {
        var i, l, n = c.length, m = c[0].length;
        var s, coll;

        for (l = start; l < n; l++) {
            coll = c[l];
            for (s = coll[j], i = j + 1; i < m; i++) {
                s += v[i] * coll[i];
            }
            s *= beta;
            for (coll[j] -= s, i = j + 1; i < m; i++) {
                coll[i] -= v[i] * s;
            }
        }
    };

    var house_complex = function (real, imag, j) {
        var i, m = real.length, a, b;

        // Determiation of x normalization factor
        var M = -Infinity, mod;
        for (i = j; i < m; i++) {
            mod = Math.abs(real[i]) + Math.abs(imag[i]);
            if (mod > M) {
                M = mod;
            }
        }

        // Vector v computation from x normalized
        var iM = (M !== 0) ? 1 / M : 0;
        var sigma = 0, x1r = real[j] * iM, x1i = imag[j] * iM;
        for (real[j] = 1, imag[j] = 0, i = j + 1; i < m; i++) {
            real[i] *= iM;
            imag[i] *= iM;
            a = real[i];
            b = imag[i];
            sigma += a * a + b * b;
        }

        // Compute sqrt(x1^2 + sigma)
        var mu = Math.sqrt(x1r * x1r + x1i * x1i + sigma), an = Math.atan2(x1i, x1r);

        // Compute 2 * v1^2 / (sigma + v1^2)
        var v1r = x1r + mu * Math.cos(an), v1i = x1i + mu * Math.sin(an);
        var v12 = v1r * v1r + v1i * v1i;
        var beta = 2 * v12 / (sigma + v12);

        // Compute 1 / V1
        mod = 1 / (v1r * v1r + v1i * v1i);
        var iv1r = v1r * mod, iv1i = -v1i * mod;

        // Normalize vector by 1 / v1
        for (i = j + 1; i < m; i++) {
            a = real[i];
            b = imag[i];
            real[i] = a * iv1r - b * iv1i;
            imag[i] = b * iv1r + a * iv1i;
        }

        real[j] = -mu * M * Math.cos(an);
        imag[j] = -mu * M * Math.sin(an);

        return beta;
    };

    var update_complex = function (vr, vi, cr, ci, beta, j, start) {
        var sr, si;
        var i, l, n = cr.length, m = cr[0].length;
        var collr, colli;

        for (l = start; l < n; l++) {

            collr = cr[l];
            colli = ci[l];

            for (sr = collr[j], si = colli[j], i = j + 1; i < m; i++) {
                sr += vr[i] * collr[i] + vi[i] * colli[i];
                si += vr[i] * colli[i] - vi[i] * collr[i];
            }

            sr *= beta;
            si *= beta;

            for (collr[j] -= sr, colli[j] -= si, i = j + 1; i < m; i++) {
                collr[i] -= vr[i] * sr - vi[i] * si;
                colli[i] -= vi[i] * sr + vr[i] * si;
            }
        }
    };

    // Compute A = A * (I - Beta*v*v')
    // <=> A_{ij} -= beta * v_{j} * sum_{k=1}^{n} A_{ik} * v_{k}
    var update_right_real = function (v, c, beta, j, start) {
        var s, i, k, n = c.length, m = c[0].length;
        for (i = start; i < m; i++) {

            // sum_{k=1}^{n} A_{ik} * v_{k}
            for (s = c[j][i], k = j + 1; k < n; k++) {
                s += v[k] * c[k][i];
            }

            // beta * sum_{k=1}^{n} A_{ik} * v_{k}
            s *= beta;

            // A_{ij} -= v_{j} * beta * sum_{k=1}^{n} A_{ik} * v_{k}
            for (c[j][i] -= s, k = j + 1; k < n; k++) {
                c[k][i] -= v[k] * s;
            }

        }

    };

    var update_right_complex = function (vr, vi, cr, ci, beta, j, start) {
        var sr, si;
        var i, k, n = cr.length, m = cr[0].length;
        for (i = start; i < m; i++) {

            // sum_{k=1}^{n} A_{ik} * v_{k}
            for (sr = cr[j][i], si = ci[j][i], k = j + 1; k < n; k++) {
                sr += vr[k] * cr[k][i] + vi[k] * ci[k][i];
                si += vr[k] * ci[k][i] - vi[k] * cr[k][i];
            }

            // beta * sum_{k=1}^{n} A_{ik} * v_{k}
            sr *= beta;
            si *= beta;

            // A_{ij} -= v_{j} * beta * sum_{k=1}^{n} A_{ik} * v_{k}
            for (cr[j][i] -= sr, ci[j][i] -= si, k = j + 1; k < n; k++) {
                cr[k][i] -= vr[k] * sr - vi[k] * si;
                ci[k][i] -= vi[k] * sr + vr[k] * si;
            }

        }

    };

    var computehouseBidiagonalisation = function (A) {
        A = A.getCopy();
        var Float = Tools.checkType(A.getDataType());

        var view = A.getView();
        var n = view.getSize(1);
        var j;
        var betac = new Float(n), betar = new Float(n);
        if (A.isreal()) {
            var col = getRealColumnArray(A);

            for (j = 0; j < n; j++) {
                betac[j] = house_real(col[j], j);
                update_real(col[j], col, betac[j], j, j + 1);
                if (j < n - 2) {
                    var row = getRowVector(col, j);
                    betar[j] = house_real(row, j + 1);
                    setRowVector(col, j, row);
                    update_right_real(row, col, betar[j], j + 1, j + 1);
                }
            }

        } else {

            var colr = getRealColumnArray(A), coli = getImagColumnArray(A);

            for (j = 0; j < n; j++) {
                betac[j] = house_complex(colr[j], coli[j], j);
                update_complex(colr[j], coli[j], colr, coli, betac[j], j, j + 1);
                if (j < n - 2) {
                    var rowr = getRowVector(colr, j);
                    var rowi = getRowVector(coli, j);
                    betar[j] = house_complex(rowr, rowi, j + 1);
                    setRowVector(colr, j, rowr);
                    setRowVector(coli, j, rowi);
                    update_right_complex(rowr, rowi, colr, coli, betar[j], j + 1, j + 1);
                }
            }
        }

        return [A, betac, betar];
    };

    var getU = function (UBV) {
        var betar = UBV[1];
        UBV = UBV[0];

        var m = UBV.getSize(0), n = UBV.getSize(1);
        var U = Matrix.eye(m);
        var view = U.getView(), dc = view.getStep(1);

        var j, _j;

        if (UBV.isreal()) {

            var ucol = getRealColumnArray(U);
            var ubvd = UBV.getData();
            for (j = n - 1, _j = dc * j; j >= 0; j--, _j -= dc) {
                var ubvcol = ubvd.subarray(_j, m + _j);
                update_real(ubvcol, ucol, betar[j], j, j);
            }

        } else {

            U.toComplex();
            var ucolr = getRealColumnArray(U), ucoli = getImagColumnArray(U);
            var ubvrd = UBV.getRealData(), ubvid = UBV.getImagData();
            for (j = n - 1, _j = dc * j; j >= 0; j--, _j -= dc) {
                var ubvcolr = ubvrd.subarray(_j, m + _j);
                var ubvcoli = ubvid.subarray(_j, m + _j);
                update_complex(ubvcolr, ubvcoli, ucolr, ucoli, betar[j], j, j);
            }
        }
        return U;
    };

    var getB = function (UBV) {
        return UBV[0].triu().tril(1);
    };

    var getV = function (UBV) {
        var betac = UBV[2];
        UBV = UBV[0].transpose();

        var m = UBV.getSize(0), n = UBV.getSize(1);
        var U = Matrix.eye(m);
        var view = U.getView(), dc = view.getStep(1);

        var j, _j;

        if (UBV.isreal()) {

            var ucol = getRealColumnArray(U);
            var ubvd = UBV.getData();
            for (j = n - 1, _j = dc * j; j >= 0; j--, _j -= dc) {
                var ubvcol = ubvd.subarray(_j, m + _j);
                update_real(ubvcol, ucol, betac[j], j + 1, j + 1);
            }

        } else {

            U.toComplex();
            var ucolr = getRealColumnArray(U), ucoli = getImagColumnArray(U);
            var ubvrd = UBV.getRealData(), ubvid = UBV.getImagData();
            for (j = m - 3, _j = dc * j; j >= 0; j--, _j -= dc) {
                var ubvcolr = ubvrd.subarray(_j, m + _j);
                var ubvcoli = ubvid.subarray(_j, m + _j);
                update_complex(ubvcolr, ubvcoli, ucolr, ucoli, betac[j], j + 1, j + 1);
            }

        }
        return U.transpose();
    };

    var getUBV = function (UBV) {
        return [getU(UBV), getB(UBV), getV(UBV)];
    };

    Matrix.golubStep = function (mu, n) {
        var y = t11 - mu;
        var z = t12;
        for (var k = 0, ek = n - 1; k < ek; k++) {
            
        }
    };
    
    var getR = function (QR) {
        var R = QR[0].getCopy();

        var view = R.getView();
        var dc = view.getStep(1), lr = view.getEnd(0);
        var m = view.getSize(0), n = view.getSize(1);
        var j, _j, ij, jj, eij;

        if (R.isreal()) {
            var rd = R.getData();
            for (j = 0, _j = 0, jj = 0; j < m; j++, _j += dc, jj = j + _j) {
                for (ij = jj + 1, eij = lr + _j; ij < eij; ij++) {
                    rd[ij] = 0;
                }
            }
            for (; j < n; j++, _j += dc, jj = j + _j) {
                for (ij = jj + 1, eij = lr + _j; ij < eij; ij++) {
                    rd[ij] = 0;
                }
            }
        } else {
            var rrd = R.getRealData(), rid = R.getImagData();
            for (j = 0, _j = 0, jj = 0; j < m; j++, _j += dc, jj = j + _j) {
                for (ij = jj + 1, eij = lr + _j; ij < eij; ij++) {
                    rrd[ij] = 0;
                    rid[ij] = 0;
                }
            }
            for (; j < n; j++, _j += dc, jj = j + _j) {
                for (ij = jj + 1, eij = lr + _j; ij < eij; ij++) {
                    rrd[ij] = 0;
                    rid[ij] = 0;
                }
            }
        }
        return R;
    };

    var getQ = function (QR) {
        var beta = QR[1];
        QR = QR[0];

        var m = QR.getSize(0), n = QR.getSize(1);
        var Q = Matrix.eye(m);
        var view = Q.getView(), dc = view.getStep(1);

        var j, _j;

        if (QR.isreal()) {
            var qcol = getRealColumnArray(Q);

            var qrd = QR.getData();
            for (j = n - 1, _j = dc * j; j >= 0; j--, _j -= dc) {
                var qrcol = qrd.subarray(_j, m + _j);
                update_real(qrcol, qcol, beta[j], j, j);
            }
        } else {
            Q.toComplex();
            var qcolr = getRealColumnArray(Q);
            var qcoli = getImagColumnArray(Q);

            var qrrd = QR.getRealData(), qrid = QR.getImagData();
            for (j = n - 1, _j = dc * j; j >= 0; j--, _j -= dc) {
                var qrcolr = qrrd.subarray(_j, m + _j);
                var qrcoli = qrid.subarray(_j, m + _j);
                update_complex(qrcolr, qrcoli, qcolr, qcoli, beta[j], j, j);
            }
        }

        return Q;
    };

    var getP = function (QR) {
        var piv = QR[2];
        var m = piv.length;
        var P = new Matrix([m, m]);
        var view = P.getView(), pd = P.getData();
        var dc = view.getStep(1);
        var n = m;
        var j, _j;
        for (j = 0, _j = 0; j < n; j++, _j += dc) {
            pd[piv[j] + _j] = 1;
        }
        return P;
    };

    var computeQR = function (A, pivoting) {

        var norm;
        var eps = 2.220446049250313e-16 || 1.19209289550781e-07;

        var QR = A.getCopy();
        var view = QR.getView();
        var m = view.getSize(0), n = view.getSize(1);
        var i, j, v;

        var Float = Tools.checkType(A.getDataType());
        var colTmp = new Float(m);
        var c = new Float(n);
        var piv = new Float(n);
        var beta = new Float(n), r, k;

        if (QR.isreal()) {

            var col = getRealColumnArray(QR);

            if (pivoting) {
                for (j = 0; j < n; j++) {
                    var colj = col[j];
                    for (v = 0, i = 0; i < m; i++) {
                        v += colj[i] * colj[i];
                    }
                    c[j] = v;
                    piv[j] = j;
                }
                norm = normFro(c, 0);
            }

            for (r = 0; r < n; r++) {

                if (pivoting) {
                    k = findMax(c, r);
                    if (normFro(c, r) <= norm * eps) {
                        return [QR, beta, piv, r];
                    } else if (r !== k) {
                        swapColumn(col, r, k, colTmp);
                        swap(c, r, k);
                        swap(piv, r, k);
                    }
                }

                beta[r] = house_real(col[r], r);
                update_real(col[r], col, beta[r], r, r + 1);

                if (pivoting) {
                    for (i = r + 1; i < n; i++) {
                        c[i] -= col[i][r] * col[i][r];
                    }
                }

            }

        } else {

            var colr = getRealColumnArray(QR);
            var coli = getImagColumnArray(QR);

            if (pivoting) {
                for (j = 0; j < n; j++) {
                    var coljr = colr[j], colji = coli[j];
                    for (v = 0, i = 0; i < m; i++) {
                        v += coljr[i] * coljr[i] + colji[i] * colji[i];
                    }
                    c[j] = v;
                    piv[j] = j;
                }
                norm = normFro(c, 0);
            }

            for (r = 0; r < n; r++) {

                if (pivoting) {
                    k = findMax(c, r);
                    if (normFro(c, r) <= norm * eps) {
                        return [QR, beta, piv, r + 1];
                    } else if (r !== k) {
                        swapColumn(colr, r, k, colTmp);
                        swapColumn(coli, r, k, colTmp);
                        swap(c, r, k);
                        swap(piv, r, k);
                    }
                }

                beta[r] = house_complex(colr[r], coli[r], r);
                update_complex(colr[r], coli[r], colr, coli, beta[r], r, r + 1);

                if (pivoting) {
                    for (i = r + 1; i < n; i++) {
                        c[i] -= colr[i][r] * colr[i][r] + coli[i][r] * coli[i][r];
                    }
                }

            }
        }
        return [QR, beta, piv, r];
    };

    var solveOverdeterminedQR = function (A, B) {
        var QR = computeQR(A, true);
        var beta = QR[1];
        var piv = QR[2];
        QR = QR[0];

        var m = A.getSize(0), n = A.getSize(1), n2 = B.getSize(1);
        var rank = Math.min(m, n);

        // Compute Q' * B
        B = B.getCopy();

        var j, X;

        if (QR.isreal() && B.isreal()) {

            var bcol = getRealColumnArray(B);
            var qrcol = getRealColumnArray(QR);
            for (j = 0; j < n; j++) {
                update_real(qrcol[j], bcol, beta[j], j, 0);
            }

            // Solve R * X = Q * B, backward-subsitution B is overwriting by X
            gaussianSubstitution(false, QR, B);

            // Copy B part of interest in X
            X = resizeRealMatrix(B, rank, n2);

        } else {

            if (QR.isreal()) {
                QR.toComplex();
            }
            if (B.isreal()) {
                B.toComplex();
            }

            var brcol = getRealColumnArray(B);
            var bicol = getImagColumnArray(B);

            var qrcolr = getRealColumnArray(QR);
            var qrcoli = getImagColumnArray(QR);

            for (j = 0; j < n; j++) {
                update_complex(qrcolr[j], qrcoli[j], brcol, bicol, beta[j], j, 0);
            }

            // Solve R * X = Q * B, backward-subsitution B is overwriting by X
            gaussianSubstitution(false, QR, B);

            // Copy B part of interest in X
            X = resizeComplexMatrix(B, rank, n2);

        }

        var ipiv = new Uint32Array(rank);
        var i, ei;
        for (i = 0, ei = piv.length; i < ei; i++) {
            ipiv[piv[i]] = i;
        }

        return X.get([ipiv]);

    };

    var solveUnderdeterminedQR = function (A, B) {
        var QR = computeQR(A.ctranspose(), true);
        var beta = QR[1];
        var piv = QR[2];
        QR = QR[0];
        var j;

        var m = QR.getSize(0), n = QR.getSize(1), o = B.getSize(1);
        var rank = Math.min(m, n);
        var ipiv = new Uint32Array(rank);
        for (var i = 0, ei = piv.length; i < ei; i++) {
            ipiv[piv[i]] = i;
        }
        B = B.get([ipiv]);

        var QtX = gaussianSubstitution(true, QR.ctranspose(), B);

        if (QR.isreal() && B.isreal()) {

            QtX = resizeRealMatrix(QtX, m, o);
            var Xcol = getRealColumnArray(QtX);

            var qrcol = getRealColumnArray(QR);
            for (j = n - 1; j >= 0; j--) {
                update_real(qrcol[j], Xcol, beta[j], j, 0);
            }

        } else {

            if (QR.isreal()) {
                QR.toComplex();
            }
            if (QtX.isreal()) {
                QtX.toComplex();
            }

            QtX = resizeComplexMatrix(QtX, m, o);
            var Xcolr = getRealColumnArray(QtX);
            var Xcoli = getImagColumnArray(QtX);

            var qrcolr = getRealColumnArray(QR);
            var qrcoli = getImagColumnArray(QR);
            for (j = n - 1; j >= 0; j--) {
                update_complex(qrcolr[j], qrcoli[j], Xcolr, Xcoli, beta[j], j, 0);
            }

        }

        return QtX;

    };

    var solveQR = function (A, B) {
        if (A.getSize(0) < A.getSize(1)) {
            return solveUnderdeterminedQR(A, B);
        }
        return solveOverdeterminedQR(A, B);
    };


    //////////////////////////////////////////////////////////////////
    //                      MATRIX FUNCTIONS                        //
    //////////////////////////////////////////////////////////////////


    /** Mtimes operator make a matrix multiplication,
     *
     * __Also see:__
     * {@link Matrix#minus},
     * {@link Matrix#plus},
     * {@link Matrix#rdivide},
     * {@link Matrix#ldivide}.
     *
     * @param {Number|Matrix} rightOp
     *
     * @return {Matrix}
     * @matlike
     */
    Matrix_prototype.mtimes = function (B) {
        // Check if Matrix
        B = Matrix.toMatrix(B);
        if (!this.ismatrix() || !B.ismatrix()) {
            throw new Error('Matrix.mtimes: mtimes is undefined for ND array.');
        }

        var M = this.getSize(0);
        var N = this.getSize(1);
        var K = B.getSize(1);

        // Check if size are compatible
        if (M !== B.getSize(0)) {
            throw new Error('Matrix.mtimes: Matrix sizes must match.');
        }

        var complex =  (this.isreal() & B.isreal()) ? false : true;
        var Type = Tools.checkType(this.getDataType());
        var X = new Matrix([M, K], Type, complex);

        if (this.isreal()) {
            if (B.isreal()) {
                mtimes_real_real(this.getData(),
                                 getRealColumnArray(B),
                                 X.getData(),
                                 M, N, K);
            } else {
                mtimes_real_cplx(this.getData(),
                                 getRealColumnArray(B), getImagColumnArray(B),
                                 X.getRealData(), X.getImagData(),
                                 M, N, K);
            }
        } else {
            if (B.isreal()) {
                mtimes_cplx_real(this.getRealData(), this.getImagData(),
                                 getRealColumnArray(B),
                                 X.getRealData(), X.getImagData(),
                                 M, N, K);
            } else {
                mtimes_cplx_cplx(this.getRealData(), this.getImagData(),
                                 getRealColumnArray(B), getImagColumnArray(B),
                                 X.getRealData(), X.getImagData(),
                                 M, N, K);
            }
        }
        return X;
    };

    Matrix.mtimes = function (A, B) {
        return Matrix.toMatrix(A).mtimes(B);
    };

    Matrix_prototype["*"] = Matrix_prototype.mtimes;

    /** Compute the cholesky decomposition.
     *
     * @param {String} [upper='upper']
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.chol = function (lower) {
        if (!this.ismatrix()) {
            throw new Error("Matrix.chol: Input must be a matrix.");
        }
        if (!this.issquare()) {
            throw new Error("Matrix.chol: Matrix must be square.");
        }

        if (lower === 'lower') {
            lower = true;
        } else if (lower === 'upper' || lower === undefined) {
            lower = false;
        } else {
            throw new Error("Matrix.chol: Invalid parameters.");
        }

        var A = this.getCopy();

        if (A.isreal()) {
            cholesky_real(getRealColumnArray(A), A.getSize(1));
        } else {
            cholesky_cplx(getRealColumnArray(A), getImagColumnArray(A), A.getSize(1));
        }
        return lower ? A.ctranspose(A) : A;

    };

    /** Compute the Matrix inverse.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.inv = function () {
        return this.mldivide(Matrix.eye(this.getSize()));
    };

    /** Compute the Matrix determinant.
     *
     * @return {Matrix}
     *
     * @todo Check the use (and utility) of pivsign !!
     * @matlike
     */
    Matrix_prototype.det = function () {
        if (!this.issquare()) {
            throw new Error("Matrix.det: Matrix must be square.");
        }
        var paramsLU = computeLU(this);
        var LU = paramsLU.LU;
        var y, yn, dy;
        var view = LU.getView();
        var N = view.getSize(0);

        if (this.isreal()) {
            var d = paramsLU.pivsign;
            var lud = LU.getData();
            for (y = 0, yn = N * N, dy = N + 1; y < yn; y += dy) {
                d *= lud[y];
            }
            return new Matrix([1, 1], [d]);
        }

        var lurd = LU.getRealData();
        var luid = LU.getImagData();
        var dr = paramsLU.pivsign, di = 0;
        for (y = 0, yn = N * N, dy = N + 1; y < yn; y += dy) {
            dr = dr * lurd[y] - di * luid[y];
            di = dr * luid[y] + di * lurd[y];
        }


        return new Matrix([1, 1], [dr, di], true);
    };

    /** Compute the Matrix rank.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.rank = function () {
        var QR = computeQR(this, true);
        return QR[3];
    };

    /** Operator lu.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.lu = function () {
        return getLU(computeLU(this), false);
    };

    /** Operator lu with permutations.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.lup = function () {
        return getLU(computeLU(this), true);
    };

    /** Operator qr with permutations.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.qrp = function () {
        var QR = computeQR(this, true);
        return [getQ(QR), getR(QR), getP(QR)];
    };

    /** Operator qr.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.qr = function () {
        var QR = computeQR(this, false);
        return [getQ(QR), getR(QR)];
    };

    /** Operator mldivide.
     *
     * @param {Number|Matrix} rightOp
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.mldivide = function (B) {
        if (!this.ismatrix() || !B.ismatrix()) {
            throw new Error("1 Matrix.mldivide: Both arguments must be Matrix.");
        }
        if (B.getSize(0) !== this.getSize(0)) {
            throw new Error("2 Matrix.mldivide: Row dimensions must agree.");
        }
        return solveQR(this, B.getCopy());
    };

    /** Operator mrdivide.
     *
     * @param {Number|Matrix} rightOp
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.mrdivide = function (B) {

        if (!this.ismatrix() || !B.ismatrix()) {
            throw new Error("Matrix.mrdivide: Both arguments must be Matrix.");
        }
        if (B.getSize(0) !== this.getSize(0)) {
            throw new Error("Matrix.mrdivide: Row dimensions must agree.");
        }
        return solveQR(B.ctranspose(), this.ctranspose()).ctranspose();
    };

    /** Compute the bidiagonal decomposition.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.bidiag = function () {
        var UBV = computehouseBidiagonalisation(this.getCopy());
        return getUBV(UBV);
    };


    /** Computes an SVD decomposition on a given Matrix.,
     *
     * @return {Matrix[]}
     *  Array containing `U`, `S` and `V` Matrix.
     *
     *     var A = Matrix.rand(300);
     *     Tools.tic();
     *     var USV = A.svd(); var U = USV[0], S = USV[1], V = USV[2];
     *     var n = U.mtimes(S).mtimes(V.transpose()).minus(A).norm();
     *     console.log("time:", t[i] = Tools.toc(), "norm:", n);
     *
     * @author
     *  This code was imported from the [numericjs library][1]
     *  and adapted to work with Matrix class.
     *
     *  We report here the comment found in the code:
     *  _Shanti Rao sent me this routine by private email. I had to modify it
     *  slightly to work on Arrays instead of using a Matrix object.
     *  It is apparently translated [from here][2]_
     *
     *  [1]: http://www.numericjs.com/
     *  [2]: http://stitchpanorama.sourceforge.net/Python/svd.py
     *
     * @matlike
     */
    Matrix_prototype.svd = function () {

        var temp;
        // Compute the thin SVD from G. H. Golub and C. Reinsch, Numer. Math. 14, 403-420 (1970)
        var prec = Math.pow(2, -52); // assumes double prec
        var tolerance = 1.e-64 / prec;
        var itmax = 50;
        var c = 0, i = 0, j = 0, k = 0, l = 0;

        var u = this.toArray();
        var m = u.length;

        var n = u[0].length;

        if (m < n) {
            throw "Matrix.svd: Need more rows than columns";
        }

        var e = new Array(n);
        var q = new Array(n);
        for (i = 0; i < n; i++) {
            e[i] = 0;
            q[i] = 0;
        }
        var v = Matrix.zeros(n).toArray();

        var pythag = function (a, b) {
            a = Math.abs(a);
            b = Math.abs(b);
            if (a > b) {
                return a * Math.sqrt(1.0 + (b * b / a / a));
            } else if (b === 0.0) {
                return a;
            }
            return b * Math.sqrt(1.0 + (a * a / b / b));
        };

        // Householder's reduction to bidiagonal form

        var f = 0, g = 0, h = 0, x = 0, y = 0, z = 0, s = 0;
        for (i = 0; i < n; i++) {
            e[i] = g;
            s = 0;
            l = i + 1;
            for (j = i; j < m; j++) {
                s += (u[j][i] * u[j][i]);
            }
            if (s <= tolerance) {
                g = 0;
            } else {
                f = u[i][i];

                g = Math.sqrt(s);

                if (f >= 0) {
                    g = -g;
                }

                h = f * g - s;

                u[i][i] = f - g;

                for (j = l; j < n; j++) {
                    s = 0;
                    for (k = i; k < m; k++) {
                        s += u[k][i] * u[k][j];
                    }
                    f = s / h;
                    for (k = i; k < m; k++) {
                        u[k][j] += f * u[k][i];
                    }
                }
            }

            q[i] = g;
            s = 0;

            for (j = l; j < n; j++) {
                s = s + u[i][j] * u[i][j];
            }

            if (s <= tolerance) {
                g = 0;
            } else {
                f = u[i][i + 1];
                g = Math.sqrt(s);
                if (f >= 0) {
                    g = -g;
                }

                h = f * g - s;
                u[i][i + 1] = f - g;
                for (j = l; j < n; j++) {
                    e[j] = u[i][j] / h;
                }
                for (j = l; j < m; j++) {
                    s = 0;
                    for (k = l; k < n; k++) {
                        s += (u[j][k] * u[i][k]);
                    }
                    for (k = l; k < n; k++) {
                        u[j][k] += s * e[k];
                    }
                }
            }
            y = Math.abs(q[i]) + Math.abs(e[i]);
            if (y > x) {
                x = y;
            }
        }

        // accumulation of right hand gtransformations

        for (i = n - 1; i != -1; i += -1) {
            if (g !== 0.0) {
                h = g * u[i][i + 1];
                for (j = l; j < n; j++) {
                    v[j][i] = u[i][j] / h;
                }
                for (j = l; j < n; j++) {
                    s = 0;
                    for (k = l; k < n; k++) {
                        s += u[i][k] * v[k][j];
                    }
                    for (k = l; k < n; k++) {
                        v[k][j] += (s * v[k][i]);
                    }
                }
            }
            for (j = l; j < n; j++) {
                v[i][j] = 0;
                v[j][i] = 0;
            }
            v[i][i] = 1;
            g = e[i];
            l = i;
        }

        // Accumulation of left hand transformations


        for (i = n - 1; i != -1; i += -1) {
            l = i + 1;
            g = q[i];
            for (j = l; j < n; j++) {
                u[i][j] = 0;
            }
            if (g !== 0) {
                h = u[i][i] * g;
                for (j = l; j < n; j++) {
                    s = 0;
                    for (k = l; k < m; k++) {
                        s += u[k][i] * u[k][j];
                    }
                    f = s / h;
                    for (k = i; k < m; k++) {
                        u[k][j] += f * u[k][i];
                    }

                }
                for (j = i; j < m; j++) {
                    u[j][i] = u[j][i] / g;
                }
            } else {
                for (j = i; j < m; j++) {
                    u[j][i] = 0;
                }
            }
            u[i][i] += 1;
        }


        // diagonalization of the bidiagonal form
        prec = prec * x;
        var iteration;
        for (k = n - 1; k != -1; k += -1) {
            for (iteration = 0; iteration < itmax; iteration++) {
                // test f splitting
                var test_convergence = false;
                for (l = k; l != -1; l += -1) {
                    if (Math.abs(e[l]) <= prec) {
                        test_convergence = true;
                        break;
                    }
                    if (Math.abs(q[l - 1]) <= prec) {
                        break;
                    }
                }
                if (!test_convergence) {
                    // cancellation of e[l] if l>0
                    c = 0;
                    s = 1;
                    var l1 = l - 1;
                    for (i = l; i < k + 1; i++) {
                        f = s * e[i];
                        e[i] = c * e[i];
                        if (Math.abs(f) <= prec) {
                            break;
                        }
                        g = q[i];
                        h = pythag(f, g);
                        q[i] = h;
                        c = g / h;
                        s = -f / h;
                        for (j = 0; j < m; j++) {
                            y = u[j][l1];
                            z = u[j][i];
                            u[j][l1] =  y * c + (z * s);
                            u[j][i] = -y * s + (z * c);
                        }
                    }
                }
                // test f convergence
                z = q[k];
                if (l === k) {
                    // convergence
                    if (z < 0) {
                        //q[k] is made non-negative
                        q[k] = -z;
                        for (j = 0; j < n; j++) {
                            v[j][k] = -v[j][k];
                        }
                    }
                    break;
                    //break out of iteration loop and move on to next k value
                }
                if (iteration >= itmax - 1) {
                    throw 'Error: no convergence.';
                }
                // shift from bottom 2x2 minor
                x = q[l];
                y = q[k - 1];
                g = e[k - 1];
                h = e[k];
                f = ((y - z) * (y + z) + (g - h) * (g + h)) / (2 * h * y);
                g = pythag(f, 1.0);
                if (f < 0.0) {
                    f = ((x - z) * (x + z) + h * (y / (f - g) - h)) / x;
                } else {
                    f = ((x - z) * (x + z) + h * (y / (f + g) - h)) / x;
                }
                // next QR transformation
                c = 1;
                s = 1;
                for (i = l + 1; i < k + 1; i++) {
                    g = e[i];
                    y = q[i];
                    h = s * g;
                    g = c * g;
                    z = pythag(f, h);
                    e[i - 1] = z;
                    c = f / z;
                    s = h / z;
                    f = x * c + g * s;
                    g = -x * s + g * c;
                    h = y * s;
                    y = y * c;
                    for (j = 0; j < n; j++) {
                        x = v[j][i - 1];
                        z = v[j][i];
                        v[j][i - 1] = x * c + z * s;
                        v[j][i] = -x * s + z * c;
                    }
                    z = pythag(f, h);
                    q[i - 1] = z;
                    c = f / z;
                    s = h / z;
                    f = c * g + s * y;
                    x = -s * g + c * y;
                    for (j = 0; j < m; j++) {
                        y = u[j][i - 1];
                        z = u[j][i];
                        u[j][i - 1] = y * c + z * s;
                        u[j][i] = -y * s + z * c;
                    }
                }
                e[l] = 0;
                e[k] = f;
                q[k] = x;
            }
        }

        for (i = 0; i < q.length; i++) {
            if (q[i] < prec) {
                q[i] = 0;
            }
        }

        // sort eigenvalues
        for (i = 0; i < n; i++) {
            for (j = i - 1; j >= 0; j--) {
                if (q[j] < q[i]) {
                    c = q[j];
                    q[j] = q[i];
                    q[i] = c;
                    for (k = 0; k < u.length; k++) {
                        temp = u[k][i];
                        u[k][i] = u[k][j];
                        u[k][j] = temp;
                    }
                    for (k = 0; k < v.length; k++) {
                        temp = v[k][i];
                        v[k][i] = v[k][j];
                        v[k][j] = temp;
                    }
                    i = j;
                }
            }
        }

        return [Matrix.fromArray(u).transpose(),
                Matrix.diag(Matrix.toMatrix(q)),
                Matrix.fromArray(v).transpose()];
    };


})(Matrix, Matrix.prototype);

/*
(function () {
    "use strict";
    var getColumnArray = function  (ad, M, N) {
        var j, col;
        if (ad instanceof Array) {
            for (j = 0, col = []; j < N; j++) {
                col[j] = ad.slice(j * M, (j + 1) * M);
            }
        } else {
            for (j = 0, col = []; j < N; j++) {
                col[j] = ad.subarray(j * M, (j + 1) * M);
            }
        }
        return col;
    };

    var  getRow = function (ad, M, N, i, out) {
        out = out || new Float64Array(N);
        for (var j = 0, ij = i + j; j < N; j++, ij += M) {
            out[j] = ad[ij];
        }
        return out;
    };

    var rand = function (M, N) {
        var tab = new Float32Array(M * N);
        for (var i = 0; i < M * N; i++) {
            tab[i] = Math.random();
        }
        return getColumnArray(tab, M, N);
    };

    var dotproduct_real = function (a, b, N) {
        for (var i = 0, sum = 0.0; i < N; ++i) {
            sum += a[i] * b[i];
        }
        return sum;
    };

    var dotproduct_cplx = function (ar, ai, br, bi, N) {
        for (var i = 0, sumr = 0.0, sumi = 0.0; i < N; ++i) {
            var a = ar[i], b = ai[i], c = br[i], d = bi[i];
            sumr += a * c - b * d;
            sumi += a * d + b * c;
        }
        return [sumr, sumi];
    };

    var dotproduct_real_cplx = function (ar, br, bi, N) {
        for (var i = 0, sumr = 0.0, sumi = 0.0; i < N; ++i) {
            var a = ar[i];
            sumr += a * br[i];
            sumi += a * bi[i];
        }
        return [sumr, sumi];
    };

    var mtimes_real = function (a, b, c, M, N, K) {
        var i, j, row = new Float64Array(N);
        b = getColumnArray(b, N, K);
        c = getColumnArray(c, M, K);
        for (j = 0; j < M; j++) {
            row = getRow(a, M, N, j, row);
            for (i = 0; i < K; i++) {
                c[i][j] = dotproduct_real(row, b[i], N);
            }
        }
    };

    var mtimes_cplx = function (ar, ai, br, bi, cr, ci, M, N, K) {
        var i, j, dotp;
        var rowr = new Float64Array(N), rowi = new Float64Array(N);
        br = getColumnArray(br, N, K);
        bi = getColumnArray(bi, N, K);
        cr = getColumnArray(cr, M, K);
        ci = getColumnArray(ci, M, K);
        for (j = 0; j < M; j++) {
            rowr = getRow(ar, M, N, j, rowr);
            rowi = getRow(ai, M, N, j, rowi);
            for (i = 0; i < K; i++) {
                dotp = dotproduct_cplx(rowr, rowi, br[i], bi[i], N);
                cr[i][j] = dotp[0];
                ci[i][j] = dotp[1];
            }
        }
    };

    var mtimes_real_cplx = function (a, br, bi, cr, ci, M, N, K) {
        var i, j, row = new Float64Array(N), dotp;
        br = getColumnArray(br, N, K);
        bi = getColumnArray(bi, N, K);
        cr = getColumnArray(cr, M, K);
        ci = getColumnArray(ci, M, K);
        for (j = 0; j < M; j++) {
            row = getRow(a, M, N, j, row);
            for (i = 0; i < K; i++) {
                dotp = dotproduct_real_cplx(row, br[i], bi[i], N);
                cr[i][j] = dotp[0];
                ci[i][j] = dotp[1];
            }
        }
    };

    var mtimes_cplx_real = function (ar, ai, b, cr, ci, M, N, K) {
        var i, j, dotp;
        var rowr = new Float64Array(N), rowi = new Float64Array(N);
        b = getColumnArray(b, N, K);
        cr = getColumnArray(cr, M, K);
        ci = getColumnArray(ci, M, K);
        for (j = 0; j < M; j++) {
            rowr = getRow(ar, M, N, j, rowr);
            rowi = getRow(ai, M, N, j, rowi);
            for (i = 0; i < K; i++) {
                dotp = dotproduct_real_cplx(b[i], rowr, rowi, N);
                cr[i][j] = dotp[0];
                ci[i][j] = dotp[1];
            }
        }
    };

    var dotproduct_check = function () {
        var a = [1, 2, 3, 4], b = [5, 4, 3, 2];
        var t1 = dotproduct_real(a, b, 4);
        var t2 = dotproduct_cplx(a, b, b, a, 4);
        var t3 = dotproduct_real_cplx(a, b, b, 4);
        if (t1 !== 30 || t2[0] !== 0 || t2[1] !== 84 || t3[0] !== 30 || t3[1] !== 30) {
            throw new Error("Dot product change!");
        }
    };

    if (0) {
        Matrix.mtimes = function (A, B) {
            var M = A.getSize(0), N = A.getSize(1), K = B.getSize(1);
            var C = Matrix.zeros(M, K);
            var a, ar, ai, b, br, bi, c, cr, ci;
            if (A.isreal()) {
                a = A.getData();
                if (B.isreal()) {
                    b = B.getData();
                    c = C.getData();
                    mtimes_real(a, b, c, M, N, K);
                } else {
                    br = B.getRealData();
                    bi = B.getImagData();
                    C.toComplex();
                    cr = C.getRealData();
                    ci = C.getImagData();
                    mtimes_real_cplx(a, br, bi, cr, ci, M, N, K);
                }
            } else {
                ar = A.getRealData();
                ai = A.getImagData();
                C.toComplex();
                cr = C.getRealData();
                ci = C.getImagData();
                if (B.isreal()) {
                    b = B.getData();
                    mtimes_cplx_real(ar, ai, b, cr, ci, M, N, K);
                } else {
                    br = B.getRealData();
                    bi = B.getImagData();
                    mtimes_cplx(ar, ai, br, bi, cr, ci, M, N, K);
                }
            }
            return C;
        };
        Matrix_prototype.mtimes = function (B) {
            return Matrix.mtimes(this, B);
        };
    }

    var mtimes_check = function () {
        var c, cr, ci, r, rr, ri, t, tr, ti;
        var a = new Int8Array([6, 6, 1, 7, -8, 2, 0, -2, 1]);
        var b = new Int8Array([-6, 2, 3, -9, -5, 8, 2, -1, 4]);

        c = new Int8Array(9);
        r = [-22, -58, 1, -89, -30, -11, 5, 12, 4];
        mtimes_real(a, b, c, 3, 3, 3);
        if (!Tools.checkArrayEquals(c, r)) {
            throw new Error("Error mtimes real.");
        }

        cr = new Int16Array(9);
        ci = new Int16Array(9);
        rr = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        ri = [-44, -116, 2, -178, -60, -22, 10, 24, 8];
        mtimes_cplx(a, a, b, b, cr, ci, 3, 3, 3);
        if (!Tools.checkArrayEquals(cr, rr) || !Tools.checkArrayEquals(ci, ri)) {
            throw new Error("Error mtimes complex.");
        }

        cr = new Int16Array(9);
        ci = new Int16Array(9);
        mtimes_real_cplx(a, b, b, cr, ci, 3, 3, 3);
        if (!Tools.checkArrayEquals(cr, r) || !Tools.checkArrayEquals(ci, r)) {
            throw new Error("Error mtimes real/complex.");
        }

        cr = new Int16Array(9);
        ci = new Int16Array(9);
        mtimes_cplx_real(a, b, b, cr, ci, 3, 3, 3);
        ri = [24, -25, 10, 115, -1, -35, 5, 5, 14];
        if (!Tools.checkArrayEquals(cr, r) || !Tools.checkArrayEquals(ci, ri)) {
            throw new Error("Error mtimes complex/real.");
        }
    };

    Matrix._benchmarkMtimes = function (M, N, K) {
        M = M || 1000;
        N = N || M;
        K = K || M;

        var Ar = Matrix.rand(M, N), Br = Matrix.rand(N, K);
        var Ai = Matrix.rand(M, N), Bi = Matrix.rand(N, K);

        var r1, r2, rr1, ri1, rr2, ri2;
        Tools.tic();
        r1 = Matrix.mtimes(Ar, Br).getData();
        console.log("NEW mtimes REAL/REAL:", Tools.toc());
        // Tools.tic();
        // r2 = Ar.mtimes(Br).getData();
        // console.log("OLD mtimes REAL/REAL:", Tools.toc());
        // if (!Tools.checkArrayEquals(r1, r2)) {
        // throw new Error("Error mtimes complex.");
        // }

        var Ac = Matrix.complex(Ar, Ai), Bc = Matrix.complex(Br, Bi);
        Tools.tic();
        r1 = Matrix.mtimes(Ac, Bc);
        console.log("NEW mtimes CPLX/CPLX:", Tools.toc());

         // rr1 = r1.getRealData();
         // ri1 = r1.getImagData();
         // Tools.tic();
         // r2 = Ac.mtimes(Bc);
         // console.log("OLD mtimes CPLX/CPLX:", Tools.toc());
         // rr2 = r2.getRealData();
         // ri2 = r2.getImagData();
         // if (!Tools.checkArrayEquals(rr1, rr2) || !Tools.checkArrayEquals(rr1, rr2)) {
         // throw new Error("Error mtimes complex.");
         // }

    };

    Matrix._testsMtimes = function () {
        dotproduct_check();
        mtimes_check();_
    };

})();
*/

