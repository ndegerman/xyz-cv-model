'use strict';

var request = require('request');
var q = require('q');
var config = require('config');
var responseHandler = require('../utils/response.handler');

var url = config.API_URL + 'skillToSkillGroupConnector';

exports.getSkillToSkillGroupConnectorsBySkillId = function(id) {
    var options = {
        uri: url + '?skillId=' + id,
        method: 'GET'
    };

    return q.nfcall(request, options)
        .then(responseHandler.parseResponse)
        .then(responseHandler.parseGet)
        .then(responseHandler.parsePolyQuery);
};

exports.getSkillToSkillGroupConnectorsBySkillGroupId = function(id) {
    var options = {
        uri: url + '?skillGroupId=' + id,
        method: 'GET'
    };

    return q.nfcall(request, options)
        .then(responseHandler.parseResponse)
        .then(responseHandler.parseGet)
        .then(responseHandler.parsePolyQuery);
};

exports.getAllSkillToSkillGroupConnectors = function() {
    var options = {
        uri: url,
        method: 'GET'
    };

    return q.nfcall(request, options)
        .then(responseHandler.parseResponse)
        .then(responseHandler.parseGet)
        .then(responseHandler.parsePolyQuery);
};
