'use strict';

let chalk = require( 'chalk' );
let mysql = require( 'mysql' );

let twitch = require( './modules/Twitch.js' );
let config = require( './config.js' );
let streamsPerBatch = 100;
let currentBatch = 0;
let liveChannels = [];

var connectionPool = mysql.createPool({
    host : config.database.host,
    user : config.database.user,
    port: config.database.port,
    password : config.database.password,
    database : config.database.name
});

function updateLiveStatus(){
    console.log( 'Got a total of', liveChannels.length, 'live Hearthstone channels' );
    connectionPool.getConnection( function( error, connection ){
        if( error ){
            throw error;
        }

        connection.query(
            'UPDATE players SET live = 1 WHERE channel IN ( ' + mysql.escape( liveChannels ) + ' )',
            function( error, rows, fields ){
                if( error ) {
                    throw error;
                }

                console.log( 'Channels set as live:', rows.affectedRows );

                connection.release();
            }
        );
    });

    connectionPool.getConnection( function( error, connection ){
        if( error ){
            throw error;
        }

        connection.query(
            'UPDATE players SET live = 0 WHERE channel NOT IN ( ' + mysql.escape( liveChannels ) + ' )',
            function( error, rows, fields ){
                if( error ) {
                    throw error;
                }

                console.log( 'Channels NOT live:', rows.affectedRows );

                connection.release();
            }
        );
    });
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

        for( let i = 0; i < response.streams.length; i = i + 1 ){
            liveChannels.push( response.streams[ i ].channel.name )
        }

        if( response.streams.length > 0 ){
            currentBatch = currentBatch + 1;
            loadStreamsBatch( currentBatch );
        } else {
            updateLiveStatus();
        }
    });
}

loadStreamsBatch( currentBatch );
