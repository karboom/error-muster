var fs = require('fs');

function RichError(config) {
    config = config || {};
    var file = config.file || './default.json';

    this._map = JSON.parse(fs.readFileSync(file, 'utf-8'));
    this.prefix = config.prefix || '';

    this.detector = config.detector;
}


RichError.prototype._error = function (send) {
    var self = this;

    return function (err) {
        let error_type = typeof err;
        let status_send, body_send;
        
        switch (error_type) {
            case 'number':
                err = err.toString();
                if (self._map[err]) {
                    let body =  {
                        code: self.prefix + err ,
                        description: self._map[err]
                    };
                    
                    status_send = 1 * err.substr(0, 3);
                    body_send = body
                } else {
                    console.error('[Error-Muster] [' + new Date() + '] Unknown code: ' + err);
                    status_send = 500
                }
                break;
            case 'string':
                let body = {
                    code: self.prefix + '200',
                    description: err
                };

                status_send = 200;
                body_send = body;
                break;
            case 'object':
                if (self.detector) {
                    let body = self.detector(err);

                    if (body.code && body.description) {
                        let status = 1 * body.code.toString().substr(0, 3);
                        body.code = self.prefix + body.code;
                        
                        status_send = status;
                        body_send = body
                    } else {
                        console.error('[Error-Muster] [' + new Date() + '] UnExcept detector return format');
                        status_send = 500
                    }
                } else {
                    console.error('[Error-Muster] [' + new Date() + '] Undetected Error: ' + err.message);
                    status_send = 500
                }
                break;
        }
        
        send.call(this, status_send, body_send)
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
