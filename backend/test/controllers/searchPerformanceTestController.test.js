const assert = require('assert');

describe('SearchPerformanceTestController', () => {
	let SearchPerformanceTestController;
	const truncateSpy = jest.fn().mockResolvedValue(undefined);
	const findAllSpy = jest.fn().mockResolvedValue([{ id: 1 }]);
	const createSpy = jest.fn().mockResolvedValue({ id: 2 });

	beforeAll(() => {
		jest.resetModules();
		jest.doMock('../../node_app/models', () => ({
			policy_search_performance_tests: {
				destroy: truncateSpy,
				findAll: findAllSpy,
				create: createSpy,
			},
		}));
		({ SearchPerformanceTestController } = require('../../node_app/controllers/searchPerformanceTestController'));
	});

	afterAll(() => {
		jest.resetModules();
	});

	function makeRes() {
		return {
			body: undefined,
			send(data) {
				this.body = data;
				return this;
			},
		};
	}

	it('resetTestTable truncates the performance test table', async () => {
		const target = new SearchPerformanceTestController();
		await target.resetTestTable();
		assert.strictEqual(truncateSpy.mock.calls.length, 1);
		assert.deepStrictEqual(truncateSpy.mock.calls[0][0], { truncate: true });
	});

	it('getTests returns all rows via res.send', async () => {
		const target = new SearchPerformanceTestController();
		const res = makeRes();
		await target.getTests({}, res);
		assert.deepStrictEqual(res.body, [{ id: 1 }]);
	});

	it('postTests creates a new row from req.body', async () => {
		const target = new SearchPerformanceTestController();
		const res = makeRes();
		await target.postTests({ body: { title: 'test' } }, res);
		assert.strictEqual(createSpy.mock.calls.length, 1);
		assert.deepStrictEqual(createSpy.mock.calls[0][0], { title: 'test' });
		assert.deepStrictEqual(res.body, { id: 2 });
	});
});
