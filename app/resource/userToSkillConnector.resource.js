'use strict';

var request = require('request-promise');
var config = require('config');
var responseHandler = require('../utils/response.handler');
var errorHandler = require('../utils/error.handler');

var url = config.API_URL + 'userToSkillConnector';

exports.getUserToSkillConnectorsBySkillId = function(id, headers) {
    var options = {
        resolveWithFullResponse: true,
        uri: url + '?skillId=' + id,
        method: 'GET',
        headers: headers
    };

    return request(options)
        .then(responseHandler.parseGetPolyQuery)
        .catch(errorHandler.throwDREAMSHttpError);
};

exports.getUserToSkillConnectorsByUserId = function(id, headers) {
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

exports.getAllUserToSkillConnectors = function(headers) {
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
