# Fishy Technical Planning and Architecture

> Based on: `Fishy_PROJECT_RULES.md` / `CLAUDE.md` / `AGENTS.md` (identical source of truth)
> Date: 2026-05-26
> Status: Complete planning document — ready for Codex implementation

---

## 1. Product Understanding

### What Problem Fishy Solves

Fish hobbyists have no dedicated personal record system. They forget when they acquired a fish, lose track of fish that died or were sold, have no photo history to see how a fish grew over months, and make uninformed decisions when adding new fish to a tank that may harm existing fish. Fishy solves all of this in one clean mobile app.

### Who the App Is For

Personal aquarium hobbyists — from casual freshwater keepers to dedicated cichlid or marine enthusiasts — who want a single place to record, track, and learn about the fish they own or have owned. Single-user, personal use, no social or commercial features.

### What Makes Fishy Different from a Generic CRUD App

A generic CRUD app lets you create/read/update/delete records. Fishy goes further:

- **Photo history is append-only** — every time you update a photo, the old one is preserved. You build a growth timeline.
- **Fish are linked to a verified species library** — not just a name field. Each personal fish connects to a real research-backed species profile with sourced data.
- **Compatibility is rule-based and honest** — the system checks a new fish against all active fish using real water parameter data, not guesswork.
- **Dead fish stay in the collection** — history is preserved. Status changes appearance, not existence.
- **Data quality is explicit** — every species fact shows verification status and confidence level. Unknown data is null, not fabricated.

### Core User Journey

```
User opens app
  → Dashboard shows collection summary + care reminders
  → User taps Scan
  → Camera opens (no AI detection — manual only)
  → Photo taken → Preview → Confirm
  → Enter fish name
  → Select species from Library manually
  → Compatibility check runs against existing alive fish
  → Warning shown (Safe / Caution / Danger) with reasons
  → User confirms save
  → Photo uploaded to Supabase Storage
  → Fish record created in PostgreSQL
  → First photo timeline entry created
  → Fish appears in Collection
  → Over time: user updates photo (timeline grows), changes status, marks reminders done
```

### MVP Boundary

**In:** Dashboard, Collection, Add Fish (manual + scan), Fish Detail, Photo Timeline, Fish Status, Care Reminders (feeding + photo update), Compatibility Warning, Species Library (list + detail + search/filter), Supabase persistence.

**Out:** Login/auth, AI fish detection, Tank Profile, push notifications, social features, marketplace, Next.js web layer, growth charts, feeding log, water parameter tracking.

### Why No AI Detection Is the Correct MVP Decision

AI detection requires a trained model, API integration, model hosting costs, quality control of predictions, and UX for handling incorrect results. All of this adds complexity, cost, and potential for misleading users before the core collection experience is even solid. The Scan feature as camera capture + manual species selection delivers real value immediately with zero risk of false species identification. AI can be layered on later as a suggestion-only feature.

### Why Research-Backed Species Data Is Critical

Compatibility warnings, care reminders, and species information are only useful if the underlying data is correct. An app that tells a user it is "Safe" to put an Oscar in a community nano tank because species data was fabricated causes real harm to fish. The library must cite sources, flag confidence levels, and default to `null` or `needs_review` rather than inventing facts. FishBase and Seriously Fish are the primary references.

---

## 2. Final MVP Scope

| Feature | In MVP? | Reason | Implementation Notes |
|---|---|---|---|
| Dashboard | Yes | Core home screen — summarizes collection and tasks | Real data from Supabase: counts, reminders, longest-kept fish |
| Collection | Yes | Primary user-facing feature | FlatList, search, filter, sort. Greyed cards for inactive fish |
| Add Fish (manual) | Yes | Entry path without camera | Form: name, species, start date, notes. Runs compatibility check |
| Scan (camera capture) | Yes | Core add-fish path | Camera only, no AI. Expo Camera or expo-image-picker |
| Fish Detail | Yes | Central information hub per fish | Two sections: personal data + linked species info |
| Photo History Timeline | Yes | Core differentiator — append-only photo history | fish_photos table. Never overwrite. is_current flag |
| Fish Status | Yes | Alive / Dead / Sold / Given Away / Missing | Greyed out cards for non-Alive. Date fields for each status |
| Care Reminders | Yes | Required feature | In-app only for MVP. feeding + photo_update + health_check |
| Feeding Reminder | Yes | Required per rules | Species-specific text only if verified data exists |
| Photo Update Reminder | Yes | Required per rules | Triggered when latest photo > 30 days old |
| Compatibility Warning | Yes | Required per rules | Safe / Caution / Danger with reasons. Rule-based on species fields |
| Species Library | Yes | Research-backed encyclopedia | Paginated, FlatList, db-side filtering |
| Library Search | Yes | Required | Debounced 300-500ms, queries common_name + scientific_name |
| Library Filters | Yes (5 core) | Required | Search, Category, Water type, Care level, Temperament |
| Supabase Database | Yes | Required for persistence | PostgreSQL — all structured data |
| Supabase Storage | Yes | Required for photos | fish-photos and species-images buckets |
| Settings Screen | Yes (minimal) | Navigation tab required | Reminder preferences only for MVP |
| Species Detail Page | Yes | Shows full species profile | Sources, verification status, all care fields |
| Next.js Web Layer | No | Future only | Must not block mobile app |
| Auth / Login | No | Not in MVP | owner_id = "local-user" placeholder for future |
| AI Fish Detection | No | Not in MVP — never | Scan is camera only. AI suggestion is future feature |
| Tank Profile | No | Not in MVP | Optional tank_id column reserved in schema, no UI |
| Push Notifications | No | Optional future | Expo Notifications can be added post-MVP |
| Growth Chart | No | Future | Requires feeding log and weight data |
| Water Parameter Tracking | No | Future | Post-MVP feature |
| Community / Social | No | Future | Not in MVP scope |
| Marketplace | No | Out of scope entirely | Not a Fishy feature |

---

## 3. Recommended Architecture

### Why Expo-First

Expo provides managed builds, camera access, image picker, file system, and notifications without custom native code. The project targets iOS and Android. Expo Router gives a file-based routing system familiar to Next.js developers. EAS Build handles distribution to TestFlight and App Store. Starting with Expo avoids the complexity of bare React Native while keeping the option to eject later.

### Why No Custom Backend Server

Supabase provides a PostgreSQL database, storage, row-level security, and a JavaScript client that can be called directly from the mobile app. There is no need for a custom API server in MVP. Supabase handles auth when it is added later. Removing the backend server removes a deployment target, a maintenance burden, and a source of latency.

### MVP Architecture

```
┌─────────────────────────────────────┐
│         Expo React Native App        │
│  (Expo Router, TypeScript, RN UI)   │
│                                     │
│  screens/components/features/hooks  │
│         ↓                           │
│     services/ (query layer)         │
│         ↓                           │
│     lib/supabase/client.ts          │
└─────────────┬───────────────────────┘
              │ HTTPS / Supabase JS SDK
              ↓
┌─────────────────────────────────────┐
│             Supabase                │
│                                     │
│  PostgreSQL (structured data)       │
│  Storage (fish-photos bucket)       │
│  Storage (species-images bucket)    │
│  (Auth — future, not MVP)           │
└─────────────────────────────────────┘
```

### Future Architecture with Next.js Admin

```
┌──────────────────┐    ┌──────────────────────┐
│  Expo Mobile App │    │  Next.js Admin/Web   │
│  (same codebase) │    │  (apps/web — future) │
└────────┬─────────┘    └──────────┬───────────┘
         │                         │
         └──────────┬──────────────┘
                    ↓
         ┌──────────────────────┐
         │      Supabase        │
         │  PostgreSQL + Storage│
         └──────────────────────┘
```

### Future-Proofing for Login

- All personal tables (`user_fish`, `reminders`, `fish_photos`) include `owner_id TEXT NOT NULL DEFAULT 'local-user'`
- When Supabase Auth is added later, `owner_id` becomes `auth.uid()`
- Row Level Security policies can be added in a migration without changing the schema structure
- No personal data is stored without an `owner_id` column — migration to real auth is a schema policy change, not a data model rewrite

---

## 4. Recommended Repository Structure

### Option A: Simple Expo-First (Recommended for MVP)

```
fishy/
├── app/                          # Expo Router screens (file-based routing)
│   ├── (tabs)/
│   │   ├── index.tsx             # Dashboard
│   │   ├── collection/
│   │   │   ├── index.tsx         # Collection list
│   │   │   └── [id].tsx          # Fish detail
│   │   ├── scan/
│   │   │   ├── index.tsx         # Camera screen
│   │   │   ├── preview.tsx       # Photo preview
│   │   │   └── add-fish.tsx      # Add fish form after scan
│   │   ├── library/
│   │   │   ├── index.tsx         # Species list
│   │   │   └── [id].tsx          # Species detail
│   │   └── settings.tsx          # Settings
│   ├── compatibility-warning.tsx  # Modal/screen for compat check
│   ├── update-photo.tsx           # Update fish photo screen
│   └── _layout.tsx               # Root layout with tab bar
├── src/
│   ├── components/               # Shared UI components
│   │   ├── FishCard.tsx
│   │   ├── SpeciesCard.tsx
│   │   ├── PhotoTimeline.tsx
│   │   ├── ReminderCard.tsx
│   │   ├── CompatibilityBadge.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorMessage.tsx
│   ├── features/
│   │   ├── dashboard/
│   │   │   ├── useDashboard.ts   # Hook for dashboard data
│   │   │   └── DashboardStats.tsx
│   │   ├── collection/
│   │   │   ├── useCollection.ts
│   │   │   ├── useAddFish.ts
│   │   │   └── CollectionFilters.tsx
│   │   ├── scan/
│   │   │   ├── useScan.ts
│   │   │   └── CameraView.tsx
│   │   ├── library/
│   │   │   ├── useLibrary.ts
│   │   │   ├── useSpeciesDetail.ts
│   │   │   └── LibraryFilters.tsx
│   │   ├── reminders/
│   │   │   ├── useReminders.ts
│   │   │   └── generatePhotoReminders.ts
│   │   └── compatibility/
│   │       ├── checkCompatibility.ts
│   │       └── CompatibilityResult.tsx
│   ├── services/                 # Supabase query functions (the query layer)
│   │   ├── fishService.ts
│   │   ├── photoService.ts
│   │   ├── speciesService.ts
│   │   ├── reminderService.ts
│   │   └── compatibilityService.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   └── client.ts         # Single Supabase client instance
│   │   ├── storage/
│   │   │   └── uploadPhoto.ts    # Photo upload logic
│   │   └── utils/
│   │       ├── dateUtils.ts
│   │       ├── durationUtils.ts
│   │       └── compatibilityUtils.ts
│   ├── types/
│   │   └── index.ts              # All TypeScript types/interfaces
│   └── constants/
│       ├── colors.ts
│       ├── owner.ts              # OWNER_ID = 'local-user'
│       └── reminders.ts          # Default frequencies
├── database/
│   ├── migrations/
│   │   ├── 001_create_fish_categories.sql
│   │   ├── 002_create_fish_species.sql
│   │   ├── 003_create_fish_species_sources.sql
│   │   ├── 004_create_user_fish.sql
│   │   ├── 005_create_fish_photos.sql
│   │   ├── 006_create_reminders.sql
│   │   ├── 007_create_compatibility_rules.sql
│   │   └── 008_create_indexes.sql
│   └── seed/
│       ├── categories.sql
│       └── README.md             # Instructions for adding verified species data
├── assets/
│   ├── images/
│   └── fonts/
├── app.json
├── eas.json
├── tsconfig.json
├── .env.local                    # EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
└── Fishy_PROJECT_RULES.md
```

**Choose Option A when:** You are building MVP, there is no web layer yet, and the team is 1-2 people.

### Option B: Monorepo (For Later, When Next.js Is Added)

```
fishy-monorepo/
├── apps/
│   ├── mobile/                   # Expo React Native app (same structure as Option A)
│   └── web/                      # Next.js admin/landing page
│       ├── app/
│       ├── components/
│       └── package.json
├── packages/
│   ├── supabase/                 # Shared Supabase client + types
│   │   ├── client.ts
│   │   └── types.ts
│   └── ui/                       # Shared UI primitives if needed
├── database/
│   ├── migrations/
│   └── seed/
├── package.json                  # Workspace root
└── turbo.json                    # Turborepo config
```

**Choose Option B when:** The Next.js admin panel is actively being built alongside the mobile app.

**Recommendation:** Start with Option A. The database and service layer should be designed so that migrating to Option B later (moving `lib/supabase` and `types` to a shared `packages/` folder) is straightforward.

---

## 5. Screen-by-Screen Plan

### Screen 1: Dashboard

| Attribute | Detail |
|---|---|
| Purpose | Home screen. Summarize fish collection and surface care tasks. |
| Route | `app/(tabs)/index.tsx` |

**UI Sections:**
- Header: "Fishy" app name + simple fish logo
- Stats row: Active fish count | Total collection count | Species count
- Card: Longest kept active fish (name + duration)
- Card: Recently added fish (last 2-3)
- Section: Care reminders due today or overdue
- Section: Photo update reminders (fish with photos > 30 days old)

**Data Needed:**
- `user_fish` count where `status = 'alive'` and `owner_id = OWNER_ID`
- `user_fish` total count
- Unique `species_id` count from `user_fish`
- Most recently added fish (ORDER BY created_at DESC LIMIT 3)
- Fish with longest duration (alive: start_date to now; dead: start_date to death_date)
- Active reminders (next_due_at <= now, is_active = true)
- Fish where most recent photo captured_at < 30 days ago

**Supabase Queries:** `getDashboardSummary()` — single aggregated call or parallel calls via `Promise.all`

**User Actions:** Tap reminder to go to reminders screen. Tap fish card to go to Fish Detail. Tap "Add Fish" / "Scan Fish" CTA in empty state.

**Empty State:** "Welcome to Fishy. Add your first fish or explore the species library." with two action buttons.

**Error State:** "Could not load dashboard. Check connection and try again." with retry button.

**Loading State:** Skeleton card placeholders while fetching.

**Navigation:** Bottom tab. Tapping fish card navigates to `collection/[id]`.

---

### Screen 2: Collection

| Attribute | Detail |
|---|---|
| Purpose | List of all personal fish (alive and historical). |
| Route | `app/(tabs)/collection/index.tsx` |

**UI Sections:**
- Search bar (debounced)
- Filter chips: All | Alive | Inactive (Dead/Sold/Given Away/Missing)
- Sort picker: Recently Added / Name A-Z / Longest Kept / Status
- FlatList of FishCard components

**FishCard Layout:**
- Thumbnail photo (from `fish_photos.thumbnail_url` where `is_current = true`)
- Fish name + species common name
- Status badge (color-coded)
- Duration label ("Kept for 3 months" or "Deceased · 5 months")
- Greyed/desaturated style for non-Alive status

**Data Needed:** `user_fish` joined with `fish_species` (for common_name) and `fish_photos` (for current thumbnail). Filtered by `owner_id`.

**Supabase Queries:** `getUserFish({ search, status, sort, page })` — with server-side filtering and pagination.

**User Actions:** Search, filter, sort, tap card to open Fish Detail. FAB (+) button to Add Fish manually.

**Empty State:** "No fish yet. Add your first fish or scan a new one." with two CTA buttons.

**Error State:** "Could not load collection. Try again."

**Loading State:** FlatList with placeholder skeleton cards.

**Navigation:** Tap card → `collection/[id]`. FAB → Add Fish modal or screen.

---

### Screen 3: Fish Detail

| Attribute | Detail |
|---|---|
| Purpose | Full information hub for one personal fish. |
| Route | `app/(tabs)/collection/[id].tsx` |

**UI Sections:**
- Section A — Personal Fish
  - Large current photo
  - Fish name (editable)
  - Status badge with edit button
  - Species name (linked to Library)
  - Start date | Keeping duration
  - Death/end date if applicable
  - Notes (editable)
  - "Update Photo" button
  - Photo History Timeline (chronological FlatList of fish_photos)
- Section B — Species Info (collapsed or scrollable below)
  - Common name + scientific name
  - Water type | Adult size | Lifespan | Temperament | Diet | Care level
  - Temperature range | pH range | Hardness range
  - Minimum tank size
  - Compatibility notes | Avoid-with notes
  - Source references (list of sources with URLs)
  - Verification status badge

**Data Needed:** `user_fish` by id + joined `fish_species` + all `fish_photos` for this fish ordered by `captured_at ASC`.

**Supabase Queries:** `getUserFishById(id)`, `getFishPhotos(fishId)`, `getSpeciesSources(speciesId)`

**User Actions:** Edit fish name, edit status (opens date picker for dead/end date), tap "Update Photo" (navigates to update photo screen), tap species name (navigates to Species Detail), tap photo in timeline (full-screen view).

**Empty State:** N/A — screen requires an existing fish.

**Error State:** "Could not load fish details. Try again."

**Loading State:** Full-screen loading spinner then content.

**Navigation:** Back → Collection. Species link → Library/[speciesId]. Update Photo → update-photo screen.

---

### Screen 4: Add Fish Manually

| Attribute | Detail |
|---|---|
| Purpose | Add a fish to collection without camera scan. |
| Route | Modal / stack screen from Collection FAB |

**UI Sections:**
- Photo: "Add photo" placeholder (optional for manual add — camera/gallery picker)
- Field: Fish name (text input, required)
- Field: Species (searchable dropdown from Library — required or "Unknown species")
- Field: Start date (date picker, defaults to today)
- Field: Notes (multiline text, optional)
- "Check Compatibility" button → runs check → shows result
- "Save Fish" button

**Data Needed:** Species list for species picker (searchable, paginated). Active fish for compatibility check.

**User Actions:** Fill form, pick species, check compatibility, save.

**Validation:** Fish name required. Species required (or explicitly "Unknown"). Start date required.

**Error State:** Show inline field errors. Show "Save failed" toast with retry option.

**Navigation:** Cancel → back. Save → Collection (new fish card appears). Compatibility warning screen shown inline or as modal before final save.

---

### Screen 5: Scan Camera

| Attribute | Detail |
|---|---|
| Purpose | Open camera to capture fish photo. |
| Route | `app/(tabs)/scan/index.tsx` |

**UI Sections:**
- Camera viewfinder (full screen)
- Capture button (large, centered)
- Gallery import button (for adding existing photos)
- Cancel / close button

**Permissions:** Request camera permission on mount. If denied, show permission denied state with "Open Settings" button.

**User Actions:** Tap capture → navigate to Preview. Tap gallery → image picker → navigate to Preview. Tap cancel → back to previous screen.

**Error State (permission denied):** "Camera access required. Please enable camera permission in Settings."

**Error State (camera error):** "Camera unavailable. Try again."

---

### Screen 6: Scan Preview

| Attribute | Detail |
|---|---|
| Purpose | Review captured photo before proceeding. |
| Route | `app/(tabs)/scan/preview.tsx` |

**UI Sections:**
- Large photo preview
- "Retake" button
- "Use This Photo" button

**User Actions:** Retake → back to Camera screen (photo discarded). Use This Photo → navigate to Add Fish After Scan.

---

### Screen 7: Add Fish After Scan

| Attribute | Detail |
|---|---|
| Purpose | Enter fish details after photo capture. |
| Route | `app/(tabs)/scan/add-fish.tsx` |

**UI Sections:**
- Small photo preview (locked — cannot change here, use retake)
- Field: Fish name (text input, required)
- Field: Species (searchable selector from Library — required or "Unknown species")
- Field: Start date (date picker, defaults to today)
- Field: Notes (optional)
- "Check Compatibility" → shows compatibility result inline or navigates to warning screen
- "Save Fish" button (disabled until name + species entered)

**User Actions:** Fill form, select species, check compatibility, save.

**Save Sequence:** Upload photo to Supabase Storage → Insert `user_fish` → Insert first `fish_photos` record → Navigate to Fish Detail.

**Error State:** Upload failed → show error, allow retry. Save failed → show error toast.

---

### Screen 8: Compatibility Warning Review

| Attribute | Detail |
|---|---|
| Purpose | Show compatibility result before saving a new fish. |
| Route | `app/compatibility-warning.tsx` (modal) |

**UI Sections:**
- New fish name + species
- Overall compatibility badge: SAFE (green) / CAUTION (amber) / DANGER (red)
- Per-pair breakdown: "New Fish vs. [Existing Fish Name]" with reason
- If no active fish: "No active fish in collection. Compatibility check skipped."
- If data incomplete: "Some species data is incomplete. Treat this result as Caution."
- "Save Anyway" button (always available — user decides)
- "Go Back" button

**User Actions:** Review, then Save Anyway or Go Back.

**Navigation:** Appears before final save during both Scan and Manual Add flows.

---

### Screen 9: Photo Timeline

| Attribute | Detail |
|---|---|
| Purpose | View full photo history for one fish. |
| Part of: | Fish Detail screen (embedded timeline section) |

**UI:** Vertical timeline. Each entry shows:
- Date label (e.g., "26 May 2026")
- Thumbnail photo
- Note (if present)
- "Current" badge on the most recent `is_current = true` entry

**User Actions:** Tap photo → full-screen image viewer. Scroll timeline.

**Empty State:** Only shown after at least one photo exists (added on fish creation). Timeline always has at least one entry.

---

### Screen 10: Update Photo

| Attribute | Detail |
|---|---|
| Purpose | Add a new photo to a fish (appends to timeline — never overwrites). |
| Route | `app/update-photo.tsx` |

**UI Sections:**
- Current photo (small, for reference)
- "Take New Photo" button → opens camera
- "Pick from Gallery" button → image picker
- Preview of selected photo
- Note field (optional: "Grew bigger", "Color improved")
- "Save Update" button

**Save Sequence:**
1. Upload new photo to `fish-photos/{owner_id}/{fish_id}/{timestamp}.jpg`
2. Get public URL
3. Set all existing `fish_photos` for this fish to `is_current = false`
4. Insert new `fish_photos` record with `is_current = true`
5. Update `user_fish.current_photo_id` to new photo id
6. Navigate back to Fish Detail

**Error State:** Upload failed → retry. Save failed → toast error.

---

### Screen 11: Species Library

| Attribute | Detail |
|---|---|
| Purpose | Browse research-backed fish encyclopedia. |
| Route | `app/(tabs)/library/index.tsx` |

**UI Sections:**
- Search bar (debounced 300-500ms)
- Filter row: Category | Water Type | Care Level | Temperament (chip selectors)
- FlatList of SpeciesCard (thumbnail + common name + scientific name + care level badge)
- Infinite scroll / "Load more" trigger at bottom

**Data Needed:** Paginated `fish_species` with filters pushed to database query. 20-25 per page.

**Supabase Queries:** `getSpeciesList({ search, category, waterType, careLevel, temperament, page, pageSize })`

**User Actions:** Search, filter, tap card to open Species Detail, scroll to load more.

**Empty State:** "No species found. Try a different search or filter."

**Error State:** "Could not load species. Check connection and try again."

**Loading State:** Initial skeleton cards. Pagination: activity indicator at bottom.

**Navigation:** Tap card → `library/[id]`. Back → previous screen.

---

### Screen 12: Species Detail

| Attribute | Detail |
|---|---|
| Purpose | Full species profile with research-backed data. |
| Route | `app/(tabs)/library/[id].tsx` |

**UI Sections:**
- Full-size species image (with attribution below if required)
- Common name (large) + Scientific name (italic, smaller)
- Category badge + Verification status badge
- Data grid:
  - Water type | Origin | Adult size | Lifespan
  - Temperament | Diet | Care level
  - Temperature range | pH range | Hardness range
  - Minimum tank size | Tank level | Schooling behavior
- Description + Care notes + Feeding notes
- Compatibility notes + Avoid-with notes
- Source references section (list: source name, URL, retrieved date)
- Confidence level indicator per critical field (if implemented)

**Data Needed:** `fish_species` by id + `fish_species_sources` for this species.

**Null handling:** Fields with `null` value show "Data not available" or "Needs review" rather than empty space.

**User Actions:** Tap source URL → open browser. Scroll.

---

### Screen 13: Reminders Screen / Section

| Attribute | Detail |
|---|---|
| Purpose | See and manage care reminders. |
| Route | Embedded in Dashboard + optional dedicated screen via Settings or navigation |

**UI Sections:**
- Overdue reminders (red border)
- Due today (amber border)
- Upcoming (default)
- Each reminder card: fish name + type icon + title + due date + "Mark Done" button

**User Actions:** Mark Done (updates `last_completed_at`, recalculates `next_due_at`). Dismiss (sets `is_active = false`).

**Empty State:** "No reminders due. Your fish are well cared for."

---

### Screen 14: Settings

| Attribute | Detail |
|---|---|
| Purpose | App preferences and reminder configuration. |
| Route | `app/(tabs)/settings.tsx` |

**UI Sections:**
- Photo Update Reminder Frequency (default: 30 days — numeric input or picker)
- Feeding Reminder Frequency (daily default)
- Health Check Reminder Frequency (weekly default)
- App version info
- (Future placeholder: Notifications, Export Data, Sign In)

---

## 6. Database Schema Design

### Enums

```sql
-- Fish status
CREATE TYPE fish_status AS ENUM ('alive', 'dead', 'sold', 'given_away', 'missing');

-- Water type
CREATE TYPE water_type AS ENUM ('freshwater', 'brackish', 'marine', 'unknown');

-- Temperament
CREATE TYPE temperament AS ENUM ('peaceful', 'semi_aggressive', 'aggressive', 'unknown');

-- Diet
CREATE TYPE diet_type AS ENUM ('carnivore', 'herbivore', 'omnivore', 'unknown');

-- Care level
CREATE TYPE care_level AS ENUM ('beginner', 'intermediate', 'advanced', 'unknown');

-- Verification status
CREATE TYPE verification_status AS ENUM ('verified', 'partially_verified', 'draft', 'needs_review');

-- Confidence level
CREATE TYPE confidence_level AS ENUM ('high', 'medium', 'low', 'unknown');

-- Compatibility level
CREATE TYPE compatibility_level AS ENUM ('safe', 'caution', 'danger', 'unknown');

-- Reminder type
CREATE TYPE reminder_type AS ENUM ('feeding', 'photo_update', 'health_check', 'water_change', 'custom');

-- Source type
CREATE TYPE source_type AS ENUM ('scientific_database', 'care_guide', 'organization', 'breeder', 'forum_secondary', 'other');
```

---

### Table: fish_categories

**Purpose:** Organizes species into broad aquarium groups (Cichlid, Tetra, Pleco, etc.)

```sql
CREATE TABLE fish_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Seed data includes:** Cichlid, Angelfish, Gourami, Betta, Arowana, Goldfish, Koi, Tetra, Barb, Rasbora, Catfish, Pleco, Loach, Discus, Livebearer, Marine Fish, Brackish Fish, River Monster Fish.

**Indexes:** `slug` (unique), `name` (unique)

---

### Table: fish_species

**Purpose:** Research-backed species encyclopedia. Shared library — not user-owned.

```sql
CREATE TABLE fish_species (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  common_name             TEXT NOT NULL,
  scientific_name         TEXT NOT NULL UNIQUE,
  category_id             UUID REFERENCES fish_categories(id),
  family                  TEXT,
  water_type              water_type NOT NULL DEFAULT 'unknown',
  origin                  TEXT,
  adult_size_min_cm       NUMERIC,
  adult_size_max_cm       NUMERIC,
  lifespan_min_years      NUMERIC,
  lifespan_max_years      NUMERIC,
  temperament             temperament NOT NULL DEFAULT 'unknown',
  diet                    diet_type NOT NULL DEFAULT 'unknown',
  care_level              care_level NOT NULL DEFAULT 'unknown',
  temperature_min_c       NUMERIC,
  temperature_max_c       NUMERIC,
  ph_min                  NUMERIC,
  ph_max                  NUMERIC,
  hardness_min_dgh        NUMERIC,
  hardness_max_dgh        NUMERIC,
  minimum_tank_size_liters NUMERIC,
  tank_level              TEXT,           -- 'top', 'mid', 'bottom', 'all', null
  schooling_behavior      BOOLEAN,
  description             TEXT,
  care_notes              TEXT,
  feeding_notes           TEXT,
  compatibility_notes     TEXT,
  avoid_with_notes        TEXT,
  image_url               TEXT,
  thumbnail_url           TEXT,
  image_license           TEXT,
  image_source_url        TEXT,
  verification_status     verification_status NOT NULL DEFAULT 'draft',
  confidence_level        confidence_level NOT NULL DEFAULT 'unknown',
  last_reviewed_at        TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Indexes:**
```sql
CREATE INDEX idx_species_common_name ON fish_species USING gin(to_tsvector('english', common_name));
CREATE INDEX idx_species_scientific_name ON fish_species(scientific_name);
CREATE INDEX idx_species_category ON fish_species(category_id);
CREATE INDEX idx_species_water_type ON fish_species(water_type);
CREATE INDEX idx_species_care_level ON fish_species(care_level);
CREATE INDEX idx_species_temperament ON fish_species(temperament);
CREATE INDEX idx_species_verification ON fish_species(verification_status);
```

**Notes:** Scientific name is unique. Unknown/unverified fields stored as NULL. `verification_status` defaults to `draft`. AI-generated drafts must be `draft` or `needs_review` and must not ship as `verified`.

---

### Table: fish_species_sources

**Purpose:** Source citations for species data. One species can have multiple sources.

```sql
CREATE TABLE fish_species_sources (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species_id       UUID NOT NULL REFERENCES fish_species(id) ON DELETE CASCADE,
  source_name      TEXT NOT NULL,
  source_url       TEXT,
  source_type      source_type NOT NULL DEFAULT 'other',
  fields_supported TEXT[],   -- e.g. ['temperature', 'ph', 'adult_size']
  notes            TEXT,
  retrieved_at     DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Index:** `CREATE INDEX idx_sources_species ON fish_species_sources(species_id);`

---

### Table: user_fish

**Purpose:** Personal collection records. Each row is one personally-owned or previously-owned fish.

```sql
CREATE TABLE user_fish (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         TEXT NOT NULL DEFAULT 'local-user',  -- future: auth.uid()
  species_id       UUID REFERENCES fish_species(id),     -- nullable: unknown species
  name             TEXT NOT NULL,
  status           fish_status NOT NULL DEFAULT 'alive',
  start_date       DATE NOT NULL,
  death_date       DATE,             -- set when status = 'dead'
  end_date         DATE,             -- set when status = sold/given_away/missing
  current_photo_id UUID,             -- FK to fish_photos (set after photo upload)
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK after fish_photos is created
-- ALTER TABLE user_fish ADD CONSTRAINT fk_current_photo 
--   FOREIGN KEY (current_photo_id) REFERENCES fish_photos(id);
```

**Indexes:**
```sql
CREATE INDEX idx_user_fish_owner ON user_fish(owner_id);
CREATE INDEX idx_user_fish_status ON user_fish(owner_id, status);
CREATE INDEX idx_user_fish_species ON user_fish(species_id);
CREATE INDEX idx_user_fish_start ON user_fish(start_date);
```

**Notes:** `species_id` nullable — allows "Unknown species". `current_photo_id` starts NULL, set after first photo upload. Circular FK (user_fish ↔ fish_photos) resolved by adding FK via ALTER TABLE after both tables exist.

---

### Table: fish_photos

**Purpose:** Append-only photo history timeline. One record per photo capture. Never overwritten.

```sql
CREATE TABLE fish_photos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fish_id      UUID NOT NULL REFERENCES user_fish(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,    -- e.g. fish-photos/local-user/{fish_id}/{ts}.jpg
  photo_url    TEXT NOT NULL,    -- Supabase public URL
  thumbnail_url TEXT,            -- compressed version URL if available
  captured_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  note         TEXT,
  is_current   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Indexes:**
```sql
CREATE INDEX idx_photos_fish ON fish_photos(fish_id);
CREATE INDEX idx_photos_current ON fish_photos(fish_id, is_current);
CREATE INDEX idx_photos_captured ON fish_photos(fish_id, captured_at DESC);
```

**Notes:** Only one `is_current = true` per fish_id at any time. Enforced in application logic (set all to false, then insert new with true). No unique constraint on `is_current` because we need at least one null-safe approach.

---

### Table: reminders

**Purpose:** In-app care reminders. Can be fish-specific or global.

```sql
CREATE TABLE reminders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          TEXT NOT NULL DEFAULT 'local-user',
  fish_id           UUID REFERENCES user_fish(id) ON DELETE CASCADE,  -- null = global
  species_id        UUID REFERENCES fish_species(id),                 -- for context
  type              reminder_type NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  frequency         TEXT NOT NULL DEFAULT 'daily',  -- 'daily', 'weekly', 'every_30_days', etc.
  next_due_at       TIMESTAMPTZ NOT NULL,
  last_completed_at TIMESTAMPTZ,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Indexes:**
```sql
CREATE INDEX idx_reminders_owner ON reminders(owner_id, is_active);
CREATE INDEX idx_reminders_due ON reminders(owner_id, next_due_at) WHERE is_active = true;
CREATE INDEX idx_reminders_fish ON reminders(fish_id);
```

**Notes:** Photo update reminders are generated dynamically by checking `fish_photos.captured_at` — they are not stored as persistent records but can be surfaced as computed reminders. Feeding reminders are stored records with daily frequency.

---

### Table: compatibility_rules

**Purpose:** Explicit species pair compatibility overrides from verified sources.

```sql
CREATE TABLE compatibility_rules (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species_a_id        UUID NOT NULL REFERENCES fish_species(id),
  species_b_id        UUID NOT NULL REFERENCES fish_species(id),
  level               compatibility_level NOT NULL,
  reason              TEXT NOT NULL,
  source_id           UUID REFERENCES fish_species_sources(id),
  verification_status verification_status NOT NULL DEFAULT 'draft',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_pair CHECK (species_a_id != species_b_id),
  CONSTRAINT ordered_pair CHECK (species_a_id < species_b_id)  -- prevents A-B and B-A duplicates
);
```

**Index:** `CREATE UNIQUE INDEX idx_compat_pair ON compatibility_rules(species_a_id, species_b_id);`

**Notes:** The `ordered_pair` constraint ensures A and B are always stored in UUID sort order, preventing duplicate rules for the same pair. Query logic must always sort (a, b) before lookup.

---

### Why Collection and Library Must Be Separated

The Library (`fish_species`) is a curated, shared encyclopedia that exists independently of any user. A user might browse Discus species without owning one. The Collection (`user_fish`) is personal — each record represents a specific fish owned by the user, with its own name, photo history, status, and dates. Merging them would mean: (a) the library would grow by user fish additions, polluting it with duplicates; (b) species facts could be accidentally edited by users; (c) filtering the library by "your fish" would require complex joins; (d) the same species appearing 3 times (three Oscars owned) would create library duplicates. The `species_id` foreign key on `user_fish` is the clean linking mechanism.

---

## 7. Supabase Storage Design

### Required Buckets

| Bucket | Purpose | Access |
|---|---|---|
| `fish-photos` | User-uploaded personal fish photos | Private (owner only via signed URLs or path-based access) |
| `species-images` | Library species images (curated, licensed) | Public read |

### Fish Photos Path Structure

```
fish-photos/
  {owner_id}/
    {fish_id}/
      {unix_timestamp_ms}.jpg       ← original upload
      {unix_timestamp_ms}_thumb.jpg ← compressed thumbnail (if generated)
```

**Example:**
```
fish-photos/local-user/a1b2c3-fish-id/1748289600000.jpg
fish-photos/local-user/a1b2c3-fish-id/1748289600000_thumb.jpg
```

**Why timestamp in filename:** Guarantees uniqueness within a fish. Multiple photos over time don't collide. Never overwrite old files — each upload creates a new file at a new path.

### Species Images Path Structure

```
species-images/
  {species_id}/
    main.jpg
    thumb.jpg
```

### Storage Path vs Public URL

**Always store `storage_path` in the database** (e.g., `fish-photos/local-user/{fish_id}/1748289600000.jpg`), not only the public URL. Reasons:
- Public URLs can change if bucket settings change.
- You can regenerate signed URLs from a path.
- Easier to delete or move files.
- Cleaner audit trail.

Store both `storage_path` and `photo_url` (the resolved public or signed URL at upload time) in `fish_photos`.

### Image Compression and Resizing

Before uploading to Supabase Storage:
1. Use `expo-image-manipulator` to resize to max 1200px on longest edge.
2. Compress JPEG quality to 80%.
3. Generate a thumbnail version: 400px on longest edge, 70% quality.
4. Upload both files to storage.
5. Store paths and URLs for both.

This keeps storage costs low and list scroll performance fast (thumbnails only on list cards).

### Species Image Licensing

For every image in `species-images`, the `fish_species` table stores:
- `image_license` — e.g., "CC BY 4.0", "CC0", "Public Domain"
- `image_source_url` — original source page
- (Attribution text in species detail if required by license)

Do not upload unlicensed images. If no licensed image is available, leave `image_url` null and show a placeholder fish silhouette in the UI.

---

## 8. Photo History Timeline Design

### Data Model

Each photo capture creates one `fish_photos` record. Records are never deleted or overwritten. The timeline is the ordered list of all `fish_photos` for a given `fish_id`, sorted by `captured_at ASC`.

```
fish_photos
  id
  fish_id (FK → user_fish)
  storage_path
  photo_url
  thumbnail_url
  captured_at       ← when the photo was taken
  note              ← optional user note
  is_current        ← only one true per fish at a time
  created_at
  updated_at
```

### First Photo: Creation During Scan/Add Fish

**Sequence:**
1. Image captured (camera or gallery).
2. Image compressed + thumbnail generated locally using `expo-image-manipulator`.
3. Upload original to `fish-photos/{owner_id}/{fish_id}/{ts}.jpg`.
4. Upload thumbnail to `fish-photos/{owner_id}/{fish_id}/{ts}_thumb.jpg`.
5. Get public URLs for both.
6. Insert `user_fish` record (status: alive, start_date: today, current_photo_id: null initially).
7. Insert `fish_photos` record (`is_current = true`, `note = "First added"`).
8. Update `user_fish.current_photo_id` to new `fish_photos.id`.

**Note on circular FK:** Since `user_fish.current_photo_id` references `fish_photos`, and `fish_photos.fish_id` references `user_fish`, insert `user_fish` first (with `current_photo_id = null`), then insert `fish_photos`, then update `user_fish.current_photo_id`. All in a transaction or sequential awaits.

### Update Photo Flow

**Sequence:**
1. User taps "Update Photo" on Fish Detail.
2. Camera or gallery opens.
3. Image preview shown.
4. Optional note entered.
5. User confirms save.
6. Image compressed + thumbnail generated.
7. Upload to `fish-photos/{owner_id}/{fish_id}/{new_ts}.jpg`.
8. Get public URL.
9. Run Supabase update: `UPDATE fish_photos SET is_current = false WHERE fish_id = {id}`.
10. Insert new `fish_photos` record with `is_current = true`, `note` from user input, `captured_at = now()`.
11. Update `user_fish.current_photo_id` to new record's id.
12. Navigate back to Fish Detail — UI refreshes.

### Current Photo Logic

- `user_fish.current_photo_id` is a shortcut reference to the current photo.
- The canonical "current photo" is always the `fish_photos` record where `is_current = true` for that `fish_id`.
- Both fields should agree. If they ever diverge (edge case), `is_current = true` in `fish_photos` is the source of truth.

### Timeline UI

```
Timeline entry component:
  ● [thumbnail]  26 May 2026   "First added"      [CURRENT badge]
  ● [thumbnail]  20 Jun 2026   "Grew bigger"
  ● [thumbnail]  15 Jul 2026   "Color improved"   [CURRENT badge]
```

- Ordered chronologically (oldest at top or bottom — match convention of most photo timeline apps: oldest at top, scroll down to see newest, or reverse — decide on one and be consistent).
- Tapping a thumbnail shows it full-screen.

### Edge Cases

| Case | Handling |
|---|---|
| Upload succeeds but DB insert fails | Orphan file in storage. Log error, retry. Optionally delete orphan file. |
| DB insert succeeds but current_photo_id update fails | `is_current = true` record exists but `user_fish.current_photo_id` is stale. On load, query by `is_current = true` as fallback. |
| User adds photo while offline | Not supported in MVP. Show "Upload requires connection." |
| Two rapid photo uploads | Second upload should wait for first to complete. Disable Save button during upload. |

---

## 9. Scan Flow Design

### Step-by-Step Flow

```
1. User taps Scan tab
     ↓
2. Camera permission check
   - Granted → show camera viewfinder
   - Denied → show "Enable camera permission" screen with "Open Settings" button. STOP.
     ↓
3. Camera viewfinder shown
   - User can tap capture button → go to step 4
   - User can tap gallery button → opens image picker → go to step 4
   - User can tap cancel → back to previous screen
     ↓
4. Photo captured / selected
     ↓
5. Preview screen
   - Full-size photo preview
   - "Retake" button → discard photo, back to step 3
   - "Use This Photo" button → continue to step 6
     ↓
6. Add Fish form (add-fish.tsx)
   - Photo shown (small, locked)
   - Enter fish name (required)
   - Select species from Library (searchable picker) — or choose "Unknown species"
   - Set start date (date picker, default: today)
   - Enter notes (optional)
     ↓
7. "Check Compatibility" button (or auto-runs when species is selected)
   - Fetches active fish from user_fish where status = 'alive' and owner_id = OWNER_ID
   - Fetches species data for each active fish (water_type, temp, pH, temperament, size)
   - Runs compatibility algorithm (see Section 12)
   - Shows inline result (Safe / Caution / Danger) + reason list
   - If no active fish: "No active fish. No compatibility check needed."
   - If new species is "Unknown": "Cannot check compatibility for unknown species. Treat as Caution."
     ↓
8. User taps "Save Fish"
   - Validates form (name + species required, start date required)
   - Shows loading state
     ↓
9. Upload sequence:
   a. Compress image using expo-image-manipulator (max 1200px, 80% quality)
   b. Generate thumbnail (400px, 70%)
   c. Upload original to Supabase Storage: fish-photos/local-user/{temp_id}/{ts}.jpg
      - If upload fails → show error toast, allow retry. DO NOT save fish record.
   d. Upload thumbnail
   e. Get public URLs
     ↓
10. Database sequence:
    a. INSERT into user_fish (owner_id, species_id, name, status='alive', start_date, notes, current_photo_id=null)
    b. INSERT into fish_photos (fish_id, storage_path, photo_url, thumbnail_url, captured_at=now(), note='First added', is_current=true)
    c. UPDATE user_fish SET current_photo_id = new fish_photos.id WHERE id = new fish_id
    - If any DB operation fails → show error toast, allow retry
      ↓
11. Generate default reminders:
    - INSERT feeding reminder (type='feeding', next_due_at=tomorrow)
    - INSERT health_check reminder (next_due_at=7 days from now)
    (Photo update reminder is computed dynamically, not stored)
      ↓
12. Navigate to Fish Detail for the new fish
    Collection refreshes automatically
```

### Error States

| Error | UI Response |
|---|---|
| Camera permission denied | "Camera access required. Enable in Settings." + "Open Settings" button |
| Camera hardware error | "Camera unavailable. Try gallery instead." |
| Upload failed (network) | "Photo upload failed. Check connection and try again." + Retry button |
| Upload failed (storage) | "Photo could not be saved. Try again." + Retry button |
| DB save failed | "Fish could not be saved. Try again." + Retry button |
| Species unknown selected | No compatibility check. Show Caution warning. Allow save. |
| Compatibility data incomplete | Show Caution automatically with reason: "Species data incomplete." |

---

## 10. Fish Status Design

### Statuses and Meaning

| Status | Meaning | Card Appearance | Active? |
|---|---|---|---|
| `alive` | Fish is alive and in the aquarium | Full color, normal | Yes |
| `dead` | Fish has died | Greyed/desaturated, "Deceased" label | No |
| `sold` | Fish was sold | Greyed/desaturated, "Sold" label | No |
| `given_away` | Fish was given to someone else | Greyed/desaturated, "Given Away" label | No |
| `missing` | Fish cannot be found (presumed escaped or hidden) | Greyed/desaturated, "Missing" label | No |

### How Status Affects Dashboard

- **Active fish count:** Only `alive` status counts.
- **Total collection count:** All statuses count.
- **Unique species count:** Count distinct `species_id` across all statuses.
- **Longest kept fish:** Alive fish: `start_date` → today. Others: `start_date` → `death_date` or `end_date`.
- **Care reminders:** Only generated/shown for `alive` fish.
- **Compatibility checks:** Only run against `alive` fish.

### How Dead/Inactive Fish Display

In Collection FlatList, the `FishCard` component checks `fish.status !== 'alive'` and applies:
- `opacity: 0.5` on the card container
- Desaturated image via `grayscale` CSS filter (or `tintColor` on RN image)
- Status label prominently shown: "Deceased · Kept 5 months"
- **Do not remove these fish from the collection list.** They remain visible in history.

### Date Fields per Status

| Transition | Date Field Set |
|---|---|
| Fish added (any status) | `start_date` (required) |
| Status changed to `dead` | `death_date` (ask user or default to today) |
| Status changed to `sold` | `end_date` (optional, default today) |
| Status changed to `given_away` | `end_date` (optional) |
| Status changed to `missing` | `end_date` (optional) |

### Duration Calculation

```typescript
function calculateDuration(fish: UserFish): string {
  const endDate = fish.status === 'alive'
    ? new Date()
    : fish.death_date
      ? new Date(fish.death_date)
      : fish.end_date
        ? new Date(fish.end_date)
        : new Date(fish.updated_at);
  
  const start = new Date(fish.start_date);
  const days = Math.floor((endDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.floor(days / 30)} months`;
  return `${(days / 365).toFixed(1)} years`;
}
```

### Editing Status

Status edit from Fish Detail:
1. User taps status badge or edit button.
2. Modal/picker shows status options.
3. On selecting `dead`: date picker appears, defaults to today.
4. On selecting `sold`, `given_away`, `missing`: optional end date picker.
5. UPDATE `user_fish` with new status + date.
6. UI refreshes (card greys out if inactive).

### Filtering Status in Collection

Filter chips:
- "All" — no status filter
- "Alive" — `status = 'alive'`
- "Inactive" — `status IN ('dead', 'sold', 'given_away', 'missing')`

---

## 11. Care Reminder Design

### Reminder System Architecture

Reminders are stored as persistent records in the `reminders` table (except photo update reminders, which are computed dynamically based on `fish_photos.captured_at`).

### Stored Reminders (in `reminders` table)

| Type | Default Frequency | next_due_at Logic | Scope |
|---|---|---|---|
| `feeding` | Daily | `last_completed_at + 1 day` | Global (not per-fish) |
| `health_check` | Weekly | `last_completed_at + 7 days` | Global or per-fish |
| `water_change` | Optional | Manual | Global |
| `custom` | Manual | Manual | Per-fish or global |

### Computed Reminders (NOT stored — generated at query time)

| Type | Logic | Display |
|---|---|---|
| `photo_update` | Find all alive fish where most recent photo `captured_at < now() - 30 days` | "Update photo for [fish name]" |

**Query to generate photo update reminders:**
```sql
SELECT uf.id, uf.name, fp.captured_at
FROM user_fish uf
LEFT JOIN fish_photos fp ON fp.fish_id = uf.id AND fp.is_current = true
WHERE uf.owner_id = 'local-user'
  AND uf.status = 'alive'
  AND (fp.captured_at IS NULL OR fp.captured_at < now() - interval '30 days');
```

### next_due_at Logic

When a reminder is marked done:
```typescript
function calculateNextDue(reminder: Reminder): Date {
  const now = new Date();
  switch (reminder.frequency) {
    case 'daily':        return addDays(now, 1);
    case 'weekly':       return addDays(now, 7);
    case 'every_30_days': return addDays(now, 30);
    default:             return addDays(now, 1);
  }
}
```

After marking done:
- `UPDATE reminders SET last_completed_at = now(), next_due_at = calculateNextDue(reminder)`

### Dashboard Display

The dashboard shows:
1. Overdue stored reminders: `next_due_at <= now() AND is_active = true`
2. Due today: `next_due_at <= end_of_today() AND is_active = true`
3. Computed photo update reminders (fish not photographed in 30+ days)

Display limit: show at most 3-5 reminders on dashboard. Remaining accessible from dedicated reminders section.

### Mark as Done

- Tap "Mark Done" on reminder card.
- Call `completeReminder(reminderId)` service function.
- Updates `last_completed_at` and `next_due_at`.
- Reminder disappears from "due today" section, reappears after frequency passes.

### Dismiss

- For computed photo reminders: dismiss means skip this cycle. Store a dismissed timestamp locally or in a small table (optional for MVP).
- For stored reminders: `UPDATE reminders SET is_active = false` to soft-delete.

### Species-Specific Reminder Text

Only show species-specific feeding text if:
- `user_fish.species_id IS NOT NULL`
- `fish_species.verification_status IN ('verified', 'partially_verified')`
- `fish_species.feeding_notes IS NOT NULL`

Otherwise show generic: "Feed your fish today."

### Push Notifications (Future)

The reminder data model supports push notifications. When Expo Notifications is added:
- Schedule notifications using `next_due_at` from `reminders` table.
- On `completeReminder()`, cancel the scheduled notification and create a new one for the next due date.

---

## 12. Compatibility Warning Design

### Algorithm Overview

When adding a new fish with species `S_new`, run pairwise compatibility against each active fish `F_existing` (where `status = 'alive'`). Get the worst-case level across all pairs as the overall result.

### Pseudocode

```
function checkCompatibility(newSpecies: FishSpecies, existingActiveFish: UserFish[]): CompatibilityResult {
  
  if existingActiveFish is empty:
    return { level: 'safe', reasons: [], note: 'No active fish to compare against.' }
  
  if newSpecies is null (unknown species):
    return { level: 'caution', reasons: ['Cannot check compatibility for unknown species.'] }
  
  overall = 'safe'
  reasons = []
  pairResults = []
  
  for each existingFish in existingActiveFish:
    existingSpecies = existingFish.species
    
    if existingSpecies is null:
      pairResults.push({ level: 'caution', reason: `${existingFish.name} species unknown — cannot verify compatibility.` })
      continue
    
    pairLevel = evaluatePair(newSpecies, existingSpecies)
    pairResults.push({ fish: existingFish.name, ...pairLevel })
  
  // Check for explicit compatibility_rules override (highest priority)
  explicitRule = findExplicitRule(newSpecies.id, allExistingSpeciesIds)
  if explicitRule exists:
    if explicitRule.level > pairLevel:
      override pairLevel with explicitRule
  
  // Aggregate: worst case wins
  overall = worst(pairResults.map(r => r.level))
  
  return { level: overall, pairResults, reasons }
}

function evaluatePair(a: FishSpecies, b: FishSpecies): PairResult {
  reasons = []
  level = 'safe'  // start optimistic, escalate
  
  // DANGER conditions
  if a.water_type !== b.water_type and both are not null:
    level = 'danger'
    reasons.push(`Water type mismatch: ${a.water_type} vs ${b.water_type}`)
  
  if noTemperatureOverlap(a, b) and both ranges non-null:
    level = 'danger'
    reasons.push(`No temperature range overlap: ${a.temp_min}–${a.temp_max}°C vs ${b.temp_min}–${b.temp_max}°C`)
  
  if noPHOverlap(a, b) and both ranges non-null:
    level = 'danger'
    reasons.push(`No pH range overlap`)
  
  if aggressivePredatorVsSmallPeaceful(a, b):
    level = 'danger'
    reasons.push(`Size/temperament mismatch: predator risk`)
  
  // CAUTION conditions (only if not already DANGER)
  if level != 'danger':
    if partialTemperatureOverlap(a, b):
      level = 'caution'
      reasons.push(`Limited temperature overlap`)
    
    if partialPHOverlap(a, b):
      level = 'caution'
      reasons.push(`Limited pH range overlap`)
    
    if semiAggressiveWithPeaceful(a, b):
      level = 'caution'
      reasons.push(`Semi-aggressive species with peaceful fish — monitor carefully`)
    
    if knownFinNipper(a) or knownFinNipper(b):
      level = 'caution'
      reasons.push(`Known fin-nipping risk`)
    
    if largeSizeGapNotPredatory(a, b):
      level = 'caution'
      reasons.push(`Large size difference — may cause stress`)
    
    if schoolingFishAlone(a) or schoolingFishAlone(b):
      level = 'caution'
      reasons.push(`Schooling fish — consider adding more of same species`)
  
  // DATA QUALITY check
  if hasIncompleteData(a) or hasIncompleteData(b):
    if level == 'safe':
      level = 'caution'
      reasons.push(`Species data incomplete — result may not be fully accurate`)
  
  return { level, reasons }
}

function hasIncompleteData(s: FishSpecies): boolean {
  return s.water_type == null or s.temperature_min_c == null or 
         s.ph_min == null or s.temperament == 'unknown' or
         s.verification_status in ['draft', 'needs_review']
}
```

### Range Overlap Functions

```typescript
function rangesOverlap(min1: number, max1: number, min2: number, max2: number): boolean {
  return min1 <= max2 && min2 <= max1;
}

function partialOverlap(min1, max1, min2, max2): boolean {
  // overlaps but not fully contained
  return rangesOverlap(min1, max1, min2, max2) && 
         !(min1 >= min2 && max1 <= max2) && 
         !(min2 >= min1 && max2 <= max1);
}
```

### Predatory/Size Logic

```typescript
function aggressivePredatorVsSmallPeaceful(a: FishSpecies, b: FishSpecies): boolean {
  const PREDATORY_TEMPERAMENT = ['aggressive'];
  const SMALL_MAX_CM = 5;
  
  const aIsPredator = PREDATORY_TEMPERAMENT.includes(a.temperament) && 
                       (a.adult_size_max_cm ?? 0) > (b.adult_size_max_cm ?? 999);
  const bIsSmallPeaceful = b.temperament === 'peaceful' && 
                            (b.adult_size_max_cm ?? 999) < SMALL_MAX_CM;
  
  return (aIsPredator && bIsSmallPeaceful) || 
         (PREDATORY_TEMPERAMENT.includes(b.temperament) && 
          (b.adult_size_max_cm ?? 0) > (a.adult_size_max_cm ?? 999) && 
          a.temperament === 'peaceful' && (a.adult_size_max_cm ?? 999) < SMALL_MAX_CM);
}
```

### Explicit Rule Lookup

Before returning the result, check `compatibility_rules` for a direct override:

```typescript
async function findExplicitRule(speciesAId: string, speciesBIds: string[]) {
  // Query compatibility_rules where (species_a_id, species_b_id) match any pair
  // Remember: pairs are stored in sorted UUID order (smaller UUID first)
}
```

If an explicit rule with `verification_status = 'verified'` exists, it overrides the inferred result.

### Example Results

| Scenario | Result |
|---|---|
| Freshwater tetra + marine clownfish | Danger — water type mismatch |
| Oscar + small neon tetra | Danger — predator size/temperament |
| Angelfish + Tiger Barb (known fin nipper) | Caution — fin-nipping risk |
| Two peaceful community fish, overlapping water params, verified data | Safe |
| New fish with verified data + existing fish with unknown species | Caution — unknown species cannot be verified |
| Both species draft/needs_review | Caution — data incomplete |

### Important Rules for Implementation

1. Never output `safe` when any critical field is null on either species.
2. Never output `safe` when `verification_status = 'draft'` or `'needs_review'`.
3. The UI must show reasons — not just a badge.
4. The user can always proceed despite any warning. The app warns, it does not block.

---

## 13. Research-Backed Species Library Design

### Why Species Data Cannot Be AI-Generated Without Verification

AI language models can plausibly generate fish facts but frequently:
- Hallucinate pH values (e.g., Oscar at pH 6.5–8.0 instead of 6.0–8.0)
- Confuse species (similar common names with different scientific names)
- Cite non-existent sources
- Blend two species' characteristics

Any error in compatibility-critical data (temperature, pH, water type, predatory behavior) will cause the app to give wrong compatibility advice, potentially resulting in real fish deaths. AI-generated data must be treated as `draft`, never `verified`.

### Verification Status Workflow

| Status | Meaning | When Used |
|---|---|---|
| `verified` | Key fields confirmed by ≥1 reputable source | After manual review against FishBase or Seriously Fish |
| `partially_verified` | Some fields sourced, others not yet reviewed | Data partially filled from reliable source |
| `draft` | Data not yet reviewed — do not use for compatibility | AI-generated drafts, incomplete imports |
| `needs_review` | Previously verified but flagged for re-check | Source changed, conflict detected, or data looks wrong |

### Confidence Level

Applies at species level (or optionally per-field):
- `high` — Multiple reputable sources agree
- `medium` — One reputable source
- `low` — Secondary source or older data
- `unknown` — No source

### Recommended Species Data Workflow

```
Step 1: Build Species List
  Select 100-200 common aquarium species for MVP
  Prioritize species hobbyists commonly keep:
    - Betta, Guppy, Neon Tetra, Cardinal Tetra, Platy, Swordtail
    - Angelfish, Discus, Oscar, Jack Dempsey
    - Goldfish, Koi
    - Pleco (common, bristlenose), Corydoras
    - Rasbora, Danio, Barbs (tiger, cherry, rosy)
    - Gourami (pearl, honey, three spot, dwarf)
    - Cichlids (African: Malawi, Tanganyika; South American: apistogramma)
    - Loach (clown, kuhli, yoyo)
    - Killifish, Rainbow Fish
    - Marine: Clownfish, Blue Tang, Damsel
    - Brackish: Figure 8 Puffer, Archer Fish

Step 2: Research Each Species
  Primary sources:
    - FishBase (fishbase.org): scientific name, max size, temperature, pH, diet, ecology
    - Seriously Fish (seriouslyfish.com): aquarium care, temperament, tank parameters
  Secondary sources:
    - Fishkeeping World, LiveAquaria, AquariumCoop (for care confirmation)
  Do NOT use:
    - Random forum threads as primary source
    - AI-generated fact sheets without citation

Step 3: Fill Structured Fields
  For each species, fill the fish_species table fields
  Leave NULL if data is not available from reliable sources
  Do not interpolate or estimate

Step 4: Add Source References
  For each species, INSERT into fish_species_sources:
    - source_name: "FishBase"
    - source_url: specific FishBase page URL
    - source_type: "scientific_database"
    - fields_supported: ["scientific_name", "adult_size_max_cm", "temperature_min_c", ...]
    - retrieved_at: date of data retrieval

Step 5: Set Verification Status
  If all minimum verified fields are present and sourced: verification_status = 'verified'
  If some fields are missing or only one source: 'partially_verified'
  If drafted from AI or incomplete: 'draft'

Step 6: Import into Supabase
  Use SQL migration files or Supabase dashboard import
  Check for duplicate scientific names before insert

Step 7: Review and Update
  As more species are added and sources improve, run periodic reviews
  Update verification_status and confidence_level as data improves
```

### Minimum Fields for `verified` Status

A species cannot be marked `verified` unless it has sourced values for:
- common_name
- scientific_name
- water_type
- adult_size_max_cm
- temperature_min_c + temperature_max_c
- ph_min + ph_max
- diet
- temperament
- care_level
- care_notes
- At least one entry in fish_species_sources with a reputable source_type

### Handling Missing Data

- Unknown fields: store as `NULL`
- Display in UI: "Data not available" (not empty space)
- For compatibility: treat null critical fields as "incomplete" → result Caution (never Safe)

### Handling Conflicting Sources

If FishBase says temperature 22-28°C and another source says 20-30°C:
- Use conservative range (wider where applicable or narrower for care safety)
- Store a note in `fish_species_sources` explaining the conflict
- Set `confidence_level = 'medium'`
- Optional: add a `care_notes` line mentioning the variation

### Long-Term Scaling (100 → 1000+ Species)

- The database schema already supports 1000+ species.
- New species can be imported via SQL migrations or a future Next.js admin panel.
- The Expo app queries database-side — adding more species does not bloat the app bundle.
- Pagination and FlatList ensure the UI handles any number of species efficiently.
- Species images in Supabase Storage load on demand, not upfront.

### Copyright and Image Safety

- Check license before using any species image.
- CC BY, CC BY-SA, CC0, and Public Domain licenses are acceptable.
- Store attribution: `image_license`, `image_source_url`, and attribution text in `care_notes` or a separate field.
- If no safe image exists: use a generic fish silhouette placeholder.
- Wikimedia Commons and iNaturalist (CC-licensed photos) are good starting sources.

---

## 14. Library Performance Plan

### Core Principle: Database Does the Work

Never fetch 1000 species into the app. All filtering, searching, and sorting happens in the Supabase query before results arrive at the device.

### Pagination Strategy

```typescript
const PAGE_SIZE = 25;

async function getSpeciesList({
  search,
  categoryId,
  waterType,
  careLevel,
  temperament,
  page = 0
}: SpeciesListParams) {
  let query = supabase
    .from('fish_species')
    .select('id, common_name, scientific_name, thumbnail_url, care_level, water_type, temperament, verification_status', { count: 'exact' })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    .order('common_name', { ascending: true });
  
  if (search) {
    query = query.ilike('common_name', `%${search}%`);
    // OR: use full-text search: .textSearch('common_name', search, { type: 'websearch' })
  }
  if (categoryId) query = query.eq('category_id', categoryId);
  if (waterType)  query = query.eq('water_type', waterType);
  if (careLevel)  query = query.eq('care_level', careLevel);
  if (temperament) query = query.eq('temperament', temperament);
  
  return query;
}
```

### FlatList with Infinite Scroll

```typescript
// In LibraryScreen component:
const [page, setPage] = useState(0);
const [species, setSpecies] = useState<FishSpecies[]>([]);
const [hasMore, setHasMore] = useState(true);
const [loading, setLoading] = useState(false);

const loadMore = async () => {
  if (loading || !hasMore) return;
  setLoading(true);
  const { data, count } = await getSpeciesList({ ...filters, page });
  setSpecies(prev => [...prev, ...(data ?? [])]);
  setPage(p => p + 1);
  setHasMore((page + 1) * PAGE_SIZE < (count ?? 0));
  setLoading(false);
};

<FlatList
  data={species}
  keyExtractor={item => item.id}
  renderItem={({ item }) => <SpeciesCard species={item} />}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  ListFooterComponent={loading ? <ActivityIndicator /> : null}
/>
```

### Search Debounce

```typescript
// Custom hook for debounced search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// In LibraryScreen:
const [searchText, setSearchText] = useState('');
const debouncedSearch = useDebounce(searchText, 400);

useEffect(() => {
  setPage(0);
  setSpecies([]);
  loadMore();
}, [debouncedSearch, filters]);
```

### Thumbnails in List, Full Image in Detail

- `SpeciesCard` component renders `thumbnail_url` (400px) — small file, fast scroll.
- `SpeciesDetailScreen` renders `image_url` (1200px) — loads only when user navigates.
- Thumbnails stored in Supabase Storage under species-images bucket.

### Index Summary (from Migration 008)

```sql
-- Full-text search
CREATE INDEX idx_species_common_name_fts 
  ON fish_species USING gin(to_tsvector('english', common_name));
CREATE INDEX idx_species_scientific_name_btree 
  ON fish_species(scientific_name);

-- Filter indexes
CREATE INDEX idx_species_category ON fish_species(category_id);
CREATE INDEX idx_species_water_type ON fish_species(water_type);
CREATE INDEX idx_species_care_level ON fish_species(care_level);
CREATE INDEX idx_species_temperament ON fish_species(temperament);
CREATE INDEX idx_species_verification ON fish_species(verification_status);

-- Combined for common query pattern
CREATE INDEX idx_species_filter_combo 
  ON fish_species(water_type, care_level, temperament);
```

---

## 15. Data Flow Diagrams

### 1. App Launch to Dashboard

```
App opens
  → No splash/login screen
  → Expo Router loads (tabs) layout
  → Dashboard tab is default
  → useEffect: getDashboardSummary(OWNER_ID)
      → parallel Supabase queries:
          - user_fish count (status=alive)
          - user_fish count (all)
          - distinct species_id count
          - user_fish ORDER BY created_at DESC LIMIT 3
          - user_fish with longest duration (computed client-side or SQL)
          - reminders WHERE next_due_at <= now() AND is_active = true
          - fish_photos join to find stale photos (>30 days)
  → Data returned → setState
  → Dashboard renders with real data
```

### 2. Collection Loading

```
User taps Collection tab
  → CollectionScreen mounts
  → useEffect: getUserFish({ owner_id, page: 0 })
      → Supabase query:
          user_fish
          JOIN fish_species (for common_name)
          JOIN fish_photos (for thumbnail, is_current=true)
          WHERE owner_id = OWNER_ID
          ORDER BY created_at DESC
          LIMIT 20
  → FlatList renders FishCard components
  → Inactive fish: opacity 0.5, greyscale image
  → User types in search → debounced → re-query with ilike filter
  → User taps filter chip → re-query with status filter
  → User scrolls to bottom → loadMore() → page += 1 → append results
```

### 3. Scan to Save Fish

```
User taps Scan tab
  → Camera permission requested
  → Camera viewfinder shown
  → User captures photo
  → Preview screen shown
  → User taps "Use This Photo"
  → Add Fish form shown
  → User enters name, selects species, sets date
  → "Check Compatibility" tapped
      → getActiveFishForCompatibility(OWNER_ID) → Supabase
      → getSpeciesById(speciesId) for each active fish → Supabase
      → checkCompatibility(newSpecies, existingFishWithSpecies) → local logic
      → result shown inline (Safe/Caution/Danger + reasons)
  → User taps "Save Fish"
      → compress image (expo-image-manipulator)
      → generate thumbnail
      → uploadPhoto(original) → Supabase Storage → storage_path, photo_url
      → uploadPhoto(thumbnail) → Supabase Storage → thumb_url
      → createUserFish({ name, species_id, status:'alive', start_date, ... }) → Supabase INSERT
      → createFishPhotoEntry({ fish_id, storage_path, photo_url, is_current:true }) → Supabase INSERT
      → setCurrentPhoto(fish_id, photo_id) → UPDATE user_fish.current_photo_id
      → createDefaultReminders(fish_id, owner_id) → INSERT feeding + health_check reminders
  → Navigate to collection/[newFishId]
  → Collection re-fetches → new fish card appears
```

### 4. Update Photo Timeline

```
User opens Fish Detail
  → Taps "Update Photo"
  → Update Photo screen opens
  → User takes/picks new photo
  → Enters optional note
  → Taps Save
      → compress image + generate thumbnail
      → uploadPhoto() → Supabase Storage (new path with new timestamp)
      → UPDATE fish_photos SET is_current=false WHERE fish_id = fishId
      → INSERT fish_photos (is_current=true, note, captured_at=now())
      → UPDATE user_fish SET current_photo_id = newPhotoId
  → Navigate back to Fish Detail
  → Fish Detail re-fetches photos → timeline shows new entry at bottom
  → Current photo updates to new image
  → Old photo still visible in timeline (NOT deleted)
```

### 5. Species Library Search and Filter

```
User opens Library tab
  → LibraryScreen mounts
  → Initial load: getSpeciesList({ page: 0 })
      → SELECT ... FROM fish_species ORDER BY common_name LIMIT 25
  → FlatList renders 25 species cards with thumbnails
  → User types "oscar" in search
      → 400ms debounce
      → setPage(0), setSpecies([]) (reset)
      → getSpeciesList({ search: "oscar", page: 0 })
      → SELECT ... FROM fish_species WHERE common_name ILIKE '%oscar%' LIMIT 25
  → User taps "Cichlid" filter chip
      → getSpeciesList({ search: "oscar", categoryId: cichlid_uuid, page: 0 })
      → narrower query
  → User scrolls to bottom
      → loadMore() → page: 1 → append results
  → User taps a species card
      → Navigate to library/[speciesId]
      → getSpeciesById(id) + getSpeciesSources(id) → Supabase
      → Full species detail renders
```

### 6. Compatibility Warning

```
User adding new fish (scan or manual)
  → Selects species
  → Taps "Check Compatibility" (or auto-triggers on species select)
      → getActiveFishForCompatibility(OWNER_ID)
          → SELECT user_fish.*, fish_species.* 
            FROM user_fish 
            JOIN fish_species ON user_fish.species_id = fish_species.id
            WHERE user_fish.owner_id = OWNER_ID AND user_fish.status = 'alive'
            AND user_fish.species_id IS NOT NULL
      → checkCompatibility(newSpecies, activeFish) runs locally
          → for each existingFish, evaluatePair(newSpecies, existingSpecies)
          → findExplicitRule(newSpecies.id, existingSpeciesIds) → Supabase query
          → aggregate worst-case result
      → CompatibilityResult displayed:
          SAFE (green) / CAUTION (amber) / DANGER (red)
          + reason list per pair
```

### 7. Reminder Calculation

```
Dashboard loads
  → getDashboardReminders(OWNER_ID) runs:
  
  [Stored reminders query]
    SELECT * FROM reminders
    WHERE owner_id = OWNER_ID
      AND is_active = true
      AND next_due_at <= NOW() + INTERVAL '1 day'
    ORDER BY next_due_at ASC
    LIMIT 10
  
  [Photo update reminders query]
    SELECT uf.id, uf.name, fp.captured_at
    FROM user_fish uf
    LEFT JOIN fish_photos fp ON fp.fish_id = uf.id AND fp.is_current = true
    WHERE uf.owner_id = OWNER_ID
      AND uf.status = 'alive'
      AND (fp.captured_at IS NULL OR fp.captured_at < NOW() - INTERVAL '30 days')
  
  → Combine results: stored reminders + computed photo reminders
  → Render reminder cards on Dashboard
  → User taps "Mark Done" on feeding reminder
      → completeReminder(reminderId)
          → UPDATE reminders SET last_completed_at = now(), next_due_at = now() + interval '1 day'
      → Dashboard re-fetches → reminder disappears from today's view
```

---

## 16. TypeScript Types

```typescript
// src/types/index.ts

// ============================================================
// ENUMS
// ============================================================

export type FishStatus = 'alive' | 'dead' | 'sold' | 'given_away' | 'missing';

export type WaterType = 'freshwater' | 'brackish' | 'marine' | 'unknown';

export type Temperament = 'peaceful' | 'semi_aggressive' | 'aggressive' | 'unknown';

export type DietType = 'carnivore' | 'herbivore' | 'omnivore' | 'unknown';

export type CareLevel = 'beginner' | 'intermediate' | 'advanced' | 'unknown';

export type VerificationStatus = 'verified' | 'partially_verified' | 'draft' | 'needs_review';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

export type CompatibilityLevel = 'safe' | 'caution' | 'danger' | 'unknown';

export type ReminderType = 'feeding' | 'photo_update' | 'health_check' | 'water_change' | 'custom';

export type SourceType = 'scientific_database' | 'care_guide' | 'organization' | 'breeder' | 'forum_secondary' | 'other';

// ============================================================
// DATABASE ENTITIES
// ============================================================

export interface FishCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface FishSpecies {
  id: string;
  common_name: string;
  scientific_name: string;
  category_id: string | null;
  family: string | null;
  water_type: WaterType;
  origin: string | null;
  adult_size_min_cm: number | null;
  adult_size_max_cm: number | null;
  lifespan_min_years: number | null;
  lifespan_max_years: number | null;
  temperament: Temperament;
  diet: DietType;
  care_level: CareLevel;
  temperature_min_c: number | null;
  temperature_max_c: number | null;
  ph_min: number | null;
  ph_max: number | null;
  hardness_min_dgh: number | null;
  hardness_max_dgh: number | null;
  minimum_tank_size_liters: number | null;
  tank_level: string | null;
  schooling_behavior: boolean | null;
  description: string | null;
  care_notes: string | null;
  feeding_notes: string | null;
  compatibility_notes: string | null;
  avoid_with_notes: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  image_license: string | null;
  image_source_url: string | null;
  verification_status: VerificationStatus;
  confidence_level: ConfidenceLevel;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Optional join
  category?: FishCategory;
}

export interface FishSpeciesSource {
  id: string;
  species_id: string;
  source_name: string;
  source_url: string | null;
  source_type: SourceType;
  fields_supported: string[] | null;
  notes: string | null;
  retrieved_at: string | null;
  created_at: string;
}

export interface UserFish {
  id: string;
  owner_id: string;
  species_id: string | null;
  name: string;
  status: FishStatus;
  start_date: string;       // ISO date string "2026-05-01"
  death_date: string | null;
  end_date: string | null;
  current_photo_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Optional joins
  species?: FishSpecies;
  current_photo?: FishPhoto;
}

export interface FishPhoto {
  id: string;
  fish_id: string;
  storage_path: string;
  photo_url: string;
  thumbnail_url: string | null;
  captured_at: string;
  note: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  owner_id: string;
  fish_id: string | null;
  species_id: string | null;
  type: ReminderType;
  title: string;
  description: string | null;
  frequency: string;
  next_due_at: string;
  last_completed_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Optional join
  fish?: UserFish;
}

export interface CompatibilityRule {
  id: string;
  species_a_id: string;
  species_b_id: string;
  level: CompatibilityLevel;
  reason: string;
  source_id: string | null;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

// ============================================================
// APPLICATION / COMPUTED TYPES
// ============================================================

export interface PairCompatibilityResult {
  existingFishName: string;
  existingSpeciesName: string;
  level: CompatibilityLevel;
  reasons: string[];
}

export interface CompatibilityResult {
  level: CompatibilityLevel;
  pairResults: PairCompatibilityResult[];
  reasons: string[];
  hasIncompleteData: boolean;
  note?: string;
}

export interface DashboardSummary {
  activeFishCount: number;
  totalFishCount: number;
  uniqueSpeciesCount: number;
  recentlyAddedFish: UserFish[];
  longestKeptFish: UserFish | null;
  dueReminders: Reminder[];
  stalePhotoFish: PhotoUpdateReminder[];
}

export interface PhotoUpdateReminder {
  fishId: string;
  fishName: string;
  lastPhotoAt: string | null;
  daysSinceLastPhoto: number;
}

export interface SpeciesListParams {
  search?: string;
  categoryId?: string;
  waterType?: WaterType;
  careLevel?: CareLevel;
  temperament?: Temperament;
  page?: number;
  pageSize?: number;
}

export interface CollectionParams {
  search?: string;
  status?: FishStatus | 'inactive';
  sortBy?: 'recent' | 'oldest' | 'name_asc' | 'name_desc' | 'longest_kept' | 'status';
  page?: number;
}
```

---

## 17. Service / Query Layer Plan

All Supabase interactions are centralized in `src/services/`. UI components import from services, never directly from the Supabase client. This keeps the query logic reusable and testable.

### fishService.ts — Personal Collection

```typescript
getDashboardSummary(ownerId: string): Promise<DashboardSummary>
  // Parallel queries: counts, recent, longest kept, due reminders, stale photos

getUserFish(params: CollectionParams): Promise<{ data: UserFish[], count: number }>
  // Paginated, filtered, sorted list. Joins species + current_photo.

getUserFishById(id: string): Promise<UserFish | null>
  // Single fish with full joins: species, current_photo, category.

createUserFish(input: CreateFishInput): Promise<UserFish>
  // Insert new fish record. Returns created row.

updateUserFish(id: string, input: Partial<UpdateFishInput>): Promise<UserFish>
  // Update name, notes, species_id.

updateFishStatus(id: string, status: FishStatus, dateInput?: StatusDateInput): Promise<UserFish>
  // Update status + death_date or end_date as appropriate.

getActiveFishForCompatibility(ownerId: string): Promise<UserFish[]>
  // All alive fish with species data joined. Used in compatibility check.
```

### photoService.ts — Photo Timeline

```typescript
getFishPhotos(fishId: string): Promise<FishPhoto[]>
  // All photos for a fish, ordered by captured_at ASC.

uploadFishPhoto(localUri: string, ownerId: string, fishId: string): Promise<{ storagePath: string, photoUrl: string }>
  // Compress → upload to Supabase Storage → return path + URL.

uploadFishPhotoThumbnail(localUri: string, ownerId: string, fishId: string): Promise<string>
  // Compress to thumbnail → upload → return URL.

createFishPhotoEntry(input: CreatePhotoInput): Promise<FishPhoto>
  // Insert fish_photos record.

setCurrentFishPhoto(fishId: string, photoId: string): Promise<void>
  // UPDATE fish_photos SET is_current=false WHERE fish_id=X
  // UPDATE fish_photos SET is_current=true WHERE id=photoId
  // UPDATE user_fish SET current_photo_id=photoId WHERE id=fishId
  // All in sequence (ideally wrapped in a Supabase RPC or sequential awaits).
```

### speciesService.ts — Species Library

```typescript
getSpeciesList(params: SpeciesListParams): Promise<{ data: FishSpecies[], count: number }>
  // Paginated, filtered, database-side search.

getSpeciesById(id: string): Promise<FishSpecies | null>
  // Full species profile.

searchSpecies(query: string, limit?: number): Promise<FishSpecies[]>
  // Quick search for species picker in Add Fish form. Returns id + common_name only.

getSpeciesSources(speciesId: string): Promise<FishSpeciesSource[]>
  // Source citations for a species detail page.

getCategories(): Promise<FishCategory[]>
  // All categories for filter UI. Cached locally.
```

### reminderService.ts — Care Reminders

```typescript
getActiveReminders(ownerId: string): Promise<Reminder[]>
  // All active reminders with next_due_at within next 24 hours.

getAllReminders(ownerId: string): Promise<Reminder[]>
  // All active reminders (for reminders screen).

createDefaultReminders(fishId: string, ownerId: string): Promise<void>
  // Creates feeding + health_check reminders for a new fish.

completeReminder(reminderId: string): Promise<Reminder>
  // Updates last_completed_at + next_due_at.

dismissReminder(reminderId: string): Promise<void>
  // Sets is_active = false.

generatePhotoUpdateReminders(ownerId: string): Promise<PhotoUpdateReminder[]>
  // Computed query (not stored): find alive fish with stale photos.
```

### compatibilityService.ts — Compatibility Logic

```typescript
checkCompatibility(
  newSpecies: FishSpecies,
  activeFish: UserFish[]
): CompatibilityResult
  // Pure function — runs locally with already-fetched data.
  // No direct Supabase calls here.

getExplicitCompatibilityRules(
  speciesAId: string,
  speciesBIds: string[]
): Promise<CompatibilityRule[]>
  // Fetch explicit pair overrides from compatibility_rules table.

checkCompatibilityFull(
  newSpecies: FishSpecies,
  ownerId: string
): Promise<CompatibilityResult>
  // Convenience function: fetches active fish + explicit rules, then runs checkCompatibility().
```

---

## 18. Error, Loading, and Empty States

### Rule: Every Async Screen Must Handle 4 States

`loading` → `success` → `empty` → `error`

This is enforced by a shared pattern:

```typescript
type AsyncState<T> = 
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'empty' }
  | { status: 'error'; message: string };
```

### State Definitions per Feature

| Feature | Loading | Empty | Error |
|---|---|---|---|
| Dashboard | Skeleton cards for each section | "Welcome to Fishy. Add your first fish." + CTA buttons | "Could not load dashboard. Tap to retry." |
| Collection | Skeleton fish cards | "No fish yet. Add your first fish or scan one." | "Could not load collection. Tap to retry." |
| Library | Skeleton species cards | "No species found. Try a different search or filter." | "Could not load species. Check connection." |
| Fish Detail | Full-screen spinner | N/A — always has data | "Could not load fish. Tap to retry." |
| Species Detail | Full-screen spinner | N/A | "Could not load species. Tap to retry." |
| Photo Timeline | Spinner | "No photos yet." (shouldn't occur — first photo added on creation) | "Could not load photos." |
| Reminders | Small spinner | "No reminders due. Your fish are well cared for." | "Could not load reminders." |

### Camera and Scan-Specific States

| Situation | UI Response |
|---|---|
| Camera permission denied | Full-screen message: "Camera access required to scan fish. Open Settings to enable." + "Open Settings" button using `Linking.openSettings()` |
| Camera hardware error | "Camera unavailable. Try uploading a photo from gallery instead." |
| Upload in progress | Loading indicator + disabled Save button + "Uploading photo..." label |
| Upload failed (network) | Toast: "Upload failed. Check your connection and try again." + Retry button (re-attempts upload without re-capturing) |
| Upload failed (storage error) | Toast: "Photo could not be saved. Please try again." |
| DB save failed after upload | Toast: "Fish record could not be saved. Uploaded photo will be retained." + Retry button. Log orphan path for cleanup. |
| Species not selected | Inline validation: "Please select a species or choose 'Unknown species' before saving." |
| Compatibility data incomplete | Inline warning: "Compatibility check may be incomplete — some species data is missing. Treat result as Caution." |

### Compatibility-Specific States

| Situation | UI Response |
|---|---|
| New species unknown | "Cannot check compatibility for unknown species. Treat as Caution." |
| No active fish in collection | "No active fish in your collection. No compatibility check needed." |
| All active fish have unknown species | "Cannot check compatibility — existing fish have no species linked." (Caution) |
| Explicit rule found | Show explicit rule result prominently with source |
| Incomplete species data | Downgrade to Caution, explain why |

### Reminder-Specific States

| Situation | UI Response |
|---|---|
| Mark done fails | Toast: "Could not update reminder. Try again." (optimistic UI reversal) |
| No reminders due | "No reminders due. Your fish are well cared for." (green checkmark icon) |

---

## 19. Implementation Roadmap

### Phase 0: Project Setup

**Goal:** Working Expo project connected to Supabase.

**Tasks:**
- `npx create-expo-app fishy --template default`
- Install dependencies: `@supabase/supabase-js`, `expo-router`, `expo-camera`, `expo-image-picker`, `expo-image-manipulator`
- Set up `.env.local` with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Create `src/lib/supabase/client.ts` — single Supabase client instance
- Create `src/constants/owner.ts` with `OWNER_ID = 'local-user'`
- Set up TypeScript strict mode in `tsconfig.json`
- Set up `src/types/index.ts` with all enums and interfaces
- Verify Supabase connection with a test query

**Output:** App boots, Supabase client connects, no errors.

**Acceptance Criteria:** `npx expo start` works. Supabase test query returns without error.

---

### Phase 1: Supabase Schema

**Goal:** Complete database schema deployed to Supabase.

**Tasks:**
- Write migration files 001–008 (see Section 6)
- Run migrations in Supabase SQL editor or via Supabase CLI
- Create `fish-photos` and `species-images` storage buckets
- Set bucket policies (fish-photos: private; species-images: public read)
- Seed `fish_categories` table (18 categories)
- Verify tables exist with correct columns
- Add placeholder "Unknown Species" entry in fish_species for the "Unknown" use case

**Output:** All tables, indexes, enums, and buckets created.

**Acceptance Criteria:** Can INSERT and SELECT from all tables. Can upload a test file to fish-photos bucket.

---

### Phase 2: Navigation + UI Foundation

**Goal:** App skeleton with all 5 tabs, color theme, and shared components.

**Tasks:**
- Set up Expo Router with `app/(tabs)/_layout.tsx` (5 tabs: Dashboard, Collection, Scan, Library, Settings)
- Create `src/constants/colors.ts` (blue/aqua/white theme)
- Create shared components: `EmptyState`, `LoadingSpinner`, `ErrorMessage`, `StatusBadge`
- Implement bottom tab bar with icons
- Each tab renders a simple screen with correct title

**Output:** App navigates between all 5 tabs. Clean UI foundations in place.

**Acceptance Criteria:** All tabs reachable. Colors match aquarium theme. No crashes.

---

### Phase 3: Collection and Manual Add Fish

**Goal:** Core collection experience with real database data.

**Tasks:**
- Implement `getUserFish()` service function
- Implement `CollectionScreen` with FlatList + skeleton loading
- Implement `FishCard` component (photo, name, species, status, duration)
- Implement `inactive` fish card styling (greyed out, desaturated)
- Implement `calculateDuration()` utility
- Implement Add Fish form screen (manual — no camera yet)
- Implement `createUserFish()` service function
- Implement collection search (debounced)
- Implement collection filters (status chips)
- Implement `Fish Detail` screen (basic — personal section only)
- Implement fish status edit (status picker + date picker for dead/end)

**Output:** User can add fish manually, view collection, see fish detail, change status. Cards grey out for inactive fish.

**Acceptance Criteria:** Reopening app shows fish. Status change persists. Dead fish remain in list, greyed.

**Risk Notes:** Circular FK between user_fish and fish_photos — handle by inserting with null current_photo_id first.

---

### Phase 4: Camera Scan + Photo Upload

**Goal:** Complete scan-to-save fish flow with real storage upload.

**Tasks:**
- Implement Camera screen (expo-camera or expo-image-picker)
- Implement camera permission request + denial state
- Implement photo preview screen with Retake/Use buttons
- Implement `uploadFishPhoto()` and `uploadFishPhotoThumbnail()` in photoService.ts
- Implement image compression with expo-image-manipulator
- Implement `createFishPhotoEntry()` service function
- Implement `setCurrentFishPhoto()` service function
- Connect Scan flow: camera → preview → add-fish form → save
- Verify photo appears in fish detail after save

**Output:** User can scan fish, photo uploads to Supabase Storage, fish created with timeline entry.

**Acceptance Criteria:** After save, photo visible in fish detail. Storage bucket contains file at correct path. Reopening app shows photo.

**Risk Notes:** Expo Camera API differences between iOS and Android. Test on both.

---

### Phase 5: Photo Timeline

**Goal:** Complete photo history timeline — append-only, visible in Fish Detail.

**Tasks:**
- Implement `getFishPhotos()` service function
- Implement `PhotoTimeline` component in Fish Detail (FlatList of timeline entries)
- Implement Update Photo flow (update-photo.tsx screen)
- Verify: updating photo adds new entry, old photo still visible, is_current updates correctly
- Implement full-screen photo viewer on timeline photo tap

**Output:** Fish detail shows full photo history. Updating photo never removes old entries.

**Acceptance Criteria:** After 3 photo updates, 3+ timeline entries exist in DB and UI. Original photo still in Storage and visible.

---

### Phase 6: Fish Detail and Status (Polish)

**Goal:** Complete Fish Detail screen including species info section.

**Tasks:**
- Add species info section to Fish Detail (reads from fish_species via species_id join)
- Implement species info display with null handling ("Data not available")
- Implement inline fish edit (name, notes, species, dates)
- Connect status change to date pickers
- Show source references in fish detail (from fish_species_sources)
- Verify keeping duration calculation for all status types

**Output:** Fish Detail shows both personal and species data. All fields editable. Sources visible.

**Acceptance Criteria:** Linked species data shows in fish detail. Null fields display gracefully. Status change with dates works.

---

### Phase 7: Species Library

**Goal:** Complete species library with search, filters, pagination, and species detail.

**Tasks:**
- Implement `getSpeciesList()` with pagination + server-side filters
- Implement `LibraryScreen` with FlatList, infinite scroll, debounced search
- Implement `SpeciesCard` component (thumbnail + name + care level)
- Implement 5 core filter chips: Search, Category, Water Type, Care Level, Temperament
- Implement `SpeciesDetailScreen` with all fields + sources + null handling
- Implement `getCategories()` for filter dropdown
- Seed 10-20 verified species as a test dataset (real species with real sources — NO fake data)
- Verify pagination: scroll to load more

**Output:** Library works with real paginated data. Filters narrow results. Species detail shows sourced data.

**Acceptance Criteria:** Scrolling library does not freeze. Search works. Filter chips work. Species detail shows verification status and sources.

**Risk Notes:** Do not seed fake species. If real species data is not ready, seed 5-10 very well-known species with real data (Betta splendens, Neon Tetra, Oscar, etc.) rather than 100 fabricated ones.

---

### Phase 8: Care Reminders

**Goal:** In-app reminders visible on dashboard and reminders screen.

**Tasks:**
- Implement `createDefaultReminders()` (called after save fish in Phase 4)
- Implement `getActiveReminders()` + `getAllReminders()`
- Implement `generatePhotoUpdateReminders()` (computed query)
- Implement reminder cards on Dashboard
- Implement `completeReminder()` and `dismissReminder()`
- Test: feeding reminder due daily, photo reminder triggers after 30 days

**Output:** Reminders appear on dashboard. Marking done updates next_due_at. Photo reminder computed from stale photos.

**Acceptance Criteria:** New fish generates feeding reminder. After marking done, reminder disappears from today. After 30 days without photo update, photo reminder appears.

---

### Phase 9: Compatibility Warning

**Goal:** Full compatibility check when adding a new fish.

**Tasks:**
- Implement `checkCompatibility()` pure function with full algorithm (Section 12)
- Implement `getActiveFishForCompatibility()`
- Implement `getExplicitCompatibilityRules()` Supabase query
- Integrate compatibility check into Add Fish (manual) and Scan flows
- Implement `CompatibilityWarning` screen/modal with Safe/Caution/Danger badge + reasons
- Test: freshwater + marine = Danger. Unknown species = Caution. No active fish = no check needed.

**Output:** Compatibility check runs before save. Result shows with reasons. User can proceed regardless.

**Acceptance Criteria:** Danger result with reason for water type mismatch. Caution for incomplete data. Safe result only when all key fields are verified and overlapping.

---

### Phase 10: UI Polish and Testing

**Goal:** Clean, complete MVP ready for testing.

**Tasks:**
- Audit all screens for correct empty/loading/error states
- Verify all buttons are connected to real logic (no fake UI)
- Ensure FlatList used everywhere (no ScrollView for large lists)
- Verify greyed out inactive fish cards
- Verify photo timeline has at minimum 1 entry per fish
- Verify compatibility reasons are human-readable
- Check for React hook rule violations
- Verify Supabase environment variables not hard-coded
- Basic accessibility labels on interactive elements
- App logo/icon added

**Output:** Complete, tested MVP application.

**Acceptance Criteria:** All manual test cases from Section 20 pass.

---

### Phase 11: EAS Build Preparation

**Goal:** App ready for TestFlight/App Store distribution.

**Tasks:**
- Set up `eas.json` with development + production profiles
- Add camera and photo library permission strings to `app.json`
- Add privacy policy URL to app.json
- Run `eas build --platform ios --profile development`
- Test on physical device via TestFlight
- Fix any device-specific issues

**Output:** EAS build generated. App installable on iOS device.

**Acceptance Criteria:** App installs and runs on physical iPhone without crashes.

---

## 20. Testing Plan

### Manual Test Cases — Core Features

| Test Case | Steps | Expected Result |
|---|---|---|
| Add fish manually | Open Collection → FAB → fill name, select species, set date → save | Fish appears in collection, photo optional |
| Scan fish | Tap Scan → camera opens → take photo → preview → confirm → fill form → save | Fish in collection with photo, timeline entry created |
| Retake photo | In scan preview → tap Retake | Camera reopens, previous photo discarded |
| Save fish | Complete add fish form → save | Fish persists after app restart |
| Upload photo | Save fish with photo | Photo visible in fish detail, storage path stored in DB |
| View collection | Open Collection tab | All fish shown, real data, no placeholder/mock data |
| Grey inactive fish | Change fish status to Dead | Fish card greyed/desaturated, "Deceased" label shown |
| Change status to Dead | Fish Detail → edit status → Dead → set date | Status updated, date stored, card greyed |
| Update photo timeline | Fish Detail → Update Photo → take photo → save | New timeline entry added, old photos still visible |
| Search collection | Type in collection search | Results filter by fish name or species name |
| Filter collection by Alive | Tap "Alive" filter | Only alive fish shown |
| Search library | Type species name in Library search | Matching species shown, debounced |
| Filter library by water type | Select Freshwater chip | Only freshwater species shown |
| View species detail | Tap species in Library | Full profile with sources and verification status shown |
| Show source references | View species detail | Source name and URL visible |
| Reminder appears | After adding fish | Feeding reminder visible on dashboard |
| Mark reminder done | Tap "Mark Done" on reminder | Reminder disappears from today, reappears tomorrow |
| Photo reminder triggers | Fish with photo older than 30 days | Photo update reminder appears on dashboard |
| Compatibility — Safe | Two compatible freshwater community fish | Safe badge with reasons |
| Compatibility — Caution | Semi-aggressive + peaceful, or incomplete data | Caution badge with specific reasons |
| Compatibility — Danger | Freshwater + marine species | Danger badge with water type mismatch reason |
| App reopen persistence | Add fish → close app → reopen | Fish still in collection, photo still visible |

### Edge Cases

| Scenario | Expected Behavior |
|---|---|
| No internet when saving fish | Upload fails gracefully with retry option. Fish not partially saved. |
| Supabase error on collection load | Error state shown with retry. No crash. |
| Camera permission denied | Permission denied screen shown with "Open Settings" button. |
| Missing species data (null fields) | "Data not available" shown in species detail. Compatibility = Caution. |
| Failed image upload | Error toast. Fish record not created. Photo not orphaned without DB record. |
| Empty database (no species seeded) | Library shows empty state. Add fish species picker shows empty with message. |
| Fish with no species linked | Collection card shows fish name + "Unknown species". Compatibility = Caution. |
| Two fish of same species | Both show as separate cards. Compatible check treats each pair independently. |
| Very long fish name | Card truncates text gracefully, does not overflow. |
| 100+ fish in collection | FlatList handles scroll without lag. |
| 200+ species in library | FlatList + pagination handles without lag. No full load. |

---

## 21. Codex Implementation Prompt

---

```
You are implementing Fishy — a personal aquarium and fish collection mobile app.

Before writing any code, read this file: Fishy_PROJECT_RULES.md

This file contains all project rules. They are non-negotiable. Do not replace them with generic app patterns.

============================
STACK
============================

- Expo React Native + TypeScript
- Supabase PostgreSQL (structured data)
- Supabase Storage (photos)
- Expo Router (file-based navigation)
- No custom backend server
- No login (owner_id = 'local-user' for all personal tables)

============================
ARCHITECTURE DOCUMENT
============================

You have been given a complete technical planning and architecture document. 
Implement Fishy according to that document.

The document includes:
- Complete TypeScript types (use them exactly)
- Complete database schema SQL (run these migrations first)
- Complete service/query layer design (implement these functions)
- Complete screen-by-screen design (implement each screen)
- Complete data flow diagrams (follow these flows)
- 11-phase implementation roadmap (follow this order)

============================
IMPLEMENTATION RULES
============================

1. Read Fishy_PROJECT_RULES.md before every implementation session.
2. Implement one phase at a time. Confirm completion before moving to the next phase.
3. Do not implement future features.
   - No login system.
   - No AI fish detection.
   - No tank profile.
   - No push notifications in MVP.
   - No Next.js web layer yet.

4. Every UI button must connect to real logic or be removed entirely.
   - Do not build fake static screens.
   - Filters must actually filter (via Supabase queries).
   - Forms must actually save.
   - Photo updates must actually create a new fish_photos record.
   - Compatibility checks must actually run the rule algorithm.

5. Never overwrite old fish photos.
   - Every photo update creates a new fish_photos record.
   - is_current is set via UPDATE + INSERT sequence.
   - Old photos are never deleted from Storage or DB.

6. Dead/inactive fish stay in collection.
   - Never delete a fish record when status changes.
   - Apply grey/desaturated style to non-alive fish cards.

7. Do not fake species data.
   - Leave fields as null if source data is unavailable.
   - Do not invent temperature ranges, pH values, or compatibility claims.
   - Every species must have at minimum one real source in fish_species_sources.
   - Seed only 10-20 real verified species for initial development.
     Use real common species: Betta splendens, Neon Tetra, Oscar Cichlid (Astronotus ocellatus), etc.
     Look up real values from FishBase or Seriously Fish — do not invent them.

8. Use FlatList for all large lists (library, collection). Never ScrollView for dynamic lists.

9. Debounce search inputs at 400ms. Never query on every keystroke.

10. All filters must be applied server-side (Supabase query). Never filter 1000 records client-side.

11. Use the centralized Supabase client from src/lib/supabase/client.ts. Never instantiate a new client in UI components.

12. All Supabase keys must come from environment variables (.env.local). Never hard-code keys.

13. Every async screen must handle loading / success / empty / error states.

14. Do not break React hook rules. No conditional hooks. No hooks outside components or custom hooks.

15. All TypeScript types are defined in src/types/index.ts. Use them strictly. No `any` except where truly unavoidable.

16. Keep code beginner-readable:
    - Clear variable names
    - Separate UI components / service functions / types
    - No giant files
    - Comments only where the "why" is not obvious

============================
PHASE-BY-PHASE PLAN
============================

Phase 0: Project setup + Supabase connection
Phase 1: Database schema (migrations 001–008) + storage buckets + seed categories
Phase 2: Navigation shell (5 tabs) + shared UI components + colors
Phase 3: Collection screen + Add Fish (manual) + Fish Detail (basic) + Fish Status
Phase 4: Camera scan + photo upload + first timeline entry
Phase 5: Photo timeline (update photo, append-only, is_current logic)
Phase 6: Fish Detail (species info section + edit + source references)
Phase 7: Species Library (paginated list + search + filters + species detail)
Phase 8: Care Reminders (stored + computed photo reminders)
Phase 9: Compatibility Warning (full algorithm + UI modal)
Phase 10: UI polish + testing all manual test cases
Phase 11: EAS build preparation

============================
AFTER EACH PHASE
============================

After completing each phase, confirm:
- The phase's acceptance criteria are met
- No fake or mock data remains in production paths
- No future features were accidentally added
- The TypeScript compiles without errors
- The app runs without crashes

If you are unsure about a requirement, ask before implementing. 
If a requirement conflicts with implementation convenience, preserve the requirement and explain the tradeoff.

Fishy must be a real, usable aquarium collection app — not a generic CRUD demo.
```

---

## Appendix: Non-Negotiable Rules Summary

These rules are taken directly from `Fishy_PROJECT_RULES.md` Section 31 and must never be violated during implementation:

1. Do not make fake fish species facts.
2. Do not claim AI detection exists in MVP.
3. Do not overwrite old fish photos.
4. Do not remove dead fish from collection automatically.
5. Do not build static fake UI without connected logic.
6. Do not hard-code 1000 species into frontend bundle.
7. Do not load/render all species at once.
8. Do not ignore Supabase persistence.
9. Do not implement login in MVP.
10. Do not add Tank Profile in MVP.
11. Do not invent compatibility claims.
12. Do not use unlicensed species images without attribution.
13. Do not overcomplicate the first version.
14. Do not sacrifice clean UI/UX.
15. Do not break React hook rules.
