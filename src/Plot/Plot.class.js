/*global console, Tools, HTMLElement, document, Vector, Image, Tree2d, HTMLImageElement*/

// Bugs:    - Histogrammes ne fonctionnent pas avec des valeurs négatives
//          - legend quand stroke est donné par default
//
// To do:   - verifier les arguments des fonctions, throw Error si invalides
//          - doc
//          - curseur en croix sur tout le graphe
//          - events à creer :
//               - 'changeaxis' pour pouvoir asservir plusieurs plot à
//                 une vue donnée.
//               - 'addcurve' lorsqu'une courbe est ajoutée
//               - 'removecurve' lorsqu'une courbe est supprimée
//               - 'resize' lorsque le plot est redimensionné.
//               - 'onselect' lorsque une courbe est selectionnée, texte en
//                  rouge dans la légende.

/*
 * @fileOverview Plot class and base function.
 * @author <a href="mailto:gtartavel@gmail.com">Guillaume Tartavel</a>
 * @author <a href="mailto:baptiste.mazin@gmail.com">Baptiste Mazin</a>
 */

var global = typeof window === 'undefined' ? module.exports : window;

(function (global) {
    'use strict';


    ////////////////////////////////////////////////////////////////////////////
    //                               CONSTRUCTOR                              //
    ////////////////////////////////////////////////////////////////////////////


    /**
     * @class
     *  Create a new plot.
     * @constructor
     *  Plot is a JavaScript class allowing user to dynamically generating chart
     *  SVG chart.
     *
     *     // Create a new Plot
     *     var myPlot = new Plot('myPlot', 400, 400)
     *     // Insert plot into web page
     *     document.body.appendChild (myPlot.getDrawing ());
     *     // Add an Histogram
     *     var histogramProperties = {
     *        'id': 'myHistogram',
     *        'fill': 'lightseagreen',
     *        'stroke': 'lightslategray',
     *        'stroke-width': 4,
     *        'rx': 0.1,
     *        'ry': 0.1
     *     };
     *     myPlot.addHistogram([1,2,3,4,5], [4,6,7,1,5], histogramProperties);
     *     // Add a new Path
     *     var pathProperties = {
     *        'id': 'myPath',
     *        'stroke': 'green',
     *        'stroke-width': 2,
     *        'stroke-dasharray': '5 2'
     *     };
     *     myPlot.addPath([1, 2, 3, 4, 5],
     *                    [7, 4, 5, 8, 2],
     *                    pathProperties);
     *     // Add a new scatter plot
     *     var scatterProperties = {
     *        'id': 'myScatter',
     *        'stroke': 'blue',
     *        'marker': {'shape': 'circle',
     *                   'fill': 'white',
     *                   'stroke-width': 0.5,
     *                   'stroke': 'red',
     *                   'size': 3
     *                  }
     *     };
     *     myPlot.addPath([1, 2, 3, 4, 5],
     *                     [3, 2, 2, 7, 1],
     *                     scatterProperties);
     *     myPlot.setTitle('My plot !');
     *
     * @param {String} id
     *  Plot identifiant.
     * @param {Number} width
     *  Plot width.
     * @param {Number} height
     *  Plot height
     * @param {Object} args
     *  Plot arguments
     * @return {Object}
     *  The new plot.
     *
     */
    function Plot(id, size, parent, args) {
        id = id || 'plot 1';
        var width, height;
        if (typeof size === Number) {
            width = size;
            height = size;
        } else if (size instanceof Array && size.length === 2) {
            width = size[0];
            height = size[1];
        }
        if (parent) {
            if (!(parent instanceof HTMLElement)) {
                parent = document.getElementById(parent);
                parent = parent || document.body;
            }
            var THIS = this;
            if (!size) {
                var resize = function () {
                    THIS.setWidth(parent.clientWidth);
                    THIS.setHeight(parent.clientHeight);
                    THIS.autoDisplay();
                };
                window.addEventListener("resize", resize);
                width = parent.clientWidth;
                height = parent.clientHeight;
            }
        }
        args = args || {};

        var param = {
            'width': width,
	    'height': height,
	    'id': id
        };
        var drawing = Tools.createSVGNode('svg', param);
        // Allow to retrieve plot from SVG element;
        drawing.getPlot = function () {
            return this;
        }.bind(this);

        /** Returns parent node if defined.
         * @return {Object}
         */
        this.getParentNode = function () {
            return parent;
        };

        /** Returns the plot id.
         * @return {String}
         */
        this.getId = function () {
            return id;
        };

        /** Returns the width of the plot.
         * @return {Number}
         */
        this.getWidth = function () {
            return parseFloat(drawing.getAttribute('width'));
        };

        /** Set the width of the plot.
         * @param {Number} w
         * @chainable
         */
        this.setWidth = function (w) {
            drawing.setAttributeNS(null, 'width', w);
            this.autoDisplay();
            return this;
        };

        /** Returns the width of the plot.
         * @return {Number}
         */
        this.getHeight = function () {
            return parseFloat(drawing.getAttribute('height'));
        };

        /** Set the width of the plot.
         * @param {Number} w
         * @chainable
         */
        this.setHeight = function (h) {
            drawing.setAttributeNS(null, 'height', h);
            this.autoDisplay();
            return this;
        };

        /** Returns the svg element associeted to the plot.
         * @return {Object}
         */
        this.getDrawing = function () {
            return drawing;
        };

        var currentAxis = {'x': 0, 'y': 0, 'width': 1, 'height': 1};

        /** Returns the current axisof the plot.
         * @return {Object}
         *  Object with the following properties :
         *
         * + x,
         * + y,
         * + width,
         * + height.
         */
        this.getCurrentAxis = function () {
            var i, propOut = {};
            for (i in currentAxis) {
                if (currentAxis.hasOwnProperty(i)) {
                    propOut[i] = currentAxis[i];
                }
            }
            return propOut;
        };

        /** Set the current axis of the plot.
         * @param {Object} BBox
         *  Object with the following properties :
         *
         * + x,
         * + y,
         * + width,
         * + height.
         *
         * @chainable
         */
        this.setCurrentAxis = function (BBox) {
            currentAxis.x = BBox.x;
            currentAxis.y = BBox.y;
            currentAxis.width = BBox.width;
            currentAxis.height = BBox.height;
            return this;
        };

        // Plot specific properties
        var ownProperties = this.getProperties('ownProperties');

        /** Get a property of the plot.
         * @param {String} name
         * @return {String}
         */
        this.getOwnProperty = function (name) {
            return ownProperties[name];
        };
        /** Set a property of the plot.
         * @param {String} name
         * @param {String} value
         * @chainable
         */
        this.setOwnProperty = function (name, value) {
            ownProperties[name] = value;
            this.autoDisplay();
            return this;
        };

        var i;
        for (i in args) {
            if (args.hasOwnProperty(i)) {
                ownProperties[i] = args[i];
            }
        }

        // Init svg element
        this.initialize();
        return this;
    }

    /////////////////////////////////////////////////////////////////////////////////
    //                              DEFAULT PROPERTIES                             //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * Object describing defaults properties of plot's elements.
     */
    Plot.prototype.properties = {
        'ownProperties' : {
            // Force to conserve x/y = 1
            'preserve-ratio': false,
            // Display ticks.
            'ticks-display': true,
            // Display Title.
            'title-display': false,
            // Display x label.
            'xLabel-display': false,
            // Display y label.
            'yLabel-display': false,
            // Display Legend.
            'legend-display': 'none',
            // Below are private properties
            // Create a tree for efficient nearest neighbor.
            'compute-closest': true,
            // Used for curves auto-id
            'autoId-curves': 0,
            // Used for marker auto-id
            'autoId-marker': 0
        },
        'title': {
            'id': 'title',
            'font-size': '16pt',
            'font-family': 'Sans-Serif',
            'fill': 'gray',
            'style': 'text-anchor: middle;'
        },
        'drawingArea': {
            'id': 'drawingArea',
            'preserveAspectRatio': 'none'
        },
        'front': {
            'id': 'front',
            'fill': 'white',
            'fill-opacity': 0,
            'stroke': 'none',
            'preserveAspectRatio': 'none'
        },
        'markers': {
            'id': 'markers'
        },
        'curves': {
            'id': 'curves',
            'preserveAspectRatio': 'none',
            'stroke-width': 1,
            'stroke-linejoin': 'round',
            'stroke': 'blue',
            'fill': 'blue'
        },
        'axis': {
            'id': 'axis',
            'stroke': 'grey',
            'stroke-width': 1,
            'font-size': '10pt',
            'font-family': 'Sans-Serif'
        },
        'grid': {
            'id': 'grid',
            'stroke': 'grey',
            'stroke-width': 1,
            'stroke-dasharray': '5 2'
        },
        'xAxis': {
            'id': 'xAxis',
            'style': 'text-anchor: middle;'
        },
        'yAxis': {
            'id': 'yAxis',
            'style': 'text-anchor: end;'
        },
        'xAxisLine': {
            'id': 'xAxisLine',
            'marker-mid': 'url(#tickMarker)'
        },
        'xAxisLineBis': {
            'id': 'xAxisLineBis',
            'marker-mid': 'url(#tickMarker)'
        },
        'yAxisLine': {
            'id': 'yAxisLine',
            'marker-mid': 'url(#tickMarker)'
        },
        'yAxisLineBis': {
            'id': 'yAxisLineBis',
            'marker-mid': 'url(#tickMarker)'
        },
        'cursor': {
            'id': 'cursor',
            'vector-effect': 'non-scaling-stroke',
            'marker': {
                'shape': 'circle',
                'size': 4,
                'stroke': 'grey',
                'stroke-width': 0.25,
                'fill': 'none'
            }
        },
        'xLabel': {
            'id': 'xLabel',
            'font-size': '12pt',
            'font-family': 'Sans-Serif',
            'font-style': 'oblique',
            'fill': 'gray',
            'style': 'text-anchor: middle;'
        },
        'yLabel': {
            'id': 'yLabel',
            'font-size': '12pt',
            'font-family': 'Sans-Serif',
            'font-style': 'oblique',
            'fill': 'gray',
            'style': 'text-anchor: middle;'
        },
        'ticks': {
            'id': 'tickMarker',
            'x1': 0,
            'y1': -2,
            'x2': 0,
            'y2': 2,
            'markerUnits': 'strokeWidth', //userSpaceOnUse',
            'overflow': 'visible',
            'orient': 'auto',
            'stroke-width': 1
        },
        'xTextTicks': {
            'id': 'xTextTicks',
            'fill': 'gray',
            'stroke': 'none'
        },
        'yTextTicks': {
            'id': 'yTextTicks',
            'fill': 'gray',
            'stroke': 'none'
        },
        'textTicks': {
            'fill': 'gray',
            'stroke': 'none'
        },
        'legend': {
            'id': 'legend',
            'font-size': '10pt',
            'font-family': 'Sans-Serif',
            'overflow': 'visible',
            'fill': 'gray',
            'stroke': 'none'
        },
        'selectArea': {
            'id': 'selectArea',
            'stroke': 'gray',
            'fill': 'none',
            'stroke-width': 1,
            'vector-effect': 'non-scaling-stroke',
            'preserveAspectRatio': 'none',
            'markerUnits': 'userSpaceOnUse',
            'overflow': 'visible'
        },
        'path': {
            'vector-effect': 'non-scaling-stroke',
            'fill': 'none'
        },
        'marker': {
            'shape': 'none',
            'fill': 'blue',
            'size': 1,
            'viewBox': "-1 -1 2 2",
            'class': 'scatterMarker',
            'preserveAspectRatio': 'none',
            'markerUnits': 'userSpaceOnUse',
            'overflow': 'visible'
        },
        'histogram': {
            'stroke': 'none',
            'vector-effect': 'non-scaling-stroke',
            'stroke-linejoin': 'round',
            'bar-width': 0.9
        },
        'image': {
        }
    };

    /////////////////////////////////////////////////////////////////////////////////
    //                           CURVES MANAGEMENT FUNCTIONS                       //
    /////////////////////////////////////////////////////////////////////////////////


    /**
     * Add a path to plot.
     * @param {Array} x
     *  Array of values on 'x' axis.
     * @param {Array} y
     *  Array of values on 'y' axis.
     * @param {Object} [properties=this.getProperties('path')]
     *  Curve Id and style properties.
     * @return {Object}
     *  This plot.
     *
     *  // Create a new Plot
     *  var myPlot = new Plot ('myPlot', 300, 300)
     *  // Insert plot into web page
     *   document.body.appendChild (myPlot.getDrawing ());
     *  // Add a new Path
     *  var pathProperties = {
     *     'id': 'myPath',
     *     'stroke': 'green',
     *     'stroke-width': 2,
     *     'stroke-dasharray': '0.1 0.1',
     *     'marker': {'shape': 'rect'
     *                'fill': 'fuchsia'
     *                'size': 3
     *     }
     *  };
     *  myPlot.addPath ([1, 2, 3, 4, 5],
     *                  [7, 4, 5, 8, 2],
     *                  pathProperties);

     */
    Plot.prototype.addPath = function (x, y, args) {

        x = x instanceof Matrix ? x.getData() : x;
        y = y instanceof Matrix ? y.getData() : y;

        if (x.includes(NaN) || y.includes(NaN)) {
            throw new Error("Plot.addPath: Data must not contain NaN values.")
        }
        if (x.includes(Infinity) || y.includes(Infinity) || x.includes(-Infinity) || y.includes(-Infinity)) {
            throw new Error("Plot.addPath: Data must not contain Infinity values.")
        }

        // Add (or replace) user arguments
        var defaultArgs = this.getProperties('path');
        var i;
        for (i in args) {
            if (args.hasOwnProperty(i)) {
                defaultArgs[i] = args[i];
            }
        }

        // First Node in the path
        var newPath = this.createPath(x, y, defaultArgs);

        var xVec = new Tools.Vector(x);
        var yVec = new Tools.Vector(y);
        newPath.BBox = [xVec.min().get(0),
                        yVec.min().get(0),
                        xVec.max().get(0),
                        yVec.max().get(0)];

        // Add the to the path list
        this.add(newPath, x, y);
        return this;
    };

    /**
     * Plot functions
     */
    Plot.prototype.plot = function (y, x, str) {

        var errMsg = this.constructor.name + '.plot: ';
        var i, k;

        // Check arguments
        if (typeof y !== 'function') {
            if (x && !x.length) {
                throw new Error(errMsg + 'x must be an array');
            } else if (!(y && y.length)) {
                throw new Error(errMsg + 'y must be an array or a function');
            } else if (!(y[0].length)) {
                y = [y];
            }
        } else if (!(x && x.length)) {
            throw new Error(errMsg + 'if y is a function, x must be an array');
        } else {
            var f = y; // y is a function
            for (y = [[]], i = 0; i < x.length; i++) {
                y[0].push(f(x[i]));
            }
        }

        // Check dimensions
        var nLines = y.length;
        var nPts = y[0].length;
        if (!x) {
            for (x = [], i = 0; i < nPts; i++) {
                x.push(i + 1);
            }
        }
        for (k = 0; k < nLines; k++) {
            if (y[k].length !== x.length) {
                throw new Error(errMsg + 'y and x must have the same length');
            }
        }

        // Plot everything
        var args = Plot.stringToArgs(str);
        for (k = 0; k < nLines; k++) {
            this.addPath(x, y[k], args);
        }
        return this;
    };

    /**
     * Add an Histogram to plot.
     * @param {Array} x
     *  x values.
     * @param {Array} y
     *  y values.
     * @param {Object} [properties=this.getProperties ('scatter')]
     *  Scatter plot Id and style properties.
     *
     *  // Create a new Plot
     *  var myPlot = new Plot ('myPlot', 500, 500)
     *  // Add an Histogram
     *  var histogramProperties = {
     *     'id': 'myHistogram',
     *     'fill': 'lightseagreen',
     *     'stroke': 'lightslategray',
     *     'stroke-width': 4,
     *     'rx': 0.1,
     *     'ry': 0.1
     *  };
     *  myPlot.addHistogram([1,2,3,4,5], [4,6,7,1,5], histogramProperties);
     *  // Insert plot into web page
     *  document.body.appendChild (myPlot.getDrawing ());
     */
    Plot.prototype.addHistogram = function (x, y, args) {
        x = x instanceof Matrix ? x.getData() : x;
        y = y instanceof Matrix ? y.getData() : y;

        x = x || new Vector(1, y.length);

        // Add (or replace) user arguments
        var defaultArgs = this.getProperties('histogram');
        var i;
        for (i in args) {
            if (args.hasOwnProperty(i)) {
                defaultArgs[i] = args[i];
            }
        }

        // Create histogram plot
        var histogram = Tools.createSVGNode('g', defaultArgs);
        histogram.setAttributeNS(null, 'class', 'histogram');

        // Define bar model
        var id = 'bar' + defaultArgs.id;
        var xp = new Tools.Vector(x);
        var widthMin = xp.derive().min().get(0);
        var barWidth = widthMin * defaultArgs['bar-width'];

        var colormap = defaultArgs.colormap;

        var j;
        for (j = y.length - 1 ; j >= 0; j--) {
            var rect = Tools.createSVGNode('rect', defaultArgs);
            rect.setAttributeNS(null, 'r', 1);
            rect.setAttributeNS(null, 'id', id);
            rect.setAttributeNS(null, 'class', 'histogramBar');
            rect.setAttributeNS(null, 'x',  x[j] - barWidth / 2);
            rect.setAttributeNS(null, 'y', -y[j]);
            rect.setAttributeNS(null, 'height', y[j]);
            rect.setAttributeNS(null, 'width', barWidth);
            if (colormap) {
                var color = "hsl(" + (360 * j/(y.length - 1)) + ",100%,50%)";
                rect.setAttributeNS(null, 'fill', color);
            }
            histogram.appendChild(rect);
        }

        var xVec = new Tools.Vector(x);
        var yVec = new Tools.Vector(y);
        histogram.BBox = [xVec.min().get(0) - widthMin,
                          0,
                          xVec.max().get(0)  + widthMin,
                          yVec.max().get(0)];

        this.add(histogram, x, y);
        return this;
    };

    /**
     * Add an raster image to plot.
     * @param {string} source
     *  Path to the image
     * @param {number} x
     *  x coordinate of top left corner
     * @param {number} y
     *  y coordinate of top left corner
     *
     *  // Create a new Plot
     *  var myPlot = new Plot ('myPlot', 500, 500)
     *  // Conserve x/y unity ratio
     *  myPlot.setOwnProperty('preserve-ratio', true);
     *  // Add a new image
     *  myPlot.addImage('../ImageJS/images/canard.png', 300, 500, {'id': 'myImage'});
     *  // Insert plot into web page
     *  document.body.appendChild (myPlot.getDrawing ());
     */
    Plot.prototype.addImage = function (src, x, y, args) {
        x = x || 0;
        y = y || 0;
        var thisPlot = this;
        var onload = function () {
            var defaultArgs = thisPlot.getProperties('image');
            var i;
            for (i in args) {
                if (args.hasOwnProperty(i)) {
                    defaultArgs[i] = args[i];
                }
            }

            defaultArgs.width = this.width;
            defaultArgs.height = this.height;
            defaultArgs.x = x;
            defaultArgs.y = -y;

            var image = Tools.createSVGNode('image', defaultArgs);
            image.setAttributeNS('http://www.w3.org/1999/xlink',
			         'xlink:href', this.src);

            image.BBox = [x, -this.height + y, x + this.width, y];

	    // Add the to the path list
            thisPlot.add(image, x, y);
        };


        if (typeof src === 'string') {
            var im = new Image();
            im.src = src;
            im.onload = onload;
        } else if (src instanceof HTMLImageElement) {
            onload.bind(src)();
        }

        return this;
    };

    /**
     * @private
     *  Add svg element and scale the graph.
     * @param {Object} obj
     *  object to add.
     * @return {Object}
     *  This plot.
     */
    Plot.prototype.add = function (obj, x, y) {

        if (!obj.getAttribute('id')) {
            var n = this.getOwnProperty('autoId-curves');
            obj.setAttributeNS(null, 'id', 'curve-' + n);
            this.setOwnProperty('autoId-curves', n + 1);
        }

        this.getDrawing().getElementById('curves').appendChild(obj);
        this.setAxis();
        if (this.getOwnProperty('legend-display') !== 'none') {
            this.setLegend();
        }

        if (this.getOwnProperty('compute-closest')) {
            var i, tree = this.tree, end = x.length, id = obj.id;
            for (i = 0; i < end; i++) {
                tree.add(x[i], y[i], i, obj);
            }
        }
        return this;
    };

    /**
     * Remove element on plot.
     * @param {String} id
     *  ID of the element to remove.
     * @return {boolean}
     *  True if element is successfully removed, false otherwise.
     *
     *  // Add a new scatter plot
     *  var scatterProperties = {
     *     'id': 'myScatter',
     *  };
     *  myPlot.addScatter ([1, 2, 3, 4, 5],
     *                     [7, 4, 5, 8, 2],
     *                     scatterProperties);
     *  myPlot.remove ('myScatter')
     */
    Plot.prototype.remove = function (id) {

        var curves = this.getDrawing().getElementById('curves');
        var find = false;
        if (curves.hasChildNodes()) {
            var i;
            var curvesChilds = curves.childNodes;
            for (i = 0; i < curvesChilds.length; i++) {
                if (curvesChilds[i].id === id) {
                    if (this.getOwnProperty('compute-closest')) {
                        // Remove points in tree
                        this.tree.remove(curvesChilds[i]);
                    }
                    // Remove svg element
                    curves.removeChild(curvesChilds[i]);
                    find = true;
                    break;
                }
            }
        }
        this.setAxis();
        this.setLegend();
        return find;
    };

    /**
     * Clear the plot.
     *
     *  // Remove all data
     *  myPlot.clear();
     */
    Plot.prototype.clear = function () {

        if (this.getOwnProperty('compute-closest')) {
            this.tree.clear();
        }
        var curves = this.getDrawing().getElementById('curves');
        if (curves.hasChildNodes()) {
            while (curves.childNodes.length > 0) {
                curves.removeChild(curves.firstChild);
            }
        }
        this.setOwnProperty('autoId-curves', 0);
        this.setAxis();
        this.setLegend();
        return this;
    };

    /**
     * @private
     * Get defaults properties of an plot element.
     * @param {String} element
     *  Desired default properties element. Can be 'title',
     * 'drawingArea', 'curves', 'axis', 'textTicks', 'path', scatter'.
     * @return {Object}
     *  Object with copy of element properties.
     */
    Plot.prototype.getProperties = function (element) {

        var propOut = {};
        var p = Plot.prototype.properties[element];
        var i;
        for (i in p) {
            if (p.hasOwnProperty(i)) {
                propOut[i] = p[i];
            }
        }
        return propOut;
    };

    /**
     * @private
     * Create path.
     */
    Plot.prototype.createPath = function (x, y, args) {


        // First Node in the path
        var points = '';
        var j, L = x.length;
        for (j = 0; j < L; j++) {
            points += x[j] + ',' + (-y[j]) + ' ';
        }

        // Create Polyline
        var path = Tools.createSVGNode('polyline', args);
        path.setAttributeNS(null, 'class', 'path');

        // Add point list as attribute
        path.setAttributeNS(null, 'points', points);

        this.setMarkerPath(path, args.marker);

        return path;
    };

    /**
     * @private
     *  Create a markerfor a new path.
     */
    Plot.prototype.setMarkerPath = function (path, args) {

        var svg = this.getDrawing();
        var drawingArea = svg.getElementById('drawingArea');
        var markers = svg.getElementById('markers');
        var defaultArgs = this.getProperties('marker');
        var i;
        for (i in args) {
            if (args.hasOwnProperty(i)) {
                defaultArgs[i] = args[i];
            }
        }
        var idNumber = this.getOwnProperty('autoId-marker');
        this.setOwnProperty('autoId-marker', idNumber + 1);
        var id = this.getId() + 'marker_' + idNumber.toString();
        id = id.replace(/ /g, "_");
        defaultArgs.id = id;

        var marker = Tools.createSVGNode('marker', defaultArgs);
        markers.appendChild(marker);
        this.setMarkerShape(marker, defaultArgs.shape);

        path.setAttribute('marker-id', id);
        var markerUrl = 'url(#' + id + ')';
        path.setAttribute('marker-start', markerUrl);
        path.setAttribute('marker-mid', markerUrl);
        path.setAttribute('marker-end', markerUrl);
        return this;
    };

    /**
     * @private
     *  Set the marker base shape.
     *  Marker base sould be in following bounding box [-0.5, -0.5, 0.5, 0.5].
     */
    Plot.prototype.setMarkerShape = function (marker, shape) {

        var i;
        for (i = 0; i < marker.childNodes.length; i++) {
            marker.removeChild(marker.childNodes[i]);
        }

        var shapeProperties;
        var markerShape;
        switch (shape.toLowerCase()) {
        case 'rect':
        case 'rectangle':
            shapeProperties = {
                'x': -1,
                'y': -1,
                'width': 2,
                'height': 2
            };
            markerShape = Tools.createSVGNode('rect', shapeProperties);
            break;
        case 'circle':
            shapeProperties = {
                'r': 1
            };
            markerShape = Tools.createSVGNode('circle', shapeProperties);
            break;
        case 'triangle':
            shapeProperties = {
                'points': "1.5, 0 -0.5, 1 -0.75, -1",
                'viewBox': "-0.5 -0.866 1 0.866"
            };
            markerShape = Tools.createSVGNode('polygon', shapeProperties);
            break;
        case 'none':
            return this;
        default:
            throw new Error('Plot.setMarkerShape: Unknown shape.');
        }
        marker.appendChild(markerShape);
        return this;
    };

    /////////////////////////////////////////////////////////////////////////////////
    //                               AXIS FUNCTIONS                                //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * Define Axis.
     * @param {Array|Object|string} [box='auto']
     *  - If Array, box must be defined as '[x1,y1,x2,y2]'.
     *  - If Object, it must be specified as
     *  '{'x': x, 'y': -y, 'width': width, 'height': height}'
     *  - If string is used, then it must refer to an element id.
     * @return {Plot}
     *  This plot.
     *
     *  // Add a new scatter plot
     *  var scatterProperties = {
     *     'id': 'myScatter',
     *  };
     *  myPlot.addScatter ([1, 2, 3, 4, 5],
     *                     [7, 4, 5, 8, 2],
     *                     scatterProperties);
     *  // Set Axis with matlab like notations
     *  myPlot.setAxis ([-3, 2, 10, 10]);
     *  // Do the same
     *  myPlot.setAxis ({'x':-3, 'y':-2, 'width': 13, 'height': 12}]);
     *  // Automatic axis
     *  myPlot.setAxis ();
     */
    Plot.prototype.setAxis = function (curvesBBox) {
        var svg = this.getDrawing();
        var drawingArea = svg.getElementById('drawingArea');
        var curves = svg.getElementById('curves');
        var w = drawingArea.width.baseVal.value, h = drawingArea.height.baseVal.value;

        var BBox, xlim, ylim;
        // Matlab like command
        if (curvesBBox instanceof Array) {
            var x = Math.min(curvesBBox[0], curvesBBox[2]);
            var y = Math.min(-curvesBBox[1], -curvesBBox[3]);
            var width = Math.max(curvesBBox[0], curvesBBox[2]) - x;
            var height = Math.max(-curvesBBox[1], -curvesBBox[3]) - y;
            BBox = {'x': x, 'y': y, 'width': width, 'height': height};
            // Bounding box command
        } else if (curvesBBox instanceof Object) {
            BBox = curvesBBox;
            // Path bounding box
        } else if (typeof curvesBBox === 'string') {
            var i;
            var curvesChilds = curves.childNodes;
            for (i = 0; i < curvesChilds.length; i++) {
                if (curvesChilds[i].id === curvesBBox) {
                    this.setAxis(curvesChilds[i].BBox);
                    return this;
                }
            }
            // Automatic bounding box
        } else {
            BBox = this.getCurvesBBox();
        }

        if (this.getOwnProperty('preserve-ratio')) {
            // Compute the scale
            var hScale = BBox.width / w, vScale = BBox.height / h;
            var space;
            switch (Math.max(hScale, vScale)) {
            case hScale:
                space = BBox.height;
                BBox.height *= (hScale / vScale);
                BBox.y += (space - BBox.height) / 2;
                break;
            case vScale:
                space = BBox.width;
                BBox.width /= (hScale / vScale);
                BBox.x += (space - BBox.width) / 2;
                break;
            }
        }

        if (!BBox.width) {
            BBox.width = 1;
            BBox.x -= 0.5;
        }
        if (!BBox.height) {
            BBox.height = 1;
            BBox.y -= 0.5;
        }
        this.setCurrentAxis(BBox);
        var viewBox	= BBox.x + ' ' + BBox.y + ' ' + BBox.width + ' ' + BBox.height;
        drawingArea.setAttributeNS(null, 'viewBox', viewBox);

        this.scaleElements();
        // Update front
        var bg = svg.getElementById('front');
        bg.setAttributeNS(null, 'x', BBox.x);
        bg.setAttributeNS(null, 'y', BBox.y);
        bg.setAttributeNS(null, 'width', BBox.width);
        bg.setAttributeNS(null, 'height', BBox.height);

        this.setXAxis();
        this.setYAxis();
        this.setLegendLocation();
        return this;
    };

    /**
     * @private
     *  Create xAxis view.
     */
    Plot.prototype.setXAxis = function () {
        var svg = this.getDrawing();

        var xAxis = svg.getElementById('xAxis');
        var xAxisLine = svg.getElementById('xAxisLine');
        var xAxisLineBis = svg.getElementById('xAxisLineBis');

        var dArea = svg.getElementById('drawingArea');

        var BBoxCurves = this.getCurrentAxis();

        var BBox = {
            x: dArea.x.baseVal.value,
            y: dArea.y.baseVal.value,
            width: dArea.width.baseVal.value,
            height: dArea.height.baseVal.value
        };

        var xTextTicks = svg.getElementById('xTextTicks');
        while (xTextTicks.childNodes.length > 0) {
            xTextTicks.removeChild(xTextTicks.firstChild);
        }

        var i;
        var points = BBox.x + ',' + (BBox.y + BBox.height) + ' ';
        var pointsBis = BBox.x + ',' + BBox.y + ' ';
        if (this.getOwnProperty('ticks-display')) {
            var scale = BBox.width / BBoxCurves.width;
            var xLim = this.getAxisLimits(BBoxCurves.x, BBoxCurves.width, 2);
            var linspace = Tools.Vector.linearSpace;
            var ind = linspace(BBox.x + (xLim.min - BBoxCurves.x) * scale,
                               BBox.x + (xLim.min - BBoxCurves.x + (xLim.nTicks - 1) * xLim.dTick) * scale,
                               xLim.nTicks).data;

            for (i = 0; i < ind.length; i++) {
                points += ind[i] + ',' + (BBox.y + BBox.height) + ' ';
                pointsBis += ind[i] + ',' + BBox.y + ' ';
            }

            var exponent = xLim.e10;
            var tickText, textProp = this.getProperties('textTicks');
            textProp.y = BBox.y + BBox.height + 20;

            if (Math.abs(exponent) < 2) {
                exponent = 0;
            } else {
                textProp.x = BBox.x + BBox.width + 20;
                tickText = Tools.createSVGTextNode('10^' + exponent, textProp);
                tickText.setAttributeNS(null, 'font-weight', 'bold');
                xTextTicks.appendChild(tickText);
            }
            var val = linspace(xLim.min,
                               xLim.min + (xLim.nTicks - 1) * xLim.dTick,
                               xLim.nTicks).data;

            for (i = 0; i < ind.length; i++) {
                textProp.x = ind[i];
                val[i] = parseFloat((val[i] * Math.pow(10, -exponent)).toFixed(2));
                tickText = Tools.createSVGTextNode(val[i], textProp);
                xTextTicks.appendChild(tickText);
            }
        }
        points += (BBox.x + BBox.width) + ',' + (BBox.y + BBox.height) + ' ';
        xAxisLine.setAttributeNS(null, 'points', points);
        pointsBis += (BBox.x + BBox.width) + ',' + BBox.y + ' ';
        xAxisLineBis.setAttributeNS(null, 'points', pointsBis);
        return this;
    };

    /**
     * @private
     *  Create xAxis view.
     */
    Plot.prototype.setYAxis = function () {

        var svg = this.getDrawing();

        var yAxis = svg.getElementById('yAxis');
        var yAxisLine = svg.getElementById('yAxisLine');
        var yAxisLineBis = svg.getElementById('yAxisLineBis');

        var dArea = svg.getElementById('drawingArea');

        var BBoxCurves = this.getCurrentAxis();

        var BBox = {
            x: dArea.x.baseVal.value,
            y: dArea.y.baseVal.value,
            width: dArea.width.baseVal.value,
            height: dArea.height.baseVal.value
        };

        var yTextTicks = svg.getElementById('yTextTicks');
        while (yTextTicks.childNodes.length > 0) {
            yTextTicks.removeChild(yTextTicks.firstChild);
        }

        var i;
        var points = BBox.x + ',' + (BBox.y) + ' ';
        var pointsBis = (BBox.x + BBox.width) + ',' + (BBox.y) + ' ';
        if (this.getOwnProperty('ticks-display')) {
            var scale = BBox.height / BBoxCurves.height;
            var yLim = this.getAxisLimits(BBoxCurves.y, BBoxCurves.height, 2);
            var linspace = Tools.Vector.linearSpace;
            var ind = linspace(BBox.y + (yLim.min - BBoxCurves.y) * scale,
                               BBox.y + (yLim.min - BBoxCurves.y + (yLim.nTicks - 1) * yLim.dTick) * scale,
                               yLim.nTicks).data;

            for (i = 0; i < ind.length; i++) {
                points += BBox.x + ',' + ind[i] + ' ';
                pointsBis += (BBox.x + BBox.width) + ',' + ind[i] + ' ';
            }

            var exponent = yLim.e10;
            var tickText, textProp = this.getProperties('textTicks');
            textProp.x = BBox.x - 15;

            if (Math.abs(exponent) < 2) {
                exponent = 0;
            } else {
                textProp.y = BBox.y - 10;
                tickText = Tools.createSVGTextNode('10^' + exponent, textProp);
                tickText.setAttributeNS(null, 'font-weight', 'bold');
                yTextTicks.appendChild(tickText);
            }

            var val = linspace(-yLim.min,
                               -(yLim.min + (yLim.nTicks - 1) * yLim.dTick),
                               yLim.nTicks).data;
            var fontSize = parseFloat(this.getProperties('axis')['font-size']);
            for (i = 0; i < ind.length; i++) {
                textProp.y = ind[i] + fontSize / 2;
                val[i] = parseFloat((val[i] * Math.pow(10, -exponent)).toFixed(2));
                tickText = Tools.createSVGTextNode(val[i], textProp);
                yTextTicks.appendChild(tickText);
            }
        }
        points += BBox.x + ',' + (BBox.y + BBox.height) + ' ';
        pointsBis += (BBox.x + BBox.width) + ',' + (BBox.y + BBox.height) + ' ';
        yAxisLine.setAttributeNS(null, 'points', points);
        yAxisLineBis.setAttributeNS(null, 'points', pointsBis);
        return this;
    };

    /**
     * @private
     *  Determine the best way to sample axis.
     */
    Plot.prototype.getAxisLimits = function (minValue, widthValue) {

        var nTicksMax = 10;
        var rounds = [1, 2, 5];

        // Tools
        var k, kBest;
        var log10 = function (x) { return Math.log(x) / Math.LN10; };
        var pow10 = function (x) { return Math.pow(10, x); };

        // Find the best spacing
        var dTickMinLog = log10(widthValue / nTicksMax);
        var dTickBestLog = dTickMinLog + 2;
        for (k = 0; k < rounds.length; k++) {
            var offset = log10(rounds[k]);
            var dTickTmpLog = Math.ceil(dTickMinLog - offset) + offset;
            if (dTickTmpLog < dTickBestLog) {
                dTickBestLog = dTickTmpLog;
                kBest = k;
            }
        }
        var exponent = Math.floor(dTickBestLog);
        var dTick = rounds[kBest] * pow10(exponent);

        // Find first tick and number of ticks
        var minTick = Math.ceil(minValue / dTick) * dTick;
        var maxTick = Math.floor((minValue + widthValue) / dTick) * dTick;
        var nTicks = 1 + Math.round((maxTick - minTick) / dTick);

        return {
            'min': minTick,
            'dTick': dTick,
            'nTicks': nTicks,
            'e10': exponent
        };
    };

    /**
     * @private
     *  Compute union of all bounding box to determine
     *  automatic view.
     */
    Plot.prototype.getCurvesBBox = function () {

        var curves = this.getDrawing().getElementById('curves');
        var mBBox = [0, 0, 1, 1];

        if (curves.hasChildNodes()) {
            mBBox = curves.childNodes[0].BBox;
            var i;
            var curvesChilds = curves.childNodes;
            for (i = 1; i < curvesChilds.length; i++) {
                var BB = curvesChilds[i].BBox;

                mBBox[0] = BB[0] < mBBox[0] ? BB[0] : mBBox[0];
                mBBox[1] = BB[1] < mBBox[1] ? BB[1] : mBBox[1];
                mBBox[2] = BB[2] > mBBox[2] ? BB[2] : mBBox[2];
                mBBox[3] = BB[3] > mBBox[3] ? BB[3] : mBBox[3];
            }
        }
        var BBox = {
            x: mBBox[0],
            y: -mBBox[3],
            width: mBBox[2] - mBBox[0],
            height: mBBox[3] - mBBox[1]
        };
        return BBox;
    };

    /**
     * @private
     *  Scale specific elements when zooming or change properties
     *  (like markers).
     */
    Plot.prototype.scaleElements = function () {

        var svg = this.getDrawing();
        var drawingArea = svg.getElementById('drawingArea');
        var w = drawingArea.width.baseVal.value;
        var h = drawingArea.height.baseVal.value;

        // Specific scaling for scatter plot
        var markers = svg.getElementById('markers').childNodes;
        var scaleX = 2 * this.getCurrentAxis().width / w;
        var scaleY = 2 * this.getCurrentAxis().height / h;

        var m;
        for (m = 0; m < markers.length; m++) {
            /*
             if (markers[m].firstChild) {
             var size = markers[m].getAttribute('size');
             var scaling = 'scale(' + (scaleX * size) + ', ' + (scaleY * size) + ') ';
             markers[m].firstChild.setAttributeNS(null, 'transform', scaling);
             }
             */
            markers[m].setAttributeNS(null, 'markerWidth',
                                      scaleX * markers[m].getAttribute('size'));
            markers[m].setAttributeNS(null, 'markerHeight',
                                      scaleY * markers[m].getAttribute('size'));
        }

        // Automatic non-scaleing-stroke properties for firefox
        /*
         // Specific scaling for scatter plot
         var curvesNodes = svg.getElementById('curves').childNodes;
         var scale = (scaleX + scaleY) / 2.0;
         for (m = 0; m < curvesNodes.length; m++) {
         curvesNodes[m].setAttributeNS(null, 'stroke-width', scale);
         }
         */
    };


    /////////////////////////////////////////////////////////////////////////////////
    //                              TITLE AND LABELS                               //
    /////////////////////////////////////////////////////////////////////////////////


    /**
     * Define plot title and labels.
     * If text are an empty strings then rendering will be disable.
     * @param {string} [title='']
     *  Text of title.
     * @param {string} [xLabel='']
     *  Text of x label.
     * @param {string} [yLabel='']
     *  Text of y label.
     * @return {Plot}
     *  This plot.
     *
     *  // Set title
     *  myPlot.setTitle ('My plot !');
     */
    Plot.prototype.setTitle = function (text, xLabel, yLabel) {

        text = text || '';

        var svg = this.getDrawing();
        var title = svg.getElementById('title');
        if (title.hasChildNodes()) {
            while (title.childNodes.length > 0) {
                title.removeChild(title.firstChild);
            }
        }
        if (text !== '') {
            this.setOwnProperty('title-display', true);
            title.appendChild(document.createTextNode(text));
        } else {
            this.setOwnProperty('title-display', false);
        }
        if (xLabel !== undefined) {
            this.setXLabel(xLabel);
        }
        if (yLabel !== undefined) {
            this.setYLabel(yLabel);
        }
        this.autoDisplay();
        return this;
    };

    /**
     * Define plot x and y labels.
     * If text are an empty strings then rendering will be disable.
     * @param {string} [xLabel='']
     *  Text of x label.
     * @param {string} [yLabel='']
     *  Text of y label.
     * @return {Plot}
     *  This plot.
     *
     *  // Set x and y labels
     *  myPlot.setLabels ('x Label', 'y Label');
     */
    Plot.prototype.setLabels = function (xLabel, yLabel) {

        this.setXLabel(xLabel);
        this.setYLabel(yLabel);
        return this;
    };

    /**
     * Define plot x label.
     * If text is an empty string then rendering will be disable.
     * @param {string} [text='']
     *  Text of x label.

     * @return {Plot}
     *  This plot.
     *
     *  // Set x label
     *  myPlot.setXLabel ('x Label');
     */
    Plot.prototype.setXLabel = function (text) {

        text = text || '';

        var svg = this.getDrawing();
        var xLabel = svg.getElementById('xLabel');
        if (xLabel.hasChildNodes()) {
            while (xLabel.childNodes.length > 0) {
                xLabel.removeChild(xLabel.firstChild);
            }
        }
        if (text !== '') {
            this.setOwnProperty('xLabel-display', true);
            xLabel.appendChild(document.createTextNode(text));
        } else {
            this.setOwnProperty('xLabel-display', false);
        }

        this.autoDisplay();
        return this;
    };

    /**
     * Define plot y label.
     * If text is an empty string then rendering will be disable.
     * @param {string} [text='']
     *  Text of y label.
     * @return {Plot}
     *  This plot.
     *
     *  // Set y label
     *  myPlot.setYLabel ('y Label');
     */
    Plot.prototype.setYLabel = function (text) {

        text = text || '';

        var svg = this.getDrawing();
        var yLabel = svg.getElementById('yLabel');
        if (yLabel.hasChildNodes()) {
            while (yLabel.childNodes.length > 0) {
                yLabel.removeChild(yLabel.firstChild);
            }
        }
        if (text !== '') {
            this.setOwnProperty('yLabel-display', true);
            var textNode = document.createTextNode(text);
            yLabel.appendChild(textNode);
            this.rotateYLabel();
        } else {
            this.setOwnProperty('yLabel-display', false);
        }

        this.autoDisplay();
        return this;
    };

    /**
     * @private
     *  Function rotating y label
     */
    Plot.prototype.rotateYLabel = function () {


        var svg = this.getDrawing();
        var yLabel = svg.getElementById('yLabel');

        var BBox = yLabel.getBBox();
        var cx = (BBox.x + BBox.width / 2);
        var cy = (BBox.y + BBox.height / 2);
        yLabel.setAttributeNS(null, 'transform', 'rotate(-90, ' + cx + ', ' + cy + ')');
        return this;
    };


    /////////////////////////////////////////////////////////////////////////////////
    //                              LEGEND FUNCTIONS                               //
    /////////////////////////////////////////////////////////////////////////////////


    /**
     * @private
     *  Create plot legend.
     */
    Plot.prototype.setLegend = function () {

        var svg = this.getDrawing();
        var legend = svg.getElementById('legend');
        while (legend.childNodes.length > 0) {
            legend.removeChild(legend.firstChild);
        }

        // Element have to be render for determine its measures
        legend.setAttributeNS(null, 'display', 'inline');

        var curves = svg.getElementById('curves');
        var drawingArea = svg.getElementById('drawingArea');
        var markers = Tools.createSVGNode('defs', {id: 'legendMarkers'});
        var i;
        legend.appendChild(markers);
        var pad = 5;
        var sBox = {
            'width': 20,
            'height': 20
        };
        if (curves.hasChildNodes()) {
            var curvesChilds = curves.childNodes;
            var xPos = 0, yPos = 0;
            for (i = 0; i < curvesChilds.length; i++) {
                if (curvesChilds[i].getAttribute('legend') !== 'none') {
                    // Text
                    var text = curvesChilds[i].getAttribute('legend') || curvesChilds[i].getAttribute('id');
                    var id = 'legendTextId_' + i;
                    var textNode = Tools.createSVGTextNode(text, {'id': id});
                    legend.appendChild(textNode);
                    var BBox = textNode.getBBox();
                    textNode.setAttributeNS(null, 'x', xPos + sBox.width + 5);

                    // Sample
                    var sample;
                    switch (curvesChilds[i].tagName) {
                    case 'image':
                        var sampleProperties = {
                            'x': xPos,
                            'y': yPos - 2 * sBox.height / 3,
                            'width': sBox.width,
                            'height': sBox.height
                        };
                        sample = Tools.createSVGNode('image', sampleProperties);
                        var xlinkNS = 'http://www.w3.org/1999/xlink';
                        var link = curvesChilds[i].getAttributeNS(xlinkNS, 'href');
                        sample.setAttributeNS(xlinkNS, 'xlink:href', link);
                        break;
                    case 'polyline':
                        id = 'legendCurveId_' + i;
                        sample = curvesChilds[i].cloneNode();
                        sample.removeAttributeNS(null, 'marker-end');
                        sample.removeAttributeNS(null, 'marker-start');
                        if (sample.getAttribute('marker-mid')) {
                            var markerId = sample.getAttribute('marker-mid').split('#')[1].split(')')[0];
                            var marker = svg.getElementById(markerId).cloneNode(true);
                            var markerSize = marker.getAttribute('size');
                            markers.appendChild(marker);
                            marker.removeAttributeNS(null, 'transform');
                            marker.setAttributeNS(null, 'markerWidth', markerSize * 2);
                            marker.setAttributeNS(null, 'markerHeight', markerSize * 2);
                            marker.setAttributeNS(null, 'id', markerId + '_legend');
                            sample.setAttributeNS(null, 'marker-mid', 'url(#' + markerId + '_legend' + ')');
                        }
                        var ySample = yPos - BBox.height / 3;
                        var points = xPos + ',' + ySample  + ' ' +
                                (xPos + sBox.width / 2) + ',' + ySample + ' ' +
                                (xPos + sBox.width) + ',' + ySample + ' ';
                        sample.setAttributeNS(null, 'points', points);
                        legend.appendChild(sample);
                        break;
                        // TO CHANGE
                    default:
                        sample = Tools.createSVGNode('rect');
                        break;
                    }
                    legend.appendChild(sample);
                    textNode.setAttributeNS(null, 'y', yPos);
                    yPos += BBox.height;
                }

            }

        } else {
            return this;
        }
        var legendBBox = legend.getBBox();
        var frontProp = {
            'fill': 'white',
            'x': legendBBox.x - pad,
            'y': legendBBox.y - pad,
            'width': legendBBox.width + 2 * pad,
            'height': legendBBox.height + 2 * pad,
            'stroke': 'gray',
            'stroke-width': 2
        };
        var front = Tools.createSVGNode('rect', frontProp);
        legend.insertBefore(front, legend.firstChild);
        legendBBox = legend.getBBox();
        var viewBox = legendBBox.x + ' ' + legendBBox.y + ' ' + legendBBox.width + ' ' + legendBBox.height;
        legend.setAttributeNS(null, 'viewBox', viewBox);
        legend.setAttributeNS(null, 'width', legendBBox.width);
        legend.setAttributeNS(null, 'height', legendBBox.height);
        this.setLegendLocation();
        return this;
    };

    /**
     * @private
     *  Return reuired legend location location can be
     *  'nw', 'n', 'ne', 'w', 'c', 'e', 'sw', 's', 'se'.
     */
    Plot.prototype.getLegendLocation = function (location) {

        var svg = this.getDrawing();
        var legend = svg.getElementById('legend');
        var legendBBox;
        try {
            legendBBox = legend.getBBox();
        } catch (e) {
            return;
        }

        // drawing area
        var drawingArea = svg.getElementById('drawingArea');
        var dABBox = {
            'x': drawingArea.x.baseVal.value,
            'y': drawingArea.y.baseVal.value,
            'width': drawingArea.width.baseVal.value,
            'height': drawingArea.height.baseVal.value
        };
        var margin = 0.02 * Math.min(dABBox.width, dABBox.height);

        var xMin = [
            dABBox.x + margin,
            dABBox.x + (dABBox.width - legendBBox.width) / 2,
            dABBox.x + dABBox.width - legendBBox.width - margin
        ];
        var yMin = [
            dABBox.y + margin,
            dABBox.y + (dABBox.height - legendBBox.height) / 2,
            dABBox.y + dABBox.height - legendBBox.height - margin
        ];
        var w = legendBBox.width, h = legendBBox.height;
        switch (location.toLowerCase()) {
        case 'nw':
        case 'north-west':
            return [xMin[0], yMin[0], xMin[0] + w, yMin[0] + h];
        case 'n':
        case 'north':
            return [xMin[1], yMin[0], xMin[1] + w, yMin[0] + h];
        case 'none':
        case 'ne':
        case 'north-east':
            return [xMin[2], yMin[0], xMin[2] + w, yMin[0] + h];
        case 'w':
        case 'west':
            return [xMin[0], yMin[1], xMin[0] + w, yMin[1] + h];
        case 'c':
        case 'center':
            return [xMin[1], yMin[1], xMin[1] + w, yMin[1] + h];
        case 'e':
        case 'east':
            return [xMin[2], yMin[1], xMin[2] + w, yMin[1] + h];
        case 'sw':
        case 'sud-west':
            return [xMin[0], yMin[2], xMin[0] + w, yMin[2] + h];
        case 's':
        case 'sud':
            return [xMin[1], yMin[2], xMin[1] + w, yMin[2] + h];
        case 'se':
        case 'sud-east':
            return [xMin[2], yMin[2], xMin[2] + w, yMin[2] + h];
        case 'auto':
            return this.getLegendLocation(this.getLegendAutoLocation());
        default:
            throw new Error('Plot.getLegendLocation: Wrong location request.');
        }
    };

    /**
     * @private
     *  Return legend location which overlap least points
     */
    Plot.prototype.getLegendAutoLocation = function () {

        if (!this.getOwnProperty('compute-closest')) {
            return 'ne';
        }
        var locations = ['ne', 'se', 'nw',
                         'w',  'n', 'e',
                         's', 'w', 'c'];

        var count = [];

        // Initalization
        var i;
        var l = this.getLegendLocation(locations[0]);
        var min, max;
        try {
            min = this.getCoordinates(l[0], l[1], false);
            max = this.getCoordinates(l[2], l[3], false);
        } catch (x) {
            return 'none';
        }
        count[0] = this.tree.count(min.x, min.y, max.x - min.x, max.y - min.y);

        var locMin = 0;

        for (i = 1; i < locations.length; i++) {
            l = this.getLegendLocation(locations[i]);
            min = this.getCoordinates(l[0], l[1], false);
            max = this.getCoordinates(l[2], l[3], false);
            count[i] = this.tree.count(min.x, min.y, max.x - min.x, max.y - min.y);
            if (count[i] < count[locMin]) {
                locMin = i;
            }
        }
        return locations[locMin];
    };

    /**
     * @private
     *  Place legend at the position required by plot
     *  own property 'legend-display'. Valids values are
     * 'nw', 'n', 'ne', 'w', 'c', 'e', 'sw', 's', 'se',
     * 'auto' and 'none'.
     */
    Plot.prototype.setLegendLocation = function () {

        var location = this.getOwnProperty('legend-display');
        var svg = this.getDrawing();
        var legend = svg.getElementById('legend');

        if (location === 'none') {
            legend.setAttributeNS(null, 'display', 'none');
        } else {
            legend.setAttributeNS(null, 'display', 'inline');
            location = this.getLegendLocation(location);
            legend.setAttributeNS(null, 'x', location[0]);
            legend.setAttributeNS(null, 'y', location[1]);
        }
        return this;
    };


    /////////////////////////////////////////////////////////////////////////////////
    //                           INITIALISATION AND UPDATE                         //
    /////////////////////////////////////////////////////////////////////////////////


    /**
     * @private
     *  Plot initialisation function.
     */
    Plot.prototype.initialize = function () {

        // Set UI parameters
        var svg = this.getDrawing();
        var parent = this.getParentNode();
        parent.appendChild(svg);

        // Drawing area
        var drawingAreaProperties = this.getProperties('drawingArea');
        var drawingArea = Tools.createSVGNode('svg', drawingAreaProperties);
        svg.appendChild(drawingArea);

        // Nodes containing data Path
        var curvesProperties = this.getProperties('curves');
        var curves = Tools.createSVGNode('g', curvesProperties);
        drawingArea.appendChild(curves);

        // Nodes containing data Path
        var markersProperties = this.getProperties('markers');
        var markers = Tools.createSVGNode('defs', markersProperties);
        drawingArea.appendChild(markers);

        // Cursor
        var cursorProperties = this.getProperties('cursor');
        var cursor = Tools.createSVGNode('polyline', cursorProperties);
        this.setMarkerPath(cursor, cursorProperties.marker);
        drawingArea.appendChild(cursor);

        // Drawing area front
        var frontProperties = this.getProperties('front');
        var front = Tools.createSVGNode('rect', frontProperties);
        drawingArea.appendChild(front);

        // Axis
        var axisProperties = this.getProperties('axis');
        var axis = Tools.createSVGNode('g', axisProperties);
        svg.appendChild(axis);

        // Tick marker
        var ticksMarkerProp = this.getProperties('ticks');
        var ticksMarker = Tools.createSVGNode('marker', ticksMarkerProp);
        var ticksLine = Tools.createSVGNode('line', ticksMarkerProp);
        ticksMarker.appendChild(ticksLine);
        axis.appendChild(ticksMarker);

        // x Axis
        var xAxisProp = this.getProperties('xAxis');
        var xAxis = Tools.createSVGNode('g', xAxisProp);
        var xAxisLineProp = this.getProperties('xAxisLine');
        var xAxisLine = Tools.createSVGNode('polyline', xAxisLineProp);
        var xAxisLineBisProp = this.getProperties('xAxisLineBis');
        var xAxisLineBis = Tools.createSVGNode('polyline', xAxisLineBisProp);
        var xTextTicksProp = this.getProperties('xTextTicks');
        var xTextTicks = Tools.createSVGNode('g', xTextTicksProp);
        xAxis.appendChild(xAxisLine);
        xAxis.appendChild(xAxisLineBis);
        xAxis.appendChild(xTextTicks);
        axis.appendChild(xAxis);

        // y Axis
        var yAxisProp = this.getProperties('yAxis');
        var yAxis = Tools.createSVGNode('g', yAxisProp);
        var yAxisLineProp = this.getProperties('yAxisLine');
        var yAxisLine = Tools.createSVGNode('polyline', yAxisLineProp);
        var yAxisLineBisProp = this.getProperties('yAxisLineBis');
        var yAxisLineBis = Tools.createSVGNode('polyline', yAxisLineBisProp);
        var yTextTicksProp = this.getProperties('yTextTicks');
        var yTextTicks = Tools.createSVGNode('g', yTextTicksProp);
        yAxis.appendChild(yAxisLine);
        yAxis.appendChild(yAxisLineBis);
        yAxis.appendChild(yTextTicks);
        axis.appendChild(yAxis);

        // Title
        var titleProperties = this.getProperties('title');
        var title = Tools.createSVGTextNode('', titleProperties);
        svg.appendChild(title);

        // xLabel
        var xLabelProperties = this.getProperties('xLabel');
        var xLabel = Tools.createSVGTextNode('', xLabelProperties);
        svg.appendChild(xLabel);

        // yLabel
        var yLabelProperties = this.getProperties('yLabel');
        var yLabel = Tools.createSVGTextNode('', yLabelProperties);
        svg.appendChild(yLabel);

        // Legend
        var legendProperties = this.getProperties('legend');
        var legend = Tools.createSVGNode('svg', legendProperties);
        svg.appendChild(legend);

        this.initializeEvents();

        this.autoDisplay();
        this.setAxis();

        return this;
    };

    /**
     * @private
     *  Plot Event initialisation function.
     */
    Plot.prototype.initializeEvents = function () {

        var svg = this.getDrawing();
        var front = svg.getElementById('drawingArea').getElementById('front');

        // Set events Parameters
        var thisPlot = this;
        var onMouseDown = function (event) {
            event.stopPropagation();
            event.preventDefault();
            thisPlot.coordDown = thisPlot.getCoordinates(event.clientX, event.clientY);
            thisPlot.coordDown.clientX = event.clientX;
            thisPlot.coordDown.clientY = event.clientY;
            thisPlot.mousedown(thisPlot.coordDown, event);
        };
        var onMouseMove = function (event) {
            event.stopPropagation();
            event.preventDefault();
            var coord = thisPlot.getCoordinates(event.clientX, event.clientY);
            thisPlot.mousemove(coord, event);
        };
        var onMouseUp = function (event) {
            event.stopPropagation();
            event.preventDefault();
            var newCoord = thisPlot.getCoordinates(event.clientX, event.clientY);
            var oldCoord = thisPlot.coordDown;
            if (oldCoord === undefined) {
                return;
            }
            // Both coordinates are the same
            if (oldCoord.clientX === event.clientX && oldCoord.clientY === event.clientY) {
                if (thisPlot.click && typeof thisPlot.click === 'function') {
                    thisPlot.click(newCoord, event);
                }
                // Else fire event mouseup
            } else {
                if (thisPlot.mouseup && typeof thisPlot.mouseup === 'function') {
                    thisPlot.mouseup(newCoord, event);
                }
            }
            delete thisPlot.coordDown;
        };

        var onMouseWheel = function (event) {
            event.stopPropagation();
            event.preventDefault();
            var coord = thisPlot.getCoordinates(event.clientX, event.clientY);
            var direction = 0;
            if (event.wheelDelta) {
                direction = -event.wheelDelta / 120.0;
            } else if (event.detail) {
                direction = event.detail / 3.0;
            } else {
                throw new Error('Mouse wheel event error: what is your browser ?');
            }
            switch (event.target.parentNode.id) {
            case 'xAxis':
                if (!thisPlot.getOwnProperty('preserve-ratio')) {
                    thisPlot.zoomAxis(coord, 1 + direction * 0.1, 1);
                }
                break;
            case 'yAxis':
                if (!thisPlot.getOwnProperty('preserve-ratio')) {
                    thisPlot.zoomAxis(coord, 1, 1 + direction * 0.1);
                }
                break;
            default:
                if (thisPlot.mousewheel && typeof thisPlot.mousewheel === 'function') {
                    thisPlot.mousewheel(direction, coord, event);
                }
            }
        };

        var onMouseOut = function (event) {
            event.stopPropagation();
            event.preventDefault();
            delete thisPlot.coordDown;
            var select = thisPlot.getDrawing().getElementById('selectArea');
            // Remove select rectangle
            if (select) {
                select.parentNode.removeChild(select);
            }
        };

        front.addEventListener('mousedown', onMouseDown, false);
        front.addEventListener('mousemove', onMouseMove, false);
        front.addEventListener('mouseup', onMouseUp, false);
        front.addEventListener('DOMMouseScroll', onMouseWheel, false);
        front.addEventListener('mousewheel', onMouseWheel, false);
        front.addEventListener('mouseout', onMouseOut, false);

        // Axis events (zomming);
        var xAxis = svg.getElementById('xAxis');
        xAxis.addEventListener('mousewheel', onMouseWheel, false);
        xAxis.addEventListener('DOMMouseScroll', onMouseWheel, false);
        var yAxis = svg.getElementById('yAxis');
        yAxis.addEventListener('mousewheel', onMouseWheel, false);
        xAxis.addEventListener('DOMMouseScroll', onMouseWheel, false);

        if (this.getOwnProperty('compute-closest')) {
            this.tree = new Tree2d();
        }

        return this;
    };

    /**
     * @private
     *  Automatically positions the components of the drawing.
     */
    Plot.prototype.autoDisplay = function () {

        // Set UI parameters
        var svg = this.getDrawing();

        // drawing area
        var drawingArea = svg.getElementById('drawingArea');
        drawingArea.setAttributeNS(null, 'x', 0);
        drawingArea.setAttributeNS(null, 'y', 0);
        drawingArea.setAttributeNS(null, 'width', svg.width.baseVal.value);
        drawingArea.setAttributeNS(null, 'height', svg.height.baseVal.value);

        var dABBox = {
            'x': drawingArea.x.baseVal.value,
            'y': drawingArea.y.baseVal.value,
            'width': drawingArea.width.baseVal.value,
            'height': drawingArea.height.baseVal.value
        };

        var axis = svg.getElementById('axis');
        var xAxis = svg.getElementById('xAxis');
        var yAxis = svg.getElementById('yAxis');
        var title = svg.getElementById('title');
        var xLabel = svg.getElementById('xLabel');
        var yLabel = svg.getElementById('yLabel');

        var titleBBox, xAxisBBox, yAxisBBox, xLabelBBox, yLabelBBox;
        try {
            titleBBox = svg.getElementById('title').getBBox();
            xAxisBBox = svg.getElementById('xAxis').getBBox();
            yAxisBBox = svg.getElementById('yAxis').getBBox();
            xLabelBBox = svg.getElementById('xLabel').getBBox();
            yLabelBBox = svg.getElementById('yLabel').getBBox();
        } catch (e) {
            return this;
        }
        var s;

        if (this.getOwnProperty('title-display')) {
            dABBox.y = titleBBox.height;
            dABBox.height -= titleBBox.height;
            dABBox.y += 5;
            dABBox.height -= 5;
        }

        if (this.getOwnProperty('ticks-display')) {
            dABBox.x += 40;
            dABBox.width -= 80;
            dABBox.height -= 50;
            dABBox.y += 20;
        }

        var xLabelSpace, yLabelSpace;
        if (this.getOwnProperty('yLabel-display')) {
            yLabelSpace = yLabelBBox.height + 10;
            dABBox.x += yLabelSpace;
            dABBox.width -= yLabelSpace;
        }

        if (this.getOwnProperty('xLabel-display')) {
            xLabelSpace = xLabelBBox.height + 10;
            dABBox.height -= xLabelSpace;
        }

        drawingArea.setAttributeNS(null, 'x', dABBox.x);
        drawingArea.setAttributeNS(null, 'y', dABBox.y);
        drawingArea.setAttributeNS(null, 'width', dABBox.width);
        drawingArea.setAttributeNS(null, 'height', dABBox.height);

        yLabelBBox.y = dABBox.y;
        yLabelBBox.y += dABBox.height / 2;
        yLabelBBox.y -= yLabelBBox.height / 2;
        yLabelBBox.x = 10;

        xLabelBBox.x = dABBox.x + dABBox.width / 2;
        xLabelBBox.y = svg.height.baseVal.value - 5;

        title.setAttributeNS(null, 'x', xLabelBBox.x);
        title.setAttributeNS(null, 'y', titleBBox.height);

        xLabel.setAttributeNS(null, 'x', xLabelBBox.x);
        xLabel.setAttributeNS(null, 'y', xLabelBBox.y);

        yLabel.setAttributeNS(null, 'y', yLabelBBox.y);
        yLabel.setAttributeNS(null, 'x', yLabelBBox.x);

        this.rotateYLabel();
        this.setAxis(this.getCurrentAxis());
        return this;
    };


    /////////////////////////////////////////////////////////////////////////////////
    //                                   TOOLS                                     //
    /////////////////////////////////////////////////////////////////////////////////


    /** Parse an argument string.
     *
     * Format:
     *  + [size] [border-size]
     *  + [width] [fac-size]
     *
     * Colors X:
     *  xx for light
     *  x for normal
     *  X for medium
     *  XX for dark
     *
     * Color list:
     *  Nothing: transparent
     *  [R]ed, [G]reen, [B]lue
     *  [W]hite, blac[k]
     *
     * Marker list:
     *  . point
     *  #$ rectangle
     *  <>^v
     *  +x*
     *  _|
     *
     * Line list:
     *  - filled
     *  : dot
     *  = dash, [fac-size] is [dash-size] [white-space]
     *  ! dash-dot, [fac-size] is [dash-size] [white-space]
     *  ; double-dash, [fac-size] is [dash-size] [white-space] [dash-size-2] [white-space-2]
     *
     * Example:
     *  '.k' is black points
     *  '-r' is red line
     *  '#bb3 :k2' is black dotted line of width 2 with light blue rectangles of size 3
     *  'ok5,1' is black circle of size 5 with a border of width 1
     *  '=B2,4' is medium blue dashed line of width 2 with dash of size 4
     *  '=B2,4,8' is the same with dash-spacing of 8
     *  ';BB2' is dark blue dashed line of width 2, with long/short dash
     *  ';BB2,4,8 is the same with long dash of size 4 and dash-spacing of 8
     *  ';BB2,4,8,12 set alternatively dash size to 4 and 12, dash-spacing is 8
     *  ';BB2,4,8,12,16 set alternatively dash size to 4 and 12 and dash-spacing to 8 and 16
     */
    Plot.stringToArgs = function (str) {

        var errMsg = 'Plot.stringToArgs: ';
        var assume = function (condition) {
            if (!condition) {
                throw new Error(errMsg + 'invalid argument string');
            }
        };

        // check arguments
        if (str === undefined) {
            return {};
        }
        if (typeof str !== 'string') {
            throw new Error(errMsg + 'argument must be a string');
        }
        str = str.split(' ').join('');

        // Regexp
        var markers = '.#';
        var lines = '-=:;!';
        var colors = 'kwrgb';
        var colorList = ['black', 'white', 'red', 'green', 'blue'];
        var regexp = '([' + colors + ']{0,2})';
        regexp += '([0-9.,]*)';
        regexp = '^(([' + markers + '])' + regexp + ')?(([' + lines + '])' + regexp + ')?$';

        // Tools function
        var getFullName = function (value, list, fullNames) {
            var i = list.indexOf(value);
            assume(i >= 0);
            return fullNames[i];
        };
        var getColor = function (colorStr) {
            if (!colorStr) {
                return 'none';
            }
            var c = colorStr[0];
            var isUpper = (c === c.toUpperCase());
            var color = getFullName(c.toLowerCase(), colors, colorList);
            if (colorStr.length > 1) {
                assume(colorStr[1] === c);
                color = ((isUpper) ? 'dark' : 'light') + color;
            } else if (isUpper) {
                color = 'medium' + color;
            }
            return color;
        };
        var parseFloats = function (floatStr) {
            var i;
            var t = (!floatStr) ? [] : floatStr.split(',');
            for (i = 0; i < t.length; i++) {
                t[i] = parseFloat(t[i]);
                assume(!isNaN(t[i]));
            }
            return t;
        };

        // Parse string
        var args = {'stroke': 'none'};
        var parsed = str.match(new RegExp(regexp, 'i'));
        assume(parsed);

        // Process lines
        var lk = 6;
        var lString = parsed[lk];
        if (!lString) {
            args.stroke = 'none';
            args['stroke-width'] = 0;
        } else {
            var lColor = getColor(parsed[lk + 1]);
            var lSize = parseFloats(parsed[lk + 2]);
            lSize[0] = (typeof lSize[0] === 'number') ? lSize[0] : 1;
            args['stroke-width'] = lSize[0];
            args.stroke = lColor;
            if (args.marker) {
                args.marker.stroke = lColor;
            }
            var dashArray = '';
            switch (parsed[lk]) {
            case '-':
                break;
            case '=':
                lSize[1] = lSize[1] || 8 * lSize[0];
                lSize[2] = lSize[2] || Math.floor(lSize[1] * 2 / 3);
                dashArray += lSize[1] + ' ' + lSize[2];
                break;
            case ':':
                lSize[1] = lSize[0];
                lSize[2] = 2 * lSize[1];
                dashArray += lSize[1] + ' ' + lSize[2];
                break;
            case ';':
                lSize[1] = lSize[1] || 8 * lSize[0];
                lSize[2] = lSize[2] || Math.floor(lSize[1] / 2);
                lSize[3] = lSize[3] || Math.floor(lSize[1] / 2);
                lSize[4] = lSize[4] || lSize[2];
                dashArray += lSize[1] + ' ' + lSize[2] + ' ';
                dashArray += lSize[3] + ' ' + lSize[4];
                break;
            case '!':
                lSize[1] = lSize[1] || 12 * lSize[0];
                lSize[2] = lSize[2] || Math.floor(lSize[1] / 2);
                lSize[3] = 2 * lSize[0];
                dashArray += lSize[1] + ' ' + lSize[2] + ' ';
                dashArray += lSize[3] + ' ' + lSize[2];
                break;
            default:
                assume(false);
            }
            if (dashArray) {
                args['stroke-dasharray'] = dashArray;
            }
        }

        // Process markers
        var mk = 2;
        var mString = parsed[mk];
        if (mString) {
            var mColor = getColor(parsed[mk + 1]);
            var mSize = parseFloats(parsed[mk + 2]);
            args.marker = {};
            args.marker.fill = mColor;
            args.marker.stroke = args.stroke;
            args.marker.size = mSize[0] || 2;
            args.marker['stroke-width'] = (mSize[1] || args['stroke-width']) / args.marker.size;
            switch (parsed[mk]) {
            case '.':
                args.marker.shape = 'circle';
                break;
            case '#':
                args.marker.shape = 'rect';
                break;
            default:
                assume(false);
            }
            if (args.marker.fill === 'none' && args.stroke !== 'none') {
                args.marker.fill = 'white';
            }
        }

        // Return result
        if (!args['stroke-width']) {
            args.stroke = 'none';
        }
        return args;
    };

    /**
     * Return closest point to (coord) Default function called when 'click'
     * event is fired.
     * You can redefined your own function until it accepts following parameters.
     * @param {number} x
     *  x coordinate of request point
     * @param {number} y
     *  y coordinate of request point
     * @param {boolean} [scale=true]
     *  Select whether closest mean exact closest or visualy closest.
     * @return {Object}
     *  Object with fields
     *  - x: x coordinate of closest point.
     *  - y: y coordinate of closest point.
     *  - data: curve id.
     */
    Plot.prototype.getClosestPoint = function (x, y, scale) {

        if (!this.getOwnProperty('compute-closest')) {
            throw new Error('Property \'compute-closest\' is disabled.');
        }
        if (scale === undefined) {
            scale = true;
        }
        var dArea = this.getDrawing().getElementById('drawingArea');
        var BBoxCurves = this.getCurrentAxis();
        var BBox = {
            width: dArea.width.baseVal.value,
            height: dArea.height.baseVal.value
        };
        var rx = 1, ry = 1;
        if (!scale) {
            rx = BBoxCurves.width / BBox.width;
            ry = BBoxCurves.height / BBox.height;
        }
        return this.tree.closest(x, y, -1, rx, ry);
    };

    /**
     * @private
     *  Display or hide cursor.
     */
    Plot.prototype.setCursor = function (xc, yc) {

        var svg = this.getDrawing();
        var cursor = svg.getElementById('cursor');
        if (xc !== undefined && yc !== undefined) {
            cursor.setAttributeNS(null, 'display', 'inline');
            cursor.setAttributeNS(null, 'points', xc + ',' + (-yc));
        } else {
            cursor.setAttributeNS(null, 'display', 'none');
        }
    };

    /**
     * @private
     *  Translate axis view.
     */
    Plot.prototype.translateAxis = function (dx, dy) {

        var axis = this.getCurrentAxis();
        axis.x -= dx;
        axis.y += dy;
        this.setAxis(axis);
    };

    /**
     * @private
     *  Zoom axis view.
     */
    Plot.prototype.zoomAxis = function (coord, fx, fy) {
        fx = fx || 1;
        fy = fy || fx;
        var axis = this.getCurrentAxis();
        var w = axis.width * fx;
        var h = axis.height * fy;
        var px = (coord.x - axis.x) / axis.width;
        axis.x = coord.x - px * w;
        var py = (coord.y + axis.y) / axis.height;
        axis.y = -coord.y + py * h;
        axis.width = w;
        axis.height = h;
        this.setAxis(axis);
    };

    /**
     * @private
     *  Initiate select area operation.
     */
    Plot.prototype.startSelectArea = function (coord) {

        var selectProperties = this.getProperties('selectArea');
        selectProperties.x = coord.x;
        selectProperties.y = -coord.y;
        selectProperties.width = 0;
        selectProperties.height = 0;
        var select = Tools.createSVGNode('rect', selectProperties);
        this.getDrawing().getElementById('curves').appendChild(select);
    };

    /**
     * @private
     *  Update select area operation.
     */
    Plot.prototype.updateSelectArea = function (coordStart, coordActual) {

        var select = this.getDrawing().getElementById('selectArea');
        var x = Math.min(coordStart.x, coordActual.x);
        var y = Math.min(-coordStart.y, -coordActual.y);
        var width = Math.max(coordStart.x, coordActual.x) - x;
        var height = Math.max(-coordStart.y, -coordActual.y) - y;
        select.setAttributeNS(null, 'x', x);
        select.setAttributeNS(null, 'y', y);
        select.setAttributeNS(null, 'width', width);
        select.setAttributeNS(null, 'height', height);
    };

    /**
     * @private
     *  Ends select area operation.
     */
    Plot.prototype.endSelectArea = function (coordStart, coordEnd) {

        var select = this.getDrawing().getElementById('selectArea');
        select.parentNode.removeChild(select);
        this.selectarea(coordStart.x, coordStart.y, coordEnd.x, coordEnd.y);
    };

    /**
     * @private
     *  Cancels select area operation.
     */
    Plot.prototype.cancelSelectArea = function () {

        var select = this.getDrawing().getElementById('selectArea');
        if (select) {
            select.parentNode.removeChild(select);
        }
    };

    /**
     * @private
     *  Convert pixel coordinates to svg 'drawingArea' units coordinate.
     * @param {number} x
     *  x coordinate to convert.
     * @param {number} y
     *  y coordinate to convert.
     * @param {boolean} screen
     *  Indicate whether the coordinates are relative
     *  to the window or to the drawing area.
     * @param {boolean} inverse
     *  Specify the direction of the conversion.
     *  'true' means screen units -> drawing area units.
     *  'false' means drawing area units -> screen units.
     *
     *  // When a click event is fired convert screen click coordinates
     *  // to drawing area coordinates.
     *  myPlot.getCoordinates(event.clientX, event.clientY);
     */
    Plot.prototype.getCoordinates = function (x, y, screen, inverse) {

        if (inverse === undefined) {
            inverse = true;
        }
        if (screen === undefined) {
            screen = true;
        }
        var svg = this.getDrawing();
        var svgPoint = svg.createSVGPoint();
        svgPoint.x = x;
        svgPoint.y = y;

        var curves = svg.getElementById('curves');
        var matrix = screen ? curves.getScreenCTM() : curves.getCTM();
        matrix = inverse ? matrix.inverse() : matrix;

        svgPoint = svgPoint.matrixTransform(matrix);
        svgPoint.y = -svgPoint.y;

        // Undo the effect of viewBox and zoomin/scroll
        return svgPoint;
    };

    /** Load a CSV string into a 2D array.
     * @param {String} csv
     *  String containing data, separateed by white spaces and new line.
     * @param {Boolean} [transpose=undefined]
     *  - If 'undefined' transpose to maximize series lengths.
     *  - If 'true' series will be take as column, if 'false' as line.
     * @return {Array}
     *  Loaded data
     */
    Plot.loadCsv = function (csvString, transpose) {

        var errMsg = 'Plot.loadCsv: ';
        // Load data
        var parsed = Tools.parseCsv(csvString, /\s*\n\s*/, /\s+/, false);
        var arrays = Tools.Array.mapRec(parsed, parseFloat);
        if (!Tools.Array.isRectangle(arrays)) {
            throw new Error(errMsg + 'invalid csv string');
        }
        // Transpose it
        if (transpose === undefined) {
            if (arrays.length > arrays[0].length) {
                arrays = Tools.Array.transpose(arrays);
            }
        } else if (transpose === true) {
            arrays = Tools.Array.transpose(arrays);
        } else if (transpose !== false) {
            throw new Error(errMsg + "invalid 'transpose' parameter");
        }
        // Return it
        return arrays;
    };

    /** Display csv string
     * @param {String} csv
     *  String containing data.
     * @param {Boolean} [transpose=undefined]
     *  - If 'undefined' transpose to maximize series lengths.
     *  - If 'true' series will be take as column, if 'false' as line.
     * @param {Boolean} [auto=true]
     *  Choose color automaticaly.
     * @param {Object} [properties]
     *  Properties of paths.
     */
    Plot.prototype.displayCsv = function (csvString, transpose, auto, properties) {

        var errMsg = this.constructor.name + 'displayCsv: ';
        var arrays = Plot.loadCsv(csvString, transpose);

        // Auto colors
        if (auto === undefined) {
            auto = true;
        } else if (typeof auto !== 'boolean') {
            throw new Error(errMsg + "invalid 'auto' parameter");
        }
        var colors = ["red", "green", "blue",
                      "fuchsia", "lime", "aqua",
                      "purple", "olive", "teal",
                      "yellow", "navy", "maroon",
                      "black", "sylver", "gray"];

        // If there is more than one series then the first one is used as x coordinates
        var i, k, x = [];
        if (arrays.length > 1) {
            x = arrays.shift();
        } else {
            for (k = 0; k < arrays[0].length; k++) {
                x.push(k + 1);
            }
        }

        // Plot everything
        for (k = 0; k < arrays.length; k++) {
            var nPlot = this.getOwnProperty('autoId-curves');
            if (auto === true) {
                var color = colors[nPlot % colors.length];
                if (properties) {
                    if (properties.stroke !== 'none') {
                        properties.stroke = color;
                    }
                    if (properties.marker) {
                        properties.marker.fill = color;
                    }
                } else {
                    properties = {'stroke': color};
                }
            }
            this.addPath(x, arrays[k], properties);
        }
        return this;
    };

    /**
     * Returns an array containing the identifiers of the plotted curves.
     * @return {Array}
     *  Array containing identifiers.
     */
    Plot.prototype.getCurvesIds = function () {

        var ids = [];
        var curves = this.getDrawing().getElementById('curves');
        if (curves.hasChildNodes()) {
            var i;
            for (i = 0; i < curves.childNodes.length; i++) {
                ids.push(curves.childNodes[i].id);
            }
        }
        return ids;
    };

    /**
     * Change a property of a curve.
     * @param {String} id
     *  Identifier of the curve to be changed.
     * @param {String} property
     *  Name of property to be changed.
     * @param {String} value
     *  New value of the property.
     * @return {Plot}
     *  This plot.
     *
     * // Change stroke width of 'myCurve'
     * myPlot.setCurveProperty('myCurve', 'stroke-width', 3);
     */
    Plot.prototype.setCurveProperty = function (id, property, value) {

        var curves = this.getDrawing().getElementById('curves');
        if (curves.hasChildNodes()) {
            var i;
            var curvesChilds = curves.childNodes;
            for (i = 0; i < curvesChilds.length; i++) {
                if (curvesChilds[i].id === id) {
                    curvesChilds[i].setAttributeNS(null, property, value);
                    this.setLegend();
                    break;
                }
            }
        }
        return this;
    };

    /** Change a property of a curve marker.
     * @param {String} id
     *  Identifier of the curve to be changed.
     * @param {String} property
     *  Name of property to be changed.
     * @param {String} value
     *  New value of the property.
     * @return {Plot}
     *  This plot.
     *
     * // Change fill color of 'myCurve'
     * myPlot.setMarkerProperty('myCurve', 'fill', 'lime');
     * // Change marker shape of 'myCurve'
     * myPlot.setMarkerProperty('myCurve', 'shape', 'rect');
     */
    Plot.prototype.setCurveMarkerProperty = function (id, property, value) {

        var svg = this.getDrawing();
        var curves = svg.getElementById('curves');
        if (curves.hasChildNodes()) {
            var i;
            var curvesChilds = curves.childNodes;
            for (i = 0; i < curvesChilds.length; i++) {
                if (curvesChilds[i].id === id) {
                    var curve = curvesChilds[i];
                    var markerId = curve.getAttributeNS(null, 'marker-id');
                    var marker = svg.getElementById(markerId);
                    if (property === 'shape') {
                        this.setMarkerShape(marker, value);
                    }
                    marker.setAttributeNS(null, property, value);
                    this.scaleElements();
                    this.setLegend();
                    break;
                }
            }
        }
        return this;
    };

    /** Clone the SVG element and display it in a new window.
     * @param {Number} height
     * @param {Number} width
     * @return {Object}
     *  The window created.
     */
    Plot.prototype.toWindow = function (h, w) {
        var wo = this.getWidth(), ho = this.getHeight();
        h = h || ho;
        w = w || wo;
        var BBox;// = this.getCurrentAxis();
        this.setWidth(w).setHeight(h).setAxis(BBox);
        var win = window.open("", "", "width=" + (w + 30) + ", height=" + (h + 30));
        win.document.body.appendChild(this.setAxis(BBox).getDrawing().cloneNode(true));
        this.setWidth(wo).setHeight(ho).setAxis(BBox);
        return win;
    };

    /** Clone the SVG element and display it in a new window
     * and open the print toolbox.
     * @param {Number} height
     * @param {Number} width
     * @chainable
     */
    Plot.prototype.print = function (h, w) {
        var win = this.toWindow(h, w);
        win.print();
        win.close();
        return this;
    };


    /////////////////////////////////////////////////////////////////////////////////
    //                            DEFAULT MOUSE EVENTS                             //
    /////////////////////////////////////////////////////////////////////////////////


    /**
     * Default function called when 'mousedown' event is fired.
     * You can redefined your own function until it accepts following parameters.
     * @param {Object} coord Object with 'x' and 'y' fields corresponding to the mouse
     *  position on the plot.
     * @param {Event} event Original event fired.
     */
    Plot.prototype.mousedown = function (coord, event) {
        if (event.shiftKey) {
            this.startSelectArea(coord);
        }
    };

    /**
     * Default function called when 'mousemove' event is fired.
     * You can redefined your own function until it accepts following parameters.
     * It is possible to access to the mouse coordinate of event 'mousedown'
     * with 'this.coordDown'.
     * @param {Object} coord Object with 'x' and 'y' fields corresponding to the mouse
     * position on the plot.
     * @param {Event} event Original event fired.
     */
    Plot.prototype.mousemove = function (coord, event) {
        if (this.coordDown === undefined) {
            return;
        }
        var oldCoord = this.coordDown;
        var newCoord = coord;
        if (event.shiftKey) {
            this.updateSelectArea(oldCoord, newCoord);
        } else {
            this.cancelSelectArea();
            this.translateAxis(newCoord.x - oldCoord.x, newCoord.y - oldCoord.y);
        }
    };

    /**
     * Default function called when 'mouseup' event is fired.
     * You can redefined your own function until it accepts following parameters.
     * It is possible to access to the mouse coordinate of event 'mousedown'
     * with 'this.coordDown'.
     * @param {Object} coord Object with 'x' and 'y' fields corresponding to the mouse
     * position on the plot.
     * @param {Event} event Original event fired.
     */
    Plot.prototype.mouseup = function (coord, event) {
        var oldCoord = this.coordDown;
        var newCoord = coord;
        if (event.shiftKey) {
            this.endSelectArea(oldCoord, newCoord);
        } else {
            this.translateAxis(newCoord.x - oldCoord.x, newCoord.y - oldCoord.y);
        }
    };

    /**
     * Default function called when 'mousewheel' event is fired.
     * You can redefined your own function until it accepts following parameters.
     * @param {number} direction  1 or -1 following the wheel direction.
     * @param {Object} coord Object with 'x' and 'y' fields corresponding to the mouse
     * position on the plot.
     * @param {Event} event Original event fired.
     */
    Plot.prototype.mousewheel = function (direction, coord, event) {
        var f = 1 + direction * 0.1;
        this.zoomAxis(coord, f);
    };

    /**
     *  Default function called when 'click' event is fired.
     *  'click' event corresponds to 'mousedown' and 'mouseup' events fired at
     *  the same location.
     *  You can redefined your own function until it accepts following parameters.
     *  It is possible to access to the mouse coordinate of event 'mousedown'
     *  with 'this.coordDown'.
     * @param {Object} coord
     *  Object with 'x' and 'y' fields corresponding to the mouse
     *  position on the plot.
     * @param {Event} event
     *  Original event fired.
     *
     *  // Defined an action when click event occurs
     *  myPlot.click = function (coord, event) {
     *    alert('click at point(' + coord.x + ', ' + coord.y + ').')
     *  };
     */
    Plot.prototype.click = function (coord, event) {
        var c = this.getClosestPoint(coord.x, coord.y, false);
        if (c) {
            this.setCursor(c.x, c.y);
        }
    };

    /**
     * Default function called when an area has been selected.
     * You can redefined your own function until it accepts following parameters.
     * @param {number} x1
     *  x first coordinate.
     * @param {number} y1
     *  y first coordinate.
     * @param {number} x2
     *  x second coordinate.
     * @param {number} y2
     *  y second coordinate.
     *
     * // Defined an action when an area is selected
     * myPlot.selectarea = function (x1, y1, x2, y2) {
     *   alert('You selected area from ('+x1+', '+y1+') to ('+x2+', '+y2+').')
     * };
     */
    Plot.prototype.selectarea = function (x1, y1, x2, y2) {
        this.setAxis([x1, y1, x2, y2]);
    };


    /////////////////////////////////////////////////////////////////////////////////
    //                                 SVG TOOLS                                   //
    /////////////////////////////////////////////////////////////////////////////////

    /** @class Plot.Tools
     * @singleton
     * @private
     */
    var Tools = {};

    /** Creates a svg node.
     * @param {String} type
     * @param {Object} args
     * @return {Object}
     */
    Tools.createSVGNode = function (type, args) {
        type = type.toLowerCase();
        var element = document.createElementNS('http://www.w3.org/2000/svg', type);
        var i;
        for (i in args) {
            if (args.hasOwnProperty(i)) {
                element.setAttributeNS(null, i, args[i]);
            }
        }
        return element;
    };

    /** Creates a svg text node.
     * @param {String} text
     * @param {Object} args
     * @return {Object}
     */
    Tools.createSVGTextNode = function (text, args) {
        var element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        var i;
        for (i in args) {
            if (args.hasOwnProperty(i)) {
                element.setAttributeNS(null, i, args[i]);
            }
        }
        element.appendChild(document.createTextNode(text));
        return element;
    };

    /** Returns the position corresponding to an event
     * @param {Object} e
     * @param {Object} event
     * @return {Array}
     *  Returns an array like : [left, top].
     * @todo
     *  add some details.
     */
    Tools.getPosition = function (e, event) {
        var left = 0;
        var top = 0;

        // Tant que l'on a un élément parent
        while (e.offsetParent !== undefined && e.offsetParent !== null) {
	    // On ajoute la position de l'élément parent
            left += e.offsetLeft + (e.clientLeft !== null ? e.clientLeft : 0);
            top += e.offsetTop + (e.clientTop !== null ? e.clientTop : 0);
            e = e.offsetParent;
        }

        left = -left + event.pageX;
        top = -top + event.pageY;

        return [left, top];
    };

    /** Tests if an Object is a kind of Array.
     * @param {Object} obj
     * @return {Boolean}
     */
    Tools.isArrayLike = function (obj) {
        return obj && typeof obj === 'object' && obj.length !== undefined;
    };

    /** @class Plot.Tools.Vector
     * @private
     *  Class used to deal with array.
     * @constructor
     *  Creates a Vector.
     */
    Tools.Vector = function (arg1, arg2, arg3, arg4) {
        var n, b, s, e, i, a, x;
        if (Tools.isArrayLike(arg1)) {
            n = arg1.length;
            this.data = this.zeros(n, arg4);
            this.index = this.zeros(n, Uint32Array);
            for (i = 0; i < n; i++) {
                this.data[i] = arg1[i];
                this.index[i] = i;
            }
        } else if (arg1 instanceof Tools.Vector) {
            n = arg1.index.length;
            this.data = this.zeros(n);
            this.index = this.zeros(n, Uint32Array);
            i = this.index;
            var d = this.data;
            var ii = arg1.index;
            var id = arg1.data;
            for (x = 0; x < n; x++) {
                d[x] = id[ii[x]];
                i[x] = x;
            }
        } else {
            if (arg1 !== undefined && arg2 !== undefined && arg3 !== undefined) {
                b = arg1;
                s = arg2;
                e = arg3;
            } else if (arg1 !== undefined && arg2 !== undefined && arg3 === undefined) {
                b = arg1;
                s = arg1 < arg2 ? 1 : -1;
                e = arg2;
            } else if (arg1 !== undefined && arg2 === undefined && arg3 === undefined) {
                b = 0;
                s = 0;
                e = arg1;
            }
            if (s !== 0) {
                n = Math.abs(Math.floor((e - b) / s) + 1);
            } else {
                n = Math.abs(Math.floor((e - b)));
            }
            this.data = this.zeros(n, arg4);
            this.index = this.zeros(n, Uint32Array);
            a = b;
            for (i = 0; i < n; i++, a += s) {
                this.data[i] = a.toPrecision(15);
                this.index[i] = i;
            }
        }
        return this;
    };

    /**  Creates a vector filled with zeros.
     * @param {Number} size
     * @param {Object} [constructor=Float64Array]
     */
    Tools.Vector.prototype.zeros = function (n, Type) {
        var out;
        if (!Type) {
            out = new Float64Array(n);
        } else {
            out = new Type(n);
        }
        return out;
    };

    /** Creates a vector of regularly espaced values.
     * @param {Number} begin
     * @param {Number} end
     * @param {Number} number
     */
    Tools.Vector.linearSpace = function (b, e, n) {
        var n1 = Math.floor(n) - 1;
        var c = (e - b) * (n - 2);
        var out = new Tools.Vector(b, (e - b) / n1, e);
        out.data[n - 1] = e;
        return out;
    };

    /** Derive a vector.
     * @param {Number} order
     */
    Tools.Vector.prototype.derive = function (o) {
        o = o || 1;
        var d, i, x, n;
        d = this.data;
        i = this.index;
        n = i.length;
        for (x = 1; x < n; x++) {
            d[i[x - 1]] = d[i[x]] - d[i[x - 1]];
        }
        this.data = this.data.subarray(0, n - 1);
        this.index = this.index.subarray(0, n - 1);
        if (o > 1) {
            this.derive(o - 1);
        }
        return this;
    };

    /** Returns the indice and the value of the maximum.
     * @return {Array}
     * [value, indice]
     */
    Tools.Vector.prototype.max = function () {
        var d, n, x, i, nx;
        d = this.data;
        i = this.index;
        nx = i.length;
        var M = -Infinity;
        var Mind = NaN;
        for (x = 0; x < nx; x++) {
            if (d[i[x]] > M) {
                M = d[i[x]];
                Mind = i[x];
            }
        }
        return new Tools.Vector([M, Mind]);
    };

    /** Returns the indice and the value of the minimum.
     * @return {Array}
     * [value, indice]
     */
    Tools.Vector.prototype.min = function () {
        var d, n, x, i, nx;
        d = this.data;
        i = this.index;
        nx = i.length;
        var M = +Infinity;
        var Mind = NaN;
        for (x = 0; x < nx; x++) {
            if (d[i[x]] < M) {
                M = d[i[x]];
                Mind = i[x];
            }
        }
        return new Tools.Vector([M, Mind]);
    };

    /** Returns a value of the vector.
     * @param {Number} indice
     * @return {Number}
     */
    Tools.Vector.prototype.get = function (i) {
        return this.data[this.index[i]];
    };

    /** Set a value of the vector.
     * @param {Number} indice
     * @chainable
     */
    Tools.Vector.prototype.set = function (i, v) {
        this.data[this.index[i]] = v;
        return this;
    };

    /** Make a HTML element draggable: objects can be dropped on it.
     * @param {HTMLElement|String} element
     *  HTMLElement or HTMLElement id wich is desired to be draggable.
     * @param {Function} callback
     *  Function to be called when files will be drag on element.
     * @param {string} [type='none']
     *  Specify the way of reading the file.<br />
     *  Can be 'DataUrl | url', 'ArrayBuffer | bin | binary', or 'text'.
     *
     *  // Drag callback: load the image
     *  var main = function(result) {
     *      // Load callback: display the image
     *      var callback = function(im) {
     *          im.draw(createView(1, 1));
     *      };
     *      // Load the image
     *      var im = new ImageJS().load(result, callback);
     *  };
     *  // Make the canvas with id 'canvas' draggable
     *  Tools.makeDraggable('canvasId', main);
     */
    Tools.makeDraggable = function (element, callback, type) {

        // Deal with arguments
        type = (type || 'none').toLowerCase();
        switch (type) {
        case 'dataurl':
        case 'url':
            type = 'url';
            break;
        case 'text':
        case 'txt':
            type = 'txt';
            break;
        case 'arraybuffer':
        case 'binary':
        case 'bin':
            type = 'bin';
            break;
        default:
            type = 'none';
        }

        if (typeof element === 'string') {
            element = document.getElementById(element) || element;
        }

        // Callback functions declarations
        var dragEnter, dragLeave, dragOver;
        dragEnter = dragLeave = dragOver = function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
        };

        var drop = function (evt) {
            evt.stopPropagation();
            evt.preventDefault();

            // File handling functions
            var handleFile, newCallback;
            if (type !== 'none') {
                newCallback = function (evt) {
                    if (callback) {
                        callback(evt.target.result, evt);
                    }
                };
                handleFile =  function (file) {
                    var reader = new FileReader();
                    reader.onload = newCallback;
                    switch (type) {
                    case 'url':
                        reader.readAsDataURL(file);
                        break;
                    case 'txt':
                        reader.readAsText(file);
                        break;
                    case 'bin':
                        reader.readAsArrayBuffer(file);
                        break;
                    }
                };
            } else {
                handleFile = function (file) {
                    if (callback) {
                        callback(file);
                    }
                };
            }

            // Only call the handler if 1 or more files was dropped.
            if (evt.dataTransfer.files.length) {
                var i;
                for (i = 0; i < evt.dataTransfer.files.length; i++) {
                    handleFile(evt.dataTransfer.files[i]);
                }
            }
        };

        // Drag Drop on HTML element.
        element.addEventListener('dragenter', dragEnter, false);
        element.addEventListener('dragleave', dragLeave, false);
        element.addEventListener('dragover', dragOver, false);
        element.addEventListener('drop', drop, false);
    };

    Tools.parseCsv = function (csv, vDelim, hDelim, transpose) {

        transpose = transpose || false;
        /*
         var tabRow = csv.split(vDelim);
         var output = [];
         var i;
         for (i = 0; i < tabRow.length; i++) {
         if (/\d/.test(tabRow[i])) {
         output.push(tabRow[i].split(hDelim));
         }
         }
         */
        vDelim = vDelim || "\n";
        var csv = csv.split(vDelim);
        if (csv[csv.length - 1] === "") {
            csv.pop();
        }
        var i, ei;
        var output = [];

        for (i = 0, ei = csv.length; i < ei; i++) {
            output.push(csv[i].match(/[\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?/g));
        }
        return transpose ? Tools.Array.transpose(output) : output;
    };

    Tools.Array = Tools.Array || {};
    Tools.Array.opposite = function (a) {

        var i;
        for (i = 0; i < a.length; i++) {
            if (a[i] instanceof Array) {
                Tools.Array.opposite(a[i]);
            } else {
                a[i] = -a[i];
            }
        }
        return a;
    };

    Plot.prototype.appendTo = function (parent) {

        if (typeof parent === 'string') {
            parent = document.getElementById(parent);
        } else {
            parent = parent || document.body;
        }
        parent.appendChild(this.getDrawing());
        this.autoDisplay();
        return this;
    };

    /** Apply a function to each value of an array or an array of arrays.
     * @param {Array} array
     * @param {Function} f
     *  Function to be applied to each element of the array.
     * @return {Array}
     *  Array of f(t) for all t in the input array.
     */
    Tools.Array.mapRec = function (a, f) {

        var i, N = a.length;
        var aOut = new a.constructor(N);
        for (i = 0; i < N; i++) {
            if (a[i].length !== undefined && typeof a[i] !== 'string') {
                aOut[i] = Tools.Array.mapRec(a[i], f);
            } else {
                aOut[i] = f(a[i]);
            }
        }
        return aOut;
    };


    /** Is a 2D array rectangular?
     * @param {Array} array
     *  An array of arrays.
     * @return {boolean}
     *  True iff all the sub-arrays have the same length.
     */
    Tools.Array.isRectangle = function (a) {

        if (!a || !a.length || a[0].length === undefined) {
            return false;
        }
        var i, N = a.length;
        var P = a[0].length;
        for (i = 1; i < N; i++) {
            if (a[i].length !== P) {
                return false;
            }
        }
        return true;
    };

    /** Transpose an array of arrays.
     * @param {Array} a
     *  Array to be transposed.
     * @return {Array}
     *  Transposed array.
     */
    Tools.Array.transpose = function (a) {
        var errMsg = 'Tools.Array.transpose: ';
        if (!Tools.Array.isRectangle(a)) {
            throw new Error(errMsg + 'cannot transpose a non-rectangular array');
        }
        var i, N = a.length;
        var j, P = a[0].length;
        var aOut = new a.constructor(P);
        for (j = 0; j < P; j++) {
            aOut[j] = new a[0].constructor(N);
            for (i = 0; i < N; i++) {
                aOut[j][i] = a[i][j];
            }
        }
        return aOut;
    };

    /** @class Plot.Tree2d
     * @private
     * Class used to store the node of the plot for fast search.
     * @constructor
     */
    function Tree2d() {
        this.root = null;
    }

    /** Remove all the point from the tree. */
    Tree2d.prototype.clear = function () {
        this.root = null;
    };

    /** Add a point with a data to the tree. */
    Tree2d.prototype.add = function (x, y, i, data) {

        // If it is the first point
        if (!this.root) {
            var size = 1;
            while (!(Math.abs(x) < size && Math.abs(y) < size)) {
                size *= 2;
            }
            while (x && y && Math.abs(x) < size && Math.abs(y) < size) {
                size /= 2;
            }
            var rootX = (x >= 0) ? size : -size;
            var rootY = (y >= 0) ? size : -size;
            this.root = new Tree2d.Node(rootX, rootY, null, null, size);
        }
        // If outside of the BBox
        while (this.root.size && !this.root.hasInBBox(x, y)) {
            var oldSize = this.root.size, newSize = 2 * oldSize;
            var newX = this.root.x;
            var newY = this.root.y;
            newX += (newX < x) ? oldSize : -oldSize;
            newY += (newY < y) ? oldSize : -oldSize;
            var newRoot = new Tree2d.Node(newX, newY, null, null, newSize);
            var we = (this.root.x < newRoot.x) ? "w" : "e";
            var ns = (this.root.y < newRoot.y) ? "s" : "n";
            newRoot[ns + we] = this.root;
            newRoot.length = this.root.length;
            this.root = newRoot;
        }
        // Append a new node
        var node = new Tree2d.Node(x, y, i, data);
        this.root = Tree2d.Node.add(this.root, node, null);
    };

    /** Remove a data from the tree. */
    Tree2d.prototype.remove = function (dataFilter) {

        // Initialize argument
        if (typeof dataFilter !== 'function') {
            var dataRef = dataFilter;
            dataFilter = function (data) {
                return (data === dataRef);
            };
        }

        // Remove the nodes
        this.root = Tree2d.Node.remove(this.root, dataFilter);
    };

    /** Get the number of point in the tree / in a box. */
    Tree2d.prototype.count = function (x, y, w, h) {
        if (!this.root) {
            return 0;
        }
        if (x === undefined) {
            return this.root.length;
        }
        if (h === undefined) {
            var errMsg = this.constructor.name + '.count: ';
            throw new Error(errMsg + 'expected 0 or 4 arguments');
        }
        var xmin = Math.min(x, x + w), xmax = Math.max(x, x + w);
        var ymin = Math.min(y, y + h), ymax = Math.max(y, y + h);
        return this.root.count(xmin, ymin, xmax, ymax);
    };

    /** Find the closest point from x/y in a given radius. */
    Tree2d.prototype.closest = function (x, y, radius, xUnit, yUnit) {
        if (typeof x !== 'number' || typeof y !== 'number') {
            throw new Error(this.constructor.name + '.closest: invalid x, y.');
        }
        // Distance function
        var r = (radius && radius > 0) ? radius * radius : -1;
        var rx = (xUnit) ? xUnit * xUnit : 1;
        var ry = (yUnit) ? yUnit * yUnit : rx;
        var norm = function (dx, dy) {
            return dx * dx / rx + dy * dy / ry;
        };
        // Search function
        var search = function (root) {
            // Empty
            if (!root) {
                return null;
            }
            // Leaf
            if (root.data !== null) {
                var d = norm(x - root.x, y - root.y);
                if (r < 0 || d < r) {
                    r = d;
                    return root;
                }
                return null;
            }
            // Check BB
            var projX = Math.min(Math.max(x, root.x - root.size), root.x + root.size);
            var projY = Math.min(Math.max(y, root.y - root.size), root.y + root.size);
            if (r >= 0 && norm(x - projX, y - projY) > r) {
                return null;
            }
            // Search recursively
            var we = (x < root.x) ? "we" : "ew";
            var ns = (y < root.y) ? "sn" : "ns";
            var node = search(root[ns[0] + we[0]]);
            if (norm(x - root.x, 0) < norm(0, y - root.y)) {
                node = search(root[ns[0] + we[1]]) || node;
                node = search(root[ns[1] + we[0]]) || node;
            } else {
                node = search(root[ns[1] + we[0]]) || node;
                node = search(root[ns[0] + we[1]]) || node;
            }
            node = search(root[ns[1] + we[1]]) || node;
            return node;
        };
        var closest = search(this.root);
        return closest;
    };

    /** Display a tree in a plot/ */
    Tree2d.prototype.plot = function (plot, pointStyle, boxStyle, lineStyle) {
        var draw = function (node, pt, box, line) {
            if (!node || !(pt || box || line)) {
                return;
            }
            draw(node.nw, pt, box, line);
            draw(node.ne, pt, box, line);
            draw(node.sw, pt, box, line);
            draw(node.se, pt, box, line);
            if (node.data !== null && pt) {
                plot.addPath([node.x, node.x], [node.y, node.y], pt);
            }
            if (node.size && box) {
                var x = node.x;
                var y = node.y;
                var d = node.size;
                plot.addPath([x, x], [y - d, y + d], line);
                plot.addPath([x - d, x + d], [y, y], line);
                plot.addPath([x - d, x + d, x + d, x - d, x - d],
                             [y - d, y - d, y + d, y + d, y - d],
                             box);
            }
        };
        pointStyle = pointStyle || !(boxStyle || lineStyle);
        pointStyle = (typeof pointStyle === 'object') ? pointStyle : {'marker': {'shape': 'circle'}};
        boxStyle = (!boxStyle) ? false
            : (typeof boxStyle === 'object') ? boxStyle : {'stroke': 'red'};
        lineStyle = (boxStyle && typeof lineStyle === 'object') ? lineStyle : boxStyle;
        plot.clear();
        draw(this.root, false, boxStyle, lineStyle);
        draw(this.root, pointStyle);
    };

    /** @class Plot.Tree2d.Node
     * @private
     * Class used to create the node of the tree.
     * @constructor
     */
    Tree2d.Node = function (x, y, i, data, size) {
        this.x = x;
        this.y = y;
        this.number = i;
        this.data = data;
        this.length = 1;
        if (data === null) {
            this.length = 0;
            this.size = size;
            this.nw = this.ne = null;
            this.sw = this.se = null;
        }
    };

    /** Add a node. */
    Tree2d.Node.add = function (root, node, prevRoot) {
        // Assume that the node is inside root's bbox
        if (root === null || node === null) {
            return node || root;
        }

        if (root.data !== null) {
            // Leaf with same x/y
            if (root.x === node.x && root.y === node.y) {
                root.datas = root.datas || [root.data];
                root.datas.push(node.data);
                root.length++;
                return root;
            }
            // New leaf
            var newSize = prevRoot.size / 2;
            var newNode = new Tree2d.Node(prevRoot.x, prevRoot.y, null, null, newSize);
            newNode.x += (root.x < prevRoot.x) ? -newNode.size : +newNode.size;
            newNode.y += (root.y < prevRoot.y) ? -newNode.size : +newNode.size;
            Tree2d.Node.add(newNode, root, prevRoot);
            Tree2d.Node.add(newNode, node, prevRoot);
            return newNode;
        }

        // Insert in the right quadrant
        var we = (node.x < root.x) ? "w" : "e";
        var ns = (node.y < root.y) ? "s" : "n";
        root[ns + we] = Tree2d.Node.add(root[ns + we], node, root);
        root.length++;
        return root;
    };

    /** Remove a node. */
    Tree2d.Node.remove = function (node, dataFilter) {
        if (node === null) {
            return null;
        }

        // If it is a leaf
        if (node.data !== null) {
            var newDatas = [], oldDatas = node.datas || [node.data];
            var k, N = oldDatas.length;
            for (k = 0; k < N; k++) {
                if (!dataFilter(oldDatas[k])) {
                    newDatas.push(oldDatas[k]);
                }
            }
            if (!newDatas.length) {
                return null;
            }
            node.datas = (newDatas.length > 1) ? newDatas : [];
            node.data = newDatas[0];
            node.length = newDatas.length;
            return node;
        }

        // It is a node
        node.nw = Tree2d.Node.remove(node.nw, dataFilter);
        node.ne = Tree2d.Node.remove(node.ne, dataFilter);
        node.sw = Tree2d.Node.remove(node.sw, dataFilter);
        node.se = Tree2d.Node.remove(node.se, dataFilter);
        node.length = 0;
        node.length += (node.nw) ? node.nw.length : 0;
        node.length += (node.ne) ? node.ne.length : 0;
        node.length += (node.sw) ? node.sw.length : 0;
        node.length += (node.se) ? node.se.length : 0;
        if (!node.length) {
            return null;
        }

        // If only one child, the node could be removed
        return node;
    };

    /** hasInBBox function. */
    Tree2d.Node.prototype.hasInBBox = function (x, y) {
        return x >= this.x - this.size
            && y >= this.y - this.size
            && x < this.x + this.size
            && y < this.y + this.size;
    };

    /** Counts the number of nodes present in a box. */
    Tree2d.Node.prototype.count = function (xmin, ymin, xmax, ymax) {
        // If it is a leaf
        if (this.data !== null) {
            var x = this.x, y = this.y;
            var inside = (xmin <= x && x <= xmax && ymin <= y && y <= ymax);
            return (inside) ? this.length : 0;
        }
        // If it is a node
        var xminNode = this.x - this.size, xmaxNode = this.x + this.size;
        var yminNode = this.y - this.size, ymaxNode = this.y + this.size;
        // If outside
        if (xmax < xminNode || ymax < yminNode || xmin >= xmaxNode || ymin >= ymaxNode) {
            return 0;
        }
        // If included
        if (xmin <= xminNode && ymin <= yminNode && xmax >= xmaxNode && ymax >= ymaxNode) {
            return this.length;
        }
        // If overlapping
        var sum = 0;
        sum += (this.nw) ? this.nw.count(xmin, ymin, xmax, ymax) : 0;
        sum += (this.ne) ? this.ne.count(xmin, ymin, xmax, ymax) : 0;
        sum += (this.sw) ? this.sw.count(xmin, ymin, xmax, ymax) : 0;
        sum += (this.se) ? this.se.count(xmin, ymin, xmax, ymax) : 0;
        return sum;
    };

    Plot.prototype.addChromaticityDiagram = function (diagram, args) {
        var param = {
            "Planckian locus": true,
            "Daylight locus": true,
            "Spectrum locus": true,
            "Standards illuminants": true,
            "Gamut": true
        };

        var i;
        for (i in args) {
            if (args.hasOwnProperty(i)) {
                param[i] = args[i];
            }
        }

        if (diagram === 'rgY') {
            this.setTitle('CIE rg Diagram', 'r chromaticity', 'g chromaticity');
        } else if (diagram === 'xyY') {
            this.setTitle('CIE xy Diagram', 'x chromaticity', 'y chromaticity');
        } else if (diagram === '1960 uvY') {
            this.setTitle('CIE 1960 uv Diagram', 'u chromaticity', 'v chromaticity');
        } else if (diagram === "1976 u'v'Y") {
            this.setTitle("CIE 1976 u'v' Diagram", "u' chromaticity", "v' chromaticity");
        } else {
            throw new Error('Plot.drawChromaticityDiagram: ' +
                            diagram + ' is not a chromaticity diagram.');
        }

        // Plot properties
        var pLProperties = {
            'id': 'Planckian locus',
            'stroke': 'black',
            'stroke-width': 1
        };
        var sLProperties = {
            'id': 'Spectrum locus',
	    'stroke': 'lightseagreen',
	    'stroke-width': 2,
	    'stroke-dasharray': "5 2"
        };
        var pGProperties = {
            'id': 'Gamut',
            'stroke': 'red',
            'stroke-width': 1
        };
        var sIProperties = {
            'id': 'Standards illuminants',
	    'stroke': 'none',
	    'fill': 'none',
            'marker': {
                'shape': 'circle',
                'fill': 'orange',
                'size': 2,
                'stroke': 'none'
            }
        };

        // Get primaries Data
        var prim = Matrix.CIE.getPrimaries('current', diagram);

        // Get standards illuminants data
        var stdIll = Matrix.CIE.getIlluminantList();
        var xStdIll = [], yStdIll = [];

        var i;
        for (i = stdIll.length; i--; i) {
            var ill = Matrix.CIE.getIlluminant(stdIll[i], diagram);
            xStdIll.push(ill[0]);
            yStdIll.push(ill[1]);
        }

        // Plot spectrum locus
        if (param["Spectrum locus"] === true) {
            var sL = Matrix.CIE.getSpectrumLocus(diagram);
            this.addPath(sL[0], sL[1], sLProperties);
        }
        // Plot planckian locus
        if (param["Planckian locus"] === true) {
            var pL = Matrix.CIE.getPlanckianLocus(diagram);
            this.addPath(pL[0], pL[1], pLProperties);
        }

        // Plot primaries gamut
        if (param["Gamut"] === true) {
            var xPrim = [prim[0], prim[3], prim[6], prim[0]];
            var yPrim = [prim[1], prim[4], prim[7], prim[1]];
            this.addPath(xPrim, yPrim, pGProperties);
        }

        // Plot standards illuminants
        if (param["Standards illuminants"] === true) {
            this.addPath(xStdIll, yStdIll, sIProperties);
        }

        return this;
    };

    Plot.prototype.properties.chromaticityPath = {'id': 'scatter',
                                                  'fill': 'none',
                                                  'stroke': 'none',
                                                  'marker': {'shape': 'circle',
                                                             'size': 0.25,
                                                             'fill': 'blue'}
                                                 };

    Plot.prototype.addChromaticitiesFromRgb = function (r, g, b, args, diagram, wp) {
        diagram = diagram || 'xyY';

        var defaultArgs = this.getProperties('chromaticityPath');
        var i, end;
        for (i in args) {
            if (args.hasOwnProperty(i)) {
                defaultArgs[i] = args[i];
            }
        }
        var N = r.length;
        var data = new Float32Array(N * 3),
            x = data.subarray(0, N),
            y = data.subarray(N, N * 2),
            z = data.subarray(N * 2);

        x.set(r);
        y.set(g);
        z.set(b);

        Matrix.Colorspaces['RGB to ' + diagram](data, N, N, 1, wp);
        this.addPath(x, y, defaultArgs);
        return this;
    };

    Plot.prototype.viewPatch = function (S, n, name, part) {
        'use strict';
        var p = this;
        p.clear();
        var k = S.keypoints[n];
        var patch = k.descriptorsData[name].patch;
        if (part === "norm") {
            patch = patch[part];
            patch = patch.rdivide(patch.max2());
        } else if (part === "RGB") {
            patch = patch[part];
        } else if (part === undefined) {
            patch = phaseNormImage(patch.phase, patch.norm, true, k.orientation);
        }
        patch.toImage(function () {
            //var axis = p.getCurrentAxis();
            p.remove("patch");
            // var shift = this.width / 2;
            // p.addImage(this, k.x - shift, -(k.y - shift), {id: "patch"});
            p.addImage(this, 0, 0, {id: "patch"});
            //p.setAxis(axis);
            p.setAxis();
            p.setTitle(name);
        });
    };

    Plot.prototype.showKeypoints = function (S) {
        'use strict';
        var p = this;
        p.clear();
        S.image.toImage(function () {
            p.addImage(this, 0, 0);
            var scatterProperties = {
                "stroke": "none",
                "marker": {
                    "shape": "circle",
                    "fill": "red",
                    "size": 2
                }
            };

            var x = [], y = [];
            var i, ie;
            for (i = 0, ie = S.keypoints.length; i < ie; i++) {
                x[i] = S.keypoints[i].x;
                y[i] = -S.keypoints[i].y;
            }
            p.addPath(x, y, scatterProperties);
            p.setTitle(S.keypoints.length + " Keypoints");
        });
        return this;
    };

    Plot.prototype.showMatches = function (im1, im2, matches, align) {
        'use strict';
        align = align || 'v';
        var p = this, offset;
        p.clear();

        if (align === 'v') {
            offset = im1.getSize(0);
            im1.toImage(function () {
                p.addImage(this, 0, 0);
                im2.toImage(function () {
                    p.addImage(this, 0, -offset);
                    var m = matches;
                    for (var i = 0; i < m.length; i++) {
                        var k1 = m[i].k1, k2 = m[i].k2;
                        if (m[i].isValid) {
                            p.addPath([k1.x, k2.x], [-k1.y, -offset - k2.y], {id: i, stroke: "lime"});
                        } else {
                            p.addPath([k1.x, k2.x], [-k1.y, -offset - k2.y], {id: i, stroke: "red"});
                        }
                    }
                    // p.setTitle(m.length + " Matches");
                });
            });
        } else {
            offset = im1.getSize(1);
            im1.toImage(function () {
                p.addImage(this, 0, 0);
                im2.toImage(function () {
                    p.addImage(this, offset, 0);
                    var m = matches;
                    for (var i = 0; i < m.length; i++) {
                        var k1 = m[i].k1, k2 = m[i].k2;
                        if (m[i].isValid) {
                            p.addPath([k1.x, k2.x + offset], [-k1.y, -k2.y], {id: i, stroke: "lime"});
                        } else {
                            p.addPath([k1.x, k2.x + offset], [-k1.y, -k2.y], {id: i, stroke: "red"});
                        }
                    }
                    // p.setTitle(m.length + " Matches");
                });
            });
        }
    };

    global.Plot = Plot;

})(global);
