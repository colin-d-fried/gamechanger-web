const assert = require('assert');

// The source module depends on `constants.PERMISSIONS.*` and
// `constants.DARQ_EMAIL_SERVICE_USER`. In the current checkout these are not
// defined in node_app/config/constants.js directly (they appear to be layered
// in via downstream env/config), so we inject a mocked constants module for
// deterministic unit tests.
const mockedConstants = {
	PERMISSIONS: {
		WEBAPP_SUPER_ADMIN: 'Webapp Super Admin',
		CAN_VIEW_AGENCY: 'View Agency #ENTITY',
		CAN_VIEW_AGENCY_ALL: 'View Agency All',
		CAN_CREATE_PREFIXED_IMPALA_DATABASE: 'Create Prefixed Impala Database',
		CAN_EXPORT_UNLIMITED: 'Export Unlimited',
	},
	DARQ_EMAIL_SERVICE_USER: 'darq-email-service',
};

let permissions;
beforeAll(() => {
	jest.resetModules();
	jest.doMock('../../node_app/config/constants', () => mockedConstants);
	permissions = require('../../node_app/controllers/permissions');
});

afterAll(() => {
	jest.resetModules();
});

function reqWithPerms(perms, headers = {}) {
	return {
		headers,
		session: { user: { id: 'u', perms } },
		get(key) {
			return this.headers[key];
		},
	};
}

describe('permissions', () => {
	describe('#hasPermission', () => {
		it('returns true when the user holds the requested permission', () => {
			assert.strictEqual(permissions.hasPermission(reqWithPerms(['Foo Perm']), 'Foo Perm'), true);
		});

		it('is case-insensitive', () => {
			assert.strictEqual(permissions.hasPermission(reqWithPerms(['FOO PERM']), 'foo perm'), true);
		});

		it('returns true when the user is a super admin', () => {
			assert.strictEqual(
				permissions.hasPermission(reqWithPerms([mockedConstants.PERMISSIONS.WEBAPP_SUPER_ADMIN]), 'Anything'),
				true
			);
		});

		it('returns false when the user has no matching permission', () => {
			assert.strictEqual(permissions.hasPermission(reqWithPerms(['Other']), 'Foo Perm'), false);
		});
	});

	describe('#canPerformTransition', () => {
		it('allows transitions with null perms', () => {
			assert.strictEqual(permissions.canPerformTransition(reqWithPerms([]), { perms: null }), true);
		});

		it('allows transitions when session has matching perm', () => {
			assert.strictEqual(permissions.canPerformTransition(reqWithPerms(['X']), { perms: ['X', 'Y'] }), true);
		});

		it('allows super admins regardless of perms', () => {
			assert.strictEqual(
				permissions.canPerformTransition(reqWithPerms([mockedConstants.PERMISSIONS.WEBAPP_SUPER_ADMIN]), {
					perms: ['X'],
				}),
				true
			);
		});

		it('denies when no permission matches', () => {
			assert.strictEqual(permissions.canPerformTransition(reqWithPerms(['Other']), { perms: ['X'] }), false);
		});

		it('uses preloadedPermissions when provided', () => {
			assert.strictEqual(permissions.canPerformTransition(reqWithPerms([]), { perms: ['X'] }, ['X']), true);
		});
	});

	describe('#canViewEntity', () => {
		it('returns true for the DARQ email service user', () => {
			const req = reqWithPerms([], { SSL_CLIENT_S_DN_CN: mockedConstants.DARQ_EMAIL_SERVICE_USER });
			assert.strictEqual(permissions.canViewEntity(req, 'AnyAgency'), true);
		});

		it('returns true when the user has CAN_VIEW_AGENCY_ALL', () => {
			const req = reqWithPerms([mockedConstants.PERMISSIONS.CAN_VIEW_AGENCY_ALL]);
			assert.strictEqual(permissions.canViewEntity(req, 'AnyAgency'), true);
		});

		it('returns true when the user holds the specific entity permission', () => {
			const req = reqWithPerms(['View Agency Acme']);
			assert.strictEqual(permissions.canViewEntity(req, 'Acme'), true);
		});

		it('returns false otherwise', () => {
			assert.strictEqual(permissions.canViewEntity(reqWithPerms([]), 'AnyAgency'), false);
		});
	});

	describe('#allowCreateDatabase / #canExportUnlimited', () => {
		it('allowCreateDatabase respects CAN_CREATE_PREFIXED_IMPALA_DATABASE', () => {
			const req = reqWithPerms([mockedConstants.PERMISSIONS.CAN_CREATE_PREFIXED_IMPALA_DATABASE]);
			assert.strictEqual(permissions.allowCreateDatabase(req), true);
		});

		it('canExportUnlimited respects CAN_EXPORT_UNLIMITED', () => {
			const req = reqWithPerms([mockedConstants.PERMISSIONS.CAN_EXPORT_UNLIMITED]);
			assert.strictEqual(permissions.canExportUnlimited(req), true);
			assert.strictEqual(permissions.canExportUnlimited(reqWithPerms([])), false);
		});
	});
});
