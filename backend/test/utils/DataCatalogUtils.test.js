const assert = require('assert');

describe('DataCatalogUtils', () => {
	let DataCatalogUtils;

	const mockedConstants = {
		DATA_CATALOG_OPTS: {
			protocol: 'https',
			host: 'collibra.example.com',
			port: '8443',
			core_rest_path: '/rest/2.0',
			username: 'user',
			password: 'pass',
			ca: 'ca',
			api_config: { apiKey: 'xyz' },
		},
	};

	const redisStore = {};
	const mockRedisClient = {
		select: jest.fn().mockResolvedValue(undefined),
		get: jest.fn((key) => Promise.resolve(redisStore[key])),
	};

	beforeAll(() => {
		jest.resetModules();
		jest.doMock('../../node_app/config/constants', () => mockedConstants);
		jest.doMock('async-redis', () => ({ createClient: () => mockRedisClient }));
		DataCatalogUtils = require('../../node_app/utils/DataCatalogUtils');
	});

	afterAll(() => {
		jest.resetModules();
	});

	beforeEach(() => {
		for (const k of Object.keys(redisStore)) delete redisStore[k];
		mockRedisClient.select.mockClear();
		mockRedisClient.get.mockClear();
	});

	describe('#getCollibraUrl', () => {
		it('builds a URL with protocol, host, port, and core rest path', () => {
			assert.strictEqual(DataCatalogUtils.getCollibraUrl(), 'https://collibra.example.com:8443/rest/2.0');
		});
	});

	describe('#getAuthConfig', () => {
		it('returns httpsAgent + basic auth for https protocol', () => {
			const cfg = DataCatalogUtils.getAuthConfig();
			assert.ok(cfg.httpsAgent);
			assert.deepStrictEqual(cfg.auth, { username: 'user', password: 'pass' });
		});
	});

	describe('#getAPIConfig', () => {
		it('returns the api_config from constants', () => {
			assert.deepStrictEqual(DataCatalogUtils.getAPIConfig(), { apiKey: 'xyz' });
		});
	});

	describe('#getListOfField', () => {
		it('maps srcField to newField for every result', () => {
			const input = { total: 2, results: [{ name: 'a' }, { name: 'b' }] };
			const out = DataCatalogUtils.getListOfField(input, 'name', 'displayName');
			assert.deepStrictEqual(out, [{ displayName: 'a' }, { displayName: 'b' }]);
		});

		it('returns empty array when total <= 0 or srcData missing', () => {
			assert.deepStrictEqual(DataCatalogUtils.getListOfField(null, 'a', 'b'), []);
			assert.deepStrictEqual(DataCatalogUtils.getListOfField({ total: 0, results: [] }, 'a', 'b'), []);
		});
	});

	describe('#generateAcronymSearchInFields', () => {
		it('returns a field descriptor tied to the acronym attribute and datasource asset', () => {
			const out = DataCatalogUtils.generateAcronymSearchInFields('ATTR1', 'DS1');
			assert.strictEqual(out[0].resourceType, 'Asset');
			assert.ok(out[0].fields.includes('StringAttribute:ATTR1'));
			assert.ok(out[0].fields.includes('Asset:DS1'));
		});
	});

	describe('#cleanSearchText', () => {
		it('wraps text in wildcards when no quote is present', () => {
			assert.strictEqual(DataCatalogUtils.cleanSearchText('foo'), '*foo*');
		});

		it('returns text unchanged when a quote is present', () => {
			assert.strictEqual(DataCatalogUtils.cleanSearchText('"foo"'), '"foo"');
		});
	});

	describe('#getSearchTypeId / #getQueryableStatuses / #getAttributeTypes', () => {
		it('returns null when no search type provided', async () => {
			assert.strictEqual(await DataCatalogUtils.getSearchTypeId(''), null);
		});

		it('returns id array from redis settings when assetType is registered', async () => {
			redisStore.dataCatalogSettings = JSON.stringify({
				assetTypes: { Dataset: 'dt1' },
				queryableStatuses: ['s1'],
			});
			assert.deepStrictEqual(await DataCatalogUtils.getSearchTypeId('Dataset'), ['dt1']);
			assert.deepStrictEqual(await DataCatalogUtils.getQueryableStatuses(), ['s1']);
		});

		it('getAttributeTypes returns undefined when settings miss the key', async () => {
			redisStore.dataCatalogSettings = JSON.stringify({});
			assert.strictEqual(await DataCatalogUtils.getAttributeTypes(), undefined);
		});
	});
});
