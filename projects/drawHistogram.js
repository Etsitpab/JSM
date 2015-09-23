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

/*global document, Float32Array, Float64Array, console, Matrix, Colorspaces*/
/*jshint white:true */

(function() {

    // Check if code is running inside a browser or not.
    if (typeof window === 'undefined') {
        return;
    }
    
    HTMLCanvasElement.prototype.drawHistogram = function (data, vMax, title, modes, colormap, erase) {
        "use strict";

        var ctx = this.getContext('2d'), xSize = this.width, ySize = this.height;
        var max = 0;
        var xHisto = xSize - 80, yHisto = ySize - 45, binWidth = 0;

        var setTitle = function (title) {
            ctx.font = Math.round(Math.min(xSize, ySize) / 15) + "pt sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = 'middle';

            if (title === undefined) {
                title = "Histogram";
            }
            ctx.fillText(title, xSize / 2, 15);
        };
        var initalize = function (erase) {
            if (erase) {
                ctx.clearRect(0, 0, xSize, ySize);
            }
            // Draw border
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.strokeStyle = "black";
            ctx.strokeRect(0, 0, xSize, ySize);


            // Save properties
            ctx.save();

            // Translation
            ctx.translate((xSize - xHisto) / 2, ySize - 20);

            // Dessin des axes de l'histogramme
            ctx.strokeStyle = "black";
            ctx.lineWidth = 0.5;

            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(xHisto, 0);
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -yHisto);

            ctx.moveTo(0, -0.9 * yHisto);
            ctx.lineTo(-5, -0.9 * yHisto);
            ctx.stroke();

        };
        var setMax = function () {
            ctx.font = "8pt Arial";
            ctx.strokeStyle = "black";
            ctx.fillStyle = "black";

            var i;
            for (i = 0; i < data.length; i++) {
                if (data[i] > max) {
                    max = data[i];
                }
            }
            if (max > vMax) {
                vMax = max;
            }
            if (vMax > 0) {
                vMax = 1 / vMax;
            }
            ctx.beginPath();
            //ctx.fillText(Math.round(100 / vMax) / 100, -21, -0.9 * yHisto);

            ctx.stroke();
        };
        var drawBins = function () {
            var round = Math.round;
            for (var i = 0; i < data.length; i++) {
                var h = -data[i] * vMax * 0.9 * yHisto;
                // Bins color
                ctx.fillStyle = colormap === "hue" ?
                    "hsl(" + round(i / data.length * 360) + ", 100%, 50%" : (colormap ? colormap : "rgb(0, 128, 255)");
                // Draw line
                ctx.fillRect(i * binWidth + 4, 0, binWidth - 4, h);
            }
        };

        var drawModes = function (modes) {
	    // Border color
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgb(255, 0, 128)";
            ctx.beginPath();
            for (var m = 0; m < modes.length; m++) {
                if (modes[m].bins[1] >= modes[m].bins[0]) {
                    ctx.moveTo(modes[m].bins[0] * binWidth + 2, 0);
                    ctx.lineTo(modes[m].bins[0] * binWidth + 2, -0.9 * yHisto);
                    ctx.lineTo((modes[m].bins[1] + 1) * binWidth + 2, -0.9 * yHisto);
                    ctx.lineTo((modes[m].bins[1] + 1) * binWidth + 2, 0);

                } else {
                    ctx.moveTo(modes[m].bins[0] * binWidth + 2, 0);
                    ctx.lineTo(modes[m].bins[0] * binWidth + 2, -0.9 * yHisto);
                    ctx.lineTo(data.length * binWidth + 2, -0.9 * yHisto);
                    ctx.moveTo(0, -0.9 * yHisto);
                    ctx.lineTo((modes[m].bins[1] + 1) * binWidth + 2, -0.9 * yHisto);
                    ctx.lineTo((modes[m].bins[1] + 1) * binWidth + 2, 0);
                }
            }
            ctx.stroke();
        };

        setTitle(title);
        initalize(erase === false ? false : true);
        if (!data) {
            ctx.restore();
            return;
        }
        binWidth = (xHisto - 20) / data.length;

        setMax();
        drawBins();
        if (modes) {
            drawModes(modes);
        }
        // Restore properties
        ctx.restore();
    };

})();
