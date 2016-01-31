'use strict';

let CharacterFinder = require( './modules/CharacterFinder.js' );
let twitch = require( './modules/Twitch.js' );
let imageBaseUrl = 'http://static-cdn.jtvnw.net/previews-ttv/live_user_{channel}-{width}x{height}.jpg';
let detectionsStarted = 0;
let detectionsDone = 0;
let detectionsRunningLimit = 1;
let twitchData;

function getTwitchImageUrl( channel, width, height ){
    return imageBaseUrl
        .replace( '{channel}', channel )
        .replace( '{width}', width )
        .replace( '{height}', height );
}

function startDetectionByIndex( index ){
    startDetection( twitchData.streams[ index ].channel.name );
}

function startDetection( channel ){
    var finder = new CharacterFinder( getTwitchImageUrl( channel, 1920, 1080 ), 145, 60 );
    detectionsStarted = detectionsStarted + 1;

    finder.onComplete( function( file, result ){
        console.log( file + ' matched as ' + result );
        if( detectionsStarted < twitchData.streams.length ){

            // Trying to make sure the call stack doesn't get filled,
            // doesn't work tho...
            process.nextTick( () => {
                startDetectionByIndex( detectionsStarted - 1 )
            });
        }
    });
}

console.log( 'Loading Hearthstone streams' );
twitch( 'streams?game=Hearthstone:%20Heroes%20of%20Warcraft', function( error, response ){
    if( error ){
        throw error;
    }

    console.log( 'Done with api request' );
    twitchData = response;

    for( let i = 0; i < detectionsRunningLimit; i = i + 1 ){
        startDetectionByIndex( i );
    }
});
