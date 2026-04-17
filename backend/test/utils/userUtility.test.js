const assert = require('assert');
const { getTenDigitUserId, getUserIdFromSAMLUserId } = require('../../node_app/utils/userUtility');

describe('userUtility', () => {
	describe('#getTenDigitUserId', () => {
		it('returns the first 10-digit sequence in the id', () => {
			assert.strictEqual(getTenDigitUserId('name.1234567890@mail.mil'), '1234567890');
		});

		it('returns null when no 10-digit sequence exists', () => {
			assert.strictEqual(getTenDigitUserId('name@mail.mil'), null);
		});
	});

	describe('#getUserIdFromSAMLUserId', () => {
		it('strips the @domain when fromReq is false', () => {
			assert.strictEqual(getUserIdFromSAMLUserId('foo.bar@mail.mil', false), 'foo.bar');
		});

		it('uses session.user.id when present', () => {
			const req = { session: { user: { id: 'foo.bar@mail.mil' } }, headers: {} };
			assert.strictEqual(getUserIdFromSAMLUserId(req), 'foo.bar');
		});

		it('falls back to SSL_CLIENT_S_DN_CN header when session missing', () => {
			const req = {
				headers: { SSL_CLIENT_S_DN_CN: 'cert.user@mil' },
				get(key) {
					return this.headers[key];
				},
			};
			assert.strictEqual(getUserIdFromSAMLUserId(req), 'cert.user');
		});

		it('returns Unknown User when nothing available', () => {
			const req = {
				headers: {},
				get() {
					return undefined;
				},
			};
			assert.strictEqual(getUserIdFromSAMLUserId(req), 'Unknown User');
		});

		it('returns Unknown User when input throws', () => {
			assert.strictEqual(getUserIdFromSAMLUserId(null), 'Unknown User');
		});
	});
});
