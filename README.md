# loveboat-postreqs
support hapi route post-requisites

(a transform written for [**loveboat**](https://github.com/devinivy/loveboat))

[![Build Status](https://travis-ci.org/devinivy/loveboat-postreqs.svg?branch=master)](https://travis-ci.org/devinivy/loveboat-postreqs) [![Coverage Status](https://coveralls.io/repos/devinivy/loveboat-postreqs/badge.svg?branch=master&service=github)](https://coveralls.io/github/devinivy/loveboat-postreqs?branch=master)

Lead Maintainer - [Devin Ivy](https://github.com/devinivy)

## Usage

This loveboat transform allows you to add route post-requisites in your hapi route configuration, whereas hapi on its own only supports pre-requisites.

Post-requisites run right after the handler, so they are especially useful for cleanup and for modifying the response.

In the example below, a post-requisite is used to upper-case the response.
```js
// Ever wish this worked?
server.loveboat({
    method: 'get',
    path: '/',
    config: {
        handler: function (request, reply) {
            return reply('loveboat');
        },
        post: [ // Now it does!
            function (request, reply) {
                // Upper-case the response and carry on
                request.response.source = request.response.source.toUpperCase();
                return reply.continue();
            }
        ]
    }
});
```

To use this transform,

1. Make sure the [loveboat](https://github.com/devinivy/loveboat) hapi plugin is registered to your server.
2. Tell loveboat that you'd like to use this transform by calling `server.routeTransforms([require('loveboat-postreqs')])`, possibly listing any other transforms you'd like to use.*
3. Register your routes using `server.loveboat()` rather than `server.route()`.

<sup>* There are other ways to tell loveboat which transforms to use too!  Just check-out the [readme](https://github.com/devinivy/loveboat/blob/master/README.md).

```js
const Hapi = require('hapi');
const Loveboat = require('loveboat');

const server = new Hapi.Server();
server.connection();

// 1. Register loveboat
server.register(Loveboat, (err) => {

    // 2. Tell loveboat to use this transform
    server.routeTransforms([
        require('loveboat-postreqs')
    ]);

    // 3. Configure your routes!
    server.loveboat({
        method: 'get',
        path: '/',
        config: {
            handler: function (request, reply) {
                return reply('loveboat');
            },
            post: [ // This works!
                function (request, reply) {
                    // Upper-case the response and carry on
                    request.response.source = request.response.source.toUpperCase();
                    return reply.continue();
                }
            ]
        }
    });

});
```

### Limitations
The post-requisites are implemented as route-level `onPostHandler` request extensions.  In order to place them as near to the handler as possible, they are specified to run before the request extensions of all plugins that have already been registered and before all other route-level request extensions (unless the `tight` option is `false`).  This leaves two blind spots– request `onPostHandler` extensions that are created,

 1. in the same plugin that your route is registered and also before your route is registered.
 2. in a to-be-registered plugin and also opt to come `before` the extensions of the plugin in which your route is registered.

Basically, the post-requisites are run as near to the handler as possible using request extensions.

## API
### Options
The following options may be specified when the transform is registered,
 - `tight` - when `false`, the post-requisites wont be forced to run before `onPostHandler` extensions specified in other plugins.  Defaults to `true`.

### Route Definition
 - `config.post` - an item or array of items of the format,
   - a function with signature `function(request, reply)`,
     - `request` - the [request object](https://github.com/hapijs/hapi/blob/v16/API.md#request-object).
     - `reply` - the [reply interface](https://github.com/hapijs/hapi/blob/v16/API.md#reply-interface), with identical usage as in a [request extension](https://github.com/hapijs/hapi/blob/v16/API.md#serverextevents).  To continue normal execution of the request lifecycle, `reply.continue()` must be called.
   - an object with,
     - `method` - a function with the signature described above.

   Each item is a post-requisite.  Post-requisites run after the route's handler, serially and in the order specified.
