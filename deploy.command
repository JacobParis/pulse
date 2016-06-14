#!/bin/bash

#Deploy Masquerade to Galaxy

cd ~/documents/masquerade/app
DEPLOY_HOSTNAME=galaxy.meteor.com meteor deploy --settings settings.json the.masquerade.sh
exit
