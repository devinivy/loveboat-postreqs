'use strict';

const Hoek = require('hoek');
const Joi = require('joi');

const internals = {};

module.exports = {
    name: 'loveboat-postreqs',
    root: 'config.ext.onPostHandler',
    handler: internals.handler,
    match: function (postHandlers, route) {

        const rootVal = Hoek.reach(route, this.root);
        return Joi.validate(rootVal, internals.matcher);
    }
};

internals.matcher = Joi.array().items(Joi.func());

internals.handler = function (postHandlers, route) {

    const postreqs = route.config.post;

    Hoek.merge(route, {
        config: {
            plugins: {
                loveboat: {
                    postreq: postreqs
                }
            }
        }
    });

    delete route.config.post;

    const newPostHandlers = [].concat(postHandlers);

    return newPostHandlers;
};
