import { expect, test } from '@playwright/test';
import { BasePage } from '../pages/BasePage';

/** Migrated from cypress/e2e/policy/documentView.cy.js */

test.describe('Tests various functionalities on the Document Details page.', () => {
	test.beforeEach(async ({ page, context }) => {
		await context.clearCookies();
		const base = new BasePage(page);
		await base.visitAndAcceptConsent(
			'gamechanger-details?cloneName=gamechanger&type=document&documentName=DoDI%203000.04%20CH%202.pdf_0'
		);
	});

	test('Document Details page is accessible via URL', async ({ page }) => {
		await expect(page.locator('[data-cy="details-type"]')).toContainText('Document', { timeout: 10_000 });
	});

	test('Document title matches the one in the URL', async ({ page }) => {
		await expect(page.locator('.name').first()).toContainText(
			'DoDI 3000.04 DoD Munitions Requirements Process (MRP)',
			{ timeout: 10_000 }
		);
	});

	test('Detects presence and naming of all accordion bars', async ({ page }) => {
		const sections = [
			{ n: 1, text: 'GRAPH VIEW' },
			{ n: 2, text: 'SIMILAR DOCUMENTS' },
			{ n: 3, text: 'DOCUMENTS REFERENCED' },
			{ n: 4, text: 'DOCUMENTS REFERENCED BY' },
		];
		for (const s of sections) {
			await expect(page.locator(`.section:nth-child(${s.n})>div`).first()).toContainText(s.text);
		}
	});

	test('Expands SIMILAR DOCUMENTS accordion and tests integrity of contents', async ({ page }) => {
		await page.locator('.MuiAccordionSummary-expandIcon').nth(1).click();
		await expect(page.locator('.MuiAccordionDetails-root').nth(1)).toBeVisible();
		const cards = page
			.locator('.MuiAccordionDetails-root')
			.nth(1)
			.locator('.row')
			.first()
			.locator('[data-cy="searchCard"]');
		await expect(cards).toHaveCount(11, { timeout: 30_000 });
	});

	test('Expands DOCUMENTS REFERENCED accordion and tests integrity of contents', async ({ page }) => {
		await page.locator('.MuiAccordionSummary-expandIcon').nth(2).click();
		await expect(page.locator('.MuiAccordionDetails-root').nth(2)).toBeVisible();
		const cards = page.locator('.row').nth(1).locator('[data-cy="searchCard"]');
		const count = await cards.count();
		expect(count).toBeGreaterThanOrEqual(6);
	});

	test('Expands DOCUMENTS REFERENCED BY accordion and tests integrity of contents', async ({ page }) => {
		await page.locator('.MuiAccordionSummary-expandIcon').nth(3).click();
		await expect(page.locator('.MuiAccordionDetails-root').nth(3)).toBeVisible();
		const cards = page.locator('.row').nth(2).locator('[data-cy="searchCard"]');
		const count = await cards.count();
		expect(count).toBeGreaterThanOrEqual(10);
	});

	test('Tests navigating through results pages in SIMILAR DOCUMENTS accordion', async ({ page }) => {
		await page.locator('.MuiAccordionSummary-expandIcon').nth(1).click();
		const firstPagePagination = page.locator('.pagination').first();
		await expect(firstPagePagination.locator('li').nth(2)).toHaveClass(/active/);

		const firstPageResults = await page
			.locator('.row')
			.first()
			.locator('.text')
			.allTextContents();

		await firstPagePagination.locator('li').nth(3).click();

		const secondPageResults = await page
			.locator('.row')
			.first()
			.locator('.text')
			.allTextContents();

		firstPageResults.forEach((value, i) => {
			expect(secondPageResults[i]).not.toEqual(value);
		});
	});
});
