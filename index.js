var http = require('http');


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
        if(err) {
          if(out) out(err);
          res.statusCode = 500;
          res.end('500 - Internal Error');
        } else {
          if(out) out();
          res.statusCode = 404;
          res.end('404 - Not Found');
        }
        return;
      }

      try {
        var arity = layer.handle.length;
        if (err) {
          if (arity === 4) {
            layer.handle(err, req, res, next);
          } else {
            next(err);
          }
        } else if (arity < 4) {
          layer.handle(req, res, next);
        } else {
          next();
        }
      } catch(e) {
        next(e);
      }
    }

    next();

  };

  app.use = function(fn) {
    if ('function' == typeof fn.handle) {
      var server = fn;
      fn = function(req, res, next) {
        server.handle(req, res, next);
      };
    }
    this.stack.push({handle: fn});
    return this;
  };

  app.listen = function() {
    var server = http.createServer(this);
    return server.listen.apply(server, arguments);
  };
  
  app.stack = [];
  return app;
};
