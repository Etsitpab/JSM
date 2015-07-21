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
            throw new Error("Matrix.getDataScalar: Data must be real.");
        }
        if (getLength() !== 1) {
            throw new Error("Matrix.getDataScalar: Data length must be 1.");
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
    //                   Matrix import/export functions             //
    //////////////////////////////////////////////////////////////////


    /**
     * Convert 2D Matrix to 2D Array for export.
     *
     * __Also see:__
     * {@link Matrix#fromArray}.
     *
     * @return {Number[][]} A 2D Array.
     *
     * @todo Tests.
     */
    Matrix_prototype.toArray = function () {

        var strErr = "Matrix.toArray: function only available for ";
        if (this.ndims() > 2) {
            throw new Error(strErr + "2D matrix.");
        }
        var id;
        if (this.isreal()) {
            id = this.getData();
        } else {
            throw new Error(strErr + "for real matrix.");
        }

        var view = this.getView();
        var fy = view.getFirst(0), dy = view.getStep(0), ly = view.getEnd(0);
        var fx = view.getFirst(1), dx = view.getStep(1), lx = view.getEnd(1);

        var y, ny, x, n, o, xTab;
        for (o = [], y = fy, ny = ly; y !== ny; y += dy) {
            for (xTab = [], x = y + fx, n = y + lx; x !== n; x += dx) {
                xTab.push(id[x]);
            }
            o.push(xTab);
        }
        return o;
    };

    /**
     * Convert 2D Array to Matrix. An Array is considered
     * as a column vector and an Array of Array as a set of
     * column vectors.
     *
     * __Also see:__
     * {@link Matrix#toArray},
     * {@link Matrix#toMatrix}.
     *
     * @param {Number[][]} array Array to convert.
     *
     * @return {Matrix}
     *
     * @todo Check parameters for 1D argument.
     */
    Matrix.fromArray = function (a) {
        var size, data;
        if (a[0].length) {
            if (a[0][0].length) {
                throw new Error("Matrix.fromArray: Only work with Array up to 2 dimensions.");
            }
            size = [a[0].length, a.length];
            data = [];
            var i, ei;
            for (i = 0, ei = a.length; i < ei; i++) {
                var subtab = Array.prototype.slice.apply(a[i]);
                data = data.concat(subtab);
            }
        } else {
            size = a.length;
            data = a;
        }
        return new Matrix(size, data);
    };

    /** Convert 2D Matrix to formated string such like coma
     * separated values (CSV) strings.
     *
     * __Also see:__
     * {@link Matrix#dlmread}.
     *
     * @param {String} [delim='\n']  column delimiters.
     *
     * @return {String} A string.
     *
     * @matlike
     */
    Matrix_prototype.dlmwrite = function (d) {

        if (d !== undefined && typeof d !== "string") {
            throw new Error("Matrix.dlmread: Wrong delimiter specification.");
        }
        if (this.ndims() > 2) {
            throw new Error("Matrix.dlmwrite: function only available for 2D matrix.");
        }

        var view = this.getView(), td = this.getData();
        var dn = view.getStep(1), ln = view.getEnd(1);
        var m = view.getSize(0);
        var i, ij, ei, eij;

        var str = '';
        for (i = 0, ei = m; i < ei; i++) {
            for (ij = i, eij = i + ln - dn; ij < eij; ij += dn) {
                str += td[ij] + d;
            }
            str += td[ij] + "\n";
        }

        return str;
    };

    /**
     * Convert string with values delimited by characters
     * to Matrix.
     *
     * __Also see:__
     * {@link Matrix#dlmwrite}.
     *
     * @param {String} [delim] Column delimiters.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.dlmread = function (csv, d) {

        if (d !== undefined && typeof d !== "string") {
            throw new Error("Matrix.dlmread: Wrong delimiter specification.");
        }
        csv = csv.split("\n");
        if (csv[csv.length - 1] === "") {
            csv.pop();
        }
        var i, ei, j, ej;
        var output = [];
        var reg = /[\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?/g;
        for (i = 0, ei = csv.length; i < ei; i++) {
            var row = d ? csv[i].split(d) : csv[i].match(reg);
            for (j = 0, ej = row.length; j < ej; j++) {
                row[j] = parseFloat(row[j]);
            }
            output.push(row);
        }
        return Matrix.fromArray(output).transpose();
    };

    /**
     * Convert 2D Matrix to a string for copy/paste into Matlab.
     *
     * @return {String} A string.
     */
    Matrix_prototype.toMatlab = function () {

        if (this.ndims() > 2) {
            throw new Error("Matrix.toMatlab: function available only for 2D matrix.");
        }

        var pad = function (real, imag) {
            var str = real.toString();
            if (typeof imag === 'number') {
                str += imag > 0 ? ' + ' : ' - ';
                str += Math.abs(imag).toString();
                str += ' * i';
            }
            return str;
        };

        var o = '', id, ird, iid;
        if (this.isreal()) {
            id = this.getData();
        } else {
            ird = this.getRealData();
            iid = this.getImagData();
        }
        var view = this.getView();
        var fy = view.getFirst(0), dy = view.getStep(0), ly = view.getEnd(0);
        var fx = view.getFirst(1), dx = view.getStep(1), lx = view.getEnd(1);

        var y, ny, x, n;
        o += '[';
        for (y = fy, ny = ly; y !== ny; y += dy) {
            if (y !== fy) {
                o += ' ';
            }
            if (this.isreal()) {
                for (x = y + fx, n = y + lx; x !== n; x += dx) {
                    o += pad(id[x]);
                    if (x !== n - dx) {
                        o += ',';
                    }
                }
            } else {
                for (x = y + fx, n = y + lx; x !== n; x += dx) {
                    o += pad(ird[x], iid[x]);
                    if (x !== n - dx) {
                        o += ',';
                    }
                }
            }
            if (y !== ny - dy) {
                o += ';';
            }
        }
        o += ']';
        return o;
    };

    /**
     * Convert Matrix to string for display purposes.
     *
     * @param {Number} [precision=4] Precision used to display the Matrix.
     *
     * @param {String} [name] Name of the Matrix.
     *
     * @return {String} A string.
     *
     * @fixme There is some bugs when displaying complex Matrix.
     */
    Matrix_prototype.toString = function (arg1, arg2) {

        var precision, name = '';
        if (arg1 === undefined) {
            precision = 4;
        } else if (typeof arg1 === 'string') {
            name = arg1;
            precision = 4;
        } else {
            precision = arg1;
        }
        if (typeof arg2 === 'string') {
            name = arg2;
        }

        var length = precision + 5;
        var pad = function (real, imag) {
            var str = '';
            if (typeof real === 'number') {
                if (real % 1 === 0) {
                    str += real;
                } else {
                    str += real.toFixed(precision);
                }
                while (str.length < length) {
                    str = ' ' + str;
                }
            } else {
                str += real.toString();
            }

            if (imag === undefined) {
                return str;
            }
            if (imag === 0) {
                while (str.length < 2 * length + 1) {
                    str = str + ' ';
                }
                return str;
            }
            if (typeof imag === 'number') {
                str += imag > 0 ? ' + ' : ' - ';
                if (real % 1 === 0) {
                    str += Math.abs(imag);
                } else {
                    str += Math.abs(imag).toFixed(precision);
                }
                while (str.length < length) {
                    str = ' ' + str;
                }
            } else {
                str += imag.toString();
            }
            str += 'i';
            return str;
        };
        var i, ie, o = '', s;
        if (this.isempty()) {
            o += 'Empty array: ';
            s = this.getSize();
            for (i = 0, ie = s.length - 1; i < ie; i++) {
                o += s[i] + '-by-';
            }
            o += s[i];
            return o;
        }

        if (this.getLength() > 10000) {
            o += 'Array: ';
            s = this.getSize();
            for (i = 0, ie = s.length - 1; i < ie; i++) {
                o += s[i] + '-by-';
            }
            o += s[i];
            return o;
        }

        var id, ird, iid;
        if (this.isreal()) {
            id = this.getData();
        } else {
            ird = this.getRealData();
            iid = this.getImagData();
        }

        var iterator = this.getIterator(2);
        var it = iterator.iterator, b  = iterator.begin, e = iterator.isEnd;
        var z = this.getSize(2);
        var view = this.getView();
        var fy = view.getFirst(0), dy = view.getStep(0), ly = view.getEnd(0);
        var fx = view.getFirst(1), dx = view.getStep(1), lx = view.getEnd(1);

        var y, ny, x, n;
        for (i = b(); !e(); i = it()) {
            o += name;
            if (z > 1) {
                o += '(:,:,' + iterator.getPosition() + ') = [\n';
            } else {
                o += ' = [\n';
            }
            for (y = i + fy, ny = i + ly; y !== ny; y += dy) {
                o += '\t';
                if (this.isreal()) {
                    for (x = y + fx, n = y + lx; x !== n; x += dx) {
                        o += pad(id[x]) + ' ';
                    }
                } else {
                    for (x = y + fx, n = y + lx; x !== n; x += dx) {
                        o += pad(ird[x], iid[x]) + ' ';
                    }
                }
                o += '\n';
            }
            o += ']\n';
        }

        return o;
    };

    /** Cast data to Matrix. An Array is considered
     * as a column vector and an Array of Array as a set of
     * column vectors.
     *
     * If the input is a `Matrix` then it will be returned unchanged
     *
     * @param {Number|Number[]|Matrix} data
     *  Data to convert
     *
     * @return {Matrix}
     */
    Matrix.toMatrix = function (data, type) {
        if (data instanceof Matrix) {
            return data;
        }
        if (data.constructor === Number) {
            data = [data];
        }
        var d = Array.prototype.concat.apply([], data);
        var isBoolean = false, size;
        
        if (Tools.isArrayOfBooleans(d)) {
            isBoolean = true;
        } else if (!Tools.isArrayOfNumbers(d)) {
            throw new Error('Matrix.toMatrix: Array must only contain numbers or booleans.');
        }
        if (d.length === 1) {
            size = 1;
        } else if (d.length === data.length) {
            size = [d.length, 1];
        } else {
            size = [];
            var t = data;
            while (t.length) {
                size.push(t.length);
                t = t[0];
            }
            size = size.reverse();
        }
        return new Matrix(size, d, false, isBoolean);
    };


    //////////////////////////////////////////////////////////////////
    //                   Matrix display functions                   //
    //////////////////////////////////////////////////////////////////


    /** Display the matrix in the console.
     *
     * @param {Number} precision
     *
     * @param {String} str
     *  String describing the content of the matrix.
     *  Used for display purpose
     *
     * @chainable
     */
    Matrix_prototype.display = function (arg1, arg2) {
        console.log(this.toString(arg1, arg2));
        return this;
    };

})(Matrix, Matrix.prototype);
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
        if (this.isreal()) {
            v.extractTo(this.getData(), mat.getRealData());
            return mat;
        }
        if (mat.isreal()) {
            mat.toComplex();
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
     *  1) There is a bug with the case 1.b) when the Matrix containing the
     *  indices does not have the same size as the matrix containing the
     *  values. It should work if the indices are valid. The solution may be
     *  not obvious.
     *
     *  2) Due to time spent in checking arguments the resulting function is
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
            }
            if (T.isArrayOfNumbers(data, 0, this.numel(0) - 1)) {
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


    /** Allow to extract a subpart of the Matrix for each dimension
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
            return this.getCopy();
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
            val.reshape(valSize);
            return out.reshape(selSize);
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
            throw new Error("Matrix.reshape: Matrix to modify must be provided.");
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

    /** Circular shift on given dimensions.
     *
     * __Also see:__
     * {@link Matrix#permute},
     * {@link Matrix#shiftdim}.
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
    Matrix_prototype.circshift = function (K, dim) {
        var v = this.getView().circshift(K, dim);
        return this.extractViewFrom(v);
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

    /** Returns the number of elements.
     *
     * __Also see:__
     *  {@link MatrixView#getLength}.
     *
     * @return {Integer}
     *  The number of elements in the matrix.
     *
     * @matlike
     */
    Matrix_prototype.numel = function () {
        return this.getLength();
    };

    /** Returns the number of dimensions of the Matrix.
     *
     * __Also see:__
     *  {@link MatrixView#getDimLength}.
     *
     * @return {Integer}
     *  The number of dimension of the matrix.
     *
     * @matlike
     */
    Matrix_prototype.ndims = function () {
        return this.getDimLength();
    };

    /** Returns the number of elements along one or all dimensions.
     *
     * @param {Integer} [dim=undefined]
     *  The dimension.
     *
     * @return {Integer[] | Integer}
     *  If dim is:
     *
     * + `undefined`: then returns an array with the number of elements
     *    on each dimension,
     * + `Integer` The number of elements for the required dimension.
     *
     * @matlike
     */
    Matrix_prototype.size = function (d) {
        switch (typeof d) {
        case 'number':
            if (!Tools.isInteger(d, 0)) {
                throw new Error('Matrix.size: invalid argument.');
            }
            return this.getSize(d) || 1;
        case 'undefined':
            return this.getSize();
        default:
            throw new Error('Matrix.size: Wrong argument type.');
        }
    };

    /** Returns the data numerical class in a Matlab-like style.
     * This function is an alias for the Matlab function `class`.
     *
     * @return {String}
     *  Returns the numerical class of Matrix data.
     */
    Matrix_prototype.type = function () {
        switch (this.getDataType().toLowerCase()) {
        case 'boolean':
        case 'logical':
            return 'logical';

        case 'array':
        case 'float64array':
            return 'double';
        case 'float32array':
            return 'single';

        case 'int32array':
            return 'int32';
        case 'uint32array':
            return 'uint32';

        case 'int16array':
            return 'int16';
        case 'uint16array':
            return 'uint16';

        case 'int8array':
            return 'int8';
        case 'uint8clampedarray':
            return 'uint8c';
        case 'uint8array':
            return 'uint8';
        default:
            return new Error('Matrix.type: Unknown data type.');
        }
    };

    /** Returns true if Matrix is a row vector and false otherwise.
     *
     * __Also see:__
     *  {@link Matrix#iscolumn},
     *  {@link Matrix#isvector},
     *  {@link Matrix#ismatrix}.
     *
     * @return {Boolean}
     *
     * @matlike
     */
    Matrix_prototype.isrow = function () {
        var size = this.size();
        return (size.length === 2 && size[0] === 1);
    };

    /** Returns true if the Matrix is a column vector and false otherwise.
     *
     * __Also see:__
     *  {@link Matrix#isrow},
     *  {@link Matrix#isvector},
     *  {@link Matrix#ismatrix}.
     *
     * @return {Boolean}
     *
     * @matlike
     */
    Matrix_prototype.iscolumn = function () {
        var size = this.size();
        return (size.length === 2 && size[1] === 1);
    };

    /** Returns true if Matrix is either a column or a row vector.
     *
     * __Also see:__
     *  {@link Matrix#isrow},
     *  {@link Matrix#iscolumn},
     *  {@link Matrix#ismatrix}.
     *
     * @return {Boolean}
     *
     * @matlike
     */
    Matrix_prototype.isvector = function () {
        var size = this.size();
        return (size.length === 2 && (size[1] === 1 || size[0] === 1));
    };

    /** Returns true if Matrix is a vector or a 2D array.
     *
     * __Also see:__
     *  {@link Matrix#isrow},
     * {@link Matrix#iscolumn}
     *  {@link Matrix#isvector}.
     *
     * @return {Boolean}
     *
     * @matlike
     */
    Matrix_prototype.ismatrix = function () {
        return this.getSize().length <= 2;
    };

    /** Returns true if Matrix is square matrix array.
     *
     * __Also see:__ {@link Matrix#ismatrix}.
     *
     * @method issquare
     *
     * @return {Boolean} true or false depending on the Matrix shape.
     *
     * @matlike
     */
    Matrix_prototype.issquare = function () {
        if (this.getSize(0) !== this.getSize(1)) {
            throw false;
        }
        return true;
    };

    /** Determines whether the input is floating-point array.
     *
     * __Also see:__ {@link Matrix#isfloat}.
     *
     * @return {Boolean}
     *
     * @matlike
     */
    Matrix_prototype.isinteger = function () {
        switch (this.getDataType().toLowerCase()) {
        case 'uint8array':
        case 'uint8clampedarray':
        case 'uint16array':
        case 'uint32array':
        case 'int8array':
        case 'int16array':
        case 'int32array':
            return true;
        default:
            return false;
        }
    };

    /** Determines whether the input is floating-point array.
     *
     * __Also see:__
     *  {@link Matrix#isfloat}.
     *
     * @return {Boolean}
     *
     * @matlike
     */
    Matrix_prototype.isfloat = function () {
        switch (this.getDataType().toLowerCase()) {
        case 'float32array':
        case 'float64array':
            return true;
        default:
            return false;
        }
    };

    /** Determines whether the input is floating-point array.
     *
     * __Also see:__
     *  {@link Matrix#isfloat}.
     *
     * @return {Boolean}
     *
     * @matlike
     */
    Matrix_prototype.islogical = function () {
        var t = this.getDataType().toLowerCase();
        if (t === 'logical' || t === 'boolean' || t === 'bool') {
            return true;
        }
        return false;
    };

    /** Returns minimum value given an integer type.
     *
     * __Also see:__
     *  {@link Matrix#intmax},
     *  {@link Matrix#realmin},
     *  {@link Matrix#realmax}.
     *
     * @param {String} type
     *  Value type.
     *
     * @return {Integer}
     *
     * @matlike
     */
    Matrix.intmin = function (type) {
        switch (type) {
        case 'uint8c':
        case 'uint8':
        case 'uint16':
        case 'uint32':
            return 0;
        case 'int8':
            return -128;
        case 'int16':
            return -32768;
        case 'int32':
            return -2147483648;
        default:
            throw new Error('Matrix.intmin: Unknown data type.');
        }
    };

    /** Returns maximum value for an integer type.
     *
     * __Also see:__
     *  {@link Matrix#intmin},
     *  {@link Matrix#realmin},
     *  {@link Matrix#realmax}.
     *
     * @param {String} type
     *  Value type.
     *
     * @return {Integer}
     *
     * @matlike
     */
    Matrix.intmax = function (type) {
        switch (type) {
        case 'int8':
            return 127;
        case 'uint8c':
        case 'uint8':
            return 255;
        case 'int16':
            return 32767;
        case 'uint16':
            return 65535;
        case 'int32':
            return 2147483647;
        case 'uint32':
            return 4294967295;
        default:
            throw new Error('Matrix.intmax: Unknown data type.');
        }
    };

    /** Returns minimum value for a floating type.
     *
     * __Also See:__
     *  {@link Matrix#intmin},
     *  {@link Matrix#intmax},
     *  {@link Matrix#realmax}.
     *
     * @param {String} [type='double']
     *  Value type.
     *
     * @return {Number}
     *
     * @matlike
     */
    Matrix.realmin = function (type) {
        switch (type) {
        case undefined:
        case 'double':
            return Number.MIN_VALUE;
        case 'single':
            return 1.1755e-38;
        default:
            throw new Error('Matrix.realmin: Unknown data type.');
        }
    };

    /** Returns maximum value for a floating type.
     *
     * __Also see:__
     *  {@link Matrix#intmin},
     *  {@link Matrix#intmax},
     *  {@link Matrix#realmin}.
     *
     * @param {String} [type='double']
     *  Value type.
     *
     * @return {Integer}
     *
     * @matlike
     */
    Matrix.realmax = function (type) {
        switch (type) {
        case undefined:
        case 'double':
            return Number.MAX_VALUE;
        case 'single':
            return 3.4028e+38;
        default:
            throw new Error('Matrix.realmin: Unknown data type.');
        }
    };

})(Matrix, Matrix.prototype);
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

/*
 * This module provides basic Matrix constructor interface
 * such as `rand`, 'randi', 'eye', 'zeros', 'ones', etc.
 * to build Matrix in matlab-like way.
 */

/** @class Matrix */

(function (Matrix, Matrix_prototype) {
    "use strict";

    // Check if nodejs or browser
    var isNode = (typeof module !== 'undefined' && module.exports) ? true : false;
    var fs, Canvas, NewImage;
    if (isNode) {
        fs = require("fs");
        // Do not forget: export NODE_PATH=/usr/local/lib/node_modules
        Canvas = require("canvas");
        NewImage = Canvas.Image;
    } else {
        NewImage = Image;
    }

    var createCanvas = function (width, height) {
        var canvas;
        if (isNode) {
            canvas = new Canvas();
        } else {
            canvas = document.createElement("canvas");
        }
        canvas.width = width || 0;
        canvas.height = height || 0;
        return canvas;
    };

    /** Creates a row vector filled ordered values.
     * Actually it acts like Matlab colon (:) operator.
     *
     * __Also see:__
     *  {@link Matrix#linspace}.
     *
     * @param {Array} colon
     *  Colon array can have 2, or 3 parameters:
     *
     *  - the first value indicates the first value of the output vector,
     *  - if there is two parameters, then they designate respectively
     *  - the first and the last value of the output vector (the step between
     *    two values is -1 or +1,
     *  - If there is three parameters, then they indicate respectively
     *    the first, the step and the last values.
     *
     * @param {String} [type=Matrix.dataType]
     *  Defined the numerical class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.colon = function () {
        var col = Tools.checkColon(arguments);

        var first = col[0], step = col[1], last = col[2];

        // Special cases
        if (!isFinite(first) || !isFinite(step) || !isFinite(last)) {
            throw new Error("Parameters are invalid number (Infitity or NaN).");
        }

        // Minimum difference between 2 double precision values
        var eps = 2.2204e-16;
        // Tolerance value
        var tol = 2.0 * eps * Math.max(Math.abs(first), Math.abs(last));
        // Step sign
        var stepSign = step > 0 ? 1 : -1;

        // Determine interval number
        var n;
        var isInteger = Tools.isInteger;

        if (isInteger(first) && step === 1) {
            // Consecutive integers.
            n = Math.floor(last) - first;
        } else if (isInteger(first) && isInteger(step)) {
            // Integers with spacing > 1.
            var q = Math.floor(first / step);
            var r = first - q * step;
            n = Math.floor((last - r) / step) - q;
        } else {
            // General case.
            n =  Math.round((last - first) / step);
            if (stepSign * (first + n * step - last) > tol) {
                n = n - 1;
            }
        }

        var right = first + n * step;
        if (stepSign * (right - last) > -tol) {
            right = last;
        }
        var out = new Matrix(n + 1);
        var dOut = out.getData();
        var x, k = Math.floor(n / 2) + 1;
        var v1 = first, v2 = right;
        for (x = 0; x < k; x++, v1 += step, v2 -= step) {
            dOut[x]     = v1;
            dOut[n - x] = v2;
        }

        if (n % 2 === 0) {
            dOut[n / 2] = (first + right) / 2;
        }

        return out;
    };

    /** Creates a column vector filled with linealy spaced values.
     * It acts similarly to the colon operator, but with a control on
     * the number of values.
     *
     * __Also see:__
     *  {@link Matrix#colon}.
     *
     * @param {Integer[]} size
     * A sequence of integers indicating the size of the output matrix.
     *
     * @param {String} [type=Matrix.dataType]
     * Defined the numerical class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.linspace = function (min, max, bins) {
        if (!Tools.isNumber(min)) {
            throw new Error();
        }
        if (!Tools.isNumber(max)) {
            throw new Error();
        }
        if (bins === undefined) {
            bins = 100;
        } else if (!Tools.isInteger(bins, 1)) {
            throw new Error("Matrix.linspace: Bins shoulb be an integer > 1.");
        }

        var binsm1 = bins - 1;
        return Matrix.colon(min, (max - min) / binsm1, max);
    };

    /** Creates a Matrix filled with zeros.
     *
     * __Also see:__
     *  {@link Matrix#ones}.
     *
     * @param {Integer[]} size
     * A sequence of integers indicating the size of the output matrix.
     *
     * @param {String} [type=Matrix.dataType]
     * Defined the numerical class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.zeros = function () {
        var size, type;

        // Get type;
        if (typeof arguments[arguments.length - 1] === 'string') {
            type = Array.prototype.pop.apply(arguments);
        }

        // Check size
        size = Tools.checkSize(arguments, 'square');

        return new Matrix(size, type);
    };

    /** Creates a Matrix filled with ones.
     * Actually it acts like Matlab ones constructor.
     *
     * __Also see:__
     *  {@link Matrix#zeros}.
     *
     * @param {Integer[]} size A sequence of integers indicating
     * the size of the output matrix.
     *
     * @param {String} [type=Matrix.dataType] Defined the numerical
     * class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.ones = function () {
        var type;
        // Get type;
        if (typeof arguments[arguments.length - 1] === 'string') {
            type = Array.prototype.pop.apply(arguments);
        }

        // Check size
        var size = Tools.checkSize(arguments, 'square');

        var mat = new Matrix(size, type), data = mat.getData();
        var i, ie;
        for (i = 0, ie = data.length; i < ie; ++i) {
            data[i] = 1;
        }

        return mat;
    };

    /** Creates a Matrix filled with random walues uniformely
     * distributed in range [0, 1].
     *
     * __Also see:__
     *  {@link Matrix#randn},
     *  {@link Matrix#randi}.
     *
     * @param {Integer[]} size
     *  A sequence of integers indicating the size of the
     *  output matrix.
     *
     * @param {String} [type=Matrix.dataType]
     *  Defined the numerical class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.rand = function () {
        var size, type;
        // Get type;
        if (typeof arguments[arguments.length - 1] === 'string') {
            type = Array.prototype.pop.apply(arguments);
        }

        // Check size
        size = Tools.checkSize(arguments, 'square');
        var mat = new Matrix(size, type), data = mat.getData();
        var i, ie, random = Math.random;
        for (i = 0, ie = data.length; i < ie; ++i) {
            data[i] = random();
        }
        return mat;
    };

    /** Creates a Matrix filled with random walues following
     * the gaussian low of parameters (0, 1).
     *
     * __Also see:__
     *  {@link Matrix#rand},
     *  {@link Matrix#randi}.
     *
     * @param {Integer[]} size
     *  A sequence of integers indicating the size of the
     *  output matrix.
     *
     * @param {String} [type=Matrix.dataType]
     *  Defined the numerical class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.randn = function () {
        var size, type;
        // Get type;
        if (typeof arguments[arguments.length - 1] === 'string') {
            type = Array.prototype.pop.apply(arguments);
        }

        // Check size
        size = Tools.checkSize(arguments, 'square');
        var mat = new Matrix(size, type), data = mat.getData();
        var i, ie;
        var rand = Math.random, PI2 = Math.PI * 2;
        var sqrt = Math.sqrt, sin = Math.sin, log = Math.log;
        for (i = 0, ie = data.length; i < ie; ++i) {
            var t = PI2 * rand();
            var r = sqrt(-2 * log(1 - rand()));
            data[i] = r * sin(t);
        }

        return mat;
    };

    /** Creates a Matrix filled with random walues uniformely distributed
     * in a specified range.
     *
     * __Also see:__
     *  {@link Matrix#rand},
     *  {@link Matrix#randi}.
     *
     * @param {Integer|Integer[]} range
     *  Can be :
     *
     *  - An integer greater than 1, then the range for radom values will
     *    be [0, range],
     *  - An array-like of length 2, then the range for radom values will
     *    be [range[0], range[1]],
     *
     * @param {Integer[]} size
     *  A sequence of integers indicating the size of the output matrix.
     *
     * @param {String} [type=Matrix.dataType]
     * Defined the numerical class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.randi = function () {
        var range, size, type;

        // Check range
        range = Array.prototype.shift.apply(arguments);
        range = Tools.checkRange(range);

        // Get type
        if (typeof arguments[arguments.length - 1] === 'string') {
            type = Array.prototype.pop.apply(arguments);
        }

        // Check size
        size = (arguments.length === 0) ? [1] : arguments;
        size = Tools.checkSize(size, 'square');

        var mat = new Matrix(size, type), data = mat.getData();
        var i, ie, min = range[0], c = range[1] - min + 1;
        var random = Math.random, floor = Math.floor;
        for (i = 0, ie = data.length; i < ie; ++i) {
            data[i] = floor(random() * c) + min;
        }
        return mat;
    };

    /** Creates a Matrix with ones the main diagonal.
     *
     * __Also see:__
     * {@link Matrix#zeros},
     * {@link Matrix#ones}.
     *
     * @param {Integer[]} size
     * A sequence of integers indicating the size of the output matrix.
     *
     * @param {String} [type=Matrix.dataType]
     * Defined the numerical class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.eye = function () {
        var size, type;

        // Get type;
        if (typeof arguments[arguments.length - 1] === 'string') {
            type = Array.prototype.pop.apply(arguments);
        }

        // Check size
        size = Tools.checkSize(arguments, 'square');

        var mat = new Matrix(size, type);
        var data = mat.getData();

        // Scaning the from the second dimension (dim = 1)
        var view = mat.getView(), iterator = mat.getIterator(2);
        var it = iterator.iterator, b = iterator.begin, e = iterator.isEnd;

        var fy = view.getFirst(1), dy = view.getStep(1);
        var fx = view.getFirst(0), dx = view.getStep(0);
        var N = Math.min(view.getSize(1), view.getSize(0));
        var i, y, n;
        for (i = b(); !e(); i = it()) {
            for (y = i + fy + fx, n = 0; n < N; y += dy, n++) {
                data[y + n * dx] = 1;
            }
        }
        return mat;
    };

    /** Creates a complex Matrix from a 2 Matrix.
     *
     * @method complex
     *
     * @param {Matrix} real
     * Matrix used are real part.
     *
     * @param {Matrix} imag
     * Matrix used are imaginary part.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.complex = function (real, imag) {

        real = Matrix.toMatrix(real);
        imag = Matrix.toMatrix(imag);

        if (!(real instanceof Matrix)) {
            throw new Error('Matrix.complex: real argument must be a matrix.');
        }
        if (!real.isreal()) {
            throw new Error('Matrix.complex: real argument must be a real matrix.');
        }

        if (!(imag instanceof Matrix)) {
            throw new Error('Matrix.complex: imag argument must be a matrix.');
        }
        if (!imag.isreal()) {
            throw new Error('Matrix.complex: imag argument must be a real matrix.');
        }
        if (!Tools.checkSizeEquals(real.getSize(), imag.getSize(), Matrix.ignoreTrailingDims)) {
            throw new Error('Matrix.complex: imag and real Matrix must ' +
                            'have the same size.');
        }
        var realData = real.getData(), imagData = imag.getData();
        var od = new Matrix.dataType(realData.length * 2);
        od.subarray(0, realData.length).set(realData);
        od.subarray(realData.length).set(imagData);
        return new Matrix(real.getSize(), od, true);
    };

    /** Reads image data in order to creates a Matrix.
     *
     * @param {String|Image|HTMLCanvasElement} source
     *  Source of the image. It can be the image path, an Image element
     *  or a Canvas element respectively.
     *
     * @param {Function} callback
     *  Function to call once the image is loaded.
     *
     * @param {Function} errorCallback
     *  Function to call if an error occurs while loading.
     *
     * @return {Matrix}
     *
     * @matlike
     * @todo Should this function make use of Matrix.initialize ?
     */
    Matrix.imread = function (source, callback, errCallback) {
        var errMsg = 'Matrix.imread: ';
        var imOut = new Matrix();

        // If source is a canvas
        if (!isNode && typeof source === 'string' && document.getElementById(source)) {
            source = document.getElementById(source);
        }

        var readFromCanvas = function (source) {
            var imageData, ctx = source.getContext('2d');
            var width = source.width, height = source.height;
            try {
                imageData = ctx.getImageData(0, 0, width, height);
            } catch (e) {
                if (errCallback !== undefined) {
                    errCallback.call(this, e);
                    return;
                }
                throw e;
            }
            var data = new Uint8ClampedArray(imageData.data);

            var view = new MatrixView([4, width, height])
                    .select([0, 2], [0, -1], [0, -1])
                    .permute([2, 1, 0]);
            this.initialize(view.getSize(), view.extractFrom(data));

            if (callback) {
                callback.call(this, this);
            }
        }.bind(imOut);

        var readFromImage = function (image) {
            if (!isNode) {
                image = image instanceof Event ? this : image;
            }
            var canvas = createCanvas(image.width, image.height);
            canvas.getContext('2d').drawImage(image, 0, 0, image.width, image.height);
            readFromCanvas(canvas);
        };

        var readFromFileName = function (name) {
            var im = new NewImage();
            im.onerror = errCallback || function () {
                throw new Error(errMsg + 'Error occuring while loading image.');
            };
            if (isNode) {
                im.src = fs.readFileSync(name);
                readFromImage(im);
            } else {
                im.src = name;
                im.onload = readFromImage;
            }
        };

        if (typeof source === 'string') {
            readFromFileName(source);
        } else if (!isNode && source instanceof Image) {
            readFromImage(source);
        } else if (!isNode && source instanceof HTMLCanvasElement) {
            readFromCanvas(source);
        } else if (isNode && source instanceof Canvas) {
            readFromCanvas(source);
        } else {
            throw new Error(errMsg + 'invalid source argument');
        }
        return imOut;
    };

    /** Creates a square diagonal Matrix from a vector.
     *
     * @param {Matrix} vector
     *
     * @return {Matrix}
     *
     * @matlike
     * @todo This function must works with complex Matrix and array.
     */
    Matrix.diag = function (d) {
        d = Matrix.toMatrix(d);
        var l = d.numel();
        d = d.getData();
        var out = Matrix.zeros(l);
        var data = out.getData();
        var i, ei, j;
        for (i = 0, ei = data.length, j = 0; i < ei; i += l + 1, j++) {
            data[i] = d[j];
        }
        return out;
    };

    /** Load several images from an array of path and once all the images are
     * loaded call a callback function. Each image is loaded in a `Matrix`
     * container.
     * @param {Array} names
     *  The names of the images corresponding to their paths.
     * @param {Function} callback
     *  The function to be called when the images are loaded.
     *  The pointer `this` of the function is the array of images.
     * @return {Array}
     *  The array of images.
     */
    Matrix.loadImages = function loadImages(images, callback) {
        /*
        var tab = [], i, ie;
        callback = callback.bind(tab);
        var f_file = function (i) {
            return function (evt) {
                tab[i] = evt.target.result;
                for (var j = 0, je = images.length; j < je; j++) {
                    if (!tab[j]) {
                        return;
                    }
                }
                callback();
            };
        };
        for (i = 0, ie = images.length; i < ie; i++) {
            var reader = new FileReader();
            reader.onload = f_file(i);
            reader.readAsDataURL(images[i]);
        }
        return tab;
         */

        var tab = [], i, ie;
        callback = callback.bind(tab);
        var f = function (i) {
            return function () {
                tab[i] = this;
                for (var j = 0, je = images.length; j < je; j++) {
                    if (!tab[j] || tab[j].isempty()) {
                        return;
                    }
                }
                callback();
            };
        };
        for (i = 0, ie = images.length; i < ie; i++) {
            if (images[i] instanceof Image) {
                Matrix.imread(images[i], f(i));
            }
        }
        return tab;
    };


})(Matrix, Matrix.prototype);
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

    var min = function (data, s, d, N) {
        for (var i = s + d, e = s + N, m = data[s]; i < e; i += d) {
            if (data[i] < m) {
                m = data[i];
            }
        }
        return m;
    };    

    var amin = function (data, s, d, N) {
        for (var i = s + d, e = s + N, m = data[s], im = s; i < e; i += d) {
            if (data[i] < m) {
                m = data[i];
                im = i;
            }
        }
        return im;
    };    

    var max = function (data, s, d, N) {
        for (var i = s + d, e = s + N, m = data[s]; i < e; i += d) {
            if (data[i] > m) {
                m = data[i];
            }
        }
        return m;
    };    

    var amax = function (data, s, d, N) {
        for (var i = s + d, e = s + N, m = data[s], im = s; i < e; i += d) {
            if (data[i] > m) {
                m = data[i];
                im = i;
            }
        }
        return im;
    };

    var sum = function (data, s, d, N) {
        for (var i = s, e = s + N, m = 0; i < e; i += d) {
            m += data[i];
        }
        return m;
    };    

    var mean = function (data, s, d, N) {
        for (var i = s, e = s + N, m = 0; i < e; i += d) {
            m += data[i];
        }
        return m * d / N;
    };    
    
    var prod = function (data, s, d, N) {
        for (var i = s, e = s + N, m = 1; i < e; i += d) {
            m *= data[i];
        }
        return m;
    };    

    var variance = function (data, s, d, N) {
        var mu = mean(data, s, d, N);
         for (var i = s, e = s + N, m = 0; i < e; i += d) {
            var tmp = data[i] - mu;
            m += tmp * tmp;
        }
        return m * d / (N - 1);
    };    

    var varianceBiased = function (data, s, d, N) {
         return variance(data, s, d, N) * (N - 1) / N;
    };

    var cumsum = function (data, s, d, N) {
        for (var i = s + d, e = s + N; i < e; i += d) {
            data[i] += data[i - d];
        }
    };    

    var cumprod = function (data, s, d, N) {
        for (var i = s + d, e = s + N; i < e; i += d) {
            data[i] *= data[i - d];
        }
    };    

    var getPermutation = function (view, dim) {
        var ndims = view.ndims(), order = [dim];
        for (var i = 0; i < ndims; i++) {
            if (i !== dim) {
                order.push(i);
            }
        }
        return order;
    };

    var applyDim = function (mat, fun, dim, inplace, output) {

        // Do the function fun return a number or act in place ?
        inplace = inplace || false;

        // Check parameter dim
        if (!Tools.isSet(dim)) { 
            if (inplace) {
                fun(mat.getData(), 0, 1, mat.numel());
                return mat;
            }
            var v = fun(mat.getData(), 0, 1, mat.numel());
            return Matrix.toMatrix(v);
        } 

        if (!Tools.isInteger(dim, 0)) {
            throw new Error('Matrix.applyDim: Invalid dimension.');
        }

        var view = mat.getView(), order = getPermutation(view, dim);
        view.permute(order);

        // Input Matrix and data
        var id = mat.getData(), iterator = view.getIterator(1);
        var it = iterator.iterator, b = iterator.begin, e = iterator.isEnd;
        var d = view.getStep(0), l = view.getEnd(0);
        var i, io;
        if (!inplace) {
            // Output size and data
            var sizeOut = mat.getSize();
            sizeOut[dim] = 1;
            var om = new Matrix(sizeOut, output), od = new om.getData();
            for (i = b(), io = 0; !e(); i = it(), io++) {
                od[io] = fun(id, i, d, l);
            }
            return om;
        } 
        if (output !== undefined) {
            mat = output;
            output = output.getData();
        }
        for (i = b(); !e(); i = it()) {
            fun(id, i, d, l, output);
        }
        return mat;
    };

    /** Return the minimum of a matrix.
     * @param {Number} [dim=undefined]
     *  Dimension on which the computation must be performed. If undefined,
     *  return the global minimum.
     * @return {Matrix}
     */
    Matrix_prototype.min = function (dim) {
        return applyDim(this, min, dim);
    };
    /** Return the argmin of a matrix.
     * @param {Number} [dim=undefined]
     *  Dimension on which the computation must be performed. If undefined,
     *  return the global argmin.
     * @return {Matrix}
     */
    Matrix_prototype.amin = function (dim) {
        return applyDim(this, amin, dim, undefined, 'uint32');
    };
    /** Return the maximum of a matrix.
     * @param {Number} [dim=undefined]
     *  Dimension on which the computation must be performed. If undefined,
     *  return the global maximum.
     * @return {Matrix}
     */
    Matrix_prototype.max = function (dim) {
        return applyDim(this, max, dim);
    };
    /** Return the argmax of a matrix.
     * @param {Number} [dim=undefined]
     *  Dimension on which the computation must be performed. If undefined,
     *  return the global argmax.
     * @return {Matrix}
     */
    Matrix_prototype.amax = function (dim) {
        return applyDim(this, amax, dim, undefined, 'uint32');
    };
    /** Return the sum of the matrix elements.
     * @param {Number} [dim=undefined]
     *  Dimension on which the computation must be performed. If undefined,
     *  return the global sum.
     * @return {Matrix}
     */
    Matrix_prototype.sum = function (dim) {
        return applyDim(this, sum, dim);
    };
    /** Return the product of the matrix elements.
     * @param {Number} [dim=undefined]
     *  Dimension on which the computation must be performed. If undefined,
     *  return the product of all the matrix elements.
     * @return {Matrix}
     */
    Matrix_prototype.prod = function (dim) {
        return applyDim(this, prod, dim);
    };
    /** Return the average value of the matrix elements.
     * @param {Number} [dim=undefined]
     *  Dimension on which the computation must be performed. If undefined,
     *  return the average value of all the elements.
     * @return {Matrix}
     */
    Matrix_prototype.mean = function (dim) {
        return applyDim(this, mean, dim);
    };
    /** Return the variance of the matrix elements.
     * @param {Number} [dim=undefined]
     *  Dimension on which the computation must be performed. If undefined,
     *  return the variance of all the elements.
     * @param {Number} [norm=false]
     *  If false, use the non biased variance estimator (N - 1), and the 
     *  biased one otherwise.
     * @return {Matrix}
     */
    Matrix_prototype.variance = function (dim, norm) {
        switch (typeof norm) {
        case 'undefined':
            norm = -1;
            break;
        case 'boolean':
            norm = (norm === false) ? -1 : 0;
            break;
        case 'number':
            if (norm === 0) {
                norm = -1;
            } else if (norm === 1) {
                norm = 0;
            } else {
                throw new Error('Matrix.variance: Invalid argument.');
            }
            break;
        default:
            throw new Error('Matrix.variance: Invalid argument.');
        }
        if (norm === -1) {
            return applyDim(this, variance, dim);
        } 
        return applyDim(this, varianceBiased, dim);
    };
    /** Return the standard deviation of the matrix elements.
     * @param {Number} [dim=undefined]
     *  Dimension on which the computation must be performed. If undefined,
     *  return the standard deviation of all the elements.
     * @param {Number} [norm=false]
     *  If false, use the non biased standard deviation estimator (N - 1), 
     * and the biased one otherwise.
     * @return {Matrix}
     */
    Matrix_prototype.std = function (norm, dim) {
        var v = this.variance(norm, dim);
        if (typeof v === 'number') {
            return Math.sqrt(v);
        }
        return v.arrayfun(Math.sqrt);
    };
    /** Return the cumulative sum of the matrix elements.
     * @param {Number} [dim=undefined]
     *  Dimension on which the computation must be performed. If undefined,
     *  return the cumulative sum of all the elements.
     * @return {Matrix}
     */
    Matrix_prototype.cumsum = function (dim) {
        return applyDim(this, cumsum, dim, true);
    };

    /** Return the cumulative product of the matrix elements.
     * @param {Number} [dim=undefined]
     *  Dimension on which the computation must be performed. If undefined,
     *  return the cumulative product of all the elements.
     * @return {Matrix}
     */
    Matrix_prototype.cumprod = function (dim) {
        return applyDim(this, cumprod, dim, true);
    };


    (function () {
        var poissrnd_lambda = function (data, lambda) {
            var L = Math.exp(-lambda), random = Math.random;
            for (var i = 0, ie = data.length; i < ie; i++) {
                var p = 1, k = 0;
                do {
                    k++;
                    p *= random();
                } while (p > L);
                data[i] = k - 1;
            }
        };

        var poissrnd_lambdas = function (lambda) {
            var exp = Math.exp, random = Math.random;
            for (var i = 0, ie = lambda.length; i < ie; i++) {
                var p = 1, k = 0, L = exp(-lambda[i]);
                do {
                    k++;
                    p *= random();
                } while (p > L);
                lambda[i] = k - 1;
            }
        };

        var exprnd = function (data, mu) {
            mu = -mu;
            var random = Math.random, log = Math.log;
            for (var i = 0, ie = data.length; i < ie; ++i) {
                data[i] = mu * log(random());
            }
        };

        /** Generate Poisson random numbers. 
         * 
         * The `lambda` parameter can a number as well as a Matrix.
         * - If it is a number then the function returns an array of 
         * dimension `size`.
         * - If `lambda` is a Matrix then the function will return 
         * a Matrix of the same size.
         * 
         * Note that to avoid copy, you can use the syntax `mat.poissrnd()`.
         *
         * @param {Number} lambda
         * @param {Number} [size]
         * @return {Matrix}
         */
        Matrix.poissrnd = function () {
            var lambda = Array.prototype.shift.apply(arguments);
            if (typeof(lambda) === "number") { 
                var size = Tools.checkSize(arguments, 'square');
                var mat = new Matrix(size), data = mat.getData();
                poissrnd_lambda(data, lambda);
                return mat;
            }
            if (lambda instanceof Matrix) {
                return lambda.getCopy().poissrnd();
            }
        };
        Matrix_prototype.poissrnd = function() {
            poissrnd_lambdas(this.getData());
            return this;
        };
        /** Generate exponentially distributed random numbers.
         * @param {Number} mu
         * @param {Number} size
         * @return {Matrix}
         */
        Matrix.exprnd = function () {
            var mu = Array.prototype.shift.apply(arguments);
            var size = Tools.checkSize(arguments, 'square');
            
            var mat = new Matrix(size), data = mat.getData();
            exprnd(data, mu);
            return mat;
        };

    })();

    (function () {
        var tab, itab, fun;
        var asortAscend = function (a, b) {
            return tab[a] - tab[b];
        };
        var asortDescend = function (a, b) {
            return tab[b] - tab[a];
        };
        var sortAscend = function (a, b) {
            return a - b;
        };
        var sortDescend = function (a, b) {
            return b - a;

        };
        var sort = function (data, s, d, N) {
            var i, io, e;
            for (i = s, io = 0, e = s + N; i < e; i += d, io++) {
                tab[io] = data[i];
            }
            Array.prototype.sort.call(tab, fun);
            for (i = s, io = 0, e = s + N; i < e; i += d, io++) {
                data[i] = tab[io];
            }
        };
        var asort = function (data, s, d, N, out) {
            var i, io, e;
            for (i = s, io = 0, e = s + N; i < e; i += d, io++) {
                tab[io] = data[i];
                itab[io] = io;
            }
            Array.prototype.sort.call(itab, fun);
            for (i = s, io = 0, e = s + N; i < e; i += d, io++) {
                out[i] = itab[io] * d + s;
            }
        };

        /** Sort the elements of the matrix.
         * @param {Number} [dim=undefined]
         *  Dimension on which the computation must be performed. If undefined,
         *  return all the elements sorted.
         * @param {String} [mode="ascend"]
         *  Sorting by increasing values ("ascend") or decreasing values ("descend")
         * @chainable
         */
        Matrix_prototype.sort = function (dim, mode) {
            var size = typeof dim === "number" ? this.getSize(dim) : this.numel();
            tab = new Float64Array(size);
            if (mode === "ascend") { 
                fun = sortAscend;
            } else if (mode === "descend") {
                fun = sortDescend;
            } else {
                throw new Error("Matrix.sort: Wrong mode selection");
            }
            return applyDim(this, sort, dim, true);
        };
        
        Matrix.sort = function (m, dim, mode) {
            return m.getCopy().sort(dim, mode);
        };

        /** Compute the argsort of the elements of the matrix.
         * @param {Number} [dim=undefined]
         *  Dimension on which the computation must be performed. If undefined,
         *  return the global argsort.
         * @param {String} [mode="ascend"]
         *  Sorting by increasing values ("ascend") or decreasing values ("descend")
         * @return {Matrix}
         */
        Matrix_prototype.asort = function (dim, mode) {
            var size = typeof dim === "number" ? this.getSize(dim) : this.numel();
            tab = new Float64Array(size);
            itab = new Uint32Array(size);
            if (mode === "ascend") { 
                fun = asortAscend;
            } else if (mode === "descend") {
                fun = asortDescend;
            } else {
                throw new Error("Matrix.sort: Wrong mode selection"); 
            }
            var out = new Matrix(this.getSize(), "uint32");
            return applyDim(this, asort, dim, true, out);
       };

        Matrix.asort = function (m, dim, mode) {
            return m.getCopy().asort(dim, mode);
        };

    })();

    /** Accumate values in an array
     * @param {Array} subs
     *  Array of integers indicating subscript positions
     * @param {Array} val
     *  Values to be accumulated.
     * @param {Array} [size]
     *  Size of the output Array. Default is subs.max() + 1
     * @return {Matrix}
     */
    Matrix.accumarray = function (subs, val, size) {
        subs = Matrix.toMatrix(subs);
        // Check subs for array of positive integers
        if (!Tools.isArrayOfIntegers(subs.getData(), 0)) {
            throw new Error('Matrix.accumarray: Subs should be an array of positive integers.');
        }

        var max = subs.max(0).getData();
        var k, ek, steps = [1];
        if (Tools.isSet(size)) {
            for (k = 0, ek = max.length; k < ek; k++) {
                if (size[k] < max[k] + 1) {
                    throw new Error('Matrix.accumarray: Size and Subs values are unconsistent.');
                }
            }
        } else {
            size = [];
            for (k = 0, ek = max.length; k < ek; k++) {
                size[k] = max[k] + 1;
            }
        }
        for (k = 0, ek = size.length - 1; k < ek; k++) {
            steps[k + 1] = steps[k] * size[k];
        }

        if (subs.ndims() > 2) {
            throw new Error("Matrix.accumarray: Subs must be a 2D Array.");
        }
        
        // Scaning the from the second dimension (dim = 1)
        var sd = subs.getData(), N = subs.numel(), ni = subs.getSize(0);
        var i, j, _j, ij, s;

        var ind = new Uint32Array(ni);
        for (j = 0, _j = 0; _j < N; j++, _j += ni) {
            for (i = 0, ij = _j, s = steps[j]; i < ni; i++, ij++) {
                ind[i] += sd[ij] * s;
            }
        }

        if (val instanceof Matrix) { 
            val = val.getData();
        } 
        var out = new Matrix(size), od = out.getData();
        if (Tools.isArrayLike(val) && val.length === ind.length) {
            for (k = 0, ek = ind.length; k < ek; k++) {
                od[ind[k]] += val[k];
            }
        } else if (typeof val === "number") {
            for (k = 0, ek = ind.length; k < ek; k++) {
                od[ind[k]] += val;
            }
        } else {
            throw new Error("Matrix.accumarray: Wrong val argument.");
        }
        return out;
    };

})(Matrix, Matrix.prototype);
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

    /** Returns a new Matrix with a data cast.
     *
     * __Also see:__
     *  {@link Matrix#type}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.cast = function (Type) {
        var flag;
        switch (Type.toLowerCase()) {
        case 'boolean':
        case 'bool':
        case "logical":
            flag = true;
            break;
        default:
            flag = false;
        }

        Type = Tools.checkType(Type);
        var od = new Type(this.getData());
        return new Matrix(this.getSize(), od, !this.isreal(), flag);
    };

    /** Converts a Matrix to double.
     *
     * __Also see:__
     *  {@link Matrix#cast}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.double = function () {
        return this.cast('double');
    };

    /** Converts a Matrix to single.
     *
     * __Also see:__
     *  {@link Matrix#cast}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.single = function () {
        return this.cast('single');
    };

    /** Converts a Matrix to int8.
     *
     * Also see {@link Matrix#cast}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.int8 = function () {
        return this.cast('int8');
    };

    /** Converts a Matrix to int16.
     *
     * __Also see:__
     *  {@link Matrix#cast}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.int16 = function () {
        return this.cast('int16');
    };

    /** Converts a Matrix to int32.
     *
     * __Also see:__
     *  {@link Matrix#cast}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.int32 = function () {
        return this.cast('int32');
    };

    /** Converts a Matrix to uint8.
     *
     * __Also see:__
     *  {@link Matrix#cast}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.uint8 = function () {
        return this.cast('uint8');
    };

    /** Converts a Matrix to logical.
     *
     * __Also see:__
     *  {@link Matrix#cast}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.logical = function () {
        return this.cast('logical');
    };

    /** Converts a Matrix to uint8c.
     *
     * __Also see:__
     *  {@link Matrix#cast}.
     *
     * @return {Matrix}
     */
    Matrix_prototype.uint8c = function () {
        return this.cast('uint8c');
    };

    /** Converts a Matrix to uint16.
     *
     * __Also see:__
     *  {@link Matrix#cast}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.uint16 = function () {
        return this.cast('uint16');
    };

    /** Converts a Matrix to uint32.
     *
     * __Also see:__
     *  {@link Matrix#cast}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.uint32 = function () {
        return this.cast('uint32');
    };

    /** Returns a logical Matrix with 1 if value is NaN and 0 otherwise.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.isnan = function () {
        var oMat = new Matrix(this.getSize(), 'logical');
        var od = oMat.getData();
        var i, ie;
        if (this.isreal()) {
            var id = this.getData();
            for (i = 0, ie = od.length; i < ie; i++) {
                od[i] = isNaN(id[i]);
            }
        } else {
            var ird = this.getRealData(), iid = this.getImagData();
            for (i = 0, ie = od.length; i < ie; i++) {
                od[i] = isNaN(ird[i]) || isNaN(iid[i]);
            }
        }
        return oMat;
    };

    /** Returns a logical Matrix with 1 if value is NaN and 0 otherwise.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.isinf = function () {
        var oMat = new Matrix(this.getSize(), 'logical');
        var od = oMat.getData();
        var i, ie;
        if (this.isreal()) {
            var id = this.getData();
            for (i = 0, ie = od.length; i < ie; i++) {
                var v = id[i];
                od[i] = (v === Infinity) || (v === -Infinity) ? 1 : 0;
            }
        } else {
            var ird = this.getRealData(), iid = this.getImagData();
            for (i = 0, ie = od.length; i < ie; i++) {
                var vr = ird[i], vi = iid[i];
                od[i] = ((vr === Infinity) || (vr === -Infinity) ||
                    (vi === Infinity) || (vi === -Infinity)) ? 1 : 0;
            }
        }
        return oMat;
    };

    /** Returns a logical Matrix with 1 if value is NaN and 0 otherwise.
     *
     * @return {Matrix} New Matrix.
     *
     * @matlike
     */
    Matrix_prototype.isfinite = function () {
        var oMat = new Matrix(this.getSize(), 'logical');
        var od = oMat.getData();
        var i, ie;
        if (this.isreal()) {
            var id = this.getData();
            for (i = 0, ie = od.length; i < ie; i++) {
                od[i] = isFinite(id[i]) ? 1 : 0;
            }
        } else {
            var ird = this.getRealData(), iid = this.getImagData();
            for (i = 0, ie = od.length; i < ie; i++) {
                od[i] = (isFinite(ird[i]) || isFinite(iid[i])) ? 1 : 0;
            }
        }
        return oMat;
    };

})(Matrix, Matrix.prototype);
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

    /** Returns the Matrix real part.
     *
     * __Also see:__
     *  {@link Matrix#imag}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.real = function () {
        if (this.isreal()) {
            throw new Error('Matrix.real: This function can be only' +
                            ' used with a complex Matrix. ');
        }
        var rd = this.getRealData();
        return new Matrix(this.getSize(), new rd.constructor(rd));
    };

    /** Returns the Matrix imaginary part.
     *
     * __Also see:__
     * {@link Matrix#real}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.imag = function () {
        if (this.isreal()) {
            throw new Error('Matrix.imag: This function can be only' +
                            ' used with a complex Matrix. ');
        }
        var id = this.getImagData();
        return new Matrix(this.getSize(), new id.constructor(id));
    };

    /** Returns the phase angle for complex Matrix.
     *
     * __Also see:__
     *  {@link Matrix#abs}.
     *
     * @chainable
     * @matlike
     * @method angle
     */
    (function (Matrix_prototype) {
        var angle_real = function (data) {
            for (var i = 0, ie = data.length; i < ie; i++) {
                data[i] = 0;
            }
        };

        var angle_cplx = function (datar, datai) {
            for (var i = 0, ie = datar.length; i < ie; i++) {
                datar[i] = Math.atan2(datai[i], datar[i]);
                datai[i] = 0;
            }
        };

        Matrix_prototype.angle = function () {
            if (this.isreal()) {
                angle_real(this.getData());
            } else {
                angle_cplx(this.getRealData(), this.getImagData());
            }
            return this;
        };
    })(Matrix_prototype);

    /** Returns the absolute value for real Matrix and
     * the complex magnitude for complex Matrix.
     *
     * __Also see:__
     *  {@link Matrix#angle}.
     *
     * @chainable
     * @matlike
     * @method abs
     */
    (function (Matrix_prototype) {
        var abs_real = function (data) {
            for (var i = 0, ie = data.length; i < ie; i++) {
                data[i] = data[i] > 0 ? data[i] : -data[i];
            }
        };

        var abs_cplx = function (datar, datai) {
            for (var i = 0, ie = datar.length; i < ie; i++) {
                var a = datai[i], b = datar[i];
                datar[i] = Math.sqrt(a * a + b * b);
                datai[i] = 0;
            }
        };

        Matrix_prototype.abs = function () {
            if (this.isreal()) {
                abs_real(this.getData());
            } else {
                abs_cplx(this.getRealData(), this.getImagData());
            }
            return this;
        };
    })(Matrix_prototype);

    /** Returns the complex conjugate of each element of the Matrix.
     *
     * @chainable
     */
    Matrix_prototype.conj = function () {
        if (this.isreal() === true) {
            return this;
        }
        var i, ie, imag = this.getImagData();
        for (i = 0, ie  = imag.length; i < ie; i++) {
            imag[i] = -imag[i];
        }
        return this;
    };

})(Matrix, Matrix.prototype);
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
    'use strict';


    //////////////////////////////////////////////////////////////////
    //                    MATH OBJECT OPERATORS                     //
    //////////////////////////////////////////////////////////////////


    /** Apply the square root function to values of Matrix.
     *
     * @chainable
     * @matlike
     * @method sqrt
     */
    (function (Matrix_prototype) {
        var sqrt_real = function (data) {
            for (var i = 0, ie = data.length; i < ie; i++) {
                data[i] = Math.sqrt(data[i]);
            }
        };

        var sqrt_cplx = function (datar, datai) {
            for (var i = 0, ie = datar.length; i < ie; i++) {
                var a = datar[i], b = datai[i];
                var m = Math.sqrt(a * a + b * b);
                datar[i] = Math.sqrt((a + m) * 0.5);
                datai[i] = b < 0 ? -Math.sqrt((m - a) * 0.5) : Math.sqrt((m - a) * 0.5);
            }
        };

        Matrix_prototype.sqrt = function () {
            if (this.isreal()) {
                sqrt_real(this.getData());
            } else {
                sqrt_cplx(this.getRealData(), this.getImagData());
            }
            return this;
        };
    })(Matrix_prototype);

    /** Apply the cosine function to values of Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.cos = function () {
        var data = this.getData(), i, ie;
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.cos(data[i]);
        }
        return this;
    };

    /** Apply the sine function to values of Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.sin = function () {
        var data = this.getData(), i, ie;
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.sin(data[i]);
        }
        return this;
    };

    /** Apply the tangent function to values of Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.tan = function () {
        var data = this.getData(), i, ie;
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.tan(data[i]);
        }
        return this;
    };

    /** Apply the exponential function to values of Matrix.
     *
     * @chainable
     * @todo This function must be tested on complex numbers
     * @matlike
     * @method exp
     */
    (function (Matrix_prototype) {
        var exp_real = function (data) {
            for (var i = 0, ie = data.length; i < ie; i++) {
                data[i] = Math.exp(data[i]);
            }
        };
        var exp_cplx = function (datar, datai) {
            for (var i = 0, ie = datar.length; i < ie; i++) {
                var a = Math.exp(datar[i]), b = datai[i];
                datar[i] = a * Math.cos(b);
                datai[i] = a * Math.sin(b);
            }
        };
        Matrix_prototype.exp = function () {
            if (this.isreal()) {
                exp_real(this.getData());
            } else {
                exp_cplx(this.getRealData(), this.getImagData());
            }
            return this;
        };
    })(Matrix_prototype);

    /** Apply the natural logarithm function to the values of the Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.log = function () {
        var data = this.getData(), i, ie;
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.log(data[i]);
        }
        return this;
    };

    /** Apply the base 10 logarithm to the values of the Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.log10 = function () {
        var data = this.getData(), i, ie;
        var log10 = Math.log(10);
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.log(data[i]) * log10;
        }
        return this;
    };

    /** Apply the base 2 logarithm to the values of the Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.log2 = function () {
        var data = this.getData(), i, ie;
        var log2 = Math.log(2);
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.log(data[i]) * log2;
        }
        return this;
    };

    /** Apply the floor function to values of Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.floor = function () {
        var data = this.getData(), i, ie;
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.floor(data[i]);
        }
        return this;
    };

    /** Apply the ceil function to values of Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.ceil = function () {
        var data = this.getData(), i, ie;
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.ceil(data[i]);
        }
        return this;
    };

    /** Apply the round function to values of Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.round = function () {
        var data = this.getData(), i, ie;
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.round(data[i]);
        }
        return this;
    };

    /** Apply the arccosine function to values of Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.acos = function () {
        var data = this.getData(), i, ie;
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.acos(data[i]);
        }
        return this;
    };

    /** Apply the arcsine function to values of Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.asin = function () {
        var data = this.getData(), i, ie;
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.asin(data[i]);
        }
        return this;
    };

    /** Apply the arctan function to values of Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.atan = function () {
        var data = this.getData(), i, ie;
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.acos(data[i]);
        }
        return this;
    };

    /** Apply the arctan2 function to values of Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.atan2 = function (B) {
        var A = this.getCopy();
        if (!Tools.checkSizeEquals(A.size(), B.size(), Matrix.ignoreTrailingDims)) {
            throw new Error("Matrix.atan2: Side of of elements must be equal.");
        }
        var dataA = A.getData(), dataB = B.getData();
        var i, ie;
        for (i = 0, ie = dataA.length; i < ie; i++) {
            dataA[i] = Math.atan2(dataA[i], dataB[i]);
        }
        return A;
    };


    //////////////////////////////////////////////////////////////////
    //        Boolean Operators functions defining the matrix       //
    //////////////////////////////////////////////////////////////////


    var booleanOperators = function (op, A, B) {

        if (!A.isreal() || (B instanceof Matrix && !B.isreal())) {
            throw new Error("Matrix.booleanOperators: This function doesn't " +
                            "work with complex numbers.");
        }

        var id = A.getData(), ld = id.length;

        var out, od, x;

        if (typeof B === 'number') {
            out = new Matrix(A.size(), 'boolean');
            od = out.getData();
            if (op === '===' || op === '==') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] === B) ? 1 : 0;
                }
            } else if (op === '!==' || op === '!=') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] !== B) ? 1 : 0;
                }
            } else if (op === '&&') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] && B) ? 1 : 0;
                }
            } else if (op === '||') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] || B) ? 1 : 0;
                }
            } else if (op === '<') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] < B) ? 1 : 0;
                }
            } else if (op === '<=') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] <= B) ? 1 : 0;
                }
            } else if (op === '>') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] > B) ? 1 : 0;
                }
            } else if (op === '>=') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] >= B) ? 1 : 0;
                }
            } else {
                throw new Error('Matrix: Unknown operator \'' + op + '\'.');
            }

        } else if (B instanceof Matrix) {
            var size = Tools.checkSizeEquals(A.size(), B.size(), Matrix.ignoreTrailingDims);
            out = new Matrix(size, 'boolean');
            od = out.getData();
            var i2d = B.getData();
            if (op === '===' || op === '==') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] === i2d[x]) ? 1 : 0;
                }
            } else if (op === '!==' || op === '!=') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] !== i2d[x]) ? 1 : 0;
                }
            } else if (op === '&&') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] && i2d[x]) ? 1 : 0;
                }
            } else if (op === '||') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] || i2d[x]) ? 1 : 0;
                }
            } else if (op === '<') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] < i2d[x]) ? 1 : 0;
                }
            } else if (op === '<=') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] <= i2d[x]) ? 1 : 0;
                }
            } else if (op === '>') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] >= i2d[x]) ? 1 : 0;
                }
            } else if (op === '>=') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] >= i2d[x]) ? 1 : 0;
                }
            } else {
                throw new Error('Unknown operator \'' + op + '\'.');
            }
        } else {
            throw new Error('Argument must be a Matrix or a number');
        }

        return out;
    };

    /** Test equality between two arrays.
     *
     * @param {Number|Matrix} rightOp
     * @chainable
     * @matlike
     */
    Matrix_prototype.eq = function (b) {
        return booleanOperators('===', this, b);
    };
    Matrix_prototype['==='] = Matrix_prototype.eq;

    /** Test inequality between two arrays.
     *
     * @param {Number|Matrix} rightOp
     * @chainable
     * @matlike
     */
    Matrix_prototype.ne = function (b) {
        return booleanOperators('!==', this, b);
    };
    Matrix_prototype['!=='] = Matrix_prototype.ne;

    /** Greater than operator.
     *
     * @param {Number|Matrix} rightOp
     * @chainable
     * @matlike
     */
    Matrix_prototype.gt = function (b) {
        return booleanOperators('>', this, b);
    };
    Matrix_prototype['>'] = Matrix_prototype.gt;

    /** Greater or equal operator.
     *
     * @param {Number|Matrix} rightOp
     * @chainable
     * @matlike
     */
    Matrix_prototype.ge = function (b) {
        return booleanOperators('>=', this, b);
    };
    Matrix_prototype['>='] = Matrix_prototype.ge;

    /** Lower than operator.
     *
     * @param {Number|Matrix} rightOp
     * @chainable
     * @matlike
     */
    Matrix_prototype.lt = function (b) {
        return booleanOperators('<', this, b);
    };
    Matrix_prototype['<'] = Matrix_prototype.lt;

    /** Lower or equal operator.
     *
     * @param {Number|Matrix} rightOp
     * @chainable
     * @matlike
     */
    Matrix_prototype.le = function (b) {
        return booleanOperators('<=', this, b);
    };
    Matrix_prototype['<='] = Matrix_prototype.le;

    /** And operator.
     *
     * @param {Number|Matrix} rightOp
     * @chainable
     * @matlike
     */
    Matrix_prototype.and = function (b) {
        return booleanOperators('&&', this, b);
    };
    Matrix_prototype['&&'] = Matrix_prototype.and;

    /** Or operator.
     *
     * @param {Number|Matrix} rightOp
     * @chainable
     * @matlike
     */
    Matrix_prototype.or = function (b) {
        return booleanOperators('||', this, b);
    };
    Matrix_prototype['||'] = Matrix_prototype.or;

    /** Return false if different of zero.
     *
     * @param {Number|Matrix} rightOp
     * @chainable
     * @matlike
     */
    Matrix_prototype.neg = function () {
        var out = this.getCopy();
        var data = out.getData();
        var i, ie;
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = !data[i] ? 1 : 0;
        }
        return out;
    };


    //////////////////////////////////////////////////////////////////
    //                     Arithmetic Operators                     //
    //////////////////////////////////////////////////////////////////

    /* Function generating automatically the arithmetic operators 
       functions 
    */
    var generateArithmeticOperators = function () {
        var operators = {
            '+': {
                "name": "plus",
                "real/real": {
                    scalar: "a[x] += b;",
                    matrix: "a[x] += b[x];"
                },
                "real/imag": {
                    scalar: "ar[x] += br;    ai[x] = bi;",
                    matrix: "ar[x] += br[x]; ai[x] = bi[x];"
                },
                "imag/real": {
                    scalar: "ar[x] += b;",
                    matrix: "ar[x] += b[x];"
                },
                "imag/imag": {
                    scalar: "ar[x] += br;    ai[x] += bi;",
                    matrix: "ar[x] += br[x]; ai[x] += bi[x];"
                },
                AIsScalar: "B.getCopy().plus(A);",
                AIsMatrix: "A.getCopy().plus(B);"
            },
            '-': {
                "name": "minus",
                "real/real": {
                    scalar: "a[x] -= b;",
                    matrix: "a[x] -= b[x];"
                },
                "real/imag": {
                    scalar: "ar[x] -= br;    ai[x] = -bi;",
                    matrix: "ar[x] -= br[x]; ai[x] = -bi[x];"
                },
                "imag/real": {
                    scalar: "ar[x] -= b;",
                    matrix: "ar[x] -= b[x];"
                },
                "imag/imag": {
                    scalar: "ar[x] -= br;    ai[x] -= bi;",
                    matrix: "ar[x] -= br[x]; ai[x] -= bi[x];"
                },
                AIsScalar: "B.getCopy().plus(A.uminus());",
                AIsMatrix: "A.getCopy().minus(B);"
            },
            '.*': {
                "name": "times",
                "real/real": {
                    scalar: "a[x] *= b;",
                    matrix: "a[x] *= b[x];"
                },
                "real/imag": {
                    scalar: "ai[x] = ar[x] * bi;    ar[x] *= br;",
                    matrix: "ai[x] = ar[x] * bi[x]; ar[x] *= br[x];"
                },
                "imag/real": {
                    scalar: "ar[x] *= b;    ai[x] *= b;",
                    matrix: "ar[x] *= b[x]; ai[x] *= b[x];"
                },
                "imag/imag": {
                    scalar: "var r = ar[x], i = ai[x];"
                        +   "ar[x] = r * br - i * bi;"
                        +   "ai[x] = r * bi + i * br;",
                    matrix: "var r1 = ar[x], i1 = ai[x], r2 = br[x], i2 = bi[x];"
                        +   "var t = 1 / (r2 * r2 + i2 * i2);"
                        +   "ar[x] = (r1 * r2 + i1 * i2) * t;"
                        +   "ai[x] = (i1 * r2 - r1 * i2) * t;"
                },
                AIsScalar: "B.getCopy().times(A);",
                AIsMatrix: "A.getCopy().times(B);"
            },
            './': {
                "name": "rdivide",
                "real/real": {
                    scalar: "a[x] /= b;",
                    matrix: "a[x] /= b[x];"
                },
                "real/imag": {
                    scalar_before: "ai.set(ar);"
                        +          "tmp = 1 / (br * br + bi * bi);"
                        +          "br = br * tmp;"
                        +          "bi = -bi * tmp;",
                    scalar: "ai[x] *= bi;           ar[x] *= br;",
                    matrix: "ai[x] = ar[x] * bi[x]; ar[x] *= br[x];"
                },
                "imag/real": {
                    scalar_before: "var b = 1 / b;",
                    scalar: "ar[x] *= b;    ai[x] *= b;",
                    matrix: "ar[x] /= b[x]; ai[x] /= b[x];"
                },
                "imag/imag": {
                    scalar_before: "var tmp = 1 / (br * br + bi * bi);"
                        +          "br *= tmp;"
                        +          "bi *= tmp;",
                    scalar: "var r = ar[x], i = ai[x];"
                        +   "ar[x] = r * br + i * bi;"
                        +   "ai[x] = i * bi - r * br;",
                    matrix: "var r1 = ar[x], i1 = ai[x], r2 = br[x], i2 = bi[x];"
                        +   "var t = 1 / (r2 * r2 + i2 * i2);"
                        +   "ar[x] = (r1 * r2 + i1 * i2) * t;"
                        +   "ai[x] = (i1 * r2 - r1 * i2) * t;"
                },
                AIsScalar: "B.getCopy().rdivide(A);",
                AIsMatrix: "A.getCopy().ldivide(B);"
            },
            '.\\': {
                "name": "ldivide",
                "real/real": {
                    scalar: "a[x] = b / a[x];",
                    matrix: "a[x] = b[x] / a[x];"
                },
                "real/imag": {
                    scalar: "ai[x] = bi / ar[x];    ar[x] = br / ar[x];",
                    matrix: "ai[x] = bi[x] / ar[x]; ar[x] = br[x] / ar[x];"
                },
                "imag/real": {
                    scalar: "var tmp = 1 / (ar[x] * ar[x] + ai[x] * ai[x]);"
                        +   "ai[x] = bi * tmp; ar[x] = br * tmp;",
                    matrix: "var tmp = 1 / (ar[x] * ar[x] + ai[x] * ai[x]);"
                        +   "ai[x] = bi[x] * tmp; ar[x] = br[x] * tmp;"
                },
                "imag/imag": {
                    scalar: "var r = br[x], i = bi[x];"
                        +   "ar[x] = r * ar + i * ai;"
                        +   "ai[x] = i * ai - r * ar;",
                    matrix: "var r1 = br[x], i1 = bi[x], r2 = ar[x], i2 = ai[x];"
                        +   "var t = 1 / (r2 * r2 + i2 * i2);"
                        +   "ar[x] = (r1 * r2 + i1 * i2) * t;"
                        +   "ai[x] = (i1 * r2 - r1 * i2) * t;"
                },
                AIsScalar: "B.getCopy().ldivide(A);",
                AIsMatrix: "A.getCopy().rdivide(B);"
            },
            '.^': {
                "name": "power",
                "real/real": {
                    scalar_before: "var pow = Math.pow;",
                    matrix_before: "var pow = Math.pow;",
                    scalar: "a[x] = pow(a[x], b);",
                    matrix: "a[x] = pow(a[x], b[x]);"
                },
                "real/imag": {
                    scalar: "throw new Error('Matrix.power: This function has not "
                        + "been implemented yet for complex number.');",
                    matrix: "throw new Error('Matrix.power: This function has not "
                        + "been implemented yet for complex number.');"
                },
                "imag/real": {
                    scalar: "throw new Error('Matrix.power: This function has not "
                        + "been implemented yet for complex number.');",
                    matrix: "throw new Error('Matrix.power: This function has not "
                        + "been implemented yet for complex number.');"
                },
                "imag/imag": {
                    scalar: "throw new Error('Matrix.power: This function has not "
                        + "been implemented yet for complex number.');",
                    matrix: "throw new Error('Matrix.power: This function has not "
                        + "been implemented yet for complex number.');"
                },
                AIsScalar: "B.isscalar() ? A.getCopy().power(B) : undefined;",
                AIsMatrix: "A.getCopy().power(B);"
            }
        };

        // Template function
        var fct = (function (b) {
            b = Matrix.toMatrix(b);
            var x, n = this.numel();
            var a = this, ar, ai, br, bi;
            if (b.isscalar()) {               // SCALAR
                if (a.isreal()) {             // REAL
                    if (b.isreal()) {         // REAL / REAL
                        a = a.getData();
                        b = b.getDataScalar();
                        "real/real-scalar";
                    } else {                  // REAL / IMAG
                        a.toComplex();
                        ar = a.getRealData();
                        ai = a.getImagData();
                        br = b.getRealData()[0];
                        bi = b.getImagData()[0];
                        "real/imag-scalar";
                    }
                } else {                      // IMAG
                    ar = a.getRealData();
                    ai = a.getImagData();
                    if (b.isreal()) {         // IMAG / REAL
                        b = b.getDataScalar();
                        "imag/real-scalar";
                    } else {                  // IMAG / IMAG
                        br = b.getRealData()[0];
                        bi = b.getImagData()[0];
                        "imag/imag-scalar";
                    }
                }
            } else {                          // MATRIX
                Tools.checkSizeEquals(a.getSize(), b.getSize(), Matrix.ignoreTrailingDims);
                if (a.isreal()) {             // MATRIX: REAL
                    if (b.isreal()) {         // MATRIX: REAL / REAL
                        a = a.getData();
                        b = b.getData();
                        "real/real-matrix";
                    } else {                  // MATRIX: REAL / IMAG
                        a.toComplex();
                        ar = a.getRealData();
                        ai = a.getImagData();
                        br = b.getRealData();
                        bi = b.getImagData();
                        "real/imag-matrix";
                    }
                } else {                      // MATRIX: IMAG
                    ar = a.getRealData();
                    ai = a.getImagData();
                    if (b.isreal()) {         // MATRIX: IMAG / REAL
                        b = b.getData();
                        "imag/real-matrix";
                    } else {                  // MATRIX: IMAG / IMAG
                        br = b.getRealData();
                        bi = b.getImagData();
                        "imag/imag-matrix";
                    }
                }
            }
            return this;
        }).toString();

        var fct2 = (function (A, B) {
            A = Matrix.toMatrix(A);
            B = Matrix.toMatrix(B);

            if (A.isscalar()) {
                return "AIsScalar";
            } else {
                return "AIsMatrix";
            }
        }).toString();

        var addLoop = function (str) {
            return "for (x = 0; x < n; x++) {" + str + "}";
        };

        var replace = function (fun, op, c) {
            var scalar = op[c].scalar_before ? op[c].scalar_before : "";
            var matrix = op[c].matrix_before ? op[c].matrix_before : "";
            scalar += addLoop(op[c].scalar);
            matrix += addLoop(op[c].matrix);
            fun = fun.replace("\"" + c + "-matrix\";", matrix);
            fun = fun.replace("\"" + c + "-scalar\";", scalar);
            return fun;
        };

        var o, op, fun;
        for (o in operators) {
            if (operators.hasOwnProperty(o)) {
                op = operators[o];
                fun = replace(fct, op, "real/real");
                fun = replace(fun, op, "real/imag");
                fun = replace(fun, op, "imag/real");
                fun = replace(fun, op, "imag/imag");
                eval("Matrix.prototype." + op.name + " = " + fun);

                fun = fct2.replace("\"AIsScalar\";", op.AIsScalar);
                fun = fun.replace("\"AIsMatrix\";", op.AIsMatrix);
                eval("Matrix." + op.name + " = " + fun);
            }
        }
    };

    /** Plus operator make an element wise addition.
     * This operation is done in place.
     *
     * __See also:__
     *  {@link Matrix#plus},
     *  {@link Matrix#minus},
     *  {@link Matrix#times},
     *  {@link Matrix#rdivide},
     *  {@link Matrix#ldivide}.
     *  {@link Matrix#ldivide}.
     *
     * @param {Number|Matrix} rightOp
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.plus = function (b) {
        b = Matrix.toMatrix(b);
        var x, n = this.numel();
        var a = this, ar, ai, br, bi;
        if (b.isscalar()) {               // SCALAR
            if (a.isreal()) {             // REAL
                if (b.isreal()) {         // REAL / REAL
                    a = a.getData();
                    b = b.getDataScalar();
                    for (x = 0; x < n; x++) {
                        a[x] += b;
                    }
                } else {                  // REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    for (x = 0; x < n; x++) {
                        ar[x] += br;
                        ai[x] = bi;
                    }
                }
            } else {                      // IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // IMAG / REAL
                    b = b.getDataScalar();
                    for (x = 0; x < n; x++) {
                        ar[x] += b;
                    }
                } else {                  // IMAG / IMAG
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    for (x = 0; x < n; x++) {
                        ar[x] += br;
                        ai[x] += bi;
                    }
                }
            }
        } else {                          // MATRIX
            Tools.checkSizeEquals(a.getSize(), b.getSize(), Matrix.ignoreTrailingDims);
            if (a.isreal()) {             // MATRIX: REAL
                if (b.isreal()) {         // MATRIX: REAL / REAL
                    a = a.getData();
                    b = b.getData();
                    for (x = 0; x < n; x++) {
                        a[x] += b[x];
                    }
                } else {                  // MATRIX: REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        ar[x] += br[x];
                        ai[x] = bi[x];
                    }
                }
            } else {                      // MATRIX: IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // MATRIX: IMAG / REAL
                    b = b.getData();
                    for (x = 0; x < n; x++) {
                        ar[x] += b[x];
                    }
                } else {                  // MATRIX: IMAG / IMAG
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        ar[x] += br[x];
                        ai[x] += bi[x];
                    }
                }
            }
        }
        return this;
    };

    Matrix_prototype['+='] = function (b) {
        return this.plus(b);
    };

    Matrix_prototype['+'] = function (b) {
        return this.getCopy().plus(b);
    };

    Matrix.plus = function (A, B) {
        return A['+'](B);
    };


    /** Minus operator make an element wise subtraction.
     *
     * __Also see:__
     * {@link Matrix#uminus},
     * {@link Matrix#plus},
     * {@link Matrix#times},
     * {@link Matrix#rdivide},
     * {@link Matrix#ldivide},
     *
     * @param {Number|Matrix} rightOp
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.minus = function (b) {
        b = Matrix.toMatrix(b);
        var x, n = this.numel();
        var a = this, ar, ai, br, bi;
        if (b.isscalar()) {               // SCALAR
            if (a.isreal()) {             // REAL
                if (b.isreal()) {         // REAL / REAL
                    a = a.getData();
                    b = b.getDataScalar();
                    for (x = 0; x < n; x++) {
                        a[x] -= b;
                    }
                } else {                  // REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    for (x = 0; x < n; x++) {
                        ar[x] -= br;
                        ai[x] = -bi;
                    }
                }
            } else {                      // IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // IMAG / REAL
                    b = b.getDataScalar();
                    for (x = 0; x < n; x++) {
                        ar[x] -= b;
                    }
                } else {                  // IMAG / IMAG
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    for (x = 0; x < n; x++) {
                        ar[x] -= br;
                        ai[x] -= bi;
                    }
                }
            }
        } else {                          // MATRIX
            Tools.checkSizeEquals(a.getSize(), b.getSize(), Matrix.ignoreTrailingDims);
            if (a.isreal()) {             // MATRIX: REAL
                if (b.isreal()) {         // MATRIX: REAL / REAL
                    a = a.getData();
                    b = b.getData();
                    for (x = 0; x < n; x++) {
                        a[x] -= b[x];
                    }
                } else {                  // MATRIX: REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        ar[x] -= br[x];
                        ai[x] = -bi[x];
                    }
                }
            } else {                      // MATRIX: IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // MATRIX: IMAG / REAL
                    b = b.getData();
                    for (x = 0; x < n; x++) {
                        ar[x] -= b[x];
                    }
                } else {                  // MATRIX: IMAG / IMAG
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        ar[x] -= br[x];
                        ai[x] -= bi[x];
                    }
                }
            }
        }
        return this;
    };

    Matrix_prototype['-='] = function (b) {
        return this.minus(b);
    };

    Matrix_prototype['-'] = function (b) {
        return this.getCopy().minus(b);
    };

    Matrix.minus = function (A, B) {
        return A['-'](B);
    };


    /** Uminus operator take the opposite of each Matrix value.
     *
     * @param {Number|Matrix} rightOp
     *
     * @chainable
     * @todo take into account the complex case.
     * @matlike
     */
    Matrix_prototype.uminus = function () {
        var x, ld = this.numel();
        if (this.isreal()) {
            var a = this.getData();
            for (x = 0; x < ld; x++) {
                a[x] = -a[x];
            }
        } else {
            var ar = this.getRealData(), ai = this.getImagData();
            for (x = 0; x < ld; x++) {
                ar[x] = -ar[x];
                ai[x] = -ai[x];
            }
        }
        return this;
    };

    Matrix.uminus = function (A) {
        return A.getCopy().uminus();
    };

    /** Times operator make an element wise multiplication.
     *
     * __Also see:__
     * {@link Matrix#minus},
     * {@link Matrix#plus},
     * {@link Matrix#rdivide},
     * {@link Matrix#ldivide}.
     *
     * @param {Number|Matrix} rightOp
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.times = function (b) {
        b = Matrix.toMatrix(b);
        var x, n = this.numel();
        var a = this, ar, ai, br, bi;
        if (b.isscalar()) {               // SCALAR
            if (a.isreal()) {             // REAL
                if (b.isreal()) {         // REAL / REAL
                    a = a.getData();
                    b = b.getDataScalar();
                    for (x = 0; x < n; x++) {
                        a[x] *= b;
                    }
                } else {                  // REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    for (x = 0; x < n; x++) {
                        ai[x] = ar[x] * bi;
                        ar[x] *= br;
                    }
                }
            } else {                      // IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // IMAG / REAL
                    b = b.getDataScalar();
                    for (x = 0; x < n; x++) {
                        ar[x] *= b;
                        ai[x] *= b;
                    }
                } else {                  // IMAG / IMAG
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    for (x = 0; x < n; x++) {
                        var r = ar[x], i = ai[x];
                        ar[x] = r * br - i * bi;
                        ai[x] = r * bi + i * br;
                    }
                }
            }
        } else {                          // MATRIX
            Tools.checkSizeEquals(a.getSize(), b.getSize(), Matrix.ignoreTrailingDims);
            if (a.isreal()) {             // MATRIX: REAL
                if (b.isreal()) {         // MATRIX: REAL / REAL
                    a = a.getData();
                    b = b.getData();
                    for (x = 0; x < n; x++) {a[x] *= b[x];}
                } else {                  // MATRIX: REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        ai[x] = ar[x] * bi[x];
                        ar[x] *= br[x];
                    }
                }
            } else {                      // MATRIX: IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // MATRIX: IMAG / REAL
                    b = b.getData();
                    for (x = 0; x < n; x++) {
                        ar[x] *= b[x];
                        ai[x] *= b[x];
                    }
                } else {                  // MATRIX: IMAG / IMAG
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        var r1 = ar[x], i1 = ai[x], r2 = br[x], i2 = bi[x];
                        var t = 1 / (r2 * r2 + i2 * i2);
                        ar[x] = (r1 * r2 + i1 * i2) * t;
                        ai[x] = (i1 * r2 - r1 * i2) * t;
                    }
                }
            }
        }
        return this;
    };

    Matrix_prototype['*='] = function (b) {
        return this.times(b);
    };

    Matrix_prototype['.*'] = function (b) {
        return this.getCopy().times(b);
    };

    Matrix.times = function (A, B) {
        return A['.*'](B);
    };


    /** Rdivide operator make an element wise division,
     * The right term is the denominator.
     *
     * __Also see:__
     * {@link Matrix#minus},
     * {@link Matrix#plus},
     * {@link Matrix#rdivide},
     * {@link Matrix#ldivide}.
     *
     * @param {Number|Matrix} rightOp
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.rdivide = function (b) {
        b = Matrix.toMatrix(b);
        var x, n = this.numel(), tmp;
        var a = this, ar, ai, br, bi;
        if (b.isscalar()) {               // SCALAR
            if (a.isreal()) {             // REAL
                if (b.isreal()) {         // REAL / REAL
                    a = a.getData();
                    b = b.getDataScalar();
                    for (x = 0; x < n; x++) {
                        a[x] /= b;
                    }
                } else {                  // REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    ai.set(ar);
                    tmp = 1 / (br * br + bi * bi);
                    br = br * tmp;
                    bi = -bi * tmp;
                    for (x = 0; x < n; x++) {
                        ai[x] *= bi;
                        ar[x] *= br;
                    }
                }
            } else {                      // IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // IMAG / REAL
                    b = b.getDataScalar();
                    b = 1 / b;
                    for (x = 0; x < n; x++) {
                        ar[x] *= b;
                        ai[x] *= b;
                    }
                } else {                  // IMAG / IMAG
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    tmp = 1 / (br * br + bi * bi);
                    br *= tmp;
                    bi *= tmp;
                    for (x = 0; x < n; x++) {
                        var r = ar[x], i = ai[x];
                        ar[x] = r * br + i * bi;
                        ai[x] = i * bi - r * br;
                    }
                }
            }
        } else {                          // MATRIX
            Tools.checkSizeEquals(a.getSize(), b.getSize(), Matrix.ignoreTrailingDims);
            if (a.isreal()) {             // MATRIX: REAL
                if (b.isreal()) {         // MATRIX: REAL / REAL
                    a = a.getData();
                    b = b.getData();
                    for (x = 0; x < n; x++) {
                        a[x] /= b[x];
                    }
                } else {                  // MATRIX: REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        ai[x] = ar[x] * bi[x];
                        ar[x] *= br[x];
                    }
                }
            } else {                      // MATRIX: IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // MATRIX: IMAG / REAL
                    b = b.getData();
                    for (x = 0; x < n; x++) {
                        ar[x] /= b[x];
                        ai[x] /= b[x];
                    }
                } else {                  // MATRIX: IMAG / IMAG
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        var r1 = ar[x], i1 = ai[x], r2 = br[x], i2 = bi[x];
                        var t = 1 / (r2 * r2 + i2 * i2);
                        ar[x] = (r1 * r2 + i1 * i2) * t;
                        ai[x] = (i1 * r2 - r1 * i2) * t;
                    }
                }
            }
        }
        return this;
    };

    Matrix_prototype['/='] = function (b) {
        return this.rdivide(b);
    };

    Matrix_prototype['./'] = function (b) {
        return this.getCopy().rdivide(b);
    };

    Matrix.rdivide = function (A, B) {
        return A['./'](B);
    };


    /** Ldivide operator make an element wise division,
     * The right term is the numerator.
     *
     * __Also see:__
     * {@link Matrix#minus},
     * {@link Matrix#plus},
     * {@link Matrix#rdivide},
     * {@link Matrix#ldivide}.
     *
     * @param {Number|Matrix} rightOp
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.ldivide = function (b) {
        b = Matrix.toMatrix(b);
        var x, n = this.numel(), tmp;
        var a = this, ar, ai, br, bi;
        if (b.isscalar()) {               // SCALAR
            if (a.isreal()) {             // REAL
                if (b.isreal()) {         // REAL / REAL
                    a = a.getData();
                    b = b.getDataScalar();
                    for (x = 0; x < n; x++) {
                        a[x] = b / a[x];
                    }
                } else {                  // REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    for (x = 0; x < n; x++) {
                        ai[x] = bi / ar[x];
                        ar[x] = br / ar[x];
                    }
                }
            } else {                      // IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // IMAG / REAL
                    b = b.getDataScalar();
                    for (x = 0; x < n; x++) {
                        tmp = 1 / (ar[x] * ar[x] + ai[x] * ai[x]);
                        ai[x] = bi * tmp;
                        ar[x] = br * tmp;
                    }
                } else {                  // IMAG / IMAG
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    for (x = 0; x < n; x++) {
                        var r = br[x], i = bi[x];
                        ar[x] = r * ar + i * ai;
                        ai[x] = i * ai - r * ar;
                    }
                }
            }
        } else {                          // MATRIX
            Tools.checkSizeEquals(a.getSize(), b.getSize(), Matrix.ignoreTrailingDims);
            if (a.isreal()) {             // MATRIX: REAL
                if (b.isreal()) {         // MATRIX: REAL / REAL
                    a = a.getData();
                    b = b.getData();
                    for (x = 0; x < n; x++) {
                        a[x] = b[x] / a[x];
                    }
                } else {                  // MATRIX: REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        ai[x] = bi[x] / ar[x];
                        ar[x] = br[x] / ar[x];
                    }
                }
            } else {                      // MATRIX: IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // MATRIX: IMAG / REAL
                    b = b.getData();
                    for (x = 0; x < n; x++) {
                        tmp = 1 / (ar[x] * ar[x] + ai[x] * ai[x]);
                        ai[x] = bi[x] * tmp;
                        ar[x] = br[x] * tmp;
                    }
                } else {                  // MATRIX: IMAG / IMAG
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        var r1 = br[x], i1 = bi[x], r2 = ar[x], i2 = ai[x];
                        var t = 1 / (r2 * r2 + i2 * i2);
                        ar[x] = (r1 * r2 + i1 * i2) * t;
                        ai[x] = (i1 * r2 - r1 * i2) * t;
                    }
                }
            }
        }
        return this;
    };

    Matrix_prototype['\\='] = function (b) {
        return this.ldivide(b);
    };

    Matrix_prototype['.\\'] = function (b) {
        return this.getCopy().ldivide(b);
    };

    Matrix.ldivide = function (A, B) {
        return A['.\\'](B);
    };


    /** Ldivide operator make an element wise power operation,
     *
     * __Also see:__
     * {@link Matrix#minus},
     * {@link Matrix#plus},
     * {@link Matrix#rdivide},
     * {@link Matrix#ldivide}.
     *
     * @param {Number|Matrix} rightOp
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.power = function (b) {
        b = Matrix.toMatrix(b);
        var x, n = this.numel();
        var a = this, ar, ai, br, bi, rb, tb;
        var pow = Math.pow, sqrt = Math.sqrt, cos = Math.cos, sin = Math.sin, atan2 = Math.atan2;
        if (b.isscalar()) {               // SCALAR
            if (a.isreal()) {             // REAL
                if (b.isreal()) {         // REAL / REAL
                    a = a.getData();
                    b = b.getDataScalar();
                    for (x = 0; x < n; x++) {
                        a[x] = pow(a[x], b);
                    }
                } else {                  // REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    for (x = 0; x < n; x++) {
                        throw new Error('Matrix.power: This function has not been implemented yet for complex number.');
                    }
                }
            } else {                      // IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // IMAG / REAL
                    b = b.getDataScalar();
                    for (x = 0; x < n; x++) {
                        rb = pow(sqrt(ar[x] * ar[x] + ai[x] * ai[x]), b);
                        tb = b * atan2(ai[x], ar[x]);
                        ar[x] = rb * cos(tb);
                        ai[x] = rb * sin(tb);
                    }
                } else {                  // IMAG / IMAG
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    for (x = 0; x < n; x++) {
                        throw new Error('Matrix.power: This function has not been implemented yet for complex number.');
                    }
                }
            }
        } else {                          // MATRIX
            Tools.checkSizeEquals(a.getSize(), b.getSize(), Matrix.ignoreTrailingDims);
            if (a.isreal()) {             // MATRIX: REAL
                if (b.isreal()) {         // MATRIX: REAL / REAL
                    a = a.getData();
                    b = b.getData();
                    for (x = 0; x < n; x++) {
                        a[x] = pow(a[x], b[x]);
                    }
                } else {                  // MATRIX: REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        throw new Error('Matrix.power: This function has not been implemented yet for complex number.');
                    }
                }
            } else {                      // MATRIX: IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // MATRIX: IMAG / REAL
                    b = b.getData();
                    for (x = 0; x < n; x++) {
                        rb = pow(sqrt(ar[x] * ar[x] + ai[x] * ai[x]), b[x]);
                        tb = b[x] * atan2(ai[x], ar[x]);
                        ar[x] = rb * cos(tb);
                        ai[x] = rb * sin(tb);
                    }
                } else {                  // MATRIX: IMAG / IMAG
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        throw new Error('Matrix.power: This function has not been implemented yet for complex number.');
                    }
                }
            }
        }
        return this;
    };

    Matrix_prototype['.^'] = function (b) {
        return this.getCopy().power(b);
    };

    Matrix.power = function (A, B) {
        return A['.^'](B);
    };


    //////////////////////////////////////////////////////////////////
    //                        Other operators                       //
    //////////////////////////////////////////////////////////////////

 
    /** Apply a function to values of Matrix.
     *
     * @param {Function} f
     *  Function to apply to Array elements.
     *
     * @chainable
     * @todo This function should provide a way to deal with complex
     * @matlike
     * @method arrayfun
     */
    (function (Matrix_prototype) {
        var apply_real = function(data, f) {
            var i, ie;
            for (i = 0, ie = data.length; i < ie; i++) {
                data[i] = f(data[i]);
            }
        };

        Matrix_prototype.arrayfun = function (fct) {
            if (!this.isreal()) {
                throw new Error("Matrix.arrayfun: This function doesn't " +
                                "work with complex numbers.");
            }
            if (typeof fct !== 'function') {
                throw new Error('Matrix.arrayfun: Argument must be a function.');
            }
            apply_real(this.getData(), fct.bind(this));
            return this;
        };

    })(Matrix_prototype);

    /** Transpose operator transposed a 2D matrix.
     *
     * @return {Matrix}
     * @matlike
     */
    Matrix_prototype.transpose = function () {
        if (!this.ismatrix()) {
            throw new Error('Matrix.transpose: ' +
                            'Transposition is only defined for matrix.');
        }
        var v = this.getView().swapDimensions(0, 1);
        return this.extractViewFrom(v);
    };

    /** Complex conjugate transposition operator.
     *
     * @return {Matrix}
     * @matlike
     */
    Matrix_prototype.ctranspose = function () {
        return this.transpose().conj();
    };

    /** Compute the p-norm of the Matrix
     * (the sum of all elements at power p).
     *
     * @param {Integer} power
     *
     * @return {Number} result
     *
     * @chainable
     * @matlike
     * @method norm
     */
    (function (Matrix_prototype) {

        var l1 = function (xd, n) {
            for (var i = 0, norm = 0.0; i < n; i++) {
                var tmp = xd[i];
                norm += tmp > 0 ? tmp : -tmp;
            }
            return norm;
        };
        var l2 = function (xd, n) {
            for (var i = 0, norm = 0.0; i < n; i++) {
                var tmp = xd[i];
                norm += tmp * tmp;
            }
            return norm;
        };
        var lp = function (xd, n, p) {
            var pow = Math.pow, abs = Math.abs;
            for (var i = 0, norm = 0.0; i < n; i++) {
                norm += pow(abs(xd[i]), p);
            }
            return norm;
        };

        Matrix_prototype.norm = function (p) {
            if (p === undefined) {
                p = 2;
            } else if (!Tools.isNumber(p)) {
                throw new Error('Matrix.norm: Argument p must be a number.');
            }
            var xd = this.getData(), n = xd.length;
            var norm;
            if (p === 1) {
                norm = l1(xd, n);
            } else if (p === 2) {
                norm = l2(xd, n);
            } else {
                norm = lp(xd, n, p);
            }
            return Math.pow(norm, 1 / p);
        };

    })(Matrix_prototype);

    /** Return a the upper part of the Matrix.
     * The lower part is set to zero.
     *
     * @param {Integer} shift
     *  Define diagonal separing the upper from
     *  the lower part of the Matrix.
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.triu = function (shift) {
        if (shift === undefined) {
            shift = 0;
        }
        var view = this.getView();
        var dn = view.getStep(1), m = view.getSize(0), n = view.getSize(1);

        var k, _k, lk, elk;

        if (this.isreal()) {
            var ud = this.getData();
            for (k = 0, _k = 0; k < n; _k += dn, k++) {
                for (lk = _k + k + 1 - shift, elk = _k + m; lk < elk; lk++) {
                    ud[lk] = 0;
                }
            }
        } else {
            var urd = this.getRealData(), uid = this.getImagData();
            for (k = 0, _k = 0; k < n; _k += dn, k++) {
                for (lk = _k + k + 1 - shift, elk = _k + m; lk < elk; lk++) {
                    urd[lk] = 0;
                    uid[lk] = 0;
                }
            }
        }
        return this;
    };

    /** Return a the lower part of the Matrix.
     * The upper part is set to zero.
     *
     * See also:

     *  {@link Matrix#tril},
     *  {@link Matrix#diag}.
     *
     * @param {Integer} shift
     *  Define diagonal separing the upper from
     *  the lower part of the Matrix.
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.tril = function (shift) {
        var L = this.getCopy();
        if (shift === undefined) {
            shift = 0;
        }
        var view = L.getView();
        var dn = view.getStep(1), m = view.getSize(0), n = view.getSize(1);

        var k, _k, lk, elk, s;
        s = Math.min(m, n);

        if (this.isreal()) {
            var ld = L.getData();
            for (k = 0, _k = 0; k < n; _k += dn, k++) {
                for (lk = _k, elk = _k + k - shift; lk < elk; lk++) {
                    ld[lk] = 0;
                }
            }
        } else {
            var lrd = L.getRealData(), lid = L.getImagData();
            for (k = 0, _k = 0; k < n; _k += dn, k++) {
                for (lk = _k, elk = _k + k - shift; lk < elk; lk++) {
                    lrd[lk] = 0;
                    lid[lk] = 0;
                }
            }
        }
        return L;
    };

    /** Return a vector containing the diagonal elements.
     *
     * See also:
     * {@link Matrix#triu},
     * {@link Matrix#tril}.
     *
     * @param {Integer} shift
     *  Define diagonal to be copied.
     *
     * @matlike
     *
     * @todo
     * This function should return a Matrix if a vector is given as input.
     */
    Matrix_prototype.diag = function (shift) {
        if (shift === undefined) {
            shift = 0;
        }
        var view = this.getView();
        var dm = view.getStep(0), m = view.getSize(0);
        var dn = view.getStep(1), n = view.getSize(1);

        var f, s;
        if (shift > 0) {
            shift = Math.abs(shift);
            f = dn;
            s = Math.min(m, n - shift);
        } else {
            shift = Math.abs(shift);
            f = dm;
            s = Math.min(m - shift, n);
        }
        if (s <= 0) {
            throw new Error("Matrix.diag: Invalid diagonal requirement.");
        }
        var D = new Matrix([1, s], this.type(), !this.isreal());
        var k, lk;

        var step = dn + dm;
        lk = shift * f;
        if (this.isreal()) {
            var ud = this.getData();
            var dd = D.getData();
            for (k = 0; k < s; k++, lk += step) {
                dd[k] = ud[lk];
            }
        } else {
            var urd = this.getRealData(), uid = this.getImagData();
            var drd = D.getRealData(), did = D.getImagData();
            for (k = 0; k < s; k++, lk += step) {
                drd[k] = urd[lk];
                did[k] = uid[lk];
            }
        }
        return D;
    };

    /** Apply a function on two Matrix by extending the non-singleton 
     * dimensions.
     *
     * @param {Function|String} fun
     *  Function to be applied. If string, it should be either:
     *  - "plus", "minus", "times", "rdivide", "ldivide", 
     *  - "min", "max"
     *  - "atan2", "hypot"
     *  - "eq", "ne", "lt", "le", "gt", "ge", "and", "or"
     *
     * @param {Matrix} A
     *  First Matrix
     *
     * @param {Matrix} B
     *  Second Matrix
     *
     * @matlike
     */
    Matrix.bsxfun = function (fun, a, b) {
        a = Matrix.toMatrix(a);
        b = Matrix.toMatrix(b);
        if (!a.isreal() || !b.isreal()) {
            throw new Error("Matrix.bsxfun: This function doesn't " +
                            "work with complex numbers.");
        }
        
        var aView = a.getView(), bView = b.getView();
        
        var i, ei = Math.max(aView.ndims(), bView.ndims());
        for (i = 0; i < ei; i++) {
            var asize = a.getSize(i), bsize = b.getSize(i);
            if (asize === 1 && bsize > 1) {
                aView.selectIndicesDimension(i, new Uint8Array(bsize));
            } else if (bsize === 1 && asize > 1) {
                bView.selectIndicesDimension(i, new Uint8Array(asize));
            } else if (bsize !== asize) {
                throw new Error("Matrix.bsxfun: Incompatiblity on dimension: " + i);
            }
        }
        var out = Matrix.zeros(aView.getSize());
        var od = out.getData(), ad = a.getData(), bd = b.getData();
        var aiterator = aView.getIterator(0), biterator = bView.getIterator(0);
        var ait = aiterator.iterator, ab = aiterator.begin, e = aiterator.isEnd;
        var bit = biterator.iterator, bb = biterator.begin;
        var io, ia, ib;

        if (fun instanceof Function) {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = fun(ad[ia], bd[ib]);
            }
        } else if (fun === "plus") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] + bd[ib];
            }
        } else if (fun === "minus") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] - bd[ib];
            }
        } else if (fun === "times") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] * bd[ib];
            }
        } else if (fun === "rdivide") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] / bd[ib];
            }
        } else if (fun === "ldivide") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = bd[ib] / ad[ia];
            }
        } else if (fun === "min") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = bd[ib] > ad[ia] ? ad[ia] : bd[ib];
            }
        } else if (fun === "power") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = Math.pow(ad[ia], bd[ib]);
            }
        } else if (fun === "hypot") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = Math.sqrt(bd[ib] * bd[ib] + ad[ia] * ad[ia]);
            }
        } else if (fun === "atan2") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = Math.atan2(ad[ia], bd[ib]);
            }
        } else if (fun === "eq") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] === bd[ib] ? 1 : 0;
            }
        } else if (fun === "ne") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] !== bd[ib] ? 1 : 0;
            }
        } else if (fun === "lt") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] < bd[ib] ? 1 : 0;
            }
        } else if (fun === "le") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] <= bd[ib] ? 1 : 0;
            }
        } else if (fun === "gt") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] > bd[ib] ? 1 : 0;
            }
        } else if (fun === "ge") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] >= bd[ib] ? 1 : 0;
            }
        } else if (fun === "and") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] && bd[ib] ? 1 : 0;
            }
        } else if (fun === "or") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] || bd[ib] ? 1 : 0;
            }
        } else {
            throw new Error("Matrix.bsxfun: Wrong function argument.");
        }
        return out;
    };

    /** Return a Matrix containg of the same where values are 
     * either -1, 0, 1 depending on the sign of the elements.
     *
     * @matlike
     */
    Matrix.prototype.sign = function () {
        var d = this.getData();
        var out = new Matrix(this.getSize());
        var od = out.getData();
        for (var i = 0, ie = d.length; i < ie; i++) {
            od[i] = d[i] > 0 ? 1 : (d[i] < 0 ? -1 : 0);
        }
        return out;
    };

})(Matrix, Matrix.prototype);





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

(function (Matrix_prototype) {
    "use strict";

    // HAS TO BE IMPROVED !!
    var calerf = function (A, JINT) {
        if (!Tools.isInteger(JINT) || !Tools.isInRange(JINT, 0, 2)) {
            throw new Error("Matrix.calerf: Invalid argument.");
        }

        var pa = 3.97886080735226000e+00;
        var p0 = 2.75374741597376782e-01;
        var p1 = 4.90165080585318424e-01;
        var p2 = 7.74368199119538609e-01;
        var p3 = 1.07925515155856677e+00;
        var p4 = 1.31314653831023098e+00;
        var p5 = 1.37040217682338167e+00;
        var p6 = 1.18902982909273333e+00;
        var p7 = 8.05276408752910567e-01;
        var p8 = 3.57524274449531043e-01;
        var p9 = 1.66207924969367356e-02;
        var p10 = -1.19463959964325415e-01;
        var p11 = -8.38864557023001992e-02;
        var p12 = 2.49367200053503304e-03;
        var p13 = 3.90976845588484035e-02;
        var p14 = 1.61315329733252248e-02;
        var p15 = -1.33823644533460069e-02;
        var p16 = -1.27223813782122755e-02;
        var p17 = 3.83335126264887303e-03;
        var p18 = 7.73672528313526668e-03;
        var p19 = -8.70779635317295828e-04;
        var p20 = -3.96385097360513500e-03;
        var p21 = 1.19314022838340944e-04;
        var p22 = 1.27109764952614092e-03;

        var a = new Float64Array(
            [
                0.00000000005958930743e0, -0.00000000113739022964e0,
                0.00000001466005199839e0, -0.00000016350354461960e0,
                0.00000164610044809620e0, -0.00001492559551950604e0,
                0.00012055331122299265e0, -0.00085483269811296660e0,
                0.00522397762482322257e0, -0.02686617064507733420e0,
                0.11283791670954881569e0, -0.37612638903183748117e0,
                1.12837916709551257377e0,
                0.00000000002372510631e0, -0.00000000045493253732e0,
                0.00000000590362766598e0, -0.00000006642090827576e0,
                0.00000067595634268133e0, -0.00000621188515924000e0,
                0.00005103883009709690e0, -0.00037015410692956173e0,
                0.00233307631218880978e0, -0.01254988477182192210e0,
                0.05657061146827041994e0, -0.21379664776456006580e0,
                0.84270079294971486929e0,
                0.00000000000949905026e0, -0.00000000018310229805e0,
                0.00000000239463074000e0, -0.00000002721444369609e0,
                0.00000028045522331686e0, -0.00000261830022482897e0,
                0.00002195455056768781e0, -0.00016358986921372656e0,
                0.00107052153564110318e0, -0.00608284718113590151e0,
                0.02986978465246258244e0, -0.13055593046562267625e0,
                0.67493323603965504676e0,
                0.00000000000382722073e0, -0.00000000007421598602e0,
                0.00000000097930574080e0, -0.00000001126008898854e0,
                0.00000011775134830784e0, -0.00000111992758382650e0,
                0.00000962023443095201e0, -0.00007404402135070773e0,
                0.00050689993654144881e0, -0.00307553051439272889e0,
                0.01668977892553165586e0, -0.08548534594781312114e0,
                0.56909076642393639985e0,
                0.00000000000155296588e0, -0.00000000003032205868e0,
                0.00000000040424830707e0, -0.00000000471135111493e0,
                0.00000005011915876293e0, -0.00000048722516178974e0,
                0.00000430683284629395e0, -0.00003445026145385764e0,
                0.00024879276133931664e0, -0.00162940941748079288e0,
                0.00988786373932350462e0, -0.05962426839442303805e0,
                0.49766113250947636708e0
            ]);
        var b = new Float64Array(
            [
               -0.00000000029734388465e0,  0.00000000269776334046e0,
               -0.00000000640788827665e0, -0.00000001667820132100e0,
               -0.00000021854388148686e0,  0.00000266246030457984e0,
                0.00001612722157047886e0, -0.00025616361025506629e0,
                0.00015380842432375365e0,  0.00815533022524927908e0,
               -0.01402283663896319337e0, -0.19746892495383021487e0,
                0.71511720328842845913e0,
               -0.00000000001951073787e0, -0.00000000032302692214e0,
                0.00000000522461866919e0,  0.00000000342940918551e0,
               -0.00000035772874310272e0,  0.00000019999935792654e0,
                0.00002687044575042908e0, -0.00011843240273775776e0,
               -0.00080991728956032271e0,  0.00661062970502241174e0,
                0.00909530922354827295e0, -0.20160072778491013140e0,
                0.51169696718727644908e0,
                0.00000000003147682272e0, -0.00000000048465972408e0,
                0.00000000063675740242e0,  0.00000003377623323271e0,
               -0.00000015451139637086e0, -0.00000203340624738438e0,
                0.00001947204525295057e0,  0.00002854147231653228e0,
               -0.00101565063152200272e0,  0.00271187003520095655e0,
                0.02328095035422810727e0, -0.16725021123116877197e0,
                0.32490054966649436974e0,
                0.00000000002319363370e0, -0.00000000006303206648e0,
               -0.00000000264888267434e0,  0.00000002050708040581e0,
                0.00000011371857327578e0, -0.00000211211337219663e0,
                0.00000368797328322935e0,  0.00009823686253424796e0,
               -0.00065860243990455368e0, -0.00075285814895230877e0,
                0.02585434424202960464e0, -0.11637092784486193258e0,
                0.18267336775296612024e0,
               -0.00000000000367789363e0,  0.00000000020876046746e0,
               -0.00000000193319027226e0, -0.00000000435953392472e0,
                0.00000018006992266137e0, -0.00000078441223763969e0,
               -0.00000675407647949153e0,  0.00008428418334440096e0,
               -0.00017604388937031815e0, -0.00239729611435071610e0,
                0.02064129023876022970e0, -0.06905562880005864105e0,
                0.09084526782065478489e0
            ]);

        var data = A.getData(), i, ie;
        var w, t, k, y, u;
        var abs = Math.abs, floor = Math.floor, exp = Math.exp;
        // Erf computation
        if (JINT === 0) {
            for (i = 0, ie = A.getLength(); i < ie; i++) {
                w = abs(data[i]);
                if (w < 2.2e0) {
                    t = w * w;
                    k = floor(t);
                    t = t - k;
                    k = k * 13;
                    y = ((((((((((((a[k] * t + a[k + 1]) * t +
                                   a[k + 2]) * t + a[k + 3]) * t + a[k + 4]) * t +
                                a[k + 5]) * t + a[k + 6]) * t + a[k + 7]) * t +
                             a[k + 8]) * t + a[k + 9]) * t + a[k + 10]) * t +
                          a[k + 11]) * t + a[k + 12]) * w;
                } else if (w < 6.9e0) {
                    k = floor(w);
                    t = w - k;
                    k = 13 * (k - 2);
                    y = (((((((((((b[k] * t + b[k + 1]) * t +
                                  b[k + 2]) * t + b[k + 3]) * t + b[k + 4]) * t +
                               b[k + 5]) * t + b[k + 6]) * t + b[k + 7]) * t +
                            b[k + 8]) * t + b[k + 9]) * t + b[k + 10]) * t +
                         b[k + 11]) * t + b[k + 12];
                    y = y * y;
                    y = y * y;
                    y = y * y;
                    y = 1 - y * y;
                } else {
                    y = 1;
                }
                if (data[i] < 0) {
                    y = -y;
                }
                data[i] = y;
            }
            // Erfc computation
        } else if (JINT === 1) {
            for (i = 0, ie = A.getLength(); i < ie; i++) {
                t = pa / (pa + abs(data[i]));
                u = t - 0.5e0;
                y = (((((((((p22 * u + p21) * u + p20) * u +
                           p19) * u + p18) * u + p17) * u + p16) * u +
                       p15) * u + p14) * u + p13) * u + p12;
                y = ((((((((((((y * u + p11) * u + p10) * u +
                              p9) * u + p8) * u + p7) * u + p6) * u + p5) * u +
                         p4) * u + p3) * u + p2) * u + p1) * u + p0) * t *
                    exp(-data[i] * data[i]);
                if (data[i] < 0) {
                    y = 2 - y;
                }
                data[i] = y;
            }
            // Erfcx computation
        } else if (JINT === 2) {
            for (i = 0, ie = A.getLength(); i < ie; i++) {
                t = pa / (pa + abs(data[i]));
                u = t - 0.5e0;
                y = (((((((((p22 * u + p21) * u + p20) * u +
                           p19) * u + p18) * u + p17) * u + p16) * u +
                       p15) * u + p14) * u + p13) * u + p12;
                y = ((((((((((((y * u + p11) * u + p10) * u +
                              p9) * u + p8) * u + p7) * u + p6) * u + p5) * u +
                         p4) * u + p3) * u + p2) * u + p1) * u + p0) * t *
                    exp(-data[i] * data[i]);
                if (data[i] < 0) {
                    y = 2 - y;
                }
                data[i] = exp(data[i] * data[i]) * y;
            }
        }
        return A;
    };

    /** Apply the error function at each element of the matrix.
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.erf = function () {
        return calerf(this, 0);
    };

    /** Apply the complementary error function at each element of 
     * the matrix.
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.erfc = function () {
        return calerf(this, 1);
    };

    /** Apply the scaled complementary error function at each 
     * element of the matrix.
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.erfcx = function () {
        return calerf(this, 2);
    };
    
    /** Apply the gamma function to the `Matrix`.
     * @chainable 
     * @fixme check the output epecially for negative values.
     * @method gamma
     */
    (function (Matrix_prototype) {
        var xbig = 171.624;
        var p = new Float64Array([
            -1.71618513886549492533811,
             24.7656508055759199108314,
            -379.804256470945635097577,
             629.331155312818442661052,
             866.966202790413211295064,
            -31451.2729688483675254357,
            -36144.4134186911729807069,
             66456.1438202405440627855
            ]),
            q = new Float64Array([
                -30.8402300119738975254353,
                 315.350626979604161529144,
                -1015.15636749021914166146,
                -3107.77167157231109440444,
                 22538.1184209801510330112,
                 4755.84627752788110767815,
                -134659.959864969306392456,
                -115132.259675553483497211
            ]),
            c = new Float64Array([
                -0.001910444077728,
                 8.4171387781295e-4,
                -5.952379913043012e-4,
                 7.93650793500350248e-4,
                -0.002777777777777681622553,
                 0.08333333333333333331554247,
                 0.0057083835261
            ]);

        var trunc = function (x) {
            return (x > 0) ? Math.floor(x) : Math.ceil(x);
        };
        Matrix_prototype.gamma = function () {
            if (!this.isreal()) {
                throw "Matrix.gamma: Do not work on complex numbers.";
            }
            var INFINITY = Number.POSITIVE_INFINITY,
                LN_SQRT_2PI  = 0.9189385332046727417803297,
                DBL_MIN      = 2.22507e-308,
                DBL_EPSILON  = 2.220446049250313e-16;

            var x, i, xden, xnum, z, yi, res, sum, ysq;
            var data = this.getData(), d, de;
            for (d = 0, de = data.length; d < de; d++) {
                x = data[d];
                var parity = 0, fact = 1.0, n = 0.0, y = x;
                if (y <= 0.0) {
                    y = -x;
                    yi = trunc(y);
                    res = y - yi;
                    if (res !== 0.0) {
                        if (yi !== trunc(yi * 0.5) * 2.0) {
                            parity = 1.0;
                        }
                        fact = -Math.PI / Math.sin(Math.PI * res);
                        y += 1.0;
                    } else {
                        data[d] = INFINITY;
                        continue;
                    }
                }

                if (y < DBL_EPSILON) {
                    if (y >= DBL_MIN) {
                        res = 1.0 / y;
                    } else {
                        data[d] = INFINITY;
                        continue;
                    }
                } else if (y < 12.0) {
                    yi = y;
                    if (y < 1.0) {
                        z = y;
                        y += 1.0;
                    } else {
                        n = parseInt(y, 10) - 1;
                        y -= parseFloat(n);
                        z = y - 1.0;
                    }
                    xnum = 0.0;
                    xden = 1.0;
                    for (i = 0; i < 8; ++i) {
                        xnum = (xnum + p[i]) * z;
                        xden = xden * z + q[i];
                    }
                    res = xnum / xden + 1.0;
                    if (yi < y) {
                        res /= yi;
                    } else if (yi > y) {
                        for (i = 0; i < n; ++i) {
                            res *= y;
                            y += 1.0;
                        }
                    }
                } else {
                    if (y <= xbig) {
                        ysq = y * y;
                        sum = c[6];
                        for (i = 0; i < 6; i++) {
                            sum = sum / ysq + c[i];
                        }
                        sum = sum / y - y + LN_SQRT_2PI;
                        sum += (y - 0.5) * Math.log(y);
                        res = Math.exp(sum);
                    } else {
                        data[d] = INFINITY;
                        continue;
                    }
                }

                if (parity) {
                    res = -res;
                }
                if (fact !== 1.0) {
                    res = fact / res;
                }
                data[d] = res;
            }
            return this;
        };
    })(Matrix_prototype);

})(Matrix.prototype);



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
    root.extractModes = extractModes;
    root.extractGaps = extractGaps;
    root.extravctModesAndGaps = extractModesAndGaps
    
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
