#!/usr/bin/env bash

version=1.0.0
startTime=$(date +%s)
date=$(date +%FT%T.%3NZ)
duration=$(($(date +%s) - $startTime))

# ##############################################################################
# PRE
# ##############################################################################

printf "<PRE_BUILD_STUDENT_TESTS>\n"


printf "</PRE_BUILD_STUDENT_TESTS>\n"


# ##############################################################################
# BUILD STUDENT TESTS 
# ##############################################################################
 
printf "<BUILD_STUDENT_TESTS>\n"

cd ../studentTests
./gradlew clean compileTestJava
status=$?

printf "</BUILD_STUDENT_TESTS exitcode=${status}, completed=${date}, duration=${duration}s>\n\n\n"

if [ $status -ne 0 ]
then
  exit 23
fi


# ##############################################################################
# POST
# ##############################################################################


printf "<POST_BUILD_STUDENT_TESTS>\n"



printf "</POST_BUILD_STUDENT_TESTS>\n\n"
