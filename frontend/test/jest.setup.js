// Global Jest setup for the frontend.
//
// - Loads jest-dom custom matchers (`toBeInTheDocument`, `toHaveTextContent`, etc).
// - Silences noisy console output from third-party libs during tests. Individual
//   tests can still assert on console messages by spying on them directly.
require('@testing-library/jest-dom');

// Pollyfills for jsdom
if (typeof window !== 'undefined') {
	// Some Material UI v4 internals call window.matchMedia; jsdom doesn't ship it.
	if (!window.matchMedia) {
		window.matchMedia = () => ({
			matches: false,
			media: '',
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => false,
		});
	}
}
