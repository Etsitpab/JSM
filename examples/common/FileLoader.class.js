/*jslint nomen: true, vars: true, plusplus: true, bitwise: true, browser: true, devel: true */
/*global HTMLElement, File, FileReader */

/* Change log
 *  2015-07-14: first version, tested with Chrome/Firefox on PC/mobile
 *  2015-07-15: adding video support
 */


// Forward declarations
var FileSlot;

// Initialization
(function () {
    'use strict';
    var CSS_FILE_NAME = 'FileLoader.css';
    window.addEventListener('load', function () {
        var getName = function (elmt) { return elmt.href.split('/').pop(); };
        var cssFiles = [].slice.call(document.getElementsByTagName('link')).map(getName);
        if (cssFiles.indexOf(CSS_FILE_NAME) === -1) {
            throw new Error('missing CSS file: ' + CSS_FILE_NAME);
        }
    });
}());


/** @class FileLoader
 *  @author Guillaume Tartavel
 * Handle file droping and loading.
 */

/** @constructor
 *  Create a drag'n'drop file loader.
 * @param {HTMLElement | String} elmt
 *  Container used to drop files.
 *  Its content will be erased.
 * @param {Number} [flags = 0]
 *  Flags. Can be: MULTIPLE.
 */
function FileLoader(elmt, flags, filter) {
    'use strict';
    var Dom = FileLoader.Dom;

    /** Slots containing files or content.  @readonly @type {FileSlot} */
    this.slots = [];

    /** Filter for file uploading.  @readonly @type {String} */
    this.filter = null;

    /** Accepted file types (processed version of FileLoader.filter).  @readonly @type {Object} */
    this.allowedTypes = null;

    /** HTML container.  @private @type {HTMLElement} */
    this._domElement = (typeof elmt === 'string') ? document.getElementById(elmt) : elmt;
    this._domElement.classList.add('js-fileloader');
    Dom.removeChildren(this._domElement);

    /** Selected slot(s).  @private @type {FileSlot | Array} */
    this._selection = (flags & FileLoader.MULTIPLE) ? [] : null;

    /** Slot used for uploading new files.  @private @type {HTMLElement}  */
    this._uploadArea = Dom.createChild(this._domElement, 'div', 'class', 'js-fileslot js-fileslot-ghost');

    // Some more initializations
    this.setFilter(filter);
    FileLoader._initEventListeners(this);

    return this;
}


/** Maximum width for thumbnails.  @readonly @static @type {Number} */
FileLoader.THUMBNAIL_MAX_WIDTH = 180;
/** Maximum height for thumbnails.  @readonly @static @type {Number} */
FileLoader.THUMBNAIL_MAX_HEIGHT = 120;
/** Default refresh frequency of video's thumbnails, in ms.  @static @type {Number} */
FileLoader.THUMBNAIL_REFRESH_INTERVAL = 500;
/** Time (in ms) after an invalid file is being automatically deleted.  @static @type {Number} */
FileLoader.INVALID_TYPE_DELAY = 1500;
/** Flag for multiple selection.  @readonly @static @type {Number} */
FileLoader.MULTIPLE = 1;


//////  MEMBER METHODS  ////////////////////////////////////////////////////////

/** Test whether multiple selection is allowed.
 * @return {Boolean}
 *  `true` iff multiple selection is allowed.
 */
FileLoader.prototype.allowsMultipleSelection = function () {
    'use strict';
    return (this._selection instanceof Array);
};

/** Test whether the selection is empty.
 * @return {Boolean}
 *  `true` iff the selection is empty.
 */
FileLoader.prototype.isSelectionEmpty = function () {
    'use strict';
    var s = this.allowsMultipleSelection() ? this._selection.length : this._selection;
    return !s;
};

/** Get the selection.
 * @param {Boolean} [single = false]
 *  Controls the output type: Array if `false` (default), FileSlot if `true`.
 * @return {Array | FileSlot}
 *  The selected slot(s), as an array or a single slot (depending on the argument).
 */
FileLoader.prototype.getSelection = function (single) {
    'use strict';
    // No multiple selection
    if (!this.allowsMultipleSelection()) {
        if (single) {
            return this._selection;  // slot -> slot
        }
        return this._selection ? [this._selection] : [];  // slot -> array
    }
    // Multiple selection
    if (!single) {
        return this._selection.slice(0);  // array -> array (copy)
    }
    return this._selection[0] || null;  // array -> single (ignore extra slots)
};

/** Change the file type filtering.
 * @param {String} [filter]
 *  File filter, as a coma-separated list of MIME types (e.g. "image/&#42;,video/mp4").
 */
FileLoader.prototype.setFilter = function(filter) {
    'use strict';
    this.filter = filter || '';
    this.allowedTypes = null;
    if (filter) {
        this.allowedTypes = {};
        var types = this.filter.split(',').map(function (str) {
            return str.trim().replace(/\/\*$/, '');
        });
        while (types.length) {
            this.allowedTypes[types.pop()] = true;
        }
    }
};

/** Load files.
 * @param {Array | File} [files = null]
 *  Files to be loaded. If no file given, will prompt the user (if allowed).
 */
FileLoader.prototype.loadFiles = function (files) {
    'use strict';
    var that = this;
    if (files instanceof File) {
        this._loadFile(files);
    } else if (!files) {
        var callback = function (files) {
            that.loadFiles(files);
        };
        FileLoader._promptFiles(callback, this.filter);
    } else {
        var k, n = files.length;
        for (k = 0; k < n; ++k) {
            this._loadFile(files[k]);
        }
    }
};

/** Create a slot in this FileLoader object.
 *
 *  Arguments are the same as in FileLoader.setContent method.
 * @param {HTMLElement | String} [content = null]
 * @param {String} [className = '']
 * @param {Number} [flags = 0]
 * @return {FileSlot}
 *  The new slot.
 */
FileLoader.prototype.createSlot = function (content, className, flags) {
    'use strict';
    var slot = new FileSlot();
    slot.attach(this);
    slot.setContent(content, className, flags);
    return slot;
};

/** Create a slot from a file and append it to the FileLoader.
 * @param {File} file
 * @return {FileSlot}
 * @private */
FileLoader.prototype._loadFile = function (file) {
    'use strict';
    var slot = this.createSlot(null, 'js-fileslot-loading');
    var isValid, callback;

    // Detect type
    var acceptedTypes = this.allowedTypes || {};
    var subTypes = file.type.split('/');
    var isText = (subTypes[0] === 'text');
    var partialType;
    while (subTypes.length) {
        partialType = subTypes.join('/');
        isValid = isValid || acceptedTypes[partialType];
        callback = callback || FileSlot.Loader[partialType];
        subTypes.pop();
    }
    isValid = isValid || !this.allowedTypes;
    callback = callback || FileSlot.Loader._default;

    // Check type
    if (!isValid) {
        setTimeout(function () { slot.remove(); }, FileLoader.INVALID_TYPE_DELAY);
        slot.setContent('invalid type', 'js-fileslot-invalid', FileSlot.UNSELECTABLE);
        return;
    }

    // Read file
    var reader = new FileReader();
    reader.onerror = function () {
        slot.setContent(null, 'js-fileslot-error');
    };
    reader.onload = function () {
        slot.readFileMetadata(file);
        callback.call(slot, reader.result, file);
    };
    if (isText) {
        reader.readAsText(file);
    } else {
        reader.readAsDataURL(file);
    }
};

/** Ask for files.
 *
 *  *Note*: the browser may restrict this function to a user-triggered action (such as a click).
 * @param {Function} callback
 *  Function called on the resulting `FileList`.
 * @param {String} filter
 *  File filter, as a coma-separated list of MIME types.
 * @private @static */
FileLoader._promptFiles = function (callback, filter) {
    'use strict';
    if (!this._inputFileElement) {
        this._inputFileElement = FileLoader.Dom.createChild(null, 'input', 'type', 'file', 'multiple', 'multiple');
    }
    this._inputFileElement.onchange = function () {
        callback(this.files);
    };
    this._inputFileElement.accept = filter || '';
    this._inputFileElement.click();
};

/** Compute the size of the thumbnail.
 * @param {Number} width
 * @param {Number} height
 * @param {Mixed} [out]
 *  Object whose fields `width` and `height` will be set.
 * @return {Object}
 *  The `out` object with fields `width` and `height` containing the thumbnail size.
 * @static */
FileLoader.getThumbnailSize = function (width, height, out) {
    'use strict';
    out = out || {};
    var rw = FileLoader.THUMBNAIL_MAX_WIDTH / width;
    var rh = FileLoader.THUMBNAIL_MAX_HEIGHT / height;
    var r = Math.min(1, rw, rh);
    out.width = Math.round(r * width);
    out.height = Math.round(r * height);
    return out;
};


/** Initialize the event listeners.
 * @param {FileLoader} that
 * @static @private */
FileLoader._initEventListeners = function (that) {
    'use strict';
    that._uploadArea.onclick = function () {
        that.loadFiles();
    };
    that._domElement.ondragover = function (evt) {
        evt.preventDefault();
        that._uploadArea.className = 'js-fileslot js-fileslot-dragover';
    };
    that._domElement.ondragleave = function () {
        that._uploadArea.className = 'js-fileslot js-fileslot-ghost';
    };
    that._domElement.ondrop = function (evt) {
        evt.preventDefault();
        that._uploadArea.className = 'js-fileslot js-fileslot-ghost';
        that.loadFiles(evt.dataTransfer.files);
    };
};


//////  EVENTS  ////////////////////////////////////////////////////////////////

/** Fired when a slot is being selected or unselected.
 * @param {FileSlot} slot
 * @param {Boolean} nowSelected
 *  `true` iff the FileSlot is selected after the action.
 * @event */
FileLoader.prototype.onchange = function () {
    'use strict';
    return;
};

/** Fired when a (selectable) slot is being clicked (before the click is processed).
 * @param {FileSlot} slot
 * @param {MouseEvent} event
 * @event */
FileLoader.prototype.onclick = function () {
    'use strict';
    return;
};

/** Fired when a slot data is loaded.
 * @param {FileSlot} slot
 * @event */
FileLoader.prototype.onload = function () {
    'use strict';
    return;
};

/** Fired when a (selectable) slot is removed from its FileLoader.
 * @param {FileSlot} slot
 * @event */
FileLoader.prototype.onremove = function () {
    'use strict';
    return;
};


//////  DOM FUNCTIONS  /////////////////////////////////////////////////////////

/** Provides DOM manipulation functions.  @singleton */
FileLoader.Dom = {};

/** Remove all the children of a given node.
 * @param {HTMLElement} elmt
 */
FileLoader.Dom.removeChildren = function (elmt) {
    'use strict';
    while (elmt.firstChild) {
        elmt.removeChild(elmt.firstChild);
    }
};

/** Create an element with given attributes and append it to another node.
 *
 *  The function support any number of attribute name/value pairs:
 *
 *     var elmt = Dom.createChild(null, 'div', 'id', 'myContainer', 'class', 'container');
 * @param {HTMLElement} parent
 *  Where to append the new element, or `null` to keep it orphan.
 * @param {String} elmtName
 *  Name of the HTML element to be created.
 * @return {HTMLElement}
 *  The created element.
 */
FileLoader.Dom.createChild = function(parent, elmtName) {
    'use strict';
    var elmt = document.createElement(elmtName);
    if (parent) {
        if (parent instanceof HTMLElement) {
            parent.appendChild(elmt);
        } else {
            throw new Error('First argument is invalid: must be an existing node, or null.');
        }
    }
    var k, n = arguments.length;
    if (n % 2) {
        console.warn('Odd number of arguments.');
    }
    for (k = 2; k + 1 < n; k += 2) {
        elmt.setAttribute(arguments[k], arguments[k + 1]);
    }
    return elmt;
};


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** @class FileSlot
 * Handle a slot in a FileLoader interface.
 */

/** @constructor @private
 * Create an empty slot.
 */
function FileSlot() {
    'use strict';
    var Dom = FileLoader.Dom;

    /** HTML slot container.  @private @type {HTMLElement} */
    this._domElement = Dom.createChild(null, 'div', 'class', 'js-fileslot');

    /** The 'delete' button.  @private @type {HTMLElement} */
    this._deleteButtonElement = Dom.createChild(null, 'div', 'class', 'jsfs-delete-button');

    /** Parent FileLoader.  @readonly @type {FileLoader} */
    this.fileLoader = null;

    /** File data.  @type {Mixed} */
    this.data = null;

    /** File MIME type.  @type {String} */
    this.type = null;

    /** File name.  @type {String} */
    this.name = null;

    /** File size, in bytes.  @type {Number} */
    this.size = 0;

    // Setup HTML & events
    FileSlot._initEventListeners(this);

    return this;
}


/** Flag for undeletable slots (no "delete" button).  @readonly @static @type {Number} */
FileSlot.UNDELETABLE = 1;
/** Flag for unselectable slots (not selected by click).  @readonly @static @type {Number} */
FileSlot.UNSELECTABLE = 2;
/** Combination of UNDELETABLE and UNSELECTABLE flags.  @readonly @static @type {Number} */
FileSlot.UNCONTROLLABLE = FileSlot.UNDELETABLE | FileSlot.UNSELECTABLE;


//////  MEMBER METHODS  ////////////////////////////////////////////////////////

/** Test whether the slot is selected.
 * @return {Boolean}
 *  `true` iff the slot is selected.
 */
FileSlot.prototype.isSelected = function() {
    'use strict';
    if (!this.fileLoader) {
        return false;
    }
    return (this.fileLoader.getSelection().indexOf(this) !== -1);
};

/** Set the HTML content of a slot.
 * @param {HTMLElement | String} [content = null]
 *  New content, as a DOM element or a text string.
 * @param {String} [className = '']
 *  CSS class for the slot.
 * @param {Number} [flags = 0]
 *  Flags. Can be: UNDELETABLE, UNSELECTABLE, or UNCONTROLLABLE (which means both).
 */
FileSlot.prototype.setContent = function (content, className, flags) {
    'use strict';
    var Dom = FileLoader.Dom;
    var elmt = this._domElement;

    // Set DOM content
    Dom.removeChildren(elmt);
    if (!(flags & FileSlot.UNDELETABLE)) {
        elmt.appendChild(this._deleteButtonElement);
    }
    if (typeof content === 'string') {
        Dom.createChild(elmt, 'pre').appendChild(document.createTextNode(content));
    } else if (content) {
        elmt.appendChild(content);
    }

    // Set class
    elmt.className = 'js-fileslot';
    var newClasses = className ? className.split(/\s+/).reverse() : [];
    if (this.isSelected()) {
        newClasses.push('js-fileslot-selected');
    }
    while (newClasses.length) {
        elmt.classList.add(newClasses.pop());
    }

    // Set event listener
    var that = this;
    this._domElement.onclick = (flags & FileSlot.UNSELECTABLE) ? null : function (evt) {
        that._notifyClick(evt);
    };
};

/** Set the properties from a file. */
FileSlot.prototype.readFileMetadata = function (file) {
    'use strict';
    this.type = file.type;
    this.name = file.name;
    this.size = file.size;
};

/** Detach a slot from its current file loader (if any).
 * @private
 */
FileSlot.prototype._detach = function () {
    'use strict';
    if (this.fileLoader) {
        this.unselect();
        this.fileLoader._domElement.removeChild(this._domElement);
        this.fileLoader.slots.splice(this.fileLoader.slots.indexOf(this), 1);
        this.fileLoader = null;
    }
};

/** Move the slot at a given position in the given FileLoader.
 * @param {FileLoader | FileSlot} [dest = this.fileLoader]
 *  Move the slot at the end of a FileLoader, or just before the given FileSlot.
 */
FileSlot.prototype.attach = function (dest) {
    'use strict';
    var slot = (dest instanceof FileSlot) ? dest : null;
    var fileLoader = slot ? slot.fileLoader : (dest || this.fileLoader);
    if (!fileLoader) {
        throw new Error('No destination available: this slot has no FileSlot and no argument is given.');
    }
    if (fileLoader !== this.fileLoader) {
        this._detach();
        this.fileLoader = fileLoader;
        this.fileLoader.slots.push(this);
        this.fileLoader._domElement.insertBefore(this._domElement, slot || this.fileLoader._uploadArea);
    }
};

/** Select the slot.
 * @return {Boolean}
 *  `true` iff the slot was unselected and has thus been actually selected.
 */
FileSlot.prototype.select = function() {
    'use strict';
    var done;
    var fl = this.fileLoader;
    if (!fl) {
        throw new Error('Cannot select the slot: it must be attached first.');
    }
    if (!fl.allowsMultipleSelection()) {
        if (fl._selection !== this) {
            if (fl._selection) {
                fl._selection.unselect();
            }
            fl._selection = this;
            done = true;
        }
    } else {
        if (fl._selection.indexOf(this) === -1) {
            fl._selection.push(this);
            done = true;
        }
    }
    if (done) {
        this._domElement.classList.add('js-fileslot-selected');
        this._notifyChange(true);
    }
    return done;
};

/** Unselect the slot.
 * @return {Boolean}
 *  `true` iff the slot was selected and has thus been actually unselected.
 */
FileSlot.prototype.unselect = function() {
    'use strict';
    var done = false;
    var fl = this.fileLoader;
    if (fl) {
        if (!fl.allowsMultipleSelection()) {
            if (fl._selection === this) {
                fl._selection = null;
                done = true;
            }
        } else {
            var k = fl._selection.indexOf(this);
            if (k !== -1) {
                fl._selection.splice(k, 1);
                done = true;
            }
        }
    }
    if (done) {
        this._domElement.classList.remove('js-fileslot-selected');
        this._notifyChange(false);
    }
    return done;
};

/** Toggle the slot (switch it between selected and unselected).
 * @return {Boolean}
 *  `true` iff the slot is now selected.
 */
FileSlot.prototype.toggle = function() {
    'use strict';
    var wasSelected = this.isSelected();
    if (wasSelected) {
        this.unselect();
    } else {
        this.select();
    }
    return !wasSelected;
};

/** Delete the slot and its content. */
FileSlot.prototype.remove = function () {
    'use strict';
    var fileLoader = this.fileLoader;
    this._detach();
    this.type = null;
    this.name = null;
    this.data = null;
    this._notifyRemove(fileLoader);
};

/** Set the loaded data to the object and trigger appropriate events.
 * @param {Mixed} data
 *  The data to be stored in the object.
 * @private
 */
FileSlot.prototype._dataLoaded = function (data) {
    'use strict';
    this.data = data;
    this._notifyLoad();
    var fl = this.fileLoader;
    if (fl && !fl.allowsMultipleSelection() && fl.isSelectionEmpty()) {
        this.select();
    }
};

/** Initialize the event listeners.
 * @param {FileSlot} that
 * @static @private */
FileSlot._initEventListeners = function (that) {
    'use strict';
    that._deleteButtonElement.onclick = function (evt) {
        evt.stopPropagation();
        that.remove();
    };
};

/** Create the thumbnail of a video and auto-update it.
 *  The video must be ready to play, otherwise initial thumbnails will be blank.
 *
 *  This is based on the `ontimeupdate` event of the video.
 * @param {HTMLElement} videoElement
 * @param {Number} [refreshInterval = null]
 *  The time (in ms) between two refresh of the thumbnail when the video is playing.
 * @param {Number} [flags = null]
 *  Slot flags (same as FileSlot.setContent).
 */
FileSlot.prototype.setVideoThumbnail = function (videoElement, refreshInterval, flags) {
    'use strict';

    // Create and update thumbnail
    var image = new Image();
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var updateThumbnail = function () {
        if (videoElement.videoWidth && videoElement.videoHeight) {
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            ctx.drawImage(videoElement, 0, 0);
            image.src = canvas.toDataURL();
        }
    };

    // Append it to the slot
    FileLoader.getThumbnailSize(videoElement.videoWidth, videoElement.videoHeight, image);
    updateThumbnail();
    this.setContent(image, 'js-fileslot-T-image', flags);

    // Refresh it regularly
    var lastUpdate = 0;
    refreshInterval = refreshInterval || FileLoader.THUMBNAIL_REFRESH_INTERVAL;
    videoElement.ontimeupdate = function () {
        var now = new Date().getTime();
        if (now - lastUpdate > refreshInterval) {
            lastUpdate = now;
            updateThumbnail();
        }
    };
};

//////  EVENTS  ////////////////////////////////////////////////////////////////

/** Notify a click on the slot.
 * @private */
FileSlot.prototype._notifyClick = function (evt) {
    'use strict';
    this.onclick(evt);
    if (this.fileLoader) {
        this.fileLoader.onclick(this, evt);
    }
    var fl = this.fileLoader;
    if (fl.allowsMultipleSelection()) {
        this.toggle();
    } else {
        var selected = fl.getSelection(true);
        if (selected !== this) {
            if (selected) {
                selected.unselect();
            }
            this.select();
        }
    }
};

/** Notify a change on the slot selection.
 * @param {Boolean} nowSelected
 *  `true` iff the FileSlot is selected after the change.
 * @private
 */
FileSlot.prototype._notifyChange = function (nowSelected) {
    'use strict';
    this.onchange(nowSelected);
    if (this.fileLoader) {
        this.fileLoader.onchange(this, nowSelected);
    }
};

/** Notify the slot content is loaded.
 * @private
 */
FileSlot.prototype._notifyLoad = function () {
    'use strict';
    this.onload();
    if (this.fileLoader) {
        this.fileLoader.onload(this);
    }
};

/** Notify the slot is removed.
 * @param {FileLoader} fileLoader
 *  The FileLoader it was removed from.
 * @private
 */
FileSlot.prototype._notifyRemove = function (fileLoader) {
    'use strict';
    if (this._domElement.onclick) {
        this.onremove(fileLoader);
        fileLoader.onremove(this);
    }
};

/** Fired when a slot is being selected or unselected.
 * @param {Boolean} nowSelected
 *  `true` iff the FileSlot is selected after the action.
 * @event */
FileSlot.prototype.onchange = function () {
    'use strict';
    return;
};

/** Fired when a (selectable) slot is being clicked (before the click is processed).
 * @param {MouseEvent} event
 * @event */
FileSlot.prototype.onclick = function () {
    'use strict';
    return;
};

/** Fired when a slot data is loaded.
 * @event */
FileSlot.prototype.onload = function () {
    'use strict';
    return;
};

/** Fired when a (selectable) slot is removed from its FileLoader.
 * @param {FileLoader} fileLoader
 *  The FileLoader it was removed from.
 * @event */
FileSlot.prototype.onremove = function () {
    'use strict';
    return;
};


//////  LOADING FUNCTIONS  /////////////////////////////////////////////////////

/** Slot data-loading functions.  @singleton
 *
 * They must call FileLoader._dataLoaded to store the loaded data and trigger appropriate events.
 *
 * They are called with the following arguments:
 *
 *  * `this`: the current `FileSlot`.
 *  * `data`: the read data (as DataURL, except for files of type text/&#42;).
 *  * `file`: the `File` object.
 *
 */
FileSlot.Loader = {};

/** Store the dataURL directly. */
FileSlot.Loader._default = function (dataURL) {
    'use strict';
    this.setContent(this.type, 'js-fileslot-unknown');
    this._dataLoaded(dataURL);
};

/** Store the text and display a thumbnail. */
FileSlot.Loader.text = function (text) {
    'use strict';
    var elmt = FileLoader.Dom.createChild(null, 'pre');
    elmt.appendChild(document.createTextNode(text));
    this.setContent(elmt, 'js-fileslot-T-text');
    this._dataLoaded(text);
};

/** Store the image as a HTML element and display a thumbnail. */
FileSlot.Loader.image = function (dataURL) {
    'use strict';
    var that = this;
    var im = new Image();
    im.onload = function () {
        var thb = new Image();
        thb.src = im.src;
        FileLoader.getThumbnailSize(im.width, im.height, thb);
        that.setContent(thb, 'js-fileslot-T-image');
        that._dataLoaded(im);
    };
    im.src = dataURL;
};

/** Store the video as a HTML element and display a thumbnail. */
FileSlot.Loader.video = function (dataURL) {
    'use strict';
    var that = this;
    var video = document.createElement('video');
    video.controls = true;
    video.oncanplaythrough = function () {
        video.width = video.videoWidth;
        video.height = video.videoHeight;
        that.setVideoThumbnail(video);
        that.onchange = function (selected) {
            if (selected) {
                video.play();
            } else {
                video.pause();
            }
        };
        that._dataLoaded(video);
    };
    video.src = dataURL;
};
