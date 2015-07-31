'use strict';

var userResource = require('../resource/user.resource');
var roleResource = require('../resource/role.resource');
var skillResource = require('../resource/skill.resource');
var officeResource = require('../resource/office.resource');
var assignmentResource = require('../resource/assignment.resource');

var utils = require('../utils/utils');
var Promise = require('bluebird');

function getSearchTemplate() {
    return new Promise(function(resolve) {
        var template = {
            tagList: []
        };

        return resolve(template);
    });
}

exports.getSearchModel = function(headers) {
    return getSearchTemplate()
        .then(loadTagList(headers));
};

// TAGLIST
// ============================================================================

function loadTagList(headers) {
    return function(model) {
        var tagSet = Object.create(null);

        return loadUsers(tagSet, headers)
            .then(loadOffices(headers))
            .then(loadSkills(headers))
            .then(loadRoles(headers))
            .then(loadAssignments(headers))
            .then(utils.convertSetToList)
            .then(utils.setFieldForObject(model, 'tagList'));
    };
}

function loadUsers(tagSet, headers) {
    return userResource.getAllUsers(headers)
        .then(utils.addFieldsFromObjects(tagSet, ['name', 'position']));
}

function loadOffices(headers) {
    return function(tagSet) {
        return officeResource.getAllOffices(headers)
            .then(utils.addFieldsFromObjects(tagSet, ['name']));
    };
}

function loadSkills(headers) {
    return function(tagSet) {
        return skillResource.getAllSkills(headers)
            .then(utils.addFieldsFromObjects(tagSet, ['name']));
    };
}

function loadRoles(headers) {
    return function(tagSet) {
        return roleResource.getAllRoles(headers)
            .then(utils.addFieldsFromObjects(tagSet, ['name']));
    };
}

function loadAssignments(headers) {
    return function(tagSet) {
        return assignmentResource.getAllAssignments(headers)
            .then(utils.addFieldsFromObjects(tagSet, ['name']));
    };
}

//
// ===============================================================================
