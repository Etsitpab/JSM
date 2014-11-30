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

/** A Matrix or a ND-Array.
 *
 * This class implements ND-Arrays, i.e. arrays with N dimensions.
 * It is similar to Matlab's Matrix or NumPy's `ndarray`.
 *
 * Lot of vectorial operations are provided:
 *
 *  + element-wise operations, e.g. addition, search.
 *  + matrix operations, e.g. matrix multiplication or inversion.
 *  + array manipulation, e.g. concatenation, transposition.
 *
 *
 * @constructor Creates a Matrix.
 *
 * Unless data are provided, the matrix will be filled with zeros.
 *
 *     A = Matrix([3, 3]);                     // Create a 3x3 matrix
 *     B = Matrix([3, 2, 4], null, true);      // Create a 3x2x4 complex matrix
 *     C = Matrix([4, 2], Uint8Array);         // create a 4x2 matrix of uint8
 *     D = Matrix([4, 2], [4,4,4, 2,2,2]);     // 4x2 matrix, columns are 4s and 2s
 *
 * @param {Array} size
 *  Size (dimensions) of the matrix.
 *
 * @param {String | Function | Array} [arg]
 *  Can be:
 *
 *  + a `String`: the name of the data constructor.
 *  + a `Function`: the constructor of the data.
 *  + an `Array`: the data of the matrix, columnwise.
 *
 * In the latest case, the length of the array must be:
 *
 *  + the product of the values in the `size` argument.
 *  + twice the above number for a complex matrix (argument `iscomplex`).
 *
 * @param {Boolean} [iscomplex=false]
 *  If true, creates a complex matrix.
 *
 * @todo size = N; data = x; import doc. from MatrixView; consistancy of name (isscalar or isScalar)?
 *
 *  + When the size is an integer: create a 1D vector?
 *  + When the data is a scalar: create an array filled with it.
 *  + When the data is an Array of Array: create a 2D array.
 */
function Matrix(size, Type, complex, bool) {
    'use strict';

    //////////////////////////////////////////////////////////////////
    //                      Variables of the Matrix                 //
    //////////////////////////////////////////////////////////////////

    // Default View
    var view;
    // Where values are stored
    var data, real, imag;
    // if Matrix is boolean
    var isBoolean = false;


    //////////////////////////////////////////////////////////////////
    //                     Matrix Initialisation                    //
    //////////////////////////////////////////////////////////////////

    /** See {@link MatrixView#getIndex} @method */
    var getIndex;
    /** See {@link MatrixView#getDimLength} @method */
    var getDimLength;
    /** See {@link MatrixView#getLength} @method */
    var getLength;
    /** See {@link MatrixView#getSize} @method */
    var getSize;
    /** See {@link MatrixView#getIterator} @method */
    var getIterator;

    // Debug function
    var displayView;

    // Set the default View
    var setView = function (s) {
        if (s instanceof Matrix) {
            s = s.getCopy().getData();
        }
        size = Tools.checkSize(s);
        view = new MatrixView(size);

        getIndex = view.getIndex;
        getDimLength = view.getDimLength;
        getLength = view.getLength;
        getSize = view.getSize;
        displayView = view.displayView;
        getIterator = view.getIterator.bind(view);
        this.getIndex = getIndex;
        this.getDimLength = getDimLength;
        this.getLength = getLength;
        this.getSize = getSize;
        this.displayView = displayView;
        this.getIterator = getIterator;

    }.bind(this);

    /** Matrix initialization function
     *
     * @private
     * @todo 
     * - A function to check if an imaginary part exist?
     * - Make this function fully private.
     */
    var initialize = function (s, T, c) {
        setView(s);
        var complex = Tools.isSet(c) ? c : false;
        if (!Tools.isBoolean(complex)) {
            throw new Error('Matrix: "complex" argument must be a boolean');
        }

        // If the type is an Array
        if (Tools.isArrayLike(T)) {
            data = T instanceof Array ? new Matrix.dataType(T) : T;
            Type = T.constructor;
            if (data.length !== view.getLength() * (complex ? 2 : 1)) {
                throw new Error('Matrix: data and size are incompatible.');
            }
            if (complex) {
                real = data.subarray(0, view.getLength());
                imag = data.subarray(view.getLength());
            }

        // The type is a data type
        } else {

            // Deal with the type
            Type = Tools.checkType(T);
            if (typeof T === 'string') {
                switch (T.toLowerCase()) {
                case 'logical':
                case 'bool':
                case 'boolean':
                    isBoolean = true;
                    break;
                default:
                    isBoolean = false;
                }
            }

            // Build the Matrix
            var length = view.getLength();
            if (!complex) {
                data = new Type(length);
            } else {
                data = new Type(2 * length);
                real = data.subarray(0, length);
                imag = data.subarray(length);
            }
        }

        // Set the boolean parameter
        if (Tools.isSet(bool)) {
            if (!Tools.isBoolean(bool)) {
                throw new Error('Matrix: "bool" argument must be a boolean');
            }
            if (bool) {
                isBoolean = true;
            }
        }

        return this;
    }.bind(this);
    this.initialize = initialize;


    //////////////////////////////////////////////////////////////////
    //                    Basic getter functions                    //
    //////////////////////////////////////////////////////////////////

    /** Test whether the matrix has an imaginary part and if it's non-zero.
     *
     * Note: if the matrix has an imaginary part,
     *
     *  + all elements are tested one by one, and
     *  + if they are all zeros, the imaginary part is dropped.
     *
     * @return {Boolean}
     *
     * @todo a function to check if an imaginary part exist?
     */
    var isreal = function () {
        if (!Tools.isSet(imag)) {
            return true;
        }
        var i, ie;
        for (i = 0, ie = imag.length; i < ie; i++) {
            if (imag[i] !== 0) {
                return false;
            }
        }
        data = real;
        real = undefined;
        imag = undefined;
        return true;
    };

    /** Test whether the matrix is a scalar, i.e. has 1 element.
     *
     * @return {Boolean}
     *
     * @todo Matrix.asscalar, returning the scalar or throwing an error
     */
    var isscalar = function () {
        return (getLength() === 1);
    };

    /** Test whether the matrix is empty, i.e. has 0 element.
     *
     * @return {Boolean}
     */
    var isempty = function () {
        return (data.length === 0);
    };

    /** Get or set a value in the matrix from its coordinates.
     *
     * See also:
     *  {@link Matrix#value},
     *  {@link Matrix#getIndex}.
     *
     * @param {Array | Number} coordinates
     *  Coordinate of the value to get/set.
     *
     * @param {Number} [value]
     *  If any, set this value.
     *
     * @return {Number | Array}
     *  The (new) value of the Matrix at the given coordinates.
     *  Complex values are returned as [real, imag].
     */
    var value = function (index, value) {
        index = Tools.isArrayLike(index) ? getIndex(index) : index;
        if (!Tools.isSet(value)) {
            return isreal() ? data[index] : [real[index], imag[index]];
        }
        if (!isreal()) {
            data[index] = value;
        } else {
            real[index] = value[0];
            imag[index] = value[1];
        }
        return value;
    }.bind(this);

    /** Get (a reference to) the underlying data array.
     *
     * See also:
     *  {@link Matrix#getDataScalar},
     *  {@link Matrix#getRealData},
     *  {@link Matrix#getImagData},
     *  {@link Matrix#getView}.
     *
     * @return {Array}
     *  A reference to the array.
     */
    var getData = function () {
        return data;
    };
    /** Return value for real scalar Matrix.
     *
     * See also:
     *  {@link Matrix#getData},
     *  {@link Matrix#getRealData},
     *  {@link Matrix#getImagData},
     *  {@link Matrix#getView}.
     *
     * @return {Number}
     */
    var getDataScalar = function () {
        if (!isreal()) {
            throw Error("Matrix.getDataScalar: Data must be real.");
        }
        if (getLength() !== 1) {
            throw Error("Matrix.getDataScalar: Data length must be 1.");
        }
        return data[0];
    };

    /** Get (a reference to) the underlying real data array.
     *
     * This is (a reference to) the first half of the data array.
     *
     * See also
     *  {@link Matrix#getData},
     *  {@link Matrix#getImagData},
     *  {@link Matrix#getView}.
     *
     * @return {Array}
     *  A reference to the array.
     */
    var getRealData = function () {
        if (!Tools.isSet(imag)) {
            throw new Error('Matrix.getRealData: expected a complex Matrix.');
        }
        return real;
    };

    /** Get (a reference to) the underlying imaginary data array.
     *
     * This is (a reference to) the second half of the data array.
     *
     * See also
     *  {@link Matrix#getData},
     *  {@link Matrix#getRealData},
     *  {@link Matrix#getView}.
     *
     * @return {Array}
     *  A reference to the array.
     */
    var getImagData = function () {
        if (!Tools.isSet(imag)) {
            throw new Error('Matrix.getImagData: expected a complex Matrix.');
        }
        return imag;
    };

    /** Add an imaginary part to a real Matrix.
     *
     * @param {Array | Matrix | Number} [imag = 0]
     *  Imaginary part.
     *
     * @chainable
     *
     * @todo allow a number as second argument
     */
    var toComplex = function (imagNew) {
        if (!isreal()) {
            throw new Error('Matrix.toComplex: expected a non-complex Matrix.');
        }

        var dataNew = new data.constructor(data.length * 2);
        real = dataNew.subarray(0, data.length);
        imag = dataNew.subarray(data.length);
        real.set(data);

        if (imagNew instanceof Matrix) {
            Tools.checkSizeEquals(this, imagNew, Matrix.ignoreTrailingDims);
            if (!imagNew.isreal()) {
                throw new Error('Matrix.toComplex: imaginary part cannot be complex.');
            }
            imagNew = imagNew.getData();
        }

        if (Tools.isArrayLike(imagNew)) {
            if (imagNew.length !== data.length) {
                throw new Error('Matrix.toComplex: imaginary part has invalid length.');
            }
            imag.set(imagNew);
        } else if (Tools.isSet(imagNew)) {
            throw new Error('Matrix.toComplex: invalid argument.');
        }

        data = dataNew;
        return this;
    }.bind(this);

    /** Name of the data constructor.
     *
     * @return {String}
     *  Name of the constructor of the data array.
     */
    var getDataType = function () {
        return isBoolean ? 'logical' : data.constructor.name;
    };

    /** Get the default View.
     *
     * @return {MatrixView}
     *  Copy of the View on the Matrix.
     */
    var getView = function () {
        return new MatrixView(view);
    };

    this.value = value;
    this.getData = getData;
    this.getDataScalar = getDataScalar;
    this.getRealData = getRealData;
    this.getImagData = getImagData;
    this.getDataType = getDataType;
    this.getView = getView;
    this.isreal = isreal;
    this.isscalar = isscalar;
    this.isempty = isempty;
    this.toComplex = toComplex;


    //////////////////////////////////////////////////////////////////
    //                      Change the View                         //
    //////////////////////////////////////////////////////////////////

    /** Reshape the Matrix (on place).
     *
     * Change the dimensions of the Matrix while preserving the number of elements.
     * This is similar to Matlab's `reshape` function.
     *
     * Warning: this function updates the Matrix itself, not a copy!
     *
     * @param {Array} size
     *  New size of the Matrix.
     *
     * @chainable
     */
    var reshape = function () {
        var size = Array.prototype.slice.apply(arguments);
        if (Tools.isArrayLike(size[0])) {
            size = size[0];
        }
        if (size.length === 0) {
            size = this.getLength();
        }
        size = Tools.checkSize(size, 'column');
        var i, ie, l = 1;
        for (i = 0, ie = size.length; i < ie; i++) {
            l *= size[i];
        }
        if (l !== this.getLength()) {
            throw new Error('Matrix.reshape: number of elements must not change.');
        }
        setView(size);
        return this;
    }.bind(this);
    this.reshape = reshape;


    //////////////////////////////////////////////////////////////////
    //                        Copy Functions                        //
    //////////////////////////////////////////////////////////////////

    /** Get a copy of the Matrix.
     *
     * All the content of the Matrix is duplicated into a new Matrix.
     *
     * @return {Matrix}
     *  A copy of the Matrix.
     */
    var getCopy = function () {
        var r = !isreal(); // called first to remove a zero imaginary part
        var dataNew = data instanceof Array ? data.slice() : new data.constructor(data);
        return new Matrix(size, dataNew, r, isBoolean);
    };
    this.getCopy = getCopy;

    // Constructor -- perform the initialization
    return initialize(size, Type, complex);
}


//////////////////////////////////////////////////////////////////
//                      Static Values                           //
//////////////////////////////////////////////////////////////////


/** Default data constructor.
 *
 * @cfg {Function}
 */
Matrix.dataType = Float64Array;

/** Ignore trailing dimensions of size 1.
 *
 * Note: setting this option to `false` is more strict; resulting code is portable.
 *
 * @cfg {Boolean}
 */
Matrix.ignoreTrailingDims = true;

if (typeof window === 'undefined') {
    module.exports.Matrix = Matrix;
}
