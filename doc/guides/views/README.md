# The `MatrixView` class

Remember that a `MatrixView` Object describes how a one dimensionnal array must be interpreted. That is it describes the order to use to read the data when it corresponds to a multidimensional array.
For instance, the array `['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']` can be thought either as a vector column vector of size `9x1`, a row vector of size `1x9` or as a `3x3` matrix :

    // Data seen as a row vector (1x9)
    'a' 'b' 'c' 'd' 'e' 'f' 'g' 'h' 'i'

    // Data seen as a 3x3 matrix in column-major order
    'a' 'd' 'g'
    'b' 'e' 'h'
    'c' 'f' 'i'

    // Data seen as a 3x3 matrix in row-major order
    'a' 'b' 'c'
    'd' 'e' 'f'
    'g' 'h' 'i'

**As a convention we will consider in this tutorial the column major-order, since it is the one used in most of the numercial software. But since it is only a convention, you can decide to use the one fitting the best your wishes. In addition, The `MatrixView` class provides tools to change the convention.**

The `MatrixView` class aims to describe how data coming from a unidimensional array must be read. If allow to apply very easily many operations on the elements :

- in a given order,
- colum by column,
- row by row,
- one over two,
- in a reverse order, etc.

An important thing on the views is that they do not modify the data, they only allow to read them in a given order.

## Creating a view 

For instance, we can consider the following example

    // Constructing the data
    var data = ['a', 'b', 'c', 'd', 'e'];

    // First we need to create a View
    var view = new MatrixView([data.length]);


Here we use an array of string, in order to avoid confusion between indices and data, but any kind of objects and in can be used. For instance you can use it to easily make a speadsheet program. 

## Getting an iterator to scan the view

We can then define an iterator on this view in order to go through the data:

    // Iterator to scan the view
    var iterator =  view.getIterator(0);

    // Shortcut to iterator methods
    var it = iterator.iterator, b = iterator.begin, e = iterator.end;

    // Go through the data
    for (var i = b(), ie = e(); i !== ie; i = it()) {
        console.log(i, data[i]);
    }
    
**Note that the use of the iterator will be explain in details in a following part of this tutorial. For now, we will only consider it as a tool to display the results of the view manipulations.**

When we run this code, the iterator will scan the data. In the following, we will how to modify the view in order to scan the data in different ways. 


# Some basic manipulations on views

## The select operator

This operator is the most useful operator to modify the way the data are readed.
It is the equivalent of the operator `()` in [Matlab][1].
In order to have a working example, the view modification has to be inserted between the view declaration and the the iterator example.

### Select one value

The `select` can be used to select only one value.
Here, we want to select the value `'c'`, this can be done like this

    // Select only one value
    view.select(2);
    
The iterator will only scan the second value of the data variable.
We give here the complete code obtained by the concatenation of the 3 examples:

    // Constructing the data
    var data = ['a', 'b', 'c', 'd', 'e'];

    // First we need to create a View
    var view = new MatrixView([data.length]);


    // Select only one value
    view.select(2);


    // Iterator to scan the view
    var iterator =  view.getIterator(0);

    // Shortcut to iterator methods
    var it = iterator.iterator, b = iterator.begin, e = iterator.end;

    // Go through the data
    for (var i = b(), ie = e(); i !== ie; i = it()) {
        console.log(i, data[i]);
    }

This can look at a very complicated way to realize this operation, but the next examples will we demonstrate the flexibility allowed by the `MatrixView` class.

### Select a subpart of the data

We may wish to select only a part of the previous data such that removing selecting only the 3 last components of the variable `data`. This can be done like this

    // Select a subpart of the data
    view.select([2, -1]);

Here the first argument of the `select` method is an array made with two integers. The first (`2`) gives the starting point of the selection and the last (`-1`) indicates the end point. Note that the negative values are used to indicate indices from the end.
By this way, the iterator we scan the values `['c', 'd', 'e']` of the data.

### Select one over two values

Now, we are looking to downsampling the data by taking one over two values this can also be done by using the `select` method :

    // Select a subpart of the data
    view.select([0, 2, -1]);

Here, the first (`0`) and the end (`-1`) still indicate the first and the last values to consider but between we inserted a step value giving the increment between two selected values.
The iterator will therefore scan the values `['a', 'c', 'e']`.

### Reverse the selection

Here we are looking to scan the data in a reversed order. given the previous examples this can be easily done with the following:

    // Select a subpart of the data
    view.select([-1, -1, 0]);

This states the we start from the last indice (`-1`), with a negative unit step (`-1`) and we will finish on the first indice (`0`). As a result, the iteror will return all the values in `data` but in a reverse order (`['e', 'd', 'c', 'b', 'a']`).

### Reordering the data in a given order

Reordering completely the variable `data` is also possible with the `select` method.
We can give directly the order we want :

    // Rearranging the data
    view.select([[4, 4, 3, 3, 1, 0, 2]]);

Note that to provide directly the order of the data we use a 2D Array (`[[]]`).
Here the iterator will return the values (`['e', 'e', 'd', 'd', 'b', 'a', 'c']`).

## Creating 2D and ND views

Considering the array from the previous example, we need first to create a view :

    // Constructing the data
    var data = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];

    // First we need to create a View
    var view = new MatrixView([3, 3]);

From now, the view will consider that the elements of the array `data` corresponds to the following structure, which will be called the canonical view :

    'a' 'd' 'g'
    'b' 'e' 'h'
    'c' 'f' 'i'

The `select` method can be used as well with this view. The first argument will give the selection on the first dimention (the columns) and the second will give the selection on the second dimentsion (the rows).


### Select a given column or row

You can select a given row using one of these instructions :

    // Different ways to select one column 
    view.select([], 1);
    view.select([], [1]);
    view.select([], [[1]]);

These three options will returned the following result.

    'd'
    'e'
    'f'

### Reverse the column order

In order to reverse the order of the columns we can reverse the rows. Indeed, reversing the data on each row will rearrange the columns:

    // Reversing the data on each row 
    view.select([], [-1, -1, 0]);

Note that the first argument `[]` indicate we do not want to modify the selection on the columns.
Now the view will see the data like this:

    'g' 'd' 'a'
    'h' 'e' 'b'
    'i' 'f' 'c'

The use of the `select` method on ND views is straightforward. Each argument correspond the selection on the corresponding dimension (first argument first dimension, ...). 

### Repeating the data

    // Repeting the data 2 times on each dimension 
    view.select([[0, 1, 2, 0, 1, 2]], [[0, 1, 2, 0, 1, 2]]);

As a result the view is now interpreting the data like this

    'a' 'd' 'g'  'a' 'd' 'g' 
    'b' 'e' 'h'  'b' 'e' 'h' 
    'c' 'f' 'i'  'c' 'f' 'i'

    'a' 'd' 'g'  'a' 'd' 'g' 
    'b' 'e' 'h'  'b' 'e' 'h' 
    'c' 'f' 'i'  'c' 'f' 'i'

**Note that since the data are not explicitely duplicated, this operation is done with at a very low memory cost. This is especially true when the initial datas are already large.**

### Dimension permutation

The MatrixView also allows to modify the order in which the dimensions are read.

    // Permuting the dimensions
    view.permute([1, 0]);

As a result, we will have the data transposed.

    'a' 'b' 'c'
    'd' 'e' 'f'
    'g' 'h' 'i'

This function is a generalisation to the transposition operation to ND views.
You can check the followings functions:

+ {@link MatrixView#permute permute},
+ {@link MatrixView#ipermute ipermute},
+ {@link MatrixView#rot90 rot90}.


# The iterators

We see how to change the way a `MatrixView` allow to controlthe in which order the datas are read. But now how do we access to the data ?
The iterators are the tools for that. An Iterator is designed to go element by element through the whole data (for instance all he elements of a matrix), while a subiterator is designed to go through the element of a part of the data (for instance a row or a column of a matrix).

## Two types of Iterators

### Full Iterators
An iterator allow to go through different dimensions automatically ; it has the following methods:

- `iterator` : function used to iterate on the view. It returns the new indice ;
- `begin` : function returning the first indice ;
- `end` : function returning the value reached when every indices had been visited ;
- `isEnd` function returning true if  every indices had been visited ;
- `getPosition` return an array containing the position of the iterator on every dimension.

An iterator correspondonding to a given view can be obtained by this way:

    // Get an iterator
    var iterator = view.getIterator(dimension);

The parameter `dimension` allow to control on which dimensions the iterator will work.
For instance if you have a 5D view, and dimension is zeros, the iterator will works on the five dimensions. So, you will not have the possibility to apply an operation to each column or to each row.
To get this possibility, you need set the `dimension` parameter on the lowest dimension not requiring any special action.
Then you need to get a specific Iterator (a `SubIterator`) on the dimensions you have to control.

### SubIterators

A subiterator is an object allowing to go through only one dimension. It has the same methods than an iterator but with the following differences:

- `begin` : function returning the first indice **but can take an offset as a parameter** ;
- `getPosition`: function returning a value correponding to the current position of the iterator **not an array**.
- `getIndex`: function returning the current values of the iterator (the last returned by the `iterator` method).


## Using the iterators : simplest approaches

Here, we give some exemples on how to used iterators. Iterators and subiterators are embedded classes and cannot be created directly with the `new` operator.
Therefore we need to create a view first before using them.
As seen above, this can be done by the following snippet:

    // First we need to create a View
    var view = new MatrixView([2,3,2]);

Remember that a `MatrixView` Object describes the order used to read a unidimensional `Array` when it is seen as a multidimensional array.


### Simplest way to scan the view

    // First we need to create a View
    var view = new MatrixView([2,3,2]);
    
    // Iterator to scan the view
    var iterator =  view.getIterator(0);

    // Shortcut to iterator methods
    var it = iterator.iterator, b = iterator.begin, e = iterator.end;

    // Go through the data
    for (var i = b(), ie = e(); i !== ie; i = it()) {
        // Iterators position
        var pos = iterator.getPosition();
        console.log('indice:', i, 'position:', pos);
    }
    
### Simplest way with control on dimension 0

    // First we need to create a View
    var view = new MatrixView([2,3,2]);
    
    // Iterator to scan the view on dimension greater than 0
    var iterator = view.getIterator(1);
    var it = iterator.iterator, b = iterator.begin, e = iterator.end;
    
    // SubIterator to scan the view with control on dimension 0
    var iteratory = view.getSubIterator(0);
    var ity = iteratory.iterator, by = iteratory.begin, endy = iteratory.end;
    
    for (var i = b(), ei = e(); i !== ei; i = it()) {
        for (var y = by(i), ey = endy(); y !== ey; y = ity()) {
            // Iterators position
            var posy = iteratory.getPosition(), pos = iterator.getPosition();
            console.log('indice:', y, 'position:', posy, pos);
        }
    }

We can observe on the second loop that we initialize the iterator with the `i` varable.

### Simplest way with control on dimension 0 and 1

    // First we need to create a 3D View 
    var view = new MatrixView([2,3,2]);
    
    // Iterator to scan the view on dimension greater than 1 (here the dimension 2)
    var iterator = view.getIterator(2);
    var it = iterator.iterator, b = iterator.begin, e = iterator.end;
    
    // SubIterator to scan the view with control on dimension 1
    var iteratorx = view.getSubIterator(1);
    var itx = iteratorx.iterator, bx = iteratorx.begin, endx = iteratorx.end;

    // SubIterator to scan the view with control on dimension 0
    var iteratory = view.getSubIterator(0);
    var ity = iteratory.iterator, by = iteratory.begin, endy = iteratory.end;

    for (var i = b(), ei = e(); i !== ei; i = it()) {
        for (var x = bx(i), ex = endx(); x !== ex; x = itx()) {
            for (var y = by(x), ey = endy(); y !== ey; y = ity()) {
                 // Iterators position
                 var posy = iteratory.getPosition(),
                     posx = iteratorx.getPosition(),
                     pos = iterator.getPosition();
                 console.log('indice:', y, 'position:', posy, posx, pos);
            }
        }
    }



<!--
## Using the iterators : more efficient approaches

### Same but more efficient way

    // Scaning the from the second dimension (dim = 1)
    var i, it  = this.getIterator(1), b = it.begin, e = it.isEnd;
    // First x value, end x value
    var x, f = it.getFirst(0), l = it.getEnd(0);
    // Iterators position
    var pos = it.getPosition();

    if (this.isIndicesIndexed(0)) {
        // Steps between 2 x values
        var s, steps = it.getSteps(0);
        for (i = b(); !e(); i = it()) {
            for (s = 0, x = i + f; x !== l; x += steps[++s]) {
                console.log('indice:', x, 'position:', s, pos);
            }
        }
    } else {
        // Step between 2 x values
        var n, d = it.getStep(0);
        for (i = b(); !e(); i = it()) {
            for (x = i + f, n = i + l; x !== n; x += d) {
                console.log('indice:', x, 'position:', (x - i) / d, pos);
            }
        }
    }

### With control on the 2 first dimensions

    @example
    // Scaning the from the second dimension (dim = 1)
    var i, ie, it  = this.getIterator(2), b = it.begin, e = it.end;
    // First value, step between 2 values, end value
    var x, xe, itx = it.getSubIterator(1), bx = itx.begin, ex = itx.end;
    var y, fy = it.getFirst(0), ly = it.getEnd(0);
    // Iterators position
    var posx = itx.getPosition(), pos = it.getPosition();

    if (this.isIndicesIndexed(0)) {
        var sy, ySteps = it.getSteps(0);
        for (i = b(), ie = e(); i !== ie; i = it()) {
            for (x = bx(i), xe = ex(); x !== xe; x = itx()) {
                for (sy = 0, y = x + fy; y !== ly; y += ySteps[++sy]) {
                    console.log('indice:', y, 'position:', sy, posx, pos);
                }
            }
        }
    } else {
        var ny, dy = it.getStep(0);
        for (i = b(), ie = e(); i !== ie; i = it()) {
            for (x = bx(i), xe = ex(); x !== xe; x = itx()) {
                for (y = x + fy, ny = x + ly; y !== ny; y += dy) {
                    console.log('indice:', y,  'position:', (y - x) / dy, posx, pos);
                }
            }
        }
    }

### The extremist way

    @example
    // Scaning the from the second dimension (dim = 1)
    var i, ie, it  = this.getIterator(2), b = it.begin, e = it.end;
    // First value, step between 2 values, end value
    var x, sx, xSteps, dx, nx, fx = it.getFirst(1), lx = it.getEnd(1);
    var y, sy, ySteps, dy, ny, fy = it.getFirst(0), ly = it.getEnd(0);
    // Iterators position
    var pos = it.getPosition();

    if (this.isIndicesIndexed(1)) {
        xSteps = it.getSteps(1);
        if (this.isIndicesIndexed(0)) {
            ySteps = it.getSteps(0);
            for (i = b(), ie = e(); i !== ie; i = it()) {
                for (sx = 0, x = i + fx; x !== lx; x += xSteps[++sx]) {
                    for (sy = 0, y = x + fy; y !== ly; y += ySteps[++sy]) {
                        console.log('indice:', y, 'position:', sy, sx, pos);
                    }
                }
            }
        } else {
            dy = it.getStep(0);
            for (i = b(), ie = e(); i !== ie; i = it()) {
                for (sx = 0, x = i + fx; x !== lx; x += xSteps[++sx]) {
                    for (y = x + fy, ny = x + ly; y !== ny; y += dy) {
                        console.log('indice:', y, 'position:', (y - x) / dy, sx, pos);
                    }
                }
            }
        }
    } else {
        dx = it.getStep(1);
        if (this.isIndicesIndexed(0)) {
            ySteps = it.getSteps(0);
            for (i = b(), ie = e(); i !== ie; i = it()) {
                for (x = i + fx, nx = i + lx; x !== nx; x += dx) {
                    for (sy = 0, y = x + fy; y !== ly; y += ySteps[++sy]) {
                        console.log('indice:', y, 'position:', sy, (x - i) / dx, pos);
                    }
                }
            }
        } else {
            dy = it.getStep(0);
            for (i = b(), ie = e(); i !== ie; i = it()) {
                for (x = i + fx, nx = i + lx; x !== nx; x += dx) {
                    for (y = x + fy, ny = x + ly; y !== ny; y += dy) {
                        console.log('indice:', y, 'position:', (y - x) / dy, (x - i) / dx, pos);
                    }
                }
            }
        }
    }

-->


# Extracting the data
