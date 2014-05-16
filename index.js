var http = require('http');
var Layer = require('./lib/layer');
var makeRoute = require('./lib/route');
var methods = require('methods');
var createInjector = require('./lib/injector');
methods.push('all');

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

    /*
        app.get = function(path, handler) {
        handler = makeRoute('get', handler);
        var layer = new Layer(path, handler, {end: true});
        this.stack.push(layer);
        return this;
    };
    */

    app.route = function(path) {
        var route = makeRoute();
        var layer = new Layer(path, route);
        this.stack.push(layer);
        return route;
    }

    methods.forEach(function(method) {
        app[method] = function(path, handler) {
            var route = app.route(path);
            route[method](handler);
            return this;
        }
    })

    app.listen = function() {
        var server = http.createServer(this);
        return server.listen.apply(server, arguments);
    };

    app.factory = function(name, fn) {
        this._factories[name] = fn;
    };

    app.inject = function(handler) {
        var injector = createInjector(handler, this);
        return injector;
    }


    app.stack = [];
    app._factories = {};
    return app;
};
