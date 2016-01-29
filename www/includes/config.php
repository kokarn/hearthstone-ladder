<?php
if( $_SERVER[ 'HTTP_HOST' ] == 'localhost:8888' ):
    $databaseHost = 'localhost';
    $databaseUsername = 'root';
    $databasePassword = 'root';
    $databaseName = 'hearthstone_legends';
    $databasePort = '8889';
else :
    $databaseHost = 'localhost';
    $databaseUsername = 'hearthstone';
    $databasePassword = 'Sr55x5VrAb9mgWa2uA';
    $databaseName = 'hearthstone_legends';
    $databasePort = '3306';
endif;
