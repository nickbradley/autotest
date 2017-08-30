#!/usr/bin/env bash

version=1.0.0

BOOTSTRAP_REPO_DIR="../../bootstrap"
STUDENT_REPO_DIR="../../cpsc210studentrepo"
STUDENT_TESTS_BUILD_DIR="../../bootstrap/studentTests/build"
STUDENT_TESTS_SRC_DIR="../../bootstrap/studentTests/src"
STUDENT_TESTS_OUTPUT_DIR="../../bootstrap/studentTests/output"
TESTING_SRC_DIR="../../bootstrap/studentTests/src/"
TESTING_LIB_DIR="../../bootstrap/studentTests/lib/"
TESTING_DATA_DIR="../../bootstrap/studentTests/data/"

# ##############################################################################
# PRE
# ##############################################################################

# Clean student testing src, build, and output directories
printf "<PRE_SETUP_STUDENT_TESTING_DIR>\n"

if [ -d "$STUDENT_TESTS_BUILD_DIR" ]; then
  rm -rf "$STUDENT_TESTS_BUILD_DIR"
  echo "rm -rf "$STUDENT_TESTS_BUILD_DIR""
  mkdir "$STUDENT_TESTS_BUILD_DIR"
  echo "mkdir "$STUDENT_TESTS_BUILD_DIR""
  echo ""$STUDENT_TESTS_BUILD_DIR" is clean"
else 
  mkdir "$STUDENT_TESTS_BUILD_DIR"
  echo "mkdir "$STUDENT_TESTS_BUILD_DIR""
fi

if [ -d "$STUDENT_TESTS_OUTPUT_DIR" ]; then
  rm -rf "$STUDENT_TESTS_OUTPUT_DIR"
  echo "rm -rf "$STUDENT_TESTS_OUTPUT_DIR""
  mkdir "$STUDENT_TESTS_OUTPUT_DIR"
  echo "mkdir "$STUDENT_TESTS_OUTPUT_DIR""
  echo ""$STUDENT_TESTS_OUTPUT_DIR" is clean"
else 
  mkdir "$STUDENT_TESTS_OUTPUT_DIR"
  echo "mkdir "$STUDENT_TESTS_OUTPUT_DIR""
fi

if [ -d "$STUDENT_TESTS_SRC_DIR" ]; then
  rm -rf "$STUDENT_TESTS_SRC_DIR"
  echo "rm -rf "$STUDENT_TESTS_SRC_DIR""
  mkdir "$STUDENT_TESTS_SRC_DIR"
  echo "mkdir "$STUDENT_TESTS_SRC_DIR""
  echo ""$STUDENT_TESTS_SRC_DIR" is clean"
else 
  mkdir "$STUDENT_TESTS_SRC_DIR"
  echo "mkdir "$STUDENT_TESTS_SRC_DIR""
fi

if [ -d "$TESTING_DATA_DIR" ]; then
  rm -rf "$TESTING_DATA_DIR"
  echo "rm -rf "$TESTING_DATA_DIR""
  mkdir "$TESTING_DATA_DIR"
  echo "mkdir "$TESTING_DATA_DIR""
  echo ""$TESTING_DATA_DIR" is clean"
else 
  mkdir "$TESTING_DATA_DIR"
  echo "mkdir "$TESTING_DATA_DIR""
fi

if [ -d "$TESTING_LIB_DIR" ]; then
  rm -rf "$TESTING_LIB_DIR"
  echo "rm -rf "$TESTING_LIB_DIR""
  mkdir "$TESTING_LIB_DIR"
  echo "mkdir "$TESTING_LIB_DIR""
  echo ""$TESTING_LIB_DIR" is clean"
else 
  mkdir "$TESTING_LIB_DIR"
  echo "mkdir "$TESTING_LIB_DIR""
fi

if [ -d "$TESTING_SRC_DIR" ]; then
  rm -rf "$TESTING_SRC_DIR"
  echo "rm -rf "$TESTING_SRC_DIR""
  mkdir "$TESTING_SRC_DIR"
  echo "mkdir "$TESTING_SRC_DIR""
  echo ""$TESTING_SRC_DIR" is clean"
else 
  mkdir "$TESTING_SRC_DIR"
  echo "mkdir "$TESTING_LIB_DIR""
fi

printf "</PRE_SETUP_STUDENT_TESTING_DIR>\n"


# ##############################################################################
# SETUP STUDENT TESTING DIRECTORIES
# ##############################################################################

# Copy student project files to the testing SRC dir
printf "</SETUP_STUDENT_TESTING_DIR>\n"

## Brings in source files from repo
cp -rp "$STUDENT_REPO_DIR/src/"* "$TESTING_SRC_DIR" 2>&1
echo "cp -rp "$STUDENT_REPO_DIR/src/*" "$TESTING_SRC_DIR""

## Brings in libraries from repo
cp -rp "$STUDENT_REPO_DIR/lib/"* "$TESTING_LIB_DIR" 2>&1
echo "cp -rp "$STUDENT_REPO_DIR/lib/*" "$TESTING_LIB_DIR""

## Brings in data files from repo
cp -rp "$STUDENT_REPO_DIR/data/"* "$TESTING_DATA_DIR" 2>&1
echo "cp -rp "$STUDENT_REPO_DIR/data/*" "$TESTING_DATA_DIR""

printf "</SETUP_STUDENT_TESTING_DIR>\n\n"

# ##############################################################################
# POST
# ##############################################################################

printf "<POST_SETUP_STUDENT_TESTING_DIR>\n"



printf "</POST_SETUP_STUDENT_TESTING_DIR>\n\n"
