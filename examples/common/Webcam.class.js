/*jslint nomen: true, vars: true, plusplus: true, bitwise: true, browser: true, devel: true */
/*global URL, MediaStreamTrack */

/** @class FileLoader
 *  @author Guillaume Tartavel
 * A simple webcam interface.
 */

/* Change log
 *  2015-07-14: first version
 */

/** @constructor
 * @param {String} name
 * @param {String} id
 * @private */
function Webcam(name, id) {
    'use strict';
    /** Name of the camera.  @type {String} */
    this.name = name || 'unnamed';

    /** ID of the camera.  @readonly @type {String} */
    this.id = id || null;

    /** Width of the video, when ready.  @readonly @type {Number} */
    this.width = 0;

    /** Height of the video, when ready.  @readonly @type {Number} */
    this.height = 0;

    /** Status of the camera, can be STOPPED, PLAYING, or PAUSED constants.  @readonly @type {Number} */
    this.status = Webcam.STOPPED;

    /** Video element on which the camera is played.  @readonly @type {HTMLElement} */
    this.videoElement = document.createElement('video');
    this.videoElement.autoplay = true;

    /** The webcam stream.  @private @type {Mixed} */
    this._stream = null;

    // Setup listeners
    Webcam._initEventListeners(this);

    return this;
}

/** Constant for "stopped" status.  @readonly @static @type {Number} */
Webcam.STOPPED = 0;
/** Constant for "playing" status.  @readonly @static @type {Number} */
Webcam.PLAYING = 1;
/** Constant for "paused" status.  @readonly @static @type {Number} */
Webcam.PAUSED = -1;


/** Initialize the listeners of a Webcam.
 * @param {Webcam} that
 * @static @private */
Webcam._initEventListeners = function (that) {
    'use strict';
    that.videoElement.addEventListener('canplaythrough', function () {
        that.width = that.videoElement.width = that.videoElement.videoWidth;
        that.height = that.videoElement.height = that.videoElement.videoHeight;
        that.onready();
    });
};

/** List the available Webcams.
 *  In case listing is not possible, the standard Webcam.std will be used instead.
 * @param {Function} callback
 *  Function to be called once the list is available.
 *  Takes a Webcam array as argument.
 * @static */
Webcam.list = function(callback) {
    'use strict';
    if (!MediaStreamTrack || !MediaStreamTrack.getSources) {
        callback([Webcam.std]);
        return;
    }
    MediaStreamTrack.getSources(function(srcs) {
        var k, list = [];
        for (k = 0; k < srcs.length; ++k) {
            if (srcs[k].kind === 'video') {
                list.push(new Webcam(srcs[k].label || srcs[k].facing, srcs[k].id));
            }
        }
        callback(list);
    });
};

/** Apply a function to each available Webcam.
 * @param {Function} callback
 *  Function to be applied to each Webcam.
 *  Takes the Webcam object as first argument.
 *  Takes the number of available Webcams as second argument.
 * @static */
Webcam.forEach = function(callback) {
    'use strict';
    Webcam.list(function (result) {
        result.forEach(function (webcam) {
            callback(webcam, result.length);
        })
    });
};

/** Fired when the Webcam is ready to play (metadata are available).
 * @event */
Webcam.prototype.onready = function () {
    'use strict';
    return;
};

/** Start the Webcam, or restart it if already launched.
 * @param {Function} [errorCallback]
 *  Callback if the Webcam cannot be launched.
 *  Takes the Error element as parameter.
 */
Webcam.prototype.start = function (errorCallback) {
    'use strict';
    var that = this;
    var opts = {'optional': [{'sourceId': this.id}] };
    this.stop();
    navigator.getUserMedia(
        {
            'audio': false,
            'video': this.id ? opts : true
        },
        function (stream) {
            that.videoElement.src = URL ? URL.createObjectURL(stream) : stream;
            that._stream = stream;
            that.status = Webcam.PLAYING;
        },
        errorCallback || function (error) {
            throw new Error('Cannot launch the webcam (' + error.name + ')');
        }
    );
};

/** Stop the Webcam. */
Webcam.prototype.stop = function () {
    'use strict';
    if (this._stream) {
        this._stream.stop();
        this._stream = null;
        this.status = Webcam.STOPPED;
    }
};

/** Pause the Webcam. */
Webcam.prototype.pause = function () {
    'use strict';
    if (this.status === Webcam.PLAYING) {
        this.videoElement.pause();
        this.status = Webcam.PAUSED;
    }
};

/** Resume the Webcam if paused. Does nothing if the Webcam was stopped.
 * @return {Boolean}
 *  `true` iff the Webcam is now playing.
 */
Webcam.prototype.resume = function () {
    'use strict';
    if (this.status === Webcam.PAUSED) {
        this.videoElement.play();
        this.status = Webcam.PLAYING;
        return true;
    }
    return (this.status === Webcam.PLAYING);
};

/** Extract the current frame to a canvas.
 * @param {HTMLElement} [outCanvas]
 *  The canvas to store the picture to.
 * @return {HTMLElement}
 *  The canvas containing the snapshot, or `null` if no image available.
 */
Webcam.prototype.snapshot = function (outCanvas) {
    'use strict';
    var canvas = outCanvas || document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    if (!ctx) {
        return null;
    }
    canvas.width = this.width;
    canvas.height = this.height;
    ctx.drawImage(this.videoElement, 0, 0, this.width, this.height);
    return canvas;
};

// For portability
(function () {
    'use strict';
    window.URL = (window.URL || window.webkitURL || window.mozURL || window.msURL);
    navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia
        || navigator.mozGetUserMedia || navigator.msGetUserMedia);

}());

/** Request a function to be run (synchronize it with the next frame repaint).
 * @param {Function} callback
 *  Function requested to be run ASAP.
 */
Webcam.requestAnimationFrame = (function () {
    'use strict';
    var f = window.requestAnimationFrame
        || window.webkitRequestAnimationFrame
        || window.mozRequestAnimationFrame
        || window.oRequestAnimationFrame
        || window.msRequestAnimationFrame
        || function(callback) { window.setTimeout(callback, 1000 / 60); };
    return function (arg) {
        f.call(window, arg);
    };
}());

/** Standard Webcam (the default one).  @readonly @static @type {Webcam} */
Webcam.std = new Webcam('default');

/** Is `true` iff the webcams can be listed.  @readonly @static @type {Boolean} */
Webcam.listable = Boolean(MediaStreamTrack && MediaStreamTrack.getSources);
