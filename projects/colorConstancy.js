/**
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

/*global console, Mode, Colorspaces, CIE*/
var Matrix = Matrix || {};
Matrix.prototype = Matrix.prototype || {};

(function () {
    'use strict';

    var correctImage = function (im, c) {
        c = c.getData();
        var R = im.get([], [], 0)['./'](c[0] * Math.sqrt(3));
        var G = im.get([], [], 1)['./'](c[1] * Math.sqrt(3));
        var B = im.get([], [], 2)['./'](c[2] * Math.sqrt(3));
        return R.cat(2, G, B);
    };

    var dilatation33 = function (m) {
        var hh, ll, out, out2, v;

        hh = m.getSize(0);
        ll = m.getSize(1);
        out = Matrix.zeros(hh, ll, 3);
        v = m.get([1, hh - 1], []).cat(0, m.get([hh - 1], []));
        out.set([], [], 0, v);
        out.set([], [], 1, m);
        v = m.get(0, []).cat(0, m.get([0, hh - 2], []));
        out.set([], [], 2, v);
        out2 = out.max(2);
        v = out2.get([], [1, ll - 1]).cat(1, m.get([], [ll - 1]));
        out.set([], [], 0, v);
        out.set([], [], 1, out2);
        v = out2.get([], 0).cat(1, out2.get([], [0, ll - 2]));
        out.set([], [], 2, v);
        out = out.max(2);
        return out.cat(2, out, out);
    };


    Matrix.prototype.colorConstancy = function (algorithm, mask) {
        if (algorithm === undefined) {
            algorithm = 'grey_edge';
        }
        algorithm = algorithm.toLowerCase();

        var diff_order, mink_norm, sigma;
        if (algorithm === 'grey_world') {
            diff_order = 0;
            mink_norm = 1;
            sigma = 0;
        } else if (algorithm === 'max_rgb') {
            diff_order = 0;
            mink_norm = -1;
            sigma = 0;
        } else if (algorithm === 'shades_of_grey') {
            diff_order = 0;
            mink_norm = 5;
            sigma = 0;
        } else if (algorithm === 'grey_edge') {
            diff_order = 1;
            mink_norm = 5;
            sigma = 2;
        }

        return this.general_cc(diff_order, mink_norm, sigma, mask);
    };

    Matrix.prototype.general_cc = function (diff_order, minkNorm, sigma, mask_im) {
        if (diff_order === undefined) {
            diff_order = 0;
        }
        if (minkNorm === undefined) {
            minkNorm = 1;
        }
        if (sigma === undefined) {
            sigma = 1;
        }

        var im = this.im2double();

        mask_im = mask_im || Matrix.zeros(im.getSize(0), im.getSize(1), 1);
        mask_im = mask_im['+'](im.max(2)[">="](1));
        mask_im = dilatation33(mask_im);
        mask_im = mask_im['==='](0);
        // mask_im = mask_im.imdilate([[1, 1, 1],[1, 1, 1], [1, 1, 1]]);
        
        if (diff_order === 0 && sigma !== 0) {
            im = im.gaussian(sigma);
        }

        if (diff_order > 0) {
            im = im.gaussianGradient(sigma).norm;
        }

        im.abs();
        var ill;

        var size = im.getSize();
        var d = im['.*'](mask_im).reshape([size[0] * size[1], size[2]]);
        if (minkNorm !== -1) {
            d = (minkNorm === 1) ? d : d['.^'](minkNorm);
            ill = d.sum(0);
            if (minkNorm !== 1) {
                ill = ill['.^'](1 / minkNorm);
            }
        } else {
            ill = d.max(0);
        }
        var sum = ill['.*'](ill).sum().sqrt();
        ill = ill['./'](sum);

        var out = ill;
        out.mask = mask_im;
        out.im = d.reshape(im.getSize())['.*'](mask_im);
        out.imcor = correctImage(this.im2double(), ill);

        return out;
    };

})();

Matrix.prototype.miredHistogram = function (params) {
    'use strict';
    var p = {
        k: 3,
        delta: 0.01,
        sigma: 0,
        bins : 200,
        m: 50,
        M: 500,
        s: 0.97,
        eps: 0
    };

    var i;
    for (i in params) {
        if (params.hasOwnProperty(i)) {
            p[i] = params[i];
        }
    }
    var im = this.im2single();
    // Points en XYZ
    var imXYZ = Matrix.applycform(im, 'RGB to XYZ');
    var imxy  = Matrix.applycform(imXYZ, 'xyz2xyl');

    var imCCT = imxy.im2CCT();
    var imMired = Matrix.ldivide(imCCT, 1e6);
    var imuv = Matrix
        .applycform(imxy, 'xyY to 1960 uvY')
        .get([], [], [0, 1]);
    var imuvP = Matrix
        .applycform(imCCT.CCT2im(), 'xyY to 1960 uvY')
        .get([], [], [0, 1]);

    var imDist = ((imuv)['-'](imuvP))['.^'](2).sum(2)['.^'](0.5);
    // Pixels masks
    var imY = imXYZ.get([], [], 1);

    // Discard potentially saturated points or blacks
    var maskSaturated = ((imY)['>'](0))['&&']((imY)['<'](p.s));
    // Threshold to keep brightest points
    var maskBrightness = (imY)['.^'](p.k);
    // Keep points who belongs to a given range of color temperature
    var maskCCT = ((imCCT)['>'](2000))['&&']((imCCT)['<'](20000));
    var maskDist = (imDist)['<'](p.delta);
    var mask = (maskSaturated)['.*'](maskCCT)['.*'](maskDist);
    var points = (imMired)['.*'](mask);
    var weights = (maskBrightness)['.*'](mask);

    // var modes = [];
    var hs = getHistograms(points.getData(), weights.getData(), p.bins, p.m, p.M);
    hs.histw = Matrix.toMatrix(hs.histw);
    hs.hist = Matrix.toMatrix(hs.hist);

    var scaleMired = Matrix.linspace(p.m, p.M, p.bins);
    if (p.sigma !== undefined && p.sigma > 1) {
        var ker = Matrix.Kernel.gaussian(p.sigma);
        hs.histw = hs.histw.conv(ker, 'same');
        hs.hist = hs.hist.conv(ker, 'same');
    }

    var indice = hs.histw.amax().getDataScalar();
    var indiceMin = Math.max(indice - (p.sigma || 2), 0);
    var indiceMax = Math.min(indice + (p.sigma || 2), scaleMired.numel() - 1);

    var modes = [new Mode(indiceMin, indiceMax, 0, hs.histw.getData())];
    modes = modes.concat(extractModes(hs.histw.getData(), false, 0,
                                      hs.M, hs.mu, hs.sigma));

    // maskSelectedTemp = maskSelectedTemp.select();
    var barycenter = function (min, max) {
        var maskInf = imMired['>='](Math.floor(scaleMired.value([min])));
        var maskSup = imMired['<='](Math.ceil(scaleMired.value([max])));

        var maskSelectedTemp  = (maskInf)['&&'](maskSup);
        var pointsKept = weights.get(maskSelectedTemp);
        var sumWeights = pointsKept.sum().getDataScalar();
        var xPoints = imxy.get([], [], 0).get(maskSelectedTemp).getData();
        var yPoints = imxy.get([], [], 1).get(maskSelectedTemp).getData();
        pointsKept = pointsKept.getData();
        var i, ie, xM = 0, yM = 0;
        for (i = 0, ie = xPoints.length; i < ie; i++) {
            xM += xPoints[i] * pointsKept[i];
            yM += yPoints[i] * pointsKept[i];
        }
        return [xM / sumWeights, yM / sumWeights, 1];
    };

    var xyYToRGBNorm = function (xyY) {
        var f1 = Matrix.Colorspaces['xyY to XYZ'];
        var f2 = Matrix.Colorspaces['XYZ to LinearRGB'];
        var illRGB = f2(f1(xyY.slice()));
        var s = illRGB[0] + illRGB[1] + illRGB[2];
        illRGB[0] = illRGB[0] * 3 / s;
        illRGB[1] = illRGB[1] * 3 / s;
        illRGB[2] = illRGB[2] * 3 / s;
        return illRGB;
    };

    for (i = 0; i < modes.length; i++) {
        modes[i].CCT = 1e6 / (modes[i].phase * (p.M - p.m) + p.m);
        modes[i].illxy = barycenter(modes[i].bins[0], modes[i].bins[1]);
        modes[i].RGB = xyYToRGBNorm(modes[i].illxy);
    }

    var maskEnd = Matrix.times(mask, maskBrightness);

    return {
        histogramWeighted: Matrix.toMatrix(hs.histw),
        histogram: Matrix.toMatrix(hs.hist),
        scale: scaleMired,
        modes: modes,
        maskBrightness: maskBrightness,
        maskDist: maskDist,
        mask: mask,
        weights: weights,
        maskCCT: maskCCT,
        im: im,
        maskEnd: maskEnd,
        mired: imMired,
        distances: imDist,
        M: hs.M,
        mu: hs.mu,
        sigma: hs.sigma
    };

};

function angularError(a, b) {
    'use strict';
    var L2a = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    var L2b = Math.sqrt(b[0] * b[0] + b[1] * b[1] + b[2] * b[2]);
    var ab = L2a * L2b;
    var scalar = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    var tmp = scalar / ab;
    tmp = tmp > 1 ? 1 : tmp;
    return Math.acos(tmp) / (2 * Math.PI) * 360;
}

var correctImage = function (im, ill, illout) {
    "use strict";
    illout = illout || Matrix.CIE.getIlluminant('D65');
    var mat = Matrix.CIE.getIlluminantConversionMatrix(illout, ill);
    im = Matrix.applycform(im, 'sRGB to LinearRGB')
        .applycform(mat)
        .applycform('LinearRGB to sRGB');
    return im;
};

function bin2color(im, c) {
    "use strict";
    var R = im[".*"](c[0]), G = im[".*"](c[1]), B = im[".*"](c[2]);
    return R.cat(2, G, B);
}
