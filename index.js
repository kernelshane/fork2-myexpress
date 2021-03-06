var http = require('http');
var Layer = require('./lib/layer');
var makeRoute = require('./lib/route');
var methods = require('methods');
methods = methods.concat(['all']);


var createInjector = require('./lib/injector');
var reqExt = require('./lib/request');
var resExt = require('./lib/response');

module.exports = function() {
    var app = function(req, res, next) {
        app.monkey_patch(req, res);
        app.handle(req, res, next);
    };

    app.handle = function(req, res, out) {
        var index = 0;
        var stack = this.stack;
        var restore_url = null;
        var restore_app = null;

        function next(err) {
            var layer = stack[index++];
            if (!layer) {
                if (err) {
                    if (out) {
                        out(err);
                    }
                    res.statusCode = res.statusCode || 500;
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

                if (restore_app != null) {
                    req.app = restore_app;
                    restore_app = null;
                }
                var path_param = layer.match(req.url);
                if (path_param !== undefined) {
                    req.params = path_param.params;
                    var arity = layer.handle.length;
                    var func = layer.handle;
                    req.app = app;

                    if (typeof func.handle === 'function') {
                        restore_url = req.url;
                        req.url = req.url.slice(path_param.path.length) || "/";
                        restore_app = req.app;
                        req.app = func;
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
                } else {
                    next(err);
                }
            } catch (e) {
                next(e);
            }
        }

        next();

    };

    app.use = function(path, func) {
        if (!func)
            func = path

        var layer = new Layer(path, func);
        this.stack.push(layer);

        return this;
    };


    app.route = function(path) {
        var route = makeRoute();
        var layer = new Layer(path, route, {
            end: true
        });
        this.stack.push(layer);
        return route;
    }

    methods.forEach(function(method) {
        app[method] = function(path, handler) {
            var route = app.route(path);
            route[method](handler);
            return this;
        }
    });

    app.listen = function() {
        var server = http.createServer(this);
        return server.listen.apply(server, arguments);
    };

    app.factory = function(name, fn) {
        this._factories[name] = fn;
        this.stack.forEach(function(layer) {
            var func = layer.handle
            if (typeof func.handle == 'function') {
                if (!func._factories.hasOwnProperty(name))
                    func._factories[name] = fn;
            }
        });

    };

    app.inject = function(handler) {
        var injector = createInjector(handler, this);
        return injector;
    }

    app.monkey_patch = function(req, res) {
        req.__proto__ = reqExt;
        res.__proto__ = resExt;
        req.res = res;
        res.req = req;
    };



    app.stack = [];
    app._factories = {};
    return app;
};
