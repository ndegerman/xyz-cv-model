'use strict';

var userResource = require('../resource/user.resource');
var roleResource = require('../resource/role.resource');
var skillResource = require('../resource/skill.resource');
var attributeResource = require('../resource/attribute.resource');
var roleToAttributeResource = require('../resource/roleToAttributeConnector.resource');
var userToSkillResource = require('../resource/userToSkillConnector.resource');
var utils = require('../utils/utils');

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
        .then(loadSkills(headers))
        .then(loadRole(headers))
        .then(getProfileTemplate);
};

exports.getCurrentProfile = function(headers) {
    return userResource.getCurrentUser(headers)
        .then(loadSkills(headers))
        .then(loadRole(headers))
        .then(getProfileTemplate);
};

// SKILLS
// ============================================================================

function loadSkills(headers) {
    return function(user) {
        return userToSkillResource.getUserToSkillConnectorsByUserId(user._id, headers)
            .then(getSkillsByConnectors(headers))
            .then(setSkills(user));
    };
}

function getSkillsByConnectors(headers) {
    return function(connectors) {
        return skillResource.getAllSkills(headers)
            .then(matchSkillsAndConnectors(connectors));
    };
}

function matchSkillsAndConnectors(connectors) {
    return function(skills) {
        return utils.extractPropertyFromConnectors('skillId', connectors)
            .then(utils.matchListAndIds(skills));
    };
}

function setSkills(user) {
    return function(skills) {
        return q.promise(function(resolve) {
            user.skills = skills;
            return resolve(user);
        });
    };
}

// ROLE
// ============================================================================

function loadRole(headers) {
    return function(user) {
        return roleResource.getRoleByName(user.role, headers)
            .then(loadAttributes(headers))
            .then(setRole(user));
    };
}

function setRole(user) {
    return function(role) {
        return q.promise(function(resolve) {
            user.role = role;
            return resolve(user);
        });
    };
}

// Attributes
// ============================================================================

function loadAttributes(headers) {
    return function(role) {
        return roleToAttributeResource.getRoleToAttributeConnectorsByRoleId(role._id, headers)
            .then(getAttributesByConnectors(headers))
            .then(setAttributes(role));
    };
}

function getAttributesByConnectors(headers) {
    return function(connectors) {
        return attributeResource.getAllAttributes(headers)
            .then(matchAttributesAndConnectors(connectors));
    };
}

function matchAttributesAndConnectors(connectors) {
    return function(attributes) {
        return utils.extractPropertyFromConnectors('attributeId', connectors)
            .then(utils.matchListAndIds(attributes));
    };
}

function setAttributes(role) {
    return function(attributes) {
        return q.promise(function(resolve) {
            role.attributes = attributes;
            return resolve(role);
        });
    };
}

