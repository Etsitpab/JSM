var global = (typeof module !== 'undefined' && module.exports) ? GLOBAL : window;
(function () {
    'use strict';
    var ImagePipe = {};

    ImagePipe.readField = function (field) {
        var value = field.value,
            type = field.type,
            count = field.count;
        if ((type === "RATIONAL" || type === "SRATIONAL")  && count === 1) {
            return value.numerator / value.denominator;
        }
        if ((type === "RATIONAL" || type === "SRATIONAL") && count >= 1) {
            var v, out = [];
            for (v = 0; v < value.numerator.length; v++) {
                out[v] = value.numerator[v] / value.denominator[v];
            }
            return out
        }
        return value;
    };

    ImagePipe.writeField = function (field, value, type) {
        var count = Tools.isArrayLike(value) ? value.length : 1;
        type = type === undefined ? field.type : type;
        field.type = type;
        if ((type === "RATIONAL" || type === "SRATIONAL")  && count === 1) {
            field.value = {
                "numerator": Math.round(value * 65535),
                "denominator": 65535
            }
        } else if ((type === "RATIONAL" || type === "SRATIONAL") && count >= 1) {
            var v;
            field.value = {
                "numerator": [],
                "denominator": []
            }
            for (v = 0; v < count; v++) {
                field.value.numerator[v] = Math.round(value[v] * 65535)
                field.value.denominator[v] = 65535
            }
        }
    };

    ImagePipe.reshapeCFA = function (root, parameters) {
        var CFAView = new MatrixView([parameters.ImageWidth.value, parameters.ImageLength.value]);
        // parameters.ActiveArea = {"value": [2750, 3750, 3250, 5500]};
        // Image crop
        if (parameters.ActiveArea) {
            var crop = parameters.ActiveArea.value;
            CFAView.select([crop[1], crop[3] - 1], [crop[0], crop[2] - 1]);
        }

        // CFA view rotation
        var Orientation = root.Orientation ? root.Orientation.value : 1;
        if (Orientation === 3){
            CFAView.rot90(2);
        } else if (Orientation !== 1) {
            console.warn("DNG Processor: Orientation " + Orientation + " is not yet supported");
        }

        // CFA view transpose and data extraction
        CFAView.permute([1, 0]);
        var CFA = new Float32Array(CFAView.getLength());
        CFAView.extractFrom(parameters.ImageData, CFA);
        return new Matrix([CFAView.getSize(0), CFAView.getSize(1)], CFA);
    };

    (function () {
        var applyLutInteger = function (data, lut) {
            data = data.getData();
            var resolution = lut.length, dLength = data.length;
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
        };
        var applyLutFloat = function (data, lut) {
            data = data.getData();
            var resolution = lut.length, dLength = data.length;
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
        };
        ImagePipe.applyLut = function (data, lut) {
            return (data.isfloat() ? applyLutFloat : applyLutInteger)(data, lut);
        };
    })();

    ImagePipe.blackAndWhiteLevels = function (image, parameters) {
        var BlackLevel = [0, 0, 0, 0], WhiteLevel = Math.pow(2, ImagePipe.readField(parameters.BitsPerSample)) - 1;
        if (parameters.BlackLevel) {
            var BlackLevelRepeatDim = [1, 1];
            if (parameters.BlackLevelRepeatDim) {
                BlackLevelRepeatDim = ImagePipe.readField(parameters.BlackLevelRepeatDim);
            }
            var BlackLevel = ImagePipe.readField(parameters.BlackLevel),
                SamplesPerPixel = ImagePipe.readField(parameters.SamplesPerPixel);
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
            WhiteLevel = ImagePipe.readField(parameters.WhiteLevel);
            if (!Tools.isNumber(WhiteLevel)) {
                throw new Error("DNG Processor: WhiteLevel must be a number.");
            }
        }
        var BL0 = BlackLevel[0], BL1 = BlackLevel[1], BL2 = BlackLevel[2], BL3 = BlackLevel[3];
        console.log([BL0, BL1, BL2, BL3]);
        var maxBL = Math.max(BL0, BL1, BL2, BL3);
        var iWL0 = 1 / (WhiteLevel - maxBL), iWL1 = 1 / (WhiteLevel - maxBL), iWL2 = 1 / (WhiteLevel - maxBL), iWL3 = 1 / (WhiteLevel - maxBL);
        var size = image.size(), ny = size[0], nx = size[1], id = image.getData();
        var _x, yx, _xe, yxe, ny2 = 2 * ny;
        for (_x = 0, _xe = nx * ny; _x < _xe; _x += ny2) {
            for (yx = _x, yxe = _x + ny; yx < yxe; yx += 2) {
                id[yx]          = id[yx]          < BL0 ? 0 : (id[yx]          - BL0) * iWL0;
                id[yx + ny]     = id[yx + ny]     < BL1 ? 0 : (id[yx + ny]     - BL1) * iWL1;
                id[yx + 1]      = id[yx + 1]      < BL2 ? 0 : (id[yx + 1]      - BL2) * iWL2;
                id[yx + ny + 1] = id[yx + ny + 1] < BL3 ? 0 : (id[yx + ny + 1] - BL3) * iWL3;
            }
        }
        return image;
    };

    ImagePipe.getCFAPattern = function (root, parameters) {
        // CFAPattern rotation
        var Orientation = root.Orientation ? root.Orientation.value : 1;
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
        var mapOut = map, Orientation = ImagePipe.readField(dng.Orientation);
        if (Orientation === 3) {
            var Top = map.Top, Bottom = map.Bottom, Left = map.Left, Right = map.Right;
            var RowPitch = map.RowPitch, ColPitch = map.ColPitch;

            // -1 because Bottom and Right are not included
            var lastV = Math.floor((Bottom - 1 - Top) / RowPitch) * RowPitch + Top;
            var lastH = Math.floor((Right - 1 - Left) / ColPitch) * ColPitch + Left;

            mapOut = {
                "Top":         image.size(0) - 1 - lastV,
                "Left":        image.size(1) - 1 - lastH,
                "Bottom":      image.size(0) - Top,
                "Right":       image.size(1) - Left,
                "Plane":       map.Plane,
                "Planes":      map.Planes,
                "RowPitch":    map.RowPitch,
                "ColPitch":    map.ColPitch,
                "MapPointsV":  map.MapPointsV,
                "MapPointsH":  map.MapPointsH,
                "MapSpacingV": map.MapSpacingV,
                "MapSpacingH": map.MapSpacingH,
                "MapOriginV":  map.MapOriginV,
                "MapOriginH":  map.MapOriginH,
                "MapPlanes":   map.MapPlanes,
                "mapValues":   map.mapValues.fliplr().flipud()
            }
        } else if (Orientation !== 1) {
            console.warn("DNG Processor: Orientation " + Orientation + " is not yet supported");
        }
        return mapOut;
    };

    ImagePipe.applyMap = function (dng, image, map, type, perc) {
        map = ImagePipe.processMap(dng, image, map);

        var size = image.size(), ny = size[0], nx = size[1], id = image.getData();
        var MapSizeH = map.MapSpacingH * (map.MapPointsH - 1),
            MapSizeV = map.MapSpacingV * (map.MapPointsV - 1);
        var x0 = map.Left, y0 = map.Top, dx = map.ColPitch , dy = map.RowPitch;
        var _x, yx, _xe, yxe, x, y;

        // Replicate last values for interpolation purpose
        var mapValues = map.mapValues.permute([2, 1, 0]).padarray("sym", [0, 1], [0, 1]);

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
        var bottom = map.Bottom, right = map.Right, values;
        if (type === "multiplicative") {
            // Apply only a given percentage of the map.
            perc = perc === undefined ? 1 : perc;
            mapValues["-="](1)["*="](perc)["+="](1);
            values = mapValues.getData();

            for (_x = x0 * ny, x = x0, _xe = right * ny; _x < _xe; _x += dx * ny, x += dx) {
                var xpf = xIndFloat[x], xp = xIndInt[x];
                var xInd = xp * nym;
                for (yx = _x + y0, y = y0, yxe = _x + bottom; yx < yxe; yx += dy, y += dy) {
                    var ind = xInd + yIndInt[y];
                    var a = values[ind],     c = values[ind + nym],
                        b = values[ind + 1], d = values[ind + nym + 1];
                    // var val = (a * (1 - xpf) + c * xpf) * (1 - ypf) + (b * (1 - xpf) + d * xpf) * ypf;
                    id[yx] *= (a + (c - a) * xpf) + (b - a + (a - c + d - b) * xpf) * yIndFloat[y];
                }
            }
        } else if (type === "additive") {
            // Apply only a given percentage of the map.
            perc = perc === undefined ? 1 : perc;
            map.mapValues["*="](perc);
            values = mapValues.getData();

            for (_x = x0 * ny, x = x0, _xe = right * ny; _x < _xe; _x += dx * ny, x += dx) {
                var xpf = xIndFloat[x], xp = xIndInt[x];
                var xInd = xp * nym;
                for (yx = _x + y0, y = y0, yxe = _x + bottom; yx < yxe; yx += dy, y += dy) {
                    var ind = xInd + yIndInt[y];
                    var a = values[ind],     c = values[ind + nym],
                        b = values[ind + 1], d = values[ind + nym + 1];
                    id[yx] += (a + (c - a) * xpf) + (b - a + (a - c + d - b) * xpf) * yIndFloat[y];
                }
            }
        }
        return image;
    };

    ImagePipe.demosaic = function (image, root, parameters) {
        var size = image.size(), ny = size[0], nx = size[1];
        var CFAPattern = ImagePipe.getCFAPattern(root, parameters);
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
        // Simplest bilinear interpolation
        if (0) {
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
        } else if (1) { // bilinear interpolation on G, and then on R - G and B - G
            if (0) {
                for (_x = (2 + ox) * ny, _xe = (nx - 2 - ox) * ny; _x < _xe; _x += ny2) {
                    for (yx = _x + 2 + oy, yxe = _x + ny - 2 - oy; yx < yxe; yx += 2) {
                        var                                      i = id[yx + ny - 1],
                                                 f = id[yx],                          n = id[yx + ny2],
                            c = id[yx - ny + 1],                 k = id[yx + ny + 1],
                                                 h = id[yx + 2];
                        var v1 = 0.25 * (c + f + h + k),
                            v2 =  0.25 * (i + f + k + n);
                        Go[yx] = f;
                        Go[yx + 1] = v1;
                        Go[yx + ny] = v2;
                        Go[yx + ny + 1] = k;

                        // Fill red and blue channel with green for next interpolation
                        Ro[yx] = f;
                        Ro[yx + 1] = v1;
                        Ro[yx + ny] = v2;
                        Ro[yx + ny + 1] = k;

                        Bo[yx] = f;
                        Bo[yx + 1] = v1;
                        Bo[yx + ny] = v2;
                        Bo[yx + ny + 1] = k;
                    }
                }
            } else if (1) {
                var ny3 = 3 * ny;
                for (_x = (4 + ox) * ny, _xe = (nx - 4 - ox) * ny; _x < _xe; _x += ny2) {
                    for (yx = _x + 4 + oy, yxe = _x + ny - 4 - oy; yx < yxe; yx += 2) {

                        var                                                                  v03 = id[yx + ny - 2],
                                                                           v12 = id[yx - 1], v13 = id[yx + ny - 1],
                                                    v21 = id[yx - ny],     v22 = id[yx],     v23 = id[yx + ny],     v24 = id[yx + ny2],     v25 = id[yx + ny3],
                            v30 = id[yx - ny2 + 1], v31 = id[yx - ny + 1], v32 = id[yx + 1], v33 = id[yx + ny + 1], v34 = id[yx + ny2 + 1],
                                                                           v42 = id[yx + 2], v43 = id[yx + ny + 2],
                                                                           v52 = id[yx + 3];
                        // Vertical and horizontal green estimates
                        var v322 = 2 * v32, v232 = 2 * v23;
                        var ghv1 = 0.25 * (v22 + v42) + 0.125 * (v322 - v12 - v52),
                            ghh1 = 0.25 * (v31 + v33) + 0.125 * (v322 - v30 - v34);

                        var ghv2 = 0.25 * (v13 + v33) + 0.125 * (v232 - v03 - v43),
                            ghh2 = 0.25 * (v22 + v24) + 0.125 * (v232 - v21 - v25);

                        var v1 = ghv1 + ghh1, v2 = ghv2 + ghh2;

                        Go[yx]          = v22;
                        Go[yx + 1]      = v1;
                        Go[yx + ny]     = v2;
                        Go[yx + ny + 1] = v33;

                        Ro[yx]          = v22;
                        Ro[yx + 1]      = v1;
                        // Ro[yx + ny]     = Go[yx + ny];
                        Ro[yx + ny + 1] = v33;

                        Bo[yx]          = v22;
                        // Bo[yx + 1]      = Go[yx + 1];
                        Bo[yx + ny]     = v2;
                        Bo[yx + ny + 1] = v33;
                    }
                }
            }
            if (0) {
                // Interpolate on R - G and B - G instead of R and B.
                for (_x = (2 + ox) * ny, _xe = (nx - 2 - ox) * ny; _x < _xe; _x += ny2) {
                    for (yx = _x + 2 + oy, yxe = _x + ny - 2 - oy; yx < yxe; yx += 2) {
                        var                      e = id[yx - 1],                      m = id[yx + ny2 - 1],
                            b = id[yx - ny],                     j = id[yx + ny],
                                                 g = id[yx + 1],                      o = id[yx + ny2 + 1],
                            d = id[yx - ny + 2],                 l = id[yx + ny + 2];


                        var d0 = j - Go[yx + ny], d1 = b - Go[yx - ny] + d0, d2 = l - Go[yx + ny + 2];

                        Ro[yx] += 0.50 * d1;
                        Ro[yx + 1] += 0.25 * (d1 + d - Go[yx - ny + 2] + d2);
                        Ro[yx + ny] = j;
                        Ro[yx + ny + 1] += 0.50 * (d0 + d2);

                        var d0 = g - Go[yx + 1], d1 = e - Go[yx - 1] + d0, d2 = o - Go[yx + ny2 + 1];

                        Bo[yx] += 0.50 * d1;
                        Bo[yx + 1] = g;
                        Bo[yx + ny] += 0.25 * (d1 + m - Go[yx + ny2 - 1] + d2);
                        Bo[yx + ny + 1] += 0.50 * (d0 + d2);
                    }
                }
                // Ro.set(Bo);
                // Go.set(Bo);

            } else if (1) {
                for (_x = (2 + ox) * ny, _xe = (nx - 2 - ox) * ny; _x < _xe; _x += ny2) {
                    for (yx = _x + 2 + oy, yxe = _x + ny - 2 - oy; yx < yxe; yx += 2) {
                        var                      e = id[yx - 1],                      m = id[yx + ny2 - 1],
                            b = id[yx - ny],                     j = id[yx + ny],
                                                 g = id[yx + 1],                      o = id[yx + ny2 + 1],
                            d = id[yx - ny + 2],                 l = id[yx + ny + 2];

                            Ro[yx] = 0.50 * (b + j);
                            Ro[yx + 1] = 0.25 * (b + j + d + l);
                            Ro[yx + ny] = j;
                            Ro[yx + ny + 1] = 0.50 * (j + l);

                            Bo[yx] = 0.50 * (e + g);
                            Bo[yx + 1] = g;
                            Bo[yx + ny] = 0.25 * (e + g + m + o);
                            Bo[yx + ny + 1] = 0.50 * (g + o);
                    }
                }
            }
        } else if (0) {
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
                    Go[yx]          = v22;
                    Go[yx + 1]      = 0.5 * (ghv1 + ghh1);
                    Go[yx + ny]     = 0.5 * (ghv2 + ghh2);
                    Go[yx + ny + 1] = v33;

                    Ro[yx]          = v22;
                    Ro[yx + 1]      = Go[yx + 1];
                    Ro[yx + ny]     = Go[yx + ny];
                    Ro[yx + ny + 1] = v33;

                    Bo[yx]          = v22;
                    Bo[yx + 1]      = Go[yx + 1];
                    Bo[yx + ny]     = Go[yx + ny];
                    Bo[yx + ny + 1] = v33;
                    /*
                    Ro[yx] = 0.50 * (v21 + v23);
                    Ro[yx + 1] = 0.25 * (v21 + v23 + v41 + v43);
                    Ro[yx + ny] = v23;
                    Ro[yx + ny + 1] = 0.50 * (v23 + v43);

                    Bo[yx] = 0.50 * (v12 + v32);
                    Bo[yx + 1] = v32;
                    Bo[yx + ny] = 0.25 * (v12 + v32 + v14 + v34);
                    Bo[yx + ny + 1] = 0.50 * (v32 + v34);
                    */
                }
            }
        }
        return out;
    };

    ImagePipe.applyBayerNLM = function (image, hGreen, hRed, hBlue) {
        hGreen = hGreen === undefined ? 1 : hGreen;
        hBlue = hBlue === undefined ? hGreen : hBlue;
        hRed = hRed === undefined ? hGreen : hRed;

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

        var mean, dist;
        var d = new Float32Array(18).fill(1);
        var _x, yx, _xe, yxe, c, ce;
        for (_x = 4 * ny, _xe = (nx - 4) * ny; _x < _xe; _x += 2 * ny) {
            for (yx = _x + 4, yxe = _x + ny - 4; yx < yxe; yx += 2) {
                // var 10x10 neighbourhood
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

                // Dead pixel correction
                mean = (v33 + v53 + v55 + v53) * 0.25;
                dist = (v44 > mean ? v44 - mean : mean - v44) / mean;
                if (dist > 0.1) {
                    v44 = mean;
                }
                mean = (v44 + v64 + v66 + v46) * 0.25;
                dist = (v55 > mean ? v55 - mean : mean - v55) / mean;
                if (dist > 0.1) {
                    v55 = mean;
                }
                mean = (v34 + v74 + v52 + v56) * 0.25;
                dist = (v54 > mean ? v54 - mean : mean - v54) / mean;
                if (dist > 0.1) {
                    v54 = mean;
                }
                mean = (v25 + v65 + v43 + v47) * 0.25;
                dist = (v45 > mean ? v45 - mean : mean - v45) / mean;
                if (dist > 0.1) {
                    v45 = mean;
                }

                // GREEN 1 Patch
                var sum;
                d[7]  = 0;
                d[0]  = Math.exp(-((v11 > v33 ? v11 - v33 : v33 - v11) + (v31 > v53 ? v31 - v53 : v53 - v31) + (v22 > v44 ? v22 - v44 : v44 - v22) + (v13 > v35 ? v13 - v35 : v35 - v13) + (v33 > v55 ? v33 - v55 : v55 - v33)) * hGreen);
                d[1]  = Math.exp(-((v31 > v33 ? v31 - v33 : v33 - v31) + (v51 > v53 ? v51 - v53 : v53 - v51) + (v42 > v44 ? v42 - v44 : v44 - v42) + (v33 > v35 ? v33 - v35 : v35 - v33) + (v53 > v55 ? v53 - v55 : v55 - v53)) * hGreen);
                d[2]  = Math.exp(-((v51 > v33 ? v51 - v33 : v33 - v51) + (v71 > v53 ? v71 - v53 : v53 - v71) + (v62 > v44 ? v62 - v44 : v44 - v62) + (v53 > v35 ? v53 - v35 : v35 - v53) + (v73 > v55 ? v73 - v55 : v55 - v73)) * hGreen);
                d[3]  = Math.exp(-((v22 > v33 ? v22 - v33 : v33 - v22) + (v42 > v53 ? v42 - v53 : v53 - v42) + (v33 > v44 ? v33 - v44 : v44 - v33) + (v24 > v35 ? v24 - v35 : v35 - v24) + (v44 > v55 ? v44 - v55 : v55 - v44)) * hGreen);
                d[4]  = Math.exp(-((v42 > v33 ? v42 - v33 : v33 - v42) + (v62 > v53 ? v62 - v53 : v53 - v62) + (v53 > v44 ? v53 - v44 : v44 - v53) + (v44 > v35 ? v44 - v35 : v35 - v44) + (v64 > v55 ? v64 - v55 : v55 - v64)) * hGreen);
                // d[5]  = Math.exp(-((v62 > v33 ? v62 - v33 : v33 - v62) + (v82 > v53 ? v82 - v53 : v53 - v82) + (v73 > v44 ? v73 - v44 : v44 - v73) + (v64 > v35 ? v64 - v35 : v35 - v64) + (v84 > v55 ? v84 - v55 : v55 - v84)) * hGreen);
                d[6]  = Math.exp(-((v13 > v33 ? v13 - v33 : v33 - v13) + (v33 > v53 ? v33 - v53 : v53 - v33) + (v24 > v44 ? v24 - v44 : v44 - v24) + (v15 > v35 ? v15 - v35 : v35 - v15) + (v35 > v55 ? v35 - v55 : v55 - v35)) * hGreen);
                d[8]  = Math.exp(-((v53 > v33 ? v53 - v33 : v33 - v53) + (v73 > v53 ? v73 - v53 : v53 - v73) + (v64 > v44 ? v64 - v44 : v44 - v64) + (v55 > v35 ? v55 - v35 : v35 - v55) + (v75 > v55 ? v75 - v55 : v55 - v75)) * hGreen);
                d[9]  = Math.exp(-((v24 > v33 ? v24 - v33 : v33 - v24) + (v44 > v53 ? v44 - v53 : v53 - v44) + (v35 > v44 ? v35 - v44 : v44 - v35) + (v26 > v35 ? v26 - v35 : v35 - v26) + (v46 > v55 ? v46 - v55 : v55 - v46)) * hGreen);
                d[10] = Math.exp(-((v44 > v33 ? v44 - v33 : v33 - v44) + (v64 > v53 ? v64 - v53 : v53 - v64) + (v55 > v44 ? v55 - v44 : v44 - v55) + (v46 > v35 ? v46 - v35 : v35 - v46) + (v66 > v55 ? v66 - v55 : v55 - v66)) * hGreen);
                // d[11] = Math.exp(-((v64 > v33 ? v64 - v33 : v33 - v64) + (v84 > v53 ? v84 - v53 : v53 - v84) + (v75 > v44 ? v75 - v44 : v44 - v75) + (v66 > v35 ? v66 - v35 : v35 - v66) + (v86 > v55 ? v86 - v55 : v55 - v86)) * hGreen);
                d[12] = Math.exp(-((v15 > v33 ? v15 - v33 : v33 - v15) + (v35 > v53 ? v35 - v53 : v53 - v35) + (v26 > v44 ? v26 - v44 : v44 - v26) + (v17 > v35 ? v17 - v35 : v35 - v17) + (v37 > v55 ? v37 - v55 : v55 - v37)) * hGreen);
                d[13] = Math.exp(-((v35 > v33 ? v35 - v33 : v33 - v35) + (v55 > v53 ? v55 - v53 : v53 - v55) + (v46 > v44 ? v46 - v44 : v44 - v46) + (v37 > v35 ? v37 - v35 : v35 - v37) + (v57 > v55 ? v57 - v55 : v55 - v57)) * hGreen);
                d[14] = Math.exp(-((v55 > v33 ? v55 - v33 : v33 - v55) + (v75 > v53 ? v75 - v53 : v53 - v75) + (v66 > v44 ? v66 - v44 : v44 - v66) + (v57 > v35 ? v57 - v35 : v35 - v57) + (v77 > v55 ? v77 - v55 : v55 - v77)) * hGreen);
                // d[15] = Math.exp(-((v26 > v33 ? v26 - v33 : v33 - v26) + (v46 > v53 ? v46 - v53 : v53 - v46) + (v37 > v44 ? v37 - v44 : v44 - v37) + (v28 > v35 ? v28 - v35 : v35 - v28) + (v48 > v55 ? v48 - v55 : v55 - v48)) * hGreen);
                // d[16] = Math.exp(-((v46 > v33 ? v46 - v33 : v33 - v46) + (v66 > v53 ? v66 - v53 : v53 - v66) + (v57 > v44 ? v57 - v44 : v44 - v57) + (v48 > v35 ? v48 - v35 : v35 - v48) + (v68 > v55 ? v68 - v55 : v55 - v68)) * hGreen);
                // d[17] = Math.exp(-((v66 > v33 ? v66 - v33 : v33 - v66) + (v86 > v53 ? v86 - v53 : v53 - v86) + (v77 > v44 ? v77 - v44 : v44 - v77) + (v68 > v35 ? v68 - v35 : v35 - v68) + (v88 > v55 ? v88 - v55 : v55 - v88)) * hGreen);
                sum = 1 + d[0] + d[1] + d[2] + d[3] + d[4] + d[6] + d[8] + d[9] + d[10] + d[12] + d[13] + d[14];
                od[yx] = (v44 + d[0] * v22 + d[1] * v42 + d[2] * v62 + d[3] * v33 + d[4] * v53 + d[6] * v24 + d[8] * v64 + d[9] * v35 + d[10] * v55 + d[12] * v26 + d[13] * v46 + d[14] * v66) / sum;

                // GREEN 2 Patch
                d[10] = 0;
                // d[0]  = Math.exp(-((v11 > v44 ? v11 - v44 : v44 - v11) + (v31 > v64 ? v31 - v64 : v64 - v31) + (v22 > v55 ? v22 - v55 : v55 - v22) + (v13 > v46 ? v13 - v46 : v46 - v13) + (v33 > v66 ? v33 - v66 : v66 - v33)) * hGreen);
                // d[1]  = Math.exp(-((v31 > v44 ? v31 - v44 : v44 - v31) + (v51 > v64 ? v51 - v64 : v64 - v51) + (v42 > v55 ? v42 - v55 : v55 - v42) + (v33 > v46 ? v33 - v46 : v46 - v33) + (v53 > v66 ? v53 - v66 : v66 - v53)) * hGreen);
                // d[2]  = Math.exp(-((v51 > v44 ? v51 - v44 : v44 - v51) + (v71 > v64 ? v71 - v64 : v64 - v71) + (v62 > v55 ? v62 - v55 : v55 - v62) + (v53 > v46 ? v53 - v46 : v46 - v53) + (v73 > v66 ? v73 - v66 : v66 - v73)) * hGreen);
                d[3]  = Math.exp(-((v22 > v44 ? v22 - v44 : v44 - v22) + (v42 > v64 ? v42 - v64 : v64 - v42) + (v33 > v55 ? v33 - v55 : v55 - v33) + (v24 > v46 ? v24 - v46 : v46 - v24) + (v44 > v66 ? v44 - v66 : v66 - v44)) * hGreen);
                d[4]  = Math.exp(-((v42 > v44 ? v42 - v44 : v44 - v42) + (v62 > v64 ? v62 - v64 : v64 - v62) + (v53 > v55 ? v53 - v55 : v55 - v53) + (v44 > v46 ? v44 - v46 : v46 - v44) + (v64 > v66 ? v64 - v66 : v66 - v64)) * hGreen);
                d[5]  = Math.exp(-((v62 > v44 ? v62 - v44 : v44 - v62) + (v82 > v64 ? v82 - v64 : v64 - v82) + (v73 > v55 ? v73 - v55 : v55 - v73) + (v64 > v46 ? v64 - v46 : v46 - v64) + (v84 > v66 ? v84 - v66 : v66 - v84)) * hGreen);
                // d[6]  = Math.exp(-((v13 > v44 ? v13 - v44 : v44 - v13) + (v33 > v64 ? v33 - v64 : v64 - v33) + (v24 > v55 ? v24 - v55 : v55 - v24) + (v15 > v46 ? v15 - v46 : v46 - v15) + (v35 > v66 ? v35 - v66 : v66 - v35)) * hGreen);
                d[7]  = Math.exp(-((v33 > v44 ? v33 - v44 : v44 - v33) + (v53 > v64 ? v53 - v64 : v64 - v53) + (v44 > v55 ? v44 - v55 : v55 - v44) + (v35 > v46 ? v35 - v46 : v46 - v35) + (v55 > v66 ? v55 - v66 : v66 - v55)) * hGreen);
                d[8]  = Math.exp(-((v53 > v44 ? v53 - v44 : v44 - v53) + (v73 > v64 ? v73 - v64 : v64 - v73) + (v64 > v55 ? v64 - v55 : v55 - v64) + (v55 > v46 ? v55 - v46 : v46 - v55) + (v75 > v66 ? v75 - v66 : v66 - v75)) * hGreen);
                d[9]  = Math.exp(-((v24 > v44 ? v24 - v44 : v44 - v24) + (v44 > v64 ? v44 - v64 : v64 - v44) + (v35 > v55 ? v35 - v55 : v55 - v35) + (v26 > v46 ? v26 - v46 : v46 - v26) + (v46 > v66 ? v46 - v66 : v66 - v46)) * hGreen);
                d[11] = Math.exp(-((v64 > v44 ? v64 - v44 : v44 - v64) + (v84 > v64 ? v84 - v64 : v64 - v84) + (v75 > v55 ? v75 - v55 : v55 - v75) + (v66 > v46 ? v66 - v46 : v46 - v66) + (v86 > v66 ? v86 - v66 : v66 - v86)) * hGreen);
                // d[12] = Math.exp(-((v15 > v44 ? v15 - v44 : v44 - v15) + (v35 > v64 ? v35 - v64 : v64 - v35) + (v26 > v55 ? v26 - v55 : v55 - v26) + (v17 > v46 ? v17 - v46 : v46 - v17) + (v37 > v66 ? v37 - v66 : v66 - v37)) * hGreen);
                d[13] = Math.exp(-((v35 > v44 ? v35 - v44 : v44 - v35) + (v55 > v64 ? v55 - v64 : v64 - v55) + (v46 > v55 ? v46 - v55 : v55 - v46) + (v37 > v46 ? v37 - v46 : v46 - v37) + (v57 > v66 ? v57 - v66 : v66 - v57)) * hGreen);
                d[14] = Math.exp(-((v55 > v44 ? v55 - v44 : v44 - v55) + (v75 > v64 ? v75 - v64 : v64 - v75) + (v66 > v55 ? v66 - v55 : v55 - v66) + (v57 > v46 ? v57 - v46 : v46 - v57) + (v77 > v66 ? v77 - v66 : v66 - v77)) * hGreen);
                d[15] = Math.exp(-((v26 > v44 ? v26 - v44 : v44 - v26) + (v46 > v64 ? v46 - v64 : v64 - v46) + (v37 > v55 ? v37 - v55 : v55 - v37) + (v28 > v46 ? v28 - v46 : v46 - v28) + (v48 > v66 ? v48 - v66 : v66 - v48)) * hGreen);
                d[16] = Math.exp(-((v46 > v44 ? v46 - v44 : v44 - v46) + (v66 > v64 ? v66 - v64 : v64 - v66) + (v57 > v55 ? v57 - v55 : v55 - v57) + (v48 > v46 ? v48 - v46 : v46 - v48) + (v68 > v66 ? v68 - v66 : v66 - v68)) * hGreen);
                d[17] = Math.exp(-((v66 > v44 ? v66 - v44 : v44 - v66) + (v86 > v64 ? v86 - v64 : v64 - v86) + (v77 > v55 ? v77 - v55 : v55 - v77) + (v68 > v46 ? v68 - v46 : v46 - v68) + (v88 > v66 ? v88 - v66 : v66 - v88)) * hGreen);
                var sum = 1 + d[3] + d[4] + d[5] + d[8] + d[9] + d[11] + d[13] + d[14] + d[15] + d[16] + d[17];
                od[yx + ny + 1] = (v55 + d[3] * v33 + d[4] * v53 + d[5] * v73 + d[8] * v64 + d[9] * v35 + d[11] * v75 + d[13] * v46 + d[14] * v66 + d[15] * v37 + d[16] * v57 + d[17] * v77) / sum;

                // BLUE Patch
                d[0]  = Math.exp(-((v01 > v23 ? v01 - v23 : v23 - v01) + (v21 > v43 ? v21 - v43 : v43 - v21) + (v41 > v63 ? v41 - v63 : v63 - v41) + (v03 > v25 ? v03 - v25 : v25 - v03) + (v23 > v45 ? v23 - v45 : v45 - v23) + (v43 > v65 ? v43 - v65 : v65 - v43) + (v05 > v27 ? v05 - v27 : v27 - v05) + (v25 > v47 ? v25 - v47 : v47 - v25) + (v45 > v67 ? v45 - v67 : v67 - v45)) * hBlue);
                d[1]  = Math.exp(-((v21 > v23 ? v21 - v23 : v23 - v21) + (v41 > v43 ? v41 - v43 : v43 - v41) + (v61 > v63 ? v61 - v63 : v63 - v61) + (v23 > v25 ? v23 - v25 : v25 - v23) + (v43 > v45 ? v43 - v45 : v45 - v43) + (v63 > v65 ? v63 - v65 : v65 - v63) + (v25 > v27 ? v25 - v27 : v27 - v25) + (v45 > v47 ? v45 - v47 : v47 - v45) + (v65 > v67 ? v65 - v67 : v67 - v65)) * hBlue);
                d[2]  = Math.exp(-((v41 > v23 ? v41 - v23 : v23 - v41) + (v61 > v43 ? v61 - v43 : v43 - v61) + (v81 > v63 ? v81 - v63 : v63 - v81) + (v43 > v25 ? v43 - v25 : v25 - v43) + (v63 > v45 ? v63 - v45 : v45 - v63) + (v83 > v65 ? v83 - v65 : v65 - v83) + (v45 > v27 ? v45 - v27 : v27 - v45) + (v65 > v47 ? v65 - v47 : v47 - v65) + (v85 > v67 ? v85 - v67 : v67 - v85)) * hBlue);
                d[3]  = Math.exp(-((v03 > v23 ? v03 - v23 : v23 - v03) + (v23 > v43 ? v23 - v43 : v43 - v23) + (v43 > v63 ? v43 - v63 : v63 - v43) + (v05 > v25 ? v05 - v25 : v25 - v05) + (v25 > v45 ? v25 - v45 : v45 - v25) + (v45 > v65 ? v45 - v65 : v65 - v45) + (v07 > v27 ? v07 - v27 : v27 - v07) + (v27 > v47 ? v27 - v47 : v47 - v27) + (v47 > v67 ? v47 - v67 : v67 - v47)) * hBlue);
                d[4]  = 0;
                d[5]  = Math.exp(-((v43 > v23 ? v43 - v23 : v23 - v43) + (v63 > v43 ? v63 - v43 : v43 - v63) + (v83 > v63 ? v83 - v63 : v63 - v83) + (v45 > v25 ? v45 - v25 : v25 - v45) + (v65 > v45 ? v65 - v45 : v45 - v65) + (v85 > v65 ? v85 - v65 : v65 - v85) + (v47 > v27 ? v47 - v27 : v27 - v47) + (v67 > v47 ? v67 - v47 : v47 - v67) + (v87 > v67 ? v87 - v67 : v67 - v87)) * hBlue);
                d[6]  = Math.exp(-((v05 > v23 ? v05 - v23 : v23 - v05) + (v25 > v43 ? v25 - v43 : v43 - v25) + (v45 > v63 ? v45 - v63 : v63 - v45) + (v07 > v25 ? v07 - v25 : v25 - v07) + (v27 > v45 ? v27 - v45 : v45 - v27) + (v47 > v65 ? v47 - v65 : v65 - v47) + (v09 > v27 ? v09 - v27 : v27 - v09) + (v29 > v47 ? v29 - v47 : v47 - v29) + (v49 > v67 ? v49 - v67 : v67 - v49)) * hBlue);
                d[7]  = Math.exp(-((v25 > v23 ? v25 - v23 : v23 - v25) + (v45 > v43 ? v45 - v43 : v43 - v45) + (v65 > v63 ? v65 - v63 : v63 - v65) + (v27 > v25 ? v27 - v25 : v25 - v27) + (v47 > v45 ? v47 - v45 : v45 - v47) + (v67 > v65 ? v67 - v65 : v65 - v67) + (v29 > v27 ? v29 - v27 : v27 - v29) + (v49 > v47 ? v49 - v47 : v47 - v49) + (v69 > v67 ? v69 - v67 : v67 - v69)) * hBlue);
                d[8]  = Math.exp(-((v45 > v23 ? v45 - v23 : v23 - v45) + (v65 > v43 ? v65 - v43 : v43 - v65) + (v85 > v63 ? v85 - v63 : v63 - v85) + (v47 > v25 ? v47 - v25 : v25 - v47) + (v67 > v45 ? v67 - v45 : v45 - v67) + (v87 > v65 ? v87 - v65 : v65 - v87) + (v49 > v27 ? v49 - v27 : v27 - v49) + (v69 > v47 ? v69 - v47 : v47 - v69) + (v89 > v67 ? v89 - v67 : v67 - v89)) * hBlue);
                sum = 1 + d[0] + d[1] + d[2] + d[3] + d[4] + d[5] + d[6] + d[7] + d[8];
                od[yx + ny] = (d[0] * v23 + d[1] * v43 + d[2] * v63 + d[3] * v25 + v45 + d[5] * v65 + d[6] * v27 + d[7] * v47 + d[8] * v67) / sum;

                // RED Patch
                d[0]  = Math.exp(-((v10 > v32 ? v10 - v32 : v32 - v10) + (v30 > v52 ? v30 - v52 : v52 - v30) + (v50 > v72 ? v50 - v72 : v72 - v50) + (v12 > v34 ? v12 - v34 : v34 - v12) + (v32 > v54 ? v32 - v54 : v54 - v32) + (v52 > v74 ? v52 - v74 : v74 - v52) + (v14 > v36 ? v14 - v36 : v36 - v14) + (v34 > v56 ? v34 - v56 : v56 - v34) + (v54 > v76 ? v54 - v76 : v76 - v54)) * hRed);
                d[1]  = Math.exp(-((v30 > v32 ? v30 - v32 : v32 - v30) + (v50 > v52 ? v50 - v52 : v52 - v50) + (v70 > v72 ? v70 - v72 : v72 - v70) + (v32 > v34 ? v32 - v34 : v34 - v32) + (v52 > v54 ? v52 - v54 : v54 - v52) + (v72 > v74 ? v72 - v74 : v74 - v72) + (v34 > v36 ? v34 - v36 : v36 - v34) + (v54 > v56 ? v54 - v56 : v56 - v54) + (v74 > v76 ? v74 - v76 : v76 - v74)) * hRed);
                d[2]  = Math.exp(-((v50 > v32 ? v50 - v32 : v32 - v50) + (v70 > v52 ? v70 - v52 : v52 - v70) + (v90 > v72 ? v90 - v72 : v72 - v90) + (v52 > v34 ? v52 - v34 : v34 - v52) + (v72 > v54 ? v72 - v54 : v54 - v72) + (v92 > v74 ? v92 - v74 : v74 - v92) + (v54 > v36 ? v54 - v36 : v36 - v54) + (v74 > v56 ? v74 - v56 : v56 - v74) + (v94 > v76 ? v94 - v76 : v76 - v94)) * hRed);
                d[3]  = Math.exp(-((v12 > v32 ? v12 - v32 : v32 - v12) + (v32 > v52 ? v32 - v52 : v52 - v32) + (v52 > v72 ? v52 - v72 : v72 - v52) + (v14 > v34 ? v14 - v34 : v34 - v14) + (v34 > v54 ? v34 - v54 : v54 - v34) + (v54 > v74 ? v54 - v74 : v74 - v54) + (v16 > v36 ? v16 - v36 : v36 - v16) + (v36 > v56 ? v36 - v56 : v56 - v36) + (v56 > v76 ? v56 - v76 : v76 - v56)) * hRed);
                d[5]  = Math.exp(-((v52 > v32 ? v52 - v32 : v32 - v52) + (v72 > v52 ? v72 - v52 : v52 - v72) + (v92 > v72 ? v92 - v72 : v72 - v92) + (v54 > v34 ? v54 - v34 : v34 - v54) + (v74 > v54 ? v74 - v54 : v54 - v74) + (v94 > v74 ? v94 - v74 : v74 - v94) + (v56 > v36 ? v56 - v36 : v36 - v56) + (v76 > v56 ? v76 - v56 : v56 - v76) + (v96 > v76 ? v96 - v76 : v76 - v96)) * hRed);
                d[6]  = Math.exp(-((v14 > v32 ? v14 - v32 : v32 - v14) + (v34 > v52 ? v34 - v52 : v52 - v34) + (v54 > v72 ? v54 - v72 : v72 - v54) + (v16 > v34 ? v16 - v34 : v34 - v16) + (v36 > v54 ? v36 - v54 : v54 - v36) + (v56 > v74 ? v56 - v74 : v74 - v56) + (v18 > v36 ? v18 - v36 : v36 - v18) + (v38 > v56 ? v38 - v56 : v56 - v38) + (v58 > v76 ? v58 - v76 : v76 - v58)) * hRed);
                d[7]  = Math.exp(-((v34 > v32 ? v34 - v32 : v32 - v34) + (v54 > v52 ? v54 - v52 : v52 - v54) + (v74 > v72 ? v74 - v72 : v72 - v74) + (v36 > v34 ? v36 - v34 : v34 - v36) + (v56 > v54 ? v56 - v54 : v54 - v56) + (v76 > v74 ? v76 - v74 : v74 - v76) + (v38 > v36 ? v38 - v36 : v36 - v38) + (v58 > v56 ? v58 - v56 : v56 - v58) + (v78 > v76 ? v78 - v76 : v76 - v78)) * hRed);
                d[8]  = Math.exp(-((v54 > v32 ? v54 - v32 : v32 - v54) + (v74 > v52 ? v74 - v52 : v52 - v74) + (v94 > v72 ? v94 - v72 : v72 - v94) + (v56 > v34 ? v56 - v34 : v34 - v56) + (v76 > v54 ? v76 - v54 : v54 - v76) + (v96 > v74 ? v96 - v74 : v74 - v96) + (v58 > v36 ? v58 - v36 : v36 - v58) + (v78 > v56 ? v78 - v56 : v56 - v78) + (v98 > v76 ? v98 - v76 : v76 - v98)) * hRed);
                sum = 1 + d[0] + d[1] + d[2] + d[3] + d[4] + d[5] + d[6] + d[7] + d[8];
                od[yx + 1] = (d[0] * v32 + d[1] * v52 + d[2] * v72 + d[3] * v34 + v54 + d[5] * v74 + d[6] * v36 + d[7] * v56 + d[8] * v76) / sum;
            }
        }
        return out;
    };

    ImagePipe.saturateColorMatrix = function (M, sat1, sat2) {
        sat2 = sat2 === undefined ? sat1 : sat2
        var O = Matrix.toMatrix([
            0.33, 0.34,  0.33,
            0.50, 0.00, -0.50,
           -0.25, 0.50, -0.25
        ]).reshape(3, 3).transpose();
        var s = 0, S = Matrix.toMatrix([
            1.00, 0.00, 0.00,
            0.00, sat1, 0.00,
            0.00, 0.00, sat2
        ]).reshape(3, 3).transpose();
        return O.inv().mtimes(S).mtimes(O).mtimes(M);
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

        // Get calibration temperature
        var CalibrationTemperature1, CalibrationTemperature2;
        if (root.CalibrationIlluminant1) {
            CalibrationTemperature1 = DNGReader.LightSources[root.CalibrationIlluminant1.value].temperature;
        } else {
            CalibrationTemperature2 = 5500;
        }
        if (root.CalibrationIlluminant2) {
            CalibrationTemperature2 = DNGReader.LightSources[root.CalibrationIlluminant2.value].temperature;
        } else {
            CalibrationTemperature2 = 5500;
        }


        var AB = matrices["AnalogBalance"],
            CC1 = matrices["CameraCalibration1"],
            CC2 = matrices["CameraCalibration2"],
            CM1 = matrices["ColorMatrix1"],
            CM2 = matrices["ColorMatrix2"];

        // Get XYZ matrices
        var XYZ2cRGB1 = AB["*"](CC1)["*"](CM1), cRGB2XYZ1 = XYZ2cRGB1.inv(),
            XYZ2cRGB2 = AB["*"](CC2)["*"](CM2), cRGB2XYZ2 = XYZ2cRGB2.inv();

        // console.log(root.CalibrationIlluminant1.value, "t1", CalibrationTemperature1, root.CalibrationIlluminant2.value, "t2", CalibrationTemperature2);

        var CA = Matrix.eye(3), XYZ2cRGB, cRGB2XYZ;
        if (AsShotNeutral) {
            cRGB2XYZ = cRGB2XYZ1[".*"](0.35)["+"](cRGB2XYZ2[".*"](0.55));
            // Find xy neutral value
            var XYZWP = cRGB2XYZ["*"](AsShotNeutral);
            // Bradford matrix and its inverse
            var Mcat = Matrix.toMatrix([0.8951, -0.7502, 0.0389, 0.2664, 1.7135, -0.0685, -0.1614, 0.0367, 1.0296]).reshape(3, 3), IMcat = Mcat.inv();
            var XYZD50 = Matrix.Colorspaces["xyY to XYZ"](Matrix.CIE.getIlluminant("D50"));
            var D = Mcat.mtimes(XYZD50), S = Mcat.mtimes(XYZWP);
            CA = IMcat.mtimes(Matrix.diag(D['./'](S))).mtimes(Mcat);
        } else {
            var white = Matrix.CIE.getIlluminant("D55"),
                XYZWhite = Matrix.Colorspaces["xyY to XYZ"](white.slice()),
                whiteCCT = Matrix.CIE["xyY to CCT"](white);
            // console.log(white, whiteCCT, CalibrationTemperature1, CalibrationTemperature2);
            var coef;
            if (CalibrationTemperature1 < CalibrationTemperature2) {
                console.log("this case is not supported yet !");
            }
            if (whiteCCT < CalibrationTemperature2) {
                coef = 0;
            } else if (whiteCCT > CalibrationTemperature1) {
                coef = 1;
            } else {
                var iCCT  = 1 / whiteCCT,
                    iCCT1 = 1 / CalibrationTemperature1,
                    iCCT2 = 1 / CalibrationTemperature2;
                coef = (iCCT - iCCT1) / (iCCT2 - iCCT1);
            }
            // Interpolate from matrices provided by DNG tags
            XYZ2cRGB = CM2[".*"](coef)["+"](CM1[".*"](1 - coef));

            // Matrix converting D50 to camera illuminant (D55 if not specified)
            var D50 = Matrix.CIE.getIlluminant("D50");
            var Mcat = Matrix.toMatrix([0.8951, -0.7502, 0.0389, 0.2664, 1.7135, -0.0685, -0.1614, 0.0367, 1.0296]).reshape(3, 3), IMcat = Mcat.inv();
            var XYZD50 = Matrix.Colorspaces["xyY to XYZ"](D50.slice());
            var S = Mcat.mtimes(XYZD50), D = Mcat.mtimes(XYZWhite);
            CA = IMcat.mtimes(Matrix.diag(D['./'](S))).mtimes(Mcat);
            var XYZ2cRGB = XYZ2cRGB["*"](CA);

            // Scale matrix
            var scale = XYZ2cRGB["*"](XYZD50).max();
            XYZ2cRGB = XYZ2cRGB["./"](scale);
        }

        // Output to Pro Photo colorspace
        var PPH2XYZ = Matrix.Colorspaces.getXYZTransform(false, D50, Matrix.CIE.getPrimaries("Pro Photo"));
        var PPH2cRGB = XYZ2cRGB["*"](PPH2XYZ);
        var cRGB2PPH = PPH2cRGB.inv();
        return cRGB2PPH;
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
        // console.log(image.min(0).getData(), ill.getData());
        image.reshape(size);
        var sum = ill['.*'](ill).sum().sqrt();
        ill = ill['/='](sum)["*="](Math.sqrt(3));
        ill = ill.ldivide(1).getData();
        // console.log(ill);
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

    ImagePipe.applyACR3ToneCurve = function (image, inverse) {
        var lut = Tools.arrayFromBase64(
            "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\
            XD+nrlw/qtRcP636XD+wIF0/C0ZdPw1sXT9okV0/w7ZdPx7cXT/SAF4/LSZeP+BKXj+Tb14/RpRe\
            P/q4Xj+t3V4/YAJfP2wmXz93Sl8/g25fP46SXz+atl8/pdpfPwn+Xz8UImA/eEVgP9xoYD8/jGA/\
            o69gP1/SYD/D9WA/fhhhPzo7YT/2XWE/soBhP26jYT+CxWE/ludhP1IKYj9nLGI/e05iP49wYj/7\
            kWI/D7RiP3zVYj/o9mI/VRhjP8E5Yz8tW2M/mnxjP16dYz/LvmM/j99jP1QAZD8YIWQ/3UFkP/ph\
            ZD+/gmQ/26JkP/jCZD8V42Q/MgNlP08jZT9sQ2U/4WJlP/2CZT9zomU/6MFlP13hZT/SAGY/nx9m\
            PxQ/Zj/hXWY/Vn1mPyScZj/xumY/vtlmP+T3Zj+xFmc/fjVnP6RTZz/JcWc/749nPxSuZz86zGc/\
            YOpnP90HaD8DJmg/gUNoP/5gaD98fmg/+ptoP3i5aD9N1mg/y/NoP6EQaT93LWk/9UppPyNnaT/5\
            g2k/z6BpP6W9aT/T2Wk/qfZpP9cSaj8GL2o/NEtqP2Jnaj/ogmo/F59qP526aj/L1mo/UvJqP9gN\
            az9fKWs/5URrP2tgaz9Ke2s/0ZZrP6+xaz+OzGs/bedrP0sCbD8qHWw/CThsP+dSbD8ebWw//Yds\
            PzSibD9qvGw/odZsP9jwbD8PC20/niRtP9U+bT9kWG0/m3JtPyqMbT+5pW0/SL9tP9jYbT+/8W0/\
            TgtuP90kbj/FPW4/rFZuP5Nvbj97iG4/YqFuP0m6bj8x024/cOtuP1cEbz+XHG8/1zRvP75Nbz/+\
            ZW8/lX1vP9WVbz8Urm8/rMVvP+zdbz+E9W8/Gw1wP1slcD/zPHA/41NwP3trcD8Sg3A/qppwP5qx\
            cD+KyHA/IuBwPxL3cD8CDnE/8iRxPzo7cT8qUnE/GmlxP2N/cT+rlXE/m6xxP+PCcT8r2XE/dO9x\
            P7wFcj9cG3I/pTFyP+1Hcj+NXXI/LnNyP86Icj8Xn3I/t7RyP7DJcj9Q33I/8fRyP+oJcz+KH3M/\
            gzRzPyNKcz8cX3M/FXRzPw2Jcz8GnnM/V7JzP1DHcz+h23M/mfBzP+oEdD87GXQ/NC50P4VCdD/W\
            VnQ/f2p0P9B+dD8hk3Q/yqZ0Pxu7dD/EznQ/beJ0Pxb2dD/ACXU/aR11PxIxdT+7RHU/ZFh1P2Zr\
            dT8Pf3U/EJJ1PxKldT8TuHU/FMt1PxbedT8X8XU/GQR2PxoXdj90KXY/dTx2P89Odj8oYXY/KnR2\
            P4OGdj/dmHY/Nqt2P+i8dj9Cz3Y/nOF2P03zdj+nBXc/WRd3Pwspdz+9Onc/Fk13P8hedz/Sb3c/\
            hIF3PzaTdz9ApHc/8rV3P/zGdz+u2Hc/uOl3P8L6dz/MC3g/1hx4P+AteD/qPng/TE94P1dgeD+5\
            cHg/w4F4PyWSeD+Hong/krN4P/TDeD9W1Hg/EeR4P3P0eD/VBHk/kBR5P/IkeT+tNHk/D0V5P8pU\
            eT+EZHk/P3R5P/mDeT+0k3k/bqN5PymzeT87wnk/9tF5PwnheT/D8Hk/1v95P+kOej/8HXo/Di16\
            PyE8ej80S3o/R1p6P1lpej/Ed3o/14Z6P0KVej9VpHo/wLJ6PyvBej+Wz3o/Ad56P2zsej/X+no/\
            Qgl7PwUXez9wJXs/MzN7P55Bez9hT3s/JV17P5Brez9TeXs/Fod7P9mUez+cons/uK97P3u9ez8+\
            y3s/Wth7Px3mez8483s/VAB8P28NfD+LGnw/pid8P8I0fD/dQXw/+U58PxRcfD+IaHw/o3V8PxeC\
            fD8yj3w/ppt8PxqofD81tXw/qcF8PxzOfD+Q2nw/XOZ8P9DyfD9D/3w/Dwt9P4MXfT9PI30/wi99\
            P447fT9aR30/JlN9P/JefT++an0/inZ9P1aCfT8ijn0/7Zl9PxKlfT/esH0/Arx9P87HfT/y0n0/\
            Ft59PzrpfT9e9H0/gv99P6YKfj/KFX4/7yB+P2srfj+PNn4/s0F+PzBMfj+sVn4/0GF+P0xsfj/J\
            dn4/RYF+P8GLfj8+ln4/uqB+Pzarfj8LtX4/h79+PwTKfj/Y034/Vd5+Pynofj/+8X4/0vt+P08G\
            fz8jEH8/+Bl/P80jfz/5LH8/zjZ/P6NAfz/PSX8/pFN/P9Fcfz+lZn8/0m9/P/94fz/Ugn8/AIx/\
            Py2Vfz9ann8/h6d/P7Swfz85uX8/ZcJ/P5LLfz8X1H8/RN1/P8nlfz/27n8/e/d/PwAAgD8=",
            Float32Array
        );
        var ilut = Tools.arrayFromBase64(
            "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",
            Float32Array
        );
        return ImagePipe.applyLut(image, inverse === true ? ilut : lut);
    };

    ImagePipe.applySRGBGamma = function (image, resolution) {
        var lut = new Float64Array(resolution);
        var a = 0.055, I2D4 = 1 / 2.4, v, ires = 1 / (resolution - 1);
        for (var i = 0; i < resolution; i++) {
            v = i * ires;
            lut[i] = (v > 0.0031308) ? (1.055 * Math.pow(v, I2D4) - a) : (v * 12.92);
        }
        return ImagePipe.applyLut(image, lut);
    };

    ImagePipe.applyREC709Gamma = function (image, resolution) {
        var lut = new Float64Array(resolution);
        var v, ires = 1 / (resolution - 1);
        for (var i = 0; i < resolution; i++) {
            v = i * ires;
            lut[i] = (v >= 0.018) ? (1.099 * Math.pow(v, 0.45) - 0.099) : (v * 4.5);
        }
        return ImagePipe.applyLut(image, lut);
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

    ImagePipe.apply5x5SymFilter = function (image, coefs) {
        var size = image.size(), ny = size[0], nx = size[1], nc = image.size(2);
        var out = Matrix.zeros(ny, nx, nc, 'single');
        var id = image.getData(), od = out.getData();

        var c0 = coefs[0], c1 = coefs[1], c2 = coefs[2], c3 = coefs[3], c4 = coefs[4], c5 = 1 - 4 * (c0 + 2 * c1 + c2 + c3 + c4);
        var _x, yx, _xe, yxe, ny2 = 2 * ny, c, ce;
        for (c = 0, ce = nx * ny * nc; c < ce; c += ny * nx) {
            for (_x = c + 2 * ny, _xe = c + (nx - 2) * ny; _x < _xe; _x += ny) {
                for (yx = _x + 2, yxe = _x + ny - 2; yx < yxe; yx += 1) {
                    od[yx] = (id[yx - ny2 - 2] + id[yx - ny2 + 2] + id[yx + ny2 - 2] + id[yx + ny2 + 2]) * c0 +
                             (id[yx - ny - 2] + id[yx + ny - 2] + id[yx - ny2 - 1] + id[yx + ny2 - 1] + id[yx - ny2 + 1] + id[yx + ny2 + 1] + id[yx + ny + 2] + id[yx - ny + 2]) * c1 +
                             (id[yx - 2] + id[yx - ny2] + id[yx + ny2] + id[yx + 2]) * c2 +
                             (id[yx - ny - 1] + id[yx + ny - 1] + id[yx - ny + 1] + id[yx + ny + 1]) * c3 +
                             (id[yx - 1] + id[yx - ny] + id[yx + ny] + id[yx + 1]) * c4 +
                             id[yx] * c5;
                }
            }
        }
        return out;
    };

    ImagePipe.applyGreenSharpen = function (image) {
        var coefs = [-0.05859375, -0.05859375, -0.09765625, 0.05859375, 0.234375];
        var id = image.getData(), green = id.subarray(id.length / 3, 2 * id.length / 3);
        var od = ImagePipe.apply5x5SymFilter(new Matrix([image.size(0), image.size(1)], green), coefs).getData();
        green.set(od);
        return image;
        /*
        var filter = Matrix.toMatrix([
            -30, -30, -50, -30,	-30,
            -30,  30, 120,  30,	-30,
            -50, 120, 472, 120,	-50,
            -30,  30, 120,  30,	-30,
            -30, -30, -50, -30,	-30
        ]).rdivide(512).reshape(5, 5).transpose();*/
        // image = ImagePipe.apply5x5Filter(image, filter);
        // image = image.imfilter(filter);
    };

    ImagePipe.guidedFilter = function (image, neighbor, sigma, details, low) {
        if (neighbor === 0 || sigma === 0) {
            return image;
        }
        var filtered = image.guidedFilter(image, neighbor, sigma);
        if (details === 0 && low === 0) {
            return filtered;
        } else {
            var details = image["-"](filtered)["*="](details);
            if (low !== 0) {
                filtered["*="](1 - low)["+="](filtered.mean()[".*"](low));
            }
            return details["+"](filtered);
        }
    }
    ImagePipe.applyColorEnhancement = function (image) {
        var ohtaImage = Matrix.applycform(image, "RGB to Ohta").im2single();
        var luminance = ohtaImage.get([], [], 0);
        var scales = luminance.computeScaleSpace();
        global.USE_CST = false;
        var lut = getLUT(Infinity, 0.002 /** (12 - gain) / 11*/, 0.5, [2048, 2048], 5);
        var out = Matrix.gaussianColorEnhancementLUT(scales, lut, 0.3/** (12 - gain) / 11*/);
        // var out = Matrix.gaussianColorEnhancement(scales, 0.1, 0.04, Infinity, 0.35);
        var gain = out['./'](luminance), gainSaturation = gain[".*"](1.2);
        ohtaImage.set([], [], 0, ohtaImage.get([], [], 0).times(gain));
        ohtaImage.set([], [], 1, ohtaImage.get([], [], 1).times(gainSaturation));
        ohtaImage.set([], [], 2, ohtaImage.get([], [], 2).times(gainSaturation));
        image = ohtaImage.applycform("Ohta to RGB");
        return image;
    };

    ImagePipe.applySimpleContrastEnhancement = function (image, alpha) {
        var ohtaImage = Matrix.applycform(image, "RGB to Ohta").im2single();
        var luminance = ohtaImage.get([], [], 0);

        var approx = luminance.fastBlur(512, 512, 4);
        var details = luminance['-'](approx);
        var mean = approx.mean()[".*"](alpha);
        approx["*="](1 - alpha)["+="](mean)["+="](details[".*"](2));
        // approx["*="](1 - alpha)["+="](0.5 * alpha)["+="](details);

        var gain = approx['./'](luminance), gainSaturation = gain[".*"](1.2);
        ohtaImage.set([], [], 0, ohtaImage.get([], [], 0).times(gain));
        ohtaImage.set([], [], 1, ohtaImage.get([], [], 1).times(gainSaturation));
        ohtaImage.set([], [], 2, ohtaImage.get([], [], 2).times(gainSaturation));
        return ohtaImage.applycform("Ohta to RGB");
    };

    ImagePipe.applyHueSatProfile = function (image) {
        var data = Tools.arrayFromBase64(
            "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",
            Float32Array
        );
        var data = Tools.arrayFromBase64(
            "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\
            yjIEPt21dD8AAIA/07wjPhzrcj8AAIA/k6lCPukmcT8AAIA/9wZfPg5Pbz8AAIA/WDl0Pt9PbT8A\
            AIA/WYZ4PgwCaz8AAIA/0SJbPl5LaD8AAIA/g1EJPn0/ZT8AAIA/guLHPHicYj8AAIA/uB4FPSGw\
            Yj8AAIA/Ke2NPvCnZj8AAIA/H/QMP6yLaz8AAIA/QfEzP7snbz8AAIA/VONFP3ctcT8AAIA/qFc6\
            P+CccT8AAIA/qvECP+kmcT8AAIA/Njw9PhKDcD8AAIA/iPQbvo4GcD8AAIA/AAAAAAAAgD8AAIA/\
            bxIDOrKdfz8AAIA/J6CJO8l2fj8AAIA/sANnPCS5fD8AAIA/SZ0APUymej8AAIA/io5kPeeMeD8A\
            AIA/oImwPbmNdj8AAIA/2T35PcGodD8AAIA/QmAlPgHecj8AAIA/PE5RPs4ZcT8AAIA/yXZ+Pg5P\
            bz8AAIA/fdCTPvtcbT8AAIA/rkehPpZDaz8AAIA/klyePhniaD8AAIA/t9GAPktZZj8AAIA/n80q\
            Ph1aZD8AAIA/INJvPmq8ZD8AAIA/GQQWPwskaD8AAIA/NKJkP4y5az8AAIA/BTRxP5Yhbj8AAIA/\
            TDdZP0Ckbz8AAIA/xtw1P6VOcD8AAIA/wagEP05icD8AAIA/8fSKPvs6cD8AAIA/s3vyOxsNcD8A\
            AIA/AAAAAAAAgD8AAIA/NIA3urKdfz8AAIA/UkmduVZ9fj8AAIA/5x2nO7G/fD8AAIA/UI2XPGiz\
            ej8AAIA/nu8nPQKaeD8AAIA/veOUPdSadj8AAIA/i2znPWq8dD8AAIA/QmAlPjj4cj8AAIA/idJe\
            PiBBcT8AAIA/RGmPPpeQbz8AAIA/BTSxPn/ZbT8AAIA/vAXSPk0VbD8AAIA/si7uPhpRaj8AAIA/\
            oWcDP3DOaD8AAIA/sVAbP/AWaD8AAIA/9P1kP4cWaT8AAIA/hxaxP1pkaz8AAIA/+FPTP/8hbT8A\
            AIA/Lv/BPwkbbj8AAIA/gSaaP8Dsbj8AAIA/x0tnPwmKbz8AAIA/+FMjP67Ybz8AAIA/7zjFPnL5\
            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\
            VTA6P0aUdj8AAIA/UrguP5m7dj8AAIA/FYwaP52Adj8AAIA/5j8EPxQ/dj8AAIA/AAAAAAAAgD8A\
            AIA/5x0nPAmKfz8AAIA/gSZCPQkbfj8AAIA/jLnrPYj0ez8AAIA/z2ZVPgyTeT8AAIA/CtejPlRS\
            dz8AAIA/eAvkPrRZdT8AAIA/tFkVPyqpcz8AAIA/iPQ7P5wzcj8AAIA/mExlP2DlcD8AAIA/FK6H\
            P+m3bz8AAIA/3bWcP6Tfbj8AAIA/ak27P8Dsbj8AAIA/XCABQIV8cD8AAIA/ofg9QKrxcj8AAIA/\
            yeVrQKabdD8AAIA/qvFeQIbJdD8AAIA/cT0mQMoydD8AAIA/Vg7dP2HDcz8AAIA/IEGZP+oEdD8A\
            AIA/QYJyP6HWdD8AAIA/yjJUP6+UdT8AAIA/TfM+P2/wdT8AAIA/AwkqP4v9dT8AAIA/wagUP/32\
            dT8AAIA/AAAAAAAAgD8AAIA/8IVJPAmKfz8AAIA/Z9VnPSQofj8AAIA/XykLPtobfD8AAIA/xyl6\
            PpXUeT8AAIA/9wa/PhSudz8AAIA/qmAEP6vPdT8AAIA/ke0sP3RGdD8AAIA/esdZP8X+cj8AAIA/\
            pgqGP6H4cT8AAIA/vHSjP5M6cT8AAIA/s3vKP5f/cD8AAIA/0LMFQMWPcT8AAIA//fZBQDMzcz8A\
            AIA/u7iNQOtzdT8AAIA/2qyuQF3cdj8AAIA/MzOjQEaUdj8AAIA/xylyQJSHdT8AAIA/W0IiQPjC\
            dD8AAIA/FNDcP6abdD8AAIA/SOGiPy/ddD8AAIA/1eeCP30/dT8AAIA/CRteP5SHdT8AAIA/93VA\
            P+audT8AAIA/dCQnP4/CdT8AAIA/AAAAAAAAgD8AAIA/sANnPJeQfz8AAIA/Ad6CPc07fj8AAIA/\
            vw4cPi1DfD8AAIA/6GqLPh4Wej8AAIA/6gTUPmIQeD8AAIA/XI8SP71Sdj8AAIA/RGk/P0vqdD8A\
            AIA/E/JxP33Qcz8AAIA/qaSWP8X+cj8AAIA/TRW8P1yPcj8AAIA/GeLwP1yPcj8AAIA/3SQiQME5\
            cz8AAIA/rfpkQBiVdD8AAIA/ZF2eQDBMdj8AAIA/Cfm8QHBfdz8AAIA/UdqxQMsQdz8AAIA/fPKI\
            QMIXdj8AAIA/xm1AQJhMdT8AAIA/LSEHQPT9dD8AAIA/SS7HP4EEdT8AAIA/beebP2EydT8AAIA/\
            fh2AP89mdT8AAIA/48dYPyKOdT8AAIA/I9s5P1iodT8AAIA/AAAAAAAAgD8AAIA/tvN9PJeQfz8A\
            AIA/BFaOPXZPfj8AAIA/eVgoPn9qfD8AAIA/PZuVPjVeej8AAIA/k6niPrByeD8AAIA/LUMcP0LP\
            dj8AAIA/w9NLP5SHdT8AAIA/fPKAP4qOdD8AAIA/XCChPybkcz8AAIA/SgzKP/OOcz8AAIA/l/8A\
            QA+ccz8AAIA/XCApQJMYdD8AAIA/T69gQIEEdT8AAIA/j8KPQKYKdj8AAIA/JJejQH2udj8AAIA/\
            coqcQEaUdj8AAIA/toSAQBkEdj8AAIA/S1lCQAaBdT8AAIA/oIkQQH0/dT8AAIA/fdDbP2EydT8A\
            AIA/QmCtPwtGdT8AAIA/PZuNP89mdT8AAIA/309tPwaBdT8AAIA/I9tJP8uhdT8AAIA/AAAAAAAA\
            gD8AAIA/AiuHPCSXfz8AAIA/Tx6WPSBjfj8AAIA/aW8wPl+YfD8AAIA/owGcPr6fej8AAIA/zF3r\
            PnDOeD8AAIA/4JwhP8dLdz8AAIA/vAVSP8IXdj8AAIA/SFCEP+84dT8AAIA/8WOkPzSidD8AAIA/\
            +u3LP49TdD8AAIA/8Kf+P49TdD8AAIA/8BYgQKabdD8AAIA/FK5HQLgedT8AAIA/vp9uQFiodT8A\
            AIA/f2qCQBkEdj8AAIA/l/98QBkEdj8AAIA/QfFbQB3JdT8AAIA/3nEyQJSHdT8AAIA/QBMNQEJg\
            dT8AAIA/O9/fP7RZdT8AAIA/oda0P0JgdT8AAIA/YTKVP+tzdT8AAIA/MZl6PyKOdT8AAIA/gQRV\
            P1iodT8AAIA/AAAAAAAAgD8AAIA/TRWMPLKdfz8AAIA/mgibPTtwfj8AAIA/2PA0PrG/fD8AAIA/\
            EhSfPkjhej8AAIA/4L7uPjAqeT8AAIA/bxIjPzC7dz8AAIA/XI9SP2Khdj8AAIA/ZoiDP6vPdT8A\
            AIA/R3KhP30/dT8AAIA/0ZHEP9jwdD8AAIA/yXbuPy/ddD8AAIA/d74PQGb3dD8AAIA/gSYqQO84\
            dT8AAIA/nl5BQAaBdT8AAIA/r5RNQOaudT8AAIA/xEJJQAK8dT8AAIA/NV42QFiodT8AAIA/xm0c\
            QK+UdT8AAIA/O3ACQAaBdT8AAIA/V+zXP3h6dT8AAIA/OpKzP5SHdT8AAIA/+8uWP6+UdT8AAIA/\
            d75/P1iodT8AAIA/3nFaPwK8dT8AAIA/AAAAAAAAgD8AAIA/KVyPPLKdfz8AAIA/UkmdPeSDfj8A\
            AIA/EHo2PgTnfD8AAIA/7nyfPtEiez8AAIA/RPrtPmN/eT8AAIA/HHwhPwskeD8AAIA/+8tOP1kX\
            dz8AAIA/CYp/P71Sdj8AAIA/JXWaP6vPdT8AAIA/fh24P3h6dT8AAIA/3gLZPyZTdT8AAIA/dEb8\
            PyZTdT8AAIA/oWcPQF1tdT8AAIA/JlMdQCKOdT8AAIA/WDkkQMuhdT8AAIA/ZMwhQOaudT8AAIA/\
            6+IWQOaudT8AAIA/XdwGQFiodT8AAIA/aLPqP1iodT8AAIA/U5bJP1iodT8AAIA/KH6sP+audT8A\
            AIA/GsCTPwK8dT8AAIA/1sV9Px3JdT8AAIA/UWtaP8bcdT8AAIA/AAAAAAAAgD8AAIA/TtGRPECk\
            fz8AAIA/5IOePQCRfj8AAIA/2V82PsgHfT8AAIA/klyePj9Xez8AAIA/aLPqPgfOeT8AAIA/exQe\
            P1mGeD8AAIA/dZNIP8KGdz8AAIA/2PB0P7TIdj8AAIA/eseRP6JFdj8AAIA/RUeqP2/wdT8AAIA/\
            cazDP4/CdT8AAIA/odbcP3S1dT8AAIA/yJjzP3S1dT8AAIA/S1kCQI/CdT8AAIA/ZmYGQB3JdT8A\
            AIA/3gIFQDnWdT8AAIA/uB79PznWdT8AAIA/zhnpPznWdT8AAIA/DJPRPznWdT8AAIA/Y3+5P8bc\
            dT8AAIA/2qyiP8bcdT8AAIA/Ke2NP+LpdT8AAIA/B/B2P2/wdT8AAIA/MExWP4v9dT8AAIA/AAAA\
            AAAAgD8AAIA/BaOSPECkfz8AAIA/CRuePRuefj8AAIA/NKI0Po0ofT8AAIA/UdqbPqyLez8AAIA/\
            r5TlPpEPej8AAIA/8IUZP/7UeD8AAIA/6SZBP4Lidz8AAIA/LGVpPwIrdz8AAIA/QBOJP32udj8A\
            AIA/v32dP0tZdj8AAIA/jnWxP2srdj8AAIA/FvvDPzQRdj8AAIA/Vp/TP6YKdj8AAIA/UrjeP6YK\
            dj8AAIA/Ns3jPzQRdj8AAIA/xyniPzQRdj8AAIA/xynaP8IXdj8AAIA/nRHNP8IXdj8AAIA/wai8\
            PzQRdj8AAIA/TKaqP8IXdj8AAIA/ImyYP8IXdj8AAIA/XdyGP8IXdj8AAIA/rfpsP08edj8AAIA/\
            2/lOP90kdj8AAIA/AAAAAAAAgD8AAIA/TtGRPM6qfz8AAIA/mnecPTarfj8AAIA/M8QxPsRCfT8A\
            AIA/WYaYPoy5ez8AAIA/0m/fPoxKej8AAIA//YcUPxUdeT8AAIA/J6A5P7U3eD8AAIA/copeP8KG\
            dz8AAIA/HHyBPz0Kdz8AAIA/MzOTP5m7dj8AAIA/3+CjP7mNdj8AAIA/PL2yP4Jzdj8AAIA/+8u+\
            P2Zmdj8AAIA/EhTHP2Zmdj8AAIA/SOHKP2Zmdj8AAIA/at7JP2Zmdj8AAIA/ETbEP2Zmdj8AAIA/\
            s3u6P9lfdj8AAIA/n6utP0tZdj8AAIA/wOyeP71Sdj8AAIA/VFKPP71Sdj8AAIA/7nx/P71Sdj8A\
            AIA/xY9hP71Sdj8AAIA/lIdFP71Sdj8AAIA/AAAAAAAAgD8AAIA/l/+QPM6qfz8AAIA/UWuaPVK4\
            fj8AAIA/6UguPvtcfT8AAIA/hsmUPt/gez8AAIA/GeLYPvp+ej8AAIA/CYoPP55eeT8AAIA/6pUy\
            Pz55eD8AAIA/1CtVP2fVdz8AAIA/yxB3P3Bfdz8AAIA/+u2LP8sQdz8AAIA/E2GbP+vidj8AAIA/\
            IEGpP7TIdj8AAIA/JLm0PyfCdj8AAIA/L928PyfCdj8AAIA/RdjAPyfCdj8AAIA/JzHAP5m7dj8A\
            AIA/1ee6Pwu1dj8AAIA/mpmxP32udj8AAIA/UkmlP2Khdj8AAIA/LSGXP9Sadj8AAIA/4C2IP7mN\
            dj8AAIA/JXVyPyuHdj8AAIA/WKhVPyuHdj8AAIA/MZk6PyuHdj8AAIA/AAAAAAAAgD8AAIA/KVyP\
            PFuxfz8AAIA/vsGXPeC+fj8AAIA/w2QqPqRwfT8AAIA/KcuQPqMBfD8AAIA/RUfSPtqsej8AAIA/\
            9bkKPwyTeT8AAIA/nzwsP8e6eD8AAIA/FmpNP/AWeD8AAIA/BFZuP4endz8AAIA/7nyHP+JYdz8A\
            AIA/e4OXPwIrdz8AAIA/+8umP1kXdz8AAIA/mne0P8sQdz8AAIA/EhS/P8sQdz8AAIA/L93EP8sQ\
            dz8AAIA/OGfEP8sQdz8AAIA/WKi9P7ADdz8AAIA/zO6xP5T2dj8AAIA/MzOjP3npdj8AAIA/GCaT\
            P9DVdj8AAIA/OPiCP0LPdj8AAIA/mbtmPyfCdj8AAIA/R3JJP5m7dj8AAIA/rWkuPwu1dj8AAIA/\
            AAAAAAAAgD8AAIA/u7iNPFuxfz8AAIA/veOUPfvLfj8AAIA/ZmYmPk2EfT8AAIA/lrKMPtobfD8A\
            AIA/cazLPizUej8AAIA/pgoGP+zAeT8AAIA/MEwmPzXveD8AAIA/fa5GP+xReD8AAIA/FK5nP4Li\
            dz8AAIA/H/SEP96Tdz8AAIA/XdyWP/5ldz8AAIA/R3KpP1RSdz8AAIA/07y7P8dLdz8AAIA/E2HL\
            P8dLdz8AAIA/wajUP1RSdz8AAIA/HVrUP8dLdz8AAIA/jErKPzlFdz8AAIA/1Xi5P5Axdz8AAIA/\
            dLWlP3Qkdz8AAIA/XrqRP1kXdz8AAIA/1sV9Pz0Kdz8AAIA/P1dbPyL9dj8AAIA/1lY8Pwfwdj8A\
            AIA/SZ0gP3npdj8AAIA/AAAAAAAAgD8AAIA/TRWMPFuxfz8AAIA/vAWSPYnSfj8AAIA/nDMiPmiR\
            fT8AAIA/ApqIPhE2fD8AAIA/S+rEPvH0ej8AAIA/ylQBP8zueT8AAIA/TmIgPxUdeT8AAIA/qRNA\
            P1mGeD8AAIA/c2hhP/AWeD8AAIA/LNSCP0vIdz8AAIA/WReXP2uadz8AAIA/1sWtPzSAdz8AAIA/\
            /fbFPxlzdz8AAIA/WDncP4tsdz8AAIA/cT3qPxlzdz8AAIA/1xLqP4tsdz8AAIA/WmTbP/5ldz8A\
            AIA/jLnDP3Bfdz8AAIA/1XipP1RSdz8AAIA/oImQP8dLdz8AAIA/+MJ0P6s+dz8AAIA/dk9OP5Ax\
            dz8AAIA/Gy8tPwIrdz8AAIA/oIkQP+cddz8AAIA/AAAAAAAAgD8AAIA/J6CJPFuxfz8AAIA/uyeP\
            PRfZfj8AAIA/PzUePoSefT8AAIA/VHSEPrpJfD8AAIA/7Q2+PrUVez8AAIA/rK34Ph4Wej8AAIA/\
            zO4ZP/VKeT8AAIA/WYY4Pzm0eD8AAIA/foxZP9BEeD8AAIA/MuZ+Pyv2dz8AAIA/iGOVP77Bdz8A\
            AIA/gEivP/mgdz8AAIA/OGfMP8KGdz8AAIA/93XoPzSAdz8AAIA/Ecf6P6d5dz8AAIA/PL36P6d5\
            dz8AAIA/vsHnP6d5dz8AAIA/ldTJP6d5dz8AAIA/M8SpP6d5dz8AAIA/b4GMP6d5dz8AAIA/sANn\
            Pxlzdz8AAIA/xEI9P4tsdz8AAIA/bHgaP/5ldz8AAIA/o5L6PuJYdz8AAIA/AAAAAAAAgD8AAIA/\
            ufyHPFuxfz8AAIA/KH6MPRfZfj8AAIA/GlEaPp+rfT8AAIA/pU6APmRdfD8AAIA/B/C2Puwvez8A\
            AIA/XwfuPuM2ej8AAIA/BaMSP0dyeT8AAIA/gEgvPxnieD8AAIA/qaROP7ByeD8AAIA/HOtyPwsk\
            eD8AAIA/m1WPP57vdz8AAIA/9+SpP77Bdz8AAIA/93XIP/mgdz8AAIA/yXbmP8KGdz8AAIA/0036\
            P6d5dz8AAIA/Kjr6P6d5dz8AAIA/XW3lP8KGdz8AAIA/arzEP96Tdz8AAIA/vAWiP/mgdz8AAIA/\
            g8CCP4endz8AAIA/CflQPxSudz8AAIA//fYlP4endz8AAIA/j+QCP/mgdz8AAIA/nzzMPt6Tdz8A\
            AIA/AAAAAAAAgD8AAIA/AiuHPOm3fz8AAIA/3nGKPaTffj8AAIA/0NUWPi2yfT8AAIA//tR4Pg1x\
            fD8AAIA/O9+vPiNKez8AAIA/ysPiPqhXej8AAIA/+n4KP5qZeT8AAIA/WDkkP/kPeT8AAIA/bjRA\
            Px6neD8AAIA/ZapgP3lYeD8AAIA/owGEP34deD8AAIA/QfGbP57vdz8AAIA/i2y3P0vIdz8AAIA/\
            Di3SP4endz8AAIA/Vp/jP96Tdz8AAIA/QxzjP96Tdz8AAIA/W7HPP/mgdz8AAIA/Ne+wPzC7dz8A\
            AIA/INKPP2fVdz8AAIA/hlpjP4Lidz8AAIA/LpAwPxDpdz8AAIA/5x0HPxDpdz8AAIA/ejbLPoLi\
            dz8AAIA/9P2UPtnOdz8AAIA/AAAAAAAAgD8AAIA/S1mGPOm3fz8AAIA/3gKJPTLmfj8AAIA/BhIU\
            Pru4fT8AAIA/1xJyPih+fD8AAIA/TDepPsxdez8AAIA/UI3XPt5xej8AAIA/9+QBP+zAeT8AAIA/\
            2c4XP0w3eT8AAIA/TfMuP/7UeD8AAIA/vjBJP+eMeD8AAIA/sHJoP3lYeD8AAIA/MuaGP5kqeD8A\
            AIA/CtebP0cDeD8AAIA/3pOvP4Lidz8AAIA/GsC7P2fVdz8AAIA/gSa6P2fVdz8AAIA/PuipP4Li\
            dz8AAIA/Qj6QP0cDeD8AAIA/guJnP34deD8AAIA//BgzPycxeD8AAIA/OdYFP7U3eD8AAIA/dy3B\
            PrU3eD8AAIA/gQSFPpkqeD8AAIA/1XgpPvAWeD8AAIA/AAAAAAAAgD8AAIA/AiuHPOm3fz8AAIA/\
            ApqIPTLmfj8AAIA/zogSPki/fT8AAIA/Vg5tPraEfD8AAIA/nKKjPnZxez8AAIA/+1zNPhWMej8A\
            AIA/GCbzPrHheT8AAIA/QxwLPyxleT8AAIA/mnccP2wJeT8AAIA/9wYvP3DOeD8AAIA/ryVEPwKa\
            eD8AAIA/8WNcPz55eD8AAIA/S1l2P3lYeD8AAIA/YqGGP9BEeD8AAIA//YeMP7U3eD8AAIA/dy2J\
            P7U3eD8AAIA/guJ3P15LeD8AAIA/INJPP5VleD8AAIA/xf4iP8x/eD8AAIA/+zrwPnWTeD8AAIA/\
            1CulPgKaeD8AAIA/TYRNPnWTeD8AAIA/PE7RPcx/eD8AAIA/78nDPJVleD8AAIA/AAAAAAAAgD8A\
            AIA/cM6IPOm3fz8AAIA/J6CJPTLmfj8AAIA/zogSPki/fT8AAIA/aLNqPtGRfD8AAIA/AACgPpF+\
            ez8AAIA/eHrFPkymej8AAIA/S+rkPnUCej8AAIA/EhT/Pn6MeT8AAIA/LNQKP9k9eT8AAIA/mEwV\
            P2wJeT8AAIA/kssfP6foeD8AAIA/2qwqP3DOeD8AAIA/nRE1P1XBeD8AAIA/LUM8Pzm0eD8AAIA/\
            vw48Pzm0eD8AAIA/Dr4wP1XBeD8AAIA/B84ZP/7UeD8AAIA/RiX1PjXveD8AAIA/+zqwPt4CeT8A\
            AIA/rItbPvkPeT8AAIA/FvvLPfkPeT8AAIA/S1mGO1D8eD8AAIA/KqmTvRnieD8AAIA/S1kGvse6\
            eD8AAIA/AAAAAAAAgD8AAIA/TRWMPOm3fz8AAIA/KH6MPTLmfj8AAIA/hskUPtbFfT8AAIA/nzxs\
            PtGRfD8AAIA/LSGfPqyLez8AAIA/rkfBPvW5ej8AAIA/CD3bPqwcej8AAIA/xELtPtCzeT8AAIA/\
            7FH4PkdyeT8AAIA/LbL9PvVKeT8AAIA/5IP+Pkw3eT8AAIA/rIv7PjAqeT8AAIA/xm30Pr4weT8A\
            AIA/VFLnPkw3eT8AAIA/IEHRPmdEeT8AAIA/INKvPhBYeT8AAIA/+FODPkdyeT8AAIA/G54ePvCF\
            eT8AAIA/FR1JPZqZeT8AAIA/8kFPvSegeT8AAIA/TRUMvgyTeT8AAIA/T0BTvmN/eT8AAIA/io6E\
            voNReT8AAIA/EOmXvhUdeT8AAIA/AAAAAAAAgD8AAIA/l/+QPOm3fz8AAIA/4JyRPTLmfj8AAIA/\
            mpkZPki/fT8AAIA/IbByPl+YfD8AAIA/SgyiPjqSez8AAIA/7lrCPhHHej8AAIA/B1/YPuM2ej8A\
            AIA/78njPiPbeT8AAIA/L93kPiegeT8AAIA/ETbcPvCFeT8AAIA/aLPKPmN/eT8AAIA/c2ixPvCF\
            eT8AAIA/V1uRPpqZeT8AAIA/h6dXPl66eT8AAIA/gZUDPpXUeT8AAIA/eJwiPVr1eT8AAIA/0SJb\
            vR4Wej8AAIA/4lgXvuM2ej8AAIA/D5xzvv5Dej8AAIA/XI+ivv5Dej8AAIA/pSzDvuM2ej8AAIA/\
            bHjavpEPej8AAIA/3gLpvpXUeT8AAIA/hXzwvn6MeT8AAIA/AAAAAAAAgD8AAIA/UI2XPOm3fz8A\
            AIA/UPyYPaTffj8AAIA/HHwhPki/fT8AAIA/bcV+PtGRfD8AAIA/8IWpPjqSez8AAIA/5/vJPp/N\
            ej8AAIA/PzXePoxKej8AAIA/C0blPlr1eT8AAIA/G57ePnrHeT8AAIA/HhbKPl66eT8AAIA/1Qmo\
            PuzAeT8AAIA/RrZzPiPbeT8AAIA/OGcEPnUCej8AAIA/5x0nPOM2ej8AAIA/rkfhvcNkej8AAIA/\
            eHplvjGZej8AAIA/w/WovhHHej8AAIA/f/vavmPuej8AAIA/mN0DvwwCez8AAIA//fYVv5oIez8A\
            AIA/nDMiv2Puej8AAIA/mSoov2izej8AAIA/jNsov8Nkej8AAIA/4uklv3UCej8AAIA/AAAAAAAA\
            gD8AAIA/LpCgPFuxfz8AAIA/CmiiPaTffj8AAIA/1lYsPru4fT8AAIA/sHKIPkSLfD8AAIA/NBG2\
            PjqSez8AAIA/oyPZPizUej8AAIA/coruPhpRej8AAIA/j1P0PgMJej8AAIA/p+joPj7oeT8AAIA/\
            DALLPrHheT8AAIA/PuiZPuf7eT8AAIA/RPotPscpej8AAIA/qRNQPMNkej8AAIA/LSEfvkymej8A\
            AIA/HHyhvmPuej8AAIA/p+jovuwvez8AAIA/vHQTv+hqez8AAIA/V+wvv3Gsez8AAIA/foxJv1Ha\
            ez8AAIA/W9Ncv23nez8AAIA/RpRmv6jGez8AAIA/YqFmvwN4ez8AAIA/YHZfv5oIez8AAIA/4XpU\
            v4iFej8AAIA/AAAAAAAAgD8AAIA/ejarPFuxfz8AAIA/xLGuPRfZfj8AAIA/tRU7Pi2yfT8AAIA/\
            mEyVPraEfD8AAIA/w/XIPqyLez8AAIA/at7xPp/Nej8AAIA/whcGP6hXej8AAIA/3nEKPx4Wej8A\
            AIA/xm0EP+f7eT8AAIA/FNDkPnUCej8AAIA/+TGmPjojej8AAIA/rBwaPsNkej8AAIA/Ad6CvWiz\
            ej8AAIA/63OVvpoIez8AAIA/klz+vj9Xez8AAIA/8BYov+Olez8AAIA/dQJKvxb7ez8AAIA/qDVt\
            v/FjfD8AAIA/MlWIvz/GfD8AAIA/RiWVvx/0fD8AAIA/9UqZv1vTfD8AAIA/xEKVv/FjfD8AAIA/\
            yjKMv6jGez8AAIA/c2iBvygPez8AAIA/AAAAAAAAgD8AAIA/NIC3PFuxfz8AAIA/f9m9PYnSfj8A\
            AIA/TYRNPhKlfT8AAIA/whemPpp3fD8AAIA/XI/iPpF+ez8AAIA/FYwKPxHHej8AAIA/KH4cPxpR\
            ej8AAIA/KxglP5EPej8AAIA/M8QhP+f7eT8AAIA/KVwPP5EPej8AAIA/mEzVPnE9ej8AAIA/JzFI\
            PoiFej8AAIA/yJi7vdXnej8AAIA/1sXNvrFQez8AAIA/taYpv+Olez8AAIA/RrZTv/rtez8AAIA/\
            dEZ0v2RdfD8AAIA/QYKSv3EbfT8AAIA/YhCwv5vmfT8AAIA/2hvEvwRWfj8AAIA/mbvGv7Iufj8A\
            AIA/P1e7v799fT8AAIA/mpmpv9GRfD8AAIA/NICXvzqSez8AAIA/",
            Float32Array
        );

        var nv = 1, nh = 90, ns = 25;
        var hsvIm = image.applycform("RGB to HSV");
        var id = hsvIm.getData(), npix = id.length / 3;
        var H = id.subarray(0), S = id.subarray(npix), V = id.subarray(2 * npix);
        for (var i = 0; i < npix; i++) {
            var iv = V[i] * (nv - 1), ih = H[i] * (nh - 1), is = S[i] * (ns - 1);
            var indice = (Math.floor(ih) * 25 + Math.floor(is)) * 3;
            H[i] += data[indice] / 180;
            S[i] *= data[indice + 1];
            V[i] *= data[indice + 2];
        }
        return hsvIm.applycform("HSV to RGB");
    };

    // Denoise parameters
    ImagePipe.defaultOptions = {
        "NOWAVDENOISE": true,
        "NONLMDENOISE": true,
        "NLMSTRENGTH": 10,
        "NOISETHRESH": 1,

        // Contrast parameters
        "NOGAINMAP": false,
        "MAPFACTOR": 1.0,
        "LINEARGAIN": 1.0,
        "NOSHARPEN": true,
        "NOHISTEQ": true,
        "COLORENHANCEMENT": false,

        // Other
        "NOAWB": true,
        "CUSTUMCM": false,
        "TONECURVE": true,
        "GAMMACURVE": "sRGB" // sRGB or REC709
    };

    ImagePipe.getOptions = function (options) {
        options = options === undefined ? {} : options;
        var out = {};
        for (var o in ImagePipe.defaultOptions) {
            if (!ImagePipe.defaultOptions.hasOwnProperty(o)) {
                continue;
            }
            out[o] = options[o] === undefined ? ImagePipe.defaultOptions[o] : options[o];
        }
        return out;
    };

    ImagePipe.developDNG = function (dngRoot, dngImage, options) {
        options = ImagePipe.getOptions(options);

        Tools.tic();
        var CFA = ImagePipe.reshapeCFA(dngRoot, dngImage);
        console.log("CFA reshaped in", Tools.toc(), "ms");

        if (dngImage.LinearizationTable) {
            Tools.tic();
            ImagePipe.applyLut(CFA, dngImage.LinearizationTable.value);
            console.log("Linearization table applied in", Tools.toc(), "ms");
        }

        Tools.tic();
        ImagePipe.blackAndWhiteLevels(CFA, dngImage);
        console.log("Black point removed in", Tools.toc(), "ms");

        if (options.NONLMDENOISE !== true) {
            var strength = options.NLMSTRENGTH;
            var iso = ImagePipe.readField(dngRoot.ExifTag.value.ISOSpeedRatings);
            var gain = (4 / 15) + (11 / 750) * iso;
            // Noise model sqrt(ax + b);
            var aLut = [0.24841949343681335, 0.4426628053188324, 0.6061931252479553, 0.7528106570243835, 0.8627214431762695, 0.995495617389679, 1.1117857694625854, 1.2174861431121826, 1.3319321870803833, 1.4374127388000488, 1.5506954193115234, 1.6513019800186157],
                bLut = [0.34482765197753906, 1.6082433462142944, 3.5053093433380127, 5.198346138000488, 7.34397554397583, 10.441062927246094, 12.083085060119629, 16.281572341918945, 19.65237045288086, 22.380355834960938, 24.83087921142578, 32.302547454833984];
            var g = Math.floor(gain) - 1, gn = Math.min(g + 1, 11);
            var a = aLut[g] + (gain - g) * (aLut[gn] - aLut[g]),
                b = bLut[g] + (gain - g) * (bLut[gn] - bLut[g]);
            Tools.tic();
            ImagePipe.hardThreshold(CFA, 0, 1);
            CFA["/="](gain)["+="](b / (gain * gain)).sqrt()["*="](2);
            CFA = ImagePipe.applyBayerNLM(CFA, strength / 3, strength / 3, strength / 3);
            // CFA = ImagePipe.applyBayerNLM(CFA, strength, strength, strength);
            // CFA = ImagePipe.applyBayerNLM(CFA, strength, strength, strength);
            CFA["/="](2).power(2)["-="](b / (gain * gain))["*="](gain);
            console.log("RAW NLM denoised with parameter", parseFloat(strength.toFixed(2)), "in", Tools.toc(), "ms");
        }

        if (options.NOWAVDENOISE !== true) {
            Tools.tic();
            CFA = CFA.sqrt();
            CFA.set([0, 2, -1], [0, 2, -1], CFA.get([0, 2, -1], [0, 2, -1]).wdenoiseRAW(options.NOISETHRESH, 'coif1'));
            CFA.set([1, 2, -1], [0, 2, -1], CFA.get([1, 2, -1], [0, 2, -1]).wdenoiseRAW(options.NOISETHRESH, 'coif1'));
            CFA.set([0, 2, -1], [1, 2, -1], CFA.get([0, 2, -1], [1, 2, -1]).wdenoiseRAW(options.NOISETHRESH, 'coif1'));
            CFA.set([1, 2, -1], [1, 2, -1], CFA.get([1, 2, -1], [1, 2, -1]).wdenoiseRAW(options.NOISETHRESH, 'coif1'));
            CFA = CFA.power(2);
            console.log("Wavelet denoising applied in", Tools.toc(), "ms");
        }

        if (dngImage.OpcodeList2 ) {
            for (var o in dngImage.OpcodeList2.value) {
                Tools.tic();
                if (dngImage.OpcodeList2.value[o].id === 9 && options.NOGAINMAP !== true) {
                    ImagePipe.applyMap(dngRoot, CFA, dngImage.OpcodeList2.value[o], "multiplicative", options.MAPFACTOR);
                    console.log("Gain Map applied at", Math.round(options.MAPFACTOR * 100), "% in", Tools.toc(), "ms");
                }
            }
        }

        if (options.LINEARGAIN !== 1) {
            Tools.tic();
            CFA["*="](options.LINEARGAIN);
            console.log("Linear gain of", parseFloat(options.LINEARGAIN.toFixed(2)), "applied in", Tools.toc(), "ms");
        }

        Tools.tic();
        var RAW = ImagePipe.demosaic(CFA, dngRoot, dngImage);
        console.log("RAW demosaiced in", Tools.toc(), "ms");

        var CM1 = ImagePipe.computeColorMatrix(dngRoot, dngImage);
        var CM2 = Matrix.toMatrix([2.034289, -0.727308, -0.306981, -0.228925, 1.231717, -0.002792, -0.008469, -0.153326, 1.161795]).reshape(3, 3).transpose();
        if (options.CUSTUMCM instanceof Matrix) {
            CM1 = CM2.inv()["*"](options.CUSTUMCM);
        }
        CM2["*"](CM1).display("CMT");
        console.log(CM2["*"](CM1).getData());

        var IMAGE;
        if (options.TONECURVE === true) {
            Tools.tic();
            IMAGE = RAW.applycform(CM1);
            console.log("Color Matrix applied in", Tools.toc(), "ms");

            Tools.tic();
            ImagePipe.applyACR3ToneCurve(IMAGE, false);
            console.log("ACR3 tone curve applied in", Tools.toc(), "ms");

            Tools.tic();
            IMAGE.applycform(CM2);
            console.log("ProPhoto RGB to sRGB conversion applied in", Tools.toc(), "ms");
        } else {
            Tools.tic();
            IMAGE = RAW.applycform(CM2["*"](CM1));
            console.log("Color Matrix applied in", Tools.toc(), "ms");
        }

        if (0) {
            Tools.tic();
            IMAGE = ImagePipe.applyHueSatProfile(IMAGE);
            console.log("Hue-saturation lut applied in", Tools.toc(), "ms");
        }

        if (options.NOAWB !== true) {
            Tools.tic();
            IMAGE = ImagePipe.greyWorld(IMAGE);
            console.log("AWB applied in", Tools.toc(), "ms");
        }

        Tools.tic();
        if (options.GAMMACURVE === "REC709") {
            ImagePipe.applyREC709Gamma(IMAGE, 4096);
        } else {
            options.GAMMACURVE = "sRGB";
            ImagePipe.applySRGBGamma(IMAGE, 4096);
        }
        console.log(options.GAMMACURVE + " gamma curve applied in", Tools.toc(), "ms");

        if (0) {
            Tools.tic();
            IMAGE = ImagePipe.guidedFilter(IMAGE, 75, 0.5, 1.5, 0.0);
            console.log("Guided filter applied in", Tools.toc(), "ms");
        }
        if (options.NOSHARPEN !== true) {
            Tools.tic();
            IMAGE = ImagePipe.applyGreenSharpen(IMAGE);
            // IMAGE = IMAGE.imfilter(Matrix.fspecial("unsharp"));
            console.log("Image sharpening 5x5 filter applied in", Tools.toc(), "ms");
        }

        if (options.COLORENHANCEMENT === true) {
            Tools.tic();
            IMAGE = ImagePipe.applyColorEnhancement(IMAGE);
            console.log("Color enhancement applied in", Tools.toc(), "ms");
        } else if (0) {
            Tools.tic();
            IMAGE = ImagePipe.applySimpleContrastEnhancement(IMAGE, 0.3);
            console.log("Simple contrast enhancement applied in", Tools.toc(), "ms");
        }

        if (options.NOHISTEQ !== true) {
          Tools.tic();
          ImagePipe.hardThreshold(IMAGE, 0, 1);
          IMAGE = IMAGE.histeq(1024, 0.3);
          console.log("image equalization applied in", Tools.toc(), "ms");
        }

        return IMAGE;
    };
    this.ImagePipe = ImagePipe;


}).bind(global)(global);
