'use strict';

var request = require('request-promise');
var config = require('config');
var responseHandler = require('../utils/response.handler');

var url = config.API_URL + 'roleToAttributeConnector';
var errorHandler = require('../utils/error.handler');

exports.getRoleToAttributeConnectorsByAttributeId = function(id) {
    var options = {
        resolveWithFullResponse: true,
        uri: url + '?attributeId=' + id,
        method: 'GET'
    };

    return request(options)
        .then(responseHandler.parseGetPolyQuery)
        .catch(errorHandler.throwDREAMSHttpError);
};

exports.getRoleToAttributeConnectorsByRoleId = function(id, headers) {
    var options = {
        resolveWithFullResponse: true,
        uri: url + '?roleId=' + id,
        method: 'GET',
        headers: headers
    };

    return request(options)
        .then(responseHandler.parseGetPolyQuery)
        .catch(errorHandler.throwDREAMSHttpError);
};

exports.getAllRoleToAttributeConnectors = function() {
    var options = {
        resolveWithFullResponse: true,
        uri: url,
        method: 'GET'
    };

    return request(options)
        .then(responseHandler.parseGetPolyQuery)
        .catch(errorHandler.throwDREAMSHttpError);
};
