#!/usr/bin/env bash

version=1.0.0


DELIVERABLE_TO_MARK="d0"
BOOTSTRAP_REPO_DIR="../../bootstrap"
STUDENT_REPO_DIR="../../cpsc210studentrepo"
DELIVERABLE_REPO_DIR="../../cpsc210deliverablerepo"
DELIVERABLE_TESTS_BUILD_DIR="../../bootstrap/deliverableTests/build"
DELIVERABLE_TESTS_SRC_DIR="../../bootstrap/deliverableTests/src"
DELIVERABLE_TESTING_DIR="../../bootstrap/deliverableTests/src/"
DELIVERABLE_TESTS_DIR="../../bootstrap/deliverableTests/src/test"

# ##############################################################################
# PRE
# ##############################################################################

printf "<PRE_RUN_DELIVERABLE_TESTS>\n"


printf "</PRE_RUN_DELIVERABLE_TESTS>\n"


# ##############################################################################
# RUN DELIVERABLE TESTS
# ##############################################################################
 
printf "</PRE_RUN_DELIVERABLE_TESTS>\n"

cd ../deliverableTests
./gradlew clean junitPlatformTest junitPlatformJacocoReport --continue
cd ../scripts

printf "</PRE_RUN_DELIVERABLE_TESTS>\n\n"

# ##############################################################################
# POST
# ##############################################################################


printf "<POST_RUN_DELIVERABLE_TESTS>\n"



printf "</POST_RUN_DELIVERABLE_TESTS>\n\n"
