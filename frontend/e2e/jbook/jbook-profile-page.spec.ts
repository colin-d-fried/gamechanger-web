import { expect, test } from '@playwright/test';
import { JbookPage } from '../pages/JbookPage';

/** Migrated from cypress/e2e/jbook/jbookProfilePage.cy.js */

test.describe('Tests the JBook portfolio page', () => {
	test.beforeEach(async ({ page }) => {
		const jbook = new JbookPage(page);
		await jbook.visitAndAcceptConsent(
			'jbook/profile?type=RDT%26E&searchText=%22Navigation%20and%20Timing%22&id=rdoc#2023#PB#07#0205778A#21#N/A#2040#EG3&appropriationNumber=2040&portfolioName=General&budgetYear=2023'
		);
		await expect(jbook.dataCy('jbook-project-descriptions')).toBeVisible({ timeout: 15_000 });
	});

	test('Should ensure search text with quotes are highlighted on the portfolio page', async ({ page }) => {
		await expect(
			page.locator('[style="background-color:#1C2D64;color:white;padding:0 4px"]').first()
		).toBeVisible();
	});
});
