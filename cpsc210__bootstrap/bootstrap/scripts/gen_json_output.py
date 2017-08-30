# Functions that write json files containing summary data for
# unit tests and code coverage.  This data will be stored in AutoTest database.

from copy import deepcopy
import json_templates
import json


def generate_user_json(user_report):
    """
    UserReport -> NoneType
    Generate user report as dictionary (ready to export as JSON)
    :param user_report:
    """
    student_info = json_templates.STUDENT_INFO
    student_info['snum'] = user_report.snum
    student_info['csid'] = user_report.userid
    student_info['projectCommit'] = user_report.git_commit
    #TODO: parse out GitHub key
    student_info['projectUrl'] = user_report.git_url


def generate_deliverable_json(deliverable_report):
    """
    DeliverableReport -> NoneType
    Generate deliverable report as dictionary (ready to export as JSON)
    :param deliverable_report:
    """
    deliverable_info = json_templates.DELIVERABLE_INFO
    deliverable_info['deliverable'] = deliverable_report.deliverable
    deliverable_info['deliverableCommit'] = deliverable_report.git_commit
    #TODO: parse out GitHub key
    deliverable_info['deliverableUrl'] = deliverable_report.git_url


def generate_test_json(name, time_stamp, duration, test_cases, test_results):
    """
    [TestCase], TestResult, str -> NoneType

    Generate test results as dictionary (ready to export as JSON)

    :param name: name of test suite
    :param time_stamp: time tests started
    :param duration: duration of test suite
    :param test_cases:  array of test cases
    :param test_results:  test results
    """
    test_report = json_templates.TEST_REPORT
    test_report['testRunTitle'] = name
    test_report['overviewResults']['startTime'] = time_stamp
    test_report['overviewResults']['duration'] = duration
    test_report['overviewResults']['tests'] = test_results.num_tests
    test_report['overviewResults']['passes'] = test_results.num_tests - test_results.num_failures \
                                                                      - test_results.num_errors
    test_report['overviewResults']['failures'] = test_results.num_failures
    test_report['overviewResults']['skipped'] = test_results.num_errors
    test_report['overviewResults']['passPercent'] = round(100 * (test_results.num_tests - test_results.num_failures
                                                                                        - test_results.num_errors)
                                                          / test_results.num_tests, 2)
    add_test_cases(test_report, test_cases)


def add_test_cases(test_report, test_cases):
    """
    dict, [TestCase] -> NoneType

    Adds all tests cases in test_cases to test_report

    :param test_report:  test report
    :param test_cases:  array of tests cases
    """
    test_report['detailedResults'] = []
    for test_case in test_cases:
        add_test_case(test_report, test_case)


def add_test_case(test_report, test_case):
    """
    dict, TestCase -> NoneType

    Adds test case to test_report

    :param test_report:  test report
    :param test_case:   test case
    """
    test = deepcopy(json_templates.TEST)
    test['testName'] = test_case.name
    test['hint'] = test_case.display_name
    test['hintGiven'] = test_case.hint_given['state']
    test['state'] = test_case.status
    test['duration'] = test_case.duration
    test['rank'] = test_case.rank
    test['weight'] = test_case.weight

    test_report['detailedResults'].append(test)


def generate_coverage_json(raw_coverage_data):
    """
    dict, str -> NoneType

    Generate coverage results as dictionary (ready to export as JSON)

    :param raw_coverage_data:  dictionary of raw coverage data
    """
    coverage_report = json_templates.COVERAGE_REPORT
    counters = raw_coverage_data['report']['counter']
    add_counters_to_report(coverage_report, counters)


def add_counters_to_report(coverage_report, counters):
    """
    dict, [dict] -> NoneType

    Add coverage counters to report

    :param coverage_report:  coverage report
    :param counters:  array of counters
    """
    for counter in counters:
        if counter['@type'] == 'LINE':
            add_to_report(coverage_report, 'lines', counter)
        elif counter['@type'] == 'BRANCH':
            add_to_report(coverage_report, 'branches', counter)
        elif counter['@type'] == 'METHOD':
            add_to_report(coverage_report, 'functions', counter)


def add_to_report(coverage_report, key, counter):
    """
    dict, str, dict -> NoneType

    Add counter to coverage report for given key

    :param coverage_report:  the coverage report
    :param key: key at which counters will be stored in report
    :param counter:  counters to be added to report
    """
    total = counter['@missed'] + counter['@covered']
    counters_for_key = coverage_report[key]
    counters_for_key['total'] = total
    counters_for_key['covered'] = counter['@covered']
    counters_for_key['skipped'] = counter['@missed']
    counters_for_key['percentage'] = round(counter['@covered'] / total * 100.0, 2)


def add_grade_data_to_json(score_weights, scores, coverage_weights):
    """
    ScoreWeights, Scores -> NoneType
    Add grade data and custom weighting data to test report
    :param score_weights: weights used to combine test and coverage scores
    :param scores:  test, coverage & combined scores
    :param coverage_weights: weights for individual components of code coverage (line, branch, method,...)
    """
    test_report = json_templates.TEST_REPORT
    test_report['grade']['finalGrade'] = scores.combined_score
    test_report['custom']['coverageGrade'] = scores.coverage_score
    test_report['custom']['testingGrade'] = scores.test_score
    test_report['custom']['testingWeight'] = score_weights.test_weight
    test_report['custom']['coverageWeight'] = score_weights.coverage_weight
    test_report['custom']['coverageMethodWeight'] = coverage_weights.method_weight
    test_report['custom']['coverageLineWeight'] = coverage_weights.line_weight
    test_report['custom']['coverageBranchWeight'] = coverage_weights.branch_weight


def generate_json_report(path_to_json_file):
    """
    str -> NoneType
    :param path_to_json_file: path to json file
    Construct top-level JSON object and write to file
    """
    report = json_templates.REPORT
    report['studentInfo'] = json_templates.STUDENT_INFO
    report['deliverableInfo'] = json_templates.DELIVERABLE_INFO
    report['coverage'] = json_templates.COVERAGE_REPORT
    report['tests'] = json_templates.TEST_REPORT
    write_to_json(report, path_to_json_file)


def write_to_json(report, path_to_json_file):
    """
    dict -> NoneType

    Writes report to file in JSON format

    :param report:  a python dictionary containing report to be written to file
    :param path_to_json_file:   path to JSON file
    """
    with open(path_to_json_file, "w") as outf:
        json.dump(report, outf)
