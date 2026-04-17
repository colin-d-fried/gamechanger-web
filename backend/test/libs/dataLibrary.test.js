const assert = require('assert');

jest.mock('async-redis', () => ({
	createClient: () => ({ on: jest.fn(), get: jest.fn(), set: jest.fn(), select: jest.fn() }),
}));
jest.mock('aws-sdk', () => ({ S3: function S3() {} }));

const { DataLibrary } = require('../../node_app/lib/dataLibrary');

function makeLib(overrides = {}) {
	const logger = { info: jest.fn(), error: jest.fn() };
	const esSearchLib = {
		queryElasticsearch: jest.fn(),
		multiqueryElasticsearch: jest.fn(),
		addDocument: jest.fn(),
		updateDocument: jest.fn(),
	};
	const axios = { get: jest.fn() };
	const lib = new DataLibrary({
		logger,
		esSearchLib,
		axios,
		lineItemDetails: { findAll: jest.fn() },
		allOutgoingCounts: {},
		...overrides,
	});
	return { lib, logger, esSearchLib, axios };
}

describe('DataLibrary', () => {
	describe('#queryElasticSearch', () => {
		it('delegates to esSearchLib.queryElasticsearch', async () => {
			const { lib, esSearchLib } = makeLib();
			esSearchLib.queryElasticsearch.mockResolvedValue({ body: { hits: { hits: [] } } });
			const out = await lib.queryElasticSearch('gc', 'idx', { size: 1 }, 'u');
			assert.deepStrictEqual(out, { body: { hits: { hits: [] } } });
			expect(esSearchLib.queryElasticsearch).toHaveBeenCalledWith('gc', 'idx', { size: 1 }, 'u');
		});

		it('logs and rethrows errors', async () => {
			const { lib, esSearchLib, logger } = makeLib();
			esSearchLib.queryElasticsearch.mockRejectedValue(new Error('es-down'));
			await assert.rejects(lib.queryElasticSearch('gc', 'idx', {}, 'u'), /es-down/);
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('#mulitqueryElasticSearch', () => {
		it('delegates to esSearchLib.multiqueryElasticsearch', async () => {
			const { lib, esSearchLib } = makeLib();
			esSearchLib.multiqueryElasticsearch.mockResolvedValue({ body: {} });
			await lib.mulitqueryElasticSearch('gc', 'idx', [{}], 'u');
			expect(esSearchLib.multiqueryElasticsearch).toHaveBeenCalled();
		});

		it('logs and rethrows', async () => {
			const { lib, esSearchLib } = makeLib();
			esSearchLib.multiqueryElasticsearch.mockRejectedValue(new Error('msearch-down'));
			await assert.rejects(lib.mulitqueryElasticSearch('gc', 'idx', [{}], 'u'));
		});
	});

	describe('#updateDocument / #putDocument', () => {
		it('updateDocument delegates to esSearchLib.updateDocument', async () => {
			const { lib, esSearchLib } = makeLib();
			esSearchLib.updateDocument.mockResolvedValue(true);
			const out = await lib.updateDocument('gc', 'idx', {}, 'id', 'u');
			assert.strictEqual(out, true);
			expect(esSearchLib.updateDocument).toHaveBeenCalledWith('gc', 'idx', {}, 'id', 'u');
		});

		it('putDocument delegates to esSearchLib.addDocument', async () => {
			const { lib, esSearchLib } = makeLib();
			esSearchLib.addDocument.mockResolvedValue({ ok: true });
			const out = await lib.putDocument('gc', 'idx', { log: 1 });
			assert.deepStrictEqual(out, { ok: true });
		});
	});

	describe('#getESRequestConfig', () => {
		it('returns empty config for non-443 port without user', () => {
			const { lib } = makeLib();
			const cfg = lib.getESRequestConfig({ port: '9200' });
			assert.deepStrictEqual(cfg, {});
		});

		it('returns httpsAgent + auth for port 443 with user', () => {
			const { lib } = makeLib();
			const cfg = lib.getESRequestConfig({ port: '443', user: 'u', password: 'p', ca: 'c' });
			assert.ok(cfg.httpsAgent);
			assert.deepStrictEqual(cfg.auth, { username: 'u', password: 'p' });
		});

		it('returns httpsAgent without auth for port 443 with no user', () => {
			const { lib } = makeLib();
			const cfg = lib.getESRequestConfig({ port: '443' });
			assert.ok(cfg.httpsAgent);
			assert.strictEqual(cfg.auth, undefined);
		});
	});

	describe('#getESClientConfig', () => {
		it('builds a config with URL, auth, and httpsAgent when port=443 and user is provided', () => {
			const { lib } = makeLib();
			const cfg = lib.getESClientConfig({
				user: 'u',
				password: 'p',
				ca: 'c',
				protocol: 'https',
				host: 'h',
				port: '443',
				requestTimeout: 1000,
			});
			assert.ok(cfg.node.agent);
			assert.deepStrictEqual(cfg.auth, { username: 'u', password: 'p' });
			assert.strictEqual(cfg.node.url.host, 'h');
			assert.strictEqual(cfg.requestTimeout, 1000);
		});
	});

	describe('#getElasticsearchSearchUrl', () => {
		it('builds a _search URL using the default index', () => {
			const { lib } = makeLib();
			const url = lib.getElasticsearchSearchUrl('u', undefined);
			assert.ok(url.endsWith('/_search'));
		});

		it('builds an _msearch URL when multiSearch is true', () => {
			const { lib } = makeLib();
			const url = lib.getElasticsearchSearchUrl('u', 'myidx', false, {}, true);
			assert.ok(url.includes('/myidx/_msearch'));
		});
	});
});
