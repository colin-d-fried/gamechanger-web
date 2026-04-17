const assert = require('assert');
const { parse } = require('../../node_app/utils/lunrSearchUtils');

describe('lunrSearchUtils', () => {
	describe('#parse', () => {
		it('wraps single words with wildcards', () => {
			const result = parse('foo');
			assert.ok(result.startsWith('*foo*'));
			assert.ok(result.endsWith('foo'));
		});

		it('appends a trailing wildcard to the last word for multi-word input', () => {
			const result = parse('foo bar');
			assert.ok(result.startsWith('foo bar* '));
		});

		it('does not append wildcard when input ends with a quote', () => {
			const result = parse('"exact phrase"');
			assert.ok(!result.startsWith('"exact phrase"*'));
		});

		it('does not append wildcard when input already ends with *', () => {
			const result = parse('foo*');
			assert.ok(result.startsWith('foo* '));
		});

		it('replaces ! with -', () => {
			const result = parse('foo !bar');
			assert.ok(result.includes('foo -bar'));
		});

		it('transforms a quoted phrase by adding + prefix to each word and stripping quotes', () => {
			const result = parse('"exact phrase" extra');
			// Check the transformed (leading) portion before the original appended input
			const transformed = result.split(' exact phrase')[0]; // split on literal original copy
			assert.ok(transformed.includes('+exact +phrase'));
		});
	});
});
