import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Gamechanger E2E tests.
 *
 * Tests run against an ephemeral dev deployment (${DEV_URL}). Headers
 * x-env-ssl-client-certificate and SSL-CLIENT-S-DN-CN stand in for the
 * client-cert auth that the prod stack uses. See gitlab-ci.yml for the
 * pipeline variables that populate BASE_URL / SSL_* at runtime.
 */
export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 3 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI
		? [
				['junit', { outputFile: 'playwright-results/junit.xml' }],
				['html', { outputFolder: 'playwright-report', open: 'never' }],
				['list'],
		  ]
		: [['html', { open: 'on-failure' }], ['list']],
	use: {
		baseURL: process.env.BASE_URL || 'http://localhost:8080',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
		extraHTTPHeaders: {
			'x-env-ssl-client-certificate': process.env.SSL_CLIENT_CERTIFICATE || '',
			'SSL-CLIENT-S-DN-CN': process.env.SSL_CLIENT_S_DN_CN || '',
		},
		ignoreHTTPSErrors: true,
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
	],
	timeout: 60_000,
	expect: { timeout: 15_000 },
	outputDir: 'test-results',
});
