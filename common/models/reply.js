'use strict';

module.exports = function(Reply) {

    Reply.addNewReply = function (data, parentReplyId, cb) {
        
        console.log("Creating new reply instance");

        var reply = {
            description: data.description,
            addedBy: data.addedBy,
            replyId: data.replyId,
            created: data.created,
            modified: data.modified
        };
        
        Reply.app.models.reply.create(reply, function (err, newReplyInstance) {
            if (err) {
                cb(err);
            } else {
                /*
                 NEW: Reply -[hasReply]-> Reply
                 */
                Reply.dataSource.connector.execute(
                    "MATCH (c:reply {id: '" + parentReplyId + "'}),(t:reply {id: '" + newReplyInstance.id + "'}) MERGE (c)-[r:hasReply]->(t) RETURN t",
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

    Reply.editReply = function (data, parentReplyId, replyId, cb) {
        
        console.log("Editing the reply : " + replyId);
        
        Reply.app.models.reply.findById(parentReplyId, function (err, parentReplyInstance) {
            
            if (err) {
                cb(err);
            } else if (parentReplyInstance != null) {

                Reply.app.models.reply.findById(replyId, function (err, replyInstance) {
                    if (err) {
                        cb(err);
                    } else if (replyInstance != null) {

                        var editedReply = {
                            description: data.description,
                            addedBy: data.addedBy,
                            replyId: data.parentReplyId,
                            created: data.created,
                            modified: data.modified
                        };
                        
                        Reply.app.models.reply.upsertWithWhere({ "id": replyId }, editedReply, function (err, editedReplyInstance) {
                            if (err) {
                                cb(err);
                            } else {
                                console.log("Reply updated : " + editedReplyInstance.id);
                                cb(null, editedReplyInstance);
                            }
                        });
                    } else {
                        var err = new Error('Reply Not Found');
                        err.status = 404;
                        cb(err);
                    }
                });
            } else {
                var err = new Error('Reply Not Found');
                err.status = 404;
                cb(err);
            }
        });
    };

     Reply.patchExistingReply = function (data, parentReplyId, replyId, cb) {
        
        console.log("Linking existing reply " + replyId + " to parent reply "+parentReplyId);

        Reply.app.models.reply.findById(replyId, function (err, replyInstance) {
            
            if (err) {
                cb(err);
            } else {
                /*
                 NEW: Reply -[hasReply]-> Reply
                 */
                Reply.dataSource.connector.execute(
                    "MATCH (c:reply {id: '" + parentReplyId + "'}),(t:reply {id: '" + replyInstance.id + "'}) MERGE (c)-[r:hasReply]->(t) RETURN t",
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

    Reply.deleteReply = function (parentReplyId, replyId, cb) {
        
        console.log("Deleting reply instance " + replyId);
        Reply.app.models.reply.findById(parentReplyId, function (err, parentReplyInstance) {
            
            if (err) {
                cb(err);
            } else if (parentReplyInstance != null) {
               
                Reply.app.models.reply.findById(replyId, function (err, replyInstance) {
                    if (err) {
                        cb(err);
                    } else if (replyInstance != null) {

                        console.log("Deleting reply :" + replyInstance.id);
                        /*
                         NEW: Reply -[hasParticipant]-> Peer
                         */
                        Reply.dataSource.connector.execute(
                            "MATCH (a:reply{id:'" + parentReplyId + "'})-[r:hasReply]->(b:reply{id:'" + replyInstance.id + "'}) detach delete b",
                            function (err, results) {
                                if (err) {
                                    cb(err);
                                } else {
                                    cb(null, results);
                                }
                            }
                        );
                    } else {
                        var err = new Error('Reply Not Found');
                        err.status = 404;
                        cb(err);
                    }
                });
            } else {
                var err = new Error('Reply Not Found');
                err.status = 404;
                cb(err);
            }
        });
    };



    /**
     * Reply Remote method section - starts here
     */
    Reply.remoteMethod(
        'addNewReply',
        {
            description: 'Add a new reply instance to this reply',
            accepts: [
                { arg: 'data', type: "reply", http: { source: 'body' }, required: true },
                { arg: 'id', type: 'string', http: { source: 'path' } }
            ],
            returns: { arg: 'contentObject', type: 'object', root: true },
            http: { verb: 'post', path: '/:id/replies' }
        }
    );

    Reply.remoteMethod(
        'editReply',
        {
            description: 'Edit existing reply of this reply',
            accepts: [
                { arg: 'data', type: 'reply', http: { source: 'body' }, required: true },
                { arg: 'id', type: 'string', description: 'reply id', http: { source: 'path' }, required: true },
                { arg: 'fk', type: 'string', description: 'foreign key for reply', http: { source: 'path' }, required: true }
            ],
            returns: { arg: 'contentObject', type: 'object', root: true },
            http: { verb: 'put', path: '/:id/replies/:fk' }
        }
    );

    Reply.remoteMethod(
        'patchExistingReply',
        {
            description: 'Link an existing reply instance to this reply',
            accepts: [
                { arg: 'data', type: 'reply', http: { source: 'body' }, required: true },
                { arg: 'id', type: 'string', description: 'reply id', http: { source: 'path' } },
                { arg: 'fk', type: 'string', description: 'foreign key for reply', http: { source: 'path' }, required: true }
            ],
            returns: { arg: 'contentObject', type: 'object', root: true },
            http: { verb: 'patch', path: '/:id/replies/:fk' }
        }
    );

     Reply.remoteMethod(
        'deleteReply',
        {
            description: 'Delete a reply instance from this reply',
            accepts: [
                { arg: 'id', type: 'string', description: 'reply id', http: { source: 'path' }, required: true },
                { arg: 'fk', type: 'string', description: 'foreign key for reply', http: { source: 'path' }, required: true }
            ],
            returns: { arg: 'contentObject', type: 'object', root: true },
            http: { verb: 'delete', path: '/:id/replies/:fk' }
        }
    );
};
