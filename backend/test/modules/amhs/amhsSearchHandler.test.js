const assert = require('assert');

jest.mock('async-redis', () => ({
	createClient: () => ({ on: jest.fn(), get: jest.fn(), set: jest.fn(), select: jest.fn() }),
}));
const mockQueryElasticSearch = jest.fn();
jest.mock('../../../node_app/lib/dataLibrary', () => ({
	DataLibrary: function DataLibrary() {
		this.queryElasticSearch = (...args) => mockQueryElasticSearch(...args);
	},
}));
jest.mock(
	'../../../node_app/utils/searchUtility',
	() =>
		function SearchUtility() {
			this.getEsSearchTerms = () => [['parsed'], ['t1']];
		}
);
jest.mock('../../../node_app/config/constants', () => {
	const actual = jest.requireActual('../../../node_app/config/constants');
	return {
		...actual,
		AMHS_ELASTIC_SEARCH_OPTS: {
			index: 'amhs',
			auxSearchFields: [''],
			auxRetrieveFields: [''],
		},
	};
});

const AmhsSearchHandler = require('../../../node_app/modules/amhs/amhsSearchHandler');

describe('AmhsSearchHandler', () => {
	function makeHandler() {
		const handler = new AmhsSearchHandler({});
		handler.logger = { info: jest.fn(), error: jest.fn() };
		handler.storeCachedResults = jest.fn().mockResolvedValue(undefined);
		handler.storeRecordOfSearchInPg = jest.fn().mockResolvedValue(undefined);
		return handler;
	}

	beforeEach(() => mockQueryElasticSearch.mockReset());

	it('returns hydrated results when elasticsearch replies with hits', async () => {
		mockQueryElasticSearch.mockResolvedValue({
			body: { hits: { total: { value: 1 }, hits: [{ fields: {}, _source: { Subject: 'z' }, highlight: {} }] } },
		});
		const handler = makeHandler();
		const req = { body: { searchText: 'bar', cloneName: 'amhs' }, headers: {}, get() {} };
		const out = await handler.searchHelper(req, 'user', false);
		assert.strictEqual(out.totalCount, 1);
		assert.strictEqual(out.docs[0].Subject, 'z');
		assert.strictEqual(out.docs[0].esIndex, 'amhs');
	});

	it('rejects and logs when elasticsearch fails', async () => {
		mockQueryElasticSearch.mockRejectedValue(new Error('es-down'));
		const handler = makeHandler();
		let rejected = false;
		try {
			await handler.searchHelper({ body: { searchText: 'x' }, headers: {}, get() {} }, 'user', false);
		} catch (_e) {
			rejected = true;
		}
		assert.strictEqual(rejected, true);
		expect(handler.logger.error).toHaveBeenCalled();
	});
});
