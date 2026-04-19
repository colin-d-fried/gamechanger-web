import { expect, test } from '@playwright/test';
import { PolicyPage } from '../pages/PolicyPage';

/**
 * New E2E smoke test for the globalSearch module (src/components/modules/globalSearch).
 *
 * The globalSearch module renders the SearchTabBar used by the gamechanger clone,
 * so exercising a top-level search and flipping between result tabs is the
 * simplest end-to-end check that the module is wired up.
 */
test.describe('globalSearch smoke', () => {
	let policy: PolicyPage;

	test.beforeEach(async ({ page }) => {
		policy = new PolicyPage(page);
		await policy.login('gamechanger');
	});

	test('runs a generic search and renders the results tabs', async ({ page }) => {
		await policy.search('defense');

		// The globalSearch SearchTabBar is rendered with data-cy="tabs-container".
		await expect(page.locator('[data-cy="tabs-container"]')).toBeVisible({ timeout: 20_000 });

		// At least one result card is rendered.
		await expect(policy.cardContainer.first()).toBeVisible();
	});

	test('can flip between Documents and Organizations tabs', async ({ page }) => {
		await policy.search('army');

		await policy.switchResultsTab('Organizations');
		// Cards refresh on the Organizations tab.
		await expect(page.locator('[data-cy="tabs-container"]')).toBeVisible();

		await policy.switchResultsTab('Documents');
		await expect(policy.cardContainer.first()).toBeVisible();
	});
});
