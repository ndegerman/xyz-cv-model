'use strict';

var request = require('request');
var q = require('q');
var config = require('config');
var responseHandler = require('../utils/response.handler');

var url = config.API_URL + 'attribute';

exports.getAttributeById = function(id) {
    var options = {
        uri: url + '/' + id,
        method: 'GET',
        json: true
    };

    return q.nfcall(request, options)
        .then(responseHandler.parseResponse)
        .then(responseHandler.parseGet)
        .then(responseHandler.parseBody);
};

exports.getAllAttributes = function(headers) {
    var options = {
        uri: url,
        method: 'GET',
        headers: headers
    };

    return q.nfcall(request, options)
        .then(responseHandler.parseResponse)
        .then(responseHandler.parseGet)
        .then(responseHandler.parsePolyQuery);
};
