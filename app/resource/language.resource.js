'use strict';

var request = require('request-promise');
var config = require('config');
var responseHandler = require('../utils/response.handler');
var errorHandler = require('../utils/error.handler');

var url = config.API_URL + 'language';

exports.getLanguageById = function(id, headers) {
    var options = {
        resolveWithFullResponse: true,
        uri: url + '/' + id,
        method: 'GET',
        json: true,
        headers: headers,
        gzip: true
    };

    return request(options)
        .then(responseHandler.parseGet)
        .catch(errorHandler.throwDREAMSHttpError);
};

exports.getAllLanguages = function(headers) {
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

exports.getLanguageByName = function(name, headers) {
    var options = {
        resolveWithFullResponse: true,
        uri: url + '/query?name=' + name,
        method: 'GET',
        headers: headers,
        gzip: true
    };

    return request(options)
        .then(responseHandler.parseGetMonoQuery)
        .catch(errorHandler.throwDREAMSHttpError);
};
