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

(function (Matrix, CIE) {
    "use strict";
    /* Color Matching functions (CMF) 'CIE 1931 RGB' and 'CIE 1931 XYZ'. */
    var lambda = Matrix.colon(360, 830).getData(),
        x = Tools.arrayFromBase64(
            "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 \
            7Kc1", Float32Array),
        y = Tools.arrayFromBase64(
            "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 \
            kPI0", Float32Array),
        z = Tools.arrayFromBase64(
            "r+IeOgh9MjoNlEg6dXJhOvJifTodWI46EvyfOiTtszrrUco6+1DjOu0Q/zoJuQ47GKIfO5EKMztY \
            uUk7YHVkO59Cgjuqy5Q7IAepO1AmvjuIWtM7UxroO93N/TtqSAs8dj8aPN7ZLDw0DEQ837xfPAVl \
            fzzSPpE86z+kPL5puDxFds4836rnPHimAj3wUBQ9l7opPUOTQj3PrF09Etl5PfL0ij1JjJg95KCm \
            PS+Wtj2Xz8k9irDhPUI1/z1AGhE+vywlPqynOz6qYFQ++0xvPgB1hj6y7JY+bF6pPgkbvj5cGdU+ \
            U1HuPrgKBT8ZXBQ/C0YlP47uNz9n9Us/grpgP8uddT+Y/4Q/W8SOP6wgmD8vCqE/hnapP1dbsT9F \
            qLg/uVW/P35mxT9f3co/J73PPxMF1D/Ht9c/K93aPyl93T+pn98/JEnhPwSD4j+cXOM/PuXjPz0s \
            5D9NOOQ/vQ7kP8S84z+dT+M/gNTiP09W4j8IzOE/EiXhP9FQ4D+rPt8/R+XdPxRF3D8kXNo/iijY \
            P1io1T844tI//cvPP3VKzD90Qsg/yJjDP+Y4vj8+Qrg/luexP7Vbqz9j0aQ/22OeP6AKmD/swpE/ \
            +ImLP/tchT+8g34/WoVyP6HFZj9nS1s/fx1QP59ART/lvDo/LZ4wP1nwJj9Ivx0/fRMVPxPoDD/Y \
            NAU/I+P7PhMs7j7MPeE+BBbVPu2qyT7E8r4+veO0Pntyqz4wlqI+6UiaPrGEkj6WQ4s+rYOEPkBm \
            fD4FaHA+8dBkPixlWT5M/00+tq5CPt2GNz40myw+Lv8hPpGxFz5jsg0+DhcEPu/p9T34wuQ9CszU \
            PZr5xT3cSLg9F7erPYhBoD2Y7pU9I6eMPSU8hD00/Xg9/X5qPc/KXD212089ZphDPZXnNz33ryw9 \
            Y9IhPdNJFz02JA09dm8DPQRz9DzhA+M8JX3SPErdwjzNIrQ8MEymPJlWmTyoO408d/SBPEr0bjys \
            i1s8RKRJPIUrOTwnCCo8ziAcPChcDzwSpgM8WeHxOxBY3jtnkMw7fWq8O9LJrTuAjqA7oJOUO0m0 \
            iTskl387NnNtO0nlXDvy3007xlVAO1Q5NDt1bCk769AfO01ZFzsw+A87J6AJO/E7BDu/Wv86KrP3 \
            OnZL8Tr67es6FoLnOuTG4zpYSuA6W5rcOtlE2DoZC9M6jgzNOv1jxjo/LL86NIC3OhozrzohdqY6 \
            F/GdOsNLljrgLZA6+haMOgWMiTr4vIc6ydmFOm8SgzpU7H064MVzOoJ9aDo/31w6F7dROil7RzpY \
            tT06UM8zOr8yKTpSSR06tp4POrjeADpmRuQ5BwzJOQdCsjnXFqE5GHWUOcEqiznPBYQ5gqh7OXmy \
            cDmZW2c5lEFeORQCVDm9Okc5B602OUszIzl8kA45Iw/1OBe30Th7orQ4knKcOJxQiDizy244FbdR \
            OHA4OThUlyU4D9IVOO/mCDiCqPs3E/nnN69p1jeDTsY3xfu2N6zFpzcIHZg3POWHN4k8bjdBkEs3 \
            rMUnN2q+ATemMbU2lb9WNvn0sjUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA \
            AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA \
            AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA \
            AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA \
            AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA \
            AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA \
            AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA \
            AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA \
            AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA \
            AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA \
            AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA \
            AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA \
            AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA \
            AAAA", Float32Array);

    CIE.getCMF = function (diagram) {
        diagram = diagram || "xyY";
        if (diagram === "xyY") {
            return {
                "lambda": lambda,
                "x": x,
                "y": y,
                "z": z
            };
        }
        throw new Error("Matrix.getCMF: Currently only xyY coordinates are supported.")
    };

    var daylightSpectrum = Tools.arrayFromBase64(
        "AAA8ACgBKAI8AmkCZwKwAnoCkgK0AxgEIwTIA3ME5wTnBL0EvQRvBGoEVAQpBEAEHQQUBOgDwAO2\
        A3oDiQOHA3QDSANSAzMDOQNRAy0DzwLnAvwCeALMAgIDiwLdAa0CigKUAmICFAJNAmsCAAAtAN8A\
        pAGVAZ8BfAGyAYEBXgGyAc4BtwFyAW8BZwFFARYB8gDJAKIAgwBWADwAKQASAAAA8P/d/93/xv+5\
        /6r/of+U/5b/iP90/3j/iP97/4D/lv+M/4f/m/+y/5H/mf+W/6D/rf+j/57/AAAUACgAVQBOAEIA\
        NQA8AB4ADAD1//v/+v/0/+f/4//l/+f/5//v//H/9P/0//b/+//9/wAAAgAFABQAIAAoAC4AMgBC\
        AEkAVgBiAGUAUwBgAFUARgBLAFAAQgAzAEoARABGAEAANwA8AEEA",
        Int16Array);
    daylightSpectrum = Matrix.toMatrix(new Float32Array(daylightSpectrum)).reshape(54, 3)["./"](10);
    // Matrix.toMatrix(Matrix.CIE.daylightSpectrum.S0).cat(1, Matrix.toMatrix(Matrix.CIE.daylightSpectrum.S1), Matrix.toMatrix(Matrix.CIE.daylightSpectrum.S2)).display()
    
    /* Daylight spectrum moments. */
    CIE.daylightSpectrum = {
        'S0': new Float32Array([0.04, 6.0, 29.6, 55.3,  57.3,  61.8, 61.5, 68.8,
                                63.4, 65.8, 94.8, 104.8, 105.9, 96.8, 113.9,
                                125.6, 125.5, 121.3, 121.3, 113.5, 113.1, 110.8,
                                106.5, 108.8, 105.3, 104.4, 100.0, 96.0, 95.1,
                                89.1, 90.5, 90.3, 88.4, 84.0, 85.1, 81.9, 82.6,
                                84.9, 81.3, 71.9, 74.3, 76.4, 63.3, 71.7, 77.0,
                                65.2, 47.7, 68.6, 65.0, 66.0, 61.0, 53.3, 58.9, 61.9]),
        'S1': new Float32Array([0.02, 4.5, 22.4, 42.0, 40.6, 41.6, 38.0, 43.4,
                                38.5, 35.0, 43.4, 46.3, 43.9, 37.1, 36.7, 35.9,
                                32.6, 27.9, 24.3, 20.1, 16.2, 13.2,  8.6,  6.1,
                                4.2, 1.9, 0, -1.6, -3.5, -3.5, -5.8, -7.2, -8.6,
                                -9.5, -10.9, -10.7, -12.0, -14.0, -13.6, -12.0,
                                -13.3, -12.9, -10.6, -11.6, -12.2, -10.2,  -7.8,
                                -11.2, -10.4, -10.6,  -9.7,  -8.3,  -9.3,  -9.8]),
        'S2': new Float32Array([0, 2.0, 4.0, 8.5, 7.8, 6.7, 5.3, 6.1, 3.0, 1.2,
                                -1.1, -0.5, -0.7, -1.2, -2.6, -2.9, -2.8, -2.6,
                                -2.6, -1.8, -1.5, -1.3, -1.2, -1.0, -0.5, -0.3,
                                0, 0.2, 0.5, 2.1, 3.2, 4.1, 4.7, 5.1, 6.7,
                                7.3, 8.6, 9.8, 10.2, 8.3, 9.6, 8.5, 7.0, 7.6,
                                8.0, 6.7, 5.2, 7.4, 6.8, 7.0, 6.4, 5.5, 6.1, 6.5])
    };
    
})(Matrix, Matrix.CIE);


