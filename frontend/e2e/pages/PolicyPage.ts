import { Locator, Response } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Policy ("gamechanger") clone.
 *
 * Ports the custom commands in cypress/support/policy-commands.js.
 */
export class PolicyPage extends BasePage {
	readonly searchInput: Locator = this.page.locator('#gcSearchInput');
	readonly searchButton: Locator = this.page.locator('#gcSearchButton');
	readonly cardContainer: Locator = this.page.locator('.styled-card-container');

	/** Replaces cy.login(clone). */
	async login(clone = 'gamechanger'): Promise<void> {
		await this.clearSessionCookies();
		await this.visitAndAcceptConsent(clone);
	}

	/**
	 * Types the term, clicks Search, and waits for the modular search API
	 * response. Returns the response so callers can inspect it if needed.
	 */
	async search(term: string): Promise<Response | null> {
		const waitForSearch = this.page.waitForResponse(
			(res) => res.url().includes('/api/gamechanger/modular/search') && res.status() === 200,
			{ timeout: 60_000 }
		);
		await this.searchInput.fill(term);
		await this.searchButton.click();
		try {
			return await waitForSearch;
		} catch {
			return null;
		}
	}

	getCard(index: number): Locator {
		return this.cardContainer.nth(index);
	}

	getFavoriteCard(title: string): Locator {
		return this.dataCy('favorite-card').filter({ hasText: title });
	}

	/** Clicks the results-tab with the given visible text. */
	async switchResultsTab(tabLabel: string): Promise<void> {
		const tab = this.dataCy('tabs-container').locator('p', { hasText: tabLabel });
		await tab.click();
	}

	async setSourceFilter(filterName: string): Promise<void> {
		await this.dataCy('source-accordion').click();
		await this.page.locator('span', { hasText: filterName }).click();
	}

	async setTypeFilter(filterName: string): Promise<void> {
		await this.dataCy('type-accordion').click();
		await this.page.locator('span', { hasText: filterName }).click();
	}

	// ---------- Data Status Tracker helpers (port of DST commands) ----------
	async switchDstTab(dstTabDataCyTag: string): Promise<void> {
		await this.dataCy(dstTabDataCyTag).click();
		await this.page.locator('.-loading.-active').waitFor({ state: 'detached', timeout: 30_000 });
	}

	async typeIntoDstFilter(colIndex: number, textToFilter: string): Promise<void> {
		const filter = this.page.locator('.rt-tr>div input').nth(colIndex);
		await filter.scrollIntoViewIfNeeded();
		await filter.fill(textToFilter);
	}

	/** Mirrors cy.intercept DST network aliases. Use with waitForDst* below. */
	async waitForProgressTable(): Promise<void> {
		await this.page.waitForResponse(
			(res) => res.url().includes('/api/gamechanger/getCrawlerMetadata'),
			{ timeout: 15_000 }
		);
	}

	async waitForDocumentsTable(): Promise<void> {
		await this.page.waitForResponse(
			(res) => res.url().includes('/api/gamechanger/dataTracker/getTrackedData'),
			{ timeout: 15_000 }
		);
	}
}
