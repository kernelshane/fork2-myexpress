var path = require('path');
module.exports = Layer;

function Layer(path, middleware) {
    this.handle = middleware;
    this.path = path;
};

Layer.prototype.match = function(p) {
    while(p) {
        if (p == this.path)
            return {path: this.path};
        else
            r = path.dirname(p);
            if (r == p)
                break;
            else
                p = r;
    }
    return undefined;
};

    
