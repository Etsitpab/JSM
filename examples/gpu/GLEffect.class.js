/*jslint browser: true, vars: true, plusplus: true, nomen: true */
/*global Float32Array, Int32Array, Uint8Array, Uint8ClampedArray */


/** @class GLEffect
 * Apply real-time effects on images using the GPU.
 * They are written in GLSL (GL Shading Language) and run on the GPU using OpenGL.
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
 * As an example, the value of the top-right neighbor of the current pixels is:
 *
 *      vec4 neighbor = texture2D(uImage, vPosition + uPixel);  // GLSL code
 *
 * To avoid code duplication when writing effects (in particular the former variables),
 * consider using the code snippet contained in `GLEffect.sourceCodeHeader'.
 */


/** @constructor
 * @param {String} sourceCode
 *  The source code of the effect, written in GLSL.
 * @return {GLEffect | null}
 *  The effect, or null if WebGL is not supported.
 * @throws {Error}
 *  If there is an error during the source code compilation.
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
    /** Expected length of `uImage` uniform array, 0 if not an array. @private @type {Number} */
    this._uImageLength = 0;

    /** Setters for the uniform variables.
     *  Calling syntax: `_setters[uName](value)`
     * @private @type {Object} */
    this._setters = this._createUniformSetters({
        'uImage': function (uniform) {
            if (uniform.name.substr(-3) === '[0]') {
                that.uImageLength = uniform.size;
            }
        }
    });

    /** Current values of the parameters. @readonly @type {Object} */
    this.parameters = {};

    /** Number of vertices. @private @type {Number} */
    this._vertexCount = 4;

    /** Bind all the attributes.
     * @private @method */
    this._bindAttributes = this._createAttributes(this._vertexCount, {
        'aVertexPosition': GLEffect._vertexPositions,
        'aTexturePosition': GLEffect._texturePositions
    });

    return this;
}


////////////////////////////////////////////////////////////////////////////////
//  MEMBER METHODS
////////////////////////////////////////////////////////////////////////////////

// TODO: handle arrays of images

/** Apply the effect to an image.
 * @param {GLEffect.Image | Array} image
 * @param {GLEffect.Image} [output = new GLEffect.Image()]
 *  Will be filled with the result. Cannot be the same object as the input image.
 * @return {GLEffect.Image}
 */
GLEffect.prototype.run = function (image, output) {
    'use strict';
    var input = image;
    if (input === output) {
        throw new Error('Cannot run the effect on place: input and output must be different objects.');
    }
    if (!(input instanceof GLEffect.Image)) {
        input = new GLEffect.Image();
        input.load(image);
    }
    output = output || new GLEffect.Image();
    output.resize(input.width, input.height);

    // Setup GL context
    var gl = this._context;
    gl.useProgram(this._program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, output._framebuffer);
    gl.disable(gl.DEPTH_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.viewport(0, 0, input.width, input.height);

    // Setup uniforms
    input._bind(0);
    gl.uniform1i(gl.getUniformLocation(this._program, 'uImage'), 0);  // TODO: setParameter
    this.setParameter('uSize', [input.width, input.height], false);
    this.setParameter('uPixel', [1 / input.width, 1 / input.height], false);

    // Render
    this._bindAttributes();
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this._vertexCount);

    // Clean up
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return output;
};

/** Change the value of a parameter (a GLSL uniform variable).
 * @param {String} name
 * @param {Number | Array} value
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

/** Check whether the GPU acceleration is supported.
 * @return {Boolean}
 * @static */
GLEffect.doesSupportGL = function () {
    'use strict';
    return Boolean(GLEffect._getDefaultContext());
};

/** Check whether floating-point storage is supported by the GPU.
 * @return {Boolean}
 * @static */
GLEffect.doesSupportFloat = function () {
    'use strict';
    var gl = GLEffect._getDefaultContext();
    var ext = gl && gl.getExtension('OES_texture_float');
    return Boolean(ext);
};

/** Get the default WebGL context.
 * @return {WebGLRenderingContext}
 *  The context, or null if not supported.
 * @private
 */
GLEffect._getDefaultContext = function () {
    'use strict';
    if (!GLEffect.prototype._canvas) {
        var canvas = document.createElement('canvas');
        GLEffect.prototype._canvas = canvas;
        GLEffect.prototype._context = GLEffect._createContext(canvas);
    }
    return GLEffect.prototype._context;
};

/** Create a WebGL context.
 * @param {HTMLCanvasElement} canvas
 * @return {WebGLRenderingContext}
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


////////////////////////////////////////////////////////////////////////////////
//  PROTECTED METHODS
////////////////////////////////////////////////////////////////////////////////

/** Compile a WebGL shader.
 * @param {String} sourceCode
 * @param {Boolean} isVertexShader
 * @return {WebGLShader}
 * @throws {Error}
 *  If there is an error during the shader compilation.
 * @private */
GLEffect.prototype._compileShader = function (sourceCode, isVertexShader) {
    'use strict';
    var gl = this._context;
    var shaderType = isVertexShader ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;
    var shader = gl.createShader(shaderType);
    gl.shaderSource(shader, sourceCode);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error('Shader compilation: ' + gl.getShaderInfoLog(shader));
    }
    return shader;
};

/** Create a WebGL program from shaders.
 * @param {WebGLShader} vertexShader
 * @param {WebGLShader} fragmentShader
 * @return {WebGLProgram}
 * @private */
GLEffect.prototype._createProgram = function (vertexShader, fragmentShader) {
    'use strict';
    var gl = this._context;
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error('Could not link shaders');
    }
    return program;
};

/** Create setters for the uniform variables of the (current) program.
 * @param {Object} initFunctions
 *  Each initFunctions[name] function will be called with the corresponding uniform as parameter.
 * @return {Object}
 *  A setter for each uniform variable.
 * @private */
GLEffect.prototype._createUniformSetters = function (initFunctions) {
    'use strict';
    initFunctions = initFunctions || {};
    var gl = this._context;
    var program = this._program;

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
        if (type === gl.FLOAT_MAT2) {
            return function(v) {
                gl.uniformMatrix2fv(location, false, v);  // Reshape
            };
        }
        if (type === gl.FLOAT_MAT3) {
            return function(v) {
                gl.uniformMatrix3fv(location, false, v);  // Reshape
            };
        }
        if (type === gl.FLOAT_MAT4) {
            return function(v) {
                gl.uniformMatrix4fv(location, false, v);  // Reshape
            };
        }
        if (type === gl.SAMPLER_2D || type === gl.SAMPLER_CUBE) {
            return function () {
                throw new Error('Textures cannot be set automatically');
            };
        }
        throw new Error('Unsupported parameter: ' + uniform.name);
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
 * @param {Object} attributeArrays
 * @return {Object}
 *  A function (with no argument) which enables and binds all the attributes.
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
            throw new Error('Attribute array ' + attribInfo.name + ' is missing or has an invalid length');
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


////////////////////////////////////////////////////////////////////////////////
//  STATIC ATTRIBUTES
////////////////////////////////////////////////////////////////////////////////

/** Header of the source code, available to avoid source code duplication.
 * @static @readonly @type {String} */
GLEffect.sourceCodeHeader =  (function() {
    'use strict';
    var str = '';
    str += 'precision mediump float;                                        \n';
    str += 'varying vec2 vPosition;    // Pixel position (0..1)             \n';
    str += '                                                                \n';
    str += 'uniform vec2 uPixel;       // Pixel size                        \n';
    str += 'uniform ivec2 uSize;       // Image size                        \n';
    str += 'uniform sampler2D uImage;  // Input image                       \n';
    str += '                                                                \n';
    return str;
}());

/** @static @private @type {String} */
GLEffect._vertexShaderCode = (function() {
    'use strict';
    var str = '';
    str += 'attribute vec2 aVertexPosition;                                 \n';
    str += 'attribute vec2 aTexturePosition;                                \n';
    str += '                                                                \n';
    str += 'varying vec2 vPosition;                                         \n';
    str += '                                                                \n';
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
    str += '    vec4 color = texture2D(uImage, vPosition);                  \n';
    str += '    gl_FragColor = vec4(color.rgb, color.a);                    \n';
    str += '}                                                               \n';
    return str;
}());

/** @private @type {HTMLCanvasElement} */
GLEffect.prototype._canvas = null;

/** @private @type {WebGLRenderingContext} */
GLEffect.prototype._context = null;


////////////////////////////////////////////////////////////////////////////////
//  SUB-CLASS
////////////////////////////////////////////////////////////////////////////////

// TODO: Float support

/** An image stored on the GPU.
 * @constructor
 *  Create an empty image.
 */
GLEffect.Image = function () {
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

    return this;
};

/** Clear and resize the image.
 * @param {Number} width
 * @param {Number} height
 */
GLEffect.Image.prototype.resize = function (width, height) {
    'use strict';
    var gl = this._context;
    var type = gl.UNSIGNED_BYTE;
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, type, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.width = width;
    this.height = height;
};

/** Load the image from an HTML element (image, canvas, video).
 * @param {HTMLElement} image
 */
GLEffect.Image.prototype.load = function (image) {
    'use strict';
    var gl = this._context;
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);  // flip the image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.width = image.width;
    this.height = image.height;
};

/** Export the image to an array.
 * @param {Uint8Array} [outArray]
 *  Array to be filled; must be big enough.
 * @return {Uint8Array}
 *  The pixels' values, stored as RGBA values row by row.
 *  Its size is 4 x width x height.
 */
GLEffect.Image.prototype.toArray = function (outArray) {
    'use strict';
    outArray = outArray || new Uint8Array(4 * this.width * this.height);
    var gl = this._context;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
    gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, outArray);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return outArray;
};

/** Export the image to a canvas.
 * @param {HTMLCanvasElement} [outCanvas]
 * @return {HTMLCanvasElement}
 *  The resulting canvas, or null if an error occurred.
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
        imdata.data.set(new Uint8ClampedArray(this.toArray()));
        ctx2d.putImageData(imdata, 0, 0);
    }

    return outCanvas;
};

/** Bind the image to a WebGL slot.
 * @param {Number} [slot = 0]
 * @private */
GLEffect.Image.prototype._bind = function (slot) {
    'use strict';
    var gl = this._context;
    gl.activeTexture(gl.TEXTURE0 + (slot || 0));
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.activeTexture(gl.TEXTURE0);
};
