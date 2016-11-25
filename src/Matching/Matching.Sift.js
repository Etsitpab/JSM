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
