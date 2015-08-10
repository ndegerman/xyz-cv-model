'use strict';

/**
 * Module dependencies.
 */

var competenceModel = require('../model/competence.model');
var responseHandler = require('../utils/response.handler');

module.exports = function(routes) {

    // get competence for all people
    routes.get('/', function(request, response) {
        competenceModel.getCompetenceModel(request.headers)
            .then(responseHandler.sendJsonResponse(response))
            .catch(responseHandler.sendErrorResponse(response));
    });

    return routes;
};
