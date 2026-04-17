const assert = require('assert');
const { ESSearchLib } = require('../../node_app/lib/ESSearchLib');

function makeFakeClient(overrides = {}) {
	return {
		search: jest.fn().mockResolvedValue({ body: { hits: { hits: [] } } }),
		msearch: jest.fn().mockResolvedValue({ body: {} }),
		index: jest.fn().mockResolvedValue({}),
		update: jest.fn().mockResolvedValue({}),
		bulk: jest.fn().mockResolvedValue({ body: { errors: false, items: [] } }),
		indices: {
			exists: jest.fn().mockResolvedValue({ body: false }),
			create: jest.fn().mockResolvedValue({ body: { acknowledged: true } }),
			delete: jest.fn().mockResolvedValue({}),
		},
		...overrides,
	};
}

function makeLib(stubClient) {
	const logger = { info: jest.fn(), error: jest.fn() };
	const ConstructorMock = jest.fn().mockImplementation(() => stubClient);
	const lib = new ESSearchLib({ logger, esClientConstructor: ConstructorMock });
	lib.addClient('gc', { node: 'x' }, 'test');
	return { lib, logger, ConstructorMock };
}

describe('ESSearchLib', () => {
	describe('#addClient / #listClients', () => {
		it('registers clients by name', () => {
			const { lib } = makeLib(makeFakeClient());
			assert.deepStrictEqual(lib.listClients(), ['gc']);
		});

		it('throws and logs when construction fails', () => {
			const logger = { info: jest.fn(), error: jest.fn() };
			const lib = new ESSearchLib({
				logger,
				esClientConstructor: () => {
					throw new Error('bad-config');
				},
			});
			assert.throws(() => lib.addClient('bad', {}, 'test'));
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('#queryElasticsearch / #multiqueryElasticsearch', () => {
		it('delegates to client.search with the right payload', async () => {
			const client = makeFakeClient();
			const { lib } = makeLib(client);
			await lib.queryElasticsearch('gc', 'idx1', { size: 10 }, 'user');
			expect(client.search).toHaveBeenCalledWith({ index: 'idx1', body: { size: 10 } });
		});

		it('delegates to client.msearch with concatenated bodies', async () => {
			const client = makeFakeClient();
			const { lib } = makeLib(client);
			await lib.multiqueryElasticsearch('gc', 'idx1', [{ a: 1 }, { b: 2 }], 'user');
			expect(client.msearch).toHaveBeenCalledWith({ body: [{ a: 1 }, { b: 2 }] });
		});
	});

	describe('#updateDocument', () => {
		it('returns true when client.update resolves', async () => {
			const client = makeFakeClient();
			const { lib } = makeLib(client);
			const res = await lib.updateDocument('gc', 'idx1', { foo: 'bar' }, 'doc1', 'user');
			assert.strictEqual(res, true);
			expect(client.update).toHaveBeenCalled();
		});

		it('returns false when the client rejects', async () => {
			const client = makeFakeClient({ update: jest.fn().mockRejectedValue(new Error('x')) });
			const { lib } = makeLib(client);
			const res = await lib.updateDocument('gc', 'idx1', { foo: 'bar' }, 'doc1', 'user');
			assert.strictEqual(res, false);
		});
	});

	describe('#createIndex / #deleteIndex', () => {
		it('returns true and skips create when the index already exists', async () => {
			const client = makeFakeClient({
				indices: {
					exists: jest.fn().mockResolvedValue({ body: true }),
					create: jest.fn(),
					delete: jest.fn(),
				},
			});
			const { lib } = makeLib(client);
			const res = await lib.createIndex('gc', 'idx', {}, null, 'user');
			assert.strictEqual(res, true);
			expect(client.indices.create).not.toHaveBeenCalled();
		});

		it('creates the index and returns true on acknowledgement', async () => {
			const client = makeFakeClient();
			const { lib } = makeLib(client);
			assert.strictEqual(await lib.createIndex('gc', 'idx', { mappings: {} }, null, 'user'), true);
		});

		it('returns false when create is not acknowledged', async () => {
			const client = makeFakeClient({
				indices: {
					exists: jest.fn().mockResolvedValue({ body: false }),
					create: jest.fn().mockResolvedValue({ body: { acknowledged: false } }),
					delete: jest.fn(),
				},
			});
			const { lib } = makeLib(client);
			assert.strictEqual(await lib.createIndex('gc', 'idx', {}, null, 'user'), false);
		});

		it('deleteIndex returns true on success, false on failure', async () => {
			const client = makeFakeClient();
			const { lib } = makeLib(client);
			assert.strictEqual(await lib.deleteIndex('gc', 'idx', 'user'), true);

			const badClient = makeFakeClient({
				indices: { ...client.indices, delete: jest.fn().mockRejectedValue(new Error('x')) },
			});
			const { lib: lib2 } = makeLib(badClient);
			assert.strictEqual(await lib2.deleteIndex('gc', 'idx', 'user'), false);
		});
	});

	describe('#bulkInsert', () => {
		it('invokes bulk with index+doc pairs', async () => {
			const client = makeFakeClient();
			const { lib } = makeLib(client);
			await lib.bulkInsert('gc', 'idx1', [{ id: 'a' }, { id: 'b' }], 'user');
			expect(client.bulk).toHaveBeenCalled();
			const args = client.bulk.mock.calls[0][0];
			assert.deepStrictEqual(args.body[0], { index: { _index: 'idx1', _id: 'a' } });
			assert.deepStrictEqual(args.body[1], { id: 'a' });
		});
	});
});
