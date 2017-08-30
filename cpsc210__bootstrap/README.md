# cpsc210__bootstrap
Pulls in cpsc210__deliverables and cpsc210__student_assignment repos for grading in Docker container

# Bootstrap Info

The bootstrap repository pulls in the `cpsc210__delivable` repo and the student repository to be marked based on the ENV variables below: 

`PROJECT_URL`
`PROJECT_COMMIT`
`DELIVERABLE_URL`
`DELIVERABLE_TO_MARK`
`DELIVERABLE_COMMIT`

Instructions to Bootstrap on Local environment:

1) Clone this repo: `git clone https://github.com/stecler/cpsc310__bootstrap`
2) Run `./cpsc210__bootstrap/setupENV.sh` to setup ENV variables above.
3) Run `./cpsc210__bootstrap/runTests.sh`. 

Requirements:

- Java 8 and internet connection

To Build Docker 210 container with Autotest:

./autotest/docker/tester/build-210-container.sh {githubKey} cpsc210__bootstrap master {deliverableToMark ie. "d1"} "portal.cs.ubc.ca:8525" "portal.cs.ubc.ca:11315" "http://www.google.com/"

Example repo to test 'p1' deliverable project: https://github.com/pcarterubc/cpsc210__term_project_submission
