#!/usr/bin/env bash

./INIT_TEMPORARY_ENV_SCRIPT.sh
./0_pullStudentRepo.sh
./1_pullDeliverableRepo.sh
./2_setup_gradle_for_tests.sh
./3_setup_student_testing_dir.sh
./4_setup_deliverable_testing_dir.sh
./5_build_student_tests.sh
./6_run_student_tests.sh
./7_build_deliverable_tests.sh
./8_run_deliverable_tests.sh
./9_handle_output.sh
./10_create_container_output.sh
