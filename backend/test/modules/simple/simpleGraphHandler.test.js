const assert = require('assert');

// simpleGraphHandler exports an *instance*, not a class
const simpleGraphHandler = require('../../../node_app/modules/simple/simpleGraphHandler');

describe('SimpleGraphHandler', () => {
	it('searchHelper returns the body unchanged', async () => {
		const body = { foo: 'bar' };
		assert.deepStrictEqual(await simpleGraphHandler.searchHelper({ body }, 'u'), body);
	});

	it('queryHelper returns the body unchanged', async () => {
		const body = { q: 1 };
		assert.deepStrictEqual(await simpleGraphHandler.queryHelper({ body }, 'u', 'c'), body);
	});

	it('callFunctionHelper returns the body unchanged', async () => {
		const body = { fn: 'x' };
		assert.deepStrictEqual(await simpleGraphHandler.callFunctionHelper({ body }, 'u'), body);
	});
});
