Ext.data.JsonP.getting_started({"guide":"<h1 id='getting_started-section-build-a-matrix'>Build a Matrix</h1>\n<div class='toc'>\n<p><strong>Contents</strong></p>\n<ol>\n<li><a href='#!/guide/getting_started-section-the-matrix-constructor'>The matrix constructor</a></li>\n<li><a href='#!/guide/getting_started-section-the-built-in-constructors'>The built-in constructors</a></li>\n<li><a href='#!/guide/getting_started-section-extract-values'>Extract values</a></li>\n<li><a href='#!/guide/getting_started-section-modify-values'>Modify values</a></li>\n<li><a href='#!/guide/getting_started-section-arithmetic-operators'>Arithmetic operators</a></li>\n<li><a href='#!/guide/getting_started-section-boolean-operators'>Boolean operators</a></li>\n<li><a href='#!/guide/getting_started-section-display-a-matrix'>Display a Matrix</a></li>\n<li><a href='#!/guide/getting_started-section-from-%2F-to-javascript-array-like'>From / to javascript Array-like</a></li>\n<li><a href='#!/guide/getting_started-section-from-%2F-to-text'>From / to text</a></li>\n<li><a href='#!/guide/getting_started-section-read-from-unknown-data'>Read from unknown data</a></li>\n</ol>\n</div>\n\n<h2 id='getting_started-section-the-matrix-constructor'>The matrix constructor</h2>\n\n<p>The most obvious way to build a Matrix is to use the constructor</p>\n\n<pre class='inline-example '><code>var A = new Matrix([2, 3, 4]);\n</code></pre>\n\n<p>The created Matrix will have a Float64Array of size <code>2x3x4</code> fill with zeros as underlying data.\nYou can do the same and display this Matrix in the your developer console using th following code</p>\n\n<pre class='inline-example '><code>var A = new Matrix([2, 3, 4]).display(\"My matrix\");\n</code></pre>\n\n<p>This allow you to visualize your data in a kind of pretty print format. Using the Matrix constructor is one way among others to created Matrix. In the following some of the other ways are introduced.</p>\n\n<h2 id='getting_started-section-the-built-in-constructors'>The built-in constructors</h2>\n\n<p>Generally, it is more convenient to use some automatic constructors.</p>\n\n<pre class='inline-example '><code>// Create a Matrix of size 3x3 filled with zeros\nvar A = <a href=\"#!/api/Matrix-method-zeros\" rel=\"Matrix-method-zeros\" class=\"docClass\">Matrix.zeros</a>(3);\nA.display(\"Filled with zeros\"); \n// Create a Matrix of size 5x2 filled with ones\nvar B = <a href=\"#!/api/Matrix-method-ones\" rel=\"Matrix-method-ones\" class=\"docClass\">Matrix.ones</a>(5, 2)\nA.display(\"Filled with ones\"); \n</code></pre>\n\n<p>There is many constructors that you can use.</p>\n\n<h1 id='getting_started-section-matrix-indexing'>Matrix indexing</h1>\n\n<p>Matrix indexing is one the powerfull features of the library. It allows you to acces to some values inside your data either to extract them or to modify them. A function corresponds to each of these cases :</p>\n\n<ul>\n<li><code><a href=\"#!/api/Matrix-method-get\" rel=\"Matrix-method-get\" class=\"docClass\">Matrix.get</a></code> to extract some values ;</li>\n<li><code><a href=\"#!/api/Matrix-method-set\" rel=\"Matrix-method-set\" class=\"docClass\">Matrix.set</a></code> to modify some values.</li>\n</ul>\n\n\n<p>In the next sections, we will describe how these functions work. Let's first create a random Matrix.</p>\n\n<pre class='inline-example '><code>// Create a Matrix of size 5x5 filled with random integer values ranging between 0 and 9\nvar A = <a href=\"#!/api/Matrix-method-randi\" rel=\"Matrix-method-randi\" class=\"docClass\">Matrix.randi</a>([0, 9], 5, 5).display();\n</code></pre>\n\n<p>We will use this Matrix in the following examples. Note that to keep this tutorial simple, we use only a 2D-Matrix. But all the things that are presented here can be extended to ND-Matrix in a straightforward manner.</p>\n\n<h2 id='getting_started-section-extract-values'>Extract values</h2>\n\n<p>The method <code>get</code> allows to extract values from the Matrix. Remember that values range from 0 to N-1.</p>\n\n<pre class='inline-example '><code>// Extract the value of coordinates [2, 2]\nvar v = A.get(2, 2).display(\"My value\");\n// Extract the second line\nvar l = A.get(2, []).display(\"My line\"); // Equivalent to: a.get(2)\n// Extract the second column\nvar c = A.get([], 2).display(\"My column\");\n</code></pre>\n\n<p>Using an empty Array <code>[]</code> as parameter means to take all values. Noew, it is worth noting that with negative indices, you can access to values from the end of the dimension.</p>\n\n<pre class='inline-example '><code>// Extract the bottom-right value (in this example the value with coordinates [4, 4])\nvar v = A.get(-1, -1).display(\"Last value\");\n// Extract the penultimate column value\nvar v = A.get([], -2).display(\"Penultimate column\");\n</code></pre>\n\n<p>The previsously described syntax allows to select one value along a given dimension. To extract a set of value for a vector, or a set of vectors for a matrix and so on, three possibilities are available:</p>\n\n<ul>\n<li>a colon operator ;</li>\n<li>a indice list ;</li>\n<li>a boolean list ;</li>\n<li>A boolean mask.</li>\n</ul>\n\n\n<h3 id='getting_started-section-colon-operator'>Colon operator</h3>\n\n<p>The colon operator described a set of value using a starting index, an ending index and an optionnal step value. These values are providing through a JS Array under the form:</p>\n\n<ul>\n<li><code>[start, end]</code> ;</li>\n<li><code>[start, step, end]</code>.</li>\n</ul>\n\n\n<p>As before, the values for <code>start</code> and <code>end</code> parameters can be negatives. In this case, they refer to indices from the end of the dimension.\nThe parameter <code>step</code> can be omitted, in this case it is automatically set to 1 uf <code>end &gt; start</code> or -1 if <code>start &gt; end</code>. If provided, this paramater must be consistent with <code>start</code> and <code>end</code> values, i.e. positive if <code>end &gt; start</code> or negative if <code>start &gt; end</code>.</p>\n\n<pre class='inline-example '><code>// Remove the first and last rows\nvar m = A.get([1, -2], []).display(\"Same than A but without first and last rows\");\n// The same but without the columns on even coordinates\nvar m = A.get([1, -2], [0, 2, -1]).display(\"Only the odd columns of A\");\n</code></pre>\n\n<h3 id='getting_started-section-indice-list'>Indice list</h3>\n\n<p>Let's try something a bit more complicated. What if we want to reorganize the order of rows or columns of the Matrix, or even duplicate some of them ? The function <code>get</code> permits this operation as well but with a different syntax for the arguments.\nTo select the coordinates of interest, we must give a list of indices to the <code>get</code> function. There is three ways to provide this list:</p>\n\n<ul>\n<li>with the 2D JS Array like <code>[[0, 1, 2, 3]]</code> ;</li>\n<li>using an integer typed array like <code>Int32Array</code> or one other ;</li>\n<li>with a <code>Matrix</code> with underlying integer data.</li>\n</ul>\n\n\n<p>For each one of these possibilities, the indices values may be poitive and nagative and must be in a valid range according to the considered dimension. These are the only constraints, otherwise, the values may be duplicated and arranged in any way.</p>\n\n<pre class='inline-example '><code>// Invert the first and last rows\nvar m = A.get([[4, 1, 2, 3, 0]], []).display(\"Same than A but with first and last rows inverted\");\n</code></pre>\n\n<h3 id='getting_started-section-boolean-list'>Boolean list</h3>\n\n<p>Another convenient way to select values on a given dimension is to use a boolean list. This can be done using either:</p>\n\n<ul>\n<li>a JS Array filled with boolean, like <code>[false, true, ... , false, true]</code> ;</li>\n<li><p>a <code>logical</code> <code>Matrix</code>.</p>\n\n<p>  @example\n  // Get only the first and last rows\n  var m = A.get([[true, false, false, false, true]], []).display(\"First and last rows\");</p></li>\n</ul>\n\n\n<h3 id='getting_started-section-boolean-mask'>Boolean mask</h3>\n\n<p>With the previsou example, we saw how to extract values using a mask along one dimension. This allow only for rectangular pattern. It can be very usefull to use a multidimensional mask to extract arbitrarily organized values. For instance, if we want to extract values greater than 3 in our <code>Matrix</code>, we can do that with the next piece of code:</p>\n\n<pre class='inline-example '><code>// Create a logical Matrix indicating wich values are greater than 3\nvar mask = A[\"&gt;\"](3).display(\"Boolean mask\");\n// Extract corresponding values\nvar v = A.get(mask).display(\"List of values greater than 3\");\n</code></pre>\n\n<h2 id='getting_started-section-modify-values'>Modify values</h2>\n\n<p>Now, what if we want to modify only the selected values ? In the last example, we extract values greater than 3, The following code shows how to replace these values by 3:</p>\n\n<pre class='inline-example '><code>// Set the values selected by mask to 3\nvar B = <a href=\"#!/api/Matrix-method-set\" rel=\"Matrix-method-set\" class=\"docClass\">Matrix.set</a>(A, mask, 3).display(\"Matrix with values clipped to 3\");\n</code></pre>\n\n<p>The next example shows how to multiply by two the selected values:</p>\n\n<pre class='inline-example '><code>// selected values are multiplied by 2\nvar values = A.get(mask)[\".*\"](2);\n// Set the values selected by mask to 3\nvar B = <a href=\"#!/api/Matrix-method-set\" rel=\"Matrix-method-set\" class=\"docClass\">Matrix.set</a>(A, mask, values).display(\"Matrix with some values multiplied by two\");\n</code></pre>\n\n<p>Note that the function <code><a href=\"#!/api/Matrix-method-set\" rel=\"Matrix-method-set\" class=\"docClass\">Matrix.set</a></code> creates a copy of <code>A</code>, which therefore is not affected by the operation. Depending on the situation, it might be desirable to avoid creating a copy. To act in place, the method set can be used. We can now rewrite the previous example:</p>\n\n<pre class='inline-example '><code>// selected values are multiplied by 2\nvar values = A.get(mask)[\".*\"](2);\n// Set the values selected by mask to 3\nA.set(mask, values).display(\"Matrix with some values multiplied by two\");\n</code></pre>\n\n<p>Now, <code>A</code> is modified directly. In a general manner and when it makes sense, methods act in place while function like <code>Matrix.&lt;function&gt;</code> work on a copy.</p>\n\n<h1 id='getting_started-section-matrix-operators'>Matrix operators</h1>\n\n<p>Now, we know how to manipulate <code>Matrix</code> values. But how to perform basics operations ?</p>\n\n<h2 id='getting_started-section-arithmetic-operators'>Arithmetic operators</h2>\n\n<p>Let's talk about the <code>+</code> which performs an addition on 2 Matrix. There is 2 ways to use it:</p>\n\n<ul>\n<li><code>var C = <a href=\"#!/api/Matrix-method-plus\" rel=\"Matrix-method-plus\" class=\"docClass\">Matrix.plus</a>(A, B);</code></li>\n<li><code>var C = A['+'](B);</code></li>\n</ul>\n\n\n<p>For the operator <code>+=</code>, there is similar syntaxe:\n+ <code>A.plus(A, B);</code>\n+ <code>A['+='](B);</code></p>\n\n<p>Note that as explained before, the using the method <code>plus</code> allows to act in place while using the syntax <code><a href=\"#!/api/Matrix-method-plus\" rel=\"Matrix-method-plus\" class=\"docClass\">Matrix.plus</a></code> perform the operation on a copy.</p>\n\n<p>Here is a list of basic operators and their notations</p>\n\n<ul>\n<li>addition: <code><a href=\"#!/api/Matrix-method-plus\" rel=\"Matrix-method-plus\" class=\"docClass\">Matrix.plus</a>(A, B)</code> or <code>A['+'](B)</code></li>\n<li>subtraction: <code><a href=\"#!/api/Matrix-method-minus\" rel=\"Matrix-method-minus\" class=\"docClass\">Matrix.minus</a>(A, B)</code> or <code>A['-'](B)</code></li>\n<li>multiplication: <code><a href=\"#!/api/Matrix-method-times\" rel=\"Matrix-method-times\" class=\"docClass\">Matrix.times</a>(A, B)</code> or <code>A['.*'](B)</code></li>\n<li>right division: <code><a href=\"#!/api/Matrix-method-rdivide\" rel=\"Matrix-method-rdivide\" class=\"docClass\">Matrix.rdivide</a>(A, B)</code> or <code>A['./'](B)</code></li>\n<li>left division: <code><a href=\"#!/api/Matrix-method-ldivide\" rel=\"Matrix-method-ldivide\" class=\"docClass\">Matrix.ldivide</a>(A, B)</code> or <code>A['.\\\\'](B)</code></li>\n</ul>\n\n\n<h2 id='getting_started-section-boolean-operators'>Boolean operators</h2>\n\n<p>The same process occurs for logical operators</p>\n\n<ul>\n<li>greater than: <code><a href=\"#!/api/Matrix-method-gt\" rel=\"Matrix-method-gt\" class=\"docClass\">Matrix.gt</a>(A, B)</code> or <code>A['&gt;'](B)</code></li>\n<li>greater than or equal to: <code><a href=\"#!/api/Matrix-method-ge\" rel=\"Matrix-method-ge\" class=\"docClass\">Matrix.ge</a>(A, B)</code> or <code>A['&gt;='](B)</code></li>\n<li>lower than: <code><a href=\"#!/api/Matrix-method-lt\" rel=\"Matrix-method-lt\" class=\"docClass\">Matrix.lt</a>(A, B)</code> or <code>A['&lt;'](B)</code></li>\n<li>lower than or equal to: <code><a href=\"#!/api/Matrix-method-le\" rel=\"Matrix-method-le\" class=\"docClass\">Matrix.le</a>(A, B)</code> or <code>A['&lt;='](B)</code></li>\n<li>equal: <code><a href=\"#!/api/Matrix-method-eq\" rel=\"Matrix-method-eq\" class=\"docClass\">Matrix.eq</a>(A, B)</code> or <code>A['==='](B)</code></li>\n<li>not equal: <code><a href=\"#!/api/Matrix-method-ne\" rel=\"Matrix-method-ne\" class=\"docClass\">Matrix.ne</a>(A, B)</code> or <code>A['!=='](B)</code></li>\n</ul>\n\n\n<p>Not that here a new Matrix with a 'Logical' type is always returned.</p>\n\n<h1 id='getting_started-section-import-and-export-your-data'>Import and export your data</h1>\n\n<p>Different solution are available to interface the Matrix class with other JS libraries or data format.</p>\n\n<h2 id='getting_started-section-display-a-matrix'>Display a Matrix</h2>\n\n<p>The function <code><a href=\"#!/api/Matrix-method-toString\" rel=\"Matrix-method-toString\" class=\"docClass\">Matrix.toString</a></code> transform the <code>Matrix</code> in a displayable String. For convenience, the function <code><a href=\"#!/api/Matrix-method-display\" rel=\"Matrix-method-display\" class=\"docClass\">Matrix.display</a></code> will directly display this string using the <code>console.log</code> function.</p>\n\n<h2 id='getting_started-section-from-%2F-to-javascript-array-like'>From / to javascript Array-like</h2>\n\n<p>If you have a 1D or 2D Array-like, two fonctions are available :</p>\n\n<ul>\n<li><code><a href=\"#!/api/Matrix-method-fromArray\" rel=\"Matrix-method-fromArray\" class=\"docClass\">Matrix.fromArray</a></code></li>\n<li><code><a href=\"#!/api/Matrix-method-toArray\" rel=\"Matrix-method-toArray\" class=\"docClass\">Matrix.toArray</a></code></li>\n</ul>\n\n\n<h2 id='getting_started-section-from-%2F-to-text'>From / to text</h2>\n\n<p>If you have a 1D or 2D Array-like, two fonctions are available :</p>\n\n<ul>\n<li><code><a href=\"#!/api/Matrix-method-dlmread\" rel=\"Matrix-method-dlmread\" class=\"docClass\">Matrix.dlmread</a></code></li>\n<li><code><a href=\"#!/api/Matrix-method-dlmwrite\" rel=\"Matrix-method-dlmwrite\" class=\"docClass\">Matrix.dlmwrite</a></code></li>\n</ul>\n\n\n<p>The function  <code><a href=\"#!/api/Matrix-method-dlmread\" rel=\"Matrix-method-dlmread\" class=\"docClass\">Matrix.dlmread</a></code> convert a <code>String</code> with columns separated with a delimiter (which can be specified or infered) and rows separated by a newline delimiter (<code>\\n</code>) into a Matrix object.</p>\n\n<p>The function  <code><a href=\"#!/api/Matrix-method-dlmwrite\" rel=\"Matrix-method-dlmwrite\" class=\"docClass\">Matrix.dlmwrite</a></code> convert a Matrix object to a <code>String</code> with columns separated with a delimiter (which can be specified), and rows separated by a newline delimiter (<code>\\n</code>).</p>\n\n<h2 id='getting_started-section-read-from-unknown-data'>Read from unknown data</h2>\n\n<p>The function <code><a href=\"#!/api/Matrix-method-toMatrix\" rel=\"Matrix-method-toMatrix\" class=\"docClass\">Matrix.toMatrix</a></code> allows to cast different types into a Matrix object:</p>\n\n<ul>\n<li><code>Number</code> a double precision matrix will be created containing only one value;</li>\n<li><code>Array</code>: if it contains only booleans, a logical matrix will be created other wise it will be a double precision matrix it may also be a javascript 3D array but not more ;</li>\n<li><code>Matrix</code>: this case, the object is returned wihtout modifications.</li>\n</ul>\n\n\n<h1 id='getting_started-section-some-differences-with-matlab'>Some differences with Matlab</h1>\n\n<p>Many differences exist between Matlab and the Matrix class. Some of them came from the language and some other came from the design. I propose here\na small list of these differences:</p>\n\n<ul>\n<li>Indices start from <code>0</code> to <code>n-1</code> and not from <code>1</code> to <code>n</code>. A choice had to be. This allows a better compatibility with JavaScript array indices.</li>\n<li><code>Int64</code> and <code>Uint64</code> numeric class do not exist. This is a JavaScript limitation.</li>\n<li>the function class does not exist since it is a JavaScript reserved keyword.</li>\n<li>while Matlab functions sometimes output column and sometimes row vectors, here functions always create column vectors.</li>\n</ul>\n\n","title":"The Matrix class introduction"});