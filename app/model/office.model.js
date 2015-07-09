'use strict';

var userResource = require('../resource/user.resource');
var officeResource = require('../resource/office.resource');
var skillResource = require('../resource/skill.resource');
var builder = require('../builder/entity.builder');

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
            .then(builder.buildOffice(headers))
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
        return skillResource.getAllSkills(headers)
            .then(createSkillFrequencyMap)
            .then(populateSkillFrequencyMap(model))
            .then(setSkillFrequencyMap(model));
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

function populateSkillFrequencyMap(model) {
    return function(map) {
        return new Promise(function(resolve) {
            model.office.users.forEach(function(user) {
                user.skills.forEach(function(skill) {
                    map[skill._id].users++;
                });
            });

            return resolve(map);
        });
    };
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
