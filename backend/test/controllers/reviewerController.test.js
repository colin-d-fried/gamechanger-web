const assert = require('assert');
const { ReviewerController } = require('../../node_app/controllers/reviewerController');
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

describe('ReviewerController', () => {
	describe('#getReviewerData', () => {
		it('returns all reviewers with 200', async () => {
			const expected = [{ id: 1, name: 'Alice' }];
			const opts = {
				...constructorOptionsMock,
				reviewer: { findAll: () => Promise.resolve(expected) },
			};
			const target = new ReviewerController(opts);
			const res = makeRes();
			await target.getReviewerData(reqMock, res);
			// Allow the .then callback to resolve
			await new Promise((resolve) => setImmediate(resolve));
			assert.strictEqual(res.statusCode, 200);
			assert.deepStrictEqual(res.body, expected);
		});
	});

	describe('#deleteReviewerData', () => {
		it('destroys the reviewer row and returns { deleted: true }', async () => {
			const destroySpy = jest.fn();
			const opts = {
				...constructorOptionsMock,
				reviewer: {
					findOne: () => Promise.resolve({ destroy: destroySpy }),
				},
			};
			const target = new ReviewerController(opts);
			const res = makeRes();
			const req = { ...reqMock, body: { reviewerRowId: 5 } };
			await target.deleteReviewerData(req, res);
			assert.strictEqual(destroySpy.mock.calls.length, 1);
			assert.deepStrictEqual(res.body, { deleted: true });
		});

		it('returns 500 on failure', async () => {
			const opts = {
				...constructorOptionsMock,
				reviewer: {
					findOne: () => Promise.reject(new Error('boom')),
				},
			};
			const target = new ReviewerController(opts);
			const res = makeRes();
			await target.deleteReviewerData({ ...reqMock, body: { reviewerRowId: 5 } }, res);
			assert.strictEqual(res.statusCode, 500);
		});
	});

	describe('#updateOrCreateReviewerHelper', () => {
		it('creates a new reviewer when the id is not found', async () => {
			const createSpy = jest.fn();
			const opts = {
				...constructorOptionsMock,
				reviewer: {
					findOne: () => Promise.resolve(null),
					create: createSpy,
				},
			};
			const target = new ReviewerController(opts);
			const result = await target.updateOrCreateReviewerHelper({ id: 0, name: 'Alice' }, 'u');
			assert.strictEqual(result, true);
			assert.strictEqual(createSpy.mock.calls.length, 1);
		});

		it('updates existing reviewer data in place', async () => {
			const saveSpy = jest.fn().mockResolvedValue(undefined);
			const foundItem = {
				id: 1,
				name: 'old',
				type: 'old',
				title: 'old',
				organization: 'old',
				email: 'old',
				phone_number: 'old',
				save: saveSpy,
			};
			const opts = {
				...constructorOptionsMock,
				reviewer: { findOne: () => Promise.resolve(foundItem), create: jest.fn() },
			};
			const target = new ReviewerController(opts);
			const result = await target.updateOrCreateReviewerHelper(
				{ id: 1, name: 'Alice', type: 't', title: 'Dr', organization: 'Org', email: 'e', phone_number: 'p' },
				'u'
			);
			assert.strictEqual(result, true);
			assert.strictEqual(foundItem.name, 'Alice');
			assert.strictEqual(saveSpy.mock.calls.length, 1);
		});

		it('returns false on underlying error', async () => {
			const opts = {
				...constructorOptionsMock,
				reviewer: { findOne: () => Promise.reject(new Error('boom')) },
			};
			const target = new ReviewerController(opts);
			const result = await target.updateOrCreateReviewerHelper({ id: 0 }, 'u');
			assert.strictEqual(result, false);
		});
	});

	describe('#updateOrCreateReviewer', () => {
		it('returns 200 with the helper result', async () => {
			const opts = {
				...constructorOptionsMock,
				reviewer: {
					findOne: () => Promise.resolve(null),
					create: jest.fn(),
				},
			};
			const target = new ReviewerController(opts);
			const res = makeRes();
			await target.updateOrCreateReviewer(
				{ ...reqMock, body: { reviewerData: { id: 0, name: 'Alice' }, fromApp: 'test' } },
				res
			);
			assert.strictEqual(res.statusCode, 200);
			assert.strictEqual(res.body, true);
		});
	});
});
