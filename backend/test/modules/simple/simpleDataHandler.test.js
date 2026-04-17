const assert = require('assert');
const SimpleDataHandler = require('../../../node_app/modules/simple/simpleDataHandler');
const { constructorOptionsMock } = require('../../resources/testUtility');

describe('SimpleDataHandler', () => {
	describe('#callFunctionHelper', () => {
		it('returns {} and logs an error for an unknown functionName', async () => {
			const target = new SimpleDataHandler(constructorOptionsMock);
			const errorSpy = jest.spyOn(target.logger, 'error').mockImplementation(() => {});
			const result = await target.callFunctionHelper({ body: { functionName: 'nope' } }, 'u');
			assert.deepStrictEqual(result, {});
			expect(errorSpy).toHaveBeenCalled();
			errorSpy.mockRestore();
		});
	});
});
