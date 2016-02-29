'use strict';

var request = require('request-promise');
var config = require('config');
var responseHandler = require('../utils/response.handler');
var errorHandler = require('../utils/error.handler');

var url = config.API_URL + 'userToLanguageConnector';

exports.getUserToLanguageConnectorsByLanguageId = function(id, headers) {
    var options = {
        resolveWithFullResponse: true,
        uri: url + '?languageId=' + id,
        method: 'GET',
        headers: headers,
        gzip: true
    };

    return request(options)
        .then(responseHandler.parseGetPolyQuery)
        .catch(errorHandler.throwDREAMSHttpError);
};

exports.getUserToLanguageConnectorsByUserId = function(id, headers) {
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

exports.getAllUserToLanguageConnectors = function(headers) {
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

exports.getUserToLanguageConnectorById = function(id, headers) {
    var options = {
        resolveWithFullResponse: true,
        uri: url + '/' + id,
        method: 'GET',
        headers: headers,
        gzip: true
    };

    return request(options)
        .then(responseHandler.parseGet)
        .catch(errorHandler.throwDREAMSHttpError);
};
