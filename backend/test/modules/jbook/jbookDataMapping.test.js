const assert = require('assert');
const mappings = require('../../../node_app/modules/jbook/jbookDataMapping');

describe('jbookDataMapping', () => {
	it('exports at least the expected mapping shapes', () => {
		assert.ok(typeof mappings === 'object');
		assert.ok(mappings.pdocMapping, 'pdocMapping should exist');
	});

	it('pdocMapping entries follow the { newName, defaultValue, processValue } shape', () => {
		const entries = Object.entries(mappings.pdocMapping).slice(0, 10);
		assert.ok(entries.length > 0);
		for (const [_key, value] of entries) {
			assert.strictEqual(typeof value.newName, 'string');
			assert.ok('defaultValue' in value);
			assert.strictEqual(typeof value.processValue, 'function');
		}
	});

	it('processValue is identity for the default mapping definitions', () => {
		const sample = mappings.pdocMapping['P3a-16_Title'];
		assert.strictEqual(sample.processValue('hello'), 'hello');
		assert.strictEqual(sample.processValue(42), 42);
	});

	it('newName reflects the mapped field for a few known P40 fields', () => {
		assert.strictEqual(mappings.pdocMapping['P40-78_TOA_CY'].newName, 'priorYearAmount');
		assert.strictEqual(mappings.pdocMapping['P40-81_TOA_BY1'].newName, 'by1BaseYear');
		assert.strictEqual(mappings.pdocMapping['P40-13_BSA_Title'].newName, 'budgetSubActivity');
	});
});
