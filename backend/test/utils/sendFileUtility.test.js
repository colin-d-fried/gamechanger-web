const assert = require('assert');
const { sendCSVFile } = require('../../node_app/utils/sendFileUtility');

function makeRes() {
	return {
		statusCode: undefined,
		headers: {},
		attachmentName: undefined,
		body: undefined,
		status(code) {
			this.statusCode = code;
			return this;
		},
		setHeader(name, value) {
			this.headers[name] = value;
		},
		attachment(name) {
			this.attachmentName = name;
		},
		send(data) {
			this.body = data;
		},
	};
}

describe('sendFileUtility', () => {
	describe('#sendCSVFile', () => {
		it('renders headers and rows with commas replaced in strings and ; in arrays', async () => {
			const res = makeRes();
			await sendCSVFile(
				res,
				'report',
				[
					{ header: 'Name', key: 'name' },
					{ header: 'Tags', key: 'tags' },
					{ header: 'Note', key: 'note' },
					{ header: 'Missing', key: 'missing' },
				],
				[{ name: 'a,b', tags: ['x', 'y'], note: 'hello, world', missing: null }]
			);
			assert.strictEqual(res.statusCode, 200);
			assert.strictEqual(res.headers['Content-Type'], 'text/csv');
			assert.strictEqual(res.attachmentName, 'report.csv');
			const lines = res.body.split('\n');
			assert.strictEqual(lines[0], 'Name,Tags,Note,Missing');
			assert.ok(lines[1].startsWith('a;b,x; y,hello; world,'));
		});

		it('handles Date values by calling toString on them', async () => {
			const res = makeRes();
			const date = new Date('2022-01-01T00:00:00Z');
			await sendCSVFile(res, 'dates', [{ header: 'D', key: 'd' }], [{ d: date }]);
			assert.ok(res.body.includes(date.toString().split(',')[0]));
		});

		it('returns 500 when res.send explodes', async () => {
			const res = {
				...makeRes(),
				status(code) {
					this.statusCode = code;
					return this;
				},
				send() {
					if (!this._retry) {
						this._retry = true;
						throw new Error('write-fail');
					}
				},
			};
			await sendCSVFile(res, 'x', [{ header: 'A', key: 'a' }], [{ a: 'x' }]);
			assert.strictEqual(res.statusCode, 500);
		});
	});
});
