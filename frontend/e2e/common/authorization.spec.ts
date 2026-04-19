import { expect, test } from '@playwright/test';

/**
 * Migrated from cypress/e2e/advanaCommon/advanaAuthorization.cy.js.
 *
 * The original test used CypressHelper.setupHeaders(cy, cn, userId) to
 * intercept XHRs and set x-env-ssl-client-certificate + SSL-CLIENT-S-DN-CN.
 * Playwright sends those headers on every request when overridden via
 * `test.use({ extraHTTPHeaders })` below.
 */

test.describe('Authorization API: unauthorized user', () => {
	test.use({
		extraHTTPHeaders: {
			'x-env-ssl-client-certificate': 'not.a.person.1234567890',
			'SSL-CLIENT-S-DN-CN': '1234567890@mil',
		},
	});

	test('Should be unauthorized to view the gamechanger admin page', async ({ page }) => {
		await page.goto('/#/gamechanger-admin');
		await expect(page.locator('[data-cy="unauthorized-page"]')).toBeVisible({ timeout: 15_000 });
	});
});

test.describe('Authorization API: authorized user', () => {
	// Inherits BASE_URL + default SSL_* headers from playwright.config.ts.
	test('Should be authorized to view the gamechanger admin page', async ({ page }) => {
		await page.goto('/#/gamechanger-admin');
		await expect(page.locator('[data-cy="unauthorized-page"]')).toHaveCount(0);
	});
});
