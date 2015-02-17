/*global document console CIE Plot Tools open Matrix Colorspaces */
var CS = Matrix.CIE;
var diagram = "xyY";

var addScatter = false;
var im;
var imModif;

var IMAGE;

function updateOutput(image) {
    "use strict";
    var outputCanvas = $("outputImage");
    var div = $("image");
    var canvasXSize = div.offsetWidth;
    var canvasYSize = div.offsetHeight;
    outputCanvas.width = canvasXSize;
    outputCanvas.height = canvasYSize;
    image.imshow(outputCanvas, "fit");
    outputCanvas.style.marginTop = (div.offsetHeight - outputCanvas.height) / 2;
}

function setImage(im) {
    'use strict';
    imModif = im;
    var dataURL = im.toImage(function () {
        var image = $('workingImage');
        image.setAttributeNS('http://www.w3.org/1999/xlink',
			     'xlink:href', dataURL.src);
    });
}

function illuminantToCCT(input) {
    'use strict';
    var CCT;
    try {
        if (typeof input === 'string') {
            CCT = Matrix.CIE.getIlluminant(input);
            CCT = Matrix.CIE['xyY to CCT'](input);
        } else if (input === 'number') {
            CCT = input;
        } else if (Tools.isArrayLike(input)) {
            CCT = Matrix.CIE['xyY to CCT'](input);
        }
    } catch (x) {
    }
    return CCT;
}

function getWhiteRefRGB() {
    'use strict';
    var chr = [$('ewChr1').value, $('ewChr2').value, 1];
    if (diagram !== 'xyY') {
        chr = Matrix.Colorspaces[diagram + ' to xyY'](chr);
    }
    return Matrix.Colorspaces['xyY to RGB'](chr);
}

function getActualWhiteRGB() {
    'use strict';
    var chr = [$('awChr1').value, $('awChr2').value, 1];
    if (diagram !== 'xyY') {
        chr = Matrix.Colorspaces[diagram + ' to xyY'](chr);
    }
    return Matrix.Colorspaces['xyY to RGB'](chr);
}

function updateError() {
    'use strict';
    var errorElmt = $('angularError');
    var err = angularError(getWhiteRefRGB(), getActualWhiteRGB()) || 0;
    errorElmt.value = err.toFixed(1);
}

function setChromaticity(chr1, chr2, id) {
    'use strict';
    id = id || $('clickAction').value;
    $(id + '1').value = chr1.toFixed(4);
    $(id + '2').value = chr2.toFixed(4);
    updateError();
}

function changeIlluminant(input) {
    'use strict';
    var outputStdIll = $('outputStdIll').value;
    setImage(correctImage(im, input, outputStdIll));

    var inputCCTField = $('inputCCT');
    inputCCTField.value = illuminantToCCT(input);

    var cDiagram = $('chromaticityDiagram').getPlot();

    if (diagram !== 'xyY') {
        input = Matrix.Colorspaces['xyY to ' + diagram](input);
    }
    cDiagram.setCursor(input[0], input[1]);
    setChromaticity(input[0], input[1]);
}

function reset() {
    'use strict';
    setImage(im);
    $('imagePlot').getPlot().setAxis();
}

function exportImage() {
    'use strict';
    var canvas = document.createElement('canvas');
    imModif.imshow(canvas);
    open(canvas.toDataURL());
}

function plotScatter(x1, y1, x2, y2) {
    'use strict';
    var min = Math.min, max = Math.max, round = Math.round;
    x1 = round(x1);
    y1 = round(y1);
    x2 = round(x2);
    y2 = round(y2);

    var subIm = im.get([min(-y1, -y2), max(-y1, -y2)], [min(x1, x2), max(x1, x2)]);
    var points = [
        subIm.get([], [], 0).getData(),
        subIm.get([], [], 1).getData(),
        subIm.get([], [], 2).getData()
    ];

    var p = $('chromaticityDiagram').getPlot();
    if (!addScatter) {
        while (p.remove('scatter')) {
	    // Do nothing
        }
    }
    p.addChromaticitiesFromRgb(points[0], points[1], points[2], {}, diagram);
}

function callback(image) {
    'use strict';
    im = image.im2double();
    $('inputStdIll').selectedIndex = 5; // D65
    $('outputStdIll').selectedIndex = 5; // D65
    var imagePlot = $('imagePlot').getPlot().clear();
    image.toImage(function () {
        imagePlot.addImage(this, 0, 0, {id: 'workingImage'});
        imagePlot.selectarea = plotScatter;
    });
}

var out;
var applyPPL = function (event) {
    'use strict';
    function plotIsoCCTLines(p, diagram, t, dist) {
        "use strict";
        var i, color = "blue";
        var u1 = [], u2 = [], v1 = [], v2 = [];
        for (i = 0; i < t.length; i++) {
            var l = Matrix.CIE.getIsoCCTLine(t[i], dist, diagram);
            p.addPath(l.x, l.y, {"class": "CCT", stroke: color, "stroke-width": 0.5});
            u1.push(l.x[0]);
            u2.unshift(l.x[1]);
            v1.push(l.y[0]);
            v2.unshift(l.y[1]);
        }
        var u = u1.concat(u2), v = v1.concat(v2);
        u.push(u[0]);
        v.push(v[0]);
        p.addPath(u, v, {stroke: color, "stroke-width": 0.5});
    }

    var p = {
        k: parseFloat($("k").value),
        delta: parseFloat($("delta").value),
        bins : parseFloat($("bins").value),
        s: parseFloat($("threshold").value)
    };


    console.log("Applying the algorithm with parameters : k = ", p.k, "delta = ", p.delta, "bins = ", p.bins, "s = ", p.s);
    Tools.tic();
    console.profile();
    out = im.miredHistogram(p);
    console.profileEnd();
    console.log("Time needed:", Tools.toc());


    var t1 = Matrix.ldivide(out.scale, 1e6).getData();
    var cDiagram = $('chromaticityDiagram').getPlot();
    plotIsoCCTLines(cDiagram, diagram, t1, p.delta);
    var h = $('histogram').getPlot();
    h.clear();
    h.addHistogram(out.scale.getData(), out.histogramWeighted.getData(), {'fill-opacity': 0.33});

    var colorsName = [
        "red", "lime", "blue", "yellow",
        "fuchsia", "aqua", "olive", "purple",
        "teal", "maroon", "green", "navy",
        "black", "gray", "sylver"
    ];

    var i;
    $("modesList").innerHTML = "";
    for (i = 1; i < out.modes.length; i++) {
        var c = colorsName[i - 1];
        var m = out.modes[i];
        h.drawMode(out.histogramWeighted, out.scale, m, c);
        addOption("modesList", i, c.toUpperCase());
    }
    $("modesList").addEventListener("change", function () {chooseIlluminant(parseInt(this.value));})
    var chooseIlluminant = function (i) {
        var inputIll = out.modes[i].illxy;
        changeIlluminant(inputIll);
    };
    chooseIlluminant(1);
};

var eventsFunc =  {
    param: {
        onChangeDiagram: function (event) {
            'use strict';
            diagram = this.value;
            var cDiagram = $('chromaticityDiagram').getPlot();
            cDiagram.clear();
            cDiagram.addChromaticityDiagram(diagram).setXLabel().setYLabel().setTitle();
            cDiagram.remove("Spectrum locus");
            cDiagram.remove("Standards illuminants");
            cDiagram.setLegend('ne');
            cDiagram.setTitle();

        },
        onChange: function (event) {
            'use strict';
            if (event.which === 13) {
                im.load(libPath + this.value + '.png', callback);
            }
        },
        onChangeWBAlgo: function (event) {
            'use strict';
            var inputIll;
            if (this.value === "mired") {
                var out = im.miredHistogram();
                inputIll = out.modes[0].illxy;
            } else {
                var cc = im.colorConstancy(this.value);
                inputIll = cc.getData();
                inputIll = Matrix.Colorspaces['RGB to xyY'](inputIll);
                inputIll[2] = 1;
            }
            changeIlluminant(inputIll);
        },
        onChangeInputCCT: function (event) {
            'use strict';
            if (event.which === 13) {
                var tIn = parseInt(this.value, 10);
                changeIlluminant(tIn);
            }
        },
        onChangeStdIll: function (event) {
            'use strict';
            var inputStdIll = $('inputStdIll');
            var inputIll = Matrix.CIE.getIlluminant(inputStdIll.value);
            changeIlluminant(inputIll);
        }
    },
    click: {
        clickDiagram: function (coord) {
            'use strict';
            var pos = [coord.x, coord.y, 1];
            if (diagram !== 'xyY') {
                pos = Matrix.Colorspaces[diagram + ' to xyY'](pos);
            }
            changeIlluminant(pos);
        }
    },
    select: {
        clickImage:  function (coord) {
            'use strict';
            var x = Math.round(coord.x);
            var y = Math.round(-coord.y);
            var rgb = [
                im.get(y, x, 0).getData()[0],
                im.get(y, x, 1).getData()[0],
                im.get(y, x, 2).getData()[0]
            ];
            var xyY = Matrix.Colorspaces['RGB to xyY'](rgb);
            xyY[2] = 1;
            changeIlluminant(xyY);
            if (diagram !== 'xyY') {
                xyY = Matrix.Colorspaces['xyY to ' + diagram](xyY);
            }
        }
    }
};

function startUI() {
    'use strict';
    // UI default parameters and events
    var param = eventsFunc.param;
    var diagramElement = $('diagram');
    diagramElement.addEventListener('click', param.onChangeDiagram, false);
    diagramElement.selectedIndex = 1; // xyY

    var wbAlgo = $('wbAlgo');
    wbAlgo.addEventListener('click', param.onChangeWBAlgo, false);

    var inputCCTField = $('inputCCT');
    inputCCTField.addEventListener('keypress', param.onChangeInputCCT,
				    false);

    var inputStdIll = $('inputStdIll');
    inputStdIll.addEventListener('click', param.onChangeStdIll, false);
    inputStdIll.selectedIndex = 5; // D65

    var outputStdIll = $('outputStdIll');
    outputStdIll.addEventListener('click', param.onChangeStdIll, false);
    outputStdIll.selectedIndex = 5; // D65

    var ill = Matrix.CIE.getIlluminant('current', diagram);
    setChromaticity(ill[0], ill[1], 'awChr');
}

var resize = function () {
    "use strict";
    var imagePlot = $('imagePlot').getPlot();
    var p = $('chromaticityDiagram').getPlot();
    var pH = $('histogram').getPlot();
    imagePlot.setWidth($('left').clientWidth);
    imagePlot.setHeight($('left').clientHeight);
    p.setWidth($('right').clientWidth)
    p.setHeight($('right').clientHeight / 2);
    pH.setWidth($('right').clientWidth);
    pH.setHeight($('right').clientHeight / 2);
};

window.onload = function () {
    "use strict";
    startUI();

    // Image Plot
    var width = 500;
    var height = 400;
    var plotProperties = {
        'ticks-display': false,
        'preserve-ratio': true
    };
    $S("right").verticalAlign = 'top';

    var imagePlot = new Plot('imagePlot', [$('left').clientWidth, $('left').clientHeight], 'left', plotProperties);
    imagePlot.click = eventsFunc.select.clickImage;
    // Diagram Plot
    plotProperties = {
        'ticks-display': false,
        'preserve-ratio': true,
        'legend-display': 'none'
    };
    var p = new Plot('chromaticityDiagram', [$('right').clientWidth, $('right').clientHeight / 2], 'right', plotProperties);
    p.addChromaticityDiagram(diagram).setXLabel().setYLabel().setTitle();

    p.remove("Standards illuminants");
    p.remove("Spectrum locus");

    plotProperties = {
        'ticks-display': false,
        'preserve-ratio': false,
        'legend-display': 'none'
    };
    var pH = new Plot('histogram',
                      [$('right').clientWidth, $('right').clientHeight / 2], 'right', plotProperties);

    // Click on diagram
    p.click = eventsFunc.click.clickDiagram;
    p.setLegend();

    document.body.onresize = resize;

    var inputs = document.getElementsByTagName('input');
    var focus = function () {
        this.focus();
    };
    var i;
    for (i = 0; i < inputs.length; i++) {
        if (inputs[i].type == 'range') {
            inputs[i].addEventListener('click', focus);
        }
    }

    $("applyPPL").addEventListener("click", applyPPL);

    var read = function (evt) {

        var callback2 = function (evt) {
            im = Matrix.imread(this, callback);
            fieldset.show("PPL");
            $("modesList").innerHTML = "";
        };

        // Only call the handler if 1 or more files was dropped.
        if (this.files.length) {
            var i;
            for (i = 0; i < this.files.length; i++) {
                readFile(this.files[i], callback2, "url");
            }
        }

    };
    $("loadFile").addEventListener("change", read, false);

    hideFieldset();

    // Add some examples
    for (i = 1; i <= 10; i++) {
        addOption("examples", "ppl/"+i+".png", "Example " + i);
    }
    $("examples").addEventListener("click", function () {
        im = Matrix.imread(this.value, callback);fieldset.show("PPL");$("modesList").innerHTML = "";});
};

Plot.prototype.drawMode = function (h, s, m, c) {
    "use strict";
    var nBin = h.numel();
    var hm = Matrix.zeros(nBin, 1);

    var a = Math.round(m.bins[0]), b = Math.round(m.bins[1]);
    var sum;
    if (b >= a) {
        sum = h.get([a, b]).sum()["./"](b - a + 1);
        hm.set([a, b], sum);
        this.addHistogram(s.getData(), hm.getData(), {fill: c, "fill-opacity": 0.33});
    } else {
        sum = h.get([a, -1]).sum();
        sum["+="](h.get([0, b]).sum());
        sum["/="](nBin - a + b + 1);
        hm.set([a, -1], sum);
        hm.set([0, b], sum);
        this.addHistogram(s.getData(), hm.getData(), {fill: c, "fill-opacity": 0.33});
    }
};

function bin2color(im, c) {
    "use strict";
    var R = im[".*"](c[0]), G = im[".*"](c[1]), B = im[".*"](c[2]);
    return R.cat(2, G, B);
}

