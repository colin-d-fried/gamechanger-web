/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from '../../../src/components/common/Pagination';

describe('<Pagination />', () => {
	const defaultProps = {
		activePage: 3,
		itemsCountPerPage: 10,
		totalItemsCount: 100,
		pageRangeDisplayed: 5,
		onChange: jest.fn(),
	};

	beforeEach(() => {
		defaultProps.onChange.mockClear();
	});

	it('renders a page list', () => {
		const { container } = render(<Pagination {...defaultProps} />);
		expect(container.querySelector('ul.pagination-container')).not.toBeNull();
	});

	it('marks the active page with the `active` class', () => {
		const { container } = render(<Pagination {...defaultProps} />);
		const active = container.querySelectorAll('li.active');
		expect(active).toHaveLength(1);
		expect(active[0].textContent).toBe('3');
	});

	it('shows «, ‹, ›, » jump controls when showJumpToFirstLastPages is true (default)', () => {
		render(<Pagination {...defaultProps} />);
		expect(screen.getByText('«')).toBeInTheDocument();
		expect(screen.getByText('»')).toBeInTheDocument();
		expect(screen.getByText('⟨')).toBeInTheDocument();
		expect(screen.getByText('⟩')).toBeInTheDocument();
	});

	it('hides the jump-to-first/last controls when showJumpToFirstLastPages is false', () => {
		render(<Pagination {...defaultProps} showJumpToFirstLastPages={false} />);
		expect(screen.queryByText('«')).not.toBeInTheDocument();
		expect(screen.queryByText('»')).not.toBeInTheDocument();
	});

	it('calls onChange with the clicked page number', async () => {
		const user = userEvent.setup();
		render(<Pagination {...defaultProps} />);
		await user.click(screen.getByText('4'));
		expect(defaultProps.onChange).toHaveBeenCalledWith(4);
	});

	it('calls onChange(1) when the jump-to-first control is clicked', async () => {
		const user = userEvent.setup();
		render(<Pagination {...defaultProps} />);
		await user.click(screen.getByText('«'));
		expect(defaultProps.onChange).toHaveBeenCalledWith(1);
	});

	it('hides the previous-page control on the first page', () => {
		render(<Pagination {...defaultProps} activePage={1} showJumpToFirstLastPages={false} />);
		expect(screen.queryByText('⟨')).not.toBeInTheDocument();
	});

	it('hides the next-page control on the last page', () => {
		render(
			<Pagination
				{...defaultProps}
				activePage={10}
				showJumpToFirstLastPages={false}
			/>
		);
		expect(screen.queryByText('⟩')).not.toBeInTheDocument();
	});
});
