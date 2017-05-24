'use strict';

module.exports = function (Collection) {

    Collection.afterRemote('create', function (ctx, collectionInstance, next) {
        console.log("Creating relation between peer and collection");
        /*
         Create a relation 'hasCollection' between peer node and collection node
         */
        Collection.dataSource.connector.execute(
            "MATCH (c:collection {id: '" + collectionInstance.id + "'}),(p:peer {id: '" + collectionInstance.peerId + "'}) MERGE (p)-[r:hasCollection]->(c) RETURN r",
            function (err, results) {
                if (err) {
                    next();
                }
                else {
                    next();
                }
            }
        );
    });

    Collection.afterRemote('prototype.patchAttributes', function (ctx, collectionInstance, next) {

        if (collectionInstance.bio_image.length > 0) {
            console.log("Updated bio_image. Creating relation between media and collection");
            /*
             Create a relation 'hasMedia' between peer node and collection node
             */
            Collection.dataSource.connector.execute(
                "MATCH (c:collection {id: '" + collectionInstance.id + "'}),(m:media {url: '" + collectionInstance.bio_image + "'}) MERGE (c)-[r:hasMedia]->(m) RETURN r",
                function (err, results) {
                    if (err) {
                        next();
                    }
                    else {
                        next();
                    }
                }
            );
        }
        if (collectionInstance.bio_video.length > 0) {
            console.log("Updated bio_video. Creating relation between media and collection");
            /*
             Create a relation 'hasMedia' between peer node and collection node
             */
            Collection.dataSource.connector.execute(
                "MATCH (c:collection {id: '" + collectionInstance.id + "'}),(m:media {url: '" + collectionInstance.bio_video + "'}) MERGE (c)-[r:hasMedia]->(m) RETURN r",
                function (err, results) {
                    if (err) {
                        next();
                    }
                    else {
                        next();
                    }
                }
            );
        }

    });


    Collection.afterRemote('prototype.__create__views', function (ctx, viewInstance, next) {
        console.log("Creating relation between view node and collection node");
        /*
         NEW: Collection -[wasViewed]-> View
         */
        Collection.dataSource.connector.execute(
            "MATCH (c:collection {id: '" + viewInstance.collectionId + "'}),(v:view {id: '" + viewInstance.id + "'}) MERGE (c)-[r:wasViewed]->(v) RETURN r",
            function (err, results) {
                if (err) {
                    next();
                }
                else {
                    next();
                }
            }
        );
    });

    Collection.afterRemote('prototype.__create__contents', function (ctx, contentInstance, next) {

    });

    Collection.addNewContents = function (data, id, cb) {
        console.log("Creating new content instance");

        var content = {
            title: data.title,
            type: data.type,
            url: data.url,
            created: data.created,
            modified: data.modified
        };

        Collection.app.models.content.create(content, function (err, newContentInstance) {
            if (err) {
                cb(err);
            }
            else {

                if (data.calendar !== null) {
                    var calendar = JSON.parse(data.calendar);
                    calendar.content_id = newContentInstance.id;
                    Collection.app.models.content_calendar.create(calendar, function (err, contentCalendarInstance) {
                        if (err) {
                            newContentInstance.destroy();
                            cb(err);
                        }

                        console.log("Created calendar instance for this content instance");
                        console.log(contentCalendarInstance);
                        /*
                         NEW: Content -[hasCalendar]-> ContentCalendar
                         */
                        Collection.dataSource.connector.execute(
                            "MATCH (c:content {id: '" + newContentInstance.id + "'}),(n:content_calendar {id: '" + contentCalendarInstance.id + "'}) MERGE (c)-[r:hasCalendar]->(n) RETURN n",
                            function (err, results) {
                                if (err) {
                                    console.log("Error linking calendar to content");
                                }
                                else {
                                    console.log("Linked calendar to content");
                                }
                            }
                        );


                        /*
                         NEW: Collection -[hasContent]-> Content
                         */
                        Collection.dataSource.connector.execute(
                            "MATCH (c:collection {id: '" + id + "'}),(d:content {id: '" + newContentInstance.id + "'}) MERGE (c)-[r:hasContent]->(d) RETURN d",
                            function (err, results) {
                                if (err) {
                                    cb(err);
                                }
                                else {
                                    cb(null, results);
                                }
                            }
                        );
                    });
                }
                else {

                }
            }
        });
    };

    Collection.patchExistingContents = function (data, id, cb) {
        console.log("linking existing content instance");

        Collection.app.models.content.findById(data.id, function (err, contentInstance) {
            if (err) {
                cb(err);
            }
            else {
                /*
                 NEW: Collection -[hasContent]-> Content
                 */
                Collection.dataSource.connector.execute(
                    "MATCH (c:collection {id: '" + id + "'}),(d:content {id: '" + contentInstance.id + "'}) MERGE (c)-[r:hasContent]->(d) RETURN d",
                    function (err, results) {
                        if (err) {
                            cb(err);
                        }
                        else {
                            cb(null, results);
                        }
                    }
                );
            }
        });
    };

    Collection.addNewTopics = function (data, id, cb) {
        console.log("Creating new topic instance");

        var topic = {
            name: data.name,
            type: data.type,
            created: data.created,
            modified: data.modified
        };
        Collection.app.models.topic.create(topic, function (err, newTopicInstance) {
            if (err) {
                cb(err);
            }
            else {
                /*
                 NEW: Collection -[hasTopic]-> Topic
                 */
                Collection.dataSource.connector.execute(
                    "MATCH (c:collection {id: '" + id + "'}),(t:topic {id: '" + newTopicInstance.id + "'}) MERGE (c)-[r:hasTopic]->(t) RETURN t",
                    function (err, results) {
                        if (err) {
                            cb(err);
                        }
                        else {
                            cb(null, results);
                        }
                    }
                );
            }
        });
    };

    Collection.patchExistingTopics = function (data, id, cb) {
        console.log("linking existing topic instance");

        Collection.app.models.topic.findById(data.id, function (err, topicInstance) {
            if (err) {
                cb(err);
            }
            else {
                /*
                 NEW: Collection -[hasContent]-> Topic
                 */
                Collection.dataSource.connector.execute(
                    "MATCH (c:collection {id: '" + id + "'}),(t:topic {id: '" + topicInstance.id + "'}) MERGE (c)-[r:hasTopic]->(t) RETURN t",
                    function (err, results) {
                        if (err) {
                            cb(err);
                        }
                        else {
                            cb(null, results);
                        }
                    }
                );
            }
        });
    };


    Collection.addNewParticipants = function (data, id, cb) {
        console.log("Creating new peer_invite instance");

        var peer_invite = {
            name: data.name,
            email: data.email,
            status: 'pending',
            created: data.created,
            modified: data.modified
        };
        Collection.app.models.peer_invite.create(peer_invite, function (err, newPeerInviteInstance) {
            if (err) {
                cb(err);
            }
            else {
                /*
                 NEW: Collection -[hasInvited]-> PeerInvite
                 */
                Collection.dataSource.connector.execute(
                    "MATCH (c:collection {id: '" + id + "'}),(p:peer_invite {id: '" + newPeerInviteInstance.id + "'}) MERGE (c)-[r:hasInvited]->(p) RETURN p",
                    function (err, results) {
                        if (err) {
                            cb(err);
                        }
                        else {
                            cb(null, results);
                        }
                    }
                );
            }
        });
    };

    Collection.patchExistingParticipants = function (data, id, cb) {
        console.log("linking existing peer instance");

        Collection.app.models.peer.findById(data.id, function (err, peerInstance) {
            if (err) {
                cb(err);
            }
            else {
                /*
                 NEW: Collection -[hasParticipant]-> Peer
                 */
                Collection.dataSource.connector.execute(
                    "MATCH (c:collection {id: '" + id + "'}),(p:peer {id: '" + peerInstance.id + "'}) MERGE (c)-[r:hasParticipant]->(p) RETURN r",
                    function (err, results) {
                        if (err) {
                            cb(err);
                        }
                        else {
                            cb(null, results);
                        }
                    }
                );
            }
        });
    };

    Collection.addReview = function (data, id, cb) {
        console.log("Creating new review");
        Collection.app.models.collection.findById(id, function (err, collectionInstance) {
            if (err) {
                cb(err);
            } else if (collectionInstance != null) {
                var review = {
                    description: data.description,
                    like: data.like,
                    created: data.created,
                    modified: data.modified
                };

                console.log("collectionInstance.id " + collectionInstance.id);
                Collection.app.models.review.create(review, function (err, newReviewInstance) {
                    if (err) {
                        cb(err);
                    }
                    else {
                        console.log("Created newReviewInstance: " + newReviewInstance.id);
                        Collection.dataSource.connector.execute(
                            "MATCH (c:collection {id: '" + collectionInstance.id + "'}),(d:review {id: '" + newReviewInstance.id + "'}) MERGE (c)-[r:hasReview]->(d) RETURN d",
                            function (err, results) {
                                if (err) {
                                    cb(err);
                                }
                                else {
                                    cb(null, results);
                                }
                            }
                        );
                    }
                });
            } else {
                var err = new Error('Collection Not Found');
                err.status = 404;
                cb(err);
            }
        });
    };

    Collection.editReview = function (data, id, cb) {
        console.log("Editing the review");
        Collection.app.models.collection.findById(id, function (err, collectionInstance) {
            if (err) {
                cb(err);
            } else if (collectionInstance != null) {
                Collection.app.models.review.findById(data.id, function (err, reviewInstance) {
                    if (err) {
                        cb(err);
                    }
                    else if (reviewInstance != null) {
                        var newReview = {
                            description: data.description,
                            like: data.like,
                            created: data.created,
                            modified: data.modified
                        };
                        console.log(data);
                        Collection.app.models.review.upsertWithWhere({ "id": data.id }, newReview, function (err, newReviewInstance) {
                            if (err) {
                                cb(err);
                            }
                            else {
                                console.log("updated reviewInstance: " + newReviewInstance.id);
                                cb(null, newReviewInstance);
                            }
                        });
                    } else {
                        var err = new Error('Review Not Found');
                        err.status = 404;
                        cb(err);
                    }
                });
            } else {
                var err = new Error('Collection Not Found');
                err.status = 404;
                cb(err);
            }
        });
    };
    Collection.deleteReview = function (data, id, cb) {
        console.log("Deleting review instance");
        Collection.app.models.collection.findById(id, function (err, collectionInstance) {
            if (err) {
                cb(err);
            } else if (collectionInstance != null) {
                Collection.app.models.review.findById(data.id, function (err, reviewInstance) {
                    if (err) {
                        cb(err);
                    }
                    else if (reviewInstance != null) {

                        console.log("deleting review :" + reviewInstance.id);
                        /*
                         NEW: Collection -[hasParticipant]-> Peer
                         */
                        Collection.dataSource.connector.execute(
                            "MATCH (a:collection{id:'" + id + "'})-[r:hasReview]->(b:review{id:'" + reviewInstance.id + "'}) detach delete b",
                            function (err, results) {
                                if (err) {
                                    cb(err);
                                }
                                else {
                                    cb(null, results);
                                }
                            }
                        );
                    } else {
                        var err = new Error('Review Not Found');
                        err.status = 404;
                        cb(err);
                    }
                });
            } else {
                var err = new Error('Collection Not Found');
                err.status = 404;
                cb(err);
            }
        });
    };

    Collection.addNewComment = function (data, id, cb) {
        
        console.log("Creating new comment instance");

        var comment = {
            description: data.description,
            addedBy: data.addedBy,
            collectionId: data.collectionId,
            created: data.created,
            modified: data.modified
        };
        
        Collection.app.models.comment.create(comment, function (err, newCommentInstance) {
            if (err) {
                cb(err);
            }
            else {
                /*
                 NEW: Collection -[hasComment]-> Comment
                 */
                Collection.dataSource.connector.execute(
                    "MATCH (c:collection {id: '" + id + "'}),(t:comment {id: '" + newCommentInstance.id + "'}) MERGE (c)-[r:hasComment]->(t) RETURN t",
                    function (err, results) {
                        if (err) {
                            cb(err);
                        }
                        else {
                            cb(null, results);
                        }
                    }
                );
            }
        });
    };

    Collection.editComment = function (data, collectionId, commentId, cb) {
        
        console.log("Editing the comment : " + commentId);
        
        Collection.app.models.collection.findById(collectionId, function (err, collectionInstance) {
            
            if (err) {
                cb(err);
            } else if (collectionInstance != null) {

                Collection.app.models.comment.findById(commentId, function (err, commentInstance) {
                    if (err) {
                        cb(err);
                    }
                    else if (commentInstance != null) {

                        var editedComment = {
                            description: data.description,
                            addedBy: data.addedBy,
                            collectionId: data.collectionId,
                            created: data.created,
                            modified: data.modified
                        };
                        
                        Collection.app.models.comment.upsertWithWhere({ "id": commentId }, editedComment, function (err, editedCommentInstance) {
                            if (err) {
                                cb(err);
                            }
                            else {
                                console.log("Comment updated : " + editedCommentInstance.id);
                                cb(null, editedCommentInstance);
                            }
                        });
                    } else {
                        var err = new Error('Comment Not Found');
                        err.status = 404;
                        cb(err);
                    }
                });
            } else {
                var err = new Error('Collection Not Found');
                err.status = 404;
                cb(err);
            }
        });
    };

     Collection.patchExistingComment = function (data, collectionId, commentId, cb) {
        
        console.log("Linking existing comment " + commentId + " to collection "+collectionId);

        Collection.app.models.comment.findById(commentId, function (err, commentInstance) {
            
            if (err) {
                cb(err);
            } else {
                /*
                 NEW: Collection -[hasComment]-> Comment
                 */
                Collection.dataSource.connector.execute(
                    "MATCH (c:collection {id: '" + collectionId + "'}),(t:comment {id: '" + commentInstance.id + "'}) MERGE (c)-[r:hasComment]->(t) RETURN t",
                    function (err, results) {
                        
                        if (err) {
                            cb(err);
                        } else {
                            cb(null, results);
                        }
                    }
                );
            }
        });
    };

    Collection.deleteComment = function (collectionId, commentId, cb) {
        
        console.log("Deleting comment instance " + commentId);
        Collection.app.models.collection.findById(collectionId, function (err, collectionInstance) {
            
            if (err) {
                cb(err);
            } else if (collectionInstance != null) {
               
                Collection.app.models.comment.findById(commentId, function (err, commentInstance) {
                    if (err) {
                        cb(err);
                    } else if (commentInstance != null) {

                        console.log("Deleting comment :" + commentInstance.id);
                        /*
                         NEW: Collection -[hasParticipant]-> Peer
                         */
                        Collection.dataSource.connector.execute(
                            "MATCH (a:collection{id:'" + collectionId + "'})-[r:hasComment]->(b:comment{id:'" + commentInstance.id + "'}) detach delete b",
                            function (err, results) {
                                if (err) {
                                    cb(err);
                                } else {
                                    cb(null, results);
                                }
                            }
                        );
                    } else {
                        var err = new Error('Comment Not Found');
                        err.status = 404;
                        cb(err);
                    }
                });
            } else {
                var err = new Error('Collection Not Found');
                err.status = 404;
                cb(err);
            }
        });
    };



    // TODO: Define remote methods for participants, contents, topics, billing, comments etc

    Collection.remoteMethod(
        'addNewContents',
        {
            description: 'Add a new content instance to this collection',
            accepts: [
                { arg: 'data', type: 'object', http: { source: 'body' }, required: true },
                { arg: 'id', type: 'string', http: { source: 'path' } }
            ],
            returns: { arg: 'contentObject', type: 'object', root: true },
            http: { verb: 'post', path: '/:id/contents' }
        }
    );

    Collection.remoteMethod(
        'patchExistingContents',
        {
            description: 'Link an existing content instance to this collection',
            accepts: [
                { arg: 'data', type: 'object', http: { source: 'body' }, required: true },
                { arg: 'id', type: 'string', http: { source: 'path' } }
            ],
            returns: { arg: 'contentObject', type: 'object', root: true },
            http: { verb: 'patch', path: '/:id/contents' }
        }
    );

    Collection.remoteMethod(
        'addNewTopics',
        {
            description: 'Add a new topic instance to this collection',
            accepts: [
                { arg: 'data', type: 'object', http: { source: 'body' }, required: true },
                { arg: 'id', type: 'string', http: { source: 'path' } }
            ],
            returns: { arg: 'contentObject', type: 'object', root: true },
            http: { verb: 'post', path: '/:id/topics' }
        }
    );

    Collection.remoteMethod(
        'patchExistingTopics',
        {
            description: 'Link an existing topic instance to this collection',
            accepts: [
                { arg: 'data', type: 'object', http: { source: 'body' }, required: true },
                { arg: 'id', type: 'string', http: { source: 'path' } }
            ],
            returns: { arg: 'contentObject', type: 'object', root: true },
            http: { verb: 'patch', path: '/:id/topics' }
        }
    );

    Collection.remoteMethod(
        'addNewParticipants',
        {
            description: 'Add a new peer_invite instance to this collection',
            accepts: [
                { arg: 'data', type: 'object', http: { source: 'body' }, required: true },
                { arg: 'id', type: 'string', http: { source: 'path' } }
            ],
            returns: { arg: 'contentObject', type: 'object', root: true },
            http: { verb: 'post', path: '/:id/participants' }
        }
    );

    Collection.remoteMethod(
        'patchExistingParticipants',
        {
            description: 'Link an existing peer instance to this collection',
            accepts: [
                { arg: 'data', type: 'object', http: { source: 'body' }, required: true },
                { arg: 'id', type: 'string', http: { source: 'path' } }
            ],
            returns: { arg: 'contentObject', type: 'object', root: true },
            http: { verb: 'patch', path: '/:id/participants' }
        }
    );

    Collection.remoteMethod(
        'addReview',
        {
            description: 'Adds a review to this collection',
            accepts: [
                { arg: 'data', type: 'object', http: { source: 'body' }, required: true },
                { arg: 'id', type: 'string', http: { source: 'path' }, required: true }
            ],
            returns: { arg: 'contentObject', type: 'object', root: true },
            http: { verb: 'post', path: '/:id/review' }
        }
    );
    Collection.remoteMethod(
        'editReview',
        {
            description: 'Adds a review to this collection',
            accepts: [
                { arg: 'data', type: 'object', http: { source: 'body' }, required: true },
                { arg: 'id', type: 'string', http: { source: 'path' }, required: true }
            ],
            returns: { arg: 'contentObject', type: 'object', root: true },
            http: { verb: 'put', path: '/:id/review' }
        }
    );
    Collection.remoteMethod(
        'deleteReview',
        {
            description: 'Adds a review to this collection',
            accepts: [
                { arg: 'data', type: 'object', http: { source: 'body' }, required: true },
                { arg: 'id', type: 'string', http: { source: 'path' }, required: true }
            ],
            returns: { arg: 'contentObject', type: 'object', root: true },
            http: { verb: 'delete', path: '/:id/review' }
        }
    );

    /**
     * Comment Remote method section - starts here
     */
    Collection.remoteMethod(
        'addNewComment',
        {
            description: 'Add a new comment instance to this collection',
            accepts: [
                { arg: 'data', type: "comment", http: { source: 'body' }, required: true },
                { arg: 'id', type: 'string', http: { source: 'path' } }
            ],
            returns: { arg: 'contentObject', type: 'object', root: true },
            http: { verb: 'post', path: '/:id/comments' }
        }
    );

    Collection.remoteMethod(
        'editComment',
        {
            description: 'Edit existing comment of this collection',
            accepts: [
                { arg: 'data', type: 'comment', http: { source: 'body' }, required: true },
                { arg: 'id', type: 'string', description: 'collection id', http: { source: 'path' }, required: true },
                { arg: 'fk', type: 'string', description: 'foreign key for comments', http: { source: 'path' }, required: true }
            ],
            returns: { arg: 'contentObject', type: 'object', root: true },
            http: { verb: 'put', path: '/:id/comments/:fk' }
        }
    );

    Collection.remoteMethod(
        'patchExistingComment',
        {
            description: 'Link an existing comment instance to this collection',
            accepts: [
                { arg: 'data', type: 'comment', http: { source: 'body' }, required: true },
                { arg: 'id', type: 'string', description: 'collection id', http: { source: 'path' } },
                { arg: 'fk', type: 'string', description: 'foreign key for comments', http: { source: 'path' }, required: true }
            ],
            returns: { arg: 'contentObject', type: 'object', root: true },
            http: { verb: 'patch', path: '/:id/comments/:fk' }
        }
    );

     Collection.remoteMethod(
        'deleteComment',
        {
            description: 'Delete a comment instance from this collection',
            accepts: [
                { arg: 'id', type: 'string', description: 'collection id', http: { source: 'path' }, required: true },
                { arg: 'fk', type: 'string', description: 'foreign key for comments', http: { source: 'path' }, required: true }
            ],
            returns: { arg: 'contentObject', type: 'object', root: true },
            http: { verb: 'delete', path: '/:id/comments/:fk' }
        }
    );
};
