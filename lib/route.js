module.exports = makeRoute;
var methods = require('methods');
methods.concat(['all']);

function makeRoute(verb, handler) {
    var route = function(req, res, next) {
        route.handle(req, res, next);
    };

    route.handle = function(req, res, out) {
        var index = 0;
        var stack = this.stack
        function next(err) {
            if (err == 'route')
                if (out) out();
            if (err) {
                throw new Error(err);
            }
            var layer = stack[index++];
            if (!layer) {
                res.statusCode = 404;
                res.end();
            }
            else {
                if(req.method.toLowerCase() == layer.verb.toLowerCase()
                    || layer.verb == 'all') { 
                    layer.handler(req, res, next);
                }
                else
                    next();
            }
        }

        next();
    };

    route.stack = [];
    route.use = function(verb, handler) {
        var layer = {'verb': verb, 'handler': handler};
        this.stack.push(layer);
    };

    methods.forEach(function(method) {
        route[method] = function(handler) {
            route.use(method, handler);
            return this;
        };
    });

    return route;
}
