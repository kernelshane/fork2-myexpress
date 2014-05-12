var http = require('http');
var Layer = require('./lib/layer');
module.exports = function() {
    var index = 0;
    var app = function(req, res, next) {
        app.handle(req, res, next);
    };

    app.handle = function(req, res, out) {
        var stack = this.stack;
        function next(err) {
            var layer = stack[index++];
            if (!layer) {
                if (err) {
                    if (out) out(err);
                    res.statusCode = 500;
                    res.end('500 - Internal Error');
                } else {
                    if (out) out();
                    res.statusCode = 404;
                    res.end('404 - Not Found');
                }
                return;
            }

          try {
                if (layer.match(req.url) !== undefined) {
                    var arity = layer.handle.length;
                    if (err) {
                        if (arity === 4) {
                            index = 0;
                            layer.handle(err, req, res, next);
                        } else {
                            next(err);
                        }
                    } else if (arity < 4) {
                        index = 0;
                        layer.handle(req, res, next);
                    } else {
                        next();
                    }
                }
                else next(err);
          } catch (e) {
              next(e);
          }
        }

        next();

    };

    app.use = function(path, func) {
        path = arguments[1] ? arguments[0] : "/";
        func = arguments[1] ? arguments[1] : arguments[0];
        if ('function' == typeof func.handle) {
            var server = func;
            func = function(req, res, next) {
                server.handle(req, res, next);
            };
        }
        var layer = new Layer(path, func);
        this.stack.push(layer);
        return this;
    };

    app.listen = function() {
        var server = http.createServer(this);
        return server.listen.apply(server, arguments);
    };

    app.stack = [];
    return app;
};
