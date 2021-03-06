import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { compose, renameProp, withProps, withState, withHandlers, lifecycle } from 'recompose';
import { movePage } from '../../logic/sitemap';

const pageControls = () =>
	compose(
		connect(null, (dispatch, { page }) => ({
			move: position => dispatch(movePage({ page, position }))
		})),
		renameProp('position', 'positionSource'),
		withProps(({ page, positionSource, from }) => ({
			position: page.position
				? from
					? {
							x: from.x + page.position.x,
							y: from.y + page.position.y
						}
					: page.position
				: positionSource
		})),
		withState('svgRect', 'setSvgRect', null),
		lifecycle({
			componentDidMount() {
				this.props.setSvgRect(document.querySelector('svg.Sitemap').getBoundingClientRect());
			}
		}),
		withRouter,
		withHandlers({
			drag: ({ position, svgRect, move, from }) => (event, data) => {
				const ref = from ? from : { x: 0, y: 0 };
				const ratio = 100 / (svgRect.right - svgRect.left);
				const next = {
					x: position.x + data.deltaX * ratio - ref.x,
					y: position.y + data.deltaY * ratio - ref.y
				};
				move(next);
			}
		})
	);

export default pageControls;
