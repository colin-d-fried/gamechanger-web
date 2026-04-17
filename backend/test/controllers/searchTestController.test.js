const assert = require('assert');

jest.mock('async-redis', () => ({
	createClient: () => ({ on: jest.fn(), get: jest.fn(), set: jest.fn(), select: jest.fn() }),
}));

const { SearchTestController } = require('../../node_app/controllers/searchTestController');

describe('SearchTestController', () => {
	function makeController() {
		const controller = new SearchTestController();
		controller.policySearchHandler = {
			searchHelper: jest.fn().mockResolvedValue({ docs: [{ id: 'doc-1' }, { id: 'doc-2' }] }),
		};
		return controller;
	}

	describe('#resultsWrapper', () => {
		it('counts a found document and returns the 1-based position', () => {
			const controller = new SearchTestController();
			const sourceData = {
				source: 'source',
				number_of_documents_tested: 0,
				number_of_documents_not_found: 0,
				number_of_documents_found: 0,
				average_position: 0,
			};
			const docMetrics = {};
			const position = controller.resultsWrapper(
				{ docs: [{ id: 'x' }, { id: 'match' }] },
				'srcA',
				{ titleOfSearchTestDoc: 'Doc 1', idOfSearchTestDoc: 'match', searchMetaType: 'title' },
				sourceData,
				docMetrics
			);
			assert.strictEqual(position, 2);
			assert.strictEqual(sourceData.number_of_documents_tested, 1);
			assert.strictEqual(sourceData.number_of_documents_found, 1);
			assert.deepStrictEqual(docMetrics, { 'Doc 1': { title: 2 } });
		});

		it('counts a missed document and returns 0', () => {
			const controller = new SearchTestController();
			const sourceData = {
				source: 'source',
				number_of_documents_tested: 0,
				number_of_documents_not_found: 0,
				number_of_documents_found: 0,
				average_position: 0,
			};
			const docMetrics = {};
			const position = controller.resultsWrapper(
				{ docs: [{ id: 'x' }] },
				'srcA',
				{ titleOfSearchTestDoc: 'Doc 1', idOfSearchTestDoc: 'nope', searchMetaType: 'title' },
				sourceData,
				docMetrics
			);
			assert.strictEqual(position, 0);
			assert.strictEqual(sourceData.number_of_documents_not_found, 1);
		});

		it('counts empty result sets as misses', () => {
			const controller = new SearchTestController();
			const sourceData = {
				source: 'source',
				number_of_documents_tested: 0,
				number_of_documents_not_found: 0,
				number_of_documents_found: 0,
				average_position: 0,
			};
			controller.resultsWrapper(
				{ docs: [] },
				'srcA',
				{ titleOfSearchTestDoc: 'Doc 1', idOfSearchTestDoc: 'x', searchMetaType: 'title' },
				sourceData,
				{}
			);
			assert.strictEqual(sourceData.number_of_documents_not_found, 1);
		});

		it('merges new searchMetaType into existing docMetrics entry', () => {
			const controller = new SearchTestController();
			const sourceData = {
				source: 'source',
				number_of_documents_tested: 0,
				number_of_documents_not_found: 0,
				number_of_documents_found: 0,
				average_position: 0,
			};
			const docMetrics = { 'Doc 1': { title: 1 } };
			controller.resultsWrapper(
				{ docs: [{ id: 'match' }] },
				'srcA',
				{ titleOfSearchTestDoc: 'Doc 1', idOfSearchTestDoc: 'match', searchMetaType: 'filename' },
				sourceData,
				docMetrics
			);
			assert.deepStrictEqual(docMetrics, { 'Doc 1': { title: 1, filename: 1 } });
		});
	});

	describe('#testSearch', () => {
		it('invokes the policy search for each meta field and sends summary results', async () => {
			const controller = makeController();
			controller.policySearchHandler.searchHelper = jest.fn().mockResolvedValue({
				docs: [{ id: 'abc' }],
			});

			const req = {
				body: {
					sourceA: [
						{
							metaData: {
								title: 'My Title',
								display_title_s: 'Display',
								doc_num: 'N/A',
								filename: 'My Title.pdf',
								id: 'abc',
							},
						},
					],
				},
				session: { user: { id: 'u' } },
				get: jest.fn().mockReturnValue(undefined),
			};
			let sent;
			const res = { send: (v) => (sent = v) };

			await controller.testSearch(req, res);
			assert.ok(sent);
			assert.strictEqual(sent.results.length, 1);
			// One call per non-N/A meta field (title, display_title_s, filename) = 3
			expect(controller.policySearchHandler.searchHelper).toHaveBeenCalledTimes(3);
		});

		it('does not throw when searchHelper rejects', async () => {
			const controller = makeController();
			controller.policySearchHandler.searchHelper = jest.fn().mockRejectedValue(new Error('boom'));
			const req = {
				body: {
					sourceA: [
						{ metaData: { title: 't', display_title_s: 'N/A', doc_num: 'N/A', filename: 'N/A', id: '1' } },
					],
				},
				session: { user: { id: 'u' } },
				get: jest.fn().mockReturnValue(undefined),
			};
			const res = { send: jest.fn() };
			await assert.doesNotReject(controller.testSearch(req, res));
		});
	});
});
