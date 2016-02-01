/*    global.testAnscombe = function () {
        Matrix.prototype.vst = function (order, a, b, c, anscombe) {
            anscombe = anscombe || true;
            var g = b / (1 + a);
            var n2 = c / (g * g) + ((anscombe === true) ? 3.0 / 8.0 : 0.0)
            var z = this.getData(), ig = 1 / g;
            var sqrt = Math.sqrt, log = Math.log;
            if (order === 2 || a === 0) {
                for (var x = 0, ex = z.length; x < ex; x++) {
                    var y = z[x] < 0 ? 0 : z[x] * ig;
                        z[x] = 2.0 * sqrt(y + n2);
                }
            } else {
                for (var x = 0, ex = z.length; x < ex; x++) {
                    var y = z[x] < 0 ? 0 : z[x] * ig;
                    z[x] = 1.0 / sqrt(a) * log(2.0 * a * y + (1.0 + a) + 2.0 * sqrt(a) * sqrt(a * y * y + (1.0 + a) * y + n2));
                }
            }
            return this;
        };
        Matrix.prototype.ivst = function (order, a, b, c, anscombe) {
            anscombe = anscombe || true;
            return this;
        };
        var imRand = function (z, a, b, c) {
            var g = b / (1 + a);
            var n2 = c / (g * g);
            var y = Matrix.rdivide(z, g);
            var size = z.getSize();
            var x = Matrix.poissrnd(y);
            var eps = Matrix.randn(size).times(Math.sqrt(a));
            var n = Matrix.randn(size).times(Math.sqrt(n2));
            return eps.plus(1).times(x).plus(n).times(g);
        };

        var imVariance = function (z, a, b, c) {
            return Matrix.power(z, 2).times(a).plus(Matrix.times(z, b)).plus(c).sqrt();
        };

        var a = 1e-5, b = 2, c = 1e-2;
        var im = Matrix.ones(1024, 4096).cumsum(0).times(1);
        var out = imRand(im, a, b, c);
        SC.setImageBuffer(Matrix.rdivide(out, 1024)); SC.displayImageBuffer(0, false);
        var vstab = out.getCopy().vst(3, a, b, c).std(1);
        var var1 = out.std(1),
            var2 = imVariance(Matrix.ones(1024, 1).cumsum(0).times(1), a, b, c);
        var1.cat(1, var2, vstab).display();
        vstab.mean().display();
    };

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
*/

(function (global) {
    'use strict';
    var ImagePipe = {};

    var readField = function (field) {
        var value = field.value,
            type = field.type,
            count = field.count;
        if (type === "RATIONAL"  && count === 1) {
            return value.numerator / value.denominator;
        }
        if (type === "RATIONAL" && count >= 1) {
            var v, out = [];
            for (v = 0; v < value.numerator.length; v++) {
                out[v] = value.numerator[v] / value.denominator[v];
            }
            return out
        }
        return value;
    };

    ImagePipe.reshapeCFA = function (parameters) {
        var CFAView = new MatrixView([parameters.ImageWidth.value, parameters.ImageLength.value]);
        // parameters.ActiveArea = {"value": [2750, 3750, 3250, 5500]};
        // Image crop
        if (parameters.ActiveArea) {
            var crop = parameters.ActiveArea.value;
            CFAView.select([crop[1], crop[3] - 1], [crop[0], crop[2] - 1]);
        }

        // CFA view rotation
        var Orientation = parameters.Orientation ? parameters.Orientation.value : 1;
        if (Orientation === 3){
            CFAView.fliplr().flipud();
        } else if (Orientation !== 1) {
            console.warn("DNG Processor: Orientation " + Orientation + " is not yet supported");
        }

        // CFA view transpose and data extraction
        CFAView.permute([1, 0]);
        var CFA = new Float32Array(CFAView.getLength());
        CFAView.extractFrom(parameters.ImageData, CFA);
        return new Matrix([CFAView.getSize(0), CFAView.getSize(1)], CFA);
    };

    ImagePipe.applyLut = function (image, lut) {
        var resolution = lut.length, data = image.getData(), dLength = data.length;
        for (var i = 0; i < dLength; i++) {
            var v = data[i];
            if (v >= resolution) {
                data[i] = lut[resolution - 1];
            } else if (v < 0) {
                data[i] = 0;
            } else {
                data[i] = lut[v];
            }
        }
        return image;
    };

    ImagePipe.blackAndWhitePoints = function (image, parameters) {
        var BlackLevel = [0, 0, 0, 0], WhiteLevel = Math.pow(2, readField(parameters.BitsPerSample)) - 1;
        if (parameters.BlackLevel) {
            var BlackLevelRepeatDim = [1, 1];
            if (parameters.BlackLevelRepeatDim) {
                BlackLevelRepeatDim = readField(parameters.BlackLevelRepeatDim);
            }
            var BlackLevel = readField(parameters.BlackLevel),
                SamplesPerPixel = readField(parameters.SamplesPerPixel);
            if (BlackLevelRepeatDim[0] !== BlackLevelRepeatDim[1] || (BlackLevelRepeatDim[0] !== 1 && BlackLevelRepeatDim[0] !== 2))     {
                throw new Error("DNG Processor: Unsupported value " + BlackLevelRepeatDim + " for BlackLevelRepeatDim.");
            } else if (SamplesPerPixel !== 1) {
                throw new Error("DNG Processor: Unsupported value " + SamplesPerPixel + " for SamplesPerPixel.");
            }

            if (Tools.isNumber(BlackLevel)) {
                BlackLevel = new Array(4).fill(BlackLevel);
            }
        }
        if (parameters.WhiteLevel) {
            WhiteLevel = readField(parameters.WhiteLevel);
            if (!Tools.isNumber(WhiteLevel)) {
                throw new Error("DNG Processor: WhiteLevel must be a number.");
            }
        }
        var iWhiteLevel = 1 / WhiteLevel;
        var size = image.size(), ny = size[0], nx = size[1], id = image.getData();
        var _x, yx, _xe, yxe, ny2 = 2 * ny;
        for (_x = 0, _xe = nx * ny; _x < _xe; _x += ny2) {
            for (yx = _x, yxe = _x + ny; yx < yxe; yx += 2) {
                id[yx]          = id[yx]          < BlackLevel[0] ? 0 : (id[yx]          - BlackLevel[0]) * iWhiteLevel;
                id[yx + ny]     = id[yx + ny]     < BlackLevel[1] ? 0 : (id[yx + ny]     - BlackLevel[1]) * iWhiteLevel;
                id[yx + 1]      = id[yx + 1]      < BlackLevel[2] ? 0 : (id[yx + 1]      - BlackLevel[2]) * iWhiteLevel;
                id[yx + ny + 1] = id[yx + ny + 1] < BlackLevel[3] ? 0 : (id[yx + ny + 1] - BlackLevel[3]) * iWhiteLevel;
            }
        }
        return image;
    };

    ImagePipe.getCFAPattern = function (parameters) {
        // CFAPattern rotation
        var Orientation = parameters.Orientation ? parameters.Orientation.value : 1;
        var CFAPattern = new Matrix([2, 2], parameters.CFAPattern.value).transpose();
        if (Orientation === 3){
            CFAPattern = CFAPattern.fliplr().flipud();
        } else if (Orientation !== 1) {
            console.warn("DNG Processor: Orientation " + Orientation + " is not yet supported");
        }
        var CFAPatternOut = "", values = ["R", "G", "B"];
        for (var v of CFAPattern.getData()) {
            CFAPatternOut += values[v];
        }
        return CFAPatternOut;
    };

    ImagePipe.processMap = function (dng, image, map) {
        var mapOut = {};
        var Orientation = readField(dng.Orientation);
        if (Orientation === 3){
            var Top = map.Top, Bottom = map.Bottom, Left = map.Left, Right = map.Right;
            var RowPitch = map.RowPitch, ColPitch = map.ColPitch;

            // -1 because Bottom and Right are not included
            var lastV = Math.floor((Bottom - 1 - Top) / RowPitch) * RowPitch + Top;
            mapOut.Top = image.size(0) - 1 - lastV;
            mapOut.Bottom =  image.size(0) - Top;
            var lastH = Math.floor((Right - 1 - Left) / ColPitch) * ColPitch + Left;
            mapOut.Left = image.size(1) - 1 - lastH;
            mapOut.Right = image.size(1) - Left;
            mapOut.mapValues = map.mapValues.fliplr().flipud();
            map.Top = mapOut.Top;
            map.Bottom = mapOut.Bottom;
            map.Left = mapOut.Left;
            map.Right = mapOut.Right;
            map.mapValues = mapOut.mapValues;
        } else if (Orientation !== 1) {
            console.warn("DNG Processor: Orientation " + Orientation + " is not yet supported");
        }
        return map;
    };

    ImagePipe.applyGainMap = function (dng, image, map) {
        map = ImagePipe.processMap(dng, image, map);
        var size = image.size(), ny = size[0], nx = size[1], id = image.getData();
        var MapSizeH = map.MapSpacingH * (map.MapPointsH - 1),
            MapSizeV = map.MapSpacingV * (map.MapPointsV - 1);
        var x0 = map.Left, y0 = map.Top, dx = map.ColPitch , dy = map.RowPitch;
        var _x, yx, _xe, yxe, x, y;

        // Replicate last values for interpolation purpose
        var mapValues = map.mapValues.permute([2, 1, 0]).padarray("sym", [0, 1], [0, 1]);
        // Apply only a given percentage of the map.
        var perc = 1.0;
        mapValues["-="](1)["*="](perc)["+="](1);

        var values = mapValues.getData();
        var nxm = mapValues.size(1), nym = mapValues.size(0);

        var xIndFloat = new Float32Array(nx), yIndFloat = new Float32Array(ny);
        var xIndInt = new Uint16Array(nx), yIndInt = new Uint16Array(ny);
        for (x = x0; x < nx; x += dx) {
            xIndFloat[x] = (x / nx - map.MapOriginH) / MapSizeH * (map.MapPointsH - 1);
            xIndInt[x] = Math.floor(xIndFloat[x]);
            xIndFloat[x] -= xIndInt[x];
        }
        for (y = y0; y < ny; y += dy) {
            yIndFloat[y] = (y / ny - map.MapOriginV) / MapSizeV * (map.MapPointsV - 1);
            yIndInt[y] = Math.floor(yIndFloat[y]);
            yIndFloat[y] -= yIndInt[y];
        }
        for (_x = x0 * ny, x = x0, _xe = nx * ny; _x < _xe; _x += dx * ny, x += dx) {
            var xpf = xIndFloat[x], xp = xIndInt[x];
            var xInd = xp * nym;
            for (yx = _x + y0, y = y0, yxe = _x + ny; yx < yxe; yx += dy, y += dy) {
                var ind = xInd + yIndInt[y];
                var a = values[ind],     c = values[ind + nym],
                    b = values[ind + 1], d = values[ind + nym + 1];
                // var val = (a * (1 - xpf) + c * xpf) * (1 - ypf) + (b * (1 - xpf) + d * xpf) * ypf;
                id[yx] *= (a + (c - a) * xpf) + (b - a + (a - c + d - b) * xpf) * yIndFloat[y];
            }
        }
        return image;
    };

    ImagePipe.demosaic = function (image, parameters) {
        var size = image.size(), ny = size[0], nx = size[1];
        var CFAPattern = ImagePipe.getCFAPattern(parameters);
        // Offsets
        var oy, ox;
        if (CFAPattern === "GBRG") {
            oy = 0;
            ox = 0;
        } else if (CFAPattern === "GRBG") {
            oy = -1;
            ox = -1;
        } else if (CFAPattern === "RGGB") {
            oy = 0;
            ox = -1;
        } else if (CFAPattern === "BGGR") {
            oy = -1;
            ox = 0;
        } else {
            throw new Error("Unknown pattern " + CFAPattern);
        }

        var id = image.getData(),
            out = Matrix.zeros(ny, nx, 3, 'single'), od = out.getData(),
            Ro = od.subarray(          0,     ny * nx),
            Go = od.subarray(    ny * nx, 2 * ny * nx),
            Bo = od.subarray(2 * ny * nx, 3 * ny * nx);
        var _x, yx, _xe, yxe, ny2 = 2 * ny;
        // Bilinear interpolation
        if (1) {
            for (_x = (2 + ox) * ny, _xe = (nx - 2 - ox) * ny; _x < _xe; _x += ny2) {
                for (yx = _x + 2 + oy, yxe = _x + ny - 2 - oy; yx < yxe; yx += 2) {
                    var                      e = id[yx - 1], i = id[yx + ny - 1], m = id[yx + ny2 - 1],
                        b = id[yx - ny],     f = id[yx],     j = id[yx + ny],     n = id[yx + ny2],
                        c = id[yx - ny + 1], g = id[yx + 1], k = id[yx + ny + 1], o = id[yx + ny2 + 1],
                        d = id[yx - ny + 2], h = id[yx + 2], l = id[yx + ny + 2];
                    Ro[yx] = 0.50 * (b + j);
                    Go[yx] = f;
                    Bo[yx] = 0.50 * (e + g);

                    Ro[yx + 1] = 0.25 * (b + j + d + l);
                    Go[yx + 1] = 0.25 * (c + f + h + k);
                    Bo[yx + 1] = g;

                    Ro[yx + ny] = j;
                    Go[yx + ny] = 0.25 * (i + f + k + n);
                    Bo[yx + ny] = 0.25 * (e + g + m + o);

                    Ro[yx + ny + 1] = 0.50 * (j + l);
                    Go[yx + ny + 1] = k;
                    Bo[yx + ny + 1] = 0.50 * (g + o);
                }
            }
        } else {
            var ny3 = 3 * ny;
            for (_x = (4 + ox) * ny, _xe = (nx - 4 - ox) * ny; _x < _xe; _x += ny2) {
                for (yx = _x + 4 + oy, yxe = _x + ny - 4 - oy; yx < yxe; yx += 2) {

                    var                                                                  v03 = id[yx + ny - 2],
                                                                       v12 = id[yx - 1], v13 = id[yx + ny - 1], v14 = id[yx + ny2 - 1],
                                                v21 = id[yx - ny],     v22 = id[yx],     v23 = id[yx + ny],     v24 = id[yx + ny2],     v25 = id[yx + ny3],
                        v30 = id[yx - ny2 + 1], v31 = id[yx - ny + 1], v32 = id[yx + 1], v33 = id[yx + ny + 1], v34 = id[yx + ny2 + 1],
                                                v41 = id[yx - ny + 2], v42 = id[yx + 2], v43 = id[yx + ny + 2],
                                                                       v52 = id[yx + 3];
                    // Vertical and horizontal green estimates
                    var ghv1 = 0.5 * (v22 + v42) + 0.25 * (2 * v32 - v12 - v52),
                        ghh1 = 0.5 * (v31 + v33) + 0.25 * (2 * v32 - v30 - v34);

                    var ghv2 = 0.5 * (v13 + v33) + 0.25 * (2 * v23 - v03 - v43),
                        ghh2 = 0.5 * (v22 + v24) + 0.25 * (2 * v23 - v21 - v25);
                    Go[yx] = v22;
                    Go[yx + 1] = 0.5 * (ghv1 + ghh1);
                    Go[yx + ny] = 0.5 * (ghv2 + ghh2);
                    Go[yx + ny + 1] = v33;

                    Ro[yx] = 0.50 * (v21 + v23);
                    Ro[yx + 1] = 0.25 * (v21 + v23 + v41 + v43);
                    Ro[yx + ny] = v23;
                    Ro[yx + ny + 1] = 0.50 * (v23 + v43);

                    Bo[yx] = 0.50 * (v12 + v32);
                    Bo[yx + 1] = v32;
                    Bo[yx + ny] = 0.25 * (v12 + v32 + v14 + v34);
                    Bo[yx + ny + 1] = 0.50 * (v32 + v34);
                }
            }
        }
        return out;
    };

    ImagePipe.apply5x5Filter = function (image, filter) {
        var size = image.size(), ny = size[0], nx = size[1];
        var out = Matrix.zeros(ny, nx, 3, 'single');
        var id = image.getData(),
            od = out.getData(),
            fd = filter.getData();

        var f00 = fd[0], f01 = fd[5], f02 = fd[10], f03 = fd[15], f04 = fd[20],
            f10 = fd[1], f11 = fd[6], f12 = fd[11], f13 = fd[16], f14 = fd[21],
            f20 = fd[2], f21 = fd[7], f22 = fd[12], f23 = fd[17], f24 = fd[22],
            f30 = fd[3], f31 = fd[8], f32 = fd[13], f33 = fd[18], f34 = fd[23],
            f40 = fd[4], f41 = fd[9], f42 = fd[14], f43 = fd[19], f44 = fd[24];

        var _x, yx, _xe, yxe, ny2 = 2 * ny, c, ce;
        for (c = 0, ce = nx * ny * 3; c < ce; c += ny * nx) {
            for (_x = c + 2 * ny, _xe = c + (nx - 2) * ny; _x < _xe; _x += ny) {
                for (yx = _x + 2, yxe = _x + ny - 2; yx < yxe; yx += 1) {
                    od[yx] = id[yx - ny2 - 2] * f00 + id[yx - ny - 2] * f01 + id[yx - 2] * f02 + id[yx + ny - 2] * f03 + id[yx + ny2 - 2] * f04 +
                             id[yx - ny2 - 1] * f10 + id[yx - ny - 1] * f11 + id[yx - 1] * f12 + id[yx + ny - 1] * f13 + id[yx + ny2 - 1] * f14 +
                             id[yx - ny2]     * f20 + id[yx - ny]     * f21 + id[yx]     * f22 + id[yx + ny]     * f23 + id[yx + ny2]     * f24 +
                             id[yx - ny2 + 1] * f30 + id[yx - ny + 1] * f31 + id[yx + 1] * f32 + id[yx + ny + 1] * f33 + id[yx + ny2 + 1] * f34 +
                             id[yx - ny2 + 2] * f40 + id[yx - ny + 2] * f41 + id[yx + 2] * f42 + id[yx + ny + 2] * f43 + id[yx + ny2 + 2] * f44;
                }
            }
        }
        return out;
    };

    ImagePipe.applyBayerNLM = function (image) {
        var size = image.size(), ny = size[0], nx = size[1];
        var out = Matrix.zeros(size, 'single');
        var id = image.getData(),
            od = out.getData();

        var ny2 = 2 * ny, ny3 = 3 * ny, ny4 = 4 * ny, ny5 = 5 * ny;
        var o00 = -ny4 - 4, o01 = -ny3 - 4, o02 = -ny2 - 4, o03 = -ny - 4, o05 = ny - 4, o06 = ny2 - 4, o07 = ny3 - 4, o08 = ny4 - 4, o09 = ny5 - 4,
            o10 = -ny4 - 3, o11 = -ny3 - 3, o12 = -ny2 - 3, o13 = -ny - 3, o15 = ny - 3, o16 = ny2 - 3, o17 = ny3 - 3, o18 = ny4 - 3, o19 = ny5 - 3,
            o20 = -ny4 - 2, o21 = -ny3 - 2, o22 = -ny2 - 2, o23 = -ny - 2, o25 = ny - 2, o26 = ny2 - 2, o27 = ny3 - 2, o28 = ny4 - 2, o29 = ny5 - 2,
            o30 = -ny4 - 1, o31 = -ny3 - 1, o32 = -ny2 - 1, o33 = -ny - 1, o35 = ny - 1, o36 = ny2 - 1, o37 = ny3 - 1, o38 = ny4 - 1, o39 = ny5 - 1,
            o40 = -ny4,     o41 = -ny3,     o42 = -ny2,     o43 = -ny,     o45 = ny,     o46 = ny2,     o47 = ny3,     o48 = ny4,     o49 = ny5,
            o50 = -ny4 + 1, o51 = -ny3 + 1, o52 = -ny2 + 1, o53 = -ny + 1, o55 = ny + 1, o56 = ny2 + 1, o57 = ny3 + 1, o58 = ny4 + 1, o59 = ny5 + 1,
            o60 = -ny4 + 2, o61 = -ny3 + 2, o62 = -ny2 + 2, o63 = -ny + 2, o65 = ny + 2, o66 = ny2 + 2, o67 = ny3 + 2, o68 = ny4 + 2, o69 = ny5 + 2,
            o70 = -ny4 + 3, o71 = -ny3 + 3, o72 = -ny2 + 3, o73 = -ny + 3, o75 = ny + 3, o76 = ny2 + 3, o77 = ny3 + 3, o78 = ny4 + 3, o79 = ny5 + 3,
            o80 = -ny4 + 4, o81 = -ny3 + 4, o82 = -ny2 + 4, o83 = -ny + 4, o85 = ny + 4, o86 = ny2 + 4, o87 = ny3 + 4, o88 = ny4 + 4, o89 = ny5 + 4,
            o90 = -ny4 + 5, o91 = -ny3 + 5, o92 = -ny2 + 5, o93 = -ny + 5, o95 = ny + 5, o96 = ny2 + 5, o97 = ny3 + 5, o98 = ny4 + 5, o99 = ny5 + 5;

        var d = new Float32Array(18).fill(1);
        var _x, yx, _xe, yxe, c, ce;
        for (_x = 4 * ny, _xe = (nx - 4) * ny; _x < _xe; _x += 2 * ny) {
            for (yx = _x + 4, yxe = _x + ny - 4; yx < yxe; yx += 2) {
                // var 7x7 neighbourhood
                var v00 = id[yx + o00], v01 = id[yx + o01], v02 = id[yx + o02], v03 = id[yx + o03], v04 = id[yx - 4], v05 = id[yx + o05], v06 = id[yx + o06], v07 = id[yx + o07], v08 = id[yx + o08], v09 = id[yx + o09],
                    v10 = id[yx + o10], v11 = id[yx + o11], v12 = id[yx + o12], v13 = id[yx + o13], v14 = id[yx - 3], v15 = id[yx + o15], v16 = id[yx + o16], v17 = id[yx + o17], v18 = id[yx + o18], v19 = id[yx + o19],
                    v20 = id[yx + o20], v21 = id[yx + o21], v22 = id[yx + o22], v23 = id[yx + o23], v24 = id[yx - 2], v25 = id[yx + o25], v26 = id[yx + o26], v27 = id[yx + o27], v28 = id[yx + o28], v29 = id[yx + o29],
                    v30 = id[yx + o30], v31 = id[yx + o31], v32 = id[yx + o32], v33 = id[yx + o33], v34 = id[yx - 1], v35 = id[yx + o35], v36 = id[yx + o36], v37 = id[yx + o37], v38 = id[yx + o38], v39 = id[yx + o39],
                    v40 = id[yx + o40], v41 = id[yx + o41], v42 = id[yx + o42], v43 = id[yx + o43], v44 = id[yx],     v45 = id[yx + o45], v46 = id[yx + o46], v47 = id[yx + o47], v48 = id[yx + o48], v49 = id[yx + o49],
                    v50 = id[yx + o50], v51 = id[yx + o51], v52 = id[yx + o52], v53 = id[yx + o53], v54 = id[yx + 1], v55 = id[yx + o55], v56 = id[yx + o56], v57 = id[yx + o57], v58 = id[yx + o58], v59 = id[yx + o59],
                    v60 = id[yx + o60], v61 = id[yx + o61], v62 = id[yx + o62], v63 = id[yx + o63], v64 = id[yx + 2], v65 = id[yx + o65], v66 = id[yx + o66], v67 = id[yx + o67], v68 = id[yx + o68], v69 = id[yx + o69],
                    v70 = id[yx + o70], v71 = id[yx + o71], v72 = id[yx + o72], v73 = id[yx + o73], v74 = id[yx + 3], v75 = id[yx + o75], v76 = id[yx + o76], v77 = id[yx + o77], v78 = id[yx + o78], v79 = id[yx + o79],
                    v80 = id[yx + o80], v81 = id[yx + o81], v82 = id[yx + o82], v83 = id[yx + o83], v84 = id[yx + 4], v85 = id[yx + o85], v86 = id[yx + o86], v87 = id[yx + o87], v88 = id[yx + o88], v89 = id[yx + o89],
                    v90 = id[yx + o90], v91 = id[yx + o91], v92 = id[yx + o92], v93 = id[yx + o93], v94 = id[yx + 5], v95 = id[yx + o95], v96 = id[yx + o96], v97 = id[yx + o97], v98 = id[yx + o98], v99 = id[yx + o99];

                // GREEN 1 Patch
                var ih, sum;
                ih = 4;
                d[7]  = 0;
                d[0]  = Math.exp(-((v11 > v33 ? v11 - v33 : v33 - v11) + (v31 > v53 ? v31 - v53 : v53 - v31) + (v22 > v44 ? v22 - v44 : v44 - v22) + (v13 > v35 ? v13 - v35 : v35 - v13) + (v33 > v55 ? v33 - v55 : v55 - v33)) * ih);
                d[1]  = Math.exp(-((v31 > v33 ? v31 - v33 : v33 - v31) + (v51 > v53 ? v51 - v53 : v53 - v51) + (v42 > v44 ? v42 - v44 : v44 - v42) + (v33 > v35 ? v33 - v35 : v35 - v33) + (v53 > v55 ? v53 - v55 : v55 - v53)) * ih);
                d[2]  = Math.exp(-((v51 > v33 ? v51 - v33 : v33 - v51) + (v71 > v53 ? v71 - v53 : v53 - v71) + (v62 > v44 ? v62 - v44 : v44 - v62) + (v53 > v35 ? v53 - v35 : v35 - v53) + (v73 > v55 ? v73 - v55 : v55 - v73)) * ih);
                d[3]  = Math.exp(-((v22 > v33 ? v22 - v33 : v33 - v22) + (v42 > v53 ? v42 - v53 : v53 - v42) + (v33 > v44 ? v33 - v44 : v44 - v33) + (v24 > v35 ? v24 - v35 : v35 - v24) + (v44 > v55 ? v44 - v55 : v55 - v44)) * ih);
                d[4]  = Math.exp(-((v42 > v33 ? v42 - v33 : v33 - v42) + (v62 > v53 ? v62 - v53 : v53 - v62) + (v53 > v44 ? v53 - v44 : v44 - v53) + (v44 > v35 ? v44 - v35 : v35 - v44) + (v64 > v55 ? v64 - v55 : v55 - v64)) * ih);
                // d[5]  = Math.exp(-((v62 > v33 ? v62 - v33 : v33 - v62) + (v82 > v53 ? v82 - v53 : v53 - v82) + (v73 > v44 ? v73 - v44 : v44 - v73) + (v64 > v35 ? v64 - v35 : v35 - v64) + (v84 > v55 ? v84 - v55 : v55 - v84)) * ih);
                d[6]  = Math.exp(-((v13 > v33 ? v13 - v33 : v33 - v13) + (v33 > v53 ? v33 - v53 : v53 - v33) + (v24 > v44 ? v24 - v44 : v44 - v24) + (v15 > v35 ? v15 - v35 : v35 - v15) + (v35 > v55 ? v35 - v55 : v55 - v35)) * ih);
                d[8]  = Math.exp(-((v53 > v33 ? v53 - v33 : v33 - v53) + (v73 > v53 ? v73 - v53 : v53 - v73) + (v64 > v44 ? v64 - v44 : v44 - v64) + (v55 > v35 ? v55 - v35 : v35 - v55) + (v75 > v55 ? v75 - v55 : v55 - v75)) * ih);
                d[9]  = Math.exp(-((v24 > v33 ? v24 - v33 : v33 - v24) + (v44 > v53 ? v44 - v53 : v53 - v44) + (v35 > v44 ? v35 - v44 : v44 - v35) + (v26 > v35 ? v26 - v35 : v35 - v26) + (v46 > v55 ? v46 - v55 : v55 - v46)) * ih);
                d[10] = Math.exp(-((v44 > v33 ? v44 - v33 : v33 - v44) + (v64 > v53 ? v64 - v53 : v53 - v64) + (v55 > v44 ? v55 - v44 : v44 - v55) + (v46 > v35 ? v46 - v35 : v35 - v46) + (v66 > v55 ? v66 - v55 : v55 - v66)) * ih);
                // d[11] = Math.exp(-((v64 > v33 ? v64 - v33 : v33 - v64) + (v84 > v53 ? v84 - v53 : v53 - v84) + (v75 > v44 ? v75 - v44 : v44 - v75) + (v66 > v35 ? v66 - v35 : v35 - v66) + (v86 > v55 ? v86 - v55 : v55 - v86)) * ih);
                d[12] = Math.exp(-((v15 > v33 ? v15 - v33 : v33 - v15) + (v35 > v53 ? v35 - v53 : v53 - v35) + (v26 > v44 ? v26 - v44 : v44 - v26) + (v17 > v35 ? v17 - v35 : v35 - v17) + (v37 > v55 ? v37 - v55 : v55 - v37)) * ih);
                d[13] = Math.exp(-((v35 > v33 ? v35 - v33 : v33 - v35) + (v55 > v53 ? v55 - v53 : v53 - v55) + (v46 > v44 ? v46 - v44 : v44 - v46) + (v37 > v35 ? v37 - v35 : v35 - v37) + (v57 > v55 ? v57 - v55 : v55 - v57)) * ih);
                d[14] = Math.exp(-((v55 > v33 ? v55 - v33 : v33 - v55) + (v75 > v53 ? v75 - v53 : v53 - v75) + (v66 > v44 ? v66 - v44 : v44 - v66) + (v57 > v35 ? v57 - v35 : v35 - v57) + (v77 > v55 ? v77 - v55 : v55 - v77)) * ih);
                // d[15] = Math.exp(-((v26 > v33 ? v26 - v33 : v33 - v26) + (v46 > v53 ? v46 - v53 : v53 - v46) + (v37 > v44 ? v37 - v44 : v44 - v37) + (v28 > v35 ? v28 - v35 : v35 - v28) + (v48 > v55 ? v48 - v55 : v55 - v48)) * ih);
                // d[16] = Math.exp(-((v46 > v33 ? v46 - v33 : v33 - v46) + (v66 > v53 ? v66 - v53 : v53 - v66) + (v57 > v44 ? v57 - v44 : v44 - v57) + (v48 > v35 ? v48 - v35 : v35 - v48) + (v68 > v55 ? v68 - v55 : v55 - v68)) * ih);
                // d[17] = Math.exp(-((v66 > v33 ? v66 - v33 : v33 - v66) + (v86 > v53 ? v86 - v53 : v53 - v86) + (v77 > v44 ? v77 - v44 : v44 - v77) + (v68 > v35 ? v68 - v35 : v35 - v68) + (v88 > v55 ? v88 - v55 : v55 - v88)) * ih);
                sum = 1 + d[0] + d[1] + d[2] + d[3] + d[4] + d[6] + d[8] + d[9] + d[10] + d[12] + d[13] + d[14];
                od[yx] = (v44 + d[0] * v22 + d[1] * v42 + d[2] * v62 + d[3] * v33 + d[4] * v53 + d[6] * v24 + d[8] * v64 + d[9] * v35 + d[10] * v55 + d[12] * v26 + d[13] * v46 + d[14] * v66) / sum;

                // GREEN 2 Patch
                d[10] = 0;
                // d[0]  = Math.exp(-((v11 > v44 ? v11 - v44 : v44 - v11) + (v31 > v64 ? v31 - v64 : v64 - v31) + (v22 > v55 ? v22 - v55 : v55 - v22) + (v13 > v46 ? v13 - v46 : v46 - v13) + (v33 > v66 ? v33 - v66 : v66 - v33)) * ih);
                // d[1]  = Math.exp(-((v31 > v44 ? v31 - v44 : v44 - v31) + (v51 > v64 ? v51 - v64 : v64 - v51) + (v42 > v55 ? v42 - v55 : v55 - v42) + (v33 > v46 ? v33 - v46 : v46 - v33) + (v53 > v66 ? v53 - v66 : v66 - v53)) * ih);
                // d[2]  = Math.exp(-((v51 > v44 ? v51 - v44 : v44 - v51) + (v71 > v64 ? v71 - v64 : v64 - v71) + (v62 > v55 ? v62 - v55 : v55 - v62) + (v53 > v46 ? v53 - v46 : v46 - v53) + (v73 > v66 ? v73 - v66 : v66 - v73)) * ih);
                d[3]  = Math.exp(-((v22 > v44 ? v22 - v44 : v44 - v22) + (v42 > v64 ? v42 - v64 : v64 - v42) + (v33 > v55 ? v33 - v55 : v55 - v33) + (v24 > v46 ? v24 - v46 : v46 - v24) + (v44 > v66 ? v44 - v66 : v66 - v44)) * ih);
                d[4]  = Math.exp(-((v42 > v44 ? v42 - v44 : v44 - v42) + (v62 > v64 ? v62 - v64 : v64 - v62) + (v53 > v55 ? v53 - v55 : v55 - v53) + (v44 > v46 ? v44 - v46 : v46 - v44) + (v64 > v66 ? v64 - v66 : v66 - v64)) * ih);
                d[5]  = Math.exp(-((v62 > v44 ? v62 - v44 : v44 - v62) + (v82 > v64 ? v82 - v64 : v64 - v82) + (v73 > v55 ? v73 - v55 : v55 - v73) + (v64 > v46 ? v64 - v46 : v46 - v64) + (v84 > v66 ? v84 - v66 : v66 - v84)) * ih);
                // d[6]  = Math.exp(-((v13 > v44 ? v13 - v44 : v44 - v13) + (v33 > v64 ? v33 - v64 : v64 - v33) + (v24 > v55 ? v24 - v55 : v55 - v24) + (v15 > v46 ? v15 - v46 : v46 - v15) + (v35 > v66 ? v35 - v66 : v66 - v35)) * ih);
                d[7]  = Math.exp(-((v33 > v44 ? v33 - v44 : v44 - v33) + (v53 > v64 ? v53 - v64 : v64 - v53) + (v44 > v55 ? v44 - v55 : v55 - v44) + (v35 > v46 ? v35 - v46 : v46 - v35) + (v55 > v66 ? v55 - v66 : v66 - v55)) * ih);
                d[8]  = Math.exp(-((v53 > v44 ? v53 - v44 : v44 - v53) + (v73 > v64 ? v73 - v64 : v64 - v73) + (v64 > v55 ? v64 - v55 : v55 - v64) + (v55 > v46 ? v55 - v46 : v46 - v55) + (v75 > v66 ? v75 - v66 : v66 - v75)) * ih);
                d[9]  = Math.exp(-((v24 > v44 ? v24 - v44 : v44 - v24) + (v44 > v64 ? v44 - v64 : v64 - v44) + (v35 > v55 ? v35 - v55 : v55 - v35) + (v26 > v46 ? v26 - v46 : v46 - v26) + (v46 > v66 ? v46 - v66 : v66 - v46)) * ih);
                d[11] = Math.exp(-((v64 > v44 ? v64 - v44 : v44 - v64) + (v84 > v64 ? v84 - v64 : v64 - v84) + (v75 > v55 ? v75 - v55 : v55 - v75) + (v66 > v46 ? v66 - v46 : v46 - v66) + (v86 > v66 ? v86 - v66 : v66 - v86)) * ih);
                // d[12] = Math.exp(-((v15 > v44 ? v15 - v44 : v44 - v15) + (v35 > v64 ? v35 - v64 : v64 - v35) + (v26 > v55 ? v26 - v55 : v55 - v26) + (v17 > v46 ? v17 - v46 : v46 - v17) + (v37 > v66 ? v37 - v66 : v66 - v37)) * ih);
                d[13] = Math.exp(-((v35 > v44 ? v35 - v44 : v44 - v35) + (v55 > v64 ? v55 - v64 : v64 - v55) + (v46 > v55 ? v46 - v55 : v55 - v46) + (v37 > v46 ? v37 - v46 : v46 - v37) + (v57 > v66 ? v57 - v66 : v66 - v57)) * ih);
                d[14] = Math.exp(-((v55 > v44 ? v55 - v44 : v44 - v55) + (v75 > v64 ? v75 - v64 : v64 - v75) + (v66 > v55 ? v66 - v55 : v55 - v66) + (v57 > v46 ? v57 - v46 : v46 - v57) + (v77 > v66 ? v77 - v66 : v66 - v77)) * ih);
                d[15] = Math.exp(-((v26 > v44 ? v26 - v44 : v44 - v26) + (v46 > v64 ? v46 - v64 : v64 - v46) + (v37 > v55 ? v37 - v55 : v55 - v37) + (v28 > v46 ? v28 - v46 : v46 - v28) + (v48 > v66 ? v48 - v66 : v66 - v48)) * ih);
                d[16] = Math.exp(-((v46 > v44 ? v46 - v44 : v44 - v46) + (v66 > v64 ? v66 - v64 : v64 - v66) + (v57 > v55 ? v57 - v55 : v55 - v57) + (v48 > v46 ? v48 - v46 : v46 - v48) + (v68 > v66 ? v68 - v66 : v66 - v68)) * ih);
                d[17] = Math.exp(-((v66 > v44 ? v66 - v44 : v44 - v66) + (v86 > v64 ? v86 - v64 : v64 - v86) + (v77 > v55 ? v77 - v55 : v55 - v77) + (v68 > v46 ? v68 - v46 : v46 - v68) + (v88 > v66 ? v88 - v66 : v66 - v88)) * ih);
                var sum = 1 + d[3] + d[4] + d[5] + d[8] + d[9] + d[11] + d[13] + d[14] + d[15] + d[16] + d[17];
                od[yx + ny + 1] = (v55 + d[3] * v33 + d[4] * v53 + d[5] * v73 + d[8] * v64 + d[9] * v35 + d[11] * v75 + d[13] * v46 + d[14] * v66 + d[15] * v37 + d[16] * v57 + d[17] * v77) / sum;

                // BLUE Patch
                ih = 0;
                d[0]  = Math.exp(-((v01 > v23 ? v01 - v23 : v23 - v01) + (v21 > v43 ? v21 - v43 : v43 - v21) + (v41 > v63 ? v41 - v63 : v63 - v41) + (v03 > v25 ? v03 - v25 : v25 - v03) + (v23 > v45 ? v23 - v45 : v45 - v23) + (v43 > v65 ? v43 - v65 : v65 - v43) + (v05 > v27 ? v05 - v27 : v27 - v05) + (v25 > v47 ? v25 - v47 : v47 - v25) + (v45 > v67 ? v45 - v67 : v67 - v45)) * ih);
                d[1]  = Math.exp(-((v21 > v23 ? v21 - v23 : v23 - v21) + (v41 > v43 ? v41 - v43 : v43 - v41) + (v61 > v63 ? v61 - v63 : v63 - v61) + (v23 > v25 ? v23 - v25 : v25 - v23) + (v43 > v45 ? v43 - v45 : v45 - v43) + (v63 > v65 ? v63 - v65 : v65 - v63) + (v25 > v27 ? v25 - v27 : v27 - v25) + (v45 > v47 ? v45 - v47 : v47 - v45) + (v65 > v67 ? v65 - v67 : v67 - v65)) * ih);
                d[2]  = Math.exp(-((v41 > v23 ? v41 - v23 : v23 - v41) + (v61 > v43 ? v61 - v43 : v43 - v61) + (v81 > v63 ? v81 - v63 : v63 - v81) + (v43 > v25 ? v43 - v25 : v25 - v43) + (v63 > v45 ? v63 - v45 : v45 - v63) + (v83 > v65 ? v83 - v65 : v65 - v83) + (v45 > v27 ? v45 - v27 : v27 - v45) + (v65 > v47 ? v65 - v47 : v47 - v65) + (v85 > v67 ? v85 - v67 : v67 - v85)) * ih);
                d[3]  = Math.exp(-((v03 > v23 ? v03 - v23 : v23 - v03) + (v23 > v43 ? v23 - v43 : v43 - v23) + (v43 > v63 ? v43 - v63 : v63 - v43) + (v05 > v25 ? v05 - v25 : v25 - v05) + (v25 > v45 ? v25 - v45 : v45 - v25) + (v45 > v65 ? v45 - v65 : v65 - v45) + (v07 > v27 ? v07 - v27 : v27 - v07) + (v27 > v47 ? v27 - v47 : v47 - v27) + (v47 > v67 ? v47 - v67 : v67 - v47)) * ih);
                d[4]  = 0;
                d[5]  = Math.exp(-((v43 > v23 ? v43 - v23 : v23 - v43) + (v63 > v43 ? v63 - v43 : v43 - v63) + (v83 > v63 ? v83 - v63 : v63 - v83) + (v45 > v25 ? v45 - v25 : v25 - v45) + (v65 > v45 ? v65 - v45 : v45 - v65) + (v85 > v65 ? v85 - v65 : v65 - v85) + (v47 > v27 ? v47 - v27 : v27 - v47) + (v67 > v47 ? v67 - v47 : v47 - v67) + (v87 > v67 ? v87 - v67 : v67 - v87)) * ih);
                d[6]  = Math.exp(-((v05 > v23 ? v05 - v23 : v23 - v05) + (v25 > v43 ? v25 - v43 : v43 - v25) + (v45 > v63 ? v45 - v63 : v63 - v45) + (v07 > v25 ? v07 - v25 : v25 - v07) + (v27 > v45 ? v27 - v45 : v45 - v27) + (v47 > v65 ? v47 - v65 : v65 - v47) + (v09 > v27 ? v09 - v27 : v27 - v09) + (v29 > v47 ? v29 - v47 : v47 - v29) + (v49 > v67 ? v49 - v67 : v67 - v49)) * ih);
                d[7]  = Math.exp(-((v25 > v23 ? v25 - v23 : v23 - v25) + (v45 > v43 ? v45 - v43 : v43 - v45) + (v65 > v63 ? v65 - v63 : v63 - v65) + (v27 > v25 ? v27 - v25 : v25 - v27) + (v47 > v45 ? v47 - v45 : v45 - v47) + (v67 > v65 ? v67 - v65 : v65 - v67) + (v29 > v27 ? v29 - v27 : v27 - v29) + (v49 > v47 ? v49 - v47 : v47 - v49) + (v69 > v67 ? v69 - v67 : v67 - v69)) * ih);
                d[8]  = Math.exp(-((v45 > v23 ? v45 - v23 : v23 - v45) + (v65 > v43 ? v65 - v43 : v43 - v65) + (v85 > v63 ? v85 - v63 : v63 - v85) + (v47 > v25 ? v47 - v25 : v25 - v47) + (v67 > v45 ? v67 - v45 : v45 - v67) + (v87 > v65 ? v87 - v65 : v65 - v87) + (v49 > v27 ? v49 - v27 : v27 - v49) + (v69 > v47 ? v69 - v47 : v47 - v69) + (v89 > v67 ? v89 - v67 : v67 - v89)) * ih);
                sum = 1 + d[0] + d[1] + d[2] + d[3] + d[4] + d[5] + d[6] + d[7] + d[8];
                od[yx + ny] = (d[0] * v23 + d[1] * v43 + d[2] * v63 + d[3] * v25 + v45 + d[5] * v65 + d[6] * v27 + d[7] * v47 + d[8] * v67) / sum;

                // RED Patch
                ih = 0.1;
                d[0]  = Math.exp(-((v10 > v32 ? v10 - v32 : v32 - v10) + (v30 > v52 ? v30 - v52 : v52 - v30) + (v50 > v72 ? v50 - v72 : v72 - v50) + (v12 > v34 ? v12 - v34 : v34 - v12) + (v32 > v54 ? v32 - v54 : v54 - v32) + (v52 > v74 ? v52 - v74 : v74 - v52) + (v14 > v36 ? v14 - v36 : v36 - v14) + (v34 > v56 ? v34 - v56 : v56 - v34) + (v54 > v76 ? v54 - v76 : v76 - v54)) * ih);
                d[1]  = Math.exp(-((v30 > v32 ? v30 - v32 : v32 - v30) + (v50 > v52 ? v50 - v52 : v52 - v50) + (v70 > v72 ? v70 - v72 : v72 - v70) + (v32 > v34 ? v32 - v34 : v34 - v32) + (v52 > v54 ? v52 - v54 : v54 - v52) + (v72 > v74 ? v72 - v74 : v74 - v72) + (v34 > v36 ? v34 - v36 : v36 - v34) + (v54 > v56 ? v54 - v56 : v56 - v54) + (v74 > v76 ? v74 - v76 : v76 - v74)) * ih);
                d[2]  = Math.exp(-((v50 > v32 ? v50 - v32 : v32 - v50) + (v70 > v52 ? v70 - v52 : v52 - v70) + (v90 > v72 ? v90 - v72 : v72 - v90) + (v52 > v34 ? v52 - v34 : v34 - v52) + (v72 > v54 ? v72 - v54 : v54 - v72) + (v92 > v74 ? v92 - v74 : v74 - v92) + (v54 > v36 ? v54 - v36 : v36 - v54) + (v74 > v56 ? v74 - v56 : v56 - v74) + (v94 > v76 ? v94 - v76 : v76 - v94)) * ih);
                d[3]  = Math.exp(-((v12 > v32 ? v12 - v32 : v32 - v12) + (v32 > v52 ? v32 - v52 : v52 - v32) + (v52 > v72 ? v52 - v72 : v72 - v52) + (v14 > v34 ? v14 - v34 : v34 - v14) + (v34 > v54 ? v34 - v54 : v54 - v34) + (v54 > v74 ? v54 - v74 : v74 - v54) + (v16 > v36 ? v16 - v36 : v36 - v16) + (v36 > v56 ? v36 - v56 : v56 - v36) + (v56 > v76 ? v56 - v76 : v76 - v56)) * ih);
                d[5]  = Math.exp(-((v52 > v32 ? v52 - v32 : v32 - v52) + (v72 > v52 ? v72 - v52 : v52 - v72) + (v92 > v72 ? v92 - v72 : v72 - v92) + (v54 > v34 ? v54 - v34 : v34 - v54) + (v74 > v54 ? v74 - v54 : v54 - v74) + (v94 > v74 ? v94 - v74 : v74 - v94) + (v56 > v36 ? v56 - v36 : v36 - v56) + (v76 > v56 ? v76 - v56 : v56 - v76) + (v96 > v76 ? v96 - v76 : v76 - v96)) * ih);
                d[6]  = Math.exp(-((v14 > v32 ? v14 - v32 : v32 - v14) + (v34 > v52 ? v34 - v52 : v52 - v34) + (v54 > v72 ? v54 - v72 : v72 - v54) + (v16 > v34 ? v16 - v34 : v34 - v16) + (v36 > v54 ? v36 - v54 : v54 - v36) + (v56 > v74 ? v56 - v74 : v74 - v56) + (v18 > v36 ? v18 - v36 : v36 - v18) + (v38 > v56 ? v38 - v56 : v56 - v38) + (v58 > v76 ? v58 - v76 : v76 - v58)) * ih);
                d[7]  = Math.exp(-((v34 > v32 ? v34 - v32 : v32 - v34) + (v54 > v52 ? v54 - v52 : v52 - v54) + (v74 > v72 ? v74 - v72 : v72 - v74) + (v36 > v34 ? v36 - v34 : v34 - v36) + (v56 > v54 ? v56 - v54 : v54 - v56) + (v76 > v74 ? v76 - v74 : v74 - v76) + (v38 > v36 ? v38 - v36 : v36 - v38) + (v58 > v56 ? v58 - v56 : v56 - v58) + (v78 > v76 ? v78 - v76 : v76 - v78)) * ih);
                d[8]  = Math.exp(-((v54 > v32 ? v54 - v32 : v32 - v54) + (v74 > v52 ? v74 - v52 : v52 - v74) + (v94 > v72 ? v94 - v72 : v72 - v94) + (v56 > v34 ? v56 - v34 : v34 - v56) + (v76 > v54 ? v76 - v54 : v54 - v76) + (v96 > v74 ? v96 - v74 : v74 - v96) + (v58 > v36 ? v58 - v36 : v36 - v58) + (v78 > v56 ? v78 - v56 : v56 - v78) + (v98 > v76 ? v98 - v76 : v76 - v98)) * ih);
                sum = 1 + d[0] + d[1] + d[2] + d[3] + d[4] + d[5] + d[6] + d[7] + d[8];
                od[yx + 1] = (d[0] * v32 + d[1] * v52 + d[2] * v72 + d[3] * v34 + v54 + d[5] * v74 + d[6] * v36 + d[7] * v56 + d[8] * v76) / sum;
            }
        }
        return out;
    };

    ImagePipe.apply5x5SymFilter = function (image, coefs) {
        var size = image.size(), ny = size[0], nx = size[1];
        var out = Matrix.zeros(ny, nx, 3, 'single');
        var id = image.getData(), od = out.getData();

        var c0 = coefs[0], c1 = coefs[1], c2 = coefs[2], c3 = coefs[3], c4 = coefs[4], c5 = 1 - 4 * (c0 + 2 * c1 + c2 + c3 + c4);

        var _x, yx, _xe, yxe, ny2 = 2 * ny, c, ce;
        for (c = 0, ce = nx * ny * 3; c < ce; c += ny * nx) {
            for (_x = c + 2 * ny, _xe = c + (nx - 2) * ny; _x < _xe; _x += ny) {
                for (yx = _x + 2, yxe = _x + ny - 2; yx < yxe; yx += 1) {
                    od[yx] = (id[yx - ny2 - 2] + id[yx - ny2 + 2] + id[yx + ny2 - 2] + id[yx + ny2 + 2]) * c0 +
                             (id[yx - ny - 2] + id[yx + ny - 2] + id[yx - ny2 - 1] + id[yx + ny2 - 1] + id[yx - ny2 + 1] + id[yx + ny2 + 1] + id[yx + ny + 2] + id[yx - ny + 2]) * c1 +
                             (id[yx - 2] + id[yx - ny2] + id[yx + ny2] + id[yx + 2]) * c2 +
                             (id[yx - ny - 1] + id[yx + ny - 1] + id[yx - ny + 1] + id[yx + ny + 1]) * c3 +
                             (id[yx - 1] + id[yx - ny] + id[yx + ny] + id[yx + 1]) * c4 +
                             id[yx - ny] * c5;
                }
            }
        }
        return out;
    };

    ImagePipe.saturateColorMatrix = function (M, saturation) {
        var O = Matrix.toMatrix([
            0.33, 0.34,  0.33,
            0.50, 0.00, -0.50,
           -0.25, 0.50, -0.25
        ]).reshape(3, 3).transpose();
        var s = 0, S = Matrix.toMatrix([
            1.00,       0.00,       0.00,
            0.00, saturation,       0.00,
            0.00,       0.00, saturation
        ]).reshape(3, 3).transpose();
        S = O.inv().mtimes(S).mtimes(O);
        return M.mtimes(S);
    };

    ImagePipe.computeColorMatrix = function (root, parameters) {
        var AsShotNeutral;
        if (root.AsShotNeutral && root.AsShotNeutral.type === "RATIONAL") {
            AsShotNeutral = [];
            for (var v = 0; v < root.AsShotNeutral.value.numerator.length; v++) {
                AsShotNeutral[v] = root.AsShotNeutral.value.numerator[v] / root.AsShotNeutral.value.denominator[v];
            }
        }

        var matrices = {};
        if (root.AnalogBalance) {
            var m = Matrix.toMatrix(root.AnalogBalance.value.numerator)["./"](Matrix.toMatrix(root.AnalogBalance.value.denominator));
            matrices["AnalogBalance"] = Matrix.diag(m);
        } else {
            matrices["AnalogBalance"] = Matrix.eye(3);
        }

        for (var mat of ["CameraCalibration1", "CameraCalibration2", "ColorMatrix1", "ColorMatrix2"]) {
            if (root[mat]) {
                var m = Matrix.toMatrix(root[mat].value.numerator)["./"](Matrix.toMatrix(root[mat].value.denominator));
                matrices[mat] = m.reshape(3, 3).transpose();
            } else {
                matrices[mat] = Matrix.eye(3);
            }
        }

        var AB = matrices["AnalogBalance"],
            CC = matrices["CameraCalibration1"],
            CM = matrices["ColorMatrix1"];

        // Get XYZ matrices
        var XYZ2cRGB = AB["*"](CC)["*"](CM), cRGB2XYZ = XYZ2cRGB.inv();
        var Madap;
        if (AsShotNeutral) {
            // Find xy neutral value
            var xyWP = cRGB2XYZ["*"](AsShotNeutral);
            var Mcat = Matrix.toMatrix([0.8951, -0.7502, 0.0389, 0.2664, 1.7135, -0.0685, -0.1614, 0.0367, 1.0296]).reshape(3, 3), IMcat = Mcat.inv();
            var D = Mcat.mtimes(Matrix.Colorspaces["xyY to XYZ"](Matrix.CIE.getIlluminant("D50")));
            // var D = Mcat.mtimes(Matrix.Colorspaces["xyY to XYZ"](Matrix.CIE.getIlluminant("D65")));
            var S = Mcat.mtimes(xyWP);
            Madap = IMcat.mtimes(Matrix.diag(D['./'](S))).mtimes(Mcat);
            // White balanced XYZ transform
        } else {
            Madap = Matrix.eye(3);
        }
        var XYZ2sRGB = Matrix.toMatrix([3.1338561, -1.6168667, -0.4906146, -0.9787684,  1.9161415,  0.0334540, 0.0719453, -0.2289914,  1.4052427]).reshape(3, 3).transpose();
        var cRGB2sRGB = XYZ2sRGB.mtimes(Madap).mtimes(cRGB2XYZ) ;
        return cRGB2sRGB;
    };

    ImagePipe.hardThreshold = function (image, min, max) {
        var id = image.getData();
        for (var i = 0, ie = id.length; i < ie; i++) {
            if (id[i] > max) {
                id[i] = max;
            } else if (id[i] < min) {
                id[i] = min;
            }
        }
        return image;
    };

    ImagePipe.greyWorld = function (image) {
        var size = image.size();
        var ill = image.reshape(size[0] * size[1], 3).mean(0);
        console.log(image.min(0).getData(), ill.getData());
        image.reshape(size);
        var sum = ill['.*'](ill).sum().sqrt();
        ill = ill['/='](sum)["*="](Math.sqrt(3));
        console.log(ill.getData());
        ill = ill.ldivide(1).getData();
        console.log(ill);
        var nxy = image.getSize(1) * image.getSize(0);
        var id = image.getData(),
            R = id.subarray(      0,     nxy),
            G = id.subarray(    nxy, 2 * nxy),
            B = id.subarray(2 * nxy, 3 * nxy);
        for (var n = 0, ne = R.length; n < ne; n++) {
            R[n] *= ill[0];
            G[n] *= ill[1];
            B[n] *= ill[2];
        }
        return image;
    };

    ImagePipe.applySRGBGamma = function (image, resolution) {
        var lut = new Float64Array(resolution);
        var a = 0.055, I2D4 = 1 / 2.4, v, ires = 1 / resolution;
        for (var i = 0; i < resolution; i++) {
            v = i * ires;
            lut[i] = (v > 0.0031308) ? (1.055 * Math.pow(v, I2D4) - a) : (v * 12.92);
        }
        var data = image.getData(), dLength = data.length;
        for (var i = 0; i < dLength; i++) {
            var v = Math.floor(data[i] * resolution);
            if (v >= resolution) {
                data[i] = lut[resolution - 1];
            } else if (v < 0) {
                data[i] = 0;
            } else {
                data[i] = lut[v];
            }
        }
        return image;
    };

    ImagePipe.developDNG = function (dngRoot, dngImage) {

        Tools.tic();
        var CFA = ImagePipe.reshapeCFA(dngImage);
        console.log("CFA reshaped in", Tools.toc(), "ms");

        if (dngImage.LinearizationTable) {
            Tools.tic();
            ImagePipe.applyLut(CFA, dngImage.LinearizationTable.value);
            console.log("Linearization table applied in", Tools.toc(), "ms");
        }

        Tools.tic();
        // ImagePipe.blackPoint(CFA, dngImage);
        ImagePipe.blackAndWhitePoints(CFA, dngImage);
        console.log("Black point removed in", Tools.toc(), "ms");

        /*
        Tools.tic();
        CFA = ImagePipe.applyBayerNLM(CFA);
        console.log("RAW denoised in", Tools.toc(), "ms");
        */

        if (dngRoot.OpcodeList2) {
            window.maps = DNG.OpcodeList2.value;
            Tools.tic();
            ImagePipe.applyGainMap(dngRoot, CFA, dngRoot.OpcodeList2.value[0]);
            ImagePipe.applyGainMap(dngRoot, CFA, dngRoot.OpcodeList2.value[1]);
            ImagePipe.applyGainMap(dngRoot, CFA, dngRoot.OpcodeList2.value[2]);
            ImagePipe.applyGainMap(dngRoot, CFA, dngRoot.OpcodeList2.value[3]);
            console.log("Gain Map applied in", Tools.toc(), "ms");
        }

        Tools.tic();
        var RAW = ImagePipe.demosaic(CFA, dngImage);
        console.log("RAW demosaiced in", Tools.toc(), "ms");

        /*
        Tools.tic();
        RAW.set([], [], 0, RAW.get([], [], 0).boxFilter(7));
        RAW.set([], [], 1, RAW.get([], [], 1).boxFilter(5));
        RAW.set([], [], 2, RAW.get([], [], 2).boxFilter(11));
        console.log("BoxFilter applied in", Tools.toc(), "ms");
        */
        /*
        Tools.tic();
        RAW = RAW.sqrt().imbilateral(5, 0.01, 5).power(2);
        console.log("Bilateral denoising applied in", Tools.toc(), "ms");
        */
        /*
        Tools.tic();
        RAW = RAW.sqrt().wdenoise(0.1, 'coif2').power(2);
        console.log("Wavelet denoising applied in", Tools.toc(), "ms");
        */


        Tools.tic();
        var CM = ImagePipe.computeColorMatrix(dngRoot, dngImage);
        // CM = saturateColorMatrix(CM, 1.3);
        var IMAGE = RAW.applycform(CM);
        console.log("Color Matrix applied in", Tools.toc(), "ms");

        /*
        Tools.tic();
        ImagePipe.hardThreshold(IMAGE, 0, 1);
        console.log("Image threshold applied in", Tools.toc(), "ms");
        Tools.tic();
        ImagePipe.greyWorld(IMAGE);
        console.log("White balance applied in", Tools.toc(), "ms");
        */
        /*
        Tools.tic();
        RAW = RAW.colorEnhancement(.05, 15, 10, "sym4", 0.1)
        console.log("Wavelet enhancement applied in", Tools.toc(), "ms");
        */

        Tools.tic();
        ImagePipe.applySRGBGamma(IMAGE, 4096);
        console.log("sRGB tone curve applied in", Tools.toc(), "ms");
        //RAW = RAW.imfilter(Matrix.fspecial("unsharp"));

        /*
        if (window.NOFILTER !== true) {
            Tools.tic();
            IMAGE = ImagePipe.apply5x5SymFilter(IMAGE, [-0.05859375, -0.05859375, -0.09765625, 0.05859375, 0.234375])
            var filter = Matrix.toMatrix([
                -30, -30, -50, -30,	-30,
                -30,  30, 120,  30,	-30,
                -50, 120, 472, 120,	-50,
                -30,  30, 120,  30,	-30,
                -30, -30, -50, -30,	-30
            ]).rdivide(512).reshape(5, 5).transpose();
            // IMAGE = ImagePipe.apply5x5Filter(IMAGE, filter);
            // IMAGE = IMAGE.imfilter(filter);
            console.log("5x5 filter applied in", Tools.toc(), "ms");
        }*/

        /*
        Tools.tic();
        IMAGE = IMAGE.wdenoise(0.5, "coif2");
        console.log("Wavelet denoising applied in", Tools.toc(), "ms");
        */

        /*
        Tools.tic();
        ImagePipe.hardThreshold(IMAGE, 0, 1)
        IMAGE = IMAGE.histeq(4096);
        console.log("image equalization applied in", Tools.toc(), "ms");
        */
        /*
        Tools.tic();
        RAW = RAW.colorEnhancement(0.6, 5, 10, "coif2", 0.15)
        console.log("Wavelet enhancement applied in", Tools.toc(), "ms");
        */
        return {
            "CFA": CFA,
            "image": IMAGE
        }
    };
    global.ImagePipe = ImagePipe;

})(window);
