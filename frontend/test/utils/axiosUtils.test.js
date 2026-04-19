/**
 * @jest-environment jsdom
 *
 * Verifies the thin wrappers in `src/utils/axiosUtils.js` sign requests with
 * an HMAC-based signature and delegate to the provided axios instance.
 */
import { getSignature, axiosGET, axiosPOST, axiosPUT, axiosDELETE } from '../../src/utils/axiosUtils';

const makeAxios = () => ({
	get: jest.fn().mockResolvedValue({ data: 'GET' }),
	post: jest.fn().mockResolvedValue({ data: 'POST' }),
	put: jest.fn().mockResolvedValue({ data: 'PUT' }),
	delete: jest.fn().mockResolvedValue({ data: 'DELETE' }),
});

describe('axiosUtils', () => {
	describe('getSignature', () => {
		it('writes an X-UA-SIGNATURE header onto the options object', () => {
			const options = {};
			getSignature(options, '/api/foo');
			expect(options.headers).toHaveProperty('X-UA-SIGNATURE');
			expect(typeof options.headers['X-UA-SIGNATURE']).toBe('string');
			expect(options.headers['X-UA-SIGNATURE'].length).toBeGreaterThan(0);
		});

		it('produces a deterministic signature for a given URL', () => {
			const a = {};
			const b = {};
			getSignature(a, '/api/foo');
			getSignature(b, '/api/foo');
			expect(a.headers['X-UA-SIGNATURE']).toBe(b.headers['X-UA-SIGNATURE']);
		});

		it('produces a different signature for different URLs', () => {
			const a = {};
			const b = {};
			getSignature(a, '/api/foo');
			getSignature(b, '/api/bar');
			expect(a.headers['X-UA-SIGNATURE']).not.toBe(b.headers['X-UA-SIGNATURE']);
		});
	});

	describe('axiosGET', () => {
		it('strips the query string before signing, and delegates to axios.get', async () => {
			const axios = makeAxios();
			await axiosGET(axios, '/api/foo?bar=baz');
			expect(axios.get).toHaveBeenCalledTimes(1);
			const [url, options] = axios.get.mock.calls[0];
			expect(url).toBe('/api/foo?bar=baz');
			expect(options.headers['X-UA-SIGNATURE']).toBe(
				// Signature is computed against '/api/foo' (no query string).
				(() => {
					const o = {};
					getSignature(o, '/api/foo');
					return o.headers['X-UA-SIGNATURE'];
				})()
			);
		});
	});

	describe('axiosPOST / axiosPUT / axiosDELETE', () => {
		it('signs with the full URL and delegates to axios.post', async () => {
			const axios = makeAxios();
			await axiosPOST(axios, '/api/foo', { body: 1 });
			expect(axios.post).toHaveBeenCalledWith('/api/foo', { body: 1 }, expect.objectContaining({
				headers: expect.objectContaining({ 'X-UA-SIGNATURE': expect.any(String) }),
			}));
		});

		it('delegates to axios.put', async () => {
			const axios = makeAxios();
			await axiosPUT(axios, '/api/foo', { body: 1 });
			expect(axios.put).toHaveBeenCalledTimes(1);
		});

		it('delegates to axios.delete', async () => {
			const axios = makeAxios();
			await axiosDELETE(axios, '/api/foo');
			expect(axios.delete).toHaveBeenCalledTimes(1);
		});
	});
});
