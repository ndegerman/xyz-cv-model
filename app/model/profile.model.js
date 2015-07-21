'use strict';

var officeResource = require('../resource/office.resource');
var userResource = require('../resource/user.resource');
var roleResource = require('../resource/role.resource');
var skillResource = require('../resource/skill.resource');
var userToOfficeResource = require('../resource/userToOfficeConnector.resource');
var attributeResource = require('../resource/attribute.resource');
var roleToAttributeResource = require('../resource/roleToAttributeConnector.resource');
var userToSkillResource = require('../resource/userToSkillConnector.resource');
var utils = require('../utils/utils');

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
            .then(loadSkillsForUser(headers))
            .then(loadRoleForUser(headers))
            .then(setUser(model));
    };
}

function loadCurrentUser(headers) {
    return function(model) {
        return userResource.getCurrentUser(headers)
            .then(loadSkillsForUser(headers))
            .then(loadRoleForUser(headers))
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

// SKILLS
// ============================================================================

function loadSkillsForUser(headers) {
    return function(user) {
        var connectors = userToSkillResource.getUserToSkillConnectorsByUserId(user._id, headers);
        var skills = skillResource.getAllSkills(headers);
        return Promise.all([connectors, skills])
            .then(function(){
                return matchSkillsAndConnectors(skills.value(), connectors.value())
            })
            .then(setSkillsForUser(user));
    }
}

function matchSkillsAndConnectors(skills, connectors) {
    return utils.extractPropertiesFromConnectors('skillId', connectors, ['level', 'years'])
        .then(utils.matchListAndObjectIds(skills));
}

function setSkillsForUser(user) {
    return function(skills) {
        return new Promise(function(resolve) {
            user.skills = skills;
            return resolve(user);
        });
    };
}

// ROLE
// ============================================================================

function loadRoleForUser(headers) {
    return function(user) {
        return roleResource.getRoleByName(user.role, headers)
            .then(setRoleForUser(user));
    };
}

function setRoleForUser(user) {
    return function(role) {
        return new Promise(function(resolve) {
            user.role = role;
            return resolve(user);
        });
    };
}

