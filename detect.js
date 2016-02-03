'use strict';

let chalk = require( 'chalk' );

let CharacterFinder = require( './modules/CharacterFinder.js' );
let twitch = require( './modules/Twitch.js' );
let imageBaseUrl = 'http://static-cdn.jtvnw.net/previews-ttv/live_user_{channel}-{width}x{height}.jpg';
let detectionsStarted = 0;
let detectionsDone = 0;
let detectionsRunningLimit = 25;
let twitchData;
let streamsPerBatch = 25;
let currentBatch = 0;

function getTwitchImageUrl( channel, width, height ){
    return imageBaseUrl
        .replace( '{channel}', channel )
        .replace( '{width}', width )
        .replace( '{height}', height );
}

function startDetection( channel ){
    var finder = new CharacterFinder( getTwitchImageUrl( channel, 1920, 1080 ), 145, 60 );
    detectionsStarted = detectionsStarted + 1;

    finder.onComplete( function( file, result ){
        if( result ){
            console.log( chalk.green( file + ' matched as ' + result ) );
        } else {
            console.log( chalk.red( file + ' matched as ' + result ) );
        }

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
                startDetection( twitchData.streams[ index ].channel.name );
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

        console.log( 'Done with api request' );
        twitchData = response;
        detectionsStarted = 0;
        detectionsDone = 0;

        for( let i = 0; i < detectionsRunningLimit; i = i + 1 ){
            startDetectionByIndex( i );
        }
    });
}



loadStreamsBatch( currentBatch );
