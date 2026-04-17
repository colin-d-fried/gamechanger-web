const assert = require('assert');
const { TutorialOverlayController } = require('../../node_app/controllers/tutorialOverlaysController');
const { constructorOptionsMock, reqMock } = require('../resources/testUtility');

function makeRes() {
	return {
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
}

describe('TutorialOverlayController', () => {
	describe('#fetchTutorialOverlays', () => {
		it('returns all rows on success', async () => {
			const rows = [{ app_name: 'gc' }];
			const opts = {
				...constructorOptionsMock,
				tutorialOverlays: { findAll: () => Promise.resolve(rows) },
			};
			const target = new TutorialOverlayController(opts);
			const res = makeRes();
			const out = await target.fetchTutorialOverlays(reqMock, res);
			assert.deepStrictEqual(out, rows);
			assert.deepStrictEqual(res.body, rows);
		});

		it('returns 500 on error', async () => {
			const err = new Error('db-down');
			const opts = {
				...constructorOptionsMock,
				tutorialOverlays: { findAll: () => Promise.reject(err) },
			};
			const target = new TutorialOverlayController(opts);
			const res = makeRes();
			const out = await target.fetchTutorialOverlays(reqMock, res);
			assert.strictEqual(out, err);
			assert.strictEqual(res.statusCode, 500);
		});
	});

	describe('#saveTutorialOverlays', () => {
		it('returns success when update affects one row', async () => {
			const opts = {
				...constructorOptionsMock,
				tutorialOverlays: { update: () => Promise.resolve([1]) },
			};
			const target = new TutorialOverlayController(opts);
			const res = makeRes();
			const req = { ...reqMock, body: { appName: 'gc', componentsList: [] } };
			const out = await target.saveTutorialOverlays(req, res);
			assert.strictEqual(out, 'Successfully updated tutorial');
			assert.strictEqual(res.statusCode, 200);
		});

		it('returns 400 when no rows updated', async () => {
			const opts = {
				...constructorOptionsMock,
				tutorialOverlays: { update: () => Promise.resolve([0]) },
			};
			const target = new TutorialOverlayController(opts);
			const res = makeRes();
			const req = { ...reqMock, body: { appName: 'gc', componentsList: [] } };
			await target.saveTutorialOverlays(req, res);
			assert.strictEqual(res.statusCode, 400);
		});

		it('returns 400 on update rejection', async () => {
			const opts = {
				...constructorOptionsMock,
				tutorialOverlays: { update: () => Promise.reject(new Error('boom')) },
			};
			const target = new TutorialOverlayController(opts);
			const res = makeRes();
			const req = { ...reqMock, body: { appName: 'gc', componentsList: [] } };
			await target.saveTutorialOverlays(req, res);
			assert.strictEqual(res.statusCode, 400);
		});
	});
});
