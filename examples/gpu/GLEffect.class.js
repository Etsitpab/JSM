/*jslint browser: true, vars: true, plusplus: true, nomen: true */
/*global Float64Array, Float32Array, Int32Array, Uint8Array, Uint8ClampedArray */


// TODO: main documentation of the classes

/* @class GLEffect
 * Apply real-time effects on images using the GPU.
 * They are written in GLSL (GL Shading Language) and run on the GPU.
 *
 * The default effect is 'do-nothing', leaving each pixel unchanged.
 * Its GLSL source code is available and is commented:
 *
 *      console.log(GLEffect.prototype.sourceCode)
 *
 * Here is a simple code using an effect:
 *
 *     var sourceCode = ...  // the GLSL code, as a string
 *     var effect = new GLEffect(sourceCode);
 *     effect.setParameter('uStrength', 4);
 *     effect.setParameter('uLocation', [0.5, 0.5]);
 *     var filtered = effect.run(myImage);
 *     filtered.toCanvas(myCanvas);
 *
 * The parameters of the effects are uniform variables in the source code.
 * A few parameters are automatically set for you:
 *
 * * `vPosition`, which provides the normalized position of the current pixel (in `0..1`).
 * * `uPixel`, which provides the normalized size of a pixels.
 * * `uSize`, which provides the size of the image, in pixels.
 * * `uImage`, which refers to the (array of) processed image(s).
 *
 * As an example, the value of the bottom-right neighbor of the current pixels is:
 *
 *      vec4 neighbor = texture2D(uImage, vPosition + uPixel);  // GLSL code
 *
 * To avoid code duplication when writing effects (in particular the former variables),
 * consider using the code snippet contained in `GLEffect.sourceCodeHeader'.
 */


/** @constructor
 *  Create a new effect.
 * @param {String} [sourceCode]
 *  The source code of the effect, written in GLSL.<br/>
 *  _Default:_ the identity effect (output = input).<br/>
 *  _See:_ GLEffect.fromFunction for a simple constructor.<br/>
 *  _See:_ GLEffect.sourceCode to get an effect's source code.
 * @return {GLEffect | null}
 *  The created effect. If WebGL is not supported, `null` is returned.
 * @throws {Error}
 *  If an error occurs during the source code compilation.
 */
function GLEffect(sourceCode) {
    'use strict';
    var that = this;
    GLEffect._getDefaultContext();  // ensure the context is initialized
    if (!this._context) {
        return null;
    }

    if (sourceCode) {
        this.sourceCode = sourceCode;
    }

    var vShader = this._compileShader(GLEffect._vertexShaderCode, true);
    var fShader = this._compileShader(this.sourceCode, false);

    /** @private @type {WebGLProgram} */
    this._program = this._createProgram(vShader, fShader);
    /** Expected length of `uImage` uniform array, or 0 if not an array. @private @type {Number} */
    this._uImageLength = 0;

    /** Setters for the uniform variables.<br/> _See:_ GLEffect.setParameter @private @type {Object} */
    this._setters = this._createUniformSetters({
        'uImage': function (uniform) {
            if (uniform.name.substr(-3) === '[0]') {
                that._uImageLength = uniform.size;
            }
        }
    });

    /** Current values of the parameters. @readonly @type {Object} */
    this.parameters = {};

    /** Number of vertices in the WebGL program. @private @type {Number} */
    this._vertexCount = 4;

    /** Bind all the attributes. @private @method */
    this._bindAttributes = this._createAttributes(this._vertexCount, {
        'aVertexPosition': GLEffect._vertexPositions,
        'aTexturePosition': GLEffect._texturePositions
    });

    return this;
}


////////////////////////////////////////////////////////////////////////////////
//  MEMBER METHODS
////////////////////////////////////////////////////////////////////////////////

/** Apply the effect.
 * @param {GLEffect.Image | HTMLElement | Array} image
 *  Input image or array of input images (for multi-images effects).
 *  Images can be `img`, `canvas`, or `video` elements.
 * @param {Object} [opts = {}]
 *  - `scale`: Number<br/>
 *      Size ratio of output / input.
 *  - `width` : Number<br/>
 *      Width of the output.
 *  - `height` : Number<br/>
 *      Height of the output image.
 *  - `getSize`: Function<br/>
 *      _Argument:_ the `image` argument.<br/>
 *      _Returns:_ the size of the output image, or `false` on error.
 * @return {GLEffect.Image}
 * @throws {Error}
 *  If input image(s) has invalid type or dimensions.
 */
GLEffect.prototype.run = function (image, opts) {
    'use strict';
    opts = GLEffect._cloneOpts(opts);
    var output = this._initOutput(image, opts);
    GLEffect._readOpt(opts);

    // Setup GL context
    var gl = this._context;
    gl.useProgram(this._program);
    gl.disable(gl.DEPTH_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.viewport(0, 0, output.width, output.height);

    // Setup uniforms
    var input = this._setupImages(image);
    this.setParameter('uSize', [input.width, input.height], false);
    this.setParameter('uPixel', [1 / input.width, 1 / input.height], false);

    // Render
    this._bindAttributes();
    gl.bindFramebuffer(gl.FRAMEBUFFER, output._framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this._vertexCount);

    // Clean up
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return output;
};

/** Change the value of an effect's parameter.
 *  A parameter is an uniform variable of the source code.<br/>
 *  _See:_ GLEffect.parameters for the current values of the parameters.
 * @param {String} name
 *  Name of the parameter to be changed.
 * @param {Number | Array} value
 *  New value of the parameter.
 */
GLEffect.prototype.setParameter = function (name, value, storeIt) {
    'use strict';
    storeIt = (storeIt !== undefined) ? storeIt : true;
    if (this._setters[name]) {
        this._context.useProgram(this._program);
        this._setters[name](value);
        if (storeIt) {
            this.parameters[name] = value;
        }
    }
};

/** Get a list of the effect's parameters.
 *  Unused parameters are not listed.<br/>
 *  _See:_ GLEffect.setParameter to set a parameter's value.<br/>
 *  _See:_ GLEffect.parameters to get parameters' values.
 * @return {Array}
 *  An array containing the name of the parameters.
 */
GLEffect.prototype.getParametersList = function () {
    'use strict';
    var ignored = {'uImage': 1, 'uSize': 1, 'uPixel': 1};
    var list = [];
    var param;
    for (param in this._setters) {
        if (this._setters.hasOwnProperty(param) && !ignored[param]) {
            list.push(param);
        }
    }
    return list;
};

////////////////////////////////////////////////////////////////////////////////
//  STATIC METHODS
////////////////////////////////////////////////////////////////////////////////

/** Create a pixel-wise effect using a functional syntax.<br/>
 *  _See:_ GLEffect.constructor for a manual syntax.
 * @param {String} functionStr
 *  The GLSL function, as a string.<br/>
 *  _Prototype:_ the function prototype can be either:
 *
 *     vec3 function(vec3 color, ...);  // RGB
 *     vec4 function(vec4 color, ...);  // RGBA
 * @return {GLEffect | null}
 *  The effect which applies `function` to each pixel of the input image(s), or `null` if WebGL is not supported.<br/>
 *  If `function` has a single argument, GLEffect.run expects a single image as argument.<br/>
 *  If `function` has N>1 arguments, GLEffect.run expects an array of length N.
 * @throws {Error}
 *  If an error occurs during the source code compilation.
 * @static */
GLEffect.fromFunction = function (functionStr, argCount, argType) {
    'use strict';

    // Infer prototype
    argCount = (argCount !== undefined) ? argCount : null;
    if (argCount === null || argType) {
        var getVecType = function(str) {
            var match = str.match(/\bvec\d\b/g);
            return match && (match.length === 1) && match.pop();
        };
        var splitted = functionStr.match(/^([\s\S]*?)function\s*\(([\s\S]*?)\)/);
        if (splitted.length !== 3) {
            throw new Error('Error: cannot infer GL function prototype.');
        }

        // Infer argument type
        argType = argType || getVecType(splitted[1]);
        if (!argType) {
            throw new Error('Error: cannot infer output type.');
        }

        // Infer argument count
        if (argCount === null) {
            var types = (splitted[2].trim().length) ? splitted[2].split(',').map(getVecType) : [];
            var checkType = function (str) {
                return str === argType;
            };
            if (!types.every(checkType)) {
                throw new Error('Argument Error: input(s) and output types mismatch.');
            }
            argCount = types.length;
        }
    }

    // Check arguments
    if (['vec3', 'vec4'].indexOf(argType) < 0) {
        throw new Error('Argument Error: the function must take "vec3" or "vec4" arguments.');
    }
    if (argCount < 1) {
        throw new Error('Argument Error: the function must take at least one argument.');
    }

    // Create code strings
    var protoArgs = new [].constructor(argCount + 1).join(argType + ', ');
    protoArgs = protoArgs.substr(0, protoArgs.length - 2);
    var prototype = argType + ' function(' + protoArgs + ');';
    var fragColor = {'vec4': 'color', 'vec3': 'vec4(color.rgb, 1.0)'}[argType];
    var ext = {'vec4': '', 'vec3': '.rgb'}[argType];
    var getImage = function (k) {
        var imExt = (argCount === 1) ? '' : '[' + k + ']';
        return 'uImage' + imExt;
    };
    var k, argList = [], argIndent = '        ';
    for (k = 0; k < argCount; ++k) {
        argList.push(argIndent + 'texture2D(' + getImage(k) + ', vPosition)' + ext);
    }

    // Create the source code
    var str = GLEffect.sourceCodeHeader;
    str = (argCount === 1) ? str : str.replace('uImage', 'uImage[' + argCount + ']');
    str += prototype + '  // User function prototype              \n\n';
    str += 'void main(void) {                                       \n';
    str += '    /* Call the user function on the current pixel */   \n';
    str += '    ' + argType + ' color = function(                   \n';
    str += argList.join(',\n') + '\n';
    str += '    );                                                  \n';
    str += '    gl_FragColor = ' + fragColor + ';  // Output color  \n';
    str += '}                                                     \n\n';
    str += '/* User function */                                     \n';
    str += functionStr + '\n';
    return new GLEffect(str);
};

/** Check whether {@link GLEffect} is supported.
 * @return {Boolean}
 * @static */
GLEffect.doesSupportGL = function () {
    'use strict';
    return Boolean(GLEffect._getDefaultContext());
};

/** Check whether {@link GLEffect} supports floating-point images.
 * @return {Boolean}
 * @static */
GLEffect.doesSupportFloat = function () {
    'use strict';
    var gl = GLEffect._getDefaultContext();
    var ext = gl && gl.getExtension('OES_texture_float');
    return Boolean(ext);
};

/** Get the default WebGL context (if supported).
 * @return {WebGLRenderingContext | null}
 * @static @private */
GLEffect._getDefaultContext = function () {
    'use strict';
    if (!GLEffect.prototype._canvas) {
        var canvas = document.createElement('canvas');
        GLEffect.prototype._canvas = canvas;
        GLEffect.prototype._context = GLEffect._createContext(canvas);
    }
    return GLEffect.prototype._context;
};

/** Create a WebGL context (if supported) from an HTML canvas.
 * @param {HTMLCanvasElement} canvas
 * @return {WebGLRenderingContext | null}
 * @static @private */
GLEffect._createContext = function (canvas) {
    'use strict';
    var gl = null;
    try {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    } catch (e) {
        gl = null;
    }
    return gl;
};

/** Read from a set of options, or check that all options were read.
 * @param {Object} [opts]
 *  An object containing several name/value pairs.<br/>
 *  __Warning:__ `opts` is modified, hence you may want to use GLEffect._cloneOpts first.
 * @param {String} [name]
 *  If specified, read and remove the value `opts[name]`.<br/>
 *  If omitted, check that all options of `opts` has already been read.
 * @param {Object} [defaultValue]
 *  Returned value if `opts[name]` is undefined.
 * @return {Object}
 *  If an option's `name` is given, return this option's value.
 * @throws {Error}
 *  If no `name` is given and unread options remain.
 * @static @private
 */
GLEffect._readOpt = function (opts, name, defaultValue) {
    'use strict';
    if (name) {
        if (opts && opts[name] !== undefined) {
            var value = opts[name];
            delete opts[name];
            return value;
        }
        return defaultValue;
    }
    if (opts) {
        var key;
        for (key in opts) {
            if (opts.hasOwnProperty(key)) {
                throw new Error('Argument Error: unknown option ' + key);
            }
        }
    }
};

/** Make a copy of a set of options.
 *  You may want to use it before calling GLEffect._readOpt.
 * @param {Object} opts
 * @return {Object}
 *  A copy of `opts`.
 * @static @private */
GLEffect._cloneOpts = function (opts) {
    'use strict';
    var cpy = {};
    var key;
    for (key in opts) {
        if (opts.hasOwnProperty(key)) {
            cpy[key] = opts[key];
        }
    }
    return cpy;
};


////////////////////////////////////////////////////////////////////////////////
//  PROTECTED METHODS
////////////////////////////////////////////////////////////////////////////////

/** Compile a WebGL shader.
 * @param {String} sourceCode
 * @param {Boolean} isVertexShader
 * @return {WebGLShader}
 * @throws {Error}
 *  If the shader compilation fails.
 * @private */
GLEffect.prototype._compileShader = function (sourceCode, isVertexShader) {
    'use strict';
    var gl = this._context;
    var shaderType = isVertexShader ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;
    var shader = gl.createShader(shaderType);
    gl.shaderSource(shader, sourceCode);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error('Compilation Error: ' + gl.getShaderInfoLog(shader));
    }
    return shader;
};

/** Create a WebGL program from shaders.
 * @param {WebGLShader} vertexShader
 * @param {WebGLShader} fragmentShader
 * @return {WebGLProgram}
 * @throws {Error}
 *  If a linker error occurs.
 * @private */
GLEffect.prototype._createProgram = function (vertexShader, fragmentShader) {
    'use strict';
    var gl = this._context;
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error('Link Error: could not link shaders.');
    }
    return program;
};

/** Create setters for the active uniform variables of the program.
 *
 *  Inspired by: `webgl-utils.js` from [WebGL Funcamentals](http://webglfundamentals.org/).
 * @param {Object} initFunctions
 *  Functions to be called for each uniform variable.
 *  Calling syntax:
 *
 *     initFunctions[uName](uniformInfo);
 * @return {Object}
 *  Setters for each uniform variable.
 *  Calling syntax:
 *
 *     obj[uName](value);  // set uniform 'uName' to 'value'
 * @private */
GLEffect.prototype._createUniformSetters = function (initFunctions) {
    'use strict';
    initFunctions = initFunctions || {};
    var gl = this._context;
    var program = this._program;

    // Textures management
    var textureUnits = 0;
    var bindPoints = {};
    bindPoints[gl.SAMPLER_2D] = gl.TEXTURE_2D;
    bindPoints[gl.SAMPLER_CUBE] = gl.TEXTURE_CUBE_MAP;

    // Function to create a setter for a given uniform
    function createSetter(uniform) {
        var location = gl.getUniformLocation(program, uniform.name);
        var type = uniform.type;
        var isArray = (uniform.size > 1 && uniform.name.substr(-3) === '[0]');
        if (type === gl.FLOAT && isArray) {
            return function(v) {
                gl.uniform1fv(location, new Float32Array(v));
            };
        }
        if (type === gl.FLOAT) {
            return function(v) {
                gl.uniform1f(location, v);
            };
        }
        if (type === gl.FLOAT_VEC2) {
            return function(v) {
                gl.uniform2fv(location, new Float32Array(v));
            };
        }
        if (type === gl.FLOAT_VEC3) {
            return function(v) {
                gl.uniform3fv(location, new Float32Array(v));
            };
        }
        if (type === gl.FLOAT_VEC4) {
            return function(v) {
                gl.uniform4fv(location, new Float32Array(v));
            };
        }
        if ((type === gl.INT || type === gl.BOOL) && isArray) {
            return function(v) {
                gl.uniform1iv(location, new Int32Array(v));
            };
        }
        if (type === gl.INT || type === gl.BOOL) {
            return function(v) {
                gl.uniform1i(location, v);
            };
        }
        if (type === gl.INT_VEC2 || type === gl.BOOL_VEC2) {
            return function(v) {
                gl.uniform2iv(location, new Int32Array(v));
            };
        }
        if (type === gl.INT_VEC3 || type === gl.BOOL_VEC3) {
            return function(v) {
                gl.uniform3iv(location, new Int32Array(v));
            };
        }
        if (type === gl.INT_VEC4 || type === gl.BOOL_VEC4) {
            return function(v) {
                gl.uniform4iv(location, new Int32Array(v));
            };
        }
        // TODO: handle matrix
        if (type === gl.FLOAT_MAT2) {
            return function(v) {
                gl.uniformMatrix2fv(location, false, v);
            };
        }
        if (type === gl.FLOAT_MAT3) {
            return function(v) {
                gl.uniformMatrix3fv(location, false, v);
            };
        }
        if (type === gl.FLOAT_MAT4) {
            return function(v) {
                gl.uniformMatrix4fv(location, false, v);
            };
        }
        if ((type === gl.SAMPLER_2D || type === gl.SAMPLER_CUBE) && isArray) {
            var unitArray = [];
            while (unitArray.length < uniform.size) {
                unitArray.push(textureUnits++);
            }
            var makeTexturesSetter = function (units) {
                return function (tex) {
                    gl.uniform1iv(location, units);
                    var i;
                    for (i = 0; i < units.length; ++i) {
                        gl.activeTexture(gl.TEXTURE0 + units[i]);
                        gl.bindTexture(bindPoints[type], tex[i]);
                    }
                    gl.activeTexture(gl.TEXTURE0);
                };
            };
            return makeTexturesSetter(new Int32Array(unitArray));
        }
        if (type === gl.SAMPLER_2D || type === gl.SAMPLER_CUBE) {
            var makeTextureSetter = function (unit) {
                return function (tex) {
                    gl.uniform1i(location, unit);
                    gl.activeTexture(gl.TEXTURE0 + unit);
                    gl.bindTexture(bindPoints[type], tex);
                    gl.activeTexture(gl.TEXTURE0);
                };
            };
            return makeTextureSetter(textureUnits++);
        }
        throw new Error('Logic Error: unknown parameter type ' + uniform.name);
    }

    // Create all the setters
    var setters = {};
    var uniform, name, setter;
    var k, n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

    gl.useProgram(program);
    for (k = 0; k < n; k++) {
        uniform = gl.getActiveUniform(program, k);
        if (!uniform) {
            break;
        }
        name = uniform.name;
        if (name.substr(-3) === '[0]') {
            name = name.substr(0, name.length - 3);
        }
        setter = createSetter(uniform);
        setters[name] = setter;
        if (initFunctions[name]) {
            initFunctions[name](uniform);
        }
    }
    return setters;
};

/** Create, initialize and create a binder for the attributes of the program.
 * @param {Number} vertexCount
 *  Number of vertex of the program.
 * @param {Object} attributeArrays
 *  Arrays of values for each attribute:
 *
 *     attributeArrays['aName'];  // array of values for attribute 'aName'
 * @return {Function}
 *  A function which enables and binds all the attributes.
 * @private
 */
GLEffect.prototype._createAttributes = function (vertexCount, attributeArrays) {
    'use strict';
    var attributes = [];
    var gl = this._context;
    var program = this._program;

    // Browse attributes
    var attribInfo, attrib, dataArray;
    var k, n = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (k = 0; k < n; ++k) {
        attribInfo = gl.getActiveAttrib(program, k);
        if (!attribInfo) {
            break;
        }

        // Get attribute informations
        dataArray = attributeArrays[attribInfo.name] || false;
        attrib = {
            'buffer': gl.createBuffer(),
            'location': gl.getAttribLocation(program, attribInfo.name),
            'itemSize': Math.round(dataArray.length / vertexCount)
        };
        if (!dataArray || attrib.itemSize * vertexCount !== dataArray.length) {
            throw new Error('Argument Error: attribute array ' + attribInfo.name + ' is missing or has an invalid length.');
        }
        attributes.push(attrib);

        // Initialize it
        gl.bindBuffer(gl.ARRAY_BUFFER, attrib.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataArray), gl.STATIC_DRAW);
    }

    // Return binder function
    return function () {
        var _attrib;
        var _k, _n = attributes.length;
        for (_k = 0; _k < _n; ++_k) {
            _attrib = attributes[_k];
            gl.bindBuffer(gl.ARRAY_BUFFER, _attrib.buffer);
            gl.enableVertexAttribArray(_attrib.location);
            gl.vertexAttribPointer(_attrib.location, _attrib.itemSize, gl.FLOAT, false, 0, 0);
        }
    };
};

/** Initialize the input and output images.
 * @param {GLEffect.Image | HTMLElement | Array} input
 *  Input image(s).
 * @param {Object} opts
 *  The `opts` parameters of GLEffect.run.
 * @return {GLEffect.Image}
 *  The output image, initialized.
 * @throws {Error}
 *  If images has invalid types or dimensions.
 * @private */
GLEffect.prototype._initOutput = function (input, opts) {
    'use strict';
    var outsize = input;
    var getSize = GLEffect._readOpt(opts, 'getSize');
    var scale = GLEffect._readOpt(opts, 'scale');

    if (!this._uImageLength) {  // SINGLE IMAGE
        if (input instanceof Array) {
            throw new Error('Argument Error: expected a single image as input.');
        }
        if (getSize instanceof Function) {
            outsize = getSize(input);
            if (!outsize) {
                throw new Error('Argument Error: invalid image\'s dimensions.');
            }
        }
    } else {  // ARRAY OF IMAGES
        if (!(input instanceof Array) || input.length !== this._uImageLength) {
            throw new Error('Argument Error: invalid number of input images.');
        }
        outsize = input[0];
        if (getSize instanceof Function) {
            outsize = getSize(input);
            if (!outsize) {
                throw new Error('Argument Error: invalid images\' dimensions.');
            }
        } else if (!getSize) {
            var k, n = input.length;
            for (k = 0; k < n; ++k) {
                if (!input[k]) {
                    throw new Error('Argument Error: invalid images.');
                }
                if (input[k].width !== outsize.width || input[k].height !== outsize.height) {
                    throw new Error('Argument Error: invalid images\' dimensions.');
                }
            }
        }
    }

    // Create output image with given dimensions
    var output = new GLEffect.Image();
    if (!scale) {
        output.resize(
            GLEffect._readOpt(opts, 'width', outsize.width),
            GLEffect._readOpt(opts, 'height', outsize.height)
        );
    } else if (!GLEffect._readOpt(opts, 'width') && !GLEffect._readOpt(opts, 'height')) {
        output.resize(
            Math.round(scale * outsize.width),
            Math.round(scale * outsize.height)
        );
    } else {
        throw new Error('Argument Error: option "scale" cannot be used with "width" nor "height".');
    }
    return output;
};

/** Setup the input images as attributes.
 * @param {Image | HTMLElement | Array} input
 *  Input image(s).
 * @return {GLEffect.Image}
 *  The first image.
 * @private */
GLEffect.prototype._setupImages = function (input) {
    'use strict';
    var asImage = function (img) {
        return (img instanceof GLEffect.Image) ? img : new GLEffect.Image(img);
    };
    if (!(input instanceof Array)) {
        var image = asImage(input);
        this.setParameter('uImage', image._texture);
        return image;
    }
    var images = input.map(asImage);
    this.setParameter('uImage', images.map(function (im) { return im._texture; }));
    return images[0];
};


////////////////////////////////////////////////////////////////////////////////
//  STATIC ATTRIBUTES
////////////////////////////////////////////////////////////////////////////////

/** Header of the source code, available to avoid code duplication.
 * @static @readonly @type {String} */
GLEffect.sourceCodeHeader =  (function() {
    'use strict';
    var str = '';
    str += 'precision mediump float;                                        \n';
    str += 'varying vec2 vPosition;    // Curent pixel position (0..1)    \n\n';
    str += 'uniform vec2 uPixel;       // Pixel size (0..1)                 \n';
    str += 'uniform ivec2 uSize;       // Image size (in px)                \n';
    str += 'uniform sampler2D uImage;  // Input image                     \n\n';
    return str;
}());

/** @static @private @type {String} */
GLEffect._vertexShaderCode = (function() {
    'use strict';
    var str = '';
    str += 'attribute vec2 aVertexPosition;                                 \n';
    str += 'attribute vec2 aTexturePosition;                              \n\n';
    str += 'varying vec2 vPosition;                                       \n\n';
    str += 'void main(void) {                                               \n';
    str += '    vPosition = aTexturePosition;                               \n';
    str += '    vec2 finalPosition = 2.0 * aVertexPosition - 1.0;           \n';
    str += '    gl_Position = vec4(finalPosition, 0.0, 1.0);                \n';
    str += '}                                                               \n';
    return str;
}());

/** @static @private @type {Array} */
GLEffect._vertexPositions = [0, 0, 0, 1, 1, 0, 1, 1];

/** @static @private @type {Array} */
GLEffect._texturePositions = [0, 0, 0, 1, 1, 0, 1, 1];


////////////////////////////////////////////////////////////////////////////////
//  MEMBER ATTRIBUTES
////////////////////////////////////////////////////////////////////////////////

/** Source code of the effect.
 * @readonly @type {String} */
GLEffect.prototype.sourceCode = (function() {
    'use strict';
    var str = GLEffect.sourceCodeHeader;
    str += 'void main(void) {                                               \n';
    str += '    vec4 color = texture2D(uImage, vPosition);  // Pixel color  \n';
    str += '    gl_FragColor = vec4(color.rgb, color.a);    // Output color \n';
    str += '}                                                               \n';
    return str;
}());

/** @private @type {HTMLCanvasElement} */
GLEffect.prototype._canvas = null;

/** @private @type {WebGLRenderingContext} */
GLEffect.prototype._context = null;


////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
//  SUB-CLASS --- IMAGE
////////////////////////////////////////////////////////////////////////////////

/** An image stored on the GPU.
 *
 *  * This is the output type of {@link GLEffect}'s {@link GLEffect#run run method}.
 *  * The main methods are: #toCanvas and #toArray.
 * @constructor
 *  Create an image.
 * @param {HTMLElement} [image]
 *  Image to be loaded. Can be an `img`, `canvas`, or `video` elements.
 */
GLEffect.Image = function (image) {
    'use strict';
    var gl = GLEffect._getDefaultContext();
    /** @private @type {WebGLRenderingContext} */
    this._context = gl;
    /** @readonly @type {Number} */
    this.width = 0;
    /** @readonly @type {Number} */
    this.height = 0;

    /** @private @type {WebGLTexture} */
    this._texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    /** @private @type {WebGLFramebuffer} */
    this._framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    if (image) {
        this.load(image);
    }
    return this;
};

/** Clear and resize the image.
 * @param {Number} width
 * @param {Number} height
 */
GLEffect.Image.prototype.resize = function (width, height) {
    'use strict';
    var gl = this._context;
    var type = this._dataType();
    this.type = type;
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, type, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.width = width;
    this.height = height;
};

/** Load the image from an HTML element (image, canvas, or video).
 * @param {HTMLElement} image
 *  Image to be loaded.
 */
GLEffect.Image.prototype.load = function (image) {
    'use strict';
    var gl = this._context;
    var type = this._dataType();
    this.type = type;
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);  // flip the image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, type, image);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.width = image.width;
    this.height = image.height;
};

/** Export the image to an array.
 * @param {Float32Array | Uint8Array | Function} [outArray]
 *  Can be:
 *
 *  * the array to be filled, which must be big enough
 *  * an array constructor, which must be either `Float32Array` or `Uint8Array`.
 * @return {Float32Array | Uint8Array}
 *  An array containing the pixels' values, stored as RGBA values row by row.<br/>
 *  _Length:_ `4*width*height`<br/>
 *  _Type:_ given by `outArray` if specified, otherwise `Float32Array` if possible, else `Uint8Array`<br/>
 *  _Range of values:_ 0..1 for `Float32Array`, 0..255 for `Uint8Array`.
 * @throws {Error}
 *  If a float array is requested but GLEffect does not support floating-point images.
 */
GLEffect.Image.prototype.toArray = function (outArray) {
    'use strict';
    var gl = this._context;
    var type = this._dataType();
    var ArrayType = (type === gl.FLOAT) ? Float32Array : Uint8Array;
    if (outArray) {
        ArrayType = outArray instanceof Function ? outArray : outArray.constructor;
        var useBytes = ([Float32Array, Float64Array].indexOf(ArrayType) < 0);
        type = this._dataType(useBytes);
    }
    outArray = (outArray instanceof ArrayType) ? outArray : new ArrayType(4 * this.width * this.height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
    gl.readPixels(0, 0, this.width, this.height, gl.RGBA, type, outArray);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return outArray;
};

/** Export the image to a canvas.
 * @param {HTMLCanvasElement} [outCanvas]
 *  The canvas to draw the image in.
 *  If no canvas is given, a new canvas is created.
 * @return {HTMLCanvasElement | null}
 *  The resulting canvas, or `null` if the canvas does not support it.<br/>
 *  _Support failure:_ if the canvas is already used within a different context (e.g. WebGL).
 */
GLEffect.Image.prototype.toCanvas = function (outCanvas) {
    'use strict';
    outCanvas = outCanvas || document.createElement('canvas');
    outCanvas.width = this.width;
    outCanvas.height = this.height;

    var ctx2d = outCanvas.getContext('2d');
    if (!ctx2d) {
        outCanvas = null;
    } else {
        var imdata = ctx2d.createImageData(this.width, this.height);
        imdata.data.set(new Uint8ClampedArray(this.toArray(Uint8Array)));
        ctx2d.putImageData(imdata, 0, 0);
    }

    return outCanvas;
};

/** Get the suitable data type.
 * @param {Boolean} [useBytes]
 *  If specified, force the type to integers (bytes) or floats.
 * @return {Object}
 *  One of the `gl.FLOAT` or `gl.UNSIGNED_BYTE` constants.
 * @throws {Error}
 *  If `useBytes=false` and float extension is not available.
 * @private */
GLEffect.Image.prototype._dataType = function (useBytes) {
    'use strict';
    var gl = this._context;
    var isFloat;
    if (useBytes) {
        // forced to use BYTE
        isFloat = false;
    } else if (gl.getExtension('OES_texture_float')) {
        // choose FLOAT if possible
        isFloat = true;
    } else if (useBytes === undefined || useBytes === null) {
        // auto-detection but only BYTE available
        isFloat = false;
    } else {
        // forced to FLOAT, but not available
        throw new Error('Compatibility Error: "OES_texture_float" not supported: WebGL does not support floating-point.');
    }
    return isFloat ? gl.FLOAT : gl.UNSIGNED_BYTE;
};


////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
//  SUB-CLASS --- REDUCER
////////////////////////////////////////////////////////////////////////////////

/** Compute a scalar value from an image (such as norm or sum).
 * @constructor
 *  Create a new Reducer.
 * @param {Function} jsFunction
 *  See: GLEffect.Reducer.fromFunctions
 * @param {String} sourceCode
 *  GLSL source code.
 * @private */
GLEffect.Reducer = function (jsFunction, sourceCode, opts) {
    'use strict';
    opts = GLEffect._cloneOpts(opts);
    /** The GLSL reduction effect. @type {GLEffect} @private */
    this.glEffect = new GLEffect(sourceCode);
    /** The JS reduction function. @type {Function} @private */
    this.jsFunction = jsFunction;
    /** Type of the JS function. @type {Boolean} @private */
    this.isScalarFunction = GLEffect.Reducer._detectReturnValue(this.jsFunction);
    /** Effect to be applied before reduction. @type {GLEffect} @readonly */
    this.preEffect = GLEffect._readOpt(opts, 'pre');
    /** Function to be applied on the reduced RGBA value. @type {Function} @readonly */
    this.postFunction = GLEffect._readOpt(opts, 'post');
    GLEffect._readOpt(opts);
    return this;
};

/** Apply the reduction to an image.
 * @param {Image} image
 * @return {Array | Object}
 *  Return an array of length 4 with the reduced RGBA values,
 *   or the result of the post-function on it.
 */
GLEffect.Reducer.prototype.run = function (image, opts) {
    'use strict';
    opts = GLEffect._cloneOpts(opts);
    var maxIterCPU = GLEffect._readOpt(opts, 'maxIterCPU', 1024);
    GLEffect._readOpt(opts);
    if (!(image instanceof GLEffect.Image)) {
        var input = image;
        image = new GLEffect.Image(input);
    }
    if (this.preEffect) {
        image = this.preEffect.run(image);
    }
    var isPositiveEven = function (n) {
        return (n > 0) && (n % 2 === 0);
    };
    var isBigEnough = function (im) {
        return (im.width * im.height > maxIterCPU);
    };
    while (isBigEnough(image) && isPositiveEven(image.width) && isPositiveEven(image.height)) {
        image = this.glEffect.run(image, {'scale': 1 / 2});
    }
    var array = image.toArray();
    var result = new Float64Array(array.subarray(0, 4));
    var k, n = array.length;
    if (!this.isScalarFunction) {
        for (k = 4; k < n; k += 4) {
            this.jsFunction(result, array.subarray(k, k + 4));
        }
    } else {
        for (k = 4; k < n; k += 4) {
            result[0] = this.jsFunction(result[0], array[k]);
            result[1] = this.jsFunction(result[1], array[k + 1]);
            result[2] = this.jsFunction(result[2], array[k + 2]);
            result[3] = this.jsFunction(result[3], array[k + 3]);
        }
    }
    return this.postFunction ? this.postFunction(result) : result;
};

/** Create a Reducer.
 * @param {Function} jsFunction
 *  Javascript reduction function.
 *  Its prototype must be:
 *
 *     <Number> jsFunction(<Number>, <Number>);      // Return the result
 *       <void> jsFunction(<Array>, <const Array>);  // On place (Array = RGBA)
 * @param {String} glFunctionStr
 *  The GLSL function as a string.
 *  Its prototype must be:
 *
 *     vec4 function(vec4, vec4);  // reduction of two pixels
 * @param {Object} [opts = {}]
 *  - `pre`: GLEffect<br/>
 *      A pre-effect which is applied to `image` before reduction.
 *  - `post` : Function<br/>
 *      A JS post-function which is applied on the reduced RGBA value.
 * @return {GLEffect.Reducer}
 * @static */
GLEffect.Reducer.fromFunctions = function (jsFunction, glFunctionStr, opts) {
    'use strict';
    var str = GLEffect.sourceCodeHeader + glFunctionStr + '\n\n';
    str += 'void main(void) {                                                   \n';
    str += '    gl_FragColor = function(                                        \n';
    str += '      function(                                                     \n';
    str += '        texture2D(uImage, vPosition + uPixel * vec2(-0.5, -0.5)),   \n';
    str += '        texture2D(uImage, vPosition + uPixel * vec2(+0.5, -0.5))    \n';
    str += '      ),                                                            \n';
    str += '      function(                                                     \n';
    str += '        texture2D(uImage, vPosition + uPixel * vec2(-0.5, +0.5)),   \n';
    str += '        texture2D(uImage, vPosition + uPixel * vec2(+0.5, +0.5))    \n';
    str += '      )                                                             \n';
    str += '    );                                                              \n';
    str += '}                                                                   \n';
    return new GLEffect.Reducer(jsFunction, str, opts);
};

/** Check whether the JS reduction function takes numbers or arrays as argument.
 * @return {Boolean}
 *  `true` iff scalar function (see: GLEffect.Reducer.fromFunctions).
 * @throws {Error}
 *  If function return value is incoherent.
 * @static @private */
GLEffect.Reducer._detectReturnValue = function (jsFunction) {
    'use strict';
    var array, scalar;
    try {
        array = jsFunction(new Uint8Array(4), new Uint8Array(4));
    } catch (e) {
        array = new Error();
    }
    try {
        scalar = jsFunction(0, 0);
    } catch (e) {
        scalar = new Error();
    }
    var isArray = (array === undefined || array === null);
    var isScalar = (typeof scalar === 'number');
    if (isScalar === isArray) {
        throw new Error('Error: cannot infer JS reduction function prototype.');
    }
    return isScalar;
};
