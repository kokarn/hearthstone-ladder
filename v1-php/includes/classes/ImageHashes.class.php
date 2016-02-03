<?php
class ImageHashes {
    private $indexFilename;

    public function __construct(){
        $this->hashes = array();
        $this->indexFilename = __DIR__ . '/../../hash-index.json';
    }

    public function buildIndex(){
        foreach( glob( 'comparisons/*.jpg' ) as $comparisonImage ):
            $hash = $this->getImageHash( $comparisonImage );
            $comparisonImage = str_replace( 'comparisons/', '', $comparisonImage );
            list( $digits, $index, $digit ) = explode( '-', substr( $comparisonImage, 0, 5 ) );
            if( isset( $this->hashes[ $hash ] ) ):
                echo 'HASH COLLISION<br>';
                echo $comparisonImage, ' collided with ', $this->hashes[ $hash ][ 'fromImage' ], '<br>';
                continue;
            endif;

            $this->hashes[ $hash ] = array(
                'digit' => $digit,
                'fromImage' => $comparisonImage
            );
        endforeach;

        $file = fopen( $this->indexFilename, 'w' );
        fwrite( $file, json_encode( $this->hashes, JSON_PRETTY_PRINT ) );
        fclose( $file );
    }

    public function hammingDistance( $string1, $string2 ){
        $res = array_diff_assoc( str_split( $string1 ), str_split( $string2 ) );
        return count( $res );
    }

    public function loadFromIndex(){
        if( !is_file( $this->indexFilename ) ):
            return false;
        endif;

        $file = fopen( $this->indexFilename, 'r' );
        $data = fread( $file, filesize( $this->indexFilename ) );
        fclose( $file );

        $this->hashes = (array)json_decode( $data );
    }

    public function getImageHash( $image ){
        # Algorithm found here: http://www.hackerfactor.com/blog/index.php?/archives/432-Looks-Like-It.html
        if( is_string( $image ) ):
            list( $width, $height ) = getimagesize( $image );
            $img = imagecreatefromjpeg( $image );
        else :
            $height = imagesy( $image );
            $width = imagesx( $image );
            $img = $image;
        endif;

        $new_img = imagecreatetruecolor( 8, 8 );
        imagecopyresampled( $new_img, $img, 0, 0, 0, 0, 8, 8, $width, $height );
        imagefilter( $new_img, IMG_FILTER_GRAYSCALE );
        $colors = array();
        $sum = 0;

        for ($i = 0; $i < 8; $i++) {
            for ($j = 0; $j < 8; $j++) {
                $color = imagecolorat($new_img, $i, $j) & 0xff;
                $sum += $color;
                $colors[] = $color;
            }
        }

        $avg = $sum / 64;
        $hash = '';
        $curr = '';
        $count = 0;

        foreach ($colors as $color) {
            if ($color > $avg) {
                $curr .= '1';
            } else {
                $curr .= '0';
            }
            $count++;
            if (!($count % 4)) {
                $hash .= dechex(bindec($curr));
                $curr = '';
            }
        }

        return $hash;
    }

    public function findMatch( $hash ){
        if( isset( $this->hashes[ $hash ] ) ):
            return ( object ) array_merge(
                ( array ) $this->hashes[ $hash ],
                array(
                    'distance' => 0
                )
            );
        endif;

        return false;
    }

    public function findClosestMatch( $hash ){
        $currentBest = false;
        $bestDistance = 1000;

        foreach( $this->hashes as $storedHash => $data ):
            $distance = $this->hammingDistance( $hash, $storedHash );

            if( $currentBest === false || ( $currentBest && ( $distance < $bestDistance ) ) ):
                $bestDistance = $distance;
                $currentBest = $storedHash;
            endif;
        endforeach;

        if( !$currentBest ):
            return false;
        endif;

        return ( object ) array_merge(
            ( array ) $this->hashes[ $currentBest ],
            array(
                'distance' => $bestDistance
            )
        );
    }
}
