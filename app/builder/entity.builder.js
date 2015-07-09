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

exports.buildOffice = function(headers) {
    return function(office) {
        return loadUsersForOffice(office, headers);
    };
};

exports.buildUser = function(headers) {
    return function(user) {
        return loadSkillsForUser(headers, user)
            .then(loadRole(headers));
    };
};

// USERS
// ============================================================================

function loadUsersForOffice(office, headers) {
    return userToOfficeResource.getUserToOfficeConnectorsByOfficeId(office._id, headers)
        .then(getUsersByConnectors(headers))
        .then(loadSkillsForUsers(headers))
        .then(setUsers(office));
}

function getUsersByConnectors(headers) {
    return function(connectors) {
        return userResource.getAllUsers(headers)
            .then(matchUsersAndConnectors(connectors));
    };
}

function matchUsersAndConnectors(connectors) {
    return function(users) {
        return utils.extractPropertyFromConnectors('userId', connectors)
            .then(utils.matchListAndIds(users));
    };
}

function setUsers(office) {
    return function(users) {
        return new Promise(function(resolve) {
            office.users = users;
            resolve(office);
        });
    };
}

// SKILLS
// ============================================================================

function loadSkillsForUser(headers, user) {
    return userToSkillResource.getUserToSkillConnectorsByUserId(user._id, headers)
        .then(getSkillsByConnectors(headers))
        .then(setSkills(user));
}

function loadSkillsForUsers(headers) {
    return function(users) {
        return skillResource.getAllSkills(headers)
            .then(loadSkillsForUsersWithSkills(headers, users));
    };
}

function loadSkillsForUsersWithSkills(headers, users) {
    return function(skills) {
        var promises = [];
        users.forEach(function(user) {
            promises.push(userToSkillResource.getUserToSkillConnectorsByUserId(user._id, headers)
                .then(getSkillsByConnectorsWithSkills(headers, skills))
                .then(setSkills(user)));
        });

        return Promise.all(promises);
    };
}

function getSkillsByConnectors(headers) {
    return function(connectors) {
        return skillResource.getAllSkills(headers)
            .then(matchSkillsAndConnectors(connectors));
    };
}

function getSkillsByConnectorsWithSkills(headers, skills) {
    return function(connectors) {
        return utils.extractPropertyFromConnectors('skillId', connectors)
            .then(utils.matchListAndIds(skills));
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
        return new Promise(function(resolve) {
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
        return new Promise(function(resolve) {
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
        return new Promise(function(resolve) {
            role.attributes = attributes;
            return resolve(role);
        });
    };
}

