'use strict';

let chalk = require( 'chalk' );
let mkdirp = require( 'mkdirp' );
let mysql = require( 'mysql' );

let CharacterFinder = require( './modules/CharacterFinder.js' );
let twitch = require( './modules/Twitch.js' );
let imageBaseUrl = 'http://static-cdn.jtvnw.net/previews-ttv/live_user_{channel}-{width}x{height}.jpg';
let detectionsStarted = 0;
let detectionsDone = 0;
let detectionsRunningLimit = 25;
let twitchData;
let streamsPerBatch = 25;
let currentBatch = 0;
let imagePath;

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function saveMatch( rank, channel, status ){
    var connection = mysql.createConnection({
        host : 'localhost',
        user : 'root',
        port: 8889,
        password : 'root',
        database : 'hearthstone_legends'
    });

    var insertData = [ channel, rank, status ];

    connection.connect();

    connection.query( `INSERT INTO matches ( channel, rank, status ) VALUES ( ?, ?, ?, ? )`, insertData, function( error, rows, fields ){
        if( error ) {
            throw error;
        }

        console.log( chalk.green( channel + '@' + rank + ' - ' + status + ' STORED' ) );
    });

    connection.end();
}

function getTwitchImageUrl( channel, width, height ){
    return imageBaseUrl
        .replace( '{channel}', channel )
        .replace( '{width}', width )
        .replace( '{height}', height );
}

function startDetection( channel ){
    var finder = new CharacterFinder( getTwitchImageUrl( channel.name, 1920, 1080 ), 145, 80 );
    detectionsStarted = detectionsStarted + 1;

    finder.onComplete( function( file, result ){
        if( result ){
            console.log( chalk.green( file + ' matched as ' + result ) );
            saveMatch( result, channel.name, channel.status );
        } else {
            console.log( chalk.red( file + ' matched as ' + result ) );
        }

        finder.saveMatchImage( imagePath + '/' + channel + '.jpg' );

        detectionsDone = detectionsDone + 1;

        finder = null;

        if( detectionsDone === streamsPerBatch ){
            currentBatch = currentBatch + 1;
            loadStreamsBatch( currentBatch );
        }
    });
}

function startDetectionByIndex( index ){
    if( detectionsStarted - detectionsDone > detectionsRunningLimit ){
        process.nextTick( () => {
            startDetectionByIndex( index );
        });

        return true;
    }

    if( detectionsStarted < twitchData.streams.length ){
        process.nextTick(() => {
            if( twitchData.streams[ index ] ){
                startDetection( twitchData.streams[ index ].channel );
            }
        });
    }
}

function loadStreamsBatch( index ){
    console.log( 'Loading Hearthstone streams' );
    let offset = index * streamsPerBatch;
    twitch( 'streams?game=Hearthstone:%20Heroes%20of%20Warcraft&limit=' + streamsPerBatch + '&offset=' + offset, function( error, response ){
        if( error ){
            throw error;
        }

        if( response === null ){
            console.log( chalk.red( 'Failed to load twitch data' ) );
            return false;
        }

        console.log( 'Done with api request' );
        twitchData = response;
        detectionsStarted = 0;
        detectionsDone = 0;

        for( let i = 0; i < detectionsRunningLimit; i = i + 1 ){
            startDetectionByIndex( i );
        }
    });
}

var date = new Date();
imagePath = 'www/tmp/' + date.getFullYear() + '-' + ( pad( date.getMonth() + 1, 2 ) ) + '-' + pad( date.getDate(), 2 ) + '-' + pad( date.getHours(), 2 ) + pad( date.getMinutes(), 2 );
mkdirp( imagePath, function( error ){
    if( error ){
        throw new Error( error );
    }

    loadStreamsBatch( currentBatch );
});