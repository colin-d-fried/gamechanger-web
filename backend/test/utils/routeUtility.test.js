const assert = require('assert');
const { ORGFILTER, getOrgOptions, getOrgToDocQuery } = require('../../node_app/utils/routeUtility');

describe('routeUtility', () => {
	describe('#ORGFILTER', () => {
		it('contains an entry per top level org with default false', () => {
			const keys = Object.keys(ORGFILTER);
			assert.ok(keys.length > 0);
			keys.forEach((k) => assert.strictEqual(ORGFILTER[k], false));
		});
	});

	describe('#getOrgOptions', () => {
		it('returns a _ joined string of orgs', () => {
			const orgs = getOrgOptions();
			assert.strictEqual(typeof orgs, 'string');
			assert.ok(orgs.includes('Dept. of Defense'));
			assert.ok(orgs.includes('_'));
		});
	});

	describe('#getOrgToDocQuery', () => {
		it('returns * when allOrgsSelected is true', () => {
			assert.strictEqual(getOrgToDocQuery({}, true), '*');
		});

		it('returns " OR " joined list of the docs for selected orgs', () => {
			const query = getOrgToDocQuery({ 'Dept. of Defense': true, 'US Navy': false }, false);
			assert.ok(query.includes('DoD'));
			assert.ok(query.includes(' OR '));
			assert.ok(!query.includes('OPNAVNOTE'));
		});

		it('returns an empty string when no orgs are selected', () => {
			assert.strictEqual(getOrgToDocQuery({ 'Dept. of Defense': false }, false), '');
		});
	});
});
