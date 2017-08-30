#!/usr/bin/env bash

echo 'copy grade_config.xml to ./bootstrap/config/'
cp ./cpsc210deliverablerepo/$DELIVERABLE_TO_MARK/grade_config.xml ./bootstrap/config/

echo 'pushd ./bootstrap/scripts/'
pushd ./bootstrap/scripts

python3 generate_feedback.py

