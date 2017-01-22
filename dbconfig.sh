# Configure the CouchDB
# The following environment variables must be set
#   DB_INSTANCE
#   DB_ADMIN_USERNAME
#   DB_ADMIN_PASSWORD
#   DB_APP_USERNAME
#   DB_APP_PASSWORD


# Check if the admin user has been set
# If so, include username/password in instance: http://user:pass@localhost:5984
# if [ -n "${DB_ADMIN_USERNAME}" ]
# then
#   DB_INSTANCE=${DB_INSTANCE/"//"/"//${DB_ADMIN_USERNAME}:${DB_ADMIN_PASSWORD}@"}
# fi

echo "DB_INSTANCE set to ${DB_INSTANCE}"

# Create Databases
printf "Creating database settings "
curl -X PUT ${DB_INSTANCE}/settings -u ${DB_ADMIN_USERNAME}:${DB_ADMIN_PASSWORD}

printf "Creating database results "
curl -X PUT ${DB_INSTANCE}/results -u ${DB_ADMIN_USERNAME}:${DB_ADMIN_PASSWORD}

printf "Creating database requests "
curl -X PUT ${DB_INSTANCE}/requests -u ${DB_ADMIN_USERNAME}:${DB_ADMIN_PASSWORD}

# Create views
printf "Creating views "
curl -X PUT ${DB_INSTANCE}/settings/_design/current -u ${DB_ADMIN_USERNAME}:${DB_ADMIN_PASSWORD} \
  -H "Content-Type: application/json" \
  -d '{
      "_id": "_design/current",
      "views": {
        "deliverable": {
          "map": "function(doc) {\n  if (doc._id === \"deliverables\") {\n    var now = Date.now();\n    for (var key in doc) {\n      var dDate = new Date(doc[key].dueDate); \n      if (key.substring(0, 1) != \"_\" && dDate.getTime() <= now) {\n\temit(key, doc[key]);\n      }\n    }\n  } \n}"
        }
      }
    }'

curl -X PUT ${DB_INSTANCE}/requests/_design/latest -u ${DB_ADMIN_USERNAME}:${DB_ADMIN_PASSWORD} \
  -H "Content-Type: application/json" \
  -d '{
      "_id": "_design/latest",
      "views": {
        "byUserDeliverable": {
          "map": "function(doc) {\n  if (doc.user && doc.deliverable && doc.isRequest && doc.isProcessed) {\n emit([doc.user, doc.deliverable], doc.timestamp);  \n} \n}",
          "reduce": "function(key, values, rereduce) {\n return Math.max.apply(null, values); \n}"
        }
      }
    }'

curl -X PUT ${DB_INSTANCE}/results/_design/default -u ${DB_ADMIN_USERNAME}:${DB_ADMIN_PASSWORD} \
  -H "Content-Type: application/json" \
  -d '{
      "_id": "_design/default",
      "views": {
        "byTeamCommitDeliverable": {
          "map": "function(doc) {\n  if (doc.team && doc.deliverable && doc.commit) {\n emit([doc.team, doc.deliverable.deliverable, doc.commit], {\"visibility\":doc.deliverable.visibility, \"containerExitCode\":doc.containerExitCode, \"buildFailed\":doc.buildFailed, \"buildMsg\":doc.buildMsg, \"testStats\":doc.testStats, \"coverageStats\":doc.coverStats, \"testReport\":doc.testReport, \"timestamp\":doc.timestamp});  \n} \n}"
        }
      }
    }'


curl -X PUT ${DB_INSTANCE}/results/_design/grades -u ${DB_ADMIN_USERNAME}:${DB_ADMIN_PASSWORD} \
     -H "Content-Type: application/json" \
     -d @./database/results/views/grades/byTeamDeliverableCommit.json


# Create users
printf "Creating user ${DB_APP_USERNAME} "
curl -X PUT ${DB_INSTANCE}/_users/org.couchdb.user:${DB_APP_USERNAME} -u ${DB_ADMIN_USERNAME}:${DB_ADMIN_PASSWORD} \
  -H "Content-Type: application/json" \
  -d '{
      "_id": "org.couchdb.user:'${DB_APP_USERNAME}'",
      "name": "'${DB_APP_USERNAME}'",
      "roles": [],
      "type": "user",
      "password": "'${DB_APP_PASSWORD}'"
    }'
