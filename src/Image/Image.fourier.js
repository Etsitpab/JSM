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
    
    // Prime numbers from 2 to 3257
    var primes = Tools.arrayFromBase64(
        "AgADAAUABwALAA0AEQATABcAHQAfACUAKQArAC8ANQA7AD0AQwBHAEkATwBTAFkAYQBlAGcAawBt\
        AHEAfwCDAIkAiwCVAJcAnQCjAKcArQCzALUAvwDBAMUAxwDTAN8A4wDlAOkA7wDxAPsAAQEHAQ0B\
        DwEVARkBGwElATMBNwE5AT0BSwFRAVsBXQFhAWcBbwF1AXsBfwGFAY0BkQGZAaMBpQGvAbEBtwG7\
        AcEByQHNAc8B0wHfAecB6wHzAfcB/QEJAgsCHQIjAi0CMwI5AjsCQQJLAlECVwJZAl8CZQJpAmsC\
        dwKBAoMChwKNApMClQKhAqUCqwKzAr0CxQLPAtcC3QLjAucC7wL1AvkCAQMFAxMDHQMpAysDNQM3\
        AzsDPQNHA1UDWQNbA18DbQNxA3MDdwOLA48DlwOhA6kDrQOzA7kDxwPLA9ED1wPfA+UD8QP1A/sD\
        /QMHBAkEDwQZBBsEJQQnBC0EPwRDBEUESQRPBFUEXQRjBGkEfwSBBIsEkwSdBKMEqQSxBL0EwQTH\
        BM0EzwTVBOEE6wT9BP8EAwUJBQsFEQUVBRcFGwUnBSkFLwVRBVcFXQVlBXcFgQWPBZMFlQWZBZ8F\
        pwWrBa0FswW/BckFywXPBdEF1QXbBecF8wX7BQcGDQYRBhcGHwYjBisGLwY9BkEGRwZJBk0GUwZV\
        BlsGZQZ5Bn8GgwaFBp0GoQajBq0GuQa7BsUGzQbTBtkG3wbxBvcG+wb9BgkHEwcfBycHNwdFB0sH\
        TwdRB1UHVwdhB20Hcwd5B4sHjQedB58HtQe7B8MHyQfNB88H0wfbB+EH6wftB/cHBQgPCBUIIQgj\
        CCcIKQgzCD8IQQhRCFMIWQhdCF8IaQhxCIMImwifCKUIrQi9CL8IwwjLCNsI3QjhCOkI7wj1CPkI\
        BQkHCR0JIwklCSsJLwk1CUMJSQlNCU8JVQlZCV8JawlxCXcJhQmJCY8JmwmjCakJrQnHCdkJ4wnr\
        Ce8J9Qn3Cf0JEwofCiEKMQo5Cj0KSQpXCmEKYwpnCm8KdQp7Cn8KgQqFCosKkwqXCpkKnwqpCqsK\
        tQq9CsEKzwrZCuUK5wrtCvEK8woDCxELFQsbCyMLKQstCz8LRwtRC1cLXQtlC28LewuJC40LkwuZ\
        C5sLtwu5C8MLywvPC90L4QvpC/UL+wsHDAsMEQwlDC8MMQxBDFsMXwxhDG0Mcwx3DIMMiQyRDJUM\
        nQyzDLUMuQw=", Uint16Array);
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

    // var a = Matrix.ones(5).cumsum(0).cumsum(1).display(); af = a.fft2().display(); af.fftshift().display()
    Matrix.prototype.fftshift = function (X) {
        var out = Matrix.zeros(this.size());
        if (this.ndims() === 2) {
            var h = this.getSize(0), w = this.getSize(1);
            var ySel0 = [0, Math.floor(h / 2)], ySel1 = [Math.ceil(h / 2), h - 1];
            var xSel0 = [0, Math.floor(w / 2)], xSel1 = [Math.ceil(w / 2), w - 1];
            out.set(ySel0, xSel0, this.get(ySel0, xSel0).get([-1, 0], [-1, 0]).conj());
            out.set(ySel0, xSel1, this.get(ySel0, xSel1).get([-1, 0], [-1, 0]).conj());
            out.set(ySel1, xSel0, this.get(ySel1, xSel0).get([-1, 0], [-1, 0]).conj());
            out.set(ySel1, xSel1, this.get(ySel1, xSel1).get([-1, 0], [-1, 0]).conj());
        }
        return out;            
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
