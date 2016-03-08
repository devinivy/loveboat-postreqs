'use strict';

// Load modules

const Lab = require('lab');
const Code = require('code');
const Hapi = require('hapi');
const Loveboat = require('loveboat');
const LoveboatPostreqs = require('..');

// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const internals = {};

describe('loveboat-postreqs', () => {


    it('should register an array of postrequisites.', (done) => {

        const server = new Hapi.Server();
        server.connection();

        server.register(Loveboat, (err) => {

            expect(err).to.not.exist();

            server.routeTransforms(LoveboatPostreqs);

            server.loveboat({
                method: 'get',
                path: '/',
                config: {
                    handler: (request, reply) => reply('1'),
                    post: [
                        (request, reply) => {

                            request.response.source += '2';
                            return reply.continue();
                        },
                        (request, reply) => {

                            request.response.source += '3';
                            return reply.continue();
                        }
                    ]
                }
            });

            server.inject('/', (res) => {

                expect(res.result).to.equal('123');
                done();
            });
        });

    });

    it('should register a single postrequisite.', (done) => {

        const server = new Hapi.Server();
        server.connection();

        server.register(Loveboat, (err) => {

            expect(err).to.not.exist();

            server.routeTransforms(LoveboatPostreqs);

            server.loveboat({
                method: 'get',
                path: '/',
                config: {
                    handler: (request, reply) => reply('1'),
                    post: (request, reply) => {

                        request.response.source += '2';
                        return reply.continue();
                    }
                }
            });

            server.inject('/', (res) => {

                expect(res.result).to.equal('12');
                done();
            });
        });

    });

    it('should register a postrequisite as an object.', (done) => {

        const server = new Hapi.Server();
        server.connection();

        server.register(Loveboat, (err) => {

            expect(err).to.not.exist();

            server.routeTransforms(LoveboatPostreqs);

            server.loveboat({
                method: 'get',
                path: '/',
                config: {
                    handler: (request, reply) => reply('1'),
                    post: {
                        method: (request, reply) => {

                            request.response.source += '2';
                            return reply.continue();
                        }
                    }
                }
            });

            server.inject('/', (res) => {

                expect(res.result).to.equal('12');
                done();
            });
        });

    });

    it('should register a postrequisite before route-configured onPostHandlers and onPostHandlers in other plugins.', (done) => {

        const server = new Hapi.Server();
        server.connection();

        const plugin = function (srv, options, next) {

            // Just making sure that registration within a plugin
            // doesn't fail due to circular before-onPostHandler deps
            srv.loveboat({
                method: 'get',
                path: '/ensure-no-conflict',
                config: {
                    handler: (request, reply) => reply(null),
                    post: (request, reply) => reply.continue()
                }
            });

            srv.ext('onPostHandler', (request, reply) => {

                request.response.source += '3';
                return reply.continue();
            });

            next();
        };

        plugin.attributes = { name: 'plugin' };

        server.register([
            {
                register: Loveboat,
                options: { transforms: LoveboatPostreqs }
            },
            plugin
        ], (err) => {

            expect(err).to.not.exist();

            server.loveboat({
                method: 'get',
                path: '/',
                config: {
                    handler: (request, reply) => reply('1'),
                    post: (request, reply) => {

                        request.response.source += '2';
                        return reply.continue();
                    },
                    ext: {
                        onPostHandler: {
                            method: (request, reply) => {

                                request.response.source += '4';
                                return reply.continue();
                            }
                        }
                    }
                }
            });

            server.inject('/', (res) => {

                expect(res.result).to.equal('1234');
                done();
            });
        });

    });

    it('should move config.post to config.plugins.loveboat.postreqs.', (done) => {

        const server = new Hapi.Server();
        server.connection();

        server.register(Loveboat, (err) => {

            expect(err).to.not.exist();

            server.routeTransforms(LoveboatPostreqs);

            const postreq = (request, reply) => {

                request.response.source += '2';
                return reply.continue();
            };

            server.loveboat({
                method: 'get',
                path: '/',
                config: {
                    handler: (request, reply) => reply('1'),
                    post: postreq
                }
            });

            const route = server.match('get', '/');
            expect(route.settings.plugins.loveboat.postreqs).to.equal(postreq);

            done();
        });

    });

    it('ignore routes with bad config.post.', (done) => {

        const server = new Hapi.Server();
        server.connection();

        server.register(Loveboat, (err) => {

            expect(err).to.not.exist();

            server.routeTransforms(LoveboatPostreqs);

            expect(() => {

                server.loveboat({
                    method: 'get',
                    path: '/',
                    config: {
                        handler: (request, reply) => reply('1'),
                        post: ['bad']
                    }
                });
            }).to.throw(/^Invalid routeConfig options/);

            done();
        });

    });

});
