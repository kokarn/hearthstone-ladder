import React from 'react';

import TextField from 'material-ui/lib/text-field';

class Filter extends React.Component {
    gotFieldChange(){
        this.props.handlePlayerChange( this.refs.player.getValue());
    }

    render(){
        return (
            <div
                style = { {
                    margin: '0 auto',
                    maxWidth: 1024,
                    textAlign: 'center'
                } }
            >
                <TextField
                    floatingLabelText = "Search player"
                    fullWidth
                    hintText = "Channel or player name"
                    onChange = { this.gotFieldChange.bind( this ) }
                    ref = "player"
                />
            </div>
        );
    }
}

Filter.displayName = 'Filter';
Filter.propTypes = {
    handlePlayerChange: React.PropTypes.func.isRequired
};

export default Filter;
