const assert = require('assert');

jest.mock('axios', () => ({
	get: jest.fn(),
	post: jest.fn(),
}));
jest.mock('async-redis', () => ({
	createClient: () => ({ on: jest.fn(), get: jest.fn(), set: jest.fn(), select: jest.fn() }),
}));
jest.mock('../../node_app/utils/DataCatalogUtils', () => ({
	getCollibraUrl: () => 'http://collibra',
	getAuthConfig: () => ({ headers: {} }),
}));

const axios = require('axios');
const startupUtils = require('../../node_app/utils/startupUtils');

describe('startupUtils', () => {
	describe('#storeDataCatalogInfo', () => {
		beforeEach(() => {
			axios.get.mockReset();
		});

		it('stores asset types and queryable statuses under redis key 13', async () => {
			axios.get
				.mockResolvedValueOnce({ data: { results: [{ id: 1, name: 'Asset' }] } })
				.mockResolvedValueOnce({ data: { results: [{ id: 'status-1' }] } });

			const setCalls = [];
			const redisAsyncClient = {
				select: jest.fn().mockResolvedValue(undefined),
				set: (...args) => {
					setCalls.push(args);
					return Promise.resolve();
				},
			};

			await startupUtils.storeDataCatalogInfo(redisAsyncClient);
			expect(redisAsyncClient.select).toHaveBeenCalledWith(13);
			assert.strictEqual(setCalls.length, 1);
			const payload = JSON.parse(setCalls[0][1]);
			assert.deepStrictEqual(payload, { assetTypes: { Asset: 1 }, queryableStatuses: ['status-1'] });
		});

		it('swallows axios errors and still writes an empty payload', async () => {
			axios.get.mockRejectedValue(new Error('collibra-down'));
			const redisAsyncClient = {
				select: jest.fn().mockResolvedValue(undefined),
				set: jest.fn().mockResolvedValue(undefined),
			};
			await startupUtils.storeDataCatalogInfo(redisAsyncClient);
			expect(redisAsyncClient.set).toHaveBeenCalledTimes(1);
			const payload = JSON.parse(redisAsyncClient.set.mock.calls[0][1]);
			assert.deepStrictEqual(payload, { assetTypes: {}, queryableStatuses: [] });
		});
	});

	describe('#checkOldTokens', () => {
		it('regenerates token when none is provided', async () => {
			const set = jest.fn().mockResolvedValue(undefined);
			const req = { get: () => undefined, session: { user: { id: 'u@x' } }, headers: {} };
			const out = await startupUtils.checkOldTokens(undefined, undefined, '', req, { set });
			assert.strictEqual(typeof out, 'string');
			assert.ok(out.length > 0);
			expect(set).toHaveBeenCalled();
		});

		it('regenerates token when the old one has expired', async () => {
			const set = jest.fn().mockResolvedValue(undefined);
			const req = { get: () => undefined, session: { user: { id: 'u@x' } }, headers: {} };
			const out = await startupUtils.checkOldTokens('old', '2020-01-01T00:00:00Z', 'prev', req, { set });
			assert.notStrictEqual(out, 'prev');
			expect(set).toHaveBeenCalled();
		});

		it('keeps the existing hash when the token is still valid', async () => {
			const set = jest.fn().mockResolvedValue(undefined);
			const req = { get: () => undefined, session: { user: { id: 'u@x' } }, headers: {} };
			const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
			const out = await startupUtils.checkOldTokens('old', futureDate, 'prev', req, { set });
			assert.strictEqual(out, 'prev');
			expect(set).not.toHaveBeenCalled();
		});
	});

	describe('#checkHash', () => {
		it('returns the ML web token when the ml-api service calls in', async () => {
			process.env.ML_WEB_TOKEN = 'ml-secret';
			const req = { get: (k) => (k === 'SSL_CLIENT_S_DN_CN' ? 'ml-api' : undefined), session: {}, headers: {} };
			const redisAsyncClient = { get: jest.fn() };
			const hash = await startupUtils.checkHash(req, redisAsyncClient);
			assert.strictEqual(hash, 'ml-secret');
			expect(redisAsyncClient.get).not.toHaveBeenCalled();
		});

		it('looks up the hash in redis for non-ml-api users', async () => {
			const req = { get: () => 'someone', session: { user: { id: 'u@x' } }, headers: {} };
			const redisAsyncClient = { get: jest.fn().mockResolvedValue('redis-token') };
			const hash = await startupUtils.checkHash(req, redisAsyncClient);
			assert.strictEqual(hash, 'redis-token');
			expect(redisAsyncClient.get).toHaveBeenCalled();
		});
	});
});
