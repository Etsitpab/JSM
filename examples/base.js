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

var initInputs = function () {
    var inputs = document.getElementsByTagName('input');
    var focus = function () {
        this.focus();
    };
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].type == 'range') {
            inputs[i].addEventListener('click', focus);
        }
    }
};
(function () {
    var readFile = function (file, callback) {
        'use strict';
        // Deal with arguments
        var type = (file.type || "bin").toLowerCase();
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
        case 'application/x-director':
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
    window.initFileUpload = function (id, callback, callbackInit) {
        var read = function (evt) {
            if (callbackInit) {
                callbackInit(evt);
            }
            // Only call the handler if 1 or more files was dropped.
            if (this.files.length) {
                var i;
                for (i = 0; i < this.files.length; i++) {
                    readFile(this.files[i], callback);
                }
            }
        };
        $(id).addEventListener("change", read, false);
    };
})();
var limitImageSize = function (image, MAX_SIZE) {
    var maxSize = Math.max(image.size(0), image.size(1));
    if (maxSize > MAX_SIZE) {
        console.warn("Image size > %d, image resized.", MAX_SIZE);
        var canvas = document.createElement("canvas");
        image.imshow(canvas, MAX_SIZE / maxSize);
        image = Matrix.imread(canvas).im2double();
    }
    return image;
}



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

var initHelp = function () {
    "use strict";
    var displayHelp = function () {
        if ($S("help", "display") === "block") {
            $S("help", "display", "none");
            if ($("loadFile")) {
                $("loadFile").focus();
            }
        } else {
            $S("help", "display", "block");
            $("closeHelp").focus();
        }
    };
    $("displayHelp").addEventListener('click', displayHelp);
    $("closeHelp").addEventListener('click', displayHelp);
    return displayHelp;
};

var drawImageHistogram = function (id, image) {
    // Histograms
    if (image.size(2) === 3) {
        var red_hist = image.get([], [], 0).imhist();
        var green_hist = image.get([], [], 1).imhist();
        var blue_hist = image.get([], [], 2).imhist();
        var grey_hist = image.rgb2gray().imhist();
        var M = Math.max(red_hist.max().getDataScalar(), green_hist.max().getDataScalar(),
                         blue_hist.max().getDataScalar(), grey_hist.max().getDataScalar());
        $("histogram").drawHistogram(red_hist.getData(), M, "", undefined, 'red');
        $("histogram").drawHistogram(green_hist.getData(), M, "", undefined, 'green', false);
        $("histogram").drawHistogram(blue_hist.getData(), M, "", undefined, 'blue', false);
        $("histogram").drawHistogram(grey_hist.getData(), M, "", undefined, 'grey', false);
    } else {
        var hist = image.imhist();
        $("histogram").drawHistogram(hist.getData(), hist.max().getData(), "", undefined, 'grey');
    }
};

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

