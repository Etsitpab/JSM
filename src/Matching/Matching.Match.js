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

    /** This class provides object to store matches.
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
