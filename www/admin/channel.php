<?php
include( '../includes/default.php' );
if( isset( $_GET[ 'channel' ] ) ) :
    $query = 'SELECT * FROM players WHERE channel = :channel LIMIT 1';
    $PDO = Database::$connection->prepare( $query );
    $PDO->bindValue( ':channel', $_GET[ 'channel' ] );
    $PDO->execute();

    $playerData = $PDO->fetch();

    set_time_limit( 500 );
    if( isset( $_GET[ 'image' ] ) ):
        $url = $_GET[ 'image' ];
    else :
        $url = getTwitchImageUrl( $_GET[ 'channel' ], 1920, 1080 );
    endif;
    $imageData = file_get_contents( $url );

    $imageDigits = new ImageDigits( $imageData );
    $imageDigits->setChannel( strtolower( $_GET[ 'channel' ] ) );
    $imageDigits->setTempImageFilename( strtolower( $_GET[ 'channel' ] ) . '.jpg' );

    if( isset( $_GET[ 'find' ] ) ) :
        $bestMatchList = array();

        for( $x = -40; $x <= 40; $x = $x + 1 ):
            $imageDigits->setCustomXOffset( $x );

            for( $y = -20; $y <= 20; $y = $y + 1 ):
                $imageDigits->setCustomYOffset( $y );
                $matches = $imageDigits->getDigits();

                $matches = array_reverse( $matches );

                $bestMatch = false;
                foreach( $matches as $rankMatch ):
                    if( $rankMatch->isValid() && $rankMatch->getAsString() == $_GET[ 'find' ] ) :
                        $bestMatch = $rankMatch;
                        break;
                    endif;
                endforeach;

                if( $bestMatch ):
                    if( !isset( $bestGuess ) || $bestMatch->getTotalDistance() < $bestGuess->getTotalDistance() ):
                        $bestGuess = $bestMatch;
                        $bestGuessY = $y;
                        $bestGuessX = $x;
                    endif;

                    $bestMatchList[] = array(
                        'rankObject' => $bestMatch,
                        'x' => $x,
                        'y' => $y
                    );
                endif;
            endfor;
        endfor;
    endif;

    if( isset( $bestGuess ) ):
        $imageDigits->newYValue = $bestGuessY;
        $playerData->y = $bestGuessY;

        $imageDigits->newXValue = $bestGuessX;
        $playerData->x = $bestGuessX;

        if( isset( $_GET[ 'image' ] ) ):
            $parsedImage = str_replace( 'http://', '', $_GET[ 'image' ] );

            // Check if the image is from the same http_host
            if( substr( $parsedImage, 0, strlen( $_SERVER[ 'HTTP_HOST' ] ) ) == $_SERVER[ 'HTTP_HOST' ] ):
                $filename = substr( $_GET[ 'image' ], strrpos( $_GET[ 'image' ], '/' ) + 1 );
                $index = 0 + str_replace( '.jpg', '', $filename );

                if( $index > 0 ):
                    $query = 'UPDATE matches SET rank = :rank, timestamp = timestamp WHERE id = :id LIMIT 1';
                    $PDO = Database::$connection->prepare( $query );
                    $newRank = $bestGuess->getAsString();
                    $PDO->bindValue( ':rank', $newRank );
                    $PDO->bindValue( ':id', $index );
                    $PDO->execute();
                endif;
            endif;
        endif;
    endif;
endif;
?>
<!DOCTYPE html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>
        <?php
        if( isset( $playerData ) && $playerData->name ) :
            echo $playerData->name;
        elseif( isset( $playerData ) ):
            echo $playerData->channel;
        else :
            echo 'Channel';
        endif;
        ?>
    </title>
    <link rel="stylesheet" href="https://cdn.rawgit.com/twbs/bootstrap/v4-dev/dist/css/bootstrap.css">
</head>
<body>
<?php

if( isset( $_GET[ 'channel' ] ) ):
    ?>
    <nav class="navbar navbar-light bg-faded">
        <a class="navbar-brand" href="channel.php?channel=<?php echo $_GET[ 'channel' ]; ?>">
            <?php
            if( $playerData->should_index ):
                ?>
                <span class="label label-success">Indexing</span>
                <?php
            else:
                ?>
                <span class="label label-danger">Not indexing</span>
                <?php
            endif;
            echo $playerData->name ? $playerData->name : $playerData->channel;
            ?>
        </a>
        <ul class="nav navbar-nav">
            <?php
            if( isset( $playerData->x ) ):
                ?>
                <li class="nav-item active">
                    <span class="nav-link">
                        X: <?php echo $playerData->x; ?>
                    </span>
                </li>
                <?php
            endif;

            if( isset( $playerData->y ) ):
                ?>
                <li class="nav-item active">
                    <span class="nav-link">
                        Y: <?php echo $playerData->y; ?>
                    </span>
                </li>
                <?php
            endif;
            ?>
            <li class="nav-item">
                <a class="nav-link" href="index.php">
                    Admin
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="http://www.twitch.tv/<?php echo $_GET[ 'channel' ]; ?>">
                    Twitch channel
                </a>
            </li>
        </ul>
        <form class="form-inline pull-xs-right" method="get">
            <input type="hidden" value="<?php echo $_GET[ 'channel' ]; ?>" name="channel">
            <input type="number" name="find" class="form-control" min="0">
            <button class="btn btn-success-outline" type="submit">
                Find
            </button>
        </form>
        <form class="form-inline pull-xs-right m-r-1" method="post" action="actions.php">
            <input type="hidden" value="<?php echo $_GET[ 'channel' ]; ?>" name="channel">
            <input type="hidden" name="redirect" value="channel">
            <input type="text" name="real_name" class="form-control" value="<?php echo $playerData->name; ?>">
            <button class="btn btn-success-outline" type="submit">
                Set name
            </button>
        </form>
        <form class="form-inline pull-xs-right m-r-1" method="post" action="actions.php">
            <input type="hidden" value="<?php echo $_GET[ 'channel' ]; ?>" name="channel">
            <input type="hidden" name="redirect" value="channel">
            <?php
            if( $playerData->should_index ):
                ?>
                <input type="hidden" name="should_index" value="0">
                <input type="submit" name="index" value="Stop indexing" class="btn btn-danger">
                <?php
            else:
                ?>
                <input type="hidden" name="should_index" value="1">
                <input type="submit" name="index" value="Start indexing" class="btn btn-success">
                <?php
            endif;
            ?>
        </form>
    </nav>
    <div class="row">
        <div class="col-md-2">
        <?php
        if( isset( $_GET[ 'find' ] ) ) :
            ?>
            <table class="table">
                <thead>
                    <tr>
                        <th>
                            X
                        </th>
                        <th>
                            Y
                        </th>
                        <th>
                            Rank
                        </th>
                        <th>
                            Distance
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    foreach( $bestMatchList as $bestMatch ):
                        ?>
                        <tr>
                            <td>
                                <?php echo $bestMatch[ 'x' ]; ?>
                            </td>
                            <td>
                                <?php echo $bestMatch[ 'y' ]; ?>
                            </td>
                            <td>
                                <?php echo $bestMatch[ 'rankObject' ]->getAsString(); ?>
                            </td>
                            <td>
                                <?php echo $bestMatch[ 'rankObject' ]->getTotalDistance(); ?>
                            </td>
                        </tr>
                        <?php
                    endforeach;
                    ?>
                </tbody>
                </table>
            <?php
        else:
            $matches = $imageDigits->getDigits();

            $matches = array_reverse( $matches );

            $bestMatch = false;
            foreach( $matches as $rankMatch ):
                if( $rankMatch->isValid() ) :
                    $bestMatch = $rankMatch;
                    break;
                endif;
            endforeach;

            if( $bestMatch ):
                echo $bestMatch->getAsString();
                echo ' (', $bestMatch->getTotalDistance(), ')<br>';
            endif;
        endif;
        ?>
        </div>
        <div class="col-md-offset-1 col-md-4">
            <div
                class="modal modal-zoom-<?php echo htmlentities( $_GET[ 'channel' ] ); ?>"
                tabindex="-1"
                role="dialog"
            >
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <img data-src="<?php echo $url; ?>" style="max-width: 100%;">
                    </div>
                </div>
            </div>
            <a data-toggle="modal" data-target=".modal-zoom-<?php echo htmlentities( $_GET[ 'channel' ] ); ?>" href="#">
                <?php
                if( isset( $_GET[ 'image' ] ) ):
                    $previewImage = $_GET[ 'image' ];
                else :
                    $previewImage = getTwitchImageUrl( $_GET[ 'channel' ], 640, 380 );
                endif;
                ?>
                <img src="<?php echo $previewImage; ?>" style="max-width: 100%;">
            </a>
        </div>
        <div class="col-md-5">
            <table class="table table-sm table-hover">
                <thead>
                    <tr>
                        <th>
                            Rank
                        </th>
                        <th>
                            Diff
                        </th>
                        <th>
                            Dist
                        </th>
                        <th>
                            Time
                        </th>
                        <th>
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                <?php
                    $query = 'SELECT * FROM matches WHERE channel = :channel ORDER BY timestamp DESC';
                    $PDO = Database::$connection->prepare( $query );

                    $PDO->bindValue( ':channel', $_GET[ 'channel' ] );
                    $PDO->execute();
                    $lastDigit = false;
                    while( $data = $PDO->fetch() ):
                        $rowClass = '';
                        if( $lastDigit !== false ):
                            $diff = percentageDifference( $lastDigit, $data->rank );

                            if( $diff > 100 ):
                                $rowClass = 'table-danger';
                            elseif( $diff > 40 ):
                                $rowClass = 'table-warning';
                            endif;
                        else :
                            $diff = 0;
                        endif;
                        ?>
                        <tr class="<?php echo $rowClass; ?>">
                            <td>
                                <?php echo $data->rank; ?>
                            </td>
                            <td>
                                <?php echo $diff; ?>%
                            </td>
                            <td>
                                <?php echo $data->distance; ?>
                            </td>
                            <td>
                                <?php echo timeElapsedString( $data->timestamp ); ?>
                            </td>
                            <td>
                                <div
                                    class="modal modal-<?php echo $data->id; ?>"
                                    tabindex="-1"
                                    role="dialog"
                                >
                                    <div class="modal-dialog modal-lg">
                                        <div class="modal-content">
                                            <div class="modal-header">
                                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                                    <span aria-hidden="true">&times;</span>
                                                </button>
                                                <h4 class="modal-title">
                                                    <?php echo htmlentities( $data->status ); ?>
                                                </h4>
                                            </div>
                                            <img data-src="../tmp/<?php echo $data->id; ?>.jpg" style="max-width: 100%">
                                            <div class="modal-footer">
                                                <span class="pull-md-left">
                                                    Detected as <?php echo $data->rank; ?>
                                                </span>
                                                <a href="channel.php?channel=<?php echo $data->channel; ?>" class="btn btn-info">
                                                    View
                                                </a>
                                                <a href="actions.php?delete=<?php echo $data->id; ?>&amp;redirect=channel" class="btn btn-danger">
                                                    Delete
                                                </a>
                                                <form method="get" action="channel.php" class="form-inline pull-md-right m-l-1">
                                                    <input type="hidden" name="channel" value="<?php echo $_GET[ 'channel' ]; ?>">
                                                    <input type="hidden" name="image" value="http://<?php echo $_SERVER[ 'HTTP_HOST' ], str_replace( '/admin/channel.php', '/tmp/', $_SERVER[ 'PHP_SELF' ] ), $data->id; ?>.jpg">
                                                    <input type="number" name="find" class="form-control" >
                                                    <input type="submit" value="Re-detect" class="btn btn-success-outline">
                                                </form>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                                <div class="btn-group">
                                    <button type="button" class="btn btn-info-outline" data-toggle="modal" data-target=".modal-<?php echo $data->id; ?>">
                                        View
                                    </button>
                                    <a href="actions.php?delete=<?php echo $data->id; ?>&amp;redirect=channel" class="btn btn-danger">
                                        Delete
                                    </a>
                                </div>
                            </td>
                        </tr>
                        <?php
                        $lastDigit = $data->rank;
                    endwhile;
                ?>
                </tbody>
            </table>
        </div>
    </div>
    <nav class="navbar navbar-fixed-bottom navbar-light bg-faded">
        <a class="navbar-brand" href="#">
            Total execution time: <?php echo round( microtime( true ) - $timeStart, 2 ); ?>s
        </a>
    </nav>
    <?php
endif;
?>
<script src="https://cdn.jsdelivr.net/jquery/2.2.0/jquery.min.js"></script>
<script src="https://cdn.rawgit.com/twbs/bootstrap/v4-dev/dist/js/bootstrap.min.js"></script>
<script>
$(function(){
    $( document ).on( 'show.bs.modal', function( event ){
        $( event.target ).find( 'img' ).each( function( index, element ){
            $( element ).attr( 'src', $( element ).data( 'src' ) );
        });
    })
});
</script>
