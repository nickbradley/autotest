#!/usr/bin/env bash

version=1.0.0
date=$(date +%FT%T.%3NZ)
startTime=$(date +%s)
duration=$(($(date +%s) - $startTime))

# ##############################################################################
# PRE
# ##############################################################################

printf "<PRE_BUILD_DELIVERABLE_TESTS>\n"

	
printf "</PRE_BUILD_DELIVERABLE_TESTS>\n"


# ##############################################################################
# BUILD DELIVERABLE TESTS
# ##############################################################################
 
printf "<BUILD_DELIVERABLE_TESTS>\n"

cd ../deliverableTests
./gradlew clean compileTestJava
status=$?

printf "</BUILD_DELIVERABLE_TESTS exitcode=${status}, completed=${date}, duration=${duration}s>\n\n\n"

if [ $status -ne 0 ]
then
  exit 23
fi


# ##############################################################################
# POST
# ##############################################################################


printf "<POST_BUILD_DELIVERABLE_TESTS>\n"



printf "</POST_BUILD_DELIVERABLE_TESTS>\n\n"
