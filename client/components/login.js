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


  },
  'click #create-account': function(e, t) {
    e.preventDefault();

    //Check if email or phone
    let address = t.find('#login-username').value;
    //Check if email exists in system
    //Generate code
    //Send login email
    Meteor.call('newUser', address);
    //Check if phone exists in system
    //Generate code
    //Send SMS

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
  }
});

Template.LoginForm.onCreated(function() {
  var instance = this;
  instance.loginText = new ReactiveVar("Welcome to Pulse Messenger!");
});
