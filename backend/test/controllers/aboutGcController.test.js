const assert = require('assert');
const { AboutGcController } = require('../../node_app/controllers/aboutGcController');
const { constructorOptionsMock, reqMock } = require('../resources/testUtility');

describe('AboutGcController', function () {
	describe('#getFAQ', () => {
		it('returns all FAQ entries with status 200', async () => {
			const expected = [
				{ id: 1, question: 'Q1', answer: 'A1' },
				{ id: 2, question: 'Q2', answer: 'A2' },
			];

			const opts = {
				...constructorOptionsMock,
				faq: {
					findAll: () => Promise.resolve(expected),
				},
			};

			const target = new AboutGcController(opts);

			let resCode;
			let resMsg;
			const res = {
				status(code) {
					resCode = code;
					return this;
				},
				send(msg) {
					resMsg = msg;
					return this;
				},
			};

			try {
				await target.getFAQ(reqMock, res);
			} catch (e) {
				assert.fail(e);
			}

			assert.strictEqual(resCode, 200);
			assert.deepStrictEqual(resMsg, expected);
		});

		it('returns 500 when the model throws', async () => {
			const opts = {
				...constructorOptionsMock,
				faq: {
					findAll: () => Promise.reject(new Error('db-down')),
				},
			};
			const target = new AboutGcController(opts);

			let resCode;
			const res = {
				status(code) {
					resCode = code;
					return this;
				},
				send() {
					return this;
				},
			};

			try {
				await target.getFAQ(reqMock, res);
			} catch (e) {
				assert.fail(e);
			}
			assert.strictEqual(resCode, 500);
		});
	});
});
