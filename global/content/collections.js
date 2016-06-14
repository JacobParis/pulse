Meteor.users.deny({
    update: function() {
        return true;
    }
});

Threads = new Mongo.Collection('threads');
Threads.allow({
    remove : function (user, doc) {
        if (doc.author === user) {
            Threads.remove({parent: doc._id});
        }
        return (doc.author === user);
    }
});

Categories = new Mongo.Collection('categories');
Bundles = new Mongo.Collection('bundles');

Heartbeats = new Mongo.Collection('heartbeats');

Aziz = new Mongo.Collection('aziz');
Incidents = new Mongo.Collection('incidents');

Notes = new Mongo.Collection('notes');
Notes.allow({
    remove : function (user, doc) {
        return (doc.user === user);
    },
    insert : function (user, doc) {
        return (doc.user === user);
    }
});

Support = new Mongo.Collection('support');
Invitations = new Mongo.Collection('invitations');

Notify = new Mongo.Collection('notify');
Notify.allow({
    remove : function (user, doc) {
        return (doc.user === user);
    }
});
