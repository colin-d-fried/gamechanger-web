/**
 * @jest-environment jsdom
 */
import { CustomDimensions } from '../../src/components/telemetry/utils/CustomDimensions';

describe('CustomDimensions', () => {
	describe('create (one-action variant)', () => {
		it('returns an object keyed dimension1 / dimension2 / dimension3', () => {
			const result = CustomDimensions.create(true, 'my text', 5, 2);
			expect(result).toEqual({
				dimension1: 'my text',
				dimension2: 5,
				dimension3: 2,
			});
		});

		it('omits dimensions whose values are null/undefined', () => {
			const result = CustomDimensions.create(true, 'my text');
			expect(result).toEqual({ dimension1: 'my text' });
		});

		it('returns an empty object when all values are null', () => {
			expect(CustomDimensions.create(true)).toEqual({});
		});
	});

	describe('create (multi-action variant)', () => {
		it('returns an array of { id, value } pairs', () => {
			const result = CustomDimensions.create(false, 'abc', 10, 1);
			expect(result).toEqual([
				{ id: 1, value: 'abc' },
				{ id: 2, value: 10 },
				{ id: 3, value: 1 },
			]);
		});

		it('skips null/undefined values in the array form', () => {
			const result = CustomDimensions.create(false, 'abc', null, 3);
			expect(result).toEqual([
				{ id: 1, value: 'abc' },
				{ id: 3, value: 3 },
			]);
		});

		it('returns an empty array when no values are provided', () => {
			expect(CustomDimensions.create(false)).toEqual([]);
		});
	});
});
