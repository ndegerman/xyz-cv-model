'use strict';

/**
 * Module dependencies.
 */
var feedModel = require('../model/feed.model');
var responseHandler = require('../utils/response.handler');

module.exports = function(routes) {

    // get dashboard model
    routes.get('/', function(request, response) {
        feedModel.getFeedModel(request.headers)
            .then(responseHandler.sendJsonResponse(response))
            .catch(responseHandler.sendErrorResponse(response));
    });

    return routes;
};
