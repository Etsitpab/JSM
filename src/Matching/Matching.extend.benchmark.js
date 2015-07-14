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

//////////////////////////////////////////////////////////////////
//                        Benchmark Code                        //
//////////////////////////////////////////////////////////////////


(function (global) {

    var phaseNormImage = function (phase, norm, mask, o) {
        norm = norm.rdivide(norm.max());
        var pData = phase.getData(), nData = norm.getData();
        var imSize = pData.length;
        var outData = new pData.constructor(imSize * 4);
        var H = outData.subarray(0, imSize);
        var S = outData.subarray(imSize, imSize * 2);
        var V = outData.subarray(imSize * 2, imSize * 3);
        var A = outData.subarray(imSize * 3, imSize * 4);
        if (o) {
            var Ht = Matrix.toMatrix(pData);
            Ht = Ht["-"](o);
            var HI0 = Ht["<"](0);
            Ht.set(HI0, Ht.get(HI0)["+"](1));
            H.set(Ht.getData());
        } else {
            H.set(pData);
        }
        V.set(nData);

        var xSize = norm.getSize(1), ySize = norm.getSize(0);
        var wSize = xSize / 2;

        var i, j, _j, ij, j2;
        for (j = 0, _j = 0; j < xSize; j++, _j += ySize) {
            for (i = 0, ij = _j, j2 = (j - wSize) * (j - wSize); i < ySize; i++, ij++) {
                S[ij] = 1;
                A[ij] = 1;
            }
        }

        var size = phase.getSize();
        size.push(4);
        var out = new Matrix(size, outData);
        return out.applycform("HSV to RGB");
    };

    var NNDT = global.Keypoint.NNDT,
        NNDR = global.Keypoint.NNDR,
        NNAC = global.Keypoint.NNAC,
        AC = global.Keypoint.AC;

    var Match = global.Match;

    global.getSkewMatrix = function (mat, skew) {
        var $ = Matrix.toMatrix, cos = Math.cos, sin = Math.sin;
        var rot = function (a) {
            return $([cos(a), sin(a), 0, -sin(a), cos(a), 0, 0, 0, 1]).reshape([3, 3]);
        };
        var zoom = function (x, y) {
            y = y || x;
            return $([x, 0, 0, 0, y, 0, 0, 0, 1]).reshape([3, 3]);
        };
        var translate = function (x, y) {
            y = y || x;
            return $([1, 0, 0, 0, 1, 0, x, y, 1]).reshape([3, 3]);
        };
        var x = mat.getSize(1), y = mat.getSize(0);
        var a = Math.atan2(x, y);
        var T = translate(x / 2, y / 2), iT = T.inv();
        var R = rot(-a), iR = R.inv();
        var S = zoom(skew, 1);
        return T.mtimes(R).mtimes(S).mtimes(iR).mtimes(iT);
    };

    global.Keypoint.prototype.project = function (mat) {
        var $ = Matrix.toMatrix;
        var PI = Math.PI, cos = Math.cos, sin = Math.sin, atan2 = Math.atan2;
        var pow = Math.pow, sqrt = Math.sqrt;
        var fs = this.factorSize, s = this.sigma, x = this.x, y = this.y, o = this.orientation;
        var nk = mat.mtimes($([x, y, 1])).getData();
        nk = new global.Keypoint(nk[0], nk[1]);

        var no = (o > 0.5 ? o - 1 : o) * 2 * PI;
        var c = [x + cos(no) * fs * s, y - sin(no) * fs * s, 1];
        var co = mat.mtimes($(c)).getData();

        // Orientation of projected keypoint
        no = atan2(nk.y - co[1], co[0] - nk.x) / (2 * PI);
        no = (no < 0) ? no + 1 : no;
        nk.orientation = no;

        // Scale of projected keypoint
        nk.sigma = sqrt(pow(nk.x - co[0], 2) + pow(nk.y - co[1], 2)) / fs;
        nk.factorSize = fs;
        return nk;
    };


    global.Keypoint.prototype.matchBenchmark = function (keypoints, criterions, combinations) {

        var getDistancesForCombination = function (distances, combinations) {
            var distOut = {
                'length': distances.length
            };
            for (var c = 0; c < combinations.length; c++) {
                var name = combinations[c];
                if (distances.hasOwnProperty(name)) {
                    distOut[name] = distances[name];
                }
            }
            return distOut;
        };

        var distances = this.computeDistances(keypoints);

        var c, m, out = {};
        for (c in criterions) {
            if (c === "NN-DT") {
                m = NNDT(distances);
            } else if (c === "NN-DR") {
                m = NNDR(distances);
            } else if (c === "NN-AC") {
                m = NNAC(distances);
            }
            out[c] = [new Match(0, this, m[0], keypoints[m[0]], m[1])];
        }

        for (c in combinations) {
            var distTmp;
            if (combinations.hasOwnProperty(c)) {
                distTmp = getDistancesForCombination(distances, combinations[c]);
                m = NNDR(distTmp);
                out[c] = [new Match(0, this, m[0], keypoints[m[0]], m[1])];
            }
        }

        return out;
    };


    global.ScaleSpace.prototype.projectKeypoints = function (mat) {
        var keypoints = this.keypoints;
        var im = this.image;
        mat = Matrix.toMatrix(mat);
        var w = im.getSize(1) - 1, h = im.getSize(0) - 1;
        var i, ei, keypointsOut = [];
        for (i = 0, ei = keypoints.length; i < ei; i++) {
            var nk = keypoints[i].project(mat);
            var xm = nk.x - nk.sigma * nk.factorSize;
            var xM = nk.x + nk.sigma * nk.factorSize;
            var ym = nk.y - nk.sigma * nk.factorSize;
            var yM = nk.y + nk.sigma * nk.factorSize;
            if (xm < 0 || ym < 0 || xM > w || yM > h) {
                continue;
            }
            keypointsOut.push(nk);
        }
        return keypointsOut;
    };


    global.Sift.prototype.computeMatchsBenchmark = function (S1, S2, criterions, combinations) {
        Tools.tic();
        var keypoints1 = this.scaleSpaces[S1].keypoints;
        var keypoints2 = this.scaleSpaces[S2].keypoints;

        var k, ek, l, el, c, matchs = {};
        for (c in criterions) {
            matchs[c] = [];
        }
        for (c in combinations) {
            matchs[c] = [];
        }
        for (k = 0, ek = keypoints1.length; k < ek; k++) {
            var m = keypoints1[k].matchBenchmark(keypoints2, criterions, combinations);
            for (c in matchs) {
                var tmp = m[c];
                for (l = 0, el = tmp.length; l < el; l++) {
                    tmp[l].k1.number = k;
                }
                matchs[c].push(tmp);
            }
        }

        for (c in matchs) {
            matchs[c] = Array.prototype.concat.apply([], matchs[c]);
            matchs[c].sort(Match.compar);
        }

        this.matchs = this.matchs || [];
        this.matchs[S1] = this.matchs[S1] || [];
        this.matchs[S1][S2] = matchs;
        console.log("Matching Benchmark time : ", Tools.toc());
        return this;
    };

    global.Sift.prototype.matchsValidation = function (mat, n1, n2, c) {
        var matchs = this.matchs[n1 || 0][n2 || 1];
        if (c) {
            matchs = matchs[c];
        }

        var isValid = function (kr, kc, mat) {
            var dist = function (k1, k2) {
                var x = k1.x - k2.x, y = k1.y - k2.y;
                return Math.sqrt(x * x + y * y);
            };
            var kp = kr.project(mat);
            var dmin = Math.min(kp.sigma, kc.sigma) * kr.factorSize;
            return (dist(kp, kc) < dmin) ? true : false;
        };
        var i, ei;
        for (i = 0, ei = matchs.length; i < ei; i++) {
            var m = matchs[i];
            m.isValid = isValid(m.k1, m.k2, mat);
        }
    };


    global.createCurves = function (matchs) {
        var n = matchs.length;
        var i, ei;
        var t = new Array(n), f = new Array(n), th = new Array(n);
        for (i = 0, ei = matchs.length; i < ei; i++) {
            var m = matchs[i];
            th[i] = m.distance;
            if (m.isValid) {
                t[i] = 1;
                f[i] = 0;
            } else {
                t[i] = 0;
                f[i] = 1;
            }
        }
        return {
            "true": t,
            "false": f,
            "threshold": th
        };
    };

    /** This function automatically evaluate the quality of matching.
     * Since the transformation is given between the two images, it is possible
     * to separate the good and false matches. The function returns an object with
     * ROC curves computed.
     *
     * @param {Array | Object} images
     *  can be either one (Object) or two images (Array).
     * @param {Object} mat
     *  a `3x3` Matrix describe the transformation between the two images.
     *  If only one image is provided then she second is computed from
     *  the first with the help of the transformation matrix.
     * @param {Function} function
     *  Function applied to the second image to add noise, some color change, ...
     *  As exemple a function to do nothing:
     *
     *      function () {return this;}
     * @param {Boolean} project
     *  If true the keypoint are detected in the first image and then projected in
     *  the second one. Otherwise they are redetected.
     * @param {Object} criterions
     *  An Object like the next one, specifying wich decision criterion must be tested.
     *
     *      var criterions = {
     *        'NN-DT': true,
     *        'NN-DR': true,
     *        'NN-AC': true,
     *        'AC': false
     *      };
     *
     * @param {Object}
     *  An object specifying the different combination to evaluate:
     *
     *      var combinations = {
     *        "BW": ["SIFT"],
     *        "COLOR": ["SIFT", "HUE-NORM"]
     *      };
     *
     * @return {Object}
     *  The Sift object computed. This object as a field  'curves' given
     *  acces to the roc curves computed.
     */
    global.benchmark = function (image, mat, fun, project, criterions, combinations) {
        criterions = criterions || {};
        combinations = combinations || {};
        var im1, im2;
        if (Tools.isArrayLike(image)) {
            im1 = image[0];
            im2 = image[1];
        } else if (mat) {
            im1 = image;
            im2 = fun.apply(image.imtransform(mat));
        } else {
            throw new Error("Sift.benchmark: usage error");
        }

        Tools.tic();
        var S = new global.Sift([im1, im2]);
        S.computeScaleSpace();

        if (project) {
            S.scaleSpaces[0]
                .laplacianThreshold()
                .harrisThreshold();
            S.scaleSpaces[0].extractMainOrientations();
            console.log("\t", "Scalespace:",
                        S.scaleSpaces[0].keypoints.length, "keypoints.");
            S.scaleSpaces[1].keypoints = S.scaleSpaces[0].projectKeypoints(mat);
        } else {
            S.applyScaleSpaceThreshold()
                .computeMainOrientations();
        }
        S.computeDescriptors()
            .computeMatchsBenchmark(0, 1, criterions, combinations);
        S.curves = {};
        console.log(mat);
        if (mat) {
            var c;
            for (c in S.matchs[0][1]) {
                S.matchsValidation(mat, 0, 1, c);
                S.curves[c] = global.createCurves(S.matchs[0][1][c]);
            }
        }
        console.log("Benchmark time:", Tools.toc());

        return S;
    };

    global.ScaleSpace.prototype.getDescriptorPatch = function (n, name, part, sz) {
        var k = this.keypoints[n];
        var patchRGB = this.getImagePatch_old(k, true);
        var mask = patchRGB.mask;
        var descriptor, patch;

        if (name !== "RGB" && name !== "RGBNorm") {
            descriptor = k.descriptorsData[name].descriptor;
            patch = descriptor.getPatch(patchRGB);
        }

        var rings, sectors;
        if (part === "norm") {
            patch = patch[part];
            patch = patch.rdivide(patch.max());
            mask =  mask.cat(2, mask, mask);
        } else if (name === "RGB" || name === "RGBNorm") {
            patch = (name === "RGBNorm") ? global.Descriptor.prototype.normalizeColor(patchRGB) : patchRGB;
            patch = patch.patch;
            patch = patch.cat(2, Matrix.ones(patch.size(0), patch.size(1)));
            mask = mask.cat(2, mask, mask, mask);
        } else if (name !== undefined) {
            rings = descriptor.rings;
            sectors = descriptor.sectors;
            if (descriptor.relativeOrientation) {
                patch = phaseNormImage(patch.phase, patch.norm, true, k.orientation);
            } else {
                patch = phaseNormImage(patch.phase, patch.norm, true);
            }
            mask = mask.cat(2, mask, mask, mask);
        }
        patch = patch['.*'](mask);

        var canvas = document.createElement("canvas");
        sz = sz || 201;
        patch.imshow(canvas, sz / patch.size(0));
        // var descriptorsData = k.descriptorsData;
        k = k.getCopy();
        k.x = sz / 2;
        k.y = sz / 2;
        k.sigma = sz / 2;
        k.factorSize = 1;
        if (0 && k.histogram.modes) {
            var i, ei = k.histogram.modes.length;
            var o = k.orientation;
            for (i = 0; i < ei; i++) {
                k.orientation = k.histogram.modes[i].phase;
                canvas.drawDescriptor(k, sectors, rings, 4);
            }
            k.orientation = o;
        } else {
            canvas.drawDescriptor(k, sectors, rings, 4);
        }
        return Matrix.imread(canvas).im2single();
    };

    global.ScaleSpace.prototype.patchsToIm = function (ks) {
        // var im = this.image.getCopy();
        var im = Matrix.zeros(this.image.getSize());
        var i;
        ks = ks || this.keypoints;
        for (i = ks.length - 1; i > -1; i--) {
            var k = ks[i];
            var x = k.x, y = k.y, s = Math.round(k.factorSize * k.sigma);
            var round = Math.round;
            var xMin = round(x - s), xMax = round(x + s);
            var yMin = round(y - s), yMax = round(y + s);
            var kp = k.patch.RGBNorm || k.patch.RGB;
            var mask = k.patch.RGB.mask;
            mask =  mask.cat(2, mask, mask)['>'](0);

            var imP = im.get([yMin, yMax], [xMin, xMax], []);
            imP.set(mask, kp.get(mask));
            im.set([yMin, yMax], [xMin, xMax], [], imP);
        }
        return im;
    };

    global.Sift.prototype.createView = function (cell, h, w) {
        cell.innerHTML = "";

        var f = Math.floor;
        var S = this;
        w = w || cell.clientWidth - 50;
        h = h || cell.clientHeight;
        cell.style.setProperty("width", w);
        cell.style.setProperty("height", h);
        var l = document.createElement("div");
        var r = document.createElement("div");
        l.style.setProperty("display", "inline-block");
        l.style.setProperty("width", f(w / 2) + "px");
        l.style.setProperty("height", h + "px");
        r.style.setProperty("display", "inline-block");
        r.style.setProperty("width", f(w / 2) + "px");
        r.style.setProperty("height", h + "px");
        r.style.setProperty("vertical-align", "top");
        cell.appendChild(l);
        cell.appendChild(r);

        var pDesc, plotCurves;

        var createCurves = function (curves) {
            removeHistograms();
            var plotCurves = new Plot("plotCurves", [f(w / 2), f(h / 2)], r);
            plotCurves.setLegend("auto");
            plotCurves.setOwnProperty("legend-display", "auto");
            var colors = [
                "red", "lime", "blue", "yellow",
                "fuchsia", "aqua", "olive", "purple",
                "teal", "maroon", "green", "navy",
                "black", "gray", "sylver"
            ];
            var col = 0;
            for (var c in curves) {
                var params = {
                    id: c,
                    stroke: colors[col++]
                };
                var f = Matrix.toMatrix(curves[c].false).cumsum().getData();
                var t = Matrix.toMatrix(curves[c].true).cumsum().getData();
                plotCurves.addPath(f, t, params);
            }
            return plotCurves;
        };
        var removeCurves = function () {
            if (plotCurves) {
                plotCurves.getDrawing().parentNode.removeChild(plotCurves.getDrawing());
            }
        };

        var createHistograms = function () {
            removeCurves();
            var i, pDesc = [];
            for (i = 0; i < 9; i++) {
                pDesc.push(new Plot("pDesc" + i, [f(w / 6), f(h / 6)], r));
                pDesc[i].setOwnProperty('ticks-display', false);
            }
            return pDesc;
        };
        var removeHistograms = function () {
            if (pDesc) {
                for (var i = 0, ei = pDesc.length; i < ei; i++) {
                    pDesc[i].getDrawing().parentNode.removeChild(pDesc[i].getDrawing());
                }
            }
        };

        var visual = "histograms";
        var p, p1, p2, p3, p4;

        p = new Plot("p", [f(w / 2), h], l);
        p1 = new Plot("p1", [f(w / 2), f(h / 4)], r);
        p2 = new Plot("p2", [f(w / 2),  f(h / 4)], r);
        pDesc = createHistograms();

        p.setOwnProperty('ticks-display', false);
        p.setOwnProperty('preserve-ratio', true);
        p1.setOwnProperty('ticks-display', false);
        p1.setOwnProperty('preserve-ratio', true);
        p2.setOwnProperty('ticks-display', false);
        p2.setOwnProperty('preserve-ratio', true);

        var getPatch = function  (s, n, name, part) {
            return this.scaleSpaces[s].getDescriptorPatch(n, name, part);
        }.bind(this);

        var display = function (p, patch) {
            p.clear();
            patch.toImage(function () {
                p.remove("patch");
                p.addImage(this, 0, 0, {id: "patch"});
                p.setAxis();
            });
        };
        var descriptors = global.Keypoint.prototype.descriptors;

        var old, patch1, patch2, selected = [];

        var view = {
            descriptor: descriptors[0].name,
            align: 'v',
            thresholdMatchs: function (s, c) {
                this.thresholdMatchs(0, 1, s, c);
                p.showMatchs(this.scaleSpaces[0].image,
                             this.scaleSpaces[1].image,
                             this.matchsList[0][1], view.align);
            }.bind(this),
            plots: [p, p1, p2, p3, p4],
            currentPatches: [patch1, patch2],
            getPatch: getPatch,
            sift: this,
            selected: selected,
            computeMatchs: function (names, s) {
                var i, n = {};
                for (i = 0; i < names.length; i++) {
                    n[names[i]] = {};
                }
                this.computeMatchs(0, 1, undefined, n);
                if (s) {
                    view.thresholdMatchs(s);
                }
            }.bind(this),
            visual: function (v) {
                console.log(v === "curves", this.curves);
                if (v === "histograms") {
                    pDesc = createHistograms();
                } else if (v === "curves" && this.curves) {
                    console.log("toto");
                    plotCurves = createCurves(this.curves);
                }
            }
        };
        p.click = function (coord) {
            var c = this.getClosestPoint(coord.x, coord.y, false);
            if (old) {
                old.data.setAttribute("stroke", 'red');
            }
            if (!c) {
                return;
            }
            old = c;
            old.data.setAttribute("stroke", 'lime');
            p1.clear();
            p2.clear();
            var n = parseInt(c.data.id, 10);
            var m = S.matchsList[0][1][n];
            selected.push(m);
            var tmp1, tmp2;
            patch1 = getPatch(0, m.k1.number, "RGB");
            patch2 = getPatch(1, m.k2.number, "RGB");

            tmp1 = getPatch(0, m.k1.number, "RGBNorm");
            tmp2 = getPatch(1, m.k2.number, "RGBNorm");
            patch1 = patch1 ? patch1.cat(1, tmp1) : tmp1;
            patch2 = patch2 ? patch2.cat(1, tmp2) : tmp2;

            var i;
            for (i = 0; i < descriptors.length; i++) {
                tmp1 = getPatch(0, m.k1.number, descriptors[i].name);
                tmp2 = getPatch(1, m.k2.number, descriptors[i].name);
                patch1 = patch1 ? patch1.cat(1, tmp1) : tmp1;
                patch2 = patch2 ? patch2.cat(1, tmp2) : tmp2;
            }

            view.patch1 = patch1;
            view.patch2 = patch2;
            display(p1, patch1);
            display(p2, patch2);
            var k1 = S.scaleSpaces[0].keypoints[m.k1.number];

            // Descriptor
            var h = k1.descriptorsData[view.descriptor].histograms;
            var max = Matrix.toMatrix(k1.descriptorsData[view.descriptor].data).max().getDataScalar();
            var scale = Matrix.colon(0, h[0].length - 1);
            if (pDesc) {
                for (i = 0; i < h.length; i++) {
                    pDesc[i].clear();
                    pDesc[i].addHistogram(scale.getData(), h[i], {colormap: true, "fill-opacity": 0.5});
                    pDesc[i].setAxis([-0.5, 0, h[i].length - 0.5, max]);
                }
            }

            this.setCursor(c.x, c.y);
        };

        return view;
    };

    if (typeof HTMLCanvasElement !== 'undefined') {
        HTMLCanvasElement.prototype.drawDescriptor = function (k, sectors, rings, lw) {

            var ctx = this.getContext("2d"), PI = Math.PI;

            // Dessin d'un secteur
            var drawSector = function (aStart, aEnd, rStart, rEnd, color) {
                this.beginPath();
                this.arc(0, 0, rStart, aStart, aEnd, false);
                this.arc(0, 0, rEnd, aEnd, aStart, true);
                this.strokeStyle = color;
                this.stroke();
            }.bind(ctx);


            var x = k.x, y = k.y, o = k.orientation, r = k.sigma * k.factorSize;
            o = (o > 0.5 ? o - 1 : o) * 2 * PI;

            // Epaisseur de ligne
            ctx.lineWidth = lw || Math.min(Math.max(r / 36, 1), 5);
            var fillColor = "hsl(220, 100%, 70%)";

            ctx.save();

            // Translation et rotation
            ctx.translate(x, y);
            ctx.rotate(o);

            var shift = r - ctx.lineWidth * 0.5;
            var i, j;
            if (rings && sectors) {
                for (i = 0 ; i < rings.length; i++) {
                    if (sectors[i] === 1) {
                        ctx.beginPath();
                        ctx.strokeStyle = fillColor;
                        ctx.arc(0, 0, rings[i] * shift, 0, Math.PI * 2, true);
                        ctx.stroke();
                    } else {
                        var step = 2 * PI / sectors[i];
                        for (j = 0 ; j < sectors[i]; j++) {
                            drawSector((j - 0.5) * step, (j + 0.5) * step,
                                       (i - 1 < 0 ? 0 : rings[i - 1]) * shift,
                                       rings[i] * shift,
                                       fillColor);
                        }
                    }
                }
            } else {
                ctx.beginPath();
                ctx.strokeStyle = fillColor;
                ctx.arc(0, 0, shift, 0, PI * 2, true);
                ctx.stroke();
            }
            // Croix centrale
            ctx.beginPath();
            ctx.arc(0, 0, 0.02 * r, 0, PI * 2, true);
            ctx.fillStyle = "rgba(255,255,255)";

            // Direction principale
            // Epaisseur de ligne
            ctx.lineWidth *= 1.5;
            // Couleur de la direction principale
            ctx.strokeStyle = "rgb(255,255,255)";
            ctx.moveTo(0, 0);
            ctx.lineTo(r - ctx.lineWidth * 0.5, 0);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        };
    }
    var distancesToIndices = function (distances) {
        var getIndices = function (n) {
            var i, t = new Float32Array(n);
            for (i = 0; i < n; i++) {
                t[i] = i;
            }
            return t;
        };
        var getSortedIndices = function (t) {
            var ind = getIndices(t.length);
            var f = function (a, b) {
                return t[a] - t[b];
            };
            Array.prototype.sort.call(ind, f);
            return ind;
        };

        var d, distOut = {};
        for (d in distances) {
            if (distances.hasOwnProperty(d) && d !== "length") {
                var j, n;
                distOut[d] = [];
                for (j = 0, n = distances[d].length; j < n; j++) {
                    distOut[d][j] = getSortedIndices(distances[d][j]);
                }
            }
        }
        distOut.length = distances.length;
        return distOut;
    };

})(Matching);
