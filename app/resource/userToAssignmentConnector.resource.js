'use strict';

var request = require('request-promise');
var config = require('config');
var responseHandler = require('../utils/response.handler');
var errorHandler = require('../utils/error.handler');

var url = config.API_URL + 'userToAssignmentConnector';

exports.getUserToAssignmentConnectorsByAssignmentId = function(id, headers) {
    var options = {
        resolveWithFullResponse: true,
        uri: url + '?assignmentId=' + id,
        method: 'GET',
        headers: headers,
        gzip: true
    };

    return request(options)
        .then(responseHandler.parseGetPolyQuery)
        .catch(errorHandler.throwDREAMSHttpError);
};

exports.getUserToAssignmentConnectorsByUserId = function(id, headers) {
    var options = {
        resolveWithFullResponse: true,
        uri: url + '?userId=' + id,
        method: 'GET',
        headers: headers,
        gzip: true
    };

    return request(options)
        .then(responseHandler.parseGetPolyQuery)
        .catch(errorHandler.throwDREAMSHttpError);
};

exports.getAllUserToAssignmentConnectors = function(headers) {
    var options = {
        resolveWithFullResponse: true,
        uri: url,
        method: 'GET',
        headers: headers,
        gzip: true
    };

    return request(options)
        .then(responseHandler.parseGetPolyQuery)
        .catch(errorHandler.throwDREAMSHttpError);
};
