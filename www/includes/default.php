<?php
include ( 'config.php' );

$timeStart = microtime( true );

function __autoload( $class ){
    require( 'classes/' . $class . '.class.php' );
}

function getTwitchImageUrl( $channel, $width, $height ){
    return 'http://static-cdn.jtvnw.net/previews-ttv/live_user_' . strtolower( $channel ) . '-' . $width . 'x' . $height . '.jpg';
}

function foldersize($path) {
    $total_size = 0;
    $files = scandir($path);
    $cleanPath = rtrim($path, '/'). '/';

    foreach($files as $t) {
        if ($t<>"." && $t<>"..") {
            $currentFile = $cleanPath . $t;
            if (is_dir($currentFile)) {
                $size = foldersize($currentFile);
                $total_size += $size;
            }
            else {
                $size = filesize($currentFile);
                $total_size += $size;
            }
        }
    }

    return $total_size;
}

function formatSize( $size ){
    $units = array( 'B', 'KB', 'MB', 'GB', 'TB', 'PB' );

    $mod = 1024;

    for( $i = 0; $size > $mod; $i = $i + 1 ):
        $size /= $mod;
    endfor;

    $endIndex = strpos( $size, "." ) + 3;

    return substr( $size, 0, $endIndex ) . ' ' . $units[ $i ];
}

function sortByChannel( $a, $b ){
    return strcmp( $a[ 'channel' ], $b[ 'channel' ] );
}

function percentageDifference( $a, $b ){
    return round( 100 - ( min( $a, $b ) / max( $a, $b ) ) * 100 );
}

function isValidMatchDifferance( $match1, $match2 ){
    // If the difference is less than 50% then it should be valid
    if( percentageDifference( $match1->rank, $match2->rank ) < 50 ):
        return true;
    endif;

    // If the total rank difference is less than 50 then it should be valid
    if( abs( $match1->rank - $match2->rank ) < 50 ):
        return true;
    endif;

    // If the second value is verified, it should be valid
    if( $match2->verified ):
        return true;
    endif;

    return false;
}

function deleteMatch( $id ){
    $id = 0 + $id;
    $query = 'DELETE FROM matches WHERE id = :id LIMIT 1';
    $PDO = Database::$connection->prepare( $query );
    $PDO->bindValue( ':id', $id );

    $PDO->execute();
    unlink( __DIR__ . '/../tmp/' . $id . '.jpg' );
}

function timeElapsedString($datetime, $full = false) {
    $now = new DateTime;
    $ago = new DateTime($datetime);
    $diff = $now->diff($ago);

    $diff->w = floor($diff->d / 7);
    $diff->d -= $diff->w * 7;

    $string = array(
        'y' => 'year',
        'm' => 'month',
        'w' => 'week',
        'd' => 'day',
        'h' => 'hour',
        'i' => 'minute',
        's' => 'second',
    );
    foreach ($string as $k => &$v) {
        if ($diff->$k) {
            $v = $diff->$k . ' ' . $v . ($diff->$k > 1 ? 's' : '');
        } else {
            unset($string[$k]);
        }
    }

    if (!$full) $string = array_slice($string, 0, 1);
    return $string ? implode(', ', $string) . ' ago' : 'just now';
}

Database::connect( $databaseHost, $databaseUsername, $databasePassword, $databaseName, $databasePort );
