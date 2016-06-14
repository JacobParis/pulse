App.info({
  name: 'Pulse',
  id: 'com.jacobpariseau.pulse',
  description: 'Share limited-time posts with the world',
  version: '1.0.0'
});

App.icons({
  'android_mdpi': 'device/images/icon-mdpi.png',
  'android_hdpi': 'device/images/icon-hdpi.png',
  'android_xhdpi': 'device/images/icon-xhdpi.png',
  'iphone_2x': 'device/images/icon-iphone_2x.png',
  'iphone_3x': 'device/images/icon-iphone_3x.png',
  'ipad': 'device/images/icon-ipad.png',
  'ipad_2x': 'device/images/icon-ipad_2x.png'
});

App.setPreference('Orientation', 'all', 'ios');

App.accessRule('*://the.masquerade.sh/*');
App.accessRule('*://localhost:12768*');
App.accessRule('*.kadira.io');
App.accessRule("blob:*");
App.accessRule('*://s3-us-west-2.amazonaws.com/pulse-avatars*');
App.accessRule('*://pulse-avatars.s3-us-west-2.amazonaws.com/*');
