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

/** @class Matrix */

(function (Matrix, Matrix_prototype) {
    "use strict";


    //////////////////////////////////////////////////////////////////
    //          Primitives Extraction/Insertion Functions           //
    //////////////////////////////////////////////////////////////////


    /** Extracts a view to a new Matrix.
     *
     * @return {Matrix}
     *
     * @private
     */
    Matrix_prototype.extractViewFrom = function (v) {
        if (this.isreal()) {
            var data = this.getData();
            return new Matrix(v.getSize(), v.extractFrom(data));
        }
        var out = new Matrix(v.getSize(), this.getDataType(), true);
        v.extractFrom(this.getRealData(), out.getRealData());
        v.extractFrom(this.getImagData(), out.getImagData());
        return out;
    };

    /** Extracts Matrix data to a given matrix with a specified view.
     *
     * @return {Matrix}
     *
     * @private
     */
    Matrix_prototype.extractViewTo = function (v, mat) {
        if (this.isreal() && mat.isreal()) {
            v.extractTo(this.getData(), mat.getData());
            return mat;
        }
        if (this.isreal() || mat.isreal()) {
            this.toComplex();
        }
        v.extractTo(this.getRealData(), mat.getRealData());
        v.extractTo(this.getImagData(), mat.getImagData());
        return mat;
    };

    var arrayToBoolean = function (array) {
        array = Array.prototype.slice.apply(array);
        var i, ei;
        for (i = 0, ei = array.length; i < ei; i++) {
            array[i] = array[i] ? true : false;
        }
        return array;
    };

    /** Apply a selection on the view given different arguments.
     *
     * @param {Matrix} selection
     *
     *  1. There is only one ND-Matrix containing either:
     *    a) `Booleans`: select all the corresponding indices,
     *    b) `Integers`: select the indices corresponding to the the integers.
     *  2. There is one or more 1D Matrix containing either:
     *    a) `Booleans`: select all the corresponding indices,
     *    b) `Integers`: select the indices corresponding to
     *                   the integer.
     *
     * @return {MatrixView}
     *
     * @private
     *
     * @fixme
     *  There is a bug with the case 1.b) when the Matrix containing the
     *  indices does not have the same size as the matrix containing the
     *  values. It should work if the indices are valid. The solution may be
     *  not obvious.
     * @fixme
     *  Due to time spent in checking arguments the resulting function is 
     *  very slow this should be reduce using the type of the array to check 
     *  if values are integer or not.
     */
    Matrix_prototype.selectView = function (args) {
        args = Array.prototype.slice.apply(args);
        var T = Tools, check = T.checkSizeEquals, td = Matrix.ignoreTrailingDims;

        var arg = args[0];
        var i, ei;

        // Global selection
        if (arg instanceof Matrix && args.length === 1) {
            var data = arg.getData();
            var v = new MatrixView([this.getLength(), 1]);

            // Boolean selection
            if (arg.islogical() && check(this.getSize(), arg.getSize(), td)) {
                return v.selectBooleanDimension(0, data);
                // Indices selection
            } else if (T.isArrayOfNumbers(data, 0, this.numel(0) - 1)) {
                return v.selectIndicesDimension(0, data);
            }
            throw new Error("Matrix.selectView: Invalid Matrix selection.");
        }

        // Dimension selection
        for (i = 0, ei = args.length; i < ei; i++) {
            arg = args[i];
            if (arg instanceof Matrix) {
                if (arg.isvector()) {
                    if (arg.islogical()) {
                        arg = arrayToBoolean(arg.getData());
                    } else {
                        arg = [arg.getData()];
                    }
                } else {
                    throw new Error("Matrix.selectView: Invalid Matrix selection:", arg);
                }
            }
            args[i] = arg;
        }

        return MatrixView.prototype.select.apply(this.getView(), args);
    };

    
    /** Allow to select an subpart of the Matrix for each dimension
     * if no arguments is provided then it will return a new vector
     * with all the elements one after the others.
     * It acts like Matlab colon operator.
     *
     * @param {Integer[]} [select]
     *  For each dimension, can be an array-like formatted as:
     *
     *  - `[startValue]`
     *  - `[startValue, endValue]`
     *  - `[startValue, step, endValue]`
     *
     * @return {Matrix}
     *  Returns a new Matrix with containing selected values.
     *
     * @fixme when only one number is provided, should the function consider this
     * number as an indice and return the corresponding value ?
     */
    Matrix_prototype.get = function () {
        if (arguments.length === 0) {
            return this.getCopy().reshape(this.getLength());
        }
        var view = this.selectView(arguments);
        if (arguments.length === 1 && arguments[0] instanceof Matrix) {
            if (view.getLength() === arguments[0].getLength()) {
                return this.extractViewFrom(view).reshape(arguments[0].getSize());
            }
            return this.extractViewFrom(view);
        }
        return this.extractViewFrom(view);
    };

    /** Return a copy of the Matrix with modified values according to the
     * input arguments.
     *
     * @return {Matrix}
     *
     * @fixme This function does not look very clean.
     */
    Matrix_prototype.set = function () {
        var sel = Array.prototype.slice.apply(arguments);
        var val = Matrix.toMatrix(sel.pop());
        var view = this.selectView(sel);
        if (sel.length === 1 && sel[0] instanceof Matrix) {
            var valSize = val.getSize(), selSize = sel[0].getSize();
            var out = val.reshape().extractViewTo(view, this.reshape());
            out = out.reshape(selSize);
            val.reshape(valSize);
            return out;
        }

        return val.extractViewTo(view, this);
    };

    Matrix.set = function () {
		var mat = Array.prototype.shift.apply(arguments);
		if (!(mat instanceof Matrix)) {
			throw new Error("Matrix.set: Matrix to modify must be provided.");
		}
        return Matrix_prototype.set.apply(mat.getCopy(), arguments);
	};

	Matrix.reshape = function () {
		var mat = Array.prototype.shift.apply(arguments);
		if (!(mat instanceof Matrix)) {
			throw new Error("Matrix.set: Matrix to modify must be provided.");
		}
		mat = mat.getCopy();
        return mat.reshape.apply(mat, arguments);
	};
	
    //////////////////////////////////////////////////////////////////
    //                      Matrix Manipulation                     //
    //////////////////////////////////////////////////////////////////


    /** Repeat the matrix along multiple dimensions.
     * Matlab-like function repmat.
     *
     * @param {Integer[]} select
     *  For each dimension, specify the number of repetition
     *
     * @return {Matrix} new Matrix.
     *
     * @matlike
     * @todo Create a tag Matlab-like and a tag also see.
     */
    Matrix_prototype.repmat = function () {
        // Check parameters
        var size = Tools.checkSize(arguments, 'square');

        // Input iterator
        var i, iv = this.getView();

        // Output size computation
        var iSize = this.size();
        var ie, length = 1, sizeOut = [];
        for (i = 0, ie = Math.max(iSize.length, size.length); i < ie; i++) {
            sizeOut[i] = (iSize[i] || 1) * (size[i] || 1);
            length *= sizeOut[i];
        }

        // Output matrix, view and data
        var om = new Matrix(sizeOut, this.getDataType(), !this.isreal());
        var ov = om.getView();

        // Input and output data
        var ird, iid, ord, oid;
        if (this.isreal()) {
            ord = om.getData();
            ird = this.getData();
        } else {
            ord = om.getRealData();
            oid = om.getImagData();
            ird = this.getRealData();
            iid = this.getImagData();
        }

        // Output coarse view arrangement
        for (i = 0, ie = iSize.length; i < ie; i++) {
            ov.selectDimension(i, [0, iSize[i], -1]);
        }

        // Output coarse iterator
        var iter = ov.getIterator(0);
        var io, ito = iter.iterator, bo = iter.begin, eo = iter.isEnd;
        for (io = bo(); !eo(); io = ito()) {
            // Output sub iterator
            var sov = om.getView(), pos = iter.getPosition();
            // Output fine view arrangement
            for (i = 0, ie = size.length; i < ie; i++) {
                var sTmp = iSize[i] || 1, tmp = pos[i] * sTmp;
                sov.selectDimension(i, [tmp, 1, tmp + sTmp - 1]);
            }
            // Copy to output
            iv.extract(ird, sov, ord);
            if (!this.isreal()) {
                iv.extract(iid, sov, oid);
            }
        }

        return om;
    };

    /** Permutes the order of dimension.
     *
     * __Also see:__
     *  {@link Matrix#ipermute}.
     *
     * @param {Array} dimensionOrder
     *  Defines the order in which
     *  the dimensions are traversed.
     *
     * @return {Matrix} new Matrix with permuted dimensions.
     *
     * @matlike
     */
    Matrix_prototype.permute = function (dim) {
        var v = this.getView().permute(dim);
        return this.extractViewFrom(v);
    };

    /** Inverse dimension permutation.
     *
     * @method ipermute
     *  {@link Matrix#permute}.
     *
     * @param {Integer[]} k
     *  Dim order to inverse.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.ipermute = function (dim) {
        var v = this.getView().ipermute(dim);
        return this.extractViewFrom(v);
    };

    /** Inverse the scan order of two dimension.
     *
     * @param {Integer} [n=undefined]
     *  Shift argument :
     *
     *  + If n is undefined then remove all first singleton dimensions.
     *  + if n > 0 shift the n first dimension to the end.
     *  + if n < 0 then insert n singleton dimension at the start.
     *
     * @return {Array}
     *  Array containing:
     *
     *  - The new matrix,
     *  - the number of shift done.
     *
     * @todo Check this function.
     *
     * @matlike
     */
    Matrix_prototype.shiftdim = function (n) {
        var v = this.getView();
        n = v.shiftDimension(n);
        return [this.extractViewFrom(v), n];
    };

    /** Rotates Matrix counter-clockwise by a multiple of 90 degrees.
     *
     * @param {Integer} k
     *  Defines the number 90 degrees rotation.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.rot90 = function (k) {
        var v = this.getView().rot90(k);
        return this.extractViewFrom(v);
    };

    /** Flip matrix along a specific dimension.
     *
     * __Also see:__
     * {@link Matrix#fliplr},
     * {@link Matrix#flipud}.
     *
     * @param {Integer} dimension
     *  Dimension to flip.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.flipdim = function (d) {
        var v = this.getView().selectDimension(d, [-1, 0]);
        return this.extractViewFrom(v);
    };

    /** Flip matrix left to right.
     *
     * __Also see:__
     * {@link Matrix#flipdim},
     * {@link Matrix#flipud}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.fliplr = function () {
        return this.flipdim(1);
    };

    /** Flip matrix up to down.
     *
     * __Also see:__
     * {@link Matrix#fliplr},
     * {@link Matrix#flipdim}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.flipud = function () {
        return this.flipdim(0);
    };

    /** Concatenate different Matrix along a given dimension.
     *
     * @param {Integer} dimension
     *  The dimension on which the matrix must be concatenate.
     *
     * @param {Matrix} m
     *  A list of matrices to concatenate. All dimension should be equals
     *  except the one corresponding to the parameter `dimension`.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.cat = function () {
        var dim = arguments[0];

        // Ouptut Size
        var outputSize = this.getSize();
        if (outputSize[dim] === undefined) {
            outputSize[dim] = 1;
        }

        var i;
        for (i = 1; i < arguments.length; i++) {
            outputSize[dim] += arguments[i].getSize(dim);
        }

        // Output matrix
        var O = new Matrix(outputSize);
        var v = O.getView();

        // Copy first Matrix
        var start = this.getSize(dim) - 1;
        v.selectDimension(dim, [0, start]);
        this.extractViewTo(v, O);
        v.restore();

        // Copy others matrix
        for (i = 1; i < arguments.length; i++) {
            v.selectDimension(dim, [start + 1, start += arguments[i].getSize(dim)]);
            arguments[i].extractViewTo(v, O);
            v.restore();
        }
        return O;
    };

})(Matrix, Matrix.prototype);
