/*
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @author Baptiste Mazin     <baptiste.mazin@telecom-paristech.fr>
 * @author Guillaume Tartavel <guillaume.tartavel@telecom-paristech.fr>
 */

/*
* TODO Add documentation
* TODO Add one Matrix per buffer option
* TODO Add export selection possibility
* TODO Add arrow navigation and something like double click center the clicked point
* TODO Option to zoom yhike keeping the same center
* TODO Add grid or some king of guide
*/
(function () {
    "use strict";

    window.SuperCanvas = function (parent) {
        if (typeof parent === 'string' && document.getElementById(parent)) {
            parent = document.getElementById(parent);
        }

        this.buffers = [];

        this.currentBuffer = 0;
        this.coordinates = {
            current: undefined,
            previous: undefined,
            startSelection: undefined
        };
        // Determine whether or not the zoomed image is smoothed or not
        this.imageSmoothing = false;
        initCanvas.bind(this)(parent)
        initEvent.bind(this)();
    };

    var initCanvas = function (parent) {
        if (parent !== undefined) {
            this.canvas = document.createElement("canvas");
            parent.appendChild(this.canvas);
        }
        this.canvas.width = this.canvas.parentNode.offsetWidth;
        this.canvas.height = this.canvas.parentNode.offsetHeight;
        this.canvas.getContext('2d').imageSmoothingEnabled = this.imageSmoothing;
    };

    var getPosition = function (e, event) {
        var left = 0, top = 0;
        while (e.offsetParent !== undefined && e.offsetParent !== null) {
            left += e.offsetLeft + (e.clientLeft !== null ? e.clientLeft : 0);
            top += e.offsetTop + (e.clientTop !== null ? e.clientTop : 0);
            e = e.offsetParent;
        }
        left = -left + event.pageX;
        top = -top + event.pageY;
        return [left, top];
    };

    var getCurrentMatrix = function (obj) {
        if (obj.matrix === undefined) {
            return;
        }
        return obj.buffers[obj.currentBuffer].matrix.mtimes(obj.matrix);
    }
    var setCurrentMatrix = function (obj, matrix, relative) {
        if (relative === true) {
            obj.buffers[obj.currentBuffer].matrix = matrix;
        } else {
            obj.matrix = matrix;
        }
    }

    var drawRectangle = function (canvas, start, current) {
        var ctx = canvas.getContext("2d");
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = "2";
        ctx.setLineDash([6]);
        ctx.strokeStyle = "white";
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        var x = Math.min(start[0], current[0]),
            y = Math.min(start[1], current[1]),
            w = Math.abs(current[0] - start[0]),
            h = Math.abs(current[1] - start[1]);
        ctx.rect(x, y, w, h);
        ctx.stroke();
        ctx.restore();
    };

    var initEvent = function () {
        var onClick = function (event) {
            var coord = getPosition(this.canvas, event);
            coord = Matrix.toMatrix([coord[0], coord[1], 1]);
            coord = getCurrentMatrix(this).inv().mtimes(coord).getData();
            var im = this.buffers[this.currentBuffer].canvas;
            var x = Math.floor(coord[0]), y = Math.floor(coord[1]);
            // Left click
            if (event.which === 1 && typeof this.click === 'function') {
                if (x >= 0 && y >= 0 && x < im.width && y < im.height) {
                    this.click([x, y], event);
                }
            // Middle click open current buffer in a new tab
            } else if (event.which === 2) {
                var w = window.open(undefined, '_blank');
                var newCanvas = document.createElement('canvas');
                var context = newCanvas.getContext('2d');
                newCanvas.width = im.width;
                newCanvas.height = im.height;
                context.drawImage(im, 0, 0);
                w.document.body.appendChild(newCanvas);
                window.focus();
            // Right click
            } else if (event.which === 3 && typeof this.click === 'function') {
            }
        }.bind(this);
        var onMouseWheel = function (event) {
            event.stopPropagation();
            event.preventDefault();
            var coord = getPosition(this.canvas, event);
            var direction = 0;
            if (event.wheelDelta) {
                direction = -event.wheelDelta / 120.0;
            } else if (event.detail) {
                direction = event.detail / 3.0;
            } else {
                throw new Error('Mouse wheel error: What your browser is ?');
            }
            // Ctrl+Wheel: Change buffer
            if (event.ctrlKey && !event.shiftKey && !event.metaKey && !event.altKey) {
                this.currentBuffer += direction > 0 ? 1 : -1
                if (this.currentBuffer >= this.buffers.length) {
                    this.currentBuffer = 0;
                } else if (this.currentBuffer < 0) {
                    this.currentBuffer = this.buffers.length - 1;
                }
                // console.log("Buffer", this.currentBuffer, "is now selected.");
                this.update();
                if (this.bufferChange instanceof Function) {
                    this.bufferChange(this.currentBuffer);
                }
            // Wheel: Zoom
            } else if (this.mouseWheel instanceof Function) {
                this.mouseWheel.bind(this)(direction * 0.01, coord, event);
            }
        }.bind(this);
        var onMouseDown = function (event) {
            event.stopPropagation();
            event.preventDefault();
            var coords = this.coordinates;
            coords.startSelection = getPosition(this.canvas, event);
            coords.startSelection.clientX = event.clientX;
            coords.startSelection.clientY = event.clientY;
            coords.previous = coords.startSelection.slice();
            if (event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
                this.selectionOccurs = true;
            }
        }.bind(this);
        var onMouseMove = function (event) {
            event.stopPropagation();
            event.preventDefault();
            var current = getPosition(this.canvas, event);
            var previous = this.coordinates.previous;
            if (previous === undefined) {
                return;
            }
            if (this.selectionOccurs) {
                var start = this.coordinates.startSelection;
                this.update();
                drawRectangle(this.canvas, start, current);
            } else {
                this.translate(current[0] - previous[0], current[1] - previous[1], event.shiftKey && event.ctrlKey && !event.altKey && !event.metaKey);
                this.update();
                this.coordinates.previous = current;
            }
        }.bind(this);
        var onMouseUp = function (event) {
            event.stopPropagation();
            event.preventDefault();
            var start = this.coordinates.startSelection;
            if (start === undefined) {
                return;
            }
            // Both coordinates are the same
            if (start.clientX === event.clientX && start.clientY === event.clientY) {
                onClick(event);
            // Else fire event mouseup
            } else {
                var current = getPosition(this.canvas, event);
                if (this.selectionOccurs) {
                    var matrix = getCurrentMatrix(this).inv();
                    var start = this.coordinates.startSelection;
                    start = Matrix.toMatrix([start[0], start[1], 1]);
                    start = matrix.mtimes(start).get([0, 1]).floor().getData();
                    var end = Matrix.toMatrix([current[0], current[1], 1]);
                    end = matrix.mtimes(end).get([0, 1]).floor().getData();
                    if (this.selectArea) {
                        this.selectArea(start, end, event);
                    }
                } else  {
                    var previous = this.coordinates.previous;
                    this.translate(current[0] - previous[0], current[1] - previous[1], event.shiftKey && event.ctrlKey && !event.altKey && !event.metaKey);
                }
            }
            this.update();
            this.coordinates.startSelection = undefined;
            this.coordinates.previous = undefined;
            this.selectionOccurs = undefined;
            return false;
        }.bind(this);
        var onMouseOut = function () {
            this.coordinates.startSelection = undefined;
            this.coordinates.previous = undefined;
            this.selectionOccurs = false;
        }.bind(this);
        var onResize = function () {
            initCanvas.bind(this)();
            this.update()
        }.bind(this);
        this.canvas.addEventListener('DOMMouseScroll', onMouseWheel, false);
        this.canvas.addEventListener('mousewheel', onMouseWheel, false);
        this.canvas.addEventListener('mousedown', onMouseDown, false);
        this.canvas.addEventListener('mousemove', onMouseMove, false);
        this.canvas.addEventListener('mouseup', onMouseUp, false);
        this.canvas.addEventListener('mouseout', onMouseOut, false);
        window.addEventListener("resize", onResize);
    };

    SuperCanvas.prototype.zoom = function (x, y, relative) {
        var m = relative === true ? this.buffers[this.currentBuffer].matrix : this.matrix;
        var z = Matrix.toMatrix([x, 0, 0, 0, y, 0, 0, 0, 1]).reshape([3, 3]);
        var matrix = z.mtimes(m);
        setCurrentMatrix(this, matrix, relative);
        return this;
    };

    SuperCanvas.prototype.translate = function (x, y, relative) {
        var mainMatrix = this.matrix;
        var m = relative === true ? this.buffers[this.currentBuffer].matrix : mainMatrix;
        var t = Matrix.toMatrix([1, 0, 0, 0, 1, 0, x, y, 1]).reshape([3, 3]);
        setCurrentMatrix(this, t.mtimes(m), relative);
        return this;
    };

    SuperCanvas.prototype.setZoomFactor = function (fx, fy, relative) {
        var data = getCurrentMatrix(this).getData(), actualZoomFactor = data[0];
        var width = this.canvas.width, height = this.canvas.height;
        var relative = event.shiftKey && event.ctrlKey && !event.altKey && !event.metaKey;
        this.translate(-width / 2, -height / 2, relative);
        this.zoom(fx / data[0], fy / data[4], relative);
        this.translate(width / 2, height / 2, relative);
        this.update();
        return this;
    };

    SuperCanvas.prototype.click = function (coord, event) {
        // Center on click
        var canvasCoord = getPosition(this.canvas, event);
        var center = [this.canvas.width, this.canvas.height];
        var relative = event.shiftKey && event.ctrlKey && !event.altKey && !event.metaKey;
        this.translate(-canvasCoord[0], -canvasCoord[1], relative);
        this.translate(center[0] / 2, center[1] / 2, relative);
        this.update();
        // console.log(event, canvasCoord);
    };

    SuperCanvas.prototype.mouseWheel = function (direction, coord, event) {
        var scale = 1 - 10 * direction;
        var relative = event.shiftKey && event.ctrlKey && !(event.altKey || event.metaKey);
        // console.log("relative", relative);
        // console.log(event.shiftKey, event.ctrlKey, event.ctrlKey, event.metaKey);
        this.translate(-coord[0], -coord[1], relative);
        this.zoom(scale, scale, relative);
        this.translate(coord[0], coord[1], relative);
        this.update();
    };

    SuperCanvas.prototype.selectArea = function () {};

    SuperCanvas.prototype.clear = function () {
        var ctx = this.canvas.getContext('2d');
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();
    };

    SuperCanvas.prototype.autoView = function (buffer) {
        var mainMatrix = getCurrentMatrix(this);
        // Initialize drawing matrix at good scale and place
        if (buffer === undefined) {
            buffer = this.currentBuffer;
        }
        var canvas = this.buffers[buffer].canvas;
        var hScale = this.canvas.width / canvas.width;
        var vScale = this.canvas.height / canvas.height;
        var scale = Math.min(hScale, vScale);
        setCurrentMatrix(this, Matrix.eye(3));
        this.translate(-canvas.width / 2, -canvas.height / 2);
        this.zoom(scale, scale);
        this.translate(this.canvas.width / 2, this.canvas.height / 2);
        return this;
    };

    SuperCanvas.prototype.setImageBuffer = function (image, buffer, init) {
        // Draw Image on a canvas
        var canvas = document.createElement('canvas'),
            context = canvas.getContext('2d');
        if (image instanceof Matrix) {
            var sz = image.size(), width = sz[1], height = sz[0];
            canvas.width = width;
            canvas.height = height;
            context.putImageData(image.getImageData(), 0, 0);
        } else if (image instanceof Image || image instanceof HTMLCanvasElement) {
            canvas.width = image.width;
            canvas.height = image.height;
            context.drawImage(image, 0, 0);
        }

        // Set image buffer
        buffer = buffer === undefined ? this.buffers.length : buffer;
        this.buffers[buffer] = {
            "canvas": canvas,
            "matrix": Matrix.eye(3)
        };

        if (init === true || (init === undefined && this.matrix === undefined)) {
            this.autoView(buffer);
        }
        return buffer;
    };

    SuperCanvas.prototype.getCanvas = function (buffer) {
        if (buffer === undefined) {
            buffer = this.currentBuffer;
        }
        return this.buffers[buffer].canvas;
    };

    SuperCanvas.prototype.update = function (buffer) {
        // Clear the canvas
        this.clear();
        if (this.buffers.length === 0) {
            return;
        }
        // Define working buffer
        if (buffer === undefined) {
            buffer = this.currentBuffer;
        } else {
            this.currentBuffer = buffer;
        }

        var image = this.buffers[buffer].canvas;
        // Draw the image
        if (image) {
            var c = getCurrentMatrix(this).get([0, 1]).getData();
            var ctx = this.canvas.getContext('2d');
            ctx.setTransform(c[0], c[1], c[2], c[3], c[4], c[5]);
            ctx.drawImage(image, 0, 0, image.width, image.height);
        }
        return this;
    };

    SuperCanvas.prototype.displayImage = function (image, buffer, init) {
        buffer = this.setImageBuffer(image, buffer, init);
        this.update(buffer);
    };
})();
