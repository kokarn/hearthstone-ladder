'use strict';

let CharacterFinder = require( './modules/CharacterFinder.js' );
let twitch = require( './modules/Twitch.js' );
let imageBaseUrl = 'http://static-cdn.jtvnw.net/previews-ttv/live_user_{channel}-{width}x{height}.jpg';
let detectionsStarted = 0;
let detectionsDone = 0;
let detectionsRunningLimit = 50;
let twitchData;

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
        console.log( file + ' matched as ' + result );
        detectionsDone = detectionsDone + 1;

        finder = null;
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



console.log( 'Loading Hearthstone streams' );
twitch( 'streams?game=Hearthstone:%20Heroes%20of%20Warcraft&limit=100', function( error, response ){
    if( error ){
        throw error;
    }

    console.log( 'Done with api request' );
    twitchData = response;

    for( let i = 0; i < detectionsRunningLimit; i = i + 1 ){
        startDetectionByIndex( i );
    }
});
