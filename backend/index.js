// Production entrypoint.
//
// Vercel looks for an Express app at a handful of well-known paths and this is
// one of them. It deliberately points at the compiled output rather than
// src/server.ts: the source uses `@core/*` style path aliases, and only
// `tsc-alias` — which runs as part of `npm run build` — rewrites those into
// relative imports that plain Node can resolve. Letting the platform compile
// the TypeScript itself would put that resolution back in question.
require("./dist/server.js");
