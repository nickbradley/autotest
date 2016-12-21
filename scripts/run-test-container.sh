#!/usr/bin/env bash

GITHUB_API_KEY=${1}
TEAM=${2}
COMMIT=${3}
TEST_REPO_NAME=${4}
#
# CLIENT_PATH=${PWD%/scripts}/docker/tester/repos
# CLIENT_DIR=cpsc310project_${TEAM}
#
# docker run --env CLIENT_DIR=${CLIENT_DIR} \
#   --volume "${CLIENT_PATH}/${CLIENT_DIR}":"/${CLIENT_DIR}" \
#   autotest/${2}

CLIENT_URL=https://${GITHUB_API_KEY}@github.com/CS310-2016Fall/cpsc310project_${TEAM}.git
CLIENT_COMMIT=${COMMIT}
echo $CLIENT_URL
docker run --env CLIENT_URL=$CLIENT_URL --env CLIENT_COMMIT=$CLIENT_COMMIT autotest/${TEST_REPO_NAME}
