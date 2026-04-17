const assert = require('assert');
const SimpleSearchHandler = require('../../../node_app/modules/simple/simpleSearchHandler');
const { constructorOptionsMock } = require('../../resources/testUtility');

describe('SimpleSearchHandler', () => {
	function buildTarget(overrides = {}) {
		return new SimpleSearchHandler({
			...constructorOptionsMock,
			searchUtility: {
				getEsSearchTerms: () => [[], []],
			},
			dataLibrary: {},
			mlApi: { getExpandedSearchTerms: jest.fn().mockResolvedValue({}) },
			dataTracker: {},
			...overrides,
		});
	}

	describe('#searchHelperCleanAbbreviations', () => {
		it('removes abbreviations matching an existing term (case-insensitive)', () => {
			const target = buildTarget();
			const abbreviations = ['"DoD"', '"Department of Defense"'];
			const terms = ['dod'];
			const cleaned = target.searchHelperCleanAbbreviations(abbreviations, terms);
			assert.deepStrictEqual(cleaned, ['"Department of Defense"']);
		});

		it('returns abbreviations unchanged when no term matches', () => {
			const target = buildTarget();
			assert.deepStrictEqual(target.searchHelperCleanAbbreviations(['"a"', '"b"'], ['foo']), ['"a"', '"b"']);
		});
	});

	describe('#searchHelperStoreToPG', () => {
		it('skips storing when storeHistory is false', async () => {
			const target = buildTarget();
			const spy = jest.spyOn(target, 'storeRecordOfSearchInPg').mockResolvedValue(undefined);
			await target.searchHelperStoreToPG(false, false, { totalCount: 10 }, { search: 'x' }, 'u');
			expect(spy).not.toHaveBeenCalled();
			spy.mockRestore();
		});

		it('stores when storeHistory is true and not a cache reload', async () => {
			const target = buildTarget();
			const spy = jest.spyOn(target, 'storeRecordOfSearchInPg').mockResolvedValue(undefined);
			await target.searchHelperStoreToPG(true, false, { totalCount: 10 }, { search: 'x' }, 'u');
			expect(spy).toHaveBeenCalledTimes(1);
			const rec = spy.mock.calls[0][0];
			assert.strictEqual(rec.numResults, 10);
			assert.ok(rec.endTime);
			spy.mockRestore();
		});

		it('swallows storeRecordOfSearchInPg errors', async () => {
			const target = buildTarget();
			jest.spyOn(target, 'storeRecordOfSearchInPg').mockRejectedValue(new Error('pg-down'));
			const errSpy = jest.spyOn(target.logger, 'error').mockImplementation(() => {});
			await target.searchHelperStoreToPG(true, false, { totalCount: 1 }, { search: 'x' }, 'u');
			expect(errSpy).toHaveBeenCalled();
			errSpy.mockRestore();
		});
	});
});
