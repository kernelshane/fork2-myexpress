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
});
