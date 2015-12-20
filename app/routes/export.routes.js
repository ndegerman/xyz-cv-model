'use strict';

/**
 * Module dependencies.
 */

var exportModel = require('../model/export.model');
var responseHandler = require('../utils/response.handler');

module.exports = function(routes) {

    // get competence for all people
    routes.get('/', function(request, response) {
        exportModel.getExportModel(request.headers)
            .then(responseHandler.sendJsonResponse(response))
            .catch(responseHandler.sendErrorResponse(response));
    });

    return routes;
};
