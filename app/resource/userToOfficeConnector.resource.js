'use strict';

var request = require('request-promise');
var config = require('config');
var responseHandler = require('../utils/response.handler');
var errorHandler = require('../utils/error.handler');

var url = config.API_URL + 'userToOfficeConnector';

exports.getUserToOfficeConnectorsByOfficeId = function(id, headers) {
    var options = {
        resolveWithFullResponse: true,
        uri: url + '?officeId=' + id,
        method: 'GET',
        headers: headers
    };

    return request(options)
        .then(responseHandler.parseGetPolyQuery)
        .catch(errorHandler.throwDREAMSHttpError);
};

exports.getUserToOfficeConnectorsByUserId = function(id, headers) {
    var options = {
        resolveWithFullResponse: true,
        uri: url + '?userId=' + id,
        method: 'GET',
        headers: headers
    };

    return request(options)
        .then(responseHandler.parseGetPolyQuery)
        .catch(errorHandler.throwDREAMSHttpError);
};

exports.getAllUserToOfficeConnectors = function(headers) {
    var options = {
        resolveWithFullResponse: true,
        uri: url,
        method: 'GET',
        headers: headers
    };

    return request(options)
        .then(responseHandler.parseGetPolyQuery)
        .catch(errorHandler.throwDREAMSHttpError);
};
