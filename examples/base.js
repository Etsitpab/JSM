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

function initFieldset() {
    "use strict";
    var i, ei;
    var legends = document.getElementsByTagName("legend");
    var fieldset = document.getElementsByTagName("fieldset");

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
    var currentFieldset;
    var f = function () {
        hideAll();
        if (currentFieldset && currentFieldset.close) {
            currentFieldset.close();
        };
        currentFieldset = this.parentNode
        show.bind(currentFieldset)();
        if (currentFieldset && currentFieldset.open) {
            currentFieldset.open();
        };
    };

    for (i = 0, ei = legends.length; i < ei; i++) {
        legends[i].addEventListener("click", f);
    }

    for (i = 0, ei = fieldset.length; i < ei; i++) {
        if (legends[i]) 
        legends[i].addEventListener("click", f);
    }
    return {
        hide: hide,
        show: show,
        hideAll: hideAll
    };
}

var setElementOpacity = function (id, min, max) {
    'use strict';
    $(id).style.opacity = min;
    $(id).addEventListener("mouseover", function () {
        this.style.opacity = max;
    });
    $(id).addEventListener("mouseout", function () {
        this.style.opacity = min;
    });
    
};

var initInputs = function () {
    'use strict';
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
    'use strict';
    var readFile = function (file, callback) {
        // Deal with arguments
        var type = (file.type || "bin").toLowerCase();
        // File handling functions
        var reader = new FileReader();
        reader.onload = function (evt) {
            callback.bind(evt.target.result)(evt, type, file);
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
    "use strict";
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

var drawImageHistogram = function (id, image, bins) {
    var computeHistograms = function (image, bins) {
        bins = bins || 256;
        var data = image.getData();
        var size = image.size(), nPixels = size[0] * size[1];
        var hist = Matrix.zeros(bins, 1), hd = hist.getData();
        var R = data.subarray(0, nPixels),
            G = data.subarray(nPixels, 2 * nPixels),
            B = data.subarray(2 * nPixels, 3 * nPixels);
        var histR = Matrix.zeros(bins, 1), hrd = histR.getData(),
            histG = Matrix.zeros(bins, 1), hgd = histG.getData(),
            histB = Matrix.zeros(bins, 1), hbd = histB.getData(),
            hist = Matrix.zeros(bins, 1), hd = hist.getData();
        
        var i, ie, cst = bins, cst2 = bins / 3;
        for (i = 0, ie = nPixels; i < ie; i++) {
            var iR = R[i], iG = G[i], iB = B[i],
                iGray = iR + iG + iB;
            if (iR < 0) {
                hrd[0]++;
            } else if(iR >= 1) {
                hrd[bins - 1]++;
            } else { 
                hrd[iR * cst | 0]++;
            }
            if (iG < 0) {
                hgd[0]++;
            } else if(iG >= 1) {
                hgd[bins - 1]++;
            } else { 
                hgd[iG * cst | 0]++;
            }
            if (iB < 0) {
                hbd[0]++;
            } else if(iB >= 1) {
                hbd[bins - 1]++;
            } else { 
                hbd[iB * cst | 0]++;
            }
            if (iGray < 0) {
                hd[0]++;
            } else if(iGray >= 3) {
                hd[bins - 1]++;
            } else { 
                hd[(iGray * cst2) | 0]++;
            }
        }
        var M = Math.max(
            histR.max().getDataScalar(),
            histG.max().getDataScalar(),
            histB.max().getDataScalar(),
            hist.max().getDataScalar()
        );
        return {
            R: histR.getData(),
            G: histG.getData(),
            B: histB.getData(),
            gray: hist.getData(),
            max: M
        };
    };
    var cnv = $(id);
    Tools.tic();
    // Histograms
    if (image.size(2) === 3) {
        var histograms = computeHistograms(image);
        var max = histograms.max;
        cnv.drawHistogram(histograms.R, max, "", undefined, 'red');
        cnv.drawHistogram(histograms.G, max, "", undefined, 'green', false);
        cnv.drawHistogram(histograms.B, max, "", undefined, 'blue', false);
        cnv.drawHistogram(histograms.gray, max, "", undefined, 'grey', false);
    } else {
        var hist = image.imhist();
        cnv.drawHistogram(hist.getData(), hist.max().getData(), "", undefined, 'grey');
    }
    console.log("Histogram plotted in", Tools.toc(), "ms");
};

var addOption = function (select, value, text) {
    'use strict';
    var option = document.createElement('option');
    option.setAttribute('value', value);
    option.innerHTML = text;
    select = ($(select) || select).appendChild(option);
    return option;
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

