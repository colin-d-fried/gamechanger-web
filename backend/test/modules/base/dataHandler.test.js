const assert = require('assert');
const DataHandler = require('../../../node_app/modules/base/dataHandler');
const { constructorOptionsMock } = require('../../resources/testUtility');

describe('DataHandler (base)', () => {
	describe('#callFunction', () => {
		it('delegates to callFunctionHelper with body containing functionName + cloneName', async () => {
			const target = new DataHandler(constructorOptionsMock);
			const spy = jest.spyOn(target, 'callFunctionHelper');
			const options = { foo: 'bar' };

			const result = await target.callFunction('someFn', options, 'gamechanger', ['p'], 'u', {});

			assert.strictEqual(result.functionName, 'someFn');
			assert.strictEqual(result.cloneName, 'gamechanger');
			assert.strictEqual(result.foo, 'bar');
			expect(spy).toHaveBeenCalledWith(
				{ body: { ...options, functionName: 'someFn', cloneName: 'gamechanger' }, permissions: ['p'] },
				'u',
				{}
			);
			spy.mockRestore();
		});
	});
});
