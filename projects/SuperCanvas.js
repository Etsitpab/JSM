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

(function () {
    "use strict";
    
    window.SuperCanvas = function (parent) {
        if (typeof parent === 'string' && document.getElementById(parent)) {
            parent = document.getElementById(parent);
        }
        this.images = [];
        this.currentBuffer = 0;
        this.coordinates = {
            current: undefined,
            previous: undefined,
            startSelection: undefined
        };
        initCanvas.bind(this)(parent)
        initEvent.bind(this)();
    };

    var initCanvas = function (parent) {
        this.canvas = document.createElement("canvas");
        parent.appendChild(this.canvas);
        this.canvas.width = parent.offsetWidth;
        this.canvas.height = parent.offsetHeight;
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
            coord = this.matrix.inv().mtimes(coord).getData();
            var im = this.images[this.currentBuffer];
            var x = Math.floor(coord[0]), y = Math.floor(coord[1])
            if (typeof this.click === 'function') {
                if (x >= 0 && y >= 0 && x < im.width && y < im.height) {
                    this.click([x, y], event);
                }
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
            if (this.mouseWheel instanceof Function) {
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
            if (event.shiftKey) {
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
                this.translate(current[0] - previous[0], current[1] - previous[1]);
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
                    var matrix = this.matrix.inv();
                    var start = this.coordinates.startSelection;
                    start = Matrix.toMatrix([start[0], start[1], 1]);
                    start = matrix.mtimes(start).get([0, 1]).floor().getData();
                    var end = Matrix.toMatrix([current[0], current[1], 1]);
                    end = matrix.mtimes(end).get([0, 1]).floor().getData();
                    if (this.selectArea) {
                        this.selectArea(start, end);
                    }
                } else  {
                    var previous = this.coordinates.previous;
                    this.translate(current[0] - previous[0], current[1] - previous[1]);
                }
            }
            this.update();
            this.coordinates.startSelection = undefined;
            this.coordinates.previous = undefined;
            this.selectionOccurs = undefined;
            return false;
        }.bind(this);
        var onMouseOut = function (event) {
            this.coordinates.startSelection = undefined;
            this.coordinates.previous = undefined;
            this.selectionOccurs = false;
        }.bind(this);
        var onResize = function (event) {
            var canvasXSize = this.canvas.parentNode.offsetWidth;
            var canvasYSize = this.canvas.parentNode.offsetHeight;
            this.canvas.width = canvasXSize;
            this.canvas.height = canvasYSize;
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
    
    SuperCanvas.prototype.zoom = function (x, y) {
        var z = Matrix.toMatrix([x, 0, 0, 0, y, 0, 0, 0, 1]).reshape([3, 3])
        this.matrix = z.mtimes(this.matrix);
    };

    SuperCanvas.prototype.translate = function (x, y) {
        var t = Matrix.toMatrix([1, 0, 0, 0, 1, 0, x, y, 1]).reshape([3, 3])
        this.matrix = t.mtimes(this.matrix);
    };

    SuperCanvas.prototype.click = function (coord, e) {
        console.log(coord);
    };

    SuperCanvas.prototype.mouseWheel = function (direction, coord) {
        var scale = 1 - 4 * direction;
        this.translate(-coord[0], -coord[1]);
        this.zoom(scale, scale);
        this.translate(coord[0], coord[1]);
        this.update();
    };

    SuperCanvas.prototype.selectArea = function (start, end) {};

    SuperCanvas.prototype.setImageBuffer = function (image, buffer) {
        // Draw Image on a canvas
        var canvas = document.createElement('canvas'),
            context = canvas.getContext('2d');
        if (image instanceof Matrix) {
            var sz = image.size(), width = sz[1], height = sz[0];
            canvas.width = width;
            canvas.height = height;
            context.putImageData(image.getImageData(), 0, 0);
        } else if (image instanceof Image) {
            canvas.width = image.width;
            canvas.height = image.height;
            context.drawImage(image, 0, 0);
        }

        // Set image buffer
        buffer = buffer === undefined ? this.images.length : buffer;
        this.images[buffer] = canvas;
        this.currentBuffer = buffer;
        return buffer;
    };
    
    SuperCanvas.prototype.displayImageBuffer = function (b, noinit) {
        // Draw Image on a canvas
        b = b === undefined ? this.currentBuffer : b;
        this.currentBuffer = b;

        if (!noinit) {
            var im = this.images[b];
            // Initialize drawing matrix at good scale and place
            var hScale = this.canvas.width / im.width;
            var vScale = this.canvas.height / im.height;
            var scale = Math.min(hScale, vScale);
            this.matrix = Matrix.eye(3);
            this.translate(-im.width / 2, -im.height / 2);
            this.zoom(scale, scale);
            this.translate(this.canvas.width / 2, this.canvas.height / 2);
        }
        this.update();
    };

    SuperCanvas.prototype.update = function () {
        var ctx = this.canvas.getContext('2d');

        // Clear the canvas
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();

        // Draw the image
        var image = this.images[this.currentBuffer];
        var c = this.matrix.get([0, 1]).getData();
        ctx.setTransform(c[0], c[1], c[2], c[3], c[4], c[5]);
        ctx.drawImage(image, 0, 0, image.width, image.height);
    };
})();
