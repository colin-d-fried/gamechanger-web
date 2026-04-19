import { expect, test } from '@playwright/test';
import { PolicyPage } from '../pages/PolicyPage';

/** Migrated from cypress/e2e/policy/policySearches.cy.js */

test.describe('Tests multiple types of policy searches.', () => {
	let policy: PolicyPage;

	test.beforeEach(async ({ page }) => {
		policy = new PolicyPage(page);
		await policy.login('gamechanger');
	});

	test('Runs a search and verifies highlighting', async () => {
		const searchTerm = 'laundry';
		await policy.search(searchTerm);
		await expect(policy.cardContainer.first()).toBeVisible();
		const count = await policy.cardContainer.count();
		expect(count).toBeGreaterThan(1);
		await expect(policy.cardContainer.first().locator('em').first()).toContainText(searchTerm);
	});

	test("Runs a search and verifies a result's references", async ({ page }) => {
		await policy.search('CFR Title 24 Vol. 4: Housing And Urban Development');
		await policy.dataCy('card-footer-more').first().click();

		const magellan = page.locator('.magellan-table').nth(1);
		await expect(magellan).toContainText('References');
		const firstLink = magellan.locator('tbody tr').first().locator('td').first().locator('a');
		await expect(firstLink).toBeVisible();
	});

	test('Runs a search and verifies organization card results', async ({ page }) => {
		await policy.search('washington headquarters service');
		await policy.switchResultsTab('Organizations');

		// The original test removes an iframe that was swallowing clicks.
		await page.evaluate(() => document.querySelectorAll('iframe').forEach((el) => el.remove()));

		const firstCard = policy.getCard(0);
		await expect(firstCard.locator('.text')).toContainText('Washington Headquarters Service');
		await expect(firstCard.locator('img').first()).toBeVisible();
		await expect(firstCard.locator('p').first()).toContainText(
			'Washington Headquarters Services (WHS) is a Department of Defense (DoD) Field Activity, created on October 1, 1977'
		);
	});

	test('Runs a question search and verifies the answer box exists', async () => {
		const searchTerm = 'who is sergeant major of the army?';
		await policy.search(searchTerm);
		await expect(policy.dataCy('qa-result-card')).toBeVisible();
		await expect(policy.dataCy('qa-result-title')).toHaveText(searchTerm.toUpperCase());
	});

	test('Runs a search with multiple words inside quotes and verifies highlighting', async () => {
		const searchTerm = 'machine learning';
		await policy.search(searchTerm);
		await expect(policy.cardContainer.first()).toBeVisible();
		const count = await policy.cardContainer.count();
		expect(count).toBeGreaterThan(1);
		// Highlighted text should contain at least one of the terms.
		const ems = policy.cardContainer.first().locator('em');
		await expect(ems.first()).toContainText(/machine|learning/i);
	});

	test('Runs a search that contains intelligent results and verifies it is displayed', async () => {
		await policy.search('logistics');
		await expect(policy.dataCy('intelligent-result')).toBeVisible();
		await expect(policy.dataCy('intelligent-result-title')).toBeVisible();
	});
});

test.describe('User Dashboard Tests', () => {
	let policy: PolicyPage;

	test.beforeEach(async ({ page }) => {
		policy = new PolicyPage(page);
		await policy.login('gamechanger');

		// Navigate to the user dashboard and clear any existing favorites.
		const waitUserData = page.waitForResponse(
			(res) => res.url().includes('/api/gamechanger/user/getUserData')
		);
		await policy.dataCy('user-dashboard').click();
		await waitUserData.catch(() => undefined);

		if ((await page.locator('.main-info').count()) > 0) {
			for (const headerText of ['FAVORITE TOPICS', 'FAVORITE ORGANIZATIONS', 'FAVORITE DOCUMENTS']) {
				await page.locator('#accordion-header').filter({ hasText: headerText }).click();
			}
			const stars = policy.dataCy('favorite-star');
			while ((await stars.count()) > 0) {
				await stars.first().click();
				await page.locator('button', { hasText: 'Yes' }).click();
			}
			await expect(policy.dataCy('favorite-star')).toHaveCount(0);
		}
	});

	test('Favorites a search and verifies its values in the User Dashboard', async ({ page }) => {
		const searchTerm = 'pizza';
		const favoriteTitle = 'AutoTest Title';

		await policy.search(searchTerm);
		await policy.dataCy('searchbar-favorite-star').click();
		const dialog = policy.dataCy('search-favorite-save-dialog');
		await dialog.locator('input').fill(favoriteTitle);
		await dialog.locator('textarea').first().fill('AutoTest Summary');
		await dialog.locator('button', { hasText: 'Save' }).click();

		await policy.dataCy('user-dashboard').click();
		const favoriteCard = policy.getFavoriteCard(favoriteTitle);
		// Clear target attr on the anchor so it navigates in the same tab.
		await favoriteCard.locator('a').evaluateAll((els) =>
			els.forEach((el) => (el as HTMLAnchorElement).removeAttribute('target'))
		);
		await favoriteCard.click();

		await expect(policy.getCard(0).locator('em').first()).toContainText(
			new RegExp(searchTerm, 'i')
		);

		await policy.dataCy('user-dashboard').click();
		await expect(policy.getFavoriteCard(favoriteTitle)).toBeVisible();
		await policy.getFavoriteCard(favoriteTitle)
			.locator('..')
			.locator('[data-cy="favorite-star"]')
			.first()
			.click();
		await page.locator('button', { hasText: 'Yes' }).click();
		await expect(policy.getFavoriteCard(favoriteTitle)).toHaveCount(0);
	});

	test('Favorites a document and verifies it exists in the User Dashboard', async ({ page }) => {
		await policy.search('helicopter');
		const firstCard = policy.getCard(0);
		const titleText = (await firstCard.locator('.text').first().textContent())?.trim() ?? '';
		await firstCard.locator('[data-cy="card-favorite-star"]').click();
		await page.evaluate(() => document.querySelectorAll('iframe').forEach((el) => el.remove()));
		await page.locator('button', { hasText: 'Save' }).click();

		await policy.dataCy('user-dashboard').click();
		await page.locator('#accordion-header').filter({ hasText: 'FAVORITE DOCUMENTS' }).click();
		await expect(policy.getFavoriteCard(titleText)).toBeVisible();
	});

	test('Favorites an organization and verifies it exists in the User Dashboard', async ({ page }) => {
		await policy.search('West point');
		await policy.switchResultsTab('Organizations');
		const firstCard = policy.getCard(0);
		const titleText = (await firstCard.locator('.text').first().textContent())?.trim() ?? '';
		await firstCard.locator('[data-cy="card-favorite-star"]').click();
		await page.evaluate(() => document.querySelectorAll('iframe').forEach((el) => el.remove()));
		await page.locator('button', { hasText: 'Save' }).click();

		await policy.dataCy('user-dashboard').click();
		await page.locator('#accordion-header').filter({ hasText: 'FAVORITE ORGANIZATIONS' }).click();
		await expect(policy.getFavoriteCard(titleText)).toBeVisible();
	});

	test('Favorites a topic and verifies it exists in the User Dashboard', async ({ page }) => {
		await policy.search('Military');
		await policy.switchResultsTab('Topic');
		const firstCard = policy.getCard(0);
		const titleText = (await firstCard.locator('.text').first().textContent())?.trim() ?? '';
		await firstCard.locator('[data-cy="card-favorite-star"]').click();
		await page.evaluate(() => document.querySelectorAll('iframe').forEach((el) => el.remove()));
		await page.locator('button', { hasText: 'Save' }).click();

		await policy.dataCy('user-dashboard').click();
		await page.locator('#accordion-header').filter({ hasText: 'FAVORITE TOPICS' }).click();
		await expect(policy.getFavoriteCard(titleText)).toBeVisible();
	});
});

test.describe('Tests for the Data Status Tracker', () => {
	let policy: PolicyPage;

	test.beforeEach(async ({ page }) => {
		policy = new PolicyPage(page);
		await policy.login('gamechanger');
		await policy.dataCy('data-status-tracker').click();
		// Wait for the table to render the link cells.
		await expect(page.locator('.rt-td>div a').first()).toBeVisible({ timeout: 30_000 });
	});

	test('Switches between tabs', async ({ page }) => {
		await policy.dataCy('data-status-tracker').click();
		await page.locator('.-loading.-active').waitFor({ state: 'detached', timeout: 30_000 });
		await policy.switchDstTab('documents-tab');
		await policy.switchDstTab('knowledge-graph-tab');
		await policy.switchDstTab('progress-tab');
		await policy.switchDstTab('documents-tab');
		await policy.switchDstTab('knowledge-graph-tab');
		await expect(page.locator('.rt-tr-group').first()).toBeVisible();
	});

	test('Applies filters to the Progress tab', async ({ page }) => {
		const sourceFilter = 'Military';
		const waitProgress = policy.waitForProgressTable();
		await policy.typeIntoDstFilter(0, sourceFilter);
		await page.keyboard.press('Enter');
		await waitProgress;
		await expect(
			page.locator('.rt-td').first().locator('a', { hasText: sourceFilter })
		).toBeVisible();
	});

	test('Applies filters to the Documents tab', async ({ page }) => {
		const typeFilter = 'AAMedP';
		const titleFilter = 'AEROSPACE';

		await policy.switchDstTab('documents-tab');
		const waitDocs1 = policy.waitForDocumentsTable();
		await policy.typeIntoDstFilter(0, typeFilter);
		await waitDocs1;

		const waitDocs2 = policy.waitForDocumentsTable();
		await policy.typeIntoDstFilter(2, titleFilter);
		await waitDocs2;

		await expect(page.locator('.rt-td>div').first()).toContainText(typeFilter);
		await expect(page.locator('.rt-td').nth(2)).toContainText(titleFilter);
	});

	test('Verifies the Knowledge Graph has results', async ({ page }) => {
		await page.locator('.-loading.-active').waitFor({ state: 'detached', timeout: 30_000 });
		await policy.switchDstTab('knowledge-graph-tab');
		await expect(page.locator('h3', { hasText: 'Knowledge Overview' })).toBeVisible();
		const rows = page.locator('.rt-tr-group');
		const count = await rows.count();
		expect(count).toBeGreaterThan(100);
	});
});
