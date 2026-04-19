import { expect, test } from '@playwright/test';
import { PolicyPage } from '../pages/PolicyPage';

/**
 * New E2E smoke tests for the Analyst Tools surface
 * (src/components/analystTools + edaAnalyticsToolsHandler).
 *
 * Analyst tools is reachable from the side nav inside a clone; the handler
 * renders a sidebar (GCAnalystToolsSideBar) once the user navigates to it.
 */
test.describe('Analyst Tools smoke', () => {
	let policy: PolicyPage;

	test.beforeEach(async ({ page }) => {
		policy = new PolicyPage(page);
		await policy.login('gamechanger');
	});

	test('navigates to analyst tools from the side nav', async ({ page }) => {
		// Expand the side nav if it's collapsed, then click the analyst-tools entry.
		const openBtn = page.locator('[data-cy="side-nav-open-button"]');
		if (await openBtn.isVisible().catch(() => false)) {
			await openBtn.click();
		}

		const navItem = page.getByRole('link', { name: /analyst tools/i }).first();
		const fallbackItem = page.getByText(/analyst tools/i).first();

		if (await navItem.isVisible().catch(() => false)) {
			await navItem.click();
		} else {
			await fallbackItem.click();
		}

		// The analyst tools sidebar (GCAnalystToolsSideBar) should render.
		// It contains links for "Document Comparison", "Favorites", etc.
		await expect(
			page.getByText(/document comparison|favorites|responsibility/i).first()
		).toBeVisible({ timeout: 20_000 });
	});
});
