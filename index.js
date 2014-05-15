var http = require('http');
var Layer = require('./lib/layer');
module.exports = function() {
    var app = function(req, res, next) {
        app.handle(req, res, next);
    };
    
    app.handle = function(req, res, out) {
        var index = 0;
        var stack = this.stack;
        var restore_url = null;
        function next(err) {
            var layer = stack[index++];
            if (!layer) {
                if (err) {
                    if (out) out(err);
                    res.statusCode = 500;
                    res.end();
                } else {
                    if (out) out();
                    res.statusCode = 404;
                    res.end();
                }
                return;
            }

          try {
                if (restore_url != null) {
                    req.url = restore_url;
                    restore_url = null;
                }
                var path_param = layer.match(req.url);
                if (path_param !== undefined) {
                    req.params = path_param.params;
                    var arity = layer.handle.length;
                    var func = layer.handle;

                    if (typeof func.handle === 'function') {
                        restore_url = req.url;
                        req.url = req.url.slice(path_param.path.length) || "/";
                    } 

                    if (err) {
                        if (arity === 4) {
                            func(err, req, res, next);
                        } else {
                            next(err);
                        }
                    } else if (arity < 4) {
                        func(req, res, next);
                    } else {
                        next();
                    }
                }
                else {
                    next(err);
                }
          } catch (e) {
              next(e);
          }
        }

        next();

    };

    app.use = function(path, func) {
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
