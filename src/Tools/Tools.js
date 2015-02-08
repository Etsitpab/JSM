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

/** Miscellaneous tools for argument checking.
 *
 * Several kind of functions are proposed:
 *
 *  + boolean functions, `Tools.is*`: return a boolean value.
 *  + validation functions, `Tools.check*`: return the input value,
 *    possibly changed; error are thrown.
 *
 * @singleton
 */
var Tools = {};
if (typeof window === 'undefined') {
    module.exports.Tools = Tools;
}

(function (Tools) {
     "use strict";


     //////////////////////////////////////////////////////////////////
     //                  Boolean Functions                           //
     //////////////////////////////////////////////////////////////////


     // Scalar

     /** Test whether an argument is set.
      *
      * @param {Object} [obj]
      *
      * @return {Boolean}
      *  True iff the argument is neither `null` nor `undefined`.
      */
     Tools.isSet = function (obj) {
         return (obj !== null && obj !== undefined);
     }.bind(Tools);

     /** Test whether a number belongs to an interval.
      *
      * __See also:__
      *  {@link Tools#isNumber}.
      *
      * @param {Number} x
      *
      * @param {Number} [min = -Infinity]
      *
      * @param {Number} [max = +Infinity]
      *
      * @return {Boolean}
      *  True iff `x` is between `min` and `max`.
      */
     Tools.isInRange = function (x, min, max) {
         min = this.isSet(min) ? min : -Infinity;
         max = this.isSet(max) ? max : +Infinity;
         return (min <= x && x <= max);
     }.bind(Tools);

     /** Test whether a variable is a number, and if it belongs to an interval.
      *
      * __See also:__
      *  {@link Tools#isInRange},
      *  {@link Tools#isInteger},
      *  {@link Tools#isBoolean}.
      *
      * @param {Object} obj
      *
      * @param {Number} [min = -Infinity]
      *
      * @param {Number} [max = +Infinity]
      *
      * @return {Boolean}
      *  True iff `obj` is a number between `min` and `max`.
      */
     Tools.isNumber = function (obj, min, max) {
         return (typeof obj === 'number') && this.isInRange(obj, min, max);
     }.bind(Tools);

     /** Test whether a variable is an integer.
      *
      * @param{Object} obj
      *
      * @param {Number} [min = -Infinity]
      *
      * @param {Number} [max = +Infinity]
      *
      * @return{Boolean}
      *  True iff the argument is an integer between `min` and `max`.
      */
     Tools.isInteger = function (obj, min, max) {
         return this.isNumber(obj, min, max) && (obj % 1 === 0);
     }.bind(Tools);

     /** Test wether a variable is a boolean.
      *
      * @param{Object} obj
      *
      * @return{Boolean}
      *  True iff the argument is a boolean.
      */
     Tools.isBoolean = function (obj) {
         return (obj === true || obj === false);
     }.bind(Tools);


     // Arrays

     /** Test whether an object is like an array (e.g. typed array).
      *
      * See also:
      *  {@link Tools#isArrayInRange},
      *  {@link Tools#isArrayOfNumbers},
      *  {@link Tools#isArrayOfIntegers},
      *  {@link Tools#isArrayOfBooleans}.
      *
      * @param {Object} obj
      *
      * @return {Boolean}
      *  True iff the argument is an array, typed array, or similar.
      */
     Tools.isArrayLike = function (obj) {
         return (typeof obj === 'object') && (obj.length !== undefined);
     }.bind(Tools);

     /** Test whether an object is an array-like and in a given range.
      *
      * Note:
      *  all the elements of the array are tested one by one.
      *
      * @param {Object} obj
      *  Array of numbers.
      *
      * @param {Number} [min = -Infinity]
      *
      * @param {Number} [max = +Infinity]
      *
      * @return {Boolean}
      *  True iff the argument is an array-like
      *  and its values are between `min` and `max`.
      */
     Tools.isArrayInRange = function (obj, min, max) {
         var i, ie;
         if (!this.isArrayLike(obj)) {
             return false;
         }
         for (i = 0, ie = obj.length; i < ie; i++) {
             if (!this.isInRange(obj[i], min, max)) {
                 return false;
             }
         }
         return true;
     }.bind(Tools);

     /** Test whether an object is an array-like made of numbers.
      *
      * Note:
      *  all the elements of the array are tested one by one.
      *
      * __See also:__
      *  {@link Tools#isArrayLike}
      *
      * @param {Object} obj
      *
      * @param {Number} [min = -Infinity]
      *
      * @param {Number} [max = +Infinity]
      *
      * @return {Boolean}
      *  True iff the argument is an array-like
      *  and contains only numbers between `min` and `max`.
      */
     Tools.isArrayOfNumbers = function (obj, min, max) {
         var i, ie;
         if (!this.isArrayLike(obj)) {
             return false;
         }
         min = this.isSet(min) ? min : -Infinity;
         max = this.isSet(max) ? max : +Infinity;
         for (i = 0, ie = obj.length; i < ie; i++) {
             var o = obj[i];
             if (!((typeof o === 'number') && min <= o && o <= max)) {
                 return false;
             }
         }
         return true;
     }.bind(Tools);

     /** Test whether an object is an array-like made of integers.
      *
      * Note:
      *  all the elements of the array are tested one by one.
      *
      * @param {Object} obj
      *
      * @param {Number} [min = -Infinity]
      *
      * @param {Number} [max = +Infinity]
      *
      * @return {Boolean}
      *  True iff the argument is an array-like
      *  and contains only integers between `min` and `max`.
      * @todo check for typed array.
      */
     Tools.isArrayOfIntegers = function (obj, min, max) {
         var i, ie;
         switch (obj.constructor) {
         case Int8Array:
         case Int16Array:
         case Int32Array:
             if (min === undefined && max === undefined) {
                 return true;
             } 
             for (i = 0, ie = obj.length; i < ie; i++) {
                 if (obj[i] < min || obj[i] > max) {
                     return false;
                 }
             }
             return true;
         case Uint8ClampedArray:
         case Uint8Array:
         case Uint16Array:
         case Uint32Array:
             if ((min === 0 || min === undefined) && max === undefined) {
                 return true;
             }
             if (max !== undefined) {
                 for (i = 0, ie = obj.length; i < ie; i++) {
                     if (obj[i] < min || obj[i] > max) {
                         return false;
                     }
                 }
             }
             return true;
         default:
             if (!this.isArrayLike(obj)) {
                 return false;
             }
         }
         min = this.isSet(min) ? min : -Infinity;
         max = this.isSet(max) ? max : +Infinity;
         for (i = 0, ie = obj.length; i < ie; i++) {
             var o = obj[i];
             if (!((typeof o === 'number') && (min <= o && o <= max) && (o % 1 === 0))) {
                 return false;
             }
         }
         return true;
     }.bind(Tools);

     /** Test whether an object is an array-like made of booleans.
      *
      * Note:
      *  all the elements of the array are tested one by one.
      *
      * @param {Object} obj
      *
      * @return {Boolean}
      *  True iff the argument is an array-like and contains only booleans.
      */
     Tools.isArrayOfBooleans = function (obj) {
         var i, ie;
         if (!this.isArrayLike(obj) || obj.length < 1) {
             return false;
         }

         for (i = 0, ie = obj.length; i < ie; i++) {
             if (obj[i] !== true && obj[i] !== false) {
                 return false;
             }
         }
         return true;
     }.bind(Tools);


     //////////////////////////////////////////////////////////////////
     //                  Validation Functions                        //
     //////////////////////////////////////////////////////////////////


     /** Check optional argument objects.
      *
      * Check whether all options are valid.
      * Initialized undefined options with default values.
      *
      *     // List of valid options and default values
      *     def = {'n': 10, 'b': true};
      *
      *     // Check and initialize 2 sets of options
      *     optsA = Tools.checkOpts(def, {'n': 5});     // optsA is: {'n': 5, 'b': true}
      *     optsB = Tools.checkOpts(def, {'x': 42});    // error: 'x' not defined in def
      *
      * @param {Object} def
      *  Object listing the valid options and their default values.
      *
      * @param {Object} [opts]
      *  A set of options.
      *
      * @return {Object}
      *  The options set, or their default values.
      */
     Tools.checkOpts = function (def, opts) {
         var name;
         opts = opts || {};
         for (name in opts) {
             if (opts.hasOwnProperty(name)) {
                 if (def[name] === undefined) {
                     throw new Error('checkOpts: unknown option: ' + name);
                 }
             }
         }
         for (name in def) {
             if (def.hasOwnProperty(name)) {
                 if (!this.isSet(opts[name])) {
                     opts[name] = def[name];
                 }
             }
         }
         return opts;
     };

     /** Check a size, i.e. an array of non-negative integers.
      *
      *     s = Tools.checkSize(5);             // s is: [5, 1]
      *     s = Tools.checkSize(5, 'row');      // s is: [1, 5]
      *     s = Tools.checkSize(5, 'square');   // s is: [5, 5]
      *     s = Tools.checkSize([4, 2, 1]);     // s is: [4, 2, 1]
      *
      * @param {Number | Array} [size = [0, 0]]
      *  A size information.
      *
      * @param {String} [unidim='vector']
      *  Sefault behavior in case of a scalar value,
      *  Can be "vector", "row", "column", or "square".
      *
      * @return {Array}
      *  The size, as an array.
      *
      * @todo allow 1D in 'unidim' case?
      */
     Tools.checkSize = function (size, unidim) {

         // Format the size
         size = this.isSet(size) ? size : [0, 0];
         if (this.isNumber(size)) {
             size = [size];
         }
         if (this.isArrayLike(size) && size.length === 1 && this.isArrayLike(size[0])) {
             size = size[0];
         }

         // Check if array is valid
         if (!this.isArrayLike(size) || size.length < 1) {
             throw new Error('checkSize: Invalid size argument.');
         }
         if (!this.isArrayOfIntegers(size, 0)) {
             throw new Error('checkSize: Size must be a positive integer.');
         }

         // Format the array
         size = Array.prototype.slice.apply(size);
         while (size[size.length - 1] === 1 && size.length > 2) {
             size.pop();
         }

         // Unidimensional case: square matrix or row vector
         if (size.length === 1) {
             switch (unidim) {
             case 'square':
                 size = [size[0], size[0]];
                 break;
             case 'row':
                 size = [1, size[0]];
                 break;
             case 'column':
             case 'vector':
             case undefined:
                 size = [size[0], 1];
                 break;
             default:
                 throw new Error('checkSize: Invalid value for "unidim".');
             }
         }

         // Return the right size
         return size;
     }.bind(Tools);

     /** Check two equal sizes.
      *
      * If the sizes are the same except for trailing 1's, the behavior depends on
      * `Matrix.ignoreTrailingDims`:
      *
      *  + if True, the trailing 1's are dropped.
      *  + if False, size are considered different if numbers of dimensions is different.
      *
      * See also:
      *  {@link Tools#checkSize}
      *
      *     s = Tools.checkSizeEquals(5, [5, 1]);       // s is: [5, 1]
      *     s = Tools.checkSizeEquals(5, [1, 5]);       // error!
      *
      *     s = Tools.checkSizeEquals(5, [5, 1, 1]);    // [5, 1] if 'Matrix.ignoreTrailingDims'
      *                                                 // error if not
      *
      * @param{Array | Number} sizeA
      *  Size of a matrix A.
      *
      * @param{Array | Number} sizeB
      *  Size of a matrix B.
      *
      * @return{Array}
      *  Array containing the (equal) size.
      *
      * @todo broadcasting? behavior for last dimensions of 1?
      */
     Tools.checkSizeEquals = function (sizeA, sizeB, ignoreTrailingDims) {
         sizeA = this.checkSize(sizeA);
         sizeB = this.checkSize(sizeB);
         ignoreTrailingDims = ignoreTrailingDims || true;

         var sizeF = (sizeA.length < sizeB.length) ? sizeA : sizeB;

         var i, ni = Math.min(sizeA.length, sizeB.length);
         var nimax = Math.max(sizeA.length, sizeB.length);

         for (i = 0; i < ni; i++) {
             if (sizeA[i] !== sizeB[i]) {
                 throw new Error('checkSizeEquals: dimensions must be equals.');
             }
         }
         if (ignoreTrailingDims) {
             for (i = ni; i < nimax; i++) {
                 if (sizeA[i] !== undefined && sizeA[i] !== 1) {
                     throw new Error('checkSizeEquals: dimensions must be equals.');
                 }
                 if (sizeB[i] !== undefined && sizeB[i] !== 1) {
                     throw new Error('checkSizeEquals: dimensions must be equals.');
                 }
             }
         } else if (!ignoreTrailingDims) {
             throw new Error('checkSizeEquals: ' +
                             'dimensions differ by trailing 1\'s, ',
                             'and ignoreTrailingDims is False.');
         }
         return sizeF;
     }.bind(Tools);

     /** Check a range argument, i.e. made of indices [min, max].
      *
      * @param {Array | Number} range
      *  Can be:
      *
      *  + an integer: max, using min = 0.
      *  + an array: [max] or [min, max].
      *
      * @return{Array}
      *  The range, as [min, max].
      *
      * @todo allow empty range [] or [a, b] for a > b ?
      */
     Tools.checkRange = function (range) {

         // Check type
         if (typeof range === 'number') {
             range = [range];
         }
         if (!this.isArrayOfIntegers(range)) {
             throw new Error('checkRange: range must be made of integers.');
         }

         // Check content
         if (range.length === 1) {
             range = [0, range[0]];
         }
         if (range.length !== 2) {
             throw new Error('checkRange: range must have 1 or 2 bounds.');
         }
         if (range[0] > range[1]) {
             throw new Error('checkRange: range must be [min, max] in this order.');
         }

         // Return valid range
         range = [range[0], range[1]];
         return range;
     }.bind(Tools);

     /** Check arguments of the `colon` operator.
      *
      * @param {Number | Array} colon
      *  Can be :
      *
      *  + `value` or `[value]`: select only this value.
      *  + `[first, last]`: equivalent to all indices from `first` to `last` (step is +1 or -1).
      *  + `[first, step, last]`: equivalent to all indices from `first` to `last` with given step.
      *
      * @param {Number} [length]
      *  If specified, allow negative indices from the end of the array.
      *
      * @return {Array}
      *  Colon arguments, as `[first, step, last]`.
      *
      * @todo rename it 'sequence'? use optional argument for negative indices? allow empty selection?
      */
     Tools.checkColon = function (c, length) {

         // Format as a vector
         if (this.isArrayLike(c) && c.length === 1 && this.isArrayLike(c[0])) {
             c = c[0];
         }
         if (this.isNumber(c)) {
             c = [c];
         }

         // Check format
         if (!this.isArrayOfNumbers(c)) {
             throw new Error('checkColon: colon operator must be non-negative integers.');
         }

         // Get values
         var a, b, s = null;
         switch (c.length) {
         case 0:
             throw new Error('checkColon: colon operator cannot be empty.');
         case 1:
             a = b = c[0];
             break;
         case 2:
             a = c[0];
             b = c[1];
             break;
         case 3:
             a = c[0];
             s = c[1];
             b = c[2];
             break;
         default:
             throw new Error('checkColon: colon operator expected 1, 2, or 3 values.');
         }

         // Negative index
         if (!this.isSet(length)) {
             length = Infinity;
         } else if (this.isInteger(length, 0)) {
             a = (a >= 0) ? a : a + length;
             b = (b >= 0) ? b : b + length;
         } else {
             throw new Error('checkColon: if specified, length must be a non-negative integer.');
         }

         // Check indices
         if (!this.isArrayOfIntegers([a, b])) {
             throw new Error('checkColon: first and last elements must be integers');
         }
         if (!this.isArrayOfIntegers([a, b], 0, length - 1)) {
             throw new Error('checkColon: first or last elements out of bounds');
         }

         // Step
         if (!this.isSet(s)) {
             s = (a <= b) ? +1 : -1;
         } else if ((b - a) * s < 0) {
             throw new Error('checkColon: invalid step.');
         }

         // return result
         return [a, s, b];
     }.bind(Tools);

     /** Check wether two arrays have the same length and the same values or not.
      *
      * @param {Array} a
      *
      * @param {Array} b
      *
      * @return {Boolean}
      */
     Tools.checkArrayEquals = function (a, b) {
         var l = a.length, i;
         if (l !== b.length) {
             return false;
         }
         for (i = 0; i < l; i++) {
             if (a[i] !== b[i]) {
                 return false;
             }
         }
         return true;
     };

     /** Check if a datatype argument is valid numeric class
      * i.e. Array, typed Array or Matlab-like class type.
      *
      * - `array`
      * - `float64Array`, `float64`, `double`
      * - `float32Array`, `float32`, `float`, `single`
      * - `int8array`, `int8`
      * - `uint8clampedarray`, `uint8c`
      * - `uint8array`, `uint8`
      * - `int16array`, `int16`
      * - `uint16array`, `uint16`
      * - `int32array`, `int32`
      * - `uint32array`, `uint32`
      * - `bool`, `boolean`, `logical`
      *
      * @param{String|Function} type
      *  Type identifier or constructor.
      *
      * @return{Function}
      *  Constructor of corresponding type.
      */
     Tools.checkType = function (type) {
         // Select type
         if (typeof (type) === 'function') {
             type = type.name;
         }
         if (typeof (type) === 'string') {
             switch (type.toLowerCase()) {
             case 'array':
                 return Array;
             case 'float64array':
             case 'float64':
             case 'double':
                 return Float64Array;
             case 'float32array':
             case 'float32':
             case 'float':
             case 'single':
                 return Float32Array;
             case 'int8array':
             case 'int8':
                 return Int8Array;
             case 'bool':
             case 'boolean':
             case 'logical':
             case 'uint8clampedarray':
             case 'canvaspixelarray':
             case 'uint8c':
                 return Uint8ClampedArray;
             case 'uint8array':
             case 'uint8':
                 return Uint8Array;
             case 'int16array':
             case 'int16':
                 return Int16Array;
             case 'uint16array':
             case 'uint16':
                 return Uint16Array;
             case 'int32array':
             case 'int32':
                 return Int32Array;
             case 'uint32array':
             case 'uint32':
                 return Uint32Array;
             case 'int64':
             case 'uint64':
                 throw new Error('checkType: int64 and uint64 aren\'t supported.');
             default:
                 throw new Error('checkType: Type must be a valid numeric class name.');
             }
         }
         if (type === undefined) {
             return Matrix.dataType;
         }
         throw new Error('checkType: Wrong data type argument.');
     };


     //////////////////////////////////////////////////////////////////
     //                      Other Functions                         //
     //////////////////////////////////////////////////////////////////


     /** Include a JS file into the document.
      *
      * Note that the content of the included file is not available immediately,
      * but only after the callback function is called.
      *
      * @param {String} url
      *  URL of the JS file.
      *
      * @param {Function} [callback]
      *  Callback function, executed once the file has been included.
      *
      * @todo remove it first if already included.
      */
     Tools.includeJS = function (url, arg) {

         var scr = document.createElement('script');
         scr.setAttribute('type', 'text/javascript');
         scr.setAttribute('src', url);
         if (this.isSet(arg)) {
             scr.onload = arg;
         }
         document.head.appendChild(scr);
     }.bind(Tools);

     /** Throw an error if the condition is False.
      *
      * @param {Boolean} condition
      *  A boolean value.
      *
      * @return {Boolean}
      *  True if the condition is true.
      *
      * @throws {Error}
      *  If the condition is false.
      */
     Tools.assert = function (condition) {
         if (!condition) {
             throw new Error('Assertion failed.');
         }
         return true;
     }.bind(Tools);


     (function () {
          /*
           *  Code imported from [Mozilla][1] and slightly modified.
           *  [1]:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
           */

          /* @param {Char} n */
          var b64ToUint6 = function (n) {
              return n > 64 && n < 91 ?
                  n - 65
                  : n > 96 && n < 123 ?
                  n - 71
                  : n > 47 && n < 58 ?
                  n + 4
                  : n === 43 ?
                  62
                  : n === 47 ?
                  63 :
                  0;
          };

          /* @param {Uint6} n */
          var uint6ToB64 = function (n) {
              return n < 26 ?
                  n + 65
                  : n < 52 ?
                  n + 71
                  : n < 62 ?
                  n - 4
                  : n === 62 ?
                  43
                  : n === 63 ?
                  47
                  :
                  65;
          };

          /** Convert a base64 string to a typed array.
           *
           * @param {String} str
           *  String in base64 to convert.
           *
           * @param {Function} [constructor=Uint8Array]
           *  Constructor of the typed array to build.
           *
           * @return {Array}
           * @method arrayFromBase64
           */
          Tools.arrayFromBase64 = function (sBase64, Type) {
              var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, "");
              var l = sB64Enc.length;
              var nOutLen = (l * 3 + 1) >> 2;
              var taBytes = new Uint8Array(nOutLen);
              for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < l; nInIdx++) {
                  nMod4 = nInIdx & 3;
                  nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
                  if (nMod4 === 3 || l - nInIdx === 1) {
                      for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
                          taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
                      }
                      nUint24 = 0;
                  }
              }
              return Type ? new Type(taBytes.buffer) : taBytes;
          };

          /** Convert a typed array to a base64.
           *
           *     // Create an 5x5 single precision array from a Matrix
           *     var t1 = rand(5, 'single').getData();
           *
           *     // Create a base 64 string from the array
           *     var strb64 = Tools.ArrayToBase64(t1);
           *
           *     // Reverse operation
           *     var t2 = Tools.ArrayFromBase64(strb64, Float32Array);
           *
           * @param {Array} tab
           *  Array to convert
           *
           * @return {String}
           */
          Tools.arrayToBase64 = function (aBytes) {
              aBytes = new Uint8Array(aBytes.buffer);
              var nMod3 = 2, sB64Enc = "";

              for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
                  nMod3 = nIdx % 3;
                  if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
                  nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
                  if (nMod3 === 2 || aBytes.length - nIdx === 1) {
                      sB64Enc += String.fromCharCode(uint6ToB64(nUint24 >>> 18 & 63), uint6ToB64(nUint24 >>> 12 & 63), uint6ToB64(nUint24 >>> 6 & 63), uint6ToB64(nUint24 & 63));
                      nUint24 = 0;
                  }
              }

              return sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) + (nMod3 === 2 ? '' : nMod3 === 1 ? '=' : '==');

          };

      })();


     /** Transform a string to a file and download it.
      * *It does not seem to work with all browsers.*
      *
      * @param {String} input
      *
      * @return {String} name
      */
     Tools.stringToDownload = function(str, name) {
         var textFileAsBlob = new Blob([str], {type: 'text/plain'});
         var downloadLink = document.createElement("a");
         downloadLink.download = name || "file.txt";
         downloadLink.href = URL.createObjectURL(textFileAsBlob);
         downloadLink.click();
     };


     //////////////////////////////////////////////////////////////////
     //                   Miscellaneous functions                    //
     //////////////////////////////////////////////////////////////////


     (function () {
          var times = [], labels = {};

          /** Save the current time (in ms) as reference.
           * @param {string} [label=undefined]
           *  Label used as a marker to store the current time. If undefined,
           *  then the current time is stored on the stack. 
           * @return {undefined}
           * @todo 
           *  store only last time instead of stack? Return time?
           * @matlike
           */
          Tools.tic = function (label) {
              if (label) {
                  labels[label] = new Date().getTime();
              } else {
                  times.push(new Date().getTime());
              }
          };

          /** Compute the elapsed time (in ms) since the last `tic`.
           * @param {string} [label=undefined]
           *  If label is defined then used the corresponding time to compute
           *  the difference. Otherwise the function will use the last time 
           *  on the stack.
           * @todo allow optional argument `start`?
           * @return {Number}
           * @matlike
           */
          Tools.toc = function (label) {
              var t = new Date().getTime();
              if (label) {
                  return (t - labels[label]) || 0;
              }
              return (t - times.pop()) || 0;
          };

      }());


 })(Tools);

