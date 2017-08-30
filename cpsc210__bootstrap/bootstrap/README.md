<<<<<<< HEAD:README.md
# CPSC 210 Bootstrap Repo
=======

To run Junit and Jacoco coverage reports, 'cd /bootstrap && ./gradlew clean junitPlatformTest junitPlatformJacocoReport --continue'

# CPSC 210 Base Project
>>>>>>> feature/intelli-j-env:bootstrap/README.md

This is the bootstrap repo for the AutoTest Docker image that contains the logic to import assignment deliverables, mark student assignments, and handle grading/reporting logic for student assignments.

## Configuring your environment

The bootstrap repo is imported on the Docker CPSC 210 Autotest Image to mark each assignment, but it can also be downloaded to a personal computer to develop deliverables and grading logic.

## Setup project commands

1) Clone the local repo on your local environment: 

 Type `git clone https://github.com/stecler/cpsc210__bootstrap`
 
2) Setup environment variables on your local machine to mimic ENV in Docker container: 

From the /bootstrap/ root directory of the cloned repo, type `cd ./scripts && . ./setupENV.sh`

You will be prompted to produce a Github Personal Access Token (PAT), which can be produced at: https://github.com/settings/tokens. Please give the PAT read and write priviledges under the 'repositories' area of the Github PAT settings page.

### Executing the unit test suite

1) Run `init.sh` to start the grader.

From /bootstrap/scripts, type `./init.sh`.

### Understanding the tests

Tests are produced by copying the contents of a particular deliverable to the /bootstrap/deliverableTests and the student tests to /bootstrap/studentTests and running a Gradle script using jUnit5 and Jacoco.

jUnit5 and Jacoco results are output to the /bootsrap/output directory in respective `studentTests` and `deliverableTests` folders.

## Developing your project

Currently in progress

### Necessary Output Format

The format must adhere to a particular structure if it is to be successfully parsed by the ClassPortal project. The data structure is:
