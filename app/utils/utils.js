'use strict';

var Promise = require('bluebird');

exports.extractPropertiesFromConnectors = function(property, connectors, extraProps) {
    return new Promise(function(resolve) {
        var list = [];
        connectors.forEach(function(connector) {
            var object = {};
            object._id = connector[property];
            if (extraProps) {
                extraProps.forEach(function(prop) {
                    object[prop] = connector[prop];
                });
            }

            list.push(object);
        });

        return resolve(list);
    });
};

exports.matchListAndObjectIds = function(list) {
    return function(objects) {
        return new Promise(function(resolve) {
            var items = [];
            objects.forEach(function(object) {
                list.some(function(item) {
                    if (object._id === item._id) {
                        items.push(mergeProperties(object, item));
                        return true;
                    }

                });
            });

            Promise.all(items)
                .then(resolve);
        });
    };
};

exports.matchIdsAndObjects = function(ids, objects) {
    return new Promise(function(resolve) {
        var items = [];
        ids.forEach(function(id) {
            objects.some(function(object) {
                if (object._id === id) {
                    items.push(object);
                    return true;
                }

            });
        });

        Promise.all(items)
            .then(resolve);
    });
};

exports.sortListByProperty = function(prop) {
    return function(list) {
        return new Promise(function(resolve) {
            list.sort(function(a, b) {
                if (a[prop] > b[prop]) {
                    return 1;
                }

                if (a[prop] < b[prop]) {
                    return -1;
                }

                return 0;
            });

            return resolve(list);
        });
    };
};

exports.reverseList = function(list) {
    return new Promise(function(resolve) {
        return resolve(list.reverse());
    });
};

exports.setFieldForObject = function(object, fieldName) {
    return function(field) {
        return new Promise(function(resolve) {
            object[fieldName] = field;
            return resolve(object);
        });
    };
};

// HELPER
// ============================================================================

function listContainsId(list, id) {
    return list.indexOf(id) > -1;
}

function mergeProperties(from, to) {
    return new Promise(function(resolve) {
        for (var prop in from) {
            if (from.hasOwnProperty(prop)) {
                to[prop] = from[prop];
            }
        }

        return resolve(to);
    });
}

