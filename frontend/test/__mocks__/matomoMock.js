// Lightweight stand-in for `src/components/telemetry/Matomo.js`.
// Matomo's real implementation reaches out to piwik-react-router at import time,
// which causes network and DOM side effects we don't want in unit tests.
module.exports = {
	trackEvent: jest.fn(),
	trackPageView: jest.fn(),
	setTrackerUser: jest.fn(),
	setCustomUrl: jest.fn(),
	TrackerWrapper: (Component) => Component,
	default: {
		push: jest.fn(),
	},
};
