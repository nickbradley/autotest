#!/usr/bin/env bash

version=1.0.0

studentRepoDir="../../cpsc210studentrepo"
studentRepoURL="${PROJECT_URL}"
studentRepoCommit="${PROJECT_COMMIT}"

# ##############################################################################
# PRE
# ##############################################################################

# Cleaning Student Repo Dir
printf "<PRE_PULLING_STUDENT_PROJECT_REPO>\n"

if [[ -d "${studentRepoDir}" ]]
then
  rm -rf "${studentRepoDir}"
  echo "rm -rf "${studentRepoDir}""
else 
  mkdir "${studentRepoDir}"
  echo "mkdir "${studentRepoDir}""
fi

printf "</PRE_PULLING_STUDENT_PROJECT_REPO>\n\n"


# ##############################################################################
# PULL STUDENT REPO
# ##############################################################################

# Cloning Student Repo
printf "</PULLING_STUDENT_PROJECT_REPO>\n"

git clone "${studentRepoURL}" "${studentRepoDir}"
echo "git clone "${studentRepoURL}" "${studentRepoDir}""

printf "</PULLING_STUDENT_PROJECT_REPO>\n\n"

# ##############################################################################
# POST
# ##############################################################################

# Setting git head to commit of project submission
printf "<POST_PULLING_STUDENT_PROJECT_REPO>\n"

cd "${studentRepoDir}"
echo "cd "${studentRepoDir}""
pwd
git checkout "${studentRepoCommit}"
echo "git checkout "${studentRepoCommit}""
cd /
echo "cd /"

printf "</POST_PULLING_STUDENT_PROJECT_REPO>\n\n"

exit 0
