#!/bin/bash

#Sign APK

cd ~/documents/pulse/bin/android
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 release-unsigned.apk Pulse
current_time="production-"$(date "+%Y.%m.%d-%H.%M.%S")."apk"
~/Library/Android/sdk/build-tools/23.0.2/zipalign 4 release-unsigned.apk $current_time
exit
