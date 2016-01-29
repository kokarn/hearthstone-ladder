<?php
include( 'includes/default.php' );
?>
<!DOCTYPE html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>
        Detector
    </title>
    <link rel="stylesheet" href="https://cdn.rawgit.com/twbs/bootstrap/v4-dev/dist/css/bootstrap.css">
</head>
<body>
<?php

set_time_limit( 120 );
$baseUrl = 'https://api.twitch.tv/kraken/streams?game=Hearthstone:%20Heroes%20of%20Warcraft';
$channelsPerPage = 50;
$page = 1;
if( isset( $_GET[ 'page' ] ) ):
    $page = 0 + $_GET[ 'page' ];
endif;

$url = $baseUrl . '&limit=' . $channelsPerPage;

if( $page > 1 ):
    $url = $url . '&offset=' . $page * $channelsPerPage;
endif;

$data = json_decode( file_get_contents( $url ) );
?>
<table class="table">
<thead>
    <tr>
        <th>
            Image
        </th>
        <th>
            4
        </th>
        <th>
            3
        </th>
        <th>
            2
        </th>
        <th>
            1
        </th>
    </tr>
</thead>
<tbody>

<?php
$query = 'SELECT channel FROM players WHERE should_index = 0';
$PDO = Database::$connection->prepare( $query );
$PDO->execute();
$skipChannels = array();

while( $skipChannel = $PDO->fetch() ):
    $skipChannels[] = $skipChannel->channel;
endwhile;

foreach( $data->streams as $stream ):

    // If the stream isn't 720 or 1080, we can't parse it yet
    if( $stream->video_height !== 720 && $stream->video_height !== 1080 ):
        continue;
    endif;

    if( in_array( $stream->channel->name, $skipChannels ) ):
        continue;
    endif;

    $url = getTwitchImageUrl( $stream->channel->name, 1920, 1080 );
    $imageData = file_get_contents( $url );

    // If we don't manage to load an image, just skip it
    if( !$imageData ):
        continue;
    endif;

    $imageDigits = new ImageDigits( $imageData );
    $imageDigits->setChannel( $stream->channel->name );
    $imageDigits->setChannelStatus( $stream->channel->status );

    $matches = $imageDigits->getDigits();

    // Check matches from 4 down to 1 and break on first
    $matches = array_reverse( $matches );

    $bestMatch = false;
    foreach( $matches as $rankMatch ):
        if( $rankMatch->isValid() ) :
            $bestMatch = $rankMatch;
            break;
        endif;
    endforeach;
    echo '<tr>';
        echo '<td>';
            if( $bestMatch ):
                echo $bestMatch->getAsString();
                $matchId = $bestMatch->store();
                if( $matchId ):
                    $file = fopen( 'tmp/' . $matchId . '.jpg', 'w' );
                    fwrite( $file, $imageData );
                    fclose( $file );
                endif;
            endif;
            echo '<a href="admin/channel.php?channel=', $stream->channel->name, '">';
                echo '<img src="', getTwitchImageUrl( $stream->channel->name, 1920, 1080 ), '" style="width: 100%;">';
            echo '</a>';
        echo '</td>';
        foreach( $matches as $match ):
            echo '<td>';
                echo 'Distance: ', $match->getTotalDistance();
                echo '<span class="pull-md-right">Rank: ', $match->getAsString(), '</span>';
                if( $match->isValid() ):
                    ?>
                    <div class="card card-inverse card-success">
                    <?php
                else :
                    ?>
                    <div class="card card-inverse card-info">
                    <?php
                endif;
                ?>
                    <div class="card-block">
                        <pre style="font-size: 8px; color: #fff;"><?php
                            print_r( $match->digits );
                        ?></pre>
                    </div>
                </div>
                <?php

            echo '</td>';
        endforeach;
    echo '</tr>';
endforeach;
?>
</tbody>
</table>
<nav class="navbar navbar-fixed-bottom navbar-light bg-faded">
    <a class="btn btn-default" href="detector.php?page=<?php echo max( 1, $page - 1 ); ?>">< Previous</a>
    <a class="btn btn-default" href="detector.php?page=1">First</a>
    <a class="btn btn-default" href="detector.php?page=<?php echo $page + 1; ?>">Next ></a>
    <a class="navbar-brand pull-md-right" href="#">
        Total execution time: <?php echo round( microtime( true ) - $timeStart, 2 ); ?>s
    </a>
</nav>
