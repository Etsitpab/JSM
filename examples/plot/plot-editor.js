/*global console, Tools, document, FileReader, Plot*/
var filesData = [];

var plot;
var $ = function () {
    'use strict';
    return document.getElementById.apply(document, arguments);
};
function updateOutput() {
    "use strict";
    var div = $("image");
    var canvasXSize = div.offsetWidth;
    var canvasYSize = div.offsetHeight;
    plot.setWidth(canvasXSize);
    plot.setHeight(canvasYSize);
}

function resetCurvesIdsList() {
    'use strict';
    var select = document.getElementById("curvesIds");
    if (select.hasChildNodes()) {
        while (select.childNodes.length > 0) {
            select.removeChild(select.firstChild);
        }
    }
    var option = document.createElement('option');
    option.text = "New";
    select.appendChild(option);

    var ids = plot.getCurvesIds();
    var i;
    for (i = 0; i < ids.length; i++) {
        option = document.createElement('option');
        option.setAttribute('value', ids[i]);
        option.text = ids[i];
        select.appendChild(option);
    }
}

function selectCurve(id) {
    'use strict';
    var select = document.getElementById("curvesIds");

    var i;
    for (i = 0; i < select.length; i++) {
        if (id === select.item(i).value) {
            select.item(i).selected = 'selected';
        }
    }
}

function changeLineProperty(elementId, property, isMarker) {
    'use strict';
    var id = document.getElementById("curvesIds").value;
    if (id === 'new') {
        return;
    }
    var value = document.getElementById(elementId).value;

    plot.setCurveProperty(id, property, value);
    if (property === 'id') {
        resetCurvesIdsList();
        selectCurve(value);
    }
}

function changeMarkerProperty(elementId, property, isMarker) {
    'use strict';
    var id = document.getElementById("curvesIds").value;
    if (id === 'new') {
        return;
    }
    var value = document.getElementById(elementId).value;
    plot.setCurveMarkerProperty(id, property, value);
}

function remove() {
    'use strict';
    var id = document.getElementById("curvesIds").value;
    if (id === 'new') {
        return;
    }
    plot.remove(id);
    resetCurvesIdsList();
}

function restart() {
    'use strict';
    plot.clear();
    plot.setTitle('', '', '');
}

function setTitle() {
    'use strict';
    var title = document.getElementById("title");
    plot.setTitle(title.value);
}

function setXLabel() {
    'use strict';
    var xLabel = document.getElementById("xLabel");
    plot.setXLabel(xLabel.value);
}

function setYLabel() {
    'use strict';
    var yLabel = document.getElementById("yLabel");
    plot.setYLabel(yLabel.value);
}

function setDisplayTicks() {
    'use strict';
    var select = document.getElementById("displayTicks");
    plot.setOwnProperty('ticks-display', select.value === 'yes' ? true : false);
}

function setDisplayAxis() {
    'use strict';
    var select = document.getElementById("displayAxis");
    plot.setOwnProperty('axis-display', select.value);
}

function setPreserveRatio() {
    'use strict';
    var select = document.getElementById("preserveRatio");
    plot.setOwnProperty('preserve-ratio', select.value === 'yes' ? true : false);
}

function setWidth() {
    'use strict';
    var text = document.getElementById("width");
    plot.setWidth(text.value);
}

function setHeight() {
    'use strict';
    var text = document.getElementById("height");
    plot.setHeight(text.value);
}

function addChromaticityDiagram() {
    'use strict';
    var select = document.getElementById("chromaticityDiagram");
    plot.addChromaticityDiagram(select.value);
    resetCurvesIdsList();
}

function setLegend() {
    'use strict';
    var select = document.getElementById("displayLegend");
    plot.setOwnProperty('legend-display', select.value);
}


function getPathProperties() {
    'use strict';
    var properties = {};
    var nPlot = plot.getOwnProperty('auto-id-number');
    if ($('lineStrokeColor').value !== 'auto') {
        properties.stroke = $('lineStrokeColor').value;
    }

    if ($('markerShape').value !== 'none') {
        properties.marker = {};
        properties.marker.shape = $('markerShape').value;
        properties.marker.size = $('markerSize').value;
        if ($('markerFillColor').value !== 'auto') {
            properties.marker.fill = $('markerFillColor').value;
        }
        properties.marker.stroke = 'none';
    }

    properties['stroke-dasharray'] = $('lineStyle').value;
    properties['stroke-width'] = $('lineWidth').value;

    return properties;
}

var print = function () {
    $('default-plot').getPlot().print();
};

var DATA = [];

window.onload = function () {
    'use strict';
    var fieldsets = initFieldset();
    fieldsets.hideAll();

    plot = new Plot('default-plot', [512, 512], 'image');

    var read = function (evt) {
        var callback = function (evt, type) {
            switch (type) {
            case 'url':
                filesData.push(this);
                plot.addImage(this);
                resetCurvesIdsList();
                break;
            case 'txt':
                filesData.push(this);
                var auto = $('lineStrokeColor').value === 'auto' || $('markerFillColor').value === 'auto';
                DATA.push(this);
                plot.displayCsv(this, undefined, auto, getPathProperties());
                resetCurvesIdsList();
                break;
            default:
                throw new Error(file.type);
            }
        };
        
        // Only call the handler if 1 or more files was dropped.
        if (this.files.length) {
            var i;
            for (i = 0; i < this.files.length; i++) {
                readFile(this.files[i], callback);
            }
        }
    };

    $("loadFile").addEventListener("change", read, false);

    // Tools.makeDraggable(document, callback);
    plot.click = function (coord, event) {
        if (!this.getOwnProperty('compute-closest')) {
            return;
        }
        var c = this.getClosestPoint(coord.x, coord.y, false);
        if (c) {
            console.log('Selected point: ' + c.x + ', ' + c.y);
            plot.setCursor(c.x, c.y);
            selectCurve(c.data.getAttributeNS(null, 'id'));
        }
    };
    updateOutput();
    document.body.onresize = updateOutput;

}
