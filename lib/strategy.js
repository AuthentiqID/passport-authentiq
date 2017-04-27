// Load modules.
var OAuth2Strategy = require('passport-oauth2')
    , util = require('util')
    , Profile = require('./profile')
    , InternalOAuthError = require('passport-oauth2').InternalOAuthError
    , APIError = require('./errors/apierror')
    , request = require('request')
    , xtend = require('xtend')
    , jwt = require('jsonwebtoken');


/**
 * `Strategy` constructor.
 *
 * The Authentiq authentication strategy authenticates requests by delegating to
 * Authentiq using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `cb`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your Authentiq application's Client ID
 *   - `clientSecret`  your Authentiq application's Client Secret
 *   - `callbackURL`   URL to which Authentiq will redirect the user after granting authorization
 *   - `scope`         array of permission scopes to request.  valid scopes include:
 *                     'aq:name', 'email', 'phone', 'address', 'aq:location', "aq:push" or none.
 *
 * Examples:
 *
 *     passport.use(new AuthentiqStrategy({
 *         clientID: 'Authentiq Client ID',
 *         clientSecret: 'Authentiq Client Secret'
 *         callbackURL: 'https://www.example.net/auth/authentiq/callback',
 *       },
 *       function(accessToken, refreshToken, profile, cb) {
 *         User.findOrCreate(..., function (err, user) {
 *           cb(err, user);
 *         });
 *       }
 *     ));
 *
 * @constructor
 * @param {object} options
 * @param {function} verify
 * @access public
 */
function Strategy(options, verify) {
    this.options = xtend({}, options, {
        authorizationURL: options.authorizationURL || 'https://connect.authentiq.io/authorize',
        tokenURL: options.tokenURL || 'https://connect.authentiq.io/token',
        userProfileURL: options.userProfileURL || 'https://connect.authentiq.io/userinfo',
        scopeSeparator: ' ',
        scope: options.scope.indexOf('openid') === -1 ? options.scope += " openid" : options.scope     // append openID if needed
    });

    OAuth2Strategy.call(this, this.options, verify);

    this.name = 'authentiq';

    // this._oauth2.useAuthorizationHeaderforGET(true);

    var self = this;

    var _oauth2_getOAuthAccessToken = this._oauth2.getOAuthAccessToken;
    this._oauth2.getOAuthAccessToken = function (code, params, callback) {
        _oauth2_getOAuthAccessToken.call(self._oauth2, code, params, function (err, accessToken, refreshToken, params) {
            if (err) {
                return callback(err);
            }
            if (!accessToken) {
                return callback({
                    statusCode: 400,
                    data: JSON.stringify(params)
                });
            }

            // We're probably are already clear to continue with the ID token by parsing it but
            //
            // Call the callback with ID token and Access token so that we can call the /userinfo in case something goes wrong

            var tokens = {};
            tokens.accessToken = accessToken;

            if (params.id_token) {
                tokens.idToken = params.id_token;
                callback(null, tokens, refreshToken, params);
            } else {
                callback(null, accessToken, refreshToken, params);
            }
        });
    }
}

util.inherits(Strategy, OAuth2Strategy);

/**
 * Retrieve user profile from Authentiq ID.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `authentiq`
 *   - `id`               the user's Authentiq ID
 *   - `displayName`      the user's full name
 *   - `email`            the user's shared email
 *   - `phone`            the user's shared phone
 *   - `address`          the user's shared Address
 *   - `raw`              the users raw data
 *
 * @param {string} accessToken
 * @param {function} done
 * @access protected
 */

Strategy.prototype.userProfile = function (accessToken, done) {
    if (accessToken.idToken) {
        var profile = jwt.verify(accessToken.idToken, this.options.clientSecret);
        done(null, profile);
    } else {
        this._oauth2.get(this.options.userProfileURL, accessToken.accessToken, function (err, body, res) {
            var json;

            if (err) {
                if (err.data) {
                    try {
                        json = JSON.parse(err.data);
                    } catch (_) {
                    }
                }

                if (json && json.message) {
                    return done(new APIError(json.message));
                }
                return done(new InternalOAuthError('Failed to fetch user profile', err));
            }

            try {
                json = JSON.parse(body);
            } catch (ex) {
                return done(new Error('Failed to parse user profile'));
            }

            var profile = Profile.parse(json);
            profile.provider = 'authentiq';
            profile._raw = body;
            profile._json = json;
            // return the profile here and let the developer decide what to do with it

            done(null, getProfile(body));
        });
    }
};


function verifyIDToken(idToken) {
    return jwt.verify(idToken, this.options.client_secret);
}

/**
 * Return extra parameters to be included in the authorization request.
 *
 * Some OAuth 2.0 providers allow additional, non-standard parameters to be
 * included when requesting authorization.  Since these parameters are not
 * standardized by the OAuth 2.0 specification, OAuth 2.0-based authentication
 * strategies can overrride this function in order to populate these parameters
 * as required by the provider.
 *
 * @param {Object} options
 * @return {Object}
 * @api protected
 */
Strategy.prototype.authorizationParams = function (options) {
    return {}
};


/**
 * Return extra parameters to be included in the token request.
 *
 * Some OAuth 2.0 providers allow additional, non-standard parameters to be
 * included when requesting an access token.  Since these parameters are not
 * standardized by the OAuth 2.0 specification, OAuth 2.0-based authentication
 * strategies can overrride this function in order to populate these parameters
 * as required by the provider.
 *
 * @return {Object}
 * @api protected
 */

OAuth2Strategy.prototype.tokenParams = function (options) {
    return {};
};


/**
 * Parse error response from OAuth 2.0 endpoint.
 *
 * OAuth 2.0-based authentication strategies can overrride this function in
 * order to parse error responses received from the token endpoint, allowing the
 * most informative message to be displayed.
 *
 * If this function is not overridden, the body will be parsed in accordance
 * with RFC 6749, section 5.2.
 *
 * @param {String} body
 * @param {Number} status
 * @return {Error}
 * @api protected
 */
OAuth2Strategy.prototype.parseErrorResponse = function (body, status) {
    var json = JSON.parse(body);
    if (json.error) {
        return new TokenError(json.error_description, json.error, json.error_uri);
    }
    return null;
};

/**
 * Expose `Strategy` directly from package.
 */

exports = module.exports = Strategy;

/**
 * Export constructors.
 */
exports.Strategy = Strategy;