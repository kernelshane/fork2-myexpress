module.exports = createInjector;

function createInjector(handler, app) {
    var injector = function(req, res, next) {
        var loader = injector.dependencies_loader(req, res, next);
        loader(function(err, values) {
            if (err != null) {
                if(next) next(err);
                else res.end(err.message);
            }
            else
                handler.apply(this, values);
        });
    };

    injector.extract_params = function() {
        var text = handler.toString();
        if (this.extract_params.cache[text])
            return this.extract_params.cache[text];

        var FN_ARGS        = /^function\s*[^\(]*\(\s*([^\)]*)\)/m,
            FN_ARG_SPLIT   = /,/,
            FN_ARG         = /^\s*(_?)(\S+?)\1\s*$/,
            STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
       
        var params = [];
        var argDecl = text.replace(STRIP_COMMENTS, '').match(FN_ARGS);
        argDecl[1].split(FN_ARG_SPLIT).forEach(function(arg) {
            arg.replace(FN_ARG, function(all, underscore, name) {
                params.push(name);
            });
        });

        this.extract_params.cache[text] = params;
        return params;
    };
    injector.extract_params.cache = {};

    injector.needInject = function(params) {
        skipRules = [
            [],
            ['req'],
            ['req', 'res'],
            ['req', 'res', 'next'],
            ['err', 'req', 'res', 'next'],
            ['error', 'req', 'res', 'next']
        ];
        
       for (var i = 0; i < skipRules.length; ++i) {
           if (injector.arraysEqual(skipRules[i], params)) 
               return false;
       }
       return true;
    };

    injector.arraysEqual = function(arr1, arr2) {
          if (arr1 === arr2) return true;
            if (arr1 === null || arr2 === null) return false;
              if (arr1.length != arr2.length) return false;

                for (var i = 0; i < arr1.length; ++i) {
                        if (arr1[i] !== arr2[i]) return false;
                          }

                  return true;
    };


    
    injector.dependencies_loader = function(req, res, next) {
        var dict = {'req': req, 'res': res, 'next': next};
        var params = injector.extract_params();
        params.forEach(function(para) {
            if( para == 'req' || para == 'res' || para == 'next') {
                app.factory(para, function(req, res, next) {
                    next(null, dict[para]);
                });
            }
        });

        return function(callback) {
            var error = null;
            var values = [];

            var index = 0;
            var factories = app._factories;
            function next(err, value) {
                if(value) {
                    values.push(value);
                }
                if(err) {
                    error = err;
                    return;
                }
                
                var name = params[index++];
                if(!name)
                    return;

                var factory = factories[name];
                if(!factory) {
                    error = new Error("Factory not defined: " + name);
                    return;
                }
                try {
                    factory(req, res, next);
                } catch (e) {
                    error = e;
                    return;
                }
            }
            if (injector.needInject(params))
                next();
            callback(error, values);
        };
    };

            

    return injector;
}


