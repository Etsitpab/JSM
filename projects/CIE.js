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

(function (global) {
    "use strict";

    /* Chromatic adaptation matrix (CAT) 'VonKries', 'Bradford' and 'CAT02'. */
    var chromaticAdaptationMatrices = {
        VonKries: [0.3897, -0.2298, 0, 0.689, 1.1834, 0, -0.0787, 0.0464, 1],
        Bradford: [0.8951, -0.7502, 0.0389, 0.2664, 1.7135, -0.0685, -0.1614, 0.0367, 1.0296],
        CAT02:    [0.7328, -0.7036, 0.003, 0.4296, 1.6975, 0.0136, -0.1624, 0.0061, 0.9834]
    };

    /**
     * @class Matrix.CIE
     * @singleton
     * This object proposes some methods to deal with colorimetry problems.
     */

    var CIE = {
        /** Return list of standards illuminant available with
         *  function 'CIE.getIlluminant'.
         * @return {Array}
         *  return an string Array of standards illuminant name.
         */
        getIlluminantList: function () {
            return [
                'A',   'B',   'C',
	            'D50', 'D55', 'D65', 'D75', 'E',
	            'F1',  'F2',  'F3',  'F4',  'F5',  'F6',
	            'F7',  'F8',  'F9',  'F10', 'F11', 'F12'
            ];
        },
        /** Set the current illuminant used for RGB to XYZ transformations
         * @param {string} [illuminant='D65']
         *  Illuminant required.
         *  Can be one one of the next: A, B, C, D50, D55, D65, D75, E,
         *  F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, F11 or F12.
         * @return {Object}
         *  CIE object.
         */
        setIlluminant: function (illuminant) {
            if (illuminant === undefined) {
                CIE.currentIlluminant = 'D65';
            } else {
                try {
                    CIE.getIlluminant(illuminant);
                } catch (e) {
                    throw new Error('CIE.setIlluminant: ' + e.message);
                }
                CIE.currentIlluminant = illuminant;
            }
            return CIE;
        },
        /** Set the current primaries system used for RGB to XYZ transformations.
         * @param {string} [primaries='sRGB']
         *  Primaries needed. Can be 'CIE 1931', 'sRGB' or 'Adobe RGB 1998'.
         * @return {Object}
         *  CIE object.
         */
        setPrimaries: function (primaries) {
            if (primaries === undefined) {
                CIE.currentPrimaries = 'sRGB';
            } else {
                try {
                    CIE.getPrimaries(primaries);
                } catch (e) {
                    throw new Error('CIE.setPrimaries: ' + e.message);
                }
                CIE.currentPrimaries = primaries;
            }
            return CIE;
        },
        /** Return standard illuminant.
         *
         *    // Get current illuminant in uvY colorspace
         *    var ill = CIE.getIlluminant('current', 'uvY')
         *
         * @param {string} [illuminant=CIE.currentIlluminant]
         *  Can be one one of the next: A, B, C, D50, D55, D65, D75, E,
         *  F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, F11 or F12.
         * @param {string} [colorspace='xyY']
         *  Output colorspace
         * @return {Object}
         *  'Array' contains illuminant chromaticity.
         *  'Array.CCT' contains illuminant correlated color temperature.
         */
        getIlluminant: function (illuminant, space) {
            if (illuminant === undefined || illuminant === 'current') {
                return CIE.getIlluminant(CIE.currentIlluminant, space);
            }
            space = space || 'xyY';
            var illuminants = {
                'A':   {stdIll: [0.44757, 0.40745, 1], CCT: 2856},
                'B':   {stdIll: [0.34842, 0.35161, 1], CCT: 4874},
                'C':   {stdIll: [0.31006, 0.31616, 1], CCT: 6774},
                'D50': {stdIll: [0.34567, 0.35850, 1], CCT: 5003},
                'D55': {stdIll: [0.33242, 0.34743, 1], CCT: 5503},
                'D65': {stdIll: [0.31271, 0.32902, 1], CCT: 6504},
                'D75': {stdIll: [0.29902, 0.31485, 1], CCT: 7504},
                'E':   {stdIll: [1 / 3,   1 / 3,   1], CCT: 5454},
                'F1':  {stdIll: [0.31310, 0.33727, 1], CCT: 6430},
                'F2':  {stdIll: [0.37208, 0.37529, 1], CCT: 4230},
                'F3':  {stdIll: [0.40910, 0.39430, 1], CCT: 3450},
                'F4':  {stdIll: [0.44018, 0.40329, 1], CCT: 2940},
                'F5':  {stdIll: [0.31379, 0.34531, 1], CCT: 6350},
                'F6':  {stdIll: [0.37790, 0.38835, 1], CCT: 4150},
                'F7':  {stdIll: [0.31292, 0.32933, 1], CCT: 6500},
                'F8':  {stdIll: [0.34588, 0.35875, 1], CCT: 5000},
                'F9':  {stdIll: [0.37417, 0.37281, 1], CCT: 4150},
                'F10': {stdIll: [0.34609, 0.35986, 1], CCT: 5000},
                'F11': {stdIll: [0.38052, 0.37713, 1], CCT: 4000},
                'F12': {stdIll: [0.43695, 0.40441, 1], CCT: 3000}
            };
            var ill = illuminants[illuminant];
            if (!ill) {
                throw new Error("CIE.getIlluminant: " + illuminant +
			        " is an invalid illuminant request.");
            }
            if (space !== 'xyY') {
                var convert = global.Colorspaces['xyY to ' + space];
                if (!Tools.isSet(convert)) {
                    throw new Error('CIE.getIlluminant: ' + e.message);
                }
                ill.stdIll = global.Colorspaces['xyY to ' + space](ill.stdIll);
            }
            // ill.stdIll.CCT = ill.CCT;
            return ill.stdIll;
        },
        /** Return standards Primaries object.
         * @param {string} [primaries=CIE.currentPrimaries]
         *  Primaries required. Can be 'CIE 1931', 'sRGB' or 'Adobe RGB 1998'.
         *  If no primaries are required return current primaries.
         * @param {string} [colorspace='xyY']
         *  Output colorspace
         * @return {Object}
         *  'Object.R' chromaticity of R primary.
         *  'Object.G' chromaticity of G primary.
         *  'Object.B' chromaticity of B primary.
         */
        getPrimaries: function (primaries, space) {
            if (primaries === undefined || primaries === 'current') {
                return CIE.getPrimaries(CIE.currentPrimaries, space);
            }
            space = space || 'xyY';

            var out;
            if (primaries === 'CIE 1931') {
                out = [0.73467, 0.26533, 1, 0.27375, 0.71741, 1, 0.16658, 0.00885, 1];
            } else if (primaries === 'sRGB') {
                out = [0.64, 0.33, 1, 0.30, 0.60, 1, 0.15, 0.06, 1];
            } else if (primaries === 'Adobe RGB 1998') {
                out = [0.64, 0.33, 1, 0.21, 0.71, 1, 0.15, 0.06, 1];
            } else if (primaries === 'Pro Photo') {
                out = [0.7347, 0.2653, 1, 0.1596, 0.8404, 1, 0.0366, 0.0001, 1];
            } else if (primaries === 'NTSC') {
                out = [0.67, 0.33, 1, 0.21, 0.71, 1, 0.14, 0.08, 1];
            } else {
                throw new Error("CIE.getPrimaries: " + primaries +
			        " is an invalid primaries request.");
            }

            if (space !== 'xyY') {
                try {
                    var currentPrimaries = CIE.currentPrimaries;
                    CIE.setPrimaries(primaries);
                    out = global.Colorspaces['xyY to ' + space](out, 3, 1, 3);
                    CIE.setPrimaries(currentPrimaries);
                } catch (e) {
                    throw new Error("CIE.getPrimaries: " + e.message);
                }
            }
            return out;
        },
        /**
         * Return RGB to XYZ transformation matrix and its inverse.
         * @param {boolean} [inverse=false]
         *  If true, will return the inverse transformation (XYZ to RGB).
         * @return {Matrix}
         *  Transformation matrix.
         */
        getXYZTransform: function (inverse) {
            var ill = CIE.getIlluminant(),
                prim = CIE.getPrimaries();
            return global.Colorspaces.getXYZTransform(inverse, ill, prim);
        },
        /** Compute illuminant conversion matrix.
         *
         *    // Change from 'CIE.getIlluminant()' to 'A' illuminant
         *    var mat = CIE.getIlluminantConversionMatrix('A');
         *
         *    // Change from 'E' illuminant to 'A' illuminant
         *    var mat = CIE.getIlluminantConversionMatrix('A', 'E');
         *    // Equivalent to
         *    var mat = CIE.getIlluminant([0.33, 0.33, 1], [0.31271, 0.32902, 1]);
         *
         *    // Change from 'CIE.getIlluminant()' to 4000K related chromaticity
         *    var mat = CIE.getIlluminant(4000);
         *
         * @param {Integer | String | Array} outputIlluminant
         *  New illuminant
         *  a. Color Temperature in range [4000, 25000]
         *  b. Standard illuminant available with CIE.getIlluminant()
         *  c. Array with xyY Chromaticity [x, y, Y];
         * @param {Integer | String | Array} [inputIlluminant=CIE.getIlluminant()]
         *  Current illuminant
         *  a. Color Temperature in range [4000, 25000]
         *  b. Standard illuminant available with CIE.getIlluminant()
         *  c. Array with xyY Chromaticity [x, y, Y];
         * @param {string} [model='CAT02']
         *  Chromatic adaptation model may be 'CAT02', 'VonKries' or 'Bradford'
         * @return {Matrix}
         *  Requested matrix.
         */
        getIlluminantConversionMatrix: function (dst, src, model) {
            var errMsg = 'CIE.getIlluminantConversionMatrix: ';

            var checkIlluminant = function (ill) {
                // Check input illuminant
                if (typeof ill === 'string') {
                    return CIE.getIlluminant(ill);
                }
                if (typeof ill === 'number') {
                    return CIE['CCT to xyY'](ill);
                }
                if (!src.length) {
                    throw new Error(errMsg +
                                    "Illuminant must be a string, " +
                                    "a number or an Array.");
                }
                return Array.prototype.slice.apply(ill);
            };

            // Check input illuminant
            src = (src === undefined) ? CIE.getIlluminant() : checkIlluminant(src);
            // Check output illuminant
            dst = checkIlluminant(dst);

            // Check chromatic adaptation model
            model = (model === undefined) ? 'CAT02' : model;
            model = chromaticAdaptationMatrices[model];
            if (model === undefined) {
                throw new Error(errMsg + "Available models are " +
			        "'VonKries', 'Bradford' and 'CAT02'");
            }

            // Get LMS conversion matrix
            var Mcat = new Matrix([3, 3], model);
            var IMcat = Mcat.inv();

            // Source and destination XYZ white point.
            var S = Mcat.mtimes(global.Colorspaces['xyY to XYZ'](src));
            var D = Mcat.mtimes(global.Colorspaces['xyY to XYZ'](dst));
            var Madap = Matrix.diag(D["./"](S));
            var Mxyz = CIE.getXYZTransform(), IMxyz = Mxyz.inv();

            // Transformation matrix
            return IMxyz.mtimes(IMcat.mtimes(Madap.mtimes(Mcat.mtimes(Mxyz))));
        },
        /** Conversion function from correlated color temperature to xyY chromaticity.
         * @param {Integer} temperature
         *  Correlated color temperature. Must be in range [1667, 25000].
         * @return {Array}
         *  Array of dimension 3 containing chromaticity.
         */
        getDaylightChromaticity: function (T) {
            var xd, yd;
            if (T >= 4000 && T <= 7000) {
                xd =  0.244063 + 0.09911 * 1e3 / T + 2.9678 * 1e6 / (T * T) - 4.6070 * 1e9 / (T * T * T);
            } else if (T > 7000 && T <= 25000) {
                xd = 0.237040 + 0.24748 * 1e3 / T + 1.9018 * 1e6 / (T * T) - 2.0064 * 1e9 / (T * T * T);
            } else {
                throw new Error("CIE.getDaylightChromaticity: Color temperature " +
                                "must be in range [4000, 25000]");
            }
            yd = 2.87 * xd - 3 * xd * xd - 0.275;
            return [xd, yd, 1];
        },
        getPlanckianChromaticity: function (T) {
            var x = 0, y = 0, pow = Math.pow;

            if (1667 <= T && T <= 4000) {
                x = -0.2661239e9 / pow(T, 3) - 0.2343580e6 / pow(T, 2) +
                    0.8776956e3 / T + 0.179910;
                if (1667 <= T && T <= 2222) {

                    y = -1.1063814 * pow(x, 3) - 1.34811020 * pow(x, 2) + 2.18555832 * x -
                        0.20219683;
                } else if (1667 <= T && T <= 4000) {
                    y = -0.9549476 * pow(x, 3) - 1.37418593 * pow(x, 2) + 2.09137015 * x -
                        0.16748867;
                }
            } else if (1667 <= T && T <= 25000) {
                x = -3.0258469e9 / pow(T, 3) + 2.1070379e6 / pow(T, 2) +
                    0.2226347e3 / T + 0.240390;
                y = 3.0817580 * pow(x, 3) - 5.87338670 * pow(x, 2) + 3.75112997 * x -
                    0.37001483;
            } else {
                throw new Error("CIE.getPlanckianChromaticity: Color temperature " +
                                "must be in range [1667, 25000]");
            }

            return [x, y, 1];
        },
        /** Return the spectrum locus in the desired chromaticity diagram.
         * @param {string} [diagram='xy']
         *  Chromaticity diagram name 'xy' or 'uv'.
         * @return {Object}
         *  'Object.x' contains x (or u) chromaticity coordinate.
         *  'Object.y' contains y (or v) chromaticity coordinate.
         *  'Object.lambda' contains associated wavelengths.
         * @todo Why do we change the primaries and the illuminant ?
         */
        getSpectrumLocus: function (diagram) {
            diagram = diagram || 'xyY';

            var i;
            var CMF = CIE.getCMF();
            var lambda = CMF.lambda,
                x = CMF.x,
                y = CMF.y,
                z = CMF.z;

            var data = new Float64Array((lambda.length + 1) * 3),
                chr1 = data.subarray(0, (lambda.length + 1)),
                chr2 = data.subarray((lambda.length + 1), (lambda.length + 1) * 2),
                chr3 = data.subarray((lambda.length + 1) * 2, (lambda.length + 1) * 3);

            for (i = lambda.length; i--; i) {
                var sum = 1 / (x[i] + y[i] + z[i]);
                if (sum) {
                    chr1[i] = x[i] * sum;
                    chr2[i] = y[i] * sum;
                }
                chr3[i] = 1;
            }

            chr1[lambda.length] = chr1[0];
            chr2[lambda.length] = chr2[0];
            chr3[lambda.length] = chr3[0];

            // uv chromaticity conversion
            if (diagram !== 'xyY') {
                var convert;
                try {
                    var currentPrimaries = CIE.currentPrimaries;
                    var currentIlluminant = CIE.currentIlluminant;
                    CIE.setPrimaries('CIE 1931');
                    CIE.setIlluminant('E');
                    convert = global.Colorspaces['xyY to ' + diagram];
                    CIE.setPrimaries(currentPrimaries);
                    CIE.setIlluminant(currentIlluminant);
                } catch (e) {
                    throw new Error('CIE.getPlanckianLocus: ' + e.message);
                }
                convert(data, lambda.length + 1, 1, 3);
            }
            var out = [];
            out[0] = chr1;
            out[1] = chr2;
            out.lambda = lambda;
            return out;
        },
        /** Return an illuminant locus, daylight or planckian, in the desired chromaticity diagram.
         * @param {string} locus required locus, daylight or planckian.
         * @param {string} [diagram='xyY']
         *  Chromaticity diagram name 'xyY', '1960 uvY' or "1976 u'v'Y".
         * @return {Object}
         *  'Object.x' contains x (or u) chromaticity coordinate.
         *  'Object.y' contains y (or v) chromaticity coordinate.
         *  'Object.CCT' contains associated correlated color temperature.
         */
        getIlluminantLocus: function (locus, diagram, T) {
            diagram = diagram || 'xyY';
            locus = locus.toLowerCase();

            var i, ei, t, f = CIE.getDaylightChromaticity;
            var Tmin, Tmax;
            if (locus === "planckian") {
                f = CIE.getPlanckianChromaticity;
                Tmin = 1e6 / 1667;
                Tmax = 1e6 / 25000;
            } else if (locus === "daylight") {
                f = CIE.getDaylightChromaticity;
                Tmin = 1e6 / 4000;
                Tmax = 1e6 / 25000;
            } else {
                throw new Error("CIE.getIlluminantuminantLocus: Undefined locus.");
            }

            if (!T) {
                T = [];
                for (i = 0, t = Tmin; t > Tmax; i++, t -= 5) {
                    T[i] = 1e6 / t;
                }
                T = new Float64Array(T);
            }

            var data = new Float64Array(T.length * 3);
            var chr1 = data.subarray(0, T.length),
                chr2 = data.subarray(T.length, T.length * 2),
                chr3 = data.subarray(T.length * 2);
            for (i = 0, ei = T.length; i < ei; i++) {
                var tmp = f(T[i]);
                chr1[i] = tmp[0];
                chr2[i] = tmp[1];
                chr3[i] = 1;
            }

            // Chromaticity conversion if needed
            if (diagram !== 'xyY') {
                var convert = global.Colorspaces["xyY to " + diagram];
                if (!Tools.isSet(convert)) {
                    throw new Error("CIE.getIlluminantLocus: " + e.message);
                }
                convert(data, T.length, T.length, 1);
            }
            var out = [chr1, chr2];
            out.CCT = T;
            return out;
        },
        getPlanckianLocus: function (diagram) {
            return CIE.getIlluminantLocus("planckian", diagram);
        },
        getDaylightLocus: function (diagram) {
            return CIE.getIlluminantLocus("daylight", diagram);
        },
        getDaylightSpectrum: function (T) {
            var xyd = CIE.getDaylightChromaticity(T);
            var xd = xyd[0], yd = xyd[1];
            var iM = 1 / (0.0241 + 0.2562 * xd  - 0.7341 * yd);
            var M1 = (-1.3515 - 1.7703 * xd + 5.9114 * yd) * iM;
            var M2 = (0.03000 - 31.4424 * xd + 30.0717 * yd) * iM;
            var S = new Float64Array(CIE.daylightSpectrum.S0);

            var i, ie;
            var S1 = CIE.daylightSpectrum.S1;
            var S2 = CIE.daylightSpectrum.S2;
            var sum = 0;
            for (i = 0, ie = S.length; i < ie; i++) {
                S[i] += M1 * S1[i] + M2 * S2[i];
                sum += S[i];
            }

            sum = 1 / sum;
            for (i = 0, ie = S.length; i < ie; i++) {
                S[i] *= sum;
            }

            return S;
        },
        getPlanckianSpectrum: function (T, scale) {
            scale = Array.prototype.slice.apply(scale);
            var i, ei;
            if (!scale) {
                scale = new Float32Array(CIE.colorMatchingFunctions["CIE 1931 XYZ"].lambda);
            }
            var exp = Math.exp, c1 = 4.995569628905151e-24, c2 = 0.014403434782609;
            var f = function (l) {
                l = l * 1e-9;
                return c1 / (l * l * l * l * l * (exp(c2 / (T * l)) - 1));
            };
            var sum = 0;
            for (i = 0, ei = scale.length; i < ei; i++) {
                var tmp = f(scale[i]);
                scale[i] = tmp;
                sum += tmp;
            }
            sum = 1 / sum;
            for (i = 0, ei = scale.length; i < ei; i++) {
                scale[i] *= sum;
            }

            return scale;
        },
        /** Conversion function from xyY chromaticity to correlated color temperature.
         *  This function function approximate the chromaticity projection on daylight
         *  locus [1].
         *
         *  [1] Hernández-Andrés, L. Lee, and Romero, "Calculating Correlated Color Temperatures
         *  Across the Entire Gamut of Daylight and Skylight Chromaticities" (1999)
         * @param {Integer} temperature
         *  xyY chromaticity.
         * @return {Integer}
         *  Associated correlated color temperature.
         */
        "xyY to CCT": function (color) {
            var xe = 0.3366, ye = 0.1735;
            var A0 = -949.86315, A1 = 6253.80338, A2 = 28.70599, A3 = 0.00004;
            var t1 = 0.92159, t2 = 0.20039, t3 = 0.07125;
            t1 = 1 / t1;
            t2 = 1 / t2;
            t3 = 1 / t3;

            var x = color[0], y = color[1];

            var floor = Math.floor, exp = Math.exp;
            var n = (x - xe) / (y - ye);

            var CCT = floor(A0 + A1 * exp(-n * t1) + A2 * exp(-n * t2) + A3 * exp(-n * t3));

            if (CCT < 1000) {
                CCT = NaN;
            } else if (CCT > 25000) {
                CCT = NaN;
            }

            return CCT;
        },
        getIsoCCTLine: function (T, dist, diagram) {
            diagram = diagram || "xyY";

            // Function to convert CCT to diagram coordinates
            var f1, f2, convertCCT;
            f1 = global.Colorspaces["xyY to 1960 uvY"];
            f2 = CIE['CCT to xyY'];
            convertCCT = function (T) {
                return f1(f2(T));
            };

            var delta = 1;
            // Central point
            var uv = convertCCT(T), u = uv[0], v = uv[1];

            // Points +- delta
            var uv1 = convertCCT(1e6 / (1e6 / T + delta)), u1 = uv1[0], v1 = uv1[1];
            var uv2 = convertCCT(1e6 / (1e6 / T - delta)), u2 = uv2[0], v2 = uv2[1];

            // Line paramters
            var a = -(u1 - u2) / (v1 - v2), b = v - a * u;

            // Line extremities
            u1 = u + dist / Math.sqrt(1 + a * a);
            v1 = u1 * a + b;
            u2 = u - dist / Math.sqrt(1 + a * a);
            v2 = u2 * a + b;

            // output in required diagram
            var ch1, ch2;
            if (diagram === "xyY") {
                var f = global.Colorspaces["1960 uvY to xyY"];
                ch1 = f([u1, v1, 0.5]);
                ch2 = f([u2, v2, 0.5]);
                return {x: [ch1[0], ch2[0]], y: [ch1[1], ch2[1]]};
            } else if (diagram !== "1960 uvY") {
                f1 = global.Colorspaces["1960 uvY to xyY"];
                f2 = global.Colorspaces["xyY to " + diagram];
                ch1 = f2(f1([u1, v1, 0.5]));
                ch2 = f2(f1([u2, v2, 0.5]));
                return {x: [ch1[0], ch2[0]], y: [ch1[1], ch2[1]]};
            } else {
                return {x: [u1, u2], y: [v1, v2]};
            }

        },
        getXYZColorMatchingFunction: function (primary, lambda) {
            primary = primary.toUpperCase();
            var f, exp = Math.exp;
            // Approximation from:
            // Wyman, Chris, Peter-Pike Sloan, and Peter Shirley.
            // "Simple Analytic Approximations to the CIE XYZ Color Matching Functions."
            if (primary === "X") {
                f = function (l) {
                    var t1 = (l - 442.0) * (l < 442.0 ? 0.0624 : 0.0374);
                    var t2 = (l - 599.8) * (l < 599.8 ? 0.0264 : 0.0323);
                    var t3 = (l - 501.1) * (l < 501.1 ? 0.0490 : 0.0382);
                    return 0.362 * exp(-0.5 * t1 * t1) + 1.056 * exp(-0.5 * t2 * t2) - 0.065 * exp(-0.5 * t3 * t3);
                };
            } else if (primary === "Y") {
                f = function (l) {
                    var t1 = (l - 568.8) * (l < 568.8 ? 0.0213 : 0.0247);
                    var t2 = (l - 530.9) * (l < 530.9 ? 0.0613 : 0.0322);
                    return 0.821 * exp(-0.5 * t1 * t1) + 0.286 * exp(-0.5 * t2 * t2);
                };
            } else if (primary === "Z") {
                f = function (l) {
                    var t1 = (l - 437.0) * (l < 437.0 ? 0.0845 : 0.0278);
                    var t2 = (l - 459.0) * (l < 459.0 ? 0.0385 : 0.0725);
                    return 1.217 * exp(-0.5 * t1 * t1) + 0.681 * exp(-0.5 * t2 * t2);
                };
            } else {
                throw new Error("CIE.getXYZColorMatchingFunction: Invalid primary.");
            }
            var i, ei, out = new Float32Array(lambda.length);
            for (i = 0, ei = out.length; i < ei; i++) {
                out[i] = f(lambda[i]);
            }
            return out;
        }
    };
    CIE['CCT to xyY'] = CIE.getPlanckianChromaticity;
    CIE.setIlluminant();
    CIE.setPrimaries();
    global.CIE = CIE;

})(Matrix);
