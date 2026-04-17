const assert = require('assert');

// We use jest.doMock to stub node-cron and the heavy controllers the CronJobs
// class pulls in, so we can assert scheduling behavior without touching redis,
// elasticsearch, or the db.

describe('CronJobs', () => {
	let CronJobs;
	let cronScheduleSpy;
	let distributedPollSpy;

	const baseConstants = {
		GAME_CHANGER_OPTS: {
			cacheReloadCronTimingPattern: '*/5 * * * *',
			favoriteSearchPollInterval: 1000,
			isDecoupled: false,
		},
		GLOBAL_SEARCH_OPTS: {
			FULL_APPS_POLL_INTERVAL: 2000,
			COLLIBRA_CACHE_POLL_INTERVAL: 3000,
		},
	};

	function makeControllers() {
		return {
			cacheController: {
				setStartupSearchHistoryCacheKeys: jest.fn(),
				setStartupQlikFullAppCacheKeys: jest.fn(),
				setStartupCollibraCacheKeys: jest.fn(),
				cacheCollibraData: jest.fn(),
			},
			elasticSearchController: {
				cacheStoreQlikApps: jest.fn(),
			},
			favoritesController: {
				checkLeastRecentFavoritedSearch: jest.fn(),
			},
			userController: {
				resetAPIRequestLimit: jest.fn().mockResolvedValue(undefined),
			},
		};
	}

	beforeAll(() => {
		jest.resetModules();
		cronScheduleSpy = jest.fn((pattern, _cb, opts) => ({ pattern, scheduled: opts?.scheduled, start: jest.fn() }));
		distributedPollSpy = jest.fn();
		jest.doMock('node-cron', () => ({ schedule: cronScheduleSpy }));
		jest.doMock('../../node_app/utils/pollUtility', () => ({ distributedPoll: distributedPollSpy }));
		({ CronJobs } = require('../../node_app/lib/cronJobs'));
	});

	afterAll(() => {
		jest.resetModules();
	});

	function make(opts = {}) {
		const ctrl = makeControllers();
		return {
			ctrl,
			instance: new CronJobs({
				constants: baseConstants,
				logger: { info: jest.fn(), error: jest.fn() },
				...ctrl,
				...opts,
			}),
		};
	}

	describe('#init', () => {
		it('primes the startup cache keys via cacheController', () => {
			const { ctrl } = make();
			expect(ctrl.cacheController.setStartupSearchHistoryCacheKeys).toHaveBeenCalled();
			expect(ctrl.cacheController.setStartupQlikFullAppCacheKeys).toHaveBeenCalled();
			expect(ctrl.cacheController.setStartupCollibraCacheKeys).toHaveBeenCalled();
		});
	});

	describe('#getReloadJob', () => {
		it('schedules a cron job using the cacheReloadCronTimingPattern', () => {
			const { instance } = make();
			cronScheduleSpy.mockClear();
			instance.getReloadJob();
			expect(cronScheduleSpy).toHaveBeenCalledTimes(1);
			const [pattern, _cb, opts] = cronScheduleSpy.mock.calls[0];
			assert.strictEqual(pattern, '*/5 * * * *');
			assert.strictEqual(opts.scheduled, false);
		});
	});

	describe('#resetAPIRequestLimitJob', () => {
		it('schedules the reset cron job at the first of every month', () => {
			const { instance } = make();
			cronScheduleSpy.mockClear();
			instance.resetAPIRequestLimitJob();
			const [pattern] = cronScheduleSpy.mock.calls[0];
			assert.strictEqual(pattern, '0 0 1 * *');
		});
	});

	describe('#getUpdateFavoritedSearchesJob', () => {
		it('registers a distributedPoll when interval >= 0', () => {
			const { instance } = make();
			distributedPollSpy.mockClear();
			instance.getUpdateFavoritedSearchesJob().start();
			expect(distributedPollSpy).toHaveBeenCalledTimes(1);
		});

		it('skips polling when interval is negative', () => {
			const { instance } = make({
				constants: {
					...baseConstants,
					GAME_CHANGER_OPTS: { ...baseConstants.GAME_CHANGER_OPTS, favoriteSearchPollInterval: -1 },
				},
			});
			distributedPollSpy.mockClear();
			instance.getUpdateFavoritedSearchesJob().start();
			expect(distributedPollSpy).not.toHaveBeenCalled();
		});
	});

	describe('#getQlikAppsFullListJob', () => {
		it('triggers an initial cache store and registers a poll when enabled', () => {
			const { ctrl, instance } = make();
			distributedPollSpy.mockClear();
			ctrl.elasticSearchController.cacheStoreQlikApps.mockClear();
			instance.getQlikAppsFullListJob().start();
			expect(ctrl.elasticSearchController.cacheStoreQlikApps).toHaveBeenCalled();
			expect(distributedPollSpy).toHaveBeenCalledTimes(1);
		});

		it('is a no-op when app is decoupled', () => {
			const { ctrl, instance } = make({
				constants: {
					...baseConstants,
					GAME_CHANGER_OPTS: { ...baseConstants.GAME_CHANGER_OPTS, isDecoupled: true },
				},
			});
			distributedPollSpy.mockClear();
			ctrl.elasticSearchController.cacheStoreQlikApps.mockClear();
			instance.getQlikAppsFullListJob().start();
			expect(ctrl.elasticSearchController.cacheStoreQlikApps).not.toHaveBeenCalled();
			expect(distributedPollSpy).not.toHaveBeenCalled();
		});
	});

	describe('#cacheCollibraInfoJob', () => {
		it('triggers an initial cache and registers a poll when enabled', () => {
			const { ctrl, instance } = make();
			distributedPollSpy.mockClear();
			ctrl.cacheController.cacheCollibraData.mockClear();
			instance.cacheCollibraInfoJob().start();
			expect(ctrl.cacheController.cacheCollibraData).toHaveBeenCalled();
			expect(distributedPollSpy).toHaveBeenCalledTimes(1);
		});
	});
});
