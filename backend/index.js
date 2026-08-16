// Production entrypoint for the serverless host.
//
// It exports the Express app rather than starting a listener: the platform
// invokes an exported handler per request, and there is no long-lived process
// to hold a port open. `src/server.ts` keeps the `app.listen` path for running
// this locally.
//
// It also loads the compiled `dist/` rather than `src/`, because only
// `npm run build` (via `tsc-alias`) turns the `@core/*` aliases into imports
// plain Node can resolve.
const { createApp } = require("./dist/app.js");

module.exports = createApp();
