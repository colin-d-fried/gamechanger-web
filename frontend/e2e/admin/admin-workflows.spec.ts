import { expect, test } from '@playwright/test';
import { BasePage } from '../pages/BasePage';

/**
 * New E2E smoke tests for the gamechanger-admin page (src/components/admin).
 *
 * The existing cypress/advanaCommon/advanaAuthorization.cy.js already covers
 * the unauthorized/authorized split. This file verifies the admin surface
 * renders its menu and primary sub-views once the user is authorized.
 */
test.describe('Admin workflows smoke', () => {
	test.beforeEach(async ({ page, context }) => {
		await context.clearCookies();
		const base = new BasePage(page);
		await base.visitAndAcceptConsent('gamechanger-admin');
	});

	test('renders the admin page without an unauthorized banner', async ({ page }) => {
		await expect(page.locator('[data-cy="unauthorized-page"]')).toHaveCount(0);
		// The admin page has a header and tabs; any h1/h2 + a heading text is enough
		// as a smoke check. AdminMenu.js lives under .admin-menu or similar.
		await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });
	});

	test('admin menu exposes expected top-level sections', async ({ page }) => {
		// The admin sections map to folders in src/components/admin/. We check that
		// at least a few of those labels appear somewhere on the page (case-insensitive).
		const expectedLabels = ['Homepage', 'Users', 'API', 'Feedback', 'Clone'];
		for (const label of expectedLabels) {
			await expect(page.getByText(new RegExp(label, 'i')).first()).toBeVisible({ timeout: 15_000 });
		}
	});
});
