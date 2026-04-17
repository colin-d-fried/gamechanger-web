const assert = require('assert');
const MatomoController = require('../../node_app/controllers/matomoController');
const { constructorOptionsMock, reqMock } = require('../resources/testUtility');

function makeRes() {
	const res = {
		statusCode: undefined,
		body: undefined,
		status(code) {
			this.statusCode = code;
			return this;
		},
		send(data) {
			this.body = data;
			return this;
		},
	};
	return res;
}

describe('MatomoController', function () {
	describe('#getAppMatomoStatus', () => {
		it('returns existing app tracking value when record exists', async () => {
			const opts = {
				...constructorOptionsMock,
				matomoStatus: {
					findOne: () => Promise.resolve({ dataValues: { tracking: false } }),
					create: jest.fn(),
				},
			};
			const target = new MatomoController(opts);
			const res = makeRes();
			await target.getAppMatomoStatus(reqMock, res);
			assert.strictEqual(res.statusCode, 200);
			assert.strictEqual(res.body, false);
		});

		it('creates a new record and returns true when missing', async () => {
			const createSpy = jest.fn();
			const opts = {
				...constructorOptionsMock,
				matomoStatus: {
					findOne: () => Promise.resolve(null),
					create: createSpy,
				},
			};
			const target = new MatomoController(opts);
			const res = makeRes();
			await target.getAppMatomoStatus(reqMock, res);
			assert.strictEqual(res.statusCode, 200);
			assert.strictEqual(res.body, true);
			assert.strictEqual(createSpy.mock.calls.length, 1);
		});

		it('returns 500 on error', async () => {
			const opts = {
				...constructorOptionsMock,
				matomoStatus: {
					findOne: () => Promise.reject(new Error('boom')),
				},
			};
			const target = new MatomoController(opts);
			const res = makeRes();
			await target.getAppMatomoStatus(reqMock, res);
			assert.strictEqual(res.statusCode, 500);
		});
	});

	describe('#setAppMatomoStatus', () => {
		it('updates when row exists', async () => {
			const updateSpy = jest.fn();
			const opts = {
				...constructorOptionsMock,
				matomoStatus: {
					findOne: () => Promise.resolve({ dataValues: { tracking: true } }),
					update: updateSpy,
					create: jest.fn(),
				},
			};
			const target = new MatomoController(opts);
			const res = makeRes();
			const req = { ...reqMock, body: { tracking: false } };
			await target.setAppMatomoStatus(req, res);
			assert.strictEqual(res.statusCode, 200);
			assert.strictEqual(updateSpy.mock.calls.length, 1);
		});

		it('creates when row missing', async () => {
			const createSpy = jest.fn();
			const opts = {
				...constructorOptionsMock,
				matomoStatus: {
					findOne: () => Promise.resolve(null),
					create: createSpy,
					update: jest.fn(),
				},
			};
			const target = new MatomoController(opts);
			const res = makeRes();
			await target.setAppMatomoStatus({ ...reqMock, body: { tracking: true } }, res);
			assert.strictEqual(createSpy.mock.calls.length, 1);
		});
	});

	describe('#getUserMatomoStatus', () => {
		it('returns true when user has no opt-out row', async () => {
			const opts = {
				...constructorOptionsMock,
				matomoStatus: { findOne: () => Promise.resolve(null) },
			};
			const target = new MatomoController(opts);
			const res = makeRes();
			await target.getUserMatomoStatus(reqMock, res);
			assert.strictEqual(res.body, true);
		});

		it('returns false when user has an opt-out row', async () => {
			const opts = {
				...constructorOptionsMock,
				matomoStatus: { findOne: () => Promise.resolve({ userID: 'u1' }) },
			};
			const target = new MatomoController(opts);
			const res = makeRes();
			await target.getUserMatomoStatus(reqMock, res);
			assert.strictEqual(res.body, false);
		});
	});

	describe('#setUserMatomoStatus', () => {
		it('creates opt-out row when user disables tracking and no row exists', async () => {
			const createSpy = jest.fn();
			const destroySpy = jest.fn();
			const opts = {
				...constructorOptionsMock,
				matomoStatus: {
					findOne: () => Promise.resolve(null),
					create: createSpy,
					destroy: destroySpy,
				},
			};
			const target = new MatomoController(opts);
			const res = makeRes();
			await target.setUserMatomoStatus({ ...reqMock, body: { tracking: false } }, res);
			assert.strictEqual(createSpy.mock.calls.length, 1);
			assert.strictEqual(destroySpy.mock.calls.length, 0);
		});

		it('destroys opt-out row when user re-enables tracking', async () => {
			const createSpy = jest.fn();
			const destroySpy = jest.fn();
			const opts = {
				...constructorOptionsMock,
				matomoStatus: {
					findOne: () => Promise.resolve({ userID: 'u1' }),
					create: createSpy,
					destroy: destroySpy,
				},
			};
			const target = new MatomoController(opts);
			const res = makeRes();
			await target.setUserMatomoStatus({ ...reqMock, body: { tracking: true } }, res);
			assert.strictEqual(destroySpy.mock.calls.length, 1);
		});
	});
});
