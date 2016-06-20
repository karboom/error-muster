require('should');
var RE = require('../index');

var restify = require('restify').createServer();
var koa = require('koa')();
var express = require('express')();

var request = require('request');

var re;
describe('#RichError', function () {
    var service = {
        'koa' : '3200',
        'express' : '3300',
        'restify' : '3100'
    };

    function suite(name) {
        return function () {
            it('get 403', function (done) {
                request.get("http://localhost:"+ service[name]).on('response', function (res) {
                    res.statusCode.should.equal(403);
                    done();
                });
            });
        }
    }

    before(function () {
        re = new RE({
            file: __dirname + '/../default.yaml',
            prefix: 'store'
        });

        restify.use(re.restify());
        restify.get('/', function (req, res) {
            res.err(40302);
        });
        restify.listen(service['restify']);

        koa.use(re.koa());
        koa.use(function *() {
            throw 40302;
        });
        koa.listen(service['koa']);

        express.use(re.express());
        express.get('/', function (req, res) {
            res.err(new Error('123'));
        });
        express.listen(service['express']);
    });

    Object.keys(service).forEach(function (service) {
        describe(service, suite(service));
    });

});