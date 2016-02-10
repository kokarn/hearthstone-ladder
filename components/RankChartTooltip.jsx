import React from 'react';
import Time from 'react-time';

class RankChartTooltip extends React.Component {
    constructor( props ) {
        super( props );
    }

    render() {
        const {
            title,
            value
        } = this.props.contentTooltip;
        let index = Number( title );
        let date = new Date( this.props.dataset[ index ].timestamp );

        return (
            <div
                className = "tooltip_bkg"
                key = "tooltip"
                style = { {
                    backgroundColor: 'rgba( 50, 50, 50, 0.8 )',
                    border: 0,
                    borderRadius: '4px',
                    padding: '35px 10px 10px 10px',
                    minWidth: '175px',
                    maxWidth: '300px'
                } }
            >
                <div
                    style = { {
                        color: 'white',
                        fontWeight: '700',
                        position: 'absolute',
                        right: '10px',
                        top: '10px'
                    } }
                >
                    { value }
                </div>
                <Time
                    format = "YYYY/MM/DD HH:mm"
                    style = { {
                        color: 'white',
                        position: 'absolute',
                        left: '10px',
                        top: '10px'
                    } }
                    value = { date }
                />
                <div
                    style = { {
                        color: 'white',
                        whiteSpace: 'normal',
                        width: '100%'
                    } }
                >
                    { this.props.dataset[ index ].status }
                </div>

            </div>
        )
    }
}

RankChartTooltip.displayName = 'RankChartTooltip';
RankChartTooltip.propTypes = {
    contentTooltip: React.PropTypes.object,
    dataset: React.PropTypes.array
};
export default RankChartTooltip;
