#!/usr/bin/env bash

# ##############################################################################
# docker-up.sh
# Andrew Stec <steca@cs.ubc.ca>
#
# As the business logic for each course is different, a different set of containers is
# required for running the Autotest suite. 
#
# This script will setup the containers for the current business logic, and must always
# remain up to date to automate the Docker container bootstrapping for Portal.cs.ubc.ca.
#
# Example:
#   ./docker-up.sh
# ##############################################################################

## START SET GITHUB_KEY
function enterGithubKey {
  read -p "**Necessary** Enter your Github personal access token: " github_key

  if [ -e $github_key ]
  then
    enterGithubKey
  else
    export GITHUB_KEY=$github_key
    printf "export GITHUB_KEY=$github_key \n\n"
  fi
}

enterGithubKey
##END GITHUB_KEY_FUNCTION

#### BRINGS UP REDIS and COUCHDB Databases
# printf "./../../deploy.sh"
# ./../../deploy.sh

#### BUILDING Course #210 Containers
printf "./build-210-container.sh ${GITHUB_KEY} cpsc210__bootstrap master d1 "skaha.cs.ubc.ca:8525" "skaha.cs.ubc.ca:11315" "portal.cs.ubc.ca:11315""
./build-210-container.sh $GITHUB_KEY cpsc210__bootstrap master d1 "repo1.maven.org:8080" "repo1.maven.org:80" "repo1.maven.org:443"

#### BUILDING Course #310 Containers
printf "./build-310-container.sh ${GITHUB_KEY} cpsc310__bootstrap master d1 "skaha.cs.ubc.ca:11316" "portal.cs.ubc.ca:8525" "localhost:4321""
#./build-310-container.sh $GITHUB_KEY cpsc310__bootstrap master d1 "skaha.cs.ubc.ca:11316" "portal.cs.ubc.ca:8525" "localhost:4321"


