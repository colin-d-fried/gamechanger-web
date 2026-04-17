const assert = require('assert');

jest.mock('async-redis', () => ({
	createClient: () => ({ on: jest.fn(), get: jest.fn(), set: jest.fn(), select: jest.fn() }),
}));

const PolicyExportHandler = require('../../../node_app/modules/policy/policyExportHandler');

function makeRes() {
	const res = {
		statusCode: undefined,
		sent: undefined,
		endVal: undefined,
		contentTypeValue: undefined,
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
		contentType(v) {
			this.contentTypeValue = v;
			return this;
		},
	};
	return res;
}

function makeHandler(overrides = {}) {
	const handler = new PolicyExportHandler({});
	handler.logger = { info: jest.fn(), error: jest.fn((...args) => console.log('ERR', ...args)) };
	handler.searchUtility = {
		getEsSearchTerms: () => [['parsed'], ['t1']],
		documentSearch: jest.fn().mockResolvedValue({ docs: [], totalCount: 0 }),
	};
	handler.app_settings = {
		findOrCreate: jest.fn().mockResolvedValue([{ dataValues: { value: 'false' } }]),
	};
	handler.intelligentSearch = jest.fn().mockResolvedValue({});
	handler.exportHistory = {
		storeExportHistory: jest.fn().mockResolvedValue(undefined),
		updateExportHistoryDate: jest.fn().mockResolvedValue(undefined),
	};
	handler.reports = {
		createCsvStream: jest.fn().mockReturnValue({ pipe: jest.fn() }),
		createPdfBuffer: jest.fn((_results, _u, _rest, cb) => cb(Buffer.from('pdf-bytes'))),
	};
	handler.documentSearchHelper = jest.fn().mockResolvedValue({ docs: [], totalCount: 0 });
	Object.assign(handler, overrides);
	return handler;
}

describe('PolicyExportHandler', () => {
	describe('#exportHelper', () => {
		it('pipes a csv stream through the response when format=csv', async () => {
			const handler = makeHandler();
			const req = {
				body: {
					searchText: 'foo',
					format: 'csv',
					historyId: 'h1',
					index: 'gamechanger',
					expansionDict: {},
					orgFilter: [],
					selectedDocuments: [],
				},
				get: () => 'u@x',
				session: { user: { id: 'u@x' } },
				headers: {},
				permissions: [],
			};
			const res = makeRes();
			await handler.exportHelper(req, res, 'u@x');
			expect(handler.reports.createCsvStream).toHaveBeenCalled();
			assert.strictEqual(res.statusCode, 200);
		});

		it('returns a base64 pdf buffer when format=pdf', async () => {
			const handler = makeHandler();
			const req = {
				body: {
					searchText: 'foo',
					format: 'pdf',
					historyId: 'h1',
					index: 'gamechanger',
					expansionDict: {},
					orgFilter: [],
					selectedDocuments: [],
				},
				get: () => 'u@x',
				session: { user: { id: 'u@x' } },
				headers: {},
				permissions: [],
			};
			const res = makeRes();
			await handler.exportHelper(req, res, 'u@x');
			expect(handler.reports.createPdfBuffer).toHaveBeenCalled();
			assert.strictEqual(res.contentTypeValue, 'application/pdf');
			assert.strictEqual(res.statusCode, 200);
			assert.strictEqual(res.sent, Buffer.from('pdf-bytes').toString('base64'));
		});

		it('strips unbalanced double quotes from the search text', async () => {
			const handler = makeHandler();
			const req = {
				body: {
					searchText: 'fo"o',
					format: 'json',
					historyId: 'h1',
					index: 'gamechanger',
					expansionDict: {},
					orgFilter: [],
					selectedDocuments: [],
				},
				get: () => 'u@x',
				session: { user: { id: 'u@x' } },
				headers: {},
				permissions: [],
			};
			const res = makeRes();
			await handler.exportHelper(req, res, 'u@x');
			assert.strictEqual(req.body.searchText, 'foo');
		});
	});
});
