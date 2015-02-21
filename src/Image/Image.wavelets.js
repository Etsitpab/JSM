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

/*
 var name;
 //name = '/home/mazin/Images/images_test/J7/1.png';
 name = '/home/mazin/Images/images_test/1332.png';
 Matrix.imread(name, function() {
 createCanvas([300, 300], 'test1');
 createCanvas([300, 300], 'test2');
 var im = this.im2double();
 Tools.tic();
 //console.profile();
 var wt = new WT(im, false, 'haar', 3);
 var out = wt.iwt2();
 //console.profileEnd();
 console.log("Time:", Tools.toc());
 data.imshow('test1', 1);
 out.imshow('test2', 1);
 });
 */

/* ********** WAVELET CLASS *************** */

/** Define a wavelet.
 * @class
 *  Provide several wavelets functions.
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

/** Public List of wavelets. */
Wavelet.list = {
    'haar': {
        'orthogonal': true,
        'normalized': false,
        'filterL': new Float64Array([1, 1])
    },
    'db2': {
        'name': 'Daubechies 2',
        'orthogonal': true,
        'normalized': false,
        'filterL': new Float64Array([
            1 + Math.sqrt(3),
            3 + Math.sqrt(3),
            3 - Math.sqrt(3),
            1 - Math.sqrt(3)])
    },
    'db4': {
        'name': 'Daubechies 4',
        'orthogonal': true,
        'filterL': new Float64Array([
                -0.010597401784997278,
            0.032883011666982945,
            0.030841381835986965,
                -0.18703481171888114,
                -0.027983769416983849,
            0.63088076792959036,
            0.71484657055254153,
            0.23037781330885523
        ])
    },

    'db8': {
        'name': 'Daubechies 8',
        'orthogonal': true,
        'filterL': new Float64Array([
                -0.00011747678400228192,
            0.00067544940599855677,
                -0.00039174037299597711,
                -0.0048703529930106603,
            0.0087460940470156547,
            0.013981027917015516,
                -0.044088253931064719,
                -0.017369301002022108,
            0.12874742662018601,
            0.00047248457399797254,
                -0.28401554296242809,
                -0.015829105256023893,
            0.58535468365486909,
            0.67563073629801285,
            0.31287159091446592,
            0.054415842243081609
        ])
    },


    /* Symlets*/

    'sym2': {
        'name': 'Symlets 2',
        'orthogonal': true,
        'filterL': new Float64Array([
                -0.12940952255092145,
            0.22414386804185735,
            0.83651630373746899,
            0.48296291314469025
        ])
    },

    'sym4': {
        'name': 'Symlets 4',
        'orthogonal': true,
        'filterL': new Float64Array([
                -0.075765714789273325,
                -0.02963552764599851,
            0.49761866763201545,
            0.80373875180591614,
            0.29785779560527736,
                -0.099219543576847216,
                -0.012603967262037833,
            0.032223100604042702
        ])
    },

    'sym8': {
        'name': 'Symlets 8',
        'orthogonal': true,
        'filterL': ([
                -0.0033824159510061256,
                -0.00054213233179114812,
            0.031695087811492981,
            0.0076074873249176054,
                -0.14329423835080971,
                -0.061273359067658524,
            0.48135965125837221,
            0.77718575170052351,
            0.3644418948353314,
                -0.051945838107709037,
                -0.027219029917056003,
            0.049137179673607506,
            0.0038087520138906151,
                -0.014952258337048231,
                -0.0003029205147213668,
            0.0018899503327594609
        ])
    },


    /* Coiflets */

    'coif1': {
        'name': 'Coiflets 1',
        'orthogonal': true,
        'filterL': new Float64Array([
                -0.01565572813546454,
                -0.072732619512853897,
            0.38486484686420286,
            0.85257202021225542,
            0.33789766245780922,
                -0.072732619512853897
        ])
    },

    'coif2': {
        'name': 'Coiflets 2',
        'orthogonal': true,
        'filterL': new Float64Array([
                -0.00072054944536451221,
                -0.0018232088707029932,
            0.0056114348193944995,
            0.023680171946334084,
                -0.059434418646456898,
                -0.076488599078306393,
            0.41700518442169254,
            0.81272363544554227,
            0.38611006682116222,
                -0.067372554721963018,
                -0.041464936781759151,
            0.016387336463522112
        ])
    },

    'coif4': {
        'name': 'Coiflets 4',
        'orthogonal': true,
        'filterL': new Float64Array([
                -1.7849850030882614e-06,
                -3.2596802368833675e-06,
            3.1229875865345646e-05,
            6.2339034461007128e-05,
                -0.00025997455248771324,
                -0.00058902075624433831,
            0.0012665619292989445,
            0.0037514361572784571,
                -0.0056582866866107199,
                -0.015211731527946259,
            0.025082261844864097,
            0.039334427123337491,
                -0.096220442033987982,
                -0.066627474263425038,
            0.4343860564914685,
            0.78223893092049901,
            0.41530840703043026,
                -0.056077313316754807,
                -0.081266699680878754,
            0.026682300156053072,
            0.016068943964776348,
                -0.0073461663276420935,
                -0.0016294920126017326,
            0.00089231366858231456
        ])
    },


    /* Bi-orthogonal */

    'bi13': {
        'name': 'Biorthogonal 1-3',
        'orthogonal': false,
        'filterL': new Float64Array([
                -0.088388347648318447,
            0.088388347648318447,
            0.70710678118654757,
            0.70710678118654757,
            0.088388347648318447,
                -0.088388347648318447
        ]),
        'filterH': new Float64Array([
                -0.70710678118654757,
            0.70710678118654757
        ])
    },

    'bi31': {
        'name': 'Biorthogonal 3-1',
        'orthogonal': false,
        'filterL': new Float64Array([
            -0.35355339059327379,
             1.0606601717798214,
             1.0606601717798214,
            -0.35355339059327379
        ]),
        'filterH': new Float64Array([
            -0.17677669529663689,
             0.53033008588991071,
            -0.53033008588991071,
             0.17677669529663689
        ])
    },

    'bi68': {
        'name': 'Biorthogonal 6-8',
        'orthogonal': false,
        'filterL': new Float64Array([
             0.0,
             0.0019088317364812906,
            -0.0019142861290887667,
            -0.016990639867602342,
             0.01193456527972926,
             0.04973290349094079,
            -0.077263173167204144,
            -0.09405920349573646,
             0.42079628460982682,
             0.82592299745840225,
             0.42079628460982682,
            -0.09405920349573646,
            -0.077263173167204144,
             0.04973290349094079,
             0.01193456527972926,
            -0.016990639867602342,
            -0.0019142861290887667,
             0.0019088317364812906
        ]),
        'filterH': new Float64Array([
            0.0,
            0.014426282505624435,
           -0.014467504896790148,
           -0.078722001062628819,
            0.040367979030339923,
            0.41784910915027457,
           -0.75890772945365415,
            0.41784910915027457,
            0.040367979030339923,
           -0.078722001062628819,
           -0.014467504896790148,
            0.014426282505624435,
            0.0,
            0.0
        ])
    },

    'bi97': {
        'name': 'Biorthogonal 9-7',
        'orthogonal': false,
        'filterL': new Float64Array([
            0.0,
            0.02674875741080976,
                -0.01686411844287495,
                -0.07822326652898785,
            0.2668641184428723,
            0.6029490182363579,
            0.2668641184428723,
                -0.07822326652898785,
                -0.01686411844287495,
            0.02674875741080976
        ]),
        'filterH': new Float64Array([
            0.0,
           -0.09127176311424948,
            0.05754352622849957,
            0.5912717631142470,
           -1.115087052456994,
            0.5912717631142470,
            0.05754352622849957,
           -0.09127176311424948,
            0.0,
            0.0
        ])
    }
};

/** Perform an operation on a filter.
 * @param {float[]} h
 *  A filter.
 * @param {String} action
 *  - 'rescale': multiply the filter by a constant.
 *  - 'normalize': normalize the filter (L2 norm).
 *  - 'conjugate': return the filter h[0], -h[1], .., h[n]*(-1)^n.
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
        this.redundant = (redundant) ? true : false;
        this.level = (level === undefined) ? 3 : level;
        this.wavelet = (wav instanceof Wavelet) ? wav : new Wavelet(wav);

        // Compute and return the transform
        this.tmp = im;
        this.wt2(); // fill this.data
        
        // Copy constructor
    } else {
        throw new Error("WT: first parameter must be an ImageJS or a WT");
    }
    return this;
}

Matrix.prototype._filter1d = function (viewI, kernel, origin, s, output, viewO, add) {
    'use strict';

    // add
    add = add ? true : false;

    // 1. ARGUMENTS

    var K = kernel.length;
    origin = (origin === 'cl' ? Math.floor : Math.ceil)((K - 1) / 2);
    
    // 2. Filtering
    var cs = viewI.getFirst(2), ocs = viewO.getFirst(2);
    var xs = viewI.getFirst(1), oxs = viewO.getFirst(1);
    var ys = viewI.getFirst(0), oys = viewO.getFirst(0);

    var dc = viewI.getStep(2), odc = viewO.getStep(2);
    var dx = viewI.getStep(1), odx = viewO.getStep(1);
    var dy = viewI.getStep(0), ody = viewO.getStep(0);

    var lc = viewI.getEnd(2), olc = viewO.getEnd(2);
    var lx = viewI.getEnd(1), olx = viewO.getEnd(1);
    var ly = viewI.getEnd(0), oly = viewO.getEnd(0);

    var ny = viewI.getSize(0);

    var id = this.getData(),  od = output.getData();

    var c, oc;

    var oyx, o_x;
    var k, s, sTmp, sum;
    var _x, nx, yx;

    var nydy = ny * dy;
    var o = origin * dy;
    var kdy = dy;
    dy *= s;

    for (c = 0, oc = 0; c < lc; c += dc, oc += odc) {
        for (_x = c + xs, o_x = oc + oxs, nx = c + lx; _x < nx; _x += dx, o_x += odx) {
            var yx0 = ys + _x, nyx = ly + _x;
            for (yx = yx0, oyx = o_x + oys; yx < nyx; yx += dy, oyx += ody) {
                for (k = 0, s = yx - o, sum = 0; k < K; k++, s += kdy) {
                    sTmp = s;
                    while (sTmp < yx0) {
                        sTmp += nydy;
                    }
                    while (sTmp >= nyx) {
                        sTmp -= nydy;
                    }
                    sum += kernel[k] * id[sTmp];
                }
                if (add) {
                    od[oyx] += sum;
                } else  {
                    od[oyx] = sum;
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
    window.scaleList = scaleList;
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
    var buffL = buffer.getView().select([0, halfHeight - 1]);
    var buffH = buffer.getView().select([halfHeight, -1]);
    var viewI = input.getView();

    window.buffer = buffer;
    window.data = this.data;

    // Process each scale
    while (scaleList.length > 1) {
        var s = scaleList.pop();
        var D = (this.redundant) ? {'Dker': s.pow} : {'Dout': 2};

        // H filtering from image to buffer
        buffL.select([0, s.height - 1]);
        buffH.select([0, s.height - 1]);
        
        input._filter1d(viewLL, wav.filterL, 'cl', D.Dout, buffer, buffL);
        input._filter1d(viewLL, wav.filterH, 'cl', D.Dout, buffer, buffH);

        if (this.redundant) {
            // TODO
            // viewHL.x0 = viewLH.x0 = viewHH.x0 = s.cumWidth;
        } else {
            viewLL.select([0, s.height - 1], [0, s.width - 1]);
            viewLH.select([0, s.height - 1], [s.width, 2 * s.width - 1]);
            viewHL.select([s.height, 2 * s.height - 1], [0, s.width - 1]);
            viewHH.select([s.height, 2 * s.height - 1], [s.width, 2 * s.width - 1]);
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
        buffer._filter1d(buffL, wav.filterL, 'cl', D.Dout, this.data, viewLL);
        buffer._filter1d(buffL, wav.filterH, 'cl', D.Dout, this.data, viewLH);
        buffer._filter1d(buffH, wav.filterL, 'cl', D.Dout, this.data, viewHL);
        buffer._filter1d(buffH, wav.filterH, 'cl', D.Dout, this.data, viewHH);
        buffL.swapDimensions(0, 1);
        buffH.swapDimensions(0, 1);
        viewLL.restore().select([0, s.height - 1], [0, s.width - 1]);;
        viewLH.restore();
        viewHL.restore();
        viewHH.restore();

        // Be ready for next scale
        buffL.select([], [0, s.width - 1]);
        buffH.select([], [0, s.width - 1]);
        input = this.data;
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
        var size = this.data.getSize();
        if (size.length < 3) {
            size.push(1);
        }
        var data2 = Matrix.zeros(size[0] * 2, size[1] * 2, size[2] || 1);
        data2 = data2.set([0, 2, -1], [0, 2, -1], [], this.data);
        window.data2 = data2;

        var getScaleView = function (scale, band, k) {
            var H = size[0] * k, W = size[1] * k;
            var f = Math.pow(2, this.level - scale + 1);
            var h = H / f, w = W / f;
            var view = new MatrixView([H, W, size[2]]);
            if (band === "LL") {
                view.select([0, 2 * h - 1], [0, 2 * w - 1]);
            } else if (band === "LH") {
                view.select([0, h - 1], [w, 2 * w - 1]);
            } else if (band === "HL") {
                view.select([h, 2 * h - 1], [0, w - 1]);
            } else if (band === "HH") {
                view.select([h, 2 * h - 1], [w, 2 * w - 1]);
            }
            return view;
        }.bind(this);
    }

    // Buffer image
    var roundedWidth = (re) ? this.width : 2 * Math.ceil(this.width / 2);
    var roundedHeight = (re) ? this.height : 2 * Math.ceil(this.height / 2);
    var outBuffer = Matrix.zeros(roundedHeight * 2 * factor, roundedWidth * 2 * factor, size[2]);
    var buffer = Matrix.zeros(2 * roundedHeight, roundedWidth, size[2]);
    // window.outBuffer = outBuffer;
    // window.buffer = buffer;
    var buffL, buffH;
    // buffL.nx = buffH.nx = buffH.x0 = roundedWidth;

    // Process each scale
    var k, decim = Math.pow(2, this.level - 1);
    var dataLL = data2;
    var view = {};

    for (k = 1; k <= this.level; k++, decim /= 2) {

        view.LL = getScaleView(k - 1, "LL", re ? 1 : 2),
        view.HL = getScaleView(k, "HL", re ? 1 : 2);
        view.LH = getScaleView(k, "LH", re ? 1 : 2);
        view.HH = getScaleView(k, "HH", re ? 1 : 2);

        var D = (re) ? {'Dker': decim} : 1;
        
        // Adapt buffer size
        if (!re) {
            var selW = [0, view.LL.getSize(1) - 1];
            buffL = buffer.getView().select([0, view.LL.getSize(0) - 1], selW);
            buffH = buffer.getView().select([roundedHeight, roundedHeight + view.LL.getSize(0) - 1], selW);
        }
        
        dataLL._filter1d(view.LL, filterL, 'cr', D, buffer, buffL, false);
        data2._filter1d(view.HL, filterH, 'cr', D, buffer, buffL, true);
        data2._filter1d(view.LH, filterL, 'cr', D, buffer, buffH, false);
        data2._filter1d(view.HH, filterH, 'cr', D, buffer, buffH, true);

        // H filtering
        buffL.swapDimensions(0, 1);
        buffH.swapDimensions(0, 1);
        dataLL = outBuffer;
        if (!re) {
            view.LL = getScaleView(k, "LL", 2);
            view.LL.select([0, 2, -1], [0, 2, -1]);
        }
        view.LL.swapDimensions(0, 1);
        buffer._filter1d(buffL, filterL, 'cr', D, dataLL, view.LL, false);
        buffer._filter1d(buffH, filterH, 'cr', D, dataLL, view.LL, true);
        buffL.swapDimensions(0, 1);
        buffH.swapDimensions(0, 1);
        
    }

    return outBuffer.extractViewFrom(view.LL.swapDimensions(0, 1));
};

Matrix.psnr = function (im2, imRef) {
    'use strict';
    im2 = Matrix.toMatrix(im2);
    imRef = Matrix.toMatrix(imRef);
    var dRef = imRef.getData(), d2 = im2.getData();
    var i, ie, ssd = 0;
    for (i = 0, ie = d2.length; i < ie; i++) {
        var tmp = dRef[i] - d2[i];
        ssd += tmp * tmp;
    }
    return Matrix.toMatrix(10 * Math.log10(ie / ssd));
};

Matrix.prototype.dwt2 = function (name) {
    var wt = new WT(this, false, name, 1);
    return wt.data;
};

Matrix.prototype.idwt2 = function () {
};
