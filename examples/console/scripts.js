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


window.onload = function () {
    $("leftPanel").style.display = "none"
    Matrix.imread("/home/mazin/Images/images_test/J7/1.png", function () {
        var image = this.im2double();
        var out = image.gaussianColorEnhancement(0.4, 0.25 / 255, 50, 0.1);
        var diff = out["-"](image);
        diff["-="](diff.min())["/="](diff.max());
        //out["-="](out.min())["/="](out.max());
        var canvas = createSuperCanvas([1000, 1000], "test");
        canvas.displayImage(image, 0, true);
        canvas.displayImage(diff, 2, true);
        canvas.displayImage(out, 1, true);
    });
};

window.onload = function () {
    $("leftPanel").style.display = "none"
    Matrix.imread("/home/mazin/Images/images_test/koala.png", function () {
        var image = this.im2double();
        var alpha = 0.2;
        Tools.tic();
        var out1 = image.guidedFilter(image, 40, 0.001);

        var details = image["-"](out1)["*="](5);
        out1["*="](1 - alpha)["+="](out1.mean()[".*"](alpha));
        var out2 = details["+"](out1);
        
        console.log("Time", Tools.toc());
        var canvas = createSuperCanvas([700, 1000], "test");
        canvas.displayImage(image, 0, true);
        // canvas.displayImage(out1, 1, true);
        canvas.displayImage(details.abs(), 1, true);
        canvas.displayImage(out2, 2, true);
        // canvas.displayImage(fun(image), 3, true);
    });
};           
