# A short presentation of the project: the Matrix class

This class intends to provide an easy way to deal with nd-array.
The Matrix name is in fact a bit simplistic since it refers to 2d array only while here a Matrix object is an nd-array.
It intends to provide tools to deal with numerical data.
The inspiration is the well known [Matlab][1] software though there are some differences in the syntax we used. 

[1]:http://www.mathworks.fr/products/matlab/

# Why develop a JavaScript numerical computing library  ?

Many reasons can justify this. First, JavaScript is fun. It's easy too use and it has very powerful features (closures, prototype, ...).
Also, put it together with HTML and CSS and you have a perfect team to build great and very efficient UIs.
For research purpose, it allows to make online demonstrations which can be used directly in the browser. 

More and more web applications request to deal with numerical data, and we do not found a library providing a complete and robust JavaScript framework to do it.

# Other JavaScript libraries for numerical computation

Here comes a list made of JS library that we found interesting.
This list does not pretend to exhaustive and if you would like to see a link to your website added here please send an email.

- [jStat](https://github.com/jstat/jstat)
- [jsmat](https://github.com/ghewgill/jsmat)
- [JSNum](https://github.com/kms15/jsnum)
- [Numeric JavaScript](http://numericjs.com/numeric/documentation.html)
- [Sylvester](http://sylvester.jcoglan.com/)
- [jsfeat](http://inspirit.github.io/jsfeat/)

# Content of the JSM project

    ./
    +- doc/
    |   +  Makefile                 - generate the documentation
    |   +  jsduck.json              - doc. configuration file
    |   +  guides.json              - tutorials configuration file
    |   +- html/                    - generated documentation (HTML format)
    |   |   +  index.html           - main page of the documentation
    |   +- content/                 - doc. content (raw)
    |   |   +  readme.md            - content of the doc. main page
    |   |   +  categories.json      - sort documented JS classes into categories
    |   +- tag/                     - custom tags definitions
    +- examples/                    - examples of use of the Matrix class
    +- min/                         - minify versions of the Matrix class and related
    |   +  matrix.js                - standalone source file, containing all the JS code for the Matrix class
    |   +  matrix_min.js            - same as matrix.js but minified
    |   +  <files>_min.js           - projects files minified
    +- projects/                    - projects making use of the Matrix class
    +- src/                         - source files
    |   +- Matrix                   - Matrix JavaScript class, split into several files
    |   +- MatrixView               - MatrixView JavaScript class, split into several files
    |   +- Tools                    - Tools JavaScript object, split into several files
    +- third/                       - used to store third part projects
    + licence.txt                   - short licence description, included in JS files
    + Makefile                      - Makefile used to generate documentation, minified files and lint
