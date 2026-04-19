/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import GCTooltip from '../../../src/components/common/GCToolTip';

describe('<GCTooltip />', () => {
	it('renders the child element', () => {
		render(
			<GCTooltip title="Help">
				<button>Hover me</button>
			</GCTooltip>
		);
		expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
	});

	it('passes remaining props through to the underlying Tooltip (no crash on custom props)', () => {
		render(
			<GCTooltip title="Help" placement="top" interactive>
				<button>With extras</button>
			</GCTooltip>
		);
		expect(screen.getByRole('button', { name: 'With extras' })).toBeInTheDocument();
	});
});
