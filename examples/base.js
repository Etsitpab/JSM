/*global console, document, Matrix, Colorspaces, CIE, open, ScaleSpace, extractModes, Blob, URL, window, FileReader */
/*jshint indent: 4, unused: true, white: true */

var $ = function (id) {
    'use strict';
    return document.getElementById(id);
};

var $S = function (id, f, v) {
    'use strict';
    if (!f && !v) {
        return document.getElementById(id).style;
    }
    if (v === undefined) {
        return document.getElementById(id).style[f];
    }
    document.getElementById(id).style[f] = v;
};

var $V = function (id, v) {
    'use strict';
    if (v === undefined) {
        return document.getElementById(id).value;
    }
    document.getElementById(id).setAttribute("value", v);
};

var $I = function (id, v) {
    'use strict';
    if (v === undefined) {
        return parseInt(document.getElementById(id).value, 10);
    }
    document.getElementById(id).value = v;
};

var $F = function (id, v) {
    'use strict';
    if (v === undefined) {
        return parseFloat(document.getElementById(id).value);
    }
    document.getElementById(id).value = v;
};

function hideFieldset() {
    "use strict";
    var i, ei;
    var legends = document.getElementsByTagName("legend");

    var hide = function (f) {
        var toHide = ($(f) || this).childNodes;
        for (i = 0, ei = toHide.length; i < ei; i++) {
            if (toHide[i].tagName !== "LEGEND" && toHide[i].style) {
                toHide[i].style.display = "none";
            }
        }
    };
    var show = function (f) {
        var toHide = ($(f) || this).childNodes;
        for (i = 0, ei = toHide.length; i < ei; i++) {
            if (toHide[i].tagName !== "LEGEND" && toHide[i].style) {
                toHide[i].style.display = "";
            }
        }
    };
    var hideAll = function () {
        var i, ei;
        for (i = 0, ei = legends.length; i < ei; i++) {
            hide.bind(legends[i].parentNode)();
        }
    };
    hideAll();

    window.fieldset = {
        hide: hide,
        show: show,
        hideAll: hideAll
    };

    var f = function () {
        hideAll();
        show.bind(this.parentNode)();
    };

    for (i = 0, ei = legends.length; i < ei; i++) {
        legends[i].addEventListener("click", f);
    }
}

var readFile = function (file, callback, type) {
    'use strict';
    // Deal with arguments
    type = (file.type || type).toLowerCase();
    // File handling functions
    var reader = new FileReader();
    reader.onload = function (evt) {
        callback = callback.bind(evt.target.result);
        callback(evt, type);
    };
    switch (type) {
    case 'image/jpeg':
    case 'image/png':
    case 'dataurl':
    case 'url':
        type = 'url';
        reader.readAsDataURL(file);
        break;
    case 'text/csv':
    case 'text/plain':
    case 'text':
    case 'txt':
        type = 'txt';
        reader.readAsText(file);
        break;
    case 'arraybuffer':
    case 'binary':
    case 'bin':
        type = 'bin';
        reader.readAsArrayBuffer(file);
        break;
    default:
        throw new Error("readFile: unknown type " + type + ".");
    }
};

navigator.sayswho = (function(){
    var ua = navigator.userAgent, tem,
        M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])){
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return 'IE '+(tem[1] || '');
    }
    if (M[1] === 'Chrome'){
        tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
        if (tem != null) {
            return tem.slice(1).join(' ').replace('OPR', 'Opera');
        }
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/(\d+)/i)) !== null) {
        M.splice(1, 1, tem[1]);
    } 
    return M.join(' ').toLowerCase();
})();

var addOption = function (select, value, text) {
    'use strict';
    var option = document.createElement('option');
    option.setAttribute('value', value);
    option.innerHTML = text;
    select = ($(select) || select).appendChild(option);
};

var createFieldset = function (title, properties) {
    "use strict";
    var fs = document.createElement("fieldset");
    var legend = document.createElement("legend");
    var properties = [
        "Rotation",
        {id: "rotation", range: [0, 1, 3]},
        "x1, x2",
        {id: "x1", range: [0, 1e-3, 1, 0]},
        {id: "x2", range: [0, 1e-3, 1, 1]},
        "y1, y2",
        {id: "y1", range: [0, 1e-3, 1, 0]},
        {id: "y2", range: [0, 1e-3, 1, 1]},
        "",
        {id: "applyCrop", button: "Apply"},
        {id: "resetCrop", button: "Reset"},
    ];
    var properties = [
        "Channels",
        {
            id: "channels_contrast",
            select: ["[]", "ALL", "[0]", "RED", "[1]", "GREEN","[2]", "BLUE"]
        },
        "Gamma",
        {id: "gamma", range: [0.2, 0.01, 4, 1]},
        "Brightness",
        {id: "brightness", range: [0, 0.01, 1, 0.5]},
        "Contrast",
        {id: "contrast", range: [0, 0.01, 1, 0.5]},
        "Equalization",
        {
            id: "histeq_contrast",
            select: ["no", "NO", "uniform", "UNIFORM"]
        },
        "",
        {id: "applyContrast", button: "Apply"},
        {id: "resetContrast", button: "Reset"},
    ];
};
