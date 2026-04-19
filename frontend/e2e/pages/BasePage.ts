import { Page, Locator, expect } from '@playwright/test';

/**
 * Shared helpers for Gamechanger page objects. Subclasses call into these
 * for data-cy lookups, consent-banner handling, and basic navigation.
 */
export class BasePage {
	constructor(protected readonly page: Page) {}

	dataCy(tag: string): Locator {
		return this.page.locator(`[data-cy="${tag}"]`);
	}

	/** Visit `#/{path}` and accept the consent banner. */
	async visitAndAcceptConsent(path: string): Promise<void> {
		await this.visitPage(path);
		await this.acceptConsent();
	}

	/** Visit `#/{path}` without touching the consent banner. */
	async visitPage(path: string): Promise<void> {
		const cleanPath = path.startsWith('/') ? path.substring(1) : path;
		await this.page.goto(`/#/${cleanPath}`);
	}

	async acceptConsent(): Promise<void> {
		const okay = this.dataCy('consent-agreement-okay');
		// The banner sometimes takes a moment to render; if it never appears
		// (e.g., cookie already set) we just move on.
		try {
			await okay.click({ timeout: 10_000 });
		} catch {
			// Banner not present — nothing to accept.
		}
	}

	/** Clear cookies so the consent banner (and other per-user state) reappears. */
	async clearSessionCookies(): Promise<void> {
		await this.page.context().clearCookies();
	}

	async expectUrlContains(fragment: string): Promise<void> {
		await expect(this.page).toHaveURL(new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
	}
}
