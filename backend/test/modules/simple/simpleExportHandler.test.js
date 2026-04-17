const assert = require('assert');

// Mock async-redis before SimpleExportHandler's dependencies initialize any
// connections (Reports → DataLibrary → async-redis, etc.).
jest.mock('async-redis', () => ({
	createClient: () => ({
		on: jest.fn(),
		get: jest.fn().mockResolvedValue(undefined),
		set: jest.fn().mockResolvedValue(undefined),
		select: jest.fn().mockResolvedValue(undefined),
	}),
}));
jest.mock('redis', () => ({
	createClient: () => ({
		on: jest.fn(),
		get: jest.fn(),
		set: jest.fn(),
		select: jest.fn(),
	}),
}));

const SimpleExportHandler = require('../../../node_app/modules/simple/simpleExportHandler');

function makeRes() {
	const res = {
		statusCode: undefined,
		sent: undefined,
		contentTypeValue: undefined,
		status(code) {
			this.statusCode = code;
			return this;
		},
		send(value) {
			this.sent = value;
			return this;
		},
		contentType(value) {
			this.contentTypeValue = value;
			return this;
		},
		end() {},
	};
	return res;
}

function makeHandler(overrides = {}) {
	const handler = new SimpleExportHandler({});
	// SimpleExportHandler's constructor calls `super()` with no arguments,
	// so the base class installs real SearchUtility / Reports / ExportHistoryController.
	// Overwrite those collaborators with stubs for deterministic tests.
	handler.logger = { info: jest.fn(), error: jest.fn() };
	handler.searchUtility = {
		getEsSearchTerms: () => [['parsed'], ['t1']],
		documentSearch: jest.fn().mockResolvedValue({ docs: [], totalCount: 0 }),
	};
	handler.exportHistory = {
		storeExportHistory: jest.fn().mockResolvedValue(undefined),
		updateExportHistoryDate: jest.fn().mockResolvedValue(undefined),
	};
	handler.reports = {
		createCsvStream: jest.fn().mockReturnValue({ pipe: jest.fn() }),
		createProfilePagePDFBuffer: jest.fn((_data, _userId, cb) => cb(Buffer.from('pdf'))),
		createPdfBuffer: jest.fn((_results, _userId, _rest, cb) => cb(Buffer.from('pdf'))),
	};
	handler.review = { findAll: jest.fn().mockResolvedValue([{ id: 1 }]) };
	handler.user = { findAll: jest.fn().mockResolvedValue([{ id: 'u' }]) };
	Object.assign(handler, overrides);
	return handler;
}

describe('SimpleExportHandler', () => {
	describe('#exportHelper', () => {
		it('streams csv when format is csv', async () => {
			const handler = makeHandler();
			const res = makeRes();
			await handler.exportHelper(
				{
					body: { format: 'csv', searchText: 'foo', classificationMarking: 'u' },
					permissions: [],
					session: {},
				},
				res,
				'user'
			);
			expect(handler.reports.createCsvStream).toHaveBeenCalled();
			assert.strictEqual(res.statusCode, 200);
		});

		it('sends base64 pdf when format is pdf', async () => {
			const handler = makeHandler();
			const res = makeRes();
			await handler.exportHelper(
				{ body: { format: 'pdf', searchText: 'foo', index: 'i' }, permissions: [], session: {} },
				res,
				'user'
			);
			assert.strictEqual(res.contentTypeValue, 'application/pdf');
			assert.strictEqual(res.statusCode, 200);
		});

		it('updates export history when historyId is provided', async () => {
			const handler = makeHandler();
			await handler.exportHelper(
				{
					body: { format: 'csv', searchText: 'foo', historyId: 42 },
					permissions: [],
					session: { user: { id: 'u@x' } },
				},
				makeRes(),
				'user'
			);
			expect(handler.exportHistory.updateExportHistoryDate).toHaveBeenCalled();
		});

		it('returns 500 when documentSearch throws', async () => {
			const handler = makeHandler();
			handler.searchUtility.documentSearch = jest.fn().mockRejectedValue(new Error('es-down'));
			const res = makeRes();
			await handler.exportHelper(
				{ body: { format: 'csv', searchText: 'foo' }, permissions: [], session: {} },
				res,
				'user'
			);
			assert.strictEqual(res.statusCode, 500);
		});
	});

	describe('#exportReviewHelper', () => {
		it('pipes the generated csv stream to res', async () => {
			const handler = makeHandler();
			const pipe = jest.fn();
			handler.reports.createCsvStream.mockReturnValue({ pipe });
			await handler.exportReviewHelper({}, makeRes(), 'u');
			expect(handler.review.findAll).toHaveBeenCalled();
			expect(pipe).toHaveBeenCalled();
		});
	});

	describe('#exportUsersHelper', () => {
		it('queries users and pipes csv to res', async () => {
			const handler = makeHandler();
			const pipe = jest.fn();
			handler.reports.createCsvStream.mockReturnValue({ pipe });
			await handler.exportUsersHelper({}, makeRes(), 'u');
			expect(handler.user.findAll).toHaveBeenCalled();
			expect(pipe).toHaveBeenCalled();
		});
	});

	describe('#exportChecklistHelper', () => {
		it('wraps req.body.data into docs and pipes csv', async () => {
			const handler = makeHandler();
			const pipe = jest.fn();
			handler.reports.createCsvStream.mockReturnValue({ pipe });
			await handler.exportChecklistHelper({ body: { data: [1, 2] } }, makeRes(), 'u');
			const [firstArg] = handler.reports.createCsvStream.mock.calls[0];
			assert.deepStrictEqual(firstArg, { docs: [1, 2] });
			expect(pipe).toHaveBeenCalled();
		});
	});

	describe('#exportProfilePageHelper', () => {
		it('returns 403 when permissions missing', async () => {
			const handler = makeHandler();
			const res = makeRes();
			await handler.exportProfilePageHelper({ body: { data: {} }, permissions: ['Other'] }, res, 'u');
			assert.strictEqual(res.statusCode, 403);
		});

		it('sends pdf when user has admin permission', async () => {
			const handler = makeHandler();
			const res = makeRes();
			await handler.exportProfilePageHelper(
				{ body: { data: {} }, permissions: ['Webapp Super Admin'] },
				res,
				'u'
			);
			assert.strictEqual(res.contentTypeValue, 'application/pdf');
			assert.strictEqual(res.statusCode, 200);
		});
	});
});
