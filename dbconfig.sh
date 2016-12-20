# Configure the CouchDB
# The following environment variables must be set
#   DB_INSTANCE
#   DB_ADMIN_USERNAME
#   DB_ADMIN_PASSWORD
#   DB_APP_USERNAME
#   DB_APP_PASSWORD


# Check if the admin user has been set
# If so, include username/password in instance: http://user:pass@localhost:5984
if [ -n "${DB_ADMIN_USERNAME}" ]
then
  DB_INSTANCE=${DB_INSTANCE/"//"/"//${DB_ADMIN_USERNAME}:${DB_ADMIN_PASSWORD}@"}
fi

echo "DB_INSTANCE set to ${DB_INSTANCE}"

# Create Databases
printf "Creating database settings "
curl -X PUT ${DB_INSTANCE}/settings

printf "Creating database github "
curl -X PUT ${DB_INSTANCE}/github

# Create views
printf "Creating views "
curl -X PUT ${DB_INSTANCE}/settings/_design/current \
  -H "Content-Type: application/json" \
  -d '{
      "_id": "_design/current",
      "views": {
        "deliverable": {
          "map": "function(doc) {\n  if (doc._id === \"deliverables\") {\n    var now = Date.now();\n    for (var key in doc) {\n      var dDate = new Date(doc[key].dueDate); \n      if (key.substring(0, 1) != \"_\" && dDate.getTime() <= now) {\n\temit(key, doc[key]);\n      }\n    }\n  } \n}"
        }
      }
    }'

# Create users
printf "Creating user ${DB_APP_USERNAME} "
curl -X PUT ${DB_INSTANCE}/_users/org.couchdb.user:${DB_APP_USERNAME} \
  -H "Content-Type: application/json" \
  -d '{
      "_id": "org.couchdb.user:'${DB_APP_USERNAME}'",
      "name": "'${DB_APP_USERNAME}'",
      "roles": [],
      "type": "user",
      "password": "'${DB_APP_PASSWORD}'"
    }'
