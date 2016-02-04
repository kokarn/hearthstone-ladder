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
    }

    gotFieldChange( event ){
        this.updateValue( event.target.value );
    }

    updateValue( value ){
        this.setState({
            value: value
        });

        this.props.handlePlayerChange( value );
    }

    render(){
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
                    onChange = { this.gotFieldChange.bind( this ) }
                    ref = "player"
                    value = { this.state.value }
                />
                <IconButton
                    onClick = { this.updateValue.bind( this, '' ) }
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
            </div>
        );
    }
}

Filter.displayName = 'Filter';
Filter.propTypes = {
    handlePlayerChange: React.PropTypes.func.isRequired
};

export default Filter;
