var http = require("http");
var app;
module.exports = function () {
    app = function(req, res) {
        res.statusCode = 404;
        res.end();
    };

    app.listen = function(port) {
        var server = http.createServer(this);
        return server.listen.apply(server, arguments);
    };

    return app;
};
