'use strict';

var request = require('request-promise');
var config = require('config');
var responseHandler = require('../utils/response.handler');
var errorHandler = require('../utils/error.handler');

var url = config.API_URL + 'skillToSkillGroupConnector';

exports.getSkillToSkillGroupConnectorsBySkillId = function(id) {
    var options = {
        resolveWithFullResponse: true,
        uri: url + '?skillId=' + id,
        method: 'GET'
    };

    return request(options)
        .then(responseHandler.parseGetPolyQuery)
        .catch(errorHandler.throwDREAMSHttpError);
};

exports.getSkillToSkillGroupConnectorsBySkillGroupId = function(id) {
    var options = {
        resolveWithFullResponse: true,
        uri: url + '?skillGroupId=' + id,
        method: 'GET'
    };

    return request(options)
        .then(responseHandler.parseGetPolyQuery)
        .catch(errorHandler.throwDREAMSHttpError);
};

exports.getAllSkillToSkillGroupConnectors = function() {
    var options = {
        resolveWithFullResponse: true,
        uri: url,
        method: 'GET'
    };

    return request(options)
        .then(responseHandler.parseGetPolyQuery)
        .catch(errorHandler.throwDREAMSHttpError);
};
