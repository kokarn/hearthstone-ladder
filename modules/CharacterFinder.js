var Canvas = require( 'canvas' );
var Image = Canvas.Image;
var fs = require( 'fs' );
var http = require( 'http' );
var Stream = require( 'stream' ).Transform;
var verb = require( '../node_modules/verb-nurbs/build/js/verb.js' );
//var verb = require( 'verb-nurbs' );

var CharacterFinder = function( filePath ){
    var _this = this;
    this.onCompleteCallbacks = [];
    this.filePath = filePath;

    // Width & height of match area
    this.width = 270;
    this.height = 105;

    // What ypos to start the image. 0 is bottom
    this.ypos = 205;

    // What color to try to find
    this.setColor({
        r: 219,
        g: 204,
        b: 122,
        a: 1
    });

    console.log( 'Loading ', filePath );

    // This doesn't work for some reason, callstack get's exceeded
    // Loading local files work
    var request = http.request( filePath, function( response ){
        var data = new Stream();

        if( response.statusCode !== 200 ){
            console.log( 'Unable to load file', filePath, ' Its probably not online anymore' );
            for( var i = 0, l = _this.onCompleteCallbacks.length; i < l; i++){
                _this.onCompleteCallbacks[ i ].bind( _this )( _this.filePath, false );
            }
            return false;
        }

        response.on( 'data', function( chunk ){
            data.push( chunk );
        });

        response.on( 'end', function() {
            _this.setImg( data.read() );

            data = null;
        });
    });

    request.on( 'error', ( error ) => {
        console.log( `problem with request: ${error.message}` );
    });

    request.end();

    return true;
    fs.readFile( filePath, function( error, imageData ) {
        if ( error ) {
            throw error;
        }

        _this.setImg( imageData );
        imageData = null;
    });
};

CharacterFinder.prototype.setImg = function( inputImageData ){
    this.img = new Image;
    this.img.src = inputImageData;

    inputImageData = null;

    this.canvas = new Canvas( this.width, this.height );
    this.context = this.canvas.getContext( '2d' );

    this.onImgLoad();
};

CharacterFinder.prototype.setColor = function( colorObjet ){
    this.color = colorObjet;
};

CharacterFinder.prototype.onImgLoad = function(){

    var correct = 0;
    var numberShapes = [];
    var resultingNumbers = [];
    var validShapes = [];

    this.context.drawImage( this.img, 0, this.img.height - this.ypos, this.width, this.height, 0, 0, this.width, this.height );

    var tracedShapes = this.traceAll( this.color );

    for(var i = 0, l = tracedShapes.length; i < l; i++ ){
        if( tracedShapes[ i ].length < 90 || tracedShapes[ i ].length > 420 ){
            this.drawPixels( this.context, tracedShapes[ i ], '#000' );
        } else {
            numberShapes.push( tracedShapes[ i ] );
        }
    }

    this.context.drawImage( this.img, 0, this.img.height - this.ypos, this.width, this.height, 0, 0, this.width, this.height );

    for( var i = 0, l = numberShapes.length; i < l; i++ ){

        var boundaries = findBoundaries( numberShapes[ i ] );

        if(
            boundaries.ymin !== 0 &&
            boundaries.xmax - boundaries.xmin < 25 &&
            boundaries.ymax - boundaries.ymin > 20 &&
            ( boundaries.ymax - boundaries.ymin ) / ( boundaries.xmax - boundaries.xmin ) >= 0.95 &&
            ( boundaries.ymax - boundaries.ymin ) / ( boundaries.xmax - boundaries.xmin ) < 1.9 &&
            ( boundaries.ymax - boundaries.ymin ) > 15 &&
            boundaries.xmax < this.width - 1 &&
            boundaries.ymax < this.height - 1
        ){
            validShapes.push( i );
            this.drawRect( boundaries.xmin - 2, boundaries.ymin - 2, boundaries.xmax + 2, boundaries.ymax + 2, '#f00' );
            correct = correct + 1;

            this.drawPixels( numberShapes[ i ], '#0f0' );

            var bestAnswer = null;
            var bestAnswerValue = null;

            var canvasData = this.context.getImageData( 0, 0, this.width, this.height ).data;
            for( var j = 0; j < 10; j++ ){
                var sum = 0;

                var curve = getNumberAsNurb( j, boundaries.xmin + 1 , boundaries.ymin + 1, boundaries.xmax - boundaries.xmin - 2, boundaries.ymax - boundaries.ymin - 2 );

                for(var k = 0, len = curve.length; k < len; k++ ){

                    var pixelColor = this.getPixelColor( Math.round(curve[ k ].x), Math.round(curve[ k ].y), canvasData );

                    sum += colorDiff( pixelColor, {
                        r: 0,
                        g: 255,
                        b: 0
                    } ) / 255;
                }

                if(
                    ( bestAnswer == null || bestAnswerValue > sum ) && sum < 6.2
                    || ( bestAnswer === 5 && sum - bestAnswerValue < 1.2 )
                ){
                    bestAnswer = j;
                    bestAnswerValue = sum;
                }

                // We can't find a better match
                if( bestAnswerValue === 0 ){
                    break;
                }
            }

            // Add special case matching for number area sizes
            if( bestAnswer === 1 && numberShapes[ i ].length < 110 ){
                continue;
            } else if( bestAnswer === 2 && boundaries.ymax - boundaries.ymin < 20 ){
                continue;
            } else if( bestAnswer === 3 && ( numberShapes[ i ].length < 150 || boundaries.ymax - boundaries.ymin < 20 ) ){
                continue;
            } else if( bestAnswer === 4 && ( numberShapes[ i ].length < 155 || boundaries.ymax - boundaries.ymin < 21 || numberShapes[ i ].length > 290 ) ){
                continue;
            } else if( bestAnswer === 5 && ( numberShapes[ i ].length < 170 || boundaries.ymax - boundaries.ymin < 22 ) ){
                continue;
            } else if( bestAnswer === 6 && numberShapes[ i ].length < 160 ){
                continue;
            } else if( bestAnswer === 7 && ( numberShapes[ i ].length < 140 || boundaries.ymax - boundaries.ymin < 22 ) ){
                continue;
            } else if( bestAnswer === 8 && numberShapes[ i ].length > 420 ){
                continue;
            }

            // Make sure the current bounding box is close enough to the last one
            if( resultingNumbers.length > 0 ){
                var previousBoundaries = findBoundaries( numberShapes[ validShapes[ validShapes.length - 2 ] ] );
                if( boundaries.xmin - previousBoundaries.xmax > 11 ){
                    continue;
                }

                if( Math.abs( previousBoundaries.ymax - boundaries.ymax ) > 11 ){
                    continue;
                }
            }

            if( bestAnswer !== null ){
                resultingNumbers.push( bestAnswer );
                this.drawPixels( getNumberAsNurb( bestAnswer, boundaries.xmin + 1 , boundaries.ymin + 1, boundaries.xmax - boundaries.xmin - 2, boundaries.ymax - boundaries.ymin - 2 ), '#00f' );
            }
        }
    }

    if( resultingNumbers.length === 0 ){
        // Fallback to false if we match nothing
        resultingNumbers = false;
    } else if( resultingNumbers.length !== validShapes.length ){
        // Fallback to false if we don't match all the numbers we should
        resultingNumbers = false;
    } else if( resultingNumbers.length === 1 && resultingNumbers[ 0 ] === 1 ){
        // It's too hard to match a single one, skip that for now
        resultingNumbers = false;
    } else if( resultingNumbers[ 0 ] === 0 ){
        // If the first number is a zero, somethings up
        resultingNumbers = false;
    }

    for( var i = 0, l = this.onCompleteCallbacks.length; i < l; i++){
        if( resultingNumbers ){
            this.onCompleteCallbacks[ i ].bind( this )( this.filePath, parseInt(resultingNumbers.join('')) );
        } else {
            this.onCompleteCallbacks[ i ].bind( this )( this.filePath, resultingNumbers );
        }
    }
}

CharacterFinder.prototype.saveMatchImage = function( filename ){
    if( !this.canvas ){
        return false;
    }

    var base64Data = this.canvas.toDataURL().replace( /^data:image\/png;base64,/, '' );

    fs.writeFile( filename, base64Data, 'base64', function( error ){
        if( error ){
            throw new Error( error );
        }
    });
};

/*
CharacterFinder.prototype.contrast = function(){
    var self = this;

    var canvasData = this.context.getImageData( 0, 0, this.width, this.height ).data;

    this.onPixels( function( x, y, r, g, b, a ){
        if( intensity( r, g, b ) < self.contrastLimit ){
            self.drawPixel( x, y, '#000' );
        } else if( intensity( r, g, b ) > self.contrastLimit ){
            self.drawPixel( x, y, '#FFF' );
        }
    }, canvasData );
};
*/

CharacterFinder.prototype.drawPixel = function( x, y, color ){
    this.context.fillStyle = color || '#FFF';
    this.context.fillRect(x,y,1,1);
}

CharacterFinder.prototype.traceAll = function( byColor ){
    var tracedShapes = [];
    var traceIndex = [];
    var value = byColor;

    var canvasData = this.context.getImageData( 0, 0, this.width, this.height ).data;

    this.onPixels( ( function( x, y ){
        var tracedShape = this.traceArea( x, y, value, traceIndex, byColor, canvasData );

        if( tracedShape.length ){
            tracedShapes.push( tracedShape );
        }
    }).bind( this ), canvasData );


    return tracedShapes;
}

CharacterFinder.prototype.traceArea = function ( startx, starty, value, index, byColor, canvasData ){
    var traceIndex = index || [];
    return this.traceAreaStepColor( startx, starty, value, traceIndex, canvasData );
}

CharacterFinder.prototype.traceAreaStepColor = function( startx, starty, color, index, canvasData ){

    var result = [];

    if(
        colorDiff( color, this.getPixelColor( startx, starty, canvasData ) ) < 50 &&
        index.indexOf( startx + ',' + starty ) === -1 &&
        index.length < 2000
    ){
        index.push( startx + ',' + starty );

        result.push( {
            x: startx,
            y: starty
        } );

        if( index.indexOf( ( startx + 1 ) + ',' + ( starty ) ) === -1 ){
            result = result.concat( this.traceAreaStepColor( startx + 1, starty, color, index, canvasData ) );
        }

        if( result.length > 420 ){
            return result;
        }

        if( index.indexOf( ( startx ) + ',' + ( starty + 1 ) ) === -1 ){
            result = result.concat( this.traceAreaStepColor( startx, starty + 1, color, index, canvasData ) );
        }

        if( result.length > 420 ){
            return result;
        }

        if( index.indexOf( ( startx - 1 ) + ',' + ( starty ) ) === -1 ){
            result = result.concat( this.traceAreaStepColor( startx - 1, starty, color, index, canvasData ) );
        }

        if( result.length > 420 ){
            return result;
        }

        if( index.indexOf( ( startx ) + ',' + ( starty - 1 ) ) === -1 ){
            result = result.concat( this.traceAreaStepColor( startx, starty - 1, color, index, canvasData ) );
        }
    }

    return result;
}

CharacterFinder.prototype.onPixels = function( fn, data ){
    for(var x = 0; x < this.width; x++) {
        for(var y = 0; y < this.height; y++) {
            var red = data[((this.width * y) + x) * 4];
            var green = data[((this.width * y) + x) * 4 + 1];
            var blue = data[((this.width * y) + x) * 4 + 2];
            var alpha = data[((this.width * y) + x) * 4 + 3];

            fn( x, y, red, green, blue, alpha );
        }
    }
}

CharacterFinder.prototype.getPixelColor = function( x, y, data ){
    var returnData = {
        r: data[ ( ( this.canvas.width * y ) + x ) * 4 ],
        g: data[ ( ( this.canvas.width * y ) + x ) * 4 + 1 ],
        b: data[ ( ( this.canvas.width * y ) + x ) * 4 + 2 ],
        a: data[ ( ( this.canvas.width * y ) + x ) * 4 + 3 ]
    };

    return returnData;
}

CharacterFinder.prototype.drawPixel = function( x, y, color ){
    this.context.fillStyle = color || '#FFF';
    this.context.fillRect( x, y, 1, 1 );
}

CharacterFinder.prototype.drawPixels = function( arr, color ){
    for( var i = 0, l = arr.length; i < l; i++ ){
        this.drawPixel( arr[ i ].x, arr[ i ].y, color || '#FFF' );
    }
}

CharacterFinder.prototype.drawRect = function( x1, y1, x2, y2, color ){
    color = color || '#f00';

    this.context.strokeStyle = color;

    this.context.strokeRect( x1, y1, x2 - x1, y2 - y1 );
}

/*
CharacterFinder.prototype.getPixelIntensity = function( x, y ){
    var color = this.getPixelColor( x, y );
    return intensity( color.r, color.g, color.b );
}
*/

/*
CharacterFinder.prototype.diff = function( refcanvas ){
    var sum = 0;
    var num = 0;

    this.onPixels( function( x, y, r, g, b, a ){
        var refcolor = this.getPixelColor( x, y, refcanvas );
        sum += ( intensity( r, g, b ) == intensity( refcolor.r, refcolor.g, refcolor.b ) ) ? 0 : 1;
        //sum += colorDiff( {r:r,g:g,b:b}, refcolor );
        num++;
    });

    return sum;
}
*/

CharacterFinder.prototype.onComplete = function( fn ){
    this.onCompleteCallbacks.push( fn );
}

// Helper functions
function intensity( r, g, b ){
    return Math.sqrt( ( r * r + g * g + b * b ) / 3 );
}

function colorDiff( c1, c2 ){
    return Math.sqrt(
        (
            Math.pow( c1.r - c2.r, 2 ) +
            Math.pow( c1.g - c2.g, 2 ) +
            Math.pow( c1.b - c2.b, 2 )
        ) / 3
    );
}

function findBoundaries( shape ){
    var ret = {
        xmin: shape[0].x,
        xmax: shape[0].x,
        ymin: shape[0].y,
        ymax: shape[0].y
    };

    for(var i = 1, l = shape.length; i < l; i++){
        ret.xmin = Math.min( ret.xmin, shape[i].x );
        ret.xmax = Math.max( ret.xmax, shape[i].x );
        ret.ymin = Math.min( ret.ymin, shape[i].y );
        ret.ymax = Math.max( ret.ymax, shape[i].y );
    }

    // Compensate bounding box for narrow 1's, since they match too many numbers.
    if( (ret.xmax - ret.xmin) / ( ret.ymax - ret.ymin ) < 0.5 ){
        ret.xmax = ret.xmax + 4;
        ret.xmin = ret.xmin - 4;
    }

    return ret;
}

function nurbPlotToXY( arr, sx, sy ){
    var ret = [];
    sx = sx || 0;
    sy = sy || 0;


    for( var i = 0, l = arr.length; i < l; i++ ){
        ret.push({
            x: arr[ i ][ 0 ] + sx,
            y: arr[ i ][ 1 ] + sy
        });
    }

    return ret;
}

function getNumberAsNurb( n, sx, sy, width, height ){

    var interpCurve = getNumCurve( n, width, height );

    return nurbPlotToXY( verb.eval.Tess.rationalCurveRegularSample(interpCurve.asNurbs(), 100, false), sx, sy );

}

function getNumCurve( n, w, h ){

    w = w || 10;
    h = h || 10;

    var numbers = [

        // 0
        [
            [ 3, 0 ],
            [ 9, 5 ],
            [ 7, 10 ],
            [ 1, 5 ],
            [ 4, 0 ]
        ],

        //1
        [
            [ 4, 0 ],
            [ 5, 2.5 ],
            [ 5, 5 ],
            [ 5, 7.5 ],
            [ 5, 10 ]
        ],

        //2
        [
            [ 1, 3.5 ],
            [ 3, 0 ],
            [ 8.5, 1 ],
            [ 6, 6.3 ],
            [ 2.5, 9.5 ],
            [ 3, 9.5 ],
            [ 9, 9.6 ]
        ],

        //3
        [
            [ 1, 0.5 ],
            [ 4, 0.5 ],
            [ 7.7, 0.5 ],
            [ 7.8, 0.5 ],
            [ 5, 4.4 ],
            //[ 5, 4 ],
            [ 6, 4.6],
            [ 9, 6.5 ],
            [ 1, 9.5 ]
        ],

        //4
        [
            [ 10, 7.4 ],
            [ 5, 7.4 ],
            [ 3.5, 7.4 ],
            [ 2, 7.4 ],
            [ 0.6, 7.4 ],
            [ 0.6, 7.0 ],
            [ 7.5, 2 ],
            [ 7.5, 2.5 ],
            [ 7.5, 7.5 ],
            [ 7.5, 10 ]
        ],

        //5
        [
            // [ 1, 0.5 ],
            // [ 4, 0.5 ],
            // [ 7.7, 0.5 ],
            // [ 7.8, 0.5 ],
            [ 9, 0.5 ],
            [ 3.6, 0.7 ],
            [ 3.5, 0.7 ],
            [ 1, 4.2 ],
            [ 1, 4.4 ],
            [ 5, 4.2 ],
            [ 7.2, 4.2],
            [ 9.2, 5.4 ],
            [ 1, 8.5 ]
        ],

        //6
        [
            [ 8, 0 ],
            [ 2, 1 ],
            [ 2, 8 ],
            [ 5, 10 ],
            [ 8.9, 8 ],
            [ 2, 4.5 ]
        ],

        //7
        [
            [ 0, 1 ],
            [1,1],
            [ 5, 1 ],
            [ 9, 1 ],
            [ 9, 2 ],
            [ 6.5, 5 ],
            [ 4, 10 ]
        ],

        //8
        [
            [ 5, -0.5 ],
            [ 0.5, 2.4 ],
            [ 5, 4.5 ],
            [ 9.5, 7.5 ],
            [ 5, 10 ],
            [ 0, 7.3 ],
            [ 5, 4.5 ],
            [ 9.4, 2.4 ],
            [ 5, -0.5 ]
        ],

        //9
        [



            [ 2, 10 ],
            [ 7.5, 9 ],
            [ 8, 2 ],
            [ 3, 0 ],
            [ 0.5, 2 ],
            [ 8, 5.5 ]
        ]


    ];

    var number = [];

    for( var i = 0, l = numbers[ n ].length; i < l; i++ ){
        number.push([ numbers[ n ][ i ][ 0 ] * w / 10, numbers[ n ][ i ][ 1 ] * h / 10 ]);
    }

    return verb.geom.NurbsCurve.byPoints( number, 3 );
}

module.exports = CharacterFinder;
