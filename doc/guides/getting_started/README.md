
# Build a Matrix

## The matrix constructor

The most obvious way to build a Matrix is to use the constructor

    @example 
    var A = new Matrix([2, 3, 4]);

The created Matrix will have a Float64Array of size `2x3x4` fill with zeros as underlying data.
You can do the same and display this Matrix in the your developer console using th following code

    @example 
    var A = new Matrix([2, 3, 4]).display("My matrix");

This allow you to visualize your data in a kind of pretty print format. Using the Matrix constructor is one way among others to created Matrix. In the following some of the other ways are introduced. 

## The built-in constructors

Generally, it is more convenient to use some automatic constructors.

    @example
    // Create a Matrix of size 3x3 filled with zeros
    var A = Matrix.zeros(3);
    A.display("Filled with zeros"); 
    // Create a Matrix of size 5x2 filled with ones
    var B = Matrix.ones(5, 2)
    A.display("Filled with ones"); 

There is many constructors that you can use. 




# Matrix indexing

Matrix indexing is one the powerfull features of the library. It allows you to acces to some values inside your data either to extract them or to modify them. A function corresponds to each of these cases :

+ `Matrix.get` to extract some values ;
+ `Matrix.set` to modify some values.

In the next sections, we will describe how these functions work. Let's first create a random Matrix.

    @example
    // Create a Matrix of size 5x5 filled with random integer values ranging between 0 and 9
    var A = Matrix.randi([0, 9], 5, 5).display();

We will use this Matrix in the following examples. Note that to keep this tutorial simple, we use only a 2D-Matrix. But all the things that are presented here can be extended to ND-Matrix in a straightforward manner. 

## Extract values

The method `get` allows to extract values from the Matrix. Remember that values range from 0 to N-1.

    @example
    // Extract the value of coordinates [2, 2]
    var v = A.get(2, 2).display("My value");
    // Extract the second line
    var l = A.get(2, []).display("My line"); // Equivalent to: a.get(2)
    // Extract the second column
    var c = A.get([], 2).display("My column");
    
Using an empty Array `[]` as parameter means to take all values. Noew, it is worth noting that with negative indices, you can access to values from the end of the dimension.

    @example
    // Extract the bottom-right value (in this example the value with coordinates [4, 4])
    var v = A.get(-1, -1).display("Last value");
    // Extract the penultimate column value
    var v = A.get([], -2).display("Penultimate column");

The previsously described syntax allows to select one value along a given dimension. To extract a set of value for a vector, or a set of vectors for a matrix and so on, three possibilities are available:

+ a colon operator ;
+ a indice list ;
+ a boolean list ; 
+ A boolean mask.

### Colon operator

The colon operator described a set of value using a starting index, an ending index and an optionnal step value. These values are providing through a JS Array under the form:

+ `[start, end]` ;
+ `[start, step, end]`.

As before, the values for `start` and `end` parameters can be negatives. In this case, they refer to indices from the end of the dimension. 
The parameter `step` can be omitted, in this case it is automatically set to 1 uf `end > start` or -1 if `start > end`. If provided, this paramater must be consistent with `start` and `end` values, i.e. positive if `end > start` or negative if `start > end`.

    @example
    // Remove the first and last rows
    var m = A.get([1, -2], []).display("Same than A but without first and last rows");
    // The same but without the columns on even coordinates
    var m = A.get([1, -2], [0, 2, -1]).display("Only the odd columns of A");

### Indice list

Let's try something a bit more complicated. What if we want to reorganize the order of rows or columns of the Matrix, or even duplicate some of them ? The function `get` permits this operation as well but with a different syntax for the arguments.
To select the coordinates of interest, we must give a list of indices to the `get` function. There is three ways to provide this list:

+ with the 2D JS Array like `[[0, 1, 2, 3]]` ;
+ using an integer typed array like `Int32Array` or one other ;
+ with a `Matrix` with underlying integer data.

For each one of these possibilities, the indices values may be poitive and nagative and must be in a valid range according to the considered dimension. These are the only constraints, otherwise, the values may be duplicated and arranged in any way.

    @example
    // Invert the first and last rows
    var m = A.get([4, 1, 2, 3, 0], []).display("Same than A but with first and last rows inverted");

### Boolean list


## Modify values


# Matrix operators

## Arithmetic operators

## Boolean operators


# Create a complex Matrix


# Import and export your data

Different solution are available to interface the Matrix class with other JS libraries or data format. 

## Display a Matrix

The function `Matrix.toString` transform the `Matrix` in a displayable String. For convenience, the function `Matrix.display` will directly display this string using the `console.log` function.


## From / to javascript Array-like

If you have a 1D or 2D Array-like, two fonctions are available :

+ `Matrix.fromArray`
+ `Matrix.toArray`


## From / to text

If you have a 1D or 2D Array-like, two fonctions are available :

+ `Matrix.dlmread`
+ `Matrix.dlmwrite`

The function  `Matrix.dlmread` convert a `String` with columns separated with a delimiter (which can be specified or infered) and rows separated by a newline delimiter (`\n`) into a Matrix object.

The function  `Matrix.dlmwrite` convert a Matrix object to a `String` with columns separated with a delimiter (which can be specified), and rows separated by a newline delimiter (`\n`).


## Read from unknown data

The function `Matrix.toMatrix` allows to cast different types into a Matrix object:

+ `Number` a double precision matrix will be created containing only one value;
+ `Array`: if it contains only booleans, a logical matrix will be created other wise it will be a double precision matrix it may also be a javascript 3D array but not more ;
+ `Matrix`: this case, the object is returned wihtout modifications.


# Some differences with Matlab 

Many differences exist between Matlab and the Matrix class. Some of them came from the language and some other came from the design. I propose here
a small list of these differences:

+ Indices start from `0` to `n-1` and not from `1` to `n`. A choice had to be. This allows a better compatibility with JavaScript array indices.
+ `Int64` and `Uint64` numeric class do not exist. This is a JavaScript limitation.
+ the function class does not exist since it is a JavaScript reserved keyword.
+ while Matlab functions sometimes output column and sometimes row vectors, here functions always create column vectors.
