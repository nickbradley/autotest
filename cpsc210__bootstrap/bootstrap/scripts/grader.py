import xml.etree.ElementTree
import os
import fnmatch

COVERAGE_REPORT_PATH = '../outputs/coverage/xml_report.xml'
GRADE_SCHEMA_PATH = '../config/grade_schema.txt'
TESTS_DIR = '../outputs/tests/'

xmlTestFiles = []

for file in os.listdir(TESTS_DIR):
  if fnmatch.fnmatch(file, '*.xml'):
    xmlTestFiles.append(file)
    print(file)

testFilenames = os.listdir(TESTS_DIR)
coverageReport = xml.etree.ElementTree.parse(COVERAGE_REPORT_PATH).getroot()


print(coverageReport)
print('Hello, world!')
