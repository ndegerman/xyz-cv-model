'use strict';

var officeResource = require('../resource/office.resource');
var userResource = require('../resource/user.resource');
var roleResource = require('../resource/role.resource');
var skillResource = require('../resource/skill.resource');
var fileResource = require('../resource/file.resource');
var userToOfficeResource = require('../resource/userToOfficeConnector.resource');
var attributeResource = require('../resource/attribute.resource');
var roleToAttributeResource = require('../resource/roleToAttributeConnector.resource');
var userToSkillResource = require('../resource/userToSkillConnector.resource');
var utils = require('../utils/utils');

var Promise = require('bluebird');

function getFeedTemplate() {
    return new Promise(function(resolve) {
        var template = {
            latest: {
                skills: [],
                users: []
            }
        };
        return resolve(template);
    });
}

exports.getFeedModel = function(headers) {
    var users = userResource.getAllUsers(headers);
    var skills = skillResource.getAllSkills(headers);
    return Promise.all([users, skills])
        .then(function() {
            return new Promise(function(resolve) {
                users = users.value();
                skills = skills.value();
                return getFeedTemplate()
                    .then(loadLatest(users, skills, headers))
                    .then(resolve);
            });
        });
};

// LATEST
// ============================================================================

function loadLatest(users, skills, headers) {
    return function(model) {
        return loadSkills(skills, {}, headers)
            .then(loadUsers(users, skills, headers))
            .then(utils.setFieldForObject(model, 'latest'));
    };
}

// SKILLS
// ============================================================================

function loadSkills(skills, latest, headers) {
    return skillResource.getAllSkills(headers)
        .then(takeXLatestElements(6))
        .then(utils.setFieldForObject(latest, 'skills'));
}

// USERS
// ============================================================================

function loadUsers(users, skills, headers) {
    return function(latest) {
        return userToSkillResource.getAllUserToSkillConnectors(headers)
            .then(setRealUpdatedAt(users))
            .then(takeXLatestElements(5))
            .then(loadSkillsForUsers(skills))
            .then(loadOfficeForUsers(headers))
            .then(loadProfileImageForUsers(headers))
            .then(utils.setFieldForObject(latest, 'users'))
    }
}

function setRealUpdatedAt(users) {
    return function(connectors) {
        return new Promise(function(resolve) {
            var userMap = Object.create(null);
            return Promise.each(users, function(user) {
                user.skills = [];
                userMap[user._id] = user;
            }).then(function() {
                return Promise.each(connectors, function(connector) {
                    var diff = new Date(connector.updatedAt) - new Date(userMap[connector.userId].updatedAt);
                    if (diff > 0) {
                        userMap[connector.userId].updatedAt = connector.updatedAt;
                    }
                    userMap[connector.userId].skills.push(connector)
                });
            }).then(function() {
                return Promise.map(Object.keys(userMap), function(key) {return userMap[key]});
            })
            .then(resolve)
        });
    }
}

// USER IMAGE
// ============================================================================

function loadProfileImageForUsers(headers) {
    return function(users) {
        return Promise.map(users, loadProfileImageForUser(headers))
    }
}

function loadProfileImageForUser(headers) {
    return function(user) {
        return new Promise(function(resolve) {
            if (!user.profileImage) {
                return resolve(user);
            } else {
                return fileResource.getFileById(user.profileImage, headers)
                    .then(utils.setFieldForObject(user, 'profileImage'))
                    .then(resolve);
            }
        });
    };
}

// USER SKILLS
// ============================================================================

function loadSkillsForUsers(skills) {
    return function(users) {
        return new Promise(function(resolve) {
            var skillMap = Object.create(null);
            skills.forEach(function(skill) {
                skillMap[skill._id] = skill;
            })
            return Promise.map(users, function(user) {
                return extractXBestSkills(user, 5, skillMap)
                    .then(utils.setFieldForObject(user, 'skills'));
            })
            .then(resolve);
        })
    }
}

function extractXBestSkills(user, num, skillMap) {
    return new Promise(function(resolve) {
        var connectors = user.skills.sort(function(a, b) {
            return b.level - a.level
        }).splice(0, num);
        return Promise.map(connectors, function(connector) {
            connector.name = skillMap[connector.skillId].name;
            connector.icon = skillMap[connector.skillId].icon;
            return connector;
        }).then(resolve);
    })
}

// USER OFFICE
// ============================================================================

function loadOfficeForUsers(headers) {
    return function(users) {
        return Promise.map(users, loadOfficeForUser(headers));
    }
}

function loadOfficeForUser(headers) {
    return function(user) {
        return userToOfficeResource.getUserToOfficeConnectorsByUserId(user._id, headers)
            .then(function(connectors) {
                var connector = connectors[0];
                if (connector) {
                    return officeResource.getOfficeById(connector.officeId, headers)
                        .then(utils.setFieldForObject(user, 'office'));
                }

                return utils.setFieldForObject(user, 'office')(null);
            });
    };
}

function takeXLatestElements(num) {
    return function(list) {
        return new Promise(function(resolve) {
            list.sort(function(a, b) {
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            })
            return resolve(list.splice(0, num));
        })
    }
}
