# AutoTest
CPSC 310 submission service.

Requirements
-------------

- Docker version 17.03.1-ce, build c6d412e (any close version will do)
- 'autotest.env' file in `./autotest/` directory: 

```
	DB_INSTANCE=http://localhost:11312 (old couchDB address)
	DB_ADMIN_USERNAME=CouchDBAdminUserName
	DB_ADMIN_PASSWORD=CouchDBAdminPassWord
	DB_APP_USERNAME=autotest
	DB_APP_PASSWORD=CouchDBRootPassword
	GITHUB_API_KEY=LONGSTRING
	REDIS_ADDRESS=http://localhost:6379
	SSL_CERT=/path/to/crt.crt
	SSL_KEY=/path/to/key.key
	SSL_INT_CERT=/path/to/-cacerts.pem
	COURSES=210 310, etc.
	DEV_MONGO_DB_INSTANCE=mongodb://localhost:27017/development
	PROD_MONGO_DB_INSTANCE=mongodb://localhost:27017/production
	TEST_MONGO_DB_INSTANCE=mongodb://localhost:27017/testing
```

- `yarn run install` with original lockfile and then `yarn run build`

Start Instructions
----------------------

- `./deploy.sh` Install required Docker instances.
- `./autotest/docker/tester/docker-up.sh` Build required per-course Docker containers.
- `yarn run start` Start AutoTest service.

Extra Info
--------------
- Based on the courses in the `autotest.env` file, an instance of the application will start on a corresponding port that begins in the 1000s to get around `sudo` security requirements under port 1000.
