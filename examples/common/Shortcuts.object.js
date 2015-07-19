/*jslint vars: true, nomen: true, bitwise: true, browser: true */

/** Provides shortcut definition functions.  @singleton */
var Shortcuts = {};

/** Create a shortcut.
 * @param {HTMLElement | String} elmt
 *  Element (or ID) on which the shortcut is active.
 * @param {String} shortcut
 *  Shortcut string, which is a key name (see Shortcuts.KeyNames).<br/>
 *  It can be preceded by modifiers (Alt, Ctrl, Shift) using the `+` symbol.<br/>
 *  Examples: `"F1"`, `"Alt + Tab"`, `"Ctrl+Shift+A"`.
 * @param {Function} callback
 *  Function called when the shortcut is detected.
 *  The function is called with `this=elmt` and the `KeyboardEvent` as argument.
 */
Shortcuts.create = function (elmt, shortcut, callback) {
    'use strict';
    if (typeof elmt === 'string') {
        elmt = document.getElementById(elmt);
    }
    if (!elmt._shortcuts) {
        elmt._shortcuts = {};
        elmt.addEventListener('keydown', Shortcuts._handleEvent);
    }
    var code = Shortcuts._str2code(shortcut);
    elmt._shortcuts[code] = callback;
};

/** Get a list of shortcuts bound to a given element.
 * @param {HTMLElement | String} elmt
 *  An element or its ID.
 * @return {Array}
 *  Array of shortcuts (as strings) bound to the given element.
 */
Shortcuts.list = function (elmt) {
    'use strict';
    if (typeof elmt === 'string') {
        elmt = document.getElementById(elmt);
    }
    if (!elmt._shortcuts) {
        return [];
    }
    var code, list = [];
    for (code in elmt._shortcuts) {
        if (elmt._shortcuts.hasOwnProperty(code)) {
            list.push(Shortcuts._code2str(code));
        }
    }
    return list;
};

/** Convert a shortcut string into a code.
 * @param {String} shortcut
 * @return {Number}
 * @private */
Shortcuts._str2code = function (shortcut) {
    'use strict';
    var checkThat = function (condition, errorStr) {
        if (!condition) { throw new Error(errorStr); }
    };
    var keys = shortcut.trim().toUpperCase().split(/\s*\+\s*/).filter(
        function (str) { return (str.length > 0); }
    );
    checkThat(keys.length > 0, 'Empty shortcut string.');
    var code = Shortcuts.KeyCodes[keys.pop()];
    checkThat(code, 'Invalid key name.');
    var flag;
    while (keys.length) {
        flag = Shortcuts.FlagCodes[keys.pop()];
        checkThat(flag, 'Invalid key combination.');
        code |= flag;
    }
    return code;
};

/** Convert a shortcut code into a string.
 * @param {Number} code
 * @return {String}
 * @private */
Shortcuts._code2str = function (code) {
    'use strict';
    var array = [];
    var flag, name;
    for (flag in Shortcuts.FlagNames) {
        if (Shortcuts.FlagNames.hasOwnProperty(flag)) {
            name = Shortcuts.FlagNames[flag];
            if ((code & flag) && name[0] !== '_') {
                array.push(name);
            }
        }
    }
    name = Shortcuts.KeyNames[code & Shortcuts.FlagCodes._MASK];
    if (!name) {
        throw new Error('Invalid shortcut code.');
    }
    array.push(name);
    return array.join('+');
};

/** Callback function when a key is pressed on an element with shortcuts.
 * @param {KeyboardEvent} evt
 * @private */
Shortcuts._handleEvent = function (evt) {
    'use strict';
    var key = evt.which || evt.keyCode;
    if (evt.altKey) { key |= Shortcuts.FlagCodes.ALT; }
    if (evt.ctrlKey) { key |= Shortcuts.FlagCodes.CTRL; }
    if (evt.shiftKey) { key |= Shortcuts.FlagCodes.SHIFT; }
    if (this._shortcuts[key]) {
        evt.preventDefault();
        evt.stopPropagation();
        this._shortcuts[key].call(this, evt);
    }
};

/* Key names (keys = key codes). Documented later, otherwise won't compile. */
Shortcuts.KeyNames = {
    9: 'Tab',
    8: 'Backspace',
    13: 'Enter',
    27: 'Escape',
    37: 'ArrowLeft',
    38: 'ArrowUp',
    39: 'ArrowRight',
    40: 'ArrowDown',
    33: 'PageUp',
    34: 'PageDown',
    36: 'Home',
    35: 'End',
    45: 'Insert',
    46: 'Delete',
    19: 'Pause',

    // Alphanumeric Keys
    17: 'Ctrl',
    18: 'Alt',
    16: 'Shift',
    65: 'A',
    66: 'B',
    67: 'C',
    68: 'D',
    69: 'E',
    70: 'F',
    71: 'G',
    72: 'H',
    73: 'I',
    74: 'J',
    75: 'K',
    76: 'L',
    77: 'M',
    78: 'N',
    79: 'O',
    80: 'P',
    81: 'Q',
    82: 'R',
    83: 'S',
    84: 'T',
    85: 'U',
    86: 'V',
    87: 'W',
    88: 'X',
    89: 'Y',
    90: 'Z',
    48: '0',
    49: '1',
    50: '2',
    51: '3',
    52: '4',
    53: '5',
    54: '6',
    55: '7',
    56: '8',
    57: '9',
    187: 'Equal',

    // Numpad Keys
    96: 'Num0',
    97: 'Num1',
    98: 'Num2',
    99: 'Num3',
    100: 'Num4',
    101: 'Num5',
    102: 'Num6',
    103: 'Num7',
    104: 'Num8',
    105: 'Num9',
    20: 'CapsLock',
    110: 'Point',
    107: 'Plus',
    109: 'Minus',
    106: 'Times',
    111: 'Divide',

    // Function Keys
    112: 'F1',
    113: 'F2',
    114: 'F3',
    115: 'F4',
    116: 'F5',
    117: 'F6',
    118: 'F7',
    119: 'F8',
    120: 'F9',
    121: 'F10',
    122: 'F11',
    123: 'F12'
};

/** Key codes (keys = uppercase key names).  @private @type {Object} */
Shortcuts.KeyCodes = (function () {
    'use strict';
    var code, obj = {};
    for (code in Shortcuts.KeyNames) {
        if (Shortcuts.KeyNames.hasOwnProperty(code)) {
            obj[Shortcuts.KeyNames[code].toUpperCase()] = code;
        }
    }
    return obj;
}());

/** Flag names (keys = flag values).  @private @type {Object}. */
Shortcuts.FlagNames = {
    0x1000: 'Alt',
    0x2000: 'Ctrl',
    0x4000: 'Shift',
    0x0FFF: '_mask'
};

/** Flag codes (keys = flag names, e.g. `ALT`).  @private @type {Object} */
Shortcuts.FlagCodes = (function () {
    'use strict';
    var code, obj = {};
    for (code in Shortcuts.FlagNames) {
        if (Shortcuts.FlagNames.hasOwnProperty(code)) {
            obj[Shortcuts.FlagNames[code].toUpperCase()] = code;
        }
    }
    return obj;
}());

// Below is some postponed doc that jsduck won't compile otherwise.
/** Key names (keys = key codes). @readonly @property {Object} KeyNames */
