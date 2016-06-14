Meteor.methods({
  'uploadAvatar' : function (file) {
    if(Meteor.isClient) {
      S3.upload({
        files: file,
        path: "avatars",
        encoding: 'base64'
      },function(e,r){
        //Add to profile
        if(e) throw new Meteor.Error(500, e);
        else {
          if(r)
          Meteor.call('updateProfile', 'avatar', r.relative_url);
          else console.log(r);
        }
      });
    }
  }
});
