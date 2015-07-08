'use strict';

var request = require('request-promise');
var config = require('config');
var q = require('q');
var responseHandler = require('../utils/response.handler');
var errorHandler = require('../utils/error.handler');

var url = config.API_URL + 'role';

exports.getRoleByName = function(name, headers) {
    var options = {
        resolveWithFullResponse: true,
        uri: url + '/query?name=' + name,
        method: 'GET',
        headers: headers
    };

    return request(options)
        .then(responseHandler.parseGet)
        .catch(errorHandler.throwDREAMSHttpError);
};

exports.getRoleById = function(id, headers) {
    var options = {
        resolveWithFullResponse: true,
        uri: url + '/' + id,
        method: 'GET',
        json: true,
        headers: headers
    };

    return request(options)
        .then(responseHandler.parseGet)
        .catch(errorHandler.throwDREAMSHttpError);
};

exports.getAllRoles = function() {
    var options = {
        resolveWithFullResponse: true,
        uri: url,
        method: 'GET'
    };

    return request(options)
        .then(responseHandler.parseGetPolyQuery)
        .catch(errorHandler.throwDREAMSHttpError);
};
