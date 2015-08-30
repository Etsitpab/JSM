window.onload = function () {
    return;
    var canvas = createCanvas([800, 800], 'test');
    var canvas2 = createCanvas([800, 800], 'test2');
    console.log(canvas);
    var src = '/home/mazin/Images/photos suite/P1100879.JPG';
    var im = new Image();
    im.src = src;
    im.onload = function () {
        Tools.tic();
        var effect = GLEffect.fromFunction(
            [
                'uniform vec4 weights;',
                'vec4 function(vec4 color) {',
                '    float gray = dot(color, weights);',
                '    return vec4(vec3(gray), 1.0);',
                '}'
            ].join('\n'),
            {
                'weights': [0.0, 1.0, 0.0, 0.0]
            }
        );

        var canvas = document.createElement('canvas');
        canvas.style.transform = 'scale(1, -1)';
        var context = canvas.getContext('webgl')
        window.ctx = context;

        var srcCodeVertex =  [
            'attribute vec2 aVertexPosition;',
            'attribute vec2 aTexturePosition;',
            '',
            'varying vec2 vPosition;',
            '',
            'void main(void) {',                 
            '    vPosition = aTexturePosition;',
            '    vec2 finalPosition = 2.0 * aVertexPosition - 1.0;',
            '    gl_Position = vec4(finalPosition, 0.0, 1.0);',
            '}'
        ].join("\n");
        
        var vertexShader = context.createShader(context.VERTEX_SHADER);
        context.shaderSource(vertexShader, srcCodeVertex);
        context.compileShader(vertexShader);
        if (!context.getShaderParameter(vertexShader, context.COMPILE_STATUS)) {
            var error = new Error('Compilation Error.\n' + context.getShaderInfoLog(vertexShader));
            error.sourceCode = srcCodeVertex;
            throw error;
        }
        
        var srcCodeFragment =  [
            'precision mediump float; ',
            'varying vec2 vPosition;    // Curent pixel position (in 0..1)',
            '',
            'uniform vec2 uPixel;       // Pixel size (in 0..1)',
            'uniform ivec2 uSize;       // Image size (in pixels)',
            'uniform sampler2D uImage;  // Input image', 
            '',
            'vec4 function(vec4);  // User function prototype',
            '',
            'void main(void) {',
            '    /* Call the user function on the current pixel */',
            '    vec4 color = function(',
            '        texture2D(uImage, vPosition)',
            '    );',
            '    gl_FragColor = color;  // Output color',
            '}',
            '',
            '/* User function */',
            'uniform vec4 weights;',
            'vec4 function(vec4 color) {',
            '    float gray = dot(color, weights);',
            '    return vec4(vec3(gray), 1.0);',
            '}'
        ].join("\n");
        console.log(srcCodeVertex, "\n", srcCodeFragment);
        
        var fragmentShader = context.createShader(context.FRAGMENT_SHADER);
        context.shaderSource(fragmentShader, srcCodeFragment);
        context.compileShader(fragmentShader);
        if (!context.getShaderParameter(fragmentShader, context.COMPILE_STATUS)) {
            var error = new Error('Compilation Error.\n' + context.getShaderInfoLog(fragmentShader));
            error.sourceCode = srcCodeFragment;
            throw error;
        }

        var program = context.createProgram();
        context.attachShader(program, vertexShader);
        context.attachShader(program, fragmentShader);
        context.linkProgram(program);
        if (!context.getProgramParameter(program, context.LINK_STATUS)) {
            throw new Error('Link Error: could not link shaders.');
        }

        context.useProgram(program);
        context.disable(context.DEPTH_TEST);
        context.clearColor(0.0, 0.0, 0.0, 1.0);
        context.viewport(0, 0, output.width, output.height);

        
        var image = new GLImage();
        image = effect.run(this, image);
        console.log(Tools.toc());
        image.toCanvas($('test'));
        /*
        Matrix.imread(output, function () {
            this.imshow(canvas, 'fit');
            console.log(Tools.toc());
        });*/
    };
};

window.onload = function () {
    console.log("toto");
    function example1() { 
        Tools.tic();
        var canvas = createCanvas([500, 500], 'test');
        var gl = $(canvas).getContext('webgl');
        gl.clearColor(0,0,1.0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        console.log(Tools.toc());
    }
    function example2() {
        function createShader(str, type) {
	    var shader = gl.createShader(type);
	    gl.shaderSource(shader, str);
	    gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
	        throw gl.getShaderInfoLog(shader);
            }
	    return shader;
        }
        function createProgram(vstr, fstr) {
	    var program = gl.createProgram();
	    var vshader = createShader(vstr, gl.VERTEX_SHADER);
	    var fshader = createShader(fstr, gl.FRAGMENT_SHADER);
	    gl.attachShader(program, vshader);
	    gl.attachShader(program, fshader);
	    gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
	        throw gl.getProgramInfoLog(program);
            }
	    return program;
        }
        Tools.tic();
        var canvas = createCanvas([500, 500], 'test');
        var gl = $(canvas).getContext('webgl');
        var vertexPosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
        console.log(gl.ARRAY_BUFFER);
        var vertices = [
           -0.5, -0.5,
           -0.5,  0.5,
            0.5, -0.5,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        var vs = 'attribute vec2 pos;' +
	        'void main() { gl_Position = vec4(pos, 0, 1); }';
        var fs = 'precision mediump float;' +
	        'void main() { gl_FragColor = vec4(1.0,0.8,0,1); }';
        var program = createProgram(vs, fs);
        gl.useProgram(program);
        program.vertexPosAttrib = gl.getAttribLocation(program, 'pos');
        gl.enableVertexAttribArray(program.vertexPosAttrib);
        gl.vertexAttribPointer(program.vertexPosAttrib, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        console.log(Tools.toc());
    }
    function example3() {
        function createShader(str, type) {
	    var shader = gl.createShader(type);
	    gl.shaderSource(shader, str);
	    gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
	        throw gl.getShaderInfoLog(shader);
            }
	    return shader;
        }
        function createProgram(vstr, fstr) {
	    var program = gl.createProgram();
	    var vshader = createShader(vstr, gl.VERTEX_SHADER);
	    var fshader = createShader(fstr, gl.FRAGMENT_SHADER);
	    gl.attachShader(program, vshader);
	    gl.attachShader(program, fshader);
	    gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
	        throw gl.getProgramInfoLog(program);
            }
	    return program;
        }
        Tools.tic();
        var canvas = createCanvas([500, 500], 'test');
        var gl = $(canvas).getContext('webgl');
        var offset = [1,1];

        var vertexPosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
        var vertices = [-1, -1, 1, -1, -1, 1, 1, 1]
        vertexPosBuffer.itemSize = 2;
        vertexPosBuffer.numItems = 4;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        var vs = [
            'attribute vec2 aVertexPosition;',
            'varying   vec2 vTexCoord;',
            'uniform   vec2 uOffset;',
            'void main() {',
	    '    vTexCoord   = aVertexPosition + uOffset;',
	    '    gl_Position = vec4(aVertexPosition, 0, 1);',
            '}'
        ].join("\n");
 
        var fs = [
            '#ifdef GL_FRAGMENT_PRECISION_HIGH',
	    '    precision highp float;',
            '#else',
	    '    precision mediump float;',
            '#endif',
            'precision mediump float;',
            'varying vec2 vTexCoord;',
            'void main() {',
            '	gl_FragColor = vec4(0, vTexCoord, 1);',
            '}'
        ].join("\n");
        
        var program = createProgram(vs, fs);
        gl.useProgram(program);
        gl.enableVertexAttribArray(program.vertexPosAttrib);

        program.vertexPosAttrib = gl.getAttribLocation(program, 'aVertexPosition');
        gl.vertexAttribPointer(
            program.vertexPosAttrib, vertexPosBuffer.itemSize, gl.FLOAT, false, 0, 0
        );

        program.offsetUniform = gl.getUniformLocation(program, 'uOffset');
        gl.uniform2f(program.offsetUniform, offset[0], offset[1]);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPosBuffer.numItems);

        console.log(Tools.toc());
    }
    example3();
};
