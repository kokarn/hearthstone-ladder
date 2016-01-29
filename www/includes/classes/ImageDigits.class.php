<?php
class ImageDigits {
    public $sizeData = array(
        '640x360' => array(
            'x' => array(
                1 => array(
                    1 => 7
                ),
                2 => array(
                    1 => 11,
                    2 => 18
                ),
                3 => array(
                    1 => 7,
                    2 => 15,
                    3 => 22
                ),
                4 => array(
                    1 => 4,
                    2 => 11,
                    3 => 18,
                    4 => 26
                )
            ),
            'y' => array(
                'top' => 17,
                'bottom' => 305
            ),
            'size' => array(
                'width' => 7,
                'heigt' => 11
            )
        ),
        '1920x1080' => array(
            'x' => array(
                1 => array(
                    1 => 42
                ),
                2 => array(
                    1 => 31,
                    2 => 53
                ),
                3 => array(
                    1 => 20,
                    2 => 42,
                    3 => 64
                ),
                4 => array(
                    1 => 9,
                    2 => 31,
                    3 => 53,
                    4 => 75
                )
            ),
            'y' => array(
                'top' => 10,
                'bottom' => 916
            ),
            'size' => array(
                'width' => 24,
                'height' => 31
            )
        )
    );

    public $tempImagePath = 'tmp/test.jpg';
    public $positionOffetsIndexFilename;

    private $customOffset = array();

    public function __construct( $inputFile ){
        $this->imageHashes = new ImageHashes();
        $this->imageHashes->loadFromIndex();

        $this->src = imagecreatefromstring( $inputFile );

        $this->imageDimensions = imagesx( $this->src ) . 'x' . imagesy( $this->src );

        $this->dest = imagecreatetruecolor( $this->sizeData[ $this->imageDimensions ][ 'size' ][ 'width' ], $this->sizeData[ $this->imageDimensions ][ 'size' ][ 'height' ] );

        $this->loadPositionOffsets();
    }

    public function __destruct(){
        imagedestroy( $this->dest );
        imagedestroy( $this->src );

        $data = array();

        // If channel isn't set, it's just a generic image
        if( !isset( $this->channel ) ):
            return true;
        endif;

        if( isset( $this->newYValue ) ):
            $query = 'UPDATE players SET y = :y WHERE channel = :channel LIMIT 1';
            $PDO = Database::$connection->prepare( $query );

            $PDO->bindValue( ':y', $this->newYValue );
            $PDO->bindValue( ':channel', $this->channel );

            $PDO->execute();

            $data[ 'y' ] = $this->newYValue;
        endif;

        if( isset( $this->newXValue ) ):
            $query = 'UPDATE players SET x = :x WHERE channel = :channel LIMIT 1';
            $PDO = Database::$connection->prepare( $query );

            $PDO->bindValue( ':x', $this->newXValue );
            $PDO->bindValue( ':channel', $this->channel );

            $PDO->execute();

            $data[ 'x' ] = $this->newXValue;
        elseif( isset( $this->channelOffsets[ $this->channel ]->x ) ):
            $data[ 'x' ] = $this->channelOffsets[ $this->channel ]->x;
        endif;

        // Make sure the object is updated with the latest data
        $this->channelOffsets[ $this->channel ] = $data;
    }

    private function loadPositionOffsets(){
        $query = 'SELECT channel, x, y FROM players WHERE x IS NOT NULL OR y IS NOT NULL';
        $PDO = Database::$connection->prepare( $query );
        $PDO->execute();

        while( $data = $PDO->fetch() ):
            $tempData = array();
            if( isset( $data->x ) ):
                $tempData[ 'x' ] = $data->x;
            endif;

            if( isset( $data->y ) ):
                $tempData[ 'y' ] = $data->y;
            endif;

            $this->channelOffsets[ $data->channel ] = $tempData;
        endwhile;
    }

    public function setTempImageFilename( $tempImageFilename ){
        $this->tempImagePath = __DIR__ . '/../../tmp/' . $tempImageFilename;
    }

    public function setChannel( $channel ){
        $this->channel = $channel;

        $query = 'SELECT COUNT(*) FROM players WHERE channel = :channel LIMIT 1';
        $PDO = Database::$connection->prepare( $query );

        $PDO->bindValue( ':channel', $channel );
        $PDO->execute();

        if( $PDO->fetchColumn() < 1 ):
            $query = 'INSERT INTO players ( channel ) VALUES ( :channel )';
            $PDO = Database::$connection->prepare( $query );

            $PDO->bindValue( ':channel', $channel );
            $PDO->execute();
        endif;
    }

    public function setChannelStatus( $status ){
        $this->channelStatus = $status;
    }

    public function setCustomXOffset( $x ){
        $this->customOffset[ 'x' ] = $x;
    }

    public function setCustomYOffset( $y ){
        $this->customOffset[ 'y' ] = $y;
    }

    public function getDigits(){
        $matches = array();

        for( $digits = 1; $digits <= 4; $digits = $digits + 1 ):
            // If we haven't set any matches for this number of digits before
            if( !isset( $matches[ $digits ] ) ):
                if( isset( $this->channelStatus ) ):
                    $matches[ $digits ] = new RankMatch( $this->channel, $this->channelStatus );
                else :
                    $matches[ $digits ] = new RankMatch( $this->channel );
                endif;
            endif;

            for( $digit = 1; $digit <= $digits; $digit = $digit + 1 ):
                $matches[ $digits ]->addDigit( $this->getDigit( $digits, $digit ) );
            endfor;

            // If we find a valid number, assume the y offset value for it is the best one
            // Only if we don't already have a custom y value
            if( $matches[ $digits ]->isValid() && !isset( $this->newYValue ) && !isset( $this->channelOffsets[ $this->channel ][ 'y' ] ) ):
                $this->setCustomYOffset( $matches[ $digits ]->digits[ 0 ]->y );
                $this->newYValue = $matches[ $digits ]->digits[ 0 ]->y;
            endif;
        endfor;

        return $matches;
    }

    public function getDigit( $digits, $digit, $outputfile = false ){
        $sizeData = $this->sizeData[ $this->imageDimensions ];

        if( isset( $this->customOffset[ 'x' ] ) ):
            $sizeData[ 'x' ][ $digits ][ $digit ] = $sizeData[ 'x' ][ $digits ][ $digit ] + $this->customOffset[ 'x' ];
        elseif( isset( $this->channel ) && isset( $this->channelOffsets[ $this->channel ][ 'x' ] ) ) :
            $sizeData[ 'x' ][ $digits ][ $digit ] = $sizeData[ 'x' ][ $digits ][ $digit ] + $this->channelOffsets[ $this->channel ][ 'x' ];
        endif;

        if( isset( $this->customOffset[ 'y' ] ) ):
            $sizeData[ 'y' ][ 'bottom' ] = $sizeData[ 'y' ][ 'bottom' ] + $this->customOffset[ 'y' ];
        elseif( isset( $this->channel ) && isset( $this->channelOffsets[ $this->channel ][ 'y' ] ) ) :
            $sizeData[ 'y' ][ 'bottom' ] = $sizeData[ 'y' ][ 'bottom' ] + $this->channelOffsets[ $this->channel ][ 'y' ];
        endif;

        $bestDigitMatch = false;

        // If we have a specific y, don't loop over -4 to 4 to find the best one
        if( isset( $this->customOffset[ 'y' ] ) || ( isset( $this->channel ) && isset( $this->channelOffsets[ $this->channel ][ 'y' ] ) ) ):
            $yMin = 0;
            $yMax = 0;
        else :
            $yMin = -4;
            $yMax = 4;
        endif;

        for( $y = $yMin; $y <= $yMax; $y = $y + 1 ):
            // Don't do anything with y if we are saving an image
            if( $outputfile ):
                $y = 0;
            endif;

            imagecopy(
                $this->dest,
                $this->src,
                0,
                0,
                $sizeData[ 'x' ][ $digits ][ $digit ],
                $sizeData[ 'y' ][ 'bottom' ] + $y,
                $sizeData[ 'size' ][ 'width' ],
                $sizeData[ 'size' ][ 'height' ]
            );

            if( $outputfile ) :
                imagejpeg( $this->dest, $outputfile );
                return true;
            endif;

            $hash = $this->imageHashes->getImageHash( $this->dest );
            $match = $this->imageHashes->findMatch( $hash );

            if( !$match ):
                $match = $this->imageHashes->findClosestMatch( $hash );
            endif;

            if( !$bestDigitMatch || $match->distance < $bestDigitMatch->distance ):
                $bestDigitMatch = ( object ) array_merge(
                    ( array ) $match,
                    array(
                        'y' => $y
                    )
                );
            endif;

            // If we find something that's a perfect match, we won't find anything better
            if( $bestDigitMatch->distance == 0 ):
                break;
            endif;
        endfor;

        return $bestDigitMatch;
    }
}
