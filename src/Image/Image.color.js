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
(function (global) {
    "use strict";

    /** This object provides tools for colorspace conversion.
     * It works on array storing color information in different ways.
     * the way they are stored is specified by three parameters: 
     *
     * + `sc` specify the space between 2 channels for the same pixel position,
     * + `sp` specify the space between 2 pixels for the same channel,
     * + `N` specify the number of pixels.
     *
     * For instance they can be stored as :
     *
     * + RGBRGB...RGB, `sc = 1, sp = 3` (default)
     * + RGBARGBA...RGBA, `sc = 1, sp = 4`
     * + RRR...GGG...BBB, `sc = N, sp = 1`
     * + RRR...GGG...BBB...AAA, `sc = N, sp = 1`
     *
     * Despite that these functions are designed for work on images, 
     * they can be used to work with every kind of data.
     *
     * **Warning:** The data are always converted on place.
     * 
     * @class Matrix.Colorspaces
     * @singleton 
     */
    var CS = {
        /** Apply a 3x3 matrix to the color.
         */
        "matrix": function (color, mat, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var m00 = mat[0], m01 = mat[3], m02 = mat[6];
            var m10 = mat[1], m11 = mat[4], m12 = mat[7];
            var m20 = mat[2], m21 = mat[5], m22 = mat[8];
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                color[r] = m00 * R + m01 * G + m02 * B;
                color[g] = m10 * R + m11 * G + m12 * B;
                color[b] = m20 * R + m21 * G + m22 * B;
            }
            return color;
        },
        "RGB to RGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                // Do something with RGB values
                color[r] = R;
                color[g] = G;
                color[b] = B;
            }
            return color;
        },
        /** Conversion function.
         */
        "applyFunctionRGB": function (color, fun, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var c = fun(color[r], color[g], color[b]);
                color[r] = c[0];
                color[g] = c[1];
                color[b] = c[2];
            }
            return color;
        },
        /** Conversion function.
         */
        "applyFunctionColor": function (color, fun, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                var c = fun([R, G, B]);
                color[r] = c[0];
                color[g] = c[1];
                color[b] = c[2];
            }
            return color;
        },
        /** Conversion function.
         */
        "RGB to GRAY": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                var gray = 0.2989 * R + 0.5870 * G + 0.1140 * B;
                color[r] = gray;
                color[g] = gray;
                color[b] = gray;
            }
            return color;
        },
        /** Conversion function.
         */
        "RGB to HSV":  function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var I6 = 1 / 6;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                var v = (R > G ? R : G) > B ? (R > G ? R : G) : B;
                var s = v - ((R < G ? R : G) < B ? (R < G ? R : G) : B), h = 0;
                if (s !== 0) {
                    if (v === R) {
                        h = ((G - B) / s) * I6;
                    } else if (v === G) {
                        h = (2 + (B - R) / s) * I6;
                    } else if (v === B) {
                        h = (4 + (R - G) / s) * I6;
                    }
                    if (h < 0) {
                        h += 1;
                    }
                    if (v !== 0) {
                        s /= v;
                    }
                }
                color[r] = h;
                color[g] = s;
                color[b] = v;
            }
            return color;
        },
        /** Conversion function.
         */
        "HSV to RGB":  function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var H = color[r], S = color[g], V = color[b];
                var t = (H * 6 | 0) % 6;
                var f = H * 6 - t;
                var l = V * (1 - S);
                var m = V * (1 - f * S);
                var n = V * (1 - (1 - f) * S);
                switch (t) {
                case 0:
                    color[r] = V;
                    color[g] = n;
                    color[b] = l;
                    break;
                case 1:
                    color[r] = m;
                    color[g] = V;
                    color[b] = l;
                    break;
                case 2:
                    color[r] = l;
                    color[g] = V;
                    color[b] = n;
                    break;
                case 3:
                    color[r] = l;
                    color[g] = m;
                    color[b] = V;
                    break;
                case 4:
                    color[r] = n;
                    color[g] = l;
                    color[b] = V;
                    break;
                case 5:
                    color[r] = V;
                    color[g] = l;
                    color[b] = m;
                    break;
                }
            }
            return color;
        },
        /** Conversion function.
         */
        "RGB to HSL":  function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var SQRT3 = Math.sqrt(3), IPI2 = 1 / (2 * Math.PI), I3 = 1 / 3;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                var h = Math.atan2(SQRT3 * (G - B), 2 * R - G - B) * IPI2;
                color[r] = h < 0 ? (h + 1) : h;
                var M = (R > G ? R : G) > B ? (R > G ? R : G) : B;
                var m = (R < G ? R : G) < B ? (R < G ? R : G) : B;
                color[g] = M - m;
                color[b] = (R + G + B) * I3;
            }
            return color;
        },
        /** Conversion function.
         */
        "HSL to RGB":  function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var PI = Math.PI, PIMI3 = PI / 3, PI2 = PI * 2, PIM2I3 = 2 * PI / 3;
            var I3 = 1 / 3;
            var SQRT3I2 = Math.sqrt(3) / 2, ISQRT3 = 1 / Math.sqrt(3);
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var H = color[r], S = color[g], L = color[b];
                var h = H * PI2;
                var hstar = h;
                while (hstar > PIMI3) {
                    hstar -= PIMI3;
                }
                var c = SQRT3I2 * S / Math.sin(PIM2I3 - hstar);
                var c1 = c * Math.cos(h) * I3, c2 = c * Math.sin(h) * ISQRT3;
                color[r] = L + c1 * 2;
                color[g] = L - c1 + c2;
                color[b] = L - c1 - c2;
            }
            return color;
        },
        /** Conversion function.
         * @todo 
         * Normalize values between [0, 1] in HSI conversion.
         */
        "RGB to HSI": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var ISQRT3 = 1 / Math.sqrt(3), ISQRT2 = 1 / Math.sqrt(2), ISQRT6 = 1 / Math.sqrt(6);
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                var O2 = (G - B) * ISQRT2;
                var O3 = (2 * R - G - B) * ISQRT6;
                color[r] = Math.atan2(O2, O3);
                color[g] = Math.sqrt(O2 * O2 + O3 * O3);
                color[b] = (R + G + B) * ISQRT3;
            }
            return color;
        },
        /** Conversion function.
         * @todo 
         * Normalize values between [0, 1] in HSI conversion.
         */
        "HSI to RGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var SQRT3 = Math.sqrt(3), SQRT2 = Math.sqrt(2), SQRT6 = Math.sqrt(6);
            var I6 = 1 / 6, I3 = 1 / 3;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var H = color[r], S = color[g], O1 = color[b];
                var O2 = S * Math.sin(H);
                var O3 = S * Math.cos(H);
                var c1 = O1 * SQRT3, c2 = O2 * SQRT2, c3 = O3 * SQRT6;
                var R = (c1 + c3) * I3;
                var G = (2 * c1 + 3 * c2 - c3) * I6;
                var B = (2 * c1 - 3 * c2 - c3) * I6;
                color[r] = R;
                color[g] = G;
                color[b] = B;
            }
            return color;
        },
        /** Conversion function.
         */
        "LinearRGB to sRGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var a = 0.055, I2D4 = 1 / 2.4;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                color[r] = (R > 0.0031308) ? (1.055 * Math.pow(R, I2D4) - a) : (R * 12.92);
                color[g] = (G > 0.0031308) ? (1.055 * Math.pow(G, I2D4) - a) : (G * 12.92);
                color[b] = (B > 0.0031308) ? (1.055 * Math.pow(B, I2D4) - a) : (B * 12.92);
            }
            return color;
        },
        /** Conversion function.
         */
        "sRGB to LinearRGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var I12D92 = 1 / 12.92, a = 0.055, I1PA = 1 / 1.055;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var sR = color[r], sG = color[g], sB = color[b];
                color[r] = sR > 0.04045 ? Math.pow((sR + a) * I1PA, 2.4) : sR * I12D92;
                color[g] = sG > 0.04045 ? Math.pow((sG + a) * I1PA, 2.4) : sG * I12D92;
                color[b] = sB > 0.04045 ? Math.pow((sB + a) * I1PA, 2.4) : sB * I12D92;
            }
            return color;
        },
        /** Conversion function.
         */
        "RGB to CMY":  function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                color[r] = 1 - color[r];
                color[g] = 1 - color[g];
                color[b] = 1 - color[b];
            }
            return color;
        },
        /** Conversion function.
         */
        "CMY to RGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                color[r] = 1 - color[r];
                color[g] = 1 - color[g];
                color[b] = 1 - color[b];
            }
            return color;
        },
        /** Conversion function.
         */
        "RGB to Opponent": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var ISQRT3 = 1 / Math.sqrt(3), ISQRT2 = 1 / Math.sqrt(2), ISQRT6 = 1 / Math.sqrt(6);
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                color[r] = (R + G + B) * ISQRT3;
                color[g] = (R - G) * ISQRT2;
                color[b] = (R + G - 2 * B) * ISQRT6;
            }
            return color;
        },
        /** Conversion function.
         */
        "Opponent to RGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var SQRT3 = Math.sqrt(3), SQRT2 = Math.sqrt(2), SQRT6 = Math.sqrt(6);
            var I6 = 1 / 6, I3 = 1 / 3;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var O1 = color[r], O2 = color[g], O3 = color[b];
                var c1 = O1 * SQRT3, c2 = O2 * SQRT2, c3 = O3 * SQRT6;
                color[r] = (2 * c1 + 3 * c2 + c3) * I6;
                color[g] = (2 * c1 - 3 * c2 + c3) * I6;
                color[b] = (c1 - c3) * I3;
            }
            return color;
        },
        /** Conversion function.
         */
        "RGB to Ohta": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var ISQRT3 = 1 / Math.sqrt(3), ISQRT2 = 1 / Math.sqrt(2), ISQRT6 = 1 / Math.sqrt(6);
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                color[r] = (R + G + B) * ISQRT3;
                color[g] = (R - B) * ISQRT2;
                color[b] = (-R + 2 * G - B) * ISQRT6;
            }
            return color;
        },
        /** Conversion function.
         */
        "Ohta to RGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var SQRT3 = Math.sqrt(3), SQRT2 = Math.sqrt(2), SQRT6 = Math.sqrt(6);
            var I6 = 1 / 6, I3 = 1 / 3;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var O1 = color[r], O2 = color[g], O3 = color[b];
                var c1 = O1 * SQRT3, c2 = O2 * SQRT2, c3 = O3 * SQRT6;
                color[g] = (c1 + c3) * I3;
                color[r] = (2 * c1 + 3 * c2 - c3) * I6;
                color[b] = (2 * c1 - 3 * c2 - c3) * I6;
            }
            return color;
        },
        /** Conversion function.
         */
        "LinearRGB to rgY": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                var Y = R + G + B;
                if (Y > 0) {
                    var iY = 1 / Y;
                    color[r] = R * iY ;
                    color[g] = G * iY;
                    color[b] = Y;
                } else {
                    color[r] = 1 / 3;
                    color[g] = 1 / 3;
                    color[b] = 0;
                }
            }
            return color;
        },
        /** Conversion function.
         */
        "rgY to LinearRGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], Y = color[b];
                color[r] = R * Y;
                color[g] = G * Y;
                color[b] = (1 - R - G) * Y;
            }
            return color;
        },
        /** Conversion function.
         */
        "LinearRGB to GRGBG": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                color[r] = R !== 0 ? G / R : 0;
                color[g] = B !== 0 ? G / B : 0;
                color[b] = G;
            }
            return color;
        },
        /** Conversion function.
         */
        "GRGBG to LinearRGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var GR = color[r], GB = color[g], G = color[b];
                color[r] = GR !== 0 ? G / GR : 0;
                color[g] = G;
                color[b] = GB !== 0 ? G / GB : 0;
            }
            return color;
        },

        // CIE colorspace
        /** Conversion function.
         * @private
         */
        getXYZTransform: function (inverse, illuminant, primaries) {
            illuminant = illuminant || [0.31271, 0.32902, 1]; // D65 xyY
            primaries = primaries || [0.64, 0.33, 1, 0.30, 0.60, 1, 0.15, 0.06, 1]; // sRGB xyY
            // White Point conversion
            var XYZWP = CS["xyY to XYZ"](illuminant);
            XYZWP = Matrix.toMatrix(XYZWP);
            
            // Primaries conversion
            var primaries = CS["xyY to XYZ"](primaries, 3);
            primaries = new Matrix([3, 3], primaries);
            
            var S = Matrix.diag(primaries.inv().mtimes(XYZWP));
            
            var XYZMat = primaries.mtimes(S);
            return inverse ? XYZMat.inv() : XYZMat;
        },
        /** Conversion function.
         */
        "LinearRGB to XYZ": function (color, N, sc, sp, wp, prim) {
            var mat = CS.getXYZTransform(false, wp, prim).getData();
            CS.matrix(color, mat, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        "XYZ to LinearRGB": function (color, N, sc, sp, wp, prim) {
            var mat = CS.getXYZTransform(true, wp, prim).getData();
            CS.matrix(color, mat, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        "XYZ to Lab": function (color, N, sc, sp, wp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;

            wp = wp || [0.31271, 0.32902, 1];
            var x = wp[0], y = wp[1], Yn = wp[2];
            var Xn = x * Yn / y;
            var Zn = (1 - x - y) * Yn / y;
            var IXn = 1 / Xn, IYn = 1 / Yn, IZn = 1 / Zn;

            var I3 = 1 / 3, I116M16 = 16 / 116;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var X = color[r], Y = color[g], Z = color[b];
                var c1 = X  * IXn;
                if (c1 > 0.008856) {
                    c1 = Math.pow(c1, I3);
                } else {
                    c1 = 7.787 * c1 + I116M16;
                }
                var c2 = Y * IYn;
                if (c2 > 0.008856) {
                    c2 = Math.pow(c2, I3);
                } else {
                    c2 = 7.787 * c2 + I116M16;
                }
                var c3 = Z  * IZn;
                if (c3 > 0.008856) {
                    c3 = Math.pow(c3, I3);
                } else {
                    c3 = 7.787 * c3 + I116M16;
                }

                color[r] = 116 * c2 - 16;
                color[g] = 500 * (c1 - c2);
                color[b] = 200 * (c2 - c3);
            }
            return color;
        },
        /** Conversion function.
         */
        "Lab to XYZ": function (color, N, sc, sp, wp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;

            wp = wp || [0.31271, 0.32902, 1];
            var x = wp[0], y = wp[1], Yn = wp[2];
            var Xn = x * Yn / y;
            var Zn = (1 - x - y) * Yn / y;

            var CST1 = Math.pow(0.008856, 1 / 3), CST2 = 1 / 7.787;
            var I116 = 1 / 116, I500 = 1 / 500, I200 = 1 / 200;
            var I116M16 = 16 / 116;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var L = color[r], as = color[g], bs = color[b];
                var YTmp = (L  + 16) * I116;
                var XTmp = YTmp + as  * I500;
                var ZTmp = YTmp - bs  * I200;
                if (YTmp > CST1) {
                    YTmp = Math.pow(YTmp, 3);
                } else {
                    YTmp = (YTmp - I116M16) * CST2;
                }
                if (XTmp > CST1) {
                    XTmp = Math.pow(XTmp, 3);
                } else {
                    XTmp = (XTmp - I116M16) * CST2;
                }
                if (ZTmp > CST1) {
                    ZTmp = Math.pow(ZTmp, 3);
                } else {
                    ZTmp = (ZTmp - I116M16) * CST2;
                }

                color[r] = XTmp * Xn;
                color[g] = YTmp * Yn;
                color[b] = ZTmp * Zn;
            }
            return color;
        },
        /** Conversion function.
         */
        "XYZ to Luv": function (color, N, sc, sp, wp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;

            wp = wp || [0.31271, 0.32902, 1];
            var x = wp[0], y = wp[1], Yn = wp[2];
            var Xn = x * Yn / y;
            var Zn = (1 - x - y) * Yn / y;
            var IYn = 1 / Yn;
            var un = 4 * Xn / (Xn + 15 * Yn + 3 * Zn);
            var vn = 9 * Yn / (Xn + 15 * Yn + 3 * Zn);

            var I3 = 1 / 3;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var X = color[r], Y = color[g], Z = color[b];
                var LTmp = Y * IYn;

                if (LTmp > 0.008856) {
                    LTmp = 116 * Math.pow(LTmp, I3) - 16;
                } else {
                    LTmp *= 903.3;
                }

                var tmp = 1 / (X + 15 * Y + 3 * Z);
                tmp = isFinite(tmp) ? tmp : 0;
                var uTmp = 4 * tmp * X;
                var vTmp = 9 * tmp * Y;

                tmp = 13 * LTmp;
                color[r] = LTmp;
                color[g] = tmp * (uTmp - un);
                color[b] = tmp * (vTmp - vn);
            }
            return color;
        },
        /** Conversion function.
         */
        "Luv to XYZ": function (color, N, sc, sp, wp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;

            wp = wp || [0.31271, 0.32902, 1];
            var x = wp[0], y = wp[1], Yn = wp[2];
            var Xn = x * Yn / y;
            var Zn = (1 - x - y) * Yn / y;
            var un = 4 * Xn / (Xn + 15 * Yn + 3 * Zn);
            var vn = 9 * Yn / (Xn + 15 * Yn + 3 * Zn);

            var CST1 = Math.pow(0.008856, 1 / 3), CST2 = 1 / 7.787;
            var I116 = 1 / 116, I116M16 = 16 / 116;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var L = color[r], u = color[g], v = color[b];
                var YTmp = (L + 16) * I116;
                if (YTmp > CST1) {
                    YTmp = Math.pow(YTmp, 3);
                } else {
                    YTmp = (YTmp - I116M16) * CST2;
                }
                var tmp = 1 / (13 * L);
                tmp = isFinite(tmp) ? tmp : 0;
                var uTmp = u * tmp + un;
                var vTmp = v * tmp + vn;
                tmp = YTmp / (4 * vTmp);

                color[r] = 9 * uTmp * tmp;
                color[g] = YTmp;
                color[b] = (12 - 3 * uTmp - 20 * vTmp) * tmp;
            }
            return color;
        },
        /** Conversion function.
         */
        'Lab to Lch': function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var IPI2 = 1 / (2 * Math.PI);
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var L = color[r], au = color[g], bv = color[b];
                var hTmp = Math.atan2(bv, au) * IPI2;
                color[r] = L;
                color[g] = Math.sqrt(au * au + bv * bv);
                color[b] = hTmp < 0 ? hTmp + 1 : hTmp;
            }
            return color;
        },
        /** Conversion function.
         */
        'Lch to Lab': function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var PI2 = Math.PI * 2;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var L = color[r], c = color[g], h = color[b];
                var hTmp = h * PI2;
                var auTmp = Math.cos(hTmp) * c;
                var bvTMP = Math.sin(hTmp) * c;
                color[r] = L;
                color[g] = auTmp;
                color[b] = bvTMP;
            }
            return color;
        },
        // CIE function combinations
        /** Conversion function.
         */
        "RGB to XYZ": function (color, N, sc, sp, wp, prim) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp, wp, prim);
            return color;
        },
        /** Conversion function.
         */
        "XYZ to RGB": function (color, N, sc, sp, wp, prim) {
            CS['XYZ to LinearRGB'](color, N, sc, sp, wp, prim);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        "RGB to Lab": function (color, N, sc, sp, wp, prim) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp, wp, prim);
            CS['XYZ to Lab'](color, N, sc, sp, wp);
            return color;
        },
        /** Conversion function.
         */
        "Lab to RGB": function (color, N, sc, sp, wp, prim) {
            CS['Lab to XYZ'](color, N, sc, sp, wp);
            CS['XYZ to LinearRGB'](color, N, sc, sp, wp, prim);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'RGB to Luv': function (color, N, sc, sp, wp, prim) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp, wp, prim);
            CS['XYZ to Luv'](color, N, sc, sp, wp);
            return color;
        },
        /** Conversion function.
         */
        'Luv to RGB': function (color, N, sc, sp, wp, prim) {
            CS['Luv to XYZ'](color, N, sc, sp, wp);
            CS['XYZ to LinearRGB'](color, N, sc, sp, wp, prim);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'RGB to Lch': function (color, N, sc, sp, wp, prim) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp, wp, prim);
            CS['XYZ to Lab'](color, N, sc, sp, wp);
            CS['Lab to Lch'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'Lch to RGB': function (color, N, sc, sp, wp, prim) {
            CS['Lch to Lab'](color, N, sc, sp);
            CS['Lab to XYZ'](color, N, sc, sp, wp);
            CS['XYZ to LinearRGB'](color, N, sc, sp, wp, prim);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        },

        // Chromaticity spaces
        /** Conversion function.
         */
        "XYZ to xyY": function (color, N, sc, sp, wp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;

            wp = wp || [0.31271, 0.32902, 1];
            var xn = wp[0], yn = wp[1];

            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var X = color[r], Y = color[g], Z = color[b];
                var IL = 1 / (X + Y + Z);
                if (isFinite(IL)) {
                    color[r] = X * IL;
                    color[g] = Y * IL;
                    color[b] = Y;
                } else {
                    color[r] = xn;
                    color[g] = yn;
                    color[b] = 0;
                }
            }
            return color;
        },
        /** Conversion function.
         */
        "xyY to XYZ": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var x = color[r], y = color[g], Y = color[b];
                var tmp = Y / y;
                color[r] = x * tmp;
                color[g] = Y;
                color[b] = (1 - x - y) * tmp;
            }
            return color;
        },
        /** Conversion function.
         */
        "XYZ to 1960 uvY": function (color, N, sc, sp, wp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;

            wp = wp || [0.31271, 0.32902, 1];
            var x = wp[0], y = wp[1], Yn = wp[2];
            var Xn = x * Yn / y, Zn = (1 - x - y) * Yn / y;
            var un = 4 * Xn / (Xn + 15 * Yn + 3 * Zn);
            var vn1 = 6 * Yn / (Xn + 15 * Yn + 3 * Zn);

            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var X = color[r], Y = color[g], Z = color[b];
                if (Y === 0) {
                    color[r] = un;
                    color[g] = vn1;
                    color[b] = 0;
                } else {
                    var IL = 1 / (X + 15 * Y + 3 * Z);
                    color[r] = 4 * X * IL;
                    color[g] = 6 * Y * IL;
                    color[b] = Y;
                }
            }
            return color;
        },
        /** Conversion function.
         */
        "1960 uvY to XYZ": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var I4M6 = 6 / 4, I3 = 1 / 3;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var u = color[r], v = color[g], Y = color[b];
                var iv = 1 / v;
                var X = I4M6 * Y * u * iv;
                color[r] = X;
                color[g] = Y;
                color[b] = (6 * Y * iv - X - 15 * Y) * I3;
            }
            return color;
        },
        /** Conversion function.
         */
        "XYZ to 1976 u'v'Y": function (color, N, sc, sp, wp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;

            wp = wp || [0.31271, 0.32902, 1];
            var x = wp[0], y = wp[1], Yn = wp[2];
            var Xn = x * Yn / y, Zn = (1 - x - y) * Yn / y;
            var un = 4 * Xn / (Xn + 15 * Yn + 3 * Zn);
            var vn = 9 * Yn / (Xn + 15 * Yn + 3 * Zn);

            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var X = color[r], Y = color[g], Z = color[b];
                if (Y === 0) {
                    color[r] = un;
                    color[g] = vn;
                    color[b] = 0;
                } else {
                    var iL = 1 / (X + 15 * Y + 3 * Z);
                    color[r] = 4 * X * iL;
                    color[g] = 9 * Y * iL;
                    color[b] = Y;
                }
            }
            return color;
        },
        /** Conversion function.
         */
        "1976 u'v'Y to XYZ": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var I4M9 = 9 / 4, I3 = 1 / 3;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var u = color[r], v = color[g], Y = color[b];
                var iv = 1/ v;
                var X = I4M9 * Y * u  * iv;
                color[r] = X;
                color[g] = Y;
                color[b] = (9 * Y * iv - X - 15 * Y) * I3;
            }
            return color;
        },
        /** Conversion function.
         */
        "xyY to 1960 uvY": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var x = color[r], y = color[g];
                var tmp = 1 / (-2 * x + 12 * y + 3);
                color[r] = 4 * x * tmp;
                color[g] = 6 * y * tmp;
            }
            return color;
        },
        /** Conversion function.
         */
        "1960 uvY to xyY": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var u = color[r], v = color[g];
                var tmp = 1 / (2 * u - 8 * v + 4);
                // Do something with RGB values
                color[r] = 3 * u * tmp;
                color[g] = 2 * v * tmp;
            }
            return color;
        },
        /** Conversion function.
         */
        "1976 u'v'Y to xyY": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var u = color[r], v = color[g];
                var tmp = 1 / (6 * u - 16 * v + 12);
                color[r] = 9 * u * tmp;
                color[g] = 4 * v * tmp;
            }
            return color;
        },
        /** Conversion function.
         */
        "xyY to 1976 u'v'Y": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var x = color[r], y = color[g];
                var tmp = 1 / (-2 * x + 12 * y + 3);
                color[r] = 4 * x * tmp;
                color[g] = 9 * y * tmp;
            }
            return color;
        },
        /** Conversion function.
         */
        "1976 u'v'Y to 1960 uvY": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp + sc;
            var I3M2 = 2 / 3;
            for (var g = sc; g < N; g += sp) {
                color[g] *= I3M2;
            }
            return color;
        },
        /** Conversion function.
         */
        "1960 uvY to 1976 u'v'Y": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp + sc;
            var I2M3 = 3 / 2;
            for (var g = sc; g < N; g += sp) {
                color[g] *= I2M3;
            }
            return color;
        },
        // Chromaticity function combinations
        /** Conversion function.
         */
        'RGB to rgY': function (color, N, sc, sp) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to rgY'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'rgY to RGB': function (color, N, sc, sp) {
            CS['rgY to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'rgY to xyY': function (color, N, sc, sp, wp, prim) {
            CS['rgY to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp, wp, prim);
            CS['XYZ to xyY'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'xyY to rgY': function (color, N, sc, sp, wp, prim) {
            CS['xyY to XYZ'](color, N, sc, sp);
            CS['XYZ to LinearRGB'](color, N, sc, sp, wp, prim);
            CS['LinearRGB to rgY'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'RGB to xyY': function (color, N, sc, sp, wp, prim) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp, wp, prim);
            CS['XYZ to xyY'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'xyY to RGB': function (color, N, sc, sp, wp, prim) {
            CS['xyY to XYZ'](color, N, sc, sp);
            CS['XYZ to LinearRGB'](color, N, sc, sp, wp, prim);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'RGB to 1960 uvY': function (color, N, sc, sp, wp, prim) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, wp, prim);
            CS['XYZ to xyY'](color, N, sc, sp);
            CS['xyY to 1960 uvY'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        '1960 uvY to RGB': function (color, N, sc, sp, wp, prim) {
            CS['1960 uvY to xyY'](color, N, sc, sp);
            CS['xyY to XYZ'](color, N, sc, sp);
            CS['XYZ to LinearRGB'](color, N, sc, sp, wp, prim);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        "RGB to 1976 u'v'Y": function (color, N, sc, sp, wp, prim) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp, wp, prim);
            CS["XYZ to 1976 u'v'Y"](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        "1976 u'v'Y to RGB": function (color, N, sc, sp, wp, prim) {
            CS["1976 u'v'Y to XYZ"](color, N, sc, sp);
            CS['XYZ to LinearRGB'](color, N, sc, sp, wp, prim);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        }
    };

    global.Colorspaces = CS;

})(Matrix);

(function (Matrix, Matrix_prototype) {
    "use strict";

    //////////////////////////////////////////////////////////////////
    //                       COLOR IMAGES MODULE                    //
    //////////////////////////////////////////////////////////////////


    var matlabEquivalence = {
        "lab2lch":   "Lab to Lch",
        "lab2srgb":  "Lab to RGB",
        "lab2xyz":   "Lab to XYZ",
        "lch2lab":   "Lch to Lab",
        "srgb2cmyk": "RGB to CMY",
        "srgb2lab":  "RGB to Lab",
        "srgb2xyz":  "RGB to XYZ",
        "upvpl2xyz": "1976 u'v'Y to XYZ",
        "uvl2xyz":   "1960 uvY to XYZ",
        "xyl2xyz":   "xyY to XYZ",
        "xyz2lab":   "XYZ to Lab",
        "xyz2srgb":  "XYZ to RGB",
        "xyz2upvpl": "XYZ to 1976 u'v'",
        "xyz2uvl":   "XYZ to 1960 uv",
        "xyz2xyl":   "XYZ to xyY"
    };


    /** @class Matrix */


    /** Apply a transformation to each RGB triplet of an image.
     *
     * @param {String | Function | Matrix} cform
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.applycform = function (cform) {
        if (this.ndims() !== 3 || this.getSize(2) < 3) {
            throw new Error("Matrix.applycform: Matrix must be an " +
                            "image with RGB components.");
        }
        var N = this.getSize(0) * this.getSize(1);
        if (typeof(cform) === "string") {
            if (Matrix.Colorspaces[cform]) {
                Matrix.Colorspaces[cform](this.getData(), N, N, 1);
            } else if (Matrix.Colorspaces[matlabEquivalence[cform]]) {
                Matrix.Colorspaces[matlabEquivalence[cform]](this.getData(), N, N, 1);
            } else {
                throw new Error("Matrix.applycform: Unknown color transformation " + cform);
            }
        } else if (typeof(cform) === "function") {
            if (cform.length === 3) {
                Matrix.Colorspaces.applyFunctionRGB(this.getData(), cform, N, N, 1);
            } else if (cform.length === 1) {
                Matrix.Colorspaces.applyFunctionColor(this.getData(), cform, N, N, 1);
            }
        } else {
            cform = Matrix.toMatrix(cform);
            if (!Tools.checkSizeEquals(cform.size(), [3, 3], Matrix.ignoreTrailingDims)) {
                throw new Error("Matrix.applycform: Matrix argument must be 3x3.");
            }
            Matrix.Colorspaces.matrix(this.getData(), cform.getData(), N, N, 1);
        }
        return this;
    };

    Matrix.applycform = function (im, cform) {
        return im.getCopy().applycform(cform);
    };


    /** Convert an gray-level image to a color image given a colormap.
     *
     * @param {String} colormap
     *  Can be "JET", or "HUE".
     *
     * @return {Matrix}
     */
    Matrix_prototype.toColormap = function (cMap) {
        var data = this.getData(), size = this.getSize(), dc = data.length;
        size[2] = 3;
        var out = new Matrix(size), dOut = out.getData();
        var R = dOut.subarray(0, dc), G = dOut.subarray(dc, 2 * dc), B = dOut.subarray(2 * dc, 3 * dc);
        var i, t, floor = Math.floor;
        if (cMap === "JET") {
            for (i = 0; i < dc; i++) {

                t = data[i] * 4;

                if (t >= 4) {
                    t = 3.99;
                } else if (t < 0) {
                    t = 0;
                }
                switch (floor(t * 2) % 8) {
                case 0:
                    R[i] = 0;
                    G[i] = 0;
                    B[i] = t + 0.5;
                    break;
                case 1:
                case 2:
                    R[i] = 0;
                    B[i] = 1;
                    G[i] = t - 0.5;
                    break;
                case 3:
                case 4:
                    R[i] = t - 1.5;
                    G[i] = 1;
                    B[i] = 2.5 - t;
                    break;
                case 5:
                case 6:
                    R[i] = 1;
                    G[i] = 3.5 - t;
                    B[i] = 0;
                    break;
                case 7:
                    R[i] = 4.5 - t;
                    G[i] = 0;
                    B[i] = 0;
                    break;
                }
            }

        } else if (cMap === "HUE") {

            for (i = 0; i < dc; i++) {
                var H = data[i];
                t = floor(H * 6) % 6;
                var f = H * 6 - t;
                switch (t) {
                case 0:
                    R[i] = 1;
                    G[i] = f;
                    B[i] = 0;
                    break;
                case 1:
                    R[i] = 1 - f;
                    G[i] = 1;
                    B[i] = 0;
                    break;
                case 2:
                    R[i] = 0;
                    G[i] = 1;
                    B[i] = f;
                    break;
                case 3:
                    R[i] = 0;
                    G[i] = 1 - f;
                    B[i] = 1;
                    break;
                case 4:
                    R[i] = f;
                    G[i] = 0;
                    B[i] = 1;
                    break;
                case 5:
                    R[i] = 1;
                    G[i] = 0;
                    B[i] = 1 - f;
                    break;
                }
            }

        } else if (cMap === "HUE") {
            dOut.set(data);
        }
        return out;
    };


    Matrix_prototype.correctImage = function (ill, illout) {
        illout = illout || Matrix.CIE.getIlluminant('D65');
        var mat = Matrix.CIE.getIlluminantConversionMatrix(illout, ill);
        this.applycform('sRGB to LinearRGB')
            .applycform(mat)
            .applycform('LinearRGB to sRGB');
        return this;
    };

    Matrix.correctImage = function (im, ill, illout) {
        return im.getCopy().correctImage(ill, illout);
    };

    Matrix_prototype.im2CCT = function () {
        var cform = Matrix.CIE['xyY to CCT'];

        var sizeOut = this.getSize();
        sizeOut.pop();
        var imOut = new Matrix(sizeOut, 'single');

        var id = this.getData(), od = imOut.getData();

        // Iterator to scan the view
        var view = this.getView();
        var dy = view.getStep(0), ly = view.getEnd(0), ny;
        var dx = view.getStep(1), lx = view.getEnd(1), nx;
        var dc = view.getStep(2);

        var x, y0, y1, y2, CCT, color = [];
        for (x = 0, nx = lx; x !== nx; x += dx) {
            y0 = x;
            y1 = x + dc;
            y2 = x + 2 * dc;
            for (ny = x + ly; y0 !== ny; y0 += dy, y1 += dy, y2 += dy) {
                color[0] = id[y0];
                color[1] = id[y1];
                color[2] = id[y2];
                CCT = cform(color);
                CCT = CCT < 1668 ? 1668 : (CCT > 20000 ? 20000 : CCT);
                CCT = isNaN(CCT)  ? 24999 : CCT;
                od[y0] = CCT;
            }
        }
        return imOut;
    };

    Matrix_prototype.CCT2im = function () {
        var cform = Matrix.CIE['CCT to xyY'];

        var sizeOut = this.getSize();
        sizeOut[2] = 3;
        var imOut = new Matrix(sizeOut, 'single');

        var id = this.getData(), od = imOut.getData();

        // Iterator to scan the view
        var view = imOut.getView();
        var dy = view.getStep(0), ly = view.getEnd(0), ny;
        var dx = view.getStep(1), lx = view.getEnd(1), nx;
        var dc = view.getStep(2);

        var x, y0, y1, y2, color = [];
        for (x = 0, nx = lx; x !== nx; x += dx) {
            y0 = x;
            y1 = x + dc;
            y2 = x + 2 * dc;
            for (ny = x + ly; y0 !== ny; y0 += dy, y1 += dy, y2 += dy) {
                color = cform(id[y0]);
                od[y0] = color[0];
                od[y1] = color[1];
                od[y2] = color[2];
            }
        }
        return imOut;
    };

})(Matrix, Matrix.prototype);
