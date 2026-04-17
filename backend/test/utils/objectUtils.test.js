const assert = require('assert');
const { sortByValueDescending } = require('../../node_app/utils/objectUtils');

describe('objectUtils', () => {
	describe('#sortByValueDescending', () => {
		it('sorts entries by value in descending order', () => {
			const result = sortByValueDescending({ a: 1, b: 5, c: 3 });
			assert.deepStrictEqual(Object.keys(result), ['b', 'c', 'a']);
			assert.deepStrictEqual(Object.values(result), [5, 3, 1]);
		});

		it('handles empty input', () => {
			assert.deepStrictEqual(sortByValueDescending({}), {});
		});

		it('preserves equal values in their existing order', () => {
			const result = sortByValueDescending({ a: 2, b: 2 });
			assert.deepStrictEqual(Object.values(result), [2, 2]);
			assert.strictEqual(Object.keys(result).length, 2);
		});
	});
});
