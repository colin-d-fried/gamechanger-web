import { expect, test } from '@playwright/test';
import { BasePage } from '../pages/BasePage';

/** Migrated from cypress/e2e/jbook/jbookRegisterPOC.cy.js */

test.describe('Tests the JBook register POC page', () => {
	test.beforeEach(async ({ page }) => {
		const base = new BasePage(page);
		await base.clearSessionCookies();
		await base.visitAndAcceptConsent('jbook-register-poc');
	});

	test('Should redirect to /userDashboard', async ({ page }) => {
		await expect(page).toHaveURL(/#\/jbook\/userDashboard$/, { timeout: 15_000 });
	});

	test('should open the user edit modal if email not filled out yet', async ({ page }) => {
		const base = new BasePage(page);
		await expect(base.dataCy('EditProfile')).toBeVisible();
		await expect(base.dataCy('firstName').locator('input')).toHaveValue('AUTO');
		await expect(base.dataCy('lastName').locator('input')).toHaveValue('TEST');
		await expect(base.dataCy('email').locator('input')).toHaveValue('');
	});
});
