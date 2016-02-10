import React from 'react';
import xhr from 'xhr';
import { LineTooltip } from 'react-d3-tooltip';
import SimpleTooltip from './RankChartTooltip';

/*
import { Yaxis, Ygrid } from 'react-d3-core';
import { Line, Chart } from 'react-d3-shape';
*/

import TableRow from 'material-ui/lib/table/table-row';
import TableRowColumn from 'material-ui/lib/table/table-row-column';
import LinearProgress from 'material-ui/lib/linear-progress';
import Paper from 'material-ui/lib/paper';


class RankChart extends React.Component {
    constructor( props ){
        super( props );

        this.state = {
            width: props.componentWidth - 20,
            margins: {
                top: 25,
                bottom: 20,
                left: 50,
                right: 50
            },
            title: 'Legend rank',
            chartSeries: [
                {
                    field: 'rank',
                    color: '#ff7f0e'
                }
            ],
            chartData: []
        }

        if( props.componentWidth <= 768 ){
            this.state.height = 150;
        } else {
            this.state.height = 250;

        }
    }

    componentWillReceiveProps( nextProps ){
        if( nextProps.componentWidth <= 768 ){
            this.setState({
                height: 150,
                width: nextProps.componentWidth - 20
            });
        } else {
            this.setState({
                height: 250,
                width: nextProps.componentWidth - 20
            });
        }

    }

    loadChannelData(){
        xhr({
            uri: 'data/' + this.props.channel,
            headers: {
                'Content-Type': 'application/json'
            },
            json: true
        }, ( error, response, body ) => {
            let yMax = 0;
            let lastRank = 0;
            for( let i = body.length - 1; i >= 0; i = i - 1 ){

                // Don't keep duplicate rank matches
                if( lastRank === body[ i ].rank ){
                    body.splice( i, 1 );
                    continue;
                }

                if( Number( body[ i ].rank ) > yMax ){
                    yMax = Number( body[ i ].rank );
                }

                lastRank = body[ i ].rank;
            }

            body.map(( currentObject, index ) => {
                body[ index ].index = index;
            });

            this.setState({
                chartData: body,
                yDomain: [ yMax, 0 ]
            });
        });
    }

    x( dataPoint ){
        return dataPoint.index;
    }

    render(){
        let colspan = 5;

        if( this.props.componentWidth <= 768 ){
            colspan = 4;
        }

        if( !this.props.show ){
            return (
                <TableRow
                    style = { {
                        display: 'none'
                    } }
                />
            );
        }

        if( this.state.chartData.length <= 0 ){
            this.loadChannelData();
            return (
                <TableRow>
                    <TableRowColumn
                        colSpan = { colspan }
                    >
                        <LinearProgress
                            mode = "indeterminate"
                        />
                    </TableRowColumn>
                </TableRow>
            );
        }

        if( this.state.chartData.length === 1 ){
            return (
                <TableRow>
                    <TableRowColumn
                        colSpan = { colspan }
                    >
                        Not enough data
                    </TableRowColumn>
                </TableRow>
            );
        }

        /*
        <Chart
            chartSeries = { this.state.chartSeries }
            data = { this.state.chartData }
            height = { this.state.height }
            margins = { this.state.margins }
            title = { this.state.title }
            width = { this.state.width }
            x = { this.x }
            yDomain = { this.state.yDomain }
        >
            <Line
                chartSeries = { this.state.chartSeries }
            />
            <Ygrid />
            <Yaxis />
        </Chart>

        */

        return (
            <TableRow>
                <TableRowColumn
                    colSpan = { colspan }
                >
                    <Paper
                        rounded = { false }
                        style = { {
                            marginBottom: '20px',
                            marginTop: '20px'
                        } }
                        zDepth = { 1 }
                    >
                        <LineTooltip
                            chartSeries = { this.state.chartSeries }
                            data = { this.state.chartData }
                            height = { this.state.height }
                            margins = { this.state.margins }
                            showXAxis = { false }
                            showXGrid = { false }
                            showYGrid
                            title = { this.state.title }
                            width = { this.state.width }
                            x = { this.x }
                            yDomain = { this.state.yDomain }
                        >
                            <SimpleTooltip
                                dataset = { this.state.chartData }
                            />
                        </LineTooltip>
                    </Paper>
                </TableRowColumn>
            </TableRow>
        )
    }
}

RankChart.displayName = 'RankChart';
RankChart.propTypes = {
    channel: React.PropTypes.string.isRequired,
    componentWidth: React.PropTypes.number.isRequired,
    show: React.PropTypes.bool.isRequired
}

export default RankChart;
