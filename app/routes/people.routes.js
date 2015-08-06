'use strict';

/**
 * Module dependencies.
 */

var peopleModel = require('../model/people.model');
var responseHandler = require('../utils/response.handler');

module.exports = function(routes) {

    // get all people
    routes.get('/', function(request, response) {
        peopleModel.getPeopleModel(request.headers)
            .then(responseHandler.sendJsonResponse(response))
            .catch(responseHandler.sendErrorResponse(response));
    });

    return routes;
};
