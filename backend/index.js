// Production entrypoint for the serverless host.
//
// `express` is required here even though this file never calls it. Vercel
// detects an Express app by reading the entrypoint statically and looking for
// that import; without it the build fails outright with "No entrypoint found
// which imports express". The app itself is assembled in dist/createApp.js,
// which the detector does not follow into.
require("express");

// The app is exported rather than listened on: the platform invokes an
// exported handler per request, and there is no long-lived process to hold a
// port open. src/localServer.ts keeps the app.listen path for laptops.
//
// It loads the compiled dist/ rather than src/, because only `npm run build`
// (via tsc-alias) turns the `@core/*` aliases into imports plain Node can
// resolve.
const { createApp } = require("./dist/createApp.js");

module.exports = createApp();
