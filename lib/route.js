module.exports = makeRoute;

function makeRoute(verb, handler) {
    return function(req, res, next) {
        if (verb.toLowerCase() == req.method.toLowerCase()) {
            handler(req, res, next);
        }
        else {
            res.statusCode = 404;
            res.end();
        }
    };
}

