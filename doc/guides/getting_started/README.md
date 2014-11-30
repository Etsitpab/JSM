
# Some differences with Matlab 

Many differences exist between Matlab and the Matrix class. Some of them came from the language and some other came from the design. I propose here
a small list of these differences:

+ Indices start from `0` to `n-1` and not from `1` to `n`. A choice had to be. This allows a better compatibility with JavaScript array indices.
+ `Int64` and `Uint64` numeric class do not exist. This is a JavaScript limitation.
+ the function class do not exist since it is a JavaScript reserved keyword.


# Import and export your data

Different solution are available to interface the Matrix class with other JS library or data format. 


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

The function `Matrix.toMatrix` convert the following type of data to a Matrix object:

+ `Number`
+ `Array`
+ `Matrix` In this case, the object is returned wihtout modifications.

This function allows to create functions dealing with multiple data types.


# Build a Matrix

## The matrix constructor

The most obvious way to build a Matrix is to use the constructor

    @example 
    var A = new Matrix([2, 3, 4]);


## The built-in constructors

But generally, it is more convenient to use some automatic constructors.

    @example
    // Create a Matrix of size 3x3 filled with zeros
    var A = Matrix.zeros(3); 

    // Create a Matrix of size 5x2 filled with ones
    var A = Matrix.ones(5, 2); 

