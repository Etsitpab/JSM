/*jslint vars: true, nomen: true, browser: true, plusplus: true */
/*global Float32Array, Int32Array, WebGLTexture, HTMLCanvasElement */


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
 *     effect.setParameter('uStrength', 4, 'uLocation', [0.5, 0.5]);
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
        this.sourceCode = sourceCode;
    }
    var fshader = this._compileShader(this.sourceCode);
    var vshader = this._compileShader(this.vertexShaderCode, true);
    this.program = this._createProgram(fshader, vshader);
    this.setters = this._createSetters();
    return this;
}


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

// TODO: cite it in the class documentation
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

// TODO: handle WebGLTexture as input/output
// TODO: several images?
/** Apply the effect.
 *  Note that the canvas is repainted each time the effect is run.
 * @param {Image} image
 *  The input image / video / canvas.
 * @return {HTMLCanvasElement}
 *  The canvas, in which the result is stored.
 */
GLEffect.prototype.run = function (image) {
    'use strict';

    var ctx = this.getContext();
    var canvas = this.getCanvas();
    ctx.useProgram(this.program);

    canvas.width = image.width;  // TODO: how to do this with textures?
    canvas.height = image.height;
    ctx.viewport(0, 0, canvas.width, canvas.height);

    this._bindTexture(image);

    ctx.clearColor(0.0, 0.0, 0.0, 1.0);
    this._run();
    return this.getCanvas();
};

/** Set uniform parameters of the effect.
 * @param {String} name
 *  Name of the parameter to be set.
 * @param {Number | Array} value
 *  Value of the parameter.
 *  For array types (e.g. `vec2` or `vec[n]`), it must be an array.
 *  For matrix types (e.g. `mat3`), it must be an array of array, columnwise.
 */
GLEffect.prototype.setParameters = function (/* name, value, ... */) {
    'use strict';
    if (!arguments.length || arguments.length % 2) {
        throw new Error('Invalid number of arguments');
    }
    var k, name, value;
    for (k = 0; k + 1 < arguments.length; k += 2) {
        name = arguments[k];
        value = arguments[k + 1];
        if (this.setters[name]) {
            this.setters[name](value);
        }
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
 * @return {WebGLRenderingContext}
 *  WebGL context.
 * @protected
 */
GLEffect.prototype.getContext = function () {
    'use strict';
    return this.context;
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

/** Create a context from the canvas.
 * @return
 *  WebGL context, or null if not supported.
 * @private
 */
GLEffect.prototype._createContext = function () {
    'use strict';
    var canvas = this.canvas;
    var ctx = null;
    try {
        ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    } catch (e) {
        ctx = null;
    }
    return ctx;
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
    var ctx = this.getContext();
    var attribute = ctx.getAttribLocation(this.program, name);
    if (attribute === -1) {
        return null;
    }
    ctx.enableVertexAttribArray(attribute);

    var buffer = ctx.createBuffer();
    ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer);
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(dataArray), ctx.STATIC_DRAW);
    ctx.vertexAttribPointer(attribute, itemSize, ctx.FLOAT, false, 0, 0);
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
    var ctx = this.getContext();
    var shaderType = isVertexShader ? ctx.VERTEX_SHADER : ctx.FRAGMENT_SHADER;
    var shader = ctx.createShader(shaderType);
    ctx.shaderSource(shader, sourceCode);
    ctx.compileShader(shader);
    if (!ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)) {
        throw new Error('Shader compilation -- ' + ctx.getShaderInfoLog(shader));
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
    var ctx = this.getContext();
    var program = ctx.createProgram();
    ctx.attachShader(program, vertexShader);
    ctx.attachShader(program, fragmentShader);
    ctx.linkProgram(program);
    if (!ctx.getProgramParameter(program, ctx.LINK_STATUS)) {
        throw new Error('Could not link shaders');
    }
    return program;
};

// TODO: handle matrices properly
// Inspired by: github.com/greggman/webgl-fundamentals
GLEffect.prototype._createSetters = function () {
    'use strict';
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
    }
    return uniformSetters;
};

/** Import an image in the GPU.
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
    var ctx = this.getContext();
    ctx.activeTexture(ctx.TEXTURE0 + (slot || 0));

    // If existing texture, only bind
    if (image instanceof WebGLTexture) {
        ctx.bindTexture(ctx.TEXTURE_2D, image);
        return image;
    }

    // If new, create it
    var noFlip = (image instanceof HTMLCanvasElement);
    var texture = ctx.createTexture();
    ctx.bindTexture(ctx.TEXTURE_2D, texture);

    // Load it
    ctx.pixelStorei(ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    if (!noFlip) {
        ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, true);
    }
    ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, image);

    // Set its parameters
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);

    return texture;
};

/** Set up the memory and run the shader. @private */
GLEffect.prototype._run = function () {
    'use strict';
    var cv = this.getCanvas();
    var ctx = this.getContext();

    ctx.uniform1i(ctx.getUniformLocation(this.program, 'uTexture'), 0);
    this.setParameters('uSize', [cv.width, cv.height]);
    this.setParameters('uPixel', [1 / cv.width, 1 / cv.height]);

    // TODO: create attributes only once
    var numItems = 4;
    this._createAttribute('aVertexPosition', 2, [1, 1, -1, 1, 1, -1, -1, -1]);
    this._createAttribute('aTexturePosition', 2, [1, 1, 0, 1, 1, 0, 0, 0]);

    ctx.clear(ctx.COLOR_BUFFER_BIT);
    ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, numItems);
};
