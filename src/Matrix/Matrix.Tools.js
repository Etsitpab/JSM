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
     * @param {Integer[]} shape
     *  Shape of the returned matrix
     *
     * @return {Matrix}
     */
    Matrix.toMatrix = function (data, shape) {
        if (data instanceof Matrix) {
            return shape ? data.reshape(shape) : data;
        }
        if (data.constructor === Number) {
            data = [data];
        }

        var d;
        if (data instanceof Array) {
            d = Array.prototype.concat.apply([], data);
        } else {
            d = data;
        }
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
        var matOut = new Matrix(size, d, false, isBoolean);
        return shape ? matOut.reshape(shape) : matOut;
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
