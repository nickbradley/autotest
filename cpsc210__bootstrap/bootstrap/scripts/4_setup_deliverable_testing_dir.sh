#!/usr/bin/env bash
version=1.0.0

DELIVERABLE_TO_MARK=$DELIVERABLE_TO_MARK
BOOTSTRAP_REPO_DIR="../../bootstrap"
STUDENT_REPO_DIR="../../cpsc210studentrepo"
DELIVERABLE_REPO_DIR="../../cpsc210deliverablerepo"
DELIVERABLE_TESTS_BUILD_DIR="../../bootstrap/deliverableTests/build"
DELIVERABLE_TESTS_SRC_DIR="../../bootstrap/deliverableTests/src"
DELIVERABLE_TESTS_OUTPUT_DIR="../../bootstrap/deliverableTests/output"
DELIVERABLE_TESTING_DIR="../../bootstrap/deliverableTests/src/"
DELIVERABLE_TESTS_ROOT="../../bootstrap/deliverableTests/"
DELIVERABLE_TESTS_SRC="../../bootstrap/deliverableTests/src/test"
DELIVERABLE_TESTS_LIB_DIR="../../bootstrap/deliverableTests/lib"
DELIVERABLE_TESTS_DATA_DIR="../../bootstrap/deliverableTests/data"

# ##############################################################################
# PRE
# ##############################################################################

# Clean student testing directories
printf "<PRE_SETUP_DELIVERABLE_TESTING_DIR>\n"

if [ -d "$DELIVERABLE_TESTS_SRC_DIR" ]; then
  rm -rf "$DELIVERABLE_TESTS_SRC_DIR"
  echo "rm -rf "$DELIVERABLE_TESTS_SRC_DIR""
  mkdir "$DELIVERABLE_TESTS_SRC_DIR"
  echo "mkdir "$DELIVERABLE_TESTS_SRC_DIR""
  echo ""$DELIVERABLE_TESTS_BUILD_DIR" is clean"
else 
  mkdir "$DELIVERABLE_TESTS_SRC_DIR"
  echo "mkdir "$DELIVERABLE_TESTS_SRC_DIR""
fi

if [ -d "$DELIVERABLE_TESTS_BUILD_DIR" ]; then
  rm -rf "$DELIVERABLE_TESTS_BUILD_DIR"
  echo "rm -rf "$DELIVERABLE_TESTS_BUILD_DIR""
  mkdir "$DELIVERABLE_TESTS_BUILD_DIR"
  echo "mkdir "$DELIVERABLE_TESTS_BUILD_DIR""
  echo ""$DELIVERABLE_TESTS_BUILD_DIR" is clean"
else 
  mkdir "$DELIVERABLE_TESTS_BUILD_DIR"
  echo "mkdir "$DELIVERABLE_TESTS_BUILD_DIR""
fi

if [ -d "$DELIVERABLE_TESTS_BUILD_DIR" ]; then
  rm -rf "$DELIVERABLE_TESTS_BUILD_DIR"
  echo "rm -rf "$DELIVERABLE_TESTS_BUILD_DIR""
  mkdir "$DELIVERABLE_TESTS_BUILD_DIR"
  echo "mkdir "$DELIVERABLE_TESTS_BUILD_DIR""
  echo ""$DELIVERABLE_TESTS_BUILD_DIR" is clean"
else 
  mkdir "$DELIVERABLE_TESTS_BUILD_DIR"
  echo "mkdir "$DELIVERABLE_TESTS_BUILD_DIR""
fi

if [ -d "$DELIVERABLE_TESTS_OUTPUT_DIR" ]; then
  rm -rf "$DELIVERABLE_TESTS_OUTPUT_DIR"
  echo "rm -rf "$DELIVERABLE_TESTS_OUTPUT_DIR""
  mkdir "$DELIVERABLE_TESTS_OUTPUT_DIR"
  echo "mkdir "$DELIVERABLE_TESTS_OUTPUT_DIR""
  echo ""$DELIVERABLE_TESTS_OUTPUT_DIR" is clean"
else 
  mkdir "$DELIVERABLE_TESTS_OUTPUT_DIR"
  echo "mkdir "$DELIVERABLE_TESTS_OUTPUT_DIR""
fi

if [ -d "$DELIVERABLE_TESTS_SRC" ]; then
  rm -rf "$DELIVERABLE_TESTS_SRC"
  echo "rm -rf "$DELIVERABLE_TESTS_SRC""
  mkdir "$DELIVERABLE_TESTS_SRC"
  echo "mkdir "$DELIVERABLE_TESTS_SRC""
  echo ""$DELIVERABLE_TESTS_SRC" is clean"
else 
  mkdir "$DELIVERABLE_TESTS_SRC"
  echo "mkdir "$DELIVERABLE_TESTS_SRC""
fi

printf "</PRE_SETUP_DELIVERABLE_TESTING_DIR>\n"


# ##############################################################################
# SETUP DELIVERABLE TESTING DIRECTORIES
# ##############################################################################

# Copy student project files and then replace student tests with deliverable tests. 
printf "</SETUP_DELIVERABLE_TESTING_DIR>\n"

cp -rp "$STUDENT_REPO_DIR/src/main" "$DELIVERABLE_TESTS_SRC_DIR" 2>&1
echo "cp -rp "$STUDENT_REPO_DIR/src/main" "$DELIVERABLE_TESTS_SRC_DIR""
echo "Testing directory cleaned"

# Clean out the student Tests 

# rm -rf $DELIVERABLE_TESTS_SRC/*
# echo "rm -rf $DELIVERABLE_TESTS_SRC/*"

# Clean the destination /lib/ folder

if [[ -d "$DELIVERABLE_TESTS_LIB_DIR" ]]; then
  rm -rf "$DELIVERABLE_TESTS_LIB_DIR"
  echo "rm -rf "DELIVERABLE_TESTS_LIB_DIR""
  echo "Removed student tests from $DELIVERABLE_TESTS_LIB_DIR"
  mkdir "$DELIVERABLE_TESTS_LIB_DIR"
  echo "mkdir "$DELIVERABLE_TESTS_LIB_DIR""
  echo "Re-made empty path: $DELIVERABLE_TESTS_LIB_DIR"
else 
  mkdir "$DELIVERABLE_TESTS_LIB_DIR"
  echo "mkdir "$DELIVERABLE_TESTS_LIB_DIR""
fi

# Clean the destination /data/ folder

if [ -d "$DELIVERABLE_TESTS_DATA_DIR" ]; then
  rm -rf "$DELIVERABLE_TESTS_DATA_DIR"
  echo "rm -rf "$DELIVERABLE_TESTS_DATA_DIR""
  mkdir "$DELIVERABLE_TESTS_DATA_DIR"
  echo "mkdir "$DELIVERABLE_TESTS_DATA_DIR""
  echo ""$DELIVERABLE_TESTS_DATA_DIR" is clean"
else 
  mkdir "$DELIVERABLE_TESTS_DATA_DIR"
  echo "mkdir "$DELIVERABLE_TESTS_DATA_DIR""
fi


# Copy deliverable tests over to deliverableTests directory where student work is already located:

cp -rp "$DELIVERABLE_REPO_DIR/$DELIVERABLE_TO_MARK/"* "$DELIVERABLE_TESTS_SRC" 2>&1
echo "cp -rp "$DELIVERABLE_REPO_DIR/$DELIVERABLE_TO_MARK/"* "$DELIVERABLE_TESTS_SRC""

if [ -d "$DELIVERABLE_REPO_DIR/$DELIVERABLE_TO_MARK/lib" ]; then
  cp -rp "$DELIVERABLE_REPO_DIR/$DELIVERABLE_TO_MARK/lib/"* "$DELIVERABLE_TESTS_ROOT/lib" 2>&1
  echo "cp -rp "$DELIVERABLE_REPO_DIR/$DELIVERABLE_TO_MARK/lib/"* "$DELIVERABLE_TESTS_ROOT/lib""
else
  echo 'Not copying /libraries/ folder, as libraries do not exist in repo'.
fi

if [ -d "$DELIVERABLE_REPO_DIR/$DELIVERABLE_TO_MARK/data" ]; then
  cp -rp "$DELIVERABLE_REPO_DIR/$DELIVERABLE_TO_MARK/data/"* "$DELIVERABLE_TESTS_ROOT/data" 2>&1
  echo "cp -rp "$DELIVERABLE_REPO_DIR/$DELIVERABLE_TO_MARK/data/"* "$DELIVERABLE_TESTS_ROOT/data""
else
  echo 'Not copying project /data/ folder, as data does not exist in repo'.
fi

printf "</SETUP_DELIVERABLE_TESTING_DIR>\n\n"

# ##############################################################################
# POST
# ##############################################################################


printf "<POST_SETUP_DELIVERABLE_TESTING_DIR>\n"



printf "</POST_SETUP_DELIVERABLE_TESTING_DIR>\n\n"
