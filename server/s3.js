S3.config = {
    key: 'AKIAJFP77O2TWYFRDVCA',
    secret: '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',
    bucket: 'pulse-avatars',
    region: 'us-west-2', // Only needed if not "us-east-1" or "us-standard"
    path: 'avatars'
};

Meteor.startup(function() {
  Slingshot.createDirective("myFileUploads", Slingshot.S3Storage, {
    bucket: 'pulse-avatars',
    region: 'us-west-2',
    key: function () {
      return "avatars/" + Fake.word() + Fake.word() + Fake.word() + ".png";
    },
    authorize: function () {
      return true;
    },
    maxSize: 0,
    allowedFileTypes: null
  });

  Slingshot.createDirective("posts", Slingshot.S3Storage, {
    bucket: 'pulse-avatars',
    region: 'us-west-2',
    key: function () {
      return "posts/" + Fake.word() + Fake.word() + Fake.word() + ".png";
    },
    authorize: function () {
      return true;
    },
    maxSize: 0,
    allowedFileTypes: null
  });

});
