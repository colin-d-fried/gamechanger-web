const assert = require('assert');
const { MlApiController } = require('../../node_app/controllers/mlApiController');
const { constructorOptionsMock } = require('../resources/testUtility');

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

function makeMlApi(overrides = {}) {
	return {
		getExpandedSearchTerms: jest.fn().mockResolvedValue({ terms: ['a'] }),
		queryExpansion: jest.fn().mockResolvedValue(['foo', 'foos']),
		getIntelAnswer: jest.fn().mockResolvedValue({ answers: [] }),
		getTextExtractions: jest.fn().mockResolvedValue([]),
		getSentenceTransformerResults: jest.fn().mockResolvedValue([]),
		getSentenceTransformerResultsForCompare: jest.fn().mockResolvedValue([]),
		transformResults: jest.fn().mockResolvedValue({ docs: [] }),
		recommender: jest.fn().mockResolvedValue({ recs: [] }),
		...overrides,
	};
}

describe('MlApiController', () => {
	const cases = [
		['requestExpandedSearchTerms', { termsList: ['a'], userId: 'u' }, 'getExpandedSearchTerms'],
		['requestQueryExpansion', { searchText: 'foo', userId: 'u' }, 'queryExpansion'],
		['requestIntelAnswer', { searchQuery: 'q', searchContext: 'c', userId: 'u' }, 'getIntelAnswer'],
		['requestTextExtractions', { text: 'doc', extractType: 'entities', userId: 'u' }, 'getTextExtractions'],
		['requestSentenceTransformerResults', { searchText: 'foo', userId: 'u' }, 'getSentenceTransformerResults'],
		[
			'requestSentenceTransformerResultsForCompare',
			{ searchText: 'foo', paragraphIdBeingMatched: '1', userId: 'u' },
			'getSentenceTransformerResultsForCompare',
		],
		['requestTransformResults', { searchText: 'foo', docs: [], userId: 'u' }, 'transformResults'],
		['requestRecommender', { doc: 'foo', userId: 'u' }, 'recommender'],
	];

	test.each(cases)('%s delegates to mlApi.%s and returns 200 on success', async (method, body, mlMethod) => {
		const mlApi = makeMlApi();
		const target = new MlApiController({ ...constructorOptionsMock, mlApi });
		const res = makeRes();
		await target[method]({ body }, res);
		assert.strictEqual(res.statusCode, 200);
		assert.strictEqual(mlApi[mlMethod].mock.calls.length, 1);
	});

	test.each(cases)('%s returns 500 when mlApi.%s rejects', async (method, body, mlMethod) => {
		const mlApi = makeMlApi({ [mlMethod]: jest.fn().mockRejectedValue(new Error('ml-down')) });
		const target = new MlApiController({ ...constructorOptionsMock, mlApi });
		const res = makeRes();
		await target[method]({ body }, res);
		assert.strictEqual(res.statusCode, 500);
	});
});
