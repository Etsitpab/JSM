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
        }

        Type = Tools.checkType(Type);
        var od = new Type(this.getData());
        return new Matrix(this.getSize(), od, undefined, true);
    };

    /** Converts a new Matrix to double.
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

    /** Converts a new Matrix to single.
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

    /** Converts a new Matrix to int8.
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

    /** Converts a new Matrix to int16.
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

    /** Converts a new Matrix to int32.
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

    /** Converts a new Matrix to uint8.
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

    /** Converts a new Matrix to uint8c.
     *
     * __Also see:__
     *  {@link Matrix#cast}.
     *
     * @return {Matrix}
     */
    Matrix_prototype.uint8c = function () {
        return this.cast('uint8c');
    };

    /** Converts a new Matrix to uint16.
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

    /** Converts a new Matrix to uint32.
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
                od[i] = (v === Infinity) || (v === -Infinity);
            }
        } else {
            var ird = this.getRealData(), iid = this.getImagData();
            for (i = 0, ie = od.length; i < ie; i++) {
                var vr = ird[i], vi = iid[i];
                od[i] = (vr === Infinity) || (vr === -Infinity) ||
                    (vi === Infinity) || (vi === -Infinity);
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
                od[i] = isFinite(id[i]);
            }
        } else {
            var ird = this.getRealData(), iid = this.getImagData();
            for (i = 0, ie = od.length; i < ie; i++) {
                od[i] = isFinite(ird[i]) || isFinite(iid[i]);
            }
        }
        return oMat;
    };

})(Matrix, Matrix.prototype);
