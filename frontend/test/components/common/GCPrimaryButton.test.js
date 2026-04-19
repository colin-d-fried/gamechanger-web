/**
 * @jest-environment jsdom
 *
 * Note: the underlying Material-UI v4 Button is rendered as a `<button>` but
 * the component passes `label` through as an attribute — the actual text shown
 * to users comes from `children`. So these tests locate the button by role
 * without relying on the accessible name coming from `label`.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// The Matomo module is mocked globally via jest moduleNameMapper.
import { trackEvent } from '../../../src/components/telemetry/Matomo';
import GCPrimaryButton from '../../../src/components/common/GCPrimaryButton';

const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 });

describe('<GCPrimaryButton />', () => {
	beforeEach(() => {
		trackEvent.mockClear();
	});

	it('renders a clickable button element', () => {
		render(<GCPrimaryButton label="Go" />);
		expect(screen.getByRole('button')).toBeInTheDocument();
	});

	it('passes label through to the underlying Button so telemetry can report it', async () => {
		const user = setupUser();
		const onClick = jest.fn();
		render(<GCPrimaryButton label="Submit" onClick={onClick} />);

		await user.click(screen.getByRole('button'));

		expect(onClick).toHaveBeenCalledTimes(1);
		expect(trackEvent).toHaveBeenCalledWith('UOTPrimaryButton', 'onClick', 'Submit');
	});

	it('does not throw when onClick is omitted', async () => {
		const user = setupUser();
		render(<GCPrimaryButton label="NoHandler" />);
		await user.click(screen.getByRole('button'));
		// The underlying _.noop default prevents any error.
		expect(trackEvent).toHaveBeenCalledWith('UOTPrimaryButton', 'onClick', 'NoHandler');
	});

	it('renders as disabled when disabled=true and suppresses onClick', async () => {
		const user = setupUser();
		const onClick = jest.fn();
		render(<GCPrimaryButton label="Off" disabled onClick={onClick} />);

		const btn = screen.getByRole('button');
		expect(btn).toBeDisabled();

		await user.click(btn);
		expect(onClick).not.toHaveBeenCalled();
	});
});
