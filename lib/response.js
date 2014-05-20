var http = require('http');
var mime = require('mime');
var accepts =require('accepts');
var proto = {};
proto.isExpress = true;
proto.redirect = function(code, url) {
    if (!url) {
        url = code;
        code = 302;
    }
    this.writeHead(code, {
        'Location': url,
        'Content-Length': 0
    });
    this.end();
};

proto.type = function(name) {
    if (name[0] == '.')
        name = name.slice(1);
    this.setHeader("Content-Type", mime.lookup(name));
};

proto.default_type = function(name) {
    if(this.getHeader('content-type'))
        return;
    proto.type(name);
};

proto.format = function(obj) {
    var accept = accepts(this.req);
    var key = accept.types(Object.keys(obj));
    if (key == false) {
        var err = new Error("Not Acceptable");
        err.statusCode = 406;
        throw err;
    }
    proto.type(key);
    obj[key]();
};
    
proto.__proto__ = http.ServerResponse.prototype;
module.exports = proto;
