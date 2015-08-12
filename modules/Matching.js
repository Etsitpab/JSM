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

/** @class Matching
 * This class provides tools for image comparison with SIFT-like 
 * local descriptors.
 * @singleton
 */
var Matching = {};

if (typeof window === 'undefined') {
    var JSM = require('../modules/JSM.js');
    var Matrix = JSM.Matrix;
    var Tools = JSM.Tools;
    module.exports.Matching = Matching;
}
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

var root = typeof window === 'undefined' ? module.exports : window;

//////////////////////////////////////////////////////////////////
//                     DescriptorData Class                     //
//////////////////////////////////////////////////////////////////


(function (global) {

    /** 
     * @class Matching.DescriptorData
     *
     * This class creates Objects dealing with the descriptor datas.
     *
     * @param {Object} descriptor 
     *  Provide the descriptor informations use
     d to create data 
     *  structures.
     * 
     * @param {Array} [mem=[]]
     *   Allow to provide preallocated memory. The size of the Array 
     *   should be `descriptor.nBin * descriptor.nSector`.
     *
     * @constructor
     */
    function DescriptorData(descriptor, mem) {
        var nBin = descriptor.nBin, nSec = descriptor.nSector, h = [];

        var data = mem || new Float32Array(nBin * nSec);
        var i;
        for (i = 0; i < nSec; i++) {
            h[i] = data.subarray(i * nBin, (i + 1) * nBin);
        }
        /** Pointer to the Descriptor template.
         * @property {Object} descriptor
         */
        this.descriptor = descriptor;
        /** The histograms composing the descriptors
         * @property {Array} histograms
         */
        this.histograms = h;
        /** Number of bins used to build the histograms
         * @property {Number} nBin 
         */
        this.nBin = nBin;
        /** Number of histograms.
         * @property {Number} nSec
         */
        this.nSector = nSec;
        /** The concatenation of the histograms.
         * @property {Array} data
         */
        this.data = data;
        /** For each sector, the number of points used to build the 
         * corresponding histogram. 
         * @property {Array} pps
         */
        this.pps = new Float32Array(nSec);
        /** For each sector, the sum of the weights used to build the 
         * corresponding histogram. 
         * @property {Array} sum
         */
        this.sum = new Float32Array(nSec);
    }

    DescriptorData.prototype = {
        /** Extract modes from descriptor histograms. 
         * @chainable
         */
        extractModes: function () {
            var h = this.histograms;
            var sum = this.sum;
            var pps = this.pps;
            var i, ei;
            this.modes = [];
            for (i = 0, ei = h.length; i < ei; i++) {
                var l = sum[i] / pps[i];
                this.modes[i] = extractModes(h[i], true, 0, pps[i], l, l * l);
            }
            return this;
        },
        /** Create histograms from modes. 
         * @chainable
         */
        modesToHistograms: function () {
            var hs = this.histograms, h;

            var ms = this.modes, m;
            var nBin = this.nBin;
            var i, j, ei, ej;

            var round = Math.round;
            for (i = 0, ei = h.length; i < ei; i++) {
                h = hs[i];
                for (j = 0, ej = nBin; j < ej; j++) {
                    h[j] = 0;
                }
                m = ms[i];
                for (j = 0, ej = m.length; j < ej; j++) {
                    h[round(m[j].phase * nBin)] = m[j].norm;
                }
            }

            return this;
        },
        /** Normalize modes by the histograms sum. 
         * @chainable
         */
        normalizeModes: function () {
            var modes = this.modes;
            var i, j, ei, ej, sum;
            /*
             for (i = 0, sum = 0, ei = modes.length; i < ei; i++) {
             for (j = 0, ej = modes[i].length; j < ej; j++) {
             sum += modes[i][j].norm;
             }
             }
             */
            var sums = this.sum;
            for (i = 0, sum = 0, ei = sums.length; i < ei; i++) {
                sum += sums[i];
            }
            sum = (sum > 0) ? 1 / sum : 0;
            for (i = 0, ei = modes.length; i < ei; i++) {
                for (j = 0, ej = modes[i].length; j < ej; j++) {
                    modes[i][j].norm *= sum;
                }
            }
            return this;
        },
        /** Quantify modes position and weight. 
         * @chainable
         */
        processModes: function () {
            var modes = this.modes;
            var i, j, ei, ej;
            for (i = 0, ei = modes.length; i < ei; i++) {
                if (modes[i].length > 1) {
                    modes[i].slice(0, 1);
                }

                for (j = 0, ej = modes[i].length; j < ej; j++) {
                    var p = modes[i][j].phase;
                    var n = modes[i][j].norm;

                    var N = 4, M = 0.2;
                    p  = Math.floor(p * N) / N;

                    n = Math.floor(n * N / M) + 1;
                    n = (n >= N ? N : n) / N;

                    modes[i][j].phase = p;
                    modes[i][j].norm = n;
                }
            }
            return this;
        },
        /** Normalize histograms such that the descriptor sums up to one.
         * @chainable
         */
        normalizeHistograms: function () {
            var h = this.histograms;
            var pps = this.pps;
            var i, j, ei, ej, sum;

            // Normalization w.r.t pps
            for (i = 0, ei = h.length, sum = 0; i < ei; i++) {
                if (pps[i] !== 0) {
                    for (j = 0, ej = h[i].length; j < ej; j++) {
                        h[i][j] /= pps[i];
                        sum += h[i][j];
                    }
                }
            }

            // Descriptor must sum up to 1
            sum = (sum > 0) ? 1 / sum : 0;
            for (i = 0; i < ei; i++) {
                for (j = 0, ej = h[i].length; j < ej; j++) {
                    h[i][j] *= sum;
                }
            }
            return this;
        },
        thresholdHistograms: function (t) {
            var h = this.histograms;
            var i, j, ei, ej, sum;

            // Normalization w.r.t pps
            for (i = 0, ei = h.length, sum = 0; i < ei; i++) {
                // h[i][0] = 0;
                for (j = 1, ej = h[i].length; j < ej; j++) {
                    if (h[i][j] > t) {
                        h[i][j] = t;
                    }
                }
            }
            return this;
        },
        /** 
         Compute the cumulative histograms. 
         This is used to decrease 
         the time needed to compute CEMD distances between histograms.
         @chainable
         */
        cumulHistograms: function () {
            var h = this.histograms, nBin = this.nBin, nSec = this.nSector;
            this.cumulatedData = new Float32Array(nBin * nSec);
            this.cumulatedHistograms = [];
            var hc = this.cumulatedHistograms;
            var i, j, ej;
            for (i = 0; i < nSec; i++) {
                hc[i] = this.cumulatedData.subarray(i * nBin, (i + 1) * nBin);
                hc[i][0] = h[i][0];
                for (j = 1, ej = hc[i].length; j < ej; j++) {
                    hc[i][j] = hc[i][j - 1] + h[i][j];
                }
                for (j = 1, ej = hc[i].length; j < ej; j++) {
                    hc[i][j] = hc[i][j - 1] + h[i][j];
                }
            }
            return this;
        },
        /** Convert descriptor histograms to `String`. Designed for export
         * purposes.
         * @return {String} 
         */
        toString: function () {
            var str = "";
            var h = this.histograms;
            var i, j, ei, ej;

            // Normalization w.r.t pps
            for (i = 0, ei = h.length; i < ei; i++) {
                for (j = 0, ej = h[i].length; j < ej; j++) {
                    str += h[i][j] + " ";
                }
                str += "\n";
            }
            return str;
        }
    };

    global.DescriptorData = DescriptorData;

})(Matching);
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

var root = typeof window === 'undefined' ? module.exports : window;

//////////////////////////////////////////////////////////////////
//                       Descriptor Class                       //
//////////////////////////////////////////////////////////////////


(function (global) {

    var indexCircularPhase = function (phase, nBin) {
        if (phase < 0) {
            phase += 1;
        }
        var k =  Math.floor(phase * nBin + 0.5);
        return (k >= nBin) ? (k - nBin) : k;
    };

    /**
     * @class Matching.Descriptor
     *
     * This class create `Descriptor` object. It contains the
     * information on how extract a descriptor from a patch.
     * The data extracted will be stored in a `DescriptorData`
     * object.
     * @constructor
     * Allows to build `Descriptor` scheme.
     * @param {Object} args
     *  Parameters defining the descriptor. Here are the possible
     *  fields and there default values:
     *
     *  - `"sectors"`, `Array = [1, 4, 4]` : indicate how the the mask is cuted.
     *  - `"rings"`, `Array = [0.25, 0.75, 1]` : indicate the radius of the regions.
     *  - `"nBin"`, `12` : Define the number of bin used for the histogram consruction.
     *  - `"relativeOrientation"`, `true` : declare whether or not the histogram
     *     are aligned on a main direction.
     *  - `"extractModes"`, `false` : declare whether or not modes should be extracted from
     *     the histograms.
     *  - `"distance"`, `"L1"` : set the distance function used to compare histograms
     *  - `"normalize"`, `false`  : declare whether or not the patch colors have to
     *    be normalize before the descriptor computation.
     *  - `"type"`, `"GRADIENT"` : type of data can be `"GRADIENT"` for SIFT-like
     *    description and `"WEIGHTED-HISTOGRAMS"` for Hue/Saturation description.
     *  - `"colorspace"`, `{name: "Ohta", channels: 0}` define the colorspace channel(s)
     *    used for descriptor extraction.
     */
    function Descriptor(args) {
        var i, ei;
        for (i in args) {
            if (args.hasOwnProperty(i)) {
                this[i] = args[i];
            }
        }
        if (this.name === undefined) {
            throw new Error("Descriptor: Name should be specified.");
        }

        this.nSector = 0;
        for (i = 0, ei = this.sectors.length; i < ei; i++) {
            this.nSector += this.sectors[i];
        }
        if (this.rings === undefined) {
            this.setRingsFromSectors();
        }
        if (this.colorspace.name !== "RGB") {
            this.convert = "RGB to " + this.colorspace.name;
        }

        return this;
    }

    Descriptor.prototype = {
        /** Number of bin used to build the histograms */
        nBin: 8,
        /** Are histograms rotated with respect to the main orientation ? */
        relativeOrientation: true,
        /** How many rings, and how many sectors per rings  */
        sectors: [1, 4, 4],
        /** Radius of each ring  */
        rings: [0.25, 0.75, 1],
        /** Should modes been extracted from histograms ? */
        extractModes: false,
        /** Distance used to compare histograms "L1", "L2" or "CEMD" */
        distance: "L1",
        /** Should the color of the patch been normalized before
         * the descriptor computation ?
         */
        normalize: false,
        /** The kind of descriptor to extract :
         * "GRADIENT" or "WEIGHTED-HISTOGRAMS"
         */
        type: "GRADIENT",
        /** Colorspace information for the descriptor */
        colorspace: {name: "Ohta", channels: 0},

        /** Automatically defines the `ring` parameters.
         * By using this function, the different sectors will all have
         * the same surface.
         */
        setRingsFromSectors: function () {
            var rings = [], nSec = this.nSector, sec = this.sectors;
            rings[0] = Math.sqrt(sec[0] / nSec);
            var i, ei;
            for (i = 1, ei = sec.length - 1; i < ei; i++) {
                rings[i] = Math.sqrt(sec[i] / nSec + rings[i - 1] * rings[i - 1]);
            }
            rings[i] = 1;
            this.rings = rings;
            return this;
        },

        /** Create a `DescriptorData` structure corresponding to the descriptor.
         *
         * @param {Array} [mem]
         *   Memory preallocated.
         */
        getDataStructure: function (mem) {
            return new DescriptorData(this, mem);
        },

        /** Given a pixel position (x, y), a relative orientation `o`
         * and a radius `rMax`, this function return the corresponding histogram.
         *
         * @param {Number} x
         * @param {Number} y
         * @param {Number} o
         * @param {Number} rMax
         */
        getHistogramNumber: function (x, y, o, rMax) {
            var r2 = x * x + y * y, ring = 0;
            var rings = this.rings, sectors = this.sectors;
            while (r2 > rMax * rMax * rings[ring] * rings[ring]) {
                ring++;
            }

            if (ring >= rings.length) {
                throw new Error("Error getHistogramNumber: Point out of descriptor");
            }

            // Sector corresponding to point (x, y)
            var phase = Math.atan2(y, x) / (2 * Math.PI);
            phase = (phase < 0 ? phase + 1 : phase) - o;
            var sec = indexCircularPhase(phase, sectors[ring]);

            // Histogram corresponding to sector and ring
            var s, his = sec;
            for (s = 0; s < ring; s++) {
                his += sectors[s];
            }
            return his;
        },

        /** Extract the histograms from a main orientation `o` and an
         * image patch `patch`.
         * @param {Number} o
         * @param {Matrix} patch
         * @param {Array} [mem]
         *  Optionnal array used for storage.
         */
        extractWeightedHistograms: function (o, patch, data) {
            data = new global.DescriptorData(this, data);
            var h = data.histograms;
            var pps = data.pps;
            var sum = data.sum;
            var dPhase = patch.phase.getData(),
                dNorm = patch.norm.getData(),
                view = patch.view;
            var xs = view.getFirst(2) + view.getFirst(1),
                dx = view.getStep(1),
                ys = view.getFirst(0);

            var size = view.getSize(0),
                wSize = Math.floor(size / 2),
                wSize2 = wSize * wSize;
            
            var exp = Math.exp, c = -2 / wSize2;
            var oR = this.relativeOrientation === true ? o : 0;

            var rings = this.rings, sectors = this.sectors;
            var rings2 = new Float32Array(rings.length);
            for (var r = 0; r < rings.length; r++) {
                rings2[r] = wSize * wSize * rings[r] * rings[r];
            }
            
            var cst = 1 / (2 * Math.PI);
            
            var i, j, _j, ij;
            var x, y, x2, r2, j2;
            
            for (j = 0, _j = xs; j < size; j++, _j += dx) {
                for (i = 0, ij = _j + ys, j2 = (j - wSize) * (j - wSize); i < size; i++, ij++) {
                    r2 = j2 + (i - wSize) * (i - wSize);
                    
                    if (r2 > wSize2) {
                        continue;
                    }

                    var bin = indexCircularPhase(dPhase[ij] - oR, this.nBin);
                    var y = i - wSize, x = j - wSize;
                    var ring = 0;
                    while (r2 > rings2[ring]) {
                        ring++;
                    }
                    // Sector corresponding to point (x, y)
                    var phase = Math.atan2(y, x) * cst;
                    phase = (phase < 0 ? phase + 1 : phase) - o;
                    var nBin = sectors[ring];
                    if (phase < 0) {
                        phase += 1;
                    }
                    var k =  Math.floor(phase * nBin + 0.5);
                    var sec = (k >= nBin) ? (k - nBin) : k;
                    
                    // Histogram corresponding to sector and ring
                    var s, his = sec;
                    for (s = 0; s < ring; s++) {
                        his += sectors[s];
                    }
                    var norm = dNorm[ij];
                    //dNorm[ij] *= exp(c * r2);
                    var norm = exp(c * r2) * dNorm[ij];
                    pps[his]++;
                    sum[his] += norm;
                    h[his][bin] += norm;
                    
                }
            }
            return data;
        },

        /** This function normalize the color of an RGB patch.
         * Each channel is normalize such that they have the same average value.
         * This corresponds to the grey-world and is very useful to have
         * robust color descriptors.
         */
        normalizeColor: function (patchRGB) {
            var R = 1 / patchRGB.mean[0];
            var G = 1 / patchRGB.mean[1];
            var B = 1 / patchRGB.mean[2];

            var patch = patchRGB.patch.getCopy();

            var data = patch.getData();
            var size = patch.getSize(0);
            var wSize = Math.floor(size / 2), wSize2 = wSize * wSize;

            var i, j, _j, ij;
            var x, y, x2, r2, dc = size * size;
            // var pow = Math.pow, p = 2.2;

            for (j = 0, _j = 0, x = -wSize; j < size; j++, _j += size, x++) {
                for (i = 0, ij = _j, x2 = x * x, y = wSize; i < size; i++, ij++, y--) {

                    r2 = x2 + y * y;
                    if (r2 > wSize2) {
                        continue;
                    }
                    data[ij] *= R;
                    data[ij + dc] *= G;
                    data[ij + 2 * dc] *= B;
                }
            }

            return {patch: patch, mean: patchRGB.mean, mask: patchRGB.mask};
        },
        /** Compute from an RGB image patch an patch adapted to the 
         * descriptor computation. This transformation is constituted by 
         * a colorspace conversion an a gradient phase/norm computation.
         */
        getPatch: function (patch) {
            if (this.normalize === true) {
                // patch = this.normalizeColor(patch);
            }
            var cs = this.colorspace;
            if (cs.name !== "RGB") {
                patch = patch.applycform(this.convert);
            }

            switch (this.type) {
            case "GRADIENT":
                patch = patch.get([], [], cs.channels).gradient(0, 0, 1, 1);
                break;
            case "WEIGHTED-HISTOGRAMS":
                patch = {
                    norm: patch.get([], [], cs.weightChannel),
                    phase: patch.get([], [], cs.phaseChannel)
                };
                break;
            default:
                throw new Error("Descriptor: Unknown type: " + this.type + ".");
            }
            return patch;
        },
        /** Extract a `DescriptorData` structure from a main
         * orientation `o` and an image `patch`.
         *
         * @param {Number} o
         * @param {Matrix} patch
         * @param {Array} [mem]
         *  Preallocated memory.
         */
        extractFromPatch: function (o, patch, data) {
            var dataStruct = this.extractWeightedHistograms(o, patch, data);
            this.data = dataStruct;
            if (this.extractModes === true) {
                dataStruct.extractModes();
                dataStruct.normalizeModes();
                dataStruct.processModes();
            }

            if (this.distance === "CEMD") {
                dataStruct.normalizeHistograms();
                dataStruct.cumulHistograms();
            } else {
                dataStruct.normalizeHistograms();
                // dataStruct.thresholdHistograms(0.1);
                // dataStruct.normalizeHistograms();
            }

            return dataStruct;
        }
    };

    (function () {

        var CEMD = function (h1, h2, N) {
            var j, k, d, inf, a, H = new Float32Array(N);
            for (j = 0; j < N; j++) {
                H[j] = h2[j] - h1[j];
            }

            for (inf = 0.0, j = 1; j < N; j++)  {
                a = H[j] - H[0];
                inf += (a > 0) ? a : -a;
            }
            for (k = 1; k < N; k++) {
                for (d = 0.0, j = 0; j < k; j++)  {
                    a = H[j] - H[k];
                    d += (a > 0) ? a : -a;
                }
                for (j++; j < N; j++)  {
                    a = H[j] - H[k];
                    d += (a > 0) ? a : -a;
                }
                inf = d < inf ? d : inf;
            }
            return inf / N;
        };
        var L1 = function (h1, h2, N) {
            var tmp, d, i;
            for (d = 0, i = 0; i < N; i++) {
                tmp = h1[i] - h2[i];
                d += tmp > 0 ? tmp : -tmp;
            }
            return d / N;
        };
        var L2 = function (h1, h2, N) {
            var tmp, d, i;
            for (d = 0, i = 0; i < N; i++) {
                tmp = h1[i] - h2[i];
                d += tmp * tmp;
            }
            return d / N;
        };

        var min = Math.min, max = Math.max;
        function dSol(a, b) {
            var  dAbs = a > b ? (a - b) : (b - a);
            return (dAbs > 1 / 2) ? (1 - dAbs) : dAbs;
        }
        /*
         var DM = function (d1, d2) {
         var p1 = 0, p2 = 0, n1 = 0, n2 = 0;
         if (d1.length > 0) {
         p1 = d1[0].phase;
         n1 = d1[0].norm;
         }
         if (d2.length > 0) {
         p2 = d2[0].phase;
         n2 = d2[0].norm;
         }
         var d = p1 - p2, w = n1 - n2;
         d = d < 0 ? (d < -0.5 ? 1 + d : -d) : (d > 0.5 ? 1 - d : d);
         return (w < 0) ? (d * n1 - 0.5 * w) : (d * n2 + 0.5 * w);
         };
         var DM_phase = function (d1, d2) {
         var a = (d1.length > 0) ? d1[0].phase : 0;
         var b = (d2.length > 0) ? d2[0].phase : 0;
         var d = d < 0 ? -d : d;
         return d;
         };
         var DM_norm = function (d1, d2) {
         var a = (d1.length > 0) ? d1[0].norm : 0;
         var b = (d2.length > 0) ? d2[0].norm : 0;
         var d = a - b;
         return d < 0 ? -d : d;
         };
         */
        var D2M = function (d1, d2) {
            var a1 = 0, alpha1 = 0, a2 = 0, alpha2 = 0, b1 = 0, beta1 = 0, b2 = 0, beta2 = 0;

            if (d1.length > 0) {
                a1 = d1[0].phase;
                alpha1 = d1[0].norm;
            }
            if (d1.length > 1) {
                a2 = d1[1].phase;
                alpha2 = d1[1].norm;
            }
            if (d2.length > 0) {
                b1 = d2[0].phase;
                beta1 = d2[0].norm;
            }
            if (d2.length > 1) {
                b2 = d2[1].phase;
                beta2 = d2[1].norm;
            }

            // Assure que (alpha1+alpha2) < (beta1+beta2) et
            // par conséquent gamma2 <= beta1
            if (alpha1 + alpha2 > beta1 + beta2) {
                return D2M(d2, d1);
            }

            var m1 = 0, m3 = 0, di = 0;

            var da1b1 = dSol(a1, b1), da1b2 = dSol(a1, b2);
            var da2b1 = dSol(a2, b1), da2b2 = dSol(a2, b2);

            var dist1 = da1b1 - da1b2;
            var dist2 = da2b1 - da2b2;

            var gamma2 = alpha1 + alpha2 - beta2;
            /* Cas 1 : max (dist1, dist2) <= 0 */
            if (max(dist1, dist2) <= 0) {
                if (beta1 >=  alpha1 + alpha2) {
                    m1 = alpha1;
                    m3 = alpha2;
                } else {
                    if (dist1 <= dist2) {
                        if (beta1 >= alpha1) {
                            m1 = alpha1;
                            m3 = beta1 - alpha1;
                        } else {
                            m1 = beta1;
                            m3 = 0;
                        }
                    } else {
                        if (beta1 >= alpha2) {
                            m1 = beta1 - alpha2;
                            m3 = alpha2;
                        } else {
                            m1 = 0;
                            m3 = beta1;
                        }
                    }
                }
                // Cas 2 : 0 <= min (dist1, dist2)
            } else if (min(dist1, dist2) >= 0) {
                if (gamma2 <= 0) {
                    m1 = 0;
                    m3 = 0;
                } else {
                    if (dist1 <= dist2) {
                        if (gamma2 >= alpha1) {
                            m1 = alpha1;
                            m3 = beta1 - alpha1;
                        } else {
                            m1 = beta1;
                            m3 = 0;
                        }
                    } else {
                        if (gamma2 >= alpha2) {
                            m1 = gamma2 - alpha2;
                            m3 = alpha2;
                        } else {
                            m1 = 0;
                            m3 = alpha2;
                        }
                    }
                }
                // Cas 3 : min (dist1, dist2) <= 0 <= max (dist1, dist2)
            } else {
                if (dist1 <= dist2) {
                    if (beta1 <= alpha1) {
                        m1 = beta1;
                        m3 = 0;
                    } else {
                        if (gamma2 <= alpha1) {
                            m1 = alpha1;
                            m3 = 0;
                        } else {
                            m1 = alpha1;
                            m3 = gamma2 - alpha1;
                        }
                    }
                } else {
                    if (beta1 <= alpha2) {
                        m1 = 0;
                        m3 = beta1;
                    } else {
                        if (gamma2 <= alpha2) {
                            m1 = 0;
                            m3 = alpha2;
                        } else {
                            m1 = gamma2 - alpha2;
                            m3 = alpha2;
                        }
                    }
                }
            }


            // Distance dans le cas où alpha1 + alpha2 = beta1 + beta2
            di = m1 * dist1 + m3 * dist2 + alpha1 * da1b2 + alpha2 * da2b2;
            // Prise en compte de la différence de poids
            di += (beta1 + beta2 - alpha1 - alpha2) * 0.5;

            return di;
        };

        /** Compute the distances between each sectors of a `request` DescriptorData
         * Object and an Array of `DescriptorData` candidates. return an Array
         * of distances.
         *
         * @param {Object} request
         *  `DescriptorData` object of the request.
         * @param {Array} candidates
         *  Array of `DescriptorData` objects of the candidates.
         *
         * @return {Array}
         */
        Descriptor.prototype.computeDistances = function (request, candidates) {

            var N = this.nSector, L = this.nBin;
            var k, j, ej = candidates.length;

            // Distances computations
            var distOut = [];
            for (k = 0; k < N; k++) {
                distOut[k] = new Float32Array(ej);
            }
            var hRequest, hCandidate;

            var distFun, field;
            if (this.distance === "L1") {
                field = "histograms";
                distFun = L1;
            } else if (this.distance === "L2") {
                field = "histograms";
                distFun = L2;
            } else if (this.distance === "CEMD") {
                field = "cumulatedHistograms";
                distFun = CEMD;
            } else if (this.distance === "D2M") {
                field = "modes";
                distFun = D2M;
            }
            if (!distFun) {
                throw new Error('Sift.computeDistances: Unknown distance: ' + this.distance);
            }
            hRequest = request[field];
            for (j = 0; j < ej; j++) {
                hCandidate = candidates[j][field];
                for (k = 0; k < N; k++) {
                    distOut[k][j] = distFun(hRequest[k], hCandidate[k], L);
                }
            }
            return distOut;
        };

    })();


    global.Descriptor = Descriptor;

    /** Examples of descriptors */
    global.descriptorDB = {
        R:    new Descriptor({name: "R", colorspace: {name: "RGB", channels: 0}}),
        G:    new Descriptor({name: "G", colorspace: {name: "RGB", channels: 1}}),
        B:    new Descriptor({name: "B", colorspace: {name: "RGB", channels: 2}}),
        H:    new Descriptor({name: "H", colorspace: {name: "HSL", channels: 0}}),
        S:    new Descriptor({name: "S", colorspace: {name: "HSL", channels: 1}}),
        L:    new Descriptor({name: "L", colorspace: {name: "HSL", channels: 2}}),
        SIFT: new Descriptor({name: "SIFT"}),
        OHTA1: new Descriptor({name: "OHTA1", colorspace: {name: "Ohta", channels: 1}}),
        OHTA2: new Descriptor({name: "OHTA2", colorspace: {name: "Ohta", channels: 2}}),
        OPP1: new Descriptor({name: "OPP1", colorspace: {name: "Opponent", channels: 1}}),
        OPP2: new Descriptor({name: "OPP2", colorspace: {name: "Opponent", channels: 2}}),
        OHTAN1: new Descriptor({name: "OHTAN1", colorspace: {name: "OhtaNorm", channels: 1}}),
        OHTAN2: new Descriptor({name: "OHTAN2", colorspace: {name: "OhtaNorm", channels: 2}}),

        "HUE-NORM": new Descriptor({
            name: "HUE-NORM",
            type: "WEIGHTED-HISTOGRAMS",
            colorspace: {
                name: "HSL",
                weightChannel: 1,
                phaseChannel: 0
            },
            normalize: true,
            relativeOrientation: false
        }),
        "HUE": new Descriptor({
            name: "HUE",
            type: "WEIGHTED-HISTOGRAMS",
            colorspace: {
                name: "HSL",
                weightChannel: 1,
                phaseChannel: 0
            },
            normalize: false,
            relativeOrientation: false
        })
    };

})(Matching);
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

var root = typeof window === 'undefined' ? module.exports : window;

//////////////////////////////////////////////////////////////////
//                         Match Class                          //
//////////////////////////////////////////////////////////////////


(function (global) {

    /** This class provides object to store matchs.
     *
     * @class Matching.Match
     * @param {Integer} num_1 
     *  Number of the first `Keypoint`.
     *  
     * @param {Object} key_1
     *  The first `Keypoint`.
     * 
     * @param {Integer} num_2 
     *  Number of the second `Keypoint`.
     *
     * @param {Integer} key_2 
     *  The second `Keypoint`.
     *
     * @param {Number} distance 
     *  The distance between the two keypoints.
     *
     * @constructor
     */
    function Match(i, k1, j, k2, d) {
        /** First keypoint */
        this.k1 = k1;
        /* The first keypoint number for localisation in scalespace */
        this.k1.number = i;
        /** First keypoint */
        this.k2 = k2;
        /* The second keypoint number for localisation in scalespace */
        this.k2.number = j;
        /** The disimilarity measure between these two keypoints */
        this.distance = d;
    }

    Match.prototype.isValid = false;

    /** Function used to sort the matches.
     * @property
     */
    Match.compar = function (m1, m2) {
        return m1.distance - m2.distance;
    };

    /** Convert a match to a String. Function used for export purpose.
     */
    Match.prototype.toString = function () {
        var str = this.k1.toString(true, 
                                   true, false, false) + " ";
        str += this.k2.toString(true, true, false, false) + " ";
        str += this.distance;
        str += " " + (this.isValid ? 1 : 0);
        return str;
    };

    global.Match = Match;

})(Matching);
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

var root = typeof window === 'undefined' ? module.exports : window;

//////////////////////////////////////////////////////////////////
//                        Keypoint Class                        //
//////////////////////////////////////////////////////////////////


(function (global) {

    var indexCircularPhase = function (phase, nBin) {
        if (phase < 0) {
            phase += 1;
        }
        var k =  Math.floor(phase * nBin + 0.5);
        return (k >= nBin) ? (k - nBin) : k;
    };

    /**
     * @class Matching.Keypoint
     *
     * This class creates `Keypoint` objects which contains the
     * information on keypoint extracted from an image.
     *
     * @constructor
     * Allows to build `Keypoint`.
     *
     * @param {Number} x
     *  The x location of the keypoint.
     * @param {Number} y
     *  The y location of the keypoint.
     * @param {Number} sigma
     *  The blur factor corresponding to the keypoint.
     * @param {Number} laplacian
     *  The laplacian value of the keypoint.
     */
    function Keypoint(x, y, sigma, laplacian) {
        this.x = x;
        this.y = y;
        this.sigma = sigma;
        this.laplacian = laplacian;
    }

    /** Number of bins used to compute the histogram of oriented gradient */
    Keypoint.prototype.nBin = 36;
    /** The algorithm used to compute the main(s) orientation(s) 
     of the keypoint. */
    Keypoint.prototype.algorithm = "max";
    /** The factor size used to determine the associated region 
     in the image. */
    Keypoint.prototype.factorSize = 18;
    /** The descriptor(s) used to describe the region of the keypoint. */
    Keypoint.prototype.descriptors = [
        global.descriptorDB["SIFT"],
    ];
    /** The criterion used to compare the Keypoint to others. */
    Keypoint.prototype.criterion = "NN-DR";

    /** Convert the Keypoint to String for export purposes.
     * The fields to export can be specified as parameters.
     * @param {Boolean} [x = true]
     * @param {Boolean} [y = true]
     * @param {Boolean} [scale = true]
     * @param {Boolean} [orientation = true]
     * @return {String}
     */
    Keypoint.prototype.toString = function (x, y, s, o) {
        x = (x === undefined) ? true : x;
        y = (y === undefined) ? true : y;
        s = (s === undefined) ? true : s;
        o = (o === undefined) ? true : o;
        var str = "";
        if (x) {
            str += this.x + " ";
        }
        if (y) {
            str += this.y + " ";
        }
        if (s) {
            str += this.sigma + " ";
        }
        if (this.orientation !== undefined & o) {
            str += " " + this.orientation;
        }
        return str;
    };

    /** Return a copy of the keypoint */
    Keypoint.prototype.getCopy = function () {
        var newKeypoint = new Keypoint(this.x, this.y, this.sigma, this.laplacian);
        newKeypoint.nScale = this.nScale;

        if (this.histogram) {
            newKeypoint.histogram = this.histogram;
        }
        if (this.patch) {
            newKeypoint.patch = this.patch;
        }
        if (this.descriptorsData) {
            newKeypoint.descriptorsData = this.descriptorsData;
        }
        if (this.orientation) {
            newKeypoint.orientation = this.orientation;
        }
        return newKeypoint;
    };

    /** Extract the main(s) orientation(s) from a patch.
     * @param {Object} patch
     * @param {String} [algo]
     */
    Keypoint.prototype.extractMainOrientation = function (patch, algo) {
        this.histogram = new Float32Array(this.nBin);
        var hist = this.histogram;
        var nBin = this.nBin;
        algo = (algo || this.algorithm).toLowerCase();
        this.algorithm = algo;
        var getIndex = indexCircularPhase;

        var dPhase = patch.phase.getData(),
            dNorm = patch.norm.getData(),
            view = patch.view;
        var xs = view.getFirst(1), dx = view.getStep(1), ys = view.getFirst(0);

        var size = view.getSize(0);
        var wSize = Math.floor(size / 2), wSize2 = wSize * wSize;
        var nPoints = 0;
        var exp = Math.exp, c = -2 / wSize2;
        var i, ei, j, _j, ij, j2, r2;
        for (j = 0, _j = xs; j < size; j++, _j += dx) {
            for (i = 0, ij = _j + ys, j2 = (j - wSize) * (j - wSize); i < size; i++, ij++) {
                r2 = j2 + (i - wSize) * (i - wSize);
                if (r2 > wSize2) {
                    continue;
                }
                if (ij >= dPhase.length) {
                    console.log(ij, dPhase.length, i, j, _j);
                    throw new Error();
                }
                var bin = getIndex(dPhase[ij], nBin);
                nPoints++;
                hist[bin] += exp(c * r2) * dNorm[ij];
                // hist[bin] += dNorm[ij];
            }
        }
        var orientations = [];
        switch (algo) {
        case "ac":
            var l = 0;
            for (i = 0; i < nBin; i++) {
                l += hist[i];
            }
            l = l / nPoints;
            hist.nPoints = nPoints;
            hist.lambda = l;
            var modes = extractModes(hist, true, 0, nPoints, l, l * l);
            hist.modes = modes;
            for (i = 0, ei = modes.length; i < ei; i++) {
                orientations.push(modes[i].phase);
            }
            return orientations;
        case "max":
            var max = 0;
            for (i = 0, ei = hist.length; i < ei; i++) {
                if (hist[i] > hist[max]) {
                    max = i;
                }
            }
            return [max / nBin];
        default:
            throw new Error("Keypoint.extractMainOrientation: " +
                            "Wrong algorithm choice: "  + this.algorithm + ".");
        }
    };

    /** Extract the Descriptors from a patch.
     * @param {Object} patch
     * @param {String} [descriptors]
     */
    Keypoint.prototype.extractDescriptors = function (patch, descriptors, mem) {
        this.descriptors = descriptors || this.descriptors;
        descriptors = this.descriptors;

        this.descriptorsData = {};
        var d, ed, desc, name;
        var data, orientation = this.orientation;
        for (d = 0, ed = descriptors.length; d < ed; d++) {
            desc = descriptors[d];
            name = desc.name;
            data = desc.extractFromPatch(orientation, patch, mem[name]);
            this.descriptorsData[name] = data;
        }
        return this;
    };

    /** Compute distance between the descriptor(s) of a Keypoint and the
     * descriptors of an Array of keypoints.
     * @param {Array} Keypoints
     * @param {Array} [names]
     *  An Array of strings containings the names of the descriptors to
     *  compare.
     */
    Keypoint.prototype.computeDistances = function (keypoints, names) {
        names = names || this.descriptorsData;

        var getDescriptors = function (keypoints, name) {
            var descriptors = [], i, ei;
            for (i = 0, ei = keypoints.length; i < ei; i++) {
                descriptors[i] = keypoints[i].descriptorsData[name];
            }
            return descriptors;
        };
        var distances = {"length": keypoints.length};
        var name;
        // Compute distances for each kind of descriptor
        for (name in names) {
            if (names.hasOwnProperty(name)) {
                var dRequest = this.descriptorsData[name];
                var dCandidates = getDescriptors(keypoints, name);
                var descriptor = dRequest.descriptor;
                distances[name] = descriptor.computeDistances(dRequest, dCandidates);
            }
        }
        return distances;
    };

    var conv = function (id1, id2) {
        var n1 = id1.length;
        var n2 = id2.length;

        if (n1 < n2) {
            return conv(id2, id1);
        }

        var od = new Float32Array(n1 + n2 - 1), no = od.length;

        var j0, j, nj, i, x, nx, sum;

        // Initial zero padding
        for (x = 0, nx = n2 - 1; x < nx; x++) {
            for (sum = 0, j = 0, nj = x + 1, i = x; j < nj; j++, i--) {
                sum += id1[j] * id2[i];
            }
            od[x] = sum;
        }
        // Central part
        for (x = n2 - 1, j0 = 0, nx = n1; x < nx; x++, j0++) {
            for (sum = 0, j = j0, nj = x + 1, i = n2 - 1; j < nj; j++, i--) {
                sum += id1[j] * id2[i];
            }
            od[x] = sum;
        }
        // Final zero padding
        for (x = n1, j0 = n1 - n2 + 1; x < no; x++, j0++) {
            for (sum = 0, j = j0, i = n2 - 1; j < n1; j++, i--) {
                sum += id1[j] * id2[i];
            }
            od[x] = sum;
        }
        return od;
    };

    var getHistogram = function (v, bins, step) {
        var f = Math.round;
        var i, ie = v.length;
        var h = new Float32Array(bins);
        for (i = 0; i < ie; i++) {
            var bin = f(v[i] * step);
            if (bin >= bins) {
                h[bins - 1]++;
            } else {
                h[bin]++;
            }
        }
        var sum = 1 / ie;
        for (i = 0; i < bins; i++) {
            h[i] *= sum;
        }
        return h;
    };

    var sumDistances = function (distances, norm) {

        var length = distances.length,
            sumDistances = new Float32Array(length),
            sum, i, j, d, n;

        for (d in distances) {
            if (distances.hasOwnProperty(d)) {
                var dist = distances[d];
                for (i = 0; i < length; i++) {
                    n = distances[d].length;
                    for (sum = 0, j = 0; j < n; j++) {
                        sum += dist[j][i];
                    }
                    sumDistances[i] += sum;
                }
            }
        }
        if (norm) {
            norm = 1 / norm;
            for (i = 0; i < length; i++) {
                sumDistances[i] *= norm;
            }
        }
        return sumDistances;
    };

    var learnDistances = function (distances, bins, step) {
        var histos = {};
        var j, d, n;
        var sumDist = new Float32Array(distances.length);
        var addDist = function (sumDist, dist) {
            var i, ei;
            for (i = 0, ei = dist.length; i < ei; i++) {
                sumDist[i] += dist[i];
            }
            return sumDist;
        };

        for (d in distances) {
            if (distances.hasOwnProperty(d) && d !== "length") {
                // One distances per sector and per descriptor
                histos[d] = [];
                for (j = 0, n = distances[d].length; j < n; j++) {
                    histos[d][j] = getHistogram(distances[d][j], bins, step);
                    sumDist = addDist(sumDist, distances[d][j]);
                }
                // One distance per descriptor
                // var dist = sumDistances({d: distances[d], length: distances.length}, distances[d].length);
                // histos[d] = [getHistogram(dist, bins, step)];
                // sumDist = addDist(sumDist, dist);
            }
        }

        /*
         var distTmp;
         for (j = 0, n = distances.SIFT.length; j < n; j++) {
         distTmp = [];
         for (d in distances) {
         if (distances.hasOwnProperty(d) && d !== "length") {
         distTmp.push(distances[d][j]);
         }
         }
         var dist = sumDistances({d: distTmp, length: distances.length}, distances.SIFT.length);
         histos[j] = [];
         histos[j][0] = getHistogram(distTmp, bins, step);
         sumDist = addDist(sumDist, distances[d][j]);
         }
         */
        /*
         // One distance per descriptor
         var dist1 = {
         SIFT: distances["SIFT"],
         OPP1: distances["OPP1"],
         OPP2: distances["OPP2"],
         length: distances.length
         };
         var dist = sumDistances(dist1, distances["SIFT"].length);
         histos["SIFT"] = [getHistogram(dist, bins * 3, step)];
         sumDist = addDist(sumDist, dist);
         var dist2 = {
         HUE: distances["HUE"],
         length: distances.length
         };
         dist = sumDistances(dist2, distances["HUE"].length);
         histos["HUE"] = [getHistogram(dist, bins, step)];
         sumDist = addDist(sumDist, dist);
         */
        /*
         // One distance per descriptor
         var dist1 = {
         SIFT: distances["SIFT"],
         length: distances.length
         };
         var dist = sumDistances(dist1, distances["SIFT"].length);
         histos["SIFT"] = [getHistogram(dist, bins, step)];
         sumDist = addDist(sumDist, dist);

         var dist2 = {
         HUE: distances["HUE"],
         length: distances.length
         };
         dist = sumDistances(dist2, distances["HUE"].length);
         histos["HUE"] = [getHistogram(dist, bins, step)];
         sumDist = addDist(sumDist, dist);

         var dist3 = {
         OPP1: distances["OPP1"],
         OPP2: distances["OPP2"],
         length: distances.length
         };
         dist = sumDistances(dist3, distances["OPP1"].length * 2);
         histos["OPP"] = [getHistogram(dist, bins, step)];
         sumDist = addDist(sumDist, dist);
         */
        return {histograms: histos, sum: sumDist};
    };

    var computePdf = function (histos) {
        var pdf;
        var d, i, ie;
        for (d in histos) {
            if (histos.hasOwnProperty(d)) {
                i = 0;
                if (pdf === undefined) {
                    pdf = histos[d][0];
                    i = 1;
                }
                for (ie = histos[d].length; i < ie; i++) {
                    pdf = conv(pdf, histos[d][i]);
                }
            }
        }
        for (i = 1, ie = pdf.length; i < ie; i++) {
            pdf[i] += pdf[i - 1];
        }


        return pdf;
    };

    var NNDT = function (distances) {
        var sumDist = sumDistances(distances);
        var i, ei, iMin = 0, dMin = sumDist[0];
        for (i = 1, ei = sumDist.length; i < ei; i++) {
            if (sumDist[i] < dMin) {
                dMin = sumDist[i];
                iMin = i;
            }
        }
        return [iMin, dMin];
    };

    var NNDR = function (distances) {
        var sumDist = sumDistances(distances);

        var iMin1 = 0, dMin1 = sumDist[0];
        var iMin2, dMin2;
        if (sumDist[1] < dMin1) {
            iMin2 = iMin1;
            dMin2 = dMin1;
            iMin1 = 1;
            dMin1 = sumDist[1];
        } else {
            iMin2 = 1;
            dMin2 = sumDist[1];
        }

        var i, ei;
        for (i = 2, ei = sumDist.length; i < ei; i++) {
            if (sumDist[i] < dMin2) {
                if (sumDist[i] < dMin1) {
                    dMin2 = dMin1;
                    iMin2 = iMin1;
                    iMin1 = i;
                    dMin1 = sumDist[i];
                } else {
                    dMin2 = sumDist[i];
                    iMin2 = i;
                }
            }
        }
        return [iMin1, dMin1 / dMin2];
    };

    var BINS_PROBA = 100, DIST_MAX = 0.15, IDM_BP = BINS_PROBA / DIST_MAX;
    var NNAC = function (distances) {

        var histosSum = learnDistances(distances, BINS_PROBA, IDM_BP);
        var histos = histosSum.histograms, sumDist = histosSum.sum;

        var pdfCum = computePdf(histos);

        var i, ie, iMin = 0, dMin = sumDist[0];
        for (i = 1, ie = sumDist.length; i < ie; i++) {
            if (sumDist[i] < dMin) {
                iMin = i;
                dMin = sumDist[i];
            }
        }
        var bin = Math.round(dMin * IDM_BP);
        dMin = pdfCum[bin] * sumDist.length;
        return [iMin, dMin];
    };

    var AC = function (distances) {
        var histosSum = learnDistances(distances, BINS_PROBA, IDM_BP);
        var histos = histosSum.histograms, sumDist = histosSum.sum;
        var pdfCum = computePdf(histos);
        var i, ie, nfa = [], round = Math.round;
        for (i = 0, ie = sumDist.length; i < ie; i++) {
            var bin = round(sumDist[i] * IDM_BP);
            var dist = pdfCum[bin] * ie;
            if (dist < 1e1) {
                nfa.push([i, dist]);
            }
        }
        return nfa;
    };

    Keypoint.NNDT = NNDT;
    Keypoint.NNAC = NNAC;
    Keypoint.NNDR = NNDR;
    Keypoint.AC = AC;

    /** Compute the distances between the keypoint and a list of candidates
     * then attribute a disimilarity measure to the matches according to
     * a criterion.
     * @param {Array} keypoints
     * @param {String} criterion
     *  Can be either "NN-DT", "NN-DR", "NN-AC or "AC".
     * @param {Array} [names]
     *  An Array of strings containings the names of the descriptors to
     *  compare.
     */
    Keypoint.prototype.match = function (keypoints, criterion, names) {
        // Compute global distances between q query descriptors and a base
        criterion = criterion || this.criterion;
        var distances = this.computeDistances(keypoints, names);

        var m, out = [];
        if (criterion === "NN-DT") {
            m = NNDT(distances);
            out.push(new global.Match(0, this, m[0], keypoints[m[0]], m[1]));
        } else if (criterion === "NN-DR") {
            m = NNDR(distances);
            out.push(new global.Match(0, this, m[0], keypoints[m[0]], m[1]));
        } else if (criterion === "NN-AC") {
            m = NNAC(distances);
            out.push(new global.Match(0, this, m[0], keypoints[m[0]], m[1]));
        } else if (criterion === "AC") {
            var ms = AC(distances);
            var i, ei;
            for (i = 0, ei = ms.length; i < ei; i++) {
                m = ms[i];
                out.push(new Match(0, this, m[0], keypoints[m[0]], m[1]));
            }
        }
        return out;
    };

    global.Keypoint = Keypoint;
})(Matching);
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

var root = typeof window === 'undefined' ? module.exports : window;

///////////////////////////////////////////////////////////////////////////
//                           Scalespace Class                            //
///////////////////////////////////////////////////////////////////////////


(function (global) {

    /** 
     * @class Matching.Scalespace
     * @constructor
     */
    function ScaleSpace(image, nScale, sigmaInit, scaleRatio) {
        if (image instanceof Matrix !== true) {
            throw new Error("ScaleSpace: Image must be provided.");
        }
        this.image = image.im2single();

        if (nScale !== undefined) {
            this.nScale = nScale;
        }
        if (sigmaInit !== undefined) {
            this.sigmaInit = sigmaInit;
        }
        if (scaleRatio !== undefined) {
            this.scaleRatio = scaleRatio;
        }
        this.scale = [];
    }

    ScaleSpace.prototype = {
        nScale: 9,
        sigmaInit: 0.63,
        scaleRatio: 1.26,
        lapThresh: 4e-3,
        harrisThresh: 1e4,
        /** Function to use for exporting the keypoint list 
         * @return {String}
         */
        keypointsToString: function () {
            var i, ei, k = this.keypoints;
            var out = "";
            for (i = 0, ei = k.length; i < ei; i++) {
                out += k[i].toString() + "\n";
            }
            return out;
        },
        /** Function to use for exporting the list of descriptors
         * @return {String}
         */
        descriptorsToString: function (name) {
            var i, ei, k = this.keypoints;
            var out = "";
            for (i = 0, ei = k.length; i < ei; i++) {
                out += k[i].descriptorsData[name].toString();
            }
            return out;
        },
        /** Function to use to get an image of the scalespace at a given
         * scale and with gradient computed. It is useful for display 
         * purpose.
         * @return {String}
         */
        getImage: function (scale, img, norm, gradient) {
            if (img === undefined) {
                img = this.image;
                return norm === true ? img : Matrix.rdivide(img, img.max());
            }
            var scale = this.scale[scale];
            if (img === "blur" || img === "gray") {
                img = scale[img];
            } else if (img === "phase-norm") {
                
            } else {
                img = scale.gradient[img];
            }
            return norm === true ? Matrix.rdivide(img, img.max()) : img;
        },
        /** This function computes the scalespace.
         * @param {Number} nScale
         *  The Number of scale used.
         * @param {Number} sigmaInit
         *  The blur factor of the first scale.
         * @param {Number} scaleRation
         *  The factor to appy to go to the next scale.
         * @return {Object}
         *  An image.
         */
        computeScaleSpace: function (nScale, sigmaInit, scaleRatio) {
            this.nScale = nScale || this.nScale;
            this.sigmaInit = sigmaInit || this.sigmaInit;
            this.scaleRatio = scaleRatio || this.scaleRatio;

            nScale = this.nScale;
            sigmaInit = this.sigmaInit;
            scaleRatio = this.scaleRatio;
            var image = this.image;
            var i;
            for (i = 0; i < nScale; i++) {
                var s = {};
                s.sigma = sigmaInit * Math.pow(scaleRatio, i);
                //s.blur = image.fastBlur(s.sigma);
                s.blur = image.gaussian(s.sigma);
                s.gray = s.blur.rgb2gray();
                s.gradient = s.gray.gradient(1, 1, 1, 1, 1);

                // Laplacian normalization
                var normFactor = Math.pow(s.sigma, 2);
                s.gradient.laplacian.abs().times(normFactor);;
                this.scale[i] = s;
            }
            return this;
        },
        /** Function used to precompute the laplacian pyramid.
         * @chainable
         */
        precomputeMaxLaplacian: function () {
            var s = this.scale;

            s.maxLap = [];
            var sTmp =  [0, 0, 0];
            var view = this.image.getView();
            var dx = view.getStep(1), lx = view.getEnd(1);
            var ly = view.getEnd(0);

            var maxLocal;
            var k, ke, x, nx, y, ny, n, l, le, m, me, i, j;
            for (k = 1, ke = s.length - 1; k < ke; k++) {

                sTmp[0] = s[k - 1].gradient.laplacian.getData();
                sTmp[1] = s[k].gradient.laplacian.getData();
                sTmp[2] = s[k + 1].gradient.laplacian.getData();

                for (x = dx, nx = lx - dx, i = 1; x < nx; x += dx, i++) {
                    for (y = x + 1, ny = x + ly - 1, j = 1; y < ny; y++, j++) {
                        var p = sTmp[1][y];
                        // Recherche si le point (i, j, k) est bien maximum local
                        for (maxLocal = true, n = 0; n < 3; n++) {
                            var scale = sTmp[n];
                            for (l = y - dx, le = y + 2 * dx; l < le; l += dx) {
                                for (m = l - 1, me = l + 2; m < me; m++) {
                                    if (p < scale[m]) {
                                        maxLocal = false;
                                        l = le;
                                        n = 3;
                                        break;
                                    }
                                }
                            }
                        }

                        if (maxLocal) {
                            var key = new global.Keypoint(i, j, s[k].sigma, p);
                            key.nScale = k;
                            s.maxLap.push(key);
                        }
                    }
                }
            }
            return this;
        },
        /** Function used to precompute the Harris pyramid. 
         * @chainable
         */
        precomputeHarris: function () {
            var s = this.scale;
            var w = this.image.size(1);
            var h = this.image.size(0);

            // Calcul des pyramides de gradient
            var k, ke, j;
            for (k = 1, ke = this.nScale - 1; k < ke; k++) {
                var gradient = s[k].gradient;
                gradient.xy = new Matrix([h, w], "single");
                var xyD = gradient.xy.getData();
                var xD = gradient.x.getData();
                var yD = gradient.y.getData();
                for (j = h * w; j--; j) {
                    xyD[j] = xD[j] * yD[j];
                    xD[j] *= xD[j];
                    yD[j] *= yD[j];
                }
                var std = s[k].sigma * 1.4;
                // gradient.xy = gradient.xy.fastBlur(std);
                // gradient.x  = gradient.x.fastBlur(std);
                // gradient.y  = gradient.y.fastBlur(std);
                gradient.xy = gradient.xy.gaussian(std);
                gradient.x  = gradient.x.gaussian(std);
                gradient.y  = gradient.y.gaussian(std);
            }
            return this;
        },
        /** Apply a threshold on the laplacian pyramid.
         * @param {Number} threshold
         * @chainable
         */
        laplacianThreshold: function (threshold) {
            this.lapThresh = threshold || this.lapThresh;
            threshold = this.lapThresh;

            var s = this.scale, h = this.image.size(0);

            var i, ie, siftKeyPoints = [];
            for (i = 0, ie = s.maxLap.length; i < ie; i++) {
                var key = s.maxLap[i];
                var data = s[key.nScale].gradient.laplacian.getData();
                var p = data[key.x * h + key.y];
                if (p > threshold) {
                    siftKeyPoints.push(key);
                }
            }

            this.keypoints = siftKeyPoints;

            return this;
        },
        /** Apply a threshold on the Harris pyramid.
         * @param {Number} threshold
         * @chainable
         */
        harrisThreshold: function (threshold) {
            this.harrisThresh = threshold || this.harrisThresh;
            threshold = this.harrisThresh;

            function harrisCriterion(x, y, xy, s, t) {
                return 4228250625.0 *
                    (x * y - xy * xy - 0.04 * (x + y) * (x + y)) - 0.2 * t / (s * s * s * s);
            }

            var s = this;
            var h = this.image.getSize(0);

            var i, ie, siftKeyPoints = [];
            for (i = 0, ie = s.keypoints.length; i < ie; i++) {
                var key = s.keypoints[i];
                var scale = s.scale[key.nScale];
                var x  = scale.gradient.x.getData()[key.x * h + key.y];
                var y  = scale.gradient.y.getData()[key.x * h + key.y];
                var xy = scale.gradient.xy.getData()[key.x * h + key.y];

                if (harrisCriterion(x, y, xy, scale.sigma, threshold) > 0) {
                    siftKeyPoints.push(key);
                }
            }

            this.keypoints = siftKeyPoints;

            return this;
        },
        getViewOnImagePatch: function (key, space, type, normalize) {
            var sigma = key.sigma;
            // Looking for closer blured image
            var i, ei, sMin = 0, abs = Math.abs, d, dMin = Infinity;
            for (i = 0, ei = this.nScale; i < ei; i++) {
                d = this.scale[i].sigma - sigma;
                if (abs(d) < dMin && d <= 0) {
                    dMin = abs(d);
                    sMin = i;
                }
            }
            var scale = this.scale[sMin], 
                image = scale["gray"],
                grad = scale.gradient,
                channel = [];

            // Get RGB patch
            var x = key.x, y = key.y, s = Math.round(key.factorSize * sigma);
            var round = Math.round;
            var xMin = round(x - s), xMax = round(x + s);
            var yMin = round(y - s), yMax = round(y + s);

            if (xMin < 0 || yMin < 0) {
                return null;
            } else if (xMax > image.getSize(1) - 1) {
                return null;
            } else if (yMax > image.getSize(0) - 1) {
                return null;
            }
            var view = image.getView().select([yMin, yMax], [xMin, xMax]);

            if (space instanceof Object) {
                var name = space.name;
                if (scale[name] === undefined) {
                    scale[name] = {
                        image: Matrix.applycform(
                            scale["blur"], "RGB to " + name
                        )
                    };
                }
                image = scale[name].image;
                if (type === "GRADIENT") {
                    if (scale[name].gradient === undefined) {
                        scale[name].gradient = image.gradient(0, 0, 1, 1);
                        scale[name].gradientView = scale[name].gradient.norm.getView();
                    }
                    grad = scale[name].gradient;
                    view = scale[name].gradientView.restore().select(
                        [yMin, yMax], [xMin, xMax], space.channels
                    );
                } else if (type === "WEIGHTED-HISTOGRAMS") {
                    if (scale[name].colorChannels === undefined) {
                        scale[name].colorChannels = {
                            norm: image.get([], [], space.weightChannel),
                            phase: image.get([], [], space.phaseChannel)
                        };
                        scale[name].colorChannelsView = scale[name].colorChannels.norm.getView();
                    }
                    grad = scale[name].colorChannels;
                    view = scale[name].colorChannelsView.restore().select(
                        [yMin, yMax], [xMin, xMax], 0
                    );
                } else {
                    view = image.getView().select(
                        [yMin, yMax], [xMin, xMax], space.channels
                    );
                }
            }
            if (normalize === true) {
                // patch = this.normalizeColor(patch);
            }

            return {
                norm: grad.norm,
                phase: grad.phase,
                image: image,
                view: view,
            };
        },
        /** Extract the main direction(s) of all keypoint detected in 
         * the scalespace.
         * @param {String} algorithm
         *  Algorithm to use.
         * @chainable
         */
        extractMainOrientations: function (algorithm) {
            this.algorithm = algorithm || this.algorithm;
            if (!this.keypoints) {
                throw new Error("ScaleSpace: Keypoints have to be computed.");
            }
            var keypoints = this.keypoints;
            var i, ei, newKeypoints = [], o, eo;
            for (i = 0, ei = keypoints.length; i < ei; i++) {
                var key = keypoints[i];
                var patch = this.getViewOnImagePatch(key, "gray");
                if (patch !== null) {
                    var orientations = key.extractMainOrientation(patch, this.algorithm);
                    for (o = 0, eo = orientations.length; o < eo; o++) {
                        var k = key.getCopy();
                        k.orientation = orientations[o];
                        newKeypoints.push(k);
                    }
                }
            }
            this.keypoints = newKeypoints;
            return this;
        },
        extractDescriptors: function (descriptors) {
            descriptors = descriptors || global.Keypoint.prototype.descriptors;

            // Descriptors memory allocation for n keypoints
            var getData = function (d, n) {
                var length =  d.nBin * d.nSector;
                var data = new Float32Array(n * length);
                var i, tab = [];
                for (i = 0; i < n; i++) {
                    tab.push(data.subarray(i * length, (i + 1) * length));
                }
                tab.data = data;
                return tab;
            };

            if (!this.keypoints) {
                throw new Error("ScaleSpace: Keypoints have to be computed.");
            }
            var keypoints = this.keypoints;
            var i, k, ek, descriptorsData = {}, name;

            for (i = 0; i < descriptors.length; i++) {
                name = descriptors[i].name;
                descriptorsData[name] = getData(descriptors[i], keypoints.length);
            }

            this.descriptorsData = descriptorsData;
            for (k = 0, ek = keypoints.length; k < ek; k++) {
                keypoints[k].descriptorsData = keypoints[k].descriptorsData || {};
            }
            for (i = 0; i < descriptors.length; i++) {
                var desc = descriptors[i],
                    name = desc.name,
                    mem = descriptorsData[name],
                    space = desc.colorspace,
                    type = desc.type;
                for (k = 0, ek = keypoints.length; k < ek; k++) {
                    var key = keypoints[k],
                        patch = this.getViewOnImagePatch(key, space, type);
                    key.descriptorsData[name] =
                        desc.extractFromPatch(
                            key.orientation, patch, mem[k]
                        );
                }
            }
            
            return this;
        }
    };
    global.ScaleSpace = ScaleSpace;
})(Matching);
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

var root = typeof window === 'undefined' ? module.exports : window;

//////////////////////////////////////////////////////////////////
//                          Sift class                          //
//////////////////////////////////////////////////////////////////


(function (global) {

    /** This class provides function to find matches between images using
     * The a SIFT-like algorithm.
     * @class Matching.Sift
     * @constructor
     * @param {Array} images
     *  Array containing the images to compare.
     */
    function Sift(images) {
        this.scaleSpaces = [];
        this.matchs = [];
        this.matchsList = [];
        var i;
        for (i = 0; i < images.length; i++) {
            this.scaleSpaces[i] = new global.ScaleSpace(images[i]);
        }
    }


    Sift.prototype = {
        /** Threshold used for matches validation */
        threshold: 0.7,
        /** Compute the differents scale spaces.
         * @param {Number} nScale
         *  Number of scales.
         * @param {Number} sigmaInit
         *  Assumed bur of the image.
         * @param {Number} scaleRatio
         *  Factor applied to previous blur value to get the one for the next scale.
         * @chainable
         */
        computeScaleSpace: function (nScale, sigmaInit, scaleRatio) {
            var i, ie;
            Tools.tic();
            for (i = 0, ie = this.scaleSpaces.length; i < ie; i++) {
                var S = this.scaleSpaces[i];

                S.computeScaleSpace(nScale, sigmaInit, scaleRatio);
                S.precomputeMaxLaplacian();
                S.precomputeHarris();
            }
            console.log("Compute Scale Space: ", Tools.toc(), "ms");
            return this;
        },
        /** Select keypoints based on harris cornerness and on laplacian.
         * @param {Number} [lapThresh]
         *  Threshold on laplacian values detector
         * @param {Number} [harrisThresh]
         *  Threshold on Harris corner detector
         * @chainable
         */
        applyScaleSpaceThreshold: function (lapThresh, harrisThresh) {
            var i, ie;
            Tools.tic();
            for (i = 0, ie = this.scaleSpaces.length; i < ie; i++) {
                var S = this.scaleSpaces[i];
                S.laplacianThreshold(lapThresh);
                S.harrisThreshold(harrisThresh);
            }
            console.log("Compute Thresholds: ", Tools.toc(), "ms");
            for (i = 0; i < ie; i++) {
                var S = this.scaleSpaces[i];
                console.log("\t", "Scalespace[" + i + "]:",
                            S.keypoints.length, "keypoints");
            }
            return this;
        },
        /** Compute the main orientation of the keypoints.
         * @param {String} [algorithm]
         *  algorithm used to compute the main orientation can be either
         *  `"max"` or `"ac"`. `"ac"` allows for multi-orientation detection.
         * @chainable
         */
        computeMainOrientations: function (algorithm) {
            algorithm = algorithm || global.Keypoint.prototype.algorithm;
            var i, ie;
            Tools.tic();
            for (i = 0, ie = this.scaleSpaces.length; i < ie; i++) {
                var S = this.scaleSpaces[i];
                S.extractMainOrientations(algorithm);
            }
            console.log("Compute Main orientations: ", Tools.toc(), "ms");
            for (i = 0; i < ie; i++) {
                var S = this.scaleSpaces[i];
                console.log("\t", "Scalespace[" + i + "]:",
                            S.keypoints.length, "keypoints");
            }
            return this;
        },
        /** Compute the descriptors for each keypoints.
         * @param {Array} [descriptors]
         * An Array of `Descriptors` objects.
         * @chainable
         */
        computeDescriptors: function (descriptors) {
            var i, ie;
            Tools.tic();
            for (i = 0, ie = this.scaleSpaces.length; i < ie; i++) {
                this.scaleSpaces[i].extractDescriptors(descriptors);
            }
            console.log("Compute Descriptors: ", Tools.toc(), "ms");
            return this;
        },
        /** Compute the matches between two images. The keypoints as well as
         * the descriptors have to be extracted.
         * @param {Number} S1
         *  The first image.
         * @param {Number} S2
         *  The Second image.
         * @param {Number} [crit]
         *  The criterion used for comparing keypoints.
         * @param {Array} [names]
         *  The names of the descritors to be used for comparing keypoints.
         *  @chainable
         */
        computeMatchs: function (S1, S2, crit, names) {
            Tools.tic();

            var keypoints1 = this.scaleSpaces[S1].keypoints;
            var keypoints2 = this.scaleSpaces[S2].keypoints;
            var k, ek, l, el;

            var tmps = [];
            for (k = 0, ek = keypoints1.length; k < ek; k++) {
                var tmp = keypoints1[k].match(keypoints2, crit, names);
                for (l = 0, el = tmp.length; l < el; l++) {
                    tmp[l].k1.number = k;
                }
                tmps.push(tmp);
            }
            var matchs = Array.prototype.concat.apply([], tmps);

            this.matchs = this.matchs || [];
            this.matchs[S1] = this.matchs[S1] || [];
            this.matchs[S1][S2] = matchs.sort(global.Match.compar);
            console.log("Matching time : ", Tools.toc(), "ms");
            return this;
        },
        /** Select good matches based on their similarity measures.
         * @param {Number} S1
         *  The first image.
         * @param {Number} S2
         *  The Second image.
         * @param {Number} [threshold]
         *  The threshold for matches selection.
         * @param {Array} [crit]
         *  The criterion used for comparing keypoints.
         *  @chainable
         */
        thresholdMatchs: function (S1, S2, threshold, c) {
            threshold = threshold || this.threshold;

            Tools.tic();
            var matchsList = [],
                keypoints1 = this.scaleSpaces[S1].keypoints,
                keypoints2 = this.scaleSpaces[S2].keypoints,
                criterion = global.Keypoint.prototype.criterion;

            if (criterion === "NN-AC" || criterion === "AC") {
                threshold /= keypoints1.length * keypoints2.length;
            }

            var k, ek, matchs = this.matchs[S1][S2];
            if (c) {
                matchs = matchs[c];
            }
            for (k = 0, ek = matchs.length; k < ek; k++) {
                if (matchs[k].distance < threshold) {
                    matchsList.push(matchs[k]);
                }
            }

            this.matchsList[S1] = this.matchsList[S1] || [];
            this.matchsList[S1][S2] = matchsList;
            console.log("\t", "matchsList[" + S1 + "][" + S2 + "]:",
                        matchsList.length, "matchs.");
            console.log("Threshold matchs time : ", Tools.toc(), "ms");

            return this;
        },
        /** Apply succesively the following functions with default parameters :
         *
         * + {@link Matching.Sift#computeScaleSpace},
         * + {@link Matching.Sift#applyScaleSpaceThreshold},
         * + {@link Matching.Sift#computeMainOrientations},
         * + {@link Matching.Sift#computeDescriptors},
         * + {@link Matching.Sift#computeMatchs},
         * + {@link Matching.Sift#thresholdMatchs}.
         *
         * @param {Number} S1
         *  The first image.
         * @param {Number} S2
         *  The Second image.
         *  @chainable
         */
        match: function (S1, S2) {
            Tools.tic();
            this.computeScaleSpace()
                .applyScaleSpaceThreshold()
                .computeMainOrientations()
                .computeDescriptors()
                .computeMatchs(S1, S2)
                .thresholdMatchs(S1, S2);
            console.log("Global match time : ", Tools.toc(), "ms");
            return this;
        },
        /** Export matches list between two scalescapes to string.
         * @param {Number} S1
         * @param {Number} S2
         * @param {Number} [criterion]
         * @return {String}
         */
        matchsToString: function (S1, S2, c) {
            var matchs = this.matchs[S1][S2];
            matchs = (c !== undefined) ? matchs[c] : matchs;

            var k, ek, str = "";
            for (k = 0, ek = matchs.length; k < ek; k++) {
                str += matchs[k].toString() + "\n";
            }
            return str;
        }
    };

    global.Sift = Sift;

})(Matching);
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

var root = typeof window === 'undefined' ? module.exports : window;

//////////////////////////////////////////////////////////////////
//                        Benchmark Code                        //
//////////////////////////////////////////////////////////////////


(function (global) {

    var phaseNormImage = function (phase, norm, mask, o) {
        norm = norm.rdivide(norm.max());
        var pData = phase.getData(), nData = norm.getData();
        var imSize = pData.length;
        var outData = new pData.constructor(imSize * 4);
        var H = outData.subarray(0, imSize);
        var S = outData.subarray(imSize, imSize * 2);
        var V = outData.subarray(imSize * 2, imSize * 3);
        var A = outData.subarray(imSize * 3, imSize * 4);
        if (o) {
            var Ht = Matrix.toMatrix(pData);
            Ht = Ht["-"](o);
            var HI0 = Ht["<"](0);
            Ht.set(HI0, Ht.get(HI0)["+"](1));
            H.set(Ht.getData());
        } else {
            H.set(pData);
        }
        V.set(nData);

        var xSize = norm.getSize(1), ySize = norm.getSize(0);
        var wSize = xSize / 2;

        var i, j, _j, ij, j2;
        for (j = 0, _j = 0; j < xSize; j++, _j += ySize) {
            for (i = 0, ij = _j, j2 = (j - wSize) * (j - wSize); i < ySize; i++, ij++) {
                S[ij] = 1;
                A[ij] = 1;
            }
        }

        var size = phase.getSize();
        size.push(4);
        var out = new Matrix(size, outData);
        return out.applycform("HSV to RGB");
    };

    var NNDT = global.Keypoint.NNDT,
        NNDR = global.Keypoint.NNDR,
        NNAC = global.Keypoint.NNAC,
        AC = global.Keypoint.AC;

    var Match = global.Match;

    global.getSkewMatrix = function (mat, skew) {
        var $ = Matrix.toMatrix, cos = Math.cos, sin = Math.sin;
        var rot = function (a) {
            return $([cos(a), sin(a), 0, -sin(a), cos(a), 0, 0, 0, 1]).reshape([3, 3]);
        };
        var zoom = function (x, y) {
            y = y || x;
            return $([x, 0, 0, 0, y, 0, 0, 0, 1]).reshape([3, 3]);
        };
        var translate = function (x, y) {
            y = y || x;
            return $([1, 0, 0, 0, 1, 0, x, y, 1]).reshape([3, 3]);
        };
        var x = mat.getSize(1), y = mat.getSize(0);
        var a = Math.atan2(x, y);
        var T = translate(x / 2, y / 2), iT = T.inv();
        var R = rot(-a), iR = R.inv();
        var S = zoom(skew, 1);
        return T.mtimes(R).mtimes(S).mtimes(iR).mtimes(iT);
    };

    global.Keypoint.prototype.project = function (mat) {
        var $ = Matrix.toMatrix;
        var PI = Math.PI, cos = Math.cos, sin = Math.sin, atan2 = Math.atan2;
        var pow = Math.pow, sqrt = Math.sqrt;
        var fs = this.factorSize, s = this.sigma, x = this.x, y = this.y, o = this.orientation;
        var nk = mat.mtimes($([x, y, 1])).getData();
        nk = new global.Keypoint(nk[0], nk[1]);

        var no = (o > 0.5 ? o - 1 : o) * 2 * PI;
        var c = [x + cos(no) * fs * s, y - sin(no) * fs * s, 1];
        var co = mat.mtimes($(c)).getData();

        // Orientation of projected keypoint
        no = atan2(nk.y - co[1], co[0] - nk.x) / (2 * PI);
        no = (no < 0) ? no + 1 : no;
        nk.orientation = no;

        // Scale of projected keypoint
        nk.sigma = sqrt(pow(nk.x - co[0], 2) + pow(nk.y - co[1], 2)) / fs;
        nk.factorSize = fs;
        return nk;
    };

    global.Keypoint.prototype.matchBenchmark = function (keypoints, criterions, combinations) {

        var getDistancesForCombination = function (distances, combinations) {
            var distOut = {
                'length': distances.length
            };
            for (var c = 0; c < combinations.length; c++) {
                var name = combinations[c];
                if (distances.hasOwnProperty(name)) {
                    distOut[name] = distances[name];
                }
            }
            return distOut;
        };

        var distances = this.computeDistances(keypoints);

        var c, m, out = {};
        for (c in criterions) {
            if (c === "NN-DT") {
                m = NNDT(distances);
            } else if (c === "NN-DR") {
                m = NNDR(distances);
            } else if (c === "NN-AC") {
                m = NNAC(distances);
            }
            out[c] = [new Match(0, this, m[0], keypoints[m[0]], m[1])];
        }

        for (c in combinations) {
            var distTmp;
            if (combinations.hasOwnProperty(c)) {
                distTmp = getDistancesForCombination(distances, combinations[c]);
                m = NNDR(distTmp);
                out[c] = [new Match(0, this, m[0], keypoints[m[0]], m[1])];
            }
        }

        return out;
    };

    global.ScaleSpace.prototype.projectKeypoints = function (mat) {
        var keypoints = this.keypoints;
        var im = this.image;
        mat = Matrix.toMatrix(mat);
        var w = im.getSize(1) - 1, h = im.getSize(0) - 1;
        var i, ei, keypointsOut = [];
        for (i = 0, ei = keypoints.length; i < ei; i++) {
            var nk = keypoints[i].project(mat);
            var xm = nk.x - nk.sigma * nk.factorSize;
            var xM = nk.x + nk.sigma * nk.factorSize;
            var ym = nk.y - nk.sigma * nk.factorSize;
            var yM = nk.y + nk.sigma * nk.factorSize;
            if (xm < 0 || ym < 0 || xM > w || yM > h) {
                continue;
            }
            keypointsOut.push(nk);
        }
        return keypointsOut;
    };

    global.Sift.prototype.computeMatchsBenchmark = function (S1, S2, criterions, combinations) {
        Tools.tic();
        var keypoints1 = this.scaleSpaces[S1].keypoints;
        var keypoints2 = this.scaleSpaces[S2].keypoints;

        var k, ek, l, el, c, matchs = {};
        for (c in criterions) {
            matchs[c] = [];
        }
        for (c in combinations) {
            matchs[c] = [];
        }
        for (k = 0, ek = keypoints1.length; k < ek; k++) {
            var m = keypoints1[k].matchBenchmark(keypoints2, criterions, combinations);
            for (c in matchs) {
                var tmp = m[c];
                for (l = 0, el = tmp.length; l < el; l++) {
                    tmp[l].k1.number = k;
                }
                matchs[c].push(tmp);
            }
        }

        for (c in matchs) {
            matchs[c] = Array.prototype.concat.apply([], matchs[c]);
            matchs[c].sort(Match.compar);
        }

        this.matchs = this.matchs || [];
        this.matchs[S1] = this.matchs[S1] || [];
        this.matchs[S1][S2] = matchs;
        console.log("Matching time : ", Tools.toc(), "ms");
        return this;
    };

    global.Sift.prototype.matchsValidation = function (mat, n1, n2, c) {
        var matchs = this.matchs[n1 || 0][n2 || 1];
        if (c) {
            matchs = matchs[c];
        }

        var isValid = function (kr, kc, mat) {
            var dist = function (k1, k2) {
                var x = k1.x - k2.x, y = k1.y - k2.y;
                return Math.sqrt(x * x + y * y);
            };
            var kp = kr.project(mat);
            var dmin = Math.min(kp.sigma, kc.sigma) * kr.factorSize;
            return (dist(kp, kc) < dmin) ? true : false;
        };
        var i, ei;
        for (i = 0, ei = matchs.length; i < ei; i++) {
            var m = matchs[i];
            m.isValid = isValid(m.k1, m.k2, mat);
        }
    };

    global.createCurves = function (matchs) {
        var n = matchs.length;
        var i, ei;
        var t = new Array(n), f = new Array(n), th = new Array(n);
        for (i = 0, ei = matchs.length; i < ei; i++) {
            var m = matchs[i];
            th[i] = m.distance;
            if (m.isValid) {
                t[i] = 1;
                f[i] = 0;
            } else {
                t[i] = 0;
                f[i] = 1;
            }
        }
        return {
            "true": t,
            "false": f,
            "threshold": th
        };
    };

    /** This function automatically evaluate the quality of matching.
     * Since the transformation is given between the two images, it is possible
     * to separate the good and false matches. The function returns an object with
     * ROC curves computed.
     *
     * @param {Array | Object} images
     *  can be either one (Object) or two images (Array).
     * @param {Object} mat
     *  a `3x3` Matrix describe the transformation between the two images.
     *  If only one image is provided then she second is computed from
     *  the first with the help of the transformation matrix.
     * @param {Function} function
     *  Function applied to the second image to add noise, some color change, ...
     *  As exemple a function to do nothing:
     *
     *      function () {return this;}
     * @param {Boolean} project
     *  If true the keypoint are detected in the first image and then projected in
     *  the second one. Otherwise they are redetected.
     * @param {Object} criterions
     *  An Object like the next one, specifying wich decision criterion must be tested.
     *
     *      var criterions = {
     *        'NN-DT': true,
     *        'NN-DR': true,
     *        'NN-AC': true,
     *        'AC': false
     *      };
     *
     * @param {Object}
     *  An object specifying the different combination to evaluate:
     *
     *      var combinations = {
     *        "BW": ["SIFT"],
     *        "COLOR": ["SIFT", "HUE-NORM"]
     *      };
     *
     * @return {Object}
     *  The Sift object computed. This object as a field  'curves' given
     *  acces to the roc curves computed.
     */
    global.benchmark = function (image, mat, fun, project, criterions, combinations) {
        criterions = criterions || {};
        combinations = combinations || {};
        var im1, im2;
        if (Tools.isArrayLike(image)) {
            im1 = image[0];
            im2 = image[1];
        } else if (mat) {
            im1 = image;
            im2 = fun.apply(image.imtransform(mat));
        } else {
            throw new Error("Sift.benchmark: usage error");
        }

        Tools.tic();
        var S = new global.Sift([im1, im2]);
        S.computeScaleSpace();

        if (project) {
            S.scaleSpaces[0]
                .laplacianThreshold()
                .harrisThreshold();
            S.scaleSpaces[0].extractMainOrientations();
            console.log("\t", "Scalespace:",
                        S.scaleSpaces[0].keypoints.length, "keypoints.");
            S.scaleSpaces[1].keypoints = S.scaleSpaces[0].projectKeypoints(mat);
        } else {
            S.applyScaleSpaceThreshold()
                .computeMainOrientations();
        }
        S.computeDescriptors()
            .computeMatchsBenchmark(0, 1, criterions, combinations);
        S.curves = {};
        if (mat) {
            var c;
            for (c in S.matchs[0][1]) {
                S.matchsValidation(mat, 0, 1, c);
                S.curves[c] = global.createCurves(S.matchs[0][1][c]);
            }
        }
        console.log("Benchmark time:", Tools.toc(), "ms");

        return S;
    };

    global.ScaleSpace.prototype.getDescriptorPatch = function (n, name, part, sz) {
        var k = this.keypoints[n];
        var patchRGB = this.getViewOnImagePatch(
            k, {"name": "RGB", "channels": []}
        );
        patchRGB = patchRGB.image.extractViewFrom(patchRGB.view)

        var mask = patchRGB.mask;
        var descriptor, patch;

        if (name !== "RGB" && name !== "RGBNorm") {
            descriptor = k.descriptorsData[name].descriptor;
            patch = this.getViewOnImagePatch(
                k,
                descriptor.colorspace,
                descriptor.type,
                descriptor.normalize
            );
            patch.phase = patch.phase.extractViewFrom(patch.view)
            patch.norm = patch.norm.extractViewFrom(patch.view)
        }

        var rings, sectors;
        if (part === "norm") {
            patch = patch[part];
            patch = patch.rdivide(patch.max());
        } else if (name === "RGB" || name === "RGBNorm") {
            patch = patchRGB;
            patch = patch.cat(2, Matrix.ones(patch.size(0), patch.size(1)));
        } else if (name !== undefined) {
            rings = descriptor.rings;
            sectors = descriptor.sectors;
            if (descriptor.relativeOrientation) {
                patch = phaseNormImage(patch.phase, patch.norm, true, k.orientation);
            } else {
                patch = phaseNormImage(patch.phase, patch.norm, true);
            }
        }

        var canvas = document.createElement("canvas");
        sz = sz || 201;
        patch.imshow(canvas, sz / patch.size(0));
        k = k.getCopy();
        k.x = sz / 2;
        k.y = sz / 2;
        k.sigma = sz / 2;
        k.factorSize = 1;
        if (0 && k.histogram.modes) {
            var i, ei = k.histogram.modes.length;
            var o = k.orientation;
            for (i = 0; i < ei; i++) {
                k.orientation = k.histogram.modes[i].phase;
                canvas.drawDescriptor(k, sectors, rings, 4);
            }
            k.orientation = o;
        } else {
            canvas.drawDescriptor(k, sectors, rings, 4);
        }
        return Matrix.imread(canvas).im2single();
    };

    global.Sift.prototype.createView = function (cell, h, w) {
        cell.innerHTML = "";

        var f = Math.floor;
        var S = this;
        w = w || cell.clientWidth - 50;
        h = h || cell.clientHeight;
        cell.style.setProperty("width", w);
        cell.style.setProperty("height", h);
        var l = document.createElement("div");
        var r = document.createElement("div");
        l.style.setProperty("display", "inline-block");
        l.style.setProperty("width", f(w / 2) + "px");
        l.style.setProperty("height", h + "px");
        r.style.setProperty("display", "inline-block");
        r.style.setProperty("width", f(w / 2) + "px");
        r.style.setProperty("height", h + "px");
        r.style.setProperty("vertical-align", "top");
        cell.appendChild(l);
        cell.appendChild(r);

        var pDesc, plotCurves;

        var createCurves = function (curves) {
            removeHistograms();
            var plotCurves = new Plot("plotCurves", [f(w / 2), f(h / 2)], r);
            plotCurves.setLegend("auto");
            plotCurves.setOwnProperty("legend-display", "auto");
            var colors = [
                "red", "lime", "blue", "yellow",
                "fuchsia", "aqua", "olive", "purple",
                "teal", "maroon", "green", "navy",
                "black", "gray", "sylver"
            ];
            var col = 0;
            for (var c in curves) {
                var params = {
                    id: c,
                    stroke: colors[col++]
                };
                var f = Matrix.toMatrix(curves[c].false).cumsum().getData();
                var t = Matrix.toMatrix(curves[c].true).cumsum().getData();
                plotCurves.addPath(f, t, params);
            }
            return plotCurves;
        };
        var removeCurves = function () {
            if (plotCurves) {
                plotCurves.getDrawing().parentNode.removeChild(plotCurves.getDrawing());
            }
        };

        var createHistograms = function () {
            removeCurves();
            var i, pDesc = [];
            for (i = 0; i < 9; i++) {
                pDesc.push(new Plot("pDesc" + i, [f(w / 6), f(h / 6)], r));
                pDesc[i].setOwnProperty('ticks-display', false);
            }
            return pDesc;
        };
        var removeHistograms = function () {
            if (pDesc) {
                for (var i = 0, ei = pDesc.length; i < ei; i++) {
                    pDesc[i].getDrawing().parentNode.removeChild(pDesc[i].getDrawing());
                }
            }
        };

        var visual = "histograms";
        var p, p1, p2, p3, p4;

        p = new Plot("p", [f(w / 2), h], l);
        p1 = new Plot("p1", [f(w / 2), f(h / 4)], r);
        p2 = new Plot("p2", [f(w / 2),  f(h / 4)], r);
        pDesc = createHistograms();

        p.setOwnProperty('ticks-display', false);
        p.setOwnProperty('preserve-ratio', true);
        p1.setOwnProperty('ticks-display', false);
        p1.setOwnProperty('preserve-ratio', true);
        p2.setOwnProperty('ticks-display', false);
        p2.setOwnProperty('preserve-ratio', true);

        var getPatch = function  (s, n, name, part) {
            return this.scaleSpaces[s].getDescriptorPatch(n, name, part);
        }.bind(this);

        var display = function (p, patch) {
            p.clear();
            patch.toImage(function () {
                p.remove("patch");
                p.addImage(this, 0, 0, {id: "patch"});
                p.setAxis();
            });
        };
        var descriptors = global.Keypoint.prototype.descriptors;

        var old, patch1, patch2, selected = [];

        var view = {
            descriptor: descriptors[0].name,
            align: 'v',
            thresholdMatchs: function (s, c) {
                this.thresholdMatchs(0, 1, s, c);
                p.showMatchs(this.scaleSpaces[0].image,
                             this.scaleSpaces[1].image,
                             this.matchsList[0][1], view.align);
            }.bind(this),
            plots: [p, p1, p2, p3, p4],
            currentPatches: [patch1, patch2],
            getPatch: getPatch,
            sift: this,
            selected: selected,
            computeMatchs: function (names, s) {
                var i, n = {};
                for (i = 0; i < names.length; i++) {
                    n[names[i]] = {};
                }
                this.computeMatchs(0, 1, undefined, n);
                if (s) {
                    view.thresholdMatchs(s);
                }
            }.bind(this),
            visual: function (v) {
                console.log(v === "curves", this.curves);
                if (v === "histograms") {
                    pDesc = createHistograms();
                } else if (v === "curves" && this.curves) {
                    plotCurves = createCurves(this.curves);
                }
            }
        };
        p.click = function (coord) {
            var c = this.getClosestPoint(coord.x, coord.y, false);
            if (old) {
                old.data.setAttribute("stroke", 'red');
            }
            if (!c) {
                return;
            }
            old = c;
            old.data.setAttribute("stroke", 'lime');
            p1.clear();
            p2.clear();
            var n = parseInt(c.data.id, 10);
            var m = S.matchsList[0][1][n];
            selected.push(m);
            var tmp1, tmp2;
            patch1 = getPatch(0, m.k1.number, "RGB");
            patch2 = getPatch(1, m.k2.number, "RGB");

            tmp1 = getPatch(0, m.k1.number, "RGBNorm");
            tmp2 = getPatch(1, m.k2.number, "RGBNorm");
            patch1 = patch1 ? patch1.cat(1, tmp1) : tmp1;
            patch2 = patch2 ? patch2.cat(1, tmp2) : tmp2;

            var i;
            for (i = 0; i < descriptors.length; i++) {
                tmp1 = getPatch(0, m.k1.number, descriptors[i].name);
                tmp2 = getPatch(1, m.k2.number, descriptors[i].name);
                patch1 = patch1 ? patch1.cat(1, tmp1) : tmp1;
                patch2 = patch2 ? patch2.cat(1, tmp2) : tmp2;
            }

            view.patch1 = patch1;
            view.patch2 = patch2;
            display(p1, patch1);
            display(p2, patch2);
            var k1 = S.scaleSpaces[0].keypoints[m.k1.number];

            // Descriptor
            var h = k1.descriptorsData[view.descriptor].histograms;
            var max = Matrix.toMatrix(k1.descriptorsData[view.descriptor].data).max().getDataScalar();
            var scale = Matrix.colon(0, h[0].length - 1);
            if (pDesc) {
                for (i = 0; i < h.length; i++) {
                    pDesc[i].clear();
                    pDesc[i].addHistogram(scale.getData(), h[i], {colormap: true, "fill-opacity": 0.5});
                    pDesc[i].setAxis([-0.5, 0, h[i].length - 0.5, max]);
                }
            }

            this.setCursor(c.x, c.y);
        };

        return view;
    };

    if (typeof HTMLCanvasElement !== 'undefined') {
        HTMLCanvasElement.prototype.drawDescriptor = function (k, sectors, rings, lw) {

            var ctx = this.getContext("2d"), PI = Math.PI;

            // Dessin d'un secteur
            var drawSector = function (aStart, aEnd, rStart, rEnd, color) {
                this.beginPath();
                this.arc(0, 0, rStart, aStart, aEnd, false);
                this.arc(0, 0, rEnd, aEnd, aStart, true);
                this.strokeStyle = color;
                this.stroke();
            }.bind(ctx);


            var x = k.x, y = k.y, o = k.orientation, r = k.sigma * k.factorSize;
            o = (o > 0.5 ? o - 1 : o) * 2 * PI;

            // Epaisseur de ligne
            ctx.lineWidth = lw || Math.min(Math.max(r / 36, 1), 5);
            var fillColor = "hsl(220, 100%, 70%)";

            ctx.save();

            // Translation et rotation
            ctx.translate(x, y);
            ctx.rotate(o);

            var shift = r - ctx.lineWidth * 0.5;
            var i, j;
            if (rings && sectors) {
                for (i = 0 ; i < rings.length; i++) {
                    if (sectors[i] === 1) {
                        ctx.beginPath();
                        ctx.strokeStyle = fillColor;
                        ctx.arc(0, 0, rings[i] * shift, 0, Math.PI * 2, true);
                        ctx.stroke();
                    } else {
                        var step = 2 * PI / sectors[i];
                        for (j = 0 ; j < sectors[i]; j++) {
                            drawSector((j - 0.5) * step, (j + 0.5) * step,
                                       (i - 1 < 0 ? 0 : rings[i - 1]) * shift,
                                       rings[i] * shift,
                                       fillColor);
                        }
                    }
                }
            } else {
                ctx.beginPath();
                ctx.strokeStyle = fillColor;
                ctx.arc(0, 0, shift, 0, PI * 2, true);
                ctx.stroke();
            }
            // Croix centrale
            ctx.beginPath();
            ctx.arc(0, 0, 0.02 * r, 0, PI * 2, true);
            ctx.fillStyle = "rgba(255,255,255)";

            // Direction principale
            // Epaisseur de ligne
            ctx.lineWidth *= 1.5;
            // Couleur de la direction principale
            ctx.strokeStyle = "rgb(255,255,255)";
            ctx.moveTo(0, 0);
            ctx.lineTo(r - ctx.lineWidth * 0.5, 0);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        };
    }
    var distancesToIndices = function (distances) {
        var getIndices = function (n) {
            var i, t = new Float32Array(n);
            for (i = 0; i < n; i++) {
                t[i] = i;
            }
            return t;
        };
        var getSortedIndices = function (t) {
            var ind = getIndices(t.length);
            var f = function (a, b) {
                return t[a] - t[b];
            };
            Array.prototype.sort.call(ind, f);
            return ind;
        };

        var d, distOut = {};
        for (d in distances) {
            if (distances.hasOwnProperty(d) && d !== "length") {
                var j, n;
                distOut[d] = [];
                for (j = 0, n = distances[d].length; j < n; j++) {
                    distOut[d][j] = getSortedIndices(distances[d][j]);
                }
            }
        }
        distOut.length = distances.length;
        return distOut;
    };

})(Matching);
