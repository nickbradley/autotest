scriptDir=$(dirname $BASH_SOURCE)

echo $BASH_SOURCE

input="./autotest.env"
while IFS= read -r var
do 
  if [[ $var == *"COURSES"* ]]; then
  courses=${var#*=}
  echo "Creating Redis instances for courses: $courses..."
fi
done < "$input"

for course in $(echo $courses | tr ";" "\n")
do
  #Creating Redis Queue for Each Course
  #... Mapping Port with Course Num...#
  course=$(($course+7000))
  Deploying Redis on Port: $course;
  docker create \
    --name "autotest-redis-$course" \
    --publish $course:6379 \
  redis
  
  #Start Redis Instance on Port
  docker start "autotest-redis-$course"

done

# Create CouchDB container
docker create \
  --name autotest-db \
  --publish 11312:5984 \
  --env COUCHDB_USER="${DB_ADMIN_USERNAME}" \
  --env COUCHDB_PASSWORD="${DB_ADMIN_PASSWORD}" \
  --volume "${scriptDir}/.data/dbdata":/usr/local/var/lib/couchdb \
  --volume "${scriptDir}/.data/dbconfig":/usr/local/etc/couchdb/local.d \
couchdb


./dbconfig.sh
