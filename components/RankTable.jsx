import React from 'react';
import ReactDOM from 'react-dom';
import xhr from 'xhr';
import update from 'react-addons-update';
import elementResizeEvent from 'element-resize-event';

import Table from 'material-ui/lib/table/table';
import TableBody from 'material-ui/lib/table/table-body';
import TableHeader from 'material-ui/lib/table/table-header';
import TableRow from 'material-ui/lib/table/table-row';
import TableHeaderColumn from 'material-ui/lib/table/table-header-column';

import RankChart from './RankChart';
import RankTableRow from './RankTableRow';

class RankTable extends React.Component {
    constructor( props ){
        super( props );

        this.state = {
            componentWidth: 1024,
            data: [],
            sortBy: 'rank'
        };

        this.handleToggleGraphClick = this.handleToggleGraphClick.bind( this );
    }

    componentDidMount() {
        this.loadRanksFromServer();
        this.setUpdateTimeout();

        // This is a valid use of setState in componentDidMount imo
        // see https://github.com/react-bootstrap/react-bootstrap/issues/494 for reference
        /* eslint react/no-did-mount-set-state: 0 */
        this.setState({
            componentWidth: ReactDOM.findDOMNode( this ).getBoundingClientRect().width
        });

        elementResizeEvent( ReactDOM.findDOMNode( this ), this.onResize.bind( this ));
    }

    componentDidUpdate() {
        if( ReactDOM.findDOMNode( this ).getElementsByClassName( 'resize-sensor' ).length === 0 ) {
            elementResizeEvent( ReactDOM.findDOMNode( this ), this.onResize.bind( this ));
        }
    }

    onResize() {
        this.setState({
            componentWidth: ReactDOM.findDOMNode( this ).getBoundingClientRect().width
        });
    }

    setUpdateTimeout(){
        this.updateDataTimeout = setTimeout(() => {
            this.loadRanksFromServer();
        }, 60000 );
    }

    loadRanksFromServer() {
        clearTimeout( this.updateDataTimeout );

        xhr({
            uri: 'data',
            headers: {
                'Content-Type': 'application/json'
            },
            json: true
        }, ( error, response, body ) => {
            body.sort(( a, b ) => {
                if( Number( a.rank ) > Number( b.rank )){
                    return 1;
                } else if( Number( b.rank ) > Number( a.rank )){
                    return -1;
                }

                return 0;
            });

            for( let i = 0; i < body.length; i = i + 1 ){
                if( typeof this.state.data[ i ] !== 'undefined' && this.state.data[ i ].showGraph ){
                    body[ i ].showGraph = true;
                } else {
                    body[ i ].showGraph = false;
                }
            }

            this.setState({
                data: body
            });

            this.setUpdateTimeout();
        });
    }

    handleToggleGraphClick( channel ){
        for( let i = 0; i < this.state.data.length; i = i + 1 ){
            if( this.state.data[ i ].channel === channel ){
                let updateState = {};
                updateState[ i ] = {
                    showGraph: {
                        $set: !this.state.data[ i ].showGraph
                    }
                };

                let newDataState = update( this.state.data, updateState );

                this.setState({
                    data: newDataState
                });

                break;
            }

        }
    }

    render() {
        let rankAndGraphNodes = [];
        let rankNodes = this.state.data.map(( legendRank, index ) => {
            legendRank.striped = Boolean( index % 2 );

            return (
                <RankTableRow
                    channel = { legendRank.channel }
                    componentWidth = { this.state.componentWidth }
                    customStriped = { legendRank.striped }
                    id = { legendRank.id }
                    key = { legendRank.channel + '-' + legendRank.timestamp }
                    live = { legendRank.live }
                    matchCount = { legendRank.total_matches }
                    name = { legendRank.name || '' }
                    onToggleGraphClick = { this.handleToggleGraphClick }
                    rank = { legendRank.rank }
                    status = { legendRank.status }
                    timestamp = { legendRank.timestamp }
                />
            );
        });

        for( let i = 0; i < rankNodes.length; i = i + 1 ){
            if( this.props.playerName.length > 0 ){
                let lowercaseChannel = this.state.data[ i ].channel.toLowerCase();

                if( lowercaseChannel.indexOf( this.props.playerName ) === -1 ){
                    if( this.state.data[ i ].name === null ){
                        continue;
                    }

                    let lowercaseName = this.state.data[ i ].name.toLowerCase();

                    if( lowercaseName.indexOf( this.props.playerName ) === -1 ){
                        continue;
                    }
                }
            }

            rankAndGraphNodes.push( rankNodes[ i ] );
            rankAndGraphNodes.push(
                <RankChart
                    channel = { this.state.data[ i ].channel }
                    componentWidth = { this.state.componentWidth }
                    key = { 'graph-' + this.state.data[ i ].channel }
                    show = { this.state.data[ i ].showGraph }
                />
            );
        }

        let statusNode = (
            <TableHeaderColumn>
                { 'Stream title' }
            </TableHeaderColumn>
        );

        let columnStyles = {
            rank: {
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
                width: '13%'
            }
        };

        if( this.state.componentWidth <= 748 ){
            statusNode = false;

            // Delete all special width settings
            delete columnStyles.name.width;
            delete columnStyles.age.width;

            columnStyles.graph.width = '65px';

            columnStyles.rank.paddingLeft = '12px';
            columnStyles.rank.paddingRight = '12px';

            columnStyles.name.paddingLeft = '12px';
            columnStyles.name.paddingRight = '12px';

            columnStyles.age.paddingLeft = '12px';
            columnStyles.age.paddingRight = '12px';
            columnStyles.age.left = '16px';

            columnStyles.graph.paddingLeft = '12px';
            columnStyles.graph.paddingRight = '12px';
        }

        return (
            <Table
                selectable = { false }
                style = { {
                    backgroundColor: 'transparent'
                } }
                wrapperStyle = { {
                    margin: '0 auto',
                    maxWidth: '1024px'
                } }
            >
                <TableHeader
                    adjustForCheckbox = { false }
                    displaySelectAll = { false }
                >
                    <TableRow>
                        <TableHeaderColumn
                            style = { columnStyles.rank }
                        >
                            { 'Rank' }
                        </TableHeaderColumn>
                        <TableHeaderColumn
                            style = { columnStyles.name }
                        >
                            { 'Name' }
                        </TableHeaderColumn>
                        <TableHeaderColumn
                            style = { columnStyles.age }
                        >
                            { 'Last update' }
                        </TableHeaderColumn>
                        { statusNode }
                        <TableHeaderColumn
                            style = { columnStyles.graph }
                        >
                            { 'Progression' }
                        </TableHeaderColumn>
                    </TableRow>
                </TableHeader>
                <TableBody
                    preScanRows = { false }
                >
                    { rankAndGraphNodes }
                </TableBody>
            </Table>
        );
    }
}

RankTable.displayName = 'RankTable';
RankTable.propTypes = {
    playerName: React.PropTypes.string
};

export default RankTable;
