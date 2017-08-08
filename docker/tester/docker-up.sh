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

#### BRINGS UP REDIS and COUCHDB Databases
# printf "./../../deploy.sh"
# ./../../deploy.sh

#### BUILDING Course #210 Containers
printf "./build-210-container.sh 4e8fb5ef855b2ce0e06aa052e1f5f0e41512bb58 cpsc210__bootstrap master d1 "skaha.cs.ubc.ca:8525" "skaha.cs.ubc.ca:11315" "portal.cs.ubc.ca:11315""
./build-210-container.sh 4e8fb5ef855b2ce0e06aa052e1f5f0e41512bb58 cpsc210__bootstrap master d1 "skaha.cs.ubc.ca:8525" "skaha.cs.ubc.ca:11315" "portal.cs.ubc.ca:11315"

#### BUILDING Course #310 Containers
printf "./build-310-container.sh 4e8fb5ef855b2ce0e06aa052e1f5f0e41512bb58 cpsc310__bootstrap master d1 "skaha.cs.ubc.ca:8525" "skaha.cs.ubc.ca:11315" "portal.cs.ubc.ca:11315" "portal.cs.ubc.ca:8525" "http://www.google.com/""
./build-310-container.sh 4e8fb5ef855b2ce0e06aa052e1f5f0e41512bb58 cpsc310__bootstrap master d1 "skaha.cs.ubc.ca:8525" "skaha.cs.ubc.ca:11315" "portal.cs.ubc.ca:11315" "portal.cs.ubc.ca:8525" "http://www.google.com/"

## Tag based on Deliverables that exist for each course to run when markByBatch flag is true.
docker tag $(docker images -q autotest/cpsc310__bootstrap:latest) autotest/d1-cpsc310__bootstrap
docker tag $(docker images -q autotest/cpsc310__bootstrap:latest) autotest/d2-cpsc310__bootstrap
docker tag $(docker images -q autotest/cpsc310__bootstrap:latest) autotest/d3-cpsc310__bootstrap

