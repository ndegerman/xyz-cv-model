'use strict';

/**
 * Module dependencies.
 */
var Promise = require('bluebird');
var NodeCache = require('node-cache');
var utils = require('./utils');

// Cache
var tagObjectCache = new NodeCache({stdTTL: 500, useClones: false});

exports.setToTagObjectCache = function(tag, object) {
    return tagObjectCache.set(tag, object);
};

exports.getFromTagObjectCache = function(tag) {
    return new Promise(function(resolve) {
        return resolve(tagObjectCache.get(tag));
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

exports.GetGreaterIds = function(tagName, regex, collectionId) {
    return new Promise(function(resolve) {
        var list = [];
        var currentNumber = parseInt(tagName.substring(7, tagName.length));
        exports.getFullTagObjectCache()
            .then(function(fullCache) {
                return new Promise(function(resolve) {
                    for (var tag in fullCache) {
                        if (fullCache.hasOwnProperty(tag)) {
                            if (tag.match(regex)) {
                                if (tag.substring(7, tag.length) >= currentNumber) {
                                    list = list.concat(fullCache[tag][collectionId]);
                                }
                            }
                        }
                    }

                    return resolve(list);
                });
            })
            .then(resolve);
    });
};

// function getSmallestLargerTag(tag, regex) {
//     var tagNumber = parseInt(tag.substring(7, tag.length));

//     var smallestBig = tag;
//     var smallestBigNumber = Number.MAX_VALUE;

//     return exports.getFullTagObjectCache()
//         .then(function(fullCache) {
//             return new Promise(function(resolve) {
//                 for (var otherTag in fullCache) {
//                     if (fullCache.hasOwnProperty(tag) {
//                         if (otherTag.match(regex)) {
//                             var currentLength = parseInt(otherTag.substring(7, otherTag.length));
//                             if (currentLength > tagNumber && currentLength <= smallestBigNumber) {
//                                 smallestBigNumber = currentLength;
//                                 smallestBig = otherTag;
//                             }
//                         }
//                     }
//                 }

//                 return resolve(smallestBig);
//             });
//         });
// }
