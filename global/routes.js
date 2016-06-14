Router.configure({
    layoutTemplate: 'layout'
});

Router.map( function () {
    this.route('Home', {
        path: '/profile',
        subscriptions: function () {
            return [
                Meteor.subscribe('notifications')
            ];
        },
        after: function () {
          analytics.page('Home');
        }
    });

    this.route('Moderate', {
        path: '/mod',
        subscriptions: function () {
            return [
                Meteor.subscribe('incidents'),
                Meteor.subscribe('questiondb')
            ];
        }
    });

    this.route('Logout', {
        path: '/exit',
        before: function () {
            Router.go('LoginForm');
            Meteor.logout();
        }
    });

    this.route('LoginForm', {
        path: '/login/:code?'
    });

    this.route('Post', {
      path: '/post/:post',
      template: 'Posts',
      before: function () {
        if(Meteor.userId()) {
            //If you're logged in clear notifications for this post
            var notes = Notes.find({
                'data.thread' : this.params.post,
                user: Meteor.userId()
            });

            var ids = notes.map(function(doc) {
                return doc._id;
            });

            for(var i = 0; i < ids.length; ++i) {
                var note = ids[i];
                Notes.remove({_id: note});
            }
        }
        this.next();
      },
      after: function () {
        if(this.params.post) analytics.page(this.params.post);
      }
    });
    this.route('Feed', {
        path: '/'
    });
});

var OnBeforeActions = {
    loginRequired: function(pause) {
        if(this.route.getName() === 'Feed' && this.params.post) {
            this.next();
        } else if (!Meteor.userId()) {
            this.render('LoginForm');
        } else if (this.route.getName() === 'LoginForm') { //TODO Test
            this.render('Home');
        } else this.next();
    },
    adminRequired: function(pause) {
        var me = Meteor.userId();
        if (Roles.userIsInRole(me, 'admin')) {
            this.next();
        } else {
            this.render('Home');
        }
    }
};

Router.onBeforeAction(OnBeforeActions.loginRequired, {
    only: [ 'Feed', 'Settings', 'Incidents', 'Home', 'Moderate', 'Notifications', 'Contact']
});

Router.onBeforeAction(OnBeforeActions.adminRequired, {
    only: ['Moderate']
});

Router.configure({
    notFoundTemplate: "Home"
});
