'use strict';

/**
 * Module dependencies.
 */
var searchModel = require('../model/search.model');
var responseHandler = require('../utils/response.handler');
var Promise = require('bluebird');
var cacheHandler = require('../utils/cache.handler');

module.exports = function(routes) {

    // get search object
    routes.get('/', function(request, response) {
        searchModel.getSearchModel(request.headers)
            .then(responseHandler.sendJsonResponse(response))
            .catch(responseHandler.sendErrorResponse(response));
    });

    routes.get('/query', function(request, response) {
        searchModel.getObjectsForTags(request.headers, request.query.tags)
            .then(responseHandler.sendJsonResponse(response))
            .catch(responseHandler.sendErrorResponse(response));
    });

    return routes;
};
