/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GCButton from '../../../src/components/common/GCButton';

// The MUI v4 Button keeps `pointer-events: none` on disabled buttons, and
// user-event >=14 enforces that by default. Opt out so we can assert that
// disabled buttons don't fire handlers.
const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 });

describe('<GCButton />', () => {
	it('renders the provided children inside the button', () => {
		render(<GCButton>Submit</GCButton>);
		expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
	});

	it('is enabled by default and clickable', async () => {
		const user = setupUser();
		const onClick = jest.fn();
		render(<GCButton onClick={onClick}>Click Me</GCButton>);

		const btn = screen.getByRole('button', { name: 'Click Me' });
		expect(btn).not.toBeDisabled();

		await user.click(btn);
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('respects the `disabled` prop and does not fire onClick', async () => {
		const user = setupUser();
		const onClick = jest.fn();
		render(
			<GCButton disabled onClick={onClick}>
				Disabled
			</GCButton>
		);

		const btn = screen.getByRole('button', { name: 'Disabled' });
		expect(btn).toBeDisabled();

		await user.click(btn);
		expect(onClick).not.toHaveBeenCalled();
	});

	it('renders with the secondary styling when isSecondaryBtn is true', () => {
		render(<GCButton isSecondaryBtn>Cancel</GCButton>);
		const btn = screen.getByRole('button', { name: 'Cancel' });
		// The secondary variant swaps the gcOrange background for light grey (#E0E0E0).
		expect(btn).toHaveStyle({ backgroundColor: '#E0E0E0' });
	});

	it('honours explicit buttonColor and borderColor overrides', () => {
		render(
			<GCButton buttonColor="#123456" borderColor="#abcdef">
				Custom
			</GCButton>
		);
		const btn = screen.getByRole('button', { name: 'Custom' });
		expect(btn).toHaveStyle({ backgroundColor: '#123456' });
		expect(btn).toHaveStyle({ borderColor: '#abcdef' });
	});
});
