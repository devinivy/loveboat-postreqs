'use strict';

const Hoek = require('hoek');
const Joi = require('joi');

const internals = {};

module.exports = {
    name: 'loveboat-postreqs',
    root: 'config.ext.onPostHandler',
    match: function (postHandlers, route) {

        const postVal = Hoek.reach(route, 'config.post');
        const postValResult = Joi.validate(postVal, internals.postMatcher);
        return {
            value: postHandlers,
            error: postValResult.error
        };
    },
    handler: function (postHandlers, route, server) {

        return internals.handler(postHandlers, route, server);
    }
};

internals.postMatcher = Joi.array().items(Joi.func(), Joi.object({
    method: Joi.func()
})).single();

internals.handler = function (postHandlers, route, server) {

    const postreqs = route.config.post;

    // Move config.post to config.plugins.loveboat.postreq
    Hoek.merge(route, {
        config: {
            plugins: {
                loveboat: {
                    postreqs: postreqs
                }
            }
        }
    });

    delete route.config.post;

    const before = internals.getAllRegistrations(server);

    // Normalize to request extensions
    const postreqsAsExts = [].concat(postreqs).map((postreq) => {

        const method = (typeof postreq === 'function') ? postreq : postreq.method;
        return { method, options: { before } };
    });

    // Return new route-level postHandlers, with postreqs specified first
    return [postreqsAsExts.concat(postHandlers || [])];
};

internals.getAllRegistrations = function (server) {

    let registrations = [];

    for (let i = 0; i < server.connections.length; ++i) {
        const newRegs = Object.keys(server.connections[i].registrations);
        registrations = registrations.concat(newRegs);
    }

    registrations = Hoek.unique(registrations);

    const currentPlugin = registrations.indexOf(server.realm.plugin);
    if (currentPlugin !== -1) {
        registrations.splice(currentPlugin, 1);
    }

    return registrations;
};
