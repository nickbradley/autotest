FIRST THING THAT HAS TO CHANGE
————————

— One server instance uses run-test-container-310.sh
- Other server instance uses run-test-container-210.sh

Thus, we need produce both run container instances.

In addition, those container instances need to have these features:

- Correct ENV variables to function 
- Correct /output directory with resource files.

The config file for each server should contain an array of files to pull into the database. 

We need a universal file in the /output/ folder that is always available and contains the grading information to send back to ClassPortal. 

—————————————————————


