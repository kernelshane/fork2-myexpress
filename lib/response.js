var http = require('http');
var mime = require('mime');
var accepts =require('accepts');
var crc32 = require('buffer-crc32');
var fs = require('fs');
var path = require('path');
var rparser = require('range-parser');


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

proto.stream = function(stream) {
    var res = this;
    stream.on("data", function(chunk) {
        res.write(chunk);
        res.end();
    });
};

proto.sendfile = function(path, options) {
    var res = this;
    var req = this.req;
    if (options)
        path = options.root + path;

    fs.stat(path, function(err, stats) {
        if (err) {
            if (err.path.indexOf('..') !== -1)
                res.send(403);
            else
                res.send(404);
        }
        else if (stats.isDirectory()) {
            res.send(403);
        }
        else {
            var range = req.headers.range;
            var options = {};
            if (range) {
                var r = rparser(200, range);
                if (r.length == 1) {
                    res.statusCode = 206;
                    options = r[0];
                    var cr = 'bytes ' + options.start + '-' + options.end + '/' + stats.size;
                    res.setHeader('Content-Range', cr);
                }
                if (r == -1) {
                    res.send(416);
                    return;
                }
            }
            var file = fs.createReadStream(path, options);
            res.type('text');
            res.setHeader('Accept-Range', 'bytes');
            res.setHeader('Content-Length', stats.size);
            res.stream(file);   
        }
    });

};

module.exports = proto;
