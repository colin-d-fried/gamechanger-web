const assert = require('assert');

jest.mock('async-redis', () => ({
	createClient: () => ({ on: jest.fn(), get: jest.fn(), set: jest.fn(), select: jest.fn() }),
}));

const JBookSearchUtility = require('../../../node_app/modules/jbook/jbookSearchUtility');

function makeUtil(overrides = {}) {
	const util = new JBookSearchUtility({ ...overrides });
	util.logger = { info: jest.fn(), error: jest.fn() };
	return util;
}

describe('JBookSearchUtility', () => {
	describe('#getMapping', () => {
		it('returns an empty object for unknown doc types', () => {
			const util = makeUtil();
			const mapping = util.getMapping('unknown', false);
			assert.deepStrictEqual(mapping, {});
		});

		it('returns a non-empty mapping for the pdoc doc type', () => {
			const util = makeUtil();
			const mapping = util.getMapping('pdoc', false);
			assert.ok(Object.keys(mapping).length > 0);
		});

		it('inverts field names when fromFrontend=true', () => {
			const util = makeUtil();
			const forward = util.getMapping('pdoc', false);
			const reverse = util.getMapping('pdoc', true);
			const [dbKey, def] = Object.entries(forward)[0];
			const reverseEntry = reverse[def.newName];
			assert.ok(reverseEntry, 'expected reverse mapping entry for newName');
			assert.strictEqual(reverseEntry.newName, dbKey);
		});
	});

	describe('#mapFieldName', () => {
		it('returns the renamed field when a mapping exists', () => {
			const util = makeUtil();
			const renamed = util.mapFieldName('pdoc', 'P40-78_TOA_CY', false);
			assert.strictEqual(renamed, 'priorYearAmount');
		});

		it('falls back to the input field when no mapping exists', () => {
			const util = makeUtil();
			assert.strictEqual(util.mapFieldName('pdoc', 'no_such_field', false), 'no_such_field');
		});
	});

	describe('#parseFields', () => {
		it('remaps known fields and preserves unknown ones', () => {
			const util = makeUtil();
			const out = util.parseFields({ 'P40-78_TOA_CY': 42, something_else: 'keep-me' }, false, 'pdoc', true);
			assert.strictEqual(out.priorYearAmount, 42);
			assert.strictEqual(out.something_else, 'keep-me');
		});

		it('skips null / empty field values', () => {
			const util = makeUtil();
			const out = util.parseFields({ 'P40-78_TOA_CY': null, empty: '' }, false, 'pdoc', true);
			assert.deepStrictEqual(out, {});
		});

		it('returns a raw copy when doMapping=false', () => {
			const util = makeUtil();
			const out = util.parseFields({ 'P40-78_TOA_CY': 42 }, false, 'pdoc', false);
			assert.strictEqual(out['P40-78_TOA_CY'], 42);
		});
	});
});
