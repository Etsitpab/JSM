/*jslint vars: true, nomen: true, browser: true, plusplus: true */
/*global Float32Array, Int32Array, WebGLTexture, WebGLFramebuffer, HTMLCanvasElement */

/** This class runs real-time effects.
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
 *     var outCanvas = effect.run(myCanvas);
 *
 * The parameters of the effects are uniform variables in the source code.
 * A few parameters are automatically set for you:
 *
 * * `vPosition`, which provides the normalized position of the current pixel (in `0..1`).
 * * `uPixel`, which provides the normalized size of a pixels.
 * * `uSize`, which provides the size of the image, in pixels.
 * * `uImage`, which refers to the processed image.
 *
 * As an example, the value of the top-right neightbor of the current pixels is:
 *
 *      vec4 neighbor = texture2D(uImage, vPosition + uPixel);  // GLSL code
 *
 * To avoid code duplication when writing effects (in particular the former variables),
 * consider using the code snippet contained in `GLEffect.sourceCodeHeader'.
 *
 * @constructor Create a new GLEffect to be run on the GPU.
 * @param {String} [sourceCode]
 *  The source code, written in GLSL.
 * @param {HTMLCanvasElement} [canvas]
 *  The working canvas.
 * @return {GLEffect | null}
 *  The created GLEffect, or null if not supported.
 * @throws {Error}
 *  If the compilation fails.
 */
function GLEffect(sourceCode, canvas) {
    'use strict';
    this.canvas = canvas;
    if (!this.canvas) {
        this.canvas = window.document.createElement('canvas');
        this.canvas.width = '1px';
        this.canvas.height = '1px';
    }
    this.context = this._createContext();
    if (!this.context) {
        return null;
    }
    if (sourceCode) {
        this.sourceCode = sourceCode;  // otherwise, fall back to prototype
    }
    var fshader = this._compileShader(this.sourceCode);
    var vshader = this._compileShader(this.vertexShaderCode, true);
    this.program = this._createProgram(fshader, vshader);

    var that = this;
    this.uImageLength = 0;  // number of images expected as input
    this.setters = this._createSetters({
        'uImage': function (uniform) {
            if (uniform.name.substr(-3) === '[0]') {
                that.uImageLength = uniform.size;
            }
        }
    });
    return this;
}


/* ********* ATTRIBUTES ********* */

/** First lines of the source code, for convenience. @readonly @type {String} */
GLEffect.sourceCodeHeader = (function() {
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

/** Source code of the effect, written in GLSL. @readonly @type {String} */
GLEffect.prototype.sourceCode = (function() {
    'use strict';
    var str = GLEffect.sourceCodeHeader;
    str += 'void main(void) {                                               \n';
    str += '    vec4 color = texture2D(uImage, vPosition);                  \n';
    str += '    gl_FragColor = vec4(color.rgb, color.a);                    \n';
    str += '}                                                               \n';
    return str;
}());

/** Source code of the vertex shader. @private @type {String} */
GLEffect.prototype.vertexShaderCode = (function() {
    'use strict';
    var str = '';
    str += 'attribute vec2 aVertexPosition;                                 \n';
    str += 'attribute vec2 aTexturePosition;                                \n';
    str += '                                                                \n';
    str += 'varying vec2 vPosition;                                         \n';
    str += '                                                                \n';
    str += 'void main(void) {                                               \n';
    str += '    vPosition = aTexturePosition;                               \n';
    str += '    gl_Position = vec4(aVertexPosition, 0.0, 1.0);              \n';
    str += '}                                                               \n';
    return str;
}());


/* ********* PUBLIC METHODS ********* */

// TODO: storage order problem, image is flipped
/** Create and fill a canvas from a Framebuffer.
 *  The Framebuffer must be obtained by GLEffect.run (to hangle the context).
 * @param {WebGLFramebuffer} framebuffer
 * @return {HTMLCanvasElement}
 */
GLEffect.framebufferToCanvas = function (framebuffer) {
    'use strict';

    // Setup the FB
    var fb = framebuffer;
    var gl = fb.context;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    // Create the canvas
    var canvas = document.createElement('canvas');
    canvas.width = fb.width;
    canvas.height = fb.height;

    // Copy the content
    var ctx2d = canvas.getContext('2d');
    if (!ctx2d) {
        canvas = null;
    } else {
        var imdata = ctx2d.createImageData(fb.width, fb.height);
        var pixels = new Uint8Array(4 * fb.width * fb.height);
        gl.readPixels(0, 0, fb.width, fb.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        imdata.data.set(new Uint8ClampedArray(pixels));
        ctx2d.putImageData(imdata, 0, 0);
    }

    // Terminate
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return canvas;
};

// TODO: handle FB as input/output + doc about it
/** Apply the effect.
 *  Note that the canvas is repainted each time the effect is run.
 * @param {Image} image
 *  The input image / video / canvas.
 * @param [output]
 *  NOT DOCUMENTED YET
 * @return {HTMLCanvasElement | WebGLFramebuffer}
 *  The canvas or framebuffer in which the result is stored.
 */
GLEffect.prototype.run = function (image, output) {
    'use strict';

    // Hangle single or multiple images
    var imageList;
    var isArray = image instanceof Array;
    if (!this.uImageLength) {
        if (isArray) {
            throw new Error('GLEffect expected a single image');
        }
    } else {
        if (!isArray || image.length !== this.uImageLength) {
            throw new Error('GLEffect expected ' + this.uImageLength + ' images');
        }
        imageList = image;
        image = image[0];
    }

    // Initialize the context
    var gl = this.getContext();
    var canvas = this.getCanvas();
    gl.useProgram(this.program);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Initialize output
    if (output) {
        output = this._bindFramebuffer(image.width, image.height);
    } else {
        output = canvas;
        output.width = image.width;
        output.height = image.height;  // TODO: check all image size
    }
    gl.viewport(0, 0, output.width, output.height);

    if (!imageList) {
        this._bindTexture(image);
        gl.uniform1i(gl.getUniformLocation(this.program, 'uImage'), 0);
    } else {
        var k, tab = [];
        for (k = 0; k < this.uImageLength; k++) {
            this._bindTexture(imageList[k], k);
            tab.push(k);
        }
        gl.uniform1iv(gl.getUniformLocation(this.program, 'uImage'), new Int32Array(tab));
    }

    this._run();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return output;
};

/** Set the value of an uniform parameter of the effect.
 * @param {String} name
 *  Name of the parameter to be set.
 * @param {Number | Array} value
 *  Value of the parameter.
 *  For array types (e.g. `vec2` or `vec[n]`), it must be an array.
 *  For matrix types (e.g. `mat3`), it must be an array of array, columnwise.
 */
GLEffect.prototype.setParameter = function (name, value) {
    'use strict';
    if (this.setters[name]) {
        this.setters[name](value);
    }
};

/** Get the output canvas.
 * @return {HTMLCanvasElement}
 *  The canvas, in which the result will be stored.
 * @protected
 */
GLEffect.prototype.getCanvas = function () {
    'use strict';
    return this.canvas;
};

/** Get the WebGL context.
 * @return
 *  WebGL context.
 * @protected
 */
GLEffect.prototype.getContext = function () {
    'use strict';
    return this.context;
};

/** Check for compatibility with FLOAT textures.
 * @return {Boolean}
 */
GLEffect.prototype.isFloatCompatible = function () {
    'use strict';
    var ext, gl = this.getContext();
    try {
        ext = gl.getExtension('OES_texture_float');
    } catch (ignore) {}
    return Boolean(ext);
};

/** Get a list of the effect's parameters.
 * @return {Array}
 *  List of the parameters which can be changed.
 */
GLEffect.prototype.getParametersList = function () {
    'use strict';
    var ignored = {'uImage': 1, 'uSize': 1, 'uPixel': 1};
    var list = [];
    var param;
    for (param in this.setters) {
        if (this.setters.hasOwnProperty(param) && !ignored[param]) {
            list.push(param);
        }
    }
    return list;
};


/* ********* PROTECTED / PRIVATE METHODS ********* */

/** Create a context from the canvas.
 * @return
 *  WebGL context, or null if not supported.
 * @private
 */
GLEffect.prototype._createContext = function () {
    'use strict';
    var canvas = this.canvas;
    var gl = null;
    try {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    } catch (e) {
        gl = null;
    }
    return gl;
};

/** Create an attribute array.
 * @param {String} name
 *  Name of the attribute, as used in the vertex shader.
 * @param {Number} itemSize
 *  Size of the attribute (e.g. 3 for a vec3).
 * @param {Array} dataArray
 *  Array containing the data.
 * @return
 *  The GL buffer.
 * @private
 */
GLEffect.prototype._createAttribute = function (name, itemSize, dataArray) {
    'use strict';
    var gl = this.getContext();
    var attribute = gl.getAttribLocation(this.program, name);
    if (attribute === -1) {
        return null;
    }
    gl.enableVertexAttribArray(attribute);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataArray), gl.STATIC_DRAW);
    gl.vertexAttribPointer(attribute, itemSize, gl.FLOAT, false, 0, 0);
    return buffer;
};

/** Compile a shader.
 * @param {String} sourceCode
 *  Source code of the shader.
 * @param {Boolean} [isVertexShader=false]
 *  True iff it is the vertex shader.
 * @return
 *  The compiled shader.
 * @throws {Error}
 *  If there is an error during the shader compilation.
 * @private
 */
GLEffect.prototype._compileShader = function (sourceCode, isVertexShader) {
    'use strict';
    var gl = this.getContext();
    var shaderType = isVertexShader ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;
    var shader = gl.createShader(shaderType);
    gl.shaderSource(shader, sourceCode);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error('Shader compilation -- ' + gl.getShaderInfoLog(shader));
    }
    return shader;
};

/** Create a GL program from the compiled shaders.
 * @param vertexShader
 * @param fragmentShader
 * @return
 *  The GL program.
 * @throws {Error}
 *  If there is an error during the shader linkage.
 * @private
 */
GLEffect.prototype._createProgram = function (vertexShader, fragmentShader) {
    'use strict';
    var gl = this.getContext();
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error('Could not link shaders');
    }
    return program;
};

// TODO: handle matrices properly
// TODO: check v.length
/** Create setters for the uniform variables.
 * Inspired by [WebGL Funcamentals](http://github.com/greggman/webgl-fundamentals)
 * @param [actions = {}]
 *  Callback functions to be called for specific uniform variables.
 * @private
 */
GLEffect.prototype._createSetters = function (actions) {
    'use strict';
    actions = actions || {};
    var gl = this.getContext();
    var program = this.program;

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
    var uniformSetters = {};
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
        uniformSetters[name] = setter;
        if (actions[name]) {
            actions[name](uniform);
        }
    }
    return uniformSetters;
};

/** Bind a texture, create it if needed.
 * @param {WebGLTexture | Image} image
 *  A texture, or an image / video / canvas element.
 * @param {Number} [slot = 0]
 *  Slot to bind the texture to.
 * @return {WebGLTexture}
 *  The texture.
 * @private
 */
GLEffect.prototype._bindTexture = function (image, slot) {
    'use strict';
    var gl = this.getContext();
    gl.activeTexture(gl.TEXTURE0 + (slot || 0));

    // If framebuffer, get its texture
    if (image instanceof WebGLFramebuffer) {
        image = image.texture;
    }

    // If existing texture, only bind
    if (image instanceof WebGLTexture) {
        gl.bindTexture(gl.TEXTURE_2D, image);
        return image;
    }

    // If not existing, create it
    var noFlip = (image instanceof HTMLCanvasElement);
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // If image, load it
    if (image) {
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        if (!noFlip) {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    }

    // Set its parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
};

/** Bind a Framebuffer object (and create it).
 * @param {Number} width
 * @param {Number} height
 * @return {WebGLFramebuffer}
 * @private
 */
GLEffect.prototype._bindFramebuffer = function (width, height) {
    'use strict';
    var gl = this.getContext();
    var texture = this._bindTexture();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    var fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    fb.width = width;
    fb.height = height;
    fb.texture = texture;
    fb.context = gl;
    return fb;
};

/** Set up the memory and run the shader. @private */
GLEffect.prototype._run = function () {
    'use strict';
    var cv = this.getCanvas();
    var gl = this.getContext();

    this.setParameter('uSize', [cv.width, cv.height]);
    this.setParameter('uPixel', [1 / cv.width, 1 / cv.height]);

    // TODO: create attributes only once
    var numItems = 4;
    this._createAttribute('aVertexPosition', 2, [1, 1, -1, 1, 1, -1, -1, -1]);
    this._createAttribute('aTexturePosition', 2, [1, 1, 0, 1, 1, 0, 0, 0]);

    gl.disable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, numItems);
};
