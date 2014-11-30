# Debug

This is *not* a tutorial but a sandbox.


## Small console

You can use this to execute JS code.
The final value appear in the log.

    @example
    execute = function(field) { console.log(eval(field.value)) };
    document.write('<form onsubmit="execute(this.code); return false;">');
    document.write('<input type="text" name="code" size="50"/>');
    document.write('</form>');


## Other examples

Provide some examples here...