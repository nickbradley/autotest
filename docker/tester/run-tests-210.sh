#!/usr/bin/env bash

# ##############################################################################
# run-tests-210.sh
# Andrew Stec <steca@cs.ubc.ca>
#
# Description:
# Just a placer file for now. Business logic is self-contained in /bootstrap repo of 210 
# container. 
#
# Keeping this file because it is necessary for 310 at the moment. Trying to maintain a consistent
# structure for Autotest API.
#
# Will likely need the WHITELISTED_SERVERS logic.
#
# Parameters:
#
# Environment Variables
#  WHITELISTED_SERVERS="host:port host:port ..." List of hostnames to allow access
#  ALLOW_DNS=1|0 If enabled then WHITELISTED_SERVERS can contain hostnames in addition to IP addresses
#  TESTSUITE_VERSION=commit The SHA of the commit
#
# Notes:
#  1) Expects the deliverable repo exist in deliverableDir with up to date packages (node_modules)
# ##############################################################################


projectDir="/cpsc310project"
deliverableDir="/testsuite"
bootstrapDir="/bootstrap"
outputDir="/container-io/output"
bootstrapName="cpsc210__bootstrap"

buildCmd="yarn run build"
#coverCmd="nyc -r json-summary yarn run test"
coverCmd="yarn run cover"
testsCmd="yarn run autotest"

date=$(date --utc +%FT%T.%3NZ)

printf "<INFO>\nproject url: %s\nbranch: %s\ncommit: %s\nscript version: %s\ntest suite version: %s\n</INFO exitcode=0, completed=%s, duration=0s>\n\n\n" \
  "$( echo "${PROJECT_URL}" | sed 's/\(.*:\/\/\).*@\(.*\)/\1\2/' )" \
  "${PROJECT_BRANCH}" \
  "${PROJECT_COMMIT}" \
  "${bootstrapName}: ${TESTSUITE_VERSION}" \
  "${date}"

printf "pushd /cpsc210__bootstrap/"
pushd /cpsc210__bootstrap/

# during development
git pull

printf "./runTests.sh"
./runTests.sh

# Clone the specified student repo into the projectDir
# Exit if unable to clone the student's repo

status=$?

printf "</FILE_OPERATIONS exitcode=%d, completed=%s, duration=%ds>\n\n\n" "${status}" "${date}" "${duration}"
exit 0
