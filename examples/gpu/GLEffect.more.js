/*global GLEffect, GLReduction */


/** Sample effects. @singleton @class GLEffect.Sample */
GLEffect.Sample = {};

/** Identity effect (using the raw source code) */
GLEffect.Sample.identity_main = new GLEffect();

/** Identity effect (using the RGB function form) */
GLEffect.Sample.identity_RGB = GLEffect.fromFunction([
    'vec3 function(vec3 color) {',
    '    return color;',
    '}'
].join('\n'));

/** Identity effect (using the RGBA function form) */
GLEffect.Sample.identity_RGBA = GLEffect.fromFunction([
    'vec4 function(vec4 color) {',
    '    return color;',
    '}'
].join('\n'));

/** Pixel-wise absolute value. @type {GLEffect} */
GLEffect.Sample.abs = GLEffect.fromFunction([
    'vec3 function(vec3 color) {',
    '    return abs(color);',
    '}'
].join('\n'));

/** Conversion to gray-level images. @type {GLEffect} */
GLEffect.Sample.gray = GLEffect.fromFunction([
    'vec3 function(vec3 color) {',
    '    float gray = dot(color, vec3(0.3, 0.6, 0.1));',
    '    return vec3(gray);',
    '}'
].join('\n'));

/** Convolution by a 3x3 kernel.
 *
 *  Effect parameters:
 *
 *  * `mat3 kernel`: the convolution kernel.
 *
 * @type {GLEffect} */
GLEffect.Sample.conv3x3 = new GLEffect(GLEffect.sourceCodeHeader + [
    'uniform mat3 kernel;  // convolution kernel',
    '',
    'void main(void) {',
    '    vec2 x = vPosition;',
    '    vec2 dx = uPixel;',
    '    vec4 color = texture2D(uImage, x) * kernel[1][1]',
    '        + texture2D(uImage, x + dx * vec2( 0., -1.)) * kernel[1][0]',
    '        + texture2D(uImage, x + dx * vec2( 0., +1.)) * kernel[1][2]',
    '        + texture2D(uImage, x + dx * vec2(-1.,  0.)) * kernel[0][1]',
    '        + texture2D(uImage, x + dx * vec2(+1.,  0.)) * kernel[2][1]',
    '        + texture2D(uImage, x + dx * vec2(-1., -1.)) * kernel[0][0]',
    '        + texture2D(uImage, x + dx * vec2(-1., +1.)) * kernel[0][2]',
    '        + texture2D(uImage, x + dx * vec2(+1., -1.)) * kernel[2][0]',
    '        + texture2D(uImage, x + dx * vec2(+1., +1.)) * kernel[2][2];',
    '   gl_FragColor = vec4(color.rgb, 1.0);',
    '}'
].join('\n'));

/** Convolution by a 3x1 kernel.
 *
 *  Effect parameters:
 *
 *  * `vec3 kernel`: the convolution kernel.
 *  * `vec2 direction`: the axis of convolution.<br/>
 *      For instance, (1,0) is a horizontal convolution.
 *
 * @type {GLEffect} */
GLEffect.Sample.conv3x1 = new GLEffect(GLEffect.sourceCodeHeader + [
    'uniform vec3 kernel;     // convolution kernel',
    'uniform vec2 direction;  // axis of the convolution',
    '',
    'void main(void) {',
    '    vec2 dx = uPixel * direction;',
    '    vec4 color = texture2D(uImage, vPosition) * kernel[1]',
    '        + texture2D(uImage, vPosition - dx) * kernel[0]',
    '        + texture2D(uImage, vPosition + dx) * kernel[2];',
    '   gl_FragColor = vec4(color.rgb, 1.0);',
    '}'
].join('\n'));


/** Sample reductions. @singleton @class GLReduction.Sample */
GLReduction.Sample = {};

/** Sum of all the RGBA values. */
GLReduction.Sample.sum = GLReduction.fromFunctions(
    function (a, b) { return a + b; },
    'vec4 function(vec4 a, vec4 b) { return a + b; }'
);

/** Minimum R/G/B/A values. */
GLReduction.Sample.min = GLReduction.fromFunctions(
    Math.min,
    'vec4 function(vec4 a, vec4 b) { return min(a, b); }'
);

/** Maximum R/G/B/A values. */
GLReduction.Sample.max = GLReduction.fromFunctions(
    Math.max,
    'vec4 function(vec4 a, vec4 b) { return max(a, b); }'
);

