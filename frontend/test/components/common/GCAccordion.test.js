/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GCAccordion from '../../../src/components/common/GCAccordion';

describe('<GCAccordion />', () => {
	it('renders the header text', () => {
		render(
			<GCAccordion header="Filters">
				<div>body</div>
			</GCAccordion>
		);
		expect(screen.getByText('Filters')).toBeInTheDocument();
	});

	it('renders children in the details panel', () => {
		render(
			<GCAccordion header="Header" expanded>
				<div data-testid="accordion-body">Content</div>
			</GCAccordion>
		);
		expect(screen.getByTestId('accordion-body')).toBeInTheDocument();
	});

	it('renders the item count when itemCount >= 0', () => {
		render(
			<GCAccordion header="Results" itemCount={7}>
				<div>body</div>
			</GCAccordion>
		);
		expect(screen.getByText('(7)')).toBeInTheDocument();
	});

	it('omits the item count when itemCount is undefined', () => {
		render(
			<GCAccordion header="NoCount">
				<div>body</div>
			</GCAccordion>
		);
		expect(screen.queryByText(/^\(\d+\)$/)).not.toBeInTheDocument();
	});

	it('fires onChange when the accordion is toggled', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		render(
			<GCAccordion header="Toggle" onChange={onChange}>
				<div>body</div>
			</GCAccordion>
		);

		await user.click(screen.getByText('Toggle'));
		expect(onChange).toHaveBeenCalledTimes(1);
		// The Material-UI accordion passes the new expanded state as the argument.
		expect(onChange.mock.calls[0][0]).toBe(true);
	});
});
