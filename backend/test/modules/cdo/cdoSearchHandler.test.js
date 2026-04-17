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
		CDO_ELASTIC_SEARCH_OPTS: {
			index: 'cdo',
			auxSearchFields: ['Subject'],
			auxRetrieveFields: ['title'],
		},
	};
});

const CDOSearchHandler = require('../../../node_app/modules/cdo/cdoSearchHandler');

describe('CDOSearchHandler', () => {
	function makeHandler() {
		const handler = new CDOSearchHandler({});
		handler.logger = { info: jest.fn(), error: jest.fn() };
		handler.storeCachedResults = jest.fn().mockResolvedValue(undefined);
		handler.storeRecordOfSearchInPg = jest.fn().mockResolvedValue(undefined);
		return handler;
	}

	beforeEach(() => mockQueryElasticSearch.mockReset());

	it('returns hydrated hits with aux flag and esIndex', async () => {
		mockQueryElasticSearch.mockResolvedValue({
			body: {
				hits: {
					total: { value: 2 },
					hits: [
						{ fields: { Subject: ['a'] }, _source: {}, highlight: {} },
						{ fields: {}, _source: { Subject: 'b' }, highlight: {} },
					],
				},
			},
		});
		const handler = makeHandler();
		const req = { body: { searchText: 'q', cloneName: 'cdo' }, headers: {}, get() {} };
		const out = await handler.searchHelper(req, 'user', false);
		assert.strictEqual(out.totalCount, 2);
		assert.strictEqual(out.docs[0].Subject, 'a');
		assert.strictEqual(out.docs[1].Subject, 'b');
		out.docs.forEach((d) => {
			assert.strictEqual(d.esIndex, 'cdo');
			assert.strictEqual(d.is_aux_gc_result, true);
		});
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
