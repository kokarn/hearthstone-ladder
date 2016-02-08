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
    return '/tmp/' + startMoment.year() + '-' + pad( startMoment.month() + 1, 2 ) + '-' + pad( startMoment.date(), 2 ) + '-' + pad( startMoment.hour(), 2 ) + pad( startMoment.minute() - ( startMoment.minute() % 5 ), 2 ) + '/' + channel + '.jpg';
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

app.get( '/check/*', function( request, response ){
    var htmlResponse = '';
    var probablePath = path.join( __dirname + '/www/tmp/', request.params[ 0 ] );

    if( fs.statSync( probablePath ).isDirectory() ){
        var images = fs.readdirSync( probablePath );
        var imageBasePath = probablePath.replace( __dirname + '/www', '' );
        for( let i = 0; i < images.length; i = i + 1 ){
            let channel = images[ i ].replace( '.jpg', '' );
            htmlResponse = htmlResponse + '<a href="http://static-cdn.jtvnw.net/previews-ttv/live_user_' + channel + '-1920x1080.jpg"><img src="' + imageBasePath + '/' + images[ i ] + '"></a>';
        }
    }

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

    var currentSeason = hearthstone.getCurrentSeasonMoment();
    var htmlResponse = '';

    connection.connect();

    connection.query( `
        SELECT
            id,
            channel,
            timestamp
        FROM
            matches
        WHERE
            timestamp BETWEEN '${hearthstone.getSeasonStartDate( currentSeason )}' AND '${hearthstone.getSeasonEndDate( currentSeason )}'
        ORDER BY
            timestamp
        DESC
        LIMIT
            1000`,
        function( error, rows, fields ){
            if( error ) {
                throw error;
            }

            for( let i = 0; i < rows.length - 1; i = i + 1 ){
                htmlResponse = htmlResponse + '<a href="/invalidate?id=' + rows[ i ].id + '"><img src="' + getMatchImagePath( rows[ i ].channel, rows[ i ].timestamp ) + '"></a>';
            }

            response.send( htmlResponse );
        }
    );

    connection.end();
});

app.get( '/invalidate', function( request, response ){
    let removeId = Number( request.query.id );

    if( !Number.isInteger( removeId ) || removeId < 1 ){
        response.end();
        return false;
    }

    var connection = mysql.createConnection({
        host : config.database.host,
        user : config.database.user,
        port: config.database.port,
        password : config.database.password,
        database : config.database.name
    });

    connection.connect();

    connection.query( `
        DELETE
        FROM
            matches
        WHERE
            id = ?
        LIMIT
            1`,
        removeId,
        function( error, rows, fields ){
            if( error ) {
                throw error;
            }
        }
    );
    response.end();
    connection.end();
});

app.listen( 3000, function(){
    console.log( 'Webserver listening on port 3000' );
});
