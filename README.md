JSM
===

# The JavaScript Matrix Library

This library intends to provide an easy way to deal with nd-array. This implementation has many advantages since
* it use typed array for fast computation and controled memory comsumption ;
* parameters consistency is well checked ;
* design allows it to work with real as well as complex values ;
* it is easy to use thanks to the object notation.

Many modules are developed 
* for nd-array manipulation including value selection and modifications ;
* for arithmetic and boolean operation ;
* for linear algebra ;
* for image processing, such as filtering, FFT, image matching ;
* for statistical processing ; ...

A list of supported functions (not necessarily up to date) may be found [here](http://etsitpab.github.io/JSM/#!/guide/functions). A brief introduction is available [here](https://github.com/Etsitpab/JSM/blob/master/doc/guides/getting_started/README.md).

The inspiration is the well known [Matlab][1] software though there are some differences in the syntax we used. 

[1]:http://www.mathworks.fr/products/matlab/

# [Documentation](http://etsitpab.github.io/JSM/) and demos
The documentation can be consulted [here](http://etsitpab.github.io/JSM/). The code is documented using [jsduck](https://github.com/senchalabs/jsduck). Once it is installed just use the command `make doc`
If you experience problem, be sure that you installed the ruby1.9-dev (or more recent) package and check this [page](https://github.com/senchalabs/jsduck/wiki/Installation).

Here is the link to some demos that have been realized with this project:
- [Image editor](http://etsitpab.github.io/JSM/JSM/examples/colorspaces/colorspaces.html) (Beta version)
- [Estimation of illuminants from projections on the planckian locus](http://etsitpab.github.io/JSM/JSM/examples/ppl/ppl.html) (Beta version)
- [Plot editor](http://etsitpab.github.io/JSM/JSM/examples/plot/plot-editor.html) (Beta version)
- [Game of life](http://etsitpab.github.io/JSM/JSM/examples/gameoflife/gameoflife.html) (Beta version)
- [Keypoint detector](http://etsitpab.github.io/JSM/JSM/examples/keypoints/keypoints.html) (Beta version)
- [Color constancy basic algorithms](http://etsitpab.github.io/JSM/JSM/examples/colorconstancy/colorconstancy.html) (Beta version)
- [Image matching with local descriptors](http://etsitpab.github.io/JSM/JSM/examples/sift/sift.html) (Alpha version)
- [A contrario histogram modes detection](http://etsitpab.github.io/JSM/JSM/examples/modes/modes.html) (Alpha version)



# How to compile and test it

## Compilation

In order to regenerate the modules from the sources, you simply need to use the command `make` (Unix system).
To minify the modules and the projects, you have to install [uglifyjs](https://github.com/mishoo/UglifyJS2). Once it's done, just enter `make minify`.

## Test

To test it, just download the modules that you need, they are located in the `./modules/` directory. 
The core module is `JSM.js` and it is the concatenation of the `Matrix.js`, `Matrix.js` and `Tools.js` modules. The other modules such that `Plot.js` and `Matching.js` are independent.
In the directory `./min/` you can find the minified version of the modules.

## Nodejs and npm

There is not yet a specific package that can be install with `npm` but the modules `JSM.js` and `JSM.min.js` can be imported in nodejs script by using one of these instruction :
- `var JSM = require('./<path to the modules>/module/JSM.js');` ;
- `var JSM = require('./<path to the modules minified>/min/JSM.min.js');`.

To be able to read and write images you have to install npm canvas package. To this end, ensure that the following packages are installed (on Ubuntu/Debian) :
- node-legacy
- libcairo2-dev
- libgif-dev
- libjpeg8-dev / libjpeg9-dev

Also, do not forget to add the path to nodejs modules, it should look like that : 
    `export NODE_PATH="/usr/local/lib/node_modules"`


# Why develop a JavaScript library for numerical computing   ?

Many reasons can justify this. First, JavaScript is fun. It's easy too use and it has very powerful features (closures, prototype, ...).
Also, put it together with HTML and CSS and you have a perfect team to build great and very efficient UIs.
For research purpose, it allows to make online demonstrations which can be used directly in the browser. 

More and more web applications request to deal with numerical data, and we do not found a library providing a complete and robust JavaScript framework to do it.

# Other JavaScript libraries for numerical computation

Here comes a list made of JS library that we found interesting.
This list does not pretend to exhaustive and if you would like to see a link to your website added here please send an email.

- [mathjs](http://mathjs.org/)
- [jStat](https://github.com/jstat/jstat)
- [jsmat](https://github.com/ghewgill/jsmat)
- [JSNum](https://github.com/kms15/jsnum)
- [Numeric JavaScript](http://numericjs.com/numeric/documentation.html)
- [Sylvester](http://sylvester.jcoglan.com/)
- [jsfeat](http://inspirit.github.io/jsfeat/)

# Content of the JSM project

    ./
    +- doc/
    |   +  jsduck.json              - doc. configuration file
    |   +  guides.json              - tutorials configuration file
    |   +- html/                    - generated documentation (HTML format)
    |   |   +  index.html           - main page of the documentation
    |   +- content/                 - doc. content (raw)
    |   |   +  readme.md            - content of the doc. main page
    |   +- tag/                     - custom tags definitions
    +- examples/                    - examples of use of the Matrix class
    +- modules/                     - modules grouping files together
    |   +  JSM.js                   - standalone source file, containing all the JS code for the Matrix class
    |   +  <files>.js               - others modules/projects minified
    +- min/                         - minify versions of the Matrix class and related
    |   +  JSM.min.js               - standalone source file, containing all the JS code for the Matrix class
    |   +  <files>.min.js           - other module projects files minified
    +- projects/                    - projects making use of the Matrix class
    +- src/                         - source files
    |   +- Matrix                   - Matrix JavaScript class, split into several files
    |   +- MatrixView               - MatrixView JavaScript class, split into several files
    |   +- Tools                    - Tools JavaScript object, split into several files
    |   +- <modules>                - Other modules
    +- third/                       - used to store third part projects
    + licence.txt                   - short licence description, included in JS files
    + Makefile                      - Makefile used to generate documentation, minified files and lint
