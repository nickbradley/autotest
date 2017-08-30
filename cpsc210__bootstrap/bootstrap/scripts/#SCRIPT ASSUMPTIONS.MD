#SCRIPT ASSUMPTIONS

IMPORTANT: In 0_pullStudentRepo, we are temporarily checking out the jUnit5 branch to run the test-source-code for jUnit5.
IMPORTANT: In 1_pullDeliverableRepo, we are temporarily checking out the jUnit5 branch as well to run the test-deliverable-code for junit 5.

My To Do list... Likely must bake these into docker container: 

These ENV parameters must be enabled:

1) studentRepoURL="${PROJECT_URL}" 
2) deliverableRepoURL="${DELIVERABLE_URL}" <-- Must make
3) deliverableRepoCommit="${DELIVERABLE_COMMIT}" <-- Must make

ie. 
	export PROJECT_URL=https://c84e2c3ed9b54ba9d7b649615071a04d1f4bdf31@github.com/stecler/cpsc210__assignment_1_submission.git
	export DELIVERABLE_URL=https://c84e2c3ed9b54ba9d7b649615071a04d1f4bdf31@github.com/stecler/cpsc210__deliverables.git
 	export DELIVERABLE_COMMIT=aa6c068

These ENV Parameters used multiple times across scripts, are contant, and therefore should be baked into the Docker container: 

	1) studentRepoDir="/cpsc210studentrepo" used in pullStudentRepo and setupidStudentTestingDir
	2) deliverableRepoDir="/cpsc210deliverablerepo" used in pullDeliverableRepo and setupidDeliverableTestingDir

Note on #4 or setupDeliverableTestingDir:

- the deliverable that we are using is hardcoded. It needs to be a parameter that is brought into the Docker container.
