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

    Matrix._benchmarkColorspaces = function () {

        function rand(M) {
            var i, tab = new Float32Array(M);
            for (i = 0; i < M; i++) {
                tab[i] = (Math.random() * 32 | 0) / 31;
            }
            return tab;
        }
        function error(a, b) {
            var i, err, N = a.length;
            for (i = 0, err = 0.0; i < N; i++) {
                var tmp = a[i] - b[i];
                err += tmp * tmp;
            }
            return err / N;
        }
        var testcs = function (csin, csout, N) {
            N = N || 1e6;
            var test = function (nc, sc, sp, m) {
                var input = rand(nc * N);
                var input_backup = new Float32Array(input);
                var t1 = new Date().getTime();
                Matrix.Colorspaces[csin + " to " + csout](input, N, sc, sp);
                var t2 = new Date().getTime();
                Matrix.Colorspaces[csout + " to " + csin](input, N, sc, sp);
                var t3 = new Date().getTime();
                var err = error(input, input_backup) < 1e-10;
                console.log(m, t2 - t1, t3 - t2, err ? "OK" : "PROBLEM! " + error(input, input_backup));
            };
            // CASE RGB RGB
            console.log("\nConversion from " +  csin + " to " + csout);
            test(3, 1, 3, "\tCASE RGB RGB        ");
            test(4, 1, 3, "\tCASE RGBA RGBA      ");
            test(3, N, 1, "\tCASE RRR GGG BBB    ");
            test(4, N, 1, "\tCASE RRR GGG BBB AAA");
        };
        var testcsmatrix = function (mat, imat, N) {
            N = N || 1e6;
            var test = function (nc, sc, sp, mes) {
                var input = rand(nc * N);
                var input_backup = new Float32Array(input);
                var t1 = new Date().getTime();
                Matrix.Colorspaces.matrix(input, mat, N, sc, sp);
                var t2 = new Date().getTime();
                Matrix.Colorspaces.matrix(input, imat, N, sc, sp);
                var t3 = new Date().getTime();
                var err = error(input, input_backup) < 1e-14;
                console.log(mes, t2 - t1, t3 - t2, err ? "OK" : "PROBLEM!");
            };
            // CASE RGB RGB
            console.log("\nConversion from matrix to matrix");
            test(3, 1, 3, "\tCASE RGB RGB        ");
            test(4, 1, 3, "\tCASE RGBA RGBA      ");
            test(3, N, 1, "\tCASE RRR GGG BBB    ");
            test(4, N, 1, "\tCASE RRR GGG BBB AAA");
        };

        // Usual color representations
        testcs("Lab", "Lch");
        testcs("RGB", "Lch");
        testcs("RGB", "Luv");
        testcs("RGB", "rgY");
        testcs("RGB", "xyY");
        testcs("RGB", "1960 uvY");
        testcs("RGB", "1976 u'v'Y");
        testcs("RGB", "Lab");
        testcs("RGB", "XYZ");
        testcs("LinearRGB", "XYZ");
        testcs("RGB", "RGB");
        testcs("LinearRGB", "rgY");
        testcs("RGB", "HSV");
        testcs("RGB", "HSL");
        testcs("RGB", "HSI");
        testcs("RGB", "CMY");
        testcs("RGB", "Opponent");
        testcs("RGB", "Ohta");
        testcs("LinearRGB", "sRGB");

        // CIE colorspace
        testcs("RGB", "XYZ");
        testcs("XYZ", "Lab");
        testcs("xyY", "1960 uvY");
        testcs("xyY", "1976 u'v'Y");
        testcs("1976 u'v'Y", "1960 uvY");

        // For these functions the test function doesn't make sense
        // testcs("rgY", "xyY");
        // testcs("XYZ", "xyY");
        // testcs("XYZ", "Luv");
        // testcs("XYZ", "1960 uvY");
        testcs("XYZ", "1976 u'v'Y");

        // Apply a linear 3x3 transformation
        var m1, m2;
        m1 = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
        testcsmatrix(m1, m1);
        m1 = new Float32Array([1, 1, -1, 1, 0, 2, 1, -1, -1]);
        m2 = new Float32Array([1 / 3, 1 / 3, 1 / 3, 1 / 2, 0, -1 / 2, -1 / 6, 1 / 3, -1 / 6]);
        testcsmatrix(m1, m2);
    };

    Matrix._benchmarkSolveur = function (sz) {

        sz = sz || 300;
        var tic = Tools.tic, toc = Tools.toc;

        function display(A, args) {
            var Areal = A.isreal() ? "REAL" : "CPLX";
            console.log("\tCase " + Areal + ", Residual: ", args[1], "Time:", args[0]);
        }

        var Bench = {

            "CHOLESKY Upper Decomposition": function (A) {
                tic();
                var G = A.chol('upper');
                var time = toc();
                var residual = G.ctranspose().mtimes(G).minus(A).norm();
                return [time, residual];
            },

            "CHOLESKY Lower Decomposition": function (A) {
                tic();
                var G = A.chol('lower');
                var time = toc();
                var residual = G.mtimes(G.ctranspose()).minus(A).norm();
                return [time, residual];
            },

            "LU Decomposition": function (A) {
                tic();
                var LU = A.lu(), L = LU[0], U = LU[1];
                var time = toc();
                var residual = L.mtimes(U).minus(A).norm();
                return [time, residual];
            },

            "LUP Decomposition": function (A) {
                tic();
                var LU = A.lup(), L = LU[0], U = LU[1], P = LU[2];
                var time = toc();
                var residual = L.mtimes(U).minus(P.mtimes(A)).norm();
                return [time, residual];
            },

            "QR Decomposition": function (A) {
                tic();
                var QR = A.qr(), Q = QR[0], R = QR[1];
                var time = toc();
                var residual = Q.mtimes(R).minus(A).norm();
                return [time, residual];
            },

            "QRP Decomposition": function (A) {
                tic();
                var QR = A.qrp(), Q = QR[0], R = QR[1], P = QR[2];
                var time = toc();
                var residual = Q.mtimes(R).minus(A.mtimes(P)).norm();
                return [time, residual];
            },
            /*
            "LU Inversion": function (A) {
                tic();
                var eye = Matrix.eye(A.getSize(0));
                var iA = solveLU(A, eye);
                var time = toc();
                var residual = A.mtimes(iA).minus(eye).norm();
                return [time, residual];
            },
             */
            "QR Inversion": function (A) {
                tic();
                var eye = Matrix.eye(A.getSize(0));
                var iA = A.mldivide(eye);
                var time = toc();
                var residual = A.mtimes(iA).minus(eye).norm();
                return [time, residual];
            },

            "BIDIAG Decomposition": function (A) {
                tic();
                var UBV = A.bidiag();
                var time = toc();
                var U = UBV[0], B = UBV[1], V = UBV[2];
                var residual = U.mtimes(B).mtimes(V).minus(A).norm();
                return [time, residual];
            }

        };

        var C = Matrix.complex(Matrix.randi(9, sz), Matrix.randi(9, sz));
        var C_real = C.real();
        var CCt = C.mtimes(C.ctranspose());
        var CCt_real = C_real.mtimes(C_real.transpose());

        var i;
        for (i in Bench) {
            if (Bench.hasOwnProperty(i)) {
                console.log(i);
                var realCase = Bench[i](CCt_real);
                display(CCt_real, realCase);
                var cplxCase = Bench[i](CCt);
                display(CCt, cplxCase);
            }
        }
    };

    Matrix._benchmarkSVD = function () {
        var i, t = [];
        for (i = 0; i < 1; i++) {
            var A = Matrix.rand(300);
            Tools.tic();
            var USV = A.svd(), U = USV[0], S = USV[1], V = USV[2];
            var norm = U.mtimes(S).mtimes(V.transpose()).minus(A).norm();
            console.log("time:", t[i] = Tools.toc(), "norm:", norm);
        }
    };

    Matrix._benchmarkWavelets = function (N, name, dim) {
        N = N || 100;
        name = name || 'haar';
        dim = dim || 1;

        var s, wt, out, time, psnr;
        var SQN = Math.round(Math.pow(N * N, 1 / 4) / 2) * 2;
        s = Matrix.ones(SQN, SQN, SQN, SQN).cumsum(dim)["-"](1);
        Tools.tic();
        wt = Matrix.dwt(s, name, dim);
        out = Matrix.idwt(wt, name, dim);
        time = Tools.toc();
        psnr = Matrix.psnr(s, out).getDataScalar().toFixed(2) + "dB";
        console.log("DWT 1D decomposotion/recomposition", "PSNR:", psnr, "Time:", time);

        s = Matrix.ones(N, N, 3).cumsum(0)["-"](1);
        Tools.tic();
        wt = Matrix.dwt2(s, name);
        out = Matrix.idwt2(wt, name);
        time = Tools.toc();
        psnr = Matrix.psnr(s, out).getDataScalar().toFixed(2) + "dB";
        console.log("DWT 2D decomposotion/recomposition", "PSNR:", psnr, "Time:", time);

        Tools.tic();
        wt = Matrix.dwt(s, name, 0);
        var wt1 = Matrix.dwt(wt[0], name, 1);
        var wt2 = Matrix.dwt(wt[1], name, 1);
        var iwt1 = Matrix.idwt(wt1, name, 1);
        var iwt2 = Matrix.idwt(wt2, name, 1);
        out = Matrix.idwt([iwt1, iwt2], name, 0);
        time = Tools.toc();
        psnr = Matrix.psnr(s, out).getDataScalar().toFixed(2) + "dB";
        console.log("DWT 2D decomposotion/recomposition from DWT 1D", "PSNR:", psnr, "Time:", time);
    };

    Matrix._benchmarkFourier = function (N) {
        N = N || 10;
        var s, fft, out, time, l2;
        var SQN = Math.round(Math.sqrt(N));
        s = Matrix.complex(Matrix.randi(9, N, 1), Matrix.randi(9, N, 1));
        Tools.tic();
        fft = Matrix.fft(s);
        out = Matrix.ifft(fft);
        time = Tools.toc();
        l2 = s["-"](out)[".^"](2).abs().mean().getDataScalar();
        console.log("FFT 1D decomposotion/recomposition", "L2:", l2, "Time:", time);

        s = Matrix.randi(9, N, N);
        Tools.tic();
        fft = Matrix.fft2(s);
        out = Matrix.ifft2(fft);
        time = Tools.toc();
        l2 = s["-"](out)[".^"](2).mean().getDataScalar();
        console.log("FFT 2D decomposotion/recomposition", "PSNR:", l2, "Time:", time);
    };

    Matrix._benchmark = function () {
        var i;
        for (i in Matrix) {
            if (Matrix.hasOwnProperty(i) && i.match(/benchmark/)) {
                console.log(i);
                //Matrix[i]();
            }
        }
    }
})(Matrix, Matrix.prototype);
