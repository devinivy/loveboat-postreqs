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

    it('', (done) => {

        const server = new Hapi.Server();
        server.connection();

        server.register(Loveboat, (err) => {

            expect(err).to.not.exist();

            server.routeTransforms(LoveboatPostreqs);

            server.loveboat({});

            done();
        });

    });

});
