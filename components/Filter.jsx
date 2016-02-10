import React from 'react';

import TextField from 'material-ui/lib/text-field';
import IconButton from 'material-ui/lib/icon-button';
import FontIcon from 'material-ui/lib/font-icon';

class Filter extends React.Component {
    constructor( props ){
        super( props );

        this.state = {
            value: ''
        };

        this.handleClearValue = this.handleClearValue.bind( this );
        this.handleGotFieldChange = this.handleGotFieldChange.bind( this );
    }

    handleGotFieldChange( event ){
        this.updateValue( event.target.value );
    }

    handleClearValue(){
        this.updateValue( '' );
    }

    updateValue( value ){
        this.setState({
            value: value
        });

        this.props.onPlayerChange( value );
    }

    render(){
        let clearButton = false;
        if( this.state.value !== '' ){
            clearButton = (
                <IconButton
                    onClick = { this.handleClearValue }
                    style = { {
                        bottom: 0,
                        position: 'absolute',
                        right: -12
                    } }
                    title = "Clear filter"
                >
                    <FontIcon
                        className = "material-icons"
                    >
                        clear
                    </FontIcon>
                </IconButton>
            );
        }

        return (
            <div
                style = { {
                    margin: '0 auto',
                    maxWidth: 1024,
                    position: 'relative',
                    textAlign: 'center'
                } }
            >
                <TextField
                    floatingLabelText = "Search player"
                    fullWidth
                    hintText = "Channel or player name"
                    onChange = { this.handleGotFieldChange }
                    ref = "player"
                    value = { this.state.value }
                />
                { clearButton }
            </div>
        );
    }
}

Filter.displayName = 'Filter';
Filter.propTypes = {
    onPlayerChange: React.PropTypes.func.isRequired
};

export default Filter;
