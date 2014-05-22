var http = require('http');
var mime = require('mime');
var accepts =require('accepts');
var crc32 = require('buffer-crc32');


var proto = {};
proto.isExpress = true;    
proto.__proto__ = http.ServerResponse.prototype;

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
    this.setHeader("Content-Type", mime.lookup(name));
};

proto.default_type = function(name) {
    if(!this.getHeader('content-type'))
        this.type(name);
};

proto.format = function(obj) {
    var accept = accepts(this.req);
    var key = accept.types(Object.keys(obj));
    if (key.length === 0) {
        var err = new Error("Not Acceptable");
        err.statusCode = 406;
        throw err;
    }
    this.type(key);
    obj[key]();
};


proto.send = function(code, body) {
    if (arguments.length == 1) {
        if (typeof arguments[0] == 'number') {
            code = arguments[0];
            body = undefined;
        }
        else {
            body = arguments[0];
            code = 200;
        }
    }
    
    if(this.req.method == 'GET' && body && !this.getHeader('etag')) {
        var ETag = crc32.unsigned(body);
        this.setHeader('ETag', '"' + ETag + '"');
    }

    curtype = this.getHeader('content-type');

    if (typeof body === 'string' || body instanceof String) {
        this.default_type('html');
        this.setHeader('Content-Length', Buffer.byteLength(body));        
    }
    if (body instanceof Buffer) {
        this.default_type('bin');
        this.setHeader('Content-Length', body.length);
        body = body.toString();
    }
    if (typeof body == 'object') {
        if (!curtype)
            this.setHeader('Content-Type', mime.lookup('JSON'));
        body = JSON.stringify(body);
    }
    
    if (this.req.headers["if-none-match"] == this.getHeader('etag') && this.getHeader('etag'))
        code = 304;
    
    if (this.req.headers["if-modified-since"] >= this.getHeader('last-modified'))
        code = 304;

    this.statusCode = code;
    
    if (body || body === "") {
        this.end(body);
    }
    else {
        this.end(http.STATUS_CODES[String(code)]);
    }
};

module.exports = proto;
