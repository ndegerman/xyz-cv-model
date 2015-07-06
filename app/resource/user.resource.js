'use strict';

var request = require('request');
var q = require('q');
var config = require('config');
var responseHandler = require('../utils/response.handler');

var url = config.API_URL + 'user';

exports.getUserById = function(id, headers) {
    var options = {
        uri: url + '/' + id,
        method: 'GET',
        json: true,
        headers: headers
    };

    return q.nfcall(request, options)
        .then(responseHandler.parseResponse)
        .then(responseHandler.parseGet)
        .then(responseHandler.parseBody);
};

exports.getCurrentUser = function(headers) {
    var options = {
        uri: url + '/current',
        method: 'GET',
        headers: headers
    };

    return q.nfcall(request, options)
        .then(responseHandler.parseResponse)
        .then(responseHandler.parseGet)
        .then(responseHandler.parseBody);
};

exports.getAllUsers = function() {
    var options = {
        uri: url,
        method: 'GET'
    };

    return q.nfcall(request, options)
        .then(responseHandler.parseResponse)
        .then(responseHandler.parseGet)
        .then(responseHandler.parsePolyQuery);
};
