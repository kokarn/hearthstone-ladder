<?php
class RankMatch {
    public $digits = array();
    public $channel;

    private $numberOfDigits = 0;

    private static $singleDigitDistanceLimit = 4;
    private static $doubleDigitDistanceLimit = 6;
    private static $digitDistanceLimit = 8;

    private static $digitOneCutoff = 6;
    private static $digitSevenCutoff = 7;

    public function __construct( $channel, $channelStatus = false ){
        $this->channel = $channel;
        if( $channelStatus ):
            $this->channelStatus = $channelStatus;
        endif;
    }

    public function addDigit( $digit ){
        $this->digits[] = $digit;

        $this->numberOfDigits = $this->numberOfDigits + 1;
    }

    private function getCutoffDistance(){
        if( $this->numberOfDigits <= 1 ):
            return self::$singleDigitDistanceLimit;
        elseif( $this->numberOfDigits == 2 ):
            return self::$doubleDigitDistanceLimit;
        endif;

        return self::$digitDistanceLimit;
    }

    public function isValid(){
        $numberOfSevens = 0;
        $numberOfOnes = 0;
        // If any number is bigger distance than we are confident with, it's not valid
        foreach( $this->digits as $key => $digit ):
            // No numbers start with a 0 in Hearthstone
            if( $key == 0 && $digit->digit == 0 ):
                return false;
            endif;

            if( $digit->distance >= $this->getCutoffDistance() ):
                return false;
            endif;

            // The current algorithm matches black and/or empty as the 1 we have
            // with a distance of 6 or more
            if( $digit->digit == 1 && $digit->distance >= self::$digitOneCutoff ):
                $numberOfOnes = $numberOfOnes + 1;
            endif;

            // The current algorithm also matches black and/or empty as the 7 we have
            // with a distance of 8 or more
            if( $digit->digit == 7 && $digit->distance >= self::$digitSevenCutoff ):
                $numberOfSevens = $numberOfSevens + 1;
            endif;
        endforeach;

        // Check if it's all ones
        if( $numberOfOnes == $this->numberOfDigits ):
            return false;
        endif;

        // Check if it's all sevens
        if( $numberOfSevens == $this->numberOfDigits ):
            return false;
        endif;

        // Check if it's all invalid ones and sevens
        if( $numberOfSevens + $numberOfOnes == $this->numberOfDigits ):
            return false;
        endif;

        return true;
    }

    public function getAsString(){
        $string = '';
        foreach( $this->digits as $digit ):
            $string = $string . $digit->digit;
        endforeach;

        return $string;
    }

    public function getTotalDistance(){
        $distance = 0;
        foreach( $this->digits as $digit ):
            $distance = $distance + $digit->distance;
        endforeach;

        return $distance;
    }

    private function isSameRank(){
        $query = 'SELECT rank FROM matches WHERE channel = :channel ORDER BY timestamp DESC LIMIT 1';
        $PDO = Database::$connection->prepare( $query );
        $PDO->bindValue( ':channel', $this->channel );
        $PDO->execute();

        if( $PDO->fetchColumn() == $this->getAsString() ):
            return true;
        endif;

        return false;
    }

    public function store(){
        if( !$this->isValid() ):
            return false;
        endif;

        if( $this->isSameRank() ):
            return false;
        endif;

        $query = 'INSERT INTO matches ( channel, rank, distance, status ) VALUES ( :channel, :rank, :distance, :status )';
        $PDO = Database::$connection->prepare( $query );

        $rank = $this->getAsString();
        $distance = $this->getTotalDistance();

        $PDO->bindValue( ':channel', $this->channel );
        $PDO->bindValue( ':rank', $rank );
        $PDO->bindValue( ':distance', $distance );
        $PDO->bindValue( ':status', $this->channelStatus );

        $PDO->execute();

        return Database::$connection->lastInsertId();
    }
}
