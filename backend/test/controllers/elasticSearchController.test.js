const assert = require('assert');
const { ElasticSearchController } = require('../../node_app/controllers/elasticSearchController');
const { constructorOptionsMock } = require('../resources/testUtility');

const baseConstants = {
	REDIS_CONFIG: {
		GLOBAL_SEARCH_CACHE_DB: 0,
	},
	GAMECHANGER_ELASTIC_SEARCH_OPTS: {
		protocol: 'https',
		host: 'localhost',
		port: '443',
		user: 'user',
		password: 'password',
		ca: 'ca-cert',
		requestTimeout: 30000,
	},
	EDA_ELASTIC_SEARCH_OPTS: {
		protocol: 'http',
		host: 'localhost',
		port: '9200',
		requestTimeout: 30000,
	},
	GLOBAL_SEARCH_OPTS: {
		ES_INDEX: 'qlik-apps',
		ES_MAPPING: { properties: {} },
	},
};

function makeEsLib() {
	return {
		addClient: jest.fn(),
		deleteIndex: jest.fn().mockResolvedValue(undefined),
		createIndex: jest.fn().mockResolvedValue(undefined),
		bulkInsert: jest.fn().mockResolvedValue(undefined),
	};
}

function makeRedis(initial = {}) {
	const store = { ...initial };
	return {
		selected: undefined,
		store,
		select(db) {
			this.selected = db;
			return Promise.resolve();
		},
		get(key) {
			return Promise.resolve(store[key]);
		},
		set(key, val) {
			store[key] = val;
			return Promise.resolve();
		},
	};
}

describe('ElasticSearchController', () => {
	describe('#getESClientConfig', () => {
		it('builds auth + https agent config for 443', () => {
			const target = new ElasticSearchController({
				...constructorOptionsMock,
				constants: baseConstants,
				esSearchLib: makeEsLib(),
				redisDB: makeRedis(),
			});
			const cfg = target.getESClientConfig(baseConstants.GAMECHANGER_ELASTIC_SEARCH_OPTS);
			assert.strictEqual(cfg.auth.username, 'user');
			assert.strictEqual(cfg.auth.password, 'password');
			assert.strictEqual(typeof cfg.node.agent, 'function');
			const agent = cfg.node.agent();
			assert.ok(agent);
			assert.strictEqual(cfg.node.url.hostname, 'localhost');
			assert.strictEqual(cfg.requestTimeout, 30000);
		});

		it('builds plain config for non-443 ports without user', () => {
			const target = new ElasticSearchController({
				...constructorOptionsMock,
				constants: baseConstants,
				esSearchLib: makeEsLib(),
				redisDB: makeRedis(),
			});
			const cfg = target.getESClientConfig(baseConstants.EDA_ELASTIC_SEARCH_OPTS);
			assert.strictEqual(cfg.auth, undefined);
			assert.strictEqual(cfg.node.url.hostname, 'localhost');
		});
	});

	describe('#cacheQlikApps', () => {
		it('writes serialized data into redis under the expected key', async () => {
			const redis = makeRedis();
			const target = new ElasticSearchController({
				...constructorOptionsMock,
				constants: baseConstants,
				esSearchLib: makeEsLib(),
				redisDB: redis,
			});
			await target.cacheQlikApps([{ id: 1 }]);
			assert.strictEqual(redis.store['qlik-full-app-list'], JSON.stringify([{ id: 1 }]));
		});

		it('rethrows on error', async () => {
			const redis = {
				select: () => Promise.reject(new Error('down')),
				set: () => Promise.resolve(),
			};
			const target = new ElasticSearchController({
				...constructorOptionsMock,
				constants: baseConstants,
				esSearchLib: makeEsLib(),
				redisDB: redis,
			});
			let threw = false;
			try {
				await target.cacheQlikApps([]);
			} catch (_e) {
				threw = true;
			}
			assert.strictEqual(threw, true);
		});
	});

	describe('#storeUpdateQlikAppsInES', () => {
		it('deletes, creates, then bulk-inserts qlik apps', async () => {
			const esLib = makeEsLib();
			const target = new ElasticSearchController({
				...constructorOptionsMock,
				constants: baseConstants,
				esSearchLib: esLib,
				redisDB: makeRedis(),
			});
			const qlikApps = [
				{
					id: '1',
					createdDate: 'c',
					modifiedDate: 'm',
					name: 'App',
					publishTime: 'p',
					published: true,
					tags: ['a'],
					description: 'd',
					stream: { id: 's1', name: 'Stream', customProperties: [] },
					fileSize: '10',
					lastReloadTime: 'r',
					thumbnail: 't',
					dynamicColor: 'c',
					customProperties: [],
					businessDomains: [],
					owner: { name: 'Alice' },
				},
			];
			await target.storeUpdateQlikAppsInES(qlikApps);
			assert.strictEqual(esLib.deleteIndex.mock.calls.length, 1);
			assert.strictEqual(esLib.createIndex.mock.calls.length, 1);
			assert.strictEqual(esLib.bulkInsert.mock.calls.length, 1);
			const [, , dataset] = esLib.bulkInsert.mock.calls[0];
			assert.strictEqual(dataset[0].id, '1');
			assert.strictEqual(dataset[0].fileSize_i, 10);
		});
	});

	describe('#cacheStoreQlikApps', () => {
		it('short-circuits when cache is already reloading', async () => {
			const redis = makeRedis({ qlikCacheReloadingStatus: 'is-reloading' });
			const esLib = makeEsLib();
			const target = new ElasticSearchController({
				...constructorOptionsMock,
				constants: baseConstants,
				esSearchLib: esLib,
				redisDB: redis,
			});
			await target.cacheStoreQlikApps();
			// bulkInsert should not have been triggered
			assert.strictEqual(esLib.bulkInsert.mock.calls.length, 0);
			// status flag should be reset
			assert.strictEqual(redis.store.qlikCacheReloadingStatus, 'not-reloading');
		});
	});
});
