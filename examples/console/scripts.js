window.onload = function () {
    return;
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

/*
 TODO: 
 - diff vs. gain ?
 - box filter vs Gaussian ?
 - plot details change level lines
 - influence of iteration number
*/
window.processImages = function () {
    // var src = "D:/Hardweird/GOPRO-ISP/DxO-ISP/Scripts/Batch/_runIsp2014d_2015-09-30/Hero4_MONO_CFAST/GOPR0027_ISP2014D.jpg";
    // var path = "C:/Users/bmazin/Pictures/100GOPRO/";
    var path = "/home/mazin/Images/2015/08/05/";

    var sources = [
        "GOPR1610.JPG",
        "GOPR1622.JPG",
        "GOPR1623.JPG",
        "GOPR1628.JPG",
        "GOPR1629.JPG",
        "GOPR1709.JPG",
        "GOPR1715.JPG",
    /*  "GOPR1169.JPG",
        "GOPR1232.JPG",
        "GOPR1243.JPG",
        "GOPR1244.JPG",
        "GOPR1258.JPG",
        "GOPR1310.JPG",
        "GOPR1314.JPG",
        "GOPR1275.JPG",
        "G0021094.JPG",
        "GOPR1688.JPG",
        "GOPR1720.JPG",
        "GOPR1734.JPG",
        "GOPR1879.JPG"*/
    ];    
    var i = 0, src;

    for (src in sources) {
        Matrix.imread(path + sources[src], function () {
            Matrix.dataType = Float32Array;
            var df = 1;
            var image = this.im2single().get([0, df, -1], [0, df, -1], []);

            var outColor = image.gaussianColorEnhancementLUT(0.5, 0.005, Infinity, 0.1);
            var diffColor = outColor['-'](image).im2single();
            var dMax = diffColor.getCopy().abs().max()['*='](2);
            diffColor["/="](dMax)["+="](0.5);
            var outColor2 = outColor.getCopy();
            outColor2["-="](outColor2.min())["/="](outColor2.max());
            
            /*
            var outGrey = Matrix.applycform(image, "RGB to Ohta");
            var channel = 0;
            var L = outGrey.get([], [], channel)            
            L = L.gaussianColorEnhancementLUT(0.5, 10 / 255, Infinity, 0.1);
            outGrey.set([], [], channel, L).applycform("Ohta to RGB");
            var diffGrey = outGrey['-'](image).im2single();
            dMax = diffGrey.getCopy().abs().max()['*='](2);
            diffGrey["/="](dMax)["+="](0.5);
            */
            // var outGrey2 = outGrey.getCopy();
            // outGrey2["-="](outGrey2.min())["/="](outGrey2.max());
            canvas.displayImage(diffColor,     i, true);
            canvas.displayImage(outColor,  i + 1, true);
            canvas.displayImage(image,     i + 2, true);
            canvas.displayImage(outColor2, i + 3, true);
            // canvas.displayImage(outGrey,   i + 4, true);
            // canvas.displayImage(diffGrey,  i + 5, true);
            // canvas.displayImage(out2, i + 2, true);
            i += 4;
        });
    }
};           
/*
window.onload = function () {
    var src = "/home/mazin/Images/images_test/J7/1.png";
    Matrix.imread(src, function () {
        window.canvas = new SuperCanvas(document.body);
        Tools.tic()
        console.log(Tools.toc());
        Tools.tic()
        // m.display();
        window.patches = this.im2double().im2col([15, 15]);//.reshape([2, 2, 3, 4]).display();
        console.log(patches.size());
        canvas.displayImage(patches, 0, true)
        console.log(Tools.toc());
    });
    return;
    
    var down = m.bin(2, 2).display("down");
    var up = down.expand(2, 2).get([0, m.getSize(0) - 1], [0, m.getSize(1) - 1]).display("up");
    var details = m["-"](up).display("details");
};*/

window.onload = function () {
    window.canvas = new SuperCanvas(document.body);
    var bin = 128
    var A = Matrix.ones(bin).cumsum(0)["-="](1)["/="](bin -1);
    var D = A.transpose();
    var l = window.getLUT(Infinity, 0.05, 0.5, bin);
    
    var diff = l['-'](D).im2single();
    var dMax = diff.getCopy().abs().max().display("max");
    diff["/="](dMax['*'](2))["+="](0.5);
    // diff.get([0, ], [0, 63]);
    //D["-="](l.min())["/="](l.max());
    // l.display();
    canvas.displayImage(diff, 0, true);
};
