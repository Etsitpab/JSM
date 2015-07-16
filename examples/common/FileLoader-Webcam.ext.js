/*global FileLoader, FileSlot, Webcam */


/** @class FileLoader */

/** Add available Webcams as new slots. */
FileLoader.prototype.appendWebcams = function () {
    'use strict';
    var that = this;
    if (!Webcam) {
        return;
    }
    Webcam.forEach(function (cam) {
        var slot = that.createSlot('Camera: ' + cam.name, null, FileSlot.UNDELETABLE);
        slot.type = 'webcam';
        slot.data = cam.videoElement;
        cam.onready = function () {
            slot.setVideoThumbnail(cam.videoElement, null, FileSlot.UNDELETABLE);
            delete cam.onready;
        };
        slot.onchange = function (select) {
            if (select) {
                cam.start();
            } else {
                cam.stop();
            }
        };
    });
};
