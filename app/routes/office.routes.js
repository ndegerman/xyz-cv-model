'use strict';

/**
 * Module dependencies.
 */
var officeModel = require('../model/office.model');
var responseHandler = require('../utils/response.handler');

module.exports = function(routes) {

    // get office by the officeId
    routes.get('/:officeId', function(request, response) {
        officeModel.getOfficeModelByOfficeId(request.params.officeId, request.headers)
            .then(responseHandler.sendJsonResponse(response))
            .catch(responseHandler.sendErrorResponse(response));
    });

    return routes;
};
