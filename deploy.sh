# Create Redis container
docker create \
  --name autotest-redis \
  --publish 6379:6379 \
redis

# Create CouchDB container
docker create \
  --name autotest-db1 \
  --publish 11312:5984 \
  --env COUCHDB_USER="${DB_ADMIN_USERNAME}" \
  --env COUCHDB_PASSWORD="${DB_ADMIN_PASSWORD}" \
  --volume /home/nickbradley/autotest/dbdata:/usr/local/var/lib/couchdb \
  --volume /home/nickbradley/autotest/dbconfig:/usr/local/etc/couchdb/local.d \
couchdb


# Configure Database
docker start autotest-db
sleep 20s
./dbconfig.sh
sleep 10s
docker stop autotest-db
