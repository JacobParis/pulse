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
      if(user) return "Reply to " + user.profile.username;
    } else return "What's on your mind?";
  },
  editing: function () {
    return Session.get('home-edit');
  },
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
