/*jslint vars: true, nomen: true, browser: true */
/*jshint multistr: true */
/*global Float32Array */

/** @class GLEffect */

/** Create a new GLEffect to be run on the GPU.
 * @param {HTMLCanvasElement} [canvas]
 *  The canvas to display the result.
 * @param {String} [shaderCode]
 *  The shader code.
 * @return {GLEffect|null}
 *  The created GLEffect, or null if not supported.
 * @throw {Error}
 *  If the compilation fails.
 */
function GLEffect(canvas, shaderCode) {
    'use strict';
    this.canvas = canvas || window.document.createElement('canvas');
    this.context = this._createContext();
    if (!this.context) {
        return null;
    }
    if (shaderCode) {
        this.fragmentShaderCode = shaderCode;
    }
    var fshader = this._compileShader(this.fragmentShaderCode);
    var vshader = this._compileShader(this.vertexShaderCode, true);
    this.program = this._createProgram(fshader, vshader);
    return this;
}

/** Default vertex shader source code. */
GLEffect.prototype.vertexShaderCode = '                                     \n\
    attribute vec2 aVertexPosition;                                         \n\
    attribute vec2 aTexturePosition;                                        \n\
                                                                            \n\
    varying vec2 vPosition;                                                 \n\
                                                                            \n\
    void main(void) {                                                       \n\
        vPosition = aTexturePosition;                                       \n\
        gl_Position = vec4(aVertexPosition, 0.0, 1.0);                      \n\
    }                                                                       \n\
    ';

/** Default fragment shader source code. */
GLEffect.prototype.fragmentShaderCode = '                                   \n\
    precision mediump float;                                                \n\
    varying vec2 vPosition;                                                 \n\
                                                                            \n\
    uniform sampler2D uTexture;                                             \n\
    uniform ivec2 uSize;                                                    \n\
                                                                            \n\
    void main(void) {                                                       \n\
        vec4 color = texture2D(uTexture, vPosition);                        \n\
        float gray = dot(color.rgb, vec3(1.0)) / 3.0;                       \n\
        gl_FragColor = vec4(vec3(gray), 1.0);                               \n\
    }                                                                       \n\
    ';

/** Import an image in the GPU.
 * @param {Image} image
 *  An image or canvas element.
 * @return
 *  The created GL Image (which is a 'glTexture').
 */
GLEffect.prototype.importGLImage = function (image) {
    'use strict';
    var canvas = this.getCanvas();
    var ctx = this.getContext();
    var texture = ctx.createTexture();

    ctx.bindTexture(ctx.TEXTURE_2D, texture);
    ctx.pixelStorei(ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, image);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);

    canvas.width = image.width;
    canvas.height = image.height;

    return texture;  // TODO: bind 'null' texture, and rebind it when run
};

/** Apply the effect. */
GLEffect.prototype.run = function () {
    'use strict';
    var ctx = this.getContext();
    ctx.useProgram(this.program);

    // TODO: size of the image
    var canvas = this.getCanvas();
    ctx.viewport(0, 0, canvas.width, canvas.height);

    ctx.clearColor(0.0, 0.0, 0.0, 1.0);
    this._setupShaders();
    this._runShaders();
};

/** Get the canvas.
 * @return
 *  The underlying canvas.
 */
GLEffect.prototype.getCanvas = function () {
    'use strict';
    return this.canvas;
};

/** Get the WebGL context.
 * @return
 *  WebGL context.
 */
GLEffect.prototype.getContext = function () {
    'use strict';
    return this.context;
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
 * @throw {Error}
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
 * @throw {Error}
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

/** Set up the shaders before running the effect. */
GLEffect.prototype._setupShaders = function () {
    'use strict';
    var canvas = this.getCanvas();
    var ctx = this.getContext();
    // TODO: an automatic way of setting parameters

    ctx.uniform1i(ctx.getUniformLocation(this.program, 'uTexture'), 0);
    ctx.uniform2i(ctx.getUniformLocation(this.program, 'uSize'), canvas.width, canvas.height);
};

/** Run the shaders. */
GLEffect.prototype._runShaders = function () {
    'use strict';
    var numItems = 4;
    this._createAttribute('aVertexPosition', 2, [1, 1, -1, 1, 1, -1, -1, -1]);
    this._createAttribute('aTexturePosition', 2, [1, 0, 0, 0, 1, 1, 0, 1]);

    var ctx = this.getContext();
    ctx.clear(ctx.COLOR_BUFFER_BIT);
    ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, numItems);
};

// TODO: create a function to be used like:
//  > effect.setUniform('vec3', 'color', 1, 1, 1);