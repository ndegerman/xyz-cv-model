'use strict';

/**
 * Module dependencies.
 */
var profileModel = require('../model/profile.model');
var responseHandler = require('../utils/response.handler');
var q = require('q');

module.exports = function(routes) {

    // get profile for current user
    routes.get('/current', function(request, response) {
        profileModel.getCurrentProfile(request.headers)
            .then(responseHandler.sendJsonResponse(response))
            .catch(responseHandler.sendErrorResponse(response));
    });

    // get profile by the userId
    routes.get('/:userIid', function(request, response) {
        profileModel.getProfileByUserId(request.params.userId, request.headers)
            .then(responseHandler.sendJsonResponse(response))
            .catch(responseHandler.sendErrorResponse(response));
    });

    return routes;
};
