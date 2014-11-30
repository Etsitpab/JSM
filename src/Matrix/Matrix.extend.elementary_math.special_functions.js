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
                    -0.00000000029734388465e0, 0.00000000269776334046e0,
                    -0.00000000640788827665e0, -0.00000001667820132100e0,
                    -0.00000021854388148686e0, 0.00000266246030457984e0,
                0.00001612722157047886e0, -0.00025616361025506629e0,
                0.00015380842432375365e0, 0.00815533022524927908e0,
                    -0.01402283663896319337e0, -0.19746892495383021487e0,
                0.71511720328842845913e0,
                    -0.00000000001951073787e0, -0.00000000032302692214e0,
                0.00000000522461866919e0, 0.00000000342940918551e0,
                    -0.00000035772874310272e0, 0.00000019999935792654e0,
                0.00002687044575042908e0, -0.00011843240273775776e0,
                    -0.00080991728956032271e0, 0.00661062970502241174e0,
                0.00909530922354827295e0, -0.20160072778491013140e0,
                0.51169696718727644908e0,

                0.00000000003147682272e0, -0.00000000048465972408e0,
                0.00000000063675740242e0, 0.00000003377623323271e0,
                    -0.00000015451139637086e0, -0.00000203340624738438e0,
                0.00001947204525295057e0, 0.00002854147231653228e0,
                    -0.00101565063152200272e0, 0.00271187003520095655e0,
                0.02328095035422810727e0, -0.16725021123116877197e0,
                0.32490054966649436974e0,
                0.00000000002319363370e0, -0.00000000006303206648e0,
                    -0.00000000264888267434e0, 0.00000002050708040581e0,
                0.00000011371857327578e0, -0.00000211211337219663e0,
                0.00000368797328322935e0, 0.00009823686253424796e0,
                    -0.00065860243990455368e0, -0.00075285814895230877e0,
                0.02585434424202960464e0, -0.11637092784486193258e0,
                0.18267336775296612024e0,
                    -0.00000000000367789363e0, 0.00000000020876046746e0,
                    -0.00000000193319027226e0, -0.00000000435953392472e0,
                0.00000018006992266137e0, -0.00000078441223763969e0,
                    -0.00000675407647949153e0, 0.00008428418334440096e0,
                    -0.00017604388937031815e0, -0.00239729611435071610e0,
                0.02064129023876022970e0, -0.06905562880005864105e0,
                0.09084526782065478489e0
            ]);

        var out = A.getCopy();
        var data = out.getData(), i, ie;
        var w, t, k, y, u;
        var abs = Math.abs, floor = Math.floor, exp = Math.exp;
        // Erf computation
        if (JINT === 0) {
            for (i = 0, ie = out.getLength(); i < ie; i++) {
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
            for (i = 0, ie = out.getLength(); i < ie; i++) {
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
            for (i = 0, ie = out.getLength(); i < ie; i++) {
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
        return out;
    };

    /** Apply the error function at each element of the matrix.
     *
     * @chainable
     * @matlike
     * @fixme Should act in place.
     */
    Matrix_prototype.erf = function () {
        return calerf(this, 0);
    };

    /** Apply the complementary error function at each element of 
     * the matrix.
     *
     * @chainable
     * @matlike
     * @fixme Should act in place.
     */
    Matrix_prototype.erfc = function () {
        return calerf(this, 1);
    };

    /** Apply the scaled complementary error function at each 
     * element of the matrix.
     *
     * @chainable
     * @matlike
     * @fixme Should act in place.
     */
    Matrix_prototype.erfcx = function () {
        return calerf(this, 2);
    };

    (function (Matrix_prototype) {
        var xbig = 171.624;
        var p = new Float64Array(
            [-1.71618513886549492533811,
             24.7656508055759199108314,
             -379.804256470945635097577,
             629.331155312818442661052,
             866.966202790413211295064,
             -31451.2729688483675254357,
             -36144.4134186911729807069,
             66456.1438202405440627855
            ]),
            q = new Float64Array(
                [-30.8402300119738975254353,
                 315.350626979604161529144,
                 -1015.15636749021914166146,
                 -3107.77167157231109440444,
                 22538.1184209801510330112,
                 4755.84627752788110767815,
                 -134659.959864969306392456,
                 -115132.259675553483497211
                ]),
            c = new Float64Array(
                [-0.001910444077728,
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
        /** Apply the gamma function to the `Matrix`.
         * @chainable 
         * @fixme check the output epecially for negative values.
         */
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



