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
    });

});
