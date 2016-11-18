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

    Matrix.cos = function (A) {
        return Matrix.toMatrix(A).getCopy().cos();
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

    Matrix.sin = function (A) {
        return Matrix.toMatrix(A).getCopy().sin();
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

    Matrix.tan = function (A) {
        return Matrix.toMatrix(A).getCopy().tan();
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
        Matrix.exp = function (A) {
            return Matrix.toMatrix(A).getCopy().exp();
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

    Matrix.log = function (A) {
        return Matrix.toMatrix(A).getCopy().log();
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
            data[i] = Math.log10(data[i]);
        }
        return this;
    };

    Matrix.log10 = function (A) {
        return Matrix.toMatrix(A).getCopy().log10();
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
            data[i] = Math.log2(data[i]);
        }
        return this;
    };

    Matrix.log2 = function (A) {
        return Matrix.toMatrix(A).getCopy().log2();
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

    Matrix.floor = function (A) {
        return Matrix.toMatrix(A).getCopy().floor();
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

    Matrix.ceil = function (A) {
        return Matrix.toMatrix(A).getCopy().ceil();
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

    Matrix.round = function (A) {
        return Matrix.toMatrix(A).getCopy().round();
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

    Matrix.acos = function (A) {
        return Matrix.toMatrix(A).getCopy().acos();
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

    Matrix.asin = function (A) {
        return Matrix.toMatrix(A).getCopy().asin();
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
            data[i] = Math.atan(data[i]);
        }
        return this;
    };

    Matrix.atan = function (A) {
        return Matrix.toMatrix(A).getCopy().atan();
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

    Matrix.atan2 = function (A) {
        return Matrix.toMatrix(A).getCopy().atan2();
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
                    scalar: "a[x] = Math.pow(a[x], b);",
                    matrix: "a[x] = Math.pow(a[x], b[x]);"
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
        A = Matrix.toMatrix(A);
        return A.isscalar() ? Matrix.toMatrix(B)['+'](A) : Matrix.toMatrix(A)['+'](B);
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
        A = Matrix.toMatrix(A);
        return A.isscalar() ? Matrix.toMatrix(B)['-'](A) : Matrix.toMatrix(A)['-'](B);
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
        return Matrix.toMatrix(A).getCopy().uminus();
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
        A = Matrix.toMatrix(A);
        return A.isscalar() ? Matrix.toMatrix(B)['.*'](A) : Matrix.toMatrix(A)['.*'](B);
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
        A = Matrix.toMatrix(A);
        return A.isscalar() ? Matrix.toMatrix(B)['./'](A) : Matrix.toMatrix(A)['./'](B);
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
        A = Matrix.toMatrix(A);
        return A.isscalar() ? Matrix.toMatrix(B)['.\\'](A) : Matrix.toMatrix(A)['.\\'](B);
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
        A = Matrix.toMatrix(A);
        return A.isscalar() ? Matrix.toMatrix(B)['.^'](A) : Matrix.toMatrix(A)['.^'](B);
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





