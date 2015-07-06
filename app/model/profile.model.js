'use strict';

var userResource = require('../resource/user.resource');
var builder = require('../builder/entity.builder');

var q = require('q');

function getProfileTemplate(user) {
    return q.promise(function(resolve) {
        var profile = {
            user: user
        };
        return resolve(profile);
    });
}

exports.getProfileByUserId = function(id, headers) {
    return userResource.getUserById(id, headers)
        .then(builder.buildUserInChain(headers))
        .then(getProfileTemplate);
};

exports.getCurrentProfile = function(headers) {
    return userResource.getCurrentUser(headers)
        .then(builder.buildUserInChain(headers))
        .then(getProfileTemplate);
};
