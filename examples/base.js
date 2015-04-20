/*global console, document, Matrix, Colorspaces, CIE, open, ScaleSpace, extractModes, Blob, URL, window, FileReader */
/*jshint indent: 4, unused: true, white: true */

var $ = function (id) {
    'use strict';
    return document.getElementById(id);
};

var $S = function (id) {
    'use strict';
    return document.getElementById(id).style;
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
    case 'video/mp4':
    case 'video/ogg':
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

var addOption = function (select, value, text) {
    'use strict';
    var option = document.createElement('option');
    option.setAttribute('value', value);
    option.innerHTML = text;

    select = ($(select) || select).appendChild(option);
};
