#!/usr/bin/env bash

# ##############################################################################
# pullrepo.sh
# Nick Bradley <nbrad11@cs.ubc.ca>
#
# Description: Pulls (or clones) the specified repo. If commit or time is
# specified, the HEAD ref is set to it.
#
# Parameters:
# $1: The full url (including username and password) to pull repo from github
#     https://<username>:<password>@github.com/CS310-2016Fall/cpsc310d1-priv.git
#
# $2: The commit SHA or ISO date. If the date is specified then the latest commit
#     before the date will be used. Date format is 2016-09-30 12:00:00:00.
# ##############################################################################

GITHUB_API_KEY=${1}
REPO_NAME=${2}  # cpsc310d1-priv
COMMIT=${3}

docker build --tag autotest/${REPO_NAME} \
 --build-arg repo_url=https://${GITHUB_API_KEY}@github.com/CS310-2016Fall/${REPO_NAME}.git \
 ../docker/tester
