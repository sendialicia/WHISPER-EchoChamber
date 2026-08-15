# Temuan: Floating Button → Screenshot Otomatis Tidak Feasible di Android 14+

**Status:** diputuskan · **Tanggal:** 15 Agustus 2026 · **Dampak:** frontend (React Native), UX inti Feature 1

## Ringkasan singkat

Rencana awal kita — *tap floating button → app langsung ambil screenshot → analisis* — **tidak bisa dijalankan** di Android 14 (API 34) ke atas, yang wajib jadi target Play Store. Bukan karena kita kurang jago ngoding Kotlin-nya; Google memang sengaja menutup jalannya demi privasi.

**Keputusan:** floating button tetap dibangun, tapi perannya berubah jadi **shortcut/launcher ke app**, bukan pemicu screenshot. Untuk v1, konten masuk lewat **share sheet**: user screenshot pakai gesture bawaan HP → Share → EchoBreaker.

## Kenapa tidak bisa

Untuk merekam layar aplikasi lain, satu-satunya API yang tersedia buat app konsumer adalah **MediaProjection**. Docs resmi Android menyatakan:

> "Your app must request user consent before each media projection session. A session is a single call to `createVirtualDisplay()`. A `MediaProjection` token must be used only once to make the call."

Konkretnya di Android 14+:

- `createVirtualDisplay()` melempar `SecurityException` kalau token dipakai lebih dari sekali.
- Tiap capture baru **wajib** ulang dari nol: `createScreenCaptureIntent()` → dialog persetujuan user → `getMediaProjection()` → `createVirtualDisplay()`.
- **Tidak ada opsi "jangan tanya lagi".** Sebelum Android 14 checkbox itu ada; Google menghapusnya justru supaya app tidak bisa merekam layar diam-diam.

Jadi alur nyatanya jadi begini:

```
tap floating button
  → dialog sistem "Start recording or casting the entire screen?"
  → user tap "Start"
  → screenshot diambil
  → analisis
```

Dialog itu muncul **setiap kali scan**. Selamanya. Itu bukan bug yang bisa kita akali.

### Apakah ada jalan lain?

Sudah dicek, semuanya buntu untuk app konsumer di Play Store:

| Cara | Kenapa tidak dipakai |
|---|---|
| Reuse token MediaProjection | Diblokir Android 14+, lempar `SecurityException` |
| AccessibilityService (baca teks layar langsung, tanpa gambar) | Secara teknis bisa dan tanpa dialog per-pakai, tapi kebijakan Google Play membatasi Accessibility API hanya untuk app yang benar-benar melayani disabilitas — risiko penolakan sangat tinggi. Permission-nya juga menakutkan buat user. |
| Device owner / system app | Butuh app ditandatangani sebagai bagian dari sistem atau di-provision lewat MDM. Tidak relevan untuk app konsumer. |
| Root / ADB | Bukan target user kita. |

## Perbandingan UX yang sebenarnya

Karena dialog sistem tidak terhindarkan, keunggulan overlay ternyata tipis:

| | MediaProjection | Share sheet |
|---|---|---|
| Langkah user | tap overlay → **dialog sistem** → hasil | gesture screenshot → tap Share → tap EchoBreaker → hasil |
| Permission | `SYSTEM_ALERT_WINDOW` + `FOREGROUND_SERVICE_MEDIA_PROJECTION` + `POST_NOTIFICATIONS` | tidak ada |
| Dialog tiap pakai | ya | tidak |
| Kode Kotlin | 3 komponen (overlay service, foreground service, ImageReader pipeline) | tidak ada untuk capture |
| Butuh device fisik buat tes | ya | tidak |

Jumlah interaksinya kurang lebih sama, tapi share sheet nol permission, nol kode native untuk capture, dan pakai gesture yang user sudah hafal.

## Keputusan

1. **Floating overlay tetap dibangun** — `SYSTEM_ALERT_WINDOW` cuma diminta sekali lewat Settings, tidak ada dialog per-pakai. Perannya: akses cepat ke app dari mana saja. Signature UX-nya tetap ada.
2. **Konten masuk lewat share sheet untuk v1** — target `ACTION_SEND` untuk gambar dan teks.
3. **MediaProjection ditunda**, tidak dibatalkan. Kalau ternyata share sheet sudah cukup enak, mungkin tidak perlu sama sekali. Kalau nanti tetap mau, tambahkan sebagai jalur opsional dengan ekspektasi dialog yang jujur ke user.

## Catatan teknis lain dari riset ini

**Expo SDK 57 tidak menyediakan apa pun untuk tiga kebutuhan ini.** Sudah dicek daftar package v57: tidak ada overlay window, tidak ada foreground service, tidak ada cross-app capture. Perhatikan `expo-screen-capture` — namanya menipu, itu untuk **mencegah** screenshot, bukan mengambilnya. Semua ini harus ditulis tangan di Kotlin.

**Wajib kompres gambar sebelum upload.** `expo-image-manipulator` bisa resize + compress + output base64 dalam satu call:

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

Screenshot PNG mentah 1080×2400 itu ~2–4MB. Setelah resize + JPEG 0.8 jadi ~200–400KB — **sekitar 10x lebih kecil**, dan Gemini tetap membaca teksnya dengan baik. Backend sudah menerima `image/jpeg`. Ini berlaku di jalur capture mana pun.

## Perubahan urutan kerja

TODO awal menaruh dua item native (paling sulit, paling berisiko, butuh device fisik) di urutan 1 dan 2 — sebelum ada API client atau satu layar pun yang jalan. Urutannya dibalik supaya ada aplikasi yang bisa didemo lebih awal:

1. `app.json` — nama, slug, `android.package`, permissions
2. `src/api/` — fetch client + tipe TS mirroring backend
3. `src/auth/identity.ts` — stub `getUserId()`
4. Screens — Scan, Tone, Dashboard, Practice
5. Navigasi — bottom tabs
6. Verifikasi — `tsc --noEmit` + `expo-doctor`
7. `npx expo prebuild`
8. Share intent target (`ACTION_SEND`)
9. Overlay Kotlin (`SYSTEM_ALERT_WINDOW`, sebagai launcher)

Langkah 1–6 semuanya TypeScript murni dan bisa dites lawan backend tanpa build native sama sekali.

## Koreksi untuk kontrak API

Saat riset ini, ketahuan `backend/README.md` mendokumentasikan endpoint yang salah. Route aslinya **tidak punya `:userId`** — user diambil dari token yang terverifikasi, supaya client tidak bisa baca data orang lain dengan mengganti URL.

| Salah (di README lama) | Benar |
|---|---|
| `GET /dashboard/:userId/echo-chamber-meter` | `GET /dashboard/echo-chamber-meter` |
| `GET /dashboard/:userId/source-diversity` | `GET /dashboard/source-diversity` |
| `GET /dashboard/:userId/reflection-journal` | `GET /dashboard/reflection-journal` |
| `GET /practice/:userId/topic` | `GET /practice/topic` |

Semua route di atas butuh header `Authorization: Bearer <supabase-jwt>`. README sudah diperbaiki.

## Sumber

- [Media projection — Android Developers](https://developer.android.com/media/grow/media-projection)
- [Behavior changes: Apps targeting Android 14 or higher](https://developer.android.com/about/versions/14/behavior-changes-14)
- [Expo SDK 57 API reference](https://docs.expo.dev/versions/v57.0.0/)
- [expo-image-manipulator (SDK 57)](https://docs.expo.dev/versions/v57.0.0/sdk/imagemanipulator/)
