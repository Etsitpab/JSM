(function (global) {
    global.readRAW = function (RAW) {
        'use strict';
        var tab2char = function (tab) {
            var str  = '';
            for (var i = 0; i < tab.length; i++) {
                str += String.fromCharCode(tab[i]);
            }
            return str;
        };
        var title = tab2char(new Uint8Array(RAW, 0, 4));
        var hint = tab2char(new Uint8Array(RAW, 4, 16));
        var infos = new Uint32Array(RAW, 20, 6);
        var padding = tab2char(new Uint32Array(RAW, 44, 20));
        var types = [
            'uint16', 'int16',
            'uint8', 'int8',
            'uint16', 'int16', 'uint32', 'int32',
            null, null, null, null, null,
            'single', 'double',
            null
        ];
        var w = infos[0], h = infos[1], c = infos[4],
            prec = infos[2], type = types[infos[3]];
        
        console.log(title);
        console.log(hint);
        console.log("width:", w);
        console.log("height:", h);
        console.log("prec:", prec);
        console.log("type:", type);
        console.log("nChannels:", c);
        console.log(padding);
        var constructor = Tools.checkType(type);
        var data = new constructor(RAW, 64);
        var im = new Matrix([w, h, c], data).permute([1, 0, 2]);
        window.im = im;
        return im;
    };

    Matrix.prototype.demosaic = function () {
        var size = this.size(), ni = size[0], nj = size[1];

        var id = this.getData(),
            Gr = id.subarray(0, ni * nj),
            R  = id.subarray(ni * nj, 2 * ni * nj),
            B  = id.subarray(2 * ni * nj, 3 * ni * nj),
            Gb = id.subarray(3 * ni * nj, 4 * ni * nj);

        var ny = ni * 2, nx = nj * 2,
            out = Matrix.zeros(ny, nx, 3), od = out.getData(),
            Ro = od.subarray(0, ny * nx),
            Go = od.subarray(ny * nx, 2 * ny * nx),
            Bo = od.subarray(2 * ny * nx, 3 * ny * nx);

        var i, j, _j, ij, _je, ije, y, x, _x, yx;
        for (_j = ni, _x = ny * 2, _je = ni * nj - ni; _j < _je; _j += ni, _x += (ny * 2)) {
            for (ij = _j + 1, yx = _x + 2, ije = _j + ni - 1; ij < ije; ij++, yx += 2) {
                var g0 = Gr[ij], g3 = Gb[ij]; 
                Go[yx] = g0;
                Go[yx + 1] = 0.25 * (g0 + g3 + Gr[ij + 1] + Gb[ij - ni]);
                Go[yx + ny] = 0.25 * (g0 + g3 + Gr[ij + ni] + Gb[ij - 1]);
                Go[yx + ny + 1] = g3;
                var r2 = R[ij];
                Ro[yx] = 0.5 * (r2 + R[ij - ni]);
                Ro[yx + 1] = 0.25 * (r2 + R[ij - ni + 1] + R[ij - ni] + R[ij + 1]);
                Ro[yx + ny] = r2;
                Ro[yx + ny + 1] = 0.5 * (r2 + R[ij + 1]);
                var b1 = B[ij]
                Bo[yx] = 0.5 * (b1 + B[ij - 1]);
                Bo[yx + 1] = b1
                Bo[yx + ny] = 0.25 * (b1 + B[ij + ni - 1] + B[ij + ni] + B[ij - 1]);
                Bo[yx + ny + 1] = 0.5 * (b1 + B[ij + ni]);
            }                
        }
        return out;
    };

    Matrix.prototype.demosaicTrivial = function () {
        var size = this.size();
        var ni = size[0], nj = size[1],
            ny = ni, nx = nj;
        var Gr = this.get([], [], 0),
            R  = this.get([], [], 1),
            B  = this.get([], [], 2),
            Gb = this.get([], [], 3);
        var out = Matrix.zeros(ny, nx, 3);
        out.set([], [], 1, Gr['+'](Gb)['/='](2));
        out.set([], [], 0, R);
        out.set([], [], 2, B);
        return out;
    };

    Matrix.prototype.blackPoint = function (Grm, Rm, Bm, Gbm, max) {
        var size = this.size(), ni = size[0], nj = size[1];
        var id = this.getData(),
            Gr = id.subarray(0 * ni * nj, 1 * ni * nj),
            R  = id.subarray(1 * ni * nj, 2 * ni * nj),
            B  = id.subarray(2 * ni * nj, 3 * ni * nj),
            Gb = id.subarray(3 * ni * nj, 4 * ni * nj);
        var imax = 1 / max;
        for (var i = 0, ei = Gr.length; i < ei; i++) {
            Gr[i] = Gr[i] < Grm ? 0 : (Gr[i] - Grm) * imax;
            R[i] = R[i] < Rm ? 0 : (R[i] - Rm) * imax;
            B[i] = B[i] < Bm ? 0 : (B[i] - Bm) * imax;
            Gb[i] = Gb[i] < Gbm ? 0 : (Gb[i] - Gbm) * imax;
        }
        return this;
    };

    Matrix.prototype.applySRGBGamma = function (resolution) {
        var lut = new Float64Array(resolution);
        var a = 0.055, I2D4 = 1 / 2.4, v, ires = 1 / resolution;
        for (var i = 0; i < resolution; i++) {
            v = i * ires;
            lut[i] = (v > 0.0031308) ? (1.055 * Math.pow(v, I2D4) - a) : (v * 12.92);
        }
        var data = this.getData(), dLength = data.length;
        for (var i = 0; i < dLength; i++) {
            v = Math.floor(data[i] * resolution);
            if (v >= resolution) {
                data[i] = lut[resolution - 1];
            } else if (v < 0) {
                data[i] = 0;
            } else {
                data[i] = lut[v];
            }
        }
        return this;
    };

    global.processRaw = function (RAW) {
        Tools.tic();
        var bp = parameters.bp, max = RAW.max().getDataScalar() - bp;
        IMAGE = RAW.blackPoint(bp, bp, bp, bp, max);
        console.log("Black point removed in", Tools.toc(), "ms");
        
        Tools.tic();
        // IMAGE = IMAGE.demosaicTrivial();
        IMAGE = IMAGE.demosaic();
        console.log("RAW demosaiced in", Tools.toc(), "ms");
        
        // Tools.tic();
        // IMAGE = IMAGE.sqrt().imbilateral(3, 0.0001, 3).power(2);
        // console.log("Bilateral denoising applied in", Tools.toc(), "ms");
        
        // Tools.tic();
        // IMAGE = IMAGE.sqrt().wdenoise(0.025, 'sym4').power(2);
        // console.log("Wavelet denoising applied in", Tools.toc(), "ms");
        
        Tools.tic();
        var WB = Matrix.toMatrix([
            parameters.awbScales[0], 0.00,                    0.00,
            0.00,                    1.00,                    0.00,
            0.00,                    0.00, parameters.awbScales[1]
        ]).reshape(3, 3);
        var CM = Matrix.toMatrix(parameters.colorMatrix).reshape(3, 3);
        var O = Matrix.toMatrix([
            0.33, 0.34,  0.33,
            0.50, 0.00, -0.50,
           -0.25, 0.50, -0.25
        ]).reshape(3, 3).transpose();
        var s = 0, S = Matrix.toMatrix([
            1.00,                  0.00, 0.00,
            0.00, parameters.saturation, 0.00,
            0.00,                  0.00, parameters.saturation
        ]).reshape(3, 3).transpose();
        S = O.inv().mtimes(S).mtimes(O);
        CM.display("CM");
        IMAGE.applycform(S.mtimes(CM).mtimes(WB));
        IMAGE.set(IMAGE[">"](1), 1);
        max = IMAGE.max().display("MAX").times(1 / parameters.gain);
        IMAGE['/='](max);
        console.log("Color Matrix applied in", Tools.toc(), "ms");
        
        /*
        Tools.tic();
        IMAGE = IMAGE.colorEnhancement(.05, 15, 10, "sym4", 0.1)
        console.log("Wavelet enhancement applied in", Tools.toc(), "ms");
        */
        Tools.tic();
        IMAGE.applySRGBGamma(4096);
        console.log("sRGB tone curve applied in", Tools.toc(), "ms");
        /*
        Tools.tic();
        filter = Matrix.toMatrix([
            -30, -30, -50, -30,	-30,
            -30,  30, 120,  30,	-30,
            -50, 120, 472, 120,	-50,
            -30,  30, 120,  30,	-30,
            -30, -30, -50, -30,	-30
        ]).rdivide(512).reshape(5, 5).transpose();
        IMAGE = IMAGE.imfilter(filter);
        console.log("5x5 filter applied in", Tools.toc(), "ms");
        */
        /*
        IMAGE = IMAGE.histeq(4096);
        console.log("image equalization applied in", Tools.toc(), "ms");
        */
        /*
        Tools.tic();
        IMAGE = IMAGE.colorEnhancement(0.6, 5, 10, "coif2", 0.15)
        console.log("Wavelet enhancement applied in", Tools.toc(), "ms");
        */
        return IMAGE;
    };
})(window);
