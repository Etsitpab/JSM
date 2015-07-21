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
            N = N || 1e5;
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

    Matrix._benchmarkSolver = function (sz) {

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

    var log = function (msg, psnr, time) {
        if (psnr < 100) {
            console.error(msg, "PSNR:", parseFloat(psnr.toFixed(2)), "dB", "Time:", time);
            return -1;
        } else if (psnr !== undefined && time !== undefined){
            console.log(msg, "PSNR:", parseFloat(psnr.toFixed(2)), "dB", "Time:", time);
        } else if (psnr === undefined && time !== undefined) {
            console.log(msg, "Time:", time);
        } else if (psnr === undefined && time === undefined) {
            console.log(msg);
        }
    };

    Matrix._benchmarkWavelets = function (wNames, wModes, testMode) {
        if (testMode === "fast") {
            wNames = ["haar", "sym2", "coif1", "sym4"];
            wModes = ["sym", "per"];
        }
        wNames = wNames || [
            'haar',
            'sym2', 'sym4', 'sym8',
            'db2', 'db4', 'db8',
            'coif1', 'coif2', 'coif4', 'coif4', 
            'bi13', 'bi31', 'bi68',
            'rbio31', 'rbio33', 'rbio35', 'rbio39',
            'cdf97'
        ]
        wModes = wModes || [
            "sym", "symw", "per", "zpd", "nn"
        ];
        var test_wavedecrec = function (s, N, name) {
            var test = function (dim) {
                Tools.tic();
                var wt = Matrix.wavedec(s, N, name, dim);
                var iwt = Matrix.waverec(wt, name, dim);
                var time = Tools.toc();
                var psnr = Matrix.psnr(s, iwt).getDataScalar();
                return {
                    psnr: psnr,
                    time: time
                };
            };
            var res0 = test(0), res1 = test(1);
            return {
                psnr: Math.min(res0.psnr, res1.psnr),
                time: Math.round((res0.time + res1.time) / 2)
            };
        };
        var test_upwlev = function (s, N, name) {
            var test = function (dim) {
                Tools.tic();
                var wt = Matrix.wavedec(s, N, name, dim);
                for (var n = 0; n < N; n++) {
                    wt = Matrix.upwlev(wt, name, dim);
                }
                var time = Tools.toc();
                return {
                    psnr: Matrix.psnr(wt[0], s).getDataScalar(),
                    time: time
                };
            };
            var res0 = test(0), res1 = test(1);
            return {
                psnr: Math.min(res0.psnr, res1.psnr),
                time: Math.round((res0.time + res1.time) / 2)
            };
        }
        var test_wrcoef = function (s, N, name) {
            var M = 0;
            var test = function (dim) {
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
            }
            var res0 = test(0), res1 = test(1);
            return {
                psnr: Math.min(res0.psnr, res1.psnr),
                time: Math.round((res0.time + res1.time) / 2)
            };
        };
        var test_wavedecrec2 = function (s, N, name) {
            Tools.tic();
            var wt2 = Matrix.wavedec2(s, N, name);
            var iwt2 = Matrix.waverec2(wt2, name);
            var time = Tools.toc();
            var psnr = Matrix.psnr(s, iwt2).getDataScalar();
            return {
                psnr: psnr,
                time: time
            };
        };
        var test_upwlev2 = function (s, N, name) {
            Tools.tic();
            var wt = Matrix.wavedec2(s, N, name);
            for (var n = 0; n < N; n++) {
                wt = Matrix.upwlev2(wt, name);
            }
            var rec = Matrix.appcoef2(wt, name, 0);
            var time = Tools.toc();
            return {
                psnr: Matrix.psnr(rec, s).getDataScalar(),
                time: time
            };
        };
        var test_wrcoef2 = function (s, N, name) {
            var M = 0;
            Tools.tic();
            var wt = Matrix.wavedec2(s, N, name);
            var rec = Matrix.wrcoef2('a', wt, name, N - M);
            for (var n = N - M; n > 0; n--) {
                rec["+="](Matrix.wrcoef2('h', wt, name, n));
                rec["+="](Matrix.wrcoef2('v', wt, name, n));
                rec["+="](Matrix.wrcoef2('d', wt, name, n));
            }
            var time = Tools.toc();
            return {
                psnr: Matrix.psnr(s, rec).getDataScalar(),
                time: time
            };
        };
        var res;
        for (var n = 0; n < wNames.length; n++) {
            var name = wNames[n];
            for (var m = 0; m < wModes.length; m++) {
                Matrix.dwtmode(wModes[m]);
                for (var sz = 1; sz < 9; sz += 2) {
                    var s = Matrix.rand(sz, sz + 1, 2);
                    var N = Matrix.dwtmaxlev([sz, sz + 1], name);
                    N = N < 1 ? 1 : N;
                    
                    log(s.size() + " " + name + " " + wModes[m]);
                    // 1D tests
                    res = test_wavedecrec(s, N, name);
                    log("DWT 1D on " + N + " levels", res.psnr, res.time); 
                    if (testMode !== "fast") {
                        res = test_upwlev(s, N, name);
                        log("1D upwlev on " + N + " levels", res.psnr, res.time);
                        res = test_wrcoef(s, N, name);
                        log("Reconstruction with wrcoef on " + N + " levels", res.psnr, res.time);
                    }
                    // 2D tests
                    res = test_wavedecrec2(s, N, name);
                    log("DWT 2D on " + N + " levels", res.psnr, res.time);
                    if (testMode !== "fast") {
                        res = test_upwlev2(s, N, name);
                        log("2D upwlev on " + N + " levels", res.psnr, res.time);
                        res = test_wrcoef2(s, N, name);
                        log("Reconstruction with wrcoef2 on " + N + " levels", res.psnr, res.time);
                        log("\n");
                    }
                }
            }
        }
    };

    Matrix._benchmarkFourier = function (N) {
        var test1 = function (s) {
            Tools.tic();
            fft = Matrix.fft(s);
            out = Matrix.ifft(fft);
            time = Tools.toc();
            return {
                psnr: Matrix.psnr(s, out).getDataScalar(),
                time: time
            };
        };
        var test2 = function (s) {
            Tools.tic();
            fft = Matrix.fft2(s);
            out = Matrix.ifft2(fft);
            time = Tools.toc();
            return {
                psnr: Matrix.psnr(s, out).getDataScalar(),
                time: time
            };
        };

        var s, fft, out, time, psnr;
        for (var sz = 1; sz < 6; sz += 2) {
            s = Matrix.rand(sz, sz + 1);
            log(s.size());
            var res = test1(s);
            log("FFT 1D decomposition/reconstruction", res.psnr, res.time);
            var res = test2(s);
            log("FFT 2D decomposition/reconstruction", res.psnr, res.time);
        }
    };

    Matrix._benchmark = function () {
        var i;
        for (i in Matrix) {
            if (Matrix.hasOwnProperty(i) && i.match(/benchmark/) && i != "_benchmark") {
                // console.log(i);
                Matrix[i]();
            }
        }
    };
})(Matrix, Matrix.prototype);
