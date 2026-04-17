const assert = require('assert');

describe('EmailUtility', () => {
	let EmailUtility;
	let createdTransporters;
	let sendMailImpl;

	beforeEach(() => {
		jest.resetModules();
		createdTransporters = [];
		sendMailImpl = (_opts, cb) => cb(null, { accepted: ['a@b.c'] });
		jest.doMock('nodemailer', () => ({
			createTransport: (opts) => {
				const transporter = {
					opts,
					sendMail: (mailOpts, cb) => sendMailImpl(mailOpts, cb),
				};
				createdTransporters.push(transporter);
				return transporter;
			},
		}));
		EmailUtility = require('../../node_app/utils/emailUtility');
	});

	afterAll(() => {
		jest.resetModules();
	});

	function buildUtility() {
		return new EmailUtility({
			transportOptions: { host: 'mail.example.com' },
			fromName: 'Advana',
			fromEmail: 'noreply@example.com',
		});
	}

	it('constructs with transport, fromName, and fromEmail', () => {
		const util = buildUtility();
		assert.deepStrictEqual(util.transportOptions, { host: 'mail.example.com' });
		assert.strictEqual(util.fromName, 'Advana');
		assert.strictEqual(util.fromEmail, 'noreply@example.com');
	});

	it('resolves with info when sendMail succeeds', async () => {
		const util = buildUtility();
		const result = await util.sendEmail('<b>hi</b>', 'Subject', 'to@x.com', 'from@x.com', null, 'uid');
		assert.strictEqual(result.message, 'Message successfully sent');
		assert.strictEqual(createdTransporters.length, 1);
	});

	it('adds attachments to the mail options when provided', async () => {
		let capturedOpts;
		sendMailImpl = (opts, cb) => {
			capturedOpts = opts;
			cb(null, {});
		};
		const util = buildUtility();
		await util.sendEmail('<b>hi</b>', 'S', 'to@x.com', 'from@x.com', [{ filename: 'f.pdf' }], 'uid');
		assert.deepStrictEqual(capturedOpts.attachments, [{ filename: 'f.pdf' }]);
	});

	it('rejects when sendMail errors', async () => {
		sendMailImpl = (_opts, cb) => cb(new Error('smtp-down'));
		const util = buildUtility();
		let threw = false;
		try {
			await util.sendEmail('<b>hi</b>', 'S', 'to@x.com', 'from@x.com', null, 'uid');
		} catch (e) {
			threw = true;
			assert.strictEqual(e.error.message, 'Sending contact message failed due to internal error.');
		}
		assert.strictEqual(threw, true);
	});

	it('rejects on synchronous createTransport errors', async () => {
		jest.resetModules();
		jest.doMock('nodemailer', () => ({
			createTransport: () => {
				throw new Error('config-broken');
			},
		}));
		const LocalEmailUtility = require('../../node_app/utils/emailUtility');
		const util = new LocalEmailUtility({ transportOptions: {}, fromName: 'n', fromEmail: 'e' });
		let threw = false;
		try {
			await util.sendEmail('<b>hi</b>', 'S', 'to@x.com', 'from@x.com', null, 'uid');
		} catch (e) {
			threw = true;
			assert.ok(e.error.message.includes('2QO3162'));
		}
		assert.strictEqual(threw, true);
	});
});
