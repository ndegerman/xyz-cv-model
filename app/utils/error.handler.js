'use strict';

var q = require('q');
var msg = require('./message.handler');

exports.getHttpError = function(statusCode) {
    return q.promise(function(resolve) {
        var error = new Error();
        error.status = statusCode;
        switch (statusCode) {
            case 400:
                error.message = msg.INVALID_JSON_OBJECT;
                break;
            case 401:
                error.message = msg.UNAUTHORIZED;
                break;
            case 404:
                error.message = msg.NO_SUCH_ITEM;
                break;
            case 406:
                error.message = msg.INVALID_RESPONSE;
                break;
            case 500:
                error.message = msg.FAILED_HTTP;
                break;
            default:
                error.message = msg.UNEXPECTED_STATUS + statusCode;
                break;
        }
        return resolve(error);
    });
};

exports.throwDREAMSHttpError = function(response) {
    return q.promise(function(resolve, reject) {
        response.message = response.message.substring(6, response.message.length);
        response.status = response.statusCode;
        return reject(response);
    });
};
