from data_defs import *
from mako.template import Template
from collections import namedtuple


# Report has time stamp, score weights, scores, test results, test cases and report hints
Report = namedtuple('Report', ['time_stamp', 'score_weights', 'scores', 'test_results', 'report_hints'])


def parse_score_weights(json_report):
    """
    dict -> ScoreWeights
    Parse score weights from json report
    :param json_report: the json report (as a Python dictionary)
    :return: the score weights parsed from json report
    """
    test_weight = json_report['tests']['custom']['coverageWeight']
    coverage_weight = json_report['tests']['custom']['testingWeight']
    return ScoreWeights(test_weight, coverage_weight)


def parse_scores(json_report):
    """
    dict -> Scores
    Parse scores from json report
    :param json_report: the json report (as a Python dictionary)
    :return: the scores parsed from json report
    """
    test_score = json_report['tests']['custom']['testingGrade']
    coverage_score = json_report['tests']['custom']['coverageGrade']
    combined_score = json_report['tests']['grade']['finalGrade']
    return Scores(test_score, coverage_score, combined_score)


def parse_test_results(json_report):
    """
    dict -> TestResult
    :param json_report: the json report (as a Python dictionary)
    :return: the test results (# tests, # failures, # errors)
    """
    num_tests = json_report['tests']['overviewResults']['tests']
    num_failures = json_report['tests']['overviewResults']['failures']
    num_errors = json_report['tests']['overviewResults']['skipped']
    return TestResult(num_tests, num_failures, num_errors)


def parse_report_hints(json_report):
    """
    dict -> [Hint]
    :param json_report: the json report (as a Python dictionary)
    :return: list of hints to be presented to student
    """
    hints = []
    test_results = json_report['tests']['detailedResults']
    for result in test_results:
        if result['hintGiven']:
            hints.append(parse_hint(result))
    return hints


def parse_hint(result):
    """
    dict -> Hint
    :param result: a test result
    :return: hint
    """
    hint_text = result['hint']
    hint_excep = result['exception']
    return Hint(hint_text, hint_excep)


def parse_report_data(json_report):
    """
    dict -> Report
    Parse report data from json report
    :param json_report: the json report (as a Python dictionary)
    :return: report data
    """
    time_stamp = json_report['tests']['overviewResults']['startTime']
    score_weights = parse_score_weights(json_report)
    scores = parse_scores(json_report)
    test_results = parse_test_results(json_report)
    report_hints = parse_report_hints(json_report)
    return Report(time_stamp, score_weights, scores, test_results, report_hints)


def write_feedback_report(json_report, coverage_weights, include_grade_coverage, path_to_file):
    """
    dict, str -> NoneType
    Write report to html file
    :param json_report: the json report (as a Python dictionary)
    :param coverage_weights: weights for individual components of code coverage (e.g. line, method, branch,...)
    :param include_grade_coverage: true if code coverage score included in overall grade
    :param path_to_file:  path to html file to be created
    """
    template = Template(filename='testFeedbackTemplate.html')

    user_id = json_report['studentInfo']['csid']
    deliverable = json_report['deliverableInfo']['deliverable']
    report_data = parse_report_data(json_report)
    with open(path_to_file, 'w') as outf:
        outf.write(template.render(userid=user_id,
                                   deliverable=deliverable,
                                   report=report_data,
                                   coveragebreakdown=coverage_weights,
                                   gradecoverage=include_grade_coverage))


def format_html(data):
    """
    str -> list[str]
    Format data for html
    :param data: string (containing \t,\n, <, >) to be formatted for html
    :return: html formatted list of strings
    """
    data = data.replace(' ', '&nbsp;')
    data = data.replace('<', '&lt;')
    data = data.replace('>', '&gt;')
    return data.split('\n')


def write_error_report(excep_str, path_to_file):
    """
    Str -> NoneType
    Write error report for student
    :param excep_str:  stacktrace created when exception was raised
    :param path_to_file: path to html file to be created
    """
    template = Template(filename='errorFeedbackTemplate.html')
    excep_html = format_html(excep_str)
    with open(path_to_file, 'w') as outf:
        outf.write(template.render(error=excep_html))
