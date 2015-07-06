'use strict';

/**
 * Module dependencies.
 */
var errorHandler = require('../utils/error.handler');
var responseHandler = require('../utils/response.handler');

// middleware
exports.authentication = function(request, response, next) {
    var email = request.headers['x-forwarded-email'];

    if (!email) {
        errorHandler.getHttpError(401)
            .then(responseHandler.sendErrorResponse(response));
    } else {
        next();
    }
};
