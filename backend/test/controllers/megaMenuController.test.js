const assert = require('assert');
const { MegaMenuController } = require('../../node_app/controllers/megaMenuController');
const { constructorOptionsMock, reqMock } = require('../resources/testUtility');

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

describe('MegaMenuController', () => {
	const buildRow = (overrides = {}) => ({
		section: 'About',
		subsection1_label: '',
		subsection2_label: '',
		link_label: 'Link',
		href: 'https://example.com',
		chip: null,
		description: 'desc',
		new_tab: false,
		permission: null,
		link_identifier: null,
		hide_without_permission: false,
		...overrides,
	});

	describe('#generateLink', () => {
		it('maps a db row to a link object', () => {
			const target = new MegaMenuController({ ...constructorOptionsMock, model: {} });
			const link = target.generateLink(buildRow());
			assert.strictEqual(link.label, 'Link');
			assert.strictEqual(link.link, 'https://example.com');
			assert.strictEqual(link.notAvailable, false);
		});

		it('flags notAvailable when href is empty', () => {
			const target = new MegaMenuController({ ...constructorOptionsMock, model: {} });
			const link = target.generateLink(buildRow({ href: '' }));
			assert.strictEqual(link.link, '#');
			assert.strictEqual(link.notAvailable, true);
		});

		it('passes hideWithoutPermission through when set', () => {
			const target = new MegaMenuController({ ...constructorOptionsMock, model: {} });
			const link = target.generateLink(buildRow({ hide_without_permission: true }));
			assert.strictEqual(link.hideWithoutPermission, true);
		});
	});

	describe('#generateLinkLabels', () => {
		it('maps a list of rows to links', () => {
			const target = new MegaMenuController({ ...constructorOptionsMock, model: {} });
			const links = target.generateLinkLabels([buildRow({ link_label: 'A' }), buildRow({ link_label: 'B' })]);
			assert.strictEqual(links.length, 2);
			assert.strictEqual(links[0].label, 'A');
		});
	});

	describe('#getOverviewLink', () => {
		it('returns overview link metadata when a matching row exists', () => {
			const target = new MegaMenuController({ ...constructorOptionsMock, model: {} });
			const rows = [
				buildRow({ link_label: 'About Overview', href: '/overview', description: 'ov' }),
				buildRow({ link_label: 'Other' }),
			];
			const result = target.getOverviewLink(rows, 'About');
			assert.strictEqual(result.link, '/overview');
			assert.strictEqual(result.description, 'ov');
		});

		it('returns empty link when no overview row exists', () => {
			const target = new MegaMenuController({ ...constructorOptionsMock, model: {} });
			const result = target.getOverviewLink([buildRow({ link_label: 'Other' })], 'About');
			assert.strictEqual(result.link, '#');
		});
	});

	describe('#getLinks', () => {
		it('returns links config via res.send', async () => {
			const rows = [buildRow({ link_label: 'About Overview' }), buildRow({ link_label: 'AboutLink' })];
			const target = new MegaMenuController({
				...constructorOptionsMock,
				model: { findAll: () => Promise.resolve(rows) },
			});
			const res = makeRes();
			await target.getLinks(reqMock, res);
			assert.strictEqual(res.statusCode, 200);
			assert.ok(res.body.links);
			assert.ok(res.body.links.About);
		});
	});
});
