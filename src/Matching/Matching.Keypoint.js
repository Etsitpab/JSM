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
     * @class Maxtching.Keypoint
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
    /** The algorithm used to compute the main(s) orientation(s) of the keypoint. */
    Keypoint.prototype.algorithm = "max";
    /** The factor size used to determine the associated region in the image. */
    Keypoint.prototype.factorSize = 12;
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
        var exp = Math.exp, c = -16 / wSize2;
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
                //hist[bin] += exp(c * r2) * dNorm[ij];
                hist[bin] += dNorm[ij];
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
