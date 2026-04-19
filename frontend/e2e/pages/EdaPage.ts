import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the EDA (contract) clone.
 *
 * Ports the custom commands in cypress/support/eda-commands.js.
 */
export class EdaPage extends BasePage {
	readonly searchInput: Locator = this.page.locator('#gcSearchInput');
	readonly searchButton: Locator = this.page.locator('#gcSearchButton');
	readonly advancedSearchButton: Locator = this.page.locator('#advancedSearchButton');
	readonly filterContainer: Locator = this.page.locator('[data-cy="eda-filter-container"]');
	readonly cardFront: Locator = this.page.locator('.eda-card-front');

	async initialVisit(): Promise<void> {
		await this.visitAndAcceptConsent('contract');
		await this.searchInput.waitFor({ state: 'visible', timeout: 10_000 });
		await this.dataCy('eda-recent-searches').waitFor({ state: 'visible', timeout: 10_000 });
		await this.dataCy('eda-advanced-settings').waitFor({ state: 'visible', timeout: 10_000 });
	}

	async simpleSearch(term: string): Promise<void> {
		await this.searchInput.fill(term);
		await this.searchButton.click();
	}
}
