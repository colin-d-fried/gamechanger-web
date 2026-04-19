import { expect, test } from '@playwright/test';
import { EdaPage } from '../pages/EdaPage';

/** Migrated from cypress/e2e/eda/edaSearches.cy.js */

test.describe('EDA: search and filters', () => {
	let eda: EdaPage;

	test.beforeEach(async ({ page }) => {
		eda = new EdaPage(page);
		await eda.initialVisit();
	});

	test('basic search', async ({ page }) => {
		await eda.simpleSearch('army');

		await expect(eda.filterContainer).toBeVisible({ timeout: 20_000 });
		await expect(eda.dataCy('eda-results-found')).toBeVisible({ timeout: 20_000 });
		await expect(page.locator('.view-buttons-container')).toBeVisible();
		await expect(eda.cardFront.first()).toBeVisible();
		const count = await eda.cardFront.count();
		expect(count).toBeGreaterThan(1);
	});

	test('search using advanced search filters', async () => {
		await eda.searchInput.fill('defense');
		await eda.advancedSearchButton.click();
		await eda.page.locator('#reqDescFilter').fill('system');
		await eda.page.locator('#clinTextFilter').fill('dcma');
		await eda.searchButton.click();

		await expect(eda.cardFront.first()).toBeVisible({ timeout: 15_000 });
		const count = await eda.cardFront.count();
		expect(count).toBeGreaterThan(0);
		expect(count).toBeLessThan(1000);
	});

	test('basic search submitted with enter', async ({ page }) => {
		await eda.searchInput.fill('army');
		await page.keyboard.press('Enter');

		await expect(eda.filterContainer).toBeVisible({ timeout: 20_000 });
		await expect(eda.dataCy('eda-results-found')).toBeVisible({ timeout: 20_000 });
		await expect(page.locator('.view-buttons-container')).toBeVisible();
		await expect(eda.cardFront.first()).toBeVisible();
		expect(await eda.cardFront.count()).toBeGreaterThan(1);

		// Toggle the advanced-search menu, then run another query — repro for a past bug.
		await eda.advancedSearchButton.click();
		await expect(page.locator('#advanced-filters')).toBeVisible();
		await eda.advancedSearchButton.click();

		await eda.searchInput.fill('navy');
		await page.keyboard.press('Enter');

		await expect(eda.filterContainer).toBeVisible({ timeout: 20_000 });
		await expect(eda.dataCy('eda-results-found')).toBeVisible({ timeout: 20_000 });
		await expect(page.locator('.view-buttons-container')).toBeVisible();
		await expect(eda.cardFront.first()).toBeVisible();
		expect(await eda.cardFront.count()).toBeGreaterThan(1);
	});

	test('test out text input filters', async ({ page }) => {
		await eda.searchInput.fill('defense');
		await eda.searchButton.click();

		await expect(eda.filterContainer).toBeVisible({ timeout: 20_000 });
		await page.locator('[data-cy="eda-filter-accordion-header"]').click();
		await page.locator('#vendorNameAccordion').click();
		await page.locator('#vendorNameFilter').fill('Booz');
		await eda.searchButton.click();

		await expect(eda.cardFront.first()).toBeVisible({ timeout: 15_000 });
		expect(await eda.cardFront.count()).toBeLessThan(1000);
	});

	test('test out checkbox filters', async ({ page }) => {
		await eda.searchInput.fill('defense');
		await eda.searchButton.click();

		await expect(eda.filterContainer).toBeVisible({ timeout: 20_000 });
		await page.locator('[data-cy="eda-filter-accordion-header"]').click();

		await page.locator('#issuedByAccordion').click();
		await page.locator('#specificOrgCheckbox').click();
		await page.locator('#airForceCheckbox').click();

		await page.locator('#fiscalYearAccordion').click();
		await page.locator('#specificFiscalYearCheckbox').click();
		await page.locator('#year2021Checkbox').click();
		await page.locator('#year2022Checkbox').click();

		await page.locator('#contractDataAccordion').click();
		await page.locator('#specificContractDataCheckbox').click();
		await page.locator('#pdsCheckbox').click();

		await eda.searchButton.click();

		const count = await eda.cardFront.count();
		expect(count).toBeGreaterThan(0);
		expect(count).toBeLessThan(100);
	});

	test('test out min and max obligated amounts filters', async ({ page }) => {
		await eda.searchInput.fill('defense');
		await eda.searchButton.click();

		await expect(eda.filterContainer).toBeVisible({ timeout: 20_000 });
		await page.locator('[data-cy="eda-filter-accordion-header"]').click();
		await page.locator('#obligatedAmountAccordion').click();
		await page.locator('#minObligatedAmountFilter').fill('100000');
		await page.locator('#maxObligatedAmountFilter').fill('500000');

		await eda.searchButton.click();

		const count = await eda.cardFront.count();
		expect(count).toBeGreaterThan(0);
		expect(count).toBeLessThan(1000);
	});

	test('test out multiselect filters', async ({ page }) => {
		await eda.searchInput.fill('defense');
		await eda.searchButton.click();

		await expect(eda.filterContainer).toBeVisible({ timeout: 20_000 });
		await page.locator('[data-cy="eda-filter-accordion-header"]').click();

		await page.locator('#issuedByAccordion').click();
		const issueOfficeDoDAAC = page.locator('#issueOfficeDoDAAC-multiselect-input');
		await issueOfficeDoDAAC.fill('FA8075');
		await issueOfficeDoDAAC.press('Enter');
		const issueOfficeName = page.locator('#issueOfficeName-multiselect-input');
		await issueOfficeName.fill('FA8075 774 ESS');
		await issueOfficeName.press('Enter');

		await page.locator('#fundedByAccordion').click();
		const fundingOfficeDoDAAC = page.locator('#fundingOfficeDoDAAC-multiselect-input');
		await fundingOfficeDoDAAC.fill('HJ4701');
		await fundingOfficeDoDAAC.press('Enter');
		const fundingAgencyName = page.locator('#fundingAgencyName-multiselect-input');
		await fundingAgencyName.fill('IMMEDIATE OFFICE OF THE SECRETARY OF DEFENSE');
		await fundingAgencyName.press('Enter');

		await eda.searchButton.click();

		const count = await eda.cardFront.count();
		expect(count).toBeGreaterThan(0);
		expect(count).toBeLessThan(1000);
	});
});
