var Disk = {};

Disk.exist = function (key) {
    'use strict';
    if (typeof key !== 'string') {
        throw new Error('Disk: key must be a string.');
    }
    return localStorage.hasOwnProperty(key);
};

Disk.save = function (key, file, force) {
    'use strict';
    force = force || false;
    if (!force && this.exist(key)) {
        throw new Error('Disk: Key already exist.');
    } else {
        localStorage.setItem(key, file);
    }
    return this;
};

Disk.load = function (key) {
    'use strict';
    if (this.exist(key)) {
        var a = localStorage.getItem(key);
        return a;
    }
    throw new Error('Disk: Key doesn\'t exist.');
};

Disk.remove = function (key) {
    'use strict';
    if (this.exist(key) !== undefined) {
        localStorage.removeItem(key);
    } else {
        throw new Error('Disk: Key doesn\'t exist.');
    }
};

Disk.remove = function (key) {
    'use strict';
    if (this.exist(key) !== undefined) {
        localStorage.removeItem(key);
    } else {
        throw new Error('Disk: Key doesn\'t exist.');
    }
};

Disk.getItemList = function (mask) {
    'use strict';
    if (mask !== undefined && typeof mask !== 'string') {
        throw new Error('Disk: Mask must be a string.');
    }
    var i, out = [];
    for (i in localStorage) {
        if (localStorage.hasOwnProperty(i)) {
            if (mask === undefined || i.match(mask)) {
                out.push(i);
            }
        }
    }
    return out.sort();
};

Disk.clear = function () {
    'use strict';
    localStorage.clear();
};
