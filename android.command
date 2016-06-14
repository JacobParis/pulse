#!/bin/bash

#Test on Android

cd ~/documents/masquerade/app
meteor run android-device --mobile-server=http://the.masquerade.sh/ --verbose --settings settings.json
exit
