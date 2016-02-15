import React from 'react';
import RankTable from './RankTable';
import Filter from './Filter';

import Paper from 'material-ui/lib/paper';

class MainWrapper extends React.Component {
    constructor( props ){
        super( props );

        this.state = {
            playerText: ''
        };

        this.handlePlayerChange = this.handlePlayerChange.bind( this );

        this.wrapperStyle = {
            backgroundImage: 'url( img/bgheader.png )',
            backgroundRepeat: 'repeat-x',
            margin: '-10px auto 0 auto',
            maxWidth: '1024px',
            paddingBottom: '30px',
            paddingLeft: '20px',
            paddingRight: '20px'
        };
    }

    handlePlayerChange( playerText ){
        let lowercasePlayerText = playerText.toLowerCase();

        this.setState({
            playerText: lowercasePlayerText
        });
    }

    render(){
        return (
            <Paper
                rounded = { false }
                style = { this.wrapperStyle }
                zDepth = { 2 }
            >
                <img
                    alt = ""
                    src = "img/diamonds.png"
                    style = { {
                        left: '50%',
                        maxWidth: '100%',
                        position: 'absolute',
                        transform: 'translate( -50%, 0 )'
                    } }
                />
                <h1
                    style = { {
                        margin: '0px auto 30px auto',
                        maxWidth: 1024,
                        paddingTop: 56,
                        textAlign: 'center'
                    } }
                >
                    <img
                        alt = "Hearthstone legend ladder ranks"
                        src = "img/logo.png"
                        style = { {
                            maxWidth: '100%',
                            position: 'relative'
                        } }
                    />
                </h1>
                <Filter
                    onPlayerChange = { this.handlePlayerChange }
                />
                <RankTable
                    playerName = { this.state.playerText }
                />
            </Paper>
        );
    }
}

MainWrapper.displayName = 'MainWrapper';

export default MainWrapper;
