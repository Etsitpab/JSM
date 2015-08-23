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
    window.SuperCanvas = function (canvas) {
        if (typeof canvas === 'string' && document.getElementById(canvas)) {
            canvas = document.getElementById(canvas);
        }
        this.canvas = canvas;
        this.getContext = this.canvas.getContext;

        var that = this;
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
        var click = function (e) {
            var coord = getPosition(canvas, e);
            if (that.onclick instanceof Function) {
                that.onclick.bind(that)(coord, e);
            }
        };
        var onMouseWheel = function (event) {
            event.stopPropagation();
            event.preventDefault();
            var coord = getPosition(canvas, event);
            var direction = 0;
            if (event.wheelDelta) {
                direction = -event.wheelDelta / 120.0;
            } else if (event.detail) {
                direction = event.detail / 3.0;
            } else {
                throw new Error('Mouse wheel error: What your browser is ?');
            }
            if (that.onmousewheel instanceof Function) {
                that.onmousewheel.bind(that)(direction * 0.01, coord, event);
            }
        };

        var onMouseDown = function (event) {
            event.stopPropagation();
            event.preventDefault();
            that.coordDown = getPosition(canvas, event);
            that.coordDown.clientX = event.clientX;
            that.coordDown.clientY = event.clientY;
            that.mousedown(that.coordDown, event);
        };
        var onMouseMove = function (event) {
            event.stopPropagation();
            event.preventDefault();
            var coord = getPosition(canvas, event);
            that.mousemove(coord, event);
        };
        var onMouseUp = function (event) {
            event.stopPropagation();
            event.preventDefault();
            var newCoord = getPosition(canvas, event);
            var oldCoord = that.coordDown;
            if (oldCoord === undefined) {
                return;
            }
            // Both coordinates are the same
            if (oldCoord.clientX === event.clientX && oldCoord.clientY === event.clientY) {
                if (that.onclick && typeof that.onclick === 'function') {
                    that.onclick(newCoord, event);
                }
                // Else fire event mouseup
            } else {
                if (that.mouseup && typeof that.mouseup === 'function') {
                    that.mouseup(newCoord, event);
                }
            }
            that.coordDown = undefined;
            return false;
        };
        // this.canvas.addEventListener("click", click);
        this.canvas.addEventListener('DOMMouseScroll', onMouseWheel, false);
        this.canvas.addEventListener('mousewheel', onMouseWheel, false);
        this.canvas.addEventListener('mousedown', onMouseDown, false);
        this.canvas.addEventListener('mousemove', onMouseMove, false);
        this.canvas.addEventListener('mouseup', onMouseUp, false);
    };

    SuperCanvas.prototype.onclick = function (coord, e) {
        console.log(coord);
    };

    SuperCanvas.prototype.onmousewheel = function (direction, coord) {
        var scale = 1 - 4 * direction;
        this.translate(-coord[0], -coord[1]);
        this.zoom(scale, scale);
        this.translate(coord[0], coord[1]);
        this.update();
    };

    SuperCanvas.prototype.mousedown = function (coord, event) {
        if (event.shiftKey) {
            // this.startSelectArea(coord);
        }
    };

    SuperCanvas.prototype.mousemove = function (coord, event) {
        var oldCoord = this.coordDown;
        if (oldCoord === undefined) {
            return;
        }
        if (event.shiftKey) {
            // this.updateSelectArea(oldCoord, newCoord);
        } else {
            // this.cancelSelectArea();
            this.translate(coord[0] - oldCoord[0], coord[1] - oldCoord[1]);
            this.update();
            this.coordDown = coord;
        }
    };

    SuperCanvas.prototype.mouseup = function (coord, event) {
        var oldCoord = this.coordDown;
        var newCoord = coord;
        if (event.shiftKey) {
            // this.endSelectArea(oldCoord, newCoord);
        } else {
            this.translate(coord[0] - oldCoord[0], coord[1] - oldCoord[1]);
            this.update();
            // this.translateAxis(newCoord.x - oldCoord.x, newCoord.y - oldCoord.y);
        }
    };

    SuperCanvas.prototype.zoom = function (x, y) {
        var z = Matrix.toMatrix([x, 0, 0, 0, y, 0, 0, 0, 1]).reshape([3, 3])
        this.matrix = z.mtimes(this.matrix);
    };

    SuperCanvas.prototype.translate = function (x, y) {
        var t = Matrix.toMatrix([1, 0, 0, 0, 1, 0, x, y, 1]).reshape([3, 3])
        this.matrix = t.mtimes(this.matrix);
    };

    SuperCanvas.prototype.setImage = function (image, noinit) {
        // Draw Image on a canvas
        var sz = image.size(), width = sz[1], height = sz[0];
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').putImageData(image.getImageData(), 0, 0);
        this.image = canvas;

        if (!noinit) {
            // Initialize drawing matrix at good scale and place
            var hScale = this.canvas.width / width;
            var vScale = this.canvas.height / height;
            var scale = Math.min(hScale, vScale);
            this.matrix = Matrix.eye(3);
            this.translate(-width / 2, -height / 2);
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
        var c = this.matrix.get([0, 1]).getData();
        ctx.setTransform(c[0], c[1], c[2], c[3], c[4], c[5]);
        ctx.drawImage(this.image, 0, 0, this.image.width, this.image.height);
    };
})();
