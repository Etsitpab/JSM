/*jslint vars: true, nomen: true */
/*global FileLoader, FileSlot, Webcam */


/** @class FileLoader */

/** Add available Webcams as new slots.
 * FileSlot.onload event is fired when the Webcam is ready to play. */
FileLoader.prototype.appendWebcams = function () {
    'use strict';
    var that = this;
    if (!Webcam) {
        return;
    }
    Webcam.forEach(function (cam) {
        var slot = that.createSlot('Camera: ' + cam.name, null, FileSlot.UNDELETABLE);
        slot.type = 'webcam';
        slot.name = cam.name;
        cam.onready = function () {
            slot.setVideoThumbnail(cam.videoElement, null, FileSlot.UNDELETABLE);
            cam.onready = function () {
                slot._dataLoaded(cam.videoElement);
            };
            cam.onready();
        };
        slot.onchange = function (select) {
            if (select) {
                cam.start();
            } else {
                slot.data = null;
                cam.stop();
            }
        };
    });
};
