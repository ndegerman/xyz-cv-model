'use strict';

var userResource = require('../resource/user.resource');
var roleResource = require('../resource/role.resource');
var skillResource = require('../resource/skill.resource');
var officeResource = require('../resource/office.resource');
var assignmentResource = require('../resource/assignment.resource');
var userToSkillResource = require('../resource/userToSkillConnector.resource');
var userToOfficeResource = require('../resource/userToOfficeConnector.resource');
var userToAssignmentResource = require('../resource/userToAssignmentConnector.resource');
var config = require('config');

var utils = require('../utils/utils');
var Promise = require('bluebird');
var cacheHandler = require('../utils/cache.handler');
var errorHandler = require('../utils/error.handler');
var responseHandler = require('../utils/response.handler');
var acceptedSkills = [];

function getSearchTemplate() {
    return new Promise(function(resolve) {
        var template = {
            tagList: []
        };

        return resolve(template);
    });
}

exports.getSearchModel = function(headers) {
    return addLevelsAndYearsToCache()
        .then(getSearchTemplate)
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
            .then(loadUserToSkillConnectors(headers))
            .then(utils.convertSetToList)
            .then(utils.setFieldForObject(model, 'tagList'));
    };
}

function loadUsers(tagSet, headers) {
    return userResource.getAllUsers(headers)
        .then(utils.addFieldsFromObjects(tagSet, ['name', 'position'], 'COLLECTION_USER'));
}

function loadOffices(headers) {
    return function(tagSet) {
        return officeResource.getAllOffices(headers)
            .then(utils.addFieldsFromObjects(tagSet, ['name'], 'COLLECTION_OFFICE'));
    };
}

function loadSkills(headers) {
    return function(tagSet) {
        return skillResource.getAllSkills(headers)
            .then(utils.addFieldsFromObjects(tagSet, ['name'], 'COLLECTION_SKILL'));
    };
}

function loadRoles(headers) {
    return function(tagSet) {
        return roleResource.getAllRoles(headers)
            .then(utils.addFieldsFromObjects(tagSet, ['name'], 'COLLECTION_ROLE'));
    };
}

function loadAssignments(headers) {
    return function(tagSet) {
        return assignmentResource.getAllAssignments(headers)
            .then(utils.addFieldsFromObjects(tagSet, ['name'], 'COLLECTION_ASSIGNMENT'));
    };
}

function loadUserToSkillConnectors(headers) {
    return function(tagSet) {
        return userToSkillResource.getAllUserToSkillConnectors(headers)
            .then(utils.addFieldsFromObjects(tagSet, ['level', 'years'], 'COLLECTION_USERTOSKILL'));
    };
}

function addLevelsAndYearsToCache() {
    return new Promise(function(resolve) {
        var list = [];
        for (var i = 1; i <= 5; i++) {
            list.push(cacheHandler.softsetToTagObjectCache('level: ' + i, {COLLECTION_USERTOSKILL: []}));
        }

        for (var j = 1; j <= 50; j++) {
            list.push(cacheHandler.softsetToTagObjectCache('years: ' + j, {COLLECTION_USERTOSKILL: []}));
        }

        return Promise.all(list)
            .then(resolve);
    });
}

// RETRIEVING BY TAGS
// ===============================================================================

function getSearchSetForTags(tags, headers) {
    return function() {
        var promises = [];
        tags.forEach(function(tag) {
            promises.push(cacheHandler.getFromTagObjectCache(tag.toLowerCase())
                .then(getSearchSet(headers, tag.toLowerCase())));
        });

        return Promise.all(promises);
    };
}

exports.getObjectsForTags = function(headers, tags) {
    return new Promise(function(resolve, reject) {
        if (!tags) {
            return errorHandler.getHttpError(400)
                .then(reject);
        }

        cacheHandler.getFullTagObjectCache()
            .then(getAcceptedSkills(tags))
            .then(getSearchSetForTags(tags, headers))
            .then(utils.intersectionObjects)
            .then(resolve);
    });
};

function getSearchSet(headers, tagName) {
    return function(tag) {
        return new Promise(function(resolve) {
            if (!tag) {
                return resolve([]);
            }

            var searchResult = [];

            for (var collectionId in tag) {
                if (tag.hasOwnProperty(collectionId)) {
                    searchResult.push(getResultsForTag(tag, collectionId, tagName, headers)
                        .then(utils.spreadLists));
                }
            }

            return Promise.all(searchResult)
                .then(utils.spreadLists)
                .then(resolve);
        });
    };
}

// SWITCH
// ============================================================================
function getResultsForTag(tag, collectionId, tagName, headers) {
    return new Promise(function(resolve) {
        switch (collectionId) {
            case 'COLLECTION_ASSIGNMENT':
                return resolve(handleCollectionAssignment(tag, collectionId, tagName, headers));

            case 'COLLECTION_ATTRIBUTE':
                return resolve([]);

            case 'COLLECTION_FILE':
                return resolve([]);

            case 'COLLECTION_OFFICE':
                return resolve(handleCollectionOffice(tag, collectionId, tagName, headers));

            case 'COLLECTION_ROLE':
                return resolve(handleCollectionRole(tag, collectionId, tagName, headers));

            case 'COLLECTION_ROLETOATTRIBUTE':
                return resolve([]);

            case 'COLLECTION_SKILL':
                return resolve(handleCollectionSkill(tag, collectionId, tagName, headers));

            case 'COLLECTION_SKILLGROUP':
                return resolve([]);

            case 'COLLECTION_SKILLTOSKILLGROUP':
                return resolve([]);

            case 'COLLECTION_USER':
                return resolve(handleCollectionUser(tag, collectionId, tagName, headers));

            case 'COLLECTION_USERTOASSIGNMENT':
                return resolve([]);

            case 'COLLECTION_USERTOOFFICE':
                return resolve([]);

            case 'COLLECTION_USERTOSKILL':
                return resolve(handleCollectionUserToSkill(tag, collectionId, tagName, headers, acceptedSkills));
        }
    });
}

// HANDLING
// ===========================================================================================

function handleCollectionUserToSkill(tag, collectionId, tagName, headers, acceptedSkills) {
    return getAllGreaterIds(tagName, tag[collectionId])
        .map(function(id) {
            return getUserAndSkillFromConnector(headers, id, acceptedSkills);
        });
}

function handleCollectionUser(tag, collectionId, tagName, headers) {
    return new Promise(function(resolve) {
        var list = [];
        tag[collectionId].forEach(function(id) {
            list.push(getUserById(headers, id));
        });

        return Promise.all(list)
            .then(resolve);
    });
}

function handleCollectionSkill(tag, collectionId, tagName, headers) {
    return new Promise(function(resolve) {
        var list = [];
        tag[collectionId].forEach(function(id) {
            list.push(getUsersForSkill(headers, tagName, id));
            list.push(getSkillById(headers, id));
        });

        return Promise.all(list)
            .then(resolve);
    });
}

function handleCollectionRole(tag, collectionId, tagName, headers) {
    return new Promise(function(resolve) {
        var list = [];
        list.push(getUsersForRole(headers, tagName));

        return Promise.all(list)
            .then(resolve);

    });
}

function handleCollectionOffice(tag, collectionId, tagName, headers) {
    return new Promise(function(resolve) {
        var list = [];
        tag[collectionId].forEach(function(id) {
            list.push(getUsersForOffice(headers, tagName, id));
            list.push(getOfficeById(headers, id));
        });

        return Promise.all(list)
            .then(resolve);
    });
}

function handleCollectionAssignment(tag, collectionId, tagName, headers) {
    return new Promise(function(resolve) {
        var list = [];
        tag[collectionId].forEach(function(id) {
            list.push(getUsersForAssignment(headers, tagName, id));
            list.push(getAssignmentById(headers, id));
        });

        return Promise.all(list)
            .then(resolve);
    });
}

// GET USERS FOR ...
// ==============================================================================

function getUsersForSkill(headers, tagName, id) {
    var connectors = skillResource.getSkillById(id, headers)
        .then(function(skill) {
            return userToSkillResource.getUserToSkillConnectorsBySkillId(skill._id, headers);
        });

    var users = userResource.getAllUsers(headers);

    return Promise.all([connectors, users])
        .then(function() {
            return new Promise(function(resolve) {
                return resolve(matchUsersAndConnectors(users.value(), connectors.value()));
            });
        })
        .then(utils.sortListByProperty('level'))
        .then(utils.reverseList)
        .then(utils.setUrls(config.UI_URL + '/profile/'));
}

function getUsersForRole(headers, tagName) {
    return userResource.getAllUsers(headers)
        .then(matchUsersAndRole(tagName))
        .then(utils.setUrls(config.UI_URL + '/profile/'));
}

function getUsersForOffice(headers, tagName, id) {
    var connectors = userToOfficeResource.getUserToOfficeConnectorsByOfficeId(id, headers);
    var users = userResource.getAllUsers(headers);

    return Promise.all([connectors, users])
        .then(function() {
            return new Promise(function(resolve) {
                return resolve(matchUsersAndConnectors(users.value(), connectors.value()));
            });
        })
        .then(utils.setUrls(config.UI_URL + '/profile/'));
}

function getUsersForAssignment(headers, tagName, id) {
    var connectors = userToAssignmentResource.getUserToAssignmentConnectorsByAssignmentId(id, headers);
    var users = userResource.getAllUsers(headers);

    return Promise.all([connectors, users])
        .then(function() {
            return new Promise(function(resolve) {
                return resolve(matchUsersAndConnectors(users.value(), connectors.value()));
            });
        })
        .then(utils.setUrls(config.UI_URL + '/profile/'));
}

function getUserById(headers, id) {
    var list = [];
    list.push(userResource.getUserById(id, headers)
        .then(utils.setUrl(config.UI_URL + '/profile/')));
    return Promise.all(list);
}

// GET BY ID
// ==========================================================================================

function getSkillById(headers, id) {
    var list = [];
    list.push(skillResource.getSkillById(id, headers)
        .then(utils.setUrl(config.UI_URL + '/skill/')));
    return Promise.all(list);
}

function getAssignmentById(headers, id) {
    var list = [];
    list.push(assignmentResource.getAssignmentById(id, headers)
        .then(utils.setUrl(config.UI_URL + '/assignment/')));
    return Promise.all(list);
}

function getOfficeById(headers, id) {
    var list = [];
    list.push(officeResource.getOfficeById(id, headers)
        .then(utils.setUrl(config.UI_URL + '/office/')));
    return Promise.all(list);
}

// USERTOSKILLCONNECTOR
// ==========================================================================================

function getUserAndSkillFromConnector(headers, id, acceptedSkills) {
    var list = [];

    return userToSkillResource.getUserToSkillConnectorById(id, headers)
        .then(function(connector) {
            if (acceptedSkills.length <= 0 || acceptedSkills.indexOf(connector.skillId) >= 0) {
                list.push(userResource.getUserById(connector.userId, headers)
                    .then(utils.setUrl(config.UI_URL + '/profile/')));

                list.push(skillResource.getSkillById(connector.skillId, headers)
                    .then(utils.setUrl(config.UI_URL + '/skill/')));
            }

            return Promise.all(list);
        });
}

// MATCHING
// ===========================================================================================

function matchUsersAndRole(role) {
    return function(users) {
        return new Promise(function(resolve) {
            var list = [];
            users.forEach(function(user) {
                if (user.role === role) {
                    list.push(user);
                }
            });

            return resolve(list);
        });
    };
}

function matchUsersAndConnectors(users, connectors) {
    return new Promise(function(resolve) {
        return utils.extractPropertiesFromConnectors('userId', connectors, [])
            .then(utils.matchListAndObjectIds(users))
            .then(resolve);
    });
}

// HELPERS
// ===========================================================================================

function getAcceptedSkills(queryTags) {
    return function(allTags) {
        return new Promise(function(resolve) {
            acceptedSkills = [];
            queryTags.forEach(function(queryTag) {
                queryTag = queryTag.toLowerCase();
                if (allTags[queryTag]) {
                    for (var collectionId in allTags[queryTag]) {
                        if (collectionId === 'COLLECTION_SKILL') {
                            acceptedSkills = acceptedSkills.concat(allTags[queryTag][collectionId]);
                        }
                    }
                }
            });

            return resolve();
        });
    };
}

function getAllGreaterIds(tagName, backUp) {
    return new Promise(function(resolve) {
        var levelRegex = new RegExp(/^level: [0-9]+$/i);
        var yearsRegex = new RegExp(/^years: [0-9]+$/i);

        if (tagName.match(levelRegex)) {
            return cacheHandler.GetGreaterIds(tagName, levelRegex, 'COLLECTION_USERTOSKILL')
                .then(resolve);

        } else if (tagName.match(yearsRegex)) {
            return cacheHandler.GetGreaterIds(tagName, yearsRegex, 'COLLECTION_USERTOSKILL')
                .then(resolve);
        } else {
            return resolve(backUp);
        }
    });
}
