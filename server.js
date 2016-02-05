'use strict';

var express = require( 'express' );
var app = express();
var mysql = require( 'mysql' );
var fs = require( 'fs' );
var path = require( 'path' );
var moment = require( 'moment' );

var config = require( './config.js' );
var hearthstone = require( './modules/Hearthstone.js' );

app.use( express.static( path.join( __dirname, '/www' ) ) );

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
        AND
            timestamp BETWEEN '${moment().startOf( 'month' ).add( 1, 'days' ).format( 'YYYY-MM-DD 00:00:00' )}' AND '${moment().endOf( 'month' ).add( 1, 'days' ).format( 'YYYY-MM-DD 00:00:00' )}'
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

    var currentSeason = hearthstone.getCurrentSeasonMoment();

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
            WHERE
                timestamp BETWEEN '${hearthstone.getSeasonStartDate( currentSeason )}' AND '${hearthstone.getSeasonEndDate( currentSeason )}'
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
        AND
            timestamp BETWEEN '${hearthstone.getSeasonStartDate( currentSeason )}' AND '${hearthstone.getSeasonEndDate( currentSeason )}'
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
    var rootPath = __dirname + '/www/tmp/';
    var htmlResponse = '<ul>';
    var validFolders = [];

    fs.readdirSync( rootPath ).filter( function( file ){
        if( fs.statSync( path.join( rootPath, file ) ).isDirectory() ){
            validFolders.push( file );
        }
    });

    validFolders.reverse();

    for( var i = 0; i < validFolders.length; i = i + 1 ){
        htmlResponse = htmlResponse + '<li><a href="/check/' + validFolders[ i ] + '">' + validFolders[ i ] + '</a></li>';
    }

    htmlResponse = htmlResponse + '</ul>';

    response.send( htmlResponse );
});

app.get( '/check/*', function( request, response ){
    var htmlResponse = '';
    var probablePath = path.join( __dirname + '/www/tmp/', request.params[ 0 ] );

    if( fs.statSync( probablePath ).isDirectory() ){
        var images = fs.readdirSync( probablePath );
        var imageBasePath = probablePath.replace( __dirname + '/www', '' );
        for( let i = 0; i < images.length; i = i + 1 ){
            htmlResponse = htmlResponse + '<img src="' + imageBasePath + '/' + images[ i ] + '">';
        }
    }

    response.send( htmlResponse );
});

app.listen( 3000, function(){
    console.log( 'Webserver listening on port 3000' );
});
