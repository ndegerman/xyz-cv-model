'use strict';

/**
 * Module dependencies.
 */
var Promise = require('bluebird');
var NodeCache = require('node-cache');
var utils = require('./utils');

// Cache
var tagObjectCache = new NodeCache({stdTTL: 0, useClones: false});
var userOfficeCache = new NodeCache({stdTTL: 0});

// TAGOBJECT CACHE
// =================================================================================

exports.setToTagObjectCache = function(tag, object) {
    return tagObjectCache.set(tag, object);
};

exports.getFromTagObjectCache = function(tag) {
    return new Promise(function(resolve) {
        var list = [];
        return exports.getFullTagObjectCache()
            .then(function(fullCache) {
                return new Promise(function(resolve) {
                    for (var cacheTag in fullCache) {
                        if (fullCache.hasOwnProperty(cacheTag)) {
                            if (cacheTag.toLowerCase() === tag.toLowerCase()) {
                                list.push(fullCache[cacheTag]);
                            }
                        }
                    }

                    return resolve(list);
                });
            })
            .then(resolve);
    });
};

exports.clearTagObjectCache = function() {
    return tagObjectCache.flushAll();
};

exports.softsetToTagObjectCache = function(tag, object) {
    return new Promise(function(resolve) {
        tag = tag.toLowerCase();
        var currentContent = tagObjectCache.get(tag);
        if (!currentContent) {
            tagObjectCache.set(tag, object);
            return resolve();
        } else {
            for (var collectionId in object) {
                if (currentContent.hasOwnProperty(collectionId)) {
                    currentContent[collectionId] = utils.uniq(object[collectionId].concat(currentContent[collectionId]));
                } else {
                    currentContent[collectionId] = object[collectionId];
                }
            }

            return resolve();
        }
    });
};

exports.getFullTagObjectCache = function() {
    return new Promise(function(resolve) {
        tagObjectCache.keys(function(error, keys) {
            if (!error) {
                return resolve(tagObjectCache.mget(keys));
            }
        });
    });
};

// USEROFFICE CACHE
// ==========================================================================================

exports.setToUserOfficeCache = function(userId, office) {
    return userOfficeCache.set(userId, office);
};

exports.getFromUserOfficeCache = function(userId) {
    return new Promise(function(resolve) {
        return resolve(userOfficeCache.get(userId));
    });
};

exports.clearUserOfficeCache = function() {
    return userOfficeCache.flushAll();
};
