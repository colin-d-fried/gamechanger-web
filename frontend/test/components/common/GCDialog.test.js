/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GCDialog from '../../../src/components/common/GCDialog';

describe('<GCDialog />', () => {
	const baseProps = {
		open: true,
		onRequestClose: jest.fn(),
		primaryLabel: 'Save',
		primaryAction: jest.fn(),
		handleClose: jest.fn(),
		title: 'Confirm action',
	};

	beforeEach(() => {
		baseProps.onRequestClose.mockClear();
		baseProps.primaryAction.mockClear();
		baseProps.handleClose.mockClear();
	});

	it('does not render content when open is false', () => {
		render(
			<GCDialog {...baseProps} open={false}>
				<p>body</p>
			</GCDialog>
		);
		expect(screen.queryByText('Confirm action')).not.toBeInTheDocument();
	});

	it('renders the title and children when open', () => {
		render(
			<GCDialog {...baseProps}>
				<p data-testid="dialog-body">Are you sure?</p>
			</GCDialog>
		);
		expect(screen.getByText('Confirm action')).toBeInTheDocument();
		expect(screen.getByTestId('dialog-body')).toBeInTheDocument();
	});

	it('renders the primary action button and fires primaryAction on click', async () => {
		const user = userEvent.setup();
		render(
			<GCDialog {...baseProps}>
				<p>body</p>
			</GCDialog>
		);
		const primary = document.querySelector('#primary-dialog-btn');
		expect(primary).not.toBeNull();
		await user.click(primary);
		expect(baseProps.primaryAction).toHaveBeenCalledTimes(1);
	});

	it('renders the secondary button when secondaryLabel is provided', async () => {
		const user = userEvent.setup();
		const secondaryAction = jest.fn();
		render(
			<GCDialog
				{...baseProps}
				secondaryLabel="Cancel"
				secondaryAction={secondaryAction}
			>
				<p>body</p>
			</GCDialog>
		);
		const secondary = document.querySelector('#secondary-dialog-btn');
		expect(secondary).not.toBeNull();
		await user.click(secondary);
		expect(secondaryAction).toHaveBeenCalledTimes(1);
	});

	it('does not render the button row when no action labels are provided', () => {
		render(
			<GCDialog
				open
				onRequestClose={() => {}}
				handleClose={() => {}}
				title="No buttons"
				primaryLabel={undefined}
				primaryAction={undefined}
			>
				<p>body</p>
			</GCDialog>
		);
		expect(document.querySelector('#primary-dialog-btn')).toBeNull();
		expect(document.querySelector('#secondary-dialog-btn')).toBeNull();
		expect(document.querySelector('#tertiary-dialog-btn')).toBeNull();
	});
});
