/*global jsConsole, myScript, Disk, prompt, confirm*/

function ScriptArea(area, defaultScript) {
    'use strict';
    this.area = area;
    this.buffers = {};
    this.initBuffers();
}

ScriptArea.prototype.initBuffers = function () {
    'use strict';
    this.jsFiles = Disk.getItemList('.js');
    var i, name;
    for (i = 0; i < this.jsFiles.length; i++) {
        this.load(this.jsFiles[i]);
    }
    if (this.jsFiles[0]) {
        this.selectBuffer(this.jsFiles[0]);
    } else {
        this.createBuffer();
    }
};

ScriptArea.prototype.createBuffer = function () {
    'use strict';
    var name = prompt('Please enter file name', 'myFile.js');
    var msg = "File: '" + name + "' exist. Overwrite ?";
    if ((this.buffers[name] === undefined  && !Disk.exist(name)) || confirm(msg)) {
        this.buffers[name] = '';
        this.selectBuffer(name);
    }
};

ScriptArea.prototype.selectBuffer = function (name) {
    'use strict';
    var buffer = this.buffers[name];
    this.setValue(buffer);
    this.currentBuffer = name;
};

ScriptArea.prototype.changeBuffer = function (name) {
    'use strict';
    // Save current buffer
    this.buffers[this.currentBuffer] = this.getValue();
    this.selectBuffer(name);
};

ScriptArea.prototype.load = function (name) {
    'use strict';
    var file = Disk.load(name);
    this.buffers[name] = file;
};

// Sauvegarde la zone
ScriptArea.prototype.save = function (name) {
    'use strict';
    var file;
    if (name === undefined) {
        name = this.currentBuffer;
        file = this.getValue();
    } else {
        file = this.buffers[name];
    }
    Disk.save(name, file, true);
};

ScriptArea.prototype.saveAs = function () {
    'use strict';
    var name = prompt('Please enter file name', 'myFile.js');
    var msg = "File: '" + name + "' exist. Overwrite ?";
    if (!Disk.exist(name) || confirm(msg)) {
        this.buffers[name] = this.getValue();
        this.save(name);
        this.selectBuffer(name);
    }
};

ScriptArea.prototype.remove = function (name) {
    'use strict';
    if (name === undefined) {
        name = this.currentBuffer;
    }
    var msg = "File: Really remove '" + name + "'?";
    if ((this.buffers[name] !== undefined || Disk.exist(name)) && confirm(msg)) {
        delete this.buffers[name];
        Disk.remove(name);

        var i;
        for (i = 0; i < this.jsFiles.length; i++) {
            if (this.jsFiles[i] === name) {
                this.jsFiles.slice(i, 1);
            }
        }
        if (this.jsFiles[0] !== undefined) {
            this.selectBuffer(this.jsFiles[0]);
        } else {
            this.createBuffer();
        }
    }
};

// Efface la zone ainsi que la sauvegarde
ScriptArea.prototype.clear = function () {
    'use strict';
    if (Disk.exist('__CURRENT__')) {
        Disk.remove('__CURRENT__');
    }
};

// Valeur de la zone
ScriptArea.prototype.getValue = function () {
    'use strict';
    return this.area.getValue();
};

ScriptArea.prototype.setValue = function (value) {
    'use strict';
    if (value !== undefined) {
        this.area.setValue(value);
    }
    return this;
};

ScriptArea.prototype.getSelection = function () {
    'use strict';
    var area = this.area;
    var selection = area.getSession().doc.getTextRange(area.getSelectionRange());
    return selection;
};

ScriptArea.prototype.gotoNextCodeLine = function () {
    'use strict';
    var lineNumber = this.area.getSession().getSelection().getCursor().row;
    var buffer  = this.getValue();
    var lines = buffer.split("\n");

    if (lineNumber < lines.length - 1) {
        lineNumber++;
    } else {
        return;
    }

    while (lineNumber < lines.length - 1 && !this.isCodeLine(lines[lineNumber])) {
        lineNumber++;
    }

    if (this.isCodeLine(lines[lineNumber])) {
        this.area.gotoLine(lineNumber + 1);
    }
};

ScriptArea.prototype.getCurrentLine = function () {
    'use strict';
    var lineNumber = this.area.getSession().getSelection().getCursor().row;
    var buffer  = this.getValue().split('\n');
    return buffer[lineNumber];
};

ScriptArea.prototype.isCodeLine = function (line) {
    'use strict';
    var reg = /(^[ ]*[\/]+)|(^[ };]*$)/g;
    return (line.match(reg)) ? false : true;
};
