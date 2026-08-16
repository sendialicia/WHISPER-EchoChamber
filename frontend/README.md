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

`.env` points at the deployed backend, so nothing needs to be running
locally. To develop against a local server instead, comment out
`EXPO_PUBLIC_API_URL` — the client then takes the address from the Expo dev
server, which follows the machine across networks on its own.

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
  capture/      reading the screen through the native module
  storage/      on-device streak, bookmarks, and display name
  ui/           shared components built from theme.ts
  theme.ts      every colour and spacing value in the app
modules/
  echo-overlay/   accessibility service + floating button (Kotlin)
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

### Builds

`development` — a dev client that loads JS from Metro. Needed while iterating
on native code, and useless without a dev server running.

`preview` — a standalone APK. It carries its own JS bundle and talks to the
deployed backend, so it runs on someone else's phone with nothing of yours
switched on. This is the one to share.

```bash
npx eas-cli build --profile preview --platform android
```

The `EXPO_PUBLIC_*` values live in `eas.json`, not `.env`. EAS uploads the
project respecting `.gitignore`, and `.env` is ignored — so a build that
relies on it silently produces an APK with no backend address, which then
falls back to the emulator loopback and reaches nothing on a real phone.

Committing them is safe: everything prefixed `EXPO_PUBLIC_` is compiled into
the JavaScript bundle and readable by anyone holding the APK regardless. The
Supabase key is the publishable one, and row level security is on with no
policies, so it opens nothing on its own.

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

The practice streak, bookmarks, and the display name live in AsyncStorage on
the device. They have no backend endpoints, and keeping them there is what the
app tells the user.

Everything else comes from the API, scan history included — it used to be
mirrored locally too, and having both meant Home could list a scan the Echo
Chamber Meter had never counted.

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

Built. One AccessibilityService does both jobs: `getRootInActiveWindow()`
reads the text, and `takeScreenshot()` (API 30+) captures the screen when the
text isn't exposed — silently, with no consent dialog. MediaProjection is not
used. The reasoning is in
[`../docs/capture-strategy.md`](../docs/capture-strategy.md).

The floating button is hosted by that same service, so it stays alive while
the user browses without a foreground service or its permanent notification.
A tap reads the screen **before** opening the app: bringing GEMA forward first
would make it the foreground window, and the read would return GEMA's own
interface instead of the post being looked at.

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

`modules/echo-overlay/` holds the accessibility service, the floating button,
and the permission helpers behind them.

Autolinking only finds a local module when the app declares
`expo.autolinking.nativeModulesDir` in package.json. Without it the module is
invisible to the build and every line of Kotlin compiles into nothing, failing
silently at runtime.

Still to build: the tone-check overlay, which reads a draft from another app's
compose box and rewrites it in place with `ACTION_SET_TEXT`. The tone tester
under Settings stands in for it today.
