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
        nBin: 12,
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

        /** Extract the histograms from a main orientation `o` and an RGB
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

            var dPhase = patch.phase.getData(), dNorm = patch.norm.getData();
            var size = patch.norm.getSize(0);
            var wSize = Math.floor(size / 2), wSize2 = wSize * wSize;

            // var exp = Math.exp, c = -2 / wSize2;
            var oR = this.relativeOrientation === true ? o : 0;

            var i, j, _j, ij;
            var x, y, x2, r2;

            for (j = 0, _j = 0, x = -wSize; j < size; j++, _j += size, x++) {
                for (i = 0, ij = _j, x2 = x * x, y = wSize; i < size; i++, ij++, y--) {

                    r2 = x2 + y * y;

                    if (r2 > wSize2) {
                        dNorm[ij] = 0;
                        dPhase[ij] = 0;
                        continue;
                    }

                    var bin = indexCircularPhase(dPhase[ij] - oR, this.nBin);
                    var his = this.getHistogramNumber(y, x, o, wSize);
                    //dNorm[ij] *= exp(c * r2);
                    var norm = dNorm[ij];
                    //var norm = exp(c * r2) * dNorm[ij];
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
            //return correctImage(patchRGB, patchRGB.miredHistogram().modes[0].RGB);
            // patchNorm = patch['.^'](2.4).colorConstancy("grey_world").imcor['.^'](1 / 2.4);
            // return patchRGB.general_cc(0, 1, 0, patchRGB.mask).imcor;
            // return patchRGB.colorConstancy("shades_of_grey", patchRGB.mask).imcor;
            // return patchRGB.colorConstancy("grey_world", patchRGB.mask).imcor;
            // return patchRGB.colorConstancy("grey_edge", patchRGB.mask).imcor;
            // return patchRGB.colorConstancy("max_rgb", patchRGB.mask).imcor;

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

        /** Compute from an RGB image patch an patch adapted to the descriptor
         * computation. This transformation is constituted by a colorspace conversion
         * an a gradient phase/norm computation.
         */
        getPatch: function (patch) {
            if (this.normalize === true) {
                patch = this.normalizeColor(patch);
            }
            var cs = this.colorspace;
            if (cs.name !== "RGB") {
                patch = patch.patch.applycform(this.convert);
            }

            switch (this.type) {
            case "GRADIENT":
                patch = patch.select([], [], cs.channels).gradient(0, 0, 1, 1);
                break;
            case "WEIGHTED-HISTOGRAMS":
                patch = {
                    norm: patch.select([], [], cs.weightChannel),
                    phase: patch.select([], [], cs.phaseChannel)
                };
                break;
            default:
                throw new Error("Descriptor: Unknown type: " + this.type + ".");
            }
            return patch;
        },

        /** Extract a `DescriptorData` structure from a main
         * orientation `o` and an RGB image patch `patchRGB`.
         *
         * @param {Number} o
         * @param {Matrix} patchRGB
         * @param {Array} [mem]
         *  Preallocated memory.
         */
        extractFromPatch: function (o, patchRGB, data) {
            var patch = this.getPatch(patchRGB);

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
