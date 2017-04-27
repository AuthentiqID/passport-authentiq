/**
 * Parse profile.
 *
 * @param {object|string} json
 * @return {object}
 * @access public
 */
exports.parse = function (json) {
    if ('string' === typeof json) {
        json = JSON.parse(json);
    }

    var profile = {};
    profile.id = String(json.sub);

    if (json.name) {
        profile.name = json.name;
    }

    if (json.address) {
        profile.address = json.address.formatted;
    }

    if (json.email) {
        profile.email = json.email;
    }

    if (json.phone_number) {
        profile.phone = json.phone_number
    }

    return profile;
};