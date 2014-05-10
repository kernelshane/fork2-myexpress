var http = require("http");
var app;
module.exports = function () {
    app = function(req, res) {
        var current = -1;
        var error;
        var next = function(err) {
            error = err;
            current += 1;
            if (current < app.stack.length) {
                var handler = app.stack[current];
                if (!error && handler.length == 4)
                    next();
                else if (error && handler.length == 4)
                    handler(err, req, res, next);
                else
                    handler(req, res, next);
            }
            else {
                if (error) {
                    res.end("500 - Internal Error");
                }
                else {
                    res.end("404 - Not Found");
                }
            }
        };


        if (app.stack.length == 0) {
            res.end("404 - Not Found");
        }
        else {
            try {
                next();
            }
            catch (err) {
                next(err);
            }
        }
    };

    app.stack = [];

    app.listen = function(port) {
        var server = http.createServer(this);
        return server.listen.apply(server, arguments);
    };

    app.use = function(func) {
        this.stack.push(func);
    };

    return app;
};
