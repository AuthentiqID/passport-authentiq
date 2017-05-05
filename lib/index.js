// Load modules.
var Strategy = require('./strategy');


// Framework version.

// Expose Strategy.
exports = module.exports = Strategy;

require('pkginfo')(module, 'version');

// Expose Contstructors.
exports.Strategy = Strategy;