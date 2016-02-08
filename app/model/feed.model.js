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
    var user = userResource.getCurrentUser(headers);
    var offices = officeResource.getAllOffices(headers);
    var userToSkillConnectors = userToSkillResource.getAllUserToSkillConnectors(headers);
    return Promise.all([users, skills, user, offices, userToSkillConnectors])
        .then(function() {
            return new Promise(function(resolve) {
                users = users.value();
                skills = skills.value();
                user = user.value();
                offices = offices.value();
                userToSkillConnectors = userToSkillConnectors.value();
                return getFeedTemplate()
                    .then(loadLatest(users, skills, userToSkillConnectors, headers))
                    .then(loadViews(skills, offices, user, userToSkillConnectors, users, headers))
                    .then(resolve);
            });
        });
};

// LATEST
// ============================================================================

function loadLatest(users, skills, userToSkillConnectors, headers) {
    return function(model) {
        return loadSkills(skills, {}, headers)
            .then(loadUsers(users, skills, userToSkillConnectors, headers))
            .then(utils.setFieldForObject(model, 'latest'));
    };
}

// LATEST SKILLS
// ============================================================================

function loadSkills(skills, latest, headers) {
    return takeXLatestElements(10)(skills)
        .then(utils.setFieldForObject(latest, 'skills'));
}

// LATEST USERS
// ============================================================================

function loadUsers(users, skills, userToSkillConnectors, headers) {
    return function(latest) {
        return setRealUpdatedAt(users)(userToSkillConnectors)
            .then(takeXLatestElements(5))
            .then(loadSkillsForUsers(skills))
            .then(loadOfficeForUsers(headers))
            .then(loadProfileImageForUsers(headers))
            .then(utils.setFieldForObject(latest, 'users'));
    };
}

function setRealUpdatedAt(users) {
    return function(connectors) {
        return new Promise(function(resolve) {
            var userMap = Object.create(null);
            return Promise.map(users, function(user) {
                user.skills = [];
                userMap[user._id] = user;
            }).then(function() {
                return Promise.each(connectors, function(connector) {
                    if(!userMap[connector.userId]){
                        // TODO: connector but no user..
                        return;
                    }
                    var diff = new Date(connector.updatedAt) - new Date(userMap[connector.userId].updatedAt);
                    if (diff > 0) {
                        userMap[connector.userId].updatedAt = connector.updatedAt;
                    }

                    userMap[connector.userId].skills.push(connector);
                });
            }).then(function() {
                return Promise.map(Object.keys(userMap), function(key) {return userMap[key];});
            })
            .then(resolve);
        });
    };
}

// USER IMAGE
// ============================================================================

function loadProfileImageForUsers(headers) {
    return function(users) {
        return Promise.map(users, loadProfileImageForUser(headers));
    };
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
            });

            return Promise.map(users, function(user) {
                return extractXBestSkills(user, 5, skillMap)
                    .then(utils.setFieldForObject(user, 'skills'));
            })
            .then(resolve);
        });
    };
}

function extractXBestSkills(user, num, skillMap) {
    return new Promise(function(resolve) {
        var connectors = user.skills.sort(function(a, b) {
            return b.level - a.level;
        }).slice(0, num);
        return Promise.map(connectors, function(connector) {
            if(skillMap[connector.skillId] === undefined) {
            }
            connector.name = skillMap[connector.skillId].name;
            connector.icon = skillMap[connector.skillId].icon;
            return connector;
        }).then(resolve);
    });
}

// USER OFFICE
// ============================================================================

function loadOfficeForUsers(headers) {
    return function(users) {
        return Promise.map(users, loadOfficeForUser(headers));
    };
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

// VIEWS
// ============================================================================

function loadViews(skills, offices, user, userToSkillConnectors, users, headers) {
    return function(model) {
        return loadMostRepresentedSkillsView(skills, user, userToSkillConnectors, headers)({})
            .then(loadOfficePopulationView(offices, users, headers))
            .then(utils.setFieldForObject(model, 'views'));
    };
}

function loadMostRepresentedSkillsView(skills, user, userToSkillConnectors, headers) {
    return function(views) {
        return userToOfficeResource.getUserToOfficeConnectorsByUserId(user._id, headers)
            .then(function(connectors) {
                return loadSkillFrequencyMap(skills, connectors, userToSkillConnectors, headers)({})
                    .then(loadSkillGraphData)
                    .then(utils.setFieldForObject(views, 'mostRepresentedSkillsView'));
            });
    };
}

function loadOfficePopulationView(offices, users, headers) {
    return function(views) {
        return loadUserOfficeFrequencyMap(offices, users, headers)({})
            .then(loadOfficeGraphData)
            .then(utils.setFieldForObject(views, 'officePopulationView'));
    };
}

// USER OFFICE FREQUENCY MAP
// ============================================================================

function loadUserOfficeFrequencyMap(offices, users, headers) {
    return function(view) {
        return createUserOfficeFrequencyMap(offices)
            .then(populateUserOfficeFrequencyMap(users, headers))
            .then(utils.setFieldForObject(view, 'userOfficeFrequencyMap'));
    };
}

function createUserOfficeFrequencyMap(offices) {
    return Promise.reduce(offices, function(map, office) {
        office.users = 0;
        map[office._id] = office;
        return map;
    }, {});
}

function populateUserOfficeFrequencyMap(users, headers) {
    return function(map) {
        var connectors = userToOfficeResource.getAllUserToOfficeConnectors(headers);
        var userMap = getUserMap(users);
        return Promise.all([connectors, userMap])
            .then(function() {
                connectors = connectors.value();
                userMap = userMap.value();
                return Promise.reduce(connectors, function(map, connector) {
                    if (map[connector.officeId]) {
                        map[connector.officeId].users++;
                    }
                    if (userMap[connector.userId]) {
                        delete userMap[connector.userId];
                    }
                    return map;
                }, map)
                .then(setNoOfficeUsers(userMap));
            });
    };
}

function getUserMap(users) {
    return Promise.reduce(users, function(map, user) {
        map[user._id] = user;
        return map;
    }, {});
}

function setNoOfficeUsers(userMap) {
    return function(officeMap) {
        return new Promise(function(resolve) {
            officeMap.none = {
                users: Object.keys(userMap).length,
                name: 'No Office'
            };
            return resolve(officeMap);
        });
    };
}

// SKILL FREQUENCY MAP
// ============================================================================

function loadSkillFrequencyMap(skills, currentUserToOfficeConnectors, userToSkillConnectors, headers) {
    return function(view) {
        return new Promise(function(resolve) {
            if (currentUserToOfficeConnectors.length) {
                //return loadOfficeSkillFrequencyMap(skills, currentUserToOfficeConnectors[0], userToSkillConnectors, headers)
                return loadCompanySkillFrequencyMap(skills, userToSkillConnectors, headers)
                    .then(resolve);
            } else {
                return loadCompanySkillFrequencyMap(skills, userToSkillConnectors, headers)
                    .then(resolve);
            }
        }).then(utils.setFieldForObject(view, 'skillFrequencyMap'));
    };
}

function loadOfficeSkillFrequencyMap(skills, currentUserToOfficeConnector, userToSkillConnectors, headers) {
        var userToOfficeConnectors = userToOfficeResource.getUserToOfficeConnectorsByOfficeId(currentUserToOfficeConnector.officeId, headers);
        return Promise.all([userToOfficeConnectors])
            .then(function() {
                return takeXMostRepresentedSkills(7, skills)
                    .then(createSkillFrequencyMap)
                    .then(populateOfficeSkillFrequencyMap(userToOfficeConnectors.value(), userToSkillConnectors));
            });
}

function loadCompanySkillFrequencyMap(skills, userToSkillConnectors, headers) {
    var userToOfficeConnectors = userToOfficeResource.getAllUserToOfficeConnectors(headers);
    return Promise.all([userToOfficeConnectors])
        .then(function() {
            return takeXMostRepresentedSkills(7, skills)
                .then(createSkillFrequencyMap)
                .then(populateCompanySkillFrequencyMap(userToOfficeConnectors.value(), userToSkillConnectors));
        });
}

function createSkillFrequencyMap(skills) {
    return new Promise(function(resolve) {
        var map = {};
        skills.forEach(function(skill) {
            skill.users = 0;
            map[skill._id] = skill;
        });

        return resolve(map);
    });
}

function populateOfficeSkillFrequencyMap(userToOfficeConnectors, userToSkillConnectors) {
    return function(map) {
        userToOfficeConnectors = utils.sortListByProperty('userId')(userToOfficeConnectors);
        userToSkillConnectors = utils.sortListByProperty('userId')(userToSkillConnectors);
        return Promise.all([userToOfficeConnectors, userToSkillConnectors])
            .then(function() {
                var index = 0;
                var skillConnectors = [];
                var promises = [];
                userToOfficeConnectors = userToOfficeConnectors.value();
                userToSkillConnectors = userToSkillConnectors.value();
                userToOfficeConnectors.forEach(function(userToOfficeConnector) {
                    for (var i = index; i < userToSkillConnectors.length; i++) {
                        if (userToSkillConnectors[i].userId > userToOfficeConnector.userId) {
                            index = i;
                            break;
                        }

                        if (userToSkillConnectors[i].userId < userToOfficeConnector.userId) {
                            continue;
                        }

                        if (map[userToSkillConnectors[i].skillId]) {
                            skillConnectors.push(userToSkillConnectors[i]);
                        }
                    }

                    promises.push(addFrequenciesForMap(map, skillConnectors));
                    skillConnectors = [];
                });

                return Promise.all(promises)
                    .then(function() {
                        return map;
                    });
            });
    };
}

function populateCompanySkillFrequencyMap(userToOfficeConnectors, userToSkillConnectors) {
    return function(map) {
        return Promise.each(userToSkillConnectors, function(connector) {
            if (map[connector.skillId]) {
                map[connector.skillId].users++;
            }
        }).then(function() {
            return map;
        });
    };
}

function addFrequenciesForMap(map, connectors) {
    return new Promise(function(resolve) {
        connectors.forEach(function(connector) {
            map[connector.skillId].users++;
        });

        return resolve(map);
    });
}

// SKILL GRAPHS
// ============================================================================

function loadSkillGraphData(view) {
    return createGraphData()
        .then(loadData(view.skillFrequencyMap, 'Softhouse'))
        .then(utils.setFieldForObject(view, 'skillFrequencyGraph'));
}

// OFFICE GRAPHS
// ============================================================================

function loadOfficeGraphData(view) {
    return createPieGraphData()
        .then(loadPieData(view.userOfficeFrequencyMap, 'User Office frequency Map'))
        .then(utils.setFieldForObject(view, 'userOfficeFrequencyGraph'));
}

// GRAPHS
// ============================================================================

function createGraphData() {
    return new Promise(function(resolve) {
        var graphData = {
            labels: [],
            datasets: []
        };

        return resolve(graphData);
    });
}

function loadData(frequencyMap, label, pieChart) {
    return function(graphData) {
        return new Promise(function(resolve) {
            var dataset = {
                label: label,
                data: []
            };
            for (var key in frequencyMap) {
                if (frequencyMap.hasOwnProperty(key)) {
                    graphData.labels.push(frequencyMap[key].name);
                    dataset.data.push(frequencyMap[key].users);
                }
            }

            graphData.datasets.push(dataset);
            return resolve(graphData);
        });
    };
}

function createPieGraphData() {
    return new Promise(function(resolve) {
        var graphData = [];

        return resolve(graphData);
    });
}

function loadPieData(frequencyMap, label, pieChart) {
    return function(graphData) {
        return new Promise(function(resolve) {
            var dataset = {
                label: label,
                value: 0
            };
            for (var key in frequencyMap) {
                if (frequencyMap.hasOwnProperty(key)) {
                    graphData.push({
                        label: frequencyMap[key].name,
                        value: frequencyMap[key].users
                    });
                }
            }
            return resolve(graphData);
        });
    };
}

function takeXMostRepresentedSkills(num, skills) {
    // TODO: Hardcoded for now
    return Promise.filter(skills, function(skill) {
            switch (skill.name) {
                case 'Java':
                    return true;

                case 'C++':
                    return true;

                case 'C':
                    return true;

                case 'C#':
                    return true;

                case 'Javascript':
                    return true;

                case 'Python':
                    return true;

                case 'Ruby':
                    return true;

                default:
                    return false;
            }
    });
}

function takeXLatestElements(num) {
    return function(list) {
        return new Promise(function(resolve) {
            list.sort(function(a, b) {
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            });

            return resolve(list.slice(0, num));
        });
    };
}
