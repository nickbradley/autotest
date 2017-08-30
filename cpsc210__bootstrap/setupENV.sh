#!/usr/bin/env bash

# Activated ENV variables :
# PROJECT_URL
# PROJECT_COMMIT
# DELIVERABLE_URL
# DELIVERABLE_TO_MARK
# DELIVERABLE_COMMIT

DEFAULT_DELIV_TO_MARK="d0"

## START SET GITHUB_KEY
function enterGithubKey {
  read -p "**Necessary** Enter your Github personal access token: " github_key

  if [ -e $github_key ]
  then
    enterGithubKey
  else 
    export GITHUB_KEY=$github_key
    DEFAULT_GIT_DELIVERABLE_URL="https://${github_key}@github.com/stecler/cpsc210__deliverables.git"
    DEFAULT_ASSIGNMENT_URL="https://${github_key}@github.com/stecler/cpsc210__assignment_1_submission.git"
    printf "export GITHUB_KEY=$github_key \n\n"
  fi
}

enterGithubKey
## END GITHUB_KEY

## START PROJECT_URL
read -p "**Optional** Enter student git repo assignment to mark (default: cpsc210__assignment_1_submission.git): " project_url

if [ -e $project_url ]
then
  export PROJECT_URL=$DEFAULT_ASSIGNMENT_URL
  printf "export PROJECT_URL=$DEFAULT_ASSIGNMENT_URL \n\n"
else
  export PROJECT_URL=$project_url
  printf "export PROJECT_URL=$project_url \n\n"
fi
## END PROJECT_URL

## START PROJECT_COMMIT
read -p "**Optional** Enter student git checkout commit id (default: master): " project_commit

if [ -e $project_commit ]
then
  export PROJECT_COMMIT=master
  printf "export PROJECT_COMMIT=master \n\n"
else
  export PROJECT_COMMIT=$project_commit
  printf "export PROJECT_COMMIT=$project_commit \n\n"
fi
## END PROJECT_COMMIT


## START DELIVERABLE_TO_MARK
read -p "**Optional** Enter the Github deliverable you wish to mark (ie. "d0", "d1", "d2", etc.): " deliverable_to_mark

if [ -e $deliverable_to_mark ]
then
  export DELIVERABLE_TO_MARK=$DEFAULT_DELIV_TO_MARK
  printf "export DELIVERABLE_TO_MARK=$DEFAULT_DELIV_TO_MARK \n\n"
else 
  export DELIVERABLE_TO_MARK=$deliverable_to_mark
  printf "export DELIVERABLE_TO_MARK=$deliverable_to_mark \n\n"
fi
## END DELIVERABLE_TO_MARK

## START DELIVERABLE_URL
read -p "**Optional** Enter deliverable repo remote origin address (default: https://$github_key@github.com/stecler/cpsc210__deliverables): " deliverables_url

if [ -e $deliverables_url ]
then
  export DELIVERABLE_URL=$DEFAULT_GIT_DELIVERABLE_URL
  printf "export DELIVERABLE_URL=$DEFAULT_GIT_DELIVERABLE_URL \n\n"
else
  export DELIVERABLE_URL=$deliverables_url
  printf "export DELIVERABLE_URL=$deliverables_url \n\n"
fi
## END DELIVERABLE_URL

## START DELIVERABLE_COMMIT
read -p "**Optional** Enter Deliverable Repo Commit (default: latest commit): " deliverable_commit

if [ -e $deliverable_commit ]
then
  export DELIVERABLE_COMMIT="master"
  printf "export DELIVERABLE_COMMIT=master \n\n"
else 
  export DELIVERABLE_COMMIT=$deliverable_commit
  printf "export DELIVERABLE_COMMIT=$deliverable_commit \n\n"
fi
## END DELIVERABLE_COMMIT

## --- ASSUMING DEFAULT TESTING SNUM, CSID, ASSIGNMENT_NUM IF NOT SET --- ##
#############################################################################

## START SNUM
if [ -z $SNUM ]
then
  export SNUM="99999999"
  printf "ENV SNUM set to default testing: 99999999\n\n"
else 
  printf "ENV SNUM left as pre-set value $SNUM\n\n"
fi
## END SNUM

## START CSID
if [ -z $CSID ]
then
  export CSID="888888888"
  printf "ENV CSID set to default testing: 888888888\n\n"
else 
  printf "ENV CSID left as pre-set value $CSID\n\n"
fi
## END CSID

## START ASSIGNMENT_NUM
if [ -z $ASSIGNMENT_NUM ]
then
  export ASSIGNMENT_NUM="1"
  printf "ENV ASSIGNMENT_NUM set to default testing: 1\n\n"
else 
  printf "ENV ASSIGNMENT_NUM left as pre-set value $ASSIGNMENT_NUM\n\n"
fi
## END DELIVERABLE_COMMIT

