# How to extract and set values in a Matrix

First, we must create a `Matrix` with values inside. For instance, we can use the `randi` function.
The command for extracting values from a `Matrix` is the command `select`.
When executing the following codes, the result will be displayed in the console of the browser.
It should open with the `F12` key.

The simplest way to extract values is to specified along each dimension which indices must be retained. 

    // Create a 5x5 Matrix containing integers between 1 and 9
    var A = Matrix.randi(9, 5).display("A");
    
    // Extract the first column and the third row
    A.select(0).display("First column");
    A.select([], 2).display(Third row"); 

# Basic
