var fs = require( 'fs' );
var configPath = __dirname + '/config.json';
var parsed = JSON.parse( fs.readFileSync( configPath, 'UTF-8' ) );

module.exports = parsed;
