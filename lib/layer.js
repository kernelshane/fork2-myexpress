var path = require('path');
var p2re = require('path-to-regexp');
module.exports = Layer;

function Layer(path, middleware, prefix) {
    path = path || "/";
    middleware = middleware || function() {};
    prefix = prefix || {end: false};
    if (typeof path == 'function') {
        middleware = path;
        path = '/';
    }
    if (path[path.length-1] == '/')
        path = path.slice(0, path.length-1);
    this.path = path;
    this.handle = middleware
    this.names = [];
    this.re = p2re(path, this.names, prefix);
};

Layer.prototype.match = function(p) {
    if (p[p.length-1] == '/')
        p = p.slice(0, p.length-1);
    var re = this.re;
    var names = this.names;
    if (!re.test(p))
        return undefined;
    var m = re.exec(p);
    var params = {};
    var paralen = names.length;
    for(var i = 0;i < paralen; i++) {
        params[names[i].name] = decodeURIComponent(m[i+1]);
    }
    return {
        path: m[0],
        "params": params
    };
    
};

    
