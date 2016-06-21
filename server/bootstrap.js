Phone = function(number) {
  var a = number.replace(/[^\d\+]/g, '');
  var b = null;
  if (a.length < 11) b = '+1' + a;
  else if (a.length === 11) b = '+' + a;
  else b = a;

  return b;
};

Meteor.startup(function() {
  process.env.MAIL_URL = 'smtp://AKIAJHQRDP5RTSRWHGXA:AjflyZ3%2FzRaerV%2FXiFjB0t9rqQ3UV9ZUJUH0zBRm1Fk8@email-smtp.us-west-2.amazonaws.com:465';

  /*var loginAttemptVerifier = function(parameters) {
    if (parameters.user && parameters.user.emails && (parameters.user.emails.length > 0)) {
      // return true if verified email, false otherwise.
      var found = _.find(
                         parameters.user.emails,
                         function(thisEmail) { return thisEmail.verified }
                        );

      if (!found) {
          throw new Meteor.Error(500, 'We sent you an email.');
      }
      return found && parameters.allowed;
    } else {
      return false;
    }
  }
  Accounts.validateLoginAttempt(loginAttemptVerifier);
  */

  Roles.createRole("admin", {
    unlessExists: true
  });

  var users = Meteor.users.findOne();
  if (!users) {

    Invitations.upsert({
      _id: 'admin'
    }, {
      $set: {
        used: false,
      }
    });
    Invitations.upsert({
      _id: 'GPRC-ALPHA'
    }, {
      $set: {
        reusable: true,
      }
    });
    //Create admin profile
    var password = "l.juji9koili8979lkl8uok";
    var phone = '+12345678901';
    var id = Accounts.createUserWithPhone({
      phone: phone,
      password: password,
      invitation: 'admin'
    });

    Roles.addUsersToRoles(id, ['admin'], 'roles');

    Meteor.users.update({
      invitation: 'admin'
    }, {
      $set: {
        'phone.verified': true
      }
    });
  }

  Meteor.setInterval(function () {
    Meteor.call('pulse');
  }, 1000);

});

SMS.twilio = {
  FROM: '+15878031054',
  ACCOUNT_SID: 'AC16181b5b751cce07366cd0d94eff1ed1',
  AUTH_TOKEN: '2e74975f1c0ae7c9bb074c6de4df1c13'
};

SMS.phoneTemplates.text = function(user, code) {
  console.log(code);
  return code + ': This is your access code for Pulse Messenger!';
};

Accounts._options.verificationWaitTime = 10;
Accounts._options.verificationMaxRetries = 1000;
Accounts._options.verificationCodeLength = 6;

Accounts.onCreateUser(function(options, user) {
  user.profile = {
    notifications: {
      message: false,
      heart: false,
      comment: false,
      metacomment: false
    },
    score: 0
  };

  user.blocks = [];
  user.roles = [];
  user.subscriptions = [];
  user.invitation = options.invitation;
  return user;
});

Accounts.validateLoginAttempt(function(attempt) {
  if (attempt && attempt.user && attempt.user.phone && attempt.user.phone.verified) return true;
  else {
    throw new Meteor.Error(403, 'Your phone has not been verified.');
  }

});

Accounts.validateNewUser(function(user) {
  if (user.invitation) {
    var invitation = Invitations.findOne({
      $or: [{
        _id: user.invitation,
        $or: [{
          used: false
        }, {
          reusable: true
        }]
      }, {
        alias: user.invitation,
        $or: [{
          used: false
        }, {
          reusable: true
        }]
      }]
    });

    if (!invitation) {
      var used = Invitations.findOne({
        $or: [{
          _id: user.invitation
        }, {
          alias: user.invitation
        }]
      });
      if (used) throw new Meteor.Error(403, "This invitation has already been redeemed.");
      else throw new Meteor.Error(403, "Please provide a valid invitation.");
    } else {
      Invitations.insert({
        sender: user._id,
        used: false,
        alias: Fake.word().slice(0, 10),
        rooms: invitation.rooms,
      });
      Invitations.update({
        $or: [{
          _id: user.invitation
        }, {
          alias: user.invitation
        }]
      }, {
        $set: {
          used: true,
          recipient: user._id
        }
      });
      return true;
    }
  } else throw new Meteor.Error(403, 'Tried to create an account with an invalid invitation.');
});

Meteor.users.after.insert(function(userId, user) {
  if (user.invitation) {
    var invitation = Invitations.findOne({
      $or: [{
        _id: user.invitation
      }, {
        alias: user.invitation
      }]
    });
  } else throw new Meteor.Error(500, 'User registered with no invitation.');
});

Meteor.publishComposite('selfData', function() {
  this.unblock();
  var user = this.userId;
  return [{
    find: function() { //My full user document
      return Meteor.users.find({
        _id: user
      }, {
        fields: {
          profile: 1,
          blocks: 1
        }
      });
    }
  }];
});

Meteor.publishComposite('heartbeats', function () {
  this.unblock();
  return {
    find: function () {
      return Heartbeats.find({beats: this.userId});
    }
  };
});

Meteor.publishComposite('newPosts', function() {
  this.unblock();

  let quarter = new Date();
  quarter.setHours(Math.floor(quarter.getHours() / 6) * 6,0,0,0);
  return {
    find: function() { //All new threads coming in from the time you last viewed
      return Threads.find({
        ancestors: {$exists: false},
        timestamp: {$gte: quarter.getTime()}
      }, {
        sort: {timestamp: -1},
        fields: { colour: 1, author: 1, content: 1, reactions: 1, image: 1, timestamp: 1, ancestors: 1, link: 1, life: 1}
      });
    },
    children: [{
      find: function(thread) { //Username
        return Meteor.users.find({_id: thread.author}, {fields: {'profile': 1}});
      }
    },{
      find: function(thread) { //Replies of post
        return Threads.find({ancestors: thread._id}, {fields: { ancestors: 1}});
      }
    }]
  };
});

Meteor.publishComposite('oldPosts', function(limit) {
  let quarter = new Date();
  quarter.setHours(Math.floor(quarter.getHours() / 6) * 6,0,0,0);
  return {
    find: function () { //All older threads as you scroll down
      return Threads.find({
        ancestors: {$exists: false},
        timestamp: {$lt: quarter.getTime()}
      }, {
        sort: {timestamp: -1},
        fields: { colour: 1, author: 1, content: 1, image: 1, reactions: 1, timestamp: 1, ancestors: 1, link: 1, life: 1},
        limit: limit
      });
    },
    children: [{
      find: function(thread) { //Username of author
        return Meteor.users.find({_id: thread.author}, {fields: {'profile': 1}});
      }
    }, {
      find: function(thread) { //Replies of post
        return Threads.find({ancestors: thread._id}, {fields: {ancestors: 1}});
      }
    }]
  };
});

Meteor.publishComposite('singlePost', function(id) {
  return {
    find: function() {

      return Threads.find({
        _id: id
      });
    },
    children: [{
      find: function(post) { //Direct ancestors of post
        return post.ancestors ? Threads.find({
          _id: {
            $in: post.ancestors
          }
        }) : false;
      }
    }, {
      find: function(post) { //Replies of post
        return Threads.find({
          ancestors: post._id
        });
      }
    }]
  };
});

Meteor.publishComposite('notifications', function () {
  this.unblock();
  return this.userId ? {
    find: function() {
      return Notes.find({
        user: this.userId
      });
    },
    children: [{
      find: function(note) {
        if (note.data && note.data.thread) return Threads.find({
          _id: note.data.thread
        });
      }
    }]
  } : false;
});

/*Meteor.publish("categories", function(selector, options, collName) {
    var tags = Categories.find(selector, options);
    if(!tags.count()) {
        tags = Categories.find({}, options);
        if(!tags.count())
    }
    Autocomplete.publishCursor(tags, this);
    this.ready();
});*/

Meteor.publish('incidents', function() {
  if (this.userId) {
    if (Roles.userIsInRole(this.userId, 'admin')) {
      return Incidents.find({});
    } else return this.ready();
  } else return this.ready();
});

Meteor.publish('notes', function() {
  var me = this.userId;
  return [Notes.find({
      user: me
    }),
    Notify.find({
      user: me
    })
  ];
});

Meteor.publishComposite('invitations', function () {
  this.unblock();
  return {
    find: function() {
      return Invitations.find({
        sender: this.userId
      });
    }
  };
});

Meteor.publishComposite('bundles', {
  find: function() {
    return Bundles.find({
      user: this.userId
    });
  },
  children: [{
    find: function(bundle) {
      return Threads.find({
        _id: bundle.thread
      });
    }
  }]
});

Meteor.methods({
  'newUser': function(user) {
    Accounts.createUserWithPhone(user);
  },
  'sendLink': function(number) {
    this.unblock();
    var options = {
      to: Phone(number),
      body: 'Join the Masquerade and become a part of the underground - http://bit.ly/1pbYs7j'
    };

    SMS.send(options);

    Prospects.insert({
      'contact': {
        'type': 'phone',
        'number': options.to
      },
      source: 'post',
      timestamp: Date.now()
    });
  },
  'requestInvite': function() {
    this.unblock();
    var alias = Fake.word();

    Invitations.insert({
      alias: alias,
      used: false
    });

    return alias;

  },
  'blockUser': function(friend) {
    var user = Meteor.userId();
    var results = Meteor.users.findOne({
      _id: user
    }, {
      fields: {
        friends: 1,
        matches: 1,
        blocks: 1,
        _id: 0
      }
    });
    var friends = results.friends;
    var matches = results.matches;
    var blocks = results.blocks;
    var err;

    var time = Date.now ? Date.now() : function() {
      return new Date().getTime();
    };

    if (results && friends && matches && blocks) {
      if (user === friend) {
        err = "Error: You will go blind";
        throw new Meteor.Error(403, Meteor.userId() + ': You cannot block yourself.');
      }

      for (let index = 0; index < friends.length; ++index) {
        if (friends[index] === friend) {
          friends.splice(index, 1);
        }
      }

      //Loop through own matches and check if exists
      for (let index = 0; index < matches.length; ++index) {
        if (matches[index] === friend) {
          matches.splice(index, 1);
        }
      }

      //Loop through own matches and check if exists
      for (var index = 0; index < blocks.length; ++index) {
        if (blocks[index].user === friend) {
          err = "Error: Already blocked this user";
          throw new Meteor.Error(403, Meteor.userId() + ': You already blocked user ' + friend);
        }
      }
    }

    if (err) {
      return err;
    } else {
      var doc = {
        user: friend,
        timestamp: time
      };

      Meteor.users.update({
        _id: user
      }, {
        $push: {
          blocks: doc
        }
      });

      var note = {
        user: user,
        type: "block",
        title: "You have successfully blocked another user.",
        content: "You will no longer see any future posts by that user. To unblock all users please contact the admin team.",
        timestamp: time
      };

      Notify.insert(note);
    }

  },
  'reportUser': function(arg) {
    var report = match(arg, {
      perpetrator: "string",
      accuser: "string",
      details: "object"
    });

    var time = Date.now ? Date.now() : function() {
      return new Date().getTime();
    };

    var incident = report;
    incident.timestamp = time;

    Incidents.insert(incident);

    var note = {
      user: report.accuser,
      type: "report",
      title: "We have received your incident report.",
      content: "Your report will be reviewed and appropriate action will be taken.",
      timestamp: time
    };

    Notify.insert(note);
  },
  'pulse': function () {
    var heartbeats = Heartbeats.find({}).forEach(function(post) {
      Threads.update({_id: post._id}, {$inc: {life: -post.beats.length}}, {multi: true});
    });

    Threads.remove({life: {$lte: 0}});
  },
  'addScore': function(user, number) {
    this.unblock();
    if (typeof number === "number" && Roles.userIsInRole(Meteor.userId(), 'admin')) {
      Meteor.users.update({
        _id: user
      }, {
        $inc: {
          'profile.score': number
        }
      });
    }
  },
  'subscribe': function(doc) {
    var post = match(doc, {
      'subject': "string"
    });

    var me = Meteor.userId();
    var subscriptions = Meteor.users.findOne({
      '_id': me,
      'subscriptions': {
        '$elemMatch': {
          subject: post.subject
        }
      }
    });

    if (subscriptions) {} else {
      Meteor.users.update({
        _id: me
      }, {
        $push: {
          subscriptions: {
            subject: post.subject
          }
        }
      });
    }
  },
  'unsubscribe': function(doc) {
    var post = match(doc, {
      subject: "string"
    });

    Meteor.users.update({
      _id: Meteor.userId()
    }, {
      $pull: {
        subscriptions: {
          subject: post.subject
        }
      }
    });
  },
  'notify': function(arg) {
    var doc = match(arg, {
      subject: "string",
      type: "string",
      content: "string",
      user: "string"
    });

    var subject = doc.subject;
    var type = doc.type;
    var content = doc.content;
    var user = doc.user;

    var time = Date.now ? Date.now() : function() {
      return new Date().getTime();
    };

    var users = Meteor.users.find({
      subscriptions: {
        $elemMatch: {
          subject: subject,
          type: type
        }
      }
    }, {
      fields: {
        _id: 1
      }
    });

    var list = users.map(function(doc) {
      return doc._id;
    });

    if (type === "comment") {
      var thread = Threads.findOne({
        _id: subject
      });

      if (thread) {
        var title = thread.content;

        for (var i = 0; i < list.length; ++i) {
          if (user === list[i]) {
            continue;
          } else {
            var note = {
              user: list[i],
              type: type,
              title: title,
              content: content,
              data: {
                thread: subject
              },
              timestamp: time
            };

            Notify.insert(note);
          }
        }
      }
    }

  },
  'submitSupport': function(arg) {
    this.unblock();
    var post = arg;
    post.author = Meteor.userId();
    post.timestamp = Date.now ? Date.now() : function() {
      return new Date().getTime();
    };
    Support.insert(post);
  }
});

function match(obj, tpl) {
  return Object.keys(tpl).reduce(function(collection, key) {
    if (obj.hasOwnProperty(key) && typeof obj[key] === tpl[key]) {
      collection[key] = obj[key];
    }
    return collection;
  }, {});
}