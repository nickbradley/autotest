#!/usr/bin/env bash

# ##############################################################################
# run-tests.sh
# Nick Bradley <nbrad11@cs.ubc.ca>
#
# Description:
#  1) Clones the student's project from GitHub in the projectDir.
#  2) Disables network connections vis iptables
#  3) Builds the project and the deliverable (exits if project build fails)
#  4) Runs project coverage
#  5) Runs deliverable tests against the project
#
# Parameters:
#  Passes all parameters to pull-repo.sh
#
# Environment Variables
#  WHITELISTED_SERVERS="host:port host:port ..." List of hostnames to allow access
#  ALLOW_DNS=1|0 If enabled then WHITELISTED_SERVERS can contain hostnames in addition to IP addresses
#
# Notes:
#  1) Expects the deliverable repo exist in deliverableDir with up to date packages (node_modules)
# ##############################################################################

projectDir="/cpsc310project"
deliverableDir="/deliverable"
outputDir="/output"

buildCmd="yarn run build"
coverCmd="yarn run cover"
testsCmd="yarn run test"


# Clone the specified student repo into the projectDir
# Exit if unable to clone the student's repo
out=$(./pull-repo.sh $@ "${projectDir}" 2>&1)
status=$?

printf "<PROJECT_PULL exitcode=%d>\n%s\n</PROJECT_PULL>\n\n" "${status}" "${out}"

if [ $status -ne 0 ]
then
  exit 21
fi

# Configure the firewall to block all connections except those explicitly allowed
# Exit if problem configuring the firewall
out=$({
IPT="iptables"
dnsServers=$(grep -oP "(?<=nameserver ).*" /etc/resolv.conf | tr "\n" " ")

function parseUrl {
URL="$1" python - <<END
from urlparse import urlparse
import os
addr = os.environ['URL']
if addr.find('://') == -1:
  url = urlparse('//'+addr, 'http')
else:
  url = urlparse(addr)
print url.hostname
print url.port if url.port is not None else "80"
END
}


echo "Setting iptables to drop all connections."
$IPT -P INPUT   DROP
$IPT -P FORWARD DROP
$IPT -P OUTPUT  DROP


# Allow DNS lookups if env ALLOW_DNS is set to 1
if [ ${ALLOW_DNS} -eq 1 ]
then
  for ip in $dnsServers
  do
  	echo "Allowing DNS lookups (tcp, udp port 53) to server '$ip'"
  	$IPT -A OUTPUT -p udp -d $ip --dport 53 -m state --state NEW,ESTABLISHED -j ACCEPT
  	$IPT -A INPUT  -p udp -s $ip --sport 53 -m state --state ESTABLISHED     -j ACCEPT
  	$IPT -A OUTPUT -p tcp -d $ip --dport 53 -m state --state NEW,ESTABLISHED -j ACCEPT
  	$IPT -A INPUT  -p tcp -s $ip --sport 53 -m state --state ESTABLISHED     -j ACCEPT
  done
fi

for server in $WHITELISTED_SERVERS
do

  url=$(parseUrl "${server}")
  urlParts=($url)
  host=${urlParts[0]}
  port=${urlParts[1]}


	echo "Allowing connections to '$host' on port $port"
	$IPT -A OUTPUT -p tcp -d "$host" --dport $port  -m state --state NEW,ESTABLISHED -j ACCEPT
	$IPT -A INPUT  -p tcp -s "$host" --sport $port  -m state --state ESTABLISHED     -j ACCEPT
done
} 2>&1 )
status=$?

printf "<NETWORK exitcode=%d>\n%s\n</NETWORK>\n\n" "${status}" "${out}"

if [ $status -ne 0 ]
then
  exit 22
fi


# Create a link to node_modules and typings so we don't download packages twice
ln -s "${deliverableDir}/node_modules" "${projectDir}"
ln -s "${deliverableDir}/typings" "${projectDir}"


# Build the student's project
# Exit if the build fails
out=$(cd "${projectDir}" && ${buildCmd} 2>&1)
status=$?

printf "<PROJECT_BUILD exitcode=%d>\n%s\n</PROJECT_BUILD>\n\n" "${status}" "${out}"

if [ $status -ne 0 ]
then
  exit 23
fi

# Build the deliverable's code (depends on the student's code)
out=$(cd "${deliverableDir}" && ${buildCmd} 2>&1)
status=$?

printf "<DELIVERABLE_BUILD exitcode=%d>\n%s\n</DELIVERABLE_BUILD>\n\n" "${status}" "${out}"


# Run the coverage tool
out=$(cd "${projectDir}" && ${coverCmd} 2>&1 | awk '/===/{y=1}y')
status=$?

printf "<PROJECT_COVERAGE exitcode=%d>\n%s\n</PROJECT_COVERAGE>\n\n" "${status}" "${out}"

# Run the tests
out=$(cd "${deliverableDir}" && ${testsCmd} 2>&1)
status=$?

printf "<DELIVERABLE_TESTS exitcode=%d>\n%s\n</DELIVERABLE_TESTS>\n\n" "${status}" "${out}"

# Zip the coverage directory and copy it and the mocha report to the output directory
# http://stackoverflow.com/questions/18933975/zip-file-and-print-to-stdout
out=$(
  echo "Copying ${projectDir}/mocha_output/mochawesome.json to ${outputDir}/mocha.json."
  cp "${projectDir}/mocha_output/mochawesome.json" "${outputDir}/mocha.json" 2>&1
  echo "Archiving ${projectDir}/coverage as ${outputDir}/coverage.zip."
  zip -r "${outputDir}/coverage.zip" "${projectDir}/coverage" 2>&1
)
status=$?
printf "<FILE_OPERATIONS exitcode=%d>\n%s\n</FILE_OPERATIONS>\n\n" "${status}" "${out}"