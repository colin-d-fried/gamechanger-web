import { expect, test } from '@playwright/test';
import { BasePage } from '../pages/BasePage';

/** Migrated from cypress/e2e/advanaCommon/commonUI.cy.js */
test.describe('advanaCommon: side nav and consent banner', () => {
	test.beforeEach(async ({ page, context }) => {
		await context.clearCookies();
		const base = new BasePage(page);
		await base.visitPage('gamechanger');
	});

	test('The consent banner should be there.', async ({ page }) => {
		await expect(page.locator('[data-cy="consent-agreement"]')).toBeVisible({ timeout: 10_000 });
	});

	test('The consent banner should be gone with a cookie showing agreement.', async ({ page, context }) => {
		const base = new BasePage(page);
		await base.acceptConsent();

		await expect(page.locator('[data-cy="consent-agreement"]')).toHaveCount(0);

		const cookies = await context.cookies();
		const consent = cookies.find((c) => c.name === 'data.mil-consent-agreed');
		expect(consent).toBeDefined();
	});
});
