from collections import namedtuple

# TestResult has a number of tests that were run, number of tests that failed and
# number of tests that produced an error when run
TestResult = namedtuple('TestResult', ['num_tests', 'num_failures', 'num_errors'])

# TestCase has a name, display name, duration, status (one of 'pass', 'failure', 'error')
# exception type in the case of an error, rank, weight and whether hint was provided for this test
TestCase = namedtuple('TestCase', ['name', 'display_name', 'duration', 'status',
                                   'excep_type', 'rank', 'weight', 'hint_given'])

# Hint has a test hint and, in the case of a test that led to an error, the
# type of exception that was raised
Hint = namedtuple('Hint', ['hint', 'excep_type'])

# CoverageWeights has a method weight, line weight and branch weight used to
# produce an overall score for code coverage.  Weights are expressed as a value
# between 0.0 and 1.0 and combined weights must sum to 1.0
CoverageWeights = namedtuple('CoverageWeights', ['method_weight', 'line_weight', 'branch_weight'])

# ScoreWeights has a weight for unit tests and a weight for code coverage used to compute overall score
ScoreWeights = namedtuple('ScoreWeights', ['test_weight', 'coverage_weight'])

# Scores has a test score, coverage score and combined overall score
Scores = namedtuple('Scores', ['test_score', 'coverage_score', 'combined_score'])

# UserReport has student number, user id, git commit and git url
UserReport = namedtuple('UserReport', ['snum', 'userid', 'git_commit', 'git_url'])

# DeliverableReport has deliverable name, git commit and git url
DeliverableReport = namedtuple('DeliverableReport', ['deliverable', 'git_commit', 'git_url'])

# UnitTestReport has a time stamp, test score, test results and report hints
UnitTestReport = namedtuple('UnitTestReport', ['time_stamp', 'test_score', 'test_results', 'report_hints'])