Meteor.subscribe('roles');
Meteor.subscribe('notes');
Meteor.subscribe('invitations');
Meteor.subscribe('bundles');
Meteor.subscribe('selfData');
Meteor.subscribe('heartbeats');
//Threads is subscribed to in Feed


VERSION = '1.0.0';

Template.layout.events({
  'click a, click button': function(e, t) {
    var target = e.currentTarget;

    target.classList.add("pressed");
    setTimeout(function() {
      target.classList.remove("pressed");
    }, 400);
  }
});

Template.layout.helpers({
  route: function(test) {
    if (Meteor.user()) {
      var route = Router.current().route.getName();
      return test ? (route === test) : route;
    }
  },
  walls: function() {
    return Roles.getRolesForUser(Meteor.userId(), 'rooms');
  },
  title: function() {
    var name = this;
    if (name) {
      var one = name.replace(/-/g, ' ');
      var title = one.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });

      return title;
    }
  },
  dialog: function() {
    var modal = Session.get('modal');
    return modal;
  },
  singlePost: function () {
    return Router.current().params.post;
  },
  footerText: function () {
    return Session.get('footerText');
  }
});

Template.layout.onCreated(function() {
  var instance = this;

  /*if (Meteor.user()) instance.score = new ReactiveVar(Meteor.user().profile.score);
  else instance.score = new ReactiveVar(0);
  instance.splash = new ReactiveVar(false);
  instance.reveal = function() {
    instance.splash.set(true);
    instance.score.set(Meteor.user().profile.score);

    Meteor.setTimeout(function() {
      Meteor.setTimeout(function() {
        instance.splash.set(false);
      }, 500);
    }, 500);
  };
  */
  Push.addListener('message', function(notification) {
        console.log(notification);
  });

/*  Meteor.users.find({
    _id: Meteor.userId()
  }, {
    fields: {
      'profile.score': 1
    }
  }).observeChanges({
    changed: function(doc) {
      if (Math.abs(instance.score.get() - Meteor.user().profile.score) > 10)
        instance.reveal();
    }
  });
*/
  if(!Session.get('footerText')) {
    Session.set('Get Pulse Messenger now!');
  }
});

Template.modal.events({
  'click button': function(e, t) {
    var author = null;
    var me = Meteor.userId();
    if (this.action === 'block') {
      author = this.data.author;
      Meteor.call("blockUser", author);
    } else if (this.action === 'report') {
      author = this.data.author;
      var content = this.data.content;

      var report = {
        perpetrator: author,
        accuser: me,
        details: {
          content: content
        }
      };

      if (this.data.thread) { //If it has a thread reference then it's a comment
        report.details.thread = this.data.thread;
        report.details.comment = this.data._id;
      } else { //Otherwise it's a thread
        report.details.thread = this.data._id;
      }
      if (this.data.comment) report.details.comment = this.data.comment._id;

      Meteor.call("reportUser", report);
      Meteor.call('blockUser', author);
    } else if (this.action === 'delete') {
      var thread = this.data.thread;
      var comment = this.data.comment;
      if (thread) {
        var sample = Threads.findOne({
          _id: thread
        });
        if (sample.author === me) {
          Threads.remove(thread, function(error, result) {
            if (error) {
              throw new Meteor.Error(500, error);
            }
          });
        }
      }
    } else if (this.action === 'unsubscribe') {
      var subject = this.data.thread;
      var type = "thread";

      Meteor.call('unsubscribe', {
        subject: subject,
        type: type
      });

    } else if (this.action === 'share') {
      if (this.data.invitation) {
        if (Meteor.isCordova) {
          var message = 'You have been invited to Masquerade!';
          var subjectLine = 'The Masquerade';
          var image = null;
          var link = 'http://the.masquerade.com/login/' + this.data.invitation;
          window.plugins.socialsharing.share(
            message,
            subjectLine,
            image,
            link
          );
        }
      }
    } else if (this.action === 'cancel') {}

    Session.set('modal', null);
  }
});

Notify.find().observe({
  added: function(document) {
    if (!Meteor.isCordova) Notifications.info(document.title, document.content);
    Notes.insert(document);
    Notify.remove(document._id); //Remove when viewed
  }
});
