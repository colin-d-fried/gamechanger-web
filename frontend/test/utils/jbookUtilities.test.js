/**
 * @jest-environment jsdom
 *
 * Covers the pure helpers exported from `src/utils/jbookUtilities.js`.
 */
import {
	getClassLabel,
	getTotalCost,
	getSearchTerms,
	jbookDocTypeColors,
	getSubHeaderStyles,
	getConvertedName,
	getConvertedType,
	processSearchSettings,
	formatNum,
	getTableFormattedCost,
	getFormattedTotalCost,
} from '../../src/utils/jbookUtilities';

describe('jbookUtilities', () => {
	describe('getClassLabel', () => {
		it('returns "Unknown" when reviewData is falsy', () => {
			expect(getClassLabel(null)).toBe('Unknown');
			expect(getClassLabel(undefined)).toBe('Unknown');
		});

		it('returns pocClassLabel when pocAgreeLabel is "No"', () => {
			expect(
				getClassLabel({
					pocAgreeLabel: 'No',
					pocClassLabel: 'POC-CLASS',
					primaryClassLabel: 'primary',
				})
			).toBe('POC-CLASS');
		});

		it('returns serviceClassLabel when serviceAgreeLabel is "No"', () => {
			expect(
				getClassLabel({
					serviceAgreeLabel: 'No',
					serviceClassLabel: 'SVC-CLASS',
					primaryClassLabel: 'primary',
				})
			).toBe('SVC-CLASS');
		});

		it('falls back to primaryClassLabel when neither poc nor service override applies', () => {
			expect(getClassLabel({ primaryClassLabel: 'primary' })).toBe('primary');
		});

		it('returns "Unknown" when reviewData has no label fields', () => {
			expect(getClassLabel({})).toBe('Unknown');
		});
	});

	describe('getTotalCost', () => {
		it('returns 0 when no amounts are present', () => {
			expect(getTotalCost({})).toBe(0);
		});

		it('sums allPriorYearsAmount + priorYearAmount + currentYearAmount', () => {
			expect(
				getTotalCost({
					allPriorYearsAmount: 1,
					priorYearAmount: 2,
					currentYearAmount: 3,
				})
			).toBe(6);
		});

		it('tolerates missing fields', () => {
			expect(getTotalCost({ priorYearAmount: 10 })).toBe(10);
		});
	});

	describe('getSearchTerms', () => {
		it('splits simple unquoted terms', () => {
			const out = getSearchTerms('foo bar');
			expect(out).toEqual(expect.arrayContaining(['foo', 'bar']));
		});

		it('preserves quoted phrases as-is', () => {
			const out = getSearchTerms('"exact phrase" foo');
			// The quoted phrase is stripped of quotes before being pushed into the terms array.
			expect(out).toEqual(expect.arrayContaining(['exact phrase', 'foo']));
		});

		it('handles empty input', () => {
			expect(getSearchTerms('')).toEqual([]);
		});
	});

	describe('jbookDocTypeColors', () => {
		it('exposes color keys for known doc types', () => {
			expect(jbookDocTypeColors.Procurement).toBe('red');
			expect(jbookDocTypeColors['RDT&E']).toBe('blue');
			expect(jbookDocTypeColors['O&M']).toBe('green');
		});
	});

	describe('getSubHeaderStyles', () => {
		it('returns empty colors when docType is missing', () => {
			expect(getSubHeaderStyles('')).toEqual({ docTypeColor: '', serviceAgencyColor: '' });
		});

		it('maps Army to US Army with the org color', () => {
			const result = getSubHeaderStyles('Procurement', 'Army');
			expect(result.docTypeColor).toBe('red');
			expect(typeof result.serviceAgencyColor).toBe('string');
		});

		it('defaults unknown service agencies to Dept. of Defense coloring', () => {
			const result = getSubHeaderStyles('RDT&E', 'made-up');
			expect(result.docTypeColor).toBe('blue');
			// Default branch maps to "Dept. of Defense" which is in orgColorMap.
			expect(result.serviceAgencyColor).toBe('#636363');
		});

		it.each([
			['Air Force (AF)'],
			['Navy'],
			['The Joint Staff (TJS)'],
			['United States Special Operations Command (SOCOM)'],
			['US Marine Corp (USMC)'],
		])('returns a color mapping for %s', (service) => {
			const result = getSubHeaderStyles('O&M', service);
			expect(result.docTypeColor).toBe('green');
			expect(typeof result.serviceAgencyColor).toBe('string');
		});
	});

	describe('getConvertedName', () => {
		it('converts USSOCOM', () => {
			expect(getConvertedName('United States Special Operations Command (SOCOM)')).toBe('USSOCOM');
		});

		it('converts CBDP', () => {
			expect(getConvertedName('Chemical and Biological Defense Program (CBDP)')).toBe('CBDP');
		});

		it('returns unknown orgs unchanged', () => {
			expect(getConvertedName('Department of Defense')).toBe('Department of Defense');
		});
	});

	describe('getConvertedType', () => {
		it.each([
			['pdoc', 'Procurement'],
			['odoc', 'O&M'],
			['rdoc', 'RDT&E'],
		])('converts %s to %s', (input, expected) => {
			expect(getConvertedType(input)).toBe(expected);
		});

		it('returns unknown budget types unchanged', () => {
			expect(getConvertedType('custom')).toBe('custom');
		});
	});

	describe('processSearchSettings', () => {
		it('removes filter groups where the selected options equal the defaults', () => {
			const state = {
				jbookSearchSettings: {
					docType: ['a', 'b'],
					serviceAgency: ['Army'],
				},
				defaultOptions: {
					docType: ['a', 'b'],
					serviceAgency: ['Army', 'Navy'],
				},
			};
			const result = processSearchSettings(state, jest.fn());
			expect(result).not.toHaveProperty('docType');
			expect(result).toHaveProperty('serviceAgency');
		});

		it('drops empty/undefined setting values', () => {
			const state = {
				jbookSearchSettings: {
					docType: ['a'],
					somethingEmpty: '',
				},
				defaultOptions: { docType: ['a', 'b'] },
			};
			const result = processSearchSettings(state, jest.fn());
			expect(result).not.toHaveProperty('somethingEmpty');
		});
	});

	describe('formatNum', () => {
		it('formats million-range integers', () => {
			expect(formatNum(500)).toBe('$500 M');
		});

		it('formats billion-range values', () => {
			expect(formatNum(1500)).toBe('$1.50 B');
		});

		it('formats floats to 2 decimals in the M range', () => {
			expect(formatNum(1.234)).toBe('$1.23 M');
		});
	});

	describe('getTableFormattedCost', () => {
		it('returns "N/A" for falsy costs', () => {
			expect(getTableFormattedCost(null)).toBe('N/A');
			expect(getTableFormattedCost(0)).toBe('N/A');
		});

		it('formats non-zero costs via formatNum', () => {
			expect(getTableFormattedCost(1500)).toBe('$1.50 B');
		});
	});

	describe('getFormattedTotalCost', () => {
		it('returns "Continuing" for continuing projects', () => {
			expect(getFormattedTotalCost({ continuing: true })).toBe('Continuing');
		});

		it('returns "N/A" when totalCost is missing', () => {
			expect(getFormattedTotalCost({})).toBe('N/A');
		});

		it('formats totalCost via formatNum when present', () => {
			expect(getFormattedTotalCost({ totalCost: 500 })).toBe('$500 M');
		});
	});
});
