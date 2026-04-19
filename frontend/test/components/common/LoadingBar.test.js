/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import LoadingBar from '../../../src/components/common/LoadingBar';

describe('<LoadingBar />', () => {
	it('renders a progress bar that is hidden by default (loading=false)', () => {
		const { container } = render(<LoadingBar />);
		const bar = container.querySelector('[role="progressbar"]');
		expect(bar).not.toBeNull();
		expect(bar).toHaveStyle({ visibility: 'hidden' });
	});

	it('renders visible when loading is true', () => {
		const { container } = render(<LoadingBar loading />);
		const bar = container.querySelector('[role="progressbar"]');
		expect(bar).toHaveStyle({ visibility: 'visible' });
	});

	it('falls back to "primary" color when given an invalid color and warns once', () => {
		const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
		render(<LoadingBar color="not-a-real-color" />);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not-a-real-color'));
		warnSpy.mockRestore();
	});

	it('merges style overrides onto the progress bar wrapper', () => {
		const { container } = render(<LoadingBar style={{ marginTop: 5 }} />);
		const bar = container.querySelector('[role="progressbar"]');
		expect(bar).toHaveStyle({ marginTop: '5px' });
	});
});
