'use strict';

var userResource = require('../resource/user.resource');
var builder = require('../builder/entity.builder');

var Promise = require('bluebird');

function getProfileTemplate() {
    return new Promise(function(resolve) {
        var template = {
            user: {}
        };
        return resolve(template);
    });
}

exports.getProfileModelByUserId = function(id, headers) {
    return getProfileTemplate()
        .then(loadUser(id, headers));
};

exports.getCurrentProfileModel = function(headers) {
    return getProfileTemplate()
        .then(loadCurrentUser(headers));
};

// USER
// ============================================================================

function loadUser(id, headers) {
    return function(model) {
        return userResource.getUserById(id, headers)
            .then(builder.buildUser(headers))
            .then(setUser(model));
    };
}

function loadCurrentUser(headers) {
    return function(model) {
        return userResource.getCurrentUser(headers)
            .then(builder.buildUser(headers))
            .then(setUser(model));
    };
}

function setUser(model) {
    return function(user) {
        return new Promise(function(resolve) {
            model.user = user;
            resolve(model);
        });
    };
}
