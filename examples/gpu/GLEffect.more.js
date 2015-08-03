/*global GLEffect, GLReduction */


/** Sample effects. @singleton @class GLEffect.Sample */
GLEffect.Sample = {};

/** Identity effect (using the raw source code).  @return {GLEffect} */
GLEffect.Sample.identity_main = function () {
    'use strict';
    return new GLEffect();
};

/** Identity effect (using the RGB function form).  @return {GLEffect} */
GLEffect.Sample.identity_RGB = function () {
    'use strict';
    return GLEffect.fromFunction(
        [
            'vec3 function(vec3 color) {',
            '    return color;',
            '}'
        ].join('\n')
    );
};

/** Identity effect (using the RGBA function form).  @return {GLEffect} */
GLEffect.Sample.identity_RGBA = function () {
    'use strict';
    return GLEffect.fromFunction(
        [
            'vec4 function(vec4 color) {',
            '    return color;',
            '}'
        ].join('\n')
    );
};

/** Pixel-wise absolute value.  @return {GLEffect} */
GLEffect.Sample.abs = function () {
    'use strict';
    return GLEffect.fromFunction(
        [
            'vec3 function(vec3 color) {',
            '    return abs(color);',
            '}'
        ].join('\n')
    );
};

/** Conversion to gray-level images.
 * @param {Float[4]} [weight]
 *  Weights of the RGBA channels.
 * @return {GLEffect} */
GLEffect.Sample.gray = function (weights) {
    'use strict';
    return GLEffect.fromFunction(
        [
            'uniform vec4 weights;',
            'vec4 function(vec4 color) {',
            '    float gray = dot(color, weights);',
            '    return vec4(vec3(gray), 1.0);',
            '}'
        ].join('\n'),
        {
            'weights': weights || [0.3, 0.6, 0.1, 0.0]
        }
    );
};

/** Convolution by a 3x3 kernel.
 * @param {Float[9]} [kernel]
 *  The convolution kernel.
 * @return {GLEffect} */
GLEffect.Sample.conv3x3 = function (kernel) {
    'use strict';
    return new GLEffect(
        GLEffect.sourceCodeHeader + [
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
        ].join('\n'),
        {
            'kernel': kernel || [0, 0, 0, 0, 1, 0, 0, 0, 0]
        }
    );
};

/** Convolution by a 3x1 kernel.
 * @param {Float[2] || String} [direction = 'E']
 *  The axis of convolution.<br/>
 *  Possible strings are: E, SE, S, SO, O, NO, N, NE.
 * @param {Float[3]} [kernel]
 *  The convolution kernel.
 * @return {GLEffect} */
GLEffect.Sample.conv3x1 = function (kernel, direction) {
    'use strict';
    var dir = {
        E: [1, 0],
        SE: [1, 1],
        S: [0, 1],
        SO: [-1, 1],
        O: [-1, 0],
        NO: [-1, -1],
        N: [0, -1],
        NE: [1, -1]
    };
    if (typeof direction === 'string') {
        direction = dir[direction.toUpperCase()];
        if (!direction) {
            throw new Error('Invalid argument: unknown direction ' + direction);
        }
    }
    return new GLEffect(
        GLEffect.sourceCodeHeader + [
            'uniform vec2 direction;  // axis of the convolution',
            'uniform vec3 kernel;     // convolution kernel',
            '',
            'void main(void) {',
            '    vec2 dx = uPixel * direction;',
            '    vec4 color = texture2D(uImage, vPosition) * kernel[1]',
            '        + texture2D(uImage, vPosition - dx) * kernel[0]',
            '        + texture2D(uImage, vPosition + dx) * kernel[2];',
            '   gl_FragColor = vec4(color.rgb, 1.0);',
            '}'
        ].join('\n'),
        {
            'direction': direction || [1, 0],
            'kernel': kernel || [0, 1, 0]
        }
    );
};

// TODO: generic size convolution
/*
GLEffect.Sample.conv1d = new GLEffect(
    GLEffect.sourceCodeHeader + [
        'uniform float kernel[9];  // convolution kernel',
        'uniform vec2 direction;   // axis of the convolution',
        '',
        'void main(void) {',
        '    vec2 dx = uPixel * direction;',
        '    vec4 color = texture2D(uImage, vPosition) * kernel[4]',
        '        + texture2D(uImage, vPosition - 4. * dx) * kernel[0]',
        '        + texture2D(uImage, vPosition - 3. * dx) * kernel[1]',
        '        + texture2D(uImage, vPosition - 2. * dx) * kernel[2]',
        '        + texture2D(uImage, vPosition - dx) * kernel[3]',
        '        + texture2D(uImage, vPosition + dx) * kernel[5]',
        '        + texture2D(uImage, vPosition + 2. * dx) * kernel[6]',
        '        + texture2D(uImage, vPosition + 3. * dx) * kernel[7]',
        '        + texture2D(uImage, vPosition + 4. * dx) * kernel[8];',
        '   gl_FragColor = vec4(color.rgb, 1.0);',
        '}'
    ].join('\n'),
    {
        'kernel': [0, 0, 0, 0, 1, 0, 0, 0, 0],
        'direction': [1, 0]
    }
);
*/


/** Sample reductions. @singleton @class GLReduction.Sample */
GLReduction.Sample = {};

/** Sum of all the RGBA values.  @return {GLReduction} */
GLReduction.Sample.sum = function () {
    'use strict';
    return GLReduction.fromFunctions(
        function (a, b) { return a + b; },
        'vec4 function(vec4 a, vec4 b) { return a + b; }'
    );
};

/** Minimum R/G/B/A values.  @return {GLReduction} */
GLReduction.Sample.min = function () {
    'use strict';
    return GLReduction.fromFunctions(
        Math.min,
        'vec4 function(vec4 a, vec4 b) { return min(a, b); }'
    );
};

/** Maximum R/G/B/A values.  @return {GLReduction} */
GLReduction.Sample.max = function () {
    'use strict';
    return GLReduction.fromFunctions(
        Math.max,
        'vec4 function(vec4 a, vec4 b) { return max(a, b); }'
    );
};
