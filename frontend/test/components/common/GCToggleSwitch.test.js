/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GCToggleSwitch from '../../../src/components/common/GCToggleSwitch';

const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 });

describe('<GCToggleSwitch />', () => {
	it('renders the left and right labels', () => {
		render(
			<GCToggleSwitch
				leftLabel="Off"
				rightLabel="On"
				rightActive={false}
				onClick={() => {}}
			/>
		);
		expect(screen.getByText('Off')).toBeInTheDocument();
		expect(screen.getByText('On')).toBeInTheDocument();
	});

	it('fires onClick when the left label is clicked (and no onClickLeft is provided)', async () => {
		const user = setupUser();
		const onClick = jest.fn();
		render(
			<GCToggleSwitch
				leftLabel="Off"
				rightLabel="On"
				rightActive={false}
				onClick={onClick}
			/>
		);
		await user.click(screen.getByText('Off'));
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('routes left label clicks to onClickLeft when provided', async () => {
		const user = setupUser();
		const onClickLeft = jest.fn();
		const onClick = jest.fn();
		render(
			<GCToggleSwitch
				leftLabel="Off"
				rightLabel="On"
				rightActive={false}
				onClickLeft={onClickLeft}
				onClick={onClick}
			/>
		);
		await user.click(screen.getByText('Off'));
		expect(onClickLeft).toHaveBeenCalledTimes(1);
		expect(onClick).not.toHaveBeenCalled();
	});

	it('ignores clicks when disabled', async () => {
		const user = setupUser();
		const onClick = jest.fn();
		const onClickLeft = jest.fn();
		render(
			<GCToggleSwitch
				leftLabel="Off"
				rightLabel="On"
				rightActive={false}
				disabled
				onClick={onClick}
				onClickLeft={onClickLeft}
			/>
		);
		await user.click(screen.getByText('Off'));
		expect(onClick).not.toHaveBeenCalled();
		expect(onClickLeft).not.toHaveBeenCalled();
	});
});
