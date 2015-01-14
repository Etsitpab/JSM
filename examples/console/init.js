/*global Dom, JsConsole, ScriptArea, OutTable, Plot, Disk, Matrix, console, document, FileReader, Tools*/

var jsOut, myScript, jsConsole, LAST_READ, FILE;

window.onbeforeunload = function (e) {
    "use strict";
    Disk.save('__LAST_READ__', myScript.currentBuffer, true);
    e = e || window.event;
    msg = "WARNING !";
    
    // For IE and Firefox
    if (e) {
        e.returnValue = msg;
    }
    // For Chrome and Safari
    return msg;
};

// Raccourci $(id) pour getElementById
window.$ = function (id) {
    'use strict';
    return document.getElementById(id);
};

// Ajout d'un fichier .js
function include(jsFile) {
    'use strict';
    var header = document.getElementsByTagName('head')[0];
    var newNode = Dom.createNode('script', 'type', 'text/javascript', 'src', jsFile);
    header.appendChild(newNode);
}

// Ajout d'une zone d'affichage
function createCanvas(size, id, onclick) {
    'use strict';
    var canvas = document.createElement("canvas");
    canvas.id = id || "id";
    canvas.height = size[0];
    canvas.width = size[1];

    var getPosition = function (e, event) {
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
    
    if (onclick instanceof Function) {
        var click = function (e) {
            var coord = getPosition(canvas, e);
            onclick.bind(this)(coord, e);
        };
        canvas.addEventListener("click", click);
    }
    
    $("tableCanvas").appendChild(canvas);
    return canvas.id;
}

var createPlot = function (size, id) {
    'use strict';
    var tableCanvas = $("tableCanvas");
    var plot = new Plot(id, size, tableCanvas);
    return plot;
};

function updateFileList() {
    'use strict';
    var select = document.getElementById('fileList');
    if (select.hasChildNodes()) {
        while (select.childNodes.length > 0) {
            select.removeChild(select.firstChild);
        }
    }

    var jsFiles = myScript.buffers;

    var i, option;
    for (i in jsFiles) {
        if (jsFiles.hasOwnProperty(i)) {
            option = document.createElement('option');
            option.setAttribute('value', i);
            option.text = i;
            select.appendChild(option);
            if (i === myScript.currentBuffer) {
                option.selected = true;
            }
        }
    }
}

function selectBuffer() {
    'use strict';
    var select = document.getElementById('fileList');
    myScript.changeBuffer(select.value);
}

function fileOperations() {
    'use strict';
    var select = document.getElementById('fileOperations');
    switch (select.value) {
    case 'new':
        myScript.createBuffer();
        updateFileList();
        break;
    case 'save':
        myScript.save();
        break;
    case 'saveAs':
        myScript.saveAs();
        updateFileList();
        break;
    case 'delete':
        myScript.remove();
        updateFileList();
        break;
    default:
        throw new Error('Unknown operation');
    }
}

var callback = function (file) {
    'use strict';
    var reader = new FileReader();
    var type = file.type || file.name.split('.').pop().toLowerCase();
    switch (type) {
    case 'image/jpeg':
    case 'image/png':
    case 'png':
    case 'jpg':
    case 'jpeg':
        reader.onload = function (evt) {
            Disk.save(file.name, evt.target.result);
        };
        reader.readAsDataURL(file);
        break;
    case 'text/csv':
    case 'text/plain':
    case 'txt':
    case 'csv':
        reader.onload = function (evt) {
            try {
                Disk.save(file.name, evt.target.result);
            } catch (e) {
                console.warn('Unable to save the file named :' + file.name + '.');
                LAST_READ = evt.target.result;
                FILE = evt;
            }
        };
        reader.readAsText(file);
        break;
    default:
        throw new Error(file.type);
    }
};

var getStartingCode = function() {
console.log("Matrix.imread('/home/mazin/Images/images_test/J7/1.png', function() {\n\twindow.canvas = createCanvas([300, 300], 'test');\n\this.imshow(canvas);\n});");
};

// Initialisation de la console
function init() {
    'use strict';
    //Tools.makeDraggable(document, callback);

    console.log('Initilisation');
    var param = {
        mode:  "javascript",
        lineNumbers: true,
        viewportMargin: 100
    };
    var cm = CodeMirror($('jsScript'), param);
    var keyMap = {
        "F10": function () {
            eval(cm.getValue());
        },
        "Ctrl-S" : function () {
            myScript.save();
        }
    };
    cm.addKeyMap(keyMap);

    myScript = new ScriptArea(cm, "");
    if (Disk.exist("__LAST_READ__")) {
        var currentBuffer = Disk.load('__LAST_READ__');
        myScript.changeBuffer(currentBuffer);
    }
    updateFileList();

    $("runScript").addEventListener("click", keyMap["F10"]);
}
