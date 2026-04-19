/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GCSecondaryButton from '../../../src/components/common/GCSecondaryButton';

const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 });

describe('<GCSecondaryButton />', () => {
	it('renders its label content', () => {
		render(<GCSecondaryButton>Cancel</GCSecondaryButton>);
		expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
	});

	it('fires the onClick handler', async () => {
		const user = setupUser();
		const onClick = jest.fn();
		render(<GCSecondaryButton onClick={onClick}>Dismiss</GCSecondaryButton>);
		await user.click(screen.getByRole('button', { name: 'Dismiss' }));
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('renders as disabled and swallows clicks when disabled', async () => {
		const user = setupUser();
		const onClick = jest.fn();
		render(
			<GCSecondaryButton disabled onClick={onClick}>
				Disabled
			</GCSecondaryButton>
		);
		const btn = screen.getByRole('button', { name: 'Disabled' });
		expect(btn).toBeDisabled();
		await user.click(btn);
		expect(onClick).not.toHaveBeenCalled();
	});

	it('applies the caller-supplied secondaryButtonStyle overrides', () => {
		render(
			<GCSecondaryButton secondaryButtonStyle={{ backgroundColor: 'rgb(10, 20, 30)' }}>
				Styled
			</GCSecondaryButton>
		);
		const btn = screen.getByRole('button', { name: 'Styled' });
		expect(btn).toHaveStyle({ backgroundColor: 'rgb(10, 20, 30)' });
	});
});
