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

function pad( n, width, z ) {
    z = z || '0';
    n = String( n );
    return n.length >= width ? n : new Array( width - n.length + 1 ).join( z ) + n;
}

function getMatchImagePath( channel, timestamp ){
    let startMoment = moment( timestamp );
    return 'tmp/' + startMoment.year() + '-' + pad( startMoment.month() + 1, 2 ) + '-' + pad( startMoment.date(), 2 ) + '-' + pad( startMoment.hour(), 2 ) + pad( startMoment.minute() - ( startMoment.minute() % 5 ), 2 ) + '/' + channel + '.jpg';
}

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
            t3.total_matches > 1
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

app.get( '/cleanup', function( request, response ){
    var connection = mysql.createConnection({
        host : config.database.host,
        user : config.database.user,
        port: config.database.port,
        password : config.database.password,
        database : config.database.name
    });

    var htmlResponse = '';

    connection.connect();

    connection.query( `
        SELECT
            channel,
            timestamp
        FROM
            matches
        ORDER BY
            channel,
            timestamp`,
        function( error, rows, fields ){
            if( error ) {
                throw error;
            }

            let currentChannel = false;
            let lastTimestamp = false;
            let timediffValidity = 3600000;
            for( let i = 0; i < rows.length - 1; i = i + 1 ){

                if( rows[ i + 1 ].channel === rows[ i ].channel ){
                    // If the next channel is the same as this check the diff timestamp
                    if( moment( rows[ i + 1 ].timestamp ).diff( moment( rows[ i ].timestamp ) ) > timediffValidity ){
                        // The timestamp is more than timediffValidity offset from the previous timestamp so probably a one-off match
                        console.log( 'Clear up', rows[ i ].timestamp, ' its more than 1 hour from ', rows[ i + 1 ].timestamp );
                        htmlResponse = htmlResponse + '<img src="' + getMatchImagePath( rows[ i ].channel, rows[ i ].timestamp ) + '">';
                    }
                } else if( rows[ i - 1 ].channel === rows[ i ].channel ){
                    // If the next channel isn't the same, check if the previous one is
                    if( moment( rows[ i ].timestamp ).diff( moment( rows[ i - 1 ].timestamp ) ) > timediffValidity ){
                        // Check if that timestamp is more than one newer than the latest one.
                        console.log( 'Clear up', rows[ i ].timestamp, ' its more than 1 hour from', rows[ i - 1 ].timestamp );
                        htmlResponse = htmlResponse + '<img src="' + getMatchImagePath( rows[ i ].channel, rows[ i ].timestamp ) + '">';
                    }
                } else {
                    // Neither the next nor the previous channel match is the same
                    if( moment( rows[ i ].timestamp ).diff( moment() ) > timediffValidity ){
                        // If the next channel isn't the same as this, this is the last timestamp for that channel.
                        // Check if that timestamp is more than one newer than the next last one.
                        console.log( 'Clear up', rows[ i ].timestamp, ' its more than 1 hour old' );
                        htmlResponse = htmlResponse + '<img src="' + getMatchImagePath( rows[ i ].channel, rows[ i ].timestamp ) + '">';
                    }
                }
            }

            response.send( htmlResponse );
        }
    );
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
