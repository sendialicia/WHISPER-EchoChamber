# Strategi Baca Konten: Accessibility Tree, dengan Screenshot sebagai Fallback

**Status:** diputuskan · **Tanggal:** 15 Agustus 2026 · **Dampak:** frontend (React Native), UX inti Feature 1

## Ringkasan singkat

Visi asli — *tap floating button → app langsung baca konten → analisis* — **bisa dijalankan**, karena EchoBreaker tidak dirilis ke Play Store (distribusi lewat download/sideload).

Jalurnya persis seperti yang sudah ditulis di spec desain: **baca accessibility tree lebih dulu**, pakai screenshot cuma kalau app-nya tidak bisa dibaca langsung.

> **Catatan revisi.** Versi pertama dokumen ini mencoret AccessibilityService dan mengusulkan share sheet. Alasan pencoretan itu **semata-mata kebijakan Google Play**, yang membatasi Accessibility API hanya untuk app yang melayani disabilitas. Begitu Play Store keluar dari persamaan, keberatan itu hilang dan jalur aslinya kembali terbuka. Temuan soal MediaProjection di bawah tetap berlaku — cuma sekarang posisinya jalur fallback, bukan jalur utama.

## Dua jalur

| | Accessibility tree (utama) | MediaProjection (fallback) |
|---|---|---|
| Yang didapat | teks langsung, sudah terstruktur | gambar, teks dibaca Gemini |
| Dialog tiap pakai | **tidak ada** | **ada, selalu** |
| Setup | sekali di Settings | sekali (overlay) + dialog per capture |
| Latensi | instan, tanpa upload | upload 200–400KB |
| Biaya LLM | murah (text-only) | lebih mahal (vision) |
| Privasi | cuma teks yang dikirim | seluruh isi layar terkirim |
| Kapan dipakai | mayoritas kasus | app yang teksnya tidak terekspos |

Jalur utama menang telak di semua dimensi. Fallback ada karena sebagian app tidak mengekspos teksnya — pakai `FLAG_SECURE`, render teks lewat canvas, atau menandai view-nya `importantForAccessibility="no"`.

## Jalur utama: AccessibilityService

Model izinnya sekali, sistem-wide:

- User aktifkan di **Settings → Accessibility → EchoBreaker**, satu kali.
- Setelah aktif, service jalan di semua app **tanpa dialog tambahan**.
- Butuh `canRetrieveWindowContent="true"` di config XML dan permission `BIND_ACCESSIBILITY_SERVICE` di manifest.
- Baca isi layar lewat `getRootInActiveWindow()`, lalu telusuri `AccessibilityNodeInfo` dan kumpulkan `.text` + `.contentDescription`.

Ini yang bikin UX floating button beneran jalan: tap → teks langsung ada → kirim ke backend. Tidak ada gambar, tidak ada dialog, tidak ada tunggu upload.

### Gesekan yang perlu diantisipasi: Restricted Settings

Android 13+ **memblokir app sideload dari mengaktifkan Accessibility**. Toggle-nya abu-abu dengan pesan *"for your security, this setting is currently unavailable"*.

Ini menyasar app yang dipasang lewat installer non-session — persis cara APK dari browser atau chat masuk. Jalan keluarnya ada dan resmi:

```
App Info → menu ⋮ → "Allow restricted settings"
→ balik ke Settings → Accessibility → EchoBreaker → aktifkan
```

Opsi "Allow restricted settings" itu **tersembunyi sampai user mencoba mengaktifkan toggle-nya dulu**. Jadi urutannya harus dipandu, bukan cuma ditulis.

**Konsekuensi kerja:** perlu satu **layar onboarding** yang menuntun user melewati alur ini, dengan deteksi status (`AccessibilityManager.isEnabled` / cek `Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES`) supaya app tahu kapan sudah beres. Ini item kerja baru yang belum ada di TODO.

## Jalur fallback: MediaProjection

Kalau accessibility tree tidak menghasilkan teks, jatuh ke screenshot. Di sini batasan Android 14+ berlaku penuh. Docs resmi:

> "Your app must request user consent before each media projection session. A session is a single call to `createVirtualDisplay()`. A `MediaProjection` token must be used only once to make the call."

Konkretnya:

- `createVirtualDisplay()` melempar `SecurityException` kalau token dipakai lebih dari sekali.
- Tiap capture wajib ulang penuh: `createScreenCaptureIntent()` → dialog → `getMediaProjection()` → `createVirtualDisplay()`.
- **Tidak ada opsi "jangan tanya lagi"** — checkbox itu dihapus Google di Android 14 justru supaya app tidak bisa merekam layar diam-diam.
- Butuh foreground service tipe `mediaProjection`, plus permission `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PROJECTION`, dan `POST_NOTIFICATIONS`.

Dialog per-capture ini **bisa diterima untuk jalur fallback** karena jarang kena. Yang tidak bisa diterima adalah kalau ini jadi jalur utama — makanya accessibility tree didahulukan.

## Kontrak backend sudah pas

Kebetulan yang enak: `/scan/triage` dan `/scan/analyze` sudah menerima **`text` ATAU `imageBase64`**. Jadi dua jalur di atas memakai endpoint yang sama tanpa perubahan apa pun di backend.

- Accessibility tree berhasil → kirim `{ text }`
- Accessibility tree kosong → kirim `{ imageBase64, imageMimeType }`

**Wajib kompres sebelum upload** di jalur fallback. `expo-image-manipulator` bisa resize + compress + base64 dalam satu call:

```ts
const rendered = await ImageManipulator.manipulate(uri)
  .resize({ width: 1080 })
  .renderAsync();

const { base64 } = await rendered.saveAsync({
  format: SaveFormat.JPEG,
  compress: 0.8,
  base64: true,
});
```

Screenshot PNG mentah 1080×2400 itu ~2–4MB. Setelah resize + JPEG 0.8 jadi ~200–400KB — **sekitar 10x lebih kecil**, dan Gemini tetap membaca teksnya dengan baik. Backend sudah menerima `image/jpeg`.

## Expo SDK 57 tidak menyediakan apa pun untuk ini

Sudah dicek daftar package v57: tidak ada overlay window, tidak ada accessibility service, tidak ada foreground service, tidak ada cross-app capture. Perhatikan `expo-screen-capture` — namanya menipu, itu untuk **mencegah** screenshot, bukan mengambilnya.

Artinya empat komponen Kotlin ditulis tangan sebagai local Expo module:

1. **AccessibilityService** — baca teks layar (jalur utama)
2. **Overlay** — `SYSTEM_ALERT_WINDOW`, floating button draggable, event `onTap`
3. **MediaProjection + foreground service** — screenshot fallback
4. **Setup helper** — cek status izin, buka Settings di halaman yang tepat

## Urutan kerja

TODO awal menaruh item native (paling sulit, paling berisiko, butuh device fisik) di urutan 1 dan 2 — sebelum ada API client atau satu layar pun yang jalan. Dibalik supaya ada aplikasi yang bisa didemo lebih awal:

| # | Item | Lapisan |
|---|---|---|
| 1 | `app.json` — nama, slug, `android.package`, permissions | TypeScript |
| 2 | `src/api/` — fetch client + tipe TS mirroring backend | TypeScript |
| 3 | `src/auth/identity.ts` — stub `getUserId()` | TypeScript |
| 4 | Screens — Scan, Tone, Dashboard, Practice | TypeScript |
| 5 | Navigasi — bottom tabs | TypeScript |
| 6 | Verifikasi — `tsc --noEmit` + `expo-doctor` | TypeScript |
| 7 | `npx expo prebuild` | Native |
| 8 | Onboarding izin — termasuk alur Restricted Settings | Native |
| 9 | AccessibilityService — jalur utama | Native |
| 10 | Overlay Kotlin — floating button | Native |
| 11 | MediaProjection — fallback | Native |

Langkah 1–6 semuanya TypeScript murni dan bisa dites lawan backend tanpa build native sama sekali.

Item 11 sengaja paling akhir: kalau accessibility tree ternyata sudah menutup hampir semua kasus di app yang kita target, fallback-nya mungkin tidak mendesak untuk demo.

## Distribusi

Tidak lewat Play Store. Build APK lewat EAS (`eas build -p android --profile preview`) atau gradle lokal, lalu bagikan link download.

Implikasi yang perlu diingat: karena installer-nya non-session, **setiap orang yang menginstal akan kena Restricted Settings**. Onboarding di item 8 bukan opsional — tanpa itu app-nya kelihatan rusak.

## Koreksi untuk kontrak API

Saat riset ini, ketahuan `backend/README.md` mendokumentasikan endpoint yang salah. Route aslinya **tidak punya `:userId`** — user diambil dari token yang terverifikasi, supaya client tidak bisa baca data orang lain dengan mengganti URL.

| Salah (README lama) | Benar |
|---|---|
| `GET /dashboard/:userId/echo-chamber-meter` | `GET /dashboard/echo-chamber-meter` |
| `GET /dashboard/:userId/source-diversity` | `GET /dashboard/source-diversity` |
| `GET /dashboard/:userId/reflection-journal` | `GET /dashboard/reflection-journal` |
| `GET /practice/:userId/topic` | `GET /practice/topic` |

Semua route di atas butuh header `Authorization: Bearer <supabase-jwt>`. README sudah diperbaiki.

## Sumber

- [Build an accessibility service — Android Developers](https://developer.android.com/guide/topics/ui/accessibility/service)
- [Media projection — Android Developers](https://developer.android.com/media/grow/media-projection)
- [Android 13 blocks accessibility services for sideloaded apps — Android Police](https://www.androidpolice.com/android-13-blocks-accessibility-services-sideloaded-apps/)
- [Android 13's sideloading restriction and the Accessibility API — Esper](https://www.esper.io/blog/android-13-sideloading-restriction-harder-malware-abuse-accessibility-apis)
- [Expo SDK 57 API reference](https://docs.expo.dev/versions/v57.0.0/)
- [expo-image-manipulator (SDK 57)](https://docs.expo.dev/versions/v57.0.0/sdk/imagemanipulator/)
