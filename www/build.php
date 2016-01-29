<?php
include( 'includes/default.php' );

foreach( glob( 'comparisons/*.jpg' ) as $file ):
    if( is_file( $file ) ) :
        unlink( $file );
    endif;
endforeach;

$wantedImages = array();
for( $x = 1; $x <= 4; $x = $x + 1 ):
    for( $i = 1; $i <= $x; $i = $i + 1 ):
        for( $y = 0; $y <= 9; $y = $y + 1 ):

            // There is no starting 0
            if( $i == 1 && $y == 0 ):
                continue;
            endif;

            $wantedImages[] = $x . '-' . $i . '-' . $y;
        endfor;
    endfor;
endfor;

foreach( glob( 'input/*.jpg' ) as $inputFile ):
    $fileData = file_get_contents( $inputFile );
    $imageDigits = new ImageDigits( $fileData );

    $filename = substr( $inputFile, 6 );
    $filename = substr( $filename, 0, strlen( $filename ) - 4 );
    $digits = str_split( $filename );
    $digitCount = count( $digits );
    $collisions = 0;

    foreach( $digits as $index => $digit ):
        $digitNumber = $index + 1;
        $imageName = $digitCount . '-' . $digitNumber . '-' . $digit;
        $newFilename = 'comparisons/' . $imageName . '.jpg';

        if( file_exists( $newFilename ) ):
            $collisions = $collisions + 1;
            continue;
        endif;

        unset( $wantedImages[ array_search( $imageName, $wantedImages ) ] );

        $imageDigits->getDigit( $digitCount, $digitNumber, $newFilename );
    endforeach;

    if( $collisions == $digitCount ):
        echo 'Delete file ', $inputFile, '. No digits added<br>';
    endif;
endforeach;
echo '<pre>';
    print_r( array_values( $wantedImages ) );
echo '</pre>';

$imageHashes = new ImageHashes();
$imageHashes->buildIndex();
exit;
