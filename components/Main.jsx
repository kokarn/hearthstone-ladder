import React from 'react';
import RankTable from './RankTable';
import Filter from './Filter';

class MainWrapper extends React.Component {
    constructor( props ){
        super( props );

        this.state = {
            playerText: ''
        };

        this.handlePlayerChange = this.handlePlayerChange.bind( this );
    }

    handlePlayerChange( playerText ){
        let lowercasePlayerText = playerText.toLowerCase();

        this.setState({
            playerText: lowercasePlayerText
        });
    }

    render(){
        return (
            <div>
                <h1
                    style = { {
                        fontFamily: 'Roboto, serif',
                        fontSize: 24,
                        fontWeight: 400,
                        margin: '0px auto 30px auto',
                        maxWidth: 1024,
                        paddingTop: 16,
                        textAlign: 'center'
                    } }
                >
                    Hearthstone legend ladder ranks
                </h1>
                <Filter
                    handlePlayerChange = { this.handlePlayerChange }
                />
                <RankTable
                    playerName = { this.state.playerText }
                />
            </div>
        );
    }
}

MainWrapper.displayName = 'MainWrapper';

export default MainWrapper;
