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

/*global Matrix, Colorspaces */
Matrix.prototype.getColorInvariant = function (invariant, sigma) {
    'use strict';
    if (this.getSize(2) < 3) {
        throw new Error('Matrix.getColorInvariant: Image must have at least 3 channels.');
    }
    sigma = sigma || 2;

    var RGBE = [
        [0.3,  0.58, 0.11],
        [0.25, 0.25, -0.5],
        [0.5,  -0.5,    0]
    ];

    RGBE = [
        [0.06,  0.63,  0.27],
        [0.30,  0.04, -0.35],
        [0.34, -0.60,  0.17]
    ];

    RGBE = [
        [0.33,  0.34, 0.33],
        [0.5,    0.0, -0.5],
        [0.25,  -0.5, 0.25]
    ];

    var im2RGBE = Colorspaces.getConversionFunction(RGBE);
    var imE = this.applycform(im2RGBE);
    var imEp = imE.gaussianGradient(sigma);
    imE = imE.gaussian(sigma);
    var E   = imE.select([], [], [0]);
    var El  = imE.select([], [], [1]);
    var Ell = imE.select([], [], [2]);

    var Ex   = imEp.x.select([], [], [0]), Ey   = imEp.y.select([], [], [0]);
    var Elx  = imEp.x.select([], [], [1]), Ely  = imEp.y.select([], [], [1]);
    var Ellx = imEp.x.select([], [], [2]), Elly = imEp.y.select([], [], [2]);

    var im, x, y;
    var E2;
    if (invariant === 'H') {
        im = El['./'](Ell);
        var EL2PELL2 = El[".^"](2)['+'](Ell[".^"](2));
        x  = Ell['.*'](Elx)['-'](El['.*'](Ellx))['./'](EL2PELL2);
        y  = Ell['.*'](Ely)['-'](El['.*'](Elly))['./'](EL2PELL2);
    } else if (invariant === 'Cl') {
        im = El['./'](E);
        E2 = E[".^"](2);
        x  = Elx['.*'](E)['-'](El['.*'](Ex))['./'](E2);
        y  = Ely['.*'](E)['-'](El['.*'](Ey))['./'](E2);
    } else if (invariant === 'Cll') {
        im = Ell['./'](E);
        E2 = E[".^"](2);
        x  = Ellx['.*'](E)['-'](Ell['.*'](Ex))['./'](E[".^"](2));
        y  = Elly['.*'](E)['-'](Ell['.*'](Ey))['./'](E[".^"](2));
    } else if (invariant === 'W') {
        x = Ex['./'](E);
        y = Ey['./'](E);
    } else if (invariant === 'Wl') {
        x = Elx['./'](E);
        y = Ely['./'](E);
    } else if (invariant === 'Wll') {
        x = Ellx['./'](E);
        y = Elly['./'](E);
    } else if (invariant === 'Nl') {
        E2 = E[".^"](2);
        x = Elx['.*'](E)['-'](El['.*'](Ex))['./'](E2);
        y = Ely['.*'](E)['-'](El['.*'](Ey))['./'](E2);
    } else if (invariant === 'Nll') {
        E2 = E[".^"](2);
        var El2 = El[".^"](2), E3 = E[".^"](3);
        x = Ellx['.*'](E2)['-'](Ell['.*'](Ex['.*'](E)))['-'](Elx['.*'](El)['.*'](E)['.*'](2))['+'](El2['.*'](Ex)['.*'](2))['./'](E3);
        y = Elly['.*'](E2)['-'](Ell['.*'](Ey['.*'](E)))['-'](Ely['.*'](El)['.*'](E)['.*'](2))['+'](El2['.*'](Ey)['.*'](2))['./'](E3);
    } else {
        throw new Error('Matrix.getColorInvariant: Unknown Invariant ' + invariant);
    }

    var cplx = Matrix.complex(x, y);

    var phase = cplx.angle();
    phase = phase["./"](Math.PI);
    var PI0 = phase["<"](0);
    phase = phase.set(PI0, phase.select(PI0)["+"](1));

    return {im: im, x: x, y: y, norm: cplx.abs(), phase: phase};
};
