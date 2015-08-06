'use strict';

var Promise = require('bluebird');
var errorHandler = require('./error.handler');
var msg = require('./message.handler');

// PARSING
// ============================================================================

exports.parseDelete = function(response) {
    return checkResponse(response)
        .then(checkStatusCode(204))
        .then(parseBody);
};

exports.parsePost = function(response) {
    return checkResponse(response)
        .then(checkStatusCode(200))
        .then(parseBody);
};

exports.parsePut = function(response) {
    return checkResponse(response)
        .then(checkStatusCode(204))
        .then(parseBody);
};

exports.parseGet = function(response) {
    return checkResponse(response)
        .then(checkStatusCode(200))
        .then(parseBody);
};

exports.parseGetPolyQuery = function(response) {
    return checkResponse(response)
        .then(checkStatusCode(200))
        .then(parsePolyQuery);
};

exports.parseGetMonoQuery = function(response) {
    console.log(response);
    return checkResponse(response)
        .then(checkStatusCode(200))
        .then(parseMonoQuery);
};

function checkResponse(response) {
    return new Promise(function(resolve, reject) {
        if (!response) {
            return errorHandler.getHttpError(406)
                .then(reject);
        }

        return resolve(response);
    });
}

function checkStatusCode(code) {
    return function(response) {
        return new Promise(function(resolve, reject) {
            if (response.statusCode === code) {
                return resolve(response);
            }

            return errorHandler.getHttpError(response.statusCode)
                .then(reject);
        });
    };
}

function parsePolyQuery(response) {
    return new Promise(function(resolve) {
        var items = JSON.parse(response.body) || [];
        return resolve(items);
    });
}

function parseMonoQuery(response) {
    return new Promise(function(resolve) {
        parsePolyQuery(response)
            .then(function(items) {
                var item = (items.length > 0) ? items[0] : null;
                return resolve(item);
            });
    });
}

function parseBody(response) {
    return new Promise(function(resolve) {
        var body = response.body || {};
        if (typeof body === 'string') {
            body = JSON.parse(body) || null;
        }

        return resolve(body);
    });
}

// SENDING
// ============================================================================
exports.sendErrorResponse = function(response) {
    return function(error) {
        response.status(error.status || 500).send(error.message);
    };
};

exports.sendToNext = function(next) {
    return function() {
        next();
    };
};

exports.sendJsonResponse = function(response) {
    return function(object) {
        return response.json(object);
    };
};

exports.sendSuccessfulDeleteJsonResponse = function(response) {
    return function() {
        return response.send(msg.SUCCESS_DELETE);
    };
};

exports.sendSuccessfulPutJsonResponse = function(response) {
    return function() {
        return response.send(msg.SUCCESS_UPDATE);
    };
};
