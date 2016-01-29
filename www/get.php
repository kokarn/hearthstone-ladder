<?php
include( 'includes/default.php' );
if( isset( $_GET[ 'channel' ] ) ):
    $query = 'SELECT
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
            matches.channel = :channel
        ORDER BY
            matches.timestamp';
        $PDO = Database::$connection->prepare( $query );

        $PDO->bindValue( ':channel', $_GET[ 'channel' ] );
else :
    $query = 'SELECT
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
        DESC';
        $PDO = Database::$connection->prepare( $query );
endif;

$PDO->execute();

header( 'Content-type: application/json' );
die( json_encode( $PDO->fetchAll(), JSON_NUMERIC_CHECK ) );
