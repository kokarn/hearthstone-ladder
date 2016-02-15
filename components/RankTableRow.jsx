import React from 'react';
import Time from 'react-time';

import TableRow from 'material-ui/lib/table/table-row';
import TableRowColumn from 'material-ui/lib/table/table-row-column';
import IconButton from 'material-ui/lib/icon-button';
import FontIcon from 'material-ui/lib/font-icon';
import Colors from 'material-ui/lib/styles/colors';

class RankTableRow extends React.Component {
    constructor( props, context ){
        super( props, context );

        this.state = {
            muiTheme: this.context.muiTheme,
            showingGraph: false
        };

        this.handleToggleGraphClick = this.handleToggleGraphClick.bind( this );
    }

    getChildContext(){
        return {
            muiTheme: this.state.muiTheme
        }
    }

    componentWillMount(){
        let newMuiTheme = this.state.muiTheme;
        newMuiTheme.tableRow.stripeColor = '#F9F9F9';

        this.setState({
            muiTheme: newMuiTheme
        });
    }

    handleToggleGraphClick(){
        this.props.onToggleGraphClick( this.props.channel );

        this.setState({
            showingGraph: !this.state.showingGraph
        });
    }

    render() {
        let wasDate = new Date( this.props.timestamp );
        let channelName = this.props.channel;
        let channelLink = 'http://twitch.tv/' + this.props.channel;
        let icon;
        let hoverColor = '#ff7f0e';
        let color = '#000000';

        if( this.props.name.length > 0 ){
            channelName = this.props.name;
        }

        let statusNode = (
            <TableRowColumn>
                { this.props.status }
            </TableRowColumn>
        );

        let columnStyles = {
            rank: {
                textOverflow: 'clip',
                width: '10px'
            },
            name: {
                width: '17%'
            },
            age: {
                width: '17%'
            },
            graph: {
                textAlign: 'right',
                width: '11%'
            }
        };

        let iconStyle = {
            left: '12px',
            position: 'relative'
        };

        let liveIcon = (
            <FontIcon
                className = "material-icons"
                style = { {
                    color: Colors.green500,
                    fontSize: '14px',
                    left: '7px',
                    top: '3px'
                } }
            >
                { 'play_circle_outline' }
            </FontIcon>
        );

        if( this.props.componentWidth <= 748 ){
            statusNode = false;

            // Delete all special width settings
            delete columnStyles.name.width;
            delete columnStyles.age.width;

            columnStyles.graph.width = '32px';

            // Switch the icon position to align with the header
            iconStyle.left = '-4px';

            columnStyles.rank.paddingLeft = '12px';
            columnStyles.rank.paddingRight = '12px';

            columnStyles.name.paddingLeft = '12px';
            columnStyles.name.paddingRight = '12px';

            columnStyles.age.paddingLeft = '12px';
            columnStyles.age.paddingRight = '12px';

            columnStyles.graph.paddingLeft = '12px';
            columnStyles.graph.paddingRight = '12px';
        }

        if( this.props.matchCount < 2 ){
            icon = (
                <IconButton
                    disabled
                    onClick = { this.handleToggleGraphClick }
                    style = { iconStyle }
                >
                    <FontIcon
                        className = "material-icons"
                    >
                        { 'timeline' }
                    </FontIcon>
                </IconButton>
            );
        } else {
            if( this.state.showingGraph ){
                color = hoverColor;
                hoverColor = '#ba5e0d'
            }

            icon = (
                <IconButton
                    onClick = { this.handleToggleGraphClick }
                    style = { iconStyle }
                >
                    <FontIcon
                        className = "material-icons"
                        color = { color }
                        hoverColor = { hoverColor }
                    >
                        { 'timeline' }
                    </FontIcon>
                </IconButton>
            );
        }

        if( this.props.live < 1 ){
            liveIcon = false;
        }

        return (
            <TableRow
                hoverable
                striped = { this.props.customStriped }
            >
                <TableRowColumn
                    style = { columnStyles.rank }
                >
                    { this.props.rank }
                </TableRowColumn>
                <TableRowColumn
                    style = { columnStyles.name }
                >
                    <a
                        href = { channelLink }
                        style = { {
                            color: Colors.blueGrey500
                        } }
                    >
                        { channelName }
                        { liveIcon }
                    </a>
                </TableRowColumn>
                <TableRowColumn
                    style = { columnStyles.age }
                >
                    <Time
                        relative
                        titleFormat = "YYYY/MM/DD HH:mm"
                        value = { wasDate }
                    />
                </TableRowColumn>
                { statusNode }
                <TableRowColumn
                    style = { columnStyles.graph }
                >
                    { icon }
                </TableRowColumn>
            </TableRow>
        );
    }
}

RankTableRow.contextTypes = {
    muiTheme: React.PropTypes.object
};

RankTableRow.childContextTypes = {
    muiTheme: React.PropTypes.object
};

RankTableRow.displayName = 'RankTableRow';

RankTableRow.propTypes = {
    channel: React.PropTypes.string.isRequired,
    componentWidth: React.PropTypes.number.isRequired,
    customStriped: React.PropTypes.bool.isRequired,
    id: React.PropTypes.number.isRequired,
    live: React.PropTypes.number.isRequired,
    matchCount: React.PropTypes.number.isRequired,
    name: React.PropTypes.string.isRequired,
    onToggleGraphClick: React.PropTypes.func.isRequired,
    rank: React.PropTypes.number.isRequired,
    status: React.PropTypes.string.isRequired,
    timestamp: React.PropTypes.string.isRequired
};

export default RankTableRow;
