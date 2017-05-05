# passport-authentiq

[Passport](http://passportjs.org/) strategy for authenticating with [AuthentiqID](https://authentiq.com/)
using the OAuth 2.0 API.

This module lets you authenticate using AuthentiqID in your Node.js applications.
By plugging into Passport, AuthentiqID authentication can be easily and
unobtrusively integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Install

```bash
$ npm install passport-authentiq
```

## Usage

#### Create an Application

Before using `passport-authentiq`, you must register an application with Authentiq.
If you have not already done so, a new application can be created at the 
[Authentiq Dashboard](https://dashboard.authentiq.com/).
Your application will be issued a client ID and client
secret, which need to be provided to the strategy.  You will also need to
configure a callback URL which matches the route in your application.

#### Configure Strategy

The AuthentiqID authentication strategy authenticates users that use the AuthentiqID mobile application by using
OpenID Connect, which is an identity layer on top of the OAuth 2.0 protocol.

The _clientID_ and _clientSecret_ are obtained when creating an application on the [Authentiq Dashboard](https://dashboard.authentiq.com) 
and need to be supplied as parameters when creating the strategy.

The _callbackURL_ is the URL to which Authentiq will redirect the user after granting authorization.

The _scope_ parameter is an array of permission scopes to request.  valid scopes include:
_'aq:name', 'email', 'phone', 'address', 'aq:location', 'aq:push' or none_.

The strategy also requires a `verify` callback, which receives the access token.
The `verify` callback must call `verified` providing a user to complete authentication.



```js
var AuthentiqIDStrategy = require('passport-authentiqid').Strategy;


passport.use(new AuthentiqStrategy({
                         clientID: 'Authentiq Client ID',
                         clientSecret: 'Authentiq Client Secret',
                         callbackURL: 'https://www.example.net/auth/authentiq/callback',
                         scope: ['aq:name', 'email:rs', 'phone:r', 'aq:push']
                     },
                     function (iss, sub, profile, verified) {
                          User.findOrCreate({ authentiqId: profile.id }, function (err, user) {
                             return verified(err, user);
                          });
                     }
              ));
```

#### Callback parameter

In the above example, additional parameters can be declared in the _verified_ callback

Specifically one can use the following, depending on their needs
 
    function (iss, sub, profile, jwtClaims, accessToken, refreshToken, params, verified)
    
    function (iss, sub, profile, accessToken, refreshToken, params, verified)

    function (iss, sub, profile, accessToken, refreshToken, verified)
    
    function(iss, sub, profile, verified)
    
    function(iss, sub, verified)


#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'authentiq'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

```js
app.get('/auth/authentiq',
 passport.authenticate('authentiq'));

app.get('/auth/authentiq/callback',
    passport.authenticate('authentiq', { failureRedirect: '/login' }),
    function(req, res) {
        if (!req.user) {
            throw new Error('user null');
        }
        // Successful authentication, redirect home.
        res.redirect("/");
    }
);
```

## Contributing

#### Tests

The test suite is located in the `test/` directory.  All new features are
expected to have corresponding test cases.  Ensure that the complete test suite
passes by executing:

```bash
$ make test
```

#### Coverage


```bash
$ make test-cov
$ make view-cov
```

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2017 Authentiq

