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

set -o errexit  # exit on command failure
set -o pipefail # exit if any command in pipeline fails
set -o nounset  # exit if undeclared variable is used

# Args
REPO_URL="${1}"
REPO_DIR="${2}"
COMMIT="${3:-}"


#REPO_PATH="../data/repos"

#REPO_FULLNAME="${REPO_URL##*/}"
#REPO_NAME="${REPO_FULLNAME%%.*}"
#REPO_DIR="${REPO_PATH}/${REPO_NAME}"


if [[ -d "${REPO_DIR}" ]]
then
  rm -rf "${REPO_DIR}"
fi

printf "Cloning repo to ${REPO_DIR}.\n"
git clone "${REPO_URL}" "${REPO_DIR}"
cd "${REPO_DIR}"

# If a commit SHA is specified then detach the HEAD and point at the commit
if [[ -n "${COMMIT}" ]]
then
  # Assume the third parameter is a date if it doesn't contain a letter
  if [[ ! "${COMMIT}" =~ .*[a-zA-Z].* ]]
  then
    # We assume ${COMMIT} is of the form 2016-09-30 12:00:00:00
    # The line below returns the latest commit SHA before the date
    COMMIT=`git rev-list -n 1 --before="${COMMIT}" master`
  fi
  git checkout "${COMMIT}"
fi


printf "Finished updating repo.\n"
exit 0
