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
        var size = this.getSize();
        if (size.length > 2 || size[0] !== size[1]) {
            return false;
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
