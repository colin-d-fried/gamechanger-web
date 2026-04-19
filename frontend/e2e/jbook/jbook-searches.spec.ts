import { expect, test } from '@playwright/test';
import { JbookPage } from '../pages/JbookPage';

/** Migrated from cypress/e2e/jbook/jbookSearches.cy.js */

test.describe('Tests multiple types of jbook searches.', () => {
	let jbook: JbookPage;

	test.beforeEach(async ({ page }) => {
		jbook = new JbookPage(page);
		await jbook.initialVisit();
	});

	test('basic search by PE', async () => {
		await jbook.search('0206623M');

		const count = await jbook.cardHeaders.count();
		expect(count).toBeGreaterThan(1);
		await expect(jbook.cardHeaders.first()).toContainText('PE: 0206623M - MC Ground Cmbt Spt Arms Sys');
	});

	test('service reviewer filter works', async ({ page }) => {
		await jbook.switchPortfolio('AI Inventory');
		await jbook.openSpecificFilter('serviceReviewer');
		await jbook.selectSpecificFilterOptions(['Blowers, Misty (USMC US Marine Corp)']);

		await jbook.waitForSearchLoadToFinish();
		await page.evaluate(() => window.scrollTo(0, 0));
		await expect(jbook.cardHeaders.first()).toBeVisible();

		const count = await jbook.cardHeaders.count();
		expect(count).toBeGreaterThan(1);
		await expect(jbook.cardHeaders.first()).toContainText('BLI: 846070 | Title: DARP RC135');
	});
});

test.describe('Tests search from multiple pages.', () => {
	test('can search from profile page', async ({ page }) => {
		const jbook = new JbookPage(page);
		await jbook.visitAndAcceptConsent(
			'jbook/profile?type=Procurement&id=pdoc#2019#PB#05#A01000#57#N/A#3010&appropriationNumber=3010&portfolioName=General&budgetYear=2019'
		);

		await expect(jbook.dataCy('jbook-profile-title')).toContainText('A01000: A-10  Air Force (AF)', {
			timeout: 15_000,
		});

		await jbook.search('0206623M');
		const count = await jbook.cardHeaders.count();
		expect(count).toBeGreaterThan(1);
		await expect(jbook.cardHeaders.first()).toContainText('PE: 0206623M - MC Ground Cmbt Spt Arms Sys');
	});
});

test.describe('does changing to test/hypersonic cause random scrolling', () => {
	test('can successfully not cause window to jump in test portfolio', async ({ page }) => {
		const jbook = new JbookPage(page);
		await jbook.visitAndAcceptConsent(
			'jbook/profile?type=Procurement&id=pdoc#2019#PB#05#A01000#57#N/A#3010&appropriationNumber=3010&portfolioName=Test%20Portfolio&budgetYear=2019'
		);

		await expect(jbook.dataCy('jbook-project-descriptions')).toBeVisible({ timeout: 15_000 });

		await page.evaluate(() => window.scrollTo(0, 835.5));
		await jbook.dataCy('jbook-reviewer-label').press('ArrowDown');
		await jbook.dataCy('jbook-reviewer-label').press('Enter');

		const scrollY = await page.evaluate(() => window.scrollY);
		expect(Math.abs(scrollY - 835.5)).toBeLessThan(2);
	});
});

test.describe('does accessing unauthorized portfolio redirect to unauthorized page', () => {
	test('can successfully be granted access to Hypersonics', async ({ page }) => {
		const jbook = new JbookPage(page);
		await jbook.visitAndAcceptConsent(
			'jbook/profile?type=Procurement&id=pdoc#2019#PB#05#A01000#57#N/A#3010&appropriationNumber=3010&portfolioName=Hypersonics&budgetYear=2019'
		);
		await page.waitForTimeout(3_000); // let any redirect settle
		await expect(page).toHaveURL(/portfolioName=Hypersonics&budgetYear=2019/);
	});

	test('can successfully be restricted from AI Inventory', async ({ page }) => {
		const jbook = new JbookPage(page);
		await jbook.visitAndAcceptConsent(
			'jbook/profile?type=RDT%26E&searchText=&id=rdoc#2023#PB#08#1208248SF#57#N/A#3620#68A035&appropriationNumber=3620&portfolioName=tesTest&budgetYear=2023'
		);
		await page.waitForURL(/#\/unauthorized/, { timeout: 15_000 });
		expect(page.url()).toMatch(/#\/unauthorized$/);
	});
});

test.describe('Tests navigation items', () => {
	test('should load a fresh page when clicking on the title in the expanded nav bar', async ({ page }) => {
		const jbook = new JbookPage(page);
		await jbook.initialVisit();
		await jbook.search('navy');

		await jbook.openSpecificFilter('serviceAgency');
		await jbook.selectSpecificFilterOptions(['Army']);

		await jbook.dataCy('side-nav-open-button').click();
		await jbook.dataCy('jbook-nav-title').click();

		// Page reloads — spinner should appear then be gone, cards re-load.
		const load = jbook.dataCy('jbook-search-load');
		try {
			await load.waitFor({ state: 'visible', timeout: 10_000 });
		} catch {
			// too fast to catch
		}
		await load.waitFor({ state: 'detached', timeout: 30_000 });
		await expect(jbook.cardHeaders.first()).toBeVisible();
		const count = await jbook.cardHeaders.count();
		expect(count).toBeGreaterThan(1);

		await expect(page.locator('#gcSearchInput')).toHaveValue('');
		await expect(jbook.dataCy('Army-top-filter')).toHaveCount(0);
	});
});

test.describe('make sure browser tab name is changed', () => {
	test('should open a document and have the title be correct as ADVANA | JBOOK SEARCH', async ({ page }) => {
		const jbook = new JbookPage(page);
		await jbook.initialVisit();
		await jbook.search('navy');
		await jbook.dataCy('open-doc').first().click();
		await expect(page).toHaveTitle('ADVANA | JBOOK SEARCH');
	});

	test('profile page should also have the ADVANA | JBOOK SEARCH title', async ({ page }) => {
		const jbook = new JbookPage(page);
		await jbook.visitAndAcceptConsent(
			'jbook/profile?type=Procurement&id=pdoc#2019#PB#05#A01000#57#N/A#3010&appropriationNumber=3010&portfolioName=General&budgetYear=2019'
		);
		await expect(page).toHaveTitle('ADVANA | JBOOK SEARCH');
	});
});
