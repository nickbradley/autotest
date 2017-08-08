#!/usr/bin/env bash

# ##############################################################################
# run-tests.sh
#
# Originally Built by:
# Nick Bradley <nbrad11@cs.ubc.ca>
#
# Refactored/Maintained by:
# <steca@cs.ubc.ca>
#
# Description:
#  1) Sets ENV variables in the Docker container.
# Parameters:
#  Passes all parameters to pull-repo.sh
#
# Environment Variables
#  WHITELISTED_SERVERS="host:port host:port ..." List of hostnames to allow access
#  ALLOW_DNS=1|0 If enabled then WHITELISTED_SERVERS can contain hostnames in addition to IP addresses
#  TESTSUITE_VERSION=commit The SHA of the commit
#
# Notes:
#  1) Expects the deliverable repo exist in deliverableDir with up to date packages (node_modules)
# ##############################################################################

version=1.0.2
date=$(date --utc +%FT%T.%3NZ)

printf "<INFO>\nproject url: %s\nbranch: %s\ncommit: %s\nscript version: %s\ntest suite version: %s\n</INFO exitcode=0, completed=%s, duration=0s>\n\n\n" \
  "$( echo "${PROJECT_URL}" | sed 's/\(.*:\/\/\).*@\(.*\)/\1\2/' )" \
  "${PROJECT_BRANCH}" \
  "${PROJECT_COMMIT}" \
  "${version}" \
  "${TESTSUITE_VERSION}" \
  "${date}"

pushd /cpsc310__bootstrap
printf 'Starting test scripts: \n'
printf './runTests.sh'
./runTests.sh 

# Zip the coverage directory and copy it and the mocha report to the output directory
# http://stackoverflow.com/questions/18933975/zip-file-and-print-to-stdout
# printf "<FILE_OPERATIONS>\n"
# startTime=$(date +%s)

#   echo "Copying ${projectDir}/mocha_output/mochawesome.json to ${outputDir}/mocha.json."
#   cp "${projectDir}/mocha_output/mochawesome.json" "${outputDir}/mocha.json" 2>&1
#   echo "Copying ${projectDir}/coverage/coverage-summary.json to ${outputDir}/coverage.json"
#   cp "${projectDir}/coverage/coverage-summary.json" "${outputDir}/coverage.json"
#   # echo "Archiving ${projectDir}/coverage as ${outputDir}/coverage.zip."
#   # zip -r "${outputDir}/coverage.zip" "${projectDir}/coverage" 2>&1

# status=$?
# duration=$(($(date +%s) - $startTime))
# date=$(date --utc +%FT%T.%3NZ)

# printf "</FILE_OPERATIONS exitcode=%d, completed=%s, duration=%ds>\n\n\n" "${status}" "${date}" "${duration}"
exit 0
