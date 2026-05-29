# Fishy

An aquarium and fish-collection care companion app for hobbyists — track your fish, learn about species, and stay on top of care reminders.

[![Expo](https://img.shields.io/badge/Expo-56-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%26%20Storage-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)

---

## Overview

Fishy is a mobile-first companion app for freshwater and marine aquarium hobbyists. It helps you:

- Keep a personal collection of every fish you own (and have owned).
- Capture and update fish photos over time, preserving a photo history.
- Browse a curated library of 303 ornamental fish species with care information.
- Get reminders for feeding, photo updates, health checks, and other care tasks.
- Check basic compatibility before adding a new fish to an existing tank.
- Use the app in either English or Simplified Chinese.

The app is built with Expo / React Native and is backed by Supabase for database storage, file storage, and the species library.

---

## Key Features

- **Dashboard** with active fish count, total fish, unique species, recently added, longest-kept, and due reminders.
- **My Fish (Collection)** — list, search, sort, and filter your personal fish, including inactive/historical entries.
- **Fish Detail** — current status, species link, start date, notes, and a full photo timeline/history.
- **Add Fish** — manually add a fish, pick from the species library, or enter a custom species name.
- **Scan / Camera Flow** — capture a fresh photo before adding a fish, with permission handling for native devices.
- **Update Photo** — appends a new photo to the fish's history instead of overwriting the old one.
- **Species Library** — 303 seeded ornamental fish entries with search, filter, and pagination.
- **Species Detail** — care level, temperament, diet, water parameters, tank size, lifespan, source/verification metadata, and images.
- **Care Reminders** — recurring reminders per fish or per species (feeding, photo updates, health checks, and other care tasks).
- **In-app Notification Center** — review due reminders without leaving the app.
- **Compatibility Warnings** — rule-based check between a new fish and your existing collection, with caution/danger reasons.
- **Bilingual UI** — switch between English and Simplified Chinese; preference is persisted on-device.
- **Liquid-glass aquarium UI** — mobile-first design with a calm, water-themed visual language.

---

## Tech Stack

- **Expo SDK 56** / **React Native 0.85**
- **TypeScript** (strict)
- **Expo Router** (typed routes)
- **Supabase** — PostgreSQL database and Storage
- **AsyncStorage** for language preference persistence
- **expo-camera**, **expo-image**, **expo-image-manipulator**, **expo-image-picker**
- **react-native-reanimated** + **react-native-gesture-handler** for animations and gestures
- **Node.js scripts** for validation, seed import helpers, and image asset tooling

---

## Architecture

```
Fishy/
├── app/                        # Expo Router screens (file-based routing)
│   ├── (tabs)/                 # Bottom tab navigator
│   │   ├── index.tsx           # Dashboard
│   │   ├── collection/         # My Fish list and detail
│   │   ├── library/            # Species library and detail
│   │   ├── scan/               # Camera capture flow
│   │   └── settings.tsx        # Settings (language, etc.)
│   ├── add-fish.tsx            # Add fish flow
│   ├── update-photo.tsx        # Update photo flow
│   └── compatibility-warning.tsx
├── src/
│   ├── components/             # Reusable UI components
│   ├── services/               # Supabase + domain services (fish, species,
│   │                           #   photo, reminder, compatibility)
│   ├── i18n/                   # English/Chinese translations and species text
│   ├── types/                  # Shared TypeScript models
│   ├── lib/                    # Supabase client, low-level helpers
│   ├── constants/              # App-wide constants
│   └── utils/                  # Pure utilities
├── database/
│   ├── migrations/             # SQL schema migrations (run in order)
│   ├── seed/
│   │   ├── malaysia_v1/        # Species seed SQL (run in documented order)
│   │   └── species_images/     # Image metadata, manifests, and import SQL
│   └── supabase_full_setup.sql # Consolidated setup reference
├── scripts/                    # Validation and import helper scripts
└── assets/                     # App icons, splash, and static images
```

- `app/` is the routing surface (Expo Router).
- `src/services` is the data access layer that talks to Supabase.
- `src/i18n` holds general translations plus a dedicated Simplified Chinese map for species copy.
- `src/types` defines the shared domain models used across services and screens.

---

## Database / Supabase Summary

Fishy uses **Supabase PostgreSQL** for fish, species, reminder, and photo metadata, and **Supabase Storage** for fish photos and species images.

- Database schema lives in [`database/migrations/`](database/migrations/) and is applied in numeric order.
- Species seed data lives in [`database/seed/malaysia_v1/`](database/seed/malaysia_v1/) and is applied in the order documented in its `IMPORT_GUIDE.md`.
- Species image metadata and the generated update SQL live in [`database/seed/species_images/`](database/seed/species_images/).
- The app uses two storage buckets:
  - `fish-photos` — user-captured fish photos.
  - `species-images` — species library images (verified photos under `real/`, illustrative placeholders under `ai/`).

Only the **anon** Supabase key is used by the app at runtime. The service role key is **never** required by the app and must **never** be committed.

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** (bundled with Node)
- **Expo CLI** via `npx expo` (no global install required)
- A **Supabase** project (free tier is sufficient for development)
- Optional: **Android Studio** with an emulator, or a physical Android/iOS device with Expo Go or a development build, for testing the camera flow
- **Camera permission** on the device for the Scan flow

---

## Environment Setup

1. Copy the example environment file:

   ```bash
   cp .env.example .env.local
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env.local
   ```

2. Fill in your Supabase project values in `.env.local`:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=
   EXPO_PUBLIC_SUPABASE_ANON_KEY=
   ```

   - These are public, client-safe values intended for the mobile app.
   - The `EXPO_PUBLIC_` prefix exposes them to the Expo runtime by design.

3. **Never commit `.env.local`.** It is already ignored by `.gitignore`.

4. The Supabase **service role key** is only needed locally for admin tooling such as bulk image uploads. It must **never** be added to `.env.local` if that file might be shared, and must **never** be committed.

---

## Installation

```bash
npm install
```

---

## Running the App

Start the Expo dev server:

```bash
npx expo start
```

From there:

- Press **`a`** to launch on an Android emulator or connected device.
- Press **`i`** to launch on iOS (macOS only).
- Press **`w`** to open the web preview.
- Scan the QR code with Expo Go or a custom development build on your phone.

Notes:

- The camera/scan flow is best tested on a real device or a development build, not on web. Web camera behavior differs from native and is not the primary target.
- Mobile device testing is strongly recommended before reporting issues with capture or photo upload.

---

## Supabase Setup

High-level steps to get a fresh Supabase project ready for Fishy:

1. **Create a Supabase project** at [supabase.com](https://supabase.com/).
2. **Apply migrations** from [`database/migrations/`](database/migrations/) in numeric order (`001_…` through `010_…`) in the Supabase SQL Editor.
3. **Apply species seed SQL** from [`database/seed/malaysia_v1/`](database/seed/malaysia_v1/) in the order described in its [`IMPORT_GUIDE.md`](database/seed/malaysia_v1/IMPORT_GUIDE.md).
4. **(Optional)** Apply species image updates from [`database/seed/species_images/update_species_images.sql`](database/seed/species_images/update_species_images.sql) **after** uploading the corresponding image files to your `species-images` storage bucket. Review the SQL before running.
5. **Create storage buckets** in Supabase Storage:
   - `fish-photos` — used for user-captured fish photos.
   - `species-images` — used for species library images.
6. **Configure bucket permissions** so that the app's anon key can read photos and upload to `fish-photos`. Example MVP policies are printed by the connection test script if it detects missing access. For production, review and tighten policies and enable RLS.
7. **Verify the connection** by running:

   ```bash
   npm run test:supabase
   ```

> **Note:** The current test script validates `fish-photos`; verify `species-images` manually if you are importing species images.

A consolidated setup reference is available at [`database/supabase_full_setup.sql`](database/supabase_full_setup.sql).

---

## Available Scripts

Defined in [`package.json`](package.json):

| Script | Command | Purpose |
|---|---|---|
| `start` | `expo start` | Start the Expo dev server. |
| `android` | `expo start --android` | Start and open on Android. |
| `ios` | `expo start --ios` | Start and open on iOS. |
| `web` | `expo start --web` | Start and open the web preview. |
| `lint` | `expo lint` | Run ESLint with the Expo config. |
| `typecheck` | `tsc --noEmit` | Type-check the project without emitting files. |
| `test:supabase` | `node ./scripts/test-supabase-connection.mjs` | Validate Supabase URL/key, required tables, and the `fish-photos` bucket. |

Additional helper scripts in [`scripts/`](scripts/):

- `node scripts/i18n/auditSpeciesLocalization.js` — audits seed SQL strings against the Simplified Chinese species text map to flag missing translations.

---

## Validation / Quality Checks

Run before pushing or opening a PR:

```bash
npm run lint
npm run typecheck
npm run test:supabase
node scripts/i18n/auditSpeciesLocalization.js
```

What each one checks:

- **`npm run lint`** — ESLint with the Expo config; catches style and common code issues.
- **`npm run typecheck`** — TypeScript type-checks the entire project.
- **`npm run test:supabase`** — Confirms your `.env.local` is wired correctly, the expected tables exist and are seeded, and the `fish-photos` bucket is reachable.
- **`node scripts/i18n/auditSpeciesLocalization.js`** — Confirms displayed Chinese species strings have corresponding keys in [`src/i18n/speciesText.zh.ts`](src/i18n/speciesText.zh.ts).

---

## Species Library Notes

- The current seed contains **303 ornamental fish entries** (true species, plus selected strains/varieties).
- Each entry is research-backed; provenance is captured in `fish_species_sources` with source name, type, and URL.
- Each entry carries `verification_status` and `confidence_level` so the app can communicate how trustworthy a given record is.
- Scientific names and source links are preserved in their original form.
- Simplified Chinese localization for species description fields is handled at runtime via [`src/i18n/speciesText.zh.ts`](src/i18n/speciesText.zh.ts); the SQL itself stores the original English text.

---

## Image / License Notes

- Species image metadata is tracked in [`database/seed/species_images/`](database/seed/species_images/).
- Verified real photos are stored under the Supabase Storage `species-images/real/` path and keep their license, credit, and `image_source_url` fields populated.
- Some entries use **illustrative generated placeholders** stored under `species-images/ai/`. These are clearly labelled and must not be presented as verified photographs of the real fish.
- Do not assume every species image is a real photograph — check `image_license` and `image_source_url` on the record.
- Image governance rules (which sources are acceptable, which are not, and how to attribute) are documented in [`database/seed/species_images/IMAGE_IMPORT_GUIDE.md`](database/seed/species_images/IMAGE_IMPORT_GUIDE.md).

---

## Project Status

Fishy is an **MVP / academic / portfolio project**.

- Core features (collection, library, scan/capture, photo history, reminders, compatibility warnings, bilingual UI, Supabase persistence) are implemented.
- The app is not production-hardened: there is no authentication layer beyond the Supabase anon key, and no push delivery infrastructure. The current Supabase policies are intended for MVP development and should be reviewed before production use.

---

## Future Improvements

- Production push notifications (currently in-app only).
- Native Android/iOS development builds and store releases.
- Tank profile support (per-tank parameters, per-tank fish grouping).
- Richer rule-based compatibility (more dimensions: tank size, water type, schooling).
- More verified real species images replacing illustrative placeholders.
- Broader species library expansion beyond the current 303 entries.
- Optional AI-assisted explanation layer for compatibility, with the rule-based engine remaining the source of truth.
- Authentication and per-user data isolation.

---

## Security Notes

- **Never commit `.env.local`.** It is already in `.gitignore`.
- **Never commit the Supabase service role key.** It must remain local to admin tooling.
- The app uses only the **anon** key on the client. Treat it as public, but still avoid pasting it into screenshots or public chats.
- **Review Supabase RLS and storage policies before any production deployment.** The current Supabase policies are intended for MVP development and should be reviewed before production use.
- Avoid exposing API responses, storage object paths, or seed SQL output in public bug reports without first scrubbing identifiers.

---

## Screenshots

*Screenshots will be added later.*

---

## License

No license has been selected yet.

---

## Acknowledgements

- Species data is compiled from publicly available scientific databases, care guides, and reputable references; per-species source metadata is preserved in the database.
- Verified species photos are sourced under their original open licenses (e.g., Wikimedia Commons CC BY / CC BY-SA) with attribution retained in the image metadata.
