'use strict';

var Promise = require('bluebird');

exports.extractPropertyFromConnectors = function(property, connectors) {
    return new Promise(function(resolve) {
        var ids = [];
        connectors.forEach(function(connector) {
            ids.push(connector[property]);
        });

        return resolve(ids);
    });
};

exports.matchListAndIds = function(list) {
    return function(ids) {
        return new Promise(function(resolve) {
            var items = list.filter(function(item) {
                return listContainsId(ids, item._id);
            });

            return resolve(items);
        });
    };
};

exports.sortListByProperty = function(list, prop) {
    return new Promise(function(resolve) {
        list.sort(function(a, b) {
            if (a[prop] > b[prop]) {
                return 1;
            }
            if (a[prop] < b[prop]) {
                return -1;
            }
            return 0;
        })
        return resolve(list);
    });
}

// HELPER
// ============================================================================

function listContainsId(list, id) {
    return list.indexOf(id) > -1;
}
