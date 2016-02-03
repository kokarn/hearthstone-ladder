<?php
include( 'default.php' );
/* Copy all channels from matches */
/*
$query = 'SELECT channel FROM matches GROUP BY channel';
$PDO = Database::$connection->prepare( $query );
$PDO->execute();

$query = 'INSERT IGNORE INTO players ( channel ) VALUES ( :channel )';
$insertPDO = Database::$connection->prepare( $query );
while( $data = $PDO->fetch() ):
    $insertPDO->bindValue( ':channel', $data->channel );
    $insertPDO->execute();
endwhile;
*/

/*
$query = 'SELECT id, rank, channel, timestamp FROM matches ORDER BY channel, timestamp';
$PDO = Database::$connection->prepare( $query );
$PDO->execute();

$deleteQuery = 'DELETE FROM matches WHERE id = :id LIMIT 1';
$deletePDO = Database::$connection->prepare( $deleteQuery );

$channel = false;
$lastRank = false;
while( $data = $PDO->fetch() ):
    // First match of a new channel
    if( $channel === false || $data->channel !== $channel ):
        $channel = false;
        $lastRank = false;
    endif;

    // First match of a new channel
    if( $channel == false ):
        $channel = $data->channel;
        $lastRank = $data->rank;
        continue;
    endif;

    if( $lastRank == $data->rank ):
        echo $data->channel, ' ', $data->rank, ' ---- ', $channel, ' ', $lastRank, "\n<br>";
        if( isset( $_GET[ 'do' ] ) ):
            $deletePDO->bindValue( ':id', $data->id );
            $deletePDO->execute();
        endif;
    else :
        $lastRank = $data->rank;
        continue;
    endif;
endwhile;
*/

// create database hearthstone_legends;
// grant CREATE, DROP, DELETE, INSERT, SELECT, UPDATE, INDEX, ALTER ON hearthstone_legends.* to 'hearthstone'@'localhost' identified by '';
// flush privileges
