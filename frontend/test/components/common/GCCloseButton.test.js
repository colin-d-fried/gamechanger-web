/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GCCloseButton from '../../../src/components/common/GCCloseButton';

describe('<GCCloseButton />', () => {
	it('renders a close icon', () => {
		const { container } = render(<GCCloseButton onClick={() => {}} />);
		// Material-UI renders the CloseIcon as an SVG.
		expect(container.querySelector('svg')).not.toBeNull();
	});

	it('invokes onClick when clicked', async () => {
		const user = userEvent.setup();
		const onClick = jest.fn();
		const { container } = render(<GCCloseButton onClick={onClick} />);

		const clickable = container.querySelector('div');
		await user.click(clickable);

		expect(onClick).toHaveBeenCalledTimes(1);
	});
});
