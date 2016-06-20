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
            it('get code and body with config file', function (done) {
                request.get("http://localhost:"+ service[name] + '/code', function (err, res, body) {
                    res.statusCode.should.equal(403);
                    body = JSON.parse(body);
                    body.code.should.eql('test-403');
                    body.description.should.eql('forbidden');
                    done();
                });
            });

            it('should get 500 with non-defined code', function (done) {
                request.get("http://localhost:"+ service[name] + '/code_non').on('response', function (res) {
                    res.statusCode.should.equal(500);
                    done();
                });
            });

            it('should get 200 with only custom text', function (done) {
                request.get("http://localhost:"+ service[name] + '/text').on('response', function (res) {
                    res.statusCode.should.equal(200);
                    res.body.should.eql({
                        code: 'test-200',
                        description: 'An error'
                    });
                    done();
                });
            });

            it('should get res by custom Error detector', function (done) {
                request.get("http://localhost:"+ service[name] + '/error').on('response', function (res) {
                    res.statusCode.should.equal(500);
                    done();
                });
            });
        }
    }

    before(function () {
        re = new RE({
            file: __dirname + '/../default.json',
            prefix: 'test-'
        });

        restify.use(re.restify());
        restify.get('/code', function (req, res) {
            res.err(403);
        });
        restify.get('/code_non', function (req, res) {
            res.err(600);
        });
        restify.get('/error', function (req, res) {
            res.err(new Error('Custom error'));
        });
        restify.get('/text', function (req, res) {
            res.err('An error')
        });
        restify.listen(service['restify']);

        koa.use(re.koa());
        koa.use(function *() {
            var url = this.request.url;

            switch (url) {
                case '/code':
                    throw 403;
                break;

                case '/code_non':
                    throw 600;
                break;

                case '/error':
                  throw new Error('Custom error');
                break;

                case '/text':
                  throw 'An error';
                break;
            }

        });

        koa.listen(service['koa']);

        express.use(re.express());
        express.get('/code', function (req, res) {
            res.err(403);
        });
        express.get('/code_non', function (req, res) {
            res.err(600);
        });
        express.get('/error', function (req, res) {
            res.err(new Error('Custom error'));
        });
        express.get('/text', function (req, res) {
            res.err('An error')
        });
        express.listen(service['express']);
    });

    Object.keys(service).forEach(function (service) {
        describe(service, suite(service));
    });

});