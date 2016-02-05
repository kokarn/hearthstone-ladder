'use strict';

let moment = require( 'moment' );
let Hearthstone = function(){
    this.firstSeason = moment( [ 2014, 4 ] );
};

Hearthstone.prototype.getMomentSeason = function( selectedMoment ){
    return Math.ceil( selectedMoment.diff( this.firstSeason, 'months', true ) ) + 1;
};

Hearthstone.prototype.getSeasonStartDate = function( seasonMoment ){
    let seasonMomentClone = moment( seasonMoment );
    return seasonMomentClone.startOf( 'month' ).add( 1, 'days' ).format( 'YYYY-MM-DD 00:00:00' );
};

Hearthstone.prototype.getSeasonEndDate = function( seasonMoment ){
    let seasonMomentClone = moment( seasonMoment );
    return seasonMomentClone.endOf( 'month' ).add( 1, 'days' ).format( 'YYYY-MM-DD 00:00:00' );
};

Hearthstone.prototype.getSeasonMoment = function( season ){
    return this.firstSeason.add( season - 2, 'months' );
};

Hearthstone.prototype.getCurrentSeasonMoment = function(){
    return moment();
};

Hearthstone.prototype.getCurrentSeason = function(){
    return this.getMomentSeason( moment() );
};


module.exports = new Hearthstone();
