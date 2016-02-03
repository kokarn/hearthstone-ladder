<?php
class Database {

    /** @var PDO */
    public static $connection = false;

    public static function connect( $host, $user, $password, $database, $port ) {
        $dbn = 'mysql:dbname=' . $database . ';host=' . $host . ';port=' . $port;
        try {
            Database::$connection = new PDO( $dbn, $user, $password );

            Database::$connection->exec( 'SET NAMES UTF8' );

            Database::$connection->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
            Database::$connection->setAttribute( PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_OBJ );
        } catch ( PDOException $e ) {
            echo 'Connection failed: ' . $e->getMessage();
        }
    }

}
?>
