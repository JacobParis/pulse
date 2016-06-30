parseAddress = function(input) {
  var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  var phoneRegex = /^[2-9]\d{2}[2-9]\d{2}\d{4}$/;
  var phoneDigits = input.replace(/\D/g, "");

  if(emailRegex.test(input)) {
    return {
      identifier: input,
      type: 'email'
    };
  } else if (phoneRegex.test(phoneDigits)) {
    var raw = null;
    if (phoneDigits.length < 11) raw = '+1' + phoneDigits;
    else if (phoneDigits.length === 11) raw = '+' + phoneDigits;
    else raw = a;

    return {
      identifier: raw,
      type: 'phone'
    };
  } else return false;
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
  'click #create-account': function(e, t) {
    e.preventDefault();

    //Check if email or phone
    let username = parseAddress(t.find('#login-username').value);
    if(username.type == "phone") {
      //Has the user entered a code?
      var authField = Template.instance().authField.get();
      if(authField) {
        let code = t.find('#login-code').value.toString();
        let phone = username.identifier;

        if(code.length == 6 && phone.length > 9) {
          Accounts.loginByPhone(code, phone, function (err) {
            if(err) throw err;
          });
        }
      } else {
        //The user has not entered a code, send one
        Meteor.call('newUser', username);
        Template.instance().authField.set(true);
      }
    } else if(username.type == "email") {
      Meteor.call('newUser', username);
    }
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
  auth: function() {
    return Template.instance().authField.get();
  }
});

Template.LoginForm.onCreated(function() {
  var instance = this;
  instance.loginText = new ReactiveVar("Welcome to Pulse Messenger!");
  instance.authField = new ReactiveVar(false);
});
