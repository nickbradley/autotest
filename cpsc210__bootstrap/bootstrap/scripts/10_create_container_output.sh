#!/usr/bin/env bash

version=1.0.0

BOOTSTRAP_REPO_DIR="../../"
SCRIPTS_DIR_PATH="./bootstrap/scripts"
DEV_OUTPUT="../../output"
LIVE_OUTPUT="/output"
JSON_REPORT_PATH="../../output/feedback/report.json"
JSON_COVERAGE_PATH="../../output/feedback/coverage.json"
TESTS_JSON_PATH="../../output/feedback/tests.json"

# ##############################################################################
# PRE
# ##############################################################################

printf "<PRE_CREATE_JSON_OUTPUT>\n"

# Run CPSC 210 Script to output JSON compatible with AutoTest/Docker container 
# schema

printf "Running script to produce JSON output compatible with AutoTest/Docker schema: \n"

echo "pushd $BOOTSTRAP_REPO_DIR \n"
pushd $BOOTSTRAP_REPO_DIR
echo "./genFeedback.sh \n"
./genFeedback.sh

printf "</PRE_CREATE_JSON_OUTPUT> \n"


# ##############################################################################
# RUN CREATE JSON OUTPUT
# ##############################################################################
 
printf "</CREATE_JSON_OUTPUT>\n"

if [ -z ${IS_CONTAINER_LIVE+x} ]; then
  # If the container is not live, do nothing
  printf "CPSC210__bootstrap is not running live in a container; not producing container /output content\n"
else
  # Move JSON output to /output directory if live
  printf "CPSC210__bootstrap is live in container. Moving JSON output to /output directory.\n"
  pushd $SCRIPTS_DIR_PATH
  printf "pushd $SCRIPTS_DIR_PATH \n" 
  mv $JSON_REPORT_PATH $LIVE_OUTPUT/
  printf "mv $JSON_REPORT_PATH $LIVE_OUTPUT/ \n"
#  mv $JSON_COVERAGE_PATH $LIVE_OUTPUT/
#  printf "mv $JSON_COVERAGE_PATH $LIVE_OUTPUT/ \n"
#  mv $TESTS_JSON_PATH $LIVE_OUTPUT/
#  printf "mv $TESTS_JSON_PATH $LIVE_OUTPUT/ \n"
fi

printf "</CREATE_JSON_OUTPUT>\n\n"

# ##############################################################################
# POST
# ##############################################################################


printf "<POST_CREATE_JSON_OUTPUT>\n"



printf "</POST_CREATE_JSON_OUTPUT>\n\n"

