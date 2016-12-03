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
        this.matches = [];
        this.matchesList = [];
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
        computeMatches: function (S1, S2, crit, names) {
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
            var matches = Array.prototype.concat.apply([], tmps);

            this.matches = this.matches || [];
            this.matches[S1] = this.matches[S1] || [];
            this.matches[S1][S2] = matches.sort(global.Match.compar);
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
        thresholdMatches: function (S1, S2, threshold, c) {
            threshold = threshold || this.threshold;

            Tools.tic();
            var matchesList = [],
                keypoints1 = this.scaleSpaces[S1].keypoints,
                keypoints2 = this.scaleSpaces[S2].keypoints,
                criterion = global.Keypoint.prototype.criterion;

            if (criterion === "NN-AC" || criterion === "AC") {
                threshold /= keypoints1.length * keypoints2.length;
            }

            var k, ek, matches = this.matches[S1][S2];
            if (c) {
                matches = matches[c];
            }
            for (k = 0, ek = matches.length; k < ek; k++) {
                if (matches[k].distance < threshold) {
                    matchesList.push(matches[k]);
                }
            }

            this.matchesList[S1] = this.matchesList[S1] || [];
            this.matchesList[S1][S2] = matchesList;
            console.log("\t", "matchesList[" + S1 + "][" + S2 + "]:",
                        matchesList.length, "matches.");
            console.log("Threshold matches time : ", Tools.toc(), "ms");

            return this;
        },
        /** Select find an homography fitting the matches.
         */
        detectHomography: function (S1, S2, c) {
            // return H such that X2_hat = H x X1
            var estimateHomography = function (m) {
                var X1 = [], X2 = [];
                m.forEach(function(v) {
                    X1.push(v.k1.x, v.k1.y, 1);
                    X2.push(v.k2.x, v.k2.y, 1);
                });
                X1 = Matrix.toMatrix(X1).reshape(3, m.length).transpose();
                X2 = Matrix.toMatrix(X2).reshape(3, m.length).transpose();
                if (X1.size(0) !== X2.size(0)) {
                    throw new Error();
                }
                var x1 = X1.get([], 0), y1 = X1.get([], 1),
                    x2 = X2.get([], 0), y2 = X2.get([], 1);

                var z1 = X1.size(1) < 3 ? Matrix.ones(x1.numel(), 1) : X1.get([], 2),
                    z2 = X2.size(1) < 3 ? Matrix.ones(x2.numel(), 1) : X2.get([], 2);

                var x2p = x2["./"](z2), y2p = y2["./"](z2);
                var om = Matrix.ones(x1.numel(), 1).uminus(),
                    z  = Matrix.zeros(x1.numel(), 3),
                    m1 = Matrix.cat(1, x1.uminus(), y1.uminus(), om);
                var A = Matrix.cat(1,
                    m1, z, x2p[".*"](x1), x2p[".*"](x1), x2p,
                    z, m1, y2p[".*"](x1), y2p[".*"](y1), y2p
                ).transpose().reshape(9, 2 * x1.numel()).transpose();//.display();
                var [U, S, V] = A.svd();
                var H = V.get([], 8).reshape(3, 3).transpose();
                H["/="](H.get(2, 2));
                var X2h = H.mtimes(X1.transpose()).transpose();
                var err = X2["-"](X2h).abs().mean();
                return [H, err.getDataScalar()];
            };
            /*
            Given:
                data – a set of observed data points
                model – a model that can be fitted to data points
                n – the minimum number of data values required to fit the model
                k – the maximum number of iterations allowed in the algorithm
                t – a threshold value for determining when a data point fits a model
                d – the number of close data values required to assert that a model fits well to data

            Return:
                bestfit – model parameters which best fit the data (or nul if no good model is found)
            */
            var dist = function (k1, k2) {
                var x = k1.x - k2.x, y = k1.y - k2.y;
                return Math.sqrt(x * x + y * y);
            };

            var isValid = function (kr, kc, mat) {
                var kp = kr.project(mat);
                var dmin = Math.min(kp.sigma, kc.sigma) * kr.factorSize / 10;
                return dist(kp, kc) < dmin ? true : false;
            };
            var getPotentialInliers = function (matches, n) {
                var maybeinliers = Matrix.randperm(matches.length, n);
                var out = [], d = maybeinliers.getData();
                for (var m = 0, me = d.length; m < me; m++) {
                    out.push(matches[d[m]]);
                }
                return out;
            };
            function uniq(a) {
                var seen = {};
                return a.filter(function(item) {
                    var hash = "" + Math.round(item.k1.x) + Math.round(item.k1.y) + Math.round(item.k2.x) + Math.round(item.k2.y);
                    return seen.hasOwnProperty(hash) ? false : (seen[hash] = true);
                });
            }
            var ransac = function (matches) {
                // remove matches duplicated due to multiple orientation detection.
                matches = uniq(matches);
                // matches = matches.slice(0, 300);
                var n = 5, k = 1e4, d = n;
                if (matches.length < n) {
                    return [undefined, []];
                }
                var iterations = 0;
                var bestfit = undefined;
                var besterr = Infinity;
                var bestMatches = [];
                var alsoinliers;
                while (iterations < k) {
                    // Here we do some wird computation to give more weight to good matches);
                    var bestMatches = matches.slice(0, Math.min(2 * n + iterations / k * 50), 50);
                    var maybeinliers = getPotentialInliers(bestMatches, n);
                    var [maybemodel, err] = estimateHomography(maybeinliers);
                    // This threshold is here to avoid useless checks;
                    if (err < 10) {
                        alsoinliers = [];
                        for (var m = 0, me = matches.length; m < me; m++) {
                            var match = matches[m];
                            if (isValid(match.k1, match.k2, maybemodel)) {
                                for (var i = 0, ie = maybeinliers.length; i < ie; i++) {
                                    if (match === maybeinliers[i]) {
                                        break;
                                    }
                                }
                                // Point not in maybeinliers so we add point to alsoinliers
                                if (i === ie) {
                                    alsoinliers.push(match);
                                }
                            }
                        }

                        if (alsoinliers.length >= d) {
                            // this implies that we may have found a good model
                            // now test how good it is
                            // thiserr = a measure of how well model fits these points
                            var [bettermodel, thiserr2] = estimateHomography(maybeinliers.concat(alsoinliers));
                            // Home made fit measure.
                            var thiserr = thiserr2 / alsoinliers.length;
                            if (thiserr < besterr) {
                                bestfit = bettermodel;
                                besterr = thiserr;
                                bestMatches = maybeinliers.concat(alsoinliers);
                            }
                        }
                    }
                    iterations++;
                }
                return [bestfit, bestMatches];
            }

            var k, ek, matches = this.matches[S1][S2];
            if (c) {
                matches = matches[c];
            }
            var [H, matches] = ransac(S.matches[0][1][c].slice(0, 300));
            if (H !== undefined) {
                this.matchesValidation(H, 0, 1, c)
                matches = [];
                var candidates = S.matches[0][1][c];
                for (var m = 0, me = candidates.length; m < me; m++) {
                    if (candidates[m].isValid) {
                        matches.push(candidates[m]);
                    }
                }
            }
            this.matchesList[S1] = this.matchesList[S1] || [];
            this.matchesList[S1][S2] = matches;
            return H;
        },
        /** Apply succesively the following functions with default parameters :
         *
         * + {@link Matching.Sift#computeScaleSpace},
         * + {@link Matching.Sift#applyScaleSpaceThreshold},
         * + {@link Matching.Sift#computeMainOrientations},
         * + {@link Matching.Sift#computeDescriptors},
         * + {@link Matching.Sift#computeMatches},
         * + {@link Matching.Sift#thresholdMatches}.
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
                .computeMatches(S1, S2)
                .thresholdMatches(S1, S2);
            console.log("Global match time : ", Tools.toc(), "ms");
            return this;
        },
        /** Export matches list between two scalescapes to string.
         * @param {Number} S1
         * @param {Number} S2
         * @param {Number} [criterion]
         * @return {String}
         */
        matchesToString: function (S1, S2, c) {
            var matches = this.matches[S1][S2];
            matches = (c !== undefined) ? matches[c] : matches;

            var k, ek, str = "";
            for (k = 0, ek = matches.length; k < ek; k++) {
                str += matches[k].toString() + "\n";
            }
            return str;
        }
    };

    global.Sift = Sift;

})(Matching);
