var fs = require('fs');

function RichError(config) {
    config = config || {};
    var file = config.file || './default.json';

    this._map = JSON.parse(fs.readFileSync(file, 'utf-8'));
    this.prefix = config.prefix || '';
}


RichError.prototype._error = function (send) {
    var self = this;

    return function (err) {
        var error_type = typeof err;
        switch (error_type) {
            case 'number':
                err = err.toString();
                if (self._map[err]) {
                    var body =  {
                        code: self.prefix + err ,
                        description: self._map[err]
                    };
                    send.call(this, 1 * err.substr(0, 3), body);

                } else {
                    console.error('[' + new Date() + '] Unknown code ' + err);
                    send.call(this, 500);
                }
                break;
            case 'string':

                break;
            case 'Object':
                break;
        }
    };

};

RichError.prototype.koa = function () {
    var send = function (status, body) {
        this.status = status;
        if (body) this.body = body;
    };

    var err = this._error(send);

    return function *(next) {
        try {
            yield next;
        } catch (error) {
            err.call(this, error);
        }
    }
};

RichError.prototype.restify = RichError.prototype.express = function () {
    var send = function(status, body) {
        this.statusCode = status;
        if (body) {
            this.send(body);
        } else {
            this.end();
        }
    };

    var err = this._error(send);

    return function (req, res, next) {
        res.err = err;
        next();
    }
};

module.exports = RichError;
