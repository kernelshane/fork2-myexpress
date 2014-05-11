var express = require('../');
var expect = require('chai').expect;
var http = require('http');
var request = require('supertest');

describe("app", function() {
    var app = express();
    describe("empty", function() {
        it("should respond 404 to /foo", function(done) {
            var server = http.createServer(app);
            request(server)
            .get("/foo")
            .expect(404)
            .end(done)
        });
    });

    describe("#listen", function() {
        var server;
        before(function(done) {
            server = app.listen(4000, done);
        });

        it("should return a http.Server", function() {
            expect(server).to.be.instanceof(http.Server);
        });

        it("should respond 404 to /foo", function(done) {
            request("http://localhost:4000").get("/foo")
            .expect(404).end(done);
        });
    });

    describe("#use", function() {
        it("should add middlewares to satck", function() {
            var m1 = function() {};
            app.use(m1);
            expect(app.stack[app.stack.length-1]).to.be.equal(m1);
        });
    });

    describe("calling middleware stack", function() {
        var app;
        beforeEach(function() {
            app = new express();
        });
        
        it("should be able to call a single middleware", function(done) {
            var m1 = function(req, res, next) {
                res.end("hello from m1");
            };
            app.use(m1);
            request(app).get("/").expect("hello from m1").end(done);
        });

        it("should be able to call next to go to the next middleware", function(done) {
            var m1 = function(req, res, next) {
                next();
            };

            var m2 = function(req, res, next) {
                res.end("hello from m2");
            };
            app.use(m1);
            app.use(m2);
            request(app).get("/").expect("hello from m2").end(done);
        });

        it("should 404 at the end of middleware chain", function(done) {
            var m1 = function(req, res, next) {
                next();
            };
            
            var m2 = function(req, res, next) {
                next();
            };

            app.use(m1);
            app.use(m2);
            request(app).get("/").expect("404 - Not Found").end(done);
        });

        it("should 404 if no middleware is added", function(done) {
            request(app).get("/").expect("404 - Not Found").end(done);
        });

        it("should return 500 for unhandled error", function(done) {
            var m1 = function(req, res, next) {
                next(new Error("boom!"));
            };
            app.use(m1);
            request(app).get("/").expect("500 - Internal Error").end(done);
        });

        it("should return 500 for uncaught error", function(done) {
            var m1 = function(req, res, next) {
                throw new Error("boom!");
            };

            app.use(m1);
            request(app).get("/").expect("500 - Internal Error").end(done);
        });

        it("should skip error handlers when next is called without an error", function(done) {
            var m1 = function(req, res, next) {
                next();
            };

            var e1 = function(err, req, res, next) {
            };

            var m2 = function(req, res, next) {
                res.end("m2");
            };

            app.use(m1);
            app.use(e1);
            app.use(m2);
            request(app).get("/").expect("m2").end(done);
        });
    });

    describe("Implement app embedding as middleware", function() {
        var app;
        var subApp;
        beforeEach(function() {
            app = new express();
            subApp = new express();
        });

        it("should pass unhandled request to parent", function(done) {
            var m2 = function(req, res, next) {
                res.end("m2");
            };

            app.use(subApp);
            app.use(m2);
            request(app).get("/").expect("m2").end(done)
        });

        it("should pass unhandled error to parent", function(done) {
            var m1 = function(req, res, next) {
                next("m1 error");
            };

            var e1 = function(err, req, res, next) {
                res.end(err);
            };

            subApp.use(m1);
            app.use(subApp);
            app.use(e1);
            request(app).get("/").expect("m1 error").end(done);
        });
    });
});
