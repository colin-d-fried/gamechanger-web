/**
 * @jest-environment jsdom
 *
 * Focused unit test for the pure helper exported from SearchPdfMapping. The
 * full component itself pulls in a lot of infrastructure (ReactTable, a
 * DatePicker, the GameChangerAPI wrapper, etc.) that isn't relevant to
 * validating the filter predicate — so we exercise the helper in isolation.
 */
const { filterCaseInsensitiveIncludes } = require('../../../src/components/admin/SearchPdfMapping');

describe('SearchPdfMapping helpers', () => {
	describe('#filterCaseInsensitiveIncludes', () => {
		it('returns false when the filter value is not a substring of the row value', () => {
			const filter = { id: 0, value: 'x' };
			const row = ['TEST-STRING'];
			expect(filterCaseInsensitiveIncludes(filter, row)).toBe(false);
		});

		it('returns true when filter and row differ only in case', () => {
			const filter = { pivotId: 0, id: 0, value: 'test-string' };
			const row = ['TEST-STRING'];
			expect(filterCaseInsensitiveIncludes(filter, row)).toBe(true);
		});

		it('treats the filter value case-insensitively', () => {
			const filter = { pivotId: 0, id: 0, value: 'test-string' };
			const row = ['test-STRING'];
			expect(filterCaseInsensitiveIncludes(filter, row)).toBe(true);
		});

		it('returns false when the id points past the end of the row', () => {
			const filter = { pivotId: 1, id: 1, value: 'test-string' };
			const row = ['TEST-STRING'];
			expect(filterCaseInsensitiveIncludes(filter, row)).toBe(false);
		});

		it('falls back to `id` when `pivotId` is not provided', () => {
			const filter = { id: 0, value: 'test-string' };
			const row = ['TEST-STRING'];
			expect(filterCaseInsensitiveIncludes(filter, row)).toBe(true);
		});
	});
});
