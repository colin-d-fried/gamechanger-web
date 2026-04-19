// Generic stub for `@dod-advana/advana-platform-ui/dist/...` imports.
// The real packages pull in network-aware auth code at import time that blows
// up in a jsdom/jest environment. Tests should mock specific sub-paths they
// actually exercise; this file acts as a safe default.
const React = require('react');

// React component fallback — returned when advana default exports are rendered
// as JSX (e.g. LoadingIndicator, TutorialOverlay).
const passthrough = (name) => {
	const Component = (props) => React.createElement('div', { 'data-stub': name }, props.children);
	Component.displayName = `AdvanaStub(${name})`;
	return Component;
};

// Auth stub covering the methods used throughout the app.
const AuthStub = {
	getUserData: jest.fn().mockResolvedValue({}),
	getToken: jest.fn().mockReturnValue('test-token'),
	getTokenPayload: jest.fn().mockReturnValue({ 'csrf-token': 'test-csrf' }),
	isLoggedIn: jest.fn().mockReturnValue(true),
	getCsrfTokenFromCookie: jest.fn().mockReturnValue('test-csrf'),
	logout: jest.fn(),
};

// `axiosUtils.js` does `import Auth from '.../Auth'` — it wants the default
// export to BE the Auth object. Other files import the default as a React
// component. We satisfy both by making the default a component that also
// exposes Auth methods as static properties.
const DefaultExport = Object.assign(passthrough('default'), AuthStub);

module.exports = {
	__esModule: true,
	default: DefaultExport,
	Auth: AuthStub,
	LoadingIndicator: passthrough('LoadingIndicator'),
	Permissions: {
		hasPermission: jest.fn().mockReturnValue(true),
		isGameChangerAdmin: jest.fn().mockReturnValue(false),
		permissionValidator: jest.fn().mockReturnValue(false),
	},
};
