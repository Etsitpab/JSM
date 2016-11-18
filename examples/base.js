/*jshint indent: 4, unused: true, white: true */
/*global console, document, Matrix, Colorspaces, CIE, open, ScaleSpace, extractModes, Blob, URL, window, FileReader */

var $ = function (id) {
    'use strict';
    if (id instanceof HTMLElement) {
        return id;
    }
    return document.getElementById(id);
};

var $S = function (id, f, v) {
    'use strict';
    if (!f && !v) {
        return $(id).style;
    }
    if (v === undefined) {
        return $(id).style[f];
    }
    $(id).style[f] = v;
};

var $V = function (id, v) {
    'use strict';
    if (v === undefined) {
        return $(id).value;
    }
    $(id).setAttribute("value", v);
};

var $I = function (id, v) {
    'use strict';
    if (v === undefined) {
        return parseInt($(id).value, 10);
    }
    $(id).value = v;
};

var $F = function (id, v) {
    'use strict';
    if (v === undefined) {
        return parseFloat($(id).value);
    }
    $(id).value = v;
};

var $M = function (a, shape) {
    var mat = Matrix.toMatrix(a);
    if (shape) {
        return mat.reshape(shape);
    }
    return mat;
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
        if (legends[i]) {
        	legends[i].addEventListener("click", f);
        }
    }
    return {
        hide: hide,
        show: show,
        hideAll: hideAll
    };
};

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

var initFileUpload = (function () {
    'use strict';
    var readFile = function (file, callback, callbackEnd) {
        // Deal with arguments
        var type = (file.type || "bin").toLowerCase();
        // File handling functions
        var reader = new FileReader();
        reader.onload = function (evt) {
            callback.bind(evt.target.result)(evt, type, file);
            if (callbackEnd instanceof Function) {
                callbackEnd();
            }
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
        case 'image/adoberawdng':
        case 'application/x-director':
        case 'image/x-adobe-dng':
        case 'image/tiff':
        case 'arraybuffer':
        case 'binary':
        case 'bin':
          type = 'bin';
          reader.readAsArrayBuffer(file);
          break;
        default:
            console.warn("readFile: unknown type " + type + ". Will be read as binary.");
          type = 'bin';
          reader.readAsArrayBuffer(file);
            //throw new Error("readFile: unknown type " + type + ".");
        }
    };
    return function (id, callback, callbackInit, callbackEnd) {
        var read = function (evt) {
            if (callbackInit) {
                callbackInit(evt);
            }
            // Only call the handler if 1 or more files was dropped.
            if (!this.files.length) {
                return;
            }
            var i = 0, files = this.files;
            var readNextFile = function () {
                var endfun;
                if (i < files.length - 1) {
                    endfun = function () {
                        i++;
                        readNextFile();
                    };
                } else if (i === files.length - 1) {
                    endfun = callbackEnd;
                }
                readFile(
                    files[i],
                    function(evt, type, file) {
                        callback.bind(this)(evt, type, file);
                    },
                    endfun
                );
            };
            readNextFile();
        };
        $(id).addEventListener("change", read, false);
    };
})();

var UI = class UI {

    contructor(parent) {
        this.parent = $(parent) || parent;
    };

    createRange(values, def, onChange, id) {
        var input = document.createElement("input");
        input.setAttribute("type", "range");
        input.setAttribute("id", id);
        input.setAttribute("min", 0);
        input.setAttribute("step", 1);
        input.setAttribute("max", values.length - 1);
        input.setAttribute("class", "val2");

        var text = document.createElement("input");
        text.setAttribute("id", id + "Val");
        text.setAttribute("class", "val2");
        text.setAttribute("type", "text");

        var updateText = function () {
            text.value = values[input.value].toFixed(4);
        };
        input.setValue = function (def) {
            if (def === undefined) {
                input.value = Math.floor(values.length / 2);
            } else {
                input.value = $M(values)["-"](def).abs().amin().getDataScalar();
            }
            updateText()
        };
        input.setValue(def);

        input.addEventListener("change", function () {
            updateText();
            onChange.bind(input)(input);
        });
        $(this.parent).appendChild(input);
        $(this.parent).appendChild(text);
        return input;
    };

    createButton(value, onMouseDown, onMouseUp, id) {
        var input = document.createElement("input");
        input.setAttribute("type", "button");
        input.setAttribute("id", id);
        input.setAttribute("value", value);
        input.addEventListener("mousedown", onMouseDown);
        input.addEventListener("mouseup", onMouseUp);
        $(this.parent).appendChild(input);
        return input;
    };

    createLabel(value) {
        var label = document.createElement("label");
        label.innerHTML = value
        $(this.parent).appendChild(label);
        return label;
    };

    addOption(select, value, text) {
        var option = document.createElement('option');
        option.setAttribute('value', value);
        option.innerHTML = text;
        select = ($(select) || select).appendChild(option);
        return option;
    };

    createSelect(options, onChange, id) {
        var select = document.createElement("select");
        select.addOption = function (value, text) {
            var option = document.createElement('option');
            option.setAttribute('value', value);
            option.innerHTML = text;
            select.appendChild(option);
            return option;
        };
        select.setOption = function (value) {
            var options = select.options;
            for (var o = 0; o < options.length; o++) {
                if (options[o].value === value || options[o].text === value) {
                    options[o].selected = "selected";
                }
            }
        };
        select.id = id;
        for (var o in options) {
            select.addOption(o, options[o]);
        }
        if (onChange instanceof Function) {
            select.addEventListener("change", function () {
                onChange.bind(select)(select);
            });
        }
        $(parent).appendChild(select);
        return select;
    };
};

var limitImageSize = function (image, MAX_SIZE) {
    var maxSize = Math.max(image.size(0), image.size(1));
    if (maxSize > MAX_SIZE) {
        console.warn("Image size > %d, image resized.", MAX_SIZE);
        var canvas = document.createElement("canvas");
        image.imshow(canvas, MAX_SIZE / maxSize);
        image = Matrix.imread(canvas).im2double();
    }
    return image;
};

var createRange = function (values, def, onChange, id) {
    var input = document.createElement("input");
    input.setAttribute("type", "range");
    input.setAttribute("id", id);
    input.setAttribute("min", 0);
    input.setAttribute("step", 1);
    input.setAttribute("max", values.length - 1);
    input.setAttribute("class", "val2");

    var text = document.createElement("input");
    text.setAttribute("id", id + "Val");
    text.setAttribute("class", "val2");
    text.setAttribute("type", "text");

    var updateText = function () {
        text.value = values[input.value].toFixed(4);
    };
    input.setValue = function (def) {
        if (def === undefined) {
            input.value = Math.floor(values.length / 2);
        } else {
            input.value = $M(values)["-"](def).abs().amin().getDataScalar();
        }
        updateText()
    };
    input.setValue(def);

    input.addEventListener("change", function () {
        updateText();
        onChange.bind(input)(input);
    });
    $("uiLeft").appendChild(input);
    $("uiLeft").appendChild(text);
    return input;
};

var createButton = function (value, onMouseDown, onMouseUp, id) {
    var input = document.createElement("input");
    input.setAttribute("type", "button");
    input.setAttribute("id", id);
    input.setAttribute("value", value);
    input.addEventListener("mousedown", onMouseDown);
    input.addEventListener("mouseup", onMouseUp);
    $("uiLeft").appendChild(input);
    return input;
};

var createLabel = function (value) {
    var label = document.createElement("label");
    label.innerHTML = value
    $("uiLeft").appendChild(label);
    return label;
};

var addOption = function (select, value, text) {
    var option = document.createElement('option');
    option.setAttribute('value', value);
    option.innerHTML = text;
    select = ($(select) || select).appendChild(option);
    return option;
};

var createSelect = function (options, onChange, id) {
    'use strict';
    var select = document.createElement("select");
    select.addOption = function (value, text) {
        var option = document.createElement('option');
        option.setAttribute('value', value);
        option.innerHTML = text;
        select.appendChild(option);
        return option;
    };
    select.setOption = function (value) {
        var options = select.options;
        for (var o = 0; o < options.length; o++) {
            if (options[o].value === value || options[o].text === value) {
                options[o].selected = "selected";
            }
        }
    };
    select.id = id;
    for (var o in options) {
        select.addOption(o, options[o]);
    }
    if (onChange instanceof Function) {
        select.addEventListener("change", function () {
            onChange.bind(select)(select);
        });
    }
    $("uiLeft").appendChild(select);
    return select;
};

navigator.sayswho = (function() {
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

var drawImageHistogram = function (id, image, bins, title = "") {
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
    var computeHistogramFromCanvas = function (image) {
        var data = image.getContext('2d').getImageData(0, 0, image.width, image.height).data;
        var histR = Matrix.zeros(256, 1), hrd = histR.getData(),
            histG = Matrix.zeros(256, 1), hgd = histG.getData(),
            histB = Matrix.zeros(256, 1), hbd = histB.getData(),
            hist  = Matrix.zeros(256, 1), hd  = hist.getData();
        Tools.tic();
        var cst = 1 / 3;
        for (var i = 0, ie = data.length; i < ie; i += 4) {
            var iR = data[i], iG = data[i + 1], iB = data[i + 2],
                iGray = ((iR + iG + iB) * cst) | 0;
            hrd[iR]++;
            hgd[iG]++;
            hbd[iB]++;
            hd[iGray]++;
        }
        Tools.tic();
        var M = hist.max().getDataScalar() / 4;
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
    if (image instanceof HTMLCanvasElement) {
        var histograms = computeHistogramFromCanvas(image);
        var max = histograms.max;
        cnv.drawHistogram(histograms.R, max, title, undefined, 'red');
        cnv.drawHistogram(histograms.G, max, title, undefined, 'green', false);
        cnv.drawHistogram(histograms.B, max, title, undefined, 'blue', false);
        cnv.drawHistogram(histograms.gray, max, title, undefined, 'grey', false);
    } else if (image.size(2) === 3) {
        var histograms = computeHistograms(image);
        var max = histograms.max;
        cnv.drawHistogram(histograms.R, max, title, undefined, 'red');
        cnv.drawHistogram(histograms.G, max, title, undefined, 'green', false);
        cnv.drawHistogram(histograms.B, max, title, undefined, 'blue', false);
        cnv.drawHistogram(histograms.gray, max, title, undefined, 'grey', false);
    } else {
        var hist = image.imhist();
        cnv.drawHistogram(hist.getData(), hist.max().getData(), "", undefined, 'grey');
    }
    console.log("Histogram plotted in", Tools.toc(), "ms");
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
