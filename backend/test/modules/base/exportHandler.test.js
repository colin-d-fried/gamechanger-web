const assert = require('assert');
const ExportHandler = require('../../../node_app/modules/base/exportHandler');
const { constructorOptionsMock } = require('../../resources/testUtility');

describe('ExportHandler (base)', () => {
	function makeTarget() {
		return new ExportHandler({
			...constructorOptionsMock,
			searchUtility: {},
			exportHistory: {},
			reports: {},
			appSettings: {},
		});
	}

	describe('#export', () => {
		it('populates searchText / format / cloneName on the body and returns via the helper', async () => {
			const target = makeTarget();
			const res = {};
			const result = await target.export(res, 'foo', 'pdf', { limit: 10 }, 'gamechanger', [], 'u', {});
			assert.strictEqual(result.searchText, 'foo');
			assert.strictEqual(result.format, 'pdf');
			assert.strictEqual(result.cloneName, 'gamechanger');
			assert.strictEqual(result.limit, 10);
		});

		it('rethrows when the helper throws', async () => {
			const target = makeTarget();
			target.exportHelper = () => {
				throw new Error('helper-broke');
			};
			let thrown;
			try {
				await target.export({}, 'foo', 'pdf', {}, 'clone', [], 'u', {});
			} catch (e) {
				thrown = e;
			}
			assert.strictEqual(thrown, 'helper-broke');
		});
	});

	describe('other helpers', () => {
		it.each([
			['exportReview', 'exportReviewHelper'],
			['exportUsers', 'exportUsersHelper'],
			['exportChecklist', 'exportChecklistHelper'],
			['exportProfilePage', 'exportProfilePageHelper'],
		])('%s delegates to %s with body + permissions', async (method, helper) => {
			const target = makeTarget();
			const spy = jest.spyOn(target, helper);
			await target[method]({}, ['p1'], { opt: 1 }, 'u');
			expect(spy).toHaveBeenCalledWith({ body: { opt: 1 }, permissions: ['p1'] }, {}, 'u');
			spy.mockRestore();
		});

		it('swallows errors thrown in the review/users/checklist/profile helpers', async () => {
			const target = makeTarget();
			const errorSpy = jest.spyOn(target.logger, 'error').mockImplementation(() => {});
			for (const [method, helper] of [
				['exportReview', 'exportReviewHelper'],
				['exportUsers', 'exportUsersHelper'],
				['exportChecklist', 'exportChecklistHelper'],
				['exportProfilePage', 'exportProfilePageHelper'],
			]) {
				target[helper] = () => {
					throw new Error('x');
				};
				// should NOT throw
				await target[method]({}, [], {}, 'u');
			}
			expect(errorSpy).toHaveBeenCalled();
			errorSpy.mockRestore();
		});
	});
});
