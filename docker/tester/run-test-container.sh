#!/usr/bin/env bash

# ##############################################################################
# run-test-container.sh
# Nick Bradley <nbrad11@cs.ubc.ca>
#
# Description:
# Starts a Docker container from the specified image.
#
# Parameters:
# $1: A GitHub API key with permission to pull student repositories.
#
# $2: The name of the team on GitHub (e.g. team34).
#
# $3: The commit SHA (first 7 characters) of the student's repository. This is
#     commit that will be tested.
#
# $4: The tag (and optionally, version) of the deliverable image to run.
#     EX: autotest/cpsc310d3-priv (= autotest/cpsc310d3-priv:latest) or autotest/cpsc310d3-priv:77e4bc4
#
# Example:
#  ./run-test-container.sh af345rt3tt14636d1779g0452c47g25cd4ad75bce team34 d3c6e11 autotest/cpsc310d1-priv
# ##############################################################################

set -o errexit  # exit on command failure
set -o pipefail # exit if any command in pipeline fails
set -o nounset  # exit if undeclared variable is used

testImage=${1}
tempDir=${2}
containerLive=${3}

docker run --cap-add=NET_ADMIN \
           --volume "${tempDir}":/output \
           ${containerLive} \
           --rm \
           ${testImage}