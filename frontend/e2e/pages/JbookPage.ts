import { expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the JBook clone.
 *
 * Ports the custom commands in cypress/support/jbook-commands.js.
 */
export class JbookPage extends BasePage {
	readonly searchInput: Locator = this.page.locator('#gcSearchInput');
	readonly searchButton: Locator = this.page.locator('#gcSearchButton');
	readonly searchResults: Locator = this.page.locator('[data-cy="jbook-search-results"]');
	readonly cardHeaders: Locator = this.page.locator('[data-cy="jbook-card-header"]');

	async initialVisit(): Promise<void> {
		await this.visitAndAcceptConsent('jbook');
		await this.searchInput.waitFor({ state: 'visible', timeout: 10_000 });
		// Initial search spinner appears and then disappears.
		const load = this.dataCy('jbook-search-load');
		try {
			await load.waitFor({ state: 'visible', timeout: 10_000 });
		} catch {
			// Some runs the spinner flashes too fast to catch.
		}
		await load.waitFor({ state: 'detached', timeout: 30_000 });
		await expect(this.cardHeaders.first()).toBeVisible();
	}

	async search(query: string): Promise<void> {
		await this.searchInput.fill(query);
		await this.searchButton.click();
		await this.searchResults.waitFor({ state: 'visible', timeout: 10_000 });
	}

	async switchPortfolio(portfolio: string): Promise<void> {
		const selector = this.dataCy('portfolio-select');
		await selector.click();
		await this.page.locator(`li[data-value="${portfolio}"]`).click();
	}

	async openSpecificFilter(filterName: string): Promise<void> {
		const filter = this.page.locator(`[data-cy="${filterName}-filter"]`);
		await filter.locator('#accordion-header').click();
		await filter.locator('#accordion-content').waitFor({ state: 'visible' });
	}

	async selectSpecificFilterOptions(options: string[]): Promise<void> {
		for (const option of options) {
			await this.page.locator(`[data-cy="filter-option-${option}"]`).click();
		}
	}

	async waitForSearchLoadToFinish(): Promise<void> {
		const load = this.dataCy('jbook-search-load');
		await load.waitFor({ state: 'detached', timeout: 30_000 });
	}

	async setExportFormat(format: string): Promise<void> {
		await this.dataCy('export-dialog').waitFor({ state: 'visible' });
		await this.dataCy('export-select').click();
		await this.dataCy(`export-option-${format}`).click();
	}

	async setExportClassification(_classification: string): Promise<void> {
		await this.dataCy('export-dialog').waitFor({ state: 'visible' });
		await this.dataCy('export-autocomplete').click();
		// Match the original Cypress behavior: pick the MUI option at index 1.
		await this.page.locator('.MuiAutocomplete-popper li[data-option-index="1"]').click();
	}
}
