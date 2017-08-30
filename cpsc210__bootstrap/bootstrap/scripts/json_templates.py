from collections import OrderedDict

REPORT = OrderedDict([('studentInfo', None),
                      ('deliverableInfo', None),
                      ('coverage', None),
                      ('tests', None)])

STUDENT_INFO = OrderedDict([('snum', None),
                            ('csid', None),
                            ('projectUrl', None),
                            ('projectCommit', None)])

DELIVERABLE_INFO = OrderedDict([('deliverable', None),
                                ('deliverableUrl', None),
                                ('deliverableCommit', None)])

TEST_REPORT = OrderedDict([('testRunTitle', 'Test Suite'),
                            ('testingSoftware', 'jUnit'),
                            ('testingSoftwareVersion', 5.0),
                            ('overviewResults',
                               OrderedDict([('suites', 1),
                                            ('tests', None),
                                            ('passes', None),
                                            ('pending', None),
                                            ('failures', None),
                                            ('skipped', None),  # errors in the jUnit world
                                            ('startTime', None),
                                            ('endTime', None),
                                            ('duration', None),
                                            ('registered', None),
                                            ('passPercent', None),
                                            ('pendingPercent', None),
                                            ('passPercentClass', None),
                                            ('pendingPercentClass', None)])),
                           ('detailedResults', []),
                           ('grade',
                               OrderedDict([('finalGrade', None),
                                            ('deliverableWeight', None)])),
                           ('custom',
                               OrderedDict([('coverageGrade', None),
                                            ('testingGrade', None),
                                            ('coverageWeight', None),
                                            ('testingWeight', None),
                                            ('coverageMethodWeight', None),
                                            ('coverageLineWeight', None),
                                            ('coverageBranchWeight', None)]))])

TEST = OrderedDict([('testName', None),
                    ('hint', None),
                    ('hintGiven', None),
                    ('exception', None),
                    ('timedOut', None),
                    ('duration', None),
                    ('state', None),  #passed/failed/error
                    ('rank', None),
                    ('weight', None),
                    ('speed', None),  #fast/slow
                    ('pending', None),
                    ('code', None)])

COVERAGE_REPORT = OrderedDict([('lines', OrderedDict([('percentage', None),
                                                        ('total', None),
                                                        ('covered', None),
                                                        ('skipped', None)])),
                               ('statements', None),
                               ('branches', OrderedDict([('percentage', None),
                                                        ('total', None),
                                                        ('covered', None),
                                                        ('skipped', None)])),
                               ('functions', OrderedDict([('percentage', None),
                                                        ('total', None),
                                                        ('covered', None),
                                                        ('skipped', None)]))])
