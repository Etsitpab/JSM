
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

(function () {
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
            /** Name of the wavelet. */
            this.name = name.toLowerCase();
        }

        // Pre-defined wavelets
        if (Wavelet.list[this.name]) {
            var wav = Wavelet.list[this.name];
            var normalize = (wav.normalized !== undefined && !wav.normalized)
                    ? function (h) { return Wavelet.filter(h, 'norm'); }
                : function (h) { return h; };
            /** Low-pass recursive decomposition filter. */
            this.filterL = normalize(wav.filterL);
            /** Is the wavelet orthogonal? */
            this.orthogonal = (wav.orthogonal) ? true : false;
            if (wav.filterH) {
                /** High-pass recursive decomposition filter. */
                this.filterH = normalize(wav.filterH);
            }
            if (wav.invFilterL) {
                /** Low-pass recursive reconstruction filter. */
                this.invFilterL = normalize(wav.invFilterL);
            }
            if (wav.invFilterH) {
                /** High-pass recursive reconstruction filter. */
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

    Matrix.wfilters = function (name, type) {
        var wav = new Wavelet(name);
        var dl = Matrix.toMatrix(wav.filterL),
            dh = Matrix.toMatrix(wav.filterH),
            rl = Matrix.toMatrix(wav.invFilterL),
            rh = Matrix.toMatrix(wav.invFilterH);
        if (!type) {
            return [dl, dh, rl, rh];
        } else if (type === 'd') {
            return [dl, dh];
        } else if (type === 'r') {
            return [rl, rh];
        } else if (type === 'l') {
            return [dl, rl];
        } else if (type === 'h') {
            return [dh, rh];
        } else {
            throw new Error("Matrix.wfilters: wrong type argument.");
        }
    };
    
    var filter1d = function (mat, viewI, kernel, origin, s, output, viewO, add) {
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
        var id = mat.getData(),  od = output.getData();

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

    Matrix.dwt2 = function (input, name) {
        'use strict';

        var wav = new Wavelet(name);
        var filterL = wav.filterL, filterH = wav.filterH;
        var h = input.getSize(0), w = input.getSize(1), c = input.getSize(2);

        // Create output image
        var hw = Math.ceil(w / 2), hh = Math.ceil(h / 2);

        var dataLL = Matrix.zeros(hh, hw, c);
        var dataLH = Matrix.zeros(hh, hw, c);
        var dataHL = Matrix.zeros(hh, hw, c);
        var dataHH = Matrix.zeros(hh, hw, c);
        var LL = dataLL.getView().swapDimensions(0, 1),
            LH = dataLH.getView().swapDimensions(0, 1),
            HL = dataHL.getView().swapDimensions(0, 1),
            HH = dataHH.getView().swapDimensions(0, 1);

        // Buffer image
        var buffL = Matrix.zeros(hh, w, c), buffH = Matrix.zeros(hh, w, c);
        var L = buffL.getView(), H = buffH.getView(); 
        // H filtering from image to buffer
        filter1d(input, input.getView(), filterL, 'cl', 2, buffL, L);
        filter1d(input, input.getView(), filterH, 'cl', 2, buffH, H);

        // V filtering from buffer to data
        L.swapDimensions(0, 1)
        H.swapDimensions(0, 1)
        filter1d(buffL, L, filterL, 'cl', 2, dataLL, LL);
        filter1d(buffL, L, filterH, 'cl', 2, dataLH, LH);
        filter1d(buffH, H, filterL, 'cl', 2, dataHL, HL);
        filter1d(buffH, H, filterH, 'cl', 2, dataHH, HH);
        
        return [dataLL, dataLH, dataHL, dataHH];
    };
    
    Matrix.idwt2 = function (bands, name) {
        'use strict';

        var dataLL = bands[0], dataHL = bands[2],
            dataLH = bands[1], dataHH = bands[3];
        var wav = new Wavelet(name);
        var filterL = wav.invFilterL, filterH = wav.invFilterH;
        var h = dataLL.getSize(0), w = dataLL.getSize(1), c = dataLL.getSize(2);

        var data = Matrix.zeros(h * 4, w * 4, c);
        data.set([    0, 2, 2 * h - 1], [    0, 2, 2 * w - 1], dataLL);
        data.set([2 * h, 2, 4 * h - 1], [    0, 2, 2 * w - 1], dataLH);
        data.set([    0, 2, 2 * h - 1], [2 * w, 2, 4 * w - 1], dataHL);
        data.set([2 * h, 2, 4 * h - 1], [2 * w, 2, 4 * w - 1], dataHH);
        
        // Buffer image
        var rWidth = 2 * w, rHeight = 2 * h;
        var outBuffer = Matrix.zeros(h * 4, w * 4, c);

        // Process scale
        var LL = new MatrixView([4 * h, 4 * w, c]).select([0,     2 * h - 1], [0,     2 * w - 1]);
        var HL = new MatrixView([4 * h, 4 * w, c]).select([0,     2 * h - 1], [2 * w, 4 * w - 1]);
        var LH = new MatrixView([4 * h, 4 * w, c]).select([2 * h, 4 * h - 1], [0,     2 * w - 1]);
        var HH = new MatrixView([4 * h, 4 * w, c]).select([2 * h, 4 * h - 1], [2 * w, 4 * w - 1]);

        // Adapt buffer size
        var buffL = Matrix.zeros(rHeight, rWidth, c);
        var buffH = Matrix.zeros(rHeight, rWidth, c);
        var L = buffL.getView(), H = buffL.getView();
        filter1d(data, LL, filterL, 'cr', 1, buffL, L, false);
        filter1d(data, HL, filterH, 'cr', 1, buffL, L, true);
        filter1d(data, LH, filterL, 'cr', 1, buffH, H, false);
        filter1d(data, HH, filterH, 'cr', 1, buffH, H, true);

        // H filtering
        LL = new MatrixView([4 * h, 4 * w, c]).select([0, 2, -1], [0, 2, -1]).swapDimensions(0, 1);
        L.swapDimensions(0, 1);
        filter1d(buffL, L, filterL, 'cr', 1, outBuffer, LL, false);
        filter1d(buffH, L, filterH, 'cr', 1, outBuffer, LL, true);

        return outBuffer.extractViewFrom(LL.swapDimensions(0, 1));
    };

	var filter = function (mat, viewI, kernel, origin, s, output, viewO, add) {
        'use strict';
        
        // add
        add = add ? true : false;
        
        // 1. ARGUMENTS
        
        var K = kernel.length;
        origin = (origin === 'cl' ? Math.floor : Math.ceil)((K - 1) / 2);
        
        // 2. Filtering
        var ys = viewI.getFirst(0), dy = viewI.getStep(0);
        var ly = viewI.getEnd(0), ny = viewI.getSize(0);
        var oys = viewO.getFirst(0), ody = viewO.getStep(0);
        var id = mat.getData(),  od = output.getData();

        var y, oy;
        var k, s, sTmp, sum;
        
        var nydy = ny * dy;
        var o = origin * dy;
        var kdy = dy;
        dy *= s;
            
        for (y = ys, oy = oys; y < ly; y += dy, oy += ody) {
            for (k = 0, s = y + o, sum = 0; k < K; k++, s -= kdy) {
                sTmp = s;
                while (sTmp < ys) {
                    sTmp += nydy;
                }
                while (sTmp >= ly) {
                    sTmp -= nydy;
                }
				// console.log(sTmp, id[sTmp], k, kernel[k])
                sum += kernel[k] * id[sTmp];
            }
			// console.log("");
            if (add) {
                od[oy] += sum;
            } else  {
                od[oy] = sum;
            }
        }
    };

    Matrix.dwt = function (input, name) {
        var wav = new Wavelet(name);
        var filterL = wav.filterL, filterH = wav.filterH;
        var h = input.getSize(0);

        // Create output image
        var hh = Math.ceil(h / 2);

        var dataL = Matrix.zeros(hh, 1);
        var dataH = Matrix.zeros(hh, 1);
        var L = dataL.getView(),
            H = dataH.getView();

        // H filtering from image to buffer
        filter(input, input.getView(), filterL, 'cr', 2, dataL, L);
        filter(input, input.getView(), filterH, 'cr', 2, dataH, H);

        return [dataL, dataH];
    };
    
	Matrix.idwt = function (bands, name) {
        var dataL = bands[0], dataH = bands[1];
        var wav = new Wavelet(name);
        var filterL = wav.invFilterL, filterH = wav.invFilterH;
        var h = dataL.getSize(0);

        var data = Matrix.zeros(h * 4, 1);
        data.set([    0, 2, 2 * h - 1], dataL);
        data.set([2 * h, 2, 4 * h - 1], dataH);
        
        // Buffer image
        var outBuffer = Matrix.zeros(h * 4, 1);

        // Process scale
        var L = outBuffer.getView().select([0,     2 * h - 1]);
        var H = outBuffer.getView().select([2 * h, 4 * h - 1]);

        filter1d(data, L, filterL, 'cl', 1, outBuffer, L, false);
        filter1d(data, H, filterH, 'cl', 1, outBuffer, H, true);

        // filtering
        L = outBuffer.getView().select([0, 2, -1]);
        return outBuffer.extractViewFrom(L);
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

	window.addEventListener('load', function () {
		var name = 'haar';
		var s = Matrix.ones(10, 1).cumsum().display("s");
		var wt = Matrix.dwt(s, name);
		wt[0].display("a");
		wt[1].display("d");
		var out = Matrix.idwt(wt, name);
		out.display("out");
		Matrix.psnr(s, out).display("PSNR");
	});
})();
