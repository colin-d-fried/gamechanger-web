const assert = require('assert');

describe('MLApiClient', () => {
	let MLApiClient;

	const mockedConstants = {
		USE_ML_API: true,
		GAMECHANGER_ML_API_BASE_URL: 'http://ml',
		GAMECHANGER_ML_API_TRAIN_BASE_URL: 'http://ml-train',
	};

	beforeAll(() => {
		jest.resetModules();
		jest.doMock('../../node_app/config/constants', () => mockedConstants);
		({ MLApiClient } = require('../../node_app/lib/mlApiClient'));
	});

	afterAll(() => {
		jest.resetModules();
	});

	function buildClient(axiosImpl) {
		return new MLApiClient({
			axios: axiosImpl,
			logger: { error: jest.fn(), info: jest.fn() },
		});
	}

	describe('#postData / wrappers', () => {
		it('sends the expanded term request with userId header', async () => {
			const axios = jest.fn().mockResolvedValue({ data: { terms: ['x'] } });
			const client = buildClient(axios);
			const res = await client.getExpandedSearchTerms(['foo'], 'user1', 'model-1');
			assert.strictEqual(axios.mock.calls.length, 1);
			const req = axios.mock.calls[0][0];
			assert.strictEqual(req.method, 'post');
			assert.strictEqual(req.url, 'http://ml/expandTerms');
			assert.strictEqual(req.headers.ssl_client_s_dn_cn, 'user1');
			assert.deepStrictEqual(req.data, { termsList: ['foo'], docIdsOnly: true, qe_model: 'model-1' });
			assert.deepStrictEqual(res, { terms: ['x'] });
		});

		it('getTextExtractions appends extractType to the url', async () => {
			const axios = jest.fn().mockResolvedValue({ data: {} });
			await buildClient(axios).getTextExtractions('hello', 'entities', 'u');
			assert.ok(axios.mock.calls[0][0].url.endsWith('?extractType=entities'));
		});

		it('getSentenceTransformerResultsForCompare forwards paragraphIdBeingMatched in the result', async () => {
			const axios = jest.fn().mockResolvedValue({ data: { matches: [1] } });
			const out = await buildClient(axios).getSentenceTransformerResultsForCompare('foo', 'p1', 'u');
			assert.strictEqual(out.paragraphIdBeingMatched, 'p1');
			assert.deepStrictEqual(out.matches, [1]);
		});

		it('rethrows and logs on axios rejection', async () => {
			const err = new Error('ml-down');
			const axios = jest.fn().mockRejectedValue(err);
			const logger = { error: jest.fn(), info: jest.fn() };
			const client = new MLApiClient({ axios, logger });
			let thrown;
			try {
				await client.queryExpansion('foo', 'u');
			} catch (e) {
				thrown = e;
			}
			assert.strictEqual(thrown, err);
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('postData short-circuit', () => {
		it('returns {} immediately when USE_ML_API is false', async () => {
			jest.resetModules();
			jest.doMock('../../node_app/config/constants', () => ({
				...mockedConstants,
				USE_ML_API: false,
			}));
			const { MLApiClient: DisabledClient } = require('../../node_app/lib/mlApiClient');
			const axios = jest.fn();
			const client = new DisabledClient({ axios, logger: { error: jest.fn(), info: jest.fn() } });
			const res = await client.queryExpansion('foo', 'u');
			assert.deepStrictEqual(res, {});
			assert.strictEqual(axios.mock.calls.length, 0);
		});
	});

	describe('#getData / getAPIInformation', () => {
		it('issues a GET and injects host into the response', async () => {
			jest.resetModules();
			jest.doMock('../../node_app/config/constants', () => mockedConstants);
			const { MLApiClient: LiveClient } = require('../../node_app/lib/mlApiClient');
			const axios = jest.fn().mockResolvedValue({ data: { version: '1.0' } });
			const client = new LiveClient({ axios, logger: { error: jest.fn(), info: jest.fn() } });
			const res = await client.getAPIInformation();
			const req = axios.mock.calls[0][0];
			assert.strictEqual(req.method, 'get');
			assert.strictEqual(req.url, 'http://ml/');
			assert.strictEqual(res.host, 'http://ml');
		});
	});
});
