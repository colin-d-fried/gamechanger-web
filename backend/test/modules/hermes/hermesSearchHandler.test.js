const assert = require('assert');

// Mock modules pulled in at require-time by hermesSearchHandler.js before we
// require it. These normally open redis/ES connections.
jest.mock('async-redis', () => ({
	createClient: () => ({
		on: jest.fn(),
		get: jest.fn().mockResolvedValue(undefined),
		set: jest.fn(),
		select: jest.fn(),
	}),
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
		HERMES_ELASTIC_SEARCH_OPTS: {
			index: 'hermes',
			auxSearchFields: ['Subject', 'Body'],
			auxRetrieveFields: ['filename'],
		},
	};
});

const HermesSearchHandler = require('../../../node_app/modules/hermes/hermesSearchHandler');

describe('HermesSearchHandler', () => {
	function makeHandler() {
		const handler = new HermesSearchHandler({});
		handler.logger = { info: jest.fn(), error: jest.fn() };
		handler.storeCachedResults = jest.fn().mockResolvedValue(undefined);
		handler.storeRecordOfSearchInPg = jest.fn().mockResolvedValue(undefined);
		return handler;
	}

	beforeEach(() => {
		mockQueryElasticSearch.mockReset();
	});

	it('returns hydrated search results from elasticsearch hits', async () => {
		mockQueryElasticSearch.mockResolvedValue({
			body: {
				hits: {
					total: { value: 1 },
					hits: [
						{
							fields: { Subject: ['s1'] },
							_source: { originator: 'o1' },
							highlight: { Subject: ['hi'] },
						},
					],
				},
			},
		});
		const handler = makeHandler();
		const req = {
			body: { searchText: 'foo', useGCCache: false, cloneName: 'hermes', searchVersion: 1 },
			headers: {},
			get() {
				return undefined;
			},
		};
		const results = await handler.searchHelper(req, 'user', false);
		assert.strictEqual(results.totalCount, 1);
		assert.strictEqual(results.docs.length, 1);
		assert.strictEqual(results.docs[0].Subject, 's1');
		assert.strictEqual(results.docs[0].originator, 'o1');
		assert.strictEqual(results.docs[0].esIndex, 'hermes');
		assert.strictEqual(results.docs[0].is_aux_gc_result, true);
	});

	it('records history and stores cached results when requested', async () => {
		mockQueryElasticSearch.mockResolvedValue({ body: { hits: { total: { value: 0 }, hits: [] } } });
		const handler = makeHandler();
		const req = {
			body: { searchText: 'foo', useGCCache: true, cloneName: 'hermes' },
			headers: {},
			get() {
				return undefined;
			},
		};
		await handler.searchHelper(req, 'user', true);
		expect(handler.storeCachedResults).toHaveBeenCalled();
		expect(handler.storeRecordOfSearchInPg).toHaveBeenCalled();
	});

	it('rejects and logs when elasticsearch fails', async () => {
		mockQueryElasticSearch.mockRejectedValue(new Error('es-down'));
		const handler = makeHandler();
		const req = {
			body: { searchText: 'foo', cloneName: 'hermes' },
			headers: {},
			get() {
				return undefined;
			},
		};
		let rejected = false;
		try {
			await handler.searchHelper(req, 'user', false);
		} catch (_e) {
			rejected = true;
		}
		assert.strictEqual(rejected, true);
		expect(handler.logger.error).toHaveBeenCalled();
	});
});
