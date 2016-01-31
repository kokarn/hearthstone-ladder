<?php
include( '../includes/default.php' );
?>
<DOCTYPE html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>
        Admin
    </title>
    <link rel="stylesheet" href="https://cdn.rawgit.com/twbs/bootstrap/v4-dev/dist/css/bootstrap.css">
</head>
<body>
    <nav class="navbar navbar-light bg-faded">
        <a class="navbar-brand" href="index.php">
            Home
        </a>
        <ul class="nav navbar-nav">
            <li class="nav-item">
                <a class="nav-link" href="../">
                    View
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="../build.php">
                    Build
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="../detector.php">
                    Detector
                </a>
            </li>
        </ul>

        <ul class="nav navbar-nav pull-xs-right">
            <li class="nav-item">
                <form class="form-inline" method="get" action="channel.php">
                    <select class="form-control js-channel-select" name="channel">
                        <option>Select channel</option>
                        <?php
                        $query = 'SELECT * FROM players, matches WHERE players.channel = matches.channel';
                        $PDO = Database::$connection->prepare( $query );
                        $PDO->execute();

                        while( $dataset = $PDO->fetch() ):
                            ?>
                            <option value="<?php echo $dataset->channel; ?>">
                                <?php echo $dataset->channel; ?>
                            </option>
                            <?php
                        endwhile;
                        ?>
                    </select>
                </form>
            </li>
            <?php
            $query = 'SELECT COUNT( DISTINCT channel ) FROM matches';
            $PDO = Database::$connection->prepare( $query );
            $PDO->execute();
            $channels = $PDO->fetchColumn();
            ?>
            <li class="nav-item">
                <a class="nav-link" href="#">
                    Channels matched: <?php echo $channels ?>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#">Match image directory size: <?php echo formatSize( foldersize( '../tmp' ) ); ?></a>
            </li>
        </ul>
    </nav>
<div class="container-fluid">
    <div class="row">
        <div class="col-md-4">
            <h1 class="display-4">
                Needs action
            </h1>
            <table class="table table-striped table-sm table-hover">
                <thead>
                    <tr>
                        <th>
                            Channel
                        </th>
                        <th>
                            Real name
                        </th>
                        <th>
                            View
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    $query = 'SELECT
                        id,
                        rank,
                        matches.channel,
                        timestamp,
                        status,
                        name,
                        players.should_index,
                        verified
                        FROM
                            matches
                        LEFT JOIN
                            players
                        ON
                            matches.channel = players.channel
                        ORDER BY
                            matches.timestamp
                        DESC';
                    $PDO = Database::$connection->prepare( $query );
                    $PDO->execute();
                    $players = array();
                    while( $row = $PDO->fetch() ):
                        if( !isset( $players[ $row->channel ] ) ):
                            $players[ $row->channel ] = array(
                                'channel' => $row->channel,
                                'name' => $row->name,
                                'should_index' => $row->should_index,
                                'matches' => array()
                            );
                        endif;

                        $players[ $row->channel ][ 'matches' ][] = $row;
                    endwhile;
                    usort( $players, 'sortByChannel' );
                    foreach( $players as $player ):
                        if( count( $player[ 'matches' ] ) < 1 ):
                            continue;
                        endif;

                        $needsAttention = false;
                        foreach( $player[ 'matches' ] as $index => $match ):
                            if( $index == 0 ):
                                continue;
                            endif;

                            if( !isValidMatchDifferance( $player[ 'matches' ][ $index - 1 ], $player[ 'matches' ][ $index ] ) ):
                                $needsAttention = true;
                                break;
                            endif;
                        endforeach;

                        if( !$needsAttention ):
                            if( empty( $player[ 'name' ] ) ):
                                $needsAttention = true;
                            endif;
                        endif;

                        if( !$needsAttention ):
                            continue;
                        endif;
                        ?>
                        <tr>
                            <td>
                                <?php echo $player[ 'channel' ]; ?>
                            </td>
                            <td>
                                <?php echo $player[ 'name' ]; ?>
                            </td>
                            <td>
                                <a href="channel.php?channel=<?php echo $player[ 'channel' ]; ?>" class="btn">
                                    View
                                </a>
                            </td>
                        </tr>
                        <?php
                    endforeach;
                    ?>
                </tbody>
            </table>
        </div>
        <div class="col-md-offset-1 col-md-7">
            <h1 class="display-4">
                Latest matches
            </h1>
            <table class="table table-striped table-hover table-sm">
                <thead>
                    <tr>
                        <th>
                            Player
                        </th>
                        <th>
                            Rank
                        </th>
                        <th>
                            Dist.
                        </th>
                        <th>
                            Timestamp
                        </th>
                        <th>
                            Status
                        </th>
                        <th>
                            Channel
                        </th>
                        <th>
                            Delete
                        </th>
                    </tr>
                </thead>
                <tbody class="js-matches-table-content">
                </tbody>
            </table>
        </div>
    </div>
</div>
<script src="https://cdn.jsdelivr.net/jquery/2.2.0/jquery.min.js"></script>
<script src="https://cdn.rawgit.com/twbs/bootstrap/v4-dev/dist/js/bootstrap.min.js"></script>
<script>
    $(function(){
        function loadMatchesTable(){
            $.ajax({
                url: 'latestmatches.php',
                cache: false,
                success: function( response ){
                    $( '.js-matches-table-content' ).html( response );
                }
            });
        }

        loadMatchesTable();

        setInterval( loadMatchesTable, 60000 );

        $( '.js-channel-select' ).on( 'change', function( event ){
            $( this ).parent( 'form' ).submit();
        });

        $( document ).on( 'show.bs.modal', function( event ){
            $( event.target ).find( 'img' ).each( function( index, element ){
                $( element ).attr( 'src', $( element ).data( 'src' ) );
            });
        })
    });
</script>
