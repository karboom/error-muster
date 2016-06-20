var fs = require('fs');

function RichError(config) {
    config = config || {};
    var file = config.file || './default.json';

    this._map = JSON.parse(fs.readFileSync(file, 'utf-8'));
    this.prefix = config.prefix || '';
}


RichError.prototype._error = function (sendStatus, sendBody) {
    var self = this;

    return function (err) {
        if (typeof err == "number") {
            err = err.toString();
            if (self._map[err]) {
                var body =  {
                        code: self.prefix + err ,
                        description: self._map[err]
                    };
                sendBody.call(this, 1 * err.substr(0, 3), body);

            } else {
                console.error('[' + new Date() + '] Unknown code ' + err);
                sendStatus.call(this, 500);
            }
        } else {
            console.error('[' + new Date() + '] ' +  err.message);
            console.error(err.stack);
            sendStatus.call(this, 500);
        }
    };

};

RichError.prototype.koa = function () {
    var sendBody = function (status, body) {
        this.status = status;
        this.body = body;
    };

    var sendStatus = function (status) {
        this.status = status;
    };

    var err = this._error(sendStatus, sendBody);

    return function *(next) {
        try {
            yield next;
        } catch (error) {
            err.call(this, error);
        }
    }
};

RichError.prototype.restify = RichError.prototype.express = function () {
    var sendBody = function (status, body) {
        this.statusCode = status;
        this.send(body);
    };

    var sendStatus = function (status) {
        this.statusCode = status;
        this.end();
    };

    var err = this._error(sendStatus,sendBody);

    return function (req, res, next) {
        res.err = err;
        next();
    }
};

module.exports = RichError;
