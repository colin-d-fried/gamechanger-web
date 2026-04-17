const assert = require('assert');

jest.mock('async-redis', () => ({
	createClient: () => ({ on: jest.fn(), get: jest.fn(), set: jest.fn(), select: jest.fn() }),
}));

const JBookExportHandler = require('../../../node_app/modules/jbook/jbookExportHandler');

function makeHandler() {
	const handler = new JBookExportHandler({});
	handler.logger = { info: jest.fn(), error: jest.fn() };
	return handler;
}

describe('JBookExportHandler', () => {
	describe('#generateCSVList', () => {
		it('joins each review row matching the requested portfolio to its parent doc', () => {
			const handler = makeHandler();
			const results = handler.generateCSVList(
				{
					docs: [
						{
							id: 'doc-1',
							title: 'Doc',
							review_n: [
								{ portfolio_name_s: 'AI', reviewer_s: 'Alice' },
								{ portfolio_name_s: 'Other', reviewer_s: 'Bob' },
							],
						},
					],
				},
				'AI'
			);
			assert.strictEqual(results.length, 1);
			assert.strictEqual(results[0].id, 'doc-1');
			assert.strictEqual(results[0].reviewer_s, 'Alice');
		});

		it('keeps docs without reviews as standalone rows', () => {
			const handler = makeHandler();
			const results = handler.generateCSVList({ docs: [{ id: 'doc-1', title: 'Doc' }] }, 'AI');
			assert.strictEqual(results.length, 1);
			assert.strictEqual(results[0].id, 'doc-1');
		});
	});

	describe('#generateCSVReviewList', () => {
		it('emits one row per review', () => {
			const handler = makeHandler();
			const results = handler.generateCSVReviewList({
				docs: [
					{
						id: 'd1',
						review_n: [{ reviewer_s: 'A' }, { reviewer_s: 'B' }],
					},
					{
						id: 'd2',
						review_n: [{ reviewer_s: 'C' }],
					},
					{ id: 'd3' },
				],
			});
			assert.strictEqual(results.length, 3);
			assert.deepStrictEqual(
				results.map((r) => r.reviewer_s),
				['A', 'B', 'C']
			);
		});

		it('returns an empty list when nothing has reviews', () => {
			const handler = makeHandler();
			const results = handler.generateCSVReviewList({ docs: [{ id: 'd1' }, { id: 'd2' }] });
			assert.deepStrictEqual(results, []);
		});
	});
});
