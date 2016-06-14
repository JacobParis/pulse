Push.debug = true;

Push.allow({
    send: function(userId, notification) {
        return true; // Allow all users to send
    }
});

Meteor.methods({
  replyNotification: function (id) {
    //Find everyone in this conversation
    var post = Threads.findOne({_id: id});
    let threads = [];
    if(post.ancestors) {
      let threads = post.ancestors.constructor === Array ? Threads.find({_id: {$in: post.ancestors}}).fetch() : false;
    }
    
    var users = threads.map(function (thread) {
      return thread.author;
    });
    //TODO Restrict list to those who have push notifications enabled

    //Push notifications
    var self = Meteor.users.findOne({_id: post.author});
    var name = self.profile.username + ' has replied to your post';
    var badge = 1;
    var query = {
        from: 'push',
        title: name,
        text: post.content,
        query: null,
        gcm: {
          sound: 'heartbeat'
        },
        apn: {
          sound: 'www/application/app/heartbeat.wav'
        }

    };

    if(users.constructor === Array) {
      query.query = {
        userId: {$in: users}
      };
    }

    Push.send(query);
  },
    serverNotification: function(text,title) {
      console.log("YES");
        var badge = 1;
        Push.send({
            from: 'push',
            title: title,
            text: text,
            badge: badge,
            sound: 'sounds/heartbeat.wav',
            payload: {
                title: title,
                text:text
            },
            query: {
                // this will send to all users
            }
        });
    },
    userNotification: function(text,title,userId) {
      console.log("ERRYONE YES");
        var badge = 1;
        Push.send({
            from: 'push',
            title: title,
            text: text,
            badge: badge,
            sound: 'sounds/heartbeat.wav',
            payload: {
                title: title
            },
            query: {
                userId: userId //this will send to a specific Meteor.user()._id
            }
        });
    },
});
