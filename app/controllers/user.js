'use strict';

const Hoek = require('hoek');
const Joi = require('joi');
Joi.phone = require('joi-phone');

const Utils = require('../utils/sequelize');
const _ = require('lodash');

const internals = {};

// result is a sequelize instance
internals.getUser = function(result) {

    return Promise.resolve(

        result.getTags({attributes: ['name'], joinTableAttributes: []})
        .then(tags => {
            const user = result.get({ plain:true });
            user.tags = _.map(tags, (t => t.get('name', { plain:true })));
            return user;
        })
    );
};

internals.findUser = function(User, username)
{
    Hoek.assert(User, 'Model User required');
    Hoek.assert(username, 'username required');

    return User.findOne({
        where: {
            username: username
        },
        attributes: {
            exclude: ['password', 'updated_at', 'deleted_at', 'created_at']
        }
    });
};

internals.findCourseByCode = function(Course, id) {

    Hoek.assert(Course, 'Model Course required');
    Hoek.assert(id, 'Course code required');

    return Course.findOne({
        where: {
            code: { $eq : id }
        },
        attributes: {
            exclude: ['updated_at', 'deleted_at', 'created_at']
        }
    });
};


internals.schemaUserTagsPOST = function()
{
    const tag = Joi.object().keys({
        name : Joi.string().min(1).max(255).required().description('Tag name')
    }).options({stripUnknown : true});

    return Joi.alternatives().try(tag, Joi.array().items(tag.required()));
};

internals.schemaUserPOST = function(){
    const user = Joi.object().keys({
            username: Joi.string().min(1).max(30).required().description('User personal ID'),
            password: Joi.string().min(1).max(255).required().description('User password'),
            email: Joi.string().email().required().description('User email'),
            firstName: Joi.string().min(1).max(255).description('User first name'),
            lastName: Joi.string().min(1).max(255).description('User last name'),
            phoneNumber: Joi.phone.e164().description('User phone number'),
            role_id: Joi.number().integer().default(1)
        }).options({stripUnknown : true});

    return Joi.alternatives().try(user, Joi.array().items(user.required()));
};

exports.get = {
    description: 'Get one user',
    validate: {
        params: {
            username: Joi.string().min(1).max(255).required().description('User personal ID')
        },
        query: {
            tags: Joi.array().items(Joi.string().required())
        }
    },
    handler: function (request, reply) {

        const User = this.models.User;

        internals.findUser(User, request.params.username)
            .then(result => {
                if (result) {
                    return reply(Utils.removeDates(result));
                } else {
                    return reply.notFound('User not found');
                }
            })
            .catch(err => reply.badImplementation(err));

    }
};

exports.getAll = {
    description: 'Get all users',
    handler: function(request, reply) {

        const User = this.models.User;

        User.findAndCountAll({
                attributes: {
                    exclude: ['password', 'updated_at', 'deleted_at', 'created_at']
                }
            })
            .then(results => reply.paginate(Utils.removeDates(results.rows), results.count))
            .catch(err => reply.badImplementation(err));
    }
};



exports.post = {
    description: 'Add user',
    validate: {
        payload : internals.schemaUserPOST()
    },
    handler: function(request, reply) {

        const User = this.models.User;
        if (Array.isArray(request.payload))
        {
            User.bulkCreate(
                request.payload,
                {validate : true}
            )
            .then(results => (reply({count : results.length}).code(201)))
            .catch((error) => {
                return reply.conflict(error);
            });
        }
        else
        {
            User.create(request.payload)
            .then(result => reply(Utils.removeDates(result)).code(201))
            .catch((error) => {
                return reply.conflict(error);
            });
        }
    }
};

exports.addTags = {
    description: 'Link tags to a user',
    validate: {
        params: {
            username: Joi.string().min(1).max(255).required().description('User personal ID')
        },
        payload: {
            tags: Joi.array().items(Joi.string().required())
        }
    },
    handler : function(request, reply) {
        const Tag  = this.models.Tag;
        const User = this.models.User;


        const id = request.params.username;

        Tag.findAll({where: { name: { $in: request.payload.tags } }})
        .then(tags => {
            internals.findUser(User, id)
            .then(user => {
                if (user)
                {
                    user.addTags(tags).then(() => {
                       internals.getUser(user).then(result => {
                           return reply(result);
                       });
                    });
                }
                else
                {
                    return reply.notFound('The user ' + id + ' does not exists.');
                }
            });
        })
        .catch(err => reply.badImplementation(err));
    }
};

exports.delete = {
    description: 'Delete user',
    validate: {
        params: {
            username: Joi.string().min(1).max(30).required().description('User personal ID')
        }
    },
    handler: function (request, reply) {

        const User = this.models.User;

        User.destroy({
            where : {
                username : { $eq: request.params.username }
            }
        })
        .then(count => reply({count : count}))
        .catch(err => reply.badImplementation(err));
    }
};

const updateHandler = function(request, reply) {

    const User = this.models.User;

    User.update(
        request.payload,
        {
            where: {
                username: request.params.username
            }
        }
    )
    .then(result => reply({count : result[0] || 0}))
    .catch(error => reply.badImplementation(error));
};

exports.put = {
    description: 'Update all info about user (except username)',
    validate: {
        params: {
            username: Joi.string().min(1).max(30).required().description('User personal ID'),
        },
        payload: {
            password: Joi.string().min(1).max(255).required().description('User password'),
            email: Joi.string().min(1).max(255).required().description('User email'),
            firstName: Joi.string().min(1).max(255).required().description('User first name'),
            lastName: Joi.string().min(1).max(255).required().description('User last name'),
            phoneNumber: Joi.string().min(1).max(255).required().description('User phone number')
        }
    },
    handler: updateHandler
};

exports.patch = {
    description: 'Update some info about user (except username)',
    validate: {
        params: {
            username: Joi.string().min(1).max(30).required().description('User personal ID'),
        },
        payload: {
            password: Joi.string().min(1).max(255).description('User password'),
            email: Joi.string().min(1).max(255).description('User email'),
            firstName: Joi.string().min(1).max(255).description('User first name'),
            lastName: Joi.string().min(1).max(255).description('User last name'),
            phoneNumber: Joi.string().min(1).max(255).description('User phone number')
        }
    },
    handler: updateHandler
};

exports.getTags = {
    description: 'Get the user\'s tag',
    validate: {
        params: {
            username: Joi.string().min(1).max(30).required().description('User personal ID')
        }
    },
    handler: function(request, reply) {

        const User = this.models.User;

            internals.findUser(User, request.params.username)
            .then(user => {
                if (user) {
                    user.getTags()
                    .then(tags => reply(tags))
                    .catch(error => reply.badImplementation(error));
                } else {
                    return reply.notFound('User ' + request.params.username + ' not found');
                }
            })
            .catch(err => reply.badImplementation(err));
    }
};

exports.getCourses = {

    description: 'Get the courses (subscribed)',
    validate: {
        params: {
            username: Joi.string().min(1).max(30).required().description('User personal ID')
        }
    },
    handler: function(request, reply) {

        const User = this.models.User;

        internals.findUser(User, request.params.username)
        .then(user => {
            if (user)
            {
                user.getCourses()
                .then(courses => reply(courses))
                .catch(error => reply.badImplementation(error));
            }
            else
            {
                return reply.notFound('User ' + request.params.username + ' not found');
            }
        })
        .catch(error => reply.badImplementation(error));
    }
};

exports.subscribeToCourse = {
    description: 'Subscribe to a course',
    validate: {
        params: {
            username: Joi.string().min(1).max(30).required().description('User personal ID'),
            crsId: Joi.string().required().description('Course id')
        }
    },
    handler: function(request, reply) {
        
        const Course = this.models.Course;
        const User   = this.models.User;
        
        internals.findUser(User, request.params.username)
        .then(user => {
            if (user)
            {
                user.getCourses({where : {code : request.params.crsId}})
                .then(courses => {
                    if (courses.length > 0)
                    {
                        reply.conflict('Course ' + request.params.crsId + ' already subscribed');
                    }
                    else
                    {
                        Course.findOne({where : {code : request.params.crsId}})
                        .then(course => {
                            if (course)
                            {
                                user.addCourse(course);
                                return reply(Utils.removeDates(user));
                            }
                            else
                            {
                                return reply.notFound('Course ' + request.params.crsId + ' not found');
                            }
                        })
                        .catch(error => reply.badImplementation(error));
                    }
                })
                .catch(error => reply.badImplementation(error));
            }
            else
            {
                return reply.notFound('User ' + request.params.username + ' not found');
            }
        })
        .catch(error => reply.badImplementation(error));
    }
};

exports.unsubscribeToCourse = {
    description: 'Unsubscribe to a course',
    validate: {
        params: {
            username: Joi.string().min(1).max(30).required().description('User personal ID'),
            crsId: Joi.string().required().description('Course id')
        }
    },
    handler: function(request, reply) {
        
        const Course = this.models.Course;
        const User   = this.models.User;
        
        internals.findUser(User, request.params.username)
        .then(user => {
            if (user)
            {
                internals.findCourseByCode(Course, request.params.crsId)
                .then(course => {
                    if (course)
                    {
                        user.removeCourse(course);
                        return reply();
                    }
                    else
                    {
                        return reply.notFound('Course ' + request.params.crsId + ' not found');
                    }
                })
                .catch(error => reply.badImplementation(error));
            }
            else
            {
                return reply.notFound('User ' + request.params.username + ' not found');
            }
        })
        .catch(error => reply.badImplementation(error));
    }
};

exports.addFolder = {
    description: 'Add a folder',
    validate: {
        params: {
            username: Joi.string().min(1).max(30).required().description('User personal ID'),
            folder: Joi.string().min(1).max(255).required().description('New folder name')
        }
    },
    handler: function(request, reply) {
        reply('Not implemented');
    }
};

exports.addCourseToFolder = {
    description: 'Add a course to the folder (removes from the old folder)',
    validate: {
        params: {
            username: Joi.string().min(1).max(30).required().description('User personal ID'),
            folder: Joi.string().min(1).max(255).required().description('New folder name'),
            course: Joi.number().integer().required().description('Course id')
        }
    },
    handler: function(request, reply) {
        reply('Not implemented');
    }
};

