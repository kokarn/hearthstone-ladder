var CharacterFinder = require( './modules/CharacterFinder.js' );
var files = [
    './www/input/375.jpg',
    './www/input/628.jpg',
    './www/input/87.jpg',
    './www/input/1754.jpg'
];

for( var i = 0; i < files.length; i = i + 1 ){
    var finder = new CharacterFinder( files[ i ], 145, 60 );

    finder.onComplete(function( file, result ){
        console.log( file, result );
    });
}
