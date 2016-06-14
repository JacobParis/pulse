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
  'input #settings-name': function (e, t) {
    Session.set('home-edit', true);
  },
  'click #settings-name ~ button[type=reset]': function (e, t) {
    t.find('#settings-name').value = "";
    Session.set('home-edit', false);
  },
  'click #settings-name ~ button[type=submit]': function (e, t) {
    Meteor.call('updateProfile', 'username', t.find('#settings-name').value.toUpperCase());

      t.find('#settings-name').value = "";
    Session.set('home-edit', false);
  },
  "change input.file_bag": function(e, t){
    var data;
    var file = $("input.file_bag")[0].files[0];

    var fileReader = new FileReader();
    fileReader.onload = function (e) {
      /*var exif = EXIF.readFromBinaryFile(new BinaryFile(file));
      switch(exif.Orientation){
        case 2:
            // horizontal flip
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            break;
        case 3:
            // 180° rotate left
            ctx.translate(canvas.width, canvas.height);
            ctx.rotate(Math.PI);
            break;
        case 4:
            // vertical flip
            ctx.translate(0, canvas.height);
            ctx.scale(1, -1);
            break;
        case 5:
            // vertical flip + 90 rotate right
            ctx.rotate(0.5 * Math.PI);
            ctx.scale(1, -1);
            break;
        case 6:
            // 90° rotate right
            ctx.rotate(0.5 * Math.PI);
            ctx.translate(0, -canvas.height);
            break;
        case 7:
            // horizontal flip + 90 rotate right
            ctx.rotate(0.5 * Math.PI);
            ctx.translate(canvas.width, -canvas.height);
            ctx.scale(-1, 1);
            break;
        case 8:
            // 90° rotate left
            ctx.rotate(-0.5 * Math.PI);
            ctx.translate(-canvas.width, 0);
            break;
        }*/

        var img = new Image();
        img.onload = function () {
            var MAX_WIDTH = 640;
            var MAX_HEIGHT = 960;
            var width = img.width;
            var height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            var canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            canvas.getContext("2d").drawImage(this, 0, 0, width, height);
            //data = canvas.toDataURL();
            canvas.toBlob(function (blob) {
              var uploader = new Slingshot.Upload("myFileUploads");

              uploader.send(blob, function (error, downloadUrl) {
                if (error) {
                  // Log service detailed response.
                  console.error('Error uploading', uploader);
                  alert (error);
                }
                else {
                  Meteor.call('updateProfile', 'avatar', downloadUrl);
                }
              });
            }, 'image/png');



        };
        img.src = e.target.result;
    };
    fileReader.readAsDataURL(file);
  }
});
