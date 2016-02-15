'use strict';

var mysql = require( 'mysql' );
var fs = require( 'fs' );
var path = require( 'path' );
var moment = require( 'moment' );

var express = require( 'express' );
var session = require( 'express-session' );
var bodyParser = require( 'body-parser' );
var hash = require( './modules/pass.js' ).hash;
var compress = require( 'compression' );

var config = require( './config.js' );
var hearthstone = require( './modules/Hearthstone.js' );

var users = {
    kokarn: {
        name: 'kokarn'
    }
};

var app = express();

app.use( compress() );

app.use( express.static( path.join( __dirname, '/www' ) ) );

app.use( session({
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    secret: 'sJ7jx3n2bXDPwofbU5zuW'
}));

app.use( bodyParser.urlencoded( {
    extended: true
}));

app.use( function( request, response, next ){
    var error = request.session.error;
    var msg = request.session.success;
    delete request.session.error;
    delete request.session.success;

    response.locals.message = '';
    if( error ){
        response.locals.message = '<p class="msg error">' + error + '</p>';
    }

    if( msg ){
        response.locals.message = '<p class="msg success">' + msg + '</p>';
    }

    next();
});

hash( 'kokarn1337', function( error, salt, hash){
    if ( error ){
        throw err;
    }

    users.kokarn.salt = salt;
    users.kokarn.hash = hash;
});

function pad( n, width, z ) {
    z = z || '0';
    n = String( n );
    return n.length >= width ? n : new Array( width - n.length + 1 ).join( z ) + n;
}

function getMatchImagePath( channel, timestamp ){
    let startMoment = moment( timestamp );
    return '/tmp/' + startMoment.year() + '-' + pad( startMoment.month() + 1, 2 ) + '-' + pad( startMoment.date(), 2 ) + '-' + pad( startMoment.hour(), 2 ) + pad( startMoment.minute() - ( startMoment.minute() % 5 ), 2 ) + '/' + channel + '.jpg';
}

function authenticate( name, pass, fn ){
    if ( !module.parent ) {
        console.log( 'authenticating %s:%s', name, pass );
    }

    var user = users[ name ];
    if( !user ){
        return fn( new Error( 'Cannot find user' ) );
    }

    if( !pass ){
        return fn( new Error( 'Got no password' ) );
    }
    // apply the same algorithm to the POSTed password, applying
    // the hash against the pass / salt, if there is a match we
    // found the user
    hash( pass, user.salt, function( error, hash ){
        if( error ){
            return fn( error );
        }

        if( hash === user.hash ) {
            return fn( null, user );
        }

        fn( new Error( 'invalid password' ) );
    });
}

function restrict( request, response, next ){
    if ( request.session.user ){
        next();
    } else {
        request.session.error = 'Access denied!';
        response.redirect( '/login' );
    }
}

app.post( '/login', function( request, response ){
    authenticate( request.body.username, request.body.password, function( error, user ){
        if( user ) {
            request.session.regenerate(function(){
                request.session.user = user;
                request.session.success = 'Authenticated as ' + user.name + ' click to <a href="/logout">logout</a>. You may now access <a href="/restricted">/restricted</a>.';
                response.redirect( '/check' );
            });
        } else {
            request.session.error = 'Authentication failed, please check your username and password. (use "tj" and "foobar")';
            response.redirect( '/login' );
        }
    });
});

app.get( '/login', function( request, response ){
    let responseHtml = `
        <form method="post" action="/login">
            <input type="text" name="username" placeholder="username">
            <input type="password" name="password">
            <input type="submit" value="Log in">
        </form>
    `;

    response.send( responseHtml );
});

app.get( '/logout', function( request, response ){
    request.session.destroy( function(){
        response.redirect( '/' );
    });
});

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
        live,
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
                timestamp > '${ moment().subtract( 1, 'weeks' ).format( 'YYYY-MM-DD 00:00:00' ) }'
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

app.get( '/check', restrict, function( request, response ){
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

app.get( '/check/*', restrict, function( request, response ){
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

app.get( '/channel/*', restrict, function( request, response ){
    var pool = mysql.createPool({
        host : config.database.host,
        user : config.database.user,
        port: config.database.port,
        password : config.database.password,
        database : config.database.name
    });

    if( request.query.name ){
        pool.getConnection( function( error, connection ){
            if( error ){
                throw error;
            }

            connection.query(
                'UPDATE players SET name = ? WHERE channel = ?',
                [ request.query.name, request.params[ 0 ] ],
                function( error, rows, fields ){
                    connection.release();
                }
            );
        });
    }

    if( request.query.should_index ){
        pool.getConnection( function( error, connection ){
            if( error ){
                throw error;
            }

            connection.query(
                'UPDATE players SET should_index = ? WHERE channel = ?',
                [ request.query.should_index, request.params[ 0 ] ],
                function( error, rows, fields ){
                    connection.release();
                }
            );
        });
    }

    pool.getConnection( function( error, connection ){
        if( error ){
            throw error;
        }

        connection.query( `SELECT
                id,
                rank,
                matches.channel,
                timestamp,
                status,
                name,
                should_index
            FROM
                matches
            LEFT JOIN
                players
            ON
                matches.channel = players.channel
            WHERE
                matches.channel = ?
            ORDER BY
                matches.timestamp
            DESC`,
            request.params[ 0 ],
            function( error, rows, fields ){

                // If we go to an non-existing channel, don't break the server
                if( typeof rows === 'undefined' || typeof rows[ 0 ] === 'undefined' ){
                    response.end();
                    return false;
                }

                if( rows[ 0 ].should_index ){
                    var shouldIndexQueryParam = '0';
                } else {
                    var shouldIndexQueryParam = '1';
                }
                var htmlResponse = `<ul>
                <li>Channel: <a href="http://twitch.tv/${ rows[ 0 ].channel }">${ rows[ 0 ].channel }</a></li>
                <li>Name: <form method="get"><input type="text" name="name" value="${ rows[ 0 ].name }"><input type="submit" value="Update"></form></li>
                <li>Showing: <a href="?should_index=${ shouldIndexQueryParam }">${ rows[ 0 ].should_index }</a></li>
                </ul>`;
                if( error ) {
                    throw error;
                }

                for( let i = 0; i < rows.length; i = i + 1 ){
                    htmlResponse = htmlResponse + '<a href="/invalidate?id=' + rows[ i ].id + '"><img src="' + getMatchImagePath( rows[ i ].channel, rows[ i ].timestamp ) + '"></a>';
                }

                response.send( htmlResponse );
                connection.release();
            }
        );
    });
});

app.get( '/cleanup', restrict, function( request, response ){
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
            500`,
        function( error, rows, fields ){
            if( error ) {
                throw error;
            }

            for( let i = 0; i < rows.length - 1; i = i + 1 ){
                htmlResponse = htmlResponse + '<a href="/invalidate?id=' + rows[ i ].id + '&channel=' + rows[ i ].channel + '"><img src="' + getMatchImagePath( rows[ i ].channel, rows[ i ].timestamp ) + '"></a>';
            }

            response.send( htmlResponse );
        }
    );

    connection.end();
});

app.get( '/invalidate', restrict, function( request, response ){
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
