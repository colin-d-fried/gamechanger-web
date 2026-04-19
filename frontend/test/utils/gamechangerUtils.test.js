/**
 * @jest-environment jsdom
 *
 * Covers pure helpers from `src/utils/gamechangerUtils.js`. We skip helpers
 * that reach into the DOM or external services (scrollToContentTop,
 * handlePdfOnLoad, displayBackendError) — those are covered by higher-level
 * integration tests.
 */
import {
	capitalizeFirst,
	getTrackingNameForFactory,
	getCloneTitleForFactory,
	commaThousands,
	numberWithCommas,
	getCurrentView,
	crawlerMappingFunc,
	invertedCrawlerMappingFunc,
	hashCode,
	getOrgToOrgQuery,
	getTypeQuery,
	getTypeDisplay,
	getDocTypeStyles,
	getTypeIcon,
	getOrgColor,
	getTypeColor,
	getTypeTextColor,
	getDocLinkTypeStyles,
	convertHexToRgbA,
	getLinkColor,
	shadeColor,
	formatDate,
	getQueryVariable,
	decodeTinyUrl,
	encode,
	exactMatch,
	convertDCTScoreToText,
	setFilterVariables,
	getReferenceListMetadataPropertyTable,
	getMetadataForPropertyTable,
	orgFilters,
	typeFilters,
	orgColorMap,
	typeColorMap,
	SEARCH_TYPES,
	RESULTS_PER_PAGE,
} from '../../src/utils/gamechangerUtils';

describe('gamechangerUtils', () => {
	describe('capitalizeFirst', () => {
		it('capitalizes the first character', () => {
			expect(capitalizeFirst('hello')).toBe('Hello');
		});

		it('handles single-character strings', () => {
			expect(capitalizeFirst('a')).toBe('A');
		});
	});

	describe('getTrackingNameForFactory', () => {
		it('prefixes GAMECHANGER_', () => {
			expect(getTrackingNameForFactory('policy')).toBe('GAMECHANGER_policy');
		});
	});

	describe('getCloneTitleForFactory', () => {
		const cloneData = { clone_name: 'jbook' };
		it('returns the clone_name as-is when upperCase is falsy', () => {
			expect(getCloneTitleForFactory(cloneData, false)).toBe('jbook');
		});

		it('uppercases when upperCase is true', () => {
			expect(getCloneTitleForFactory(cloneData, true)).toBe('JBOOK');
		});
	});

	describe('commaThousands', () => {
		it('returns empty string for null/undefined', () => {
			expect(commaThousands(null)).toBe('');
			expect(commaThousands(undefined)).toBe('');
		});

		it('inserts thousand separators', () => {
			expect(commaThousands(1234567)).toBe('1,234,567');
		});
	});

	describe('numberWithCommas', () => {
		it('returns falsy input unchanged', () => {
			expect(numberWithCommas(0)).toBe(0);
			expect(numberWithCommas('')).toBe('');
		});

		it('formats integers with commas', () => {
			expect(numberWithCommas(1000000)).toBe('1,000,000');
		});
	});

	describe('getCurrentView', () => {
		it('returns List when view is Card and list is truthy', () => {
			expect(getCurrentView('Card', true)).toBe('List');
		});

		it('returns Grid when view is Card and list is falsy', () => {
			expect(getCurrentView('Card', false)).toBe('Grid');
		});

		it('returns the view unchanged otherwise', () => {
			expect(getCurrentView('Summary', true)).toBe('Summary');
		});
	});

	describe('crawlerMappingFunc / invertedCrawlerMappingFunc', () => {
		it('maps a known crawler key to its display names', () => {
			expect(crawlerMappingFunc('dod_issuances')).toContain('WHS DoD Directives Division');
		});

		it('returns the original input when the crawler key is unknown', () => {
			expect(crawlerMappingFunc('unknown_crawler')).toBe('unknown_crawler');
		});

		it('round-trips a display name back to the crawler key via invertedCrawlerMappingFunc', () => {
			expect(invertedCrawlerMappingFunc('WHS DoD Directives Division')).toBe('dod_issuances');
		});

		it('is case-insensitive when inverting', () => {
			expect(invertedCrawlerMappingFunc('whs dod directives division')).toBe('dod_issuances');
		});

		it('returns empty string when the inverted name is not found', () => {
			expect(invertedCrawlerMappingFunc('made up agency')).toBe('');
		});
	});

	describe('hashCode', () => {
		it('returns 0 for empty strings', () => {
			expect(hashCode('')).toBe(0);
		});

		it('is deterministic for the same string', () => {
			expect(hashCode('abc')).toBe(hashCode('abc'));
		});

		it('produces different hashes for different inputs', () => {
			expect(hashCode('a')).not.toBe(hashCode('b'));
		});
	});

	describe('getOrgToOrgQuery', () => {
		it('returns an empty array when all orgs are selected', () => {
			expect(getOrgToOrgQuery(true, { Army: true, Navy: true })).toEqual([]);
		});

		it('returns only the selected orgs', () => {
			expect(getOrgToOrgQuery(false, { Army: true, Navy: false, USMC: true })).toEqual(['Army', 'USMC']);
		});
	});

	describe('getTypeQuery', () => {
		it('returns an empty array when all types are selected', () => {
			expect(getTypeQuery(true, { Documents: true })).toEqual([]);
		});

		it('filters to only the truthy types', () => {
			expect(getTypeQuery(false, { Documents: true, Memorandums: false })).toEqual(['Documents']);
		});
	});

	describe('getTypeDisplay', () => {
		it('strips the leading $ used for unresolved doc types', () => {
			expect(getTypeDisplay('$Type')).toBe('Type');
		});

		it('returns the input unchanged otherwise', () => {
			expect(getTypeDisplay('Type')).toBe('Type');
		});

		it('returns "" for empty docType (default arg)', () => {
			expect(getTypeDisplay()).toBe('');
		});
	});

	describe('getDocTypeStyles', () => {
		it('returns empty colors when docType is falsy', () => {
			expect(getDocTypeStyles('')).toEqual({ docTypeColor: '', docOrg: '', docOrgColor: '' });
		});

		it('falls back to brown for unknown orgs', () => {
			const result = getDocTypeStyles('Type', 'unknown-org');
			expect(result.docOrgColor).toBe('#964B00');
		});

		it('resolves known orgs via orgColorMap', () => {
			const result = getDocTypeStyles('Type', 'US Army');
			expect(result.docOrgColor).toBe(orgColorMap['US Army']);
		});

		it('uses docType as lookup key when docOrg is "Classif."', () => {
			const result = getDocTypeStyles('Dept. of Defense', 'Classif.');
			expect(result.docOrgColor).toBe(orgColorMap['Dept. of Defense']);
		});

		it('defaults docOrg to "GOV" when undefined', () => {
			const result = getDocTypeStyles('Type', undefined);
			expect(result.docOrg).toBe('GOV');
		});
	});

	describe('getTypeIcon', () => {
		it('returns a component for known types', () => {
			expect(getTypeIcon('Document')).toBeDefined();
			expect(getTypeIcon('Organization')).toBeDefined();
		});

		it('falls back to the default document icon for unknown types', () => {
			expect(getTypeIcon('Unknown')).toBeDefined();
		});
	});

	describe('getOrgColor', () => {
		it('returns the org color when known', () => {
			expect(getOrgColor('US Navy')).toBe(orgColorMap['US Navy']);
		});

		it('returns brown for unknown orgs', () => {
			expect(getOrgColor('made-up')).toBe('#964B00');
		});
	});

	describe('getTypeColor', () => {
		it('returns the configured color for a known type', () => {
			expect(getTypeColor('document')).toBe(typeColorMap.document);
		});

		it('returns the fallback grey for unknown types', () => {
			expect(getTypeColor('unknown')).toBe('#D1D1D1');
		});
	});

	describe('getTypeTextColor', () => {
		it('returns white for the known document/organization/publication keys', () => {
			expect(getTypeTextColor('Document')).toBe('white');
			expect(getTypeTextColor('Publication')).toBe('white');
			expect(getTypeTextColor('Organization')).toBe('white');
		});

		it('returns white for unknown types (fallback)', () => {
			expect(getTypeTextColor('Unknown')).toBe('white');
		});
	});

	describe('getDocLinkTypeStyles', () => {
		it('returns configured color for "belongs_to"', () => {
			expect(getDocLinkTypeStyles('belongs_to')).toBe('#B8860B');
		});

		it('returns grey for unknown link types', () => {
			expect(getDocLinkTypeStyles('other')).toBe('#808080');
		});

		it('is case-insensitive', () => {
			expect(getDocLinkTypeStyles('BELONGS_TO')).toBe('#B8860B');
		});
	});

	describe('convertHexToRgbA', () => {
		it('converts a 6-digit hex', () => {
			expect(convertHexToRgbA('#ff0000', 0.5)).toBe('rgba(255,0,0, 0.5)');
		});

		it('converts a 3-digit hex', () => {
			expect(convertHexToRgbA('#f00', 1)).toBe('rgba(255,0,0, 1)');
		});

		it('returns undefined for invalid hex values', () => {
			expect(convertHexToRgbA('not-a-hex', 1)).toBeUndefined();
		});
	});

	describe('getLinkColor', () => {
		it('returns an rgba string for a known link', () => {
			expect(getLinkColor({ label: 'belongs_to' }, 0.5)).toMatch(/^rgba\(/);
		});
	});

	describe('shadeColor', () => {
		it('lightens a color when amt is positive', () => {
			expect(shadeColor('#000000', 10)).toBe('#0a0a0a');
		});

		it('darkens a color when amt is negative', () => {
			expect(shadeColor('#ffffff', -255)).toBe('#000000');
		});

		it('preserves the # when input starts with one', () => {
			expect(shadeColor('#808080', 0)).toBe('#808080');
		});

		it('works on inputs without the leading #', () => {
			expect(shadeColor('808080', 0)).toBe('808080');
		});

		it('clamps color channels at 255', () => {
			expect(shadeColor('#ffffff', 10)).toBe('#ffffff');
		});
	});

	describe('formatDate', () => {
		it('formats dates with a custom separator', () => {
			// Use a fixed UTC date to avoid timezone flakiness.
			const d = new Date(Date.UTC(2023, 0, 15, 12, 0, 0));
			expect(formatDate(d, '/')).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
		});
	});

	describe('getQueryVariable', () => {
		it('returns the value of a query param', () => {
			expect(getQueryVariable('foo', 'http://example.com/?foo=bar&baz=qux')).toBe('bar');
		});

		it('returns null when the param is missing', () => {
			expect(getQueryVariable('missing', 'http://example.com/?foo=bar')).toBeNull();
		});

		it('handles URLs without a query string', () => {
			expect(getQueryVariable('foo', 'http://example.com/')).toBeNull();
		});
	});

	describe('decodeTinyUrl', () => {
		it('parses a URL without filters and defaults searchType to Keyword', () => {
			const data = decodeTinyUrl('http://example.com/?offset=0');
			expect(data.searchType).toBe('Keyword');
			expect(data.resultsPage).toBe(1);
			expect(data.pubDate).toBe('All');
			expect(data.orgFilterText).toBe('All sources');
			expect(data.typeFilterText).toBe('All types');
		});

		it('recognises a supported searchType', () => {
			const st = SEARCH_TYPES.simple;
			const data = decodeTinyUrl(`http://example.com/?searchType=${encodeURIComponent(st)}`);
			expect(data.searchType).toBe(st);
		});

		it('resolves offset into the correct results page', () => {
			const data = decodeTinyUrl(`http://example.com/?offset=${RESULTS_PER_PAGE * 2}`);
			expect(data.resultsPage).toBe(3);
		});

		it('parses pubDate when both timestamps are present', () => {
			const start = Date.UTC(2020, 0, 1);
			const end = Date.UTC(2020, 11, 31);
			const data = decodeTinyUrl(`http://example.com/?pubDate=${start}_${end}`);
			expect(data.pubDate).toMatch(/\d{2}\/\d{2}\/\d{2} - \d{2}\/\d{2}\/\d{2}/);
		});
	});

	describe('encode', () => {
		it('percent-encodes the special characters', () => {
			expect(encode('a+b')).toBe('a%2Bb');
			expect(encode('a?b')).toBe('a%3Fb');
			expect(encode('a#b')).toBe('a%23b');
		});

		it('leaves regular characters alone', () => {
			expect(encode('abc_def.pdf')).toBe('abc_def.pdf');
		});
	});

	describe('exactMatch', () => {
		it('returns true when the phrase contains the exact word', () => {
			expect(exactMatch('foo bar baz', 'bar', ' ')).toBe(true);
		});

		it('is case-insensitive', () => {
			expect(exactMatch('foo BAR baz', 'bar', ' ')).toBe(true);
		});

		it('returns false when the word is not present as a token', () => {
			expect(exactMatch('foo barbaz', 'bar', ' ')).toBe(false);
		});
	});

	describe('convertDCTScoreToText', () => {
		it.each([
			[0.9, 'High'],
			[0.85, 'High'],
			[0.8, 'Medium'],
			[0.75, 'Medium'],
			[0.7, 'Low'],
			[0.65, 'Low'],
			[0.5, 'No Match'],
			[0, 'No Match'],
		])('returns %s → %s', (score, expected) => {
			expect(convertDCTScoreToText(score)).toBe(expected);
		});
	});

	describe('setFilterVariables', () => {
		it('toggles on the keys present in the url-style string', () => {
			const obj = { Army: false, Navy: false, USMC: false };
			setFilterVariables(obj, 'Army_USMC');
			expect(obj).toEqual({ Army: true, Navy: false, USMC: true });
		});
	});

	describe('getReferenceListMetadataPropertyTable', () => {
		it('chunks references into groups of 4', () => {
			const list = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
			const result = getReferenceListMetadataPropertyTable(list);
			expect(result).toHaveLength(2);
			expect(result[0].References).toBe('a');
		});

		it('wraps URLs in anchor tags', () => {
			const list = [{ url: 'https://example.com', name: 'Ex' }];
			const result = getReferenceListMetadataPropertyTable(list);
			expect(result[0].References).toContain('<a');
			expect(result[0].References).toContain('https://example.com');
		});

		it('splits a single string reference by comma', () => {
			const result = getReferenceListMetadataPropertyTable(['one, two, three']);
			expect(result[0].References).toBe('one');
			expect(result[0][' ']).toBe('two');
		});

		it('returns [] for empty refs', () => {
			expect(getReferenceListMetadataPropertyTable([])).toEqual([]);
		});
	});

	describe('getMetadataForPropertyTable', () => {
		it('pulls configured fields from the item', () => {
			const item = {
				title: 'The Title',
				doc_num: '001',
				keyw_5: 'alpha, beta',
				missing_field: 'should be ignored',
			};
			const result = getMetadataForPropertyTable(item);
			expect(result).toEqual(
				expect.arrayContaining([
					{ Key: 'Title', Value: 'The Title' },
					{ Key: 'Document Number', Value: '001' },
					{ Key: 'Keywords', Value: 'alpha, beta' },
				])
			);
		});

		it('omits keys whose values are falsy', () => {
			const result = getMetadataForPropertyTable({});
			expect(result).toEqual([]);
		});
	});

	describe('exported constants', () => {
		it('orgFilters has the expected shape (all false by default)', () => {
			expect(Object.values(orgFilters).every((v) => v === false)).toBe(true);
		});

		it('typeFilters has the expected shape (all false by default)', () => {
			expect(Object.values(typeFilters).every((v) => v === false)).toBe(true);
		});
	});
});
