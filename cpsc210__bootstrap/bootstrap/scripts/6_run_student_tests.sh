#!/usr/bin/env bash

version=1.0.0


# ##############################################################################
# PRE
# ##############################################################################

printf "<PRE_RUN_STUDENT_TESTS>\n"


printf "</PRE_RUN_STUDENT_TESTS>\n"


# ##############################################################################
# RUN STUDENT TESTS
# ##############################################################################
 
printf "</RUN_STUDENT_TESTS>\n"

cd ../studentTests
./gradlew clean junitPlatformTest junitPlatformJacocoReport --continue
cd ../scripts

printf "</RUN_STUDENT_TESTS>\n\n"

# ##############################################################################
# POST
# ##############################################################################


printf "<POST_RUN_STUDENT_TESTS>\n"



printf "</POST_RUN_STUDENT_TESTS>\n\n"
