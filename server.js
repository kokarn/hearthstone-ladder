'use strict';

var express = require( 'express' );
var app = express();
var mysql = require( 'mysql' );
var fs = require( 'fs' );
var path = require( 'path' );

app.use( express.static( 'www' ) );
var config = require( './config.js' );


app.get( '/data/*', function( request, response ){
    var connection = mysql.createConnection({
        host : config.database.host,
        user : config.database.user,
        port: config.database.port,
        password : config.database.password,
        database : config.database.name
    });

    connection.connect();

    connection.query( `SELECT
        id,
        rank,
        matches.channel,
        timestamp,
        status,
        name
        FROM
            matches
        LEFT JOIN
            players
        ON
            matches.channel = players.channel
        WHERE
            matches.channel = ?
        ORDER BY
            matches.timestamp`, request.params[ 0 ], function( error, rows, fields ){
        if( error ) {
            throw error;
        }

        response.send( rows );
    });

    connection.end();
});

app.get( '/data', function( request, response ){
    var connection = mysql.createConnection({
        host : config.database.host,
        user : config.database.user,
        port: config.database.port,
        password : config.database.password,
        database : config.database.name
    });

    connection.connect();

    connection.query( `SELECT
        id,
        rank,
        matches.channel,
        timestamp,
        status,
        name,
        t3.total_matches
        FROM
            matches
        LEFT JOIN
            players
        ON
            matches.channel = players.channel
        INNER JOIN (
            SELECT
                COUNT( * ) as total_matches,
                channel
            FROM
                matches
            GROUP BY
                channel
        ) AS t3
        ON
            matches.channel = t3.channel
        INNER JOIN (
            SELECT
                max( timestamp ) AS max_timestamp,
                channel
            FROM
                matches
            GROUP BY
                channel
        ) t2
        ON
            matches.channel = t2.channel
        AND
            matches.timestamp = t2.max_timestamp
        AND
            players.should_index = 1
        ORDER BY
            matches.timestamp
        DESC`, function( error, rows, fields ){
        if( error ) {
            throw error;
        }

        response.send( rows );
    });

    connection.end();
});

app.get( '/check', function( request, response ){
    var rootPath = 'www/tmp/';
    var htmlResponse = '<ul>';

    fs.readdirSync( rootPath ).filter( function( file ){
        if( fs.statSync( path.join( rootPath, file ) ).isDirectory() ){
            htmlResponse = htmlResponse + '<li><a href="/check/' + file + '">' + file + '</a></li>';
        }
    });

    htmlResponse = htmlResponse + '</ul>';

    response.send( htmlResponse );
});

app.get( '/check/*', function( request, response ){
    var htmlResponse = '';
    var probablePath = path.join( 'www/tmp/', request.params[ 0 ] );

    if( fs.statSync( probablePath ).isDirectory() ){
        var images = fs.readdirSync( probablePath );
        var imageBasePath = probablePath.replace( 'www', '' );
        for( let i = 0; i < images.length; i = i + 1 ){
            htmlResponse = htmlResponse + '<img src="' + imageBasePath + '/' + images[ i ] + '">';
        }
    }

    response.send( htmlResponse );
});

app.listen( 3000, function(){
    console.log( 'Webserver listening on port 3000' );
});
