<?php
include( '../includes/default.php' );

/* Delete images no longer found in database */

$query = 'SELECT id FROM matches';
$PDO = Database::$connection->prepare( $query );
$PDO->execute();
$availableIds = array();

while( $data = $PDO->fetch() ):
    $availableIds[] = $data->id;
endwhile;

foreach( glob( '../tmp/*.jpg' ) as $filename ):
    $id = str_replace( [ '../tmp/', '.jpg' ], '', $filename );
    if( !in_array( $id, $availableIds ) ):
        deleteMatch( $id );
    endif;
endforeach;
