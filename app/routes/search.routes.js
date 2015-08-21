'use strict';

/**
 * Module dependencies.
 */
var searchModel = require('../model/search.model');
var responseHandler = require('../utils/response.handler');
var Promise = require('bluebird');
var cacheHandler = require('../utils/cache.handler');

module.exports = function(routes) {

    // get search tags
    routes.get('/', function(request, response) {
        searchModel.getSearchModel(request.headers)
            .then(responseHandler.sendJsonResponse(response))
            .catch(responseHandler.sendErrorResponse(response));
    });

    routes.get('/advancedSearch', function(request, response) {
        var query = JSON.parse(request.query.parameters);
        searchModel.getObjectsForTags(request.headers, query.tags)
            .then(searchModel.filterBySkills(request.headers, query.refinedSkills))
            .then(searchModel.filterByRoles(query.refinedRoles))
            .then(searchModel.filterByOffices(request.headers, query.refinedOffices))
            .then(searchModel.filterByAssignments(request.headers, query.refinedAssignments))
            .then(responseHandler.sendJsonResponse(response))
            .catch(responseHandler.sendErrorResponse(response));
    });

    routes.get('/simpleSearch', function(request, response) {
        searchModel.getObjectsForTag(request.headers, request.query.tag)
            .then(responseHandler.sendJsonResponse(response))
            .catch(responseHandler.sendErrorResponse(response));
    });

    return routes;
};
