'use strict';

module.exports = function(Comment) {
    
    Comment.addNewReply = function (data, commentId, cb) {
        
        console.log("Creating new reply instance");

        var reply = {
            description: data.description,
            addedBy: data.addedBy,
            commentId: data.commentId,
            created: data.created,
            modified: data.modified
        };
        
        Comment.app.models.reply.create(reply, function (err, newReplyInstance) {
            if (err) {
                cb(err);
            } else {
                /*
                 NEW: Comment -[hasReply]-> Reply
                 */
                Comment.dataSource.connector.execute(
                    "MATCH (c:comment {id: '" + commentId + "'}),(t:reply {id: '" + newReplyInstance.id + "'}) MERGE (c)-[r:hasReply]->(t) RETURN t",
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

    Comment.editReply = function (data, commentId, replyId, cb) {
        
        console.log("Editing the reply : " + replyId);
        
        Comment.app.models.comment.findById(commentId, function (err, commentInstance) {
            
            if (err) {
                cb(err);
            } else if (commentInstance != null) {

                Comment.app.models.reply.findById(replyId, function (err, replyInstance) {
                    if (err) {
                        cb(err);
                    } else if (replyInstance != null) {

                        var editedReply = {
                            description: data.description,
                            addedBy: data.addedBy,
                            commentId: data.commentId,
                            created: data.created,
                            modified: data.modified
                        };
                        
                        Comment.app.models.reply.upsertWithWhere({ "id": replyId }, editedReply, function (err, editedReplyInstance) {
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
                var err = new Error('Comment Not Found');
                err.status = 404;
                cb(err);
            }
        });
    };

     Comment.patchExistingReply = function (data, commentId, replyId, cb) {
        
        console.log("Linking existing reply " + replyId + " to comment "+commentId);

        Comment.app.models.reply.findById(replyId, function (err, replyInstance) {
            
            if (err) {
                cb(err);
            } else {
                /*
                 NEW: Comment -[hasReply]-> Reply
                 */
                Comment.dataSource.connector.execute(
                    "MATCH (c:comment {id: '" + commentId + "'}),(t:reply {id: '" + replyInstance.id + "'}) MERGE (c)-[r:hasReply]->(t) RETURN t",
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

    Comment.deleteReply = function (commentId, replyId, cb) {
        
        console.log("Deleting reply instance " + replyId);
        Comment.app.models.comment.findById(commentId, function (err, commentInstance) {
            
            if (err) {
                cb(err);
            } else if (commentInstance != null) {
               
                Comment.app.models.reply.findById(replyId, function (err, replyInstance) {
                    if (err) {
                        cb(err);
                    } else if (replyInstance != null) {

                        console.log("Deleting reply :" + replyInstance.id);
                        /*
                         NEW: Comment -[hasParticipant]-> Peer
                         */
                        Comment.dataSource.connector.execute(
                            "MATCH (a:comment{id:'" + commentId + "'})-[r:hasReply]->(b:reply{id:'" + replyInstance.id + "'}) detach delete b",
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
                var err = new Error('Comment Not Found');
                err.status = 404;
                cb(err);
            }
        });
    };



    /**
     * Reply Remote method section - starts here
     */
    Comment.remoteMethod(
        'addNewReply',
        {
            description: 'Add a new reply instance to this comment',
            accepts: [
                { arg: 'data', type: "reply", http: { source: 'body' }, required: true },
                { arg: 'id', type: 'string', http: { source: 'path' } }
            ],
            returns: { arg: 'contentObject', type: 'object', root: true },
            http: { verb: 'post', path: '/:id/replies' }
        }
    );

    Comment.remoteMethod(
        'editReply',
        {
            description: 'Edit existing reply of this comment',
            accepts: [
                { arg: 'data', type: 'reply', http: { source: 'body' }, required: true },
                { arg: 'id', type: 'string', description: 'comment id', http: { source: 'path' }, required: true },
                { arg: 'fk', type: 'string', description: 'foreign key for reply', http: { source: 'path' }, required: true }
            ],
            returns: { arg: 'contentObject', type: 'object', root: true },
            http: { verb: 'put', path: '/:id/replies/:fk' }
        }
    );

    Comment.remoteMethod(
        'patchExistingReply',
        {
            description: 'Link an existing reply instance to this comment',
            accepts: [
                { arg: 'data', type: 'reply', http: { source: 'body' }, required: true },
                { arg: 'id', type: 'string', description: 'comment id', http: { source: 'path' } },
                { arg: 'fk', type: 'string', description: 'foreign key for reply', http: { source: 'path' }, required: true }
            ],
            returns: { arg: 'contentObject', type: 'object', root: true },
            http: { verb: 'patch', path: '/:id/replies/:fk' }
        }
    );

     Comment.remoteMethod(
        'deleteReply',
        {
            description: 'Delete a reply instance from this comment',
            accepts: [
                { arg: 'id', type: 'string', description: 'comment id', http: { source: 'path' }, required: true },
                { arg: 'fk', type: 'string', description: 'foreign key for reply', http: { source: 'path' }, required: true }
            ],
            returns: { arg: 'contentObject', type: 'object', root: true },
            http: { verb: 'delete', path: '/:id/replies/:fk' }
        }
    );
};
