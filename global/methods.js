Meteor.methods({
  'createPost': function(post) {
    var time = Date.now ? Date.now() : function() {
      return new Date().getTime();
    };
      var pseudonym = null;
      if (post.content.slice(0, 1) === "%") { //If the post is preceded with %, create post anonymously (if admin)
        if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
          pseudonym = Fake.word() + Fake.word() + Fake.word();
          post.content = post.content.substring(1);
        }
      }
      var user = pseudonym ? pseudonym : Meteor.userId();
      if (post.content.length > 2 && post.content.length <= 1000) {
        if (post.ancestors) {
          //Add parent's ancestors to own ancestors
          var parent = Threads.findOne({
            _id: post.ancestors[0]
          });
          if (parent.ancestors) post.ancestors = parent.ancestors.concat(post.ancestors);

          var original = Threads.findOne({
            _id: post.ancestors[0]
          });

          if (original && original.author === user) {
            //I am the author of the thread
            post.colour = original.colour;
          } else {
            var other = Threads.findOne({
              'ancestors.0': post.ancestors[0],
              author: user
            });
            if (other) {
              //I have posted in this thread
              post.colour = other.colour;
            }
          }
        }

        var profile = Meteor.user().profile;

        post.colour = post.colour || profile.colour;

        post.timestamp = time;
        post.author = user;
        post.hearts = [];
        post.life = 300;

        if (Meteor.isSimulation) post.client = true;

        return Threads.insert(post, function(err, doc) {
          if (err) {
            throw new Meteor.Error(500, 'Thread could not be added');
          } else if (Meteor.isServer) {
            var user = Meteor.userId();
            Meteor.defer(function() {
              Meteor.call('subscribe', {
                subject: doc
              });

              if (Meteor.isServer) Meteor.users.update({
                _id: user
              }, {
                $inc: {
                  'profile.score': 1
                }
              });

              if(post.ancestors) Meteor.call('replyNotification', doc);
            });

            if(post.ancestors && post.ancestors.constructor === Array) {
              Threads.update({_id: {$in: post.ancestors}}, {$inc: {life: 60}}, {multi: true});
            }

          }
        });
      } else {

        return "Sorry, your post did not fit the length requirements.";
      }

  },
  'updateProfile': function (field, value) {

    //Before update
    if(field === 'avatar') {
      var avatarEh = Meteor.user().profile.avatar;
      if(avatarEh) {
        let oldAvatar = avatarEh.split('.com')[1];
        //Delete the existing avatar from the server
        if(oldAvatar) {
          Meteor.call('_s3_delete', oldAvatar);
          console.log ( "Meteor.call('_s3_delete', '"+oldAvatar+"');");
        }
      } //ELSE: The user does not currently have an avatar
    }
    console.log(field, value);
    var selector = {$set: {}};
    selector.$set['profile.'+field] = value;
    Meteor.users.update({_id: Meteor.userId()}, selector);
  },
  'heartbeat': function() {
    this.unblock();
    if(Meteor.isClient) {
      //Get list of posts to beat
      var posts = Heartbeats.find({beats: Meteor.userId()}).map(function(beat) {
        return beat._id;
      });

      Threads.update({_id: {$in: posts}, 'reactions.user': {$nin: [Meteor.userId()]}}, {$inc: {life: -1}}, {multi: true});

    }
  },
  'registerHeartbeat': function(post, eh) { //TODO Replace with individual documents
    this.unblock();
    if(post && eh) {
      //Registering a new heartbeat
      var denyEh = Heartbeats.findOne({_id: post._id, beats: Meteor.userId()});
      if(denyEh) {
        return false;
      } else {
        Heartbeats.upsert({_id: post._id}, {$push: {beats: Meteor.userId()}});
      }
    } else if (post){
      //Removing a heartbeat
      var approveEh = Heartbeats.findOne({_id: post._id, beats: Meteor.userId()});
      if(approveEh) {
        Heartbeats.update({_id: post._id}, {$pull: {beats: Meteor.userId()}});
      } else {
        return false;
      }
    }
  },
  'clearHeartbeats': function(post) {
    this.unblock();
    let beats = Heartbeats.find({beats: Meteor.userId()}).map(function (post) {
      return post._id;
    });

    if(beats) {
      Heartbeats.remove({_id: {$in: beats}});
    }
  },
  'likePost': function (postId, likingEh) {
    if(likingEh) {
      //User wants to like the post
      Threads.update({_id: postId}, {$push: {reactions: {user: Meteor.userId()}}});
      Meteor.call('registerHeartbeat', {_id: postId}, false);
    } else {
      //User wants to unlike the post
      Threads.update({_id: postId}, {$pull: {reactions: {user: Meteor.userId()}}});
      Meteor.call('registerHeartbeat', {_id: postId}, true);
    }
  }
});
