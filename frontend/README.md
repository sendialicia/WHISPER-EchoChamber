# GEMA — Mobile App

React Native (Expo SDK 57) client for the echo-chamber-breaking app.

The app is **GEMA** (Indonesian for *echo*). `android.package` is still
`com.echobreaker.app` from before the rename — it is never shown to anyone,
and changing it would install as a separate app on devices that already have
this one.

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
  api/          fetch client + types mirroring the backend
  auth/         Supabase anonymous sign-in, session in the device keystore
  navigation/   five tabs, each with its own stack
  scan/         screenshot preparation (resize + compress before upload)
  screens/      see the tab map below
  storage/      on-device streak, bookmarks, scan history
  ui/           shared components built from theme.ts
  theme.ts      every colour and spacing value in the app
modules/
  echo-overlay/   local native module (Kotlin, still a placeholder)
```

### Tabs

| Tab | Screens | Backend |
|---|---|---|
| Home | Home, Scan | `/scan/*`, `/dashboard/echo-chamber-meter` |
| Analysis | Breakdown / History | `/dashboard/echo-chamber-meter` + local history |
| Journal | Journal, Bookmarked | `/dashboard/reflection-journal`, `/dashboard/source-diversity` |
| Practice | Practice, Perspective Challenge, Compare & Reflect, Exercise | `/practice/*` |
| Settings | Settings, Tone tester | `/tone/check` |

## Design

Light-only: a white-blue ground (`#F5F8FF`) carrying soft coloured glows,
with deep indigo cards (`#1026A2`) for the headline numbers. There is no dark
variant — screens should not try to build one.

**Every colour lives in `src/theme.ts`**, sampled pixel-by-pixel from the
Figma exports kept in `design/`. Nothing else hard-codes one, so re-sampling
those exports and correcting the tokens updates the whole app.

Two pieces are load-bearing and easy to break:

- **The tab bar floats.** It is a pill group hovering over the content, not a
  bar pinned to the edge, so every screen's scroll content must end with
  `paddingBottom: TAB_BAR_CLEARANCE` or the last item hides underneath it.
- **The meter is a 250° arc**, gap at the bottom. Its start angle is derived
  from the sweep so both tips sit level; hard-coding an angle puts the opening
  somewhere else.

The glows behind each screen are the designer's own exported PNGs
(`assets/backdrop/`) rather than CSS gradients — their falloff is hand-tuned
and an approximation reads flatter.

### Launch and motion

`src/ui/Landing.tsx` is the launch animation: the mark inside a white disc
with rings pulsing outward. The logo is a wave radiating from a source and
*gema* means echo, so the launch gesture is the brand's own rather than a
spinner. It mounts **over** the navigator and fades out, so the app is already
rendered behind it.

`src/ui/Ripple.tsx` plays the same gesture on a tab change: a translucent disc
expands from the touch point and sweeps off screen. It runs over an
already-completed navigation rather than gating it — the destination is live
underneath the whole time, so a dropped frame can never strand anyone on a
blank page.

## What's local vs what's on the server

Streak, bookmarks, and scan history live in AsyncStorage on the device —
they have no backend endpoints, and keeping them local matches what the app
tells the user ("All practice stays private on your device"). Everything
else comes from the API.

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
before starting the native work. In short: **one AccessibilityService does
both jobs.** `getRootInActiveWindow()` reads the text, and
`takeScreenshot()` (API 30+) captures the screen when the text isn't
exposed — silently, with no consent dialog. MediaProjection is not used.

> **Expo Go can't run any of this.** It's a pre-built app with a fixed set
> of modules, and an accessibility service needs its own `<service>` in the
> manifest. The TypeScript layer runs fine in Expo Go today; the native work
> needs `npx expo prebuild && npx expo run:android`, or an EAS build.

Both paths already hit the same backend endpoints, which take `text` OR
`imageBase64`. The "Pick a screenshot" button on the Scan screen exercises
the image path end to end today, with no native code involved — use it to
check the pipeline before writing any Kotlin.

**Tone check is native too.** In the design it floats over the host app's
compose box and its "Fix It" button rewrites the draft in place — that means
reading the field through the accessibility service and writing back with
`ACTION_SET_TEXT`. The tone tester under Settings is a stand-in that
exercises the same endpoint from inside the app.

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
accessibility service (text + screenshot), the overlay button, then the
tone-check overlay that rewrites a draft in place with `ACTION_SET_TEXT`.
