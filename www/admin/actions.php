<?php
include( '../includes/default.php' );

// Action for setting a real name
if( !empty( $_POST ) && isset( $_POST[ 'real_name' ] ) ):
    $query = 'SELECT COUNT( * ) FROM players WHERE channel = :channel LIMIT 1';
    $PDO = Database::$connection->prepare( $query );
    $PDO->bindValue( ':channel', $_POST[ 'channel' ] );
    $PDO->execute();

    if( $PDO->fetchColumn() > 0 ):
        $query = 'UPDATE players SET name = :name WHERE channel = :channel LIMIT 1';
    else :
        $query = 'INSERT INTO players ( channel, name ) VALUES ( :channel, :name )';
    endif;
    $PDO = Database::$connection->prepare( $query );
    $PDO->bindValue( ':channel', $_POST[ 'channel' ] );
    $PDO->bindValue( ':name', $_POST[ 'real_name' ] );

    $PDO->execute();

    $redirectChannel = $_POST[ 'channel' ];
endif;

// Action for deleting a match
if( isset( $_GET[ 'delete' ] ) ):
    $id = 0 + $_GET[ 'delete' ];
    $query = 'SELECT channel FROM matches WHERE id = :id LIMIT 1';
    $PDO = Database::$connection->prepare( $query );
    $PDO->bindValue( ':id', $id );
    $PDO->execute();

    $redirectChannel = $PDO->fetchColumn();
    deleteMatch( $id );
    /*
    $query = 'DELETE FROM matches WHERE id = :id LIMIT 1';
    $PDO = Database::$connection->prepare( $query );
    $PDO->bindValue( ':id', $id );

    $PDO->execute();
    unlink( '../tmp/' . $id . '.jpg' );
    */
endif;

// Action for verifying a match
if( isset( $_GET[ 'verify' ] ) ):
    $id = 0 + $_GET[ 'verify' ];
    $query = 'SELECT channel FROM matches WHERE id = :id LIMIT 1';
    $PDO = Database::$connection->prepare( $query );
    $PDO->bindValue( ':id', $id );
    $PDO->execute();

    $redirectChannel = $PDO->fetchColumn();
    $query = 'UPDATE matches SET verified = 1, timestamp = timestamp WHERE id = :id LIMIT 1';
    $PDO = Database::$connection->prepare( $query );
    $PDO->bindValue( ':id', $id );

    $PDO->execute();
endif;

// Action for setting stop/start of index
if( !empty( $_POST ) && isset( $_POST[ 'should_index' ] ) ):
    $query = 'UPDATE players SET should_index = :shouldIndex WHERE channel = :channel LIMIT 1';
    $PDO = Database::$connection->prepare( $query );

    $PDO->bindValue( ':channel', $_POST[ 'channel' ] );
    $PDO->bindValue( ':shouldIndex', $_POST[ 'should_index' ] );

    $PDO->execute();

    $redirectChannel = $_POST[ 'channel' ];
endif;

// Choose where to redirect
if( isset( $_REQUEST[ 'redirect' ] ) ):
    switch( $_REQUEST[ 'redirect' ] ):
        case 'channel':
            header( 'Location: channel.php?channel=' . urlencode( $redirectChannel ) );
            break;
        case 'admin':
            header( 'Location: index.php' );
            break;
    endswitch;
endif;
