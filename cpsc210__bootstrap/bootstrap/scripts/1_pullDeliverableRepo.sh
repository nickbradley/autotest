#!/usr/bin/env bash

version=1.0.0

deliverableRepoDir="../../cpsc210deliverablerepo"
deliverableRepoURL="${DELIVERABLE_URL}"
deliverableRepoCommit="${DELIVERABLE_COMMIT}"

# ##############################################################################
# PRE
# ##############################################################################

# Cleaning Deliverable Repo Dir
printf "<PRE_PULLING_DELIVERABLE_REPO>\n"

if [[ -d "${deliverableRepoDir}" ]]
then
  rm -rf "${deliverableRepoDir}"
  echo "rm -rf "${deliverableRepoDir}""
fi

echo "mkdir "${deliverableRepoDir}""
mkdir "${deliverableRepoDir}"

printf "</PRE_PULLING_DELIVERABLE_REPO>\n\n"


# ##############################################################################
# PULL DELIVERABLE REPO
# ##############################################################################

# Cloning Deliverable Repo
printf "</PULLING_DELIVERABLE_REPO>\n"

echo "git clone ${deliverableRepoURL}"
git clone "${deliverableRepoURL}" "${deliverableRepoDir}"

printf "</PULLING_DELIVERABLE_REPO>\n\n"

# ##############################################################################
# POST
# ##############################################################################

# Setting git head to intended deliverable commit
printf "<POST_PULLING_DELIVERABLE_REPO>\n"

cd "${deliverableRepoDir}"
echo "cd "${deliverableRepoDir}""
git checkout "${deliverableRepoCommit}"
echo "git checkout "${deliverableRepoCommit}""
cd ..
echo "cd .."

printf "</POST_PULLING_DELIVERABLE_REPO>\n\n"

exit 0
