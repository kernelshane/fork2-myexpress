var express = require("../");
var request = require("supertest");
var expect = require("chai").expect;
var http = require("http");

describe("sub app support", function() {
    var mainApp, subApp;
    beforeEach(function() {
        mainApp = express();
        subApp = express();
        mainApp.use(subApp);
        
        mainApp.factory('parents', function(req, res, next) {
            next(null, 'parents');
        });

        subApp.factory('children', function(req, res, next) {
            next(null, 'children');
        });
    });
    
    it("parent app cannot access dependencies defined in the children apps", function(done) {
        var handler = function(children, res) {
            res.end(children);
        };
        mainApp = mainApp.inject(handler);
        request(mainApp).get("/").expect("Factory not defined: children").end(done);
    });

    it("children apps inherit the dependencies defined in the parent app", function(done) {
        var handler = function(parents, res) {
            res.end(parents);
        };
        subApp = subApp.inject(handler);
        request(subApp).get("/").expect("parents").end(done);
    });
});
