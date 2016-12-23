#!/usr/bin/env bash

# ##############################################################################
# pull-repo.sh
# Nick Bradley <nbrad11@cs.ubc.ca>
#
# Description:
# Clones a GitHub repository to the specified directory, deleting any existing
# directory. The specified commit is checked out.
#
# Parameters:
# $1: The full url (including username and password) to pull repo from github
#     https://<username>:<password>@github.com/CS310-2016Fall/cpsc310d1-priv.git
#
# $2: The commit SHA or ISO date. If the date is specified then the latest commit
#     before the date will be used. Date format is 2016-09-30 12:00:00:00.
#
# $3: The directory in which to clone the repositiory.
# ##############################################################################

set -o errexit  # exit on command failure
set -o pipefail # exit if any command in pipeline fails
set -o nounset  # exit if undeclared variable is used

# Args
repoUrl="${1}"
commit="${2}"
cloneDir="${3}"


if [[ -d "${cloneDir}" ]]
then
  rm -rf "${cloneDir}"
fi

printf "Cloning repo to ${cloneDir}.\n"
git clone "${repoUrl}" "${cloneDir}"
cd "${cloneDir}"

# If a commit SHA is specified then detach the HEAD and point at the commit
if [[ -n "${commit}" ]]
then
  # Assume the third parameter is a date if it doesn't contain a letter
  if [[ ! "${commit}" =~ .*[a-zA-Z].* ]]
  then
    # We assume ${COMMIT} is of the form 2016-09-30 12:00:00:00
    # The line below returns the latest commit SHA before the date
    COMMIT=`git rev-list -n 1 --before="${commit}" master`
  fi
  git checkout "${commit}"
fi

exit 0
