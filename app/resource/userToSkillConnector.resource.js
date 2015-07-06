'use strict';

var request = require('request');
var q = require('q');
var config = require('config');
var responseHandler = require('../utils/response.handler');

var url = config.API_URL + 'userToSkillConnector';

exports.getUserToSkillConnectorsBySkillId = function(id) {
    var options = {
        uri: url + '?skillId=' + id,
        method: 'GET'
    };

    return q.nfcall(request, options)
        .then(responseHandler.parseResponse)
        .then(responseHandler.parseGet)
        .then(responseHandler.parsePolyQuery);
};

exports.getUserToSkillConnectorsByUserId = function(id, headers) {
    var options = {
        uri: url + '?userId=' + id,
        method: 'GET',
        headers: headers
    };

    return q.nfcall(request, options)
        .then(responseHandler.parseResponse)
        .then(responseHandler.parseGet)
        .then(responseHandler.parsePolyQuery);
};

exports.getAllUserToSkillConnectors = function() {
    var options = {
        uri: url,
        method: 'GET'
    };

    return q.nfcall(request, options)
        .then(responseHandler.parseResponse)
        .then(responseHandler.parseGet)
        .then(responseHandler.parsePolyQuery);
};
