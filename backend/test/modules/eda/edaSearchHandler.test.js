const assert = require('assert');

jest.mock('async-redis', () => ({
	createClient: () => ({ on: jest.fn(), get: jest.fn(), set: jest.fn(), select: jest.fn() }),
}));

const EdaSearchHandler = require('../../../node_app/modules/eda/edaSearchHandler');

function makeHandler(overrides = {}) {
	const handler = new EdaSearchHandler({});
	handler.logger = { info: jest.fn(), error: jest.fn() };
	handler.searchUtility = {
		getEsSearchTerms: () => [['parsed'], ['t1']],
	};
	handler.edaSearchUtility = {
		getElasticsearchPagesQuery: jest.fn().mockReturnValue({ query: {} }),
		cleanUpEsResults: jest.fn().mockReturnValue({ docs: [], totalCount: 0 }),
	};
	handler.dataLibrary = {
		queryElasticSearch: jest.fn().mockResolvedValue({ body: { hits: { total: { value: 0 }, hits: [] } } }),
	};
	handler.constants = { EDA_ELASTIC_SEARCH_OPTS: { index: 'eda' } };
	handler.documentSearch = jest.fn().mockResolvedValue({ docs: [], totalCount: 0 });
	handler.storeEsRecord = jest.fn().mockResolvedValue(undefined);
	handler.storeCachedResults = jest.fn().mockResolvedValue(undefined);
	handler.storeRecordOfSearchInPg = jest.fn().mockResolvedValue(undefined);
	Object.assign(handler, overrides);
	return handler;
}

describe('EdaSearchHandler', () => {
	describe('#searchHelper', () => {
		it('runs documentSearch and returns the results', async () => {
			const handler = makeHandler();
			const req = {
				body: { searchText: 'foo', searchVersion: 1, cloneName: 'eda' },
				get: () => 'u@x',
				session: { user: { id: 'u@x' } },
				headers: {},
			};
			const out = await handler.searchHelper(req, 'u@x', false);
			expect(handler.documentSearch).toHaveBeenCalled();
			assert.deepStrictEqual(out, { docs: [], totalCount: 0 });
		});

		it('rethrows when documentSearch rejects', async () => {
			const handler = makeHandler({
				documentSearch: jest.fn().mockRejectedValue(new Error('boom')),
			});
			const req = {
				body: { searchText: 'foo', cloneName: 'eda' },
				get: () => 'u@x',
				session: { user: { id: 'u@x' } },
				headers: {},
			};
			let thrown;
			try {
				await handler.searchHelper(req, 'u@x', false);
			} catch (e) {
				thrown = e;
			}
			assert.ok(thrown);
			assert.strictEqual(thrown.message, 'boom');
		});
	});
});
