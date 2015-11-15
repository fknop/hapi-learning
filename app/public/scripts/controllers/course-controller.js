angular.module('hapi-learning')
    .controller('CourseCtrl', ['$scope', '$stateParams', 'CoursesFactory', 'TagsFactory',
                function ($scope, $stateParams, CoursesFactory, TagsFactory) {

            $scope.course = {};
            $scope.subscribed = function () {
                // did the user already subscribe to the course?
                return false;
            };
                    
            CoursesFactory.loadSpecific($stateParams.code)
            .then(function (course) {
                if (course)
                {
                    $scope.course.name = course.name;
                    $scope.course.description = course.description;
                    $scope.course.code = course.code;
                    $scope.course.teachers = course.teachers;
                    $scope.course.tags = course.tags;
                }
                else
                {
                    console.log('Course not found');
                }
            })
            .catch(function (error) {console.log(error);});
    }]);