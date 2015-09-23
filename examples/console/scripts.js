window.onload = function () {
    Matrix.imread("/home/mazin/Images/images_test/pout.png", function () {
        var canvas = createCanvas([500, 500], "test");
        /*
         var sCanvas = new SuperCanvas(canvas);
         sCanvas.displayImage(this, 0);
         */
        var kernel = Matrix.fspecial("gaussian", [5, 1], 1.5).display("kernel");
        
        console.log(Tools.tic());
        Matrix.prototype.cornermetric = function (method) {
            method = method || "Harris";
            var image = this.im2double().rgb2gray();
            var gradient = image.gradient(true, true);
            var Ix2 = Matrix.times(gradient.x, gradient.x),
                Iy2 = Matrix.times(gradient.y, gradient.y),
                Ixy = Matrix.times(gradient.x, gradient.y);
            
            var Sx2 = Ix2.separableFilter(kernel, kernel).getData(),
                Sy2 = Iy2.separableFilter(kernel, kernel).getData(),
                Sxy = Ixy.separableFilter(kernel, kernel).getData();
            
            var R = Matrix.zeros(image.size()), rd = R.getData();
            var kappa = 0.04;
            if (method === "Harris") {
                for (var i = 0, ie = rd.length; i < ie; i++) {
                    var det = Sx2[i] * Sy2[i] - Sxy[i] * Sxy[i];
                    var trace = (Sx2[i] + Sy2[i]) * (Sx2[i] + Sy2[i]);
                    rd[i] = det - kappa * trace * trace;
                }
            } else if (method === "MinimumEigenvalue") {
                for (var i = 0, ie = rd.length; i < ie; i++) {
                    var ApB = Sx2[i] + Sy2[i], AmB = Sx2[i] - Sy2[i];
                    var C4 = 4 * Sxy[i] * Sxy[i];
                    AmB *= AmB;
                    rd[i] = (ApB - Math.sqrt(AmB + C4)) / 2;
                }
            }
            return R;
        };
        var map = this.cornermetric("MinimumEigenvalue");
        map.min().display();
        map.max().display();
        map["-="](map.min())['/='](map.max());
        map.imagesc(canvas);
        console.log(Tools.toc());
    })
};
