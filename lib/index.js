// Load modules
var Strategy = require('./strategy');

// Framework version
require('pkginfo')(module, 'version');

// Expose Strategy
exports = module.exports = Strategy;

// Expose Contstructors
exports.Strategy = Strategy;
