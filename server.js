var fs = require('fs');
var ErrorEntity = require('./entity')

function RichError(config) {
    config = config || {};
    let i18n = config.i18n || 'zh-cn'
    let file = config.file || `./i18n/${i18n}.json`;

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
       
        // default template
        let template = self.tpl

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
                if (err instanceof ErrorEntity) {
                    code = err.code
                    description = err.description
                    template = err.tpl
                } else if (self.detector) {
                    let res = self.detector(err);
                    code = res.code
                    description = res.description
                    template = res.tpl
                    
                    if (code && description) {
                        status = 1 * code.toString().substr(0, 3);
                        code = self.prefix + code;
                    } else {
                        console.error('[Error-Muster] [' + new Date() + '] UnExcept detector return format');
                    }
                } else {
                    console.error('[Error-Muster] [' + new Date() + '] Undetected Error: ' + err.message);
                    console.error(err.stack);
                }
                break;
        }

        // concat body and headers
        let headers = {
            'X-Error-Code': code,
            'X-Error-Description': encodeURIComponent(description)
        }

        let body = {
            code, description
        }

        if (template) {
            body = fs.readFileSync(template, 'utf-8')
                .replace('{{code}}', code)
                .replace('{{description}}', description);
        }

        send.call(this, status, body, headers)
    };
};

RichError.prototype.koa = function () {
    var send = function (status, body, headers) {
        this.set(headers)
        this.status = status
        this.body = body
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
        this.set(headers)
        this.statusCode = status;
        this.send(body);
    };

    var err = this._error(send);

    return function (req, res, next) {
        res.err = err;
        next();
    }
};

module.exports = RichError;