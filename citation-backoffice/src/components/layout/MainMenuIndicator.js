import React from 'react';
import { array } from 'prop-types';
import styled from 'styled-components';

const MainMenuIndicatorContainer = styled.div`
	position: absolute;
	top: 0;
	height: 100%;
	left: ${({ left }) => left}px;
	width: ${({ width }) => width}px;
	border-bottom: .1rem solid ${({ color }) => color};
	border-top: .1rem solid ${({ color }) => color};
	z-index: -1;
	transition: all .5s ease;
`;

const active = items => {
	const activeItems = items.filter(item => item.match !== null);
	if (activeItems.length > 0) {
		return activeItems[0];
	}
	return null;
};

const MainMenuIndicator = ({ items }) => {
	const item = active(items);
	const node = item.node;
	if (node !== null) {
		const color = item.menu.props.color;
		const rect = node.getBoundingClientRect();
		return <MainMenuIndicatorContainer left={rect.left} width={rect.width} color={color} />;
	}
	return null;
};

MainMenuIndicator.propTypes = {
	items: array
};

export default MainMenuIndicator;
