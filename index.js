var fs = require('fs');

function RichError(config) {
    config = config || {};
    var file = config.file || './default.json';

    this._map = JSON.parse(fs.readFileSync(file, 'utf-8'));
    this.prefix = config.prefix || '';

    this.detector = config.detector;
    this.tpl = config.tpl;
}


RichError.prototype._error = function (send) {
    var self = this;

    return function (err) {
        let error_type = typeof err

        // default is unknown error
        let status = 500
            code = self.prefix + 500
            description = '服务器错误'

        switch (error_type) {
            case 'number':
                err = err.toString();
                if (self._map[err]) {
                    code = self.prefix + err
                    description = self._map[err]
                    status = 1 * err.substr(0, 3);
                } else {
                    console.error('[Error-Muster] [' + new Date() + '] Unknown code: ' + err);
                }
                break;
            case 'string':
                code =  self.prefix + '500'
                description = err
                status = 500;
                break;
            case 'object':
                if (self.detector) {
                    let {code, description} = self.detector(err);

                    if (code && description) {
                        status = 1 * code.toString().substr(0, 3);
                        code = self.prefix + code;
                    } else {
                        console.error('[Error-Muster] [' + new Date() + '] UnExcept detector return format');
                    }
                } else {
                    console.error('[Error-Muster] [' + new Date() + '] Undetected Error: ' + err.message);
                }
                break;
        }

        // concat body and headers
        let headers = {
            'X-Error-Code': code,
            'X-Error-Description': description
        }

        let body = {
            code, description
        }

        if (self.tpl) {
            body = fs.readFileSync(self.tpl, 'utf-8')
                .replace('{{code}}', code)
                .replace('{{description}}', description);
        }

        send.call(this, status, body, headers)
    };
};

RichError.prototype.koa = function () {
    var send = function (status, body, headers) {
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
    var send = function(status, body, headers) {
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