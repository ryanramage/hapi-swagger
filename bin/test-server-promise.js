'use strict';
const BearerToken = require('hapi-auth-bearer-token');
const Blipp = require('blipp');
const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');

const HapiSwagger = require('../');
const Pack = require('../package');
const Routes = require('./routes');


/**
 * validation function for bearer strategy
 *
 * @param  {Object} token
 * @param  {Function} callback
 */
const validateBearer = function (token, callback) {

    if (token === '12345') {
        callback(null, true, {
            token: token,
            user: {
                username: 'glennjones',
                name: 'Glenn Jones',
                groups: ['admin', 'user']
            }
        });
    } else {
        // for bad token keep err as null
        callback(null, false, {});
    }
};


const goodOptions = {
    reporters: [{
        reporter: require('good-console'),
        events: { log: '*', response: '*' }
    }]
};


const swaggerOptions = {
    basePath: '/v1/',
    pathPrefixSize: 2,
    info: {
        'title': 'Test API Documentation',
        'description': 'This is a sample example of API documentation.',
        'version': Pack.version,
        'termsOfService': 'https://github.com/glennjones/hapi-swagger/',
        'contact': {
            'email': 'glennjonesnet@gmail.com'
        },
        'license': {
            'name': 'MIT',
            'url': 'https://raw.githubusercontent.com/glennjones/hapi-swagger/master/license.txt'
        }
    },
    tags: [{
        'name': 'sum',
        'description': 'working with maths',
        'externalDocs': {
            'description': 'Find out more',
            'url': 'http://example.org'
        }
    }, {
        'name': 'store',
        'description': 'storing data',
        'externalDocs': {
            'description': 'Find out more',
            'url': 'http://example.org'
        }
    }],
    jsonEditor: true,
    securityDefinitions: {
        'Bearer': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header'
        }
    },
    security: [{ 'Bearer': [] }],
    derefJSONSchema: false
};



let server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 3000
});



const registerBearer = function () {

    return new Promise((resolve, reject) => {

        server.register([
            BearerToken
        ], (err) => {

            server.auth.strategy('bearer', 'bearer-access-token', {
                'accessTokenName': 'access_token',
                'validateFunc': validateBearer
            });

            (err)
                ? reject('Failed to configure bearer token plugin: ${err}')
                : resolve('Bearer token plugin setup');
        }
        );

    });
};


const registerPlugins = function () {

    return new Promise((resolve, reject) =>
        server.register([
            Inert,
            Vision,
            Blipp,
            {
                register: require('good'),
                options: goodOptions
            },
            {
                register: HapiSwagger,
                options: swaggerOptions
            }
        ], (err) => {
            (err)
                ? reject('Failed to configure main plugin group: ${err}')
                : resolve('Main plugin group setup');
        }
        ));

};


const registerViews = function () {

    return new Promise((resolve, reject) => {

        server.views({
            path: 'bin',
            engines: { html: require('handlebars') },
            isCached: false
        });
        resolve('Templates views setup');
    });
};


const startServer = function () {

    return new Promise((resolve, reject) => {

        server.route(Routes);
        server.start((err) => {
            (err)
                ? reject('Failed to start server: ${err}')
                : resolve('Started server');
        });
    });
};


// start server using promises
registerBearer()
    .then( (msg) => {
        console.log(msg);
        return registerPlugins(server);
    })
    .then( (msg) => {
        console.log(msg);
        return startServer(server);
    })
    .then( (msg) => {
        console.log(msg);
        console.log('Server running at:', server.info.uri);
        return registerViews(server);
    })
    .then( (msg) => {
        console.log(msg);
    })
    .catch( (err) => {
        console.log(err);
    });

