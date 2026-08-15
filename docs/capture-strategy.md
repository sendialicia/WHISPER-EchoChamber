# Strategi Baca Konten: Semuanya Lewat AccessibilityService

**Status:** diputuskan · **Tanggal:** 15 Agustus 2026 · **Dampak:** frontend (React Native), UX inti Feature 1

## Ringkasan singkat

Visi asli — *tap floating button → app langsung baca konten → analisis* — **bisa dijalankan sepenuhnya**, tanpa dialog apa pun, karena EchoBreaker tidak dirilis ke Play Store (distribusi lewat download/sideload).

Satu service Kotlin menutup dua kebutuhan sekaligus:

- **Baca teks** lewat `getRootInActiveWindow()`
- **Ambil screenshot** lewat `takeScreenshot()` — diam-diam, tanpa dialog

MediaProjection **tidak dipakai sama sekali**.

> **Catatan revisi (dua kali).**
>
> Versi pertama dokumen ini mencoret AccessibilityService dan mengusulkan share sheet. Alasannya semata-mata kebijakan Google Play, yang membatasi Accessibility API hanya untuk app yang melayani disabilitas. Begitu Play Store keluar dari persamaan, keberatan itu hilang.
>
> Versi kedua memakai accessibility untuk teks tapi masih menyisakan MediaProjection sebagai fallback screenshot, lengkap dengan dialog per-capture-nya. Itu **tidak perlu**: `AccessibilityService.takeScreenshot()` sudah ada sejak Android 11 dan mengambil gambar tanpa MediaProjection, tanpa dialog, tanpa notifikasi. Seluruh bagian MediaProjection sekarang dicoret.

## Kenapa satu service cukup

| | Baca teks | Screenshot |
|---|---|---|
| API | `getRootInActiveWindow()` | `takeScreenshot()` |
| Dialog tiap pakai | tidak ada | **tidak ada** |
| Notifikasi sistem | tidak ada | **tidak ada** |
| Minimal Android | 4.1 (API 16) | **11 (API 30)** |
| Yang dikirim ke backend | `text` | `imageBase64` |
| Biaya LLM | murah (text-only) | lebih mahal (vision) |
| Kapan dipakai | mayoritas kasus | teks tidak terekspos |

Teks tetap didahulukan: lebih cepat, lebih murah, dan cuma mengirim tulisan yang relevan alih-alih seluruh isi layar. Screenshot dipakai kalau app-nya tidak mengekspos teks — pakai `FLAG_SECURE`, render lewat canvas, atau menandai view-nya `importantForAccessibility="no"`.

### `takeScreenshot()` — yang perlu diketahui

- Ada sejak **Android 11 (API 30)**. Di bawah itu tidak tersedia; batas ini dianggap wajar (Android 11 rilis 2020).
- Butuh `android:canTakeScreenshot="true"` di config XML service, di samping `canRetrieveWindowContent`.
- Mengembalikan `ScreenshotResult` berisi `HardwareBuffer` + `ColorSpace` — perlu dikonversi ke `Bitmap`, lalu di-encode JPEG sebelum dikirim.
- Ada throttle bawaan sistem; panggilan yang terlalu rapat ditolak dengan `ERROR_TAKE_SCREENSHOT_INTERVAL_TIME_SHORT`. Tidak masalah untuk pola pakai "tap lalu baca".

> **Ini API yang kuat, perlakukan dengan serius.** Screenshot diam tanpa indikator apa pun persis alasan Google mengunci Accessibility API di Play Store. Karena kita sideload, tidak ada yang menghalangi — jadi kejujuran ke user jadi tanggung jawab kita sendiri, bukan tanggung jawab review Play. Layar onboarding harus menyebut terus terang apa yang bisa dilakukan app ini.

## Model izin: sekali, sistem-wide

- User aktifkan di **Settings → Accessibility → EchoBreaker**, satu kali.
- Setelah aktif, service jalan di semua app tanpa dialog tambahan.
- Manifest: `<service>` dengan permission `BIND_ACCESSIBILITY_SERVICE` dan intent-filter `android.accessibilityservice.AccessibilityService`.
- Config XML: `canRetrieveWindowContent="true"` + `canTakeScreenshot="true"`.

### Gesekan yang perlu diantisipasi: Restricted Settings

Android 13+ **memblokir app sideload dari mengaktifkan Accessibility**. Toggle-nya abu-abu dengan pesan *"for your security, this setting is currently unavailable"*. Ini menyasar app yang dipasang lewat installer non-session — persis cara APK dari browser atau chat masuk.

Jalan keluarnya ada dan resmi:

```
App Info → menu ⋮ → "Allow restricted settings"
→ balik ke Settings → Accessibility → EchoBreaker → aktifkan
```

Opsi "Allow restricted settings" **tersembunyi sampai user mencoba mengaktifkan toggle-nya dulu**. Jadi urutannya harus dipandu, bukan cuma ditulis.

**Konsekuensi kerja:** perlu **layar onboarding** yang menuntun user melewati alur ini, dengan deteksi status supaya app tahu kapan sudah beres. Karena installer-nya non-session, **setiap orang yang menginstal akan kena ini** — onboarding bukan opsional, tanpa itu app-nya kelihatan rusak.

## Kontrak backend sudah pas

`/scan/triage` dan `/scan/analyze` sudah menerima **`text` ATAU `imageBase64`**, jadi dua jalur di atas memakai endpoint yang sama tanpa perubahan apa pun di backend.

- Teks terbaca → kirim `{ text }`
- Teks kosong → `takeScreenshot()` → kirim `{ imageBase64, imageMimeType }`

**Kompres sebelum upload.** Screenshot mentah 1080×2400 itu ~2–4MB; setelah resize + JPEG 0.8 jadi ~200–400KB, sekitar 10x lebih kecil, dan Gemini tetap membaca teksnya dengan baik. Di sisi TypeScript `expo-image-manipulator` sudah menangani ini (`src/scan/prepareImage.ts`); kalau encoding dilakukan di Kotlin, pakai kualitas setara.

## Expo Go vs dev build

**Accessibility dan overlay tidak akan pernah jalan di Expo Go.** Expo Go adalah aplikasi yang sudah ter-compile dengan daftar modul tetap — `<service>` baru di manifest dan kode Kotlin tidak bisa disuntikkan ke dalamnya.

| Fase | Cara menjalankan |
|---|---|
| Lapisan TypeScript (sekarang) | Expo Go — `npm start`, scan QR |
| Accessibility + overlay | Dev build: `npx expo prebuild` lalu `npx expo run:android`, atau EAS Build untuk APK |

`expo run:android` butuh Android Studio + SDK terpasang. EAS Build melakukannya di cloud dan mengembalikan link APK.

## Expo SDK 57 tidak menyediakan apa pun untuk ini

Sudah dicek daftar package v57: tidak ada overlay window, tidak ada accessibility service, tidak ada cross-app capture. Perhatikan `expo-screen-capture` — namanya menipu, itu untuk **mencegah** screenshot, bukan mengambilnya.

Yang ditulis tangan sebagai local Expo module tinggal tiga:

1. **AccessibilityService** — baca teks + `takeScreenshot()`
2. **Overlay** — `SYSTEM_ALERT_WINDOW`, floating button draggable, event `onTap`
3. **Setup helper** — cek status izin, buka Settings di halaman yang tepat

Dibanding rencana sebelumnya, foreground service dan seluruh pipeline MediaProjection/ImageReader/VirtualDisplay hilang.

## Urutan kerja

Item native ditaruh setelah lapisan TypeScript supaya ada aplikasi yang bisa didemo lebih awal.

| # | Item | Lapisan | Status |
|---|---|---|---|
| 1 | `app.json` — nama, package, permissions | TypeScript | ✅ selesai |
| 2 | `src/api/` — client + tipe | TypeScript | ✅ selesai |
| 3 | `src/auth/` — Supabase anonymous sign-in | TypeScript | ✅ selesai |
| 4 | Screens — 5 tab | TypeScript | ✅ selesai |
| 5 | Navigasi | TypeScript | ✅ selesai |
| 6 | Verifikasi — `tsc` + `expo-doctor` | TypeScript | ✅ selesai |
| 7 | `npx expo prebuild` | Native | |
| 8 | Onboarding izin — termasuk Restricted Settings | Native | |
| 9 | AccessibilityService — teks + screenshot | Native | |
| 10 | Overlay Kotlin — floating button | Native | |
| 11 | Tone check overlay — `ACTION_SET_TEXT` | Native | |

Item 11 adalah tombol "Fix It" di desain Tone Check: overlay membaca draft di compose box app lain, lalu menulis ulang isinya lewat `ACTION_SET_TEXT`. Ini juga jalur accessibility, bukan fitur React — layar "tone tester" di dalam app cuma pengganti sementara.

## Permission yang benar-benar dipakai

Setelah MediaProjection dicoret, `app.json` menyisakan lebih sedikit:

| Permission | Masih perlu? |
|---|---|
| `SYSTEM_ALERT_WINDOW` | ya — floating button |
| `FOREGROUND_SERVICE` | **tidak** |
| `FOREGROUND_SERVICE_MEDIA_PROJECTION` | **tidak** |
| `POST_NOTIFICATIONS` | hanya kalau nanti ada notifikasi |

`BIND_ACCESSIBILITY_SERVICE` tidak masuk daftar `permissions` — itu dideklarasikan di elemen `<service>`-nya sendiri.

## Distribusi

Tidak lewat Play Store. Build APK lewat EAS (`eas build -p android --profile preview`) atau gradle lokal, lalu bagikan link download.

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

- [AccessibilityService — Android Developers](https://developer.android.com/reference/android/accessibilityservice/AccessibilityService)
- [AccessibilityService.ScreenshotResult](https://developer.android.com/reference/android/accessibilityservice/AccessibilityService.ScreenshotResult)
- [Build an accessibility service](https://developer.android.com/guide/topics/ui/accessibility/service)
- [Media projection — Android Developers](https://developer.android.com/media/grow/media-projection) (jalur yang tidak jadi dipakai)
- [Android 13 blocks accessibility services for sideloaded apps — Android Police](https://www.androidpolice.com/android-13-blocks-accessibility-services-sideloaded-apps/)
- [Expo SDK 57 API reference](https://docs.expo.dev/versions/v57.0.0/)
