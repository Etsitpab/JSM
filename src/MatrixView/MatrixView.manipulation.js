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

/** @class MatrixView */

(function (MatrixView, MatrixView_prototype) {
    'use strict';

    /**
     * Allow to select an subpart of the MatrixView on each dimension.
     *
     * __Also see:__
     * {@link MatrixView#selectIndicesDimension},
     * {@link MatrixView#selectBooleanDimension},
     * {@link MatrixView#selectDimension}.
     *
     *     // Create view
     *     var v = new MatrixView([3, 3]);
     *     var d = [0, 1, 2, 3, 4, 5, 6, 7, 8];
     *     // Select first column
     *
     *     v.select([], [0]);
     *     var row = v.extract(d); // row = [0, 1, 2]
     *     // Reset view in its original form
     *     v.restore();
     *
     *     // Select first column
     *     v.select(0);
     *     var col = v.extract(d); // col = [0, 3, 6]
     *     v.restore();
     *
     *     // Reverse the order of columns
     *     v.select([], [-1, 0]);
     *     var mat = v.extract(d); // mat = [6, 7, 8, 3, 4, 5, 0, 1, 2]
     *     v.restore();
     *
     * @param {Array|Integer|Integer[]|Integer[][]|Boolean[]} select
     *  For each dimension, can be an array-like
     *  formated as:
     *
     *  + `[]`: select all the values along the dimension,
     *  + `startValue`: select one value along the dimension,
     *  + `[start, end]`: select all values between start and end values,
     *  + `[start, step, end]`: select all values from start to end with a step,
     *  + `[[indices list]]`: an indice list,
     *  + `[[boolean array]]`: a boolean array.
     *
     * @chainable
     */
    MatrixView_prototype.select = function () {
        var T = Tools;
        var i, ie;
        for (i = 0, ie = arguments.length; i < ie; i++) {
            var arg = arguments[i];
            // Arg is an array
            if (T.isArrayLike(arg)) {

                // Arg is an array containing an array [[<ind>]]
                if (T.isArrayLike(arg[0])) {
                    this.selectIndicesDimension(i, arg[0]);
                    // Arg is a boolean array [<boolean>]
                } else if (T.isArrayOfBooleans(arg)) {
                    this.selectBooleanDimension(i, arg);
                    // Arg is a colon operator but not [<start, step, end>]
                } else if (arg.length !== 0) {
                    this.selectDimension(i, arg);
                }

                // Arg is just an integer <integer>
            } else if (T.isInteger(arg)) {
                this.selectDimension(i, arg);
                // Otherwise
            } else {
                throw new Error("MatrixView.select: Invalid selection.");
            }
        }
        return this;
    };

    /**
     * Defines how iterator will scan the view
     *
     * __Also see:__
     * {@link MatrixView#ipermute}.
     *
     *     // Create view
     *     var v = new MatrixView([2, 2, 2]);
     *     var d = [0, 1, 2, 3, 4, 5, 6, 7];
     *
     *     // Reverse the order of columns
     *     v.permute([2, 1, 0]);
     *     var mat = v.extract(d); // mat = [0, 4, 2, 6, 1, 5, 3, 7]
     *
     * @param {Integer[]} dimensionOrder Defines the order in which
     * the dimensions are traversed.
     *
     * @method permute
     *
     * @chainable
     */
    MatrixView_prototype.permute = function (dim) {
        var errMsg = this.constructor.name + '.permute: ';
        if (dim.length < this.getDimLength()) {
            throw new Error(errMsg + 'Dimension permutation is invalid.');
        }

        dim = dim.slice();
        var ndims = dim.length;
        var i, ie, j;
        for (i = 0; i < ndims; i++) {
            var t = false;
            for (j = 0; j < ndims; j++) {
                if (dim[j] === i) {
                    t = true;
                }
            }
            if (t === false) {
                throw new Error(errMsg + 'Dimension permutation is invalid.');
            }
        }

        // Reorder the view
        for (i = 0, ie = ndims; i < ie; i++) {
            j = i;
            while (true) {
                var k = dim[j];
                dim[j] = j;
                if (k === i) {
                    break;
                } else {
                    this.swapDimensions(j, k);
                }
                j = k;
            }
        }
        return this;
    };

    /**
     * Inverse dimension permutation.
     *
     * __Also see:__
     * {@link MatrixView#permute}.
     *
     *     // Create view
     *     var v = new MatrixView([2, 2, 2]);
     *     var d = [0, 1, 2, 3, 4, 5, 6, 7];
     *
     *     // Reverse the order of columns
     *     v.permute([2, 1, 0]);
     *     v.ipermute([2, 1, 0]);
     *     var mat = v.extract(d); // mat =  [0, 1, 2, 3, 4, 5, 6, 7]
     *
     * @param {Integer[]} dim List of dimension on which perform inverse permutation.
     *
     * @method ipermute
     * @chainable
     */
    MatrixView_prototype.ipermute = function (dim) {

        // Create a dim indices Array
        var i, ie, indices = [];
        for (i = 0, ie = dim.length; i < ie; i++) {
            indices[i] = i;
        }

        // Get dim sorted indices.
        var f = function (a, b) {
            return dim[a] - dim[b];
        };

        return this.permute(indices.sort(f));
    };

    /**
     * Rotates MatrixView counterclockwise by a multiple of 90 degrees.
     *
     *     // Create view
     *     var v = new MatrixView([2, 2]);
     *     var d = [0, 1, 2, 3];
     *
     *     // Rotate matrix
     *     var mat = v.rot90().extract(d); // mat = [2, 0, 3, 1]
     *
     * @param {Integer} [k=1] Defines the number of 90 degrees rotation.
     *
     * @method rot90
     * @chainable
     */
    MatrixView_prototype.rot90 = function (k) {
        var errMsg = this.constructor.name + '.rot90: ';

        // Check arguments
        switch (typeof k) {
        case 'number':
            if (!Tools.isInteger(k)) {
                throw new Error(errMsg + 'Argument must be an integer.');
            }
            k %= 4;
            if (k < 0) {
                k += 4;
            }
            break;
        case 'undefined':
            k = 1;
            break;
        default:
            throw new Error(errMsg + 'Wrong argument type.');
        }

        // Rotate
        switch (k) {
        case 1:
            return this.swapDimensions(0, 1).flipud();
        case 2:
            return this.flipud().fliplr();
        case 3:
            return this.swapDimensions(0, 1).fliplr();
        }
        return this;
    };

    /**
     * Flip matrix dimension.
     *
     * __Also See:__ {@link MatrixView#flipud}, {@link MatrixView#fliplr}.
     *
     * @method flipdim
     *
     * @param {Integer} d Dimension to reverse.
     *
     * @chainable
     */
    MatrixView_prototype.flipdim = function (d) {
        return this.selectDimension(d, [-1, 0]);
    };

    /**
     * Flip matrix left to right.
     *
     * __Also See:__ {@link MatrixView#flipdim}, {@link MatrixView#flipud}.
     *
     * @method fliplr
     *
     * @chainable
     */
    MatrixView_prototype.fliplr = function () {
        return this.select([0, -1], [-1, 0]);
    };

    /**
     * Flip matrix up to down.
     *
     * __Also See:__ {@link MatrixView#flipdim}, {@link MatrixView#fliplr}.
     *
     * @method flipud
     *
     * @chainable
     */
    MatrixView_prototype.flipud = function () {
        return this.select([-1, 0], [0, -1]);
    };

    /**
     * Move the required dimension to first dimension.
     *
     * @method setWorkingDimension
     * @chainable
     * @todo Remove this ugly function.
     * @deprecated do not rely on the existence of this function.
     */
    MatrixView_prototype.setWorkingDimension = function (dim) {
        if (dim >= this.getDimLength()) {
            throw new Error('Invalid dimension.');
        }
        var perm = [];
        var j, je = this.getDimLength();
        for (j = 0; j < je; j++) {
            perm[j] = j;
        }
        perm = perm.splice(dim, 1).concat(perm);

        return this.permute(perm);
    };

})(MatrixView, MatrixView.prototype);
