import { expect, test } from '@playwright/test';
import { JbookPage } from '../pages/JbookPage';
import * as path from 'path';

/** Migrated from cypress/e2e/jbook/jbookExports.cy.js */

test.describe('JBook CSV export', () => {
	test.beforeEach(async ({ page }) => {
		const jbook = new JbookPage(page);
		await jbook.initialVisit();
	});

	test('verifies CUI CSV download', async ({ page }) => {
		const jbook = new JbookPage(page);
		await jbook.search('Shark');

		// Kick off download; Playwright exposes the triggered download via the
		// 'download' event rather than a filesystem hand-off.
		const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });

		await page.locator('[data-cy=export-button]').click();
		await expect(page.locator('[data-cy=export-dialog]')).toBeVisible({ timeout: 10_000 });
		await jbook.setExportClassification('CUI');
		await jbook.setExportFormat('csv');
		await page.locator('[data-cy=generate]').click();

		const download = await downloadPromise;
		const suggested = download.suggestedFilename();
		expect(suggested).toMatch(/-CUI\.csv$/i);

		// Save the file so Playwright's trace viewer can attach it.
		await download.saveAs(path.join('test-results', suggested));
	});
});
