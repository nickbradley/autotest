#!/usr/bin/env bash

version=1.0.0

DELIVERABLE_TO_MARK=$DELIVERABLE_TO_MARK
BOOTSTRAP_REPO_DIR="../../bootstrap"
COMMON_CONFIG_DIR="../../bootstrap/config/common"
CONFIG_DIR="../../bootstrap/config"
STUDENT_TESTS_DIR="../../bootstrap/studentTests"
DELIVERABLE_TESTS_DIR="../../bootstrap/deliverableTests"
BUILD_CONFIG_FILENAME="build.gradle"
ORIG_GRADLE_PROPERTIES_FILE="../../cpsc210deliverablerepo/$DELIVERABLE_TO_MARK/gradle.properties"
STUDENT_PROPERTIES_FILE="$STUDENT_TESTS_DIR/gradle.properties"
DELIV_PROPERTIES_FILE="$DELIVERABLE_TESTS_DIR/gradle.properties"


# ##############################################################################
# PRE
# ##############################################################################

# Clean previous configuration builds
printf "<PRE_CLEANING_GRADLE_CONFIGURATION>\n"

if [[ -f ""${STUDENT_TESTS_DIR}"/"${BUILD_CONFIG_FILENAME}"" ]]
then
  rm -rf ""${STUDENT_TESTS_DIR}"/"${BUILD_CONFIG_FILENAME}""
  echo "rm -rf "${STUDENT_TESTS_DIR}"/"${BUILD_CONFIG_FILENAME}""
fi

if [[ -f "${DELIVERABLE_TESTS_DIR}"/"${BUILD_CONFIG_FILENAME}" ]]
then
  rm -rf "${DELIVERABLE_TESTS_DIR}"/"${BUILD_CONFIG_FILENAME}"
  echo "rm -rf "${DELIVERABLE_TESTS_DIR}"/"${BUILD_CONFIG_FILENAME}""
fi

# Remove Gradle.properties files from previous tests

if [ -f "$STUDENT_PROPERTIES_FILE" ]
then
  rm -rf "$STUDENT_PROPERTIES_FILE"
  echo "rm -rf "$STUDENT_PROPERTIES_FILE""
fi

if [ -f "$DELIV_PROPERTIES_FILE" ]
then
  rm -rf "$DELIV_PROPERTIES_FILE"
  echo "rm -rf "$DELIV_PROPERTIES_FILE""
fi


printf "</PRE_CLEANING_GRADLE_CONFIGURATION>\n\n"


# ##############################################################################
# SETUP GRADLE FOR TESTS
# ##############################################################################

# Copy gradle config settings to DELIVERABLE_TESTS_DIR and STUDENT_TESTS_DIR
printf "</SETUP_TESTS_CONFIG>\n"

ln ""${COMMON_CONFIG_DIR}"/"${BUILD_CONFIG_FILENAME}"" ""${STUDENT_TESTS_DIR}"/"
echo "ln ""${COMMON_CONFIG_DIR}"/"${BUILD_CONFIG_FILENAME}"" ""${STUDENT_TESTS_DIR}"/""

ln ""${COMMON_CONFIG_DIR}"/"${BUILD_CONFIG_FILENAME}"" ""${DELIVERABLE_TESTS_DIR}"/"
echo "ln ""${COMMON_CONFIG_DIR}"/"${BUILD_CONFIG_FILENAME}"" ""${DELIVERABLE_TESTS_DIR}"/""

# Copy Gradle.properties configuration file to exclude particular classes in Jacoco coverage

if [ -f "$ORIG_GRADLE_PROPERTIES_FILE" ]
then 
  cp $ORIG_GRADLE_PROPERTIES_FILE $STUDENT_TESTS_DIR/
  echo "cp $ORIG_GRADLE_PROPERTIES_FILE $STUDENT_TESTS_DIR/"
  cp $ORIG_GRADLE_PROPERTIES_FILE $DELIVERABLE_TESTS_DIR/
  echo "cp $ORIG_GRADLE_PROPERTIES_FILE $STUDENT_TESTS_DIR/"
else 
  echo "No gradle.properties file found at path $GRADLE_PROPERTIES_FILE"
  echo "Skipping gradle.properties file copy"
fi

printf "</SETUP_TESTS_CONFIG>\n\n"

# ##############################################################################
# POST
# ##############################################################################

# Setting git head to commit for marking
printf "<POST_SETUP_TESTS>\n"



printf "</POST_SETUP_TESTS>\n\n"
