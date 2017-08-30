#!/usr/bin/env bash

version=1.0.0


BOOTSTRAP_REPO_DIR="../../bootstrap"
STUDENT_TESTS_INPUT_DIR="../../bootstrap/studentTests/output"
DELIVERABLE_TESTS_INPUT_DIR="../../bootstrap/deliverableTests/output"
MAIN_OUTPUT_DIR="../../bootstrap/output/"
STUDENT_TESTS_OUTPUT_DIR="../../output/studentTests/"
DELIVERABLE_TESTS_OUTPUT_DIR="../../output/deliverableTests/"
OUTPUT_VOLUME_DIR="../../output"

# ##############################################################################
# PRE
# ##############################################################################

printf "<PRE_HANDLE_OUTPUT>\n"

if [ -d $OUTPUT_VOLUME_DIR ]
then
  rm -rf $OUTPUT_VOLUME_DIR/*
  echo "rm -rf $OUTPUT_VOLUME_DIR/*"
else
  mkdir $OUTPUT_VOLUME_DIR
  echo "mkdir $OUTPUT_VOLUME_DIR"
fi

if [ -d "$MAIN_OUTPUT_DIR" ]
then
  rm -rf "$MAIN_OUTPUT_DIR/"*
  echo "rm -rf "$MAIN_OUTPUT_DIR/*""
  echo "Cleared output directory: $MAIN_OUTPUT_DIR"
else 
  mkdir $MAIN_OUTPUT_DIR
  echo "mkdir $MAIN_OUTPUT_DIR"
fi


mkdir -p "$STUDENT_TESTS_OUTPUT_DIR"
echo "mkdir "$STUDENT_TESTS_OUTPUT_DIR""
mkdir -p "$DELIVERABLE_TESTS_OUTPUT_DIR"
echo "mkdir "$DELIVERABLE_TESTS_OUTPUT_DIR""

printf "</PRE_HANDLE_OUTPUT>\n"


# ##############################################################################
# HANDLE OUTPUT
# ##############################################################################
 
printf "</HANDLE_OUTPUT>\n"

cp -rp "$STUDENT_TESTS_INPUT_DIR/"* "$STUDENT_TESTS_OUTPUT_DIR"
echo "cp -rp "$STUDENT_TESTS_INPUT_DIR/"* "$STUDENT_TESTS_OUTPUT_DIR""
cp -rp "$DELIVERABLE_TESTS_INPUT_DIR/"* "$DELIVERABLE_TESTS_OUTPUT_DIR"
echo "cp -rp "$DELIVERABLE_TESTS_INPUT_DIR/"* "$DELIVERABLE_TESTS_OUTPUT_DIR""

printf "</HANDLE_OUTPUT>\n\n"

# ##############################################################################
# POST
# ##############################################################################


printf "<POST_HANDLE_OUTPUT>\n"



printf "</POST_HANDLE_OUTPUT>\n\n"

