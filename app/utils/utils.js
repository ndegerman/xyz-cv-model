'use strict';

var q = require('q');

exports.extractPropertyFromConnectors = function(property, connectors) {
    return q.promise(function(resolve) {
        var ids = [];
        connectors.forEach(function(connector) {
            ids.push(connector[property]);
        });

        return resolve(ids);
    });
};

exports.matchListAndIds = function(list) {
    return function(ids) {
        return q.promise(function(resolve) {
            var items = list.filter(function(item) {
                return listContainsId(ids, item._id);
            });

            return resolve(items);
        });
    };
};

// HELPER
// ============================================================================

function listContainsId(list, id) {
    return list.indexOf(id) > -1;
}
