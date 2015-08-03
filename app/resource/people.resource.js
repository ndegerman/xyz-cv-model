'use strict';

var request = require('request-promise');
var config = require('config');
var responseHandler = require('../utils/response.handler');
var errorHandler = require('../utils/error.handler');

var url = config.API_URL + 'people';

exports.getAllPeople = function(headers) {
    var options = {
        resolveWithFullResponse: true,
        uri: url + '/',
        method: 'GET',
        headers: headers
    };

    return request(options)
        .then(responseHandler.parseGet)
        .catch(errorHandler.throwDREAMSHttpError);
};
