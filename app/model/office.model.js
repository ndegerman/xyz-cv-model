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

function getOfficeTemplate() {
    return new Promise(function(resolve) {
        var template = {
            office: {},
            skillFrequencyMap: {},
            graphData: {}
        };
        return resolve(template);
    });
}

exports.getOfficeModelByOfficeId = function(id, headers) {
    return getOfficeTemplate()
        .then(loadOffice(id, headers))
        .then(loadSkillFrequencyMap(headers))
        .then(loadGraphData);
};

// OFFICE
// ============================================================================

function loadOffice(id, headers) {
    return function(model) {
        return officeResource.getOfficeById(id, headers)
            .then(setOffice(model));
    };
}

function setOffice(model) {
    return function(office) {
        return new Promise(function(resolve) {
            model.office = office;
            return resolve(model);
        });
    };
}

// SKILL FREQUENCY MAP
// ============================================================================

function loadSkillFrequencyMap(headers) {
    return function(model) {
        var skills = skillResource.getAllSkills(headers);
        var userToOfficeConnectors = userToOfficeResource.getUserToOfficeConnectorsByOfficeId(model.office._id, headers);
        var userToSkillConnectors = userToSkillResource.getAllUserToSkillConnectors(headers);
        return Promise.all([skills, userToOfficeConnectors, userToSkillConnectors])
            .then(function() {
                return createSkillFrequencyMap(skills.value())
                    .then(populateSkillFrequencyMap(model, userToOfficeConnectors.value(), userToSkillConnectors.value()))
                    .then(setSkillFrequencyMap(model));
            })
    };
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

function populateSkillFrequencyMap(model, userToOfficeConnectors, userToSkillConnectors) {
    return function(map) {
        userToOfficeConnectors = utils.sortListByProperty(userToOfficeConnectors, 'userId');
        userToSkillConnectors = utils.sortListByProperty(userToSkillConnectors, 'userId');
        return Promise.all([userToOfficeConnectors, userToSkillConnectors])
            .then(function(){
                var index = 0;
                var skillConnectors = [];
                var promises = [];
                userToOfficeConnectors = userToOfficeConnectors.value();
                userToSkillConnectors = userToSkillConnectors.value();
                userToOfficeConnectors.forEach(function(userToOfficeConnector) {
                    for (var i = index; i < userToSkillConnectors.length; i++) {
                        if(userToSkillConnectors[i].userId > userToOfficeConnector.userId) {
                            index = i;
                            break;
                        }
                        if (userToSkillConnectors[i].userId < userToOfficeConnector.userId) {
                            continue;
                        }
                        skillConnectors.push(userToSkillConnectors[i]);
                    }
                    promises.push(addFrequenciesForMap(map, skillConnectors));
                    skillConnectors = [];
                })
                return Promise.all(promises)
                    .then(function() {
                        return new Promise(function(resolve) {
                            return resolve(map);
                        })
                    })
            })
    };
}

function addFrequenciesForMap(map, connectors) {
    return new Promise(function(resolve) {
        connectors.forEach(function(connector) {
            map[connector.skillId].users++;
        })
        return resolve(map)
    });
}

function setSkillFrequencyMap(model) {
    return function(map) {
        return new Promise(function(resolve) {
            model.skillFrequencyMap = map;
            return resolve(model);
        });
    };
}

// GRAPHS
// ============================================================================

function loadGraphData(model) {
    return createGraphData(model)
        .then(loadData(model))
        .then(setGraphData(model));
}

function createGraphData(model) {
    return new Promise(function(resolve) {
        var graphData = {
            labels: [],
            datasets: []
        };

        return resolve(graphData);
    });
}

function loadData(model) {
    return function(graphData) {
        return new Promise(function(resolve) {
            var dataset = {
                label: model.office.name,
                data: []
            };
            for (var key in model.skillFrequencyMap) {
                if (model.skillFrequencyMap.hasOwnProperty(key)) {
                    graphData.labels.push(model.skillFrequencyMap[key].name);
                    dataset.data.push(model.skillFrequencyMap[key].users);
                }
            }

            graphData.datasets.push(dataset);
            return resolve(graphData);
        });
    };
}

function setGraphData(model) {
    return function(graphData) {
        return new Promise(function(resolve) {
            model.graphData = graphData;
            return resolve(model);
        });
    };
}
