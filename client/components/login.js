Phone = function(number) {
  var a = number.replace(/[^\d\+]/g, '');
  var b = null;
  if (a.length < 11) b = '+1' + a;
  else if (a.length === 11) b = '+' + a;
  else b = a;

  return b;
};

Tracker.autorun(function() {
  var currentRoute = Router.current();
  if (currentRoute === null) {
    return;
  }

  if (currentRoute && currentRoute.route && currentRoute.route.getName() === 'LoginForm' && Meteor.user() !== null)
    Router.go('Home');
});

Template.LoginForm.events({
  'submit #login-form': function(e, t) {
    e.preventDefault();

    Meteor.loginWithPhoneAndPassword({
        phone: Phone(t.find('#login-phone').value)
      },
      t.find('#login-password').value,
      function(err) {
        if (err) t.loginText.set(err.reason);
        else Router.go('Home');
      }
    );
  },
  'click #new-user': function(e, t) {
    e.preventDefault();

    t.loginText.set("Enter your invitation code.");

    t.creating.set(true);
  },
  'click #create-account': function(e, t) {
    e.preventDefault();

    var options = {
      phone: Phone(t.find('#login-phone').value),
      password: t.find('#login-password').value
    };

    var invitation = t.find('#login-invite');

    if(invitation && invitation.value.length) {
      options.invitation = invitation.value;
      console.log('HAS CODE');
      Meteor.call('newUser', options);

      Accounts.requestPhoneVerification(options.phone, function(err) {
        if (err) t.loginText.set(err);
        else {
          t.loginText.set("An access code has been sent to your phone");

          t.codeSent.set(true);
        }
      });

    } else {
      console.log('GENERATE CODE');
      Meteor.call('requestInvite', function(err, result) {
        if (err) {
          t.loginText.set('There are no free invite codes available.');
          throw new Meteor.Error('403', "You cannot sign up without an invitation.");
        } else {
          options.invitation = result;
          Meteor.call('newUser', options);
          Accounts.requestPhoneVerification(options.phone, function(err) {
            if (err) t.loginText.set(err);
            else {
              t.loginText.set("An access code has been sent to your phone");

              t.codeSent.set(true);
            }
          });
        }
      });
    }




  },
  'click #login-hasInvite': function(e, t) {
    e.preventDefault();

    t.hasInvite.set(true);
  },
  'click #verify-phone': function(e, t) {
    var verificationCode = t.find('#login-code').value;
    var newPassword = null;

    Accounts.verifyPhone(Phone(t.find('#login-phone').value), verificationCode, newPassword, function(err) {
      if (err) t.loginText.set(err);
    });
  },
  'click #login-cancel': function(e, t) {
    t.creating.set(false);
    t.hasInvite.set(false);
    t.codeSent.set(false);
    t.invitePanel.set(false);
    t.loginText.set('Welcome to Pulse Messenger!');
  },
  'click #login-logout': function(e, t) {
    e.preventDefault();

    Meteor.logout();
  }
});



Template.LoginForm.helpers({
  currentUser: function() {
    var user = Meteor.userId();
    if(user) return user;
    else Router.go('Feed');
  },
  LoginText: function() {
    return Template.instance().loginText.get();
  },
  defaultCode: function() {
    return Router.current().params.code;
  },
  creating: function() {
    return Template.instance().creating.get();
  },
  codeSent: function() {
    return Template.instance().codeSent.get();
  },
  invitations: function() {
    return Template.instance().invitePanel.get();
  },
  hasInvite: function () {
    return Template.instance().hasInvite.get();
  }
});

Template.LoginForm.onCreated(function() {
  var instance = this;

  var creating = !!Router.current().params.code;
  instance.creating = new ReactiveVar(creating);
  instance.codeSent = new ReactiveVar(false);
  instance.invitePanel = new ReactiveVar(false);
  instance.hasInvite = new ReactiveVar(creating);
  instance.loginText = new ReactiveVar("Welcome to Pulse Messenger!");
});
