'use strict';

angular.module('hapi-learning')
    .directive('courseList', [
    'CoursesFactory', 'TagsFactory', function (CoursesFactory, TagsFactory) {
        return {
            restrict: 'E',
            scope: {
                subscribed: '=',
                filters: '='
            },
            templateUrl: 'scripts/directives/course-list.html',
            link: function(scope, elem, attrs) {
                scope.courses = [];
                scope.tags = [];
                scope.selectedTags = [];
                scope.courseFilter = {
                    name : '',
                    code : '' 
                };

                scope.selected = function(tag) {
                    console.log(tag.name + ' selected');

                    if (scope.selectedTags.indexOf(tag) > -1) {
                        _.remove(scope.selectedTags, {name: tag.name});
                    } else {
                        scope.selectedTags.push(tag);
                    }
                };

                scope.filterByTags = function (course) {
                    var select = true;

                    scope.selectedTags.forEach(function (tag) {
                        select = select && (course.tags.indexOf(tag.name) > -1);
                    });

                    return select;
                };
                
                scope.search = function(course) {
                   var scope.course = angular.lowercase(scope.course) || '';
            
                   return (angular.lowercase(course.name).indexOf(scope.course) !== -1 ||
                       angular.lowercase(course.code).indexOf(scope.course) !== -1);  
                };

                /**
                    Listener on 'subscribe' scope value :
                    it loads all or part of courses.
                **/
                scope.$watch('subscribed', function(value) {

                    if (value === true)
                    {
                        CoursesFactory.getSubscribed()
                            .then(function(courses) {
                            if (courses)
                            {
                                scope.courses = courses;
                            }
                        })
                        .catch(function(error) {console.log(error);});
                    }
                    else if (value === false)
                    {
                        if (scope.filters) {
                            TagsFactory.load().then(function(tags) {
                                scope.tags = tags;
                            });
                        }

                        CoursesFactory.load()
                            .then(function(courses) {
                            if (courses)
                            {
                                scope.courses = courses;
                            }
                        })
                        .catch(function(error) {console.log(error);});
                    }
                });
            }
        };
    }]);
