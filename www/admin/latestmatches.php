<?php
include( '../includes/default.php' );
$query = 'SELECT * FROM matches ORDER BY timestamp DESC LIMIT 100';
$PDO = Database::$connection->prepare( $query );
$PDO->execute();
while( $row = $PDO->fetch() ):
    if( $row->distance / strlen( $row->rank ) > 5 ):
        ?>
        <tr class="table-warning">
        <?php
    else :
        ?>
        <tr>
        <?php
    endif;
    ?>
        <td>
            <?php echo $row->channel; ?>
        </td>
        <td>
            <div
                class="modal modal-<?php echo $row->id; ?>"
                tabindex="-1"
                role="dialog"
                aria-labelledby="mySmallModalLabel"
                aria-hidden="true"
            >
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <img data-src="../tmp/<?php echo $row->id; ?>.jpg" style="max-width: 100%">
                        <div class="modal-footer">
                            <span class="pull-md-left">
                                Detected as <?php echo $row->rank; ?>
                            </span>
                            <a href="channel.php?channel=<?php echo $row->channel; ?>" class="btn btn-info">
                                View
                            </a>
                            <a href="actions.php?delete=<?php echo $row->id; ?>&amp;redirect=admin" class="btn btn-danger">
                                Delete
                            </a>
                        </div>

                    </div>
                </div>
            </div>
            <button type="button" class="btn btn-info-outline" data-toggle="modal" data-target=".modal-<?php echo $row->id; ?>">
                <?php echo $row->rank; ?>
            </button>
        </td>
        <td>
            <?php echo $row->distance; ?>
        </td>
        <td>
            <?php echo timeElapsedString( $row->timestamp ); ?>
        </td>
        <td>
            <?php echo htmlentities( $row->status ); ?>
        </td>
        <td>
            <a href="channel.php?channel=<?php echo $row->channel; ?>" class="btn btn-info">
                View
            </a>
        </td>
        <td>
            <a href="actions.php?delete=<?php echo $row->id; ?>&amp;redirect=admin" class="btn btn-danger">
                Delete
            </a>
        </td>
    </tr>
    <?php
endwhile;
?>
