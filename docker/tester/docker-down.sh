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

courseNum=${1}

if [ ! -z "$courseNum" ]; then
  printf "docker rmi $(docker images |  grep "$courseNum" | tr -s ' ' | cut -d ' ' -f 3 )"
  docker rmi $(docker images |  grep "$courseNum" | tr -s ' ' | cut -d ' ' -f 3 )
fi
