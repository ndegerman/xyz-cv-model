'use strict';

var q = require('q');
var errorHandler = require('./error.handler');

// PARSING
// ============================================================================
exports.parsePolyQuery = function(body) {
    return q.promise(function(resolve) {
        var items = JSON.parse(body) || [];
        return resolve(items);
    });
};

exports.parseMonoQuery = function(body) {
    return q.promise(function(resolve) {
        exports.parsePolyQuery(body)
            .then(function(items) {
                var item = (items.length > 0) ? items[0] : null;
                return resolve(item);
            });
    });
};

exports.parseBody = function(body) {
    return q.promise(function(resolve) {
        if (typeof body === 'string') {
            body = JSON.parse(body) || null;
        }

        return resolve(body);
    });
};

// response[0]: the response
// response[1]: the body
exports.parseResponse = function(response) {
    return q.promise(function(resolve, reject) {
        if (!response) {
            return errorHandler.getHttpError(406)
                .then(reject);
        }

        if (response[1].error) {
            return errorHandler.getDREAMSHttpError(response)
                .then(reject);
        }

        return resolve(response);
    });
};

exports.parseDelete = function(response) {
    return q.promise(function(resolve, reject) {
        if (response[0].statusCode === 204) {
            return resolve(response[1]);
        }

        return errorHandler.getHttpError(response[0].statusCode)
            .then(reject);
    });
};

exports.parsePost = function(response) {
    return q.promise(function(resolve, reject) {
        if (response[0].statusCode === 200) {
            return resolve(response[1]);
        }

        return errorHandler.getHttpError(response[0].statusCode)
            .then(reject);
    });
};

exports.parsePut = function(response) {
    return q.promise(function(resolve, reject) {
        if (!response) {
            return errorHandler.getHttpError(406)
                .then(reject);
        }

        if (response[0].statusCode === 204) {
            return resolve();
        }

        return errorHandler.getHttpError(response[0].statusCode)
            .then(reject);
    });
};

exports.parseGet = function(response) {
    return q.promise(function(resolve, reject) {
        if (response[0].statusCode === 200) {
            return resolve(response[1]);
        }

        return errorHandler.getHttpError(response[0].statusCode)
            .then(reject);
    });
};

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
        return response.json({ message: 'The item was successfully removed.' });
    };
};

exports.sendSuccessfulPutJsonResponse = function(response) {
    return function() {
        return response.json({ message: 'The user was updated successfully.'});
    };
};
