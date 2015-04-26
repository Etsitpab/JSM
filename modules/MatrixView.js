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

/** A ND-View on any Array.
 *
 * This class provides a multi-dimensional interpretation of any Array.
 *
 * It also defines tools such as iterators to deal with it.
 *
 *
 * @constructor Create a View, which can be used with any Array.
 *
 *     // Create a 3D View of size 2x3x4:
 *     var view = new MatrixView([2,3,4]);
 *
 * @param {Array | MatrixView} arg
 *  Can be:
 *
 *  + an `Array`: the size the matrix.
 *  + a `MatrixView`: perform a copy of this view.
 * 
 * @todo set most of the getters as protected?
 */
function MatrixView(arg) {
    'use strict';


    //////////////////////////////////////////////////////////////////
    //                   Initialization Functions                   //
    //////////////////////////////////////////////////////////////////


    var first;          // Start points for each dimension
    var step;           // Step between two values
    var size;           // Number of points
    var indices;        // Selected indices, instead of first/step/size

    var views = [];     // stack of Views
    var initial = {};   // backup of the original View

    // Initialization from size
    var setFromSize = function (sizeIn) {
        size = Tools.checkSize(sizeIn);
        indices = [];

        // Create view
        var i, ie = size.length;
        for (first = [], step = [], i = 0; i < ie; i++) {
            first[i] = 0;
            step[i]  = (size[i - 1] || 1) * (step[i - 1] || 1);
        }

        // Save original view
        initial = {
            first: first.slice(),
            step: step.slice(),
            size: size.slice(),
            indices: []
        };
        return this;
    }.bind(this);

    // Copy constructor
    var setFromView = function (view) {
        var i, ndims = view.getDimLength();
        first = [];
        step = [];
        size = [];
        indices = [];
        for (i = 0; i < ndims; i++) {
            first.push(view.getFirst(i));
            step.push(view.getStep(i));
            size.push(view.getSize(i));
            if (view.isIndicesIndexed(i)) {
                indices.push(view.getIndices(i));
            }
        }
        return this;
    }.bind(this);


    //////////////////////////////////////////////////////////////////
    //                  Stack of Views manipulation                 //
    //////////////////////////////////////////////////////////////////

    /** Save the current MatrixView on the Stack.
     *
     * See also:
     *  {@link MatrixView#restore}.
     *
     * @method save
     * @chainable
     */
    this.save = function () {
        views.push(new MatrixView(this));
        return this;
    }.bind(this);

    /** Restore the previous MatrixView from the Stack.
     *
     * If there is no stacked view, restore the initial view.
     *
     * See also:
     *  {@link MatrixView#save}.
     *
     *     // Declare a view
     *     var v = new MatrixView([5]);
     *
     *     // Reverse and save it
     *     v.flipdim(1).save();
     *
     *     // Select some elements
     *     v.selectDimension(1, [0, 2, 4]);
     *
     *     // Restore the previous view, and then the initial View
     *     v.restore();
     *     v.restore();
     *
     * @method restore
     * @chainable
     */
    this.restore = function () {
        var v = views.pop();
        if (Tools.isSet(v)) {
            setFromView(v);
        } else {
            first = initial.first.slice();
            step  = initial.step.slice();
            size  = initial.size.slice();
            indices = []; // = initial.indices.slice();
        }
        return this;
    }.bind(this);


    //////////////////////////////////////////////////////////////////
    //                         Basics Getters                       //
    //////////////////////////////////////////////////////////////////

    /** Get the number of dimensions.
     *
     *     // Declare a 3D View
     *     var v = new MatrixView([5, 5, 5]);
     *
     *     // Get its number of dimensions
     *     var nDims = v.getDimLength();   // nDims is: 3
     *
     * @return {Number}
     *
     * @todo rename
     */
    var getDimLength = function () {
        return size.length;
    };

    /** Get the number of elements indexed by the View.
     *
     *     // Declare a view
     *     var v = new MatrixView([5, 5, 5]);
     *
     *     // Get its length
     *     var n = v.getLength();      // n is: 125
     *
     * @return {Number}
     *
     * @todo length vs. numel
     */
    var getLength = function () {
        var i, ie = getDimLength(), nel;
        for (i = 0, nel = 1; i < ie; i++) {
            nel *= size[i];
        }
        return nel;
    };

    /** Get the size of the View.
     *
     * Get the number of elements along a given dimension or along all dimensions.
     *
     *     // Create a View
     *     var v = new MatrixView([2, 3, 4]);
     *
     *     // Get its size
     *     var size = v.getSize();     // size is: [2, 3, 4]
     *
     *     // Get size along dimension 1
     *     var size = v.getSize(1);    // size is: 3
     *
     * @param {Number} [dim]
     *  If specified, get the size along this dimension.
     *
     * @return {Array | Number}
     *
     *  + If `dimension` is given: number of elements along the specified dimension.
     *  + If no `dimension`: array containng the number of element along each dimension.
     */
    var getSize = function (d) {
        if (!Tools.isSet(d)) {
            return size.slice();
        }
        if (!Tools.isInteger(d, 0)) {
            throw new Error('MatrixView.getSize: invalid dimension.');
        }
        return (Tools.isSet(size[d])) ? size[d] : 1;
    };

    /** Test whether the view is indexed by indices.
     *
     * See also:
     *  {@link MatrixView#selectIndicesDimension},
     *  {@link MatrixView#selectDimension}.
     *
     *     // Create a View, shuffle indices along the first dimension
     *     var v = new MatrixView([3, 4]);
     *     v.selectIndicesDimension(0, [0, 2, 1]);
     *
     *     // Check which dimension is indexed by indices
     *     var test = v.isIndicesIndexed(0);    // test is: true
     *     test = v.isIndicesIndexed(1);        // test is: false
     *
     * @param {Number} dim
     *  Dimension to be tested.
     * @return {Boolean}
     *  True iff the given dimension is indexed by indices.
     */
    var isIndicesIndexed = function (d) {
        if (!Tools.isInteger(d, 0)) {
            throw new Error('MatrixView.isIndicesIndexed: invalid dimension.');
        }
        return Tools.isSet(indices[d]);
    };

    /** If indexed by indices: get the selected indices.
     *
     * See also:
     *  {@link MatrixView#isIndicesIndexed},
     *  {@link MatrixView#getSteps}.
     *
     *     // Create a View and select indices along 2nd dim.
     *     var v = new MatrixView([2, 3]);
     *     v.selectIndicesDimension(1, [0, 2, 1]);
     *
     *     // Retrieve the indices along dimension 1
     *     var indices = v.getIndices(1);       // indices is: [0, 4, 2]
     *
     * @param {Number} dim
     *  Dimension along which to get the indice.
     * @return {Array}
     *  Array containing the selected indices of the View along the given dimension.
     *
     * @todo check the example [0, 4, 2]
     */
    var getIndices = function (d) {
        if (!Tools.isInteger(d, 0)) {
            throw new Error('MatrixView.getIndices: invalid dimension.');
        }
        if (!isIndicesIndexed(d)) {
            throw new Error('MatrixView.getIndices: ' +
                            'dimension isn\'t indexed by indices.');
        }
        return indices[d].slice();
    };

    /** If indexed by indices: get the steps to be used to explore the array.
     *
     * See also:
     *  {@link MatrixView#isIndicesIndexed},
     *  {@link MatrixView#getIndices}.
     *
     *     // Create a View and select indices along 2nd dim.
     *     var v = new MatrixView([2, 3]);
     *     v.selectIndicesDimension(1, [0, 2, 1]);
     *
     *     // Retrieve the steps along dimension 1
     *     var steps = v.getSteps(1);      // steps is: [0, 4, -2, -Infinity]
     *
     * @param {Number} dim
     *  Dimension along which to compute the step.
     *
     * @return {Array}
     *  Array containing the list of steps along the specified dimension.
     *  Last element is -Infinity to easily detect the end.
     *
     * @todo check the example; return NaN as last?
     */
    var getSteps = function (d) {
        if (!Tools.isInteger(d, 0)) {
            throw new Error('MatrixView.getSteps: invalid dimension.');
        }
        if (!isIndicesIndexed(d)) {
            throw new Error('MatrixView.getSteps: ' +
                            'Dimension isn\'t indexed with indices.');
        }
        var steps = indices[d].slice();
        var i;
        for (i = steps.length - 1; i > 0; i--) {
            steps[i] -= steps[i - 1];
        }
        // steps.push(-Infinity);
        var last = indices[d][indices[d].length - 1];
        steps.push(-(last + 1));
        steps[0] = 0;
        return steps;
    };

    /** Number of elements in the original View (i.e. when it was created).
     *
     * See also:
     *  {@link MatrixView#getInitialSize}.
     *
     *     // Create a View
     *     var v = new MatrixView([3, 3]);
     *
     *     // Number of elements
     *     var nel = v.getLength();    // nel is: 9
     *
     *     // Select some elements along dimension 1
     *     v.selectIndicesDimension(1, [0, 2]);
     *
     *     // Number of elements
     *     nel = v.getLength();        // nel is: 6
     *     nel = v.getInitialLength(); // nel is: 9
     *
     * @return {Number}
     *
     * @todo rename?
     */
    var getInitialLength = function () {
        var i, ie = initial.size.length, nel;
        for (i = 0, nel = 1; i < ie; i++) {
            nel *= initial.size[i];
        }
        return nel;
    };

    /** Size of the original View (i.e. when it was created).
     *
     * See also:
     *  {@link MatrixView#getInitialLength}.
     *
     *     // Create a View
     *     var v = new MatrixView([3, 3]);
     *
     *     // Select some elements along dimension 1
     *     v.selectIndicesDimension(1, [0, 2]);
     *
     *     // Size
     *     var size = v.getSize();     // size is: [3, 2]
     *     size = v.getInitialSize();  // size is: [3, 3]
     *
     * @return {Array}
     */
    var getInitialSize = function () {
        return initial.size.slice();
    };

    /** Convert a ND-indice into a linear indice.
     *
     *     // Create a View
     *     var v = new MatrixView([3, 2]);
     *
     *     // Linear index of (1,1)
     *     var index = v.getIndex([1, 1]);     // index is: 4
     *
     * @param {Array} coordinates
     *  A ND-indice, e.g. (x,y) in a 2D Matrix.
     *
     * @return {Number}
     *  Linear indice k associated to (x,y).
     *
     * @todo useful for a View (we don't know the size)? What if indices-indexed?
     */
    var getIndex = function (coordinates) {
        var ndims = getDimLength();
        var l = coordinates.length;
        if (l > 1 && l !== ndims) {
            throw new Error('MatrixView.getIndex: invalid ND-index.');
        }
        var i, indice;
        for (i = 0, indice = 0; i < l; i++) {
            if (coordinates[i] < 0 || coordinates[i] >= size[i]) {
                throw new Error('MatrixView.getIndex: invalid index.');
            }
            indice += first[i] + coordinates[i] * step[i];
        }
        return indice;
    };

    /** Indice of the first selected element on a given dimension.
     *
     * See also:
     *  {@link MatrixView#getStep},
     *  {@link MatrixView#getEnd},
     *  {@link MatrixView#getSize}.
     *
     *     // Create a View and select a part of it
     *     var v = new MatrixView([5, 2]);
     *     v.select([2, 3]);
     *
     *     // Get first values
     *     var first = v.getFirst(0);  // first is: 2
     *     first = v.getFirst(1);      // first is: 0
     *
     * @param {Number} dim
     *  Dimension along which to get the indice.
     *
     * @return {Number}
     *  Indice of the first selected element.
     *
     * @todo what if indices-indexed?
     */
    var getFirst = function (d) {
        if (!Tools.isInteger(d, 0)) {
            throw new Error('MatrixView.getFirst: invalid dimension.');
        }
        return Tools.isSet(first[d]) ? first[d] : 0;
    };

    /** Downsampling step along a given dimension.
     *
     * See also:
     *  {@link MatrixView#getFirst},
     *  {@link MatrixView#getEnd},
     *  {@link MatrixView#getSize}.
     *
     *     // Create view
     *     var v = new MatrixView([5, 2]);
     *
     *     // Select a sub part
     *     v.select([2, 3]);
     *
     *     // Get step values
     *     var step = v.getStep(0); // Return 1
     *     step = v.getStep(1);     // Return 5
     *
     * @param {Number} dim
     *  Dimension along with to get the step.
     *
     * @return {Number}
     *  Indices step between 2 values.
     */
    var getStep = function (d) {
        if (!Tools.isInteger(d, 0)) {
            throw new Error('MatrixView.getStep: invalid dimension.');
        }
        if (isIndicesIndexed(d)) {
            throw new Error('MatrixView.getStep: dimension is indexed by indices.');
        }
        return Tools.isSet(step[d]) ? step[d] : 1;
    };

    /** Indice+1 of the last selected element on a given dimension.
     *
     * See also:
     *  {@link MatrixView#getFirst},
     *  {@link MatrixView#getStep},
     *  {@link MatrixView#getSize}.
     *
     *     // Create a View and select a part of it
     *     var v = new MatrixView([5, 2]);
     *     v.select([[4, 2, 0]]);
     *
     *     // Get end values
     *     var end = v.getEnd(0);  // end is: -Infinity
     *     end = v.getEnd(1);      // end is: 10
     *
     * @param {Number} dim
     *  Dimension along which to get the indice.
     *
     * @return {Number}
     *  Indice+1 of the last selected element.
     *
     * @todo indice-indexed case (now return -Inf)?
     */
    var getEnd = function (d) {
        if (!Tools.isInteger(d, 0)) {
            throw new Error('MatrixView.getEnd: invalid dimension.');
        }
        if (isIndicesIndexed(d)) {
            return -1;
        }
        var s = Tools.isSet(size[d]) ? size[d] : 1;
        return (first[d] || 0) + s * (step[d] || 1);
    };

    this.getDimLength     = getDimLength;
    this.getLength        = getLength;
    this.getInitialLength = getInitialLength;
    this.getInitialSize   = getInitialSize;

    this.getIndex = getIndex;
    this.getFirst = getFirst;
    this.getStep = getStep;
    this.getSteps = getSteps;
    this.getEnd = getEnd;
    this.getSize = getSize;
    this.isIndicesIndexed = isIndicesIndexed;
    this.getIndices = getIndices;


    //////////////////////////////////////////////////////////////////
    //                      Basics manipulations                    //
    //////////////////////////////////////////////////////////////////

    /** Add a singleton dimensions at the end.
     *
     * @param {Number} n
     *  Number of singleton dimension to be added.
     *
     * @chainable
     * @private
     *
     * @todo Other name (in matrix)? Not private? Remove?
     */
    var pushSingletonDimensions = function (n) {
        if (!Tools.isInteger(n, 0)) {
            throw new Error('MatrixView.pushSingletonDimensions: invalid dimension.');
        }
        var i;
        for (i = 0; i < n; i++) {
            first.push(0);
            step.push(1);
            size.push(1);
        }
        return this;
    }.bind(this);

    /** Select slices of the View along a dimension.
     *
     * See also:
     *  {@link MatrixView#selectIndicesDimension},
     *  {@link MatrixView#swapDimensions},
     *  {@link MatrixView#shiftDimension}.
     *
     *     // Create a View
     *     var v = new MatrixView([6, 4]);
     *
     *     // Along first dim., select one value out of 2, from #1 to #5
     *     v.selectDimension(0, [1, 2, 5]);
     *
     *     //  | 0  6 12 18 |
     *     //  | 1  7 13 19 |
     *     //  | 2  8 14 20 |      | 1  7 13 19 |
     *     //  | 3  9 15 21 |  ->  | 3  9 15 21 |
     *     //  | 4 10 16 22 |      | 5 11 17 23 |
     *     //  | 5 11 17 23 |
     *
     * @param {Number} dim
     *  Dimension along which the selection is performed.
     *
     * @param {Array | Number} selection
     *  Can be:
     *
     *  + `[]`: select all.
     *  + `[indice]` or `indice`: select only 1 slice.
     *  + `[start, end]`: select all the slices from `start` to `end` indices.
     *  + `[start, step, end]`: same, but select only 1 slice out of `step`.
     *
     *  Negative values are interpreted as indices from the end of the array:
     *  the last indice is `-1`, then `-2`, etc.
     *
     * @chainable
     */
    var selectDimension = function (d, sel) {
        if (!Tools.isInteger(d, 0)) {
            throw new Error('MatrixView.select: invalid dimension.');
        }
        sel = Tools.checkColon(sel, getSize(d));

        if (!isIndicesIndexed(d)) {
            first[d] += sel[0] * step[d];
            step[d]  *= sel[1];
            size[d]   = Math.floor(Math.abs((sel[2] - sel[0]) / sel[1])) + 1;
        } else {
            var i, ie, s, ind = indices[d], indOut = [];
            for (i = sel[0], ie = sel[2], s = sel[1]; i <= ie; i += s) {
                indOut.push(ind[i]);
            }
            first[d] = indOut[0];
            indices[d] = indOut;
            size[d] = indOut.length;
        }

        return this;
    }.bind(this);

    /** Select slices of the View along a dimension, indexing by indices.
     *
     * See also:
     *  {@link MatrixView#selectDimension},
     *  {@link MatrixView#swapDimensions},
     *  {@link MatrixView#shiftDimension}.
     *
     *     // Create view
     *     var v = new MatrixView([6, 4]);
     *
     *     // Along first dim, select slices of indices 4, 3, and 1
     *     v.selectIndicesDimension(0, [4, 3, 1]);
     *
     *     //  | 0  6 12 18 |
     *     //  | 1  7 13 19 |
     *     //  | 2  8 14 20 |      | 4 10 16 22 |
     *     //  | 3  9 15 21 |  ->  | 3  9 15 21 |
     *     //  | 4 10 16 22 |      | 1  7 13 19 |
     *     //  | 5 11 17 23 |
     *
     * @param {Number} dim
     *  Dimension along which the selection is performed.
     *
     * @param {Array | Number} selection
     *  Indices to be selected.
     *
     * @chainable
     */
    var selectIndicesDimension = function (d, ind) {

        if (!Tools.isInteger(d, 0)) {
            throw new Error('MatrixView.selectIndicesDimension: Dimension ' +
                            'must be a positive integer.');
        }

        if (!Tools.isArrayOfIntegers(ind, 0, getSize(d) - 1)) {
            throw new Error('MatrixView.selectIndicesDimension: Invalid index.');
        }
        ind = Array.prototype.slice.apply(ind);

        var i, ie;
        if (!isIndicesIndexed(d)) {
            var f = getFirst(d), dx = getStep(d);
            for (i = 0, ie = ind.length; i < ie; i++) {
                ind[i] *= dx;
                ind[i] += f;
            }
        } else {
            for (i = 0, ie = ind.length; i < ie; i++) {
                ind[i] = indices[ind[i]];
            }
        }
        if (ind[0] === undefined) {
            ind[0] = -1;
        }
        first[d]   = ind[0];
        step[d]    = 1;
        size[d]    = ind.length;
        indices[d] = ind;
        return this;
    }.bind(this);

    /** Select slices of the View along a dimension, indexing by booleans.
     *
     * See also:
     *  {@link MatrixView#selectDimension},
     *  {@link MatrixView#selectIndicesDimension},
     *  {@link MatrixView#swapDimensions},
     *  {@link MatrixView#shiftDimension}.
     *
     * @param {Number} dimension
     *  Dimension along which the selection is performed.
     *
     * @param {Array} selection
     *  Array of boolean of the same size as the dimension `dim`.
     *
     * @chainable
     */
    var selectBooleanDimension = function (d, boolInd) {
        if (!Tools.isInteger(d, 0)) {
            throw new Error('MatrixView.selectBooleanDimension: invalid dimension.');
        }
        if (boolInd.length !== getSize(d)) {
            throw new Error('MatrixView.selectBooleanDimension: array dimensions mismatch.');
        }

        var i, ei, o, ind = new Array(boolInd.length);
        for (i = 0, o = 0, ei = boolInd.length; i < ei; i++) {
            if (boolInd[i]) {
                ind[o] = i;
                o += 1;
            }
        }
        return this.selectIndicesDimension(d, ind.slice(0, o));
    }.bind(this);

    var swap = function (tab, i, j) {
        var tmp = tab[i];
        tab[i] = tab[j];
        tab[j] = tmp;
    };
    /** Swap (transpose) 2 dimensions.
     *
     * Note that the View is modified: it is an on-place transposition.
     *
     * See also:
     *  {@link MatrixView#shiftDimension}.
     *
     * @param {Number} dimA
     *  First dimension to be swapped.
     *
     * @param {Number} dimB
     *  Second dimension to be swapped.
     *
     *     // Create a View and transpose it.
     *     var v = new MatrixView([4, 3]);
     *     v.swapDimensions(0, 1);
     *
     *     //  | 0 4  8 |
     *     //  | 1 5  9 |      | 0  1  2  3 |
     *     //  | 2 6 10 |  ->  | 4  5  6 10 |
     *     //  | 3 7 11 |      | 8  9 10 11 |
     *
     * @todo rename it as a transposition?
     *
     * @chainable
     */
    var swapDimensions = function (dimA, dimB) {
        var ndims = getDimLength();
        if (!Tools.isInteger(dimA, 0)) {
            throw new Error('MatrixView.swapDimensions: invalid dimensions.');
        }
        if (!Tools.isInteger(dimB, 0)) {
            throw new Error('MatrixView.swapDimensions: invalid dimensions.');
        }

        var n = Math.max(dimA, dimB) + 1 - ndims;
        if (n > 0) {
            pushSingletonDimensions(n);
        }
        swap(first, dimA, dimB);
        swap(step, dimA, dimB);
        swap(size, dimA, dimB);
        swap(indices, dimA, dimB);

        return this;
    }.bind(this);

    /** Shift dimensions of the matrix, circularly.
     *
     * See also:
     *  {@link MatrixView#swapDimensions}.
     *
     *     // Create view
     *     var v = new MatrixView([1, 1, 3]);
     *
     *     // Tranpose the view
     *     var shift = v.shiftDimension();
     *     var size = v.getSize();      // size is: [3, 1]
     *
     * @param {Number} [n]
     *  Shift size:
     *
     *  + if omitted: first singleton dimensions are removed.
     *  + if positive: shift to the right, last `n` dimensions becomes the first ones.
     *  + if negative: shift to the left, first `n` dimensions becomes the last ones.
     *
     * @todo make it consistent with Matlab & the doc; allow 1D array?
     *
     * @chainable
     */
    var shiftDimension = function (n) {
        var i;
        if (!Tools.isSet(n)) {
            for (i = 0; size.length > 0 && size[0] === 1; i++) {
                first.shift();
                step.shift();
                size.shift();
            }
            // TODO: allow it?
            if (getDimLength() === 1) {
                first.push(0);
                step.push(1);
                size.push(1);
            }
        } else {
            var ndims = getDimLength();
            if (!Tools.isInteger(n, 1 - ndims, ndims - 1)) {
                throw new Error('MatrixView.shiftDimension: invalid shift.');
            }
            for (i = 0; i < n; i++) {
                first.push(first.shift());
                step.push(step.shift());
                size.push(size.shift());
            }
            for (i = n; i < 0; i++) {
                first.unshift(0);
                step.unshift(1);
                size.unshift(1);
            }
        }
    }.bind(this);

    this.selectDimension         = selectDimension;
    this.selectIndicesDimension  = selectIndicesDimension;
    this.selectBooleanDimension  = selectBooleanDimension;
    this.swapDimensions          = swapDimensions;
    this.shiftDimension          = shiftDimension;


    //////////////////////////////////////////////////////////////////
    //                     Debugging Functions                      //
    //////////////////////////////////////////////////////////////////

    // Display info about the View
    this.display = function () {
        var i, ie;
        for (i = 0, ie = getDimLength(); i < ie; i++) {
            if (isIndicesIndexed(i)) {
                console.log(true, getIndices(i));
            } else {
                console.log(false, getFirst(i), getStep(i), getSize(i));
            }
        }
        return this;
    }.bind(this);


    //////////////////////////////////////////////////////////////////
    //                          Constructor                         //
    //////////////////////////////////////////////////////////////////

    // New view constructor
    if (Tools.isArrayLike(arg)) {
        return setFromSize(arg);
    }

    // Copy constructor
    if (arg instanceof MatrixView) {
        setFromView(arg);
        initial.first = first.slice();
        initial.step = step.slice();
        initial.size = size.slice();
        return this;
    }

    // Otherwise, argument is invalid
    throw new Error('MatrixView: invalid argument.');
}

(function (MatrixView, MatrixView_prototype) {
    'use strict';

    function getSteps (indices, step) {
        var i, l = indices.length;
        var steps = indices.slice();
        for (i = l - 1; i > 0; i--) {
            steps[i] -= steps[i - 1];
            steps[i] *= step;
        }
        steps[0] = 0;
        steps.push(-indices[l - 1] * step - 1);
        return steps;
    }

    /** 
     * @class MatrixView.SubIteratorIndices
     * @private
     */
    function SubIteratorIndices (indices, step) {
        var index, stepIndex, stop;
        var first = indices[0], steps = getSteps(indices, step || 1);
        this.iterator = function () {
            return index += steps[++stepIndex];
        };
        this.begin = function (offset) {
            offset = offset || 0;
            stepIndex = 0;
            stop = offset - 1;
            return (index = offset + first);
        };
        this.end = function () {
            return stop;
        };
        this.isEnd = function () {
            return (index === stop);
        };
        this.getPosition = function () {
            return stepIndex;
        };
        this.getIndex = function () {
            return index;
        };
    }

    /** 
     * @class MatrixView.SubIterator
     * @private
     */
    function SubIterator (first, step, end) {
        var start, stop, index;
        this.iterator = function () {
            return (index += step);
        };
        this.begin = function (offset) {
            offset = offset || 0;
            start = offset + first;
            stop = offset + end;
            return (index = start);
        };
        this.end = function () {
            return stop;
        };
        this.isEnd = function () {
            return (index === stop);
        };
        this.getPosition = function () {
            return (index - start) / step;
        };
        this.getIndex = function () {
            return index;
        };
    }

    /** 
     * @class MatrixView.Iterator
     * @private
     * @constructor Create an iterator for a colon indexed dimension.
     *
     * @param {MatrixView} view 
     *  View to iterate on.
     * @param {Integer} dim
     *  First dimension to iterate on.
     */
    function Iterator (view, dim) {
        // Subiterators on upper dimensions
        var it, index, dimLength, first, step, end, stop;
        function iterateDim (d) {
            if (d >= dimLength) {
                return -1;
            }
            var i = it[d], val = i.iterator();
            if (i.isEnd()) {
                val = iterateDim(d + 1);
                return (val !== -1) ? i.begin(val) : -1;
            }
            return val;
        }
        this.iterator = function () {
            index += step;
            if (index === stop) {
                var val = iterateDim(dim + 1);
                index = (val === -1) ? - 1 : val + first;
                stop = val + end;
            }
            return index;
        };
        this.begin = function () {
            first = view.getFirst(dim);
            step = view.getStep(dim);
            end = view.getEnd(dim);
            dimLength = view.getDimLength();
            var i, begin;
            it = new Array(dimLength);
            for (i = dimLength - 1; i > dim; i--) {
                it[i] = view.getSubIterator(i);
                begin = it[i].begin(begin || 0);
            }

            for (index = 0, i = dim + 1; i < dimLength; i++) {
                index += view.getFirst(i);
            }
            stop = (index + end);
            index += first;
            return index;
        };
        this.isEnd = function () {
            return index === -1;
        };
        this.end = function () {
            return -1;
        };
        this.getPosition = function () {
            var i, ie, pos = [], start;
            if (it[dim + 1]) {
                start = it[dim + 1].getIndex();
            } else {
                start = 0;
            }
            pos[0] = (index - start - first) / step;
            for (i = dim + 1, ie = it.length; i < ie; i++) {
                pos[i - dim] = it[i].getPosition();
            }
            return pos;
        };
    }


    /** 
     * @class MatrixView.IteratorIndices
     * @private
     * @constructor Create an iterator for a indice indexed dimension.
     *
     * @param {MatrixView} view 
     *  View to iterate on.
     * @param {Integer} dim
     *  First dimension to iterate on.
     */
    function IteratorIndices (view, dim) {
        // For View indiexed by indices
        var it, index, subIndex, dimLength, first, end, stop;
        var indices  = view.getIndices(dim);
        var steps    = view.getSteps(dim);
        var iterateDim = function (d) {
            var i = it[d];
            if (!i) {
                return -1;
            }
            var val = i.iterator();
            if (i.isEnd()) {
                val = iterateDim(d + 1);
                return (val !== -1) ? i.begin(val) : -1;
            }
            return val;
        };
        /** Iterate and return the new index. */
        this.iterator = function () {
            subIndex++;
            if (subIndex === stop) {
                var val = iterateDim(dim + 1);
                if (val === -1) {
                    return (index = -1);
                }
                index = val + first;
                subIndex = 0;
            }
            index += steps[subIndex];
            return index;
        };
        /** Return the first index. */
        this.begin = function () {
            first = view.getFirst(dim);
            end = view.getEnd(dim);
            dimLength = view.getDimLength();
            var i, begin;
            it = new Array(dimLength);
            for (i = dimLength - 1; i > dim; i--) {
                it[i] = view.getSubIterator(i);
                begin = it[i].begin(begin || 0);
            }
            for (subIndex = 0, index = 0, i = dim; i < dimLength; i++) {
                index += view.getFirst(i);
            }
            stop = indices.length;
            return index;
        };
        /** Test if the end index is reached. */
        this.isEnd = function () {
            return index === -1;
        };
        /** Return the end index. */
        this.end = function () {
            return -1;
        };
        /** Return the position of the iterator. */
        this.getPosition = function () {
            var i, ie, pos = [];
            pos[0] = subIndex;
            for (i = dim + 1, ie = it.length; i < ie; i++) {
                pos[i - dim] = it[i].getPosition();
            }
            return pos;
        };
    }

    /** @class MatrixView */

    /** Get an iterator over the View.
     *
     * An iterator is a object with following properties:
     *
     *  + `Iterator.begin()`:
     *      initialize the iterator on a given dimension and returns the first index.
     *  + `Iterator.iterator()`:
     *      increment the iterator.
     *  + `Iterator.isEnd()`:
     *      return true iff the iterator reached the end of the View.
     *  + `Iterator.end()`:
     *      return the final value of the iterator, this means "end of View".
     *  + `Iterator.getPosition()`:
     *      return (as an Array) the current position of the iterator over the working dimensions.
     *
     * See also:
     *  {@link MatrixView#getSubIterator}.
     *
     * @param {Number} dim
     *  The iterator works on dimensions `dim` and following.
     *  Dimensions before `dim` are not iterated over.
     *
     * @return {Object}
     *
     * @todo redefine the spec; document all members.
     */
    MatrixView_prototype.getIterator = function (dim) {
        // Check parameter
        if (!Tools.isSet(dim)) {
            dim = 0;
        } else if (!Tools.isInteger(dim, 0)) {
            throw new Error('MatrixView.getIterator: invalid dimension.');
        }

        if (this.isIndicesIndexed(dim)) {
            return new IteratorIndices(this, dim);
        }
        var it = new Iterator(this, dim);
        return it;
    };

    /** Return an iterator over a given dimension of the View.
     *
     * The sub-iterator is a function with following properties:
     *
     *  + `SubIterator.begin(start)`:
     *      initialize the iterator with a starting index, return the first index.
     *  + `SubIterator.iterator()`:
     *      increment the sub-iterator.
     *  + `SubIterator.isEnd()`:
     *      return true iff the sub-iterator reached the end of the dimension.
     *  + `SubIterator.end()`:
     *      return the final value of the iterator, this means "end of Dimension".
     *  + `SubIterator.getPosition()`:
     *      return the current position of the sub-iterator.
     *
     * See also:
     *  {@link MatrixView#getIterator}.
     *
     * @param {Number} dim
     *  Dimension along which to iterate.
     *
     * @return {Function}
     */
    MatrixView_prototype.getSubIterator = function (dim) {
        // Check parameter
        if (!Tools.isInteger(dim, 0)) {
            throw new Error('MatrixView.getSubIterator: invalid dimension.');
        }

        if (this.isIndicesIndexed(dim)) {
            return new SubIteratorIndices(this.getIndices(dim), 1);
        }
        var first = this.getFirst(dim);
        var step = this.getStep(dim);
        var end = this.getEnd(dim);
        return new SubIterator(first, step, end);
    };

    /** Extract the data of an array to a new array equiped with the current View.
     *
     * The new array will have the same type as the input array.
     * An output array can be provided instead of creating a new array.
     *
     * See also:
     *  {@link MatrixView#extractFrom}.
     *
     * @param {Array} dataIn
     *  Input data array, to be read using the current View.
     *
     * @param {Array} [dataOut]
     *  Output data array.
     *
     * @return {Array}
     *  Output data of extracted values.
     *
     * @todo create the new array? write example
     */
    MatrixView_prototype.extractTo = function (dataIn, dataOut) {

        // Check arguments
        if (!Tools.isArrayLike(dataOut)) {
            throw new Error('MatrixView.extractTo: invalid output data.');
        }
        if (dataOut.length !== this.getInitialLength()) {
            throw new Error('MatrixView.extractTo: Output data length is invalid.');
        }

        // Input iterator
        var iterator = this.getIterator(1);
        var i, ie, it = iterator.iterator, b = iterator.begin, e = iterator.end;
        var y, ye, fy = this.getFirst(0), ly = this.getEnd(0);
        var steps, ny, dy, s;
        var yo;

        if (Tools.isArrayLike(dataIn) && dataIn.length === this.getLength()) {

            // Copy an array
            if (dataOut === dataIn) {
                throw new Error('MatrixView.extractTo: cannot perform on-place extraction.');
            }
            if (this.isIndicesIndexed(0)) {
                steps = this.getSteps(0);
                for (i = b(), ie = e(), yo = 0; i !== ie; i = it()) {
                    for (s = 0, y = i + fy, ye = i + ly; y !== ye; yo++, y += steps[++s]) {
                        dataOut[y] = dataIn[yo];
                    }
                }
            } else {
                dy = this.getStep(0);
                for (i = b(), ie = e(), yo = 0; i !== ie; i = it()) {
                    for (y = i + fy, ny = i + ly; y !== ny; y += dy, yo++) {
                        dataOut[y] = dataIn[yo];
                    }
                }
            }

        } else if (dataIn.length === 1 || typeof dataIn  === 'number') {

            // Copy a number
            if (dataIn.length === 1) {
                dataIn = dataIn[0];
            }
            if (this.isIndicesIndexed(0)) {
                steps = this.getSteps(0);
                for (i = b(), ie = e(), yo = 0; i !== ie; i = it()) {
                    for (s = 0, y = i + fy, ye = i + ly; y !== ye; y += steps[++s]) {
                        dataOut[y] = dataIn;
                    }
                }
            } else {
                dy = this.getStep(0);
                for (i = b(), ie = e(), yo = 0; i !== ie; i = it()) {
                    for (y = i + fy, ny = i + ly; y !== ny; y += dy) {
                        dataOut[y] = dataIn;
                    }
                }
            }

        } else {
            throw new Error('MatrixView.extractTo: invalid input length.');
        }

        return dataOut;
    };

    /** Extract data from an array equiped with the current View to a new Array.
     *
     * The new array will have the same type as the input array.
     * An output array can be provided instead of creating a new array.
     *
     * See also:
     *  {@link MatrixView#extractTo}.
     *
     *     // Create a View and some data
     *     var v = new MatrixView([3, 3]);
     *     var d = [0, 1, 2, 3, 4, 5, 6, 7, 8];
     *
     *     // Select third column
     *     v.selectDimension(1, [2]);
     *
     *     // Extract the associated data
     *     var out = v.extract(d);   // out is: [6, 7, 8]
     *
     * @param {Array} dataIn
     *  Input data array, to be read using the current View.
     *
     * @param {Array} [dataOut]
     *  Output data array.
     *
     * @return {Array}
     *  Output data of extracted values.
     */
    MatrixView_prototype.extractFrom = function (dataIn, dataOut) {

        // Check input array
        if (!Tools.isArrayLike(dataIn)) {
            throw new Error('MatrixView.extractFrom: invalid input data.');
        }
        if (dataIn.length !== this.getInitialLength()) {
            throw new Error('MatrixView.extractFrom: input data dimensions mismatch.');
        }

        // Check output array
        dataOut = dataOut || new dataIn.constructor(this.getLength());
        if (!Tools.isArrayLike(dataOut)) {
            throw new Error('MatrixView.extractFrom: invalid output data.');
        }
        if (dataOut.length !== this.getLength()) {
            throw new Error('MatrixView.extractFrom: output data dimensions mismatch.');
        }
        if (dataOut === dataIn) {
            throw new Error('MatrixView.extractFrom: cannot perform on-place extraction.');
        }

        // Input iterator
        var iterator = this.getIterator(1);
        var i, ie, it = iterator.iterator, b = iterator.begin, e = iterator.end;
        var y, ye, fy = this.getFirst(0), ly = this.getEnd(0);
        var yo;

        // Perform copy
        if (this.isIndicesIndexed(0)) {
            var steps = this.getSteps(0), s;
            for (i = b(), ie = e(), yo = 0; i !== ie; i = it()) {
                for (s = 0, y = i + fy, ye = i + ly; y !== ye; yo++, y += steps[++s]) {
                    dataOut[yo] = dataIn[y];
                }
            }
        } else {
            var ny, dy = this.getStep(0);
            for (i = b(), ie = e(), yo = 0; i !== ie; i = it()) {
                for (y = i + fy, ny = i + ly, ye = i + ly; y !== ye; y += dy, yo++) {
                    dataOut[yo] = dataIn[y];
                }
            }
        }

        return dataOut;
    };

    /** Extract data from an array to a new Array.
     *
     * The new array will have the same type as the input array.
     * An output array can be provided instead of creating a new array.
     *
     * See also:
     *  {@link MatrixView#extract}.
     *
     *     // Create input View and data
     *     var dIn = [0, 1, 2, 3, 4, 5, 6, 7, 8];
     *     var vIn = new MatrixView([3, 3]);
     *     // select third column: 6, 7, 8
     *     vIn.selectDimension(1, [2]);
     *
     *     // Create output View and data
     *     var dOut = [0, 1, 2, 3, 4, 5, 6, 7, 8];
     *     var vOut = new MatrixView([3, 3]);
     *     // select first row: 1, 3, 6
     *     vOut.selectDimension(0, [0]);        
     *
     *     // Extract Data
     *     var out = vIn.extract(dIn, vOut, dOut);  
     *     // out is: [6, 1, 2, 7, 4, 5, 8, 7, 8]
     *
     * @param {Array} inputData
     *  Input data, equipped with the current View.
     *
     * @param {MatrixView} outputView
     *  View for the output array.
     *
     * @param {Array} outputData
     *  Output data, equipped with the `outputView`.
     *
     * @return {Array}
     *  Output data of extracted values.
     *
     * @todo merge with 'extractFrom'; output view/data optionals and in any order
     * @fixme replace !e() by a faster instruction.
     */
    MatrixView_prototype.extract = function (dataIn, viewOut, dataOut) {

        // Check arguments
        if (!Tools.isArrayLike(dataIn)) {
            throw new Error('MatrixView.extract: invalid input data.');
        }
        if (!(viewOut instanceof MatrixView)) {
            throw new Error('MatrixView.extract: invalid output view.');
        }
        if (!Tools.isArrayLike(dataOut)) {
            throw new Error('MatrixView.extract: invalid output data.');
        }

        // Check dimensions
        if (dataIn.length !== this.getInitialLength()) {
            throw new Error('MatrixView.extract: invalid input data length.');
        }
        if (dataOut.length !== viewOut.getInitialLength()) {
            throw new Error('MatrixView.extract: invalid output data length.');
        }
        if (dataOut === dataIn) {
            throw new Error('MatrixView.extract: cannot perform on-place extraction.');
        }

        // Iterators
        var it, i, b, e;
        var ito, io, bo, ei;
        var iterator, iteratoro;
        if (this.isIndicesIndexed(0) && viewOut.isIndicesIndexed(0)) {
            iterator = this.getIterator(1);
            it = iterator.iterator;
            b = iterator.begin;
            e = iterator.isEnd;
            var y, ye, yo, fy = it.getFirst(0), ly = it.getEnd(0);
            var steps = it.getSteps(0), s;
            for (i = b(), yo = 0; !e(); i = it()) {
                for (s = 1, y = i + fy, ye = i + ly; s !== ye; yo++, y += steps[s], s++) {
                    dataOut[yo] = dataIn[y];
                }
            }
        } else {
            iterator = this.getIterator(0);
            it = iterator.iterator;
            b = iterator.begin;
            e = iterator.end;
            iteratoro = viewOut.getIterator(0);
            bo = iteratoro.begin;
            ito = iteratoro.iterator;
            for (i = b(), io = bo(), ei = e(); i !== ei; i = it(), io = ito()) {
                dataOut[io] = dataIn[i];
            }
        }

        return dataOut;
    };

})(MatrixView, MatrixView.prototype);

if (typeof window === 'undefined') {
    module.exports.MatrixView = MatrixView;
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

/** @class MatrixView */

(function (MatrixView, MatrixView_prototype) {
    'use strict';

    /** Returns the number of array dimensions.
     * It is a Matlab alias for {@link MatrixView#getDimLength},
     *
     * @return {Number}
     */
    MatrixView_prototype.ndims = function () {
        return this.getDimLength();
    };

    /** Test if a the view corresponds to a row vector or not.
     *
     * @return{Boolean}
     */
    MatrixView_prototype.isrow = function () {
        var size = this.getSize();
        return (size.length === 2 && size[0] === 1);
    };

    /** Test if the view correponds to a column vector or not.
     *
     * @return{Boolean}.
     */
    MatrixView_prototype.iscolumn = function () {
        var size = this.getSize();
        return (size.length === 2 && size[1] === 1);
    };

    /** Test if the view corresponds to a vector or not.
     *
     * @return{Boolean}
     */
    MatrixView_prototype.isvector = function () {
        var size = this.getSize();
        return (size.length === 2 && (size[1] === 1 || size[0] === 1));
    };

    /** Test if the view corresponds to a matrix or not.
     *
     * @return{Boolean}
     */
    MatrixView_prototype.ismatrix = function () {
        return this.getSize().length === 2;
    };

})(MatrixView, MatrixView.prototype);
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

    /** Allow to select an subpart of the MatrixView on each dimension.
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

    /** Defines how iterator will scan the view
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

    /** Inverse dimension permutation.
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

    /** Rotates MatrixView counterclockwise by a multiple of 90 degrees.
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

    /** Flip matrix dimension.
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

    /** Flip matrix left to right.
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

    /** Flip matrix up to down.
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

    /** Circular shift on given dimensions of the view.
     *
     * __Also see:__
     * {@link MatrixView#permute}.
     *
     *     // Create view
     *     var v = new MatrixView([5, 5]);
     *     var d = [
     *        0,  1,  2,  3,  4, 
     *        5,  6,  7,  8,  9, 
     *       10, 11, 12, 13, 14, 
     *       15, 16, 17, 18, 19, 
     *       20, 21, 22, 23, 24 
     *     ];
     *     var out = new Array(25);
     *     // Circular permutation of two indices
     *     v.circshift([2, -2]);
     *     var mat = v.extract(d, out); 
     *
     * @param {Integer[]} shift Defines the shift on each dimension.
     *
     * @param {Integer[]}  [dimension] To be specified if shift argument 
     *  is a scalar. Corresponds to which dimension must be shifted.
     * 
     * @method circshift
     *
     * @chainable
     */
    (function () {
        var selectDim = function (v, k, dim) {
            var size = v.getSize(dim), sel = new Array(size);
            k %= size;
            var start = k > 0 ? size - k : -k;
            var end = k > 0 ? k : size + k;
            var i, j;
            for (i = start, j = 0; j < end; i++, j++) {
                sel[j] = i;
            }
            for (i = 0, j = end; j < size; i++, j++) {
                sel[j] = i;
            }
            v.selectIndicesDimension(dim, sel);
        };

        MatrixView_prototype.circshift = function (K, dim) {
            var errMsg = "MatrixView.circshift: Invalid arguments."
            if (Tools.isArrayLike(K) && !Tools.isSet(dim)) {
                if (K.length > this.getDimLength()) {
                    console.log(K.length, this.getDimLength());
                    throw new Error(errMsg);
                }
                for (var k = 0, ke = K.length; k < ke; k++) {
                    selectDim(this, K[k], k);
                }
                return this;
            }
            if (Tools.isInteger(K) && Tools.isInteger(dim, 0)) {
                selectDim(this, K, dim);
                return this;
            }
            throw new Error(errMsg);
        };
    })();

})(MatrixView, MatrixView.prototype);
