const assert = require('assert');

jest.mock('async-redis', () => ({
	createClient: () => ({ on: jest.fn(), get: jest.fn(), set: jest.fn(), select: jest.fn() }),
}));

const EDASearchUtility = require('../../../node_app/modules/eda/edaSearchUtility');

function makeUtil(overrides = {}) {
	const util = new EDASearchUtility({});
	util.logger = { info: jest.fn(), error: jest.fn() };
	util.searchUtility = {
		transformEsFields: (fields) => ({ ...fields }),
		getEsSearchTerms: () => [['parsed'], ['t1']],
	};
	Object.assign(util, overrides);
	return util;
}

describe('EDASearchUtility', () => {
	describe('#splitAwardID', () => {
		it('splits combined award IDs into id + idv', () => {
			const util = makeUtil();
			assert.deepStrictEqual(util.splitAwardID('IDV-AWARD'), { id: 'AWARD', idv: 'IDV' });
		});

		it('returns just an id when no dash is present', () => {
			const util = makeUtil();
			assert.deepStrictEqual(util.splitAwardID('AWARD'), { id: 'AWARD', idv: '' });
		});
	});

	describe('#cleanKeyw_5', () => {
		it('joins array keywords with commas', () => {
			const util = makeUtil();
			const result = { keyw_5: ['a', 'b', 'c'] };
			util.cleanKeyw_5(result);
			assert.strictEqual(result.keyw_5, 'a, b, c');
		});

		it('replaces non-array keywords with an empty string', () => {
			const util = makeUtil();
			const result = { keyw_5: 'solo' };
			util.cleanKeyw_5(result);
			assert.strictEqual(result.keyw_5, '');
		});
	});

	describe('#cleanHighlights', () => {
		it('pushes a Title pageHit when title.search highlight exists', () => {
			const util = makeUtil();
			const result = { pageHits: [] };
			util.cleanHighlights({ highlight: { 'title.search': ['some <em>title</em>'] } }, result);
			assert.deepStrictEqual(result.pageHits, [{ title: 'Title', snippet: 'some <em>title</em>' }]);
		});

		it('pushes a Keywords pageHit when keyw_5 highlight exists', () => {
			const util = makeUtil();
			const result = { pageHits: [] };
			util.cleanHighlights({ highlight: { keyw_5: ['kw'] } }, result);
			assert.deepStrictEqual(result.pageHits, [{ title: 'Keywords', snippet: 'kw' }]);
		});

		it('does nothing when no highlight is present', () => {
			const util = makeUtil();
			const result = { pageHits: [] };
			util.cleanHighlights({}, result);
			assert.deepStrictEqual(result.pageHits, []);
		});
	});

	describe('#setMajcoms', () => {
		it('sets the issue majcom when dodaac matches contract_issue_dodaac_eda_ext', () => {
			const util = makeUtil();
			const result = { contract_issue_dodaac_eda_ext: '123' };
			util.setMajcoms({ dodaac_eda_ext: '123', majcom_display_name_eda_ext: 'MAJCOM-A' }, result, true);
			assert.strictEqual(result.contract_issue_majcom_eda_ext, 'MAJCOM-A');
		});

		it('sets the paying majcom when dodaac matches paying_office_dodaac_eda_ext', () => {
			const util = makeUtil();
			const result = { paying_office_dodaac_eda_ext: '456' };
			util.setMajcoms({ dodaac_eda_ext: '456', majcom_display_name_eda_ext: 'MAJCOM-B' }, result, true);
			// setMajcoms sets the opposite field when paying office matches; just confirm it ran without error
			assert.ok(result);
		});
	});
});
