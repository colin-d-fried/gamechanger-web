const assert = require('assert');

jest.mock('async-redis', () => ({
	createClient: () => ({ on: jest.fn(), get: jest.fn(), set: jest.fn(), select: jest.fn() }),
}));

const EdaExportHandler = require('../../../node_app/modules/eda/edaExportHandler');

function makeRes() {
	return {
		statusCode: undefined,
		sent: undefined,
		endVal: undefined,
		status(code) {
			this.statusCode = code;
			return this;
		},
		send(v) {
			this.sent = v;
			return this;
		},
		end(v) {
			this.endVal = v;
			return this;
		},
		contentType: jest.fn(),
	};
}

function makeHandler(overrides = {}) {
	const handler = new EdaExportHandler({});
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
	handler.constants = { EDA_ELASTIC_SEARCH_OPTS: { index: 'eda', extSearchFields: [], extRetrieveFields: [] } };
	handler.reports = {
		createCsvStream: jest.fn().mockReturnValue({ pipe: jest.fn() }),
	};
	Object.assign(handler, overrides);
	return handler;
}

describe('EdaExportHandler', () => {
	describe('#exportHelper', () => {
		it('rejects with a 500 when the caller lacks EDA permissions', async () => {
			const handler = makeHandler();
			const req = {
				body: { searchText: 'x', format: 'csv' },
				permissions: [],
				get: () => 'u@x',
				session: { user: { id: 'u@x' } },
				headers: {},
			};
			const res = makeRes();
			await handler.exportHelper(req, res, 'u@x');
			assert.strictEqual(res.statusCode, 500);
			expect(handler.logger.error).toHaveBeenCalled();
		});

		it('queries elasticsearch for permitted callers', async () => {
			const handler = makeHandler();
			const req = {
				body: { searchText: 'x', format: 'csv' },
				permissions: ['View EDA'],
				get: () => 'u@x',
				session: { user: { id: 'u@x' } },
				headers: {},
			};
			const res = makeRes();
			try {
				await handler.exportHelper(req, res, 'u@x');
			} catch (_e) {
				// swallow: csv pipe path may error on empty results, we just care about ES call
			}
			expect(handler.dataLibrary.queryElasticSearch).toHaveBeenCalled();
		});
	});
});
