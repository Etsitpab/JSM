/*jslint vars: true, nomen: true, plusplus: true, browser: true */
/*global GLEffect, Webcam, HTMLVideoElement */

// User-Interface for designing a GLEffect
function EffectUI(name, effect) {
    'use strict';
    this.name = name;
    this.effect = effect;
    this.opts = {};
    this.enabled = true;
    this.optionElement = document.createElement('option');
    this._setupHTML();
    return this;
}

// Setup the HTML content and JS events
EffectUI.prototype._setupHTML = function () {
    'use strict';
    var list = document.getElementById('effects');
    this.optionElement.appendChild(document.createTextNode(this.name));
    EffectUI._updateOptionAndFit(this.optionElement, list);
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
};

// Recompile the effect from the HTML fields
EffectUI.prototype.fromHTML = function () {
    'use strict';
    return;
};


// Insert (if 'select') or remove the option and fit the size
EffectUI._updateOptionAndFit = function (opt, select) {
    'use strict';
    if (!select) {
        select = opt.parentElement;
        select.removeChild(opt);
    } else if (select.size && select.options.length < select.size) {
        select._minSize = select.size;
        select.appendChild(opt);
    } else {
        select.appendChild(opt);
    }
    select.size = Math.max(select.options.length, select._minSize);
};


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// List of effects
var Effects = {
    list: []
};

// Load the list of sample effects
Effects.loadSamples = function () {
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
};

// Get the HTML effect list
Effects.getElmt = function () {
    'use strict';
    return document.getElementById('effects');
};

// Check whether an effect is selected
Effects.isSelected = function () {
    'use strict';
    return (Effects.getElmt().selectedIndex !== -1);
};

// Get the selected element or null if no selection.
Effects.getSelected = function () {
    'use strict';
    var k = Effects.getElmt().selectedIndex;
    return (k === -1) ? null : Effects.list[k];
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
        Effects.getSelected().fromHTML();
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

// Delete the selected effect
Effects.remove = function () {
    'use strict';
    var s = Effects.getSelected();
    if (s && window.confirm('Delete this effect?')) {
        Effects.stopEditing(true);
        EffectUI._updateOptionAndFit(s.optionElement);
        Effects.list.splice(Effects.list.indexOf(s), 1);
        Effects.run();
    }
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

// Display a time, in ms
Effects.displayTime = function (t) {
    'use strict';
    if (!Effects._displayTime_element) {
        Effects._displayTime_element = document.getElementById('chrono');
    }
    Effects._displayTime_element.value = 'Run in ' + t + ' ms';
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
    var nEffects = Effects.list.length;
    var nSelected = selection.length;
    var nExpected = nEffects && Effects.list[0].effect.uImageLength;
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
    var k, n = Effects.list.length;
    for (k = 0; k < n; ++k) {
        current = Effects.list[k];
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
    var output = document.getElementById('outputs');
    var selection = Effects._getInputs(fileLoader);
    var runningLoop = Boolean(Effects._runLoop_images);
    delete Effects._runLoop_images;
    while (output.firstChild) {
        output.removeChild(output.firstChild);
    }
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
