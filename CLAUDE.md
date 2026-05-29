# Fishy Project Rules

> **Project Name:** Fishy  
> **Primary Platform:** Expo React Native mobile app  
> **Backend:** Supabase PostgreSQL + Supabase Storage  
> **Optional Future Web Layer:** Next.js admin / landing page  
> **MVP Rule:** No login, no AI fish detection, no tank profile.

---

## Table of Contents

- [0. Project Identity](#0-project-identity)
- [1. Core Product Direction](#1-core-product-direction)
- [2. Tech Stack Rules](#2-tech-stack-rules)
- [3. Authentication Rules](#3-authentication-rules)
- [4. Main Navigation Rules](#4-main-navigation-rules)
- [5. UI/UX Rules](#5-uiux-rules)
- [6. Dashboard Requirements](#6-dashboard-requirements)
- [7. Collection Requirements](#7-collection-requirements)
- [8. Fish Status Rules](#8-fish-status-rules)
- [9. Fish Detail Requirements](#9-fish-detail-requirements)
- [10. Scan Feature Rules](#10-scan-feature-rules)
- [11. Photo History Timeline Rules](#11-photo-history-timeline-rules)
- [12. Care Reminder Rules](#12-care-reminder-rules)
- [13. Compatibility Warning Rules](#13-compatibility-warning-rules)
- [14. Tank Profile Rule](#14-tank-profile-rule)
- [15. Species Library Requirements](#15-species-library-requirements)
- [16. Species Library Performance Rules](#16-species-library-performance-rules)
- [17. Library Filters](#17-library-filters)
- [18. Difference Between Collection and Library](#18-difference-between-collection-and-library)
- [19. Database Schema Direction](#19-database-schema-direction)
- [20. Recommended Table Fields](#20-recommended-table-fields)
- [21. Supabase Storage Rules](#21-supabase-storage-rules)
- [22. AI Rules](#22-ai-rules)
- [23. Data Quality Rules](#23-data-quality-rules)
- [24. Development Style Rules](#24-development-style-rules)
- [25. React Native / Expo Rules](#25-react-native--expo-rules)
- [26. Supabase Rules](#26-supabase-rules)
- [27. Implementation Priority](#27-implementation-priority)
- [28. Future Features](#28-future-features)
- [29. Deployment Rules](#29-deployment-rules)
- [30. Acceptance Criteria](#30-acceptance-criteria)
- [31. Non-Negotiable Rules](#31-non-negotiable-rules)
- [32. Current Final MVP Definition](#32-current-final-mvp-definition)
- [33. Working Instruction for AI Coding Agents](#33-working-instruction-for-ai-coding-agents)

---

## 0. Project Identity

### 0.1 Project Name

**Fishy**

### 0.2 Product Type

Fishy is a personal aquarium and fish collection mobile app.

It is designed for one user to record, manage, and learn about fish they own or are interested in.

Fishy is not just a generic CRUD app. It is a real personal fish collection and aquarium companion app.

### 0.3 Core Product Experience

The core user experience is:

1. Take or upload a fish photo.
2. Add the fish into a personal collection.
3. Link the fish to a real fish species from a research-backed fish library.
4. Track fish status, care, reminders, and photo history over time.
5. Learn accurate fish species information from the library.
6. Receive compatibility warnings when adding new fish.

### 0.4 Product Standard

Fishy must feel like a real long-term personal aquarium companion app.

It must not feel like:

- A fake CRUD demo
- A static mockup
- A generic animal collection app
- A random AI-generated fish encyclopedia
- A disconnected feature playground
- A beautiful UI with no real connected logic

### 0.5 App Name and Logo

App name:

```txt
Fishy
```

Logo direction:

- Simple fish icon
- Clean
- Friendly
- Readable at small size
- Blue / aqua / white compatible
- Not overly detailed

---

## 1. Core Product Direction

### 1.1 Main Goal

Fishy should help the user manage their real fish collection.

The app must support:

- Personal fish collection
- Fish photo recording
- Photo history timeline
- Fish status tracking
- Species selection
- Research-backed fish library
- Care reminders
- Compatibility warnings
- Persistent database storage
- Clean and simple UI/UX

### 1.2 Important Product Principle

Do not build random disconnected features.

Every feature must connect to at least one of these real user problems:

- I want to remember what fish I own.
- I want to know when I started keeping a fish.
- I want to track whether a fish is alive, dead, sold, missing, or given away.
- I want to update photos as the fish grows.
- I want to learn accurate information about fish species.
- I want to know if a new fish is compatible with my current fish.
- I want reminders for feeding, care, and photo updates.
- I want my fish data and photos to still exist after reopening the app.

### 1.3 MVP Philosophy

The MVP should be useful, stable, and realistic.

Do not overbuild.

Prioritize:

1. Correct data model
2. Persistent database
3. Real photo storage
4. Clean collection experience
5. Research-backed species library
6. Reliable compatibility and reminder logic
7. Simple, beautiful aquarium-style UI

### 1.4 What Fishy Is

Fishy is:

- A personal fish collection manager
- A fish photo timeline app
- A fish care companion
- A fish species learning library
- A simple aquarium record system
- A future-expandable mobile app

### 1.5 What Fishy Is Not

Fishy is not:

- A social media app
- A marketplace
- A fish store app
- A login-heavy SaaS app
- A fake AI scanner
- A tank simulator
- A game
- A random encyclopedia with unverified facts

---

## 2. Tech Stack Rules

### 2.1 Recommended Architecture

The project should be **Expo-first**.

Primary mobile app stack:

- Expo React Native
- TypeScript
- Supabase PostgreSQL
- Supabase Storage
- Expo Router if suitable
- React Native components
- Clean modular folder structure

Optional later web layer:

- Next.js
- TypeScript
- Supabase client
- Used for admin dashboard, species data management, or landing page later

### 2.2 MVP Architecture Decision

For MVP, prioritize:

- Expo mobile app
- Supabase database
- Supabase storage

Do not over-focus on Next.js in the first version.

Next.js should not block the mobile app.

The mobile app must be usable even if the Next.js web/admin app has not been built yet.

### 2.3 Database Requirement

The app must persist data.

The following data must not disappear after refreshing or reopening the app:

- Fish records
- Species records
- Photo URLs
- Fish statuses
- Reminder settings
- Timeline entries
- Compatibility-related data

Use **Supabase PostgreSQL** for structured data.

Use **Supabase Storage** for uploaded fish photos and species images.

Do not rely only on:

- Local state
- Temporary mock data
- Static arrays
- Hard-coded fake records

Local mock data is only allowed temporarily during early UI scaffolding.

The final implementation must connect to real persistent storage.

### 2.4 Recommended High-Level Architecture

Recommended architecture:

```txt
Expo React Native App
        ↓
Supabase Client
        ↓
Supabase PostgreSQL + Supabase Storage
```

Optional future architecture:

```txt
Next.js Admin / Landing Page
        ↓
Supabase Client
        ↓
Supabase PostgreSQL + Supabase Storage
```

### 2.5 Do Not Overengineer

Do not introduce unnecessary infrastructure in MVP.

Avoid adding:

- Custom backend server unless required
- Complex microservices
- Authentication system
- AI model server
- Queue system
- Docker deployment
- Kubernetes
- Payment system
- Social feed system

Fishy MVP should stay simple and practical.

---

## 3. Authentication Rules

### 3.1 No Login for MVP

Do not implement a login system for MVP.

The app is for personal use.

The user should enter directly into the dashboard.

There should be no required login screen before using the app.

### 3.2 Future-Proofing

Even though there is no login now, database tables should be designed so that authentication can be added later.

Use a placeholder owner field such as:

```txt
owner_id = "local-user"
```

or another clearly documented equivalent.

Do not hard-code the database design in a way that prevents future multi-user support.

### 3.3 Auth Must Not Delay MVP

Do not spend MVP development time on:

- Login screen
- Register screen
- Password reset
- OAuth
- User profile
- Email verification
- Account settings
- Multi-user permissions

These are future features only.

### 3.4 Future Auth Compatibility

If authentication is added later, the data model should be easy to migrate.

Personal data tables should already include an owner/user-related field.

Examples:

```txt
user_fish.owner_id
reminders.owner_id
fish_photos.owner_id optional
```

For MVP, this can point to a fixed local user identity.

---

## 4. Main Navigation Rules

### 4.1 Recommended Bottom Navigation

The app should use clean bottom navigation.

Recommended tabs:

1. Dashboard
2. Collection
3. Scan
4. Library
5. Settings

### 4.2 Dashboard

Dashboard is the home page.

It should summarize the user's fish collection and important actions.

### 4.3 Collection

Collection shows fish personally owned or previously owned by the user.

Collection is not the same as the species library.

### 4.4 Scan

Scan means camera photo capture only.

Do not implement AI detection in MVP.

Do not call the feature AI Scan.

### 4.5 Library

Library is a research-backed fish encyclopedia.

It is not the same as the user's collection.

The user can browse species even if they do not own them.

### 4.6 Settings

Settings can include:

- Reminder preferences
- App preferences
- Future data export tools
- Future notification settings

### 4.7 Navigation Simplicity

Navigation should be simple and beginner-friendly.

Avoid deeply nested screens unless necessary.

Recommended screen flow:

```txt
Dashboard
Collection
  → Fish Detail
  → Edit Fish
  → Photo Timeline
Scan
  → Camera
  → Preview
  → Add Fish Form
  → Compatibility Warning
Library
  → Species List
  → Species Detail
Settings
```

---

## 5. UI/UX Rules

### 5.1 Visual Direction

The UI must be:

- Clean
- Minimalist
- Simple
- Friendly
- Aquarium-inspired
- Blue / aqua / white themed
- Easy to understand
- Not visually crowded

Avoid:

- Heavy gradients
- Excessive animations
- Confusing layouts
- Overly childish design
- Overly corporate design
- Too many cards on one screen
- Fake decorative elements that do not help UX

### 5.2 App Logo

The app logo should be a simple fish icon.

App name:

```txt
Fishy
```

The icon should be readable at small sizes.

### 5.3 UX Principle

Every screen must have a clear purpose.

Do not create fake static pages.

All visible data should eventually come from real app state or database data.

Buttons must be connected to actual behavior.

Examples:

- Filters must actually filter.
- Forms must actually save.
- Photo update must actually create a timeline entry.
- Compatibility warning must actually run logic based on the new fish and existing collection.
- Reminder completion must actually update reminder state.

### 5.4 Empty State Requirement

Important pages must have clean empty states.

Examples:

Collection empty state:

```txt
No fish yet.
Add your first fish or scan a new fish.
```

Library empty state:

```txt
No species found.
Try another search or filter.
```

Dashboard empty state:

```txt
Welcome to Fishy.
Start by adding your first fish.
```

### 5.5 Clean UI Priority

If there is a conflict between showing every possible feature and keeping the app clean, prioritize clean UI.

Do not crowd the screen with too much information.

Use progressive disclosure:

- Cards show summary.
- Detail pages show full information.
- Advanced filters can be hidden in filter panels.

---

## 6. Dashboard Requirements

### 6.1 Dashboard Purpose

Dashboard should give the user a quick summary of their fish collection and care tasks.

It should not be a random landing page.

### 6.2 Required Dashboard Cards

Dashboard should include:

- Active fish count
- Total collection count
- Species count
- Recently added fish
- Longest kept fish
- Care reminders
- Photo update reminders
- Compatibility alerts if any

### 6.3 Active Fish Count Rule

Active fish count should count only fish with status:

```txt
Alive
```

Fish with the following statuses should not be counted as active:

```txt
Dead
Sold
Given Away
Missing
```

### 6.4 Total Collection Count Rule

Total collection count includes all fish records, including:

- Alive fish
- Dead fish
- Sold fish
- Given away fish
- Missing fish

### 6.5 Species Count Rule

Species count should count unique species in the user's collection.

### 6.6 Longest Kept Fish Rule

Longest kept fish should be calculated from:

```txt
start_date -> current date
```

for active fish.

For inactive fish, calculate from:

```txt
start_date -> death_date / end_date
```

### 6.7 Dashboard Empty State

If there is no fish yet, show an empty state with clear actions:

- Add your first fish
- Scan fish
- Explore species library

### 6.8 Dashboard Must Stay Simple

Do not overload the dashboard.

It should feel clean, useful, and easy to scan.

---

## 7. Collection Requirements

### 7.1 Collection Purpose

Collection stores the user's personal fish records.

A fish in the collection is not just a species.

Example:

```txt
Name: Black Oscar
Species: Oscar Cichlid
Status: Alive
Started Keeping: 2026-05-01
Current Photo: photo_url
```

### 7.2 Multiple Fish of Same Species

The user may own multiple fish of the same species.

Each fish must have its own record.

Example:

```txt
Species: Oscar Cichlid

Personal fish:
- Black Oscar
- Baby Oscar
- Tiger Oscar
```

### 7.3 Collection Card

Each fish card should show:

- Current photo
- Fish name
- Species/common name
- Status
- Keeping duration
- Optional category label

### 7.4 Dead or Inactive Fish Card

Fish with these statuses must appear visually different:

```txt
Dead
Sold
Given Away
Missing
```

Requirement:

- The whole fish card should look greyed out or desaturated.
- It should still remain in the collection.
- Do not delete dead fish automatically.
- Show status clearly.

Example card text:

```txt
Black Oscar
Oscar Cichlid
Deceased · Kept for 5 months
```

### 7.5 Collection Filters

Collection must support filtering by:

- Status
- Species
- Category
- Start date
- Death/end date
- Active/inactive
- Recently added
- Longest kept

### 7.6 Collection Search

Collection must support searching by:

- Fish nickname/name
- Species common name
- Scientific name if linked

### 7.7 Collection Sorting

Recommended sorting options:

- Recently added
- Oldest added
- Name A-Z
- Name Z-A
- Longest kept
- Status

---

## 8. Fish Status Rules

### 8.1 Required Fish Statuses

Fish status must support:

```txt
Alive
Dead
Sold
Given Away
Missing
```

### 8.2 Date Fields

A fish should support:

- start_date
- death_date
- end_date
- created_at
- updated_at

### 8.3 Status Date Rules

Rules:

- Alive fish should normally have `start_date` but no `death_date`.
- Dead fish should have `death_date`.
- Sold, Given Away, or Missing fish can use `end_date`.
- Do not remove the fish record when status changes.

### 8.4 Status Change Behavior

When changing status from Alive to Dead:

- Ask for death date
- Or allow default date today

When changing to Sold, Given Away, or Missing:

- Allow end date

### 8.5 Status Display

Status should be visible in:

- Collection card
- Fish detail page
- Dashboard calculations
- Filters

---

## 9. Fish Detail Requirements

### 9.1 Fish Detail Purpose

Fish detail page must show both:

1. Personal fish information
2. Species library information

These must be visually separated.

### 9.2 Personal Fish Section

Show:

- Current photo
- Fish name
- Status
- Species
- Category
- Start date
- Death/end date if applicable
- Keeping duration
- Notes
- Photo history timeline

### 9.3 Species Information Section

Show linked species information from the library:

- Common name
- Scientific name
- Category
- Water type
- Adult size
- Lifespan
- Temperament
- Diet
- Temperature range
- pH range
- Hardness range
- Care level
- Minimum tank size
- Compatible fish notes
- Avoid-with notes
- Source references
- Verification status

### 9.4 Editing Personal Fish Data

User should be able to edit:

- Fish name
- Current status
- Start date
- Death/end date
- Notes
- Current photo by adding a new photo timeline entry
- Linked species if wrong

### 9.5 Species Fact Editing Rule

Do not edit verified species facts directly from fish detail.

Species facts belong to Library/admin data, not personal fish data.

---

## 10. Scan Feature Rules

### 10.1 Scan Definition

For MVP, Scan means camera capture only.

Do not implement AI species detection in MVP.

Do not call it AI Scan.

Do not pretend the app can identify fish automatically.

### 10.2 Required Scan Flow

Required flow:

```txt
Tap Scan
↓
Open Camera
↓
Take Photo
↓
Preview Photo
↓
Retake or Confirm
↓
Enter fish name
↓
Select species manually from Library
↓
Set start date
↓
Run compatibility check against existing collection
↓
Show compatibility warning if needed
↓
Save fish into collection
↓
Upload photo to Supabase Storage
↓
Create fish record
↓
Create first photo history timeline entry
```

### 10.3 Retake Requirement

User must be able to retake photo before saving.

### 10.4 Confirm Requirement

Do not save the fish immediately after camera capture.

Always show preview and confirmation.

### 10.5 Manual Species Selection

After photo capture, user must manually select the species from the Library.

If the exact species is unknown, allow a placeholder such as:

```txt
Unknown species
```

or:

```txt
Needs identification
```

Do not pretend the app identified the fish automatically.

### 10.6 Photo Upload Requirement

When confirmed, the photo must be uploaded to Supabase Storage.

The fish record should store the resulting storage URL or storage path.

---

## 11. Photo History Timeline Rules

### 11.1 Mandatory Feature

Photo history timeline is required.

This is one of the core features of Fishy.

### 11.2 Do Not Overwrite Old Photos

When the user updates a fish photo, do not overwrite the old photo.

Instead:

- Upload new photo.
- Create a new `fish_photos` record.
- Mark it as current photo if needed.
- Keep old photos in timeline.

### 11.3 Timeline Data

Each photo timeline entry should include:

- id
- fish_id
- photo_url or storage_path
- thumbnail_url if available
- captured_at
- note
- is_current
- created_at
- updated_at

### 11.4 Timeline UI

Fish detail page should show a timeline such as:

```txt
26 May 2026 - First added
20 June 2026 - Grew bigger
15 July 2026 - Color improved
```

### 11.5 Update Photo Flow

Required flow:

```txt
Open Fish Detail
↓
Tap Update Photo
↓
Take or select new photo
↓
Preview
↓
Optional note
↓
Save
↓
Upload photo
↓
Add timeline entry
↓
Update current photo
```

### 11.6 Current Photo Rule

The current photo should be the most recent photo marked as current.

Only one photo should be current at a time for each fish.

When a new photo is set as current, older entries should have `is_current = false`.

---

## 12. Care Reminder Rules

### 12.1 Required Reminder Feature

Care reminder is required.

At minimum, support reminders for:

- Feeding
- Photo update
- General care check
- Water check reminder if added later

### 12.2 MVP Reminder Scope

MVP can start with in-app reminders.

Expo push notifications are optional later.

Do not block MVP on push notifications.

### 12.3 Reminder Types

Recommended reminder types:

```txt
feeding
photo_update
health_check
water_change
custom
```

### 12.4 Feeding Reminder

Feeding reminders should be simple and useful.

Example:

```txt
Feed your fish today
```

or species-specific if data supports it:

```txt
Feed Oscar 1-2 times today
```

Only show species-specific feeding advice if the species profile has verified data.

### 12.5 Photo Update Reminder

Photo update reminders should detect if a fish has not had a new photo for a certain period.

Recommended default:

```txt
Remind to update fish photo every 30 days
```

### 12.6 Reminder Completion

User should be able to mark reminders as done.

### 12.7 Dashboard Reminder Display

Dashboard should show relevant reminders clearly.

Examples:

- Feed fish today
- Update Black Oscar photo
- Check fish health
- Review compatibility alert

---

## 13. Compatibility Warning Rules

### 13.1 Required Feature

When adding a new fish through Scan or Add Fish, the app must check compatibility against the existing active collection.

Compatibility warnings must be shown before final save or immediately before confirmation.

### 13.2 Warning Levels

Compatibility status must have three levels:

```txt
Safe
Caution
Danger
```

### 13.3 UI Meaning

```txt
Safe = likely compatible based on available data
Caution = possible issue, user should monitor carefully
Danger = high-risk combination, not recommended
```

### 13.4 Compatibility Logic

Compatibility should be based on structured rules and verified species attributes.

Use fields such as:

- water_type
- temperature range
- pH range
- hardness range
- temperament
- adult_size_cm
- diet
- predatory behavior
- tank level
- schooling behavior
- explicit avoid rules

### 13.5 Danger Conditions

Danger should be triggered for cases like:

- Freshwater fish mixed with marine fish
- No overlapping temperature range
- No overlapping pH range
- Aggressive predator with small peaceful fish
- Explicit avoid rule exists
- Large adult size difference with predatory/aggressive species

### 13.6 Caution Conditions

Caution should be triggered for cases like:

- Partial temperature overlap
- Partial pH overlap
- Semi-aggressive fish with peaceful fish
- Large but not obviously predatory size gap
- Known fin-nipping risk
- Different care requirements
- Schooling fish kept alone
- Species data is incomplete

### 13.7 Safe Conditions

Safe should only be shown when:

- Water type matches
- Temperature range overlaps
- pH range overlaps
- Temperament is compatible
- Size difference is not dangerous
- No explicit avoid rule exists
- Data is sufficiently verified

### 13.8 Data Quality Rule

If species data is incomplete or unverified, do not confidently say Safe.

Use Caution or Unknown/Needs Review behavior.

Recommended:

```txt
Compatibility: Caution
Reason: Some species data is incomplete or not fully verified.
```

### 13.9 Do Not Hallucinate Compatibility

Do not invent compatibility claims.

If there is no verified information, mark it as:

```txt
needs_review
```

or show cautious wording.

---

## 14. Tank Profile Rule

Tank Profile is not part of MVP.

Do not implement tank management in the first version unless explicitly requested later.

However, database schema may optionally reserve `tank_id` for future extension if it does not complicate MVP.

Do not let tank profile delay the core app.

---

## 15. Species Library Requirements

### 15.1 Library Purpose

The Library is a fish encyclopedia.

The user can browse and learn about fish even if they do not own them.

The Library must not be limited to the user's collection.

### 15.2 Long-Term Target

The app should support 1000+ fish species long term.

### 15.3 MVP Data Target

Do not fake 1000 species.

MVP should prioritize fewer but higher-quality verified records.

Recommended MVP seed:

```txt
100-200 verified common aquarium species
```

Long-term architecture should support:

```txt
1000+ species
```

### 15.4 Library Must Be Research-Backed

This is a critical rule.

Fish species information must be real, accurate, sourced, and reviewable.

Do not use AI-generated fish facts without source verification.

Do not hallucinate:

- pH
- temperature
- size
- lifespan
- diet
- compatibility
- care data
- water hardness
- scientific names
- temperament

If data is uncertain or unavailable, use `null` or mark as `needs_review`.

### 15.5 Required Species Fields

Each species profile should include:

- id
- common_name
- scientific_name
- category_id
- family
- water_type
- origin
- adult_size_min_cm
- adult_size_max_cm
- lifespan_min_years
- lifespan_max_years
- temperament
- diet
- care_level
- temperature_min_c
- temperature_max_c
- ph_min
- ph_max
- hardness_min_dgh
- hardness_max_dgh
- minimum_tank_size_liters
- tank_level
- schooling_behavior
- description
- care_notes
- feeding_notes
- compatibility_notes
- avoid_with_notes
- image_url
- thumbnail_url
- image_license
- image_source_url
- verification_status
- confidence_level
- last_reviewed_at
- created_at
- updated_at

### 15.6 Verification Status

Each species must have a verification status:

```txt
verified
partially_verified
draft
needs_review
```

### 15.7 Confidence Level

Each species or field can have confidence level:

```txt
high
medium
low
unknown
```

### 15.8 Source References

Each species profile must store source references.

Recommended source fields:

- species_id
- source_name
- source_url
- source_type
- fields_supported
- notes
- retrieved_at

### 15.9 Field-Level Source Support

For important facts, it is recommended to track which source supports which field.

Important fields:

- adult size
- lifespan
- temperature
- pH
- hardness
- diet
- temperament
- care level
- compatibility

### 15.10 Reliable Source Strategy

Use reputable sources such as:

- FishBase for scientific name, maximum size, ecology, distribution, diet, and scientific references.
- Seriously Fish for aquarium care profiles and husbandry information.
- Reputable aquarium organizations, breeder references, or expert care sheets when needed.
- Avoid random forums as primary source.
- Forums may only be used as anecdotal secondary context and must not be treated as verified fact.

### 15.11 Image Licensing Rule

Do not use random fish images without checking license.

Species images should include:

- image source URL
- license
- author if available
- attribution if required

If no safe image is available, use placeholder image.

Do not scrape copyrighted images blindly.

---

## 16. Species Library Performance Rules

### 16.1 Must Support Large Library

The app must be designed to support at least 1000 species without freezing.

### 16.2 Do Not Load Everything At Once

Do not fetch and render all 1000 species at once.

Use pagination or infinite scrolling.

Recommended page size:

```txt
20-30 species per page
```

### 16.3 Use FlatList

In Expo React Native, use FlatList or another virtualized list for Library and Collection.

Do not use ScrollView for large dynamic lists such as Library.

### 16.4 Search Debounce

Search must use debounce.

Recommended debounce:

```txt
300-500ms
```

Do not query database on every keystroke instantly.

### 16.5 Database Filtering

Filters should be handled by database queries where possible.

Do not fetch 1000 species into the app and then filter locally.

### 16.6 Thumbnail Rule

Library list cards must use thumbnail images.

Full-size images should only load on detail pages.

### 16.7 Indexing

Supabase/PostgreSQL should have indexes for common filters/search fields:

- common_name
- scientific_name
- category_id
- water_type
- care_level
- temperament

---

## 17. Library Filters

Library should support filters such as:

- Search by common name
- Search by scientific name
- Category
- Water type
- Care level
- Temperament
- Size
- Diet
- pH range
- Temperature range
- Beginner-friendly fish
- Aggressive fish
- Freshwater / brackish / marine

Do not implement all filters in the first UI if it makes the screen too complex.

Start with important filters:

- Search
- Category
- Water type
- Care level
- Temperament

---

## 18. Difference Between Collection and Library

### 18.1 Collection

Collection means fish personally owned or previously owned by the user.

Example:

```txt
My Black Oscar
My Angelfish
My Pearl Gourami
```

### 18.2 Library

Library means general species encyclopedia.

Example:

```txt
Oscar Cichlid
Freshwater Angelfish
Pearl Gourami
Betta splendens
```

### 18.3 Linking Rule

Each personal fish should link to one species record.

One species can be linked to many personal fish records.

Example:

```txt
Species: Oscar Cichlid
Personal fish:
- Black Oscar
- Tiger Oscar
- Baby Oscar
```

This relationship is required for clean data design.

---

## 19. Database Schema Direction

The database should be normalized enough to avoid messy data.

Recommended tables:

### 19.1 fish_categories

Stores broad groups.

Example categories:

```txt
Cichlid
Angelfish
Gourami
Betta
Arowana
Goldfish
Koi
Tetra
Barb
Rasbora
Catfish
Pleco
Loach
Discus
Livebearer
Marine Fish
Brackish Fish
River Monster Fish
```

### 19.2 fish_species

Stores research-backed species profiles.

### 19.3 fish_species_sources

Stores citations and source references.

### 19.4 user_fish

Stores personal collection fish.

### 19.5 fish_photos

Stores photo history timeline.

### 19.6 reminders

Stores care reminders.

### 19.7 compatibility_rules

Stores explicit compatibility rules where available.

### 19.8 compatibility_checks

Optional table for saved compatibility check results.

---

## 20. Recommended Table Fields

### 20.1 fish_categories

```txt
id
name
slug
description
created_at
updated_at
```

### 20.2 fish_species

```txt
id
common_name
scientific_name
category_id
family
water_type
origin
adult_size_min_cm
adult_size_max_cm
lifespan_min_years
lifespan_max_years
temperament
diet
care_level
temperature_min_c
temperature_max_c
ph_min
ph_max
hardness_min_dgh
hardness_max_dgh
minimum_tank_size_liters
tank_level
schooling_behavior
description
care_notes
feeding_notes
compatibility_notes
avoid_with_notes
image_url
thumbnail_url
image_license
image_source_url
verification_status
confidence_level
last_reviewed_at
created_at
updated_at
```

### 20.3 fish_species_sources

```txt
id
species_id
source_name
source_url
source_type
fields_supported
notes
retrieved_at
created_at
```

### 20.4 user_fish

```txt
id
owner_id
species_id
name
status
start_date
death_date
end_date
current_photo_id
notes
created_at
updated_at
```

### 20.5 fish_photos

```txt
id
fish_id
storage_path
photo_url
thumbnail_url
captured_at
note
is_current
created_at
updated_at
```

### 20.6 reminders

```txt
id
owner_id
fish_id
species_id
type
title
description
frequency
next_due_at
last_completed_at
is_active
created_at
updated_at
```

### 20.7 compatibility_rules

```txt
id
species_a_id
species_b_id
level
reason
source_id
verification_status
created_at
updated_at
```

---

## 21. Supabase Storage Rules

### 21.1 Buckets

Recommended buckets:

```txt
fish-photos
species-images
```

### 21.2 fish-photos

Used for user-uploaded fish collection photos.

Path recommendation:

```txt
fish-photos/{owner_id}/{fish_id}/{timestamp}.jpg
```

### 21.3 species-images

Used for library species images.

Must respect license and source attribution.

### 21.4 Do Not Store Large Images Without Compression

Images should be compressed or resized before upload if needed.

Store thumbnails where possible.

### 21.5 Storage Path Rule

Store the storage path in the database, not only public URLs.

This makes it easier to regenerate URLs or manage files later.

---

## 22. AI Rules

### 22.1 No AI Detection in MVP

Do not implement fish image detection in MVP.

The Scan feature is manual photo capture only.

### 22.2 Future AI Detection

AI fish detection can be added later as an optional feature.

If added later, the AI should only suggest possible species.

The user must confirm manually.

Never automatically save AI species prediction as verified fact.

### 22.3 AI Species Data Rule

AI must not invent species facts.

AI can help:

- Format sourced data
- Summarize sourced data
- Compare multiple sources
- Generate draft descriptions from cited facts
- Flag missing fields
- Flag conflicting data

AI cannot be treated as a source of truth.

If AI generates draft data, it must be marked:

```txt
draft
needs_review
```

and not verified.

---

## 23. Data Quality Rules

### 23.1 Never Fake Research Data

Do not create fake fish species information.

Do not fabricate:

- pH
- temperature
- hardness
- adult size
- lifespan
- temperament
- diet
- compatibility
- origin
- scientific name

### 23.2 Unknown Data

If reliable data is unavailable, use:

```txt
null
```

or:

```txt
needs_review
```

### 23.3 Conflicting Data

If different sources conflict, store notes and choose conservative display.

Example:

```txt
Temperature range varies by source. Displayed range is conservative.
```

### 23.4 Verified Data Rule

A species should only be marked verified if key fields are backed by reliable sources.

Recommended minimum verified fields:

- common name
- scientific name
- water type
- adult size
- temperature range
- pH range
- diet
- temperament or behavior
- care notes
- at least one reliable source

### 23.5 No Source, No Confidence

If there is no source, the field should not be shown as a confident fact.

Use cautious language or hide the field until reviewed.

---

## 24. Development Style Rules

### 24.1 Code Quality

Code must be:

- Beginner-readable
- Maintainable
- Modular
- Type-safe
- Realistic
- Not overengineered

### 24.2 TypeScript

Use TypeScript strictly.

Define clear types for:

- Fish
- Species
- Category
- Photo
- Reminder
- Compatibility status
- Source reference

Avoid `any` unless absolutely necessary.

### 24.3 File Organization

Use clear feature-based folders.

Recommended:

```txt
src/
  app/
  components/
  features/
    dashboard/
    collection/
    scan/
    library/
    reminders/
    compatibility/
  lib/
    supabase/
    storage/
    utils/
  types/
  constants/
```

### 24.4 Avoid Giant Files

Do not put all logic into one file.

Separate:

- UI components
- Database queries
- Business logic
- Types
- Utilities
- Constants

### 24.5 No Fake UI

Do not build UI that looks functional but has no logic.

Every action button should either:

- Work
- Be clearly marked as future feature
- Be omitted until implemented

---

## 25. React Native / Expo Rules

### 25.1 Hooks

Follow React hook rules strictly.

Do not call hooks conditionally.

Do not create code that causes:

```txt
Rendered fewer hooks than expected
```

or similar errors.

### 25.2 Lists

Use FlatList for lists.

Do not use ScrollView for large dynamic lists such as Library.

### 25.3 Camera

Use Expo camera or suitable Expo-compatible camera package.

Camera flow must support:

- Open camera
- Capture image
- Preview
- Retake
- Confirm

### 25.4 Image Handling

Use Expo-compatible image handling.

Compress/resize if needed before uploading.

Handle loading and error states.

### 25.5 Offline Consideration

Offline mode is not required for MVP.

However, do not design the app in a way that makes future offline support impossible.

---

## 26. Supabase Rules

### 26.1 Environment Variables

Do not hard-code Supabase keys in source files.

Use environment variables.

### 26.2 Query Layer

Create reusable query functions.

Example:

```txt
getUserFish()
createUserFish()
updateUserFish()
getSpeciesList()
getSpeciesById()
uploadFishPhoto()
createFishPhotoEntry()
```

Do not scatter Supabase queries randomly across UI components.

### 26.3 Error Handling

Every database and storage operation must handle errors.

Show user-friendly error messages.

Do not silently fail.

### 26.4 Loading States

All async screens must handle:

- loading
- success
- empty
- error

### 26.5 Supabase Client Rule

Create a centralized Supabase client.

Do not recreate the Supabase client randomly in multiple components.

---

## 27. Implementation Priority

### 27.1 MVP Priority Order

Build in this order:

1. Project setup
2. Supabase setup
3. Database schema
4. Dashboard layout
5. Collection list
6. Add fish manually
7. Scan camera flow
8. Upload photo to storage
9. Create fish record
10. Create first photo timeline record
11. Fish detail page
12. Update photo timeline
13. Fish status update
14. Library list
15. Species detail
16. Library filters/search
17. Care reminders
18. Compatibility warning
19. UI polish
20. Build/deploy preparation

### 27.2 Do Not Start With Complex Features

Do not start with:

- AI detection
- Tank profile
- Social features
- Login
- Web admin
- Push notifications
- Complex analytics

These are future features.

---

## 28. Future Features

These are allowed later but not MVP blockers:

- AI fish species suggestion
- Tank profile
- Water parameter tracking
- Feeding log
- Growth chart
- Export collection data
- Next.js admin panel
- App Store release
- TestFlight release
- Push notifications
- Multi-user login
- Cloud backup with auth
- Community sharing

---

## 29. Deployment Rules

### 29.1 Mobile Deployment

Target deployment path:

```txt
Expo Development Build
↓
EAS Build
↓
TestFlight
↓
App Store if needed
```

### 29.2 App Store Consideration

If preparing for App Store, include:

- Camera permission description
- Photo usage description
- Privacy policy
- Data storage explanation
- Image upload explanation

### 29.3 Web Deployment

Next.js can be deployed to Vercel later if added.

Do not require Next.js deployment for the Expo MVP to work.

---

## 30. Acceptance Criteria

A feature is not complete unless it meets these criteria.

### 30.1 Scan Feature Complete When

- User can open camera
- User can take photo
- User can preview
- User can retake
- User can confirm
- User can enter fish name
- User can select species
- App uploads image
- App creates fish record
- App creates first photo timeline entry
- Fish appears in collection after save

### 30.2 Collection Complete When

- Fish cards show real saved data
- Cards show photo/name/species/status
- Dead/inactive fish are greyed out
- Search works
- Filters work
- Detail page opens correctly

### 30.3 Photo Timeline Complete When

- New photo update does not delete old photo
- Each photo creates timeline entry
- Current photo updates correctly
- Timeline is visible in fish detail

### 30.4 Library Complete When

- Species list loads from database
- Search works
- Filters work
- Detail page shows species facts
- Source references are visible or stored
- Data has verification status
- App does not freeze with large species list

### 30.5 Compatibility Warning Complete When

- Adding a fish checks existing active fish
- Warning level is Safe/Caution/Danger
- Reason is shown
- Unverified data does not produce overconfident Safe result

### 30.6 Reminder Complete When

- User can see care reminders
- Feeding reminder exists
- Photo update reminder exists
- Reminder can be marked done or dismissed
- Dashboard shows relevant reminders

---

## 31. Non-Negotiable Rules

These rules must not be violated.

1. Do not make fake fish species facts.
2. Do not claim AI detection exists in MVP.
3. Do not overwrite old fish photos.
4. Do not remove dead fish from collection automatically.
5. Do not build static fake UI without connected logic.
6. Do not hard-code 1000 species into frontend bundle.
7. Do not load/render all species at once.
8. Do not ignore Supabase persistence.
9. Do not implement login in MVP unless explicitly requested.
10. Do not add Tank Profile in MVP unless explicitly requested.
11. Do not invent compatibility claims.
12. Do not use unlicensed species images without attribution.
13. Do not overcomplicate the first version.
14. Do not sacrifice clean UI/UX.
15. Do not break React hook rules.

---

## 32. Current Final MVP Definition

Fishy MVP v1 includes:

- Expo React Native mobile app
- TypeScript
- Supabase PostgreSQL
- Supabase Storage
- No login
- Direct dashboard entry
- Dashboard summary
- Personal fish collection
- Scan camera photo capture
- Manual species selection
- Fish status tracking
- Greyed inactive/dead fish cards
- Fish detail page
- Photo history timeline
- Update fish photo without overwriting old photos
- Research-backed species library
- Library search/filter
- Species detail pages
- Care reminders
- Feeding reminder
- Photo update reminder
- Compatibility warning with Safe/Caution/Danger
- Clean minimalist aquarium UI
- Simple fish logo
- Architecture that supports 1000+ species long term

---

## 33. Working Instruction for AI Coding Agents

When implementing Fishy:

1. Read this file before making changes.
2. Do not assume missing requirements.
3. Do not silently replace these rules with generic app behavior.
4. If a requirement conflicts with implementation convenience, preserve the requirement and explain the tradeoff.
5. Prefer small, maintainable steps.
6. Keep code beginner-readable.
7. Make sure UI is connected to real state/database.
8. Before adding a new feature, check if it belongs to MVP or future scope.
9. If implementing species data, include source and verification fields.
10. If unsure about fish facts, leave them blank or `needs_review` instead of inventing.
11. Avoid fake mock-only flows.
12. Keep the app clean, practical, and deployable.
13. Respect the difference between Collection and Library.
14. Preserve the mandatory photo history timeline.
15. Preserve the no-login MVP rule.
16. Preserve the no-AI-detection MVP rule.

Fishy should be a real, usable aquarium collection app, not a generic CRUD demo.
