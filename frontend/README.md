# EchoBreaker — Mobile App

React Native (Expo SDK 57) client for the echo-chamber-breaking app.

## Setup

```bash
npm install
cp .env.example .env
npm start
```

The backend needs to be running too — see `../backend/README.md`. On an
emulator no configuration is needed: the API client picks `10.0.2.2` on
Android and `localhost` on iOS automatically. On a physical device, set
`EXPO_PUBLIC_API_URL` to the host machine's LAN address.

> Expo tooling wants Node >= 20.19.4. Older versions still run but print a
> warning on every command.

## Structure

```
src/
  api/        fetch client + types mirroring the backend
  auth/       Supabase anonymous sign-in, session in the device keystore
  scan/       screenshot preparation (resize + compress before upload)
  screens/    one per bottom tab
  ui/         shared components built from theme.ts
  theme.ts    every colour and spacing value in the app
modules/
  echo-overlay/   local native module (Kotlin, still a placeholder)
```

## Design

Dark-only. The whole app sits on the navy-to-magenta gradient from the
mockups, so there is no light theme to maintain and screens should not try
to build one.

**Every colour lives in `src/theme.ts`.** Nothing else hard-codes one — when
the final design assets land, correct the values there and the app follows.
The current values are read off the design screenshots by eye and are
expected to shift.

## Auth

Dashboard, Practice, and scan logging need a Supabase JWT: the backend
verifies it against the project's JWKS and takes the user from the token's
`sub`, so a locally invented user id won't get past it.

The app uses **anonymous sign-in** — an account is created silently on first
launch and persists in the device keystore. No login screen, but a real
verifiable token.

Without `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` the
app still runs: Scan and Tone need no auth, and the other two screens say
they're unavailable instead of failing with a raw 401.

## Reading content off the screen

Not built yet. The plan and the reasoning behind it are in
[`../docs/capture-strategy.md`](../docs/capture-strategy.md) — read that
before starting the native work. In short: **accessibility tree first**,
screenshot only as a fallback, because MediaProjection demands a fresh
system consent dialog for every single capture on Android 14+.

Both paths already hit the same backend endpoints, which take `text` OR
`imageBase64`. The "Pick a screenshot" button on the Scan screen exercises
the image path end to end today, with no native code involved — use it to
check the pipeline before writing any Kotlin.

## Verify

```bash
npx tsc --noEmit && npx expo-doctor
```

## Native modules

`modules/echo-overlay/` is scaffolded but still the generated placeholder
(`hello`/`setValueAsync`). Nothing imports it yet. Local modules autolink
from `modules/` once `npx expo prebuild` has generated the native projects.

Still to build, in order: permission onboarding (including the Android 13+
restricted-settings flow, which every sideloaded install will hit), the
accessibility service, the overlay button, then the MediaProjection
fallback.
