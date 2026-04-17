const assert = require('assert');

describe('eventHistory', function () {
	let eventHistoryModule;

	beforeAll(() => {
		jest.resetModules();
		jest.doMock('../../node_app/models', () => ({
			eventHistory: {
				create: jest.fn(({ userCn }) => {
					if (userCn === 'fail') {
						return Promise.reject(new Error('boom'));
					}
					return Promise.resolve();
				}),
			},
		}));
		eventHistoryModule = require('../../node_app/controllers/eventHistory');
	});

	afterAll(() => {
		jest.resetModules();
	});

	describe('#actions', () => {
		it('exposes the expected action names', () => {
			const { actions } = eventHistoryModule;
			assert.strictEqual(actions.create, 'create');
			assert.strictEqual(actions.update, 'update');
			assert.strictEqual(actions.delete, 'delete');
			assert.strictEqual(actions.destroy, 'delete');
		});
	});

	describe('#getTableName', () => {
		it('returns a string table name unchanged', () => {
			const name = eventHistoryModule.getTableName({
				getTableName: () => 'users',
			});
			assert.strictEqual(name, 'users');
		});

		it('returns tableName property when result is an object', () => {
			const name = eventHistoryModule.getTableName({
				getTableName: () => ({ tableName: 'users' }),
			});
			assert.strictEqual(name, 'users');
		});
	});

	describe('#create', () => {
		it('resolves on successful create', async () => {
			await eventHistoryModule.create({
				userCn: 'user1',
				table: 'foo',
				objectId: 1,
				action: 'create',
				field: 'x',
				oldValue: 'a',
				newValue: 'b',
			});
		});

		it('rejects when the underlying model rejects', async () => {
			let threw = false;
			try {
				await eventHistoryModule.create({ userCn: 'fail' });
			} catch (_e) {
				threw = true;
			}
			assert.strictEqual(threw, true);
		});
	});
});
