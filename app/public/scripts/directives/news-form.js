'use strict';

angular.module('hapi-learning')
    .directive('newsForm', [
    'LoginFactory',
    'CoursesFactory',
    'NewsFactory',
    function (LoginFactory, CoursesFactory, NewsFactory) {
            return {
                restrict: 'E',
                templateUrl: 'scripts/directives/news-form.html',
                scope: {
                    code: '='
                },
                link: function (scope, elem, attrs) {

                    scope.codes = [];
                    scope.news = {
                        course: null,
                        subject: null,
                        content: null,
                        priority: null
                    };

                    scope.priorities = [
                        'Info', 'Warning', 'Danger'
                    ];

                    scope.postNews = function () {
                        if (scope.complete()) {
                            NewsFactory.add(scope.news)
                                .then(function (news) {
                                    scope.clearFields();
                                })
                                .catch(function (error) {
                                    console.log(error);
                                });
                        }
                    };

                    scope.clearFields = function () {
                        scope.news = {
                            course: null,
                            subject: null,
                            content: null,
                            priority: null
                        };
                    };

                    scope.complete = function () {
                        return scope.news.course &&
                            scope.news.subject &&
                            scope.news.content &&
                            scope.news.priority;
                    };

                    console.log(scope.code);

                    if (scope.code) {
                        scope.codes = [scope.code];
                        scope.news.course = scope.code;
                        elem.find('#courseSelect').prop('disabled', true);
                    }
                    else {
                        CoursesFactory.loadCodes()
                            .then(function (response) {
                                scope.codes = _.map(response, 'code');
                            }).catch(function (error) {
                                console.log(error);
                            });
                    }
                }
            };
    }]);
