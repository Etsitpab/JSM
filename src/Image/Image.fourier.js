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

//////////////////////////////////////////////////////////////////
//                 FAST FOURIER TRANSFORM MODULE                //
//////////////////////////////////////////////////////////////////


(function (Matrix, Matrix_prototype) {
    'use strict';

    var primes = new Uint16Array([
        2, 3, 5, 7, 11, 13, 17, 19, 23, 29,
        31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
        73, 79, 83, 89, 97, 101, 103, 107, 109, 113,
        127, 131, 137, 139, 149, 151, 157, 163, 167, 173,
        179, 181, 191, 193, 197, 199, 211, 223, 227, 229,
        233, 239, 241, 251, 257, 263, 269, 271, 277, 281,
        283, 293, 307, 311, 313, 317, 331, 337, 347, 349,
        353, 359, 367, 373, 379, 383, 389, 397, 401, 409,
        419, 421, 431, 433, 439, 443, 449, 457, 461, 463,
        467, 479, 487, 491, 499, 503, 509, 521, 523, 541,
        547, 557, 563, 569, 571, 577, 587, 593, 599, 601,
        607, 613, 617, 619, 631, 641, 643, 647, 653, 659,
        661, 673, 677, 683, 691, 701, 709, 719, 727, 733,
        739, 743, 751, 757, 761, 769, 773, 787, 797, 809,
        811, 821, 823, 827, 829, 839, 853, 857, 859, 863,
        877, 881, 883, 887, 907, 911, 919, 929, 937, 941,
        947, 953, 967, 971, 977, 983, 991, 997, 1009, 1013,
        1019, 1021, 1031, 1033, 1039, 1049, 1051, 1061, 1063, 1069,
        1087, 1091, 1093, 1097, 1103, 1109, 1117, 1123, 1129, 1151,
        1153, 1163, 1171, 1181, 1187, 1193, 1201, 1213, 1217, 1223,
        1229, 1231, 1237, 1249, 1259, 1277, 1279, 1283, 1289, 1291,
        1297, 1301, 1303, 1307, 1319, 1321, 1327, 1361, 1367, 1373,
        1381, 1399, 1409, 1423, 1427, 1429, 1433, 1439, 1447, 1451,
        1453, 1459, 1471, 1481, 1483, 1487, 1489, 1493, 1499, 1511,
        1523, 1531, 1543, 1549, 1553, 1559, 1567, 1571, 1579, 1583,
        1597, 1601, 1607, 1609, 1613, 1619, 1621, 1627, 1637, 1657,
        1663, 1667, 1669, 1693, 1697, 1699, 1709, 1721, 1723, 1733,
        1741, 1747, 1753, 1759, 1777, 1783, 1787, 1789, 1801, 1811,
        1823, 1831, 1847, 1861, 1867, 1871, 1873, 1877, 1879, 1889,
        1901, 1907, 1913, 1931, 1933, 1949, 1951, 1973, 1979, 1987,
        1993, 1997, 1999, 2003, 2011, 2017, 2027, 2029, 2039, 2053,
        2063, 2069, 2081, 2083, 2087, 2089, 2099, 2111, 2113, 2129,
        2131, 2137, 2141, 2143, 2153, 2161, 2179, 2203, 2207, 2213,
        2221, 2237, 2239, 2243, 2251, 2267, 2269, 2273, 2281, 2287,
        2293, 2297, 2309, 2311, 2333, 2339, 2341, 2347, 2351, 2357,
        2371, 2377, 2381, 2383, 2389, 2393, 2399, 2411, 2417, 2423,
        2437, 2441, 2447, 2459, 2467, 2473, 2477, 2503, 2521, 2531,
        2539, 2543, 2549, 2551, 2557, 2579, 2591, 2593, 2609, 2617,
        2621, 2633, 2647, 2657, 2659, 2663, 2671, 2677, 2683, 2687,
        2689, 2693, 2699, 2707, 2711, 2713, 2719, 2729, 2731, 2741,
        2749, 2753, 2767, 2777, 2789, 2791, 2797, 2801, 2803, 2819,
        2833, 2837, 2843, 2851, 2857, 2861, 2879, 2887, 2897, 2903,
        2909, 2917, 2927, 2939, 2953, 2957, 2963, 2969, 2971, 2999,
        3001, 3011, 3019, 3023, 3037, 3041, 3049, 3061, 3067, 3079,
        3083, 3089, 3109, 3119, 3121, 3137, 3163, 3167, 3169, 3181,
        3187, 3191, 3203, 3209, 3217, 3221, 3229, 3251, 3253, 3257
    ]);
    var SIZE_PRIME = primes.length;

    /**
     * decompose n into prime factors and returns the number of terms
     * tab should be large enough to contain all factors (32 seems enough)
     * Note: returns 0 if n==1, and do not work if n > MAX_PRIME^2
     */
    var decompose = function (n) {
        if (n === 1) {
            return 0;
        }
        var tab = [], count, i, p;

        // search factors
        for (count = i = 0; i < SIZE_PRIME; i++) {
            if ((n % primes[i]) === 0) {
                p = primes[i];
                do {
                    tab[count] = p;
                    count++;
                    n = n / p;
                } while ((n % p) === 0);
            }
        }
        // If n is prime
        if (n !== 1) {
            tab[count] = n;
            count++;
        }

        return tab;
    };

    var SWAP = function (tab, a, b) {
        var tmp = tab[a];
        tab[a] = tab[b];
        tab[b] = tmp;
    };

    var storeResult = function (data, real, imag, isign) {
        var n = data.length / 2, i, j;
        if (isign === 1) {
            for (i = 0, j = 0; i < n; i++) {
                real[i] = data[j++];
                imag[i] = -data[j++];
            }
        } else {
            var i_n = 1 / n;
            for (i = 0, j = 0; i < n; i++) {
                real[i] = data[j++] * i_n;
                imag[i] = -data[j++] * i_n;
            }
        }
    };

    var storeInput = function (Xr, Xi) {
        var size = Xr.length, i, j;
        var data = new Float64Array(2 * size);
        if (Xi) {
            for (i = 0, j = 0; i < size; i++) {
                data[j++] = Xr[i];
                data[j++] = -Xi[i];
            }
        } else {
            for (i = 0, j = 0; i < size; i++, j++) {
                data[j++] = Xr[i];
            }
        }
        return data;
    };

    // Faster algorithm when the signal size is a power of two (original code)
    var fft1d_2n = function (Xr, Xi, isign) {

        var m, l, j, istep, i;
        var wtemp, wr, wpr, wpi, wi, theta;
        var tempr, tempi;

        var size = Xr.length, data = storeInput(Xr, Xi);

        // Compute FFT of "data" array
        var n = size << 1;
        for (i = 1, j = 1; i < n; i += 2) {
            if (j > i) {
                SWAP(data, j - 1, i - 1);
                SWAP(data, j, i);
            }
            m = n >> 1;
            while (m >= 2 && j > m) {
                j = j - m;
                m >>= 1;
            }
            j = j + m;
        }

        var mmax = 2;

        while (n > mmax) {
            istep = 2 * mmax;
            theta = 2 * Math.PI / (isign * mmax);
            wtemp = Math.sin(0.5 * theta);
            wpr = -2.0 * wtemp * wtemp;
            wpi = Math.sin(theta);
            wr = 1.0;
            wi = 0.0;
            for (m = 1; m < mmax; m += 2) {
                for (i = m - 1; i <= n - 1; i += istep) {
                    j = i + mmax;
                    tempr = wr * data[j] - wi * data[j + 1];
                    tempi = wr * data[j + 1] + wi * data[j];
                    data[j] = data[i] - tempr;
                    data[j + 1] = data[i + 1] - tempi;
                    data[i] += tempr;
                    data[i + 1] += tempi;
                }
                wr = (wtemp = wr) * wpr - wi * wpi + wr;
                wi = wi * wpr + wtemp * wpi + wi;
            }
            mmax = istep;
        }
        return data;
    };

    var fft1d_full = function (Xr, Xi, isign, tab) {

        var size = Xr.length, i;

        var mc = new Float64Array(size), ms = new Float64Array(size);
        var PI2IN = 2 * Math.PI / size;
        for (i = 0; i < size; i++) {
            mc[i] = Math.cos(i * PI2IN);
            ms[i] = isign * Math.sin(i * PI2IN);
        }

        var data = storeInput(Xr, Xi), d = new Float64Array(2 * size);

        var j, k, l, p, nsmp, mp;
        var m = 1, e, t = tab.length;
        for (e = 0; e < t; e++) {
            p = tab[e];
            nsmp = size / m / p;
            mp = m * p;
            for (k = 0; k < 2 * size; k++) {
                d[k] = 0;
            }
            for (j = 0; j < p; j++) {
                for (l = 0; l < mp; l++) {
                    var indice = ((l * j) % mp) * nsmp;
                    var wljx = mc[indice], wljy = ms[indice];
                    var idxd = 2 * nsmp * l, idxs = 2 * nsmp * (j + (l % m) * p);
                    for (i = 0; i < nsmp; i++, idxd += 2, idxs += 2) {
                        d[idxd] += data[idxs] * wljx - data[idxs + 1] * wljy;
                        d[idxd + 1] += data[idxs] * wljy + data[idxs + 1] * wljx;
                    }
                }
            }
            var tmpf = data;
            data = d;
            d = tmpf;
            m *= p;
        }
        return data;
    };

    var fft1d = function (Xr, Xi, Yr, Yi, inverse) {
        var n = Xr.length, tab = decompose(n), t = tab.length;
        var isign = !inverse ? 1 : -1, data;
        if (n > 1 && tab[t - 1] !== 2) {
            data = fft1d_full(Xr, Xi, isign, tab);
        } else {
            data = fft1d_2n(Xr, Xi, isign);
        }
        return storeResult(data, Yr, Yi, isign);
    };

    var matrix_fft = function (X, inverse) {
        if (X.isreal()) {
            X.toComplex();
        }
        // Ouptut matrix
        var Y = new Matrix(X.getSize(), Float64Array, true);
        var Xr = X.getRealData(), Xi = X.getImagData();
        var Yr = Y.getRealData(), Yi = Y.getImagData();

        // This will apply the fft on each column vector of the matrix
        var j, _j, m = X.getSize(0), n = X.numel() / m;
        for (j = 0, _j = 0; j < n; j++, _j += m) {
            var cXr = Xr.subarray(_j, m + _j), cXi = Xi.subarray(_j, m + _j);
            var cYr = Yr.subarray(_j, m + _j), cYi = Yi.subarray(_j, m + _j);
            fft1d(cXr, cXi, cYr, cYi, inverse);
        }
        return Y;
    };

    /** Compute the FFT of a vector.
     *
     * __See also :__
     * {@link Matrix#ifft},
     * {@link Matrix#fft2}.
     *
     *     var sz = 1024;
     *     var ar = Matrix.rand(sz, 1), ai = Matrix.rand(sz, 1);
     *     var a = Matrix.complex(ar, ai);
     *
     *     Tools.tic();
     *     for (var i = 0; i < sz; i++) {
     *       var fft = a.fft();
     *       var ifft = fft.ifft();
     *     }
     *     var t = Tools.toc()
     *     var err = a['-'](ifft).abs().mean().getDataScalar();
     *     console.log("Average Error", err, "Time:", t);
     *
     * @author
     *  This code came from the Megawave image processing toolbox.
     *  The authors credited for this module are :
     *  Chiaa Babya, Jacques Froment, Lionel Moisan and Said Ladjal.
     */
    Matrix_prototype.fft = function () {
        return matrix_fft(this, false);
    };
    Matrix.fft = function (X) {
        return matrix_fft(Matrix.toMatrix(X), false);
    };
    Matrix_prototype.fft2 = function () {
        var Y = matrix_fft(this, false);
        Y = matrix_fft(Y.transpose(), false);
        return Y.transpose();
    };
    /** Compute the 2D FFT of a matrix.
     *
     * __See also :__
     * {@link Matrix#fft},
     * {@link Matrix#ifft2}.
     */
    Matrix.fft2 = function (X) {
        var Y = matrix_fft(Matrix.toMatrix(X), false);
        Y = matrix_fft(Y.transpose(), false);
        return Y.transpose();
    };

    /** Compute the inverse FFT of a vector.
     *
     * __See also :__
     * {@link Matrix#fft},
     * {@link Matrix#fft2}
     *
     * @author
     *  This code came from the Megawave image processing toolbox.
     *  The authors credited for this module are :
     *  Chiaa Babya, Jacques Froment, Lionel Moisan and Said Ladjal.
     */
    Matrix_prototype.ifft = function () {
        return matrix_fft(this, true);
    };
    Matrix.ifft = function (X) {
        return matrix_fft(Matrix.toMatrix(X), true);
    };
    /** Compute the inverse 2D FFT of a matrix.
     *
     * __See also :__
     * {@link Matrix#fft2},
     * {@link Matrix#ifft}.
     */
    Matrix_prototype.ifft2 = function () {
        return this.fft().transpose().fft().transpose();
    };
    Matrix.ifft2 = function (X) {
        return Matrix.toMatrix(X).ifft().transpose().ifft().transpose();
    };

})(Matrix, Matrix.prototype);
