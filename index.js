var http = require("http");
var app;
module.exports = function () {

    app = function(req, res) {
        var current = 0;
        var next = function() {
            current += 1;
            if (current < app.stack.length) {
                app.stack[current](req, res, next);
            }
            else {
                res.end("404 - Not Found");
            }
        };

        if (app.stack.length == 0) {
            res.end("404 - Not Found");
        }
        else {
            app.stack[0](req, res, next);
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
