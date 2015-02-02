// TO DO:   wavelet examples
//          high freq. filters using -1/+1

/** 
 * @fileOverview Wavelet Transform toolbox
 */

// Ipij API (c) Copyright 2012, designed by B.Mazin & G.Tartavel

/**
 * @fileOverview Wavelet transform and wavelet tools.
 * @author TM = Tartavel & Mazin
 * @version 1.0
 */


/* ********** WAVELET CLASS *************** */

/** Define a wavelet.
 * @class
 *  Provide several wavelets functions.<br />
 *  A wavelet can be either a common wavelet (called by its name)
 *  or any user-defined wavelet from its recursive filters.
 * @param {string} [name='haar']
 *  Name of the wavelet.
 * @return {Wavelet}
 *  The wavelet definition (containing filters and some properties).
 */
function Wavelet(name) {
    'use strict';
    var errMsg = this.constructor.name + ': ';

    // Default arguments
    if (name  === undefined) {
        this.name = 'haar';
    } else {
        /** Read only<br />Name of the wavelet. */
        this.name = name.toLowerCase();
    }

    // Pre-defined wavelets
    if (Wavelet.list[this.name]) {
        var wav = Wavelet.list[this.name];
        var normalize = (wav.normalized !== undefined && !wav.normalized)
            ? function (h) { return Wavelet.filter(h, 'norm'); }
            : function (h) { return h; };
        /** Read only<br />Low-pass recursive decomposition filter. */
        this.filterL = normalize(wav.filterL);
        /** Read only<br />Is the wavelet orthogonal? */
        this.orthogonal = (wav.orthogonal) ? true : false;
        if (wav.filterH) {
            /** Read only<br />High-pass recursive decomposition filter. */
            this.filterH = normalize(wav.filterH);
        }
        if (wav.invFilterL) {
            /** Read only<br />Low-pass recursive reconstruction filter. */
            this.invFilterL = normalize(wav.invFilterL);
        }
        if (wav.invFilterH) {
            /** Read only<br />High-pass recursive reconstruction filter. */
            this.invFilterH = normalize(wav.invFilterH);
        }
    }

    // User-define wavelet
    if (this.filterL === undefined) {
        var errMsgFull = errMsg + "unknown wavelet '" + name + "'. \n";
        errMsgFull += 'User-defined wavelets not implemented yet.';
        throw new Error(errMsgFull);
    }

    // Compute complementary filter
    var conj = function (h, offset) {
        return Wavelet.filter(h, 'conjugate', (offset) ? -1 : 1);
    };
    if (!this.filterH && this.orthogonal) {
        this.filterH = Wavelet.filter(conj(this.filterL), 'mirror');
    }
    if (!this.invFilterL) {
        this.invFilterL = conj(this.filterH, true);
    }
    if (!this.invFilterH) {
        this.invFilterH = conj(this.filterL, false);
    }

    // Return the object
    return this;
}

/** Public<br />List of wavelets. */
Wavelet.list = Wavelet.list || {
    'haar': {
        'orthogonal': true,
        'filterL': [1, 1]
    }
};

/** Perform an operation on a filter.
 * @param {float[]} h
 *  A filter.
 * @param {String} action
 *  - 'rescale': multiply the filter by a constant.<br />
 *  - 'normalize': normalize the filter (L2 norm).<br />
 *  - 'conjugate': return the filter h[0], -h[1], .., h[n]*(-1)^n.<br />
 *  - 'mirror': return the filter h[n-1] .. h[0].
 * @param {float} [factor=1]
 *  Multiplicative constant.
 * @return {float[]}
 *  A transformed filter.
 */
Wavelet.filter = function (h, action, factor) {
    'use strict';
    var errMsg = 'Wavelet.filter: ';
    if (factor === undefined || factor === 0) {
        factor = 1;
    }
    if (typeof factor !== 'number') {
        throw new Error(errMsg + "argument 'factor' must be a number");
    }
    if (typeof action !== 'string') {
        throw new Error(errMsg + "argument 'action' must be a string");
    }
    action = action.toLowerCase().substr(0, 3);

    var k;
    var N = h.length;
    var out = [];
    var sign = 1, dsign = 1;
    if (action === 'mir') {
        for (k = 0; k < N; k++) {
            out[k] = factor * h[N - 1 - k];
        }
        return out;
    }
    if (action === 'nor') {
        var sum2 = 0;
        for (k = 0; k < N; k++) {
            sum2 += h[k] * h[k];
        }
        factor = (!sum2) ? 1 : 1 / Math.sqrt(sum2);
    } else if (action === 'con') {
        dsign = -1;
    } else if (action !== 'res') {
        throw new Error(errMsg + 'unknown action');
    }

    for (k = 0; k < N; k++, sign *= dsign) {
        out[k] = factor * sign * h[k];
    }

    return out;
};



/* ********** WAVELET TRANSFORM CLASS *************** */

/** Compute the Wavelet Transform of an ImageJS.
 * @see Wavelet
 * @see WT#inverse
 * @class
 *  WT (which stands for 'Wavelet Transform') is a class designed
 *  to store the wavelet transform of an ImageJS.
 * @param {ImageJS|WT} image
 *  Image to be transform, or WT to copy.
 * @param {boolean} [redundant=false]
 *  Use a redundant wavelet transform instead.
 * @param {Wavelet|String} wavelet
 *  Wavelet to use, or its name.
 * @param {int} [level=3]
 *  Number of decomposition levels.<br />
 *  - The scale will be from 0 (lowest freq.) to 'level' (highest freq.)<br />
 *  - They are also labelled from -1 (highest freq.) to -level-1 (lowest freq.)
 * @return {WaveletTransform}
 *  The created wavelet transform instance.
 * @example
 *  // Compute the redundant WT
 *  var wt = new WT(im, true);
 *
 *  // Estimate the noise and apply thresholding
 *  var sigma = wt.noiseStd();
 *  wt.threshold(3/2*sigma, 'soft');
 *
 *  // Reconstruct the image
 *  var denoised = wt.inverse();
 */
function WT(im, redundant, wav, level) {
    'use strict';

    if (im instanceof Matrix) {
        if (redundant !== undefined && typeof redundant !== 'boolean') {
            throw new Error("WT: argument 'redundant' must be boolean");
        }
        if (level === undefined) {
            level = 3;
        } else if (typeof level !== 'number') {
            throw new Error("WT: argument 'level' must be an integer");
        }

        // Arguments
        this.width = im.getSize(1);
        this.height = im.getSize(0);
        this.chan = im.getSize(2);
        this.redundant = (redundant) ? true : false;
        this.level = (level === undefined) ? 3 : level;
        this.wavelet = (wav instanceof Wavelet) ? wav : new Wavelet(wav);

        // Compute and return the transform
        this.tmp = im;
        this.wt2(); // fill this.data
        
    // Copy constructor
    } else if (im instanceof WT) {
        this.width = im.width;
        this.height = im.height;
        this.chan = im.chan;
        this.redundant = im.redundant;
        this.level = im.level;
        this.wavelet = im.wavelet;
        this.data = im.data.getCopy();
        this.subband = [];
        var k, key;
        for (k = 0; k < im.subband.length; k++) {
            this.subband[k] = {};
            for (key in im.subband[k]) {
                if (im.subband[k].hasOwnProperty(key)
                    && im.subband[k][key] instanceof ImageJS) {
                    this.subband[k][key] = im.subband[k][key].getView();
                    this.subband[k][key].data = this.data.data;
                }
            }
        }
    } else {
        throw new Error("WT: first parameter must be an ImageJS or a WT");
    }
    return this;
}

/** Return the reconstructed image.
 * @see @WT
 * @param {ImageJS} [output]
 *  Output image.
 * @return {ImageJS}
 *  The reconstructed image.
 */
WT.prototype.inverse = function (output) {
    'use strict';
    return this.iwt2(output);
};


/* ********** WT VISUALIZATION *************** */

/** Get a view of a subband.
 * @param {int} scale
 *  - 0 is the approximation subband.<br />
 *  - From lowest to highest freq.: 1 to level.<br />
 *  - From highest to lowest freq.: -1 to -level
 * @return {Object}
 *  Object containing views of the subband:<br />
 *  - 'LL' view if scale is 0.<br />
 *  - 'HL', 'LH' and 'HH' views if scale is non-zero.
 */
WT.prototype.getScale = function (scale) {
    'use strict';
    if (typeof scale !== 'number' || Math.abs(scale) > this.level) {
        var errMsg = this.constructor.name + '.getScale: ';
        errMsg += 'scale must be in range -this.level .. this.level';
        throw new Error(errMsg);
    }
    if (scale < 0) {
        scale += this.level + 1;
    }
    var subband = this.subband[scale];

    if (!scale) {
        return { 'LL': subband.LL.getView() };
    }
    return {
        'HL': subband.HL.getView(),
        'LH': subband.LH.getView(),
        'HH': subband.HH.getView()
    };
};

/** Return some statistics about the coefficients.
 * @see WT#getScale
 * @see ImageJS#getStatistics
 * @param {int} [scale]
 *  If not specified, compute the statistics of all the coefficients.<br />
 *  If specified (same as in 'getScale'), use only the coefficients in one subband.
 * @return {Object}
 *  The same as the 'getStatistics' method in 'ImageJS'.
 */
WT.prototype.getScaleStatistics = function (scale) {
    'use strict';
    if (scale === undefined) {
        var obj = this.getScaleStatistics(0);
        var k;
        for (k = 1; k <= this.length; k++) {
            var tmp = this.getScaleStatistics(k);
            obj.count   += tmp.count;
            obj.nonZero += tmp.nonZero;
            obj.sumX    += tmp.sumX;
            obj.sumX2   += tmp.sumX2;
            obj.sumAbsX += tmp.sumAbsX;
        }
        return obj;
    }

    var sub = this.getScale(scale);
    if (!scale) {
        return sub.LL.getStatistics();
    }

    var hl = sub.HL.getStatistics();
    var lh = sub.LH.getStatistics();
    var hh = sub.HH.getStatistics();
    return {
        'count'  : hl.count   + lh.count   + hh.count,
        'nonZero': hl.nonZero + lh.nonZero + hh.nonZero,
        'sumX'   : hl.sumX    + lh.sumX    + hh.sumX,
        'sumX2'  : hl.sumX2   + lh.sumX2   + hh.sumX2,
        'sumAbsX': hl.sumAbsX + lh.sumAbsX + hh.sumAbsX
    };
};


/* ********** DENOISING TOOLS *************** */

/** Estimate the noise standard deviation.<br />
 *  Assume the noise to be gaussian additive with zero-mean.<br />
 *  Estimation is based on the median value in the finest scale.
 * @return {float}
 *  The estimated standard deviation of the noise.
 */
WT.prototype.noiseStd = function () {
    'use strict';
    var errMsg = this.constructor.name + '.noiseStd: ';
    var sub = this.getScale(-1);
    if (!sub.HH) {
        throw new Error(errMsg + 'there is no details subband');
    }

    // Extract the finest scale coefficients
    var tabHH = sub.HH.toArray();
    var k;
    for (k = 0; k < tabHH.length; k++) {
        tabHH[k] = Math.abs(tabHH[k]);
    }

    // Compute median and deduce std assuming gaussian
    var median = Tools.Stat.rank(tabHH);
    var std = median / 0.6745;
    return std;
};

/** Apply a threshold to each scale.
 * @see ImageJS#threshold
 * @param {float|float[]} T
 *  Threshold value(s):<br />
 *  - float: the same threshold for all scales.<br />
 *  - array of floats: one threshold for each scale (use -1 not to filter a scale).
 * @param {String|function} [fcn = 'hard']
 *  Thresholding function:<br />
 *  - 'hard' or 'soft' threshold.<br />
 *  - any function (value, T) returning x thresholded by T.
 * @param {boolean} [evenLL=false]
 *  If true, the approximation subband (scale 0) is thresholded too.
 * @return {WaveletTransform}
 *  this, thresholded.
 */
WT.prototype.threshold = function (T, fcn, evenLL) {
    'use strict';
    var errMsg = this.constructor.name + '.threshold: ';

    // Check arguments
    var k, t;
    if (fcn === undefined) {
        fcn = 'hard';
    }
    var minScale = (evenLL) ? 0 : 1;
    if (typeof T === 'number') {
        t = T;
        T = [];
        for (k = minScale; k <= this.level; k++) {
            T.push(t);
        }
    } else {
        if (evenLL === undefined) {
            minScale = this.level + 1 - T.length;
        }
        if (T.length !== this.level + 1 - minScale || minScale < 0 || minScale > 1) {
            throw new Error(errMsg + "incompatible length of 'T'");
        }
    }

    // Threshold
    for (k = this.level; k >= minScale; k--) {
        t = T.pop();
        if (t >= 0) {
            var sub = this.getScale(k);
            if (sub.LL) {
                sub.LL.threshold(t, fcn);
            } else {
                sub.HL.threshold(t, fcn);
                sub.LH.threshold(t, fcn);
                sub.HH.threshold(t, fcn);
            }
        }
    }
    
    // The end
    return this;
};

/** Apply the SURE thresholding to each scale.
 * @return {WT}
 *  this
 */
WT.prototype.thresholdSURE = function () {
    'use strict';
    var sigma = this.noiseStd();
    var sigma2 = sigma * sigma;

    // Compute the SURE value from an image coefficients
    var getSURE = function (t) {
        var N = t.length;
        var k, n;
        for (k = 0; k < N; k++) {
            t[k] = Math.abs(t[k]);
        }
        Array.prototype.sort.call(t, function (a, b) { return a - b; });
        var cumSum2 = 0, imin = 0, minRisk2 = Infinity;
        for (n = 0; n < N; n++) {
            var X2 = t[n] * t[n];
            cumSum2 += X2 - sigma2;
            var risk2 = cumSum2 + (N - n - 1) * (sigma2 + X2);
            if (risk2 < minRisk2) {
                imin = n;
                minRisk2 = risk2;
            }
        }
        return t[imin];
    };

    // Apply the threshold to each scale
    var k, s, c;
    for (k = this.level; k > 0; k--) {
        var subband = this.getScale(k);
        var views = [subband.HL, subband.LH, subband.HH];
        for (s = 0; s < views.length; s++) {
            var view = views[s];
            var chan = view.chan;
            for (c = 0; c < chan.length; c++) {
                view.Ch_(chan[c]);
                var T = getSURE(view.toArray());
                view.threshold(T, 'soft');
            }
        }
    }
    
    return this;
};


/* ********** WT COMPUTATION *************** */

/** 1D convolution.
 * @param {float[]} kernel
 *  Convolution kernel.
 * @param {String|float} [boundary = 'symmetric']
 *  Boundary processing:<br />
 *  - any float value: value assumed outside the image domain;<br />
 *  - float 0 value is equivalent to 'constant' or 'const';<br />
 *  - 'symmetric' or 'sym';<br />
 *  - 'periodic' or 'per'.
 * @param {int|string} [origin = 'C']
 *  Origin of the kernel:<br :>
 *  - positive integer: origin position;<br />
 *  - negative integer: origin position, from the end;<br />
 *  - 'L'/'R' for (resp.) left/right, the same as (resp.) 0/-1;<br />
 *  - 'C' for center,'CL'/'CR' for rounding (resp.) left/right.
 * @param {int|Object} [subsample = 1]
 *  Subsampling factor:<br />
 *   - integer D: the same as filtering and then subsampling with a factor D;<br />
 *   - Object {'Dout':D1, 'Dker':D2, 'round':fcn}: <br />
 *       * 'Dout' integer (def. 1) is the subsampling factor for the output (previously called D);<br />
 *       * 'Dker' integer (def. 1) is the kernel subsampling factor.<br />
 *  Note that using Dout = Dker is the same (except maybe on boundary) as
 *      subsampling the image firse, and then filtering with Dout = Dker = 1.
 * @param {ImageJS} [output]
 *  Output image
 * @param {boolean} [add = false]
 *  Add to the output, instead of erasing it.
 * @returns {ImageJS}
 *  Output image
 * @example
 *  // Computing the X derivative:
 *  var gradX = im.filter1d([-1, 0, 1], 'periodic');
 *
 *  // Resize image to half its size(with a separable average):
 *  var ker = [1/3, 1/3, 1/3];
 *  var tmp = im.filter1d(ker, 'symmetric', 'L', 3).T();    // X filtering then transpose
 *  var out = tmp.filter1d(ker, 'symmetric', 'L', 3).T();   // Y filtering then transpose back
 */
Matrix.prototype._filter1d = function (viewI, kernel, origin, subsample, output, viewO, add) {
    'use strict';

    // 1. ARGUMENTS
    var errMsg = this.constructor.name + '.filter1d: ';
    //kernel = new this.dataType((kernel && kernel.length) ? kernel : [kernel]);
    var K = kernel.length;
    var Dout = 1, Dker = 1, bg = 0;
    var c, x, y;
    var x_, y_;
    var nx, ny, dx, dy;

    // add
    if (add === undefined) {
        add = false;
    }
    // subsample
    if (typeof subsample === 'number') {
        Dout = subsample;
    } else if (typeof subsample === 'object') {
        Dout = subsample.Dout || Dout;
        Dker = subsample.Dker || Dker;
    }


    // output
    if (output === undefined) {
        output = this.getNew(Math.ceil(this.nx / Dout), this.ny);
        output.Ch_(this.chan);
    }

    origin = origin.toUpperCase();
    if (origin === 'C' || origin === 'CL') {
        origin = Math.floor((K - 1) / 2);
    } else if (origin === 'CR') {
        origin = Math.ceil((K - 1) / 2);
    }
    
    // 2. Filtering
    /*
    var iI0 = this.getI0(), oI0 = output.getI0();
    var iDx = this.getDx(), oDx = output.getDx();
    var iDy = this.getDy(), oDy = output.getDy();
    var idata = this.data,  odata = output.data;
    nx = this.nx;
    ny = this.ny;
     */
    var ix0 = viewI.getFirst(0), ox0 = viewO.getFirst(0);
    var iy0 = viewI.getFirst(1), oy0 = viewO.getFirst(1);
    var iDx = viewI.getStep(0), oDx = viewO.getStep(0);
    var iDy = viewI.getStep(1), oDy = viewO.getStep(1);
    nx = viewI.getSize(0);
    ny = viewI.getSize(1);
    /*
    console.log("filter1d");
    console.log(ix0, iy0, iDx, iDy);
    console.log(ox0, oy0, oDx, oDy);
    console.log(nx, ny);
     */
    var id = this.getData(),  od = output.getData();

    var nx2 = 2 * nx;
    var iy_, oy_, ox_;
    var k, s, sTmp, sum;

    for (c = 0; c < 1; c++) {
        for (y = 0, iy_ = c * nx * ny + iy0, oy_ = c * od.length / 3 + oy0; y < ny; y++, iy_ += iDy, oy_ += oDy) {
            for (x = 0, ox_ = oy_ + ox0; Dout * x < nx; x++, ox_ += oDx) {
                sum = 0;
                s = Dout * x + Dker * origin;
                for (k = 0; k < K; k++, s -= Dker) {
                    sTmp = s;
                    while (sTmp < 0) {
                            sTmp += nx;
                    }
                    while (sTmp >= nx) {
                        sTmp -= nx;
                    }
                    sum += kernel[k] * id[iy_ + sTmp * iDx];
                }
                if (add) {
                    od[ox_] += sum;
                } else  {
                    od[ox_] = sum;
                }
            }
        }
    }
    
    // Return the result
    return output;
};

/** Compute each scale properties:<br />
 *  - shape 'width' and 'height' of the coefficients.<br />
 *  - 'pow' is the subsampling factor.<br />
 *  - 'cumWidth' and 'cumHeight' from scale 0 to current.
 * @private
 * @return {Array of Object}
 *  The properties for each scale.
 */
WT.prototype.getScalesParameters = function () {
    'use strict';
    var w = this.width;
    var h = this.height;
    var pow = 1;
    var list = [];
    var k;
    for (k = this.level; k > 0; k--, pow *= 2) {
        if (!this.redundant) {
            w = Math.ceil(w / 2);
            h = Math.ceil(h / 2);
        }
        list[k] = {
            'width': w,
            'height': h,
            'pow': pow,
            'cumWidth': 0,
            'cumHeight': 0
        };
    }
    list[0] = {
        'width': w,
        'height': h,
        'pow': pow,
        'cumWidth': 0,
        'cumHeight': 0
    };

    w = h = 0;
    for (k = 0; k <= this.level; k++) {
        list[k].cumWidth = w;
        list[k].cumHeight = h;
        w += list[k].width;
        h += list[k].height;
    }
    return list;
};

/** Perform the 2D wavelet transform
 *  from the image stored in 'this.tmp'.
 *  Use 'this.data' to store the coefficients
 *  and 'this.subband' to store the scale views.
 * @see WT
 * @private
 */
WT.prototype.wt2 = function () {
    'use strict';
    var wav = this.wavelet;
    var input = this.tmp;
    var scaleList = this.getScalesParameters();

    // Create output image
    var lastScale = scaleList[scaleList.length - 1];
    var dataWidth = lastScale.cumWidth + lastScale.width;
    var dataHeight = lastScale.cumHeight + lastScale.height;
    if (this.redundant) {
        // TODO
        // dataHeight = 3 * input.getSize(0);
    }
    
    this.data = Matrix.zeros(dataHeight, dataWidth, input.getSize(2));
    var viewLL = this.data.getView(), viewLH = this.data.getView();
    var viewHL = this.data.getView(), viewHH = this.data.getView();

    this.subband = [];
    if (this.redundant) {
        // TODO:
        // viewLL.y0 = input.getSize(0);
        // viewHH.y0 = input.getSize(0);
        // viewLH.y0 = 2 * input.getSize(0);
    }

    // Buffer image
    var halfHeight = (this.redundant) ? this.height : Math.ceil(this.height / 2);
    var buffer = Matrix.zeros(2 * halfHeight, this.width, input.getSize(2));
    var buffL = buffer.getView();//.select([0, halfHeight - 1]);
    var buffH = buffer.getView();//.select([halfHeight, 2 * halfHeight - 1]);
    var viewI = input.getView();
    
    // Process each scale
    while (scaleList.length > 1) {
        var scale = scaleList.pop();
        var D = (this.redundant) ? {'Dker': scale.pow} : {'Dout': 2};

        // H filtering from image to buffer
        buffL.restore().select([0, scale.height - 1], [0, scale.width * 2 - 1]);
        buffH.restore().select([scale.height, scale.height + scale.height - 1], [0, scale.width * 2 - 1]);
        //buffL.nx = buffH.nx = scale.width;
        
        input._filter1d(viewI, wav.filterL, 'cl', D, buffer, buffL);
        input._filter1d(viewI, wav.filterH, 'cl', D, buffer, buffH);
        window.buffer = buffer;
        window.data = this.data;
        // Select each subband
        //viewLL.nx = viewHL.nx = viewLH.nx = viewHH.nx = scale.width;
        //viewLL.ny = viewHL.ny = viewLH.ny = viewHH.ny = scale.height;

        if (this.redundant) {
            // TODO
            // viewHL.x0 = viewLH.x0 = viewHH.x0 = scale.cumWidth;
        } else {
            var s = scale;
            console.log(s.height, s.cumHeight);
            console.log(s.width, s.cumWidth);
            viewLL.select([0, s.height - 1], [0, s.width - 1]);
            console.log("viewLH:", s.height, s.cumWidth, s.cumWidth + s.width - 1);
            viewLH.select([0, s.height - 1], [s.cumWidth, s.cumWidth + s.width - 1]);
            viewHL.select([s.cumHeight, s.cumHeight + s.height - 1], [0, s.width - 1]);
            viewHH.select([s.cumHeight, s.cumHeight + s.height - 1], [s.cumWidth, s.cumWidth + s.width - 1]);
            //viewHL.x0 = viewHH.x0 = scale.cumWidth;
            //viewLH.y0 = viewHH.y0 = scale.cumHeight;
        }
        this.subband[scaleList.length] = {
            'HL': new MatrixView(viewHL),
            'LH': new MatrixView(viewLH),
            'HH': new MatrixView(viewHH)
        };
        // V filtering from buffer to data
        buffL.swapDimensions(0, 1);
        buffH.swapDimensions(0, 1);
        viewLL.swapDimensions(0, 1);
        viewLH.swapDimensions(0, 1);
        viewHL.swapDimensions(0, 1);
        viewHH.swapDimensions(0, 1);
        buffer._filter1d(buffL, wav.filterL, 'cl', D, this.data, viewLL);
        buffer._filter1d(buffL, wav.filterH, 'cl', D, this.data, viewLH);
        buffer._filter1d(buffH, wav.filterL, 'cl', D, this.data, viewHL);
        buffer._filter1d(buffH, wav.filterH, 'cl', D, this.data, viewHH);
        buffL.swapDimensions(0, 1);
        buffH.swapDimensions(0, 1);
        viewLL.restore();
        viewLH.restore();
        viewHL.restore();
        viewHH.restore();

        // Be ready for next scale
        //buffL.ny = buffH.ny = scale.height;
        // var buffL = buffer.getView().select([0, halfHeight - 1]);
        // var buffH = buffer.getView().select([halfHeight, 2 * halfHeight - 1]);
        console.log(halfHeight, scale.height);
        // buffL.select([0, scale.height - 1], [0, scale.width - 1]);
        // buffH.select([scale.height, scale.height + scale.height - 1], [0, scale.width - 1]);
        viewI = viewLL;
    }
    this.subband[0] = {'LL': input.getView()};
};

/** Perform the inverse wavelet transform.
 * @see WT#inverse
 * @private
 * @param {ImageJS} [output]
 *  Output image.
 * @return {ImageJS}
 *  The reconstructed image.
 */
WT.prototype.iwt2 = function (output) {
    'use strict';
    var re = this.redundant;
    var factor = (re) ? 0.5 : 1;
    var filterL = Wavelet.filter(this.wavelet.invFilterL, 'rescale', factor);
    var filterH = Wavelet.filter(this.wavelet.invFilterH, 'rescale', factor);

    // If not redundant, oversampled image
    var decimView2;
    if (!re) {
        var data2 = this.data.getNew(2 * this.data.width, 2 * this.data.height);
        this.data.exportImage(data2.S(2));
        decimView2 = function (view) {
            view.data = data2.data;
            view.width = data2.width;
            view.height = data2.height;
            view.x0 *= 2;
            view.y0 *= 2;
            view.nx *= 2;
            view.ny *= 2;
            if (view.tx !== 1) {
                view.tx *= 2;
            }
            if (view.ty !== 1) {
                view.ty *= 2;
            }
        };
    }

    // Buffer image
    var roundedWidth = (re) ? this.width : 2 * Math.ceil(this.width / 2);
    var roundedHeight = (re) ? this.height : 2 * Math.ceil(this.height / 2);
    var outBuffer = this.data.getNew(roundedWidth * 2 * factor, roundedHeight * 2 * factor);
    var buffer = this.data.getNew(2 * roundedWidth, roundedHeight);
    var buffL = buffer.getView();
    var buffH = buffer.getView();
    buffL.nx = buffH.nx = buffH.x0 = roundedWidth;

    // Process each scale
    var k, decim = Math.pow(2, this.level - 1);
    var viewLL = this.getScale(0).LL;
    if (!re) {
        decimView2(viewLL);
    }
    for (k = 1; k <= this.level; k++, decim /= 2) {
        var view = this.getScale(k);
        var D = (!re) ? 1 : {'Dker': decim};

        // Adapt buffer size
        if (!re) {
            decimView2(view.HL);
            decimView2(view.LH);
            decimView2(view.HH);
            viewLL.dx = viewLL.dy = 1;
            buffL.nx = buffH.nx = viewLL.nx = view.HH.nx;
            buffL.ny = buffH.ny = viewLL.ny = view.HH.ny;
        }

        // V filtering
        viewLL.T()._filter1d(filterL, 'cr', D, buffL.T(), false);
        view.LH.T()._filter1d(filterH, 'cr', D, buffL.T(), true);
        view.HL.T()._filter1d(filterL, 'cr', D, buffH.T(), false);
        view.HH.T()._filter1d(filterH, 'cr', D, buffH.T(), true);

        // H filtering
        viewLL = outBuffer.getView();
        if (!re) {
            viewLL.S_(2);
            viewLL.nx = buffL.nx;
            viewLL.ny = buffL.ny;
        }
        buffL._filter1d(filterL, 'cr', D, viewLL, false);
        buffH._filter1d(filterH, 'cr', D, viewLL, true);
    }

    // Copy the result
    viewLL.nx = this.width;
    viewLL.ny = this.height;
    return viewLL.exportImage(output);
};
