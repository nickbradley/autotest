

set -o nounset  # exit if undeclared variable is used

CLIENT_DIR="${1}"
TEST_DIR="${2}"


cp -r "${CLIENT_DIR}" "/cpsc310project"

ln -s "${TEST_DIR}/node_modules" "/cpsc310project"
ln -s "${TEST_DIR}/typings" "/cpsc310project"


cd "/cpsc310project"
printf "<CLIENT_BUILD>\n"
npm run build
status=$?
printf "</CLIENT_BUILD>\n\n"
if [ $status -ne 0 ]
then
  exit 7
fi

cd "${TEST_DIR}"
printf "<TEST_BUILD>\n"
npm run build
printf "</TEST_BUILD>\n\n";

printf "<TEST_OUTPUT>\n"
npm run testprog
printf "</TEST_OUTPUT>\n\n"


cd "/cpsc310project"
printf "<COVERAGE_OUTPUT>\n"
npm run cover
printf "</COVERAGE_OUTPUT>\n\n"

printf "<COVERAGE_JSON>\n"
cat "coverage/coverage.json"
printf "\n</COVERAGE_JSON>\n\n"

printf "<TEST_JSON>\n"
cat "mocha_output/mochawesome.json"
printf "\n</TEST_JSON>\n\n"
