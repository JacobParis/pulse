SyncedCron.add({
  name: 'Autopost',
  schedule: function(parser) {
    return parser.text('every 60 seconds');
  },
  job: function() {
    var post = {
      content: '',
      room: 'grande-prairie-regional-college',
      timestamp: Date.now()
    };

    _.times(_.random(3)+1, function (n) {
      post.content = post.content + Fake.sentence()+" ";
    });

    var myColours = ["red", "orange", "green", "cyan", "blue", "violet"];
    for (let i = myColours.length - 1; i > 0; i--) { //Durstenfield shuffle
      let j = Math.floor(Math.random() * (i + 1));
      let temp = myColours[i];
      myColours[i] = myColours[j];
      myColours[j] = temp;
    }

    //Choose from posts made in the last ten minutes
    var total = _.random(Threads.find({timestamp: {$gt: Date.now()-600000}}).count() - 2)+1;
    var original = Threads.find({timestamp: {$gt: Date.now()-600000}}, {limit: 1, skip: total, sort: {timestamp: -1}}).fetch()[0];

    if(original && _.random(10)) { //10% chance of original post, 90% chance of reply
      if(original.ancestors) { //If the original was not a reply
        post.ancestors = original.ancestors;
        post.ancestors.push(original._id);
      } else post.ancestors = [original._id]; //Else original is a reply

      var matches;
      //I have not yet posted in this thread


      //Check to see if there is a colour nobody has used yet
      for (let j = myColours.length - 1; j > 0; j--) {
        if (myColours[j] === original.colour) continue;
        matches = Threads.findOne({
          'ancestors.0': post.ancestors[0],
          'colour': myColours[j]
        });
        if (matches) continue;
        else {
          post.colour = myColours[j];
          break;
        }


        //All colours have been used on other masks, default to first
        if (!post.colour) {
          post.colour = myColours[0] === original.colour ? myColours[1] : myColours[0];
          break;
        }
      }
    } else {
      post.colour = myColours[0];
    }
      if(post.colour) {
        Threads.insert(post);
      }

  }
});

SyncedCron.add({
  name: 'Remove dead posts',
  schedule: function(parser) {
    return parser.text('every 60 seconds');
  },
  job: function() {
    Threads.remove({life: {$lte: 0}});
  }
});

SyncedCron.start();
