// Global Jest setup: mock Redis clients so modules that open a connection at
// import time (via async-redis or node-redis) don't leak real TCP connections
// during the test run.
jest.mock('async-redis', () => {
	const client = () => ({
		on: jest.fn(),
		get: jest.fn().mockResolvedValue(null),
		set: jest.fn().mockResolvedValue('OK'),
		select: jest.fn().mockResolvedValue('OK'),
		del: jest.fn().mockResolvedValue(0),
		expire: jest.fn().mockResolvedValue(0),
		hget: jest.fn().mockResolvedValue(null),
		hset: jest.fn().mockResolvedValue(0),
		keys: jest.fn().mockResolvedValue([]),
		quit: jest.fn().mockResolvedValue('OK'),
	});
	return { createClient: jest.fn(() => client()) };
});

jest.mock('redis', () => {
	const client = () => ({
		on: jest.fn(),
		connect: jest.fn().mockResolvedValue(undefined),
		get: jest.fn((_k, cb) => (cb ? cb(null, null) : undefined)),
		set: jest.fn((_k, _v, cb) => (cb ? cb(null, 'OK') : undefined)),
		select: jest.fn(),
		quit: jest.fn(),
	});
	return { createClient: jest.fn(() => client()) };
});
