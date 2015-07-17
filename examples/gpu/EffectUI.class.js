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

    // Entry in the list of effects
    this.optionElement.appendChild(document.createTextNode(this.name));
    document.getElementById('effects').appendChild(this.optionElement);
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
    $('sourceCode').value = this.effect.sourceCode;
    $('editing').style.display = '';
};

// Recompile the effect from the HTML fields
EffectUI.prototype.fromHTML = function () {
    'use strict';
    return;
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

// Get the inputs, if valid
Effects.getInputs = function (fileLoader) {
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

// Run the effect if ready
Effects.run = function (fileLoader) {
    'use strict';
    var output = document.getElementById('outputs');
    var selection = Effects.getInputs(fileLoader);
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
            Effects.runOnce(selection);
        } else {
            Effects._runLoop_images = selection;
            if (!runningLoop) {
                Effects.runLoop();
            }
        }
    }
};

// Run the effect once
Effects.runOnce = function (images, toImage) {
    'use strict';
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
    return images;
};

// Run the effect in a loop (for video)
Effects.runLoop = function () {
    'use strict';
    if (Effects._runLoop_images) {
        Effects.runOnce(Effects._runLoop_images);
        Webcam.requestAnimationFrame(Effects.runLoop);
    }
};