/*jslint vars: true, nomen: true, plusplus: true, browser: true */
/*global GLEffect, GLImage, GLReduction, Webcam, HTMLVideoElement */

// User-Interface for designing a GLEffect
function EffectUI(name, effect, hidden) {
    'use strict';
    this.name = name;
    this.effect = effect;
    this.opts = {};
    this.enabled = true;
    if (!hidden) {
        this.optionElement = document.createElement('option');
        this.optgroupElement = document.createElement('optgroup');
        this._setupHTML();
    }
    return this;
}

// Setup the HTML content and JS events
EffectUI.prototype._setupHTML = function () {
    'use strict';
    var list = document.getElementById('effects');
    var group = document.getElementById('parameters');
    this.optionElement.appendChild(document.createTextNode(this.name));
    this.optgroupElement.label = this.name;
    list.appendChild(this.optionElement);
    group.appendChild(this.optgroupElement);
    EffectUI.fitContent(list, 'size', list.options.length);
    EffectUI.fitContent(group, 'size', group.options.length);
    this._fillParametersList();
};

// Update the list of parameters
EffectUI.prototype._fillParametersList = function() {
    'use strict';
    while (this.optgroupElement.firstChild) {
        this.optgroupElement.removeChild(this.optgroupElement.firstChild);
    }
    var parameters = this.effect.parameters;
    var opt, name;
    for (name in parameters) {
        if (parameters.hasOwnProperty(name)) {
            opt = document.createElement('option');
            opt.appendChild(document.createTextNode(name));
            this.optgroupElement.appendChild(opt);
        }
    }
    EffectUI.fitParametersList();
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
    $('editor').style.display = 'block';
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
    var param, values = this.effect.parameters;
    for (param in values) {
        if (values.hasOwnProperty(param) && values[param]) {
            effect.setParameter(param, values[param]);
        }
    }
    this.effect = effect;
    this._fillParametersList();
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

// Fit the list of parameters
EffectUI.fitParametersList = function () {
    'use strict';
    var list = document.getElementById('parameters');
    var groups = [].slice.call(list.getElementsByTagName('optgroup'));
    var nonEmptyGroups = groups.filter(function (optgroup) {
        return optgroup.hasChildNodes();
    });
    var size = list.options.length + nonEmptyGroups.length;
    EffectUI.fitContent(list, 'size', size);
};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// List of effects
var Effects = {
    list: [],
    reduction: null
};

// Highlight the important fields
Effects.help = function () {
    'use strict';
    var btn = document.getElementById('help-button');
    var menu = document.getElementById('effect-samples');
    var slots = document.getElementById('images').getElementsByTagName('div');
    btn.style.display = 'none';
    menu.style.backgroundColor = 'lightgreen';
    if (slots.length) {
        slots[slots.length - 1].style.backgroundColor = 'lightgreen';
    }
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

// Load the list of reductions
Effects.loadReductionList = function () {
    'use strict';
    var elmt = document.getElementById('reduction');
    var key, opt;
    if (GLReduction.Sample) {
        for (key in GLReduction.Sample) {
            if (GLReduction.Sample.hasOwnProperty(key)) {
                opt = document.createElement('option');
                opt.appendChild(document.createTextNode(key));
                elmt.appendChild(opt);
            }
        }
    }
};

// Use the selected reduction
Effects.updateReduction = function () {
    'use strict';
    var output = document.getElementById('reduction-RGBA');
    var name = document.getElementById('reduction').value;
    Effects.reduction = name ? GLReduction.Sample[name]() : null;
    Effects.displayReduction();
    output.style.display = Effects.reduction ? 'block' : 'none';
    Effects.run();
};

// Load an effect
Effects.load = function () {
    'use strict';
    var elmt = document.getElementById('effect-samples');
    var name = elmt.value;
    if (GLEffect.Sample[name]) {
        Effects.list.push(new EffectUI(name, GLEffect.Sample[name]()));
    }
    elmt.selectedIndex = 0;
    Effects.run();
};

// Check whether an effect is selected
Effects.isSelected = function () {
    'use strict';
    return (document.getElementById('effects').selectedIndex !== -1);
};

// Get the selected EffectUI or null if no selection.
Effects.getSelected = function () {
    'use strict';
    var k = document.getElementById('effects').selectedIndex;
    return (k === -1) ? null : Effects.list[k];
};

// Get the selected EffectUI from the parameter list
Effects.getSelectedFromParameters = function () {
    'use strict';
    var list = document.getElementById('parameters');
    var n = list.selectedIndex;
    if (n === -1) {
        return false;
    }
    var optgroups = list.getElementsByTagName('optgroup');
    var k = [].slice.call(optgroups).indexOf(list.options[n].parentElement);
    return (k === -1) ? null : Effects.list[k];
};

// Display a time, in ms
Effects.displayTime = function (t_start, t_effect, t_reduction) {
    'use strict';
    if (!Effects._displayTime_element) {
        Effects._displayTime_element = document.getElementById('chrono');
    }
    var str = 'Run in ' + (t_effect - t_start);
    if (t_reduction) {
        str += ' + ' + (t_reduction - t_effect);
    }
    str += ' ms';
    Effects._displayTime_element.value = str;
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
            Effects.displayParameter();
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
    var params = document.getElementById('parameters');
    var k = list.selectedIndex;
    if (k !== -1) {
        var pos = moveArrayElmt(Effects.list, k, to, relative);
        while (list.firstChild) {
            list.removeChild(list.firstChild);
        }
        while (params.firstChild) {
            params.removeChild(params.firstChild);
        }
        for (k = 0; k < Effects.list.length; ++k) {
            list.appendChild(Effects.list[k].optionElement);
            params.appendChild(Effects.list[k].optgroupElement);
        }
        Effects.run();
        setTimeout(function () {  // Hack for FF, which does not preventDefault() here
            list.selectedIndex = pos;
        }, 1);
    }
};

// Delete the selected effect
Effects.remove = function () {
    'use strict';
    var s = Effects.getSelected();
    if (s && window.confirm('Delete this effect?')) {
        var remNode = function (node) { node.parentElement.removeChild(node); };
        var list = s.optionElement.parentElement;
        Effects.stopEditing(true);
        remNode(s.optgroupElement);
        remNode(s.optionElement);
        EffectUI.fitParametersList();
        EffectUI.fitContent(list, 'size', list.options.length);
        Effects.list.splice(Effects.list.indexOf(s), 1);
        Effects.displayParameter();
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
        s.optgroupElement.label = s.name;
    }
};

// Update the value of a parameter
Effects.updateParameter = function () {
    'use strict';
    var s = Effects.getSelectedFromParameters();
    if (s) {
        var list = document.getElementById('parameters');
        var field = document.getElementById('parameter');
        var name = list.value;
        var value;
        try {
            value = JSON.parse(field.value);
        } catch (e) {
            value = null;
        }
        if (value) {
            s.effect.setParameter(name, value);
            field.value = JSON.stringify(value);
            field.select();
            Effects.run();
        } else {
            window.alert('Invalid syntax.');
        }
    }
};

// Display the value of the selected parameter
Effects.displayParameter = function () {
    'use strict';
    var s = Effects.getSelectedFromParameters();
    var list = document.getElementById('parameters');
    var field = document.getElementById('parameter');
    if (s) {
        var value = s.effect.parameters[list.value || ''];
        field.value = value ? JSON.stringify(value) : '';
    } else {
        field.value = '';
    }
};

Effects.displayReduction = function (rgba) {
    'use strict';
    document.getElementById('reduction-R').value = rgba ? 'R = ' + rgba[0] : '';
    document.getElementById('reduction-G').value = rgba ? 'G = ' + rgba[1] : '';
    document.getElementById('reduction-B').value = rgba ? 'B = ' + rgba[2] : '';
    document.getElementById('reduction-A').value = rgba ? 'A = ' + rgba[3] : '';
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
    var nExpected = nEffects && list[0].effect._uImageLength;
    if (!nEffects || nSelected !== (nExpected || 1)) {
        return null;  // not selected the right number of files
    }
    return nExpected ? selection : selection.pop();  // array or single image
};

// Run the effect once
Effects._runOnce = function (image, toImage) {
    'use strict';
    if (!Effects._runOnce_imbuffers) {
        Effects._runOnce_imbuffers = [new GLImage(), new GLImage()];
    }
    var imbuffers = Effects._runOnce_imbuffers;
    var t_start = new Date().getTime();
    var current, output;
    var k, n = Effects.list_enabled.length;
    for (k = 0; k < n; ++k) {
        current = Effects.list_enabled[k];
        output = null;
        if (k < n - 1 || Effects.reduction) {
            output = imbuffers[k % 2];
        } else {
            output = toImage ? new GLImage() : null;
        }
        image = current.effect.run(image, output);
    }
    var t_effect = new Date().getTime(), t_reduction = 0;
    if (Effects.reduction) {
        var rgba = Effects.reduction.run(image);
        t_reduction = new Date().getTime();
        Effects.displayReduction(rgba);
        if (!Effects._runOnce_ideffect) {
            Effects._runOnce_ideffect = new GLEffect();
        }
        Effects._runOnce_ideffect.run(image);
    }
    Effects.displayTime(t_start, t_effect, t_reduction);
    return image;
};

// Run the effect in a loop (for video)
Effects._runLoop = function () {
    'use strict';
    if (Effects._runLoop_images) {
        try {
            Effects._runOnce(Effects._runLoop_images);
        } catch (e) {
            delete Effects._runLoop_images;
            throw e;
        }
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
