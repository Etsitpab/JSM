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
         for (i = 0, ie = obj.length; i < ie; i++) {
             if (!this.isNumber(obj[i], min, max)) {
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
         for (i = 0, ie = obj.length; i < ie; i++) {
             if (!this.isInteger(obj[i], min, max)) {
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
             if (!this.isBoolean(obj[i])) {
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

/** A ND-View on any Array.
 *
 * This class provides a multi-dimensional interpretation of any Array.
 *
 * It also defines tools such as iterators to deal with it.
 *
 *
 * @constructor Create a View, which can be used with any Array.
 *
 *     // Create a 3D View of size 2x3x4:
 *     var view = new MatrixView([2,3,4]);
 *
 * @param {Array | MatrixView} arg
 *  Can be:
 *
 *  + an `Array`: the size the matrix.
 *  + a `MatrixView`: perform a copy of this view.
 * 
 * @todo set most of the getters as protected?
 */
function MatrixView(arg) {
    'use strict';


    //////////////////////////////////////////////////////////////////
    //                   Initialization Functions                   //
    //////////////////////////////////////////////////////////////////


    var first;          // Start points for each dimension
    var step;           // Step between two values
    var size;           // Number of points
    var indices;        // Selected indices, instead of first/step/size

    var views = [];     // stack of Views
    var initial = {};   // backup of the original View

    // Initialization from size
    var setFromSize = function (sizeIn) {
        size = Tools.checkSize(sizeIn);
        indices = [];

        // Create view
        var i, ie = size.length;
        for (first = [], step = [], i = 0; i < ie; i++) {
            first[i] = 0;
            step[i]  = (size[i - 1] || 1) * (step[i - 1] || 1);
        }

        // Save original view
        initial = {
            first: first.slice(),
            step: step.slice(),
            size: size.slice(),
            indices: []
        };
        return this;
    }.bind(this);

    // Copy constructor
    var setFromView = function (view) {
        var i, ndims = view.getDimLength();
        first = [];
        step = [];
        size = [];
        indices = [];
        for (i = 0; i < ndims; i++) {
            first.push(view.getFirst(i));
            step.push(view.getStep(i));
            size.push(view.getSize(i));
            if (view.isIndicesIndexed(i)) {
                indices.push(view.getIndices(i));
            }
        }
        return this;
    }.bind(this);


    //////////////////////////////////////////////////////////////////
    //                  Stack of Views manipulation                 //
    //////////////////////////////////////////////////////////////////

    /** Save the current MatrixView on the Stack.
     *
     * See also:
     *  {@link MatrixView#restore}.
     *
     * @method save
     * @chainable
     */
    this.save = function () {
        views.push(new MatrixView(this));
        return this;
    }.bind(this);

    /** Restore the previous MatrixView from the Stack.
     *
     * If there is no stacked view, restore the initial view.
     *
     * See also:
     *  {@link MatrixView#save}.
     *
     *     // Declare a view
     *     var v = new MatrixView([5]);
     *
     *     // Reverse and save it
     *     v.flipdim(1).save();
     *
     *     // Select some elements
     *     v.selectDimension(1, [0, 2, 4]);
     *
     *     // Restore the previous view, and then the initial View
     *     v.restore();
     *     v.restore();
     *
     * @method restore
     * @chainable
     */
    this.restore = function () {
        var v = views.pop();
        if (Tools.isSet(v)) {
            setFromView(v);
        } else {
            first = initial.first.slice();
            step  = initial.step.slice();
            size  = initial.size.slice();
            indices = []; // = initial.indices.slice();
        }
        return this;
    }.bind(this);


    //////////////////////////////////////////////////////////////////
    //                         Basics Getters                       //
    //////////////////////////////////////////////////////////////////

    /** Get the number of dimensions.
     *
     *     // Declare a 3D View
     *     var v = new MatrixView([5, 5, 5]);
     *
     *     // Get its number of dimensions
     *     var nDims = v.getDimLength();   // nDims is: 3
     *
     * @return {Number}
     *
     * @todo rename
     */
    var getDimLength = function () {
        return size.length;
    };

    /** Get the number of elements indexed by the View.
     *
     *     // Declare a view
     *     var v = new MatrixView([5, 5, 5]);
     *
     *     // Get its length
     *     var n = v.getLength();      // n is: 125
     *
     * @return {Number}
     *
     * @todo length vs. numel
     */
    var getLength = function () {
        var i, ie = getDimLength(), nel;
        for (i = 0, nel = 1; i < ie; i++) {
            nel *= size[i];
        }
        return nel;
    };

    /** Get the size of the View.
     *
     * Get the number of elements along a given dimension or along all dimensions.
     *
     *     // Create a View
     *     var v = new MatrixView([2, 3, 4]);
     *
     *     // Get its size
     *     var size = v.getSize();     // size is: [2, 3, 4]
     *
     *     // Get size along dimension 1
     *     var size = v.getSize(1);    // size is: 3
     *
     * @param {Number} [dim]
     *  If specified, get the size along this dimension.
     *
     * @return {Array | Number}
     *
     *  + If `dimension` is given: number of elements along the specified dimension.
     *  + If no `dimension`: array containng the number of element along each dimension.
     */
    var getSize = function (d) {
        if (!Tools.isSet(d)) {
            return size.slice();
        }
        if (!Tools.isInteger(d, 0)) {
            throw new Error('MatrixView.getSize: invalid dimension.');
        }
        return (Tools.isSet(size[d])) ? size[d] : 1;
    };

    /** Test whether the view is indexed by indices.
     *
     * See also:
     *  {@link MatrixView#selectIndicesDimension},
     *  {@link MatrixView#selectDimension}.
     *
     *     // Create a View, shuffle indices along the first dimension
     *     var v = new MatrixView([3, 4]);
     *     v.selectIndicesDimension(0, [0, 2, 1]);
     *
     *     // Check which dimension is indexed by indices
     *     var test = v.isIndicesIndexed(0);    // test is: true
     *     test = v.isIndicesIndexed(1);        // test is: false
     *
     * @param {Number} dim
     *  Dimension to be tested.
     * @return {Boolean}
     *  True iff the given dimension is indexed by indices.
     */
    var isIndicesIndexed = function (d) {
        if (!Tools.isInteger(d, 0)) {
            throw new Error('MatrixView.isIndicesIndexed: invalid dimension.');
        }
        return Tools.isSet(indices[d]);
    };

    /** If indexed by indices: get the selected indices.
     *
     * See also:
     *  {@link MatrixView#isIndicesIndexed},
     *  {@link MatrixView#getSteps}.
     *
     *     // Create a View and select indices along 2nd dim.
     *     var v = new MatrixView([2, 3]);
     *     v.selectIndicesDimension(1, [0, 2, 1]);
     *
     *     // Retrieve the indices along dimension 1
     *     var indices = v.getIndices(1);       // indices is: [0, 4, 2]
     *
     * @param {Number} dim
     *  Dimension along which to get the indice.
     * @return {Array}
     *  Array containing the selected indices of the View along the given dimension.
     *
     * @todo check the example [0, 4, 2]
     */
    var getIndices = function (d) {
        if (!Tools.isInteger(d, 0)) {
            throw new Error('MatrixView.getIndices: invalid dimension.');
        }
        if (!isIndicesIndexed(d)) {
            throw new Error('MatrixView.getIndices: ' +
                            'dimension isn\'t indexed by indices.');
        }
        return indices[d].slice();
    };

    /** If indexed by indices: get the steps to be used to explore the array.
     *
     * See also:
     *  {@link MatrixView#isIndicesIndexed},
     *  {@link MatrixView#getIndices}.
     *
     *     // Create a View and select indices along 2nd dim.
     *     var v = new MatrixView([2, 3]);
     *     v.selectIndicesDimension(1, [0, 2, 1]);
     *
     *     // Retrieve the steps along dimension 1
     *     var steps = v.getSteps(1);      // steps is: [0, 4, -2, -Infinity]
     *
     * @param {Number} dim
     *  Dimension along which to compute the step.
     *
     * @return {Array}
     *  Array containing the list of steps along the specified dimension.
     *  Last element is -Infinity to easily detect the end.
     *
     * @todo check the example; return NaN as last?
     */
    var getSteps = function (d) {
        if (!Tools.isInteger(d, 0)) {
            throw new Error('MatrixView.getSteps: invalid dimension.');
        }
        if (!isIndicesIndexed(d)) {
            throw new Error('MatrixView.getSteps: ' +
                            'Dimension isn\'t indexed with indices.');
        }
        var steps = indices[d].slice();
        var i;
        for (i = steps.length - 1; i > 0; i--) {
            steps[i] -= steps[i - 1];
        }
        // steps.push(-Infinity);
        var last = indices[d][indices[d].length - 1];
        steps.push(-(last + 1));
        steps[0] = 0;
        return steps;
    };

    /** Number of elements in the original View (i.e. when it was created).
     *
     * See also:
     *  {@link MatrixView#getInitialSize}.
     *
     *     // Create a View
     *     var v = new MatrixView([3, 3]);
     *
     *     // Number of elements
     *     var nel = v.getLength();    // nel is: 9
     *
     *     // Select some elements along dimension 1
     *     v.selectIndicesDimension(1, [0, 2]);
     *
     *     // Number of elements
     *     nel = v.getLength();        // nel is: 6
     *     nel = v.getInitialLength(); // nel is: 9
     *
     * @return {Number}
     *
     * @todo rename?
     */
    var getInitialLength = function () {
        var i, ie = initial.size.length, nel;
        for (i = 0, nel = 1; i < ie; i++) {
            nel *= initial.size[i];
        }
        return nel;
    };

    /** Size of the original View (i.e. when it was created).
     *
     * See also:
     *  {@link MatrixView#getInitialLength}.
     *
     *     // Create a View
     *     var v = new MatrixView([3, 3]);
     *
     *     // Select some elements along dimension 1
     *     v.selectIndicesDimension(1, [0, 2]);
     *
     *     // Size
     *     var size = v.getSize();     // size is: [3, 2]
     *     size = v.getInitialSize();  // size is: [3, 3]
     *
     * @return {Array}
     */
    var getInitialSize = function () {
        return initial.size.slice();
    };

    /** Convert a ND-indice into a linear indice.
     *
     *     // Create a View
     *     var v = new MatrixView([3, 2]);
     *
     *     // Linear index of (1,1)
     *     var index = v.getIndex([1, 1]);     // index is: 4
     *
     * @param {Array} coordinates
     *  A ND-indice, e.g. (x,y) in a 2D Matrix.
     *
     * @return {Number}
     *  Linear indice k associated to (x,y).
     *
     * @todo useful for a View (we don't know the size)? What if indices-indexed?
     */
    var getIndex = function (coordinates) {
        var ndims = getDimLength();
        var l = coordinates.length;
        if (l > 1 && l !== ndims) {
            throw new Error('MatrixView.getIndex: invalid ND-index.');
        }
        var i, indice;
        for (i = 0, indice = 0; i < l; i++) {
            if (coordinates[i] < 0 || coordinates[i] >= size[i]) {
                throw new Error('MatrixView.getIndex: invalid index.');
            }
            indice += first[i] + coordinates[i] * step[i];
        }
        return indice;
    };

    /** Indice of the first selected element on a given dimension.
     *
     * See also:
     *  {@link MatrixView#getStep},
     *  {@link MatrixView#getEnd},
     *  {@link MatrixView#getSize}.
     *
     *     // Create a View and select a part of it
     *     var v = new MatrixView([5, 2]);
     *     v.select([2, 3]);
     *
     *     // Get first values
     *     var first = v.getFirst(0);  // first is: 2
     *     first = v.getFirst(1);      // first is: 0
     *
     * @param {Number} dim
     *  Dimension along which to get the indice.
     *
     * @return {Number}
     *  Indice of the first selected element.
     *
     * @todo what if indices-indexed?
     */
    var getFirst = function (d) {
        if (!Tools.isInteger(d, 0)) {
            throw new Error('MatrixView.getFirst: invalid dimension.');
        }
        return Tools.isSet(first[d]) ? first[d] : 0;
    };

    /** Downsampling step along a given dimension.
     *
     * See also:
     *  {@link MatrixView#getFirst},
     *  {@link MatrixView#getEnd},
     *  {@link MatrixView#getSize}.
     *
     *     // Create view
     *     var v = new MatrixView([5, 2]);
     *
     *     // Select a sub part
     *     v.select([2, 3]);
     *
     *     // Get step values
     *     var step = v.getStep(0); // Return 1
     *     step = v.getStep(1);     // Return 5
     *
     * @param {Number} dim
     *  Dimension along with to get the step.
     *
     * @return {Number}
     *  Indices step between 2 values.
     */
    var getStep = function (d) {
        if (!Tools.isInteger(d, 0)) {
            throw new Error('MatrixView.getStep: invalid dimension.');
        }
        if (isIndicesIndexed(d)) {
            throw new Error('MatrixView.getStep: dimension is indexed by indices.');
        }
        return Tools.isSet(step[d]) ? step[d] : 1;
    };

    /** Indice+1 of the last selected element on a given dimension.
     *
     * See also:
     *  {@link MatrixView#getFirst},
     *  {@link MatrixView#getStep},
     *  {@link MatrixView#getSize}.
     *
     *     // Create a View and select a part of it
     *     var v = new MatrixView([5, 2]);
     *     v.select([[4, 2, 0]]);
     *
     *     // Get end values
     *     var end = v.getEnd(0);  // end is: -Infinity
     *     end = v.getEnd(1);      // end is: 10
     *
     * @param {Number} dim
     *  Dimension along which to get the indice.
     *
     * @return {Number}
     *  Indice+1 of the last selected element.
     *
     * @todo indice-indexed case (now return -Inf)?
     */
    var getEnd = function (d) {
        if (!Tools.isInteger(d, 0)) {
            throw new Error('MatrixView.getEnd: invalid dimension.');
        }
        if (isIndicesIndexed(d)) {
            return -1;
        }
        var s = Tools.isSet(size[d]) ? size[d] : 1;
        return (first[d] || 0) + s * (step[d] || 1);
    };

    this.getDimLength     = getDimLength;
    this.getLength        = getLength;
    this.getInitialLength = getInitialLength;
    this.getInitialSize   = getInitialSize;

    this.getIndex = getIndex;
    this.getFirst = getFirst;
    this.getStep = getStep;
    this.getSteps = getSteps;
    this.getEnd = getEnd;
    this.getSize = getSize;
    this.isIndicesIndexed = isIndicesIndexed;
    this.getIndices = getIndices;


    //////////////////////////////////////////////////////////////////
    //                      Basics manipulations                    //
    //////////////////////////////////////////////////////////////////

    /** Add a singleton dimensions at the end.
     *
     * @param {Number} n
     *  Number of singleton dimension to be added.
     *
     * @chainable
     * @private
     *
     * @todo Other name (in matrix)? Not private? Remove?
     */
    var pushSingletonDimensions = function (n) {
        if (!Tools.isInteger(n, 0)) {
            throw new Error('MatrixView.pushSingletonDimensions: invalid dimension.');
        }
        var i;
        for (i = 0; i < n; i++) {
            first.push(0);
            step.push(1);
            size.push(1);
        }
        return this;
    }.bind(this);

    /** Select slices of the View along a dimension.
     *
     * See also:
     *  {@link MatrixView#selectIndicesDimension},
     *  {@link MatrixView#swapDimensions},
     *  {@link MatrixView#shiftDimension}.
     *
     *     // Create a View
     *     var v = new MatrixView([6, 4]);
     *
     *     // Along first dim., select one value out of 2, from #1 to #5
     *     v.selectDimension(0, [1, 2, 5]);
     *
     *     //  | 0  6 12 18 |
     *     //  | 1  7 13 19 |
     *     //  | 2  8 14 20 |      | 1  7 13 19 |
     *     //  | 3  9 15 21 |  ->  | 3  9 15 21 |
     *     //  | 4 10 16 22 |      | 5 11 17 23 |
     *     //  | 5 11 17 23 |
     *
     * @param {Number} dim
     *  Dimension along which the selection is performed.
     *
     * @param {Array | Number} selection
     *  Can be:
     *
     *  + `[]`: select all.
     *  + `[indice]` or `indice`: select only 1 slice.
     *  + `[start, end]`: select all the slices from `start` to `end` indices.
     *  + `[start, step, end]`: same, but select only 1 slice out of `step`.
     *
     *  Negative values are interpreted as indices from the end of the array:
     *  the last indice is `-1`, then `-2`, etc.
     *
     * @chainable
     */
    var selectDimension = function (d, sel) {
        if (!Tools.isInteger(d, 0)) {
            throw new Error('MatrixView.select: invalid dimension.');
        }
        sel = Tools.checkColon(sel, getSize(d));

        if (!isIndicesIndexed(d)) {
            first[d] += sel[0] * step[d];
            step[d]  *= sel[1];
            size[d]   = Math.floor(Math.abs((sel[2] - sel[0]) / sel[1])) + 1;
        } else {
            var i, ie, s, ind = indices[d], indOut = [];
            for (i = sel[0], ie = sel[2], s = sel[1]; i <= ie; i += s) {
                indOut.push(ind[i]);
            }
            first[d] = indOut[0];
            indices[d] = indOut;
            size[d] = indOut.length;
        }

        return this;
    }.bind(this);

    /** Select slices of the View along a dimension, indexing by indices.
     *
     * See also:
     *  {@link MatrixView#selectDimension},
     *  {@link MatrixView#swapDimensions},
     *  {@link MatrixView#shiftDimension}.
     *
     *     // Create view
     *     var v = new MatrixView([6, 4]);
     *
     *     // Along first dim, select slices of indices 4, 3, and 1
     *     v.selectIndicesDimension(0, [4, 3, 1]);
     *
     *     //  | 0  6 12 18 |
     *     //  | 1  7 13 19 |
     *     //  | 2  8 14 20 |      | 4 10 16 22 |
     *     //  | 3  9 15 21 |  ->  | 3  9 15 21 |
     *     //  | 4 10 16 22 |      | 1  7 13 19 |
     *     //  | 5 11 17 23 |
     *
     * @param {Number} dim
     *  Dimension along which the selection is performed.
     *
     * @param {Array | Number} selection
     *  Indices to be selected.
     *
     * @chainable
     */
    var selectIndicesDimension = function (d, ind) {

        if (!Tools.isInteger(d, 0)) {
            throw new Error('MatrixView.selectIndicesDimension: Dimension ' +
                            'must be a positive integer.');
        }

        if (!Tools.isArrayOfIntegers(ind, 0, getSize(d) - 1)) {
            throw new Error('MatrixView.selectIndicesDimension: Invalid index.');
        }
        ind = Array.prototype.slice.apply(ind);

        var i, ie;
        if (!isIndicesIndexed(d)) {
            var f = getFirst(d), dx = getStep(d);
            for (i = 0, ie = ind.length; i < ie; i++) {
                ind[i] *= dx;
                ind[i] += f;
            }
        } else {
            for (i = 0, ie = ind.length; i < ie; i++) {
                ind[i] = indices[ind[i]];
            }
        }
        if (ind[0] === undefined) {
            ind[0] = -1;
        }
        first[d]   = ind[0];
        step[d]    = 1;
        size[d]    = ind.length;
        indices[d] = ind;
        return this;
    }.bind(this);

    /** Select slices of the View along a dimension, indexing by booleans.
     *
     * See also:
     *  {@link MatrixView#selectDimension},
     *  {@link MatrixView#selectIndicesDimension},
     *  {@link MatrixView#swapDimensions},
     *  {@link MatrixView#shiftDimension}.
     *
     * @param {Number} dimension
     *  Dimension along which the selection is performed.
     *
     * @param {Array} selection
     *  Array of boolean of the same size as the dimension `dim`.
     *
     * @chainable
     */
    var selectBooleanDimension = function (d, boolInd) {
        if (!Tools.isInteger(d, 0)) {
            throw new Error('MatrixView.selectBooleanDimension: invalid dimension.');
        }
        if (boolInd.length !== getSize(d)) {
            throw new Error('MatrixView.selectBooleanDimension: array dimensions mismatch.');
        }

        var i, ei, ind = [];
        for (i = 0, ei = boolInd.length; i < ei; i++) {
            if (boolInd[i]) {
                ind.push(i);
            }
        }
        return this.selectIndicesDimension(d, ind);
    }.bind(this);

    var swap = function (tab, i, j) {
        var tmp = tab[i];
        tab[i] = tab[j];
        tab[j] = tmp;
    };
    /** Swap (transpose) 2 dimensions.
     *
     * Note that the View is modified: it is an on-place transposition.
     *
     * See also:
     *  {@link MatrixView#shiftDimension}.
     *
     * @param {Number} dimA
     *  First dimension to be swapped.
     *
     * @param {Number} dimB
     *  Second dimension to be swapped.
     *
     *     // Create a View and transpose it.
     *     var v = new MatrixView([4, 3]);
     *     v.swapDimensions(0, 1);
     *
     *     //  | 0 4  8 |
     *     //  | 1 5  9 |      | 0  1  2  3 |
     *     //  | 2 6 10 |  ->  | 4  5  6 10 |
     *     //  | 3 7 11 |      | 8  9 10 11 |
     *
     * @todo rename it as a transposition?
     *
     * @chainable
     */
    var swapDimensions = function (dimA, dimB) {
        var ndims = getDimLength();
        if (!Tools.isInteger(dimA, 0)) {
            throw new Error('MatrixView.swapDimensions: invalid dimensions.');
        }
        if (!Tools.isInteger(dimB, 0)) {
            throw new Error('MatrixView.swapDimensions: invalid dimensions.');
        }

        var n = Math.max(dimA, dimB) + 1 - ndims;
        if (n > 0) {
            pushSingletonDimensions(n);
        }
        swap(first, dimA, dimB);
        swap(step, dimA, dimB);
        swap(size, dimA, dimB);
        swap(indices, dimA, dimB);

        return this;
    }.bind(this);

    /** Shift dimensions of the matrix, circularly.
     *
     * See also:
     *  {@link MatrixView#swapDimensions}.
     *
     *     // Create view
     *     var v = new MatrixView([1, 1, 3]);
     *
     *     // Tranpose the view
     *     var shift = v.shiftDimension();
     *     var size = v.getSize();      // size is: [3, 1]
     *
     * @param {Number} [n]
     *  Shift size:
     *
     *  + if omitted: first singleton dimensions are removed.
     *  + if positive: shift to the right, last `n` dimensions becomes the first ones.
     *  + if negative: shift to the left, first `n` dimensions becomes the last ones.
     *
     * @todo make it consistent with Matlab & the doc; allow 1D array?
     *
     * @chainable
     */
    var shiftDimension = function (n) {
        var i;
        if (!Tools.isSet(n)) {
            for (i = 0; size.length > 0 && size[0] === 1; i++) {
                first.shift();
                step.shift();
                size.shift();
            }
            // TODO: allow it?
            if (getDimLength() === 1) {
                first.push(0);
                step.push(1);
                size.push(1);
            }
        } else {
            var ndims = getDimLength();
            if (!Tools.isInteger(n, 1 - ndims, ndims - 1)) {
                throw new Error('MatrixView.shiftDimension: invalid shift.');
            }
            for (i = 0; i < n; i++) {
                first.push(first.shift());
                step.push(step.shift());
                size.push(size.shift());
            }
            for (i = n; i < 0; i++) {
                first.unshift(0);
                step.unshift(1);
                size.unshift(1);
            }
        }
    }.bind(this);

    this.selectDimension         = selectDimension;
    this.selectIndicesDimension  = selectIndicesDimension;
    this.selectBooleanDimension  = selectBooleanDimension;
    this.swapDimensions          = swapDimensions;
    this.shiftDimension          = shiftDimension;


    //////////////////////////////////////////////////////////////////
    //                     Debugging Functions                      //
    //////////////////////////////////////////////////////////////////

    // Display info about the View
    this.display = function () {
        var i, ie;
        for (i = 0, ie = getDimLength(); i < ie; i++) {
            if (isIndicesIndexed(i)) {
                console.log(true, getIndices(i));
            } else {
                console.log(false, getFirst(i), getStep(i), getSize(i));
            }
        }
        return this;
    }.bind(this);


    //////////////////////////////////////////////////////////////////
    //                          Constructor                         //
    //////////////////////////////////////////////////////////////////

    // New view constructor
    if (Tools.isArrayLike(arg)) {
        return setFromSize(arg);
    }

    // Copy constructor
    if (arg instanceof MatrixView) {
        setFromView(arg);
        initial.first = first.slice();
        initial.step = step.slice();
        initial.size = size.slice();
        return this;
    }

    // Otherwise, argument is invalid
    throw new Error('MatrixView: invalid argument.');
}

(function (MatrixView, MatrixView_prototype) {
    'use strict';

    function getSteps (indices, step) {
        var i, l = indices.length;
        var steps = indices.slice();
        for (i = l - 1; i > 0; i--) {
            steps[i] -= steps[i - 1];
            steps[i] *= step;
        }
        steps[0] = 0;
        steps.push(-indices[l - 1] * step - 1);
        return steps;
    }

    /** 
     * @class MatrixView.SubIteratorIndices
     * @private
     */
    function SubIteratorIndices (indices, step) {
        var index, stepIndex, stop;
        var first = indices[0], steps = getSteps(indices, step || 1);
        this.iterator = function () {
            return index += steps[++stepIndex];
        };
        this.begin = function (offset) {
            offset = offset || 0;
            stepIndex = 0;
            stop = offset - 1;
            return (index = offset + first);
        };
        this.end = function () {
            return stop;
        };
        this.isEnd = function () {
            return (index === stop);
        };
        this.getPosition = function () {
            return stepIndex;
        };
        this.getIndex = function () {
            return index;
        };
    }

    /** 
     * @class MatrixView.SubIterator
     * @private
     */
    function SubIterator (first, step, end) {
        var start, stop, index;
        this.iterator = function () {
            return (index += step);
        };
        this.begin = function (offset) {
            offset = offset || 0;
            start = offset + first;
            stop = offset + end;
            return (index = start);
        };
        this.end = function () {
            return stop;
        };
        this.isEnd = function () {
            return (index === stop);
        };
        this.getPosition = function () {
            return (index - start) / step;
        };
        this.getIndex = function () {
            return index;
        };
    }

    /** 
     * @class MatrixView.Iterator
     * @private
     * @constructor Create an iterator for a colon indexed dimension.
     *
     * @param {MatrixView} view 
     *  View to iterate on.
     * @param {Integer} dim
     *  First dimension to iterate on.
     */
    function Iterator (view, dim) {
        // Subiterators on upper dimensions
        var it, index, dimLength, first, step, end, stop;
        function iterateDim (d) {
            if (d >= dimLength) {
                return -1;
            }
            var i = it[d], val = i.iterator();
            if (i.isEnd()) {
                val = iterateDim(d + 1);
                return (val !== -1) ? i.begin(val) : -1;
            }
            return val;
        }
        this.iterator = function () {
            index += step;
            if (index === stop) {
                var val = iterateDim(dim + 1);
                index = (val === -1) ? - 1 : val + first;
                stop = val + end;
            }
            return index;
        };
        this.begin = function () {
            first = view.getFirst(dim);
            step = view.getStep(dim);
            end = view.getEnd(dim);
            dimLength = view.getDimLength();
            var i, begin;
            it = new Array(dimLength);
            for (i = dimLength - 1; i > dim; i--) {
                it[i] = view.getSubIterator(i);
                begin = it[i].begin(begin || 0);
            }

            for (index = 0, i = dim + 1; i < dimLength; i++) {
                index += view.getFirst(i);
            }
            stop = (index + end);
            index += first;
            return index;
        };
        this.isEnd = function () {
            return index === -1;
        };
        this.end = function () {
            return -1;
        };
        this.getPosition = function () {
            var i, ie, pos = [], start;
            if (it[dim + 1]) {
                start = it[dim + 1].getIndex();
            } else {
                start = 0;
            }
            pos[0] = (index - start - first) / step;
            for (i = dim + 1, ie = it.length; i < ie; i++) {
                pos[i - dim] = it[i].getPosition();
            }
            return pos;
        };
    }


    /** 
     * @class MatrixView.IteratorIndices
     * @private
     * @constructor Create an iterator for a indice indexed dimension.
     *
     * @param {MatrixView} view 
     *  View to iterate on.
     * @param {Integer} dim
     *  First dimension to iterate on.
     */
    function IteratorIndices (view, dim) {
        // For View indiexed by indices
        var it, index, subIndex, dimLength, first, end, stop;
        var indices  = view.getIndices(dim);
        var steps    = view.getSteps(dim);
        var iterateDim = function (d) {
            var i = it[d];
            if (!i) {
                return -1;
            }
            var val = i.iterator();
            if (i.isEnd()) {
                val = iterateDim(d + 1);
                return (val !== -1) ? i.begin(val) : -1;
            }
            return val;
        };
        /** Iterate and return the new index. */
        this.iterator = function () {
            subIndex++;
            if (subIndex === stop) {
                var val = iterateDim(dim + 1);
                if (val === -1) {
                    return (index = -1);
                }
                index = val + first;
                subIndex = 0;
            }
            index += steps[subIndex];
            return index;
        };
        /** Return the first index. */
        this.begin = function () {
            first = view.getFirst(dim);
            end = view.getEnd(dim);
            dimLength = view.getDimLength();
            var i, begin;
            it = new Array(dimLength);
            for (i = dimLength - 1; i > dim; i--) {
                it[i] = view.getSubIterator(i);
                begin = it[i].begin(begin || 0);
            }
            for (subIndex = 0, index = 0, i = dim; i < dimLength; i++) {
                index += view.getFirst(i);
            }
            stop = indices.length;
            return index;
        };
        /** Test if the end index is reached. */
        this.isEnd = function () {
            return index === -1;
        };
        /** Return the end index. */
        this.end = function () {
            return -1;
        };
        /** Return the position of the iterator. */
        this.getPosition = function () {
            var i, ie, pos = [];
            pos[0] = subIndex;
            for (i = dim + 1, ie = it.length; i < ie; i++) {
                pos[i - dim] = it[i].getPosition();
            }
            return pos;
        };
    }

    /** @class MatrixView */

    /** Get an iterator over the View.
     *
     * An iterator is a object with following properties:
     *
     *  + `Iterator.begin()`:
     *      initialize the iterator on a given dimension and returns the first index.
     *  + `Iterator.iterator()`:
     *      increment the iterator.
     *  + `Iterator.isEnd()`:
     *      return true iff the iterator reached the end of the View.
     *  + `Iterator.end()`:
     *      return the final value of the iterator, this means "end of View".
     *  + `Iterator.getPosition()`:
     *      return (as an Array) the current position of the iterator over the working dimensions.
     *
     * See also:
     *  {@link MatrixView#getSubIterator}.
     *
     * @param {Number} dim
     *  The iterator works on dimensions `dim` and following.
     *  Dimensions before `dim` are not iterated over.
     *
     * @return {Object}
     *
     * @todo redefine the spec; document all members.
     */
    MatrixView_prototype.getIterator = function (dim) {
        // Check parameter
        if (!Tools.isSet(dim)) {
            dim = 0;
        } else if (!Tools.isInteger(dim, 0)) {
            throw new Error('MatrixView.getIterator: invalid dimension.');
        }

        if (this.isIndicesIndexed(dim)) {
            return new IteratorIndices(this, dim);
        }
        var it = new Iterator(this, dim);
        return it;
    };

    /** Return an iterator over a given dimension of the View.
     *
     * The sub-iterator is a function with following properties:
     *
     *  + `SubIterator.begin(start)`:
     *      initialize the iterator with a starting index, return the first index.
     *  + `SubIterator.iterator()`:
     *      increment the sub-iterator.
     *  + `SubIterator.isEnd()`:
     *      return true iff the sub-iterator reached the end of the dimension.
     *  + `SubIterator.end()`:
     *      return the final value of the iterator, this means "end of Dimension".
     *  + `SubIterator.getPosition()`:
     *      return the current position of the sub-iterator.
     *
     * See also:
     *  {@link MatrixView#getIterator}.
     *
     * @param {Number} dim
     *  Dimension along which to iterate.
     *
     * @return {Function}
     */
    MatrixView_prototype.getSubIterator = function (dim) {
        // Check parameter
        if (!Tools.isInteger(dim, 0)) {
            throw new Error('MatrixView.getSubIterator: invalid dimension.');
        }

        if (this.isIndicesIndexed(dim)) {
            return new SubIteratorIndices(this.getIndices(dim), 1);
        }
        var first = this.getFirst(dim);
        var step = this.getStep(dim);
        var end = this.getEnd(dim);
        return new SubIterator(first, step, end);
    };

    /** Extract the data of an array to a new array equiped with the current View.
     *
     * The new array will have the same type as the input array.
     * An output array can be provided instead of creating a new array.
     *
     * See also:
     *  {@link MatrixView#extractFrom}.
     *
     * @param {Array} dataIn
     *  Input data array, to be read using the current View.
     *
     * @param {Array} [dataOut]
     *  Output data array.
     *
     * @return {Array}
     *  Output data of extracted values.
     *
     * @todo create the new array? write example
     */
    MatrixView_prototype.extractTo = function (dataIn, dataOut) {

        // Check arguments
        if (!Tools.isArrayLike(dataOut)) {
            throw new Error('MatrixView.extractTo: invalid output data.');
        }
        if (dataOut.length !== this.getInitialLength()) {
            throw new Error('MatrixView.extractTo: Output data length is invalid.');
        }

        // Input iterator
        var iterator = this.getIterator(1);
        var i, ie, it = iterator.iterator, b = iterator.begin, e = iterator.end;
        var y, ye, fy = this.getFirst(0), ly = this.getEnd(0);
        var steps, ny, dy, s;
        var yo;

        if (Tools.isArrayLike(dataIn) && dataIn.length === this.getLength()) {

            // Copy an array
            if (dataOut === dataIn) {
                throw new Error('MatrixView.extractTo: cannot perform on-place extraction.');
            }
            if (this.isIndicesIndexed(0)) {
                steps = this.getSteps(0);
                for (i = b(), ie = e(), yo = 0; i !== ie; i = it()) {
                    for (s = 0, y = i + fy, ye = i + ly; y !== ye; yo++, y += steps[++s]) {
                        dataOut[y] = dataIn[yo];
                    }
                }
            } else {
                dy = this.getStep(0);
                for (i = b(), ie = e(), yo = 0; i !== ie; i = it()) {
                    for (y = i + fy, ny = i + ly; y !== ny; y += dy, yo++) {
                        dataOut[y] = dataIn[yo];
                    }
                }
            }

        } else if (dataIn.length === 1 || typeof dataIn  === 'number') {

            // Copy a number
            if (dataIn.length === 1) {
                dataIn = dataIn[0];
            }
            if (this.isIndicesIndexed(0)) {
                steps = this.getSteps(0);
                for (i = b(), ie = e(), yo = 0; i !== ie; i = it()) {
                    for (s = 0, y = i + fy, ye = i + ly; y !== ye; y += steps[++s]) {
                        dataOut[y] = dataIn;
                    }
                }
            } else {
                dy = this.getStep(0);
                for (i = b(), ie = e(), yo = 0; i !== ie; i = it()) {
                    for (y = i + fy, ny = i + ly; y !== ny; y += dy) {
                        dataOut[y] = dataIn;
                    }
                }
            }

        } else {
            throw new Error('MatrixView.extractTo: invalid input length.');
        }

        return dataOut;
    };

    /** Extract data from an array equiped with the current View to a new Array.
     *
     * The new array will have the same type as the input array.
     * An output array can be provided instead of creating a new array.
     *
     * See also:
     *  {@link MatrixView#extractTo}.
     *
     *     // Create a View and some data
     *     var v = new MatrixView([3, 3]);
     *     var d = [0, 1, 2, 3, 4, 5, 6, 7, 8];
     *
     *     // Select third column
     *     v.selectDimension(1, [2]);
     *
     *     // Extract the associated data
     *     var out = v.extract(d);   // out is: [6, 7, 8]
     *
     * @param {Array} dataIn
     *  Input data array, to be read using the current View.
     *
     * @param {Array} [dataOut]
     *  Output data array.
     *
     * @return {Array}
     *  Output data of extracted values.
     */
    MatrixView_prototype.extractFrom = function (dataIn, dataOut) {

        // Check input array
        if (!Tools.isArrayLike(dataIn)) {
            throw new Error('MatrixView.extractFrom: invalid input data.');
        }
        if (dataIn.length !== this.getInitialLength()) {
            throw new Error('MatrixView.extractFrom: input data dimensions mismatch.');
        }

        // Check output array
        dataOut = dataOut || new dataIn.constructor(this.getLength());
        if (!Tools.isArrayLike(dataOut)) {
            throw new Error('MatrixView.extractFrom: invalid output data.');
        }
        if (dataOut.length !== this.getLength()) {
            throw new Error('MatrixView.extractFrom: output data dimensions mismatch.');
        }
        if (dataOut === dataIn) {
            throw new Error('MatrixView.extractFrom: cannot perform on-place extraction.');
        }

        // Input iterator
        var iterator = this.getIterator(1);
        var i, ie, it = iterator.iterator, b = iterator.begin, e = iterator.end;
        var y, ye, fy = this.getFirst(0), ly = this.getEnd(0);
        var yo;

        // Perform copy
        if (this.isIndicesIndexed(0)) {
            var steps = this.getSteps(0), s;
            for (i = b(), ie = e(), yo = 0; i !== ie; i = it()) {
                for (s = 0, y = i + fy, ye = i + ly; y !== ye; yo++, y += steps[++s]) {
                    dataOut[yo] = dataIn[y];
                }
            }
        } else {
            var ny, dy = this.getStep(0);
            for (i = b(), ie = e(), yo = 0; i !== ie; i = it()) {
                for (y = i + fy, ny = i + ly, ye = i + ly; y !== ye; y += dy, yo++) {
                    dataOut[yo] = dataIn[y];
                }
            }
        }

        return dataOut;
    };

    /** Extract data from an array to a new Array.
     *
     * The new array will have the same type as the input array.
     * An output array can be provided instead of creating a new array.
     *
     * See also:
     *  {@link MatrixView#extract}.
     *
     *     // Create input View and data
     *     var dIn = [0, 1, 2, 3, 4, 5, 6, 7, 8];
     *     var vIn = new MatrixView([3, 3]);
     *     // select third column: 6, 7, 8
     *     vIn.selectDimension(1, [2]);
     *
     *     // Create output View and data
     *     var dOut = [0, 1, 2, 3, 4, 5, 6, 7, 8];
     *     var vOut = new MatrixView([3, 3]);
     *     // select first row: 1, 3, 6
     *     vOut.selectDimension(0, [0]);        
     *
     *     // Extract Data
     *     var out = vIn.extract(dIn, vOut, dOut);  
     *     // out is: [6, 1, 2, 7, 4, 5, 8, 7, 8]
     *
     * @param {Array} inputData
     *  Input data, equipped with the current View.
     *
     * @param {MatrixView} outputView
     *  View for the output array.
     *
     * @param {Array} outputData
     *  Output data, equipped with the `outputView`.
     *
     * @return {Array}
     *  Output data of extracted values.
     *
     * @todo merge with 'extractFrom'; output view/data optionals and in any order
     * @fixme replace !e() by a faster instruction.
     */
    MatrixView_prototype.extract = function (dataIn, viewOut, dataOut) {

        // Check arguments
        if (!Tools.isArrayLike(dataIn)) {
            throw new Error('MatrixView.extract: invalid input data.');
        }
        if (!(viewOut instanceof MatrixView)) {
            throw new Error('MatrixView.extract: invalid output view.');
        }
        if (!Tools.isArrayLike(dataOut)) {
            throw new Error('MatrixView.extract: invalid output data.');
        }

        // Check dimensions
        if (dataIn.length !== this.getInitialLength()) {
            throw new Error('MatrixView.extract: invalid input data length.');
        }
        if (dataOut.length !== viewOut.getInitialLength()) {
            throw new Error('MatrixView.extract: invalid output data length.');
        }
        if (dataOut === dataIn) {
            throw new Error('MatrixView.extract: cannot perform on-place extraction.');
        }

        // Iterators
        var it, i, b, e;
        var ito, io, bo, ei;
        var iterator, iteratoro;
        if (this.isIndicesIndexed(0) && viewOut.isIndicesIndexed(0)) {
            iterator = this.getIterator(1);
            it = iterator.iterator;
            b = iterator.begin;
            e = iterator.isEnd;
            var y, ye, yo, fy = it.getFirst(0), ly = it.getEnd(0);
            var steps = it.getSteps(0), s;
            for (i = b(), yo = 0; !e(); i = it()) {
                for (s = 1, y = i + fy, ye = i + ly; s !== ye; yo++, y += steps[s], s++) {
                    dataOut[yo] = dataIn[y];
                }
            }
        } else {
            iterator = this.getIterator(0);
            it = iterator.iterator;
            b = iterator.begin;
            e = iterator.end;
            iteratoro = viewOut.getIterator(0);
            bo = iteratoro.begin;
            ito = iteratoro.iterator;
            for (i = b(), io = bo(), ei = e(); i !== ei; i = it(), io = ito()) {
                dataOut[io] = dataIn[i];
            }
        }

        return dataOut;
    };

})(MatrixView, MatrixView.prototype);

if (typeof window === 'undefined') {
    module.exports.MatrixView = MatrixView;
}
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

/** @class MatrixView */

(function (MatrixView, MatrixView_prototype) {
    'use strict';

    /** Returns the number of array dimensions.
     * It is a Matlab alias for {@link MatrixView#getDimLength},
     *
     * @return {Number}
     */
    MatrixView_prototype.ndims = function () {
        return this.getDimLength();
    };

    /** Test if a the view corresponds to a row vector or not.
     *
     * @return{Boolean}
     */
    MatrixView_prototype.isrow = function () {
        var size = this.getSize();
        return (size.length === 2 && size[0] === 1);
    };

    /** Test if the view correponds to a column vector or not.
     *
     * @return{Boolean}.
     */
    MatrixView_prototype.iscolumn = function () {
        var size = this.getSize();
        return (size.length === 2 && size[1] === 1);
    };

    /** Test if the view corresponds to a vector or not.
     *
     * @return{Boolean}
     */
    MatrixView_prototype.isvector = function () {
        var size = this.getSize();
        return (size.length === 2 && (size[1] === 1 || size[0] === 1));
    };

    /** Test if the view corresponds to a matrix or not.
     *
     * @return{Boolean}
     */
    MatrixView_prototype.ismatrix = function () {
        return this.getSize().length === 2;
    };

})(MatrixView, MatrixView.prototype);
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

/** @class MatrixView */

(function (MatrixView, MatrixView_prototype) {
    'use strict';

    /**
     * Allow to select an subpart of the MatrixView on each dimension.
     *
     * __Also see:__
     * {@link MatrixView#selectIndicesDimension},
     * {@link MatrixView#selectBooleanDimension},
     * {@link MatrixView#selectDimension}.
     *
     *     // Create view
     *     var v = new MatrixView([3, 3]);
     *     var d = [0, 1, 2, 3, 4, 5, 6, 7, 8];
     *     // Select first column
     *
     *     v.select([], [0]);
     *     var row = v.extract(d); // row = [0, 1, 2]
     *     // Reset view in its original form
     *     v.restore();
     *
     *     // Select first column
     *     v.select(0);
     *     var col = v.extract(d); // col = [0, 3, 6]
     *     v.restore();
     *
     *     // Reverse the order of columns
     *     v.select([], [-1, 0]);
     *     var mat = v.extract(d); // mat = [6, 7, 8, 3, 4, 5, 0, 1, 2]
     *     v.restore();
     *
     * @param {Array|Integer|Integer[]|Integer[][]|Boolean[]} select
     *  For each dimension, can be an array-like
     *  formated as:
     *
     *  + `[]`: select all the values along the dimension,
     *  + `startValue`: select one value along the dimension,
     *  + `[start, end]`: select all values between start and end values,
     *  + `[start, step, end]`: select all values from start to end with a step,
     *  + `[[indices list]]`: an indice list,
     *  + `[[boolean array]]`: a boolean array.
     *
     * @chainable
     */
    MatrixView_prototype.select = function () {
        var T = Tools;
        var i, ie;
        for (i = 0, ie = arguments.length; i < ie; i++) {
            var arg = arguments[i];
            // Arg is an array
            if (T.isArrayLike(arg)) {

                // Arg is an array containing an array [[<ind>]]
                if (T.isArrayLike(arg[0])) {
                    this.selectIndicesDimension(i, arg[0]);
                    // Arg is a boolean array [<boolean>]
                } else if (T.isArrayOfBooleans(arg)) {
                    this.selectBooleanDimension(i, arg);
                    // Arg is a colon operator but not [<start, step, end>]
                } else if (arg.length !== 0) {
                    this.selectDimension(i, arg);
                }

                // Arg is just an integer <integer>
            } else if (T.isInteger(arg)) {
                this.selectDimension(i, arg);
                // Otherwise
            } else {
                throw new Error("MatrixView.select: Invalid selection.");
            }
        }
        return this;
    };

    /**
     * Defines how iterator will scan the view
     *
     * __Also see:__
     * {@link MatrixView#ipermute}.
     *
     *     // Create view
     *     var v = new MatrixView([2, 2, 2]);
     *     var d = [0, 1, 2, 3, 4, 5, 6, 7];
     *
     *     // Reverse the order of columns
     *     v.permute([2, 1, 0]);
     *     var mat = v.extract(d); // mat = [0, 4, 2, 6, 1, 5, 3, 7]
     *
     * @param {Integer[]} dimensionOrder Defines the order in which
     * the dimensions are traversed.
     *
     * @method permute
     *
     * @chainable
     */
    MatrixView_prototype.permute = function (dim) {
        var errMsg = this.constructor.name + '.permute: ';
        if (dim.length < this.getDimLength()) {
            throw new Error(errMsg + 'Dimension permutation is invalid.');
        }

        dim = dim.slice();
        var ndims = dim.length;
        var i, ie, j;
        for (i = 0; i < ndims; i++) {
            var t = false;
            for (j = 0; j < ndims; j++) {
                if (dim[j] === i) {
                    t = true;
                }
            }
            if (t === false) {
                throw new Error(errMsg + 'Dimension permutation is invalid.');
            }
        }

        // Reorder the view
        for (i = 0, ie = ndims; i < ie; i++) {
            j = i;
            while (true) {
                var k = dim[j];
                dim[j] = j;
                if (k === i) {
                    break;
                } else {
                    this.swapDimensions(j, k);
                }
                j = k;
            }
        }
        return this;
    };

    /**
     * Inverse dimension permutation.
     *
     * __Also see:__
     * {@link MatrixView#permute}.
     *
     *     // Create view
     *     var v = new MatrixView([2, 2, 2]);
     *     var d = [0, 1, 2, 3, 4, 5, 6, 7];
     *
     *     // Reverse the order of columns
     *     v.permute([2, 1, 0]);
     *     v.ipermute([2, 1, 0]);
     *     var mat = v.extract(d); // mat =  [0, 1, 2, 3, 4, 5, 6, 7]
     *
     * @param {Integer[]} dim List of dimension on which perform inverse permutation.
     *
     * @method ipermute
     * @chainable
     */
    MatrixView_prototype.ipermute = function (dim) {

        // Create a dim indices Array
        var i, ie, indices = [];
        for (i = 0, ie = dim.length; i < ie; i++) {
            indices[i] = i;
        }

        // Get dim sorted indices.
        var f = function (a, b) {
            return dim[a] - dim[b];
        };

        return this.permute(indices.sort(f));
    };

    /**
     * Rotates MatrixView counterclockwise by a multiple of 90 degrees.
     *
     *     // Create view
     *     var v = new MatrixView([2, 2]);
     *     var d = [0, 1, 2, 3];
     *
     *     // Rotate matrix
     *     var mat = v.rot90().extract(d); // mat = [2, 0, 3, 1]
     *
     * @param {Integer} [k=1] Defines the number of 90 degrees rotation.
     *
     * @method rot90
     * @chainable
     */
    MatrixView_prototype.rot90 = function (k) {
        var errMsg = this.constructor.name + '.rot90: ';

        // Check arguments
        switch (typeof k) {
        case 'number':
            if (!Tools.isInteger(k)) {
                throw new Error(errMsg + 'Argument must be an integer.');
            }
            k %= 4;
            if (k < 0) {
                k += 4;
            }
            break;
        case 'undefined':
            k = 1;
            break;
        default:
            throw new Error(errMsg + 'Wrong argument type.');
        }

        // Rotate
        switch (k) {
        case 1:
            return this.swapDimensions(0, 1).flipud();
        case 2:
            return this.flipud().fliplr();
        case 3:
            return this.swapDimensions(0, 1).fliplr();
        }
        return this;
    };

    /**
     * Flip matrix dimension.
     *
     * __Also See:__ {@link MatrixView#flipud}, {@link MatrixView#fliplr}.
     *
     * @method flipdim
     *
     * @param {Integer} d Dimension to reverse.
     *
     * @chainable
     */
    MatrixView_prototype.flipdim = function (d) {
        return this.selectDimension(d, [-1, 0]);
    };

    /**
     * Flip matrix left to right.
     *
     * __Also See:__ {@link MatrixView#flipdim}, {@link MatrixView#flipud}.
     *
     * @method fliplr
     *
     * @chainable
     */
    MatrixView_prototype.fliplr = function () {
        return this.select([0, -1], [-1, 0]);
    };

    /**
     * Flip matrix up to down.
     *
     * __Also See:__ {@link MatrixView#flipdim}, {@link MatrixView#fliplr}.
     *
     * @method flipud
     *
     * @chainable
     */
    MatrixView_prototype.flipud = function () {
        return this.select([-1, 0], [0, -1]);
    };

    /**
     * Move the required dimension to first dimension.
     *
     * @method setWorkingDimension
     * @chainable
     * @todo Remove this ugly function.
     * @deprecated do not rely on the existence of this function.
     */
    MatrixView_prototype.setWorkingDimension = function (dim) {
        if (dim >= this.getDimLength()) {
            throw new Error('Invalid dimension.');
        }
        var perm = [];
        var j, je = this.getDimLength();
        for (j = 0; j < je; j++) {
            perm[j] = j;
        }
        perm = perm.splice(dim, 1).concat(perm);

        return this.permute(perm);
    };

})(MatrixView, MatrixView.prototype);
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

/** A Matrix or a ND-Array.
 *
 * This class implements ND-Arrays, i.e. arrays with N dimensions.
 * It is similar to Matlab's Matrix or NumPy's `ndarray`.
 *
 * Lot of vectorial operations are provided:
 *
 *  + element-wise operations, e.g. addition, search.
 *  + matrix operations, e.g. matrix multiplication or inversion.
 *  + array manipulation, e.g. concatenation, transposition.
 *
 *
 * @constructor Creates a Matrix.
 *
 * Unless data are provided, the matrix will be filled with zeros.
 *
 *     A = Matrix([3, 3]);                     // Create a 3x3 matrix
 *     B = Matrix([3, 2, 4], null, true);      // Create a 3x2x4 complex matrix
 *     C = Matrix([4, 2], Uint8Array);         // create a 4x2 matrix of uint8
 *     D = Matrix([4, 2], [4,4,4, 2,2,2]);     // 4x2 matrix, columns are 4s and 2s
 *
 * @param {Array} size
 *  Size (dimensions) of the matrix.
 *
 * @param {String | Function | Array} [arg]
 *  Can be:
 *
 *  + a `String`: the name of the data constructor.
 *  + a `Function`: the constructor of the data.
 *  + an `Array`: the data of the matrix, columnwise.
 *
 * In the latest case, the length of the array must be:
 *
 *  + the product of the values in the `size` argument.
 *  + twice the above number for a complex matrix (argument `iscomplex`).
 *
 * @param {Boolean} [iscomplex=false]
 *  If true, creates a complex matrix.
 *
 * @todo size = N; data = x; import doc. from MatrixView; consistancy of name (isscalar or isScalar)?
 *
 *  + When the size is an integer: create a 1D vector?
 *  + When the data is a scalar: create an array filled with it.
 *  + When the data is an Array of Array: create a 2D array.
 */
function Matrix(size, Type, complex, bool) {
    'use strict';

    //////////////////////////////////////////////////////////////////
    //                      Variables of the Matrix                 //
    //////////////////////////////////////////////////////////////////

    // Default View
    var view;
    // Where values are stored
    var data, real, imag;
    // if Matrix is boolean
    var isBoolean = false;


    //////////////////////////////////////////////////////////////////
    //                     Matrix Initialisation                    //
    //////////////////////////////////////////////////////////////////

    /** See {@link MatrixView#getIndex} @method */
    var getIndex;
    /** See {@link MatrixView#getDimLength} @method */
    var getDimLength;
    /** See {@link MatrixView#getLength} @method */
    var getLength;
    /** See {@link MatrixView#getSize} @method */
    var getSize;
    /** See {@link MatrixView#getIterator} @method */
    var getIterator;

    // Debug function
    var displayView;

    // Set the default View
    var setView = function (s) {
        if (s instanceof Matrix) {
            s = s.getCopy().getData();
        }
        size = Tools.checkSize(s);
        view = new MatrixView(size);

        getIndex = view.getIndex;
        getDimLength = view.getDimLength;
        getLength = view.getLength;
        getSize = view.getSize;
        displayView = view.displayView;
        getIterator = view.getIterator.bind(view);
        this.getIndex = getIndex;
        this.getDimLength = getDimLength;
        this.getLength = getLength;
        this.getSize = getSize;
        this.displayView = displayView;
        this.getIterator = getIterator;

    }.bind(this);

    /** Matrix initialization function
     *
     * @private
     * @todo 
     * - A function to check if an imaginary part exist?
     * - Make this function fully private.
     */
    var initialize = function (s, T, c) {
        setView(s);
        var complex = Tools.isSet(c) ? c : false;
        if (!Tools.isBoolean(complex)) {
            throw new Error('Matrix: "complex" argument must be a boolean');
        }

        // If the type is an Array
        if (Tools.isArrayLike(T)) {
            data = T instanceof Array ? new Matrix.dataType(T) : T;
            Type = T.constructor;
            if (data.length !== view.getLength() * (complex ? 2 : 1)) {
                throw new Error('Matrix: data and size are incompatible.');
            }
            if (complex) {
                real = data.subarray(0, view.getLength());
                imag = data.subarray(view.getLength());
            }

        // The type is a data type
        } else {

            // Deal with the type
            Type = Tools.checkType(T);
            if (typeof T === 'string') {
                switch (T.toLowerCase()) {
                case 'logical':
                case 'bool':
                case 'boolean':
                    isBoolean = true;
                    break;
                default:
                    isBoolean = false;
                }
            }

            // Build the Matrix
            var length = view.getLength();
            if (!complex) {
                data = new Type(length);
            } else {
                data = new Type(2 * length);
                real = data.subarray(0, length);
                imag = data.subarray(length);
            }
        }

        // Set the boolean parameter
        if (Tools.isSet(bool)) {
            if (!Tools.isBoolean(bool)) {
                throw new Error('Matrix: "bool" argument must be a boolean');
            }
            if (bool) {
                isBoolean = true;
            }
        }

        return this;
    }.bind(this);
    this.initialize = initialize;


    //////////////////////////////////////////////////////////////////
    //                    Basic getter functions                    //
    //////////////////////////////////////////////////////////////////

    /** Test whether the matrix has an imaginary part and if it's non-zero.
     *
     * Note: if the matrix has an imaginary part,
     *
     *  + all elements are tested one by one, and
     *  + if they are all zeros, the imaginary part is dropped.
     *
     * @return {Boolean}
     *
     * @todo a function to check if an imaginary part exist?
     */
    var isreal = function () {
        if (!Tools.isSet(imag)) {
            return true;
        }
        var i, ie;
        for (i = 0, ie = imag.length; i < ie; i++) {
            if (imag[i] !== 0) {
                return false;
            }
        }
        data = real;
        real = undefined;
        imag = undefined;
        return true;
    };

    /** Test whether the matrix is a scalar, i.e. has 1 element.
     *
     * @return {Boolean}
     *
     * @todo Matrix.asscalar, returning the scalar or throwing an error
     */
    var isscalar = function () {
        return (getLength() === 1);
    };

    /** Test whether the matrix is empty, i.e. has 0 element.
     *
     * @return {Boolean}
     */
    var isempty = function () {
        return (data.length === 0);
    };

    /** Get or set a value in the matrix from its coordinates.
     *
     * See also:
     *  {@link Matrix#value},
     *  {@link Matrix#getIndex}.
     *
     * @param {Array | Number} coordinates
     *  Coordinate of the value to get/set.
     *
     * @param {Number} [value]
     *  If any, set this value.
     *
     * @return {Number | Array}
     *  The (new) value of the Matrix at the given coordinates.
     *  Complex values are returned as [real, imag].
     */
    var value = function (index, value) {
        index = Tools.isArrayLike(index) ? getIndex(index) : index;
        if (!Tools.isSet(value)) {
            return isreal() ? data[index] : [real[index], imag[index]];
        }
        if (!isreal()) {
            data[index] = value;
        } else {
            real[index] = value[0];
            imag[index] = value[1];
        }
        return value;
    }.bind(this);

    /** Get (a reference to) the underlying data array.
     *
     * See also:
     *  {@link Matrix#getDataScalar},
     *  {@link Matrix#getRealData},
     *  {@link Matrix#getImagData},
     *  {@link Matrix#getView}.
     *
     * @return {Array}
     *  A reference to the array.
     */
    var getData = function () {
        return data;
    };
    /** Return value for real scalar Matrix.
     *
     * See also:
     *  {@link Matrix#getData},
     *  {@link Matrix#getRealData},
     *  {@link Matrix#getImagData},
     *  {@link Matrix#getView}.
     *
     * @return {Number}
     */
    var getDataScalar = function () {
        if (!isreal()) {
            throw new Error("Matrix.getDataScalar: Data must be real.");
        }
        if (getLength() !== 1) {
            throw new Error("Matrix.getDataScalar: Data length must be 1.");
        }
        return data[0];
    };

    /** Get (a reference to) the underlying real data array.
     *
     * This is (a reference to) the first half of the data array.
     *
     * See also
     *  {@link Matrix#getData},
     *  {@link Matrix#getImagData},
     *  {@link Matrix#getView}.
     *
     * @return {Array}
     *  A reference to the array.
     */
    var getRealData = function () {
        if (!Tools.isSet(imag)) {
            throw new Error('Matrix.getRealData: expected a complex Matrix.');
        }
        return real;
    };

    /** Get (a reference to) the underlying imaginary data array.
     *
     * This is (a reference to) the second half of the data array.
     *
     * See also
     *  {@link Matrix#getData},
     *  {@link Matrix#getRealData},
     *  {@link Matrix#getView}.
     *
     * @return {Array}
     *  A reference to the array.
     */
    var getImagData = function () {
        if (!Tools.isSet(imag)) {
            throw new Error('Matrix.getImagData: expected a complex Matrix.');
        }
        return imag;
    };

    /** Add an imaginary part to a real Matrix.
     *
     * @param {Array | Matrix | Number} [imag = 0]
     *  Imaginary part.
     *
     * @chainable
     *
     * @todo allow a number as second argument
     */
    var toComplex = function (imagNew) {
        if (!isreal()) {
            throw new Error('Matrix.toComplex: expected a non-complex Matrix.');
        }

        var dataNew = new data.constructor(data.length * 2);
        real = dataNew.subarray(0, data.length);
        imag = dataNew.subarray(data.length);
        real.set(data);

        if (imagNew instanceof Matrix) {
            Tools.checkSizeEquals(this, imagNew, Matrix.ignoreTrailingDims);
            if (!imagNew.isreal()) {
                throw new Error('Matrix.toComplex: imaginary part cannot be complex.');
            }
            imagNew = imagNew.getData();
        }

        if (Tools.isArrayLike(imagNew)) {
            if (imagNew.length !== data.length) {
                throw new Error('Matrix.toComplex: imaginary part has invalid length.');
            }
            imag.set(imagNew);
        } else if (Tools.isSet(imagNew)) {
            throw new Error('Matrix.toComplex: invalid argument.');
        }

        data = dataNew;
        return this;
    }.bind(this);

    /** Name of the data constructor.
     *
     * @return {String}
     *  Name of the constructor of the data array.
     */
    var getDataType = function () {
        return isBoolean ? 'logical' : data.constructor.name;
    };

    /** Get the default View.
     *
     * @return {MatrixView}
     *  Copy of the View on the Matrix.
     */
    var getView = function () {
        return new MatrixView(view);
    };

    this.value = value;
    this.getData = getData;
    this.getDataScalar = getDataScalar;
    this.getRealData = getRealData;
    this.getImagData = getImagData;
    this.getDataType = getDataType;
    this.getView = getView;
    this.isreal = isreal;
    this.isscalar = isscalar;
    this.isempty = isempty;
    this.toComplex = toComplex;


    //////////////////////////////////////////////////////////////////
    //                      Change the View                         //
    //////////////////////////////////////////////////////////////////

    /** Reshape the Matrix (on place).
     *
     * Change the dimensions of the Matrix while preserving the number of elements.
     * This is similar to Matlab's `reshape` function.
     *
     * Warning: this function updates the Matrix itself, not a copy!
     *
     * @param {Array} size
     *  New size of the Matrix.
     *
     * @chainable
     */
    var reshape = function () {
        var size = Array.prototype.slice.apply(arguments);
        if (Tools.isArrayLike(size[0])) {
            size = size[0];
        }
        if (size.length === 0) {
            size = this.getLength();
        }
        size = Tools.checkSize(size, 'column');
        var i, ie, l = 1;
        for (i = 0, ie = size.length; i < ie; i++) {
            l *= size[i];
        }
        if (l !== this.getLength()) {
            throw new Error('Matrix.reshape: number of elements must not change.');
        }
        setView(size);
        return this;
    }.bind(this);
    this.reshape = reshape;


    //////////////////////////////////////////////////////////////////
    //                        Copy Functions                        //
    //////////////////////////////////////////////////////////////////

    /** Get a copy of the Matrix.
     *
     * All the content of the Matrix is duplicated into a new Matrix.
     *
     * @return {Matrix}
     *  A copy of the Matrix.
     */
    var getCopy = function () {
        var r = !isreal(); // called first to remove a zero imaginary part
        var dataNew = data instanceof Array ? data.slice() : new data.constructor(data);
        return new Matrix(size, dataNew, r, isBoolean);
    };
    this.getCopy = getCopy;

    // Constructor -- perform the initialization
    return initialize(size, Type, complex);
}


//////////////////////////////////////////////////////////////////
//                      Static Values                           //
//////////////////////////////////////////////////////////////////


/** Default data constructor.
 *
 * @cfg {Function}
 */
Matrix.dataType = Float64Array;

/** Ignore trailing dimensions of size 1.
 *
 * Note: setting this option to `false` is more strict; resulting code is portable.
 *
 * @cfg {Boolean}
 */
Matrix.ignoreTrailingDims = true;

if (typeof window === 'undefined') {
    module.exports.Matrix = Matrix;
}
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
var IT;
/** @class Matrix */

(function (Matrix, Matrix_prototype) {
    "use strict";


    //////////////////////////////////////////////////////////////////
    //                   Matrix import/export functions             //
    //////////////////////////////////////////////////////////////////


    /**
     * Convert 2D Matrix to 2D Array for export.
     *
     * __Also see:__
     * {@link Matrix#fromArray}.
     *
     * @return {Number[][]} A 2D Array.
     *
     * @todo Tests.
     */
    Matrix_prototype.toArray = function () {

        var strErr = "Matrix.toArray: function only available for ";
        if (this.ndims() > 2) {
            throw new Error(strErr + "2D matrix.");
        }
        var id;
        if (this.isreal()) {
            id = this.getData();
        } else {
            throw new Error(strErr + "for real matrix.");
        }

        var view = this.getView();
        var fy = view.getFirst(0), dy = view.getStep(0), ly = view.getEnd(0);
        var fx = view.getFirst(1), dx = view.getStep(1), lx = view.getEnd(1);

        var y, ny, x, n, o, xTab;
        for (o = [], y = fy, ny = ly; y !== ny; y += dy) {
            for (xTab = [], x = y + fx, n = y + lx; x !== n; x += dx) {
                xTab.push(id[x]);
            }
            o.push(xTab);
        }
        return o;
    };

    /**
     * Convert 2D Array to Matrix. An Array is considered
     * as a column vector and an Array of Array as a set of
     * column vectors.
     *
     * __Also see:__
     * {@link Matrix#toArray},
     * {@link Matrix#toMatrix}.
     *
     * @param {Number[][]} array Array to convert.
     *
     * @return {Matrix}
     *
     * @todo Check parameters for 1D argument.
     */
    Matrix.fromArray = function (a) {
        var size, data;
        if (a[0].length) {
            if (a[0][0].length) {
                throw new Error("Matrix.fromArray: Only work with Array up to 2 dimensions.");
            }
            size = [a[0].length, a.length];
            data = [];
            var i, ei;
            for (i = 0, ei = a.length; i < ei; i++) {
                var subtab = Array.prototype.slice.apply(a[i]);
                data = data.concat(subtab);
            }
        } else {
            size = a.length;
            data = a;
        }
        return new Matrix(size, data);
    };

    /** Convert 2D Matrix to formated string such like coma
     * separated values (CSV) strings.
     *
     * __Also see:__
     * {@link Matrix#dlmread}.
     *
     * @param {String} [delim='\n']  column delimiters.
     *
     * @return {String} A string.
     *
     * @matlike
     */
    Matrix_prototype.dlmwrite = function (d) {

        if (d !== undefined && typeof d !== "string") {
            throw new Error("Matrix.dlmread: Wrong delimiter specification.");
        }
        if (this.ndims() > 2) {
            throw new Error("Matrix.dlmwrite: function only available for 2D matrix.");
        }

        var view = this.getView(), td = this.getData();
        var dn = view.getStep(1), ln = view.getEnd(1);
        var m = view.getSize(0);
        var i, ij, ei, eij;

        var str = '';
        for (i = 0, ei = m; i < ei; i++) {
            for (ij = i, eij = i + ln - dn; ij < eij; ij += dn) {
                str += td[ij] + d;
            }
            str += td[ij] + "\n";
        }

        return str;
    };

    /**
     * Convert string with values delimited by characters
     * to Matrix.
     *
     * __Also see:__
     * {@link Matrix#dlmwrite}.
     *
     * @param {String} [delim] Column delimiters.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.dlmread = function (csv, d) {

        if (d !== undefined && typeof d !== "string") {
            throw new Error("Matrix.dlmread: Wrong delimiter specification.");
        }
        csv = csv.split("\n");
        if (csv[csv.length - 1] === "") {
            csv.pop();
        }
        var i, ei, j, ej;
        var output = [];
        var reg = /[\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?/g;
        for (i = 0, ei = csv.length; i < ei; i++) {
            var row = d ? csv[i].split(d) : csv[i].match(reg);
            for (j = 0, ej = row.length; j < ej; j++) {
                row[j] = parseFloat(row[j]);
            }
            output.push(row);
        }
        return Matrix.fromArray(output).transpose();
    };

    /**
     * Convert 2D Matrix to a string for copy/paste into Matlab.
     *
     * @return {String} A string.
     */
    Matrix_prototype.toMatlab = function () {

        if (this.ndims() > 2) {
            throw new Error("Matrix.toMatlab: function available only for 2D matrix.");
        }

        var pad = function (real, imag) {
            var str = real.toString();
            if (typeof imag === 'number') {
                str += imag > 0 ? ' + ' : ' - ';
                str += Math.abs(imag).toString();
                str += ' * i';
            }
            return str;
        };

        var o = '', id, ird, iid;
        if (this.isreal()) {
            id = this.getData();
        } else {
            ird = this.getRealData();
            iid = this.getImagData();
        }
        var view = this.getView();
        var fy = view.getFirst(0), dy = view.getStep(0), ly = view.getEnd(0);
        var fx = view.getFirst(1), dx = view.getStep(1), lx = view.getEnd(1);

        var y, ny, x, n;
        o += '[';
        for (y = fy, ny = ly; y !== ny; y += dy) {
            if (y !== fy) {
                o += ' ';
            }
            if (this.isreal()) {
                for (x = y + fx, n = y + lx; x !== n; x += dx) {
                    o += pad(id[x]);
                    if (x !== n - dx) {
                        o += ',';
                    }
                }
            } else {
                for (x = y + fx, n = y + lx; x !== n; x += dx) {
                    o += pad(ird[x], iid[x]);
                    if (x !== n - dx) {
                        o += ',';
                    }
                }
            }
            if (y !== ny - dy) {
                o += ';';
            }
        }
        o += ']';
        return o;
    };

    /**
     * Convert Matrix to string for display purposes.
     *
     * @param {Number} [precision=4] Precision used to display the Matrix.
     *
     * @param {String} [name] Name of the Matrix.
     *
     * @return {String} A string.
     *
     * @fixme There is some bugs when displaying complex Matrix.
     */
    Matrix_prototype.toString = function (arg1, arg2) {

        var precision, name = '';
        if (arg1 === undefined) {
            precision = 4;
        } else if (typeof arg1 === 'string') {
            name = arg1;
            precision = 4;
        } else {
            precision = arg1;
        }
        if (typeof arg2 === 'string') {
            name = arg2;
        }

        var length = precision + 5;
        var pad = function (real, imag) {
            var str = '';
            if (typeof real === 'number') {
                if (real % 1 === 0) {
                    str += real;
                } else {
                    str += real.toFixed(precision);
                }
                while (str.length < length) {
                    str = ' ' + str;
                }
            } else {
                str += real.toString();
            }

            if (imag === undefined) {
                return str;
            }
            if (imag === 0) {
                while (str.length < 2 * length + 1) {
                    str = str + ' ';
                }
                return str;
            }
            if (typeof imag === 'number') {
                str += imag > 0 ? ' + ' : ' - ';
                if (real % 1 === 0) {
                    str += Math.abs(imag);
                } else {
                    str += Math.abs(imag).toFixed(precision);
                }
                while (str.length < length) {
                    str = ' ' + str;
                }
            } else {
                str += imag.toString();
            }
            str += 'i';
            return str;
        };
        var i, ie, o = '', s;
        if (this.isempty()) {
            o += 'Empty array: ';
            s = this.getSize();
            for (i = 0, ie = s.length - 1; i < ie; i++) {
                o += s[i] + '-by-';
            }
            o += s[i];
            return o;
        }

        if (this.getLength() > 10000) {
            o += 'Array: ';
            s = this.getSize();
            for (i = 0, ie = s.length - 1; i < ie; i++) {
                o += s[i] + '-by-';
            }
            o += s[i];
            return o;
        }

        var id, ird, iid;
        if (this.isreal()) {
            id = this.getData();
        } else {
            ird = this.getRealData();
            iid = this.getImagData();
        }

        var iterator = this.getIterator(2);
        var it = iterator.iterator, b  = iterator.begin, e = iterator.isEnd;
        var z = this.getSize(2);
        var view = this.getView();
        var fy = view.getFirst(0), dy = view.getStep(0), ly = view.getEnd(0);
        var fx = view.getFirst(1), dx = view.getStep(1), lx = view.getEnd(1);

        var y, ny, x, n;
        for (i = b(); !e(); i = it()) {
            o += name;
            if (z > 1) {
                o += '(:,:,' + iterator.getPosition() + ') = [\n';
            } else {
                o += ' = [\n';
            }
            for (y = i + fy, ny = i + ly; y !== ny; y += dy) {
                o += '\t';
                if (this.isreal()) {
                    for (x = y + fx, n = y + lx; x !== n; x += dx) {
                        o += pad(id[x]) + ' ';
                    }
                } else {
                    for (x = y + fx, n = y + lx; x !== n; x += dx) {
                        o += pad(ird[x], iid[x]) + ' ';
                    }
                }
                o += '\n';
            }
            o += ']\n';
        }

        return o;
    };

    /** Cast data to Matrix. An Array is considered
     * as a column vector and an Array of Array as a set of
     * column vectors.
     *
     * If the input is a `Matrix` then it will be returned unchanged
     *
     * @param {Number|Number[]|Matrix} data
     *  Data to convert
     *
     * @return {Matrix}
     *
     * @fixme
     *  A lot of time can be spent in this function. It should improved by 
     *  avoiding the type checking for typedArray
     */
    Matrix.toMatrix = function (data) {
        if (data instanceof Matrix) {
            return data;
        }
        if (data.constructor === Number) {
            data = [data];
        }
        var d = Array.prototype.concat.apply([], data);

        if (!Tools.isArrayOfNumbers(d)) {
            throw new Error('Matrix.toMatrix: Array must only contain Number.');
        }
        if (d.length === 1) {
            return new Matrix(1, d);
        }
        if (d.length === data.length) {
            return new Matrix([d.length, 1], d);
        }
        var size = [], t = data;
        while (t.length) {
            size.push(t.length);
            t = t[0];
        }
        return new Matrix(size.reverse(), d);
    };


    //////////////////////////////////////////////////////////////////
    //                   Matrix display functions                   //
    //////////////////////////////////////////////////////////////////


    /** Display the matrix in the console.
     *
     * @param {Number} precision
     *
     * @param {String} str
     *  String describing the content of the matrix.
     *  Used for display purpose
     *
     * @chainable
     */
    Matrix_prototype.display = function (arg1, arg2) {
        console.log(this.toString(arg1, arg2));
        return this;
    };

})(Matrix, Matrix.prototype);
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

/** @class Matrix */

(function (Matrix, Matrix_prototype) {
    "use strict";


    //////////////////////////////////////////////////////////////////
    //          Primitives Extraction/Insertion Functions           //
    //////////////////////////////////////////////////////////////////


    /** Extracts a view to a new Matrix.
     *
     * @return {Matrix}
     *
     * @private
     */
    Matrix_prototype.extractViewFrom = function (v) {
        if (this.isreal()) {
            var data = this.getData();
            return new Matrix(v.getSize(), v.extractFrom(data));
        }
        var out = new Matrix(v.getSize(), this.getDataType(), true);
        v.extractFrom(this.getRealData(), out.getRealData());
        v.extractFrom(this.getImagData(), out.getImagData());
        return out;
    };

    /** Extracts Matrix data to a given matrix with a specified view.
     *
     * @return {Matrix}
     *
     * @private
     */
    Matrix_prototype.extractViewTo = function (v, mat) {
        if (this.isreal() && mat.isreal()) {
            v.extractTo(this.getData(), mat.getData());
            return mat;
        }
        if (this.isreal() || mat.isreal()) {
            this.toComplex();
        }
        v.extractTo(this.getRealData(), mat.getRealData());
        v.extractTo(this.getImagData(), mat.getImagData());
        return mat;
    };

    var arrayToBoolean = function (array) {
        array = Array.prototype.slice.apply(array);
        var i, ei;
        for (i = 0, ei = array.length; i < ei; i++) {
            array[i] = array[i] ? true : false;
        }
        return array;
    };

    /** Apply a selection on the view given different arguments.
     *
     * @param {Matrix} selection
     *
     *  1. There is only one ND-Matrix containing either:
     *    a) `Booleans`: select all the correpondings indices,
     *    b) `Integers`: select the indices corresponding to the the integers.
     *  2. There is one or more 1D Matrix containing either:
     *    a) `Booleans`: select all the correpondings indices,
     *    b) `Integers`: select the indices corresponding to
     *                   the integer.
     *
     * @return {MatrixView}
     *
     * @private
     *
     * @fixme
     *  There is a bug with the case 1.b) when the Matrix containing the
     *  indices does not have the same size as the matrix containing the
     *  values. It should work if the indices are valid. The solution may be
     *  not obvious.
     * @fixme
     *  Due to time spent in checking arguments the resulting function si 
     *  very slow this should be reduce using the type of the array to check 
     *  if values are integer or not.
     */
    Matrix_prototype.selectView = function (args) {
        args = Array.prototype.slice.apply(args);
        var T = Tools, check = T.checkSizeEquals, td = Matrix.ignoreTrailingDims;

        var arg = args[0];
        var i, ei;

        // Global selection
        if (arg instanceof Matrix && args.length === 1) {
            var data = arg.getData();
            var v = new MatrixView([this.getLength(), 1]);

            // Boolean selection
            if (arg.islogical() && check(this.getSize(), arg.getSize(), td)) {
                return v.selectBooleanDimension(0, data);
                // Indices selection
            } else if (T.isArrayOfNumbers(data, 0, this.numel(0) - 1)) {
                return v.selectIndicesDimension(0, data);
            }
            throw new Error("Matrix.selectView: Invalid Matrix selection.");
        }

        // Dimension selection
        for (i = 0, ei = args.length; i < ei; i++) {
            arg = args[i];
            if (arg instanceof Matrix) {
                if (arg.isvector()) {
                    if (arg.islogical()) {
                        arg = arrayToBoolean(arg.getData());
                    } else {
                        arg = [arg.getData()];
                    }
                } else {
                    throw new Error("Matrix.selectView: Invalid Matrix selection:", arg);
                }
            }
            args[i] = arg;
        }

        return MatrixView.prototype.select.apply(this.getView(), args);
    };

    
    /** Allow to select an subpart of the Matrix for each dimension
     * if no arguments is provided then it will return a new vector
     * with all the elements one after the others.
     * It acts like matlab colon operator.
     *
     * @param {Integer[]} [select]
     *  For each dimension, can be an array-like formated as:
     *
     *  - `[startValue]`
     *  - `[startValue, endValue]`
     *  - `[startValue, step, endValue]`
     *
     * @return {Matrix}
     *  Returns a new Matrix with containing selected values.
     *
     * @fixme when only one number is provided, should the function consider this
     * number as an indice and return the corresponding value ?
     */
    Matrix_prototype.select = function () {
        if (arguments.length === 0) {
            return this.getCopy().reshape(this.getLength());
        }
        var view = this.selectView(arguments);
        if (arguments.length === 1 && arguments[0] instanceof Matrix) {
            if (view.getLength() === arguments[0].getLength()) {
                return this.extractViewFrom(view).reshape(arguments[0].getSize());
            }
            return this.extractViewFrom(view);
        }
        return this.extractViewFrom(view);
    };

    /** Return a copy of the Matrix with modified values according to the
     * input arguments.
     *
     * @return {Matrix}
     *
     * @fixme This function does not look very clean.
     */
    Matrix_prototype.set = function () {
        var sel = Array.prototype.slice.apply(arguments);
        var val = Matrix.toMatrix(sel.pop());
        var view = this.selectView(sel);
        if (sel.length === 1 && sel[0] instanceof Matrix) {
            var valSize = val.getSize(), selSize = sel[0].getSize();
            var out = val.reshape().extractViewTo(view, this.getCopy().reshape());
            out = out.reshape(selSize);
            val.reshape(valSize);
            return out;
        }

        return val.extractViewTo(view, this.getCopy());
    };


    //////////////////////////////////////////////////////////////////
    //                      Matrix Manipulation                     //
    //////////////////////////////////////////////////////////////////


    /** Repeat the matrix along multiple dimensions.
     * Matlib-like function repmat.
     *
     * @param {Integer[]} select
     *  For each dimension, specify the number of repetition
     *
     * @return {Matrix} new Matrix.
     *
     * @matlike
     * @todo Create a tag Matlab-like and a tag also see.
     */
    Matrix_prototype.repmat = function () {
        // Check paramters
        var size = Tools.checkSize(arguments, 'square');

        // Input iterator
        var i, iv = this.getView();

        // Output size computation
        var iSize = this.size();
        var ie, length = 1, sizeOut = [];
        for (i = 0, ie = Math.max(iSize.length, size.length); i < ie; i++) {
            sizeOut[i] = (iSize[i] || 1) * (size[i] || 1);
            length *= sizeOut[i];
        }

        // Output matrix, view and data
        var om = new Matrix(sizeOut, this.getDataType(), !this.isreal());
        var ov = om.getView();

        // Input and output data
        var ird, iid, ord, oid;
        if (this.isreal()) {
            ord = om.getData();
            ird = this.getData();
        } else {
            ord = om.getRealData();
            oid = om.getImagData();
            ird = this.getRealData();
            iid = this.getImagData();
        }

        // Output coarse view arrangement
        for (i = 0, ie = iSize.length; i < ie; i++) {
            ov.selectDimension(i, [0, iSize[i], -1]);
        }

        // Output coarse iterator
        var iter = ov.getIterator(0);
        var io, ito = iter.iterator, bo = iter.begin, eo = iter.isEnd;
        for (io = bo(); !eo(); io = ito()) {
            // Ouput subiterator
            var sov = om.getView(), pos = iter.getPosition();
            // Output fine view arrangement
            for (i = 0, ie = size.length; i < ie; i++) {
                var sTmp = iSize[i] || 1, tmp = pos[i] * sTmp;
                sov.selectDimension(i, [tmp, 1, tmp + sTmp - 1]);
            }
            // Copy to output
            iv.extract(ird, sov, ord);
            if (!this.isreal()) {
                iv.extract(iid, sov, oid);
            }
        }

        return om;
    };

    /** Permutes the order of dimension.
     *
     * __Also see:__
     *  {@link Matrix#ipermute}.
     *
     * @param {Array} dimensionOrder
     *  Defines the order in which
     *  the dimensions are traversed.
     *
     * @return {Matrix} new Matrix with permuted dimensions.
     *
     * @matlike
     */
    Matrix_prototype.permute = function (dim) {
        var v = this.getView().permute(dim);
        return this.extractViewFrom(v);
    };

    /** Inverse dimension permutation.
     *
     * @method ipermute
     *  {@link Matrix#permute}.
     *
     * @param {Integer[]} k
     *  Dim order to inverse.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.ipermute = function (dim) {
        var v = this.getView().ipermute(dim);
        return this.extractViewFrom(v);
    };

    /** Inverse the scan order of two dimension.
     *
     * @param {Integer} [n=undefined]
     *  Shift argument :
     *
     *  + If n is undefined then remove all first singleton dimensions.
     *  + if n > 0 shift the n first dimension to the end.
     *  + if n < 0 then insert n singleton dimension at the start.
     *
     * @return {Array}
     *  Array containing:
     *
     *  - The new matrix,
     *  - the number of shift done.
     *
     * @todo Check this function.
     *
     * @matlike
     */
    Matrix_prototype.shiftdim = function (n) {
        var v = this.getView();
        n = v.shiftDimension(n);
        return [this.extractViewFrom(v), n];
    };

    /** Rotates Matrix counterclockwise by a multiple of 90 degrees.
     *
     * @param {Integer} k
     *  Defines the number 90 degrees rotation.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.rot90 = function (k) {
        var v = this.getView().rot90(k);
        return this.extractViewFrom(v);
    };

    /** Flip matrix along a specific dimension.
     *
     * __Also see:__
     * {@link Matrix#fliplr},
     * {@link Matrix#flipud}.
     *
     * @param {Integer} dimension
     *  Dimension to flip.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.flipdim = function (d) {
        var v = this.getView().selectDimension(d, [-1, 0]);
        return this.extractViewFrom(v);
    };

    /** Flip matrix left to right.
     *
     * __Also see:__
     * {@link Matrix#flipdim},
     * {@link Matrix#flipud}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.fliplr = function () {
        return this.flipdim(1);
    };

    /** Flip matrix up to down.
     *
     * __Also see:__
     * {@link Matrix#fliplr},
     * {@link Matrix#flipdim}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.flipud = function () {
        return this.flipdim(0);
    };

    /** Concatenate differents Matrix along a given dimension.
     *
     * @param {Integer} dimension
     *  The dimension on which the matrix must be concatenate.
     *
     * @param {Matrix} m
     *  A list of matrix to concatenate. All dimension should be equals
     *  except the one corresponding to the parameter `dimension`.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.cat = function () {
        var dim = arguments[0];

        // Ouptut Size
        var outputSize = this.getSize();
        if (outputSize[dim] === undefined) {
            outputSize[dim] = 1;
        }

        var i;
        for (i = 1; i < arguments.length; i++) {
            outputSize[dim] += arguments[i].getSize(dim);
        }

        // Output matrix
        var O = new Matrix(outputSize);
        var v = O.getView();

        // Copy first Matrix
        var start = this.getSize(dim) - 1;
        v.selectDimension(dim, [0, start]);
        this.extractViewTo(v, O);
        v.restore();

        // Copy others matrix
        for (i = 1; i < arguments.length; i++) {
            v.selectDimension(dim, [start + 1, start += arguments[i].getSize(dim)]);
            arguments[i].extractViewTo(v, O);
            v.restore();
        }
        return O;
    };

})(Matrix, Matrix.prototype);
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

/** @class Matrix */

(function (Matrix, Matrix_prototype) {
    "use strict";

    /** Returns the number of elements.
     *
     * __Also see:__
     *  {@link MatrixView#getLength}.
     *
     * @return {Integer}
     *  The number of elements in the matrix.
     *
     * @matlike
     */
    Matrix_prototype.numel = function () {
        return this.getLength();
    };

    /** Returns the number of dimensions of the Matrix.
     *
     * __Also see:__
     *  {@link MatrixView#getDimLength}.
     *
     * @return {Integer}
     *  The number of dimension of the matrix.
     *
     * @matlike
     */
    Matrix_prototype.ndims = function () {
        return this.getDimLength();
    };

    /** Returns the number of elements along one or all dimensions.
     *
     * @param {Integer} [dim=undefined]
     *  The dimension.
     *
     * @return {Integer[] | Integer}
     *  If dim is:
     *
     * + `undefined`: then returns an array with the number of elements
     *    on each dimension,
     * + `Integer` The number of elements for the required dimension.
     *
     * @matlike
     */
    Matrix_prototype.size = function (d) {
        switch (typeof d) {
        case 'number':
            if (!Tools.isInteger(d, 0)) {
                throw new Error('Matrix.size: invalid argument.');
            }
            return this.getSize(d) || 1;
        case 'undefined':
            return this.getSize();
        default:
            throw new Error('Matrix.size: Wrong argument type.');
        }
    };

    /** Returns the data numerical class in a Matlab-like style.
     * This function is an alias for the Matlab function `class`.
     *
     * @return {String}
     *  Returns the numerical class of Matrix data.
     */
    Matrix_prototype.type = function () {
        switch (this.getDataType().toLowerCase()) {
        case 'boolean':
        case 'logical':
            return 'logical';

        case 'array':
        case 'float64array':
            return 'double';
        case 'float32array':
            return 'single';

        case 'int32array':
            return 'int32';
        case 'uint32array':
            return 'uint32';

        case 'int16array':
            return 'int16';
        case 'uint16array':
            return 'uint16';

        case 'int8array':
            return 'int8';
        case 'uint8clampedarray':
            return 'uint8c';
        case 'uint8array':
            return 'uint8';
        default:
            return new Error('Matrix.type: Unknown data type.');
        }
    };

    /** Returns true if Matrix is a row vector and false otherwise.
     *
     * __Also see:__
     *  {@link Matrix#iscolumn},
     *  {@link Matrix#isvector},
     *  {@link Matrix#ismatrix}.
     *
     * @return {Boolean}
     *
     * @matlike
     */
    Matrix_prototype.isrow = function () {
        var size = this.size();
        return (size.length === 2 && size[0] === 1);
    };

    /** Returns true if the Matrix is a column vector and false otherwise.
     *
     * __Also see:__
     *  {@link Matrix#isrow},
     *  {@link Matrix#isvector},
     *  {@link Matrix#ismatrix}.
     *
     * @return {Boolean}
     *
     * @matlike
     */
    Matrix_prototype.iscolumn = function () {
        var size = this.size();
        return (size.length === 2 && size[1] === 1);
    };

    /** Returns true if Matrix is either a column or a row vector.
     *
     * __Also see:__
     *  {@link Matrix#isrow},
     *  {@link Matrix#iscolumn},
     *  {@link Matrix#ismatrix}.
     *
     * @return {Boolean}
     *
     * @matlike
     */
    Matrix_prototype.isvector = function () {
        var size = this.size();
        return (size.length === 2 && (size[1] === 1 || size[0] === 1));
    };

    /** Returns true if Matrix is a vector or a 2D array.
     *
     * __Also see:__
     *  {@link Matrix#isrow},
     * {@link Matrix#iscolumn}
     *  {@link Matrix#isvector}.
     *
     * @return {Boolean}
     *
     * @matlike
     */
    Matrix_prototype.ismatrix = function () {
        return this.getSize().length <= 2;
    };

    /** Returns true if Matrix is square matrix array.
     *
     * __Also see:__ {@link Matrix#ismatrix}.
     *
     * @method issquare
     *
     * @return {Boolean} true or false depending on the Matrix shape.
     *
     * @matlike
     */
    Matrix_prototype.issquare = function () {
        if (this.getSize(0) !== this.getSize(1)) {
            throw false;
        }
        return true;
    };

    /** Determines whether the input is floating-point array.
     *
     * __Also see:__ {@link Matrix#isfloat}.
     *
     * @return {Boolean}
     *
     * @matlike
     */
    Matrix_prototype.isinteger = function () {
        switch (this.getDataType().toLowerCase()) {
        case 'uint8array':
        case 'uint8clampedarray':
        case 'uint16array':
        case 'uint32array':
        case 'int8array':
        case 'int16array':
        case 'int32array':
            return true;
        default:
            return false;
        }
    };

    /** Determines whether the input is floating-point array.
     *
     * __Also see:__
     *  {@link Matrix#isfloat}.
     *
     * @return {Boolean}
     *
     * @matlike
     */
    Matrix_prototype.isfloat = function () {
        switch (this.getDataType().toLowerCase()) {
        case 'float32array':
        case 'float64array':
            return true;
        default:
            return false;
        }
    };

    /** Determines whether the input is floating-point array.
     *
     * __Also see:__
     *  {@link Matrix#isfloat}.
     *
     * @return {Boolean}
     *
     * @matlike
     */
    Matrix_prototype.islogical = function () {
        var t = this.getDataType().toLowerCase();
        if (t === 'logical' || t === 'boolean' || t === 'bool') {
            return true;
        }
        return false;
    };

    /** Returns minimum value given an integer type.
     *
     * __Also see:__
     *  {@link Matrix#intmax},
     *  {@link Matrix#realmin},
     *  {@link Matrix#realmax}.
     *
     * @param {String} type
     *  Value type.
     *
     * @return {Integer}
     *
     * @matlike
     */
    Matrix.intmin = function (type) {
        switch (type) {
        case 'uint8c':
        case 'uint8':
        case 'uint16':
        case 'uint32':
            return 0;
        case 'int8':
            return -128;
        case 'int16':
            return -32768;
        case 'int32':
            return -2147483648;
        default:
            throw new Error('Matrix.intmin: Unknown data type.');
        }
    };

    /** Returns maximum value for an integer type.
     *
     * __Also see:__
     *  {@link Matrix#intmin},
     *  {@link Matrix#realmin},
     *  {@link Matrix#realmax}.
     *
     * @param {String} type
     *  Value type.
     *
     * @return {Integer}
     *
     * @matlike
     */
    Matrix.intmax = function (type) {
        switch (type) {
        case 'int8':
            return 127;
        case 'uint8c':
        case 'uint8':
            return 255;
        case 'int16':
            return 32767;
        case 'uint16':
            return 65535;
        case 'int32':
            return 2147483647;
        case 'uint32':
            return 4294967295;
        default:
            throw new Error('Matrix.intmax: Unknown data type.');
        }
    };

    /** Returns minimum value for a floating type.
     *
     * __Also See:__
     *  {@link Matrix#intmin},
     *  {@link Matrix#intmax},
     *  {@link Matrix#realmax}.
     *
     * @param {String} [type='double']
     *  Value type.
     *
     * @return {Number}
     *
     * @matlike
     */
    Matrix.realmin = function (type) {
        switch (type) {
        case undefined:
        case 'double':
            return Number.MIN_VALUE;
        case 'single':
            return 1.1755e-38;
        default:
            throw new Error('Matrix.realmin: Unknown data type.');
        }
    };

    /** Returns maximum value for a floating type.
     *
     * __Also see:__
     *  {@link Matrix#intmin},
     *  {@link Matrix#intmax},
     *  {@link Matrix#realmin}.
     *
     * @param {String} [type='double']
     *  Value type.
     *
     * @return {Integer}
     *
     * @matlike
     */
    Matrix.realmax = function (type) {
        switch (type) {
        case undefined:
        case 'double':
            return Number.MAX_VALUE;
        case 'single':
            return 3.4028e+38;
        default:
            throw new Error('Matrix.realmin: Unknown data type.');
        }
    };

})(Matrix, Matrix.prototype);
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
 * This module provides basic Matrix constructor interface
 * such as `rand`, 'randi', 'eye', 'zeros', 'ones', etc.
 * to build Matrix in matlab-like way.
 */

/** @class Matrix */

(function (Matrix, Matrix_prototype) {
    "use strict";

    // Check if nodejs or browser
    var isNode = (typeof module !== 'undefined' && module.exports) ? true : false;
    var fs, Canvas, newImage;
    if (isNode) {
        fs = require("fs");
        // Do not forget: export NODE_PATH=/usr/local/lib/node_modules
        Canvas = require("canvas");
        newImage = Canvas.Image;
    } else {
        newImage = Image;
    }

    var createCanvas = function (width, height) {
        var canvas;
        if (isNode) {
            canvas = new Canvas();
        } else {
            canvas = document.createElement("canvas");
        }
        canvas.width = width || 0;
        canvas.height = height || 0;
        return canvas;
    };

    /** Creates a row vector filled ordered values.
     * Actually it acts like Matlab colon (:) operator.
     *
     * __Also see:__
     *  {@link Matrix#linspace}.
     *
     * @param {Array} colon
     *  Colon array can have 2, or 3 parameters:
     *
     *  - the first value indicates the first value of the output vector,
     *  - if there is two parameters, then they designate respectively
     *  - the first and the last value of the output vector (the step between
     *    two values is -1 or +1,
     *  - If there is three parameters, then they indicate respectively
     *    the first, the step and the last values.
     *
     * @param {String} [type=Matrix.dataType]
     *  Defined the numerical class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.colon = function () {
        var col = Tools.checkColon(arguments);

        var first = col[0], step = col[1], last = col[2];

        // Special cases
        if (!isFinite(first) || !isFinite(step) || !isFinite(last)) {
            throw new Error("Parameters are invalid number (Infitity or NaN).");
        }

        // Minimum difference between 2 double precision values
        var eps = 2.2204e-16;
        // Tolerance value
        var tol = 2.0 * eps * Math.max(Math.abs(first), Math.abs(last));
        // Step sign
        var stepSign = step > 0 ? 1 : -1;

        // Determine interval number
        var n;
        var isInteger = Tools.isInteger;

        if (isInteger(first) && step === 1) {
            // Consecutive integers.
            n = Math.floor(last) - first;
        } else if (isInteger(first) && isInteger(step)) {
            // Integers with spacing > 1.
            var q = Math.floor(first / step);
            var r = first - q * step;
            n = Math.floor((last - r) / step) - q;
        } else {
            // General case.
            n =  Math.round((last - first) / step);
            if (stepSign * (first + n * step - last) > tol) {
                n = n - 1;
            }
        }

        var right = first + n * step;
        if (stepSign * (right - last) > -tol) {
            right = last;
        }
        var out = new Matrix(n + 1);
        var dOut = out.getData();
        var x, k = Math.floor(n / 2) + 1;
        var v1 = first, v2 = right;
        for (x = 0; x < k; x++, v1 += step, v2 -= step) {
            dOut[x]     = v1;
            dOut[n - x] = v2;
        }

        if (n % 2 === 0) {
            dOut[n / 2] = (first + right) / 2;
        }

        return out;
    };

    /** Creates a column vector filled with linealy spaced values.
     * It acts similarly to the colon operator, but with a control on
     * the number of values.
     *
     * __Also see:__
     *  {@link Matrix#colon}.
     *
     * @param {Integer[]} size
     * A sequence of integers indicating the size of the output matrix.
     *
     * @param {String} [type=Matrix.dataType]
     * Defined the numerical class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.linspace = function (min, max, bins) {
        if (!Tools.isNumber(min)) {
            throw new Error();
        }
        if (!Tools.isNumber(max)) {
            throw new Error();
        }
        if (bins === undefined) {
            bins = 100;
        } else if (!Tools.isInteger(bins, 1)) {
            throw new Error("Matrix.linspace: Bins shoulb be an integer > 1.");
        }

        var binsm1 = bins - 1;
        return Matrix.colon(min, (max - min) / binsm1, max);
    };

    /** Creates a Matrix filled with zeros.
     *
     * __Also see:__
     *  {@link Matrix#ones}.
     *
     * @param {Integer[]} size
     * A sequence of integers indicating the size of the output matrix.
     *
     * @param {String} [type=Matrix.dataType]
     * Defined the numerical class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.zeros = function () {
        var size, type;

        // Get type;
        if (typeof arguments[arguments.length - 1] === 'string') {
            type = Array.prototype.pop.apply(arguments);
        }

        // Check size
        size = Tools.checkSize(arguments, 'square');

        return new Matrix(size, type);
    };

    /** Creates a Matrix filled with ones.
     * Actually it acts like Matlab ones constructor.
     *
     * __Also see:__
     *  {@link Matrix#zeros}.
     *
     * @param {Integer[]} size A sequence of integers indicating
     * the size of the output matrix.
     *
     * @param {String} [type=Matrix.dataType] Defined the numerical
     * class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.ones = function () {
        var type;
        // Get type;
        if (typeof arguments[arguments.length - 1] === 'string') {
            type = Array.prototype.pop.apply(arguments);
        }

        // Check size
        var size = Tools.checkSize(arguments, 'square');

        var mat = new Matrix(size, type), data = mat.getData();
        var i, ie;
        for (i = 0, ie = data.length; i < ie; ++i) {
            data[i] = 1;
        }

        return mat;
    };

    /** Creates a Matrix filled with random walues uniformely
     * distributed in range [0, 1].
     *
     * __Also see:__
     *  {@link Matrix#randn},
     *  {@link Matrix#randi}.
     *
     * @param {Integer[]} size
     *  A sequence of integers indicating the size of the
     *  output matrix.
     *
     * @param {String} [type=Matrix.dataType]
     *  Defined the numerical class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.rand = function () {
        var size, type;
        // Get type;
        if (typeof arguments[arguments.length - 1] === 'string') {
            type = Array.prototype.pop.apply(arguments);
        }

        // Check size
        size = Tools.checkSize(arguments, 'square');
        var mat = new Matrix(size, type), data = mat.getData();
        var i, ie, random = Math.random;
        for (i = 0, ie = data.length; i < ie; ++i) {
            data[i] = random();
        }
        return mat;
    };

    /** Creates a Matrix filled with random walues following
     * the gaussian low of parameters (0, 1).
     *
     * __Also see:__
     *  {@link Matrix#rand},
     *  {@link Matrix#randi}.
     *
     * @param {Integer[]} size
     *  A sequence of integers indicating the size of the
     *  output matrix.
     *
     * @param {String} [type=Matrix.dataType]
     *  Defined the numerical class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.randn = function () {
        var size, type;
        // Get type;
        if (typeof arguments[arguments.length - 1] === 'string') {
            type = Array.prototype.pop.apply(arguments);
        }

        // Check size
        size = Tools.checkSize(arguments, 'square');
        var mat = new Matrix(size, type), data = mat.getData();
        var i, ie;
        var rand = Math.random, PI2 = Math.PI * 2;
        var sqrt = Math.sqrt, sin = Math.sin, log = Math.log;
        for (i = 0, ie = data.length; i < ie; ++i) {
            var t = PI2 * rand();
            var r = sqrt(-2 * log(1 - rand()));
            data[i] = r * sin(t);
        }

        return mat;
    };

    /** Creates a Matrix filled with random walues uniformely distributed
     * in a specified range.
     *
     * __Also see:__
     *  {@link Matrix#rand},
     *  {@link Matrix#randi}.
     *
     * @param {Integer|Integer[]} range
     *  Can be :
     *
     *  - An integer greater than 1, then the range for radom values will
     *    be [0, range],
     *  - An array-like of length 2, then the range for radom values will
     *    be [range[0], range[1]],
     *
     * @param {Integer[]} size
     *  A sequence of integers indicating the size of the output matrix.
     *
     * @param {String} [type=Matrix.dataType]
     * Defined the numerical class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.randi = function () {
        var range, size, type;

        // Check range
        range = Array.prototype.shift.apply(arguments);
        range = Tools.checkRange(range);

        // Get type
        if (typeof arguments[arguments.length - 1] === 'string') {
            type = Array.prototype.pop.apply(arguments);
        }

        // Check size
        size = (arguments.length === 0) ? [1] : arguments;
        size = Tools.checkSize(size, 'square');

        var mat = new Matrix(size, type), data = mat.getData();
        var i, ie, min = range[0], c = range[1] - min + 1;
        var random = Math.random, floor = Math.floor;
        for (i = 0, ie = data.length; i < ie; ++i) {
            data[i] = floor(random() * c) + min;
        }
        return mat;
    };

    /** Creates a Matrix with ones the main diagonal.
     *
     * __Also see:__
     * {@link Matrix#zeros},
     * {@link Matrix#ones}.
     *
     * @param {Integer[]} size
     * A sequence of integers indicating the size of the output matrix.
     *
     * @param {String} [type=Matrix.dataType]
     * Defined the numerical class of data.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.eye = function () {
        var size, type;

        // Get type;
        if (typeof arguments[arguments.length - 1] === 'string') {
            type = Array.prototype.pop.apply(arguments);
        }

        // Check size
        size = Tools.checkSize(arguments, 'square');

        var mat = new Matrix(size, type);
        var data = mat.getData();

        // Scaning the from the second dimension (dim = 1)
        var view = mat.getView(), iterator = mat.getIterator(2);
        var it = iterator.iterator, b = iterator.begin, e = iterator.isEnd;

        var fy = view.getFirst(1), dy = view.getStep(1);
        var fx = view.getFirst(0), dx = view.getStep(0);
        var N = Math.min(view.getSize(1), view.getSize(0));
        var i, y, n;
        for (i = b(); !e(); i = it()) {
            for (y = i + fy + fx, n = 0; n < N; y += dy, n++) {
                data[y + n * dx] = 1;
            }
        }
        return mat;
    };

    /** Creates a complex Matrix from a 2 Matrix.
     *
     * @method complex
     *
     * @param {Matrix} real
     * Matrix used are real part.
     *
     * @param {Matrix} imag
     * Matrix used are imaginary part.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix.complex = function (real, imag) {

        real = Matrix.toMatrix(real);
        imag = Matrix.toMatrix(imag);

        if (!(real instanceof Matrix)) {
            throw new Error('Matrix.complex: real argument must be a matrix.');
        }
        if (!real.isreal()) {
            throw new Error('Matrix.complex: real argument must be a real matrix.');
        }

        if (!(imag instanceof Matrix)) {
            throw new Error('Matrix.complex: imag argument must be a matrix.');
        }
        if (!imag.isreal()) {
            throw new Error('Matrix.complex: imag argument must be a real matrix.');
        }
        if (!Tools.checkSizeEquals(real.getSize(), imag.getSize(), Matrix.ignoreTrailingDims)) {
            throw new Error('Matrix.complex: imag and real Matrix must ' +
                            'have the same size.');
        }
        var realData = real.getData(), imagData = imag.getData();
        var od = new Matrix.dataType(realData.length * 2);
        od.subarray(0, realData.length).set(realData);
        od.subarray(realData.length).set(imagData);
        return new Matrix(real.getSize(), od, true);
    };

    /** Reads image data in order to creates a Matrix.
     *
     * @param {String|Image|HTMLCanvasElement} source
     *  Source of the image. It can be the image path, an Image element
     *  or a Canvas element respectively.
     *
     * @param {Function} callback
     *  Function to call once the image is loaded.
     *
     * @param {Function} errorCallback
     *  Function to call if an error occurs while loading.
     *
     * @return {Matrix}
     *
     * @matlike
     * @todo Should this function make use of Matrix.initialize ?
     */
    Matrix.imread = function (source, callback, errCallback) {
        var errMsg = 'Matrix.imread: ';
        var imOut = new Matrix();

        // If source is a canvas
        if (!isNode && typeof source === 'string' && document.getElementById(source)) {
            source = document.getElementById(source);
        }

        var readFromCanvas = function (source) {
            var imageData, ctx = source.getContext('2d');
            var width = source.width, height = source.height;
            try {
                imageData = ctx.getImageData(0, 0, width, height);
            } catch (e) {
                if (errCallback !== undefined) {
                    errCallback.call(this, e);
                    return;
                }
                throw e;
            }
            var data = new Uint8ClampedArray(imageData.data);

            var view = new MatrixView([4, width, height])
                    .select([0, 2], [0, -1], [0, -1])
                    .permute([2, 1, 0]);
            this.initialize(view.getSize(), view.extractFrom(data));

            if (callback) {
                callback.call(this, this);
            }
        }.bind(imOut);

        var readFromImage = function (image) {
            if (!isNode) {
                image = image instanceof Event ? this : image;
            }
            var canvas = createCanvas(image.width, image.height);
            canvas.getContext('2d').drawImage(image, 0, 0, image.width, image.height);
            readFromCanvas(canvas);
        };

        var readFromFileName = function (name) {
            var im = new newImage();
            im.onerror = errCallback || function () {
                throw new Error(errMsg + 'Error occuring while loading image.');
            };
            if (isNode) {
                im.src = fs.readFileSync(name);
                readFromImage(im);
            } else {
                im.src = name;
                im.onload = readFromImage;
            }
        };

        if (typeof source === 'string') {
            readFromFileName(source);
        } else if (!isNode && source instanceof Image) {
            readFromImage(source);
        } else if (!isNode && source instanceof HTMLCanvasElement) {
            readFromCanvas(source);
        } else if (isNode && source instanceof Canvas) {
            readFromCanvas(source);
        } else {
            throw new Error(errMsg + 'invalid source argument');
        }
        return imOut;
    };

    /** Creates a square diagonal Matrix from a vector.
     *
     * @param {Matrix} vector
     *
     * @return {Matrix}
     *
     * @matlike
     * @todo This function must works with complex Matrix and array.
     */
    Matrix.diag = function (d) {
        d = Matrix.toMatrix(d);
        var l = d.numel();
        d = d.getData();
        var out = Matrix.zeros(l);
        var data = out.getData();
        var i, ei, j;
        for (i = 0, ei = data.length, j = 0; i < ei; i += l + 1, j++) {
            data[i] = d[j];
        }
        return out;
    };

    /** Load several images from an array of path and once all the images are
     * loaded call a callback function. Each image is loaded in a `Matrix`
     * container.
     * @param {Array} names
     *  The names of the images corresponding to their paths.
     * @param {Function} callback
     *  The function to be called when the images are loaded.
     *  The pointer `this` of the function is the array of images.
     * @return {Array}
     *  The array of images.
     */
    Matrix.loadImages = function loadImages(images, callback) {
        /*
        var tab = [], i, ie;
        callback = callback.bind(tab);
        var f_file = function (i) {
            return function (evt) {
                tab[i] = evt.target.result;
                for (var j = 0, je = images.length; j < je; j++) {
                    if (!tab[j]) {
                        return;
                    }
                }
                callback();
            };
        };
        for (i = 0, ie = images.length; i < ie; i++) {
            var reader = new FileReader();
            reader.onload = f_file(i);
            reader.readAsDataURL(images[i]);
        }
        return tab;
         */

        var tab = [], i, ie;
        callback = callback.bind(tab);
        var f = function (i) {
            return function () {
                tab[i] = this;
                for (var j = 0, je = images.length; j < je; j++) {
                    if (!tab[j] || tab[j].isempty()) {
                        return;
                    }
                }
                callback();
            };
        };
        for (i = 0, ie = images.length; i < ie; i++) {
            if (images[i] instanceof Image) {
                Matrix.imread(images[i], f(i));
            }
        }
        return tab;
    };


})(Matrix, Matrix.prototype);
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

/** @class Matrix */

(function (Matrix, Matrix_prototype) {
    "use strict";

    var min = function (data, s, d, N) {
        for (var i = s + d, e = s + N, m = data[s]; i < e; i += d) {
            if (data[i] < m) {
                m = data[i];
            }
        }
        return m;
    };    

    var amin = function (data, s, d, N) {
        for (var i = s + d, e = s + N, m = data[s], im = s; i < e; i += d) {
            if (data[i] < m) {
                m = data[i];
                im = i;
            }
        }
        return im;
    };    

    var max = function (data, s, d, N) {
        for (var i = s + d, e = s + N, m = data[s]; i < e; i += d) {
            if (data[i] > m) {
                m = data[i];
            }
        }
        return m;
    };    

    var amax = function (data, s, d, N) {
        for (var i = s + d, e = s + N, m = data[s], im = s; i < e; i += d) {
            if (data[i] > m) {
                m = data[i];
                im = i;
            }
        }
        return im;
    };

    var sum = function (data, s, d, N) {
        for (var i = s, e = s + N, m = 0; i < e; i += d) {
            m += data[i];
        }
        return m;
    };    

    var mean = function (data, s, d, N) {
        for (var i = s, e = s + N, m = 0; i < e; i += d) {
            m += data[i];
        }
        return m * d / N;
    };    
    
    var prod = function (data, s, d, N) {
        for (var i = s, e = s + N, m = 1; i < e; i += d) {
            m *= data[i];
        }
        return m;
    };    

    var variance = function (data, s, d, N) {
        var mu = mean(data, s, d, N);
         for (var i = s, e = s + N, m = 0; i < e; i += d) {
            var tmp = data[i] - mu;
            m += tmp * tmp;
        }
        return m * d / (N - 1);
    };    

    var varianceBiased = function (data, s, d, N) {
         return variance(data, s, d, N) * (N - 1) / N;
    };

    var cumsum = function (data, s, d, N) {
        for (var i = s + d, e = s + N; i < e; i += d) {
            data[i] += data[i - d];
        }
    };    

    var cumprod = function (data, s, d, N) {
        for (var i = s + d, e = s + N; i < e; i += d) {
            data[i] *= data[i - d];
        }
    };    

    var getPermutation = function (view, dim) {
        var ndims = view.ndims(), order = [dim];
        for (var i = 0; i < ndims; i++) {
            if (i !== dim) {
                order.push(i);
            }
        }
        return order;
    };

    var applyDim = function (mat, fun, dim, inplace, output) {

        // Do the function fun return a number or act in place ?
        inplace = inplace || false;

        // Check parameter dim
        if (!Tools.isSet(dim)) { 
            if (inplace) {
                fun(mat.getData(), 0, 1, mat.numel());
                return mat;
            }
            var v = fun(mat.getData(), 0, 1, mat.numel());
            return Matrix.toMatrix(v);
        } 

        if (!Tools.isInteger(dim, 0)) {
            throw new Error('Matrix.applyDim: Invalid dimension.');
        }

        var view = mat.getView(), order = getPermutation(view, dim);
        view.permute(order);

        // Input Matrix and data
        var id = mat.getData(), iterator = view.getIterator(1);
        var it = iterator.iterator, b = iterator.begin, e = iterator.isEnd;
        var d = view.getStep(0), l = view.getEnd(0);
        var i, io;
        if (!inplace) {
            // Output size and data
            var sizeOut = mat.getSize();
            sizeOut[dim] = 1;
            var om = new Matrix(sizeOut, output), od = new om.getData();
            for (i = b(), io = 0; !e(); i = it(), io++) {
                od[io] = fun(id, i, d, l);
            }
            return om;
        } 
        if (output !== undefined) {
            mat = output;
            output = output.getData();
        }
        for (i = b(); !e(); i = it()) {
            fun(id, i, d, l, output);
        }
        return mat;
    };

    /** Return the minimum of a matrix.
     * @param {Number} [dim=undefined]
     *  Dimension on which the computation must be performed. If undefined,
     *  return the global minimum.
     * @return {Matrix}
     */
    Matrix_prototype.min = function (dim) {
        return applyDim(this, min, dim);
    };
    /** Return the argmin of a matrix.
     * @param {Number} [dim=undefined]
     *  Dimension on which the computation must be performed. If undefined,
     *  return the global argmin.
     * @return {Matrix}
     */
    Matrix_prototype.amin = function (dim) {
        return applyDim(this, amin, dim, undefined, 'uint32');
    };
    /** Return the maximum of a matrix.
     * @param {Number} [dim=undefined]
     *  Dimension on which the computation must be performed. If undefined,
     *  return the global maximum.
     * @return {Matrix}
     */
    Matrix_prototype.max = function (dim) {
        return applyDim(this, max, dim);
    };
    /** Return the argmax of a matrix.
     * @param {Number} [dim=undefined]
     *  Dimension on which the computation must be performed. If undefined,
     *  return the global argmax.
     * @return {Matrix}
     */
    Matrix_prototype.amax = function (dim) {
        return applyDim(this, amax, dim, undefined, 'uint32');
    };
    /** Return the sum of the matrix elements.
     * @param {Number} [dim=undefined]
     *  Dimension on which the computation must be performed. If undefined,
     *  return the global sum.
     * @return {Matrix}
     */
    Matrix_prototype.sum = function (dim) {
        return applyDim(this, sum, dim);
    };
    /** Return the product of the matrix elements.
     * @param {Number} [dim=undefined]
     *  Dimension on which the computation must be performed. If undefined,
     *  return the product of all the matrix elements.
     * @return {Matrix}
     */
    Matrix_prototype.prod = function (dim) {
        return applyDim(this, prod, dim);
    };
    /** Return the average value of the matrix elements.
     * @param {Number} [dim=undefined]
     *  Dimension on which the computation must be performed. If undefined,
     *  return the average value of all the elements.
     * @return {Matrix}
     */
    Matrix_prototype.mean = function (dim) {
        return applyDim(this, mean, dim);
    };
    /** Return the variance of the matrix elements.
     * @param {Number} [dim=undefined]
     *  Dimension on which the computation must be performed. If undefined,
     *  return the variance of all the elements.
     * @param {Number} [norm=false]
     *  If false, use the non biased variance estimator (N - 1), and the 
     *  biased one otherwise.
     * @return {Matrix}
     */
    Matrix_prototype.variance = function (dim, norm) {
        switch (typeof norm) {
        case 'undefined':
            norm = -1;
            break;
        case 'boolean':
            norm = (norm === false) ? -1 : 0;
            break;
        case 'number':
            if (norm === 0) {
                norm = -1;
            } else if (norm === 1) {
                norm = 0;
            } else {
                throw new Error('Matrix.variance: Invalid argument.');
            }
            break;
        default:
            throw new Error('Matrix.variance: Invalid argument.');
        }
        if (norm === -1) {
            return applyDim(this, variance, dim);
        } 
        return applyDim(this, varianceBiased, dim);
    };
    /** Return the standard deviation of the matrix elements.
     * @param {Number} [dim=undefined]
     *  Dimension on which the computation must be performed. If undefined,
     *  return the standard deviation of all the elements.
     * @param {Number} [norm=false]
     *  If false, use the non biased standard deviation estimator (N - 1), 
     * and the biased one otherwise.
     * @return {Matrix}
     */
    Matrix_prototype.std = function (norm, dim) {
        var v = this.variance(norm, dim);
        if (typeof v === 'number') {
            return Math.sqrt(v);
        }
        return v.arrayfun(Math.sqrt);
    };
    /** Return the cumulative sum of the matrix elements.
     * @param {Number} [dim=undefined]
     *  Dimension on which the computation must be performed. If undefined,
     *  return the cumulative sum of all the elements.
     * @return {Matrix}
     */
    Matrix_prototype.cumsum = function (dim) {
        return applyDim(this, cumsum, dim, true);
    };

    /** Return the cumulative product of the matrix elements.
     * @param {Number} [dim=undefined]
     *  Dimension on which the computation must be performed. If undefined,
     *  return the cumulative product of all the elements.
     * @return {Matrix}
     */
    Matrix_prototype.cumprod = function (dim) {
        return applyDim(this, cumprod, dim, true);
    };


    (function () {
        var poissrnd_lambda = function (data, lambda) {
            var L = Math.exp(-lambda), random = Math.random;
            for (var i = 0, ie = data.length; i < ie; i++) {
                var p = 1, k = 0;
                do {
                    k++;
                    p *= random();
                } while (p > L);
                data[i] = k - 1;
            }
        };

        var poissrnd_lambdas = function (lambda) {
            var exp = Math.exp, random = Math.random;
            for (var i = 0, ie = lambda.length; i < ie; i++) {
                var p = 1, k = 0, L = exp(-lambda[i])
                do {
                    k++;
                    p *= random();
                } while (p > L);
                lambda[i] = k - 1;
            }
        };

        var exprnd = function (data, mu) {
            mu = -mu;
            var random = Math.random, log = Math.log;
            for (var i = 0, ie = data.length; i < ie; ++i) {
                data[i] = mu * log(random());
            }
        };

        /** Generate Poisson random numbers. 
         * 
         * The `lambda` parameter can a number as well as a Matrix.
         * - If it is a number then the function returns an array of 
         * dimension `size`.
         * - If `lambda` is a Matrix then the function will return 
         * a Matrix of the same size.
         * 
         * Note that to avoid copy, you can use the syntax `mat.poissrnd()`.
         *
         * @param {Number} lambda
         * @param {Number} [size]
         * @return {Matrix}
         */
        Matrix.poissrnd = function () {
            var lambda = Array.prototype.shift.apply(arguments);
            if (typeof(lambda) === "number") { 
                var size = Tools.checkSize(arguments, 'square');
                var mat = new Matrix(size), data = mat.getData();
                poissrnd_lambda(data, lambda);
                return mat;
            }
            if (lambda instanceof Matrix) {
                return lambda.getCopy().poissrnd();
            }
        };
        Matrix_prototype.poissrnd = function() {
            poissrnd_lambdas(this.getData());
            return this;
        };
        /** Generate exponentially distributed random numbers.
         * @param {Number} mu
         * @param {Number} size
         * @return {Matrix}
         */
        Matrix.exprnd = function () {
            var mu = Array.prototype.shift.apply(arguments);
            var size = Tools.checkSize(arguments, 'square');
            
            var mat = new Matrix(size), data = mat.getData();
            exprnd(data, mu);
            return mat;
        };

    })();

    (function () {
        var tab, itab, fun;
        var asortAscend = function (a, b) {
            return tab[a] - tab[b];
        };
        var asortDescend = function (a, b) {
            return tab[b] - tab[a];
        };
        var sortAscend = function (a, b) {
            return a - b;
        };
        var sortDescend = function (a, b) {
            return b - a;

        };
        var sort = function (data, s, d, N) {
            var i, io, e;
            for (i = s, io = 0, e = s + N; i < e; i += d, io++) {
                tab[io] = data[i];
            }
            Array.prototype.sort.call(tab, fun);
            for (i = s, io = 0, e = s + N; i < e; i += d, io++) {
                data[i] = tab[io];
            }
        };
        var asort = function (data, s, d, N, out) {
            var i, io, e;
            for (i = s, io = 0, e = s + N; i < e; i += d, io++) {
                tab[io] = data[i];
                itab[io] = io;
            }
            Array.prototype.sort.call(itab, fun);
            for (i = s, io = 0, e = s + N; i < e; i += d, io++) {
                out[i] = itab[io] * d + s;
            }
        };

        /** Sort the elements of the matrix.
         * @param {Number} [dim=undefined]
         *  Dimension on which the computation must be performed. If undefined,
         *  return all the elements sorted.
         * @param {String} [mode="ascend"]
         *  Sorting by increasing values ("ascend") or decreasing values ("descend")
         * @chainable
         */
        Matrix_prototype.sort = function (dim, mode) {
            var size = typeof dim === "number" ? this.getSize(dim) : this.numel();
            tab = new Float64Array(size);
            if (mode === "ascend") { 
                fun = sortAscend;
            } else if (mode === "descend") {
                fun = sortDescend;
            } else {
                throw new Error("Matrix.sort: Wrong mode selection");
            }
            return applyDim(this, sort, dim, true);
        };
        
        Matrix.sort = function (m, dim, mode) {
            return m.getCopy().sort(dim, mode);
        };

        /** Compute the argsort of the elements of the matrix.
         * @param {Number} [dim=undefined]
         *  Dimension on which the computation must be performed. If undefined,
         *  return the global argsort.
         * @param {String} [mode="ascend"]
         *  Sorting by increasing values ("ascend") or decreasing values ("descend")
         * @return {Matrix}
         */
        Matrix_prototype.asort = function (dim, mode) {
            var size = typeof dim === "number" ? this.getSize(dim) : this.numel();
            tab = new Float64Array(size);
            itab = new Uint32Array(size);
            if (mode === "ascend") { 
                fun = asortAscend;
            } else if (mode === "descend") {
                fun = asortDescend;
            } else {
                throw new Error("Matrix.sort: Wrong mode selection"); 
            }
            var out = new Matrix(this.getSize(), "uint32");
            return applyDim(this, asort, dim, true, out);
       };

        Matrix.asort = function (m, dim, mode) {
            return m.getCopy().asort(dim, mode);
        };

    })();

    /** Accumate values in an array
     * @param {Array} subs
     *  Array of integers indicating subscript positions
     * @param {Array} val
     *  Values to be accumulated.
     * @param {Array} [size]
     *  Size of the output Array. Default is subs.max() + 1
     * @return {Matrix}
     */
    Matrix.accumarray = function (subs, val, size) {
        subs = Matrix.toMatrix(subs);
        // Check subs for array of positive integers
        if (!Tools.isArrayOfIntegers(subs.getData(), 0)) {
            throw new Error('Matrix.accumarray: Subs should be an array of positive integers.');
        }

        var max = subs.max(0).getData();
        var k, ek, steps = [1];
        if (Tools.isSet(size)) {
            for (k = 0, ek = max.length; k < ek; k++) {
                if (size[k] < max[k] + 1) {
                    throw new Error('Matrix.accumarray: Size and Subs values are unconsistent.');
                }
            }
        } else {
            size = [];
            for (k = 0, ek = max.length; k < ek; k++) {
                size[k] = max[k] + 1;
            }
        }
        for (k = 0, ek = size.length - 1; k < ek; k++) {
            steps[k + 1] = steps[k] * size[k];
        }

        if (subs.ndims() > 2) {
            throw Error("Matrix.accumarray: Subs must be a 2D Array.");
        }
        
        // Scaning the from the second dimension (dim = 1)
        var sd = subs.getData(), N = subs.numel(), ni = subs.getSize(0);
        var i, j, _j, ij, ie, s;

        var ind = new Uint32Array(ni);
        for (j = 0, _j = 0; _j < N; j++, _j += ni) {
            for (i = 0, ij = _j, s = steps[j]; i < ni; i++, ij++) {
                ind[i] += sd[ij] * s;
            }
        }

        if (val instanceof Matrix) { 
            val = val.getData();
        } 
        var out = new Matrix(size), od = out.getData();
        if (Tools.isArrayLike(val) && val.length === ind.length) {
            for (k = 0, ek = ind.length; k < ek; k++) {
                od[ind[k]] += val[k];
            }
        } else if (typeof val === "number") {
            for (k = 0, ek = ind.length; k < ek; k++) {
                od[ind[k]] += val;
            }
        } else {
            throw new Error("Matrix.accumarray: Wrong val argument.");
        }
        return out;
    };

})(Matrix, Matrix.prototype);
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

/** @class Matrix */

(function (Matrix, Matrix_prototype) {
    "use strict";

    /** Returns a new Matrix with a data cast.
     *
     * __Also see:__
     *  {@link Matrix#type}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.cast = function (Type) {
        var flag;
        switch (Type.toLowerCase()) {
        case 'boolean':
        case 'bool':
        case "logical":
            flag = true;
            break;
        default:
            flag = false;
        }

        Type = Tools.checkType(Type);
        var od = new Type(this.getData());
        return new Matrix(this.getSize(), od, !this.isreal(), flag);
    };

    /** Converts a Matrix to double.
     *
     * __Also see:__
     *  {@link Matrix#cast}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.double = function () {
        return this.cast('double');
    };

    /** Converts a Matrix to single.
     *
     * __Also see:__
     *  {@link Matrix#cast}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.single = function () {
        return this.cast('single');
    };

    /** Converts a Matrix to int8.
     *
     * Also see {@link Matrix#cast}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.int8 = function () {
        return this.cast('int8');
    };

    /** Converts a Matrix to int16.
     *
     * __Also see:__
     *  {@link Matrix#cast}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.int16 = function () {
        return this.cast('int16');
    };

    /** Converts a Matrix to int32.
     *
     * __Also see:__
     *  {@link Matrix#cast}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.int32 = function () {
        return this.cast('int32');
    };

    /** Converts a Matrix to uint8.
     *
     * __Also see:__
     *  {@link Matrix#cast}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.uint8 = function () {
        return this.cast('uint8');
    };

    /** Converts a Matrix to logical.
     *
     * __Also see:__
     *  {@link Matrix#cast}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.logical = function () {
        return this.cast('logical');
    };

    /** Converts a Matrix to uint8c.
     *
     * __Also see:__
     *  {@link Matrix#cast}.
     *
     * @return {Matrix}
     */
    Matrix_prototype.uint8c = function () {
        return this.cast('uint8c');
    };

    /** Converts a Matrix to uint16.
     *
     * __Also see:__
     *  {@link Matrix#cast}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.uint16 = function () {
        return this.cast('uint16');
    };

    /** Converts a Matrix to uint32.
     *
     * __Also see:__
     *  {@link Matrix#cast}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.uint32 = function () {
        return this.cast('uint32');
    };

    /** Returns a logical Matrix with 1 if value is NaN and 0 otherwise.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.isnan = function () {
        var oMat = new Matrix(this.getSize(), 'logical');
        var od = oMat.getData();
        var i, ie;
        if (this.isreal()) {
            var id = this.getData();
            for (i = 0, ie = od.length; i < ie; i++) {
                od[i] = isNaN(id[i]);
            }
        } else {
            var ird = this.getRealData(), iid = this.getImagData();
            for (i = 0, ie = od.length; i < ie; i++) {
                od[i] = isNaN(ird[i]) || isNaN(iid[i]);
            }
        }
        return oMat;
    };

    /** Returns a logical Matrix with 1 if value is NaN and 0 otherwise.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.isinf = function () {
        var oMat = new Matrix(this.getSize(), 'logical');
        var od = oMat.getData();
        var i, ie;
        if (this.isreal()) {
            var id = this.getData();
            for (i = 0, ie = od.length; i < ie; i++) {
                var v = id[i];
                od[i] = (v === Infinity) || (v === -Infinity) ? 1 : 0;
            }
        } else {
            var ird = this.getRealData(), iid = this.getImagData();
            for (i = 0, ie = od.length; i < ie; i++) {
                var vr = ird[i], vi = iid[i];
                od[i] = ((vr === Infinity) || (vr === -Infinity) ||
                    (vi === Infinity) || (vi === -Infinity)) ? 1 : 0;
            }
        }
        return oMat;
    };

    /** Returns a logical Matrix with 1 if value is NaN and 0 otherwise.
     *
     * @return {Matrix} New Matrix.
     *
     * @matlike
     */
    Matrix_prototype.isfinite = function () {
        var oMat = new Matrix(this.getSize(), 'logical');
        var od = oMat.getData();
        var i, ie;
        if (this.isreal()) {
            var id = this.getData();
            for (i = 0, ie = od.length; i < ie; i++) {
                od[i] = isFinite(id[i]) ? 1 : 0;
            }
        } else {
            var ird = this.getRealData(), iid = this.getImagData();
            for (i = 0, ie = od.length; i < ie; i++) {
                od[i] = (isFinite(ird[i]) || isFinite(iid[i])) ? 1 : 0;
            }
        }
        return oMat;
    };

})(Matrix, Matrix.prototype);
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

/** @class Matrix */

(function (Matrix, Matrix_prototype) {
    "use strict";

    /** Returns the Matrix real part.
     *
     * __Also see:__
     *  {@link Matrix#imag}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.real = function () {
        if (this.isreal()) {
            throw new Error('Matrix.real: This function can be only' +
                            ' used with a complex Matrix. ');
        }
        var rd = this.getRealData();
        return new Matrix(this.getSize(), new rd.constructor(rd));
    };

    /** Returns the Matrix imaginary part.
     *
     * __Also see:__
     * {@link Matrix#real}.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.imag = function () {
        if (this.isreal()) {
            throw new Error('Matrix.imag: This function can be only' +
                            ' used with a complex Matrix. ');
        }
        var id = this.getImagData();
        return new Matrix(this.getSize(), new id.constructor(id));
    };

    /** Returns the phase angle for complex Matrix.
     *
     * __Also see:__
     *  {@link Matrix#abs}.
     *
     * @chainable
     * @matlike
     * @method angle
     */
    (function (Matrix_prototype) {
        var angle_real = function (data) {
            for (var i = 0, ie = data.length; i < ie; i++) {
                data[i] = 0;
            }
        };

        var angle_cplx = function (datar, datai) {
            for (var i = 0, ie = datar.length; i < ie; i++) {
                datar[i] = Math.atan2(datai[i], datar[i]);
                datai[i] = 0;
            }
        };

        Matrix_prototype.angle = function () {
            if (this.isreal()) {
                angle_real(this.getData());
            } else {
                angle_cplx(this.getRealData(), this.getImagData());
            }
            return this;
        };
    })(Matrix_prototype);

    /** Returns the absolute value for real Matrix and
     * the complex magnitude for complex Matrix.
     *
     * __Also see:__
     *  {@link Matrix#angle}.
     *
     * @chainable
     * @matlike
     * @method abs
     */
    (function (Matrix_prototype) {
        var abs_real = function (data) {
            for (var i = 0, ie = data.length; i < ie; i++) {
                data[i] = data[i] > 0 ? data[i] : -data[i];
            }
        };

        var abs_cplx = function (datar, datai) {
            for (var i = 0, ie = datar.length; i < ie; i++) {
                var a = datai[i], b = datar[i];
                datar[i] = Math.sqrt(a * a + b * b);
                datai[i] = 0;
            }
        };

        Matrix_prototype.abs = function () {
            if (this.isreal()) {
                abs_real(this.getData());
            } else {
                abs_cplx(this.getRealData(), this.getImagData());
            }
            return this;
        };
    })(Matrix_prototype);

    /** Returns the complex conjugate of each element of the Matrix.
     *
     * @chainable
     */
    Matrix_prototype.conj = function () {
        if (this.isreal() === true) {
            return this;
        }
        var i, ie, imag = this.getImagData();
        for (i = 0, ie  = imag.length; i < ie; i++) {
            imag[i] = -imag[i];
        }
        return this;
    };

})(Matrix, Matrix.prototype);
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

/** @class Matrix */

(function (Matrix, Matrix_prototype) {
    'use strict';


    //////////////////////////////////////////////////////////////////
    //                    MATH OBJECT OPERATORS                     //
    //////////////////////////////////////////////////////////////////


    /** Apply the square root function to values of Matrix.
     *
     * @chainable
     * @matlike
     * @method sqrt
     */
    (function (Matrix_prototype) {
        var sqrt_real = function (data) {
            for (var i = 0, ie = data.length; i < ie; i++) {
                data[i] = Math.sqrt(data[i]);
            }
        };

        var sqrt_cplx = function (datar, datai) {
            for (var i = 0, ie = datar.length; i < ie; i++) {
                var a = datar[i], b = datai[i];
                var m = Math.sqrt(a * a + b * b);
                datar[i] = Math.sqrt((a + m) * 0.5);
                datai[i] = b < 0 ? -Math.sqrt((m - a) * 0.5) : Math.sqrt((m - a) * 0.5);
            }
        };

        Matrix_prototype.sqrt = function () {
            if (this.isreal()) {
                sqrt_real(this.getData());
            } else {
                sqrt_cplx(this.getRealData(), this.getImagData());
            }
            return this;
        };
    })(Matrix_prototype);

    /** Apply the cosine function to values of Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.cos = function () {
        var data = this.getData(), i, ie;
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.cos(data[i]);
        }
        return this;
    };

    /** Apply the sine function to values of Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.sin = function () {
        var data = this.getData(), i, ie;
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.sin(data[i]);
        }
        return this;
    };

    /** Apply the tangent function to values of Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.tan = function () {
        var data = this.getData(), i, ie;
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.tan(data[i]);
        }
        return this;
    };

    /** Apply the exponential function to values of Matrix.
     *
     * @chainable
     * @todo This function must be tested on complex numbers
     * @matlike
     * @method exp
     */
    (function (Matrix_prototype) {
        var exp_real = function (data) {
            for (var i = 0, ie = data.length; i < ie; i++) {
                data[i] = Math.exp(data[i]);
            }
        };
        var exp_cplx = function (datar, datai) {
            for (var i = 0, ie = datar.length; i < ie; i++) {
                var a = Math.exp(datar[i]), b = datai[i];
                datar[i] = a * Math.cos(b);
                datai[i] = a * Math.sin(b);
            }
        };
        Matrix_prototype.exp = function () {
            if (this.isreal()) {
                exp_real(this.getData());
            } else {
                exp_cplx(this.getRealData(), this.getImagData());
            }
            return this;
        };
    })(Matrix_prototype);

    /** Apply the natural logarithm function to the values of the Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.log = function () {
        var data = this.getData(), i, ie;
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.log(data[i]);
        }
        return this;
    };

    /** Apply the base 10 logarithm to the values of the Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.log10 = function () {
        var data = this.getData(), i, ie;
        var log10 = Math.log(10);
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.log(data[i]) * log10;
        }
        return this;
    };

    /** Apply the base 2 logarithm to the values of the Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.log2 = function () {
        var data = this.getData(), i, ie;
        var log2 = Math.log(2);
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.log(data[i]) * log2;
        }
        return this;
    };

    /** Apply the floor function to values of Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.floor = function () {
        var data = this.getData(), i, ie;
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.floor(data[i]);
        }
        return this;
    };

    /** Apply the ceil function to values of Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.ceil = function () {
        var data = this.getData(), i, ie;
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.ceil(data[i]);
        }
        return this;
    };

    /** Apply the round function to values of Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.round = function () {
        var data = this.getData(), i, ie;
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.round(data[i]);
        }
        return this;
    };

    /** Apply the arccosine function to values of Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.acos = function () {
        var data = this.getData(), i, ie;
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.acos(data[i]);
        }
        return this;
    };

    /** Apply the arcsine function to values of Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.asin = function () {
        var data = this.getData(), i, ie;
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.asin(data[i]);
        }
        return this;
    };

    /** Apply the arctan function to values of Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.atan = function () {
        var data = this.getData(), i, ie;
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = Math.acos(data[i]);
        }
        return this;
    };

    /** Apply the arctan2 function to values of Matrix.
     *
     * @chainable
     * @todo This function should work with complex
     * @matlike
     */
    Matrix_prototype.atan2 = function (B) {
        var A = this.getCopy();
        if (!Tools.checkSizeEquals(A.size(), B.size(), Matrix.ignoreTrailingDims)) {
            throw new Error("Matrix.atan2: Side of of elements must be equal.");
        }
        var dataA = A.getData(), dataB = B.getData();
        var i, ie;
        for (i = 0, ie = dataA.length; i < ie; i++) {
            dataA[i] = Math.atan2(dataA[i], dataB[i]);
        }
        return A;
    };


    //////////////////////////////////////////////////////////////////
    //        Boolean Operators functions defining the matrix       //
    //////////////////////////////////////////////////////////////////


    var booleanOperators = function (op, A, B) {

        if (!A.isreal() || (B instanceof Matrix && !B.isreal())) {
            throw new Error("Matrix.booleanOperators: This function doesn't " +
                            "work with complex numbers.");
        }

        var id = A.getData(), ld = id.length;

        var out, od, x;

        if (typeof B === 'number') {
            out = new Matrix(A.size(), 'boolean');
            od = out.getData();
            if (op === '===' || op === '==') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] === B) ? 1 : 0;
                }
            } else if (op === '!==' || op === '!=') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] !== B) ? 1 : 0;
                }
            } else if (op === '&&') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] && B) ? 1 : 0;
                }
            } else if (op === '||') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] || B) ? 1 : 0;
                }
            } else if (op === '<') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] < B) ? 1 : 0;
                }
            } else if (op === '<=') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] <= B) ? 1 : 0;
                }
            } else if (op === '>') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] > B) ? 1 : 0;
                }
            } else if (op === '>=') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] >= B) ? 1 : 0;
                }
            } else {
                throw new Error('Matrix: Unknown operator \'' + op + '\'.');
            }

        } else if (B instanceof Matrix) {
            var size = Tools.checkSizeEquals(A.size(), B.size(), Matrix.ignoreTrailingDims);
            out = new Matrix(size, 'boolean');
            od = out.getData();
            var i2d = B.getData();
            if (op === '===' || op === '==') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] === i2d[x]) ? 1 : 0;
                }
            } else if (op === '!==' || op === '!=') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] !== i2d[x]) ? 1 : 0;
                }
            } else if (op === '&&') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] && i2d[x]) ? 1 : 0;
                }
            } else if (op === '||') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] || i2d[x]) ? 1 : 0;
                }
            } else if (op === '<') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] < i2d[x]) ? 1 : 0;
                }
            } else if (op === '<=') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] <= i2d[x]) ? 1 : 0;
                }
            } else if (op === '>') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] >= i2d[x]) ? 1 : 0;
                }
            } else if (op === '>=') {
                for (x = 0; x < ld; x++) {
                    od[x] = (id[x] >= i2d[x]) ? 1 : 0;
                }
            } else {
                throw new Error('Unknown operator \'' + op + '\'.');
            }
        } else {
            throw new Error('Argument must be a Matrix or a number');
        }

        return out;
    };

    /** Test equality between two arrays.
     *
     * @param {Number|Matrix} rightOp
     * @chainable
     * @matlike
     */
    Matrix_prototype.eq = function (b) {
        return booleanOperators('===', this, b);
    };
    Matrix_prototype['==='] = Matrix_prototype.eq;

    /** Test inequality between two arrays.
     *
     * @param {Number|Matrix} rightOp
     * @chainable
     * @matlike
     */
    Matrix_prototype.ne = function (b) {
        return booleanOperators('!==', this, b);
    };
    Matrix_prototype['!=='] = Matrix_prototype.ne;

    /** Greater than operator.
     *
     * @param {Number|Matrix} rightOp
     * @chainable
     * @matlike
     */
    Matrix_prototype.gt = function (b) {
        return booleanOperators('>', this, b);
    };
    Matrix_prototype['>'] = Matrix_prototype.gt;

    /** Greater or equal operator.
     *
     * @param {Number|Matrix} rightOp
     * @chainable
     * @matlike
     */
    Matrix_prototype.ge = function (b) {
        return booleanOperators('>=', this, b);
    };
    Matrix_prototype['>='] = Matrix_prototype.ge;

    /** Lower than operator.
     *
     * @param {Number|Matrix} rightOp
     * @chainable
     * @matlike
     */
    Matrix_prototype.lt = function (b) {
        return booleanOperators('<', this, b);
    };
    Matrix_prototype['<'] = Matrix_prototype.lt;

    /** Lower or equal operator.
     *
     * @param {Number|Matrix} rightOp
     * @chainable
     * @matlike
     */
    Matrix_prototype.le = function (b) {
        return booleanOperators('<=', this, b);
    };
    Matrix_prototype['<='] = Matrix_prototype.le;

    /** And operator.
     *
     * @param {Number|Matrix} rightOp
     * @chainable
     * @matlike
     */
    Matrix_prototype.and = function (b) {
        return booleanOperators('&&', this, b);
    };
    Matrix_prototype['&&'] = Matrix_prototype.and;

    /** Or operator.
     *
     * @param {Number|Matrix} rightOp
     * @chainable
     * @matlike
     */
    Matrix_prototype.or = function (b) {
        return booleanOperators('||', this, b);
    };
    Matrix_prototype['||'] = Matrix_prototype.or;

    /** Return false if different of zero.
     *
     * @param {Number|Matrix} rightOp
     * @chainable
     * @matlike
     */
    Matrix_prototype.neg = function () {
        var out = this.getCopy();
        var data = out.getData();
        var i, ie;
        for (i = 0, ie = data.length; i < ie; i++) {
            data[i] = !data[i] ? 1 : 0;
        }
        return out;
    };


    //////////////////////////////////////////////////////////////////
    //                     Arithmetic Operators                     //
    //////////////////////////////////////////////////////////////////

    /* Function used to generate automatically the other function */
    var generateArithmeticOperators = function () {
        var operators = {
            '+': {
                "name": "plus",
                "real/real": {
                    scalar: "a[x] += b;",
                    matrix: "a[x] += b[x];"
                },
                "real/imag": {
                    scalar: "ar[x] += br;    ai[x] = bi;",
                    matrix: "ar[x] += br[x]; ai[x] = bi[x];"
                },
                "imag/real": {
                    scalar: "ar[x] += b;",
                    matrix: "ar[x] += b[x];"
                },
                "imag/imag": {
                    scalar: "ar[x] += br;    ai[x] += bi;",
                    matrix: "ar[x] += br[x]; ai[x] += bi[x];"
                },
                AIsScalar: "B.getCopy().plus(A);",
                AIsMatrix: "A.getCopy().plus(B);"
            },
            '-': {
                "name": "minus",
                "real/real": {
                    scalar: "a[x] -= b;",
                    matrix: "a[x] -= b[x];"
                },
                "real/imag": {
                    scalar: "ar[x] -= br;    ai[x] = -bi;",
                    matrix: "ar[x] -= br[x]; ai[x] = -bi[x];"
                },
                "imag/real": {
                    scalar: "ar[x] -= b;",
                    matrix: "ar[x] -= b[x];"
                },
                "imag/imag": {
                    scalar: "ar[x] -= br;    ai[x] -= bi;",
                    matrix: "ar[x] -= br[x]; ai[x] -= bi[x];"
                },
                AIsScalar: "B.getCopy().plus(A.uminus());",
                AIsMatrix: "A.getCopy().minus(B);"
            },
            '.*': {
                "name": "times",
                "real/real": {
                    scalar: "a[x] *= b;",
                    matrix: "a[x] *= b[x];"
                },
                "real/imag": {
                    scalar: "ai[x] = ar[x] * bi;    ar[x] *= br;",
                    matrix: "ai[x] = ar[x] * bi[x]; ar[x] *= br[x];"
                },
                "imag/real": {
                    scalar: "ar[x] *= b;    ai[x] *= b;",
                    matrix: "ar[x] *= b[x]; ai[x] *= b[x];"
                },
                "imag/imag": {
                    scalar: "var r = ar[x], i = ai[x];"
                        +   "ar[x] = r * br - i * bi;"
                        +   "ai[x] = r * bi + i * br;",
                    matrix: "var r1 = ar[x], i1 = ai[x], r2 = br[x], i2 = bi[x];"
                        +   "var t = 1 / (r2 * r2 + i2 * i2);"
                        +   "ar[x] = (r1 * r2 + i1 * i2) * t;"
                        +   "ai[x] = (i1 * r2 - r1 * i2) * t;"
                },
                AIsScalar: "B.getCopy().times(A);",
                AIsMatrix: "A.getCopy().times(B);"
            },
            './': {
                "name": "rdivide",
                "real/real": {
                    scalar: "a[x] /= b;",
                    matrix: "a[x] /= b[x];"
                },
                "real/imag": {
                    scalar_before: "ai.set(ar);"
                        +          "tmp = 1 / (br * br + bi * bi);"
                        +          "br = br * tmp;"
                        +          "bi = -bi * tmp;",
                    scalar: "ai[x] *= bi;           ar[x] *= br;",
                    matrix: "ai[x] = ar[x] * bi[x]; ar[x] *= br[x];"
                },
                "imag/real": {
                    scalar_before: "var b = 1 / b;",
                    scalar: "ar[x] *= b;    ai[x] *= b;",
                    matrix: "ar[x] /= b[x]; ai[x] /= b[x];"
                },
                "imag/imag": {
                    scalar_before: "var tmp = 1 / (br * br + bi * bi);"
                        +          "br *= tmp;"
                        +          "bi *= tmp;",
                    scalar: "var r = ar[x], i = ai[x];"
                        +   "ar[x] = r * br + i * bi;"
                        +   "ai[x] = i * bi - r * br;",
                    matrix: "var r1 = ar[x], i1 = ai[x], r2 = br[x], i2 = bi[x];"
                        +   "var t = 1 / (r2 * r2 + i2 * i2);"
                        +   "ar[x] = (r1 * r2 + i1 * i2) * t;"
                        +   "ai[x] = (i1 * r2 - r1 * i2) * t;"
                },
                AIsScalar: "B.getCopy().rdivide(A);",
                AIsMatrix: "A.getCopy().ldivide(B);"
            },
            '.\\': {
                "name": "ldivide",
                "real/real": {
                    scalar: "a[x] = b / a[x];",
                    matrix: "a[x] = b[x] / a[x];"
                },
                "real/imag": {
                    scalar: "ai[x] = bi / ar[x];    ar[x] = br / ar[x];",
                    matrix: "ai[x] = bi[x] / ar[x]; ar[x] = br[x] / ar[x];"
                },
                "imag/real": {
                    scalar: "var tmp = 1 / (ar[x] * ar[x] + ai[x] * ai[x]);"
                        +   "ai[x] = bi * tmp; ar[x] = br * tmp;",
                    matrix: "var tmp = 1 / (ar[x] * ar[x] + ai[x] * ai[x]);"
                        +   "ai[x] = bi[x] * tmp; ar[x] = br[x] * tmp;"
                },
                "imag/imag": {
                    scalar: "var r = br[x], i = bi[x];"
                        +   "ar[x] = r * ar + i * ai;"
                        +   "ai[x] = i * ai - r * ar;",
                    matrix: "var r1 = br[x], i1 = bi[x], r2 = ar[x], i2 = ai[x];"
                        +   "var t = 1 / (r2 * r2 + i2 * i2);"
                        +   "ar[x] = (r1 * r2 + i1 * i2) * t;"
                        +   "ai[x] = (i1 * r2 - r1 * i2) * t;"
                },
                AIsScalar: "B.getCopy().ldivide(A);",
                AIsMatrix: "A.getCopy().rdivide(B);"
            },
            '.^': {
                "name": "power",
                "real/real": {
                    scalar_before: "var pow = Math.pow;",
                    matrix_before: "var pow = Math.pow;",
                    scalar: "a[x] = pow(a[x], b);",
                    matrix: "a[x] = pow(a[x], b[x]);"
                },
                "real/imag": {
                    scalar: "throw new Error('Matrix.power: This function has not "
                        + "been implemented yet for complex number.');",
                    matrix: "throw new Error('Matrix.power: This function has not "
                        + "been implemented yet for complex number.');"
                },
                "imag/real": {
                    scalar: "throw new Error('Matrix.power: This function has not "
                        + "been implemented yet for complex number.');",
                    matrix: "throw new Error('Matrix.power: This function has not "
                        + "been implemented yet for complex number.');"
                },
                "imag/imag": {
                    scalar: "throw new Error('Matrix.power: This function has not "
                        + "been implemented yet for complex number.');",
                    matrix: "throw new Error('Matrix.power: This function has not "
                        + "been implemented yet for complex number.');"
                },
                AIsScalar: "B.isscalar() ? A.getCopy().power(B) : undefined;",
                AIsMatrix: "A.getCopy().power(B);"
            }
        };

        // Template function
        var fct = (function (b) {
            "use strict";
            b = Matrix.toMatrix(b);
            var x, n = this.numel();
            var a = this, ar, ai, br, bi;
            if (b.isscalar()) {               // SCALAR
                if (a.isreal()) {             // REAL
                    if (b.isreal()) {         // REAL / REAL
                        a = a.getData();
                        b = b.getDataScalar();
                        "real/real-scalar";
                    } else {                  // REAL / IMAG
                        a.toComplex();
                        ar = a.getRealData();
                        ai = a.getImagData();
                        br = b.getRealData()[0];
                        bi = b.getImagData()[0];
                        "real/imag-scalar";
                    }
                } else {                      // IMAG
                    ar = a.getRealData();
                    ai = a.getImagData();
                    if (b.isreal()) {         // IMAG / REAL
                        b = b.getDataScalar();
                        "imag/real-scalar";
                    } else {                  // IMAG / IMAG
                        br = b.getRealData()[0];
                        bi = b.getImagData()[0];
                        "imag/imag-scalar";
                    }
                }
            } else {                          // MATRIX
                Tools.checkSizeEquals(a.getSize(), b.getSize(), Matrix.ignoreTrailingDims);
                if (a.isreal()) {             // MATRIX: REAL
                    if (b.isreal()) {         // MATRIX: REAL / REAL
                        a = a.getData();
                        b = b.getData();
                        "real/real-matrix";
                    } else {                  // MATRIX: REAL / IMAG
                        a.toComplex();
                        ar = a.getRealData();
                        ai = a.getImagData();
                        br = b.getRealData();
                        bi = b.getImagData();
                        "real/imag-matrix";
                    }
                } else {                      // MATRIX: IMAG
                    ar = a.getRealData();
                    ai = a.getImagData();
                    if (b.isreal()) {         // MATRIX: IMAG / REAL
                        b = b.getData();
                        "imag/real-matrix";
                    } else {                  // MATRIX: IMAG / IMAG
                        br = b.getRealData();
                        bi = b.getImagData();
                        "imag/imag-matrix";
                    }
                }
            }
            return this;
        }).toString();

        var fct2 = (function (A, B) {
            'use strict';
            A = Matrix.toMatrix(A);
            B = Matrix.toMatrix(B);

            if (A.isscalar()) {
                return "AIsScalar";
            } else {
                return "AIsMatrix";
            }
        }).toString();

        var addLoop = function (str) {
            return "for (x = 0; x < n; x++) {" + str + "}";
        };

        var replace = function (fun, op, c) {
            var scalar = op[c].scalar_before ? op[c].scalar_before : "";
            var matrix = op[c].matrix_before ? op[c].matrix_before : "";
            scalar += addLoop(op[c].scalar);
            matrix += addLoop(op[c].matrix);
            fun = fun.replace("\"" + c + "-matrix\";", matrix);
            fun = fun.replace("\"" + c + "-scalar\";", scalar);
            return fun;
        };

        var o, op, fun;
        for (o in operators) {
            op = operators[o];
            fun = replace(fct, op, "real/real");
            fun = replace(fun, op, "real/imag");
            fun = replace(fun, op, "imag/real");
            fun = replace(fun, op, "imag/imag");
            eval("Matrix.prototype." + op.name + " = " + fun);

            fun = fct2.replace("\"AIsScalar\";", op.AIsScalar);
            fun = fun.replace("\"AIsMatrix\";", op.AIsMatrix);
            eval("Matrix." + op.name + " = " + fun);
        }
    };

    /** Plus operator make an element wise addition.
     * This operation is done in place.
     *
     * __See also:__
     *  {@link Matrix#plus},
     *  {@link Matrix#minus},
     *  {@link Matrix#times},
     *  {@link Matrix#rdivide},
     *  {@link Matrix#ldivide}.
     *  {@link Matrix#ldivide}.
     *
     * @param {Number|Matrix} rightOp
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.plus = function (b) {
        b = Matrix.toMatrix(b);
        var x, n = this.numel();
        var a = this, ar, ai, br, bi;
        if (b.isscalar()) {               // SCALAR
            if (a.isreal()) {             // REAL
                if (b.isreal()) {         // REAL / REAL
                    a = a.getData();
                    b = b.getDataScalar();
                    for (x = 0; x < n; x++) {
                        a[x] += b;
                    }
                } else {                  // REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    for (x = 0; x < n; x++) {
                        ar[x] += br;
                        ai[x] = bi;
                    }
                }
            } else {                      // IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // IMAG / REAL
                    b = b.getDataScalar();
                    for (x = 0; x < n; x++) {
                        ar[x] += b;
                    }
                } else {                  // IMAG / IMAG
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    for (x = 0; x < n; x++) {
                        ar[x] += br;
                        ai[x] += bi;
                    }
                }
            }
        } else {                          // MATRIX
            Tools.checkSizeEquals(a.getSize(), b.getSize(), Matrix.ignoreTrailingDims);
            if (a.isreal()) {             // MATRIX: REAL
                if (b.isreal()) {         // MATRIX: REAL / REAL
                    a = a.getData();
                    b = b.getData();
                    for (x = 0; x < n; x++) {
                        a[x] += b[x];
                    }
                } else {                  // MATRIX: REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        ar[x] += br[x];
                        ai[x] = bi[x];
                    }
                }
            } else {                      // MATRIX: IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // MATRIX: IMAG / REAL
                    b = b.getData();
                    for (x = 0; x < n; x++) {
                        ar[x] += b[x];
                    }
                } else {                  // MATRIX: IMAG / IMAG
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        ar[x] += br[x];
                        ai[x] += bi[x];
                    }
                }
            }
        }
        return this;
    };

    Matrix_prototype['+='] = function (b) {
        return this.plus(b);
    };

    Matrix_prototype['+'] = function (b) {
        return this.getCopy().plus(b);
    };

    Matrix.plus = function (A, B) {
        return A['+'](B);
    };


    /** Minus operator make an element wise subtraction.
     *
     * __Also see:__
     * {@link Matrix#uminus},
     * {@link Matrix#plus},
     * {@link Matrix#times},
     * {@link Matrix#rdivide},
     * {@link Matrix#ldivide},
     *
     * @param {Number|Matrix} rightOp
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.minus = function (b) {
        b = Matrix.toMatrix(b);
        var x, n = this.numel();
        var a = this, ar, ai, br, bi;
        if (b.isscalar()) {               // SCALAR
            if (a.isreal()) {             // REAL
                if (b.isreal()) {         // REAL / REAL
                    a = a.getData();
                    b = b.getDataScalar();
                    for (x = 0; x < n; x++) {
                        a[x] -= b;
                    }
                } else {                  // REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    for (x = 0; x < n; x++) {
                        ar[x] -= br;
                        ai[x] = -bi;
                    }
                }
            } else {                      // IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // IMAG / REAL
                    b = b.getDataScalar();
                    for (x = 0; x < n; x++) {
                        ar[x] -= b;
                    }
                } else {                  // IMAG / IMAG
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    for (x = 0; x < n; x++) {
                        ar[x] -= br;
                        ai[x] -= bi;
                    }
                }
            }
        } else {                          // MATRIX
            Tools.checkSizeEquals(a.getSize(), b.getSize(), Matrix.ignoreTrailingDims);
            if (a.isreal()) {             // MATRIX: REAL
                if (b.isreal()) {         // MATRIX: REAL / REAL
                    a = a.getData();
                    b = b.getData();
                    for (x = 0; x < n; x++) {
                        a[x] -= b[x];
                    }
                } else {                  // MATRIX: REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        ar[x] -= br[x];
                        ai[x] = -bi[x];
                    }
                }
            } else {                      // MATRIX: IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // MATRIX: IMAG / REAL
                    b = b.getData();
                    for (x = 0; x < n; x++) {
                        ar[x] -= b[x];
                    }
                } else {                  // MATRIX: IMAG / IMAG
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        ar[x] -= br[x];
                        ai[x] -= bi[x];
                    }
                }
            }
        }
        return this;
    };

    Matrix_prototype['-='] = function (b) {
        return this.minus(b);
    };

    Matrix_prototype['-'] = function (b) {
        return this.getCopy().minus(b);
    };

    Matrix.minus = function (A, B) {
        return A['-'](B);
    };


    /** Uminus operator take the opposite of each Matrix value.
     *
     * @param {Number|Matrix} rightOp
     *
     * @chainable
     * @todo take into account the complex case.
     * @matlike
     */
    Matrix_prototype.uminus = function () {
        var x, ld = this.numel();
        if (this.isreal()) {
            var a = this.getData();
            for (x = 0; x < ld; x++) {
                a[x] = -a[x];
            }
        } else {
            var ar = this.getRealData(), ai = this.getImagData();
            for (x = 0; x < ld; x++) {
                ar[x] = -ar[x];
                ai[x] = -ai[x];
            }
        }
        return this;
    };

    Matrix.uminus = function (A) {
        return A.getCopy().uminus();
    };

    /** Times operator make an element wise multiplication.
     *
     * __Also see:__
     * {@link Matrix#minus},
     * {@link Matrix#plus},
     * {@link Matrix#rdivide},
     * {@link Matrix#ldivide}.
     *
     * @param {Number|Matrix} rightOp
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.times = function (b) {
        b = Matrix.toMatrix(b);
        var x, n = this.numel();
        var a = this, ar, ai, br, bi;
        if (b.isscalar()) {               // SCALAR
            if (a.isreal()) {             // REAL
                if (b.isreal()) {         // REAL / REAL
                    a = a.getData();
                    b = b.getDataScalar();
                    for (x = 0; x < n; x++) {
                        a[x] *= b;
                    }
                } else {                  // REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    for (x = 0; x < n; x++) {
                        ai[x] = ar[x] * bi;
                        ar[x] *= br;
                    }
                }
            } else {                      // IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // IMAG / REAL
                    b = b.getDataScalar();
                    for (x = 0; x < n; x++) {
                        ar[x] *= b;
                        ai[x] *= b;
                    }
                } else {                  // IMAG / IMAG
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    for (x = 0; x < n; x++) {
                        var r = ar[x], i = ai[x];
                        ar[x] = r * br - i * bi;
                        ai[x] = r * bi + i * br;
                    }
                }
            }
        } else {                          // MATRIX
            Tools.checkSizeEquals(a.getSize(), b.getSize(), Matrix.ignoreTrailingDims);
            if (a.isreal()) {             // MATRIX: REAL
                if (b.isreal()) {         // MATRIX: REAL / REAL
                    a = a.getData();
                    b = b.getData();
                    for (x = 0; x < n; x++) {a[x] *= b[x];}
                } else {                  // MATRIX: REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        ai[x] = ar[x] * bi[x];
                        ar[x] *= br[x];
                    }
                }
            } else {                      // MATRIX: IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // MATRIX: IMAG / REAL
                    b = b.getData();
                    for (x = 0; x < n; x++) {
                        ar[x] *= b[x];
                        ai[x] *= b[x];
                    }
                } else {                  // MATRIX: IMAG / IMAG
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        var r1 = ar[x], i1 = ai[x], r2 = br[x], i2 = bi[x];
                        var t = 1 / (r2 * r2 + i2 * i2);
                        ar[x] = (r1 * r2 + i1 * i2) * t;
                        ai[x] = (i1 * r2 - r1 * i2) * t;
                    }
                }
            }
        }
        return this;
    };

    Matrix_prototype['*='] = function (b) {
        return this.times(b);
    };

    Matrix_prototype['.*'] = function (b) {
        return this.getCopy().times(b);
    };

    Matrix.times = function (A, B) {
        return A['.*'](B);
    };


    /** Rdivide operator make an element wise division,
     * The right term is the denominator.
     *
     * __Also see:__
     * {@link Matrix#minus},
     * {@link Matrix#plus},
     * {@link Matrix#rdivide},
     * {@link Matrix#ldivide}.
     *
     * @param {Number|Matrix} rightOp
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.rdivide = function (b) {
        b = Matrix.toMatrix(b);
        var x, n = this.numel(), tmp;
        var a = this, ar, ai, br, bi;
        if (b.isscalar()) {               // SCALAR
            if (a.isreal()) {             // REAL
                if (b.isreal()) {         // REAL / REAL
                    a = a.getData();
                    b = b.getDataScalar();
                    for (x = 0; x < n; x++) {
                        a[x] /= b;
                    }
                } else {                  // REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    ai.set(ar);
                    tmp = 1 / (br * br + bi * bi);
                    br = br * tmp;
                    bi = -bi * tmp;
                    for (x = 0; x < n; x++) {
                        ai[x] *= bi;
                        ar[x] *= br;
                    }
                }
            } else {                      // IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // IMAG / REAL
                    b = b.getDataScalar();
                    b = 1 / b;
                    for (x = 0; x < n; x++) {
                        ar[x] *= b;
                        ai[x] *= b;
                    }
                } else {                  // IMAG / IMAG
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    tmp = 1 / (br * br + bi * bi);
                    br *= tmp;
                    bi *= tmp;
                    for (x = 0; x < n; x++) {
                        var r = ar[x], i = ai[x];
                        ar[x] = r * br + i * bi;
                        ai[x] = i * bi - r * br;
                    }
                }
            }
        } else {                          // MATRIX
            Tools.checkSizeEquals(a.getSize(), b.getSize(), Matrix.ignoreTrailingDims);
            if (a.isreal()) {             // MATRIX: REAL
                if (b.isreal()) {         // MATRIX: REAL / REAL
                    a = a.getData();
                    b = b.getData();
                    for (x = 0; x < n; x++) {
                        a[x] /= b[x];
                    }
                } else {                  // MATRIX: REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        ai[x] = ar[x] * bi[x];
                        ar[x] *= br[x];
                    }
                }
            } else {                      // MATRIX: IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // MATRIX: IMAG / REAL
                    b = b.getData();
                    for (x = 0; x < n; x++) {
                        ar[x] /= b[x];
                        ai[x] /= b[x];
                    }
                } else {                  // MATRIX: IMAG / IMAG
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        var r1 = ar[x], i1 = ai[x], r2 = br[x], i2 = bi[x];
                        var t = 1 / (r2 * r2 + i2 * i2);
                        ar[x] = (r1 * r2 + i1 * i2) * t;
                        ai[x] = (i1 * r2 - r1 * i2) * t;
                    }
                }
            }
        }
        return this;
    };

    Matrix_prototype['/='] = function (b) {
        return this.rdivide(b);
    };

    Matrix_prototype['./'] = function (b) {
        return this.getCopy().rdivide(b);
    };

    Matrix.rdivide = function (A, B) {
        return A['./'](B);
    };


    /** Ldivide operator make an element wise division,
     * The right term is the numerator.
     *
     * __Also see:__
     * {@link Matrix#minus},
     * {@link Matrix#plus},
     * {@link Matrix#rdivide},
     * {@link Matrix#ldivide}.
     *
     * @param {Number|Matrix} rightOp
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.ldivide = function (b) {
        b = Matrix.toMatrix(b);
        var x, n = this.numel(), tmp;
        var a = this, ar, ai, br, bi;
        if (b.isscalar()) {               // SCALAR
            if (a.isreal()) {             // REAL
                if (b.isreal()) {         // REAL / REAL
                    a = a.getData();
                    b = b.getDataScalar();
                    for (x = 0; x < n; x++) {
                        a[x] = b / a[x];
                    }
                } else {                  // REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    for (x = 0; x < n; x++) {
                        ai[x] = bi / ar[x];
                        ar[x] = br / ar[x];
                    }
                }
            } else {                      // IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // IMAG / REAL
                    b = b.getDataScalar();
                    for (x = 0; x < n; x++) {
                        tmp = 1 / (ar[x] * ar[x] + ai[x] * ai[x]);
                        ai[x] = bi * tmp;
                        ar[x] = br * tmp;
                    }
                } else {                  // IMAG / IMAG
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    for (x = 0; x < n; x++) {
                        var r = br[x], i = bi[x];
                        ar[x] = r * ar + i * ai;
                        ai[x] = i * ai - r * ar;
                    }
                }
            }
        } else {                          // MATRIX
            Tools.checkSizeEquals(a.getSize(), b.getSize(), Matrix.ignoreTrailingDims);
            if (a.isreal()) {             // MATRIX: REAL
                if (b.isreal()) {         // MATRIX: REAL / REAL
                    a = a.getData();
                    b = b.getData();
                    for (x = 0; x < n; x++) {
                        a[x] = b[x] / a[x];
                    }
                } else {                  // MATRIX: REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        ai[x] = bi[x] / ar[x];
                        ar[x] = br[x] / ar[x];
                    }
                }
            } else {                      // MATRIX: IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // MATRIX: IMAG / REAL
                    b = b.getData();
                    for (x = 0; x < n; x++) {
                        tmp = 1 / (ar[x] * ar[x] + ai[x] * ai[x]);
                        ai[x] = bi[x] * tmp;
                        ar[x] = br[x] * tmp;
                    }
                } else {                  // MATRIX: IMAG / IMAG
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        var r1 = br[x], i1 = bi[x], r2 = ar[x], i2 = ai[x];
                        var t = 1 / (r2 * r2 + i2 * i2);
                        ar[x] = (r1 * r2 + i1 * i2) * t;
                        ai[x] = (i1 * r2 - r1 * i2) * t;
                    }
                }
            }
        }
        return this;
    };

    Matrix_prototype['\\='] = function (b) {
        return this.ldivide(b);
    };

    Matrix_prototype['.\\'] = function (b) {
        return this.getCopy().ldivide(b);
    };

    Matrix.ldivide = function (A, B) {
        return A['.\\'](B);
    };


    /** Ldivide operator make an element wise power operation,
     *
     * __Also see:__
     * {@link Matrix#minus},
     * {@link Matrix#plus},
     * {@link Matrix#rdivide},
     * {@link Matrix#ldivide}.
     *
     * @param {Number|Matrix} rightOp
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.power = function (b) {
        b = Matrix.toMatrix(b);
        var x, n = this.numel();
        var a = this, ar, ai, br, bi, rb, tb;
        var pow = Math.pow, sqrt = Math.sqrt, cos = Math.cos, sin = Math.sin, atan2 = Math.atan2;
        if (b.isscalar()) {               // SCALAR
            if (a.isreal()) {             // REAL
                if (b.isreal()) {         // REAL / REAL
                    a = a.getData();
                    b = b.getDataScalar();
                    for (x = 0; x < n; x++) {
                        a[x] = pow(a[x], b);
                    }
                } else {                  // REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    for (x = 0; x < n; x++) {
                        throw new Error('Matrix.power: This function has not been implemented yet for complex number.');
                    }
                }
            } else {                      // IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // IMAG / REAL
                    b = b.getDataScalar();
                    for (x = 0; x < n; x++) {
                        rb = pow(sqrt(ar[x] * ar[x] + ai[x] * ai[x]), b);
                        tb = b * atan2(ai[x], ar[x]);
                        ar[x] = rb * cos(tb);
                        ai[x] = rb * sin(tb);
                    }
                } else {                  // IMAG / IMAG
                    br = b.getRealData()[0];
                    bi = b.getImagData()[0];
                    for (x = 0; x < n; x++) {
                        throw new Error('Matrix.power: This function has not been implemented yet for complex number.');
                    }
                }
            }
        } else {                          // MATRIX
            Tools.checkSizeEquals(a.getSize(), b.getSize(), Matrix.ignoreTrailingDims);
            if (a.isreal()) {             // MATRIX: REAL
                if (b.isreal()) {         // MATRIX: REAL / REAL
                    a = a.getData();
                    b = b.getData();
                    for (x = 0; x < n; x++) {
                        a[x] = pow(a[x], b[x]);
                    }
                } else {                  // MATRIX: REAL / IMAG
                    a.toComplex();
                    ar = a.getRealData();
                    ai = a.getImagData();
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        throw new Error('Matrix.power: This function has not been implemented yet for complex number.');
                    }
                }
            } else {                      // MATRIX: IMAG
                ar = a.getRealData();
                ai = a.getImagData();
                if (b.isreal()) {         // MATRIX: IMAG / REAL
                    b = b.getData();
                    for (x = 0; x < n; x++) {
                        rb = pow(sqrt(ar[x] * ar[x] + ai[x] * ai[x]), b[x]);
                        tb = b[x] * atan2(ai[x], ar[x]);
                        ar[x] = rb * cos(tb);
                        ai[x] = rb * sin(tb);
                    }
                } else {                  // MATRIX: IMAG / IMAG
                    br = b.getRealData();
                    bi = b.getImagData();
                    for (x = 0; x < n; x++) {
                        throw new Error('Matrix.power: This function has not been implemented yet for complex number.');
                    }
                }
            }
        }
        return this;
    };

    Matrix_prototype['.^'] = function (b) {
        return this.getCopy().power(b);
    };

    Matrix.power = function (A, B) {
        return A['.^'](B);
    };


    //////////////////////////////////////////////////////////////////
    //                        Other operators                       //
    //////////////////////////////////////////////////////////////////

 
    /** Apply a function to values of Matrix.
     *
     * @param {Function} f
     *  Function to apply to Array elements.
     *
     * @chainable
     * @todo This function should provide a way to deal with complex
     * @matlike
     * @method arrayfun
     */
    (function (Matrix_prototype) {
        var apply_real = function(data, f) {
            var i, ie;
            for (i = 0, ie = data.length; i < ie; i++) {
                data[i] = f(data[i]);
            }
        };

        Matrix_prototype.arrayfun = function (fct) {
            if (!this.isreal()) {
                throw new Error("Matrix.arrayfun: This function doesn't " +
                                "work with complex numbers.");
            }
            if (typeof fct !== 'function') {
                throw new Error('Matrix.arrayfun: Argument must be a function.');
            }
            apply_real(this.getData(), fct.bind(this));
            return this;
        };

    })(Matrix_prototype);

    /** Transpose operator transposed a 2D matrix.
     *
     * @return {Matrix}
     * @matlike
     */
    Matrix_prototype.transpose = function () {
        if (!this.ismatrix()) {
            throw new Error('Matrix.transpose: ' +
                            'Transposition is only defined for matrix.');
        }
        var v = this.getView().swapDimensions(0, 1);
        return this.extractViewFrom(v);
    };

    /** Complex conjugate transposition operator.
     *
     * @return {Matrix}
     * @matlike
     */
    Matrix_prototype.ctranspose = function () {
        return this.transpose().conj();
    };

    /** Compute the p-norm of the Matrix
     * (the sum of all elements at power p).
     *
     * @param {Integer} power
     *
     * @return {Number} result
     *
     * @chainable
     * @matlike
     * @method norm
     */
    (function (Matrix_prototype) {

        var l1 = function (xd, n) {
            for (var i = 0, norm = 0.0; i < n; i++) {
                var tmp = xd[i];
                norm += tmp > 0 ? tmp : -tmp;
            }
            return norm;
        };
        var l2 = function (xd, n) {
            for (var i = 0, norm = 0.0; i < n; i++) {
                var tmp = xd[i];
                norm += tmp * tmp;
            }
            return norm;
        };
        var lp = function (xd, n, p) {
            var pow = Math.pow, abs = Math.abs;
            for (var i = 0, norm = 0.0; i < n; i++) {
                norm += pow(abs(xd[i]), p);
            }
            return norm;
        };

        Matrix_prototype.norm = function (p) {
            if (p === undefined) {
                p = 2;
            } else if (!Tools.isNumber(p)) {
                throw new Error('Matrix.norm: Argument p must be a number.');
            }
            var xd = this.getData(), n = xd.length;
            var norm;
            if (p === 1) {
                norm = l1(xd, n);
            } else if (p === 2) {
                norm = l2(xd, n);
            } else {
                norm = lp(xd, n, p);
            }
            return Math.pow(norm, 1 / p);
        };

    })(Matrix_prototype);

    /** Return a the upper part of the Matrix.
     * The lower part is set to zero.
     *
     * @param {Integer} shift
     *  Define diagonal separing the upper from
     *  the lower part of the Matrix.
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.triu = function (shift) {
        if (shift === undefined) {
            shift = 0;
        }
        var view = this.getView();
        var dn = view.getStep(1), m = view.getSize(0), n = view.getSize(1);

        var k, _k, lk, elk;

        if (this.isreal()) {
            var ud = this.getData();
            for (k = 0, _k = 0; k < n; _k += dn, k++) {
                for (lk = _k + k + 1 - shift, elk = _k + m; lk < elk; lk++) {
                    ud[lk] = 0;
                }
            }
        } else {
            var urd = this.getRealData(), uid = this.getImagData();
            for (k = 0, _k = 0; k < n; _k += dn, k++) {
                for (lk = _k + k + 1 - shift, elk = _k + m; lk < elk; lk++) {
                    urd[lk] = 0;
                    uid[lk] = 0;
                }
            }
        }
        return this;
    };

    /** Return a the lower part of the Matrix.
     * The upper part is set to zero.
     *
     * See also:
     *  {@link Matrix#tril},
     *  {@link Matrix#diag}.
     *
     * @param {Integer} shift
     *  Define diagonal separing the upper from
     *  the lower part of the Matrix.
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.tril = function (shift) {
        var L = this.getCopy();
        if (shift === undefined) {
            shift = 0;
        }
        var view = L.getView();
        var dn = view.getStep(1), m = view.getSize(0), n = view.getSize(1);

        var k, _k, lk, elk, s;
        s = Math.min(m, n);

        if (this.isreal()) {
            var ld = L.getData();
            for (k = 0, _k = 0; k < n; _k += dn, k++) {
                for (lk = _k, elk = _k + k - shift; lk < elk; lk++) {
                    ld[lk] = 0;
                }
            }
        } else {
            var lrd = L.getRealData(), lid = L.getImagData();
            for (k = 0, _k = 0; k < n; _k += dn, k++) {
                for (lk = _k, elk = _k + k - shift; lk < elk; lk++) {
                    lrd[lk] = 0;
                    lid[lk] = 0;
                }
            }
        }
        return L;
    };

    /** Return a vector containing the diagonal elements.
     *
     * See also:
     * {@link Matrix#triu},
     * {@link Matrix#tril}.
     *
     * @param {Integer} shift
     *  Define diagonal to be copied.
     *
     * @matlike
     *
     * @todo
     * This function should return a Matrix if a vector is given as input.
     */
    Matrix_prototype.diag = function (shift) {
        if (shift === undefined) {
            shift = 0;
        }
        var view = this.getView();
        var dm = view.getStep(0), m = view.getSize(0);
        var dn = view.getStep(1), n = view.getSize(1);

        var f, s;
        if (shift > 0) {
            shift = Math.abs(shift);
            f = dn;
            s = Math.min(m, n - shift);
        } else {
            shift = Math.abs(shift);
            f = dm;
            s = Math.min(m - shift, n);
        }
        if (s <= 0) {
            throw new Error("Matrix.diag: Invalid diagonal requirement.");
        }
        var D = new Matrix([1, s], this.type(), !this.isreal());
        var k, lk;

        var step = dn + dm;
        lk = shift * f;
        if (this.isreal()) {
            var ud = this.getData();
            var dd = D.getData();
            for (k = 0; k < s; k++, lk += step) {
                dd[k] = ud[lk];
            }
        } else {
            var urd = this.getRealData(), uid = this.getImagData();
            var drd = D.getRealData(), did = D.getImagData();
            for (k = 0; k < s; k++, lk += step) {
                drd[k] = urd[lk];
                did[k] = uid[lk];
            }
        }
        return D;
    };

    /* Apply a function on two Matrix by extending the non-singleton 
     * dimensions.
     *
     * @param {Function|String} fun
     *  Function to be applied. If string, it should be either:
     *  - "plus", "minus", "times", "rdivide", "ldivide", 
     *  - "min", "max"
     *  - "atan2", "hypot"
     *  - "eq", "ne", "lt", "le", "gt", "ge", "and", "or"
     *
     * @param {Matrix} A
     *  First Matrix
     *
     * @param {Matrix} B
     *  Second Matrix
     *
     * @matlike
     */
    Matrix.bsxfun = function (fun, a, b) {
        a = Matrix.toMatrix(a);
        b = Matrix.toMatrix(b);
        if (!a.isreal() || !b.isreal()) {
            throw new Error("Matrix.bsxfun: This function doesn't " +
                            "work with complex numbers.");
        }
        
        var aView = a.getView(), bView = b.getView();
        
        var i, ei = Math.max(aView.ndims(), bView.ndims());
        for (i = 0; i < ei; i++) {
            var asize = a.getSize(i), bsize = b.getSize(i);
            if (asize === 1 && bsize > 1) {
                aView.selectIndicesDimension(i, new Uint8Array(bsize));
            } else if (bsize === 1 && asize > 1) {
                bView.selectIndicesDimension(i, new Uint8Array(asize));
            } else if (bsize !== asize) {
                throw new Error("Matrix.bsxfun: Incompatiblity on dimension: " + i);
            }
        }
        var out = Matrix.zeros(aView.getSize());
        var od = out.getData(), ad = a.getData(), bd = b.getData();
        var aiterator = aView.getIterator(0), biterator = bView.getIterator(0);
        var ait = aiterator.iterator, ab = aiterator.begin, e = aiterator.isEnd;
        var bit = biterator.iterator, bb = biterator.begin;
        var io, ia, ib;

        if (fun instanceof Function) {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = fun(ad[ia], bd[ib]);
            }
        } else if (fun === "plus") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] + bd[ib];
            }
        } else if (fun === "minus") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] - bd[ib];
            }
        } else if (fun === "times") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] * bd[ib];
            }
        } else if (fun === "rdivide") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] / bd[ib];
            }
        } else if (fun === "ldivide") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = bd[ib] / ad[ia];
            }
        } else if (fun === "min") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = bd[ib] > ad[ia] ? ad[ia] : bd[ib];
            }
        } else if (fun === "power") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = Math.pow(ad[ia], bd[ib]);
            }
        } else if (fun === "hypot") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = Math.sqrt(bd[ib] * bd[ib] + ad[ia] * ad[ia]);
            }
        } else if (fun === "atan2") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = Math.atan2(ad[ia], bd[ib]);
            }
        } else if (fun === "eq") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] === bd[ib] ? 1 : 0;
            }
        } else if (fun === "ne") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] !== bd[ib] ? 1 : 0;
            }
        } else if (fun === "lt") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] < bd[ib] ? 1 : 0;
            }
        } else if (fun === "le") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] <= bd[ib] ? 1 : 0;
            }
        } else if (fun === "gt") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] > bd[ib] ? 1 : 0;
            }
        } else if (fun === "ge") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] >= bd[ib] ? 1 : 0;
            }
        } else if (fun === "and") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] && bd[ib] ? 1 : 0;
            }
        } else if (fun === "or") {
            for (ia = ab(), ib = bb(), io = 0; !e(); ia = ait(), ib = bit(), io++) {
                od[io] = ad[ia] || bd[ib] ? 1 : 0;
            }
        } else {
            throw new Error("Matrix.bsxfun: Wrong function argument.");
        }
        return out;
    };

})(Matrix, Matrix.prototype);





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

/** @class Matrix */
(function (global) {
    "use strict";

    /** This object provides tools for colorspace conversion.
     * It works on array storing color information in different ways.
     * the way they are stored is specified by three parameters: 
     *
     * + `sc` specify the space between 2 channels for the same pixel position,
     * + `sp` specify the space between 2 pixels for the same channel,
     * + `N` specify the number of pixels.
     *
     * For instance they can be stored as :
     *
     * + RGBRGB...RGB, `sc = 1, sp = 3` (default)
     * + RGBARGBA...RGBA, `sc = 1, sp = 4`
     * + RRR...GGG...BBB, `sc = N, sp = 1`
     * + RRR...GGG...BBB...AAA, `sc = N, sp = 1`
     *
     * Despite that these functions are designed for work on images, 
     * they can be used to work with every kind of data.
     *
     * **Warning:** The data are always converted on place.
     * 
     * @class Matrix.Colorspaces
     * @singleton 
     */
    var CS = {
        /** Apply a 3x3 matrix to the color.
         */
        "matrix": function (color, mat, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var m00 = mat[0], m01 = mat[3], m02 = mat[6];
            var m10 = mat[1], m11 = mat[4], m12 = mat[7];
            var m20 = mat[2], m21 = mat[5], m22 = mat[8];
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                color[r] = m00 * R + m01 * G + m02 * B;
                color[g] = m10 * R + m11 * G + m12 * B;
                color[b] = m20 * R + m21 * G + m22 * B;
            }
            return color;
        },
        "RGB to RGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                // Do something with RGB values
                color[r] = R;
                color[g] = G;
                color[b] = B;
            }
            return color;
        },
        /** Conversion function.
         */
        "applyFunctionRGB": function (color, fun, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var c = fun(color[r], color[g], color[b]);
                color[r] = c[0];
                color[g] = c[1];
                color[b] = c[2];
            }
            return color;
        },
        /** Conversion function.
         */
        "applyFunctionColor": function (color, fun, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                var c = fun([R, G, B]);
                color[r] = c[0];
                color[g] = c[1];
                color[b] = c[2];
            }
            return color;
        },
        /** Conversion function.
         */
        "RGB to GRAY": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                var gray = 0.2989 * R + 0.5870 * G + 0.1140 * B;
                color[r] = gray;
                color[g] = gray;
                color[b] = gray;
            }
            return color;
        },
        /** Conversion function.
         */
        "RGB to HSV":  function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var I6 = 1 / 6;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                var v = (R > G ? R : G) > B ? (R > G ? R : G) : B;
                var s = v - ((R < G ? R : G) < B ? (R < G ? R : G) : B), h = 0;
                if (s !== 0) {
                    if (v === R) {
                        h = ((G - B) / s) * I6;
                    } else if (v === G) {
                        h = (2 + (B - R) / s) * I6;
                    } else if (v === B) {
                        h = (4 + (R - G) / s) * I6;
                    }
                    if (h < 0) {
                        h += 1;
                    }
                    if (v !== 0) {
                        s /= v;
                    }
                }
                color[r] = h;
                color[g] = s;
                color[b] = v;
            }
            return color;
        },
        /** Conversion function.
         */
        "HSV to RGB":  function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var H = color[r], S = color[g], V = color[b];
                var t = (H * 6 | 0) % 6;
                var f = H * 6 - t;
                var l = V * (1 - S);
                var m = V * (1 - f * S);
                var n = V * (1 - (1 - f) * S);
                switch (t) {
                case 0:
                    color[r] = V;
                    color[g] = n;
                    color[b] = l;
                    break;
                case 1:
                    color[r] = m;
                    color[g] = V;
                    color[b] = l;
                    break;
                case 2:
                    color[r] = l;
                    color[g] = V;
                    color[b] = n;
                    break;
                case 3:
                    color[r] = l;
                    color[g] = m;
                    color[b] = V;
                    break;
                case 4:
                    color[r] = n;
                    color[g] = l;
                    color[b] = V;
                    break;
                case 5:
                    color[r] = V;
                    color[g] = l;
                    color[b] = m;
                    break;
                }
            }
            return color;
        },
        /** Conversion function.
         */
        "RGB to HSL":  function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var SQRT3 = Math.sqrt(3), IPI2 = 1 / (2 * Math.PI), I3 = 1 / 3;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                var h = Math.atan2(SQRT3 * (G - B), 2 * R - G - B) * IPI2;
                color[r] = h < 0 ? (h + 1) : h;
                var M = (R > G ? R : G) > B ? (R > G ? R : G) : B;
                var m = (R < G ? R : G) < B ? (R < G ? R : G) : B;
                color[g] = M - m;
                color[b] = (R + G + B) * I3;
            }
            return color;
        },
        /** Conversion function.
         */
        "HSL to RGB":  function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var PI = Math.PI, PIMI3 = PI / 3, PI2 = PI * 2, PIM2I3 = 2 * PI / 3;
            var I3 = 1 / 3;
            var SQRT3I2 = Math.sqrt(3) / 2, ISQRT3 = 1 / Math.sqrt(3);
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var H = color[r], S = color[g], L = color[b];
                var h = H * PI2;
                var hstar = h;
                while (hstar > PIMI3) {
                    hstar -= PIMI3;
                }
                var c = SQRT3I2 * S / Math.sin(PIM2I3 - hstar);
                var c1 = c * Math.cos(h) * I3, c2 = c * Math.sin(h) * ISQRT3;
                color[r] = L + c1 * 2;
                color[g] = L - c1 + c2;
                color[b] = L - c1 - c2;
            }
            return color;
        },
        /** Conversion function.
         * @todo 
         * Normalize values between [0, 1] in HSI conversion.
         */
        "RGB to HSI": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var ISQRT3 = 1 / Math.sqrt(3), ISQRT2 = 1 / Math.sqrt(2), ISQRT6 = 1 / Math.sqrt(6);
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                var O2 = (G - B) * ISQRT2;
                var O3 = (2 * R - G - B) * ISQRT6;
                color[r] = Math.atan2(O2, O3);
                color[g] = Math.sqrt(O2 * O2 + O3 * O3);
                color[b] = (R + G + B) * ISQRT3;
            }
            return color;
        },
        /** Conversion function.
         * @todo 
         * Normalize values between [0, 1] in HSI conversion.
         */
        "HSI to RGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var SQRT3 = Math.sqrt(3), SQRT2 = Math.sqrt(2), SQRT6 = Math.sqrt(6);
            var I6 = 1 / 6, I3 = 1 / 3;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var H = color[r], S = color[g], O1 = color[b];
                var O2 = S * Math.sin(H);
                var O3 = S * Math.cos(H);
                var c1 = O1 * SQRT3, c2 = O2 * SQRT2, c3 = O3 * SQRT6;
                var R = (c1 + c3) * I3;
                var G = (2 * c1 + 3 * c2 - c3) * I6;
                var B = (2 * c1 - 3 * c2 - c3) * I6;
                color[r] = R;
                color[g] = G;
                color[b] = B;
            }
            return color;
        },
        /** Conversion function.
         */
        "LinearRGB to sRGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var a = 0.055, I2D4 = 1 / 2.4;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                color[r] = (R > 0.0031308) ? (1.055 * Math.pow(R, I2D4) - a) : (R * 12.92);
                color[g] = (G > 0.0031308) ? (1.055 * Math.pow(G, I2D4) - a) : (G * 12.92);
                color[b] = (B > 0.0031308) ? (1.055 * Math.pow(B, I2D4) - a) : (B * 12.92);
            }
            return color;
        },
        /** Conversion function.
         */
        "sRGB to LinearRGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var I12D92 = 1 / 12.92, a = 0.055, I1PA = 1 / 1.055;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var sR = color[r], sG = color[g], sB = color[b];
                color[r] = sR > 0.04045 ? Math.pow((sR + a) * I1PA, 2.4) : sR * I12D92;
                color[g] = sG > 0.04045 ? Math.pow((sG + a) * I1PA, 2.4) : sG * I12D92;
                color[b] = sB > 0.04045 ? Math.pow((sB + a) * I1PA, 2.4) : sB * I12D92;
            }
            return color;
        },
        /** Conversion function.
         */
        "RGB to CMY":  function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                color[r] = 1 - color[r];
                color[g] = 1 - color[g];
                color[b] = 1 - color[b];
            }
            return color;
        },
        /** Conversion function.
         */
        "CMY to RGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                color[r] = 1 - color[r];
                color[g] = 1 - color[g];
                color[b] = 1 - color[b];
            }
            return color;
        },
        /** Conversion function.
         */
        "RGB to Opponent": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var ISQRT3 = 1 / Math.sqrt(3), ISQRT2 = 1 / Math.sqrt(2), ISQRT6 = 1 / Math.sqrt(6);
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                color[r] = (R + G + B) * ISQRT3;
                color[g] = (R - G) * ISQRT2;
                color[b] = (R + G - 2 * B) * ISQRT6;
            }
            return color;
        },
        /** Conversion function.
         */
        "Opponent to RGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var SQRT3 = Math.sqrt(3), SQRT2 = Math.sqrt(2), SQRT6 = Math.sqrt(6);
            var I6 = 1 / 6, I3 = 1 / 3;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var O1 = color[r], O2 = color[g], O3 = color[b];
                var c1 = O1 * SQRT3, c2 = O2 * SQRT2, c3 = O3 * SQRT6;
                color[r] = (2 * c1 + 3 * c2 + c3) * I6;
                color[g] = (2 * c1 - 3 * c2 + c3) * I6;
                color[b] = (c1 - c3) * I3;
            }
            return color;
        },
        /** Conversion function.
         */
        "RGB to Ohta": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var ISQRT3 = 1 / Math.sqrt(3), ISQRT2 = 1 / Math.sqrt(2), ISQRT6 = 1 / Math.sqrt(6);
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                color[r] = (R + G + B) * ISQRT3;
                color[g] = (R - B) * ISQRT2;
                color[b] = (-R + 2 * G - B) * ISQRT6;
            }
            return color;
        },
        /** Conversion function.
         */
        "Ohta to RGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var SQRT3 = Math.sqrt(3), SQRT2 = Math.sqrt(2), SQRT6 = Math.sqrt(6);
            var I6 = 1 / 6, I3 = 1 / 3;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var O1 = color[r], O2 = color[g], O3 = color[b];
                var c1 = O1 * SQRT3, c2 = O2 * SQRT2, c3 = O3 * SQRT6;
                color[g] = (c1 + c3) * I3;
                color[r] = (2 * c1 + 3 * c2 - c3) * I6;
                color[b] = (2 * c1 - 3 * c2 - c3) * I6;
            }
            return color;
        },
        /** Conversion function.
         */
        "LinearRGB to rgY": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], B = color[b];
                var Y = R + G + B;
                if (Y > 0) {
                    var iY = 1 / Y;
                    color[r] = R * iY ;
                    color[g] = G * iY;
                    color[b] = Y;
                } else {
                    color[r] = 1 / 3;
                    color[g] = 1 / 3;
                    color[b] = 0;
                }
            }
            return color;
        },
        /** Conversion function.
         */
        "rgY to LinearRGB": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var R = color[r], G = color[g], Y = color[b];
                color[r] = R * Y;
                color[g] = G * Y;
                color[b] = (1 - R - G) * Y;
            }
            return color;
        },

        // CIE colorspace
        /** Conversion function.
         * @private
         */
        getXYZTransform: function (inverse, illuminant, primaries) {
            illuminant = illuminant || [0.31271, 0.32902, 1]; // D65 xyY
            primaries = primaries || [0.64, 0.33, 1, 0.30, 0.60, 1, 0.15, 0.06, 1]; // sRGB xyY
            // White Point conversion
            var XYZWP = CS["xyY to XYZ"](illuminant);
            XYZWP = Matrix.toMatrix(XYZWP);
            
            // Primaries conversion
            var primaries = CS["xyY to XYZ"](primaries, 3);
            primaries = new Matrix([3, 3], primaries);
            
            var S = Matrix.diag(primaries.inv().mtimes(XYZWP));
            
            var XYZMat = primaries.mtimes(S);
            return inverse ? XYZMat.inv() : XYZMat;
        },
        /** Conversion function.
         */
        "LinearRGB to XYZ": function (color, N, sc, sp, wp, prim) {
            var mat = CS.getXYZTransform(false, wp, prim).getData();
            CS.matrix(color, mat, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        "XYZ to LinearRGB": function (color, N, sc, sp, wp, prim) {
            var mat = CS.getXYZTransform(true, wp, prim).getData();
            CS.matrix(color, mat, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        "XYZ to Lab": function (color, N, sc, sp, wp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;

            wp = wp || [0.31271, 0.32902, 1];
            var x = wp[0], y = wp[1], Yn = wp[2];
            var Xn = x * Yn / y;
            var Zn = (1 - x - y) * Yn / y;
            var IXn = 1 / Xn, IYn = 1 / Yn, IZn = 1 / Zn;

            var I3 = 1 / 3, I116M16 = 16 / 116;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var X = color[r], Y = color[g], Z = color[b];
                var c1 = X  * IXn;
                if (c1 > 0.008856) {
                    c1 = Math.pow(c1, I3);
                } else {
                    c1 = 7.787 * c1 + I116M16;
                }
                var c2 = Y * IYn;
                if (c2 > 0.008856) {
                    c2 = Math.pow(c2, I3);
                } else {
                    c2 = 7.787 * c2 + I116M16;
                }
                var c3 = Z  * IZn;
                if (c3 > 0.008856) {
                    c3 = Math.pow(c3, I3);
                } else {
                    c3 = 7.787 * c3 + I116M16;
                }

                color[r] = 116 * c2 - 16;
                color[g] = 500 * (c1 - c2);
                color[b] = 200 * (c2 - c3);
            }
            return color;
        },
        /** Conversion function.
         */
        "Lab to XYZ": function (color, N, sc, sp, wp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;

            wp = wp || [0.31271, 0.32902, 1];
            var x = wp[0], y = wp[1], Yn = wp[2];
            var Xn = x * Yn / y;
            var Zn = (1 - x - y) * Yn / y;

            var CST1 = Math.pow(0.008856, 1 / 3), CST2 = 1 / 7.787;
            var I116 = 1 / 116, I500 = 1 / 500, I200 = 1 / 200;
            var I116M16 = 16 / 116;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var L = color[r], as = color[g], bs = color[b];
                var YTmp = (L  + 16) * I116;
                var XTmp = YTmp + as  * I500;
                var ZTmp = YTmp - bs  * I200;
                if (YTmp > CST1) {
                    YTmp = Math.pow(YTmp, 3);
                } else {
                    YTmp = (YTmp - I116M16) * CST2;
                }
                if (XTmp > CST1) {
                    XTmp = Math.pow(XTmp, 3);
                } else {
                    XTmp = (XTmp - I116M16) * CST2;
                }
                if (ZTmp > CST1) {
                    ZTmp = Math.pow(ZTmp, 3);
                } else {
                    ZTmp = (ZTmp - I116M16) * CST2;
                }

                color[r] = XTmp * Xn;
                color[g] = YTmp * Yn;
                color[b] = ZTmp * Zn;
            }
            return color;
        },
        /** Conversion function.
         */
        "XYZ to Luv": function (color, N, sc, sp, wp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;

            wp = wp || [0.31271, 0.32902, 1];
            var x = wp[0], y = wp[1], Yn = wp[2];
            var Xn = x * Yn / y;
            var Zn = (1 - x - y) * Yn / y;
            var IYn = 1 / Yn;
            var un = 4 * Xn / (Xn + 15 * Yn + 3 * Zn);
            var vn = 9 * Yn / (Xn + 15 * Yn + 3 * Zn);

            var I3 = 1 / 3;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var X = color[r], Y = color[g], Z = color[b];
                var LTmp = Y * IYn;

                if (LTmp > 0.008856) {
                    LTmp = 116 * Math.pow(LTmp, I3) - 16;
                } else {
                    LTmp *= 903.3;
                }

                var tmp = 1 / (X + 15 * Y + 3 * Z);
                tmp = isFinite(tmp) ? tmp : 0;
                var uTmp = 4 * tmp * X;
                var vTmp = 9 * tmp * Y;

                tmp = 13 * LTmp;
                color[r] = LTmp;
                color[g] = tmp * (uTmp - un);
                color[b] = tmp * (vTmp - vn);
            }
            return color;
        },
        /** Conversion function.
         */
        "Luv to XYZ": function (color, N, sc, sp, wp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;

            wp = wp || [0.31271, 0.32902, 1];
            var x = wp[0], y = wp[1], Yn = wp[2];
            var Xn = x * Yn / y;
            var Zn = (1 - x - y) * Yn / y;
            var un = 4 * Xn / (Xn + 15 * Yn + 3 * Zn);
            var vn = 9 * Yn / (Xn + 15 * Yn + 3 * Zn);

            var CST1 = Math.pow(0.008856, 1 / 3), CST2 = 1 / 7.787;
            var I116 = 1 / 116, I116M16 = 16 / 116;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var L = color[r], u = color[g], v = color[b];
                var YTmp = (L + 16) * I116;
                if (YTmp > CST1) {
                    YTmp = Math.pow(YTmp, 3);
                } else {
                    YTmp = (YTmp - I116M16) * CST2;
                }
                var tmp = 1 / (13 * L);
                tmp = isFinite(tmp) ? tmp : 0;
                var uTmp = u * tmp + un;
                var vTmp = v * tmp + vn;
                tmp = YTmp / (4 * vTmp);

                color[r] = 9 * uTmp * tmp;
                color[g] = YTmp;
                color[b] = (12 - 3 * uTmp - 20 * vTmp) * tmp;
            }
            return color;
        },
        /** Conversion function.
         */
        'Lab to Lch': function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var IPI2 = 1 / (2 * Math.PI);
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var L = color[r], au = color[g], bv = color[b];
                var hTmp = Math.atan2(bv, au) * IPI2;
                color[r] = L;
                color[g] = Math.sqrt(au * au + bv * bv);
                color[b] = hTmp < 0 ? hTmp + 1 : hTmp;
            }
            return color;
        },
        /** Conversion function.
         */
        'Lch to Lab': function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var PI2 = Math.PI * 2;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var L = color[r], c = color[g], h = color[b];
                var hTmp = h * PI2;
                var auTmp = Math.cos(hTmp) * c;
                var bvTMP = Math.sin(hTmp) * c;
                color[r] = L;
                color[g] = auTmp;
                color[b] = bvTMP;
            }
            return color;
        },
        // CIE function combinations
        /** Conversion function.
         */
        "RGB to XYZ": function (color, N, sc, sp) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        "XYZ to RGB": function (color, N, sc, sp) {
            CS['XYZ to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        "RGB to Lab": function (color, N, sc, sp, wp) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp, wp);
            CS['XYZ to Lab'](color, N, sc, sp, wp);
            return color;
        },
        /** Conversion function.
         */
        "Lab to RGB": function (color, N, sc, sp) {
            CS['Lab to XYZ'](color, N, sc, sp);
            CS['XYZ to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'RGB to Luv': function (color, N, sc, sp, wp) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp);
            CS['XYZ to Luv'](color, N, sc, sp, wp);
            return color;
        },
        /** Conversion function.
         */
        'Luv to RGB': function (color, N, sc, sp, wp) {
            CS['Luv to XYZ'](color, N, sc, sp, wp);
            CS['XYZ to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'RGB to Lch': function (color, N, sc, sp, wp) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp);
            CS['XYZ to Lab'](color, N, sc, sp, wp);
            CS['Lab to Lch'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'Lch to RGB': function (color, N, sc, sp, wp) {
            CS['Lch to Lab'](color, N, sc, sp);
            CS['Lab to XYZ'](color, N, sc, sp, wp);
            CS['XYZ to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        },

        // Chromaticity spaces
        /** Conversion function.
         */
        "XYZ to xyY": function (color, N, sc, sp, wp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;

            wp = wp || [0.31271, 0.32902, 1];
            var xn = wp[0], yn = wp[1];

            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var X = color[r], Y = color[g], Z = color[b];
                var IL = 1 / (X + Y + Z);
                if (isFinite(IL)) {
                    color[r] = X * IL;
                    color[g] = Y * IL;
                    color[b] = Y;
                } else {
                    color[r] = xn;
                    color[g] = yn;
                    color[b] = 0;
                }
            }
            return color;
        },
        /** Conversion function.
         */
        "xyY to XYZ": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var x = color[r], y = color[g], Y = color[b];
                var tmp = Y / y;
                color[r] = x * tmp;
                color[g] = Y;
                color[b] = (1 - x - y) * tmp;
            }
            return color;
        },
        /** Conversion function.
         */
        "XYZ to 1960 uvY": function (color, N, sc, sp, wp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;

            wp = wp || [0.31271, 0.32902, 1];
            var x = wp[0], y = wp[1], Yn = wp[2];
            var Xn = x * Yn / y, Zn = (1 - x - y) * Yn / y;
            var un = 4 * Xn / (Xn + 15 * Yn + 3 * Zn);
            var vn1 = 6 * Yn / (Xn + 15 * Yn + 3 * Zn);

            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var X = color[r], Y = color[g], Z = color[b];
                if (Y === 0) {
                    color[r] = un;
                    color[g] = vn1;
                    color[b] = 0;
                } else {
                    var IL = 1 / (X + 15 * Y + 3 * Z);
                    color[r] = 4 * X * IL;
                    color[g] = 6 * Y * IL;
                    color[b] = Y;
                }
            }
            return color;
        },
        /** Conversion function.
         */
        "1960 uvY to XYZ": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var I4M6 = 6 / 4, I3 = 1 / 3;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var u = color[r], v = color[g], Y = color[b];
                var iv = 1 / v;
                var X = I4M6 * Y * u * iv;
                color[r] = X;
                color[g] = Y;
                color[b] = (6 * Y * iv - X - 15 * Y) * I3;
            }
            return color;
        },
        /** Conversion function.
         */
        "XYZ to 1976 u'v'Y": function (color, N, sc, sp, wp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;

            wp = wp || [0.31271, 0.32902, 1];
            var x = wp[0], y = wp[1], Yn = wp[2];
            var Xn = x * Yn / y, Zn = (1 - x - y) * Yn / y;
            var un = 4 * Xn / (Xn + 15 * Yn + 3 * Zn);
            var vn = 9 * Yn / (Xn + 15 * Yn + 3 * Zn);

            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var X = color[r], Y = color[g], Z = color[b];
                if (Y === 0) {
                    color[r] = un;
                    color[g] = vn;
                    color[b] = 0;
                } else {
                    var iL = 1 / (X + 15 * Y + 3 * Z);
                    color[r] = 4 * X * iL;
                    color[g] = 9 * Y * iL;
                    color[b] = Y;
                }
            }
            return color;
        },
        /** Conversion function.
         */
        "1976 u'v'Y to XYZ": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            var I4M9 = 9 / 4, I3 = 1 / 3;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var u = color[r], v = color[g], Y = color[b];
                var iv = 1/ v;
                var X = I4M9 * Y * u  * iv;
                color[r] = X;
                color[g] = Y;
                color[b] = (9 * Y * iv - X - 15 * Y) * I3;
            }
            return color;
        },
        /** Conversion function.
         */
        "xyY to 1960 uvY": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var x = color[r], y = color[g];
                var tmp = 1 / (-2 * x + 12 * y + 3);
                color[r] = 4 * x * tmp;
                color[g] = 6 * y * tmp;
            }
            return color;
        },
        /** Conversion function.
         */
        "1960 uvY to xyY": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var u = color[r], v = color[g];
                var tmp = 1 / (2 * u - 8 * v + 4);
                // Do something with RGB values
                color[r] = 3 * u * tmp;
                color[g] = 2 * v * tmp;
            }
            return color;
        },
        /** Conversion function.
         */
        "1976 u'v'Y to xyY": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var u = color[r], v = color[g];
                var tmp = 1 / (6 * u - 16 * v + 12);
                color[r] = 9 * u * tmp;
                color[g] = 4 * v * tmp;
            }
            return color;
        },
        /** Conversion function.
         */
        "xyY to 1976 u'v'Y": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp;
            for (var r = 0, g = sc, b = 2 * sc; r < N; r += sp, g += sp, b += sp) {
                var x = color[r], y = color[g];
                var tmp = 1 / (-2 * x + 12 * y + 3);
                color[r] = 4 * x * tmp;
                color[g] = 9 * y * tmp;
            }
            return color;
        },
        /** Conversion function.
         */
        "1976 u'v'Y to 1960 uvY": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp + sc;
            var I3M2 = 2 / 3;
            for (var g = sc; g < N; g += sp) {
                color[g] *= I3M2;
            }
            return color;
        },
        /** Conversion function.
         */
        "1960 uvY to 1976 u'v'Y": function (color, N, sc, sp) {
            sc = sc || 1;
            sp = sp || 3;
            N = (N || 1) * sp + sc;
            var I2M3 = 3 / 2;
            for (var g = sc; g < N; g += sp) {
                color[g] *= I2M3;
            }
            return color;
        },
        // Chromaticity function combinations
        /** Conversion function.
         */
        'RGB to rgY': function (color, N, sc, sp) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to rgY'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'rgY to RGB': function (color, N, sc, sp) {
            CS['rgY to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'rgY to xyY': function (color, N, sc, sp) {
            CS['rgY to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp);
            CS['XYZ to xyY'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'xyY to rgY': function (color, N, sc, sp) {
            CS['xyY to XYZ'](color, N, sc, sp);
            CS['XYZ to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to rgY'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'RGB to xyY': function (color, N, sc, sp) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp);
            CS['XYZ to xyY'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'xyY to RGB': function (color, N, sc, sp) {
            CS['xyY to XYZ'](color, N, sc, sp);
            CS['XYZ to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        'RGB to 1960 uvY': function (color, N, sc, sp) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp);
            CS['XYZ to xyY'](color, N, sc, sp);
            CS['xyY to 1960 uvY'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        '1960 uvY to RGB': function (color, N, sc, sp) {
            CS['1960 uvY to xyY'](color, N, sc, sp);
            CS['xyY to XYZ'](color, N, sc, sp);
            CS['XYZ to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        "RGB to 1976 u'v'Y": function (color, N, sc, sp) {
            CS['sRGB to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to XYZ'](color, N, sc, sp);
            CS["XYZ to 1976 u'v'Y"](color, N, sc, sp);
            return color;
        },
        /** Conversion function.
         */
        "1976 u'v'Y to RGB": function (color, N, sc, sp) {
            CS["1976 u'v'Y to XYZ"](color, N, sc, sp);
            CS['XYZ to LinearRGB'](color, N, sc, sp);
            CS['LinearRGB to sRGB'](color, N, sc, sp);
            return color;
        }
    };

    global.Colorspaces = CS;

})(Matrix);

(function (Matrix, Matrix_prototype) {
    "use strict";

    //////////////////////////////////////////////////////////////////
    //                       COLOR IMAGES MODULE                    //
    //////////////////////////////////////////////////////////////////


    var matlabEquivalence = {
        "lab2lch":   "Lab to Lch",
        "lab2srgb":  "Lab to RGB",
        "lab2xyz":   "Lab to XYZ",
        "lch2lab":   "Lch to Lab",
        "srgb2cmyk": "RGB to CMY",
        "srgb2lab":  "RGB to Lab",
        "srgb2xyz":  "RGB to XYZ",
        "upvpl2xyz": "1976 u'v'Y to XYZ",
        "uvl2xyz":   "1960 uvY to XYZ",
        "xyl2xyz":   "xyY to XYZ",
        "xyz2lab":   "XYZ to Lab",
        "xyz2srgb":  "XYZ to RGB",
        "xyz2upvpl": "XYZ to 1976 u'v'",
        "xyz2uvl":   "XYZ to 1960 uv",
        "xyz2xyl":   "XYZ to xyY"
    };


    /** @class Matrix */


    /** Apply a transformation to each RGB triplet of an image.
     *
     * @param {String | Function | Matrix} cform
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.applycform = function (cform) {
        if (this.ndims() !== 3 || this.getSize(2) < 3) {
            throw new Error("Matrix.applycform: Matrix must be an " +
                            "image with RGB components.");
        }
        var N = this.getSize(0) * this.getSize(1);
        if (typeof(cform) === "string") {
            if (Matrix.Colorspaces[cform]) {
                Matrix.Colorspaces[cform](this.getData(), N, N, 1);
            } else if (Matrix.Colorspaces[matlabEquivalence[cform]]) {
                Matrix.Colorspaces[matlabEquivalence[cform]](this.getData(), N, N, 1);
            } else {
                throw new Error("Matrix.applycform: Unknown color transformation " + cform);
            }
        } else if (typeof(cform) === "function") {
            if (cform.length === 3) {
                Matrix.Colorspaces.applyFunctionRGB(this.getData(), cform, N, N, 1);
            } else if (cform.length === 1) {
                Matrix.Colorspaces.applyFunctionColor(this.getData(), cform, N, N, 1);
            }
        } else {
            cform = Matrix.toMatrix(cform);
            if (!Tools.checkSizeEquals(cform.size(), [3, 3], Matrix.ignoreTrailingDims)) {
                throw new Error("Matrix.applycform: Matrix argument must be 3x3.");
            }
            Matrix.Colorspaces.matrix(this.getData(), cform.getData(), N, N, 1);
        }
        return this;
    };

    Matrix.applycform = function (im, cform) {
        return im.getCopy().applycform(cform);
    };


    /** Convert an gray-level image to a color image given a colormap.
     *
     * @param {String} colormap
     *  Can be "JET", or "HUE".
     *
     * @return {Matrix}
     */
    Matrix_prototype.toColormap = function (cMap) {
        var data = this.getData(), size = this.getSize(), dc = data.length;
        size[2] = 3;
        var out = new Matrix(size), dOut = out.getData();
        var R = dOut.subarray(0, dc), G = dOut.subarray(dc, 2 * dc), B = dOut.subarray(2 * dc, 3 * dc);
        var i, t, floor = Math.floor;
        if (cMap === "JET") {
            for (i = 0; i < dc; i++) {

                t = data[i] * 4;

                if (t >= 4) {
                    t = 3.99;
                } else if (t < 0) {
                    t = 0;
                }
                switch (floor(t * 2) % 8) {
                case 0:
                    R[i] = 0;
                    G[i] = 0;
                    B[i] = t + 0.5;
                    break;
                case 1:
                case 2:
                    R[i] = 0;
                    B[i] = 1;
                    G[i] = t - 0.5;
                    break;
                case 3:
                case 4:
                    R[i] = t - 1.5;
                    G[i] = 1;
                    B[i] = 2.5 - t;
                    break;
                case 5:
                case 6:
                    R[i] = 1;
                    G[i] = 3.5 - t;
                    B[i] = 0;
                    break;
                case 7:
                    R[i] = 4.5 - t;
                    G[i] = 0;
                    B[i] = 0;
                    break;
                }
            }

        } else if (cMap === "HUE") {

            for (i = 0; i < dc; i++) {
                var H = data[i];
                t = floor(H * 6) % 6;
                var f = H * 6 - t;
                switch (t) {
                case 0:
                    R[i] = 1;
                    G[i] = f;
                    B[i] = 0;
                    break;
                case 1:
                    R[i] = 1 - f;
                    G[i] = 1;
                    B[i] = 0;
                    break;
                case 2:
                    R[i] = 0;
                    G[i] = 1;
                    B[i] = f;
                    break;
                case 3:
                    R[i] = 0;
                    G[i] = 1 - f;
                    B[i] = 1;
                    break;
                case 4:
                    R[i] = f;
                    G[i] = 0;
                    B[i] = 1;
                    break;
                case 5:
                    R[i] = 1;
                    G[i] = 0;
                    B[i] = 1 - f;
                    break;
                }
            }

        } else if (cMap === "HUE") {
            dOut.set(data);
        }
        return out;
    };


    Matrix_prototype.correctImage = function (ill, illout) {
        illout = illout || CIE.getIlluminant('D65');
        var mat = CIE.getIlluminantConversionMatrix(illout, ill);
        this.applycform('sRGB to LinearRGB')
            .applycform(mat)
            .applycform('LinearRGB to sRGB');
        return this;
    };

    Matrix.correctImage = function (im, ill, illout) {
        return im.getCopy().correctImage(ill, illout);
    };

    Matrix_prototype.im2CCT = function () {
        var cform = CIE['xyY to CCT'];

        var sizeOut = this.getSize();
        sizeOut.pop();
        var imOut = new Matrix(sizeOut, 'single');

        var id = this.getData(), od = imOut.getData();

        // Iterator to scan the view
        var view = this.getView();
        var dy = view.getStep(0), ly = view.getEnd(0), ny;
        var dx = view.getStep(1), lx = view.getEnd(1), nx;
        var dc = view.getStep(2);

        var x, y0, y1, y2, CCT, color = [];
        for (x = 0, nx = lx; x !== nx; x += dx) {
            y0 = x;
            y1 = x + dc;
            y2 = x + 2 * dc;
            for (ny = x + ly; y0 !== ny; y0 += dy, y1 += dy, y2 += dy) {
                color[0] = id[y0];
                color[1] = id[y1];
                color[2] = id[y2];
                CCT = cform(color);
                CCT = CCT < 1668 ? 1668 : (CCT > 20000 ? 20000 : CCT);
                CCT = isNaN(CCT)  ? 24999 : CCT;
                od[y0] = CCT;
            }
        }
        return imOut;
    };

    Matrix_prototype.CCT2im = function () {
        var cform = Matrix.CIE['CCT to xyY'];

        var sizeOut = this.getSize();
        sizeOut[2] = 3;
        var imOut = new Matrix(sizeOut, 'single');

        var id = this.getData(), od = imOut.getData();

        // Iterator to scan the view
        var view = imOut.getView();
        var dy = view.getStep(0), ly = view.getEnd(0), ny;
        var dx = view.getStep(1), lx = view.getEnd(1), nx;
        var dc = view.getStep(2);

        var x, y0, y1, y2, color = [];
        for (x = 0, nx = lx; x !== nx; x += dx) {
            y0 = x;
            y1 = x + dc;
            y2 = x + 2 * dc;
            for (ny = x + ly; y0 !== ny; y0 += dy, y1 += dy, y2 += dy) {
                color = cform(id[y0]);
                od[y0] = color[0];
                od[y1] = color[1];
                od[y2] = color[2];
            }
        }
        return imOut;
    };

})(Matrix, Matrix.prototype);
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

/** @class Matrix */

(function (Matrix_prototype) {
    "use strict";

    // HAS TO BE IMPROVED !!
    var calerf = function (A, JINT) {
        if (!Tools.isInteger(JINT) || !Tools.isInRange(JINT, 0, 2)) {
            throw new Error("Matrix.calerf: Invalid argument.");
        }

        var pa = 3.97886080735226000e+00;
        var p0 = 2.75374741597376782e-01;
        var p1 = 4.90165080585318424e-01;
        var p2 = 7.74368199119538609e-01;
        var p3 = 1.07925515155856677e+00;
        var p4 = 1.31314653831023098e+00;
        var p5 = 1.37040217682338167e+00;
        var p6 = 1.18902982909273333e+00;
        var p7 = 8.05276408752910567e-01;
        var p8 = 3.57524274449531043e-01;
        var p9 = 1.66207924969367356e-02;
        var p10 = -1.19463959964325415e-01;
        var p11 = -8.38864557023001992e-02;
        var p12 = 2.49367200053503304e-03;
        var p13 = 3.90976845588484035e-02;
        var p14 = 1.61315329733252248e-02;
        var p15 = -1.33823644533460069e-02;
        var p16 = -1.27223813782122755e-02;
        var p17 = 3.83335126264887303e-03;
        var p18 = 7.73672528313526668e-03;
        var p19 = -8.70779635317295828e-04;
        var p20 = -3.96385097360513500e-03;
        var p21 = 1.19314022838340944e-04;
        var p22 = 1.27109764952614092e-03;

        var a = new Float64Array(
            [
                0.00000000005958930743e0, -0.00000000113739022964e0,
                0.00000001466005199839e0, -0.00000016350354461960e0,
                0.00000164610044809620e0, -0.00001492559551950604e0,
                0.00012055331122299265e0, -0.00085483269811296660e0,
                0.00522397762482322257e0, -0.02686617064507733420e0,
                0.11283791670954881569e0, -0.37612638903183748117e0,
                1.12837916709551257377e0,
                0.00000000002372510631e0, -0.00000000045493253732e0,
                0.00000000590362766598e0, -0.00000006642090827576e0,
                0.00000067595634268133e0, -0.00000621188515924000e0,
                0.00005103883009709690e0, -0.00037015410692956173e0,
                0.00233307631218880978e0, -0.01254988477182192210e0,
                0.05657061146827041994e0, -0.21379664776456006580e0,
                0.84270079294971486929e0,
                0.00000000000949905026e0, -0.00000000018310229805e0,
                0.00000000239463074000e0, -0.00000002721444369609e0,
                0.00000028045522331686e0, -0.00000261830022482897e0,
                0.00002195455056768781e0, -0.00016358986921372656e0,
                0.00107052153564110318e0, -0.00608284718113590151e0,
                0.02986978465246258244e0, -0.13055593046562267625e0,
                0.67493323603965504676e0,
                0.00000000000382722073e0, -0.00000000007421598602e0,
                0.00000000097930574080e0, -0.00000001126008898854e0,
                0.00000011775134830784e0, -0.00000111992758382650e0,
                0.00000962023443095201e0, -0.00007404402135070773e0,
                0.00050689993654144881e0, -0.00307553051439272889e0,
                0.01668977892553165586e0, -0.08548534594781312114e0,
                0.56909076642393639985e0,
                0.00000000000155296588e0, -0.00000000003032205868e0,
                0.00000000040424830707e0, -0.00000000471135111493e0,
                0.00000005011915876293e0, -0.00000048722516178974e0,
                0.00000430683284629395e0, -0.00003445026145385764e0,
                0.00024879276133931664e0, -0.00162940941748079288e0,
                0.00988786373932350462e0, -0.05962426839442303805e0,
                0.49766113250947636708e0
            ]);
        var b = new Float64Array(
            [
                    -0.00000000029734388465e0, 0.00000000269776334046e0,
                    -0.00000000640788827665e0, -0.00000001667820132100e0,
                    -0.00000021854388148686e0, 0.00000266246030457984e0,
                0.00001612722157047886e0, -0.00025616361025506629e0,
                0.00015380842432375365e0, 0.00815533022524927908e0,
                    -0.01402283663896319337e0, -0.19746892495383021487e0,
                0.71511720328842845913e0,
                    -0.00000000001951073787e0, -0.00000000032302692214e0,
                0.00000000522461866919e0, 0.00000000342940918551e0,
                    -0.00000035772874310272e0, 0.00000019999935792654e0,
                0.00002687044575042908e0, -0.00011843240273775776e0,
                    -0.00080991728956032271e0, 0.00661062970502241174e0,
                0.00909530922354827295e0, -0.20160072778491013140e0,
                0.51169696718727644908e0,

                0.00000000003147682272e0, -0.00000000048465972408e0,
                0.00000000063675740242e0, 0.00000003377623323271e0,
                    -0.00000015451139637086e0, -0.00000203340624738438e0,
                0.00001947204525295057e0, 0.00002854147231653228e0,
                    -0.00101565063152200272e0, 0.00271187003520095655e0,
                0.02328095035422810727e0, -0.16725021123116877197e0,
                0.32490054966649436974e0,
                0.00000000002319363370e0, -0.00000000006303206648e0,
                    -0.00000000264888267434e0, 0.00000002050708040581e0,
                0.00000011371857327578e0, -0.00000211211337219663e0,
                0.00000368797328322935e0, 0.00009823686253424796e0,
                    -0.00065860243990455368e0, -0.00075285814895230877e0,
                0.02585434424202960464e0, -0.11637092784486193258e0,
                0.18267336775296612024e0,
                    -0.00000000000367789363e0, 0.00000000020876046746e0,
                    -0.00000000193319027226e0, -0.00000000435953392472e0,
                0.00000018006992266137e0, -0.00000078441223763969e0,
                    -0.00000675407647949153e0, 0.00008428418334440096e0,
                    -0.00017604388937031815e0, -0.00239729611435071610e0,
                0.02064129023876022970e0, -0.06905562880005864105e0,
                0.09084526782065478489e0
            ]);

        var out = A.getCopy();
        var data = out.getData(), i, ie;
        var w, t, k, y, u;
        var abs = Math.abs, floor = Math.floor, exp = Math.exp;
        // Erf computation
        if (JINT === 0) {
            for (i = 0, ie = out.getLength(); i < ie; i++) {
                w = abs(data[i]);
                if (w < 2.2e0) {
                    t = w * w;
                    k = floor(t);
                    t = t - k;
                    k = k * 13;
                    y = ((((((((((((a[k] * t + a[k + 1]) * t +
                                   a[k + 2]) * t + a[k + 3]) * t + a[k + 4]) * t +
                                a[k + 5]) * t + a[k + 6]) * t + a[k + 7]) * t +
                             a[k + 8]) * t + a[k + 9]) * t + a[k + 10]) * t +
                          a[k + 11]) * t + a[k + 12]) * w;
                } else if (w < 6.9e0) {
                    k = floor(w);
                    t = w - k;
                    k = 13 * (k - 2);
                    y = (((((((((((b[k] * t + b[k + 1]) * t +
                                  b[k + 2]) * t + b[k + 3]) * t + b[k + 4]) * t +
                               b[k + 5]) * t + b[k + 6]) * t + b[k + 7]) * t +
                            b[k + 8]) * t + b[k + 9]) * t + b[k + 10]) * t +
                         b[k + 11]) * t + b[k + 12];
                    y = y * y;
                    y = y * y;
                    y = y * y;
                    y = 1 - y * y;
                } else {
                    y = 1;
                }
                if (data[i] < 0) {
                    y = -y;
                }
                data[i] = y;
            }
            // Erfc computation
        } else if (JINT === 1) {
            for (i = 0, ie = out.getLength(); i < ie; i++) {
                t = pa / (pa + abs(data[i]));
                u = t - 0.5e0;
                y = (((((((((p22 * u + p21) * u + p20) * u +
                           p19) * u + p18) * u + p17) * u + p16) * u +
                       p15) * u + p14) * u + p13) * u + p12;
                y = ((((((((((((y * u + p11) * u + p10) * u +
                              p9) * u + p8) * u + p7) * u + p6) * u + p5) * u +
                         p4) * u + p3) * u + p2) * u + p1) * u + p0) * t *
                    exp(-data[i] * data[i]);
                if (data[i] < 0) {
                    y = 2 - y;
                }
                data[i] = y;
            }
            // Erfcx computation
        } else if (JINT === 2) {
            for (i = 0, ie = out.getLength(); i < ie; i++) {
                t = pa / (pa + abs(data[i]));
                u = t - 0.5e0;
                y = (((((((((p22 * u + p21) * u + p20) * u +
                           p19) * u + p18) * u + p17) * u + p16) * u +
                       p15) * u + p14) * u + p13) * u + p12;
                y = ((((((((((((y * u + p11) * u + p10) * u +
                              p9) * u + p8) * u + p7) * u + p6) * u + p5) * u +
                         p4) * u + p3) * u + p2) * u + p1) * u + p0) * t *
                    exp(-data[i] * data[i]);
                if (data[i] < 0) {
                    y = 2 - y;
                }
                data[i] = exp(data[i] * data[i]) * y;
            }
        }
        return out;
    };

    /** Apply the error function at each element of the matrix.
     *
     * @chainable
     * @matlike
     * @fixme Should act in place.
     */
    Matrix_prototype.erf = function () {
        return calerf(this, 0);
    };

    /** Apply the complementary error function at each element of 
     * the matrix.
     *
     * @chainable
     * @matlike
     * @fixme Should act in place.
     */
    Matrix_prototype.erfc = function () {
        return calerf(this, 1);
    };

    /** Apply the scaled complementary error function at each 
     * element of the matrix.
     *
     * @chainable
     * @matlike
     * @fixme Should act in place.
     */
    Matrix_prototype.erfcx = function () {
        return calerf(this, 2);
    };

    (function (Matrix_prototype) {
        var xbig = 171.624;
        var p = new Float64Array(
            [-1.71618513886549492533811,
             24.7656508055759199108314,
             -379.804256470945635097577,
             629.331155312818442661052,
             866.966202790413211295064,
             -31451.2729688483675254357,
             -36144.4134186911729807069,
             66456.1438202405440627855
            ]),
            q = new Float64Array(
                [-30.8402300119738975254353,
                 315.350626979604161529144,
                 -1015.15636749021914166146,
                 -3107.77167157231109440444,
                 22538.1184209801510330112,
                 4755.84627752788110767815,
                 -134659.959864969306392456,
                 -115132.259675553483497211
                ]),
            c = new Float64Array(
                [-0.001910444077728,
                 8.4171387781295e-4,
                 -5.952379913043012e-4,
                 7.93650793500350248e-4,
                 -0.002777777777777681622553,
                 0.08333333333333333331554247,
                 0.0057083835261
                ]);

        var trunc = function (x) {
            return (x > 0) ? Math.floor(x) : Math.ceil(x);
        };
        /** Apply the gamma function to the `Matrix`.
         * @chainable 
         * @fixme check the output epecially for negative values.
         */
        Matrix_prototype.gamma = function () {
            if (!this.isreal()) {
                throw "Matrix.gamma: Do not work on complex numbers.";
            }
            var INFINITY = Number.POSITIVE_INFINITY,
                LN_SQRT_2PI  = 0.9189385332046727417803297,
                DBL_MIN      = 2.22507e-308,
                DBL_EPSILON  = 2.220446049250313e-16;

            var x, i, xden, xnum, z, yi, res, sum, ysq;
            var data = this.getData(), d, de;
            for (d = 0, de = data.length; d < de; d++) {
                x = data[d];
                var parity = 0, fact = 1.0, n = 0.0, y = x;
                if (y <= 0.0) {
                    y = -x;
                    yi = trunc(y);
                    res = y - yi;
                    if (res !== 0.0) {
                        if (yi !== trunc(yi * 0.5) * 2.0) {
                            parity = 1.0;
                        }
                        fact = -Math.PI / Math.sin(Math.PI * res);
                        y += 1.0;
                    } else {
                        data[d] = INFINITY;
                        continue;
                    }
                }

                if (y < DBL_EPSILON) {
                    if (y >= DBL_MIN) {
                        res = 1.0 / y;
                    } else {
                        data[d] = INFINITY;
                        continue;
                    }
                } else if (y < 12.0) {
                    yi = y;
                    if (y < 1.0) {
                        z = y;
                        y += 1.0;
                    } else {
                        n = parseInt(y, 10) - 1;
                        y -= parseFloat(n);
                        z = y - 1.0;
                    }
                    xnum = 0.0;
                    xden = 1.0;
                    for (i = 0; i < 8; ++i) {
                        xnum = (xnum + p[i]) * z;
                        xden = xden * z + q[i];
                    }
                    res = xnum / xden + 1.0;
                    if (yi < y) {
                        res /= yi;
                    } else if (yi > y) {
                        for (i = 0; i < n; ++i) {
                            res *= y;
                            y += 1.0;
                        }
                    }
                } else {
                    if (y <= xbig) {
                        ysq = y * y;
                        sum = c[6];
                        for (i = 0; i < 6; i++) {
                            sum = sum / ysq + c[i];
                        }
                        sum = sum / y - y + LN_SQRT_2PI;
                        sum += (y - 0.5) * Math.log(y);
                        res = Math.exp(sum);
                    } else {
                        data[d] = INFINITY;
                        continue;
                    }
                }

                if (parity) {
                    res = -res;
                }
                if (fact !== 1.0) {
                    res = fact / res;
                }
                data[d] = res;
            }
            return this;
        };
    })(Matrix_prototype);

})(Matrix.prototype);



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

/** @class Matrix */

(function (Matrix, Matrix_prototype) {
    "use strict";

    // Check if nodejs or browser
    var isNode = (typeof module !== 'undefined' && module.exports) ? true : false;
    var fs, Canvas, newImage;
    if (isNode) {
        fs = require("fs");
        // Do not forget: export NODE_PATH=/usr/local/lib/node_modules
        Canvas = require("canvas");
        newImage = Canvas.Image;
    } else {
        newImage = Image;
    }

    var createCanvas = function (width, height) {
        var canvas;
        if (isNode) {
            canvas = new Canvas();
        } else {
            canvas = document.createElement("canvas");
        }
        canvas.width = width || 0;
        canvas.height = height || 0;
        return canvas;
    };

    //////////////////////////////////////////////////////////////////
    //                    IMAGES CONVERSION MODULE                  //
    //////////////////////////////////////////////////////////////////


    /** Image cast function.
     * @param {Object} image
     * @param {String} type
     * @return {Matrix}
     * @private
     */
    Matrix_prototype.convertImage = function (type) {
        var output = new Matrix(this.getSize(), type);
        var inputRange, outputRange;
        if (this.isfloat() || this.islogical()) {
            inputRange = [0, 1];
        } else if (this.isinteger()) {
            inputRange = [Matrix.intmin(this.type()), Matrix.intmax(this.type())];
        }
        var a = inputRange[0], b = 1 / (inputRange[1] - inputRange[0]);

        if (output.isfloat() || this.islogical()) {
            outputRange = [0, 1];
        } else if (output.isinteger()) {
            outputRange = [Matrix.intmin(output.type()), Matrix.intmax(output.type())];
        }
        var c = outputRange[0], d = b * (outputRange[1] - outputRange[0]);

        var id = this.getData(), od = new output.getData();
        var i, ie;
        for (i = 0, ie = id.length; i < ie; i++) {
            od[i] = (id[i] - a) * d - c;
        }
        return new Matrix(this.getSize(), od);
    };
    /** Cast image to `double` type
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.im2double = function () {
        return this.convertImage('double');
    };
    /** Cast image to `single` type
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.im2single = function () {
        return this.convertImage('single');
    };
    /** Cast image to uint8 type
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.im2uint8 = function () {
        return this.convertImage('uint8');
    };
    /** Cast image to uint8c type
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.im2uint8c = function () {
        return this.convertImage('uint8c');
    };
    /** Return the image in a array who can be displayed in
     * a `Canvas` element.
     *
     * @return {Uint8ClampedArray}
     */
    Matrix_prototype.getImageData = function () {
        // Input image range
        var range;
        if (this.isfloat()  || this.islogical()) {
            range = [0, 1];
        } else if (this.isinteger()) {
            range = [Matrix.intmin(this.type()), Matrix.intmax(this.type())];
        }
        var a = range[0], b = 255 / (range[1] - range[0]);

        // Ouptut iterator
        var width = this.getSize(1), height = this.getSize(0);
        var imageData = createCanvas().getContext('2d')
                .createImageData(width, height);
        var nx = height * width, nx0;
        var dI = this.getData(), dO = imageData.data;

        var xo, y, x0, x1, x2, x3, vTmp;
        switch (this.getSize(2)) {
        case 1:
            for (y = 0, xo = 0; y < height; y++) {
                for (x0 = y, nx0 = y + nx; x0 < nx0; x0 += height) {
                    vTmp = (dI[x0] - a) * b;
                    dO[xo++] = vTmp;
                    dO[xo++] = vTmp;
                    dO[xo++] = vTmp;
                    dO[xo++] = 255;
                }
            }
            break;
        case 2:
            for (y = 0, xo = 0; y < height; y++) {
                for (x0 = y, x1 = y + nx, nx0 = y + nx; x0 < nx0; x0 += height, x1 += height) {
                    vTmp = (dI[x0] - a) * b;
                    dO[xo++] = vTmp;
                    dO[xo++] = vTmp;
                    dO[xo++] = vTmp;
                    dO[xo++] = (dI[x1] - a) * b;
                }
            }
            break;
        case 3:
            for (y = 0, xo = 0; y < height; y++) {
                for (x0 = y, x1 = y + nx, x2 = y + 2 * nx, nx0 = x1; x0 < nx0; x0 += height, x1 += height, x2 += height) {
                    dO[xo++] = (dI[x0] - a) * b;
                    dO[xo++] = (dI[x1] - a) * b;
                    dO[xo++] = (dI[x2] - a) * b;
                    dO[xo++] = 255;
                }
            }
            break;
        case 4:
            for (y = 0, xo = 0; y < height; y++) {
                for (x0 = y, x1 = x0 + nx, x2 = x1 + nx, x3 = x2 + nx, nx0 = x1; x0 < nx0; x0 += height, x1 += height, x2 += height, x3 += height) {
                    dO[xo++] = (dI[x0] - a) * b;
                    dO[xo++] = (dI[x1] - a) * b;
                    dO[xo++] = (dI[x2] - a) * b;
                    dO[xo++] = (dI[x3] - a) * b;
                }
            }
            break;
        }
        return imageData;
    };
    /** Transform a Matrix into an `Image` element.
     *
     * @param {Function} callback
     *  Function to call when the conversion is done.
     */
    Matrix_prototype.toImage = function (callback) {
        if (isNode) {
            throw new Error("Matrix.toImage: Canvas doesn't exist.");
        }
        var canvas = createCanvas(this.getSize(1), this.getSize(0));
        var id = this.getImageData();
        canvas.getContext('2d').putImageData(id, 0, 0);
        var im = new Image();
        im.src = canvas.toDataURL();
        im.onload = callback;
        return im;
    };

    if (isNode) {
        /** Allow to save an image on the Disk.
         * File extension must be be either a png or jpg valid extension.
         *
         * __FOR NODEJS USE ONLY, THIS FUNCTION IS NOT AVAILABLE IN A BROWSER.__
         *
         * @param {String} name
         *  Name of the file
         * @param {Function} callback
         *  Function to call when the conversion is done.
         * @matlike
         */
        Matrix.prototype.imwrite = function (name, callback) {
            var canvas = createCanvas(this.getSize(1), this.getSize(0));
            canvas.getContext('2d').putImageData(this.getImageData(), 0, 0);

            var out = fs.createWriteStream(name), stream;
            if ((/\.(png)$/i).test(name.toLowerCase())) {
                stream = canvas.pngStream();
            } else if ((/\.(jpeg|jpg)$/i).test(name.toLowerCase())) {
                stream = canvas.jpegStream();
            } else {
                throw new Error("Matrix.imwrite: invalid file extension.");
            }
            stream.on('data', function (chunk) {
                out.write(chunk);
            });
            if (callback) {
                stream.on('end', callback.bind(this));
            }
        };
    }


    //////////////////////////////////////////////////////////////////
    //                        FILTERING MODULE                      //
    //////////////////////////////////////////////////////////////////


    /** Return some kernels.
     *
     * __Also see:__
     * {@link Matrix#imfilter}
     *
     * @param {String} type
     *  Can be 'average', 'disk', 'gaussian', 'log', 'unsharp', 'prewitt'
     *  or'sobel'.
     *
     * @param {String} parameter1
     *
     * @param {String} parameter2
     *
     * @return {Matrix}
     *
     * @todo
     *  Not every filter works add documentation on filter parameters.
     *  Meanwhile, have a look to the matlab documentation.
     */
    Matrix.fspecial = function (type, p1, p2) {
        var a, xsize, ysize, sigma;
        var data, n1, n2, _j, ij, e_j, eij, sum;
        var tmp, i, ei;
        var gaussian = function (n1, n2) {
            return Math.exp(-(n1 * n1 + n2 * n2) / (2 * sigma * sigma));
        };
        // var log = function (n1, n2) {
        //     return (n1 * n1 + n2 * n2 - 2 * sigma * sigma) * gaussian(n1, n2) / (2 * Math.PI * Math.pow(sigma, 6));
        // };
        switch (type.toLowerCase()) {
        case 'average':
            if (Tools.isArrayLike(p1)) {
                ysize = p1[0];
                xsize = p1[1];
            } else {
                ysize = (p1 === undefined) ? 3 : p1;
                xsize = ysize;
            }
            return Matrix.ones([ysize, xsize])['./'](ysize * xsize);
        case 'disk':
            break;
        case 'gaussian':
            if (Tools.isArrayLike(p1)) {
                ysize = p1[0];
                xsize = p1[1];
            } else {
                ysize = (p1 === undefined) ? 3 : p1;
                xsize = ysize;
            }
            sigma = (p2 === undefined) ? 0.5 : p2;
            data = [];
            sum = 0;
            for (_j = 0, n1 = -(xsize - 1) / 2, e_j = xsize * ysize; _j < e_j; _j += ysize, n1++) {
                for (ij = _j, eij = _j + ysize, n2 = -(ysize - 1) / 2; ij < eij; ij++, n2++) {
                    tmp = gaussian(n1, n2);
                    data[ij] = tmp;
                    sum += tmp;
                }
            }
            for (i = 0, ei = data.length; i < ei; i++) {
                data[i] /= sum;
            }

            return new Matrix([ysize, xsize], data);
        case 'laplacian':
            a = (p1 === undefined) ? 0.2 : p1;
            return new Matrix([3, 3], [a / 4, (1 - a) / 4, a / 4, (1 - a) / 4, -1, (1 - a) / 4, a / 4, (1 - a) / 4, a / 4])['.*'](4 / (a + 1));
        case 'log':
            if (Tools.isArrayLike(p1)) {
                ysize = p1[0];
                xsize = p1[1];
            } else {
                ysize = (p1 === undefined) ? 3 : p1;
                xsize = ysize;
            }
            sigma = (p2 === undefined) ? 0.5 : p2;
            data = [];
            sum = 0;
            for (_j = 0, n1 = -(xsize - 1) / 2, e_j = xsize * ysize; _j < e_j; _j += ysize, n1++) {
                for (ij = _j, eij = _j + ysize, n2 = -(ysize - 1) / 2; ij < eij; ij++, n2++) {
                    tmp = gaussian(n1, n2);
                    data[ij] = (n1 * n1 + n2 * n2 - 2 * sigma * sigma) * tmp / Math.pow(sigma, 4);
                    sum += tmp;
                }
            }
            for (i = 0, ei = data.length; i < ei; i++) {
                data[i] /= sum;
            }
            sum = 0;
            for (i = 0, ei = data.length; i < ei; i++) {
                sum += data[i];
            }
            sum /= xsize * ysize;
            for (i = 0, ei = data.length; i < ei; i++) {
                data[i] -= sum;
            }
            return new Matrix([ysize, xsize], data);
        case 'unsharp':
            a = (p1 === undefined) ? 0.2 : p1;
            return new Matrix([3, 3], [-a, a - 1, -a, a - 1, a + 5, a - 1, -a, a - 1, -a])['.*'](1 / (a + 1));
        case 'prewitt':
            return new Matrix([3, 3], [1, 0, -1, 1, 0, -1, 1, 0, -1]);
        case 'sobel':
            return new Matrix([3, 3], [1, 0, -1, 2, 0, -2, 1, 0, -1]);
        default:
            return;
        }
    };

    Matrix_prototype.filter1d = function (kernel, origin) {

        // 1. ARGUMENTS
        var errMsg = this.constructor.name + '.filter1d: ';

        // origin
        if (origin === undefined) {
            origin = 'C';
        }

        if (!kernel.isvector()) {
            throw new Error("Matrix.filter1d: Kernel must be a vector");
        }
        var K = kernel.getLength(), kd = kernel.getData();
        if (typeof origin === 'string') {
            switch (origin.toUpperCase()) {
            case 'C':
            case 'CL':
                origin = Math.floor((K - 1) / 2);
                break;
            case 'CR':
                origin = Math.ceil((K - 1) / 2);
                break;
            case 'L':
                origin = 0;
                break;
            case 'R':
                origin = K - 1;
                break;
            default:
                throw new Error(errMsg + "unknown origin position '" + origin + "'");
            }
        } else if (typeof origin  === 'number') {
            if (origin < 0) {
                origin += K;
            }
            if (origin < 0 || origin >= K) {
                throw new Error(errMsg + "origin value must satisfy : |origin| < kernel.length");
            }
        }

        // 2. Filtering
        var output = new Matrix(this.getSize(), this.getDataType());
        var id = this.getData(), od = output.getData();

        // Iterator to scan the view
        var view = output.getView();
        var dc = view.getStep(2), lc = view.getEnd(2);
        var dx = view.getStep(1), lx = view.getEnd(1);
        var ly = view.getEnd(0);

        if (origin >= ly / 2) {
            throw new Error('Matrix.filter1d: Kernel is too large.');
        }

        var sum, stop = ly - origin;
        var c, x, nx, y, ny, j, k;
        for (c = 0; c !== lc; c += dc) {
            for (x = c, nx = c + lx; x !== nx; x += dx) {
                for (y = x, ny = x + origin; y < ny; y++) {
                    // This loop code the symmetry
                    for (sum = 0, k = 0, j = 2 * x + origin - y; j > x; k++, j--) {
                        sum += kd[k] * id[j];
                    }
                    for (j = x; k < K; k++, j++) {
                        sum += kd[k] * id[j];
                    }
                    od[y] = sum;
                }
                for (y = x + origin, ny = x + stop; y < ny; y++) {
                    for (sum = 0, k = 0, j = y - origin; k < K; k++, j++) {
                        sum += kd[k] * id[j];
                    }
                    od[y] = sum;
                }
                for (y = x + stop, ny = x + ly; y < ny; y++) {
                    for (sum = 0, k = 0, j = y - origin; j < ny; k++, j++) {
                        sum += kd[k] * id[j];
                    }
                    // This loop code the symmetry
                    for (j = ny - 2; k < K; k++, j--) {
                        sum += kd[k] * id[j];
                    }
                    od[y] = sum;
                }
            }
        }

        // Return the result
        return output;
    };
    /** Apply different filters on rows and columns.
     *
     * @param {Matrix} filterX
     *
     * @param {Matrix} [filterY=filterX]
     *
     * @return {Matrix}
     */
    Matrix_prototype.separableFilter = function (hKernel, vKernel) {
        if (vKernel === undefined) {
            vKernel = hKernel;
        }
        return this
            .filter1d(hKernel).permute([1, 0, 2])
            .filter1d(vKernel).permute([1, 0, 2]);
    };
    /** 2D gaussian blur.
     *
     * __Also see:__
     * {@link Matrix#fastBlur}.
     *
     * @param {Number} sigmaX
     *
     * @param {Number} [sigmaY=sigmaX]
     *
     * @param {Integer} [precision=3]
     *  High number increases the computational time as well as the
     *  quality of the filtering.
     *
     * @return {Matrix}
     */
    Matrix_prototype.gaussian = function (sigmaX, sigmaY, precision) {
        precision = precision || 3;
        var kernelX = Kernel.gaussian(sigmaX, 0, precision);
        var kernelY;
        if (typeof sigmaY === "number") {
            kernelY = Kernel.gaussian(sigmaY, 0, precision);
        } else {
            kernelY = kernelX;
        }
        return this.separableFilter(kernelX, kernelY);
    };
    /** Compute image derivative using a gaussian kernel.
     * Gaussian kernel is computed with 'kernel.gaussian (sigma, 3)'
     * which ensures a good accuracy but takes time.
     *
     * @param {Number} sigma
     *  Derivative order (0, 1) for the X kernel.
     *
     * @returns {Object}
     *  Out image derivatives (Object.{x, y, norm, phase}).
     *
     *     // Compute the gradient
     *     var gradient = im.gaussianGradient(1);
     */
    Matrix_prototype.gaussianGradient = function (sigma) {
        if (!sigma) {
            sigma = 2;
        }
        var kernel1 = Kernel.gaussian(sigma, 1, 3);
        var kernel2 = Kernel.gaussian(sigma, 0, 3);

        var x = this.separableFilter(kernel2, kernel1);
        var y = this.separableFilter(kernel1, kernel2);

        var IPI2 = 0.5 / Math.PI;

        var n = Matrix.zeros(this.getSize()), p = Matrix.zeros(this.getSize());
        var xData = x.getData(), yData = y.getData();
        var nData = n.getData(), pData = p.getData();

        var i, ie;
        for (i = 0, ie = xData.length; i < ie; i++) {
            var a = xData[i], b = yData[i];
            nData[i] = Math.sqrt(a * a + b * b);
            var ph = Math.atan2(b, a) * IPI2;
            pData[i] = ph < 0 ? ph + 1 : ph;
        }

        return {x: x, y: y, norm: n, phase: p};
    };
    /** Compute various differential operators on an image
     * with discret schemes.
     *
     * @param {Boolean} gradx
     *
     * @param {Boolean} grady
     *
     * @param {Boolean} norm
     *
     * @param {Boolean} phase
     *
     * @param {Boolean} laplacian
     *
     * @return {Object}
     *  Return an object with the requested properties.
     *
     * @author
     *  This function was imported from the [Megawave library][1].
     *  And then adapted to work with the Matrix class.
     *  [1]: http://megawave.cmla.ens-cachan.fr/
     */
    Matrix_prototype.gradient = function (gradx, grady, norm, phase, laplacian) {

        var IRAC2   = 0.70710678, RAC8P4  = 6.8284271, IRAC8 = 0.35355339;
        var IRAC2P2 = 0.29289322, IRAC8P4 = 1 / RAC8P4, IPI2 =  0.5 / Math.PI;

        var gradient = {}, xData, yData, nData, pData, lData;
        var size = this.getSize();
        var type = this.getDataType();
        if (gradx) {
            gradient.x = new Matrix(size, type);
            xData = gradient.x.getData();
        }
        if (grady) {
            gradient.y = new Matrix(size, type);
            yData = gradient.y.getData();
        }
        if (norm) {
            gradient.norm = new Matrix(size, type);
            nData = gradient.norm.getData();
        }
        if (phase) {
            gradient.phase = new Matrix(size, type);
            pData = gradient.phase.getData();
        }
        if (laplacian) {
            gradient.laplacian = new Matrix(size, type);
            lData = gradient.laplacian.getData();
        }

        var id = this.getData();

        // Iterator to scan the view
        var view = this.getView();
        var dc = view.getStep(2), lc = view.getEnd(2);
        var dx = view.getStep(1), lx = view.getEnd(1);
        var ly = view.getEnd(0);

        var c, x, nx, y, ny, y0, y1;
        for (c = 0; c !== lc; c += dc) {
            for (x = c + dx, nx = c + lx - dx; x !== nx; x += dx) {
                for (y0 = x - dx, y = x, y1 = x + dx, ny = x + ly - 2; y < ny; y) {
                    var a00 = id[y0], a01 = id[++y0], a02 = id[y0 + 1];
                    var a10 = id[y],  a11 = id[++y],  a12 = id[y  + 1];
                    var a20 = id[y1], a21 = id[++y1], a22 = id[y1 + 1];

                    var c1 = a22 - a00, d1 = a02 - a20;
                    var ax = IRAC2P2 * (a21 - a01 + IRAC8 * (c1 - d1));
                    var ay = IRAC2P2 * (a10 - a12 - IRAC8 * (c1 + d1));

                    if (gradx) {
                        xData[y] = ax;
                    }
                    if (grady) {
                        yData[y] = ay;
                    }
                    if (norm) {
                        nData[y] = Math.sqrt(ax * ax + ay * ay);
                    }
                    if (phase) {
                        var ap = Math.atan2(-ay, ax) * IPI2;
                        pData[y] = (ap < 0) ? (ap + 1) : ap;
                    }
                    if (laplacian) {
                        lData[y] =
                            (IRAC2 * (a00 + a02 + a20 + a22) + (a10 + a01 + a21 + a12)) *
                            IRAC8P4 - a11;
                    }
                }
            }
        }

        return gradient;
    };

    /** Performs an 1D convolution between two vectors.
     *
     * @param {Function} vect
     *
     * @param {String} shape
     *  Can be "full", "same" or "valid".
     *
     * @return {Matrix}
     * @fixme This function must not be in image processing group.
     */
    Matrix_prototype.conv = function (vect, shape) {
        if (!this.isvector() || !vect.isvector()) {
            throw new Error("Matrix.conv: Input must be vector.");
        }

        var id1 = this.getData(), n1 = id1.length;
        var id2 = vect.getData(), n2 = id2.length;

        if (n1 < n2) {
            return vect.conv(this, shape);
        }
        var Type = Tools.checkType(this.getDataType());
        var od = new Type(n1 + n2 - 1), no = od.length;

        var j0, j, nj, i, x, nx, sum;

        // Initial zero padding
        for (x = 0, nx = n2 - 1; x < nx; x++) {
            for (sum = 0, j = 0, nj = x + 1, i = x; j < nj; j++, i--) {
                sum += id1[j] * id2[i];
            }
            od[x] = sum;
        }
        // Central part
        for (x = n2 - 1, j0 = 0, nx = n1; x < nx; x++, j0++) {
            for (sum = 0, j = j0, nj = x + 1, i = n2 - 1; j < nj; j++, i--) {
                sum += id1[j] * id2[i];
            }
            od[x] = sum;
        }
        // Final zero padding
        for (x = n1, j0 = n1 - n2 + 1; x < no; x++, j0++) {
            for (sum = 0, j = j0, i = n2 - 1; j < n1; j++, i--) {
                sum += id1[j] * id2[i];
            }
            od[x] = sum;
        }

        switch (shape) {
        case undefined:
        case 'full':
            return new Matrix(no, od);
        case 'same':
            var orig = Math.ceil(n2 / 2);
            return new Matrix(n1, od.subarray(orig, orig + n1));
        case 'valid':
            return new Matrix(n1 - n2 + 1, od.subarray(n2 - 1, n1));
        default:
            throw new Error("Matrix.conv: Invalid shape parameter.");
        }
    };
    
    var computeImageIntegral = function(im) {
        var view = im.getView(), d = im.getData();
        var dc = view.getStep(2), lc = view.getEnd(2);
        var dx = view.getStep(1), lx = view.getEnd(1), nx;
        var ly = view.getEnd(0), ny;
        var c, y, x;
        for (c = 0; c < lc; c += dc) {
            for (y = c + 1, ny = c + ly; y < ny; y++) {
                d[y] += d[y - 1];
            }
            for (x = c + dx, nx = c + lx; x < nx; x += dx) {
                var sum = d[x];
                d[x] += d[x - dx];
                for (y = x + 1, ny = x + ly; y < ny; y++) {
                    sum += d[y];     
                    d[y] = d[y - dx] + sum;
                }
            }
        }
    };
    /** Gaussian bluring based on box filtering. 
     * It computes a fast approximation of gaussian blur 
     * in constant time.
     *
     * @param {Number} sigmaX
     *  Standard deviation of the gausian.
     * @param {Number} [sigmaY=sigmaX]
     * @param {Number} [k=2]
     *  Number of times than the image is boxfiltered.
     * @return {Matrix}
     */
    Matrix_prototype.fastBlur = function (sx, sy, k) {
        k = k || 3;
        sy = sy || sx;
        var wx = Math.round(Math.sqrt(12 / k * sx * sx + 1) / 2) * 2 + 1;
        var wy = Math.round(Math.sqrt(12 / k * sy * sy + 1) / 2) * 2 + 1;
        var imout = Matrix.zeros(this.getSize());
        // Iterator to scan the view
        var view = this.getView();
        var dc = view.getStep(2), lc = view.getEnd(2);
        var dx = view.getStep(1), lx = view.getEnd(1);
        var ly = view.getEnd(0);

        sy = (wy / 2) | 0;
        sx = ((wx / 2) | 0) * dx;
        var sx2 = ((wx / 2) | 0);

	var nx, ny, c, x, y, y_, yx;
        var cst, csty, cste;

        var imcum = this.im2double();
        for (var p = 0; p < k; p++) {

            computeImageIntegral(imcum);

            var din = imcum.getData(), dout = imout.getData();
            var e = (sx + sy + dx + 1), f = sx + sy, g = -(sx + dx) + sy, h = sx - sy - 1;
            var dinf = din.subarray(f), dinh = din.subarray(h);

            for (c = 0; c < lc; c += dc) {            

                // First rows
                for (y_ = c, y = 0, ny = c + sy + 1; y_ < ny; y_++, y++) {
                    csty = (y + sy + 1);
                    // First columns
                    for (yx = y_, x = 0, nx = y_ + sx + dx; yx < nx; yx += dx, x++) {
                        dout[yx] = dinf[yx] / ((x + sx2 + 1) * csty);
                    }
                    cst = 1 / (wx * csty);
                    // Central columns
                    for (yx = y_ + sx + dx, nx = y_ + lx - sx; yx < nx; yx += dx) {
                        dout[yx] = (dinf[yx] - din[yx + g]) * cst;
                    }
                    cste = din[y_ + lx - dx + sy];
                    // Last columns
                    for (yx = y_ + lx - sx, nx = y_ + lx; yx < nx; yx += dx) {
                        dout[yx] =  cste - din[yx + g];
                        dout[yx] /= ((sx + nx - yx) / dx) * csty;
                    }
                }
                
                // First columns
                for (x = c, nx = c + sx + dx; x < nx; x += dx) {
                    // Central part
                    cst = 1 / (((x - c + sx) / dx + 1) * wy);
                    for (y = x + sy + 1, ny = x + ly - sy; y < ny; y++) {
                        dout[y] = dinf[y] - dinh[y];
                        dout[y] *= cst;
                    }
                }
                // Central part
                cst = 1 / (wx * wy);
                for (x = c + sx + dx, nx = c + lx - sx; x < nx; x += dx) {
                    // Central part
                    for (y = x + sy + 1, ny = x + ly - sy; y < ny; y++) {
                        dout[y] = (din[y - e] + dinf[y] - din[y + g] - dinh[y]) * cst;
                    }
                }
                // Last columns
                for (x = c + lx - sx, nx = c + lx; x < nx; x += dx) {
                    // Central part
                    cst = 1 / (((c + lx - x + sx) / dx) * wy);
                    for (y = x + sy + 1, ny = x + ly - sy; y < ny; y++) {
                        dout[y] = din[y - e] + din[c + lx - dx + y - x + sy] - din[c + lx - dx + y - x - sy - 1] - din[y + g];
                        dout[y] *= cst;
                    }
                }
                
                // last rows
                for (y = c + ly - sy, ny = c + ly; y < ny; y++) {
                    // First columns
                    for (x = y, nx = y + sx + dx; x < nx; x += dx) {
                        dout[x] = din[x - y + c + ly - 1 + sx] - dinh[x];
                        dout[x] /= ((x - y + sx) / dx + 1) * (sy + (ly - (y - c)));
                    }
                    cst = 1 / (wx * (sy + (ly - (y - c))));
                    // Central columns
                    for (x = y + sx + dx, nx = y + lx - sx; x < nx; x += dx) {
                        dout[x] = din[x - y + c + ly - 1 + sx] - din[x - y + c + ly - 1 - sx - dx] + din[x - e] - dinh[x];
                        dout[x] *= cst;
                    }
                    // Last columns
                    for (x = y + lx - sx, nx = y + lx; x < nx; x += dx) {
                        dout[x] = din[c + lx - dx + ly - 1] + din[x - e] - din[c + x - y + ly - 1 - sx - dx] - din[c + lx - dx + y - c - sy - 1];
                        dout[x] /= ((lx - (x - y) + sx) / dx) * (sy + (ly - (y - c)));
                    }
                }
            }
            var tmp = imout;
            imout = imcum;
            imcum = tmp;
        }
        return tmp;
    };

    
    //////////////////////////////////////////////////////////////////
    //                          KERNEL TOOLS                        //
    //////////////////////////////////////////////////////////////////


    /** Holds kernels generation for filtering.
     * @private
     */
    var Kernel = {};
    /** Normalize a kernel.
     * Normalization such that its L1 norm is 1.
     *
     * @param {Array} kernel
     *  The kernel.
     *
     * @return {Array}
     *  The same array, but normalized.
     */
    Kernel.normalize = function (kernel) {
        var i;
        var N = kernel.length;

        // L1 norm of the kernel
        var sum = 0;
        for (i = 0; i < N; i++) {
            sum += Math.abs(kernel[i]);
        }

        // Normalize
        if (sum !== 0) {
            for (i = 0; i < N; i++) {
                kernel[i] /= sum;
            }
        }

        // Return it
        return kernel;
    };
    /** Compute a gaussian kernel and its derivatives.
     *
     * @param {Number} sigma
     *   Standard deviation of kernel
     *
     * @param {Integer} [order=0]
     *   Derivative order: 0, 1 or 2
     *
     * @param {Number} [precision=3.0]
     *   Precision of the kernel
     *
     * @return {Float32Array}
     *   The gaussian Kernel
     */
    Kernel.gaussian = function (sigma, order, precision) {
        var i, x;

        // Kernel parameters
        if (precision === undefined) {
            precision = 3;
        }
        if (order === undefined) {
            order = 0;
        }

        var size = 1 + 2 * Math.ceil(sigma * Math.sqrt(precision * 2 * Math.log(10)));
        var kerOut = new Matrix.dataType(size);
        var shift = (size - 1) / 2;
        var sum = 0, abs = Math.abs;
        for (i = 0; i < (size + 1) / 2; i++) {
            x = i - shift;
            var tmp = 1 / (Math.sqrt(2 * Math.PI) * sigma);
            tmp *= Math.exp(-(x * x) / (2 * sigma * sigma));
            kerOut[i] = kerOut[size - 1 - i] = tmp;
        }

        // Generate the kernel
        switch (order) {

        case 0:
            for (i = 0, sum = 0; i < kerOut.length; i++) {
                sum += abs(kerOut[i]);
            }
            break;

        case 1:
            for (i = 0, sum = 0; i < kerOut.length; i++) {
                x = i - shift;
                kerOut[i] *= -x / Math.pow(sigma, 2);
                sum += abs(x * kerOut[i]);
            }
            break;

        case 2:
            for (i = 0, sum = 0; i < kerOut.length; i++) {
                x = i - shift;
                kerOut[i] *= (x * x / Math.pow(sigma, 4) - 1 / Math.pow(sigma, 2));
                sum += abs(kerOut[i]);
            }
            sum /= kerOut.length;
            for (i = 0; i < kerOut.length; i++) {
                kerOut[i] -= abs(sum);
            }
            for (i = 0, sum = 0; i < kerOut.length; i++) {
                x = i - shift;
                sum += abs(0.5 * x * x * kerOut[i]);
            }
            break;

        default:
            throw new Error('Kernel.gaussian: Derive order can be 0,1 or 2 but not ' + order);
        }

        if (sum !== 0) {
            for (i = 0; i < kerOut.length; i++) {
                kerOut[i] /= sum;
            }
        }

        return new Matrix(kerOut.length, kerOut);
    };


    //////////////////////////////////////////////////////////////////
    //                     MISCELLANEOUS FUNCTIONS                  //
    //////////////////////////////////////////////////////////////////


    /** @class Matrix */

    /** Display an image into an HTML5 canvas element.
     *
     * __Also see:__
     *  {@link Matrix#imagesc},
     *  {@link Matrix#imread}.
     *
     * @param {String|HTMLCanvasElement} canvas
     *  Can be either a canvas `id` or a canvas object.
     *
     * @param {Number|String} [scale=1]
     *  Can be a number providing the magnification factor or `fit`
     *  specifying that the image will fit the canvas dimension.
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.imshow = function (canvas, scale) {
        if (isNode) {
            console.warn("Matrix.imshow: function not available in nodejs.");
            return;
        }

        var errMsg = this.constructor.name + '.imshow: ';
        var width = this.getSize(1);
        var height = this.getSize(0);

        // Optional parameters
        if (typeof canvas === 'string' && document.getElementById(canvas)) {
            canvas = document.getElementById(canvas);
        }
        var w;
        if (canvas === undefined || canvas === null) {
            canvas = document.createElement("canvas");
            w = window.open("", "", "width=" + width, "height=" + height);
            w.document.body.appendChild(canvas);
        }

        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new Error(errMsg + 'Invalid canvas.');
        }

        var imageData = this.getImageData();
        if (scale === undefined || scale === 1) {
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').putImageData(imageData, 0, 0);
        } else {
            if (scale === 'fit') {
                // Compute the scale
                var hScale = canvas.width / width;
                var vScale = canvas.height / height;
                scale = Math.min(hScale, vScale);
                scale = scale > 1 ? 1 : scale;
            } else if (typeof scale !== 'number') {
                throw new Error(errMsg + 'scale must be a number or \'fit\'');
            }
            canvas.width = Math.round(width * scale);
            canvas.height = Math.round(height * scale);

            var canvasTmp = document.createElement('canvas');
            canvasTmp.width = width;
            canvasTmp.height = height;
            var ctxTmp = canvasTmp.getContext('2d');
            ctxTmp.putImageData(imageData, 0, 0);
            canvas.getContext('2d')
                .drawImage(canvasTmp,
                           0, 0, width, height,
                           0, 0, canvas.width, canvas.height);
        }

        return w || this;
    };
    /** Display a Matrix into an HTML5 canvas element in a popup
     * and open the the print menu.
     *
     * __Also see:__
     *  {@link Matrix#imshow}.
     *
     * @chainable
     */
    Matrix_prototype.print = function () {
        var w = this.imshow();
        w.print();
        w.close();
        return this;
    };
    /** Display a Matrix into an HTML5 canvas element by streching
     * the values in order to fit the display range.
     *
     * __Also see:__
     *  {@link Matrix#imshow}.
     *
     * @param {String|HTMLCanvasElement} canvas
     *  Can be either a canvas `id` or a canvas object.
     *
     * @param {Number|String} [scale=1]
     *  Can be a number providing the magnification factor or `fit`
     *  specifying that the image will fit the canvas dimension.
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.imagesc = function (canvas, scale) {
        var min = this.min().getDataScalar(), max = this.max().getDataScalar();
        if (min - max === 0) {
            return this['-'](min).imshow(canvas, scale);
        }
        return this['-'](min)['./'](max - min).imshow(canvas, scale);
    };
    /** Apply an affine transformation to an Image.
     * __Only works with `Uint8` images.__
     *
     * @param {Matrix} transform
     *  3x3 Matrix.
     *
     * @return {Matrix}
     */
    Matrix_prototype.imtransform = function (transform) {

        transform = Matrix.toMatrix(transform);

        var h = this.getSize(0), w = this.getSize(1);
        var c1 = createCanvas(w, h), ctx1 = c1.getContext("2d");
        var c2 = createCanvas(), ctx2 = c2.getContext("2d");

        var p = Matrix.toMatrix([0, 0, 1, w, 0, 1, w, h, 1, 0, h, 1]).reshape([3, 4]);
        var pp = transform.mtimes(p).transpose();
        var max = pp.max(0).getData(), min = pp.min(0).getData();
        var imageData = this.getImageData();
        ctx1.putImageData(imageData, 0, 0);

        var d = transform.getData();
        c2.width = max[0] - min[0];
        c2.height = max[1] - min[1];
        ctx2.translate(-min[0], -min[1]);
        ctx2.transform(d[0], d[1], d[3], d[4], d[6], d[7]);
        ctx2.drawImage(c1, 0, 0);
        return Matrix.imread(c2).convertImage(this.type());
    };
    /** Compute the histogram of an grey-level image.
     *
     * @param {Matrix} bins
     * number of bins used for the histogram.
     *
     * @return {Matrix}
     */
    Matrix_prototype.imhist = function (bins) {

        if (!this.ismatrix()) {
            throw new Error("Matrix.imhist: This function only works on grey-level images.");
        }

        bins = bins || 256;
        var data = this.getData();
        var hist = Matrix.zeros(bins, 1), hd = hist.getData();

        var M;
        if (this.isinteger()) {
            M = Matrix.intmax(this.type());
        } else if (this.islogical()) {
            M = 1;
            bins = 2;
        } else if (this.isfloat()) {
            M = 1;
        } else {
            throw new Error("Matrix.imhist: unknow data type.");
        }
        var i, ie, cst = 1 / M * bins;
        for (i = 0, ie = data.length; i < ie; i++) {
            hd[data[i] * cst | 0]++;
        }
        return hist;
    };
    
    (function () {
        var computeCDF = function (src, n) {
            var srcLength = src.length;

            // Compute histogram and histogram sum:
            var hist = new Float32Array(n);
            var i, floor = Math.floor;
            for (i = 0; i < srcLength; ++i) {
                var bin = floor(src[i] * n);
                bin = bin >= n ? n - 1 : bin;
                ++hist[bin];
            }
            var norm = 1 / srcLength;
            // Compute integral histogram:
            for (i = 1; i < n; ++i) {
                hist[i] += hist[i - 1];
                hist[i - 1] *= norm;
            }
            hist[i - 1] *= norm;
            return hist;
        };

        /** Perform an histogram equalisation.
         * __Until now it only works with Uint8 images.__
         *
         * @param {Matrix} bins
         * number of bins used for the histogram.
         *
         * @return {Matrix}
         */
        Matrix_prototype.histeq = function (n) {
            var im = this.im2double();
            var src = im;
            if (this.getSize(2) > 1) {
                src = im.applycform("RGB to HSL").select([], [], 2);
            } 
            src = src.getData();
            var hist = computeCDF(src, n);

            // Equalize image:
            var floor = Math.floor;
            for (var i = 0; i < src.length; ++i) {
                src[i] = hist[floor(src[i] * (n - 1))];
            }
            var lumOut = new Matrix([im.size(0), im.size(1)], src);
            var out = im.set([], [], 2, lumOut);
            if (this.getSize(2) > 1) {
                out = out.applycform("HSL to RGB");
            }
            return out;
        };
    })();

    /** Transform a RGB image to a gray level image.
     *
     * @chainable
     * @matlike
     */
    Matrix_prototype.rgb2gray = function () {
        if (this.ndims() !== 3 || this.getSize(2) < 3) {
            throw new Error('Matrix.rgb2gray: Matrix must be an ' +
                            'image with RGB components.');
        }

        // Scaning the from the second dimension (dim = 1)
        var sizeOut = this.getSize();
        sizeOut[2] -= 2;
        var imOut = new Matrix(sizeOut, this.getDataType());
        var id = this.getData(), od = imOut.getData();

        // Iterator to scan the view
        var view = this.getView();
        var ly = view.getEnd(0), ny;
        var dx = view.getStep(1), lx = view.getEnd(1), nx;
        var dc = view.getStep(2);

        var x, y0, y1, y2;
        for (x = 0, nx = lx; x !== nx; x += dx) {
            y0 = x;
            y1 = x + dc;
            y2 = x + 2 * dc;
            for (ny = x + ly; y0 < ny; y0++, y1++, y2++) {
                od[y0] = 0.3 * id[y0] + 0.59 * id[y1] + 0.11 * id[y2];
            }
        }

        // Copy alpha channel
        if (this.getSize(2) === 4) {
            var alphaOut = od.subarray(dc);
            var alphaIn = id.subarray(3 * dc);
            alphaOut.set(alphaIn);
        }

        return imOut;
    };

})(Matrix, Matrix.prototype);


//////////////////////////////////////////////////////////////////
//                  REGION AND IMAGE PROPERTIES                 //
//////////////////////////////////////////////////////////////////


(function () {

    /* Class for Tree creation */
    var Node = function (x, y, parent) {
        this.x = x;
        this.y = y;
	this.parent = parent;
    };
    Node.prototype.initChildren = function (w, h) {
        var x = this.x, y = this.y;
        if (y + 1 < h) {
	    this.top = new Node(x, y + 1, this);
        }
        if (y - 1 >= 0) {
	    this.bottom = new Node(x, y - 1, this);
        }
        if (x + 1 < w) {
	    this.left = new Node(x + 1, y, this);
        }
        if (x - 1 >= 0) {
	    this.right = new Node(x - 1, y, this);
        }
    }; 
    Node.prototype.remove = function (n) {
        if (this.bottom === n) {
            this.bottom = undefined;
        } else if (this.top === n) {
            this.top = undefined;
        } else if (this.right === n) {
            this.right = undefined;
        } else if (this.left === n) {
            this.left = undefined;
        }
        return this;
    };
    Node.prototype.getNext = function () {
        if (this.top) {
	    return this.top;
        }
        if (this.bottom) {
	    return this.bottom;
        }
        if (this.left) {
	    return this.left;
        }
        if (this.right) {
	    return this.right;
        }
        if (this.parent) {
            return this.parent.remove(this).getNext();
        }
        return undefined;
    };
    
    /** From an image and a pixel request select neighbour pixels with a similar values
     * (RGB or grey level).
     * @param{Number} xRef 
     *  x coordinate of the pixel.
     * @param{Number} yRef 
     *  x coordinate of the pixel.
     * @param{Number} t 
     *  threshold on the distance
     * @return{Matrix}
     *  Return a Matrix with boolean values.
     */
    Matrix.prototype.getConnectedComponent = function (xRef, yRef, t) {
        
        // Get image height, width and depth
        var h = this.getSize(0), w = this.getSize(1), d = this.getSize(2);
        
        // Squared threshold
        var t2 = t * t;
        
        // Connected component and visited pixels
        var cc = new Matrix([h, w], 'logical'), isVisited = new Matrix([h, w], 'logical');
        var ccd = cc.getData(), imd = this.getData(), ivd = isVisited.getData();

        // For debug, has to be removed
        window.CC = cc;
        window.IV = isVisited;

        var cRef = yRef + h * xRef;
        var compare_pixels;
        if (d === 1) {
            if (this.type() === "logical") {
                
            } else  {
	        // Grey value of pixel request
	        var v = imd[cRef];
	        compare_pixels = function (c) {
	            var dTmp = imd[c] - v;
	            return dTmp * dTmp < t2;
	        };
            }
        } else if (d === 3) {
	    // RGB values of pixel request
	    var rRef = imd[cRef], gRef = imd[cRef + h * w], bRef = imd[cRef + h * w * 2];
	    // Image channel subarrays
	    var rd = imd, gd = imd.subarray(h * w), bd = imd.subarray(h * w * 2);
	    compare_pixels = function (c) {
	        var dTmp1 = rd[c] - rRef, dTmp2 = gd[c] - gRef, dTmp3 = bd[c] - bRef;
	        return dTmp1 * dTmp1 + dTmp2 * dTmp2 + dTmp3 * dTmp3 < t2;
	    };
        } else {
	    throw new Error("Matrix.getConnectedComponent: This function only support " +
                            "images with depth 1 or 3.");
        }

        var root = new Node(xRef, yRef), current = root;
        
        while (current !== undefined) {
            var x = current.x, y = current.y, c = y + h * x;
            
	    if (ivd[c] === 1) {
	        current = current.parent.remove(current).getNext();
                continue;
	    }
	    ivd[c] = 1;
	    if (compare_pixels(c)) {
	        ccd[c] = 1;
                current.initChildren(w, h);
	    }
            current = current.getNext();
        }

        return cc;
    };

    Matrix.prototype.bwconncomp = function () {};
    
})();


//////////////////////////////////////////////////////////////////
//                   MORPHOLOGICAL OPERATIONS                   //
//////////////////////////////////////////////////////////////////


(function (Matrix, Matrix_prototype) {
    "use strict";

    var getLoopIndices = function (FX, FY, w, h) {
        var HFY = FY >> 1, HFX = FX >> 1;
        return {
            xS: new Int32Array([0, 0, 0, HFX, HFX, HFX, w - HFX, w - HFX, w - HFX]),
	    xE: new Int32Array([HFX, HFX, HFX, w - HFX, w - HFX, w - HFX, w, w, w]),
            yS: new Int32Array([0, HFY, h - HFY, 0, HFY, h - HFY, 0, HFY, h - HFY]),
	    yE: new Int32Array([HFY, h - HFY, h, HFY, h - HFY, h, HFY, h - HFY, h]),
        
	    jS: new Int32Array([0, 0, 0, -HFX, -HFX, -HFX, -HFX, -HFX, -HFX]),
	    jE: new Int32Array([HFX + 1, HFX + 1, HFX + 1, HFX + 1, HFX + 1, HFX + 1, w, w, w]),
	    iS: new Int32Array([0, -HFY, -HFY, 0, -HFY, -HFY, 0, -HFY, -HFY]),
	    iE: new Int32Array([HFY + 1, HFY + 1, h, HFY + 1, HFY + 1, h, HFY + 1, HFY + 1, h]),
        
	    lS: new Int32Array([HFX, HFX, HFX,  0,  0,  0 ,      0,       0,       0]),
	    lE: new Int32Array([ FX,  FX,  FX, FX, FX, FX, HFX + w, HFX + w, HFX + w]),
	    kS: new Int32Array([HFY,  0,       0, HFY,  0,       0, HFY,  0,       0]),
	    kE: new Int32Array([ FY, FY, HFY + h,  FY, FY, HFY + h,  FY, FY, HFY + h]),
            
            jxS: new Int32Array([0, 0, 0, 1, 1, 1, 1, 1, 1]),
	    jxE: new Int32Array([1, 1, 1, 1, 1, 1, 0, 0, 0]),
	    iyS: new Int32Array([0, 1, 1, 0, 1, 1, 0, 1, 1]),
	    iyE: new Int32Array([1, 1, 0, 1, 1, 0, 1, 1, 0])
        };
    };
    
    var f_dilate = function (d, m, h, fh, yx, is, js, ks, ie, ls, _je) {
        var max = -Infinity;
        for (var _j = js, _l = ls; _j < _je; _j += h, _l += fh) {
	    for (var ij = is + _j, kl = ks + _l, ije = ie + _j; ij < ije; ij++, kl++) {
                if (d[ij] > max && m[kl]) {
		    max = d[ij];
                }
	    }
        }
        return max;
    };
    var f_erode = function (d, m, h, fh, yx, is, js, ks, ie, ls, _je) {
        var min = Infinity;
        for (var _j = js, _l = ls; _j < _je; _j += h, _l += fh) {
	    for (var ij = is + _j, kl = ks + _l, ije = ie + _j; ij < ije; ij++, kl++) {
                if (d[ij] < min && m[kl]) {
		    min = d[ij];
                }
	    }
        }
        return min;
    };
    var f_filt = function (d, m, h, fh, yx, is, js, ks, ie, ls, _je) {
        var sum = 0;
        for (var _j = js, _l = ls; _j < _je; _j += h, _l += fh) {
	    for (var ij = is + _j, kl = ks + _l, ije = ie + _j; ij < ije; ij++, kl++) {
		sum += d[ij] * m[kl];
	    }
        }
        return sum;
    };
    var applyFilter = function (im, mask, f) {
        var h = im.getSize(0), w = im.getSize(1), d = im.getSize(2), id = im.getData();
        var out = new Matrix(im.getSize(), im.type()), od = out.getData();

        // Filter size and data
        var FY = mask.getSize(0), FX = mask.getSize(1), md = mask.getData();
        
        // Loop indices
        var li = getLoopIndices(FX, FY, w, h);
        // Loop start (S) and end (E) indices
        var xS  = li.xS,  xE  = li.xE,   yS  = li.yS,  yE  = li.yE,
	    jS  = li.jS,  jE  = li.jE,   iS  = li.iS,  iE  = li.iE,
	    lS  = li.lS,  kS  = li.kS,
            jxS = li.jxS, jxE = li.jxE, iyS = li.iyS, iyE = li.iyE;

        // Loop indices
        var b, c, x, y, _x, yx, _j, ij, _l, kl;
        // Loop end indices
        var ce, xe, ye, ije;
        for (c = 0, ce = id.length; c < ce; c += w * h) {
            var idc = id.subarray(c, c + w * h), odc = od.subarray(c, c + w * h);
            for (b = 0; b < 9; b++) {
	        for (x = xS[b], xe = xE[b], _x = x * h; x < xe; x++, _x += h) {
                    var js = (jS[b] + (jxS[b] ? x : 0)) * h, _je = (jE[b] + (jxE[b] ? x : 0)) * h;
                    var ls = (lS[b] - (jxS[b] ? 0 : x)) * FY;
	            for (y = yS[b], ye = yE[b], yx = y + _x; y < ye; y++, yx++) {
                        var is = iS[b] + (iyS[b] ? y : 0), ie = iE[b] + (iyE[b] ? y : 0);
                        var ks = kS[b] - (iyS[b] ? 0 : y);
                        odc[yx] = f(idc, md, h, FY, yx, is, js, ks, ie, ls, _je);
		    }
	        }
	    }
        }
        return out;
    };

    /** Perform an image dilation with a given structuring element.
     *
     * __Also see:__
     * {@link Matrix#imerode},
     * {@link Matrix#imopen},
     * {@link Matrix#imclose}.
     * @param{Matrix} elem
     *  The structuring element
     * @return{Matrix}
     * @matlike
     */
    Matrix_prototype.imdilate = function (mask) {
        return applyFilter(this, mask, f_dilate);
    };
    /** Perform an image erosion with a given structuring element.
     *
     * __Also see:__
     * {@link Matrix#imdilate},
     * {@link Matrix#imopen},
     * {@link Matrix#imclose}.
     * @param{Matrix} elem
     *  The structuring element
     * @return{Matrix}
     * @matlike
     */
    Matrix_prototype.imerode = function (mask) {
        return applyFilter(this, mask, f_erode);
    };
    /** Perform an image opening with a given structuring element.
     *
     * __Also see:__
     * {@link Matrix#imdilate},
     * {@link Matrix#imerode},
     * {@link Matrix#imclose}.
     *
     * @param{Matrix} elem
     *  The structuring element
     * @return{Matrix}
     */
    Matrix_prototype.imopen = function (mask) {
        return applyFilter(applyFilter(this, mask, f_erode), mask, f_dilate);
    };
    /** Perform an image closing with a given structuring element.
     *
     * __Also see:__
     * {@link Matrix#imdilate},
     * {@link Matrix#imerode},
     * {@link Matrix#imopen}.
     *
     * @param{Matrix} elem
     *  The structuring element
     * @return{Matrix}
     * @matlike
     */
    Matrix_prototype.imclose = function (mask) {
        return applyFilter(applyFilter(this, mask, f_dilate), mask, f_erode);
    };
    /** Filter an image.
     * @param{Matrix} filter
     *  The filter to apply (2D kernel).
     * @return{Matrix}
     * @matlike
     * @todo should check if the kernel is separable with an SVD.
     */
    Matrix_prototype.imfilter = function (mask) {
        return applyFilter(this, mask, f_filt);
    };
    /** Median filter.
     *
     * /!\ This function si currently Very slow.
     *
     * @param{Matrix} mask
     *  Boolean mask.
     * @return {Matrix} 
     */ 
    Matrix_prototype.median = function (mask) {
        var arg = (mask.length * 0.5) | 0;
        var f_med = function (d, m, h, fh, yx, is, js, ks, ie, ls, _je) {
            var values = [];
            for (var _j = js, _l = ls; _j < _je; _j += h, _l += fh) {
	        for (var ij = is + _j, kl = ks + _l, ije = ie + _j; ij < ije; ij++, kl++) {
                    if (m[kl]) {
		        values.push(d[ij]);
                    }
	        }
            }
            return values.sort()[arg];
        };
        return applyFilter(this, mask, f_med);
    };
    /** Bilateral filtering.
     *
     * __Also see:__
     * {@link Matrix#imfilter}.
     *
     * @param {Number} sigma_s
     *  Value for spacial sigma.
     *
     * @param {Number} sigma_i
     *  Value for intensity sigma.
     *
     * @param {Number} [precision=3]
     *  used to compute the window size (size = precision * sigma_s).
     *
     * @return {Matrix}
     */
    Matrix_prototype.imbilateral = function (sigma_s, sigma_i, prec) {
        prec = prec || 3;
        var mask = Matrix.fspecial('gaussian', Math.round(prec * sigma_s / 2) * 2 + 1, sigma_s);
        var cst = -1 / (2 * sigma_i);
        var f_bilat = function (d, m, h, fh, yx, is, js, ks, ie, ls, _je) {
            var sum = 0, val = 0, v = d[yx];
            for (var _j = js, _l = ls; _j < _je; _j += h, _l += fh) {
	        for (var ij = is + _j, kl = ks + _l, ije = ie + _j; ij < ije; ij++, kl++) {
    	            var tmp = v - d[ij];
                    var weight = m[kl] * Math.exp(cst * tmp * tmp);
                    sum += weight;
                    val += d[ij] * weight;
		    //sum += d[ij] * m[kl];
	        }
            }
            return val / sum;
        };
        return applyFilter(this, mask, f_bilat);
    }
})(Matrix, Matrix.prototype);


//////////////////////////////////////////////////////////////////
//                 FAST FOURIER TRANSFORM MODULE                //
//////////////////////////////////////////////////////////////////


(function (Matrix, Matrix_prototype) {
    'use strict';

    var SIZE_PRIME = 460;
    var primes = new Uint16Array([
        2,3,5,7,11,13,17,19,23,29,
        31,37,41,43,47,53,59,61,67,71,
        73,79,83,89,97,101,103,107,109,113,
        127,131,137,139,149,151,157,163,167,173,
        179,181,191,193,197,199,211,223,227,229,
        233,239,241,251,257,263,269,271,277,281,
        283,293,307,311,313,317,331,337,347,349,
        353,359,367,373,379,383,389,397,401,409,
        419,421,431,433,439,443,449,457,461,463,
        467,479,487,491,499,503,509,521,523,541,
        547,557,563,569,571,577,587,593,599,601,
        607,613,617,619,631,641,643,647,653,659,
        661,673,677,683,691,701,709,719,727,733,
        739,743,751,757,761,769,773,787,797,809,
        811,821,823,827,829,839,853,857,859,863,
        877,881,883,887,907,911,919,929,937,941,
        947,953,967,971,977,983,991,997,1009,1013,
        1019,1021,1031,1033,1039,1049,1051,1061,1063,1069,
        1087,1091,1093,1097,1103,1109,1117,1123,1129,1151,
        1153,1163,1171,1181,1187,1193,1201,1213,1217,1223,
        1229,1231,1237,1249,1259,1277,1279,1283,1289,1291,
        1297,1301,1303,1307,1319,1321,1327,1361,1367,1373,
        1381,1399,1409,1423,1427,1429,1433,1439,1447,1451,
        1453,1459,1471,1481,1483,1487,1489,1493,1499,1511,
        1523,1531,1543,1549,1553,1559,1567,1571,1579,1583,
        1597,1601,1607,1609,1613,1619,1621,1627,1637,1657,
        1663,1667,1669,1693,1697,1699,1709,1721,1723,1733,
        1741,1747,1753,1759,1777,1783,1787,1789,1801,1811,
        1823,1831,1847,1861,1867,1871,1873,1877,1879,1889,
        1901,1907,1913,1931,1933,1949,1951,1973,1979,1987,
        1993,1997,1999,2003,2011,2017,2027,2029,2039,2053,
        2063,2069,2081,2083,2087,2089,2099,2111,2113,2129,
        2131,2137,2141,2143,2153,2161,2179,2203,2207,2213,
        2221,2237,2239,2243,2251,2267,2269,2273,2281,2287,
        2293,2297,2309,2311,2333,2339,2341,2347,2351,2357,
        2371,2377,2381,2383,2389,2393,2399,2411,2417,2423,
        2437,2441,2447,2459,2467,2473,2477,2503,2521,2531,
        2539,2543,2549,2551,2557,2579,2591,2593,2609,2617,
        2621,2633,2647,2657,2659,2663,2671,2677,2683,2687,
        2689,2693,2699,2707,2711,2713,2719,2729,2731,2741,
        2749,2753,2767,2777,2789,2791,2797,2801,2803,2819,
        2833,2837,2843,2851,2857,2861,2879,2887,2897,2903,
        2909,2917,2927,2939,2953,2957,2963,2969,2971,2999,
        3001,3011,3019,3023,3037,3041,3049,3061,3067,3079,
        3083,3089,3109,3119,3121,3137,3163,3167,3169,3181,
        3187,3191,3203,3209,3217,3221,3229,3251,3253,3257
    ]);


    /**
     * decompose n into prime factors and returns the number of terms
     * tab should be large enough to contain all factors (32 seems enough)
     * Note: returns 0 if n==1, and do not work if n > MAX_PRIME^2
     */
    var decompose = function (n) {
        if (n == 1) {
            return 0;
        }
        var tab = [], count, i, p;

        // search factors
        for (count = i = 0; i < SIZE_PRIME; i++) {
            if ((n % primes[i]) === 0) {
                p = primes[i];
                do {
	            tab[count] = p;
	            count++;
	            n = n / p;
                } while ((n % p) === 0);
            }
        }
        // If n is prime
        if (n !== 1) {
            tab[count] = n;
            count++;
        }

        return tab;
    };

    var SWAP = function (tab, a, b) {
        var tmp = tab[a];
        tab[a] = tab[b];
        tab[b] = tmp;
    };

    var storeResult = function (data, real, imag, isign) {
        var n = data.length / 2, i, j;
        if (isign === 1) {
            for (i = 0, j = 0; i < n; i++) {
	        real[i] = data[j++];
	        imag[i] = -data[j++];
            }
        } else {
            var i_n = 1 / n;
            for (i = 0, j = 0; i < n; i++) {
	        real[i] = data[j++] * i_n;
	        imag[i] = -data[j++] * i_n;
            }
        }
    };

    var storeInput = function (Xr, Xi) {
        var size = Xr.length, i, j;
        var data = new Float64Array(2 * size);
        if (Xi) {
            for (i = 0, j = 0; i < size; i++) {
                data[j++] = Xr[i];
                data[j++] = -Xi[i];
            }
        } else {
            for (i = 0, j = 0; i < size; i++, j++) {
                data[j++] = Xr[i];
            }
        }
        return data;
    };

    // Faster algorithm when the signal size is a power of two (original code)
    var fft1d_2n = function (Xr, Xi, isign) {

        var m, l, j, istep, i;
        var wtemp, wr, wpr, wpi, wi, theta;
        var tempr, tempi;

        var size = Xr.length, data = storeInput(Xr, Xi);

        // Compute FFT of "data" array
        var n = size << 1;
        for (i = 1, j = 1; i < n; i += 2) {
            if (j > i) {
                SWAP(data, j - 1, i - 1);
                SWAP(data, j, i);
            }
            m = n >> 1;
            while (m >= 2 && j > m) {
                j = j - m;
                m >>= 1;
            }
            j = j + m;
        }

        var mmax = 2;

        while (n > mmax) {
            istep = 2 * mmax;
            theta = 2 * Math.PI / (isign * mmax);
            wtemp = Math.sin(0.5 * theta);
            wpr = -2.0 * wtemp * wtemp;
            wpi = Math.sin(theta);
            wr = 1.0;
            wi = 0.0;
            for (m = 1; m < mmax; m += 2) {
                for (i = m - 1; i <= n - 1; i += istep) {
	            j = i + mmax;
	            tempr = wr * data[j] - wi * data[j + 1];
	            tempi = wr * data[j + 1] + wi * data[j];
	            data[j] = data[i] - tempr;
	            data[j + 1] = data[i + 1] - tempi;
	            data[i] += tempr;
	            data[i + 1] += tempi;
                }
                wr = (wtemp = wr) * wpr - wi * wpi + wr;
                wi = wi * wpr + wtemp * wpi + wi;
            }
            mmax = istep;
        }
        return data;
    };

    var fft1d_full = function (Xr, Xi, isign, tab) {

        var size = Xr.length;

        var mc = new Float64Array(size), ms = new Float64Array(size);
        var PI2IN = 2 * Math.PI / size;
        for (i = 0; i < size; i++) {
            mc[i] = Math.cos(i * PI2IN);
            ms[i] = isign * Math.sin(i * PI2IN);
        }

        var data = storeInput(Xr, Xi), d = new Float64Array(2 * size);

        var i, j, k, l, p, nsmp, mp;
        var m = 1, e, t = tab.length;
        for (e = 0; e < t; e++) {
            p = tab[e];
            nsmp = size / m / p;
            mp = m * p;
            for (k = 0; k < 2 * size; k++) {
                d[k] = 0;
            }
            for (j = 0; j < p; j++) {
	        for (l = 0; l < mp; l++) {
                    var indice = ((l * j) % mp) * nsmp;
	            var wljx = mc[indice], wljy = ms[indice];
                    var idxd = 2 * nsmp * l, idxs = 2 * nsmp * (j + (l % m) * p);
	            for (i = 0; i < nsmp; i++, idxd += 2, idxs += 2) {
	                d[idxd] += data[idxs] * wljx - data[idxs + 1] * wljy;
	                d[idxd + 1] += data[idxs] * wljy + data[idxs + 1] * wljx;
	            }
	        }
            }
            var tmpf = data;
            data = d;
            d = tmpf;
            m *= p;
        }
        return data;
    };

    var fft1d = function (Xr, Xi, Yr, Yi, inverse) {
        var n = Xr.length, tab = decompose(n), t = tab.length;
        var isign = !inverse ? 1 : -1, data;
        if (n > 1 && tab[t - 1] != 2) {
            data = fft1d_full(Xr, Xi, isign, tab);
        } else {
            data = fft1d_2n(Xr, Xi, isign);
        }
        return storeResult(data, Yr, Yi, isign);
    };

    var matrix_fft = function (X, inverse) {
        if (X.isreal()) {
            X.toComplex();
        }
        // Ouptut matrix
        var Y = new Matrix(X.getSize(), Float64Array, true);
        var Xr = X.getRealData(), Xi = X.getImagData();
        var Yr = Y.getRealData(), Yi = Y.getImagData();

        // This will apply the fft on each column vector of the matrix
        var m = X.getSize(0), n = X.numel() / m;
        for (var j = 0, _j = 0; j < n; j++, _j += m) {
            var cXr = Xr.subarray(_j, m + _j), cXi = Xi.subarray(_j, m + _j);
            var cYr = Yr.subarray(_j, m + _j), cYi = Yi.subarray(_j, m + _j);
            fft1d(cXr, cXi, cYr, cYi, inverse);
        }
        return Y;
    };

    /** Compute the FFT of a vector.
     *
     * __See also :__
     * {@link Matrix#ifft},
     * {@link Matrix#fft2}.
     *
     *     var sz = 1024;
     *     var ar = Matrix.rand(sz, 1), ai = Matrix.rand(sz, 1);
     *     var a = Matrix.complex(ar, ai);
     *
     *     Tools.tic();
     *     for (var i = 0; i < sz; i++) {
     *       var fft = a.fft();
     *       var ifft = fft.ifft();
     *     }
     *     var t = Tools.toc()
     *     var err = a['-'](ifft).abs().mean().getDataScalar();
     *     console.log("Average Error", err, "Time:", t);
     *
     * @author
     *  This code came from the Megawave image processing toolbox.
     *  The authors credited for this module are :
     *  Chiaa Babya, Jacques Froment, Lionel Moisan and Said Ladjal.
     */
    Matrix_prototype.fft = function () {
        return matrix_fft(this, false);
    };
    Matrix.fft = function (X) {
        return matrix_fft(Matrix.toMatrix(X), false);
    };
    Matrix_prototype.fft2 = function () {
        var Y = matrix_fft(this, false);
        Y = matrix_fft(Y.transpose(), false);
        return Y.transpose();
    };
    /** Compute the 2D FFT of a matrix.
     *
     * __See also :__
     * {@link Matrix#fft},
     * {@link Matrix#ifft2}.
     */
    Matrix.fft2 = function (X) {
        var Y = matrix_fft(Matrix.toMatrix(X), false);
        Y = matrix_fft(Y.transpose(), false);
        return Y.transpose();
    };

    /** Compute the inverse FFT of a vector.
     *
     * __See also :__
     * {@link Matrix#fft},
     * {@link Matrix#fft2}
     *
     * @author
     *  This code came from the Megawave image processing toolbox.
     *  The authors credited for this module are :
     *  Chiaa Babya, Jacques Froment, Lionel Moisan and Said Ladjal.
     */
    Matrix_prototype.ifft = function () {
        return matrix_fft(this, true);
    };
    Matrix.ifft = function (X) {
        return matrix_fft(Matrix.toMatrix(X), false);
    };
    /** Compute the inverse 2D FFT of a matrix.
     *
     * __See also :__
     * {@link Matrix#fft2},
     * {@link Matrix#ifft}.
     */
    Matrix_prototype.ifft2 = function () {
        return this.fft().transpose().fft().transpose();
    };
    Matrix.ifft2 = function (X) {
        return Matrix.toMatrix(X).fft().transpose().fft().transpose();
    };

})(Matrix, Matrix.prototype);
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

var root = typeof window === 'undefined' ? module.exports : window;

(function (global) {
    /** @class Mode 
     * Create an object describing an interval `[i, j]` of an histogram.
     * @param {Integer} i
     *  First bin.
     * @param {Integer} j
     *  Last bin.
     * @param {Number} [measure]
     *  Field to used to store the meaningfulness measure of the interval.
     * @param {Array} [histogram]
     *  If the histogram is provided, then the center of mass of the histogram
     *  is computed.
     * @constructor
     */
    function Mode(a, b, measure, hist) {
        'use strict';
        this.bins = [a, b];
        this.mesure = measure;
        if (hist) {
            this.baryCenter(hist);
        }
    }
    /** Convert the mode to string for export purpose. */
    Mode.prototype.toString = function () {
        'use strict';
        return '[' + this.bins.toString() + ']';
    };
    /** Provide a copy of the mode. */
    Mode.prototype.getCopy = function () {
        'use strict';
        var newMode = new Mode(this.bins[0], this.bins[1], this.mesure);
        newMode.norm = this.norm;
        newMode.phase = this.phase;
        return newMode;
    };
    /** Function used to sort the mode according to the measure field. */
    Mode.prototype.compar = function (m1, m2) {
        'use strict';
        return m1.mesure < m2.mesure;
    };
    /** Function used to compute the barycenter of a mode. */
    Mode.prototype.baryCenter = function (histogram, normFactor) {
        'use strict';
        var size = histogram.length;
        var min = this.bins[0], max = this.bins[1];
        normFactor = normFactor || size;
        var bc = 0, j, weightMode = 0;

        if (max >= min) {
	    // Compute weight of meaningful mode
            for (j = min; j <= max; j++) {
                weightMode += histogram[j];
            }
	    // compute barycenter of mode
            for (j = min; j <= max; j++) {
                bc += histogram[j] * j;
            }
            bc /= weightMode;
        } else {
	    // Compute weight of meaningful mode
            for (j = min; j < size; j++) {
                weightMode += histogram[j];
            }
            for (j = 0; j <= max; j++) {
                weightMode += histogram[j];
            }

	    // compute barycenter of mode
            for (j = min; j < size; j++) {
                bc += histogram[j] * (j - min);
            }
            for (j = 0; j <= max; j++) {
                bc += histogram[j] * (j + size - min);
            }

            bc /= weightMode;
            bc += min;

            bc = bc >= size ? (bc - size) : bc;
        }

        this.norm = weightMode;
        this.phase = bc / normFactor;
        return this;
    };

    root.Mode = Mode;
})(root);

(function (global) {
    'use strict';
    
    /** 
     * @class JSM
     * @singleton 
     * @private
     */

    /** Compute on place the cumulative sum of an array. 
     * @param {Array} t
     * @private
     */
    var integrate = function (t) {
        var i, ei;
        for (i = 1, ei = t.length; i < ei; i++) {
            t[i] += t[i - 1];
        }
    };
    /** Normalize an array by a given value.
     * @param {Array} t
     * @param {Number} cst
     * @private
     */
    var norm = function (t, cst) {
        cst = 1 / cst;
        var i, ei;
        for (i = 0, ei = t.length; i < ei; i++) {
            t[i] *= cst;
        }
    };
    /** For each interval `[i, j]` of a **cumulate** histogram of size `N`, 
     * compute the mass inside. The result is returned as a 2D array `m`. The
     * histogram can be circular or not. Intervals added by considering the non
     * circular case are interval with `i > j`. The mass contained by an 
     * interval `[i, j]` correspond, to the cell `i * N + j`.
     * @param {Array} h
     *  The cumulate histogram.
     * @param {Boolean} circular
     *  True if the histogram has to be considered as circular.
     * @param {Number} cst
     *  The mass of the histogram.
     * @private
     */
    var vectorToIntervals = function (v, circular, cst) {
        var i, i_, j, ij, e = v.length;
        var m = new Float32Array(e * e);

        for (ij = 0; ij < e; ij++) {
            m[ij] = v[ij];
        }
        for (i = 1, i_ = e; i < e; i++, i_ += e) {
            if (circular) {
                for (j = 0, ij = i_; j < i; j++, ij++) {
                    m[ij] = v[j] + cst - v[i - 1];
                }
            }
            for (j = i, ij = i_ + j; j < e; j++, ij++) {
                m[ij] = v[j] - v[i - 1];
            }
        }
        return m;
    };
    /** Compute the entropy for all the intervals of an histogram.
     * @param {Array} r
     *  The relative mass of the intervals. That is the mass inside the interval
     *  divided by the global mass of the histogram.
     * @param {Array} proba
     *  The probabilities to fall inside the intervals.
     * @param {Function} fct
     *  The function used to compute the entropies. As parameters, it takes the 
     *  relative mass of the histogram and the probability to fall inside the 
     *  histogram.
     * @param {Number} cst
     *  The average mass per point.
     * @param {Boolean} circular
     *  True if the histogram has to be considered as circular.
     * @private
     */
    var computeEntropy = function (r, p, fct, cst, circular) {
        var i, i_, ij, L = Math.sqrt(r.length), ei, eij;
        var Hmod = new Float32Array(L * L);
        var Hgap = new Float32Array(L * L);

        for (i = 0, i_ = 0, ei = L * L; i_ < ei; i++, i_ += L) {
            if (circular) {
                for (ij = i_, eij = i_ + i; ij < eij; ij++) {
                    Hmod[ij] = fct(r[ij], p[ij]);
                    Hgap[ij] = fct(cst - r[ij], 1 - p[ij]);
                }
            }
            for (ij = i_ + i, eij = i_ + L; ij < eij; ij++) {
                Hmod[ij] = fct(r[ij], p[ij]);
                Hgap[ij] = fct(cst - r[ij], 1 - p[ij]);
            }
        }
        return [Hmod, Hgap];
    };
    /** Return a discrete uniform distribution.
     * @param{Integer} t
     *  The number of bins.
     * @private
     */
    var getUniformPdf = function (t) {
        var groundPdf = new Float32Array(t.length);
        var i, e = t.length, cst = 1 / e;
        for (i = 0; i < e; i++) {
            groundPdf[i] = cst;
        }
        return groundPdf;
    };
    /** Return the function used to compute the entropy.
     * @param{Integer} M
     *  The number of point used to compute the histogram.
     * @param{Number} mu
     *  The average mass of the points.
     * @param{Number} sigma2
     *  The variance of mass of the points.
     * @private
     */
    var getEntropyFct = function (M, mu, sigma2) {
        var log = Math.log, sqrt = Math.sqrt, lerfc = Math.lerfc;
        var ILOG10 = 1 / log(10), L1P2 = log(0.5);
        var MIN = Number.MIN_VALUE;

        // Histogram built with gaussian mass
        if (mu !== undefined && sigma2 !== undefined) {

            var c1 = -1 / M * ILOG10, c2 = M * mu, c3 = sigma2 / mu;
            return function (r, p) {
                if (p <= MIN) {
                    return 0;
                }
                var m = p * c2;
                var s = m * (mu * (1 - p) + c3);
                var z = (M * r - m) / sqrt(2 * s);
                return (L1P2 + lerfc(z)) * c1;
            };
            // Histogram built with unit mass
        } else {
            return function (r, p) {
                if (r <= p || p <= MIN) {
                    return 0;
                }
                if (r === 1) {
                    return -log(p) * ILOG10;
                }
                return (r * log(r / p) + (1 - r) * log((1 - r) / (1 - p))) * ILOG10;
            };

        }
    };

    /** Return the threshold to determine is an interval is meaningful or not.
     * @param{Integer} L
     *  The number of bins of the histogram considered.
     * @param{Integer} M
     *  The number of points used to compute the histogram.
     * @param{Number} eps
     *  Correspond to `-log10(<Expected number of false alarm>)`.
     * @param{Boolean} circular
     *  True if the histogram has to be considered as circular.
     * @private
     */
    var getThreshold = function (L, M, eps, circular) {
        if (circular) {
            return (Math.log(L * (L - 1)) / Math.log(10) + eps) / M;
        } else {
            return (Math.log(L * (L - 1) / 2) / Math.log(10) + eps) / M;
        }
    };

    /** Fast way to compute the maximum of three values.
     * @param{Number} v1
     * @param{Number} v2
     * @param{Number} v3
     * @private
     */
    var max = function (R, G, B) {
        if (R > G) {
            if (R > B) {
                return R;
            } else {
                return B;
            }
        } else {
            if (G > B) {
                return G;
            } else {
                return B;
            }
        }
    };
    /** Fast way to compute the minimum of three values.
     * @param{Number} v1
     * @param{Number} v2
     * @param{Number} v3
     * @private
     */
    var min = function (R, G, B) {
        if (R < G) {
            if (R < B) {
                return R;
            } else {
                return B;
            }
        } else {
            if (G < B) {
                return G;
            } else {
                return B;
            }
        }
    };

    /** Compute, for each interval `I`, the maximum entropy of the intervals 
     * contained by `I`.
     * @param{Array} H
     *  Array containing the entropy of all the intervals.
     * @param{Integer} L
     *  Number of bins in the considered histogram.
     * @param{Boolean} circular
     *  True if the histogram has to be considered as circular.
     * @return{Array}
     * @private
     */
    var maxInf = function (H, L, circular) {
        //var max = Math.max, min = Math.min;

        var i, ie, j, je, j2;
        var c = new Float32Array(L * L);
        // Smaller intervals (All cases)
        for (i = 0, ie = L * L; i < ie; i += L + 1) {
            c[i] = H[i];
        }

        // i in [L - 2, 0], j in [i + 1, L - 1] (All cases)
        for (i = L - 2; i >= 0; i--) {
            for (j = i * L + i + 1, je = (i + 1) * L; j < je; j++) {
                c[j] = max(c[j + L], c[j - 1], H[j]);
            }
        }

        if (circular) {
            // Bottom-left corner (Circular cases)
            c[(L - 1) * L] = max(c[0], c[(L - 1) * L + L - 1], H[(L - 1) * L]);
            // Last row
            for (j2 = 1, j = (L - 1) * L + j2; j2 < L - 1; ++j2, ++j) {
                c[j] = max(H[j], c[j2], c[j - 1]);
            }
            // First column (Circular cases)
            for (i = (L - 2) * L; i > 0; i -= L) {
                c[i] = max(H[i], c[i + L - 1], c[i + L]);
            }
            // i in [L - 2, 0], j in [1, i - 1] (Circular cases)
            for (i = L - 2; i > 0; i--) {
                for (j = i * L + 1, je = i * L + i; j < je; ++j) {
                    c[j] = max(H[j], c[j - 1], c[j + L]);
                }
            }
        }
        return c;
    };
    /** Compute, for an interval `I`, the maximum entropy of the intervals 
     * containing `I`.
     * @param{Array} H
     *  Array containing the entropy of all the intervals.
     * @param{Integer} L
     *  Number of bins in the considered histogram.
     * @param{Boolean} circular
     *  True if the histogram has to be considered as circular.
     * @return{Array}
     * @private
     */
    var maxSup = function (H, L, circular) {
        //var max = Math.max, min = Math.min;
        var i, ie, j, je, j2;
        var c = new Float32Array(L * L);
        // Max length intervals in circular case
        // They doesn't belong to a longer interval
        if (circular) {
            // Circular cases
            for (i = L, ie = L * L; i < ie; i += L + 1) {
                c[i] = H[i];
            }
            // i in [2, L - 1], j in [i - 2, 0] Circular Cases
            for (i = 2; i < L; ++i) {
                for (je = i * L - 1, j = i * L + i - 2; j > je; --j) {
                    c[j] = max(H[j], c[j - L], c[j + 1]);
                }
            }
        }
        c[L - 1] = H[L - 1];
        // First row (Circular and non-circular cases)
        for (j = L - 2, j2 = (L - 1) * L + j; j >= 0; --j, --j2) {
            c[j] = max(H[j], c[j + 1], c[j2]);
        }
        // Last column (Circular and non-circular cases)
        for (i = 1 * L, ie = L * L; i < ie; i += L) {
            c[i + L - 1] = max(c[i - 1], c[i], H[i + L - 1]);
        }
        // i in [1, L - 2], j in [L - 2, i] non-circular cases
        for (i = 1; i < L - 1; i++) {
            for (j = i * L + L - 2, je = i * L + i; j >= je; j--) {
                c[j] = max(c[j - L], c[j + 1], H[j]);
            }
        }
        return c;
    };
    /** For each interval, set the entropy to zero if the interval contained a
     * meaningful gap (resp. mode). Otherwise, return the entropy of the mode 
     * (resp. gap).
     * @param{Array} E1
     *  Array containing the entropy of all the interval when considered as 
     *  potential modes (resp. gaps).
     * @param{Array} E2
     *  Array containing the entropy of all the interval when considered as 
     *  potential gap (resp. modes).
     * @param{Integer} L
     *  The Number of bins of the histogram.
     * @param{Number} thresh
     *  The threshold used to decide whether or not the interval is meaningful.
     * @param{Boolean} circular
     *  True if the histogram has to be considered as circular.
     * @return{Array}
     * @private
     */
    var ifGapOrMode = function (Hmode, Hgap, L, thresh, circular) {
        var i, ie, i2, j, je, x, xe;

        var c = new Float32Array(L * L);
        for (x = 0, xe = c.length; x < xe; ++x) {
            c[x] = (Hgap[x] >= thresh) ? 1 : 0;
        }

        // i in [L - 2, 0], j in [i + 1, L - 1] (All cases)
        for (i = L - 2; i >= 0; i--) {
            for (j = i * L + i + 1, je = (i + 1) * L; j < je; j++) {
                c[j] += c[j - 1] + c[j + L];
            }
        }

        if (circular) {
            // Bottom-left corner (Circular cases)
            c[(L - 1) * L] += c[0] + c[(L - 1) * L + L - 1];
            // Last row (Circular cases)
            for (j = 1; j < L - 1; ++j) {
                c[(L - 1) * L + j] += c[j] + c[(L - 1) * L + j - 1];
            }
            // Other rows
            for (i2 = L - 2, i = i2 * L, ie = 0; i > ie; i -= L, --i2) {
                c[i] += c[i + L] + c[i + L - 1];
                for (j = i + 1, je = i + i2; j < je; ++j) {
                    c[j] += c[j - 1] + c[j + L];
                }
            }
        }
        for (x = 0, xe = c.length; x < xe; ++x) {
            c[x] = c[x] ? 0 : Hmode[x];
        }

        return c;
    };

    /** Select among all the intervals the maximum meaningful ones.
     * @param{Array} hist
     *  The histogram considered.
     * @param{Boolean} circular
     *  True if the histogram has to be considered as circular.
     * @param{Array} Hmod
     *  Array containing the entropy of all the interval when considered as 
     *  modes (resp. gaps). The entropy of the interval containing meaningful
     *  mode (resp. gap) as to be set to zero.
     * @param{Array} Hsup
     *  For each interval `I`, contain the maximum entropy of all the interval 
     *  containing `I`.
     * @param{Array} Hinf
     *  For each interval `I`, contain the maximum entropy of all the interval 
     *  contained by `I`.
     * @param{Number} thresh
     *  The threshold used to decide whether or not the interval is meaningful.
     * @return{Array} 
     *  Array containing the maximum meaningful intervals sorted by 
     *  meaningfulness.
     * @private
     */
    var selectIntervals = function (hist, circular, H, Hsup, Hinf, thresh) {
        // Determine maximum meaningful intervals
        var out = [];
        var i, i_, j, ij, L = Math.sqrt(H.length), ei, eij;
        for (i = 0, i_ = 0, ei = L * L; i_ < ei; i++, i_ += L) {
            for (j = circular ? 0 : i, ij = i_ + j, eij = i_ + L; ij < eij; j++, ij++) {
                if (H[ij] >= thresh && Hsup[ij] <= H[ij] && Hinf[ij] <= H[ij]) {
                    out.push(new Mode(i, j, H[ij], hist));
                }
            }
        }
        return out.sort(Mode.prototype.compar);
    };

    /** Control first the arguments and compute the entropy
     * @param {Array } hist
     *  The input histogram
     * @param {Boolean} [circular = false]
     *  True if the histogram is circular.
     * @param {Number} [eps = 0]
     *  Correspond to `-log10(<Expected number of false alarm>)`.
     * @param {Integer} [M]
     *  The number of points used to compute the histogram.
     * @param {Number} [mu]
     *  The average mass of the points.
     * @param {Number} [sigma2]
     *  The variance of the masses of the points.
     * @param {Array} [groundPdf]
     *  The discrete propability distribution of the points.
     * @private
     */
    var initialize = function (input, circular, eps, M, mu, sigma2, groundPdf) {

        // Duplicate input histogram
        var L = input.length;
        var hist = new Float32Array(input);

        circular = circular === undefined ? false : circular;
        eps = eps === undefined ? 0 : eps;
        groundPdf = groundPdf === undefined ? getUniformPdf(input) : new Float32Array(groundPdf);

        integrate(groundPdf);
        integrate(hist);

        var mass = hist[L - 1];
        M = M === undefined ? mass : M; 

        norm(groundPdf, groundPdf[L - 1]);
        norm(hist, M);

        var p = vectorToIntervals(groundPdf, circular, 1);
        var r, entropy, H;
        if (M && mu && sigma2) {
            r = vectorToIntervals(hist, circular, mass / M);
            entropy = getEntropyFct(M, mu, sigma2);
            H = computeEntropy(r, p, entropy, mass / M, circular);
        } else {
            r = vectorToIntervals(hist, circular, 1);
            entropy = getEntropyFct(M, mu, sigma2);
            H = computeEntropy(r, p, entropy, 1, circular);
        }
        var thresh = getThreshold(L, M, eps, circular);
        var Hmod = H[0], Hgap = H[1];

        return {Hmod: Hmod, Hgap: Hgap, thresh: thresh};
    };

    /** Extract the maximum meaningful intervals of an histogram (gaps and 
     * modes). This function handle the case where all points have the same mass
     * as well as the cases where they may be approximated by a gaussian 
     * distribution (Central limit theorem). 
     * @param {Array } hist
     *  The input histogram
     * @param {Boolean} [circular = false]
     *  True if the histogram is circular.
     * @param {Number} [eps = 0]
     *  Correspond to `-log10(<Expected number of false alarm>)`.
     * @param {Integer} [M]
     *  The number of points used to compute the histogram.
     * @param {Number} [mu = 1]
     *  The average mass of the points. 
     * @param {Number} [sigma2 = 0]
     *  The variance of the masses of the points.
     * @param {Array} [groundPdf]
     *  The discrete propability distribution of the points.
     * @private
     */
    var extractModesAndGaps = function (input, circular, eps, M, mu, sigma2, groundPdf) {

        var H = initialize(input, circular, eps, M, mu, sigma2, groundPdf);

        // Set entropy to zero if the interval contain a meaningful gap
        var Hgap = ifGapOrMode(H.Hgap, H.Hmod, input.length, H.thresh, circular);
        // Determine maximum entropy of gaps contained for each interval
        var HgapSup = maxSup(Hgap, input.length, circular);
        // Determine maximum entropy of gaps contained for each interval
        var HgapInf = maxInf(Hgap, input.length, circular);
        // Extract maximum meaningful gaps
        var gaps = selectIntervals(input, circular, Hgap, HgapSup, HgapInf, H.thresh);

        // Set entropy to zero if the interval contain a meaningful mode
        var Hmod = ifGapOrMode(H.Hmod, H.Hgap, input.length, H.thresh, circular);
        // Determine maximum entropy of modes contained for each interval
        var HmodSup = maxSup(Hmod, input.length, circular);
        // Determine maximum entropy of modes contained for each interval
        var HmodInf = maxInf(Hmod, input.length, circular);
        // Extract maximum meaningful modes
        var modes = selectIntervals(input, circular, Hmod, HmodSup, HmodInf, H.thresh);

        return {modes:modes, gaps: gaps};
    };

    /** Extract the maximum meaningful modes of an histogram.
     * See function {@link JSM#extractModesAndGaps} for more details.
     * @private
     */
    var extractModes = function (input, circular, eps, M, mu, sigma2, groundPdf) {

        var H = initialize(input, circular, eps, M, mu, sigma2, groundPdf);

        // Set entropy to zero if the interval contain a meaningful mode
        var Hmod = ifGapOrMode(H.Hmod, H.Hgap, input.length, H.thresh, circular);
        // Determine maximum entropy of modes contained for each interval
        var HmodSup = maxSup(Hmod, input.length, circular);
        // Determine maximum entropy of modes contained for each interval
        var HmodInf = maxInf(Hmod, input.length, circular);
        // Extract maximum meaningful modes
        var modes = selectIntervals(input, circular, Hmod, HmodSup, HmodInf, H.thresh);

        return modes;
    };
    /** Extract the maximum meaningful gaps of an histogram.
     * See function {@link JSM#extractModesAndGaps} for more details.
     * @private
     */
    var extractGaps = function (input, circular, eps, M, mu, sigma2, groundPdf) {

        var H = initialize(input, circular, eps, M, mu, sigma2, groundPdf);

        // Set entropy to zero if the interval contain a meaningful gap
        var Hgap = ifGapOrMode(H.Hgap, H.Hmod, input.length, H.thresh, circular);
        // Determine maximum entropy of gaps contained for each interval
        var HgapSup = maxSup(Hgap, input.length, circular);
        // Determine maximum entropy of gaps contained for each interval
        var HgapInf = maxInf(Hgap, input.length, circular);
        // Extract maximum meaningful gaps
        var gaps = selectIntervals(input, circular, Hgap, HgapSup, HgapInf, H.thresh);

        return gaps;
    };

    /** @class Matrix */

    /** Extract both modes and gaps of an histogram.
     *
     * __Also see:__
     * {@link Matrix#getModes},
     * {@link Matrix#getGaps}.
     *
     * @param {Boolean} [circular = false]
     *  True if the histogram is circular.
     * @param {Number} [eps = 0]
     *  Correspond to `-log10(<Expected number of false alarm>)`.
     * @param {Integer} [M]
     *  The number of points used to compute the histogram.
     * @param {Number} [mu]
     *  The average mass of the points.
     * @param {Number} [sigma2]
     *  The variance of the masses of the points.
     * @param {Array} [groundPdf]
     *  The discrete propability distribution of the points.
     * @return {Array} 
     *  Return an array of maximum meaningful modes detected in the histogram.
     *
     * NOTE ON IMPLEMENTATION
     * ======================
     *
     * The algorithm
     * -------------
     *
     * Let's assume that an histogram is built from a set of point. 
     * we also assume that each of these points contributes to the histogram
     * with a given weight (or mass).
     * 
     * The algorithm used here aims to detect interval of histograms where the
     * mass is significantly smaller (gaps) or larger (modes) than expected.
     * The expected mass in an interval is specified by two priors:
     *
     * + The distribution of points contributing to the histogram :
     *
     *   - can be uniform (default), 
     *   - or can be set with the parameter `groundPdf`.
     *
     * + The distribution of weights of these points :
     *
     *   - can be a dirac function (unit weight for each point),
     *   - or can be changed to gaussian by setting the parameters `mu` and 
     *     `sigma2`.
     *
     * Then intervals wich contradicts these distribution are defined as 
     * being meaningful. That is these intervals wich the algorithm is 
     * detecting.
     *
     * Intervals representation
     * ------------------------
     *
     * Possible intervals of an histogram can represented using a matrix.
     * In non-circular histogram case, there is `L * (L + 1) / 2` intervals
     * where L is the histogram length. These intervals are stored in the
     * upper part of the matrix.
     *
     * Matrix are stored in an 1D array in row-major order. Therefore, 
     * information relative to an interval `[i, j]` can be accessed by the 
     * formula `i * L + j`.
     *
     *     //      j
     *     //    _____
     *     //   |m***M|
     *     //   | m***| Diagonal elements 'm' represent minimum length 
     *     // i |  m**| intervals, 'M' element represent the maximum length 
     *     //   |   m*| interval and '*' elements the others.
     *     //   |    m|
     *     //    -----
     *
     *     //      j
     *     //    _____
     *     //   |m***M| 
     *     //   |Mm***| For the circular histogram case, there is L * L possible
     *     // i |*Mm**| intervals. Circular intervals can be accessed with the
     *     //   |**Mm*| matrix entry [i, j] with j < i.
     *     //   |***Mm|
     *     //    -----
     *
     * Maximum meaningfulness computation
     * ----------------------------------
     *
     * Meaningful modes are intervals with entropy above a given threshold.
     * The algorithm only retain maximum meaningful modes, i.e. interval
     * ensuring the following conditions:
     *
     * - it shall be a meaningful interval,
     * - it shall not contain a meaningful gap,
     * - it shall not be contained in a more meaningful interval,
     * - it shall not contain a more meaningful interval.
     *
     * To check these conditions, several computations are necessary.
     * for a all intervals `I`, the following implementation computes:
     *
     * - `maxSup`: the maximum entropy of intervals containing I,
     * - `maxInf`: the maximum entropy of intervals contained in I,
     * - `ifGapOrMode`: removes also the intervals containing a meaningful gap.
     *
     * These computations can be done efficiently noticing that:
     *
     *     //      j                              j
     *     //    _____                          _____
     *     //   |     |                        |     |
     *     //   |   * | An interval 'x' is     |  *x | An interval 'x'
     *     // i |   x*| contained in two     i |   * | contain two
     *     //   |     | intervals '*'          |     | intervals '*'
     *     //   |     |                        |     |
     *     //    -----                          -----
     *
     * Morevover an interval 'M' can't be contained by a larger interval
     * and an interval 'm' do not contain any interval.
     * Therfore, smartly ordering the comparaison (from the smallest to
     * the largest or inversly) allow to compute these
     * entropy efficiently.
     */
    Matrix.prototype.getModesAndGaps = function (circular, eps, M, mu, sigma2, groundPdf) {
        var input = this.getData();
        if (groundPdf instanceof Matrix) {
            groundPdf = groundPdf.getData();
        }
        return extractModesAndGaps(input, circular, eps, M, mu, sigma2, groundPdf);
    };
    Matrix.getModesAndGaps = function (input, circular, eps, M, mu, sigma2, groundPdf) {
        input = Matrix.toMatrix(input);
        return input.getModesAndGaps(circular, eps, M, mu, sigma2, groundPdf);
    };
    /** Extract the gaps of an histogram.
     *
     * __Also see:__
     * {@link Matrix#getModesAndGaps},
     * {@link Matrix#getGaps}.
     */
    Matrix.prototype.getModes = function (circular, eps, M, mu, sigma2, groundPdf) {
        var input = this.getData();
        if (groundPdf instanceof Matrix) {
            groundPdf = groundPdf.getData();
        }
        return extractModes(input, circular, eps, M, mu, sigma2, groundPdf);
    };
    Matrix.getModes = function (input, circular, eps, M, mu, sigma2, groundPdf) {
        input = Matrix.toMatrix(input);
        return input.getModes(circular, eps, M, mu, sigma2, groundPdf);
    };
    /** Extract the modes of an histogram.
     *
     * __Also see:__
     * {@link Matrix#getModesAndGaps},
     * {@link Matrix#getModes}.
     */
    Matrix.prototype.getGaps = function (circular, eps, M, mu, sigma2, groundPdf) {
        var input = this.getData();
        if (groundPdf instanceof Matrix) {
            groundPdf = groundPdf.getData();
        }
        return extractGaps(input, circular, eps, M, mu, sigma2, groundPdf);
    };
    Matrix.getGaps = function (input, circular, eps, M, mu, sigma2, groundPdf) {
        input = Matrix.toMatrix(input);
        return input.getGaps(circular, eps, M, mu, sigma2, groundPdf);
    };

    // EXPORTS
    root.extractModes = extractModes;
    root.extractGaps = extractGaps;
    root.extravctModesAndGaps = extractModesAndGaps
    
})(Matrix);


function getHistograms (phase, norm, bins, m, M, circular) {
    'use strict';
    var nPoints = 0, mu = 0, sigma = 0;
    var i, ie;
    var hist, histw, tmp, val;
    var floor = Math.floor, cst = 1 / (M - m), ind;
    hist = new Float32Array(bins);
    if (norm) {
        histw = new Float32Array(bins);
        if (circular) {
            for (i = 0, ie = phase.length; i < ie; i++) {
                ind = floor(((phase[i] - m) * cst) * bins);
                ind = ind < 0 ? bins + (ind % bins) : ind % bins;
                histw[ind] += norm[i];
                hist[ind]++;
                mu += norm[i];
                nPoints++;
            }
            mu /= nPoints;
            for (i = 0, ie = phase.length; i < ie; i++) {
                tmp = norm[i] - mu;
                sigma += tmp * tmp;
            }
            sigma = sigma / (nPoints - 1);
        } else {
            for (i = 0, ie = phase.length; i < ie; i++) {
                val = phase[i];
                if (val < m || val > M) {
                    continue;
                }
                ind = floor(((phase[i] - m) * cst) * bins);
                histw[ind] += norm[i];
                hist[ind]++;
                mu += norm[i];
                nPoints++;
            }
            mu /= nPoints;
            for (i = 0, ie = phase.length; i < ie; i++) {
                val = phase[i];
                if (val < m || val > M) {
                    continue;
                }
                tmp = norm[i] - mu;
                sigma += tmp * tmp;
            }
            sigma = sigma / (nPoints - 1);
        }
    } else {
        if (circular) {
            for (i = 0, ie = phase.length; i < ie; i++) {
                ind = floor(((phase[i] - m) * cst) * bins);
                ind = ind < 0 ? bins + (ind % bins) : ind % bins;
                hist[ind]++;
                nPoints++;
            }
        } else {
            for (nPoints = 0, i = 0, ie = phase.length; i < ie; i++) {
                ind = floor(((phase[i] - m) * cst) * bins);
                if (ind < 0 || ind > bins) {
                    continue;
                }
                hist[ind]++;
                nPoints++;
            }
        }
    }
    return {
        histw: histw,
        hist: hist,
        mu: mu,
        sigma: sigma,
        M: nPoints
    };
}








































/*
function extractModes_old(input, circular, eps, M, mu, sigma2, groundPdf) {
    'use strict';
    // Loop indices
    var i, j, x;

    if (circular === undefined) {
        circular = false;
    }
    if (eps === undefined) {
        eps = 0;
    }
    if (groundPdf === undefined) {
        groundPdf = new Float32Array(input.length);
        var ie;
        for (i = 0, ie = input.length; i < ie; i++) {
            groundPdf[i] = 1 / ie;
        }
    } else {
        groundPdf = new Float32Array(groundPdf);
    }

    // Duplicate input histogram
    var L = input.length;
    var hist = new Float32Array(input);
    // Integrate signal and groundPdf
    for (i = 1; i < L; i++) {
        hist[i] += hist[i - 1];
        groundPdf[i] += groundPdf[i - 1];
    }

    var entropy, massMean, densityMin;

    // Histogram is build with unit mass
    var log = Math.log, sqrt = Math.sqrt;
    var ILOG10 = 1 / log(10), L1P2 = log(0.5);
    var lerfc = Math.lerfc;
    if (!(M > 0 && typeof mu === "number" && sigma2 > 0)) {
        massMean = 1;
        M = hist[L - 1];
        entropy = function (r, p) {
            if (r <= p) {
                return 0;
            }
            if (r === 1) {
                return -log(p) * ILOG10;
            }
            return (r * log(r / p) + (1 - r) * log((1 - r) / (1 - p))) * ILOG10;
        };
    // Histogram is weigthted
    } else {
        massMean = hist[L - 1] / M;
        densityMin = massMean;
        var c1 = -1 / M * ILOG10, c2 = M * mu, c3 = sigma2 / mu;
        entropy = function (r, p) {
            // if (r < densityMin * p || p === 0) {
            if (p <= Number.MIN_VALUE) {
                return 0;
            }
            var m = p * c2;
            var s = m * (mu * (1 - p) + c3);
            var z = (M * r - m) / sqrt(2 * s);
            return (L1P2 + lerfc(z)) * c1;
        };
    }

    // Threshold
    var thresh;
    if (circular) {
        thresh = (log(L * (L - 1)) / log(10) + eps) / M;
    } else {
        thresh = (log(L * (L - 1) / 2) / log(10) + eps) / M;
    }

    // Probability and density per bin
    var p, r;
    // Entropy for modes
    var Hmode = new Float32Array(L * L);
    // Entropy for gaps
    var Hgap = new Float32Array(L * L);

    // Normalize signal w.r.t. points number to get density per bin
    for (x = 0; x < L; x++) {
        hist[x] /= M;
        groundPdf[x] /= groundPdf[L - 1];
    }

    // Compute entropy for each interval;
    for (i = 0; i < L; ++i) {
        if (circular) {
            for (j = 0, x = i * L + j; j < i; ++j, ++x) {
                p = groundPdf[j] + 1 - groundPdf[i - 1];
                r = hist[j] + massMean - hist[i - 1];
                Hmode[x] = entropy(r, p);
                Hgap[x] = entropy(massMean - r, 1 - p);
            }
        }
        for (j = i, x = i * L + j; j < L; ++j, ++x) {
            p = (i === 0) ? groundPdf[j] : groundPdf[j] - groundPdf[i - 1];
            r = (i === 0) ? hist[j] : hist[j] - hist[i - 1];
            Hmode[x] = entropy(r, p);
            Hgap[x] = entropy(massMean - r, 1 - p);
        }
    }
    p = new Float32Array(L * L);
    r = new Float32Array(L * L);
    for (i = 0; i < L; ++i) {
        if (circular) {
            for (j = 0, x = i * L + j; j < i; ++j, ++x) {
                p[x] = groundPdf[j] + 1 - groundPdf[i - 1];
                r[x] = hist[j] + massMean - hist[i - 1];
            }
        }
        for (j = i, x = i * L + j; j < L; ++j, ++x) {
            p[x] = (i === 0) ? groundPdf[j] : groundPdf[j] - groundPdf[i - 1];
            r[x] = (i === 0) ? hist[j] : hist[j] - hist[i - 1];
        }
    }

    function maxinf(H, L) {
        var max = Math.max, min = Math.min;
        var i, ie, j, je, j2;
        var c = new Float32Array(L * L);
        // Smaller intervals (All cases)
        for (i = 0, ie = L * L; i < ie; i += L + 1) {
            c[i] = H[i];
        }

        // i in [L - 2, 0], j in [i + 1, L - 1] (All cases)
        for (i = L - 2; i >= 0; i--) {
            for (j = i * L + i + 1, je = (i + 1) * L; j < je; j++) {
                c[j] = max(c[j + L], c[j - 1], H[j]);
            }
        }

        if (circular) {
            // Bottom-left corner (Circular cases)
            c[(L - 1) * L] = max(c[0], c[(L - 1) * L + L - 1], H[(L - 1) * L]);
            for (j2 = 1, j = (L - 1) * L + j2; j2 < L - 1; ++j2, ++j) {
                c[j] = max(H[j], c[j2], c[j2 - 1]);
            }
            // First column (Circular cases)
            for (i = (L - 2) * L; i > 0; i -= L) {
                c[i] = max(H[i], c[i + L - 1], c[i + L]);
            }
            // i in [L - 2, 0], j in [1, i - 1] (Circular cases)
            for (i = L - 2; i > 0; i--) {
                for (j = i * L + 1, je = i * L + i; j < je; ++j) {
                    c[j] = max(H[j], c[j - 1], c[j + L]);
                }
            }
        }
        return c;
    }
    function maxsup(H, L) {
        var max = Math.max, min = Math.min;
        var i, ie, j, je, j2;
        var c = new Float32Array(L * L);
        // Max length intervals in circular case
        // They doesn't belong to a longer interval
        if (circular) {
            // Circular cases
            for (i = L, ie = L * L; i < ie; i += L + 1) {
                c[i] = H[i];
            }
            // i in [2, L - 1], j in [i - 2, 0] Circular Cases
            for (i = 2; i < L; ++i) {
                for (je = i * L - 1, j = i * L + i - 2; j > je; --j) {
                    c[j] = max(H[j], c[j - L], c[j + 1]);
                }
            }
        }
        c[L - 1] = H[L - 1];
        // First row (Circular and non-circular cases)
        for (j = L - 2, j2 = (L - 1) * L + j; j >= 0; --j, --j2) {
            c[j] = max(H[j], c[j + 1], c[j2]);
        }
        // Last column (Circular and non-circular cases)
        for (i = 1 * L, ie = L * L; i < ie; i += L) {
            c[i + L - 1] = max(c[i - 1], c[i], H[i + L - 1]);
        }
        // i in [1, L - 2], j in [L - 2, i] non-circular cases
        for (i = 1; i < L - 1; i++) {
            for (j = i * L + L - 2, je = i * L + i; j >= je; j--) {
                c[j] = max(c[j - L], c[j + 1], H[j]);
            }
        }
        return c;
    }
    function ifGap(Hmode, Hgap, L, thresh) {
        var i, ie, i2, j, je, k, ke, l, le, n, ne, x, xe;

        var c = new Float32Array(L * L);
        for (x = 0, xe = c.length; x < xe; ++x) {
            c[x] = (Hgap[x] >= thresh) ? 1 : 0;
        }

        // i in [L - 2, 0], j in [i + 1, L - 1] (All cases)
        for (i = L - 2; i >= 0; i--) {
            for (j = i * L + i + 1, je = (i + 1) * L; j < je; j++) {
                c[j] += c[j - 1] + c[j + L];
            }
        }

        if (circular) {
            // Bottom-left corner (Circular cases)
            c[(L - 1) * L] += c[0] + c[(L - 1) * L + L - 1];
            // Last row (Circular cases)
            for (j = 1; j < L - 1; ++j) {
                c[(L - 1) * L + j] += c[j] + c[(L - 1) * L + j - 1];
            }
            // Other rows
            for (i2 = L - 2, i = i2 * L, ie = 0; i > ie; i -= L, --i2) {
                c[i] += c[i + L] + c[i + L - 1];
                for (j = i + 1, je = i + i2; j < je; ++j) {
                    c[j] += c[j - 1] + c[j + L];
                }
            }
        }
        for (x = 0, xe = c.length; x < xe; ++x) {
            c[x] = c[x] ? 0 : Hmode[x];
        }

        return c;
    }
    //new Matrix([L, L], Hmode).transpose().display(20);

    //new Matrix([L, L], Hgap).transpose().display("old");

    // Set entropy to zero if the interval contain a meaningful gap
    Hmode = ifGap(Hmode, Hgap, L, thresh);
    // Determine maximum entropy of mode contained for each interval
    var Hsup = maxsup(Hmode, L);
    // Determine maximum entropy of gap contained for each interval
    var Hinf = maxinf(Hmode, L);

    // Determine maximum meaningful modes
    var out = [];
    for (i = 0; i < L; ++i) {
        for (j = circular ? 0 : i, x = i * L + j; j < L; ++j, ++x) {
            if (Hmode[x] >= thresh && Hsup[x] <= Hmode[x] && Hinf[x] <= Hmode[x]) {
                out.push(new Mode(i, j, Hmode[x], input));
            }
        }
    }

    Hmode = null;
    Hsup = null;
    Hinf = null;
    p = null;
    r = null;
    Hgap = null;
    hist = null;
    // Sort mode by descreasing meaningfulness
    return out.sort(Mode.prototype.compar);
}
*/
/*------------------------- Commande MegaWave -----------------------------*/
/* mwcommand
  name = {ftc_seg_circ};
  version = {"12/05/06"};
  author = {"Julie Delon, modified by Julien Rabin"};
  function = {"histogram fine to coarse segmentation"};
  usage = {
'e':[eps=0.0]->eps  "-log10(max. number of false alarms), default 0",
input->in           "input Fsignal",
out<-ftc_seg_circ         "output Flist of separators"
          };
*/
/*-- MegaWave - Copyright (C) 1994 Jacques Froment. All Rights Reserved. --*/


/*2005 feb : output changed, bounds of the whole interval are excluded*/
/*2005 april :  improvement in pooling_adjacent_violators  (Pascal Monasse)*/
/*2005 june :  the modes are merged by order of meaningfullness, starting with the merging which follows "the best" the unimodal hypothesis*/
/*2006 may :  ftc_seg is now designed for circular histogram*/
/*
function MOD(i, L) {
    'use strict';
    if (i >= 0 && i < L) {
        return i;
    }
    if (i < 0) {
        return MOD(i + L, L);
    }
    if (i >= L) {
        return MOD(i - L, L);
    }
    console.log("error.\n");
}

function MOD2(i, L) {
    'use strict';
    if (i >= 0 && i < L) {
        return i;
    }
    if (i < 0) {
        return MOD2(i + L, L);
    }
    if (i >= L) {
        return MOD2(i - L, L);
    }
    console.log("error.\n");
}


function sextract(a, b, input) {
    'use strict';
    var out, i;

    if (a > b) {
        b = input.length - (a - b) + 1;
        out = new Float32Array(b);
        for (i = 0; i < out.length; i++) {
            if (i + a < input.length) {
                out[i] = input[i + a];
            } else {
                out[i] = input[i + a - input.length];
            }
        }
    } else {
        out = new Float32Array(b - a + 1);
        for (i = 0; i < out.length; i++) {
            out[i] = input[i + a];
        }
    }
    return out;
}
*/




// INCREASING OR DECREASING GRENANDER ESTIMATOR OF THE HISTOGRAM IN
/*
function pooling_adjacent_violators(c, input) {
    'use strict';
    var som;
    var dec = 0;
    var size, i, j, k;

    size = input.length;
    dec = new Float32Array(size);

    // Decreasing hypothesis
    if (!c) {
        dec[0] = input[0];
        for (i = 1; i < size; i++) {
            dec[i] = input[i];
            som = dec[i];
            for (j = i - 1; j >= -1; j--) {
                if (j === -1 || (dec[j] * (i - j) >= som)) {
                    som /= (i - j);
                    for (k = j + 1; k <= i; k++) {
                        dec[k] = som;
                    }
                    break;
                }
                som += dec[j];
            }
        }
    // Increasing hypothesis
    } else {
        // printf("increasing... ");
        dec[size - 1] = input[size - 1];
        for (i = size - 2; i >= 0; i--) {
            dec[i] = input[i];
            som = dec[i];
            for (j = i + 1; j <= size; j++) {
                if (j === size || (dec[j] * (j - i) >= som)) {
                    som /= j - i;
                    for (k = i; k <= j - 1; k++) {
                        dec[k] = som;
                    }
                    break;
                }
                som += dec[j];
            }
        }
    }

    return dec;
}

/*
// Compute the max entropy of the histogram input_{|[a,b]}
// for the increasing or decreasing hypothesis

// c=1 for the increasing hypothesis, 0 for the decreasing one
function max_entropy(c, input, a, b, eps) {
    'use strict';
    var extrait = 0, decrois = 0;
    var seuil, H, r, p, max_entrop;
    var i, j, L, N;

    // /!\ MODIFICATION
    extrait = sextract(a, b, input);
    decrois = pooling_adjacent_violators(c, extrait);
    L = extrait;

    // integrate signals
    for (i = 1; i < L; i++) {
        extrait[i] += extrait[i - 1];
    }
    for (i = 1; i < L; i++) {
        decrois[i] += decrois[i - 1];
    }

    // meaningfullness threshold
    // cette fois il y a L*L-L tests
    N = extrait[L - 1];
    seuil = (Math.log(L * (L - 1)) / Math.log(10) + eps) / N;
    seuil = N !== 0 ?  seuil : Number.MAX_VALUE;

    // search the most meaningfull segment (gap or mode)
    max_entrop = 0;
    for (i = 0; i < L; i++) {
        for (j = i; j < L; j++) {
            if (i === 0) {
                r = extrait[j];
            } else {
                r = extrait[j] - extrait[i - 1];
                r = r /  N;
            }
            if (i === 0) {
                p = decrois[j];
            } else {
                p = decrois[j] - decrois[i - 1];
            }
            p = p / N;
            H = entrop(r, p);

            if (H > max_entrop) {
                max_entrop = H;
            }
        }
    }
    max_entrop = (max_entrop - seuil) * N;

    extrait = null;
    decrois = null;

    return max_entrop;
}
*/
//***************************************
//*****************MAIN******************
//***************************************


/*
function ftc_seg_circ(input, eps) {
    'use strict';
    var  i, j, imin, n, m, M, iter, a, b;
    var max_entrop = 0;
    var min_max_entrop, H;
    var c;

    // permet de savoir si lorsque lors de la recherche de tous les
    // extrema un minimum a été découvert
    var first_min = -1;

    var size = input.length;
    var out = [];
    // ordered list of minima and maxima
    var list = [];

    var density = new Float32Array(input);

    // FIRST SEGMENTATION, the list 'list' is filled with all minima and
    // maxima (min,max,min,max,etc...). The list always starts and ends
    //  with a minimum.
    // /!\ MODIFICATION: on commence forcément par un minimum, et on finit
    // forcément par un maximum grâce à une définiton circulaire...
    // on parcourt tous les points
    for (i = 0; i < size; i++) {
        // strict minimum
        if (input[i] < input[MOD(i - 1, size)] && input[i] < input[MOD(i + 1, size)]) {
            list.push(i);
            first_min++;
        }

        /// large minimum
        if (input[i] < input[MOD(i - 1, size)] && input[i] === input[MOD(i + 1, size)]) {
            for (j = i + 1; input[j] === input[i]; j) {
                j++;
                j = MOD(j, size);
            }

            if (input[j] > input[i]) {
                // j-1 est l'indice du dernier plat trouvé
                if (j > i) {
                    list.push(0.5 * (i + (j - 1)));
                } else if (j < i) {
                    list.push(MOD2((i + 0.5 * (size - i + j)), size));
                }
                // MOD2 permet de stocker un float et d'avoir des frontières en x.5
                first_min++;
            }
            if (j > i) {
                i = j - 1;
            } else {
                // à cause de la circularité, j peut être < à i !
                break;
            }
        }

        // strict maximum
        if (first_min !== -1 && (input[i] > input[MOD(i - 1, size)]) && (input[i] > input[MOD(i + 1, size)])) {
            list.push(i);
        }

        // Large maximum
        if (first_min !== -1 && (input[i] > input[MOD(i - 1, size)]) && (input[i] === input[MOD(i + 1, size)])) {
            for (j = i + 1; input[j] === input[i]; j) {
                j++;
                j = MOD(j, size);
            }
            if (input[j] < input[i]) {
                if (j > i) {
                    list.push(0.5 * (i + (j - 1)));
                } else if (j < i) {
                    list.push(MOD2((i + 0.5 * (size - i + j)), size));
                }
            }
            if (j > i) {
                i = j - 1;
            } else {
                // à cause de la circularité, j peut être < à i !
                break;
            }
        }
    }

    // on re-parcourt les points de 0 au premier minimum afin de trouver
    // éventuellement un dernier maximum
    for (i = 0; i < Math.round(list[0]); i++) {
        // on ne détecte que les maximum restant:
        // strict maximum
        if ((input[i] > input[MOD(i - 1, size)]) && (input[i] > input[MOD(i + 1, size)])) {
            list.push(i);
        }

        // large maximum
        if ((input[i] > input[MOD(i - 1, size)]) && (input[i] === input[MOD(i + 1, size)])) {
            for (j = i + 1; input[j] === input[i]; j) {
                j++;
                j = MOD(j, size);
            }
            if (input[j] < input[i]) {
                if (j > i) {
                    list.push(0.5 * (i + (j - 1)));
                } else if (j < i) {
                    list.push(MOD2(i + 0.5 * (size - i + j), size));
                }
            }
            i = j - 1;
        }
    }

    // PROBLÈME: si on est unimodal et que le mini est détecté
    // après le maxi on ne donne pas le mini mais ce n'est pas
    // grave car on ne renvoie que les mini par 'out'
    if (list.length < 4) {
        for (i = 0; i < list.length; i++) {
            if ((i % 2 === 0)) {
                out.push(list[i] + 0.5);
            }
        }
        list = null;
        return out;
    }

    max_entrop = []; //mw_change_flist(NULL,list.length,list.length,1);

    for (i = 0; i < list.length; i++) {
        // Minimum at i -> configuration (max at i+1, min at i+2) in 'list'
        if (i % 2 === 0) {
            // minimum at i
            m = list[i];
            // maximum at i+1
            M = list[MOD(i + 1, list.length)];
            // peut importe que M<m grâce à sextract2
            max_entrop[i] = max_entropy(1, input, m, M, eps);
        // maximum at i -> configuration (min at i+1, max at i+2)
        } else {
            // maximum at i
            M = list[i];
            // minimum at i+3
            m = list[MOD(i + 1, list.length)];
            max_entrop[i] = max_entropy(null, input, M, m, eps);
        }
    }

    // FILL THE LIST OF MAX ENTROPIES:
    // the merging of two contiguous modes [a,b] and [b,c] can
    // be done in two ways, either by using the maximum M1 on [a,b]
    // and by testing the decreasing hypothesis on [M1,c], or by using
    // the maximum M2 on [b,c] and by testing the increasing hypothesis
    // on [a,M2]. For each configuration, we compute the entropy of the
    // worst interval against the considered hypothesis.

    max_entrop = [];// mw_change_flist(NULL,list.length,list.length,1);
    // /!\ MODIFICATION: on teste désormais autant d'intervalle de semi-mode qu'il y a de point...
    for (i = 0; i < list.length; i++) {
        // minimum at i -> configuration (max at i+1, min at i+2) in 'list'
        if (i % 2 === 0) {
            // minimum at i
            m = list[i];
            // maximum at i+3
            M = list[MOD(i + 3, list.length)];
            // peut importe que M<m grâce à sextract
            max_entrop[i] = max_entropy(1, input, m, M, eps);
            // maximum at i -> configuration (min at i+1, max at i+2)
        } else {
            // maximum at i
            M = list[i];
            // minimum at i+3
            m = list[MOD(i + 3, list.length)];
            max_entrop[i] = max_entropy(null, input, M, m, eps);
        }
    }


    //***********************
    //  MERGING OF MODES    *
    //***********************

    // on cherche le semi-mode qui a le NFA le plus faible, soit l'entropie
    // plus élévée, donc max_entrop=seuil-entropie le plus petit
    min_max_entrop = max_entrop[0];
    imin = 0;
    for (i = 0; i < max_entrop.length; i++) {
        H = max_entrop[i];
        if (min_max_entrop > H) {
            min_max_entrop = H;
            imin = i;
        }
    }

    // Merge successively pairs of intervals
    while ((min_max_entrop < 0) && (max_entrop.length > 2)) {
        // on fusionne le mode dont le semi-mode a été choisi en éliminant
        // imin+1 et imin+2 des listes max_entrop et list
        // A CHANGER

        // on supprime le couple (min,max) par décalage
        if (imin < list.length - 2) {
            for (j = imin + 1; j < list.length - 2; j++) {
                list[j] = list[j + 2];
            }
            list.length -= 2;
        // /!\ il faut commencer la liste par un minimum!!!
        } else if (imin === list.length - 2) {
            list[0] = list[imin];
            list.length -= 2;
        // /!\ il faut commencer par un minimum!!!
        } else if (imin === list.length - 1) {
            for (j = 0; j < list.length - 2; j++) {
                list[j] = list[j + 2];
            }
            list.length -= 2;
        } else {
            console.log("\n\n!error!\n\n");
        }

        // update of max_entrop
        max_entrop.pop(); //->size-=2;
        max_entrop.pop(); //->size-=2;

        // A CHANGER car les changements de valeur d'entropie sont circulaires...
        for (i = 0; i < list.length; i++) {
            // problème: les dernières valeurs ne devraient pas changer
            // mais c le cas!!!!!
            if (i % 2 === 0) {
                // Minimum at i
                m = list[i];
                // Maximum at i+3
                M = list[MOD(i + 3, list.length)];
                max_entrop[i] = max_entropy(1, input, m, M, eps);
            // configuration (min at i+1, max at i+2)
            } else {
                // Maximum at i
                M = list[i];
                // Minimum at i+3
                m = list[MOD(i + 3, list.length)];
                max_entrop[i] = max_entropy(null, input, M, m, eps);
            }
        }

        // on cherche le semi-mode qui a le NFA le plus faible,
        // soit l'entropie plus élévée, donc max_entrop=seuil-entropie
        // le plus petit

        min_max_entrop = max_entrop[0];
        imin = 0;
        for (i = 0; i < max_entrop.length; i++) {
            H = max_entrop[i];
            if (min_max_entrop > H) {
                min_max_entrop = H;
                imin = i;
            }
        }
    }

    //********
    //*OUTPUT : list of all remaining minima without the bounds 0 and L-1
    //********

    for (i = 0; i < list.length; i++) {
        if ((i % 2 === 0)) {
            out.push(Math.round(list[i] + 0.5));
        }
    }

    list = null;
    return out;
}
*/
// TO DO:   wavelet examples
//          high freq. filters using -1/+1

/** 
 * @fileOverview Wavelet Transform toolbox
 */

// Ipij API (c) Copyright 2012, designed by B.Mazin & G.Tartavel

/**
 * @fileOverview Wavelet transform and wavelet tools.
 * @author TM = Tartavel & Mazin
 * @version 1.0
 */


/* ********** WAVELET CLASS *************** */

/** Define a wavelet.
 * @class
 *  Provide several wavelets functions.<br />
 *  A wavelet can be either a common wavelet (called by its name)
 *  or any user-defined wavelet from its recursive filters.
 * @param {string} [name='haar']
 *  Name of the wavelet.
 * @return {Wavelet}
 *  The wavelet definition (containing filters and some properties).
 */
function Wavelet(name) {
    'use strict';
    var errMsg = this.constructor.name + ': ';

    // Default arguments
    if (name  === undefined) {
        this.name = 'haar';
    } else {
        /** Read only<br />Name of the wavelet. */
        this.name = name.toLowerCase();
    }

    // Pre-defined wavelets
    if (Wavelet.list[this.name]) {
        var wav = Wavelet.list[this.name];
        var normalize = (wav.normalized !== undefined && !wav.normalized)
            ? function (h) { return Wavelet.filter(h, 'norm'); }
            : function (h) { return h; };
        /** Read only<br />Low-pass recursive decomposition filter. */
        this.filterL = normalize(wav.filterL);
        /** Read only<br />Is the wavelet orthogonal? */
        this.orthogonal = (wav.orthogonal) ? true : false;
        if (wav.filterH) {
            /** Read only<br />High-pass recursive decomposition filter. */
            this.filterH = normalize(wav.filterH);
        }
        if (wav.invFilterL) {
            /** Read only<br />Low-pass recursive reconstruction filter. */
            this.invFilterL = normalize(wav.invFilterL);
        }
        if (wav.invFilterH) {
            /** Read only<br />High-pass recursive reconstruction filter. */
            this.invFilterH = normalize(wav.invFilterH);
        }
    }

    // User-define wavelet
    if (this.filterL === undefined) {
        var errMsgFull = errMsg + "unknown wavelet '" + name + "'. \n";
        errMsgFull += 'User-defined wavelets not implemented yet.';
        throw new Error(errMsgFull);
    }

    // Compute complementary filter
    var conj = function (h, offset) {
        return Wavelet.filter(h, 'conjugate', (offset) ? -1 : 1);
    };
    if (!this.filterH && this.orthogonal) {
        this.filterH = Wavelet.filter(conj(this.filterL), 'mirror');
    }
    if (!this.invFilterL) {
        this.invFilterL = conj(this.filterH, true);
    }
    if (!this.invFilterH) {
        this.invFilterH = conj(this.filterL, false);
    }

    // Return the object
    return this;
}

/** Public<br />List of wavelets. */
Wavelet.list = Wavelet.list || {
    'haar': {
        'orthogonal': true,
        'normalized': false,
        'filterL': [1, 1]
    }
};

/** Perform an operation on a filter.
 * @param {float[]} h
 *  A filter.
 * @param {String} action
 *  - 'rescale': multiply the filter by a constant.<br />
 *  - 'normalize': normalize the filter (L2 norm).<br />
 *  - 'conjugate': return the filter h[0], -h[1], .., h[n]*(-1)^n.<br />
 *  - 'mirror': return the filter h[n-1] .. h[0].
 * @param {float} [factor=1]
 *  Multiplicative constant.
 * @return {float[]}
 *  A transformed filter.
 */
Wavelet.filter = function (h, action, factor) {
    'use strict';
    var errMsg = 'Wavelet.filter: ';
    if (factor === undefined || factor === 0) {
        factor = 1;
    }
    if (typeof factor !== 'number') {
        throw new Error(errMsg + "argument 'factor' must be a number");
    }
    if (typeof action !== 'string') {
        throw new Error(errMsg + "argument 'action' must be a string");
    }
    action = action.toLowerCase().substr(0, 3);

    var k;
    var N = h.length;
    var out = [];
    var sign = 1, dsign = 1;
    if (action === 'mir') {
        for (k = 0; k < N; k++) {
            out[k] = factor * h[N - 1 - k];
        }
        return out;
    }
    if (action === 'nor') {
        var sum2 = 0;
        for (k = 0; k < N; k++) {
            sum2 += h[k] * h[k];
        }
        factor = (!sum2) ? 1 : 1 / Math.sqrt(sum2);
    } else if (action === 'con') {
        dsign = -1;
    } else if (action !== 'res') {
        throw new Error(errMsg + 'unknown action');
    }

    for (k = 0; k < N; k++, sign *= dsign) {
        out[k] = factor * sign * h[k];
    }

    return out;
};



/* ********** WAVELET TRANSFORM CLASS *************** */

/** Compute the Wavelet Transform of an ImageJS.
 * @see Wavelet
 * @see WT#inverse
 * @class
 *  WT (which stands for 'Wavelet Transform') is a class designed
 *  to store the wavelet transform of an ImageJS.
 * @param {ImageJS|WT} image
 *  Image to be transform, or WT to copy.
 * @param {boolean} [redundant=false]
 *  Use a redundant wavelet transform instead.
 * @param {Wavelet|String} wavelet
 *  Wavelet to use, or its name.
 * @param {int} [level=3]
 *  Number of decomposition levels.<br />
 *  - The scale will be from 0 (lowest freq.) to 'level' (highest freq.)<br />
 *  - They are also labelled from -1 (highest freq.) to -level-1 (lowest freq.)
 * @return {WaveletTransform}
 *  The created wavelet transform instance.
 * @example
 *  // Compute the redundant WT
 *  var wt = new WT(im, true);
 *
 *  // Estimate the noise and apply thresholding
 *  var sigma = wt.noiseStd();
 *  wt.threshold(3/2*sigma, 'soft');
 *
 *  // Reconstruct the image
 *  var denoised = wt.inverse();
 */
function WT(im, redundant, wav, level) {
    'use strict';

    if (im instanceof Matrix) {
        if (redundant !== undefined && typeof redundant !== 'boolean') {
            throw new Error("WT: argument 'redundant' must be boolean");
        }
        if (level === undefined) {
            level = 3;
        } else if (typeof level !== 'number') {
            throw new Error("WT: argument 'level' must be an integer");
        }

        // Arguments
        this.width = im.getSize(1);
        this.height = im.getSize(0);
        this.chan = im.getSize(2);
        this.redundant = (redundant) ? true : false;
        this.level = (level === undefined) ? 3 : level;
        this.wavelet = (wav instanceof Wavelet) ? wav : new Wavelet(wav);

        // Compute and return the transform
        this.tmp = im;
        this.wt2(); // fill this.data
        
    // Copy constructor
    } else if (im instanceof WT) {
        this.width = im.width;
        this.height = im.height;
        this.chan = im.chan;
        this.redundant = im.redundant;
        this.level = im.level;
        this.wavelet = im.wavelet;
        this.data = im.data.getCopy();
        this.subband = [];
        var k, key;
        for (k = 0; k < im.subband.length; k++) {
            this.subband[k] = {};
            for (key in im.subband[k]) {
                if (im.subband[k].hasOwnProperty(key)
                    && im.subband[k][key] instanceof ImageJS) {
                    this.subband[k][key] = im.subband[k][key].getView();
                    this.subband[k][key].data = this.data.data;
                }
            }
        }
    } else {
        throw new Error("WT: first parameter must be an ImageJS or a WT");
    }
    return this;
}

/** Return the reconstructed image.
 * @see @WT
 * @param {ImageJS} [output]
 *  Output image.
 * @return {ImageJS}
 *  The reconstructed image.
 */
WT.prototype.inverse = function (output) {
    'use strict';
    return this.iwt2(output);
};


/* ********** WT VISUALIZATION *************** */

/** Get a view of a subband.
 * @param {int} scale
 *  - 0 is the approximation subband.<br />
 *  - From lowest to highest freq.: 1 to level.<br />
 *  - From highest to lowest freq.: -1 to -level
 * @return {Object}
 *  Object containing views of the subband:<br />
 *  - 'LL' view if scale is 0.<br />
 *  - 'HL', 'LH' and 'HH' views if scale is non-zero.
 */
WT.prototype.getScale = function (scale) {
    'use strict';
    if (typeof scale !== 'number' || Math.abs(scale) > this.level) {
        var errMsg = this.constructor.name + '.getScale: ';
        errMsg += 'scale must be in range -this.level .. this.level';
        throw new Error(errMsg);
    }
    if (scale < 0) {
        scale += this.level + 1;
    }
    var subband = this.subband[scale];

    if (!scale) {
        return { 'LL': subband.LL.getView() };
    }
    return {
        'HL': subband.HL.getView(),
        'LH': subband.LH.getView(),
        'HH': subband.HH.getView()
    };
};

/** Return some statistics about the coefficients.
 * @see WT#getScale
 * @see ImageJS#getStatistics
 * @param {int} [scale]
 *  If not specified, compute the statistics of all the coefficients.<br />
 *  If specified (same as in 'getScale'), use only the coefficients in one subband.
 * @return {Object}
 *  The same as the 'getStatistics' method in 'ImageJS'.
 */
WT.prototype.getScaleStatistics = function (scale) {
    'use strict';
    if (scale === undefined) {
        var obj = this.getScaleStatistics(0);
        var k;
        for (k = 1; k <= this.length; k++) {
            var tmp = this.getScaleStatistics(k);
            obj.count   += tmp.count;
            obj.nonZero += tmp.nonZero;
            obj.sumX    += tmp.sumX;
            obj.sumX2   += tmp.sumX2;
            obj.sumAbsX += tmp.sumAbsX;
        }
        return obj;
    }

    var sub = this.getScale(scale);
    if (!scale) {
        return sub.LL.getStatistics();
    }

    var hl = sub.HL.getStatistics();
    var lh = sub.LH.getStatistics();
    var hh = sub.HH.getStatistics();
    return {
        'count'  : hl.count   + lh.count   + hh.count,
        'nonZero': hl.nonZero + lh.nonZero + hh.nonZero,
        'sumX'   : hl.sumX    + lh.sumX    + hh.sumX,
        'sumX2'  : hl.sumX2   + lh.sumX2   + hh.sumX2,
        'sumAbsX': hl.sumAbsX + lh.sumAbsX + hh.sumAbsX
    };
};


/* ********** DENOISING TOOLS *************** */

/** Estimate the noise standard deviation.<br />
 *  Assume the noise to be gaussian additive with zero-mean.<br />
 *  Estimation is based on the median value in the finest scale.
 * @return {float}
 *  The estimated standard deviation of the noise.
 */
WT.prototype.noiseStd = function () {
    'use strict';
    var errMsg = this.constructor.name + '.noiseStd: ';
    var sub = this.getScale(-1);
    if (!sub.HH) {
        throw new Error(errMsg + 'there is no details subband');
    }

    // Extract the finest scale coefficients
    var tabHH = sub.HH.toArray();
    var k;
    for (k = 0; k < tabHH.length; k++) {
        tabHH[k] = Math.abs(tabHH[k]);
    }

    // Compute median and deduce std assuming gaussian
    var median = Tools.Stat.rank(tabHH);
    var std = median / 0.6745;
    return std;
};

/** Apply a threshold to each scale.
 * @see ImageJS#threshold
 * @param {float|float[]} T
 *  Threshold value(s):<br />
 *  - float: the same threshold for all scales.<br />
 *  - array of floats: one threshold for each scale (use -1 not to filter a scale).
 * @param {String|function} [fcn = 'hard']
 *  Thresholding function:<br />
 *  - 'hard' or 'soft' threshold.<br />
 *  - any function (value, T) returning x thresholded by T.
 * @param {boolean} [evenLL=false]
 *  If true, the approximation subband (scale 0) is thresholded too.
 * @return {WaveletTransform}
 *  this, thresholded.
 */
WT.prototype.threshold = function (T, fcn, evenLL) {
    'use strict';
    var errMsg = this.constructor.name + '.threshold: ';

    // Check arguments
    var k, t;
    if (fcn === undefined) {
        fcn = 'hard';
    }
    var minScale = (evenLL) ? 0 : 1;
    if (typeof T === 'number') {
        t = T;
        T = [];
        for (k = minScale; k <= this.level; k++) {
            T.push(t);
        }
    } else {
        if (evenLL === undefined) {
            minScale = this.level + 1 - T.length;
        }
        if (T.length !== this.level + 1 - minScale || minScale < 0 || minScale > 1) {
            throw new Error(errMsg + "incompatible length of 'T'");
        }
    }

    // Threshold
    for (k = this.level; k >= minScale; k--) {
        t = T.pop();
        if (t >= 0) {
            var sub = this.getScale(k);
            if (sub.LL) {
                sub.LL.threshold(t, fcn);
            } else {
                sub.HL.threshold(t, fcn);
                sub.LH.threshold(t, fcn);
                sub.HH.threshold(t, fcn);
            }
        }
    }
    
    // The end
    return this;
};

/** Apply the SURE thresholding to each scale.
 * @return {WT}
 *  this
 */
WT.prototype.thresholdSURE = function () {
    'use strict';
    var sigma = this.noiseStd();
    var sigma2 = sigma * sigma;

    // Compute the SURE value from an image coefficients
    var getSURE = function (t) {
        var N = t.length;
        var k, n;
        for (k = 0; k < N; k++) {
            t[k] = Math.abs(t[k]);
        }
        Array.prototype.sort.call(t, function (a, b) { return a - b; });
        var cumSum2 = 0, imin = 0, minRisk2 = Infinity;
        for (n = 0; n < N; n++) {
            var X2 = t[n] * t[n];
            cumSum2 += X2 - sigma2;
            var risk2 = cumSum2 + (N - n - 1) * (sigma2 + X2);
            if (risk2 < minRisk2) {
                imin = n;
                minRisk2 = risk2;
            }
        }
        return t[imin];
    };

    // Apply the threshold to each scale
    var k, s, c;
    for (k = this.level; k > 0; k--) {
        var subband = this.getScale(k);
        var views = [subband.HL, subband.LH, subband.HH];
        for (s = 0; s < views.length; s++) {
            var view = views[s];
            var chan = view.chan;
            for (c = 0; c < chan.length; c++) {
                view.Ch_(chan[c]);
                var T = getSURE(view.toArray());
                view.threshold(T, 'soft');
            }
        }
    }
    
    return this;
};


/* ********** WT COMPUTATION *************** */

/** 1D convolution.
 * @param {float[]} kernel
 *  Convolution kernel.
 * @param {String|float} [boundary = 'symmetric']
 *  Boundary processing:<br />
 *  - any float value: value assumed outside the image domain;<br />
 *  - float 0 value is equivalent to 'constant' or 'const';<br />
 *  - 'symmetric' or 'sym';<br />
 *  - 'periodic' or 'per'.
 * @param {int|string} [origin = 'C']
 *  Origin of the kernel:<br :>
 *  - positive integer: origin position;<br />
 *  - negative integer: origin position, from the end;<br />
 *  - 'L'/'R' for (resp.) left/right, the same as (resp.) 0/-1;<br />
 *  - 'C' for center,'CL'/'CR' for rounding (resp.) left/right.
 * @param {int|Object} [subsample = 1]
 *  Subsampling factor:<br />
 *   - integer D: the same as filtering and then subsampling with a factor D;<br />
 *   - Object {'Dout':D1, 'Dker':D2, 'round':fcn}: <br />
 *       * 'Dout' integer (def. 1) is the subsampling factor for the output (previously called D);<br />
 *       * 'Dker' integer (def. 1) is the kernel subsampling factor.<br />
 *  Note that using Dout = Dker is the same (except maybe on boundary) as
 *      subsampling the image firse, and then filtering with Dout = Dker = 1.
 * @param {ImageJS} [output]
 *  Output image
 * @param {boolean} [add = false]
 *  Add to the output, instead of erasing it.
 * @returns {ImageJS}
 *  Output image
 * @example
 *  // Computing the X derivative:
 *  var gradX = im.filter1d([-1, 0, 1], 'periodic');
 *
 *  // Resize image to half its size(with a separable average):
 *  var ker = [1/3, 1/3, 1/3];
 *  var tmp = im.filter1d(ker, 'symmetric', 'L', 3).T();    // X filtering then transpose
 *  var out = tmp.filter1d(ker, 'symmetric', 'L', 3).T();   // Y filtering then transpose back
 */
Matrix.prototype._filter1d = function (viewI, kernel, origin, subsample, output, viewO, add) {
    'use strict';

    // 1. ARGUMENTS
    var errMsg = this.constructor.name + '.filter1d: ';
    //kernel = new this.dataType((kernel && kernel.length) ? kernel : [kernel]);
    var K = kernel.length;
    var Dout = 1, Dker = 1, bg = 0;
    var c, x, y;
    var x_, y_;
    var nx, ny, dx, dy;

    // add
    if (add === undefined) {
        add = false;
    }
    // subsample
    if (typeof subsample === 'number') {
        Dout = subsample;
    } else if (typeof subsample === 'object') {
        Dout = subsample.Dout || Dout;
        Dker = subsample.Dker || Dker;
    }


    // output
    if (output === undefined) {
        output = this.getNew(Math.ceil(this.nx / Dout), this.ny);
        output.Ch_(this.chan);
    }

    origin = origin.toUpperCase();
    if (origin === 'C' || origin === 'CL') {
        origin = Math.floor((K - 1) / 2);
    } else if (origin === 'CR') {
        origin = Math.ceil((K - 1) / 2);
    }
    
    // 2. Filtering
    /*
    var iI0 = this.getI0(), oI0 = output.getI0();
    var iDx = this.getDx(), oDx = output.getDx();
    var iDy = this.getDy(), oDy = output.getDy();
    var idata = this.data,  odata = output.data;
    nx = this.nx;
    ny = this.ny;
     */
    var ix0 = viewI.getFirst(0), ox0 = viewO.getFirst(0);
    var iy0 = viewI.getFirst(1), oy0 = viewO.getFirst(1);
    var iDx = viewI.getStep(0), oDx = viewO.getStep(0);
    var iDy = viewI.getStep(1), oDy = viewO.getStep(1);
    nx = viewI.getSize(0);
    ny = viewI.getSize(1);
    /*
    console.log("filter1d");
    console.log(ix0, iy0, iDx, iDy);
    console.log(ox0, oy0, oDx, oDy);
    console.log(nx, ny);
     */
    var id = this.getData(),  od = output.getData();

    var nx2 = 2 * nx;
    var iy_, oy_, ox_;
    var k, s, sTmp, sum;

    for (c = 0; c < 1; c++) {
        for (y = 0, iy_ = c * nx * ny + iy0, oy_ = c * od.length / 3 + oy0; y < ny; y++, iy_ += iDy, oy_ += oDy) {
            for (x = 0, ox_ = oy_ + ox0; Dout * x < nx; x++, ox_ += oDx) {
                sum = 0;
                s = Dout * x + Dker * origin;
                for (k = 0; k < K; k++, s -= Dker) {
                    sTmp = s;
                    while (sTmp < 0) {
                            sTmp += nx;
                    }
                    while (sTmp >= nx) {
                        sTmp -= nx;
                    }
                    sum += kernel[k] * id[iy_ + sTmp * iDx];
                }
                if (add) {
                    od[ox_] += sum;
                } else  {
                    od[ox_] = sum;
                }
            }
        }
    }
    
    // Return the result
    return output;
};

/** Compute each scale properties:<br />
 *  - shape 'width' and 'height' of the coefficients.<br />
 *  - 'pow' is the subsampling factor.<br />
 *  - 'cumWidth' and 'cumHeight' from scale 0 to current.
 * @private
 * @return {Array of Object}
 *  The properties for each scale.
 */
WT.prototype.getScalesParameters = function () {
    'use strict';
    var w = this.width;
    var h = this.height;
    var pow = 1;
    var list = [];
    var k;
    for (k = this.level; k > 0; k--, pow *= 2) {
        if (!this.redundant) {
            w = Math.ceil(w / 2);
            h = Math.ceil(h / 2);
        }
        list[k] = {
            'width': w,
            'height': h,
            'pow': pow,
            'cumWidth': 0,
            'cumHeight': 0
        };
    }
    list[0] = {
        'width': w,
        'height': h,
        'pow': pow,
        'cumWidth': 0,
        'cumHeight': 0
    };

    w = h = 0;
    for (k = 0; k <= this.level; k++) {
        list[k].cumWidth = w;
        list[k].cumHeight = h;
        w += list[k].width;
        h += list[k].height;
    }
    return list;
};

/** Perform the 2D wavelet transform
 *  from the image stored in 'this.tmp'.
 *  Use 'this.data' to store the coefficients
 *  and 'this.subband' to store the scale views.
 * @see WT
 * @private
 */
WT.prototype.wt2 = function () {
    'use strict';
    var wav = this.wavelet;
    var input = this.tmp;
    var scaleList = this.getScalesParameters();
    //console.log(scaleList);
    // Create output image
    var lastScale = scaleList[scaleList.length - 1];
    var dataWidth = lastScale.cumWidth + lastScale.width;
    var dataHeight = lastScale.cumHeight + lastScale.height;
    if (this.redundant) {
        // TODO
        // dataHeight = 3 * input.getSize(0);
    }
    
    this.data = Matrix.zeros(dataHeight, dataWidth, input.getSize(2));
    var viewLL = this.data.getView(), viewLH = this.data.getView();
    var viewHL = this.data.getView(), viewHH = this.data.getView();

    this.subband = [];
    if (this.redundant) {
        // TODO:
        // viewLL.y0 = input.getSize(0);
        // viewHH.y0 = input.getSize(0);
        // viewLH.y0 = 2 * input.getSize(0);
    }

    // Buffer image
    var halfHeight = (this.redundant) ? this.height : Math.ceil(this.height / 2);
    var buffer = Matrix.zeros(2 * halfHeight, this.width, input.getSize(2));
    var buffL = buffer.getView().select([0, halfHeight - 1]);
    var buffH = buffer.getView().select([halfHeight, -1]);
    var viewI = input.getView();

    window.buffer = buffer;
    window.data = this.data;
    console.log(wav.filterL, wav.filterH);

    // Process each scale
    while (scaleList.length > 1) {
        var s = scaleList.pop();
        var D = (this.redundant) ? {'Dker': s.pow} : {'Dout': 2};

        // H filtering from image to buffer
        buffL.select([0, s.height - 1]);
        buffH.select([0, s.height - 1]);
        
        input._filter1d(viewI, wav.filterL, 'cl', D, buffer, buffL);
        input._filter1d(viewI, wav.filterH, 'cl', D, buffer, buffH);

        if (this.redundant) {
            // TODO
            // viewHL.x0 = viewLH.x0 = viewHH.x0 = s.cumWidth;
        } else {
            viewLL.select([0, s.height - 1], [0, s.width - 1]);
            viewLH.select([0, s.height - 1], [s.width, 2 * s.width - 1]);
            viewHL.select([s.height, 2 * s.height - 1], [0, s.width - 1]);
            viewHH.select([s.height, 2 * s.height - 1], [s.width, 2 * s.width - 1]);
        }
        this.subband[scaleList.length] = {
            'HL': new MatrixView(viewHL),
            'LH': new MatrixView(viewLH),
            'HH': new MatrixView(viewHH)
        };
        // V filtering from buffer to data
        buffL.swapDimensions(0, 1);
        buffH.swapDimensions(0, 1);
        viewLL.swapDimensions(0, 1);
        viewLH.swapDimensions(0, 1);
        viewHL.swapDimensions(0, 1);
        viewHH.swapDimensions(0, 1);
        buffer._filter1d(buffL, wav.filterL, 'cl', D, this.data, viewLL);
        buffer._filter1d(buffL, wav.filterH, 'cl', D, this.data, viewLH);
        buffer._filter1d(buffH, wav.filterL, 'cl', D, this.data, viewHL);
        buffer._filter1d(buffH, wav.filterH, 'cl', D, this.data, viewHH);
        buffL.swapDimensions(0, 1);
        buffH.swapDimensions(0, 1);
        viewLL.restore();
        viewLH.restore();
        viewHL.restore();
        viewHH.restore();

        // Be ready for next scale
        buffL.select([], [0, s.width - 1]);
        buffH.select([], [0, s.width - 1]);
        viewI = viewLL;
        input = this.data;
    }
    this.subband[0] = {'LL': input.getView()};
};

/** Perform the inverse wavelet transform.
 * @see WT#inverse
 * @private
 * @param {ImageJS} [output]
 *  Output image.
 * @return {ImageJS}
 *  The reconstructed image.
 */
WT.prototype.iwt2 = function (output) {
    'use strict';
    var re = this.redundant;
    var factor = (re) ? 0.5 : 1;
    var filterL = Wavelet.filter(this.wavelet.invFilterL, 'rescale', factor);
    var filterH = Wavelet.filter(this.wavelet.invFilterH, 'rescale', factor);

    // If not redundant, oversampled image
    var decimView2;
    if (!re) {
        var data2 = this.data.getNew(2 * this.data.width, 2 * this.data.height);
        this.data.exportImage(data2.S(2));
        decimView2 = function (view) {
            view.data = data2.data;
            view.width = data2.width;
            view.height = data2.height;
            view.x0 *= 2;
            view.y0 *= 2;
            view.nx *= 2;
            view.ny *= 2;
            if (view.tx !== 1) {
                view.tx *= 2;
            }
            if (view.ty !== 1) {
                view.ty *= 2;
            }
        };
    }

    // Buffer image
    var roundedWidth = (re) ? this.width : 2 * Math.ceil(this.width / 2);
    var roundedHeight = (re) ? this.height : 2 * Math.ceil(this.height / 2);
    var outBuffer = this.data.getNew(roundedWidth * 2 * factor, roundedHeight * 2 * factor);
    var buffer = this.data.getNew(2 * roundedWidth, roundedHeight);
    var buffL = buffer.getView();
    var buffH = buffer.getView();
    buffL.nx = buffH.nx = buffH.x0 = roundedWidth;

    // Process each scale
    var k, decim = Math.pow(2, this.level - 1);
    var viewLL = this.getScale(0).LL;
    if (!re) {
        decimView2(viewLL);
    }
    for (k = 1; k <= this.level; k++, decim /= 2) {
        var view = this.getScale(k);
        var D = (!re) ? 1 : {'Dker': decim};

        // Adapt buffer size
        if (!re) {
            decimView2(view.HL);
            decimView2(view.LH);
            decimView2(view.HH);
            viewLL.dx = viewLL.dy = 1;
            buffL.nx = buffH.nx = viewLL.nx = view.HH.nx;
            buffL.ny = buffH.ny = viewLL.ny = view.HH.ny;
        }

        // V filtering
        viewLL.T()._filter1d(filterL, 'cr', D, buffL.T(), false);
        view.LH.T()._filter1d(filterH, 'cr', D, buffL.T(), true);
        view.HL.T()._filter1d(filterL, 'cr', D, buffH.T(), false);
        view.HH.T()._filter1d(filterH, 'cr', D, buffH.T(), true);

        // H filtering
        viewLL = outBuffer.getView();
        if (!re) {
            viewLL.S_(2);
            viewLL.nx = buffL.nx;
            viewLL.ny = buffL.ny;
        }
        buffL._filter1d(filterL, 'cr', D, viewLL, false);
        buffH._filter1d(filterH, 'cr', D, viewLL, true);
    }

    // Copy the result
    viewLL.nx = this.width;
    viewLL.ny = this.height;
    return viewLL.exportImage(output);
};
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

/** @class Matrix */

(function (Matrix, Matrix_prototype) {
    'use strict';


    //////////////////////////////////////////////////////////////////
    //                            TOOLS                             //
    //////////////////////////////////////////////////////////////////


    var getRealColumnArray = function (A) {
        var m = A.getSize(0), n = A.getSize(1), ad = A.getData(), col = [];
        for (var j = 0, _j = 0; j < n; j++, _j += m) {
            col[j] = ad.subarray(_j, m + _j);
        }
        return col;
    };

    var getImagColumnArray = function (A) {
        var m = A.getSize(0), n = A.getSize(1);
        var aid = A.getImagData(), col = [];
        for (var j = 0, _j = 0; j < n; j++, _j += m) {
            col[j] = aid.subarray(_j, m + _j);
        }
        return col;
    };

    var resizeRealMatrix = function (A, m, n) {
        var o = Math.min(A.getSize(1), n);
        var X = new Matrix([m, n]);
        var Xcol = getRealColumnArray(X);
        var Acol = getRealColumnArray(A);
        for (var i = 0; i < o; i++) {
            Xcol[i].set(Acol[i].subarray(0, m));
        }
        return X;
    };

    var resizeComplexMatrix = function (A, m, n) {
        var o = Math.min(A.getSize(1), n);
        var X = new Matrix([m, n], undefined, true);
        var Xcolr = getRealColumnArray(X);
        var Xcoli = getImagColumnArray(X);
        var Acolr = getRealColumnArray(A);
        var Acoli = getImagColumnArray(A);
        for (var i = 0; i < o; i++) {
            Xcolr[i].set(Acolr[i].subarray(0, m));
            Xcoli[i].set(Acoli[i].subarray(0, m));
        }
        return X;
    };

    var swap = function (t, a, b) {
        var v = t[a];
        t[a] = t[b];
        t[b] = v;
    };

    var swapColumn = function (t, r, k, col) {
        col.set(t[r]);
        t[r].set(t[k]);
        t[k].set(col);
    };

    var findMax = function (tab, iMax) {
        var i, ie, vMax;
        vMax = tab[iMax];
        for (i = iMax + 1, ie = tab.length; i < ie; i++) {
            if (tab[i] > vMax) {
                iMax = i;
                vMax = tab[i];
            }
        }
        return iMax;
    };

    var normFro = function (c, r) {
        var i, ei, norm = 0;
        for (i = r, ei = c.length; i < ei; i++) {
            norm += c[i];
        }
        return Math.sqrt(norm);
    };

    var getRowVector = function (cols, i) {
        var j, ej = cols.length, row = new Array(ej);
        for (j = 0; j < ej; j++) {
            row[j] = cols[j][i];
        }
        return row;
    };

    var setRowVector = function (cols, i, row) {
        for (var j = 0, ej = cols.length; j < ej; j++) {
            cols[j][i] = row[j];
        }
    };

    var dotproduct = function (cxArray, nx, ria, sk, ek, i, cst) {
        // l = [0, N - 1]
        for (var l = 0; l < nx; l++) {
            var clx = cxArray[l];
            // k = [0, i]
            for (var vr = 0, k = sk; k < ek; k++) {
                vr += clx[k] * ria[k];
            }
            clx[i] -= vr;
            clx[i] *= cst;
        }
    };
    /*
     var dotproduct_cplx = function (cxrArray, cxiArray, nx, riar, riai, sk, ek, i, rd, id, cst) {
     var a, b, c, d;
     // l = [0, N - 1]
     for (var l = 0; l < nx; l++) {
     var clxr = cxrArray[l];
     var clxi = cxiArray[l];

     // k = [0, i]
     for (var vr = 0, vi = 0, k = sk; k < ek; k++) {
     a = clxr[k];
     b = clxi[k];
     c = riar[k];
     d = riai[k];
     vr += a * c - b * d;
     vi += b * c + a * d;
     }

     a = clxr[i] - vr;
     b = clxi[i] - vi;
     clxr[i] = (a * rd + b * id) * cst;
     clxi[i] = (b * rd - a * id) * cst;
     }
     };
     */


    //////////////////////////////////////////////////////////////////
    //                   MATRIX MULTIPLICATIONS                     //
    //////////////////////////////////////////////////////////////////


    var mtimes_real_real = function (a, bcols, out, M, N, K) {
        var i, j, l, ij, il, bl, tmp;
        var rowTmp = new Float64Array(N);
        for (i = 0; i < M; i++) {
            // Copy the i-th row of matrix A.
            for (j = 0, ij = i; j < N; j++, ij += M) {
                rowTmp[j] = a[ij];
            }
            // Dot product between the i-th row of matrix A and the l-th row of matrix B.
            for (il = i, l = 0; l < K; il += M, l++) {
                bl = bcols[l];
                for (tmp = 0, j = 0; j < N; j++) {
                    tmp += rowTmp[j] * bl[j];
                }
                out[il] = tmp;
            }
        }
    };

    var mtimes_real_cplx = function (a, brcols, bicols, outr, outi, M, N, K) {
        var i, j, l, ij, il, brl, bil, tmpr, tmpi, ar;
        var rowTmp = new Float64Array(N);
        for (i = 0; i < M; i++) {
            // Copy the i-th row of matrix A.
            for (j = 0, ij = i; j < N; j++, ij += M) {
                rowTmp[j] = a[ij];
            }
            // Dot product between the i-th row of matrix A and the l-th row of matrix B.
            for (il = i, l = 0; l < K; il += M, l++) {
                brl = brcols[l];
                bil = bicols[l];
                for (tmpr = 0, tmpi = 0, j = 0; j < N; j++) {
                    ar = rowTmp[j];
                    tmpr += ar * brl[j];
                    tmpi += ar * bil[j];
                }
                outr[il] = tmpr;
                outi[il] = tmpi;
            }
        }
    };

    var mtimes_cplx_real = function (ar, ai, bcols, outr, outi, M, N, K) {
        var i, j, l, ij, il, bl, tmpr, tmpi, br;
        var rowrTmp = new Float64Array(N);
        var rowiTmp = new Float64Array(N);
        for (i = 0; i < M; i++) {
            // Copy the i-th row of matrix A.
            for (j = 0, ij = i; j < N; j++, ij += M) {
                rowrTmp[j] = ar[ij];
                rowiTmp[j] = ai[ij];
            }
            // Dot product between the i-th row of matrix A and the l-th row of matrix B.
            for (l = 0, il = i; l < K; l++, il += M) {
                bl = bcols[l];
                for (tmpr = 0, tmpi = 0, j = 0; j < N; j++) {
                    br = bl[j];
                    tmpr += rowrTmp[j] * br;
                    tmpi += rowiTmp[j] * br;
                }
                outr[il] = tmpr;
                outi[il] = tmpi;
            }
        }
    };

    var mtimes_cplx_cplx = function (ard, aid, brcols, bicols, outr, outi, M, N, K) {
        var i, j, l, ij, il, brl, bil, tmpr, tmpi, ar, ai, br, bi;
        var rowr = new Matrix.dataType(N);
        var rowi = new Matrix.dataType(N);
        for (i = 0; i < M; i++) {
            // Copy the i-th row of matrix A.
            for (j = 0, ij = i; j < N; j++, ij += M) {
                rowr[j] = ard[ij];
                rowi[j] = aid[ij];
            }
            // Dot product between the i-th row of matrix A and the l-th row of matrix B.
            for (il = i, l = 0; l < K; il += M, l++) {
                brl = brcols[l];
                bil = bicols[l];
                for (tmpr = 0, tmpi = 0, j = 0; j < N; j++) {
                    ar = rowr[j];
                    ai = rowi[j];
                    br = brl[j];
                    bi = bil[j];
                    tmpr += ar * br - ai * bi;
                    tmpi += ar * bi + ai * br;
                }
                outr[il] = tmpr;
                outi[il] = tmpi;
            }
        }
    };


    //////////////////////////////////////////////////////////////////
    //                   GAUSSIAN SUBSTITUTIONS                     //
    //////////////////////////////////////////////////////////////////


    var gaussianSubstitution_real_real = function (forward, A, X, rdiag) {
        // Matrix A iterators
        var viewA = A.getView();
        var m = viewA.getSize(0), n = viewA.getSize(1), dn = viewA.getStep(1);

        var rank = Math.min(m, n);
        var Float = Tools.checkType(A.getDataType());

        // Matrix X
        var viewX = X.getView();
        var nx = viewX.getSize(1);

        var cxArray = getRealColumnArray(X);
        var ad = A.getData();

        // Main loop variables
        var i, j;
        // Composed loop variables
        var ij, ii;
        // End loop variables
        var ei, ek, eij;

        // Row i matrix a, real and imaginary parts
        var ria = new Float(rank);

        var si = forward ? 0 : rank - 1;
        ei = forward ? rank : -1;
        var di = forward ? 1 : -1;
        var dii = forward ? dn + 1 : -dn - 1;

        for (i = si, ii = i + i * dn; i !== ei; i += di, ii += dii) {

            var rd = (rdiag === undefined) ? ad[ii] : rdiag[i];
            var cst = 1 / rd;
            var sk = forward ? 0 : i + 1;
            ek = forward ? i + 1 : rank;
            var sj = forward ? 0 : i;
            var sij = forward ? i : ii;
            eij = forward ? ii: i + rank * dn;

            for (j = sj, ij = sij; ij < eij; j++, ij += dn) {
                ria[j] = ad[ij];
            }

            // l = [0, N - 1]
            dotproduct(cxArray, nx, ria, sk, ek, i, cst);
        }
    };

    var gaussianSubstitution_real_cplx = function (forward, A, X, rdiag) {
        // Matrix A iterators
        var viewA = A.getView();
        var m = viewA.getSize(0), n = viewA.getSize(1), dn = viewA.getStep(1);
        var rank = Math.min(m, n);
        var Float = Tools.checkType(A.getDataType());

        // Matrix X
        var viewX = X.getView();
        var nx = viewX.getSize(1);

        var cxrArray = getRealColumnArray(X);
        var cxiArray = getImagColumnArray(X);
        var ad = A.getData();

        // Main loop variables
        var i, j, k, l;
        // Composed loop variables
        var ij, ii;
        // End loop variables
        var ei, ek, eij;

        var si = forward ? 0 : rank - 1;
        ei = forward ? rank : -1;
        var di = forward ? 1 : -1;
        var dii = forward ? dn + 1 : -dn - 1;

        var vr, vi;
        var ria = new Float(rank);


        for (i = si, ii = i + i * dn; i !== ei; i += di, ii += dii) {

            var rd = (rdiag === undefined) ? ad[ii] : rdiag[i];
            var cst = 1 / rd;

            var sk = forward ? 0 : i + 1;
            ek = forward ? i + 1 : rank;
            var sj = forward ? 0 : i;
            var sij = forward ? i : ii;
            eij = forward ? ii: i + rank * dn;

            for (j = sj, ij = sij; ij < eij; j++, ij += dn) {
                ria[j] = ad[ij];
            }

            // l = [0, N - 1]
            for (l = 0; l < nx; l++) {
                var clxr = cxrArray[l];
                var clxi = cxiArray[l];

                // k = [0, i]
                for (vr = 0, vi = 0, k = sk; k < ek; k++) {
                    var c = ria[k];
                    vr += clxr[k] * c;
                    vi += clxi[k] * c;
                }

                clxr[i] -= vr;
                clxi[i] -= vi;
                clxr[i] *= cst;
                clxi[i] *= cst;

            }

        }

    };

    var gaussianSubstitution_cplx_cplx = function (forward, A, X, rdiag, idiag) {
        // Matrix A iterators
        var viewA = A.getView();
        var m = viewA.getSize(0), n = viewA.getSize(1), dn = viewA.getStep(1);
        var rank = Math.min(m, n);
        var Float = Tools.checkType(A.getDataType());

        // Matrix X
        var viewX = X.getView();
        var nx = viewX.getSize(1);

        if (X.isreal()) {
            X.toComplex();
        }

        var ard = A.getRealData(), aid = A.getImagData();
        var cxrArray = getRealColumnArray(X), cxiArray = getImagColumnArray(X);

        // Main loop variables
        var i, j, k, l;
        // Composed loop variables
        var ij, ii;
        // End loop variables
        var ei, ek, eij;

        var si, di, dii;
        si = forward ? 0 : rank - 1;
        ei = forward ? rank : -1;
        di = forward ? 1 : -1;
        dii = forward ? dn + 1 : -dn - 1;

        var riar = new Float(rank), riai = new Float(rank);


        var vr, vi, a, b, c, d;
        for (i = si, ii = i + i * dn; i !== ei; i += di, ii += dii) {

            var rd = (rdiag === undefined) ? ard[ii] : rdiag[i];
            var id = (idiag === undefined) ? aid[ii] : idiag[i];
            var cst = 1 / (rd * rd + id * id);

            var sk = forward ? 0 : i + 1;
            ek = forward ? i + 1 : rank;
            var sj = forward ? 0 : i;
            var sij = forward ? i : ii;
            eij = forward ? ii : i + rank * dn;

            for (j = sj, ij = sij; ij < eij; j++, ij += dn) {
                riar[j] = ard[ij];
                riai[j] = aid[ij];
            }
            // dotproduct_cplx(cxrArray, cxiArray, nx, riar, riai, sk, ek, i, rd, id, cst);

            // l = [0, N - 1]
            for (l = 0; l < nx; l++) {
                var clxr = cxrArray[l];
                var clxi = cxiArray[l];

                // k = [0, i]
                for (vr = 0, vi = 0, k = sk; k < ek; k++) {
                    a = clxr[k];
                    b = clxi[k];
                    c = riar[k];
                    d = riai[k];
                    vr += a * c - b * d;
                    vi += b * c + a * d;
                }

                a = clxr[i] - vr;
                b = clxi[i] - vi;
                clxr[i] = (a * rd + b * id) * cst;
                clxi[i] = (b * rd - a * id) * cst;

            }

        }
    };

    var gaussianSubstitution = function (forward, A, X, rdiag, idiag) {
        if (A.isreal()) {
            if  (X.isreal()) {
                gaussianSubstitution_real_real(forward, A, X, rdiag);
            } else {
                gaussianSubstitution_real_cplx(forward, A, X, rdiag);
            }
        } else {
            gaussianSubstitution_cplx_cplx(forward, A, X, rdiag, idiag);
        }
        return X;
    };


    //////////////////////////////////////////////////////////////////
    //                   CHOLESKY DECOMPOSITION                     //
    //////////////////////////////////////////////////////////////////


    var cholesky_real = function (cArray, n) {
        var k, p, i, ck, ci, v, cst;
        for (k = 0; k < n; k++) {
            ck = cArray[k];
            for (v = 0, p = 0; p < k; p++) {
                v += ck[p] * ck[p];
            }
            if (ck[k] - v < 0) {
                throw new Error("Matrix.chol: Input must be positive definite.");
            }
            ck[k] = Math.sqrt(ck[k] - v);
            cst = 1 / ck[k];
            for (p = k + 1; p < n; p++) {
                ck[p] = 0;
            }

            for (i = k + 1; i < n; i++) {
                ci = cArray[i];
                for (v = 0, p = 0; p < k; p++) {
                    v += ci[p] * ck[p];
                }
                ci[k] -= v;
                ci[k] *= cst;
            }
        }
    };

    var cholesky_cplx = function (crArray, ciArray, n) {
        var crk, cik, cri, cii;
        var vr, vi, a, b, c, d;
        var k, p, i, cst;
        for (k = 0; k < n; k++) {
            crk = crArray[k];
            cik = ciArray[k];
            for (vr = 0, p = 0; p < k; p++) {
                c = crk[p];
                d = cik[p];
                vr += c * c + d * d;
            }
            if (crk[k] - vr < 0) {
                throw new Error("Matrix.chol: Input must be positive definite.");
            }
            if (cik[k] !== 0) {
                throw new Error("Matrix.chol: Diagonal must be real positive.");
            }
            crk[k] = Math.sqrt(crk[k] - vr);
            cik[k] = 0;
            cst = 1 / (crk[k] * crk[k]);
            for (p = k + 1; p < n; p++) {
                crk[p] = 0;
                cik[p] = 0;
            }

            for (i = k + 1; i < n; i++) {
                cri = crArray[i];
                cii = ciArray[i];
                for (vr = 0, vi = 0, p = 0; p < k; p++) {
                    a = cri[p];
                    b = cii[p];
                    c = crk[p];
                    d = cik[p];
                    vr += a * c + b * d;
                    vi += b * c - a * d;
                }
                cri[k] -= vr;
                cii[k] -= vi;
                a = cri[p];
                b = cii[p];
                c = crk[p];
                d = cik[p];
                cri[k] = (a * c + b * d) * cst;
                cii[k] = (b * c - a * d) * cst;
            }
        }
    };


    //////////////////////////////////////////////////////////////////
    //                       FULL LU MODULE                         //
    //////////////////////////////////////////////////////////////////

    /*
     var cmtl = function (cArray, ck, k, m, n) {
     var i, j, v = 1 / ck[k];
     for (i = k + 1; i < m; i++) {
     ck[i] *= v;
     }
     for (j = k + 1; j < n; j++) {
     var cj = cArray[j];
     v = cj[k];
     for (i = k + 1; i < m; i++) {
     cj[i] -= ck[i] * v;
     }
     }
     };
     */
    var computeLU_real = function (cArray, m, n, piv) {
        var i, j, k, abs = Math.abs, pivsign = 1;
        for (k = 0; k < n; k++) {
            var ck = cArray[k];
            var p = k;
            for (i = k + 1; i < m; i++) {
                if (abs(ck[i]) > abs(ck[p])) {
                    p = i;
                }
            }
            if (p !== k) {
                for (j = 0; j < n; j++) {
                    swap(cArray[j], p, k);
                }
                swap(piv, p, k);
                pivsign = -pivsign;
            }

            //cmtl(cArray, ck, k, m, n);
            var v = 1 / ck[k];
            for (i = k + 1; i < m; i++) {
                ck[i] *= v;
            }

            for (j = k + 1; j < n; j++) {
                var cj = cArray[j];
                v = cj[k];
                for (i = k + 1; i < m; i++) {
                    cj[i] -= ck[i] * v;
                }
            }

        }
    };

    var computeLU = function (A) {

        var LU = A.getCopy();

        // Scaning the from the second dimension (dim = 1)
        var view = LU.getView();
        var dn = view.getStep(1), m = view.getSize(0), n = view.getSize(1);

        var k, _k, i, j, p;

        var Float = Tools.checkType(A.getDataType());
        var piv = new Float(A.getSize(0)), pivsign = 1;
        for (i = 0; i < m; i++) {
            piv[i] = i;
        }

        if (LU.isreal()) {

            var lud = LU.getData(), cArray = [];
            for (k = 0, _k = 0; k < n; _k += dn, k++) {
                cArray[k] = lud.subarray(_k, m + _k);
            }

            computeLU_real(cArray, m, n, piv);
            /*
             for (k = 0; k < n; k++) {
             ck = cArray[k];
             p = k;
             for (i = k + 1; i < m; i++) {
             if (abs(ck[i]) > abs(ck[p])) {
             p = i;
             }
             }
             if (p !== k) {
             for (j = 0; j < n; j++) {
             swap(cArray[j], p, k);
             }
             swap(piv, p, k);
             pivsign = -pivsign;
             }

             v = 1 / ck[k];
             for (i = k + 1; i < m; i++) {
             ck[i] *= v;
             }
             for (j = k + 1; j < n; j++) {
             cj = cArray[j];
             v = cj[k];
             for (i = k + 1; i < m; i++) {
             cj[i] -= ck[i] * v;
             }
             }
             }
             */

        } else {

            var lurd = LU.getRealData(), crArray = [], crk, crj, vr;
            var luid = LU.getImagData(), ciArray = [], cik, cij, vi;
            for (k = 0, _k = 0; k < n; _k += dn, k++) {
                crArray[k] = lurd.subarray(_k, m + _k);
                ciArray[k] = luid.subarray(_k, m + _k);
            }
            var mod, a, b, c, d;

            for (k = 0; k < n; k++) {
                crk = crArray[k];
                cik = ciArray[k];
                p = k;
                for (i = k + 1; i < m; i++) {
                    a = crk[i];
                    b = cik[i];
                    c = crk[p];
                    d = cik[p];
                    if (a * a + b * b > c * c + d * d) {
                        p = i;
                    }
                }
                if (p !== k) {
                    for (j = 0; j < n; j++) {
                        swap(crArray[j], p, k);
                        swap(ciArray[j], p, k);
                    }
                    swap(piv, p, k);
                    pivsign = -pivsign;
                }
                vr = crk[k];
                vi = cik[k];
                mod = vr * vr + vi * vi;
                vr = vr / mod;
                vi = -vi / mod;
                for (i = k + 1; i < m; i++) {
                    a = crk[i];
                    b = cik[i];
                    crk[i] = a * vr - b * vi;
                    cik[i] = a * vi + b * vr;
                }
                for (j = k + 1; j < n; j++) {
                    crj = crArray[j];
                    cij = ciArray[j];

                    vr = crj[k];
                    vi = cij[k];
                    for (i = k + 1; i < m; i++) {
                        a = crk[i];
                        b = cik[i];
                        crj[i] -= a * vr - b * vi;
                        cij[i] -= b * vr + a * vi;
                    }
                }
            }

        }
        return {LU: LU, piv: piv, pivsign: pivsign};
    };

    var isNonsingular = function (LU) {
        var view = LU.getView(), lud = LU.getData();
        var n = view.getSize(0);
        var ij, eij, d;
        for (ij = 0, eij = n * n, d = n + 1; ij < eij; ij += d) {
            if (lud[ij] === 0) {
                return false;
            }
        }
        return true;
    };

    var getLU = function (param, P) {
        var L, U;
        var m = param.LU.getSize(0);
        var n = param.LU.getSize(1);
        if (m === n) {
            L = param.LU.getCopy();
            U = param.LU.getCopy();
        } else if (m < n) {
            L = param.LU.select([], [0, m - 1]);
            U = param.LU.select([0, m - 1], []);
        } else {
            L = param.LU.select([], [0, n - 1]);
            U = param.LU.select([0, n - 1], []);
        }
        var view, lm;
        var dn, ln;

        // Loop variables
        var i, j, _j;
        // Composed loop variables
        var ij;
        // End Loop variables
        var ei, e_j, eij;

        // L matrix
        view = L.getView();
        lm = view.getEnd(0);
        dn = view.getStep(1);
        ln = view.getEnd(1);
        if (param.LU.isreal()) {
            var ld = L.getData();
            // j = [0, min(M, N) - 1]
            for (j = 0, _j = 0, e_j = ln, j = 0; _j < e_j; j++, _j += dn) {
                // i = [0, j - 1], i < j
                for (ij = _j, eij = j + _j; ij < eij; ij++) {
                    ld[ij] = 0;
                }
                // i = j
                ld[ij] = 1;
            }
        } else {
            var ldr = L.getRealData(), ldi = L.getImagData();
            // j = [0, min(M, N) - 1]
            for (j = 0, _j = 0, e_j = ln, j = 0; _j < e_j; j++, _j += dn) {
                // i = [0, j - 1], i < j
                for (ij = _j, eij = j + _j; ij < eij; ij++) {
                    ldr[ij] = 0;
                    ldi[ij] = 0;
                }
                // i = j
                ldr[ij] = 1;
                ldi[ij] = 0;
            }
        }

        // U matrix
        view = U.getView();
        lm = view.getEnd(0);
        dn = view.getStep(1);
        ln = view.getEnd(1);
        if (param.LU.isreal()) {

            var ud = U.getData();
            // j = [0, N - 1]
            for (j = 0, _j = 0, e_j = ln, j = 0; _j < e_j; j++, _j += dn) {
                // i = [j + 1, M - 1], i > j
                for (ij = (j + 1) + _j, eij = lm + _j; ij < eij; ij++) {
                    ud[ij] = 0;
                }
            }

        } else {

            var urd = U.getRealData(), uid = U.getImagData();
            // j = [0, N - 1]
            for (j = 0, _j = 0, e_j = ln, j = 0; _j < e_j; j++, _j += dn) {
                // i = [j + 1, M - 1], i > j
                for (ij = (j + 1) + _j, eij = lm + _j; ij < eij; ij++) {
                    urd[ij] = 0;
                    uid[ij] = 0;
                }
            }

        }

        var piv = param.piv;
        if (P === false) {
            var Float = Tools.checkType(L.getDataType());
            var ipiv = new Float(m);
            for (i = 0, ei = piv.length; i < ei; i++) {
                ipiv[piv[i]] = i;
            }
            L = L.select([ipiv]);
            return [L, U];
        }

        // P matrix
        P = new Matrix([m, m]);
        var pd = P.getData();
        view = P.getView();
        lm = view.getEnd(0);
        dn = view.getStep(1);
        ln = view.getEnd(1);
        for (i = 0; i < m; i++) {
            pd[i + piv[i] * dn] = 1;
        }
        return [L, U, P];

    };

    var solveLU = function (A, B) {
        var params = computeLU(A);
        var LU = params.LU, piv = params.piv;

        if (!isNonsingular(LU)) {
            throw new Error("Matrix.mldivide: Matrix is singular.");
        }

        // Data
        B = B.select([piv]);
        var rdiag = Matrix.ones(LU.getSize(0)).getData();
        var idiag = Matrix.zeros(LU.getSize(0)).getData();
        gaussianSubstitution(true, LU, B, rdiag, idiag);
        return gaussianSubstitution(false, LU, B);
    };


    //////////////////////////////////////////////////////////////////
    //                       FULL QR MODULE                         //
    //////////////////////////////////////////////////////////////////


    var house_real = function (real, j) {
        var i, m = real.length;

        // Determiation of x normalization factor
        var M = -Infinity, mod;
        for (i = j; i < m; i++) {
            mod = Math.abs(real[i]);
            if (mod > M) {
                M = mod;
            }
        }

        // Vector v computation from x normalized
        var iM = (M !== 0) ? 1 / M : 0;
        var sigma = 0, x1 = real[j] * iM;
        for (real[j] = 1, i = j + 1; i < m; i++) {
            real[i] *= iM;
            sigma += real[i] * real[i];
        }

        // Compute sqrt(x1^2 + sigma)
        var mu = Math.sqrt(x1 * x1 + sigma);

        // Compute 2 * v1^2 / (sigma + v1^2)
        var sig = (x1 > 0) ? 1 : -1;
        var v1 = x1 + sig * mu;
        var v12 = v1 * v1;
        var beta = 2 * v12 / (sigma + v12);

        // Compute 1 / V1
        var iv1 = 1 / v1;

        // Normalize vector by 1 / v1
        for (i = j + 1; i < m; i++) {
            real[i] *= iv1;
        }

        real[j] = - sig * mu * M;

        return beta;
    };

    var update_real = function (v, c, beta, j, start) {
        var i, l, n = c.length, m = c[0].length;
        var s, coll;

        for (l = start; l < n; l++) {
            coll = c[l];
            for (s = coll[j], i = j + 1; i < m; i++) {
                s += v[i] * coll[i];
            }
            s *= beta;
            for (coll[j] -= s, i = j + 1; i < m; i++) {
                coll[i] -= v[i] * s;
            }
        }
    };

    var house_complex = function (real, imag, j) {
        var i, m = real.length, a, b;

        // Determiation of x normalization factor
        var M = -Infinity, mod;
        for (i = j; i < m; i++) {
            mod = Math.abs(real[i]) + Math.abs(imag[i]);
            if (mod > M) {
                M = mod;
            }
        }

        // Vector v computation from x normalized
        var iM = (M !== 0) ? 1 / M : 0;
        var sigma = 0, x1r = real[j] * iM, x1i = imag[j] * iM;
        for (real[j] = 1, imag[j] = 0, i = j + 1; i < m; i++) {
            real[i] *= iM;
            imag[i] *= iM;
            a = real[i];
            b = imag[i];
            sigma += a * a + b * b;
        }

        // Compute sqrt(x1^2 + sigma)
        var mu = Math.sqrt(x1r * x1r + x1i * x1i + sigma), an = Math.atan2(x1i, x1r);

        // Compute 2 * v1^2 / (sigma + v1^2)
        var v1r = x1r + mu * Math.cos(an), v1i = x1i + mu * Math.sin(an);
        var v12 = v1r * v1r + v1i * v1i;
        var beta = 2 * v12 / (sigma + v12);

        // Compute 1 / V1
        mod = 1 / (v1r * v1r + v1i * v1i);
        var iv1r = v1r * mod, iv1i = -v1i * mod;

        // Normalize vector by 1 / v1
        for (i = j + 1; i < m; i++) {
            a = real[i];
            b = imag[i];
            real[i] = a * iv1r - b * iv1i;
            imag[i] = b * iv1r + a * iv1i;
        }

        real[j] = -mu * M * Math.cos(an);
        imag[j] = -mu * M * Math.sin(an);

        return beta;
    };

    var update_complex = function (vr, vi, cr, ci, beta, j, start) {
        var sr, si;
        var i, l, n = cr.length, m = cr[0].length;
        var collr, colli;

        for (l = start; l < n; l++) {

            collr = cr[l];
            colli = ci[l];

            for (sr = collr[j], si = colli[j], i = j + 1; i < m; i++) {
                sr += vr[i] * collr[i] + vi[i] * colli[i];
                si += vr[i] * colli[i] - vi[i] * collr[i];
            }

            sr *= beta;
            si *= beta;

            for (collr[j] -= sr, colli[j] -= si, i = j + 1; i < m; i++) {
                collr[i] -= vr[i] * sr - vi[i] * si;
                colli[i] -= vi[i] * sr + vr[i] * si;
            }
        }
    };

    // Compute A = A * (I - Beta*v*v')
    // <=> A_{ij} -= beta * v_{j} * sum_{k=1}^{n} A_{ik} * v_{k}
    var update_right_real = function (v, c, beta, j, start) {
        var s, i, k, n = c.length, m = c[0].length;
        for (i = start; i < m; i++) {

            // sum_{k=1}^{n} A_{ik} * v_{k}
            for (s = c[j][i], k = j + 1; k < n; k++) {
                s += v[k] * c[k][i];
            }

            // beta * sum_{k=1}^{n} A_{ik} * v_{k}
            s *= beta;

            // A_{ij} -= v_{j} * beta * sum_{k=1}^{n} A_{ik} * v_{k}
            for (c[j][i] -= s, k = j + 1; k < n; k++) {
                c[k][i] -= v[k] * s;
            }

        }

    };

    var update_right_complex = function (vr, vi, cr, ci, beta, j, start) {
        var sr, si;
        var i, k, n = cr.length, m = cr[0].length;
        for (i = start; i < m; i++) {

            // sum_{k=1}^{n} A_{ik} * v_{k}
            for (sr = cr[j][i], si = ci[j][i], k = j + 1; k < n; k++) {
                sr += vr[k] * cr[k][i] + vi[k] * ci[k][i];
                si += vr[k] * ci[k][i] - vi[k] * cr[k][i];
            }

            // beta * sum_{k=1}^{n} A_{ik} * v_{k}
            sr *= beta;
            si *= beta;

            // A_{ij} -= v_{j} * beta * sum_{k=1}^{n} A_{ik} * v_{k}
            for (cr[j][i] -= sr, ci[j][i] -= si, k = j + 1; k < n; k++) {
                cr[k][i] -= vr[k] * sr - vi[k] * si;
                ci[k][i] -= vi[k] * sr + vr[k] * si;
            }

        }

    };

    var computehouseBidiagonalisation = function (A) {
        A = A.getCopy();
        var Float = Tools.checkType(A.getDataType());

        var view = A.getView();
        var n = view.getSize(1);
        var j;
        var betac = new Float(n), betar = new Float(n);
        if (A.isreal()) {
            var col = getRealColumnArray(A);

            for (j = 0; j < n; j++) {
                betac[j] = house_real(col[j], j);
                update_real(col[j], col, betac[j], j, j + 1);
                if (j < n - 2) {
                    var row = getRowVector(col, j);
                    betar[j] = house_real(row, j + 1);
                    setRowVector(col, j, row);
                    update_right_real(row, col, betar[j], j + 1, j + 1);
                }
            }

        } else {

            var colr = getRealColumnArray(A), coli = getImagColumnArray(A);

            for (j = 0; j < n; j++) {
                betac[j] = house_complex(colr[j], coli[j], j);
                update_complex(colr[j], coli[j], colr, coli, betac[j], j, j + 1);
                if (j < n - 2) {
                    var rowr = getRowVector(colr, j);
                    var rowi = getRowVector(coli, j);
                    betar[j] = house_complex(rowr, rowi, j + 1);
                    setRowVector(colr, j, rowr);
                    setRowVector(coli, j, rowi);
                    update_right_complex(rowr, rowi, colr, coli, betar[j], j + 1, j + 1);
                }
            }
        }

        return [A, betac, betar];
    };

    var getU = function (UBV) {
        var betar = UBV[1];
        UBV = UBV[0];

        var m = UBV.getSize(0), n = UBV.getSize(1);
        var U = Matrix.eye(m);
        var view = U.getView(), dc = view.getStep(1);

        var j, _j;

        if (UBV.isreal()) {

            var ucol = getRealColumnArray(U);
            var ubvd = UBV.getData();
            for (j = n - 1, _j = dc * j; j >= 0; j--, _j -= dc) {
                var ubvcol = ubvd.subarray(_j, m + _j);
                update_real(ubvcol, ucol, betar[j], j, j);
            }

        } else {

            U.toComplex();
            var ucolr = getRealColumnArray(U), ucoli = getImagColumnArray(U);
            var ubvrd = UBV.getRealData(), ubvid = UBV.getImagData();
            for (j = n - 1, _j = dc * j; j >= 0; j--, _j -= dc) {
                var ubvcolr = ubvrd.subarray(_j, m + _j);
                var ubvcoli = ubvid.subarray(_j, m + _j);
                update_complex(ubvcolr, ubvcoli, ucolr, ucoli, betar[j], j, j);
            }
        }
        return U;
    };

    var getB = function (UBV) {
        return UBV[0].triu().tril(1);
    };

    var getV = function (UBV) {
        var betac = UBV[2];
        UBV = UBV[0].transpose();

        var m = UBV.getSize(0), n = UBV.getSize(1);
        var U = Matrix.eye(m);
        var view = U.getView(), dc = view.getStep(1);

        var j, _j;

        if (UBV.isreal()) {

            var ucol = getRealColumnArray(U);
            var ubvd = UBV.getData();
            for (j = n - 1, _j = dc * j; j >= 0; j--, _j -= dc) {
                var ubvcol = ubvd.subarray(_j, m + _j);
                update_real(ubvcol, ucol, betac[j], j + 1, j + 1);
            }

        } else {

            U.toComplex();
            var ucolr = getRealColumnArray(U), ucoli = getImagColumnArray(U);
            var ubvrd = UBV.getRealData(), ubvid = UBV.getImagData();
            for (j = m - 3, _j = dc * j; j >= 0; j--, _j -= dc) {
                var ubvcolr = ubvrd.subarray(_j, m + _j);
                var ubvcoli = ubvid.subarray(_j, m + _j);
                update_complex(ubvcolr, ubvcoli, ucolr, ucoli, betac[j], j + 1, j + 1);
            }

        }
        return U.transpose();
    };

    var getUBV = function (UBV) {
        return [getU(UBV), getB(UBV), getV(UBV)];
    };

    Matrix.golubStep = function (mu, n) {
        var y = t11 - mu;
        var z = t12;
        for (var k = 0, ek = n - 1; k < ek; k++) {
            
        }
    };
    
    var getR = function (QR) {
        var R = QR[0].getCopy();

        var view = R.getView();
        var dc = view.getStep(1), lr = view.getEnd(0);
        var m = view.getSize(0), n = view.getSize(1);
        var j, _j, ij, jj, eij;

        if (R.isreal()) {
            var rd = R.getData();
            for (j = 0, _j = 0, jj = 0; j < m; j++, _j += dc, jj = j + _j) {
                for (ij = jj + 1, eij = lr + _j; ij < eij; ij++) {
                    rd[ij] = 0;
                }
            }
            for (; j < n; j++, _j += dc, jj = j + _j) {
                for (ij = jj + 1, eij = lr + _j; ij < eij; ij++) {
                    rd[ij] = 0;
                }
            }
        } else {
            var rrd = R.getRealData(), rid = R.getImagData();
            for (j = 0, _j = 0, jj = 0; j < m; j++, _j += dc, jj = j + _j) {
                for (ij = jj + 1, eij = lr + _j; ij < eij; ij++) {
                    rrd[ij] = 0;
                    rid[ij] = 0;
                }
            }
            for (; j < n; j++, _j += dc, jj = j + _j) {
                for (ij = jj + 1, eij = lr + _j; ij < eij; ij++) {
                    rrd[ij] = 0;
                    rid[ij] = 0;
                }
            }
        }
        return R;
    };

    var getQ = function (QR) {
        var beta = QR[1];
        QR = QR[0];

        var m = QR.getSize(0), n = QR.getSize(1);
        var Q = Matrix.eye(m);
        var view = Q.getView(), dc = view.getStep(1);

        var j, _j;

        if (QR.isreal()) {
            var qcol = getRealColumnArray(Q);

            var qrd = QR.getData();
            for (j = n - 1, _j = dc * j; j >= 0; j--, _j -= dc) {
                var qrcol = qrd.subarray(_j, m + _j);
                update_real(qrcol, qcol, beta[j], j, j);
            }
        } else {
            Q.toComplex();
            var qcolr = getRealColumnArray(Q);
            var qcoli = getImagColumnArray(Q);

            var qrrd = QR.getRealData(), qrid = QR.getImagData();
            for (j = n - 1, _j = dc * j; j >= 0; j--, _j -= dc) {
                var qrcolr = qrrd.subarray(_j, m + _j);
                var qrcoli = qrid.subarray(_j, m + _j);
                update_complex(qrcolr, qrcoli, qcolr, qcoli, beta[j], j, j);
            }
        }

        return Q;
    };

    var getP = function (QR) {
        var piv = QR[2];
        var m = piv.length;
        var P = new Matrix([m, m]);
        var view = P.getView(), pd = P.getData();
        var dc = view.getStep(1);
        var n = m;
        var j, _j;
        for (j = 0, _j = 0; j < n; j++, _j += dc) {
            pd[piv[j] + _j] = 1;
        }
        return P;
    };

    var computeQR = function (A, pivoting) {

        var norm;
        var eps = 2.220446049250313e-16 || 1.19209289550781e-07;

        var QR = A.getCopy();
        var view = QR.getView();
        var m = view.getSize(0), n = view.getSize(1);
        var i, j, v;

        var Float = Tools.checkType(A.getDataType());
        var colTmp = new Float(m);
        var c = new Float(n);
        var piv = new Float(n);
        var beta = new Float(n), r, k;

        if (QR.isreal()) {

            var col = getRealColumnArray(QR);

            if (pivoting) {
                for (j = 0; j < n; j++) {
                    var colj = col[j];
                    for (v = 0, i = 0; i < m; i++) {
                        v += colj[i] * colj[i];
                    }
                    c[j] = v;
                    piv[j] = j;
                }
                norm = normFro(c, 0);
            }

            for (r = 0; r < n; r++) {

                if (pivoting) {
                    k = findMax(c, r);
                    if (normFro(c, r) <= norm * eps) {
                        return [QR, beta, piv, r];
                    } else if (r !== k) {
                        swapColumn(col, r, k, colTmp);
                        swap(c, r, k);
                        swap(piv, r, k);
                    }
                }

                beta[r] = house_real(col[r], r);
                update_real(col[r], col, beta[r], r, r + 1);

                if (pivoting) {
                    for (i = r + 1; i < n; i++) {
                        c[i] -= col[i][r] * col[i][r];
                    }
                }

            }

        } else {

            var colr = getRealColumnArray(QR);
            var coli = getImagColumnArray(QR);

            if (pivoting) {
                for (j = 0; j < n; j++) {
                    var coljr = colr[j], colji = coli[j];
                    for (v = 0, i = 0; i < m; i++) {
                        v += coljr[i] * coljr[i] + colji[i] * colji[i];
                    }
                    c[j] = v;
                    piv[j] = j;
                }
                norm = normFro(c, 0);
            }

            for (r = 0; r < n; r++) {

                if (pivoting) {
                    k = findMax(c, r);
                    if (normFro(c, r) <= norm * eps) {
                        return [QR, beta, piv, r + 1];
                    } else if (r !== k) {
                        swapColumn(colr, r, k, colTmp);
                        swapColumn(coli, r, k, colTmp);
                        swap(c, r, k);
                        swap(piv, r, k);
                    }
                }

                beta[r] = house_complex(colr[r], coli[r], r);
                update_complex(colr[r], coli[r], colr, coli, beta[r], r, r + 1);

                if (pivoting) {
                    for (i = r + 1; i < n; i++) {
                        c[i] -= colr[i][r] * colr[i][r] + coli[i][r] * coli[i][r];
                    }
                }

            }
        }
        return [QR, beta, piv, r];
    };

    var solveOverdeterminedQR = function (A, B) {
        var QR = computeQR(A, true);
        var beta = QR[1];
        var piv = QR[2];
        QR = QR[0];

        var m = A.getSize(0), n = A.getSize(1), n2 = B.getSize(1);
        var rank = Math.min(m, n);

        // Compute Q' * B
        B = B.getCopy();

        var j, X;

        if (QR.isreal() && B.isreal()) {

            var bcol = getRealColumnArray(B);
            var qrcol = getRealColumnArray(QR);
            for (j = 0; j < n; j++) {
                update_real(qrcol[j], bcol, beta[j], j, 0);
            }

            // Solve R * X = Q * B, backward-subsitution B is overwriting by X
            gaussianSubstitution(false, QR, B);

            // Copy B part of interest in X
            X = resizeRealMatrix(B, rank, n2);

        } else {

            if (QR.isreal()) {
                QR.toComplex();
            }
            if (B.isreal()) {
                B.toComplex();
            }

            var brcol = getRealColumnArray(B);
            var bicol = getImagColumnArray(B);

            var qrcolr = getRealColumnArray(QR);
            var qrcoli = getImagColumnArray(QR);

            for (j = 0; j < n; j++) {
                update_complex(qrcolr[j], qrcoli[j], brcol, bicol, beta[j], j, 0);
            }

            // Solve R * X = Q * B, backward-subsitution B is overwriting by X
            gaussianSubstitution(false, QR, B);

            // Copy B part of interest in X
            X = resizeComplexMatrix(B, rank, n2);

        }

        var ipiv = new Uint32Array(rank);
        var i, ei;
        for (i = 0, ei = piv.length; i < ei; i++) {
            ipiv[piv[i]] = i;
        }

        return X.select([ipiv]);

    };

    var solveUnderdeterminedQR = function (A, B) {
        var QR = computeQR(A.ctranspose(), true);
        var beta = QR[1];
        var piv = QR[2];
        QR = QR[0];
        var j;

        var m = QR.getSize(0), n = QR.getSize(1), o = B.getSize(1);
        var rank = Math.min(m, n);
        var ipiv = new Uint32Array(rank);
        for (var i = 0, ei = piv.length; i < ei; i++) {
            ipiv[piv[i]] = i;
        }
        B = B.select([ipiv]);

        var QtX = gaussianSubstitution(true, QR.ctranspose(), B);

        if (QR.isreal() && B.isreal()) {

            QtX = resizeRealMatrix(QtX, m, o);
            var Xcol = getRealColumnArray(QtX);

            var qrcol = getRealColumnArray(QR);
            for (j = n - 1; j >= 0; j--) {
                update_real(qrcol[j], Xcol, beta[j], j, 0);
            }

        } else {

            if (QR.isreal()) {
                QR.toComplex();
            }
            if (QtX.isreal()) {
                QtX.toComplex();
            }

            QtX = resizeComplexMatrix(QtX, m, o);
            var Xcolr = getRealColumnArray(QtX);
            var Xcoli = getImagColumnArray(QtX);

            var qrcolr = getRealColumnArray(QR);
            var qrcoli = getImagColumnArray(QR);
            for (j = n - 1; j >= 0; j--) {
                update_complex(qrcolr[j], qrcoli[j], Xcolr, Xcoli, beta[j], j, 0);
            }

        }

        return QtX;

    };

    var solveQR = function (A, B) {
        if (A.getSize(0) < A.getSize(1)) {
            return solveUnderdeterminedQR(A, B);
        }
        return solveOverdeterminedQR(A, B);
    };


    //////////////////////////////////////////////////////////////////
    //                      MATRIX FUNCTIONS                        //
    //////////////////////////////////////////////////////////////////


    /** Mtimes operator make a matrix multiplication,
     *
     * __Also see:__
     * {@link Matrix#minus},
     * {@link Matrix#plus},
     * {@link Matrix#rdivide},
     * {@link Matrix#ldivide}.
     *
     * @param {Number|Matrix} rightOp
     *
     * @return {Matrix}
     * @matlike
     */
    Matrix_prototype.mtimes = function (B) {
        // Check if Matrix
        B = Matrix.toMatrix(B);
        if (!this.ismatrix() || !B.ismatrix()) {
            throw new Error('Matrix.mtimes: mtimes is undefined for ND array.');
        }

        var M = this.getSize(0);
        var N = this.getSize(1);
        var K = B.getSize(1);

        // Check if size are compatible
        if (M !== B.getSize(0)) {
            throw new Error('Matrix.mtimes: Matrix sizes must match.');
        }

        var complex =  (this.isreal() & B.isreal()) ? false : true;
        var Type = Tools.checkType(this.getDataType());
        var X = new Matrix([M, K], Type, complex);

        if (this.isreal()) {
            if (B.isreal()) {
                mtimes_real_real(this.getData(),
                                 getRealColumnArray(B),
                                 X.getData(),
                                 M, N, K);
            } else {
                mtimes_real_cplx(this.getData(),
                                 getRealColumnArray(B), getImagColumnArray(B),
                                 X.getRealData(), X.getImagData(),
                                 M, N, K);
            }
        } else {
            if (B.isreal()) {
                mtimes_cplx_real(this.getRealData(), this.getImagData(),
                                 getRealColumnArray(B),
                                 X.getRealData(), X.getImagData(),
                                 M, N, K);
            } else {
                mtimes_cplx_cplx(this.getRealData(), this.getImagData(),
                                 getRealColumnArray(B), getImagColumnArray(B),
                                 X.getRealData(), X.getImagData(),
                                 M, N, K);
            }
        }
        return X;
    };

    Matrix.mtimes = function (A, B) {
        return Matrix.toMatrix(A).mtimes(B);
    };

    Matrix_prototype["*"] = Matrix_prototype.mtimes;

    /** Compute the cholesky decomposition.
     *
     * @param {String} [upper='upper']
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.chol = function (lower) {
        if (!this.ismatrix()) {
            throw new Error("Matrix.chol: Input must be a matrix.");
        }
        if (!this.issquare()) {
            throw new Error("Matrix.chol: Matrix must be square.");
        }

        if (lower === 'lower') {
            lower = true;
        } else if (lower === 'upper' || lower === undefined) {
            lower = false;
        } else {
            throw new Error("Matrix.chol: Invalid parameters.");
        }

        var A = this.getCopy();

        if (A.isreal()) {
            cholesky_real(getRealColumnArray(A), A.getSize(1));
        } else {
            cholesky_cplx(getRealColumnArray(A), getImagColumnArray(A), A.getSize(1));
        }
        return lower ? A.ctranspose(A) : A;

    };

    /** Compute the Matrix inverse.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.inv = function () {
        return this.mldivide(Matrix.eye(this.getSize()));
    };

    /** Compute the Matrix determinant.
     *
     * @return {Matrix}
     *
     * @todo Check the use (and utility) of pivsign !!
     * @matlike
     */
    Matrix_prototype.det = function () {
        if (!this.issquare()) {
            throw new Error("Matrix.det: Matrix must be square.");
        }
        var paramsLU = computeLU(this);
        var LU = paramsLU.LU;
        var y, yn, dy;
        var view = LU.getView();
        var N = view.getSize(0);

        if (this.isreal()) {
            var d = paramsLU.pivsign;
            var lud = LU.getData();
            for (y = 0, yn = N * N, dy = N + 1; y < yn; y += dy) {
                d *= lud[y];
            }
            return new Matrix([1, 1], [d]);
        }

        var lurd = LU.getRealData();
        var luid = LU.getImagData();
        var dr = paramsLU.pivsign, di = 0;
        for (y = 0, yn = N * N, dy = N + 1; y < yn; y += dy) {
            dr = dr * lurd[y] - di * luid[y];
            di = dr * luid[y] + di * lurd[y];
        }


        return new Matrix([1, 1], [dr, di], true);
    };

    /** Compute the Matrix rank.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.rank = function () {
        var QR = computeQR(this, true);
        return QR[3];
    };

    /** Operator lu.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.lu = function () {
        return getLU(computeLU(this), false);
    };

    /** Operator lu with permutations.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.lup = function () {
        return getLU(computeLU(this), true);
    };

    /** Operator qr with permutations.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.qrp = function () {
        var QR = computeQR(this, true);
        return [getQ(QR), getR(QR), getP(QR)];
    };

    /** Operator qr.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.qr = function () {
        var QR = computeQR(this, false);
        return [getQ(QR), getR(QR)];
    };

    /** Operator mldivide.
     *
     * @param {Number|Matrix} rightOp
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.mldivide = function (B) {
        if (!this.ismatrix() || !B.ismatrix()) {
            throw new Error("1 Matrix.mldivide: Both arguments must be Matrix.");
        }
        if (B.getSize(0) !== this.getSize(0)) {
            throw new Error("2 Matrix.mldivide: Row dimensions must agree.");
        }
        return solveQR(this, B.getCopy());
    };

    /** Operator mrdivide.
     *
     * @param {Number|Matrix} rightOp
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.mrdivide = function (B) {

        if (!this.ismatrix() || !B.ismatrix()) {
            throw new Error("Matrix.mrdivide: Both arguments must be Matrix.");
        }
        if (B.getSize(0) !== this.getSize(0)) {
            throw new Error("Matrix.mrdivide: Row dimensions must agree.");
        }
        return solveQR(B.ctranspose(), this.ctranspose()).ctranspose();
    };

    /** Compute the bidiagonal decomposition.
     *
     * @return {Matrix}
     *
     * @matlike
     */
    Matrix_prototype.bidiag = function () {
        var UBV = computehouseBidiagonalisation(this.getCopy());
        return getUBV(UBV);
    };


    /** Computes an SVD decomposition on a given Matrix.,
     *
     * @return {Matrix[]}
     *  Array containing `U`, `S` and `V` Matrix.
     *
     *     var A = Matrix.rand(300);
     *     Tools.tic();
     *     var USV = A.svd(); var U = USV[0], S = USV[1], V = USV[2];
     *     var n = U.mtimes(S).mtimes(V.transpose()).minus(A).norm();
     *     console.log("time:", t[i] = Tools.toc(), "norm:", n);
     *
     * @author
     *  This code was imported from the [numericjs library][1]
     *  and adapted to work with Matrix class.
     *
     *  We report here the comment found in the code:
     *  _Shanti Rao sent me this routine by private email. I had to modify it
     *  slightly to work on Arrays instead of using a Matrix object.
     *  It is apparently translated [from here][2]_
     *
     *  [1]: http://www.numericjs.com/
     *  [2]: http://stitchpanorama.sourceforge.net/Python/svd.py
     *
     * @matlike
     */
    Matrix_prototype.svd = function () {

        var temp;
        // Compute the thin SVD from G. H. Golub and C. Reinsch, Numer. Math. 14, 403-420 (1970)
        var prec = Math.pow(2, -52); // assumes double prec
        var tolerance = 1.e-64 / prec;
        var itmax = 50;
        var c = 0, i = 0, j = 0, k = 0, l = 0;

        var u = this.toArray();
        var m = u.length;

        var n = u[0].length;

        if (m < n) {
            throw "Matrix.svd: Need more rows than columns";
        }

        var e = new Array(n);
        var q = new Array(n);
        for (i = 0; i < n; i++) {
            e[i] = 0;
            q[i] = 0;
        }
        var v = Matrix.zeros(n).toArray();

        var pythag = function (a, b) {
            a = Math.abs(a);
            b = Math.abs(b);
            if (a > b) {
                return a * Math.sqrt(1.0 + (b * b / a / a));
            } else if (b === 0.0) {
                return a;
            }
            return b * Math.sqrt(1.0 + (a * a / b / b));
        };

        // Householder's reduction to bidiagonal form

        var f = 0, g = 0, h = 0, x = 0, y = 0, z = 0, s = 0;
        for (i = 0; i < n; i++) {
            e[i] = g;
            s = 0;
            l = i + 1;
            for (j = i; j < m; j++) {
                s += (u[j][i] * u[j][i]);
            }
            if (s <= tolerance) {
                g = 0;
            } else {
                f = u[i][i];

                g = Math.sqrt(s);

                if (f >= 0) {
                    g = -g;
                }

                h = f * g - s;

                u[i][i] = f - g;

                for (j = l; j < n; j++) {
                    s = 0;
                    for (k = i; k < m; k++) {
                        s += u[k][i] * u[k][j];
                    }
                    f = s / h;
                    for (k = i; k < m; k++) {
                        u[k][j] += f * u[k][i];
                    }
                }
            }

            q[i] = g;
            s = 0;

            for (j = l; j < n; j++) {
                s = s + u[i][j] * u[i][j];
            }

            if (s <= tolerance) {
                g = 0;
            } else {
                f = u[i][i + 1];
                g = Math.sqrt(s);
                if (f >= 0) {
                    g = -g;
                }

                h = f * g - s;
                u[i][i + 1] = f - g;
                for (j = l; j < n; j++) {
                    e[j] = u[i][j] / h;
                }
                for (j = l; j < m; j++) {
                    s = 0;
                    for (k = l; k < n; k++) {
                        s += (u[j][k] * u[i][k]);
                    }
                    for (k = l; k < n; k++) {
                        u[j][k] += s * e[k];
                    }
                }
            }
            y = Math.abs(q[i]) + Math.abs(e[i]);
            if (y > x) {
                x = y;
            }
        }

        // accumulation of right hand gtransformations

        for (i = n - 1; i != -1; i += -1) {
            if (g !== 0.0) {
                h = g * u[i][i + 1];
                for (j = l; j < n; j++) {
                    v[j][i] = u[i][j] / h;
                }
                for (j = l; j < n; j++) {
                    s = 0;
                    for (k = l; k < n; k++) {
                        s += u[i][k] * v[k][j];
                    }
                    for (k = l; k < n; k++) {
                        v[k][j] += (s * v[k][i]);
                    }
                }
            }
            for (j = l; j < n; j++) {
                v[i][j] = 0;
                v[j][i] = 0;
            }
            v[i][i] = 1;
            g = e[i];
            l = i;
        }

        // Accumulation of left hand transformations


        for (i = n - 1; i != -1; i += -1) {
            l = i + 1;
            g = q[i];
            for (j = l; j < n; j++) {
                u[i][j] = 0;
            }
            if (g !== 0) {
                h = u[i][i] * g;
                for (j = l; j < n; j++) {
                    s = 0;
                    for (k = l; k < m; k++) {
                        s += u[k][i] * u[k][j];
                    }
                    f = s / h;
                    for (k = i; k < m; k++) {
                        u[k][j] += f * u[k][i];
                    }

                }
                for (j = i; j < m; j++) {
                    u[j][i] = u[j][i] / g;
                }
            } else {
                for (j = i; j < m; j++) {
                    u[j][i] = 0;
                }
            }
            u[i][i] += 1;
        }


        // diagonalization of the bidiagonal form
        prec = prec * x;
        var iteration;
        for (k = n - 1; k != -1; k += -1) {
            for (iteration = 0; iteration < itmax; iteration++) {
                // test f splitting
                var test_convergence = false;
                for (l = k; l != -1; l += -1) {
                    if (Math.abs(e[l]) <= prec) {
                        test_convergence = true;
                        break;
                    }
                    if (Math.abs(q[l - 1]) <= prec) {
                        break;
                    }
                }
                if (!test_convergence) {
                    // cancellation of e[l] if l>0
                    c = 0;
                    s = 1;
                    var l1 = l - 1;
                    for (i = l; i < k + 1; i++) {
                        f = s * e[i];
                        e[i] = c * e[i];
                        if (Math.abs(f) <= prec) {
                            break;
                        }
                        g = q[i];
                        h = pythag(f, g);
                        q[i] = h;
                        c = g / h;
                        s = -f / h;
                        for (j = 0; j < m; j++) {
                            y = u[j][l1];
                            z = u[j][i];
                            u[j][l1] =  y * c + (z * s);
                            u[j][i] = -y * s + (z * c);
                        }
                    }
                }
                // test f convergence
                z = q[k];
                if (l === k) {
                    // convergence
                    if (z < 0) {
                        //q[k] is made non-negative
                        q[k] = -z;
                        for (j = 0; j < n; j++) {
                            v[j][k] = -v[j][k];
                        }
                    }
                    break;
                    //break out of iteration loop and move on to next k value
                }
                if (iteration >= itmax - 1) {
                    throw 'Error: no convergence.';
                }
                // shift from bottom 2x2 minor
                x = q[l];
                y = q[k - 1];
                g = e[k - 1];
                h = e[k];
                f = ((y - z) * (y + z) + (g - h) * (g + h)) / (2 * h * y);
                g = pythag(f, 1.0);
                if (f < 0.0) {
                    f = ((x - z) * (x + z) + h * (y / (f - g) - h)) / x;
                } else {
                    f = ((x - z) * (x + z) + h * (y / (f + g) - h)) / x;
                }
                // next QR transformation
                c = 1;
                s = 1;
                for (i = l + 1; i < k + 1; i++) {
                    g = e[i];
                    y = q[i];
                    h = s * g;
                    g = c * g;
                    z = pythag(f, h);
                    e[i - 1] = z;
                    c = f / z;
                    s = h / z;
                    f = x * c + g * s;
                    g = -x * s + g * c;
                    h = y * s;
                    y = y * c;
                    for (j = 0; j < n; j++) {
                        x = v[j][i - 1];
                        z = v[j][i];
                        v[j][i - 1] = x * c + z * s;
                        v[j][i] = -x * s + z * c;
                    }
                    z = pythag(f, h);
                    q[i - 1] = z;
                    c = f / z;
                    s = h / z;
                    f = c * g + s * y;
                    x = -s * g + c * y;
                    for (j = 0; j < m; j++) {
                        y = u[j][i - 1];
                        z = u[j][i];
                        u[j][i - 1] = y * c + z * s;
                        u[j][i] = -y * s + z * c;
                    }
                }
                e[l] = 0;
                e[k] = f;
                q[k] = x;
            }
        }

        for (i = 0; i < q.length; i++) {
            if (q[i] < prec) {
                q[i] = 0;
            }
        }

        // sort eigenvalues
        for (i = 0; i < n; i++) {
            for (j = i - 1; j >= 0; j--) {
                if (q[j] < q[i]) {
                    c = q[j];
                    q[j] = q[i];
                    q[i] = c;
                    for (k = 0; k < u.length; k++) {
                        temp = u[k][i];
                        u[k][i] = u[k][j];
                        u[k][j] = temp;
                    }
                    for (k = 0; k < v.length; k++) {
                        temp = v[k][i];
                        v[k][i] = v[k][j];
                        v[k][j] = temp;
                    }
                    i = j;
                }
            }
        }

        return [Matrix.fromArray(u).transpose(),
                Matrix.diag(Matrix.toMatrix(q)),
                Matrix.fromArray(v).transpose()];
    };


})(Matrix, Matrix.prototype);

/*
(function () {
    "use strict";
    var getColumnArray = function  (ad, M, N) {
        var j, col;
        if (ad instanceof Array) {
            for (j = 0, col = []; j < N; j++) {
                col[j] = ad.slice(j * M, (j + 1) * M);
            }
        } else {
            for (j = 0, col = []; j < N; j++) {
                col[j] = ad.subarray(j * M, (j + 1) * M);
            }
        }
        return col;
    };

    var  getRow = function (ad, M, N, i, out) {
        out = out || new Float64Array(N);
        for (var j = 0, ij = i + j; j < N; j++, ij += M) {
            out[j] = ad[ij];
        }
        return out;
    };

    var rand = function (M, N) {
        var tab = new Float32Array(M * N);
        for (var i = 0; i < M * N; i++) {
            tab[i] = Math.random();
        }
        return getColumnArray(tab, M, N);
    };

    var dotproduct_real = function (a, b, N) {
        for (var i = 0, sum = 0.0; i < N; ++i) {
            sum += a[i] * b[i];
        }
        return sum;
    };

    var dotproduct_cplx = function (ar, ai, br, bi, N) {
        for (var i = 0, sumr = 0.0, sumi = 0.0; i < N; ++i) {
            var a = ar[i], b = ai[i], c = br[i], d = bi[i];
            sumr += a * c - b * d;
            sumi += a * d + b * c;
        }
        return [sumr, sumi];
    };

    var dotproduct_real_cplx = function (ar, br, bi, N) {
        for (var i = 0, sumr = 0.0, sumi = 0.0; i < N; ++i) {
            var a = ar[i];
            sumr += a * br[i];
            sumi += a * bi[i];
        }
        return [sumr, sumi];
    };

    var mtimes_real = function (a, b, c, M, N, K) {
        var i, j, row = new Float64Array(N);
        b = getColumnArray(b, N, K);
        c = getColumnArray(c, M, K);
        for (j = 0; j < M; j++) {
            row = getRow(a, M, N, j, row);
            for (i = 0; i < K; i++) {
                c[i][j] = dotproduct_real(row, b[i], N);
            }
        }
    };

    var mtimes_cplx = function (ar, ai, br, bi, cr, ci, M, N, K) {
        var i, j, dotp;
        var rowr = new Float64Array(N), rowi = new Float64Array(N);
        br = getColumnArray(br, N, K);
        bi = getColumnArray(bi, N, K);
        cr = getColumnArray(cr, M, K);
        ci = getColumnArray(ci, M, K);
        for (j = 0; j < M; j++) {
            rowr = getRow(ar, M, N, j, rowr);
            rowi = getRow(ai, M, N, j, rowi);
            for (i = 0; i < K; i++) {
                dotp = dotproduct_cplx(rowr, rowi, br[i], bi[i], N);
                cr[i][j] = dotp[0];
                ci[i][j] = dotp[1];
            }
        }
    };

    var mtimes_real_cplx = function (a, br, bi, cr, ci, M, N, K) {
        var i, j, row = new Float64Array(N), dotp;
        br = getColumnArray(br, N, K);
        bi = getColumnArray(bi, N, K);
        cr = getColumnArray(cr, M, K);
        ci = getColumnArray(ci, M, K);
        for (j = 0; j < M; j++) {
            row = getRow(a, M, N, j, row);
            for (i = 0; i < K; i++) {
                dotp = dotproduct_real_cplx(row, br[i], bi[i], N);
                cr[i][j] = dotp[0];
                ci[i][j] = dotp[1];
            }
        }
    };

    var mtimes_cplx_real = function (ar, ai, b, cr, ci, M, N, K) {
        var i, j, dotp;
        var rowr = new Float64Array(N), rowi = new Float64Array(N);
        b = getColumnArray(b, N, K);
        cr = getColumnArray(cr, M, K);
        ci = getColumnArray(ci, M, K);
        for (j = 0; j < M; j++) {
            rowr = getRow(ar, M, N, j, rowr);
            rowi = getRow(ai, M, N, j, rowi);
            for (i = 0; i < K; i++) {
                dotp = dotproduct_real_cplx(b[i], rowr, rowi, N);
                cr[i][j] = dotp[0];
                ci[i][j] = dotp[1];
            }
        }
    };

    var dotproduct_check = function () {
        var a = [1, 2, 3, 4], b = [5, 4, 3, 2];
        var t1 = dotproduct_real(a, b, 4);
        var t2 = dotproduct_cplx(a, b, b, a, 4);
        var t3 = dotproduct_real_cplx(a, b, b, 4);
        if (t1 !== 30 || t2[0] !== 0 || t2[1] !== 84 || t3[0] !== 30 || t3[1] !== 30) {
            throw new Error("Dot product change!");
        }
    };

    if (0) {
        Matrix.mtimes = function (A, B) {
            var M = A.getSize(0), N = A.getSize(1), K = B.getSize(1);
            var C = Matrix.zeros(M, K);
            var a, ar, ai, b, br, bi, c, cr, ci;
            if (A.isreal()) {
                a = A.getData();
                if (B.isreal()) {
                    b = B.getData();
                    c = C.getData();
                    mtimes_real(a, b, c, M, N, K);
                } else {
                    br = B.getRealData();
                    bi = B.getImagData();
                    C.toComplex();
                    cr = C.getRealData();
                    ci = C.getImagData();
                    mtimes_real_cplx(a, br, bi, cr, ci, M, N, K);
                }
            } else {
                ar = A.getRealData();
                ai = A.getImagData();
                C.toComplex();
                cr = C.getRealData();
                ci = C.getImagData();
                if (B.isreal()) {
                    b = B.getData();
                    mtimes_cplx_real(ar, ai, b, cr, ci, M, N, K);
                } else {
                    br = B.getRealData();
                    bi = B.getImagData();
                    mtimes_cplx(ar, ai, br, bi, cr, ci, M, N, K);
                }
            }
            return C;
        };
        Matrix_prototype.mtimes = function (B) {
            return Matrix.mtimes(this, B);
        };
    }

    var mtimes_check = function () {
        var c, cr, ci, r, rr, ri, t, tr, ti;
        var a = new Int8Array([6, 6, 1, 7, -8, 2, 0, -2, 1]);
        var b = new Int8Array([-6, 2, 3, -9, -5, 8, 2, -1, 4]);

        c = new Int8Array(9);
        r = [-22, -58, 1, -89, -30, -11, 5, 12, 4];
        mtimes_real(a, b, c, 3, 3, 3);
        if (!Tools.checkArrayEquals(c, r)) {
            throw new Error("Error mtimes real.");
        }

        cr = new Int16Array(9);
        ci = new Int16Array(9);
        rr = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        ri = [-44, -116, 2, -178, -60, -22, 10, 24, 8];
        mtimes_cplx(a, a, b, b, cr, ci, 3, 3, 3);
        if (!Tools.checkArrayEquals(cr, rr) || !Tools.checkArrayEquals(ci, ri)) {
            throw new Error("Error mtimes complex.");
        }

        cr = new Int16Array(9);
        ci = new Int16Array(9);
        mtimes_real_cplx(a, b, b, cr, ci, 3, 3, 3);
        if (!Tools.checkArrayEquals(cr, r) || !Tools.checkArrayEquals(ci, r)) {
            throw new Error("Error mtimes real/complex.");
        }

        cr = new Int16Array(9);
        ci = new Int16Array(9);
        mtimes_cplx_real(a, b, b, cr, ci, 3, 3, 3);
        ri = [24, -25, 10, 115, -1, -35, 5, 5, 14];
        if (!Tools.checkArrayEquals(cr, r) || !Tools.checkArrayEquals(ci, ri)) {
            throw new Error("Error mtimes complex/real.");
        }
    };

    Matrix._benchmarkMtimes = function (M, N, K) {
        M = M || 1000;
        N = N || M;
        K = K || M;

        var Ar = Matrix.rand(M, N), Br = Matrix.rand(N, K);
        var Ai = Matrix.rand(M, N), Bi = Matrix.rand(N, K);

        var r1, r2, rr1, ri1, rr2, ri2;
        Tools.tic();
        r1 = Matrix.mtimes(Ar, Br).getData();
        console.log("NEW mtimes REAL/REAL:", Tools.toc());
        // Tools.tic();
        // r2 = Ar.mtimes(Br).getData();
        // console.log("OLD mtimes REAL/REAL:", Tools.toc());
        // if (!Tools.checkArrayEquals(r1, r2)) {
        // throw new Error("Error mtimes complex.");
        // }

        var Ac = Matrix.complex(Ar, Ai), Bc = Matrix.complex(Br, Bi);
        Tools.tic();
        r1 = Matrix.mtimes(Ac, Bc);
        console.log("NEW mtimes CPLX/CPLX:", Tools.toc());

         // rr1 = r1.getRealData();
         // ri1 = r1.getImagData();
         // Tools.tic();
         // r2 = Ac.mtimes(Bc);
         // console.log("OLD mtimes CPLX/CPLX:", Tools.toc());
         // rr2 = r2.getRealData();
         // ri2 = r2.getImagData();
         // if (!Tools.checkArrayEquals(rr1, rr2) || !Tools.checkArrayEquals(rr1, rr2)) {
         // throw new Error("Error mtimes complex.");
         // }

    };

    Matrix._testsMtimes = function () {
        dotproduct_check();
        mtimes_check();_
    };

})();
*/

