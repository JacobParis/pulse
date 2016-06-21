


Meteor.autorun(function () {
  var limit = Math.max(Session.get('postLimit'), 20);

  Meteor.subscribe('oldPosts', limit);
});

Template.Posts.onCreated(function() {
  var instance = this;

  instance.autorun(function() {
    if (Router.current().params.post) {
      instance.subscribe('singlePost', Router.current().params.post);
    }
  });
});

Template.Feed.onCreated(function() {
  var instance = this;
  Meteor.call('clearHeartbeats');

  Session.set('postTime', Date.now());
  Meteor.subscribe('newPosts');

  let postLimit = (Session.get('postLimit') > 20) ? Session.get('postLimit') : 20;
  Session.set('postLimit', postLimit);

  $(window).on('scroll', function(e) {
    if(!Router.current().params.post && Session.get('postLimit') < 400) {
      if ($(window).scrollTop() >= $(document).height()-2*($(window).height())) {
        var limit = Session.get('postLimit');
        if(Threads.find({}).count() >= limit) {
          limit = Math.min(limit+20, 400);
          Session.set('postLimit', limit);
        }
      }
    }
  });


});

Template.Feed.onRendered(function() {
  AnimatedEach.attachHooks(this.find('#feed-posts'), 'body', 100);
});

Template.Posts.onRendered(function() {
  AnimatedEach.attachHooks(this.find('#feed-posts'), 'body', 100);
});

Template.Posts.helpers({
  singlePost: function() {
    var controller = Iron.controller();
    var params = controller.getParams();
    if(params && params.post) {
      return Threads.findOne({
        _id: params.post
      }, {
        sort: {
          timestamp: -1
        }
      });
    } else return false;

  },

  replies: function() {
    var tier = this.ancestors ? this.ancestors.length : 0;
    var size = tier + 1;
    var query = {
      ancestors: {
        $size: size
      }
    };
    query['ancestors.' + tier] = this._id;
    return Threads.find(query, {
      sort: {
        timestamp: 1
      }
    });

  },
  ancestors: function() {
    return this.ancestors ? Threads.find({
      _id: {
        $in: this.ancestors
      }
    }, {
      sort: {
        timestamp: 1
      }
    }) : false;
  },
  showDownload: function() {
    var controller = Iron.controller();
    var params = controller.getParams();
    if(params && params.hash) return params.hash === "download";
  }
});
Template.Feed.helpers({
  allPosts: function() {
    return Threads.find({
      ancestors: {
        $exists: false
      },
      life: {$gte: 0}
    }, {
      sort: {
        timestamp: -1
      }
    });
  },
  settings: function() {
    return {
      position: 'below',
      limit: 0,
      rules: [
        /*{
            collection: 'categories',
            subscription: 'categories',
            field: 'name',
            options: '',
            template: Template.userPill
        }*/
      ]
    };
  }
});

Template.feedInput.events({
  'keypress div[contentEditable]': function(e, t) {
    if (e.which === 13 && !e.shiftKey) { //User presses enter
      e.preventDefault();
      var content = t.find('div[contentEditable]').textContent;

      if (content.length > 0 && content.length <= 1000) {
        var post = {
          content: content
        };

        if (this._id) post.ancestors = [this._id];

        t.find('div[contentEditable]').textContent = "";

        //If there is an image to attach

        if(window.IMG) {
          var img = IMG;
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
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          data = canvas.toDataURL();
          $('.pending').remove();
          canvas.toBlob(function (blob) {
            var uploader = new Slingshot.Upload("posts");

            uploader.send(blob, function (error, downloadUrl) {
              if (error) {
                // Log service detailed response.
                console.error('Error uploading', uploader);
                alert (error);
              }
              else {
                post.temp = uploader.url();
                post.image = downloadUrl;
                IMG = null;
                Meteor.call("createPost", post);
              }
            });
          }, 'image/png');
        } else {
          //No image
          IMG = null;
          Meteor.call("createPost", post);
        }

      }
    }
  },
  'click #feed-input-send': function(e, t) {
    var content = t.find('div[contentEditable]').textContent;

    if (content.length > 0 && content.length <= 1000) {
      var post = {
        content: content
      };

      if (this._id) post.ancestors = [this._id];

      t.find('div[contentEditable]').textContent = "";

      //If there is an image to attach

      if(window.IMG) {
        var img = IMG;
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
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        data = canvas.toDataURL();
        $('.pending').remove();
        canvas.toBlob(function (blob) {
          var uploader = new Slingshot.Upload("posts");

          uploader.send(blob, function (error, downloadUrl) {
            if (error) {
              // Log service detailed response.
              console.error('Error uploading', uploader);
              alert (error);
            }
            else {
              post.temp = uploader.url();
              post.image = downloadUrl;
              IMG = null;
              Meteor.call("createPost", post);
            }
          });
        }, 'image/png');
      } else {
        //No image
        IMG = null;
        Meteor.call("createPost", post);
      }

    }
  },
  'click #feed-input-options' : function(e, t) {
    let bit = Session.get('feedOptions');

    if(bit) {
      //User is disabling the options menu
      //Remove the selected image
      $('.input-photo-pending').html('');
      IMG = null;
    }
    
    Session.set('feedOptions', !bit);
  },
  'change #photo-input': function(e, t) {
    var data;
    var file = $("#photo-input")[0].files[0];

    var fileReader = new FileReader();
    fileReader.onload = function (e) {
        var img = new Image();
        img.onload = function () {
          IMG = this;
          //If I don't clone, the uploaded image will match the CSS
          //Of this preview image
          let preview = $(this).clone().addClass('pending');
          $('.input-photo-pending').html(preview);
        };
        img.src = e.target.result;
    };
    fileReader.readAsDataURL(file);
  },
  'click .message-palette span' : function (e, t) {
    Meteor.call('updateProfile', 'colour', this.colour);
  }

});

Template.Feed.events({
  'click #sendLink': function(e, t) {
    var number = t.find('#download-phone').value; //TODO disable send until valid
    if (number.length > 9) {
      Meteor.call('sendLink', number);
      Session.set('pitchDialog', undefined);
    }

  }
});

Template.feedInput.helpers({
  avatar: function() {
    return Meteor.user().profile.avatar;
  },
  name: function() {
    return Meteor.user().profile.username;
  },
  options: function() {
    return Session.get('feedOptions');
  },
  placeholder: function () {
    if(this.author) {
      var user = Meteor.users.findOne({_id: this.author});
      if(user) return "Reply to "+user.profile.username;
    } else return "What's on your mind?";
  }
  /*colourInput: function(colour) {
    var profile = Meteor.user().profile;
    if(profile) {
      if (this.timestamp) { //If this is a reply
        var source = this.ancestors ? this.ancestors : this._id;
        var other = Threads.findOne({
          $or: [{
            'ancestors': source
          }, {
            _id: source
          }],
          author: Meteor.userId()
        });
        return other ? other.colour : profile.colour;
      } else if (this.author) {
        let pick = this.author === Meteor.userId() ? this.colour : profile.colour;
        return colour ? pick === colour : pick;
      } else {
        let pick = profile.colour;
        return colour ? pick === colour : pick;
      }
    } else {
      return colour ? 'black' === colour : 'black';
    }
  },
  colourSet: function () {
    if(this.ancestors || this._id) {
      var source = this.ancestors ? this.ancestors : this._id;
      var other = Threads.findOne({
        $or: [{
          'ancestors': source
        }, {
          _id: source
        }],
        author: Meteor.userId()
      });

      return !!other;
    }
  },
  colours: function () {
    return [
      {colour: 'red'},
      {colour: 'orange'},
      {colour: 'green'},
      {colour: 'cyan'},
      {colour: 'blue'},
      {colour: 'violet'}
    ];
  },*/


});


Template.post.events({
  'change .post-heart input': function(e, t) { //If the user has troubles hearting posts it could be that checked has
    e.preventDefault();
    var checkedEh = !!e.target.checked; //fallen out of sync and it's trying to perform the wrong tests

    Meteor.call('likePost', this._id, checkedEh);

  },
  'contextmenu .post .post-main': function(e, t) {
    e.preventDefault();

    var thread = this;
    var author = thread.author;
    var me = Meteor.userId();
    var modal = {};

    if (author === me) {
      modal = {
        message: "What would you like to do with your post?",
        buttons: [{
          label: "Stop receiving notifications",
          action: 'unsubscribe',
          data: {
            thread: thread._id
          }
        }, {
          label: "Delete this post",
          action: 'delete',
          data: {
            thread: thread._id
          }
        }, {
          label: "CANCEL",
          action: 'cancel'
        }],
      };
      Session.set('modal', modal);
    } else {
      modal = {
        message: "What would you like to do with this post?",
        buttons: [{
          label: "Stop receiving notifications",
          action: 'unsubscribe',
          data: {
            thread: thread._id
          }
        }, {
          label: "Report this post and block its author",
          action: 'report',
          data: {
            thread: thread._id,
            author: thread.author,
            content: thread.content
          }
        }, {
          label: "Block all their future posts",
          action: 'block',
          data: {
            author: thread.author
          }
        }, {
          label: "CANCEL",
          action: 'cancel'
        }]
      };

      Session.set('modal', modal);
    }
  },
  'click .post-seeMore': function(e, t) {
    e.preventDefault();
    var see = t.content.get();
    t.content.set((see === 300) ? 1000 : 300);
  }
});


Template.post.helpers({
  log: function() {
    console.log(this);
  },
  singlePost: function() {
    return Router.current().params.post === this._id ? true : false;
  },
  reply: function() {
    return this.parent ? "reply" : false;
  },
  showHide: function() {
    return (Template.instance().limit.get() === 0) ? "Hide" : "Show";
  },
  avatar: function() {
    var user = Meteor.users.findOne({_id: this.author});
    var avatar;
    if(user && user.profile && user.profile.avatar) {
      avatar = user.profile.avatar;
    }

    return avatar;
  },
  hearts: function() {
    return this.hearts ? this.hearts.length : 0;
  },
  likedEh: function() {
    var likedEh = Threads.findOne({
      _id: this._id,
      'reactions.user': Meteor.userId()
    });
    return likedEh;
  },
  replies: function() {
    return Threads.find({
      ancestors: this._id
    }).count();
  },
  me: function() {
    var user = Meteor.userId();
    var author = this.author;

    return (user === author) ? "me" : false;
  },
  time: function() {
    var user = Meteor.userId();
    var author = this.author;

    var realTime = Math.min(this.timestamp, Date.now());
    var time = moment(realTime).fromNow();

    return (user === author) ? time + " by you" : time;
  },
  colour: function(any) {
    var user = Meteor.userId();
    var author = this.author;

    //return (user === author || any) ? this.colour : "";
    return "black";
  },
  avcolour: function() {
    var user = Meteor.userId();
    var author = this.author;

    /*if (user === author) {
      return "white";
    } else {
      return this.colour;
    }*/ return "white";

  },
  dialog: function() {
    var post = Session.get('feed-posts-edit');
    var id = this._id;

    if (post && post.data.thread === id) return post;
  },
  content: function() {
    var post = Router.current().params.post;
    if (this.content) {
      return post ? this.content : this.content.slice(0, Template.instance().content.get());
    }
  },
  seeMore: function() {
    var post = Router.current().params.post;
    if (this.content) {
      return (this.content.length > Template.instance().content.get() && !post);
    }
  },
  charCount: function() {
    return Template.instance().charCount.get();
  },
  username: function () {
    var user = Meteor.users.findOne({_id: this.author});
    return user ? user.profile.username : false;
  },
  life: function () {
    return this.life; //Template.instance().life ? Template.instance().life.get() : false;
  }
});

Template.post.onCreated(function() {
  var instance = this;

  instance.limit = new ReactiveVar(4);
  instance.content = new ReactiveVar(300);
  instance.charCount = new ReactiveVar(1000);
  if (Router.current().params.post) {
    instance.autorun(function() {
      if (instance.data && instance.data.parent) Meteor.subscribe('singlePost', instance.data.parent);
    });
  }


    var self = this;
    self.life = new ReactiveVar(self.data.life);

});

Template.post.onRendered(function() {
  var data = this.data;
  var instance = this.$('div');
  instance.remaining = 60;

  var self = this;
  if(!self.life) self.life = new ReactiveVar(self.data.life);

  var heart = this.$('.post-heart i');

  var registerHeartbeat = (function () {
    self.life.set(self.data.life);

    if(data.author !== Meteor.userId()) { //Post is not my own
      if(instance.offset().top + instance.outerHeight() > $('body')[0].scrollTop && //Post is below top of window
      instance.offset().top < $('body')[0].scrollTop + $(window).height() && //Post is above bottom of window
      Threads.findOne({_id: data._id, 'reactions.user': {$nin: [Meteor.userId()]}}))
      {
        //The user is viewing the post currently
        //TODO If the post is not registered,
        //register it to start beating
        Meteor.call('registerHeartbeat', data, true);
      } else {
        //The user is not viewing the post
        //TODO If the post is registered
        Meteor.call('registerHeartbeat', data, false); //Unregister it
      }
    }
  })();

  $(window).on('scroll', _.throttle(function () {
    self.life.set(self.data.life);

    if(data.author !== Meteor.userId()) { //Post is not my own
      if(instance.offset().top + instance.outerHeight() > $('body')[0].scrollTop && //Post is below top of window
      instance.offset().top < $('body')[0].scrollTop + $(window).height() && //Post is above bottom of window
      Threads.findOne({_id: data._id, 'reactions.user': {$nin: [Meteor.userId()]}}))
      {
        //The user is viewing the post currently
        //TODO If the post is not registered,
        //register it to start beating
        Meteor.call('registerHeartbeat', data, true);
      } else {
        //The user is not viewing the post
        //TODO If the post is registered
        Meteor.call('registerHeartbeat', data, false); //Unregister it
      }
    }
  }, 1000));



});
