'use strict';

angular.module('hapi-learning')
    .factory('CoursesFactory', ['Restangular',
                                'LoginFactory',
                                '$q',
            function (Restangular, LoginFactory, $q) {

        var internals = {};
        internals.courses = [];
        internals.subscribedCourses = [];

        var exports = {};
        exports.add = function (value) {
            internals.courses.push(value);
        };

        /**
            Courses fetching, return asynchronous promise fill with them.
            Results are going to be saved in factory to avoid server fetching
            for every request.
        **/
        exports.load = function (limit, page) {
            return $q(function (resolve, reject) {
                if (internals.courses.length === 0)
                {
                    Restangular.all('courses')
                    .customGET('', { limit: limit, page: page })
                    .then(function (object) {
                        internals.courses = object.results;
                        resolve(object.results);
                    })
                    .catch(function (err) {
                        reject(err)
                    });
                }
                else
                {
                    resolve(internals.courses);
                }
            });
        };

        /**
            Load a specific course
        **/
        exports.loadSpecific = function (code) {

            return $q(function (resolve, reject) {
                Restangular.one('courses', code)
                    .get()
                    .then(function (object) {
                        resolve(object);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            });
        };

        /**
            Try to subscribe a course to a user (/users/{id}/subscribe/{courseId}).
            It should return the subscribed course if success. This will be added
            to local subscribed courses.

            /!\ WIP : Does not return course atm, so subscribed course is clear.
        **/
        exports.subscribe = function (code) {
            return $q(function (resolve, reject) {
                LoginFactory.getProfile().then(function(profile) {
                    Restangular.one('users', profile.username)
                        .customPOST({}, 'subscribe/' + code)
                        .then(function (object) {
                            _.fill(internals.subscribedCourses, object); // object doit être le cours
                            //internals.subscribedCourses = [];
                            resolve(object);
                        })
                        .catch(function (err) {
                            reject(err);
                        });
                }).catch(function(error) {});

            });
        };

        /**
            Try to unsubscribe a course to a user (/users/{id}/unsubscribe/{courseId}).
            It should return the subscribed course if success. This will be removed
            from local subscribed courses.
        **/
        exports.unsubscribe = function (code) {
            return $q(function (resolve, reject) {
                LoginFactory.getProfile().then(function(profile) {
                    Restangular.one('users', profile.username)
                    .customPOST({}, 'unsubscribe/' + code)
                    .then(function (object) {
                        _.remove(internals.subscribedCourses, function(course) {
                            return course.code === code;
                        });
                        resolve(object);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
                });
            });
        };

        /**
            Load every courses subscribed by current user (GET /users/{id}/courses).
            If they are already loaded, (internals.subscribedCourse) it will not.
        **/
        exports.getSubscribed = function () {
            return $q(function(resolve, reject) {
                if (internals.subscribedCourses.length === 0) {
                    LoginFactory.getProfile().then(function(profile) {

                        Restangular.one('users', profile.username)
                            .getList('courses')
                            .then(function(object) {
                                internals.subscribedCourses = object;
                                resolve(internals.subscribedCourses);
                            })
                            .catch(function(error) {
                                reject(error);
                            });
                    }).catch(function(error) {});

                } else {
                    resolve(internals.subscribedCourses);
                }
            });
        };

        exports.get = function (index) {
            if (index) {
                return internals.courses[index];
            } else {
                return internals.courses;
            }
        };

        exports.clear = function () {
            internals.courses = [];
        };


        return exports;
}]);
