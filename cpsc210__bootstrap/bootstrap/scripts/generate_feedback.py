from data_defs import *
from xmljson import badgerfish as bf
from xml.etree.ElementTree import fromstring
from collections import OrderedDict
from math import fabs
from os import makedirs, environ, listdir, path
from shutil import copy
from sys import maxsize
from traceback import format_exc
from json_handler import *
from json_to_html import write_feedback_report
from json_to_html import write_error_report

REF_TEST_RESULTS = "../../output/deliverableTests/junitTests/TEST-junit-jupiter.xml"
JACOCO_REPORT = "../../output/studentTests/jacoco/coverage.xml"
FEEDBACK_DIR = "../../output/feedback"
FEEDBACK_HTML = FEEDBACK_DIR + "/response.html"
TESTS_JSON = FEEDBACK_DIR + "/tests.json"
COVERAGE_JSON = FEEDBACK_DIR + "/coverage.json"
JSON_REPORT = FEEDBACK_DIR + "/report.json"
CONFIG_XML = "../config/grade_config.xml"
RESOURCE_DIR = "./resources"


# defaults - replaced by values read from CONFIG_XML (if it exists)
WEIGHT_GRADE_COVERAGE = 0.0   # proportion of overall grade determined by code coverage, the rest by unit tests
INCLUDE_GRADE_COVERAGE = WEIGHT_GRADE_COVERAGE > 0
COVERAGE_WEIGHTS = CoverageWeights(method_weight=0, line_weight=0.8, branch_weight=0.2)
NUM_HINTS = 3


def parse_num_test_cases(result):
    """
    dict -> TestResult
    Returns tuple of length 3 containing number of tests, failures and errors
    :param result: jUnit test results as dictionary
    :return: TestResult(#tests, #failures, #errors)
    """
    testsuite = result['testsuite']
    num_tests = testsuite['@tests']
    num_failures = testsuite['@failures']
    num_errors = testsuite['@errors']
    return TestResult(num_tests, num_failures, num_errors)


def parse_test_cases(result):
    """
    dict -> [TestCase]
    Parse the test cases from overall jUnit test results
    :param result: jUnit test results as dictionary
    :return: array of TestCase, each case containing test name, display name, test status and, in
    case of error status, the type of exception that was raised
    """
    results = []
    test_cases = result['testsuite']['testcase']
    for test in test_cases:
        results.append(parse_test(test))
    return results


def parse_test(test):
    """
    dict -> TestCase
    Parse a single test
    :param test: single test case as dictionary
    :return: tuple containing test name and display name
    """
    name = '{}.{}'.format(test['@classname'], test['@name'])
    duration = test['@time']
    if len(test['system-out']) != 2:
        print_warning('@AutoGrader extension not running on {}'
                      ' - hint will have lowest rank and assigned weight will be 1'.format(name))
        display_name = parse_value_for_key('display-name:', name, test['system-out']['$'], ' ')
        rank, weight = maxsize, 1.0
    else:
        display_name = parse_value_for_key('display-name:', name, test['system-out'][1]['$'], ' ')
        rank, weight = parse_rank_weight(test['system-out'])
    test_status = parse_test_status(test)
    excep_type = None
    if test_status == 'error':
        excep_type = test['error']['@type']
    return TestCase(name, display_name, duration, test_status, excep_type, rank, weight, {'state': False})


def parse_rank_weight(sysout):
    """
    [dict] -> (int, float)
    Parse test rank and weight from value of system-out key of single test case result
    :param sysout: array of values of system-out key of single test case
    :return: tuple containing rank and weight of test
    """
    val = sysout[0]['$']                    # rank and weight are in first <system-out></system-out> element
    rank = int(parse_value_for_key('rank:', str(maxsize), val, ' ', '\n'))
    weight = float(parse_value_for_key('weight:', 1.0, val, ' '))
    return rank, weight


def parse_value_for_key(key, default_val, data, start_delim, end_delim=None):
    """
    str -> str
    Parse value for key from given data.
    e.g.
    - data is '.... display-name: DN'
    - key is 'display-name:'
    - start-delim is ' '
    - end-delim is None (value is at end of given data string)
    - value produced is DN
    :param key:   the key to search for (str)
    :param default_val:   the default value to be produced if key not found or given delimeter doesn't match
    :param data:  the data to be searched
    :param start_delim:   the starting delimiter for the corresponding value (str)
    :param end_delim:  the ending delimiter for the corresponding value, None if value runs to end of data string
    :return:  value corresponding to given key
    """
    index_of_dn = data.find(key)
    if index_of_dn == -1:
        return default_val
    index_of_start = data.find(start_delim, index_of_dn)
    if index_of_start == -1:
        return default_val
    if end_delim is None:
        index_of_end = None
    else:
        index_of_end = data.find(end_delim, index_of_start)
        if index_of_end == -1:
            return default_val
    return data[index_of_start + 1:index_of_end]


def parse_test_status(test):
    """
    dict -> str
    Parse status of test as one of pass, fail, error
    :param test: single test case as dictionary
    :return: one of 'pass', 'fail', 'error'
    """
    if 'error' in test.keys():
        return 'error'
    elif 'failure' in test.keys():
        return 'failure'
    else:
        return 'pass'


def rank_test_cases(test_cases):
    """
    [TestCase] -> {int : list(TestCase)}
    Gets dictionary of [rank : list(TestCase)] for tests that fail or have errors
    :param test_cases: list of test cases
    :return: dictionary of [rank : set(TestCase)] key/value pairs
    """
    hints = {}
    max_rank = 0

    # add hints that are ranked
    for case in test_cases:
        if case.status != 'pass':   # gather hints only for tests that have not passed
            rank = case.rank

            if rank > max_rank:
                max_rank = rank
            if rank not in hints.keys():
                hints[rank] = list()
            hints[rank].append(case)

    return hints


def mark_top_ranked_hints(ranked_test_cases):
    """
    {int : list(TestCase)} -> NoneType
    Sets hint_given flag for top NUM_HINTS ranked hints
    :param ranked_test_cases:  dictionary of rank and corresponding TestCases for all tests that do not pass
    """
    done = False  # are we done gathering NUM_HINTS hints

    # sort on rank
    ordered_test_cases = OrderedDict(sorted(ranked_test_cases.items(), key=lambda t: t[0]))

    # hold on to top NUM_HINTS only
    count = 0

    for rank in ordered_test_cases:
        for test_case in ordered_test_cases[rank]:
            test_case.hint_given['state'] = True
            count += 1
            if count >= NUM_HINTS:
                done = True
                break

        if done:     # yuk!
            break


def prepare_hints(test_cases):
    """
    [TestCase] -> NoneType
    Prepare hints for student - only top NUM_HINTS shown
    :param test_cases: list of test cases
    """
    ranked_test_cases = rank_test_cases(test_cases)
    mark_top_ranked_hints(ranked_test_cases)


def compute_test_score(test_cases):
    """
    [TestCase] -> float
    Compute a score from running reference tests
    :param test_cases: list of test cases
    :return: test score as percentage
    """
    weighted_pass = 0.0
    total_weight = 0.0

    for case in test_cases:
        if case.status == 'pass':
            weighted_pass += case.weight
        total_weight += case.weight

    return weighted_pass / total_weight * 100.0


def compute_overall_score(test_score, coverage_score):
    """
    float, float -> float
    Compute overall score as percentage
    :param test_score:  score from unit tests
    :param coverage_score:  score from code coverage
    :return: overall score (%)
    """
    return WEIGHT_GRADE_COVERAGE * coverage_score + (1.0 - WEIGHT_GRADE_COVERAGE) * test_score


def format_num(score):
    """
    float -> float
    Format score to 1 decimal place
    :param score:  the score to be formatted
    :return: score to 1dp
    """
    return round(score, 1)


def compute_coverage_score(raw_coverage_data):
    """
    dict -> (float, float, float)
    Compute coverage score from raw data read from Jacoco
    :param raw_coverage_data:
    :return: (method_score, line_score, branch_score)
    """
    counters = raw_coverage_data['report']['counter']
    scores = process_counters(counters)
    coverage_score = combine_coverage_scores(scores)

    return coverage_score


def combine_coverage_scores(scores):
    """
    {[str : float]} -> float
    Combine scores for method, line and branch coverage
    :param scores: scores on [0.0, 1.0] for all counters
    :return: overall score
    """
    return (scores['METHOD'] * COVERAGE_WEIGHTS.method_weight
            + scores['LINE'] * COVERAGE_WEIGHTS.line_weight
            + scores['BRANCH'] * COVERAGE_WEIGHTS.branch_weight) * 100.0


def process_counters(counters):
    """
    dict -> {str : float}
    Produce dictionary of counter types and corresponding scores on range 0.0 to 1.0
    :param counters:
    :return: dictionary of scores for different measures of code coverage
    """
    scores = {}
    for counter in counters:
        total = counter['@covered'] + counter['@missed']
        if total == 0:
            score = 1       # if there are no branches, for example, score 100% for branch coverage
        else:
            score = counter['@covered'] / total
        scores[counter['@type']] = score
    return scores


def get_user_data():
    """
    NoneType -> UserReport
    :return: report containing user data read from environment variables
    """
    snum = get_environ('SNUM')
    userid = get_environ('CSID')
    commit = get_environ('PROJECT_COMMIT')
    url = elide_token(get_environ('PROJECT_URL'))

    return UserReport(snum, userid, commit, url)


def get_deliverable_data():
    """
    NoneType -> DeliverableReport
    :return:  report containing deliverable data read from environment variables
    """
    deliverable = get_environ('ASSIGNMENT_NUM')
    commit = get_environ('DELIVERABLE_COMMIT')
    url = elide_token(get_environ('DELIVERABLE_URL'))

    return DeliverableReport(deliverable, commit, url)


def elide_token(url):
    """
    str -> str
    Elide GitHub token from url
    :param url: GitHub project URL including token
    :return: url with token removed or url if url is not a valid https URL to a GitHub project
    """
    index_start_omit = url.find('//') + 2
    index_end_omit = url.find('@')
    if index_start_omit == -1 or index_end_omit == -1:
        return url
    else:
        return url[0:index_start_omit] + '<token>' + url[index_end_omit:]


def get_environ(name):
    """
    str -> str
    Get value of environment variable with given name
    :param name: name of environment variable
    :return: value of environment variable or 'unknown' if not found
    """
    val = environ.get(name)
    if val is None:
        val = 'unknown'
    return val


def junit_to_json(path_to_test_results):
    """
    str -> float

    Process JSON report and return score for unit testing

    :param path_to_test_results: path to jUnit xml file
    :return:  test score
    """
    raw_test_data = read_xml_file(path_to_test_results)
    test_cases = parse_test_cases(raw_test_data)
    prepare_hints(test_cases)
    name = raw_test_data['testsuite']['@name']
    time_stamp = raw_test_data['testsuite']['@timestamp']
    duration = raw_test_data['testsuite']['@time']
    test_results = parse_num_test_cases(raw_test_data)
    test_score = compute_test_score(test_cases)

    generate_test_json(name, time_stamp, duration, test_cases, test_results)

    return test_score


def coverage_to_json(path_to_coverage_results):
    """
    str -> float
    Process JSON report and return coverage score from Jacoco report
    :param path_to_coverage_results:  path to Jacoco xml file
    :return: coverage score
    """
    raw_coverage_data = read_xml_file(path_to_coverage_results)
    coverage_score = compute_coverage_score(raw_coverage_data)
    generate_coverage_json(raw_coverage_data)

    return coverage_score


def overall_scores_to_json(test_score, coverage_score):
    """
    float, float -> NoneType
    Write overall score and grade weights to JSON report
    :param test_score:   test score
    :param coverage_score:  coverage score
    """
    overall_score = compute_overall_score(test_score, coverage_score)
    scores = format_test_scores(test_score, coverage_score, overall_score)
    score_weights = format_score_weights()
    add_grade_data_to_json(scores, score_weights, COVERAGE_WEIGHTS)


def format_test_scores(test_score, coverage_score, overall_score):
    """
    float, float, float -> Scores
    :param test_score:
    :param coverage_score:
    :param overall_score:
    :return: scores as strings formatted according to format_num
    """
    test_score_str = format_num(test_score)
    coverage_score_str = format_num(coverage_score)
    overall_score_str = format_num(overall_score)
    return Scores(test_score=test_score_str, coverage_score=coverage_score_str, combined_score=overall_score_str)


def format_score_weights():
    """
    NoneType -> ScoreWeights
    :return: score weights formatted according to format_num
    """
    testing_weight_str = format_num((1 - WEIGHT_GRADE_COVERAGE) * 100)
    coverage_weight_str = format_num(WEIGHT_GRADE_COVERAGE * 100)
    return ScoreWeights(test_weight=testing_weight_str, coverage_weight=coverage_weight_str)


def prepare_output_directory():
    """
    Make sure feedback directory exists, so that html file can be written to it
    Write resources needed by html file to feedback directory
    """
    makedirs(FEEDBACK_DIR, exist_ok=True)
    resource_files = listdir(RESOURCE_DIR)
    for fn in resource_files:
        path_to_resource = path.join(RESOURCE_DIR, fn)
        if path.isfile(path_to_resource):
            copy(path_to_resource, FEEDBACK_DIR)


def parse_config():
    """
    Parse grading parameters from config file (if it exists), otherwise leave default values in place
    """
    try:
        with open(CONFIG_XML, 'r') as inf:
            config = bf.data(fromstring(inf.read()))
            set_config_vals(config)
    except Exception:
        print_warning('No grade configuration file found - using defaults - coverage not included in score!')


def set_config_vals(config):
    """
    dict -> NoneType
    :param config:  configuration data read from CONFIG_XML
    """
    global NUM_HINTS, WEIGHT_GRADE_COVERAGE, INCLUDE_GRADE_COVERAGE, COVERAGE_WEIGHTS
    config_vals = config['grade-config']
    NUM_HINTS = config_vals['num-hints']['$']
    WEIGHT_GRADE_COVERAGE = config_vals['coverage-weight']['$']
    INCLUDE_GRADE_COVERAGE = config_vals['code-coverage']['$']
    method_weight = config_vals['method-coverage']['$']
    line_weight = config_vals['line-coverage']['$']
    branch_weight = config_vals['branch-coverage']['$']
    COVERAGE_WEIGHTS = CoverageWeights(method_weight, line_weight, branch_weight)


def sanity_check_weights():
    """
    :return: true if COVERAGE_WEIGHTS sume to 1.0, false otherwise
    """
    total_weight = COVERAGE_WEIGHTS.method_weight + COVERAGE_WEIGHTS.line_weight + COVERAGE_WEIGHTS.branch_weight
    return fabs(total_weight - 1.0) < 1.0e-6


def read_xml_file(xml_file):
    """
    str -> dict
    Read xml file
    :param xml_file: path to xml file
    :return: results as python dictionary
    """
    with open(xml_file, 'r') as inf:
        raw_result = bf.data(fromstring(inf.read()))
        return raw_result


def print_warning(msg):
    """
    Print warning message to console
    :param msg:  message to print
    """
    print('<WARNING>{0!s}</WARNING>'.format(msg))


if __name__ == "__main__":
    prepare_output_directory()
    parse_config()
    if not sanity_check_weights():
        print_warning('Weights for code coverage components do not sum to 1.0!')

    try:
        # process user and deliverable data
        user_report = get_user_data()
        generate_user_json(user_report)
        deliverable_report = get_deliverable_data()
        generate_deliverable_json(deliverable_report)

        # process jUnit and code coverage data
        test_score = junit_to_json(REF_TEST_RESULTS)
        coverage_score = coverage_to_json(JACOCO_REPORT)

        # process overall scores
        overall_scores_to_json(test_score, coverage_score)

        # generate top-level json data
        generate_json_report(JSON_REPORT)

        # generate html report
        json_report = get_json_report()
        write_feedback_report(json_report, COVERAGE_WEIGHTS, INCLUDE_GRADE_COVERAGE, FEEDBACK_HTML)
    except Exception:
        excep_str = format_exc()
        print(excep_str)
        # TODO: wite json report to indicate error
        write_error_report(excep_str, FEEDBACK_HTML)
