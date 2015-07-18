/*jslint vars: true, nomen: true, plusplus: true, browser: true */
/*global GLEffect, Webcam, HTMLVideoElement */

// User-Interface for designing a GLEffect
function EffectUI(name, effect, hidden) {
    'use strict';
    this.name = name;
    this.effect = effect;
    this.opts = {};
    this.enabled = true;
    if (!hidden) {
        this.optionElement = document.createElement('option');
        this._setupHTML();
    }
    return this;
}

// Setup the HTML content and JS events
EffectUI.prototype._setupHTML = function () {
    'use strict';
    var list = document.getElementById('effects');
    this.optionElement.appendChild(document.createTextNode(this.name));
    list.appendChild(this.optionElement);
    EffectUI.fitContent(list, 'size', list.options.length);
};

// Display the effect in the HTML fields
EffectUI.prototype.toHTML = function () {
    'use strict';
    var $ = function (id) {
        return document.getElementById(id);
    };
    $('name').value = this.name;
    $('opts').value = JSON.stringify(this.opts);
    $('enabled').checked = this.enabled;
    $('sourceCode').value = this.effect.sourceFunction || this.effect.sourceCode;
    $('editor').style.display = '';
    EffectUI.fitSourceCodeArea();
};

// Recompile the effect from the HTML fields
EffectUI.prototype.fromHTML = function () {
    'use strict';
    var srcCode = document.getElementById('sourceCode').value;
    var isFunction = (srcCode.search(/\bvoid\s+main\s*/) === -1);
    var effect;
    try {
        effect = isFunction ? GLEffect.fromFunction(srcCode) :  new GLEffect(srcCode);
    } catch (error) {
        EffectUI.handleCompilationError(error);
        return false;
    }
    this.effect = effect;
    return true;
};

// Clear the output div and return it
EffectUI.clearOutput = function () {
    'use strict';
    var output = document.getElementById('outputs');
    while (output.firstChild) {
        output.removeChild(output.firstChild);
    }
    return output;
};

// Display a compilation error
EffectUI.handleCompilationError = function (error) {
    'use strict';
    var textarea = document.getElementById('sourceCode');
    var userCode = textarea.value;
    var fullCode = error.sourceCode;
    var errorStr = error.toString();

    // Line offset
    if (fullCode) {
        var countLines = function (str) {
            return 1 + (str.match(/\n/g) || []).length;
        };
        var offset = 1 + countLines(fullCode) - countLines(userCode);
        if (offset !== 1) {
            errorStr += '\nWarning: numbering starts from line ' + offset + ':\n> ';
            errorStr +=  userCode.split('\n')[0];
        }
    }

    // Display the error
    var pre = document.createElement('pre');
    pre.className = 'error';
    pre.appendChild(document.createTextNode(errorStr));
    EffectUI.clearOutput().appendChild(pre);
    window.alert('Code compilation error. Details are displayed on the page.');
};

// Resize an element to fit its content, using the initial value as minimum size
EffectUI.fitContent = function (elmt, propertyName, size) {
    'use strict';
    var minKey = '_min_' + propertyName;
    if (!elmt[minKey]) {
        elmt[minKey] = elmt[propertyName];
    }
    elmt[propertyName] = Math.max(size, elmt[minKey]);
};

// Resize the source code area to fit its content
EffectUI.fitSourceCodeArea = function () {
    'use strict';
    var elmt = document.getElementById('sourceCode');
    var lines = 1 + (elmt.value.match(/\n/g) || []).length;
    elmt.rows = lines + 1;
};


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// List of effects
var Effects = {
    list: []
};

// Load the list of sample effects
Effects.loadSampleList = function () {
    'use strict';
    var elmt = document.getElementById('effect-samples');
    var key, opt;
    if (GLEffect.Sample) {
        for (key in GLEffect.Sample) {
            if (GLEffect.Sample.hasOwnProperty(key)) {
                opt = document.createElement('option');
                opt.appendChild(document.createTextNode(key));
                elmt.appendChild(opt);
            }
        }
    }
};

// Load an effect
Effects.load = function () {
    'use strict';
    var elmt = document.getElementById('effect-samples');
    var name = elmt.value;
    if (GLEffect.Sample[name]) {
        Effects.list.push(new EffectUI(name, GLEffect.Sample[name]));
    }
    elmt.selectedIndex = 0;
    Effects.run();
};

// Check whether an effect is selected
Effects.isSelected = function () {
    'use strict';
    return (document.getElementById('effects').selectedIndex !== -1);
};

// Get the selected element or null if no selection.
Effects.getSelected = function () {
    'use strict';
    var k = document.getElementById('effects').selectedIndex;
    return (k === -1) ? null : Effects.list[k];
};

// Display a time, in ms
Effects.displayTime = function (t) {
    'use strict';
    if (!Effects._displayTime_element) {
        Effects._displayTime_element = document.getElementById('chrono');
    }
    Effects._displayTime_element.value = 'Run in ' + t + ' ms';
};

// Display effect to HTML
Effects.toHTML = function () {
    'use strict';
    if (Effects.isSelected()) {
        Effects.getSelected().toHTML();
    }
};

// Get effect from HTML
Effects.fromHTML = function () {
    'use strict';
    if (Effects.isSelected()) {
        var btn = document.getElementById('compileButton');
        btn.disabled = true;
        setTimeout(function () { btn.disabled = false; }, 500);
        if (Effects.getSelected().fromHTML()) {
            Effects.run();
        }
    }
};

// Move the selected effect
Effects.move = function (to, relative) {
    'use strict';

    // Auxiliary function for arrays (for !relative, 0=start and -1=end)
    var moveArrayElmt = function (array, from, to, relative) {
        if (relative) {
            to += from;
        } else {
            if (to < 0) { to += array.length + 1; }
            if (from < to) { --to; }
        }
        to = Math.min(Math.max(to, 0), array.length + 1);
        var elmt = array[from];
        array.splice(from, 1);
        array.splice(to, 0, elmt);
        return Math.min(to, array.length - 1);
    };

    // Apply it to the list
    var list = document.getElementById('effects');
    var k = list.selectedIndex;
    if (k !== -1) {
        var pos = moveArrayElmt(Effects.list, k, to, relative);
        while (list.firstChild) {
            list.removeChild(list.firstChild);
        }
        for (k = 0; k < Effects.list.length; ++k) {
            list.appendChild(Effects.list[k].optionElement);
        }
        list.selectedIndex = pos;
        Effects.run();
    }
};

// Delete the selected effect
Effects.remove = function () {
    'use strict';
    var s = Effects.getSelected();
    if (s && window.confirm('Delete this effect?')) {
        var list = s.optionElement.parentElement;
        Effects.stopEditing(true);
        list.removeChild(s.optionElement);
        EffectUI.fitContent(list, 'size', list.options.length);
        Effects.list.splice(Effects.list.indexOf(s), 1);
        Effects.run();
    }
};

// Enable or disable the effect
Effects.toggle = function (evt) {
    'use strict';
    var s = Effects.getSelected();
    if (s) {
        var checkbox = document.getElementById('enabled');
        var enable = checkbox.checked;
        if (evt) {
            enable = !s.enabled;
        }
        if (!enable) {
            Effects.stopEditing();
        }
        checkbox.checked = enable;
        s.enabled = enable;
        s.optionElement.className = enable ? '' : 'disabled-effect';
        Effects.run();
    }
};

// Update the name of the effect
Effects.updateName = function () {
    'use strict';
    var s = Effects.getSelected();
    if (s) {
        s.name = document.getElementById('name').value || '(unnamed)';
        s.optionElement.firstChild.nodeValue = s.name;
    }
};

// Closoe the editing area
Effects.stopEditing = function (confirmed) {
    'use strict';
    if (Effects.isSelected()) {
        var gleffect = Effects.getSelected().effect;
        var sourceCode = document.getElementById('sourceCode').value;
        var noChange = (sourceCode === (gleffect.sourceFunction || gleffect.sourceCode));
        if (confirmed || noChange || window.confirm('Discard changes?')) {
            document.getElementById('editor').style.display = 'none';
            document.getElementById('effects').selectedIndex = -1;
        }
    }
};

// Get the list of enabled effects
Effects.getListEnabled = function () {
    'use strict';
    Effects.list_enabled = Effects.list.filter(function (obj) {
        return obj.enabled;
    });
    if (!Effects.identity) {
        Effects.identity = new EffectUI('identity', new GLEffect(), true);
    }
    if (!Effects.list_enabled.length) {
        Effects.list_enabled = [Effects.identity];
    }
    return Effects.list_enabled;
};

// Prompt for the options of the selected effect
Effects.promptOpts = function () {
    'use strict';
    var s = Effects.getSelected();
    if (s) {
        var initial = s.opts || {};
        var str = JSON.stringify(initial);
        var opts, msg = '';
        do {
            str = window.prompt(msg + 'Enter effect options:', str);
            if (typeof str !== 'string') {
                opts = initial;
            } else {
                str = str.trim();
                try {
                    opts = str ? JSON.parse(str) : {};
                } catch (e) {
                    opts = null;
                    msg = 'Error: syntax is invalid.\n\n';
                }
            }
        } while (!opts);
        s.opts = opts;
        document.getElementById('opts').value = JSON.stringify(opts);
        Effects.run();
    }
};


////////  RUN FUNCTIONS  ////////

// Get the inputs, if valid
Effects._getInputs = function (fileLoader) {
    'use strict';
    if (fileLoader) {
        Effects.fileLoader = fileLoader;
    } else if (!Effects.fileLoader) {
        return null;  // no file selected
    }
    var selection = Effects.fileLoader.getSelection().map(function (slot) {
        return slot.data;
    });
    var list = Effects.getListEnabled();
    var nEffects = list.length;
    var nSelected = selection.length;
    var nExpected = nEffects && list[0].effect.uImageLength;
    if (!nEffects || nSelected !== (nExpected || 1)) {
        return null;  // not selected the right number of files
    }
    return nExpected ? selection : selection.pop();  // array or single image
};

// Run the effect once
Effects._runOnce = function (images, toImage) {
    'use strict';
    var t = new Date().getTime();
    var opts, current;
    var k, n = Effects.list_enabled.length;
    for (k = 0; k < n; ++k) {
        current = Effects.list_enabled[k];
        opts = GLEffect._cloneOpts(current.opts);
        if (k === n - 1 && !toImage) {
            opts.toCanvas = true;
        }
        images = current.effect.run(images, opts);
    }
    Effects.displayTime(new Date().getTime() - t);
    return images;
};

// Run the effect in a loop (for video)
Effects._runLoop = function () {
    'use strict';
    if (Effects._runLoop_images) {
        Effects._runOnce(Effects._runLoop_images);
        Webcam.requestAnimationFrame(Effects._runLoop);
    }
};

// Run the effect if ready
Effects.run = function (fileLoader) {
    'use strict';
    var output = EffectUI.clearOutput();
    var selection = Effects._getInputs(fileLoader);
    var runningLoop = Boolean(Effects._runLoop_images);
    delete Effects._runLoop_images;
    if (selection) {
        output.appendChild(GLEffect._getDefaultContext().canvas);
        var isVideo = function (elmt) { return elmt instanceof HTMLVideoElement; };
        var hasVideo = selection.length ? selection.some(isVideo) : isVideo(selection);
        if (!hasVideo) {
            Effects._runOnce(selection);
        } else {
            Effects._runLoop_images = selection;
            if (!runningLoop) {
                Effects._runLoop();
            }
        }
    }
};
