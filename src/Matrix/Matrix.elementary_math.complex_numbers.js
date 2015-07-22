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
     * When used as Matrix object method, this function acts in place. 
     * Use the Matrix.angle property to work on a copy.
     *
     * __Also see:__
     *  {@link Matrix#abs}.
     *
     * @chainable
     * @matlike
     * @method angle
     */
    (function () {
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
        Matrix.angle = function (m) {
            return m.getCopy().angle();
        };

    })();

    /** Returns the absolute value for real Matrix and
     * the complex magnitude for complex Matrix.
     *
     * When used as Matrix object method, this function acts in place. 
     * Use the Matrix.abs property to work on a copy.
     *
     * __Also see:__
     *  {@link Matrix#angle}.
     *
     * @chainable
     * @matlike
     * @method abs
     */
    (function () {
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
        Matrix.abs = function (m) {
            return m.getCopy().abs();
        };
    })();

    /** Returns the complex conjugate of each element of the Matrix.
     *
     * When used as Matrix object method, this function acts in place. 
     * Use the Matrix.conj property to work on a copy.
     *
     * @matlike
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
    Matrix.conj = function (m) {
        return m.getCopy().conj();
    };

})(Matrix, Matrix.prototype);
