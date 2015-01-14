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

(function (global) {
    /** @class Mode 
     * Create an object describing an interval `[i, j]` of an histogram.
     * @param {Integer} i
     *  First bin.
     * @param {Integer} j
     *  Last bin.
     * @param {Number} [measure]
     *  Field to used to store the meaningfulness measure of the interval.
     * @param {Array} [histogram]
     *  If the histogram is provided, then the center of mass of the histogram
     *  is computed.
     * @constructor
     */
    function Mode(a, b, measure, hist) {
        'use strict';
        this.bins = [a, b];
        this.mesure = measure;
        if (hist) {
            this.baryCenter(hist);
        }
    }
    /** Convert the mode to string for export purpose. */
    Mode.prototype.toString = function () {
        'use strict';
        return '[' + this.bins.toString() + ']';
    };
    /** Provide a copy of the mode. */
    Mode.prototype.getCopy = function () {
        'use strict';
        var newMode = new Mode(this.bins[0], this.bins[1], this.mesure);
        newMode.norm = this.norm;
        newMode.phase = this.phase;
        return newMode;
    };
    /** Function used to sort the mode according to the measure field. */
    Mode.prototype.compar = function (m1, m2) {
        'use strict';
        return m1.mesure < m2.mesure;
    };
    /** Function used to compute the barycenter of a mode. */
    Mode.prototype.baryCenter = function (histogram, normFactor) {
        'use strict';
        var size = histogram.length;
        var min = this.bins[0], max = this.bins[1];
        normFactor = normFactor || size;
        var bc = 0, j, weightMode = 0;

        if (max >= min) {
	    // Compute weight of meaningful mode
            for (j = min; j <= max; j++) {
                weightMode += histogram[j];
            }
	    // compute barycenter of mode
            for (j = min; j <= max; j++) {
                bc += histogram[j] * j;
            }
            bc /= weightMode;
        } else {
	    // Compute weight of meaningful mode
            for (j = min; j < size; j++) {
                weightMode += histogram[j];
            }
            for (j = 0; j <= max; j++) {
                weightMode += histogram[j];
            }

	    // compute barycenter of mode
            for (j = min; j < size; j++) {
                bc += histogram[j] * (j - min);
            }
            for (j = 0; j <= max; j++) {
                bc += histogram[j] * (j + size - min);
            }

            bc /= weightMode;
            bc += min;

            bc = bc >= size ? (bc - size) : bc;
        }

        this.norm = weightMode;
        this.phase = bc / normFactor;
        return this;
    };

    root.Mode = Mode;
})(root);

(function (global) {
    'use strict';
    
    /** 
     * @class JSM
     * @singleton 
     * @private
     */

    /** Compute on place the cumulative sum of an array. 
     * @param {Array} t
     * @private
     */
    var integrate = function (t) {
        var i, ei;
        for (i = 1, ei = t.length; i < ei; i++) {
            t[i] += t[i - 1];
        }
    };
    /** Normalize an array by a given value.
     * @param {Array} t
     * @param {Number} cst
     * @private
     */
    var norm = function (t, cst) {
        cst = 1 / cst;
        var i, ei;
        for (i = 0, ei = t.length; i < ei; i++) {
            t[i] *= cst;
        }
    };
    /** For each interval `[i, j]` of a **cumulate** histogram of size `N`, 
     * compute the mass inside. The result is returned as a 2D array `m`. The
     * histogram can be circular or not. Intervals added by considering the non
     * circular case are interval with `i > j`. The mass contained by an 
     * interval `[i, j]` correspond, to the cell `i * N + j`.
     * @param {Array} h
     *  The cumulate histogram.
     * @param {Boolean} circular
     *  True if the histogram has to be considered as circular.
     * @param {Number} cst
     *  The mass of the histogram.
     * @private
     */
    var vectorToIntervals = function (v, circular, cst) {
        var i, i_, j, ij, e = v.length;
        var m = new Float32Array(e * e);

        for (ij = 0; ij < e; ij++) {
            m[ij] = v[ij];
        }
        for (i = 1, i_ = e; i < e; i++, i_ += e) {
            if (circular) {
                for (j = 0, ij = i_; j < i; j++, ij++) {
                    m[ij] = v[j] + cst - v[i - 1];
                }
            }
            for (j = i, ij = i_ + j; j < e; j++, ij++) {
                m[ij] = v[j] - v[i - 1];
            }
        }
        return m;
    };
    /** Compute the entropy for all the intervals of an histogram.
     * @param {Array} r
     *  The relative mass of the intervals. That is the mass inside the interval
     *  divided by the global mass of the histogram.
     * @param {Array} proba
     *  The probabilities to fall inside the intervals.
     * @param {Function} fct
     *  The function used to compute the entropies. As parameters, it takes the 
     *  relative mass of the histogram and the probability to fall inside the 
     *  histogram.
     * @param {Number} cst
     *  The average mass per point.
     * @param {Boolean} circular
     *  True if the histogram has to be considered as circular.
     * @private
     */
    var computeEntropy = function (r, p, fct, cst, circular) {
        var i, i_, ij, L = Math.sqrt(r.length), ei, eij;
        var Hmod = new Float32Array(L * L);
        var Hgap = new Float32Array(L * L);

        for (i = 0, i_ = 0, ei = L * L; i_ < ei; i++, i_ += L) {
            if (circular) {
                for (ij = i_, eij = i_ + i; ij < eij; ij++) {
                    Hmod[ij] = fct(r[ij], p[ij]);
                    Hgap[ij] = fct(cst - r[ij], 1 - p[ij]);
                }
            }
            for (ij = i_ + i, eij = i_ + L; ij < eij; ij++) {
                Hmod[ij] = fct(r[ij], p[ij]);
                Hgap[ij] = fct(cst - r[ij], 1 - p[ij]);
            }
        }
        return [Hmod, Hgap];
    };
    /** Return a discrete uniform distribution.
     * @param{Integer} t
     *  The number of bins.
     * @private
     */
    var getUniformPdf = function (t) {
        var groundPdf = new Float32Array(t.length);
        var i, e = t.length, cst = 1 / e;
        for (i = 0; i < e; i++) {
            groundPdf[i] = cst;
        }
        return groundPdf;
    };
    /** Return the function used to compute the entropy.
     * @param{Integer} M
     *  The number of point used to compute the histogram.
     * @param{Number} mu
     *  The average mass of the points.
     * @param{Number} sigma2
     *  The variance of mass of the points.
     * @private
     */
    var getEntropyFct = function (M, mu, sigma2) {
        var log = Math.log, sqrt = Math.sqrt, lerfc = Math.lerfc;
        var ILOG10 = 1 / log(10), L1P2 = log(0.5);
        var MIN = Number.MIN_VALUE;

        // Histogram built with gaussian mass
        if (mu !== undefined && sigma2 !== undefined) {

            var c1 = -1 / M * ILOG10, c2 = M * mu, c3 = sigma2 / mu;
            return function (r, p) {
                if (p <= MIN) {
                    return 0;
                }
                var m = p * c2;
                var s = m * (mu * (1 - p) + c3);
                var z = (M * r - m) / sqrt(2 * s);
                return (L1P2 + lerfc(z)) * c1;
            };
            // Histogram built with unit mass
        } else {
            return function (r, p) {
                if (r <= p || p <= MIN) {
                    return 0;
                }
                if (r === 1) {
                    return -log(p) * ILOG10;
                }
                return (r * log(r / p) + (1 - r) * log((1 - r) / (1 - p))) * ILOG10;
            };

        }
    };

    /** Return the threshold to determine is an interval is meaningful or not.
     * @param{Integer} L
     *  The number of bins of the histogram considered.
     * @param{Integer} M
     *  The number of points used to compute the histogram.
     * @param{Number} eps
     *  Correspond to `-log10(<Expected number of false alarm>)`.
     * @param{Boolean} circular
     *  True if the histogram has to be considered as circular.
     * @private
     */
    var getThreshold = function (L, M, eps, circular) {
        if (circular) {
            return (Math.log(L * (L - 1)) / Math.log(10) + eps) / M;
        } else {
            return (Math.log(L * (L - 1) / 2) / Math.log(10) + eps) / M;
        }
    };

    /** Fast way to compute the maximum of three values.
     * @param{Number} v1
     * @param{Number} v2
     * @param{Number} v3
     * @private
     */
    var max = function (R, G, B) {
        if (R > G) {
            if (R > B) {
                return R;
            } else {
                return B;
            }
        } else {
            if (G > B) {
                return G;
            } else {
                return B;
            }
        }
    };
    /** Fast way to compute the minimum of three values.
     * @param{Number} v1
     * @param{Number} v2
     * @param{Number} v3
     * @private
     */
    var min = function (R, G, B) {
        if (R < G) {
            if (R < B) {
                return R;
            } else {
                return B;
            }
        } else {
            if (G < B) {
                return G;
            } else {
                return B;
            }
        }
    };

    /** Compute, for each interval `I`, the maximum entropy of the intervals 
     * contained by `I`.
     * @param{Array} H
     *  Array containing the entropy of all the intervals.
     * @param{Integer} L
     *  Number of bins in the considered histogram.
     * @param{Boolean} circular
     *  True if the histogram has to be considered as circular.
     * @return{Array}
     * @private
     */
    var maxInf = function (H, L, circular) {
        //var max = Math.max, min = Math.min;

        var i, ie, j, je, j2;
        var c = new Float32Array(L * L);
        // Smaller intervals (All cases)
        for (i = 0, ie = L * L; i < ie; i += L + 1) {
            c[i] = H[i];
        }

        // i in [L - 2, 0], j in [i + 1, L - 1] (All cases)
        for (i = L - 2; i >= 0; i--) {
            for (j = i * L + i + 1, je = (i + 1) * L; j < je; j++) {
                c[j] = max(c[j + L], c[j - 1], H[j]);
            }
        }

        if (circular) {
            // Bottom-left corner (Circular cases)
            c[(L - 1) * L] = max(c[0], c[(L - 1) * L + L - 1], H[(L - 1) * L]);
            // Last row
            for (j2 = 1, j = (L - 1) * L + j2; j2 < L - 1; ++j2, ++j) {
                c[j] = max(H[j], c[j2], c[j - 1]);
            }
            // First column (Circular cases)
            for (i = (L - 2) * L; i > 0; i -= L) {
                c[i] = max(H[i], c[i + L - 1], c[i + L]);
            }
            // i in [L - 2, 0], j in [1, i - 1] (Circular cases)
            for (i = L - 2; i > 0; i--) {
                for (j = i * L + 1, je = i * L + i; j < je; ++j) {
                    c[j] = max(H[j], c[j - 1], c[j + L]);
                }
            }
        }
        return c;
    };
    /** Compute, for an interval `I`, the maximum entropy of the intervals 
     * containing `I`.
     * @param{Array} H
     *  Array containing the entropy of all the intervals.
     * @param{Integer} L
     *  Number of bins in the considered histogram.
     * @param{Boolean} circular
     *  True if the histogram has to be considered as circular.
     * @return{Array}
     * @private
     */
    var maxSup = function (H, L, circular) {
        //var max = Math.max, min = Math.min;
        var i, ie, j, je, j2;
        var c = new Float32Array(L * L);
        // Max length intervals in circular case
        // They doesn't belong to a longer interval
        if (circular) {
            // Circular cases
            for (i = L, ie = L * L; i < ie; i += L + 1) {
                c[i] = H[i];
            }
            // i in [2, L - 1], j in [i - 2, 0] Circular Cases
            for (i = 2; i < L; ++i) {
                for (je = i * L - 1, j = i * L + i - 2; j > je; --j) {
                    c[j] = max(H[j], c[j - L], c[j + 1]);
                }
            }
        }
        c[L - 1] = H[L - 1];
        // First row (Circular and non-circular cases)
        for (j = L - 2, j2 = (L - 1) * L + j; j >= 0; --j, --j2) {
            c[j] = max(H[j], c[j + 1], c[j2]);
        }
        // Last column (Circular and non-circular cases)
        for (i = 1 * L, ie = L * L; i < ie; i += L) {
            c[i + L - 1] = max(c[i - 1], c[i], H[i + L - 1]);
        }
        // i in [1, L - 2], j in [L - 2, i] non-circular cases
        for (i = 1; i < L - 1; i++) {
            for (j = i * L + L - 2, je = i * L + i; j >= je; j--) {
                c[j] = max(c[j - L], c[j + 1], H[j]);
            }
        }
        return c;
    };
    /** For each interval, set the entropy to zero if the interval contained a
     * meaningful gap (resp. mode). Otherwise, return the entropy of the mode 
     * (resp. gap).
     * @param{Array} E1
     *  Array containing the entropy of all the interval when considered as 
     *  potential modes (resp. gaps).
     * @param{Array} E2
     *  Array containing the entropy of all the interval when considered as 
     *  potential gap (resp. modes).
     * @param{Integer} L
     *  The Number of bins of the histogram.
     * @param{Number} thresh
     *  The threshold used to decide whether or not the interval is meaningful.
     * @param{Boolean} circular
     *  True if the histogram has to be considered as circular.
     * @return{Array}
     * @private
     */
    var ifGapOrMode = function (Hmode, Hgap, L, thresh, circular) {
        var i, ie, i2, j, je, x, xe;

        var c = new Float32Array(L * L);
        for (x = 0, xe = c.length; x < xe; ++x) {
            c[x] = (Hgap[x] >= thresh) ? 1 : 0;
        }

        // i in [L - 2, 0], j in [i + 1, L - 1] (All cases)
        for (i = L - 2; i >= 0; i--) {
            for (j = i * L + i + 1, je = (i + 1) * L; j < je; j++) {
                c[j] += c[j - 1] + c[j + L];
            }
        }

        if (circular) {
            // Bottom-left corner (Circular cases)
            c[(L - 1) * L] += c[0] + c[(L - 1) * L + L - 1];
            // Last row (Circular cases)
            for (j = 1; j < L - 1; ++j) {
                c[(L - 1) * L + j] += c[j] + c[(L - 1) * L + j - 1];
            }
            // Other rows
            for (i2 = L - 2, i = i2 * L, ie = 0; i > ie; i -= L, --i2) {
                c[i] += c[i + L] + c[i + L - 1];
                for (j = i + 1, je = i + i2; j < je; ++j) {
                    c[j] += c[j - 1] + c[j + L];
                }
            }
        }
        for (x = 0, xe = c.length; x < xe; ++x) {
            c[x] = c[x] ? 0 : Hmode[x];
        }

        return c;
    };

    /** Select among all the intervals the maximum meaningful ones.
     * @param{Array} hist
     *  The histogram considered.
     * @param{Boolean} circular
     *  True if the histogram has to be considered as circular.
     * @param{Array} Hmod
     *  Array containing the entropy of all the interval when considered as 
     *  modes (resp. gaps). The entropy of the interval containing meaningful
     *  mode (resp. gap) as to be set to zero.
     * @param{Array} Hsup
     *  For each interval `I`, contain the maximum entropy of all the interval 
     *  containing `I`.
     * @param{Array} Hinf
     *  For each interval `I`, contain the maximum entropy of all the interval 
     *  contained by `I`.
     * @param{Number} thresh
     *  The threshold used to decide whether or not the interval is meaningful.
     * @return{Array} 
     *  Array containing the maximum meaningful intervals sorted by 
     *  meaningfulness.
     * @private
     */
    var selectIntervals = function (hist, circular, H, Hsup, Hinf, thresh) {
        // Determine maximum meaningful intervals
        var out = [];
        var i, i_, j, ij, L = Math.sqrt(H.length), ei, eij;
        for (i = 0, i_ = 0, ei = L * L; i_ < ei; i++, i_ += L) {
            for (j = circular ? 0 : i, ij = i_ + j, eij = i_ + L; ij < eij; j++, ij++) {
                if (H[ij] >= thresh && Hsup[ij] <= H[ij] && Hinf[ij] <= H[ij]) {
                    out.push(new Mode(i, j, H[ij], hist));
                }
            }
        }
        return out.sort(Mode.prototype.compar);
    };

    /** Control first the arguments and compute the entropy
     * @param {Array } hist
     *  The input histogram
     * @param {Boolean} [circular = false]
     *  True if the histogram is circular.
     * @param {Number} [eps = 0]
     *  Correspond to `-log10(<Expected number of false alarm>)`.
     * @param {Integer} [M]
     *  The number of points used to compute the histogram.
     * @param {Number} [mu]
     *  The average mass of the points.
     * @param {Number} [sigma2]
     *  The variance of the masses of the points.
     * @param {Array} [groundPdf]
     *  The discrete propability distribution of the points.
     * @private
     */
    var initialize = function (input, circular, eps, M, mu, sigma2, groundPdf) {

        // Duplicate input histogram
        var L = input.length;
        var hist = new Float32Array(input);

        circular = circular === undefined ? false : circular;
        eps = eps === undefined ? 0 : eps;
        groundPdf = groundPdf === undefined ? getUniformPdf(input) : new Float32Array(groundPdf);

        integrate(groundPdf);
        integrate(hist);

        var mass = hist[L - 1];
        M = M === undefined ? mass : M; 

        norm(groundPdf, groundPdf[L - 1]);
        norm(hist, M);

        var p = vectorToIntervals(groundPdf, circular, 1);
        var r, entropy, H;
        if (M && mu && sigma2) {
            r = vectorToIntervals(hist, circular, mass / M);
            entropy = getEntropyFct(M, mu, sigma2);
            H = computeEntropy(r, p, entropy, mass / M, circular);
        } else {
            r = vectorToIntervals(hist, circular, 1);
            entropy = getEntropyFct(M, mu, sigma2);
            H = computeEntropy(r, p, entropy, 1, circular);
        }
        var thresh = getThreshold(L, M, eps, circular);
        var Hmod = H[0], Hgap = H[1];

        return {Hmod: Hmod, Hgap: Hgap, thresh: thresh};
    };

    /** Extract the maximum meaningful intervals of an histogram (gaps and 
     * modes). This function handle the case where all points have the same mass
     * as well as the cases where they may be approximated by a gaussian 
     * distribution (Central limit theorem). 
     * @param {Array } hist
     *  The input histogram
     * @param {Boolean} [circular = false]
     *  True if the histogram is circular.
     * @param {Number} [eps = 0]
     *  Correspond to `-log10(<Expected number of false alarm>)`.
     * @param {Integer} [M]
     *  The number of points used to compute the histogram.
     * @param {Number} [mu = 1]
     *  The average mass of the points. 
     * @param {Number} [sigma2 = 0]
     *  The variance of the masses of the points.
     * @param {Array} [groundPdf]
     *  The discrete propability distribution of the points.
     * @private
     */
    var extractModesAndGaps = function (input, circular, eps, M, mu, sigma2, groundPdf) {

        var H = initialize(input, circular, eps, M, mu, sigma2, groundPdf);

        // Set entropy to zero if the interval contain a meaningful gap
        var Hgap = ifGapOrMode(H.Hgap, H.Hmod, input.length, H.thresh, circular);
        // Determine maximum entropy of gaps contained for each interval
        var HgapSup = maxSup(Hgap, input.length, circular);
        // Determine maximum entropy of gaps contained for each interval
        var HgapInf = maxInf(Hgap, input.length, circular);
        // Extract maximum meaningful gaps
        var gaps = selectIntervals(input, circular, Hgap, HgapSup, HgapInf, H.thresh);

        // Set entropy to zero if the interval contain a meaningful mode
        var Hmod = ifGapOrMode(H.Hmod, H.Hgap, input.length, H.thresh, circular);
        // Determine maximum entropy of modes contained for each interval
        var HmodSup = maxSup(Hmod, input.length, circular);
        // Determine maximum entropy of modes contained for each interval
        var HmodInf = maxInf(Hmod, input.length, circular);
        // Extract maximum meaningful modes
        var modes = selectIntervals(input, circular, Hmod, HmodSup, HmodInf, H.thresh);

        return {modes:modes, gaps: gaps};
    };

    /** Extract the maximum meaningful modes of an histogram.
     * See function {@link JSM#extractModesAndGaps} for more details.
     * @private
     */
    var extractModes = function (input, circular, eps, M, mu, sigma2, groundPdf) {

        var H = initialize(input, circular, eps, M, mu, sigma2, groundPdf);

        // Set entropy to zero if the interval contain a meaningful mode
        var Hmod = ifGapOrMode(H.Hmod, H.Hgap, input.length, H.thresh, circular);
        // Determine maximum entropy of modes contained for each interval
        var HmodSup = maxSup(Hmod, input.length, circular);
        // Determine maximum entropy of modes contained for each interval
        var HmodInf = maxInf(Hmod, input.length, circular);
        // Extract maximum meaningful modes
        var modes = selectIntervals(input, circular, Hmod, HmodSup, HmodInf, H.thresh);

        return modes;
    };
    /** Extract the maximum meaningful gaps of an histogram.
     * See function {@link JSM#extractModesAndGaps} for more details.
     * @private
     */
    var extractGaps = function (input, circular, eps, M, mu, sigma2, groundPdf) {

        var H = initialize(input, circular, eps, M, mu, sigma2, groundPdf);

        // Set entropy to zero if the interval contain a meaningful gap
        var Hgap = ifGapOrMode(H.Hgap, H.Hmod, input.length, H.thresh, circular);
        // Determine maximum entropy of gaps contained for each interval
        var HgapSup = maxSup(Hgap, input.length, circular);
        // Determine maximum entropy of gaps contained for each interval
        var HgapInf = maxInf(Hgap, input.length, circular);
        // Extract maximum meaningful gaps
        var gaps = selectIntervals(input, circular, Hgap, HgapSup, HgapInf, H.thresh);

        return gaps;
    };

    /** @class Matrix */

    /** Extract both modes and gaps of an histogram.
     *
     * __Also see:__
     * {@link Matrix#getModes},
     * {@link Matrix#getGaps}.
     *
     * @param {Boolean} [circular = false]
     *  True if the histogram is circular.
     * @param {Number} [eps = 0]
     *  Correspond to `-log10(<Expected number of false alarm>)`.
     * @param {Integer} [M]
     *  The number of points used to compute the histogram.
     * @param {Number} [mu]
     *  The average mass of the points.
     * @param {Number} [sigma2]
     *  The variance of the masses of the points.
     * @param {Array} [groundPdf]
     *  The discrete propability distribution of the points.
     * @return {Array} 
     *  Return an array of maximum meaningful modes detected in the histogram.
     *
     * NOTE ON IMPLEMENTATION
     * ======================
     *
     * The algorithm
     * -------------
     *
     * Let's assume that an histogram is built from a set of point. 
     * we also assume that each of these points contributes to the histogram
     * with a given weight (or mass).
     * 
     * The algorithm used here aims to detect interval of histograms where the
     * mass is significantly smaller (gaps) or larger (modes) than expected.
     * The expected mass in an interval is specified by two priors:
     *
     * + The distribution of points contributing to the histogram :
     *
     *   - can be uniform (default), 
     *   - or can be set with the parameter `groundPdf`.
     *
     * + The distribution of weights of these points :
     *
     *   - can be a dirac function (unit weight for each point),
     *   - or can be changed to gaussian by setting the parameters `mu` and 
     *     `sigma2`.
     *
     * Then intervals wich contradicts these distribution are defined as 
     * being meaningful. That is these intervals wich the algorithm is 
     * detecting.
     *
     * Intervals representation
     * ------------------------
     *
     * Possible intervals of an histogram can represented using a matrix.
     * In non-circular histogram case, there is `L * (L + 1) / 2` intervals
     * where L is the histogram length. These intervals are stored in the
     * upper part of the matrix.
     *
     * Matrix are stored in an 1D array in row-major order. Therefore, 
     * information relative to an interval `[i, j]` can be accessed by the 
     * formula `i * L + j`.
     *
     *     //      j
     *     //    _____
     *     //   |m***M|
     *     //   | m***| Diagonal elements 'm' represent minimum length 
     *     // i |  m**| intervals, 'M' element represent the maximum length 
     *     //   |   m*| interval and '*' elements the others.
     *     //   |    m|
     *     //    -----
     *
     *     //      j
     *     //    _____
     *     //   |m***M| 
     *     //   |Mm***| For the circular histogram case, there is L * L possible
     *     // i |*Mm**| intervals. Circular intervals can be accessed with the
     *     //   |**Mm*| matrix entry [i, j] with j < i.
     *     //   |***Mm|
     *     //    -----
     *
     * Maximum meaningfulness computation
     * ----------------------------------
     *
     * Meaningful modes are intervals with entropy above a given threshold.
     * The algorithm only retain maximum meaningful modes, i.e. interval
     * ensuring the following conditions:
     *
     * - it shall be a meaningful interval,
     * - it shall not contain a meaningful gap,
     * - it shall not be contained in a more meaningful interval,
     * - it shall not contain a more meaningful interval.
     *
     * To check these conditions, several computations are necessary.
     * for a all intervals `I`, the following implementation computes:
     *
     * - `maxSup`: the maximum entropy of intervals containing I,
     * - `maxInf`: the maximum entropy of intervals contained in I,
     * - `ifGapOrMode`: removes also the intervals containing a meaningful gap.
     *
     * These computations can be done efficiently noticing that:
     *
     *     //      j                              j
     *     //    _____                          _____
     *     //   |     |                        |     |
     *     //   |   * | An interval 'x' is     |  *x | An interval 'x'
     *     // i |   x*| contained in two     i |   * | contain two
     *     //   |     | intervals '*'          |     | intervals '*'
     *     //   |     |                        |     |
     *     //    -----                          -----
     *
     * Morevover an interval 'M' can't be contained by a larger interval
     * and an interval 'm' do not contain any interval.
     * Therfore, smartly ordering the comparaison (from the smallest to
     * the largest or inversly) allow to compute these
     * entropy efficiently.
     */
    Matrix.prototype.getModesAndGaps = function (circular, eps, M, mu, sigma2, groundPdf) {
        var input = this.getData();
        if (groundPdf instanceof Matrix) {
            groundPdf = groundPdf.getData();
        }
        return extractModesAndGaps(input, circular, eps, M, mu, sigma2, groundPdf);
    };
    Matrix.getModesAndGaps = function (input, circular, eps, M, mu, sigma2, groundPdf) {
        input = Matrix.toMatrix(input);
        return input.getModesAndGaps(circular, eps, M, mu, sigma2, groundPdf);
    };
    /** Extract the gaps of an histogram.
     *
     * __Also see:__
     * {@link Matrix#getModesAndGaps},
     * {@link Matrix#getGaps}.
     */
    Matrix.prototype.getModes = function (circular, eps, M, mu, sigma2, groundPdf) {
        var input = this.getData();
        if (groundPdf instanceof Matrix) {
            groundPdf = groundPdf.getData();
        }
        return extractModes(input, circular, eps, M, mu, sigma2, groundPdf);
    };
    Matrix.getModes = function (input, circular, eps, M, mu, sigma2, groundPdf) {
        input = Matrix.toMatrix(input);
        return input.getModes(circular, eps, M, mu, sigma2, groundPdf);
    };
    /** Extract the modes of an histogram.
     *
     * __Also see:__
     * {@link Matrix#getModesAndGaps},
     * {@link Matrix#getModes}.
     */
    Matrix.prototype.getGaps = function (circular, eps, M, mu, sigma2, groundPdf) {
        var input = this.getData();
        if (groundPdf instanceof Matrix) {
            groundPdf = groundPdf.getData();
        }
        return extractGaps(input, circular, eps, M, mu, sigma2, groundPdf);
    };
    Matrix.getGaps = function (input, circular, eps, M, mu, sigma2, groundPdf) {
        input = Matrix.toMatrix(input);
        return input.getGaps(circular, eps, M, mu, sigma2, groundPdf);
    };

    // EXPORTS
    if (typeof window !== 'undefined') {
        root.extractModes = extractModes;
        root.extractGaps = extractGaps;
        root.extravctModesAndGaps = extractModesAndGaps
    }
    
})(Matrix);


function getHistograms (phase, norm, bins, m, M, circular) {
    'use strict';
    var nPoints = 0, mu = 0, sigma = 0;
    var i, ie;
    var hist, histw, tmp, val;
    var floor = Math.floor, cst = 1 / (M - m), ind;
    hist = new Float32Array(bins);
    if (norm) {
        histw = new Float32Array(bins);
        if (circular) {
            for (i = 0, ie = phase.length; i < ie; i++) {
                ind = floor(((phase[i] - m) * cst) * bins);
                ind = ind < 0 ? bins + (ind % bins) : ind % bins;
                histw[ind] += norm[i];
                hist[ind]++;
                mu += norm[i];
                nPoints++;
            }
            mu /= nPoints;
            for (i = 0, ie = phase.length; i < ie; i++) {
                tmp = norm[i] - mu;
                sigma += tmp * tmp;
            }
            sigma = sigma / (nPoints - 1);
        } else {
            for (i = 0, ie = phase.length; i < ie; i++) {
                val = phase[i];
                if (val < m || val > M) {
                    continue;
                }
                ind = floor(((phase[i] - m) * cst) * bins);
                histw[ind] += norm[i];
                hist[ind]++;
                mu += norm[i];
                nPoints++;
            }
            mu /= nPoints;
            for (i = 0, ie = phase.length; i < ie; i++) {
                val = phase[i];
                if (val < m || val > M) {
                    continue;
                }
                tmp = norm[i] - mu;
                sigma += tmp * tmp;
            }
            sigma = sigma / (nPoints - 1);
        }
    } else {
        if (circular) {
            for (i = 0, ie = phase.length; i < ie; i++) {
                ind = floor(((phase[i] - m) * cst) * bins);
                ind = ind < 0 ? bins + (ind % bins) : ind % bins;
                hist[ind]++;
                nPoints++;
            }
        } else {
            for (nPoints = 0, i = 0, ie = phase.length; i < ie; i++) {
                ind = floor(((phase[i] - m) * cst) * bins);
                if (ind < 0 || ind > bins) {
                    continue;
                }
                hist[ind]++;
                nPoints++;
            }
        }
    }
    return {
        histw: histw,
        hist: hist,
        mu: mu,
        sigma: sigma,
        M: nPoints
    };
}








































/*
function extractModes_old(input, circular, eps, M, mu, sigma2, groundPdf) {
    'use strict';
    // Loop indices
    var i, j, x;

    if (circular === undefined) {
        circular = false;
    }
    if (eps === undefined) {
        eps = 0;
    }
    if (groundPdf === undefined) {
        groundPdf = new Float32Array(input.length);
        var ie;
        for (i = 0, ie = input.length; i < ie; i++) {
            groundPdf[i] = 1 / ie;
        }
    } else {
        groundPdf = new Float32Array(groundPdf);
    }

    // Duplicate input histogram
    var L = input.length;
    var hist = new Float32Array(input);
    // Integrate signal and groundPdf
    for (i = 1; i < L; i++) {
        hist[i] += hist[i - 1];
        groundPdf[i] += groundPdf[i - 1];
    }

    var entropy, massMean, densityMin;

    // Histogram is build with unit mass
    var log = Math.log, sqrt = Math.sqrt;
    var ILOG10 = 1 / log(10), L1P2 = log(0.5);
    var lerfc = Math.lerfc;
    if (!(M > 0 && typeof mu === "number" && sigma2 > 0)) {
        massMean = 1;
        M = hist[L - 1];
        entropy = function (r, p) {
            if (r <= p) {
                return 0;
            }
            if (r === 1) {
                return -log(p) * ILOG10;
            }
            return (r * log(r / p) + (1 - r) * log((1 - r) / (1 - p))) * ILOG10;
        };
    // Histogram is weigthted
    } else {
        massMean = hist[L - 1] / M;
        densityMin = massMean;
        var c1 = -1 / M * ILOG10, c2 = M * mu, c3 = sigma2 / mu;
        entropy = function (r, p) {
            // if (r < densityMin * p || p === 0) {
            if (p <= Number.MIN_VALUE) {
                return 0;
            }
            var m = p * c2;
            var s = m * (mu * (1 - p) + c3);
            var z = (M * r - m) / sqrt(2 * s);
            return (L1P2 + lerfc(z)) * c1;
        };
    }

    // Threshold
    var thresh;
    if (circular) {
        thresh = (log(L * (L - 1)) / log(10) + eps) / M;
    } else {
        thresh = (log(L * (L - 1) / 2) / log(10) + eps) / M;
    }

    // Probability and density per bin
    var p, r;
    // Entropy for modes
    var Hmode = new Float32Array(L * L);
    // Entropy for gaps
    var Hgap = new Float32Array(L * L);

    // Normalize signal w.r.t. points number to get density per bin
    for (x = 0; x < L; x++) {
        hist[x] /= M;
        groundPdf[x] /= groundPdf[L - 1];
    }

    // Compute entropy for each interval;
    for (i = 0; i < L; ++i) {
        if (circular) {
            for (j = 0, x = i * L + j; j < i; ++j, ++x) {
                p = groundPdf[j] + 1 - groundPdf[i - 1];
                r = hist[j] + massMean - hist[i - 1];
                Hmode[x] = entropy(r, p);
                Hgap[x] = entropy(massMean - r, 1 - p);
            }
        }
        for (j = i, x = i * L + j; j < L; ++j, ++x) {
            p = (i === 0) ? groundPdf[j] : groundPdf[j] - groundPdf[i - 1];
            r = (i === 0) ? hist[j] : hist[j] - hist[i - 1];
            Hmode[x] = entropy(r, p);
            Hgap[x] = entropy(massMean - r, 1 - p);
        }
    }
    p = new Float32Array(L * L);
    r = new Float32Array(L * L);
    for (i = 0; i < L; ++i) {
        if (circular) {
            for (j = 0, x = i * L + j; j < i; ++j, ++x) {
                p[x] = groundPdf[j] + 1 - groundPdf[i - 1];
                r[x] = hist[j] + massMean - hist[i - 1];
            }
        }
        for (j = i, x = i * L + j; j < L; ++j, ++x) {
            p[x] = (i === 0) ? groundPdf[j] : groundPdf[j] - groundPdf[i - 1];
            r[x] = (i === 0) ? hist[j] : hist[j] - hist[i - 1];
        }
    }

    function maxinf(H, L) {
        var max = Math.max, min = Math.min;
        var i, ie, j, je, j2;
        var c = new Float32Array(L * L);
        // Smaller intervals (All cases)
        for (i = 0, ie = L * L; i < ie; i += L + 1) {
            c[i] = H[i];
        }

        // i in [L - 2, 0], j in [i + 1, L - 1] (All cases)
        for (i = L - 2; i >= 0; i--) {
            for (j = i * L + i + 1, je = (i + 1) * L; j < je; j++) {
                c[j] = max(c[j + L], c[j - 1], H[j]);
            }
        }

        if (circular) {
            // Bottom-left corner (Circular cases)
            c[(L - 1) * L] = max(c[0], c[(L - 1) * L + L - 1], H[(L - 1) * L]);
            for (j2 = 1, j = (L - 1) * L + j2; j2 < L - 1; ++j2, ++j) {
                c[j] = max(H[j], c[j2], c[j2 - 1]);
            }
            // First column (Circular cases)
            for (i = (L - 2) * L; i > 0; i -= L) {
                c[i] = max(H[i], c[i + L - 1], c[i + L]);
            }
            // i in [L - 2, 0], j in [1, i - 1] (Circular cases)
            for (i = L - 2; i > 0; i--) {
                for (j = i * L + 1, je = i * L + i; j < je; ++j) {
                    c[j] = max(H[j], c[j - 1], c[j + L]);
                }
            }
        }
        return c;
    }
    function maxsup(H, L) {
        var max = Math.max, min = Math.min;
        var i, ie, j, je, j2;
        var c = new Float32Array(L * L);
        // Max length intervals in circular case
        // They doesn't belong to a longer interval
        if (circular) {
            // Circular cases
            for (i = L, ie = L * L; i < ie; i += L + 1) {
                c[i] = H[i];
            }
            // i in [2, L - 1], j in [i - 2, 0] Circular Cases
            for (i = 2; i < L; ++i) {
                for (je = i * L - 1, j = i * L + i - 2; j > je; --j) {
                    c[j] = max(H[j], c[j - L], c[j + 1]);
                }
            }
        }
        c[L - 1] = H[L - 1];
        // First row (Circular and non-circular cases)
        for (j = L - 2, j2 = (L - 1) * L + j; j >= 0; --j, --j2) {
            c[j] = max(H[j], c[j + 1], c[j2]);
        }
        // Last column (Circular and non-circular cases)
        for (i = 1 * L, ie = L * L; i < ie; i += L) {
            c[i + L - 1] = max(c[i - 1], c[i], H[i + L - 1]);
        }
        // i in [1, L - 2], j in [L - 2, i] non-circular cases
        for (i = 1; i < L - 1; i++) {
            for (j = i * L + L - 2, je = i * L + i; j >= je; j--) {
                c[j] = max(c[j - L], c[j + 1], H[j]);
            }
        }
        return c;
    }
    function ifGap(Hmode, Hgap, L, thresh) {
        var i, ie, i2, j, je, k, ke, l, le, n, ne, x, xe;

        var c = new Float32Array(L * L);
        for (x = 0, xe = c.length; x < xe; ++x) {
            c[x] = (Hgap[x] >= thresh) ? 1 : 0;
        }

        // i in [L - 2, 0], j in [i + 1, L - 1] (All cases)
        for (i = L - 2; i >= 0; i--) {
            for (j = i * L + i + 1, je = (i + 1) * L; j < je; j++) {
                c[j] += c[j - 1] + c[j + L];
            }
        }

        if (circular) {
            // Bottom-left corner (Circular cases)
            c[(L - 1) * L] += c[0] + c[(L - 1) * L + L - 1];
            // Last row (Circular cases)
            for (j = 1; j < L - 1; ++j) {
                c[(L - 1) * L + j] += c[j] + c[(L - 1) * L + j - 1];
            }
            // Other rows
            for (i2 = L - 2, i = i2 * L, ie = 0; i > ie; i -= L, --i2) {
                c[i] += c[i + L] + c[i + L - 1];
                for (j = i + 1, je = i + i2; j < je; ++j) {
                    c[j] += c[j - 1] + c[j + L];
                }
            }
        }
        for (x = 0, xe = c.length; x < xe; ++x) {
            c[x] = c[x] ? 0 : Hmode[x];
        }

        return c;
    }
    //new Matrix([L, L], Hmode).transpose().display(20);

    //new Matrix([L, L], Hgap).transpose().display("old");

    // Set entropy to zero if the interval contain a meaningful gap
    Hmode = ifGap(Hmode, Hgap, L, thresh);
    // Determine maximum entropy of mode contained for each interval
    var Hsup = maxsup(Hmode, L);
    // Determine maximum entropy of gap contained for each interval
    var Hinf = maxinf(Hmode, L);

    // Determine maximum meaningful modes
    var out = [];
    for (i = 0; i < L; ++i) {
        for (j = circular ? 0 : i, x = i * L + j; j < L; ++j, ++x) {
            if (Hmode[x] >= thresh && Hsup[x] <= Hmode[x] && Hinf[x] <= Hmode[x]) {
                out.push(new Mode(i, j, Hmode[x], input));
            }
        }
    }

    Hmode = null;
    Hsup = null;
    Hinf = null;
    p = null;
    r = null;
    Hgap = null;
    hist = null;
    // Sort mode by descreasing meaningfulness
    return out.sort(Mode.prototype.compar);
}
*/
/*------------------------- Commande MegaWave -----------------------------*/
/* mwcommand
  name = {ftc_seg_circ};
  version = {"12/05/06"};
  author = {"Julie Delon, modified by Julien Rabin"};
  function = {"histogram fine to coarse segmentation"};
  usage = {
'e':[eps=0.0]->eps  "-log10(max. number of false alarms), default 0",
input->in           "input Fsignal",
out<-ftc_seg_circ         "output Flist of separators"
          };
*/
/*-- MegaWave - Copyright (C) 1994 Jacques Froment. All Rights Reserved. --*/


/*2005 feb : output changed, bounds of the whole interval are excluded*/
/*2005 april :  improvement in pooling_adjacent_violators  (Pascal Monasse)*/
/*2005 june :  the modes are merged by order of meaningfullness, starting with the merging which follows "the best" the unimodal hypothesis*/
/*2006 may :  ftc_seg is now designed for circular histogram*/
/*
function MOD(i, L) {
    'use strict';
    if (i >= 0 && i < L) {
        return i;
    }
    if (i < 0) {
        return MOD(i + L, L);
    }
    if (i >= L) {
        return MOD(i - L, L);
    }
    console.log("error.\n");
}

function MOD2(i, L) {
    'use strict';
    if (i >= 0 && i < L) {
        return i;
    }
    if (i < 0) {
        return MOD2(i + L, L);
    }
    if (i >= L) {
        return MOD2(i - L, L);
    }
    console.log("error.\n");
}


function sextract(a, b, input) {
    'use strict';
    var out, i;

    if (a > b) {
        b = input.length - (a - b) + 1;
        out = new Float32Array(b);
        for (i = 0; i < out.length; i++) {
            if (i + a < input.length) {
                out[i] = input[i + a];
            } else {
                out[i] = input[i + a - input.length];
            }
        }
    } else {
        out = new Float32Array(b - a + 1);
        for (i = 0; i < out.length; i++) {
            out[i] = input[i + a];
        }
    }
    return out;
}
*/




// INCREASING OR DECREASING GRENANDER ESTIMATOR OF THE HISTOGRAM IN
/*
function pooling_adjacent_violators(c, input) {
    'use strict';
    var som;
    var dec = 0;
    var size, i, j, k;

    size = input.length;
    dec = new Float32Array(size);

    // Decreasing hypothesis
    if (!c) {
        dec[0] = input[0];
        for (i = 1; i < size; i++) {
            dec[i] = input[i];
            som = dec[i];
            for (j = i - 1; j >= -1; j--) {
                if (j === -1 || (dec[j] * (i - j) >= som)) {
                    som /= (i - j);
                    for (k = j + 1; k <= i; k++) {
                        dec[k] = som;
                    }
                    break;
                }
                som += dec[j];
            }
        }
    // Increasing hypothesis
    } else {
        // printf("increasing... ");
        dec[size - 1] = input[size - 1];
        for (i = size - 2; i >= 0; i--) {
            dec[i] = input[i];
            som = dec[i];
            for (j = i + 1; j <= size; j++) {
                if (j === size || (dec[j] * (j - i) >= som)) {
                    som /= j - i;
                    for (k = i; k <= j - 1; k++) {
                        dec[k] = som;
                    }
                    break;
                }
                som += dec[j];
            }
        }
    }

    return dec;
}

/*
// Compute the max entropy of the histogram input_{|[a,b]}
// for the increasing or decreasing hypothesis

// c=1 for the increasing hypothesis, 0 for the decreasing one
function max_entropy(c, input, a, b, eps) {
    'use strict';
    var extrait = 0, decrois = 0;
    var seuil, H, r, p, max_entrop;
    var i, j, L, N;

    // /!\ MODIFICATION
    extrait = sextract(a, b, input);
    decrois = pooling_adjacent_violators(c, extrait);
    L = extrait;

    // integrate signals
    for (i = 1; i < L; i++) {
        extrait[i] += extrait[i - 1];
    }
    for (i = 1; i < L; i++) {
        decrois[i] += decrois[i - 1];
    }

    // meaningfullness threshold
    // cette fois il y a L*L-L tests
    N = extrait[L - 1];
    seuil = (Math.log(L * (L - 1)) / Math.log(10) + eps) / N;
    seuil = N !== 0 ?  seuil : Number.MAX_VALUE;

    // search the most meaningfull segment (gap or mode)
    max_entrop = 0;
    for (i = 0; i < L; i++) {
        for (j = i; j < L; j++) {
            if (i === 0) {
                r = extrait[j];
            } else {
                r = extrait[j] - extrait[i - 1];
                r = r /  N;
            }
            if (i === 0) {
                p = decrois[j];
            } else {
                p = decrois[j] - decrois[i - 1];
            }
            p = p / N;
            H = entrop(r, p);

            if (H > max_entrop) {
                max_entrop = H;
            }
        }
    }
    max_entrop = (max_entrop - seuil) * N;

    extrait = null;
    decrois = null;

    return max_entrop;
}
*/
//***************************************
//*****************MAIN******************
//***************************************


/*
function ftc_seg_circ(input, eps) {
    'use strict';
    var  i, j, imin, n, m, M, iter, a, b;
    var max_entrop = 0;
    var min_max_entrop, H;
    var c;

    // permet de savoir si lorsque lors de la recherche de tous les
    // extrema un minimum a été découvert
    var first_min = -1;

    var size = input.length;
    var out = [];
    // ordered list of minima and maxima
    var list = [];

    var density = new Float32Array(input);

    // FIRST SEGMENTATION, the list 'list' is filled with all minima and
    // maxima (min,max,min,max,etc...). The list always starts and ends
    //  with a minimum.
    // /!\ MODIFICATION: on commence forcément par un minimum, et on finit
    // forcément par un maximum grâce à une définiton circulaire...
    // on parcourt tous les points
    for (i = 0; i < size; i++) {
        // strict minimum
        if (input[i] < input[MOD(i - 1, size)] && input[i] < input[MOD(i + 1, size)]) {
            list.push(i);
            first_min++;
        }

        /// large minimum
        if (input[i] < input[MOD(i - 1, size)] && input[i] === input[MOD(i + 1, size)]) {
            for (j = i + 1; input[j] === input[i]; j) {
                j++;
                j = MOD(j, size);
            }

            if (input[j] > input[i]) {
                // j-1 est l'indice du dernier plat trouvé
                if (j > i) {
                    list.push(0.5 * (i + (j - 1)));
                } else if (j < i) {
                    list.push(MOD2((i + 0.5 * (size - i + j)), size));
                }
                // MOD2 permet de stocker un float et d'avoir des frontières en x.5
                first_min++;
            }
            if (j > i) {
                i = j - 1;
            } else {
                // à cause de la circularité, j peut être < à i !
                break;
            }
        }

        // strict maximum
        if (first_min !== -1 && (input[i] > input[MOD(i - 1, size)]) && (input[i] > input[MOD(i + 1, size)])) {
            list.push(i);
        }

        // Large maximum
        if (first_min !== -1 && (input[i] > input[MOD(i - 1, size)]) && (input[i] === input[MOD(i + 1, size)])) {
            for (j = i + 1; input[j] === input[i]; j) {
                j++;
                j = MOD(j, size);
            }
            if (input[j] < input[i]) {
                if (j > i) {
                    list.push(0.5 * (i + (j - 1)));
                } else if (j < i) {
                    list.push(MOD2((i + 0.5 * (size - i + j)), size));
                }
            }
            if (j > i) {
                i = j - 1;
            } else {
                // à cause de la circularité, j peut être < à i !
                break;
            }
        }
    }

    // on re-parcourt les points de 0 au premier minimum afin de trouver
    // éventuellement un dernier maximum
    for (i = 0; i < Math.round(list[0]); i++) {
        // on ne détecte que les maximum restant:
        // strict maximum
        if ((input[i] > input[MOD(i - 1, size)]) && (input[i] > input[MOD(i + 1, size)])) {
            list.push(i);
        }

        // large maximum
        if ((input[i] > input[MOD(i - 1, size)]) && (input[i] === input[MOD(i + 1, size)])) {
            for (j = i + 1; input[j] === input[i]; j) {
                j++;
                j = MOD(j, size);
            }
            if (input[j] < input[i]) {
                if (j > i) {
                    list.push(0.5 * (i + (j - 1)));
                } else if (j < i) {
                    list.push(MOD2(i + 0.5 * (size - i + j), size));
                }
            }
            i = j - 1;
        }
    }

    // PROBLÈME: si on est unimodal et que le mini est détecté
    // après le maxi on ne donne pas le mini mais ce n'est pas
    // grave car on ne renvoie que les mini par 'out'
    if (list.length < 4) {
        for (i = 0; i < list.length; i++) {
            if ((i % 2 === 0)) {
                out.push(list[i] + 0.5);
            }
        }
        list = null;
        return out;
    }

    max_entrop = []; //mw_change_flist(NULL,list.length,list.length,1);

    for (i = 0; i < list.length; i++) {
        // Minimum at i -> configuration (max at i+1, min at i+2) in 'list'
        if (i % 2 === 0) {
            // minimum at i
            m = list[i];
            // maximum at i+1
            M = list[MOD(i + 1, list.length)];
            // peut importe que M<m grâce à sextract2
            max_entrop[i] = max_entropy(1, input, m, M, eps);
        // maximum at i -> configuration (min at i+1, max at i+2)
        } else {
            // maximum at i
            M = list[i];
            // minimum at i+3
            m = list[MOD(i + 1, list.length)];
            max_entrop[i] = max_entropy(null, input, M, m, eps);
        }
    }

    // FILL THE LIST OF MAX ENTROPIES:
    // the merging of two contiguous modes [a,b] and [b,c] can
    // be done in two ways, either by using the maximum M1 on [a,b]
    // and by testing the decreasing hypothesis on [M1,c], or by using
    // the maximum M2 on [b,c] and by testing the increasing hypothesis
    // on [a,M2]. For each configuration, we compute the entropy of the
    // worst interval against the considered hypothesis.

    max_entrop = [];// mw_change_flist(NULL,list.length,list.length,1);
    // /!\ MODIFICATION: on teste désormais autant d'intervalle de semi-mode qu'il y a de point...
    for (i = 0; i < list.length; i++) {
        // minimum at i -> configuration (max at i+1, min at i+2) in 'list'
        if (i % 2 === 0) {
            // minimum at i
            m = list[i];
            // maximum at i+3
            M = list[MOD(i + 3, list.length)];
            // peut importe que M<m grâce à sextract
            max_entrop[i] = max_entropy(1, input, m, M, eps);
            // maximum at i -> configuration (min at i+1, max at i+2)
        } else {
            // maximum at i
            M = list[i];
            // minimum at i+3
            m = list[MOD(i + 3, list.length)];
            max_entrop[i] = max_entropy(null, input, M, m, eps);
        }
    }


    //***********************
    //  MERGING OF MODES    *
    //***********************

    // on cherche le semi-mode qui a le NFA le plus faible, soit l'entropie
    // plus élévée, donc max_entrop=seuil-entropie le plus petit
    min_max_entrop = max_entrop[0];
    imin = 0;
    for (i = 0; i < max_entrop.length; i++) {
        H = max_entrop[i];
        if (min_max_entrop > H) {
            min_max_entrop = H;
            imin = i;
        }
    }

    // Merge successively pairs of intervals
    while ((min_max_entrop < 0) && (max_entrop.length > 2)) {
        // on fusionne le mode dont le semi-mode a été choisi en éliminant
        // imin+1 et imin+2 des listes max_entrop et list
        // A CHANGER

        // on supprime le couple (min,max) par décalage
        if (imin < list.length - 2) {
            for (j = imin + 1; j < list.length - 2; j++) {
                list[j] = list[j + 2];
            }
            list.length -= 2;
        // /!\ il faut commencer la liste par un minimum!!!
        } else if (imin === list.length - 2) {
            list[0] = list[imin];
            list.length -= 2;
        // /!\ il faut commencer par un minimum!!!
        } else if (imin === list.length - 1) {
            for (j = 0; j < list.length - 2; j++) {
                list[j] = list[j + 2];
            }
            list.length -= 2;
        } else {
            console.log("\n\n!error!\n\n");
        }

        // update of max_entrop
        max_entrop.pop(); //->size-=2;
        max_entrop.pop(); //->size-=2;

        // A CHANGER car les changements de valeur d'entropie sont circulaires...
        for (i = 0; i < list.length; i++) {
            // problème: les dernières valeurs ne devraient pas changer
            // mais c le cas!!!!!
            if (i % 2 === 0) {
                // Minimum at i
                m = list[i];
                // Maximum at i+3
                M = list[MOD(i + 3, list.length)];
                max_entrop[i] = max_entropy(1, input, m, M, eps);
            // configuration (min at i+1, max at i+2)
            } else {
                // Maximum at i
                M = list[i];
                // Minimum at i+3
                m = list[MOD(i + 3, list.length)];
                max_entrop[i] = max_entropy(null, input, M, m, eps);
            }
        }

        // on cherche le semi-mode qui a le NFA le plus faible,
        // soit l'entropie plus élévée, donc max_entrop=seuil-entropie
        // le plus petit

        min_max_entrop = max_entrop[0];
        imin = 0;
        for (i = 0; i < max_entrop.length; i++) {
            H = max_entrop[i];
            if (min_max_entrop > H) {
                min_max_entrop = H;
                imin = i;
            }
        }
    }

    //********
    //*OUTPUT : list of all remaining minima without the bounds 0 and L-1
    //********

    for (i = 0; i < list.length; i++) {
        if ((i % 2 === 0)) {
            out.push(Math.round(list[i] + 0.5));
        }
    }

    list = null;
    return out;
}
*/
