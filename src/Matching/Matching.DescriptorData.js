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
