'use strict';

var userResource = require('../resource/user.resource');
var skillResource = require('../resource/skill.resource');
var officeResource = require('../resource/office.resource');
var userToSkillConnector = require('../resource/userToSkillConnector.resource');
var userToOfficeConnector = require('../resource/userToOfficeConnector.resource');
var Promise = require('bluebird');

exports.getExportModel = function(headers) {
    return getExportTemplate()
        .then(setCompetence(headers))
        .then(setOfficeNames(headers));
};

function setOfficeNames(headers) {
    return function(model) {
        var officeNamesObj;
        return officeResource.getAllOffices(headers)
            .then(function(officeObjects) {
                var allOfficeNames = [];
                officeObjects.map(function(office) {
                    allOfficeNames.push(office.name);
                });

                officeNamesObj = {offices: allOfficeNames};
                model.offices.push(officeNamesObj);
                return model;
            });
    };
}

function getExportTemplate(users) {
    return new Promise(function(resolve) {
        var template = {
            competence: [],
            offices: [],
            skills: []
        };
        return resolve(template);
    });
}

function getOfficeIdByUserId(officeConnector, userId) {
    var officeId;

    for (var i = 0; i < officeConnector.length; i++) {
        if (officeConnector[i].userId === userId) {
            officeId = officeConnector[i].officeId;
            break;
        }
    }

    return officeId;
}

function getOfficeNameForUser(officeConnector, offices, userId) {
    var officeName = '';
    var officeId = getOfficeIdByUserId(officeConnector, userId);

    for (var i = 0; i < offices.length; i++) {
        if (offices[i]._id === officeId) {
            officeName = offices[i].name;
            break;
        }
    }

    return officeName;
}

function getSkillLevelForUser(userToSkillConnector, userId, skillId) {
    var level = '';

    for (var i = 0; i < userToSkillConnector.length; i++) {
        if (userId === userToSkillConnector[i].userId && skillId === userToSkillConnector[i].skillId) {
            level = userToSkillConnector[i].level;
            break;
        }
    }

    return level;
}

function getListOfUsersWithLevelForSkill(users, connectors, offices, skill, userToOfficeConnectors) {
    var userList = [];
    var userLevel;
    var officeNameForUser;
    var userObj;

    users.map(function(user) {
        userLevel = getSkillLevelForUser(connectors, user._id, skill._id);
        officeNameForUser = getOfficeNameForUser(userToOfficeConnectors, offices, user._id);
        userObj = {name: user.name, level: userLevel, office: officeNameForUser, userId: user._id};
        userList.push(userObj);
    });

    return userList;
}

function setCompetence(headers) {
    return function(model) {

        var connectors = userToSkillConnector.getAllUserToSkillConnectors(headers);
        var userToOfficeConnectors = userToOfficeConnector.getAllUserToOfficeConnectors(headers);
        var users = userResource.getAllUsers(headers);
        var skills = skillResource.getAllSkills(headers);
        var offices = officeResource.getAllOffices(headers);
        var allSkillNames = [];
        var skillNamesObj;
        var skillObj;

        return Promise.all([connectors, users, skills, userToOfficeConnectors, offices])
            .then(function() {
                users = users.value();
                connectors = connectors.value();
                skills = skills.value();
                offices = offices.value();
                userToOfficeConnectors = userToOfficeConnectors.value();

                skills.map(function(skill) {
                    var userList = getListOfUsersWithLevelForSkill(users, connectors, offices, skill, userToOfficeConnectors);
                    allSkillNames.push(skill.name);
                    skillObj = {skill: skill.name, users: userList};
                    model.competence.push(skillObj);
                });

                skillNamesObj = {skills: allSkillNames};

                model.skills.push(skillNamesObj);
                return model;
            });
    };
}
