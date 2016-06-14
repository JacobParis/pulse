#!/bin/bash

#Build Masquerade for Android
cd ~/documents/masquerade/app
meteor build ~/documents/masquerade/bin --mobile-settings settings.json  --server http://the.masquerade.sh/
exit
