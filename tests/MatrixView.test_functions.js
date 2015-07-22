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

    /** Function used to test iterators and provide examples on how use them.
     *
     * __Also see:__
     * {@link MatrixView#getIterator},
     * {@link MatrixView#getSubIterator}.
     */
    MatrixView_prototype.iteratorTests = function (result) {

        // 1.1 - Simplest way to scan the view

        var test_1_1 = function (indices) {

            // Iterator to scan the view
            var iterator = this.getIterator(0);

            var i, ie, it = iterator.iterator, b = iterator.begin, e = iterator.end;
            for (i = b(), ie = e(); i !== ie; i = it()) {
                indices.push(i);
            }

            return indices;
        }.bind(this);

        // 1.2 - Simplest way with control on dimension 0

        var test_1_2 = function (indices) {
            var iterator = this.getIterator(1), ity = this.getSubIterator(0);

            // Iterator to scan the view on dimension greater than 0
            var i, it = iterator.iterator, b = iterator.begin, e = iterator.end;
            // Iterator to scan the view with control on dimension 0
            var y, ey, iy = ity.iterator, by = ity.begin, ye = ity.end;
            for (i = b(), e = e(); i !== e; i = it()) {
                for (y = by(i), ey = ye(); y !== ey; y = iy()) {
                    indices.push(y);
                }
            }
            return indices;
        }.bind(this);

        // 1.3 - Simplest way with control on dimension 0 and 1

        var test_1_3 = function (indices) {
            var iterator = this.getIterator(2), itx = this.getSubIterator(1), ity = this.getSubIterator(0);
            // Iterator to scan the view with iterator on dimension 2)
            var i, it  = iterator.iterator, b = iterator.begin, e = iterator.end;
            // Iterators to scan the dimension 1 and 0
            var x, ex, ix = itx.iterator, bx = itx.begin, endx = itx.end;
            var y, ey, iy = ity.iterator, by = ity.begin, endy = ity.end;

            for (i = b(), e = e(); i !== e; i = it()) {
                for (x = bx(i), ex = endx(); x !== ex; x = ix()) {
                    for (y = by(x), ey = endy(); y !== ey; y = iy()) {
                        indices.push(y);
                    }
                }
            }

            return indices;
        }.bind(this);

        // 2.1 - Same but more efficient way

        var test_2_1 = function (indices) {
            var iterator = this.getIterator(1);
            // Scaning the from the second dimension (dim = 1)
            var i, it  = iterator.iterator, b = iterator.begin, e = iterator.end;
            // First x value, end x value
            var x, xe, f = this.getFirst(0), l = this.getEnd(0);

            if (this.isIndicesIndexed(0)) {
                // Steps between 2 x values
                var s, steps = this.getSteps(0);
                for (i = b(), e = e(); i !== e; i = it()) {
                    for (s = 0, x = i + f, xe = i + l; x !== xe; x += steps[++s]) {
                        indices.push(x);
                    }
                }
            } else {
                // Step between 2 x values
                var n, d = this.getStep(0);
                for (i = b(), e = e(); i !== e; i = it()) {
                    for (x = i + f, n = i + l; x !== n; x += d) {
                        indices.push(x);
                    }
                }
            }

            return indices;
        }.bind(this);

        // 2.2 - With control on the 2 first dimensions

        var test_2_2 = function (indices) {
            var iterator = this.getIterator(2);
            // Scaning the from the second dimension (dim = 1)
            var i, ie, it = iterator.iterator, b = iterator.begin, e = iterator.end;
            // First value, step between 2 values, end value
            var itx = this.getSubIterator(1);
            var x, xe, ix = itx.iterator, bx = itx.begin, ex = itx.end;
            var y, ye, fy = this.getFirst(0), ly = this.getEnd(0);

            if (this.isIndicesIndexed(0)) {
                var sy, ySteps = this.getSteps(0);
                for (i = b(), ie = e(); i !== ie; i = it()) {
                    for (x = bx(i), xe = ex(); x !== xe; x = ix()) {
                        for (sy = 0, y = x + fy, ye = x + ly; y !== ye; y += ySteps[++sy]) {
                            indices.push(y);
                        }
                    }
                }
            } else {
                var ny, dy = this.getStep(0);
                for (i = b(), ie = e(); i !== ie; i = it()) {
                    for (x = bx(i), xe = ex(); x !== xe; x = ix()) {
                        for (y = x + fy, ny = x + ly; y !== ny; y += dy) {
                            indices.push(y);
                        }
                    }
                }
            }
            return indices;
        }.bind(this);

        // 2.3 - The extremist way

        var test_2_3 = function (indices) {
            var iterator = this.getIterator(2);
            // Scaning the from the second dimension (dim = 1)
            var i, ie, it = iterator.iterator, b = iterator.begin, e = iterator.end;
            // First value, step between 2 values, end value
            var x, xe, sx, xSteps, dx, nx, fx = this.getFirst(1), lx = this.getEnd(1);
            var y, ye, sy, ySteps, dy, ny, fy = this.getFirst(0), ly = this.getEnd(0);

            if (this.isIndicesIndexed(1)) {
                xSteps = this.getSteps(1);
                if (this.isIndicesIndexed(0)) { // NOT OK
                    ySteps = this.getSteps(0);
                    for (i = b(), ie = e(); i !== ie; i = it()) {
                        for (sx = 0, x = i + fx, xe = i + lx; x !== xe; x += xSteps[++sx]) {
                            for (sy = 0, y = x + fy, ye = x + ly; y !== ye; y += ySteps[++sy]) {
                                indices.push(y);
                            }
                        }
                    }
                } else { // NOT OK
                    dy = this.getStep(0);
                    for (i = b(), ie = e(); i !== ie; i = it()) {
                        for (sx = 0, x = i + fx, xe = i + lx; x !== xe; x += xSteps[++sx]) {
                            for (y = x + fy, ny = x + ly; y !== ny; y += dy) {
                                indices.push(y);
                            }
                        }
                    }
                }
            } else {
                dx = this.getStep(1);
                if (this.isIndicesIndexed(0)) { // OK
                    ySteps = this.getSteps(0);
                    for (i = b(), ie = e(); i !== ie; i = it()) {
                        for (x = i + fx, nx = i + lx; x !== nx; x += dx) {
                            for (sy = 0, y = x + fy, ye = x + ly; y !== ye; y += ySteps[++sy]) {
                                indices.push(y);
                            }
                        }
                    }
                } else { // OK !
                    dy = this.getStep(0);
                    for (i = b(), ie = e(); i !== ie; i = it()) {
                        for (x = i + fx, nx = i + lx; x !== nx; x += dx) {
                            for (y = x + fy, ny = x + ly; y !== ny; y += dy) {
                                indices.push(y);
                            }
                        }
                    }
                }
            }
            return indices;

        }.bind(this);
        var tic = Tools.tic, toc = Tools.toc;
        var t11, t12, t13, t21, t22, t23;
        tic();
        var indices_1_1 = test_1_1([]);
        console.log('Method 1.1 check ! Time: ', t11 = toc(), "ms");
        tic();
        var indices_1_2 = test_1_2([]);
        console.log('Method 1.2 check ! Time: ', t12 = toc(), "ms");
        tic();
        var indices_1_3 = test_1_3([]);
        console.log('Method 1.3 check ! Time: ', t13 = toc(), "ms");

        tic();
        var indices_2_1 = test_2_1([]);
        console.log('Method 2.1 check ! Time: ', t21 = toc(), "ms");
        tic();
        var indices_2_2 = test_2_2([]);
        console.log('Method 2.2 check ! Time: ', t22 = toc(), "ms");
        tic();
        var indices_2_3 = test_2_3([]);
        console.log('Method 2.3 check ! Time: ', t23 = toc(), "ms");
        if (result) {
            var i, ei;
            for (i = 0, ei = result.length; i < ei; i++) {
                var ind = result[i];
                if (ind !== indices_1_1[i]) {
                    throw new Error("iteratorTests: Indices are differents, test 1.1.");
                }
                if (ind !== indices_1_2[i]) {
                    throw new Error("iteratorTests: Indices are differents, test 1.2.");
                }
                if (ind !== indices_1_3[i]) {
                    throw new Error("iteratorTests: Indices are differents, test 1.3.");
                }
                if (ind !== indices_2_1[i]) {
                    throw new Error("iteratorTests: Indices are differents, test 2.1.");
                }
                if (ind !== indices_2_2[i]) {
                    throw new Error("iteratorTests: Indices are differents, test 2.2.");
                }
                if (ind !== indices_2_3[i]) {
                    throw new Error("iteratorTests: Indices are differents, test 2.3.");
                }
            }
            console.log("MatrixView.iteratorTests: Sucess !");
            return this;
        }
        return [t11, t12, t13, t21, t22, t23];
    };

    MatrixView._iteratorTests = function (n) {
        "use strict";
        var view = new MatrixView([5, 5]);
        var result = [
            0, 1, 2, 3, 4,
            5, 6, 7, 8, 9,
            10, 11, 12, 13, 14,
            15, 16, 17, 18, 19,
            20, 21, 22, 23, 24
        ];
        view.restore().iteratorTests(result)
            .restore().select([[0, 1, 2, 3, 4]], [[0, 1, 2, 3, 4]]).iteratorTests(result)
            .restore().select([], [[0, 1, 2, 3, 4]]).iteratorTests(result)
            .restore().select([[0, 1, 2, 3, 4]], []).iteratorTests(result);

        result.reverse();
        view.restore().select([-1, -1, 0], [-1, -1, 0]).iteratorTests(result)
            .restore().select([[4, 3, 2, 1, 0]], [[4, 3, 2, 1, 0]]).iteratorTests(result)
            .restore().select([[4, 3, 2, 1, 0]], [-1, -1, 0]).iteratorTests(result)
            .restore().select([-1, -1, 0], [[4, 3, 2, 1, 0]]).iteratorTests(result);
        var i, times = [];
        n = n === undefined ? 10 : n;
        for (i = 0; i < n; i++) {
            var u = 10, v = 10, w = 10, x = 10, y = 10, z = 10;
            times.push(new MatrixView([u, v, w, x, y, z]).iteratorTests());
        }
        times = Matrix.fromArray(times);
        times.mean().display("mean");
        times.variance().display("variance");
        times.min().display("min");
        times.max().display("max");
        return times;
    };

})(MatrixView, MatrixView.prototype);

