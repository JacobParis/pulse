Template.Home.helpers({
  version: function () {
    return VERSION;
  },
  avatar: function () {
    var avatar = Meteor.user().profile.avatar;
    if(avatar) return avatar;
    else return 'images/noavatar.png';
  },
  score: function() {
    return Meteor.userId() ? Meteor.user().profile.score : false;
  },
  myMasks: function() {
    return Roles.getRolesForUser(Meteor.userId(), 'masks');
  },
  invitations: function() {
    return Invitations.find({
      sender: Meteor.userId()
    });
  },
  code: function() {
    return this.alias ? this.alias : this._id;
  },
  notifications: function() {
    return Notes.find({}, {
      sort: {
        timestamp: -1
      }
    });
  },
  notesCount: function() {
    return Notes.find({}).count();
  },
  username: function () {

    var name = Meteor.userId() ? Meteor.user().profile.username : false;
    return name ? name : "Enter your username here";
  },
  editing: function () {
    return Session.get('home-edit');
  },
  profileColour: function (colour) {
    var profile = Meteor.user().profile;
    if(profile) {
      return colour ? profile.colour === colour : profile.colour;
    }
  },
  path: function() {
    if (this.type === "comment" || this.type === "heart") {
      var a = this.data.thread || this.data.parent;
      var b = null;
      var thread = Threads.findOne({
        _id: a
      });
      if (thread) b = thread.room;

      return b + "/" + a;
    } else {
      return "#";
    }
  },
  type: function() {
    if (this.type === "comment") return "New Comment";
    else if (this.type === "block") return "Blocked User";
    else if (this.type === "report") return "Reported Post";
    else if (this.type === "heart") return "New Like";
  },
  icon: function() {
    if (this.type === "comment") return "comment";
    else if (this.type === "block") return "block-helper";
    else if (this.type === "report") return "comment-alert";
    else if (this.type === "heart") return "heart";
  },
  me: function() {
    if (this.type === "heart") {
      return "me";
    } else return false;
  }
});

Template.Home.events({
  'change #settings-notifications' : function (e, t) {
    var checkedEh = e.currentTarget.checked;
    Meteor.call('updateProfile', 'notifications', checkedEh);
  },
  'click .invitation': function(e, t) {
    var modal = {
      message: "Share this invitation?",
      buttons: [{
        label: "SHARE",
        action: 'share',
        data: {
          invitation: this.code
        }
      }, {
        label: "CANCEL",
        action: 'cancel'
      }],
    };
    Session.set('modal', modal);
  },
  'click #contact-send': function(e, t) {
    var post = {
      content: t.find('#contact-text').value
    };

    t.find('#contact-text').value = "";
    Meteor.call('submitSupport', post);
  },
  'click #home-logout': function(e, t) {
    Meteor.logout();
  },

  
});
