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
var profileModel = require('./profile.model');

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
            .then(utils.setFieldForObject(model, 'tagList'))
            .then(fillUserOfficeCache(headers));
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

// FILL USEROFFICE CACHE
// =====================================================================

function fillUserOfficeCache(headers) {
    return function(tagSet) {
        return new Promise(function(resolve) {
            return setUserOfficeCache(headers)
                .then(function() {
                    return resolve(tagSet);
                });
        });
    };
}

function setUserOfficeCache(headers) {
    var offices = officeResource.getAllOffices(headers);
    var connectors = userToOfficeResource.getAllUserToOfficeConnectors(headers);
    var users = userResource.getAllUsers(headers);

    return Promise.all([offices, connectors, users])
        .then(function() {
            return Promise.map(users.value(), function(user) {
                return getOfficeIdForUser(user, connectors.value())
                    .then(getOfficeNameById(offices.value()))
                    .then(function(officeName) {
                        return cacheHandler.setToUserOfficeCache(user._id, officeName);
                    });
            });
        });
}

function getOfficeIdForUser(user, connectors) {
    return new Promise(function(resolve) {
        var officeId = null;
        connectors.some(function(connector) {
            if (connector.userId === user._id) {
                officeId = connector.officeId;
                return true;
            }
        });

        return resolve(officeId);
    });
}

function getOfficeNameById(offices) {
    return function(id) {
        return new Promise(function(resolve) {
            var name = null;
            if (id === null) {
                return resolve(name);
            } else {
                offices.some(function(office) {
                    if (office._id === id) {
                        name = office.name;
                        return true;
                    }
                });

                return resolve(name);
            }
        });
    };
}

// RETRIEVING BY TAGS
// ===============================================================================

exports.getObjectsForTags = function(headers, tags, fullSearch) {
    return new Promise(function(resolve, reject) {
        if (!tags || tags.length === 0) {
            return userResource.getAllUsers(headers)
                .then(resolve);
        }

        return getSearchSetForTags(tags, headers, fullSearch)
            .then(utils.intersectionObjects)
            .then(resolve);
    });
};

exports.getObjectsForTag = function(headers, tag) {
    return new Promise(function(resolve, reject) {
        if (!tag || tag.length > 1) {
            return errorHandler.getHttpError(400)
                .then(reject);
        }

        exports.getObjectsForTags(headers, tag, true)
            .then(resolve);
    });
};

// FILTER BY SKILLS
// =================================================================================

exports.filterBySkills = function(headers, refinedList) {
    return function(users) {
        return new Promise(function(resolve) {
            if (!refinedList || refinedList.length === 0 || refinedList[0].name === '') {
                return resolve(users);
            } else {
                return resolve(filterUsersBySkill(headers, refinedList, 0)(users));
            }
        });
    };
};

function filterUsersBySkill(headers, refinedList, index) {
    return function(users) {
        return new Promise(function(resolve) {
            if (refinedList.length <= index) {
                return resolve(users);
            } else {
                var currentSkill = refinedList[index];
                return cacheHandler.getFromTagObjectCache(currentSkill.name.toLowerCase())
                    .then(getConnectorsForSkillObject(headers))
                    .then(filterConnectorsByCriteria({level: currentSkill.level, years: currentSkill.years}))
                    .then(matchUsersAndConnectorsCurry(users))
                    .then(filterUsersBySkill(headers, refinedList, index + 1))
                    .then(resolve)
                    .catch(function() {
                        return resolve([]);
                    });
            }
        });
    };
}

// FILTER BY  ROLES
// ====================================================================================

exports.filterByRoles = function(refinedRole) {
    return function(users) {
        return new Promise(function(resolve) {
            if (!refinedRole || refinedRole.length === 0) {
                return resolve(users);
            } else {
                var list = [];
                users.forEach(function(user) {
                    if (user.role === refinedRole) {
                        list.push(user);
                    }
                });

                return resolve(list);
            }
        });
    };
};

// FILTER BY OFFICES
// =========================================================================================

exports.filterByOffices = function(headers, refinedOffices) {
    return function(users) {
        return new Promise(function(resolve) {
            if (!refinedOffices || refinedOffices.length === 0) {
                return setOfficesOnUsers(users)
                    .then(resolve);
            } else {
                return resolve(filterUsersByOffices(users, headers, refinedOffices));
            }
        });
    };
};

function setOfficesOnUsers(users) {
    return Promise.map(users, function(user) {
        return cacheHandler.getFromUserOfficeCache(user._id)
            .then(function(officeName) {
                return new Promise(function(resolve) {
                    user.office = officeName;
                    return resolve(user);
                });
            });
    });
}

function filterUsersByOffices(users, headers, refinedOffices) {
    return setOfficesOnUsers(users)
        .filter(function(user) {
            if (!user.office || refinedOffices.indexOf(user.office) <= -1) {
                return false;
            }

            return true;
        });
}

// FILTER BY ASSIGNMENTS
// ============================================================================================

exports.filterByAssignments = function(headers, refinedAssignments) {
    return function(users) {
        return new Promise(function(resolve) {
            if (!refinedAssignments || refinedAssignments.length === 0) {
                return resolve(users);
            } else {
                return resolve(filterUsersByAssignments(headers, refinedAssignments, 0)(users));
            }
        });
    };
};

function filterUsersByAssignments(headers, refinedAssignments, index) {
    return function(users) {
        return new Promise(function(resolve) {
            if (refinedAssignments.length <= index) {
                return resolve(users);
            } else {
                var currentAssignment = refinedAssignments[index];
                return userToAssignmentResource.getUserToAssignmentConnectorsByAssignmentId(currentAssignment, headers)
                    .then(matchUsersAndConnectorsCurry(users))
                    .then(filterUsersByAssignments(headers, refinedAssignments, index + 1))
                    .then(resolve);
            }
        });
    };
}

//
// ============================================================================================

function getConnectorsForSkillObject(headers) {
    return function(skillObject) {
        return new Promise(function(resolve, reject) {
            if (!skillObject || skillObject.length === 0) {
                return reject();
            }

            var connectors = [];
            var list = [];
            skillObject.forEach(function(collectionIdObject) {
                for (var collectionId in collectionIdObject) {
                    if (collectionIdObject.hasOwnProperty(collectionId)) {
                        if (collectionId.match('COLLECTION_SKILL')) {
                            list = collectionIdObject[collectionId];
                        }
                    }
                }

            });

            if (list.length === 0) {
                return reject();
            }

            list.forEach(function(id) {
                connectors.push(userToSkillResource.getUserToSkillConnectorsBySkillId(id, headers));
            });

            return Promise.all(connectors)
                .then(utils.spreadLists)
                .then(resolve);
        });
    };
}

function filterConnectorsByCriteria(criteriaObject) {
    return function(connectors) {
        return new Promise(function(resolve) {
            var list = [];
            connectors.forEach(function(connector) {
                if (isGreaterConnector(connector, criteriaObject)) {
                    list.push(connector);
                }
            });

            return Promise.all(list)
                .then(resolve);
        });
    };
}

function matchUsersAndConnectorsCurry(users) {
    return function(connectors) {
        return matchUsersAndConnectors(users, connectors);
    };
}

function isGreaterConnector(connector, criteriaObject) {
    for (var field in criteriaObject) {
        if (connector[field] < criteriaObject[field]) {
            return false;
        }
    }

    return true;
}

//
// =====================================================================================

function getSearchSetForTags(tags, headers, fullSearch) {
    var promises = [];
    tags.forEach(function(tag) {
        promises.push(cacheHandler.getFromTagObjectCache(tag.toLowerCase())
            .then(getSearchSet(headers, tag.toLowerCase(), fullSearch)));
    });

    return Promise.all(promises);
}

function getSearchSet(headers, tagName, fullSearch) {
    return function(tagList) {
        return new Promise(function(resolve) {
            if (!tagList) {
                return resolve([]);
            }

            var searchResult = [];
            tagList.forEach(function(tag) {
                for (var collectionId in tag) {
                    if (tag.hasOwnProperty(collectionId)) {
                        searchResult.push(getResultsForTag(tag, collectionId, tagName, headers, fullSearch)
                            .then(utils.spreadLists));
                    }
                }
            });

            return Promise.all(searchResult)
                .then(utils.spreadLists)
                .then(resolve);
        });
    };
}

// SWITCH
// ============================================================================
function getResultsForTag(tag, collectionId, tagName, headers, fullSearch) {
    return new Promise(function(resolve) {
        switch (collectionId) {
            case 'COLLECTION_ASSIGNMENT':
                return resolve(handleCollectionAssignment(tag, collectionId, tagName, headers, fullSearch));

            case 'COLLECTION_ATTRIBUTE':
                return resolve([]);

            case 'COLLECTION_FILE':
                return resolve([]);

            case 'COLLECTION_OFFICE':
                return resolve(handleCollectionOffice(tag, collectionId, tagName, headers, fullSearch));

            case 'COLLECTION_ROLE':
                return resolve(handleCollectionRole(tag, collectionId, tagName, headers, fullSearch));

            case 'COLLECTION_SKILL':
                return resolve(handleCollectionSkill(tag, collectionId, tagName, headers, fullSearch));

            case 'COLLECTION_SKILLGROUP':
                return resolve([]);

            case 'COLLECTION_USER':
                return resolve(handleCollectionUser(tag, collectionId, tagName, headers, fullSearch));
        }
    });
}

// HANDLING
// ===========================================================================================

function handleCollectionUser(tag, collectionId, tagName, headers, fullSearch) {
    return new Promise(function(resolve) {
        var list = [];
        tag[collectionId].forEach(function(id) {
            list.push(getUserById(headers, id));
        });

        return Promise.all(list)
            .then(resolve);
    });
}

function handleCollectionSkill(tag, collectionId, tagName, headers, fullSearch) {
    return new Promise(function(resolve) {
        var list = [];
        tag[collectionId].forEach(function(id) {
            list.push(getUsersForSkill(headers, tagName, id));
            if (fullSearch) {
                list.push(getSkillById(headers, id));
            }
        });

        return Promise.all(list)
            .then(resolve);
    });
}

function handleCollectionRole(tag, collectionId, tagName, headers, fullSearch) {
    return new Promise(function(resolve) {
        var list = [];
        list.push(getUsersForRole(headers, tagName));

        return Promise.all(list)
            .then(resolve);

    });
}

function handleCollectionOffice(tag, collectionId, tagName, headers, fullSearch) {
    return new Promise(function(resolve) {
        var list = [];
        tag[collectionId].forEach(function(id) {
            list.push(getUsersForOffice(headers, tagName, id));
            if (fullSearch) {
                list.push(getOfficeById(headers, id));
            }
        });

        return Promise.all(list)
            .then(resolve);
    });
}

function handleCollectionAssignment(tag, collectionId, tagName, headers, fullSearch) {
    return new Promise(function(resolve) {
        var list = [];
        tag[collectionId].forEach(function(id) {
            list.push(getUsersForAssignment(headers, tagName, id));
            if (fullSearch) {
                list.push(getAssignmentById(headers, id));
            }
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
