'use strict';

var userResource = require('../resource/user.resource');
var officeResource = require('../resource/office.resource');
var userToOfficeConnector = require('../resource/userToOfficeConnector.resource');

var Promise = require('bluebird');

exports.getPeopleModel = function(headers) {
    return getPeopleTemplate()
        .then(setPersons(headers));
};

function getPeopleTemplate(users) {
    return new Promise(function(resolve) {
        var template = {
            people: [],
            office: []
        };
        return resolve(template);
    });
}

function setPersons(headers) {
    return function(model) {

        var connectors = userToOfficeConnector.getAllUserToOfficeConnectors(headers);
        var users = userResource.getAllUsers(headers);
        var offices = officeResource.getAllOffices(headers);

        return Promise.all([connectors, users, offices]).then(function() {
            users = users.value();
            connectors = connectors.value();
            offices = offices.value();

            offices.map(function(office) {
                model.office.push(office.name);
            });

            users.map(function(user) {
                var position = connectors.map(function(e) { return e.userId; }).indexOf(user._id);
                if (position < 0) {
                    model.people.push(JSON.parse(JSON.stringify({user: user, office: null})));
                } else {
                    offices.map(function(office) {
                        if (office._id === connectors[position].officeId) {
                            model.people.push(JSON.parse(JSON.stringify({user: user, office: office})));
                        }
                    });
                }
            });

        }).then(function() {
            return model;
        });
    };
}
