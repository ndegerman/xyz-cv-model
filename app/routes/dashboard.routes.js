'use strict';

/**
 * Module dependencies.
 */

var dashboardModel = require('../model/dashboard.model');
var responseHandler = require('../utils/response.handler');

module.exports = function(routes) {

    // get competence for all people
    routes.get('/', function(request, response) {
        dashboardModel.getDashboardModel(request.headers)
            .then(responseHandler.sendJsonResponse(response))
            .catch(responseHandler.sendErrorResponse(response));
    });

    return routes;
};
