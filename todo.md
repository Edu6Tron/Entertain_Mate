# Project TODO

- [x] Define the watchlist data model with user ownership, title, exact type label, exact status label, month/year grouping, notes, and timestamps.
- [x] Create and apply the database migration for private watchlist entries.
- [x] Implement protected server procedures for listing, creating, updating, deleting, and seeding only the signed-in user's entries.
- [x] Seed the verified historical title list into exactly two groups: June 2026 and Archive.
- [x] Build a Manus OAuth-gated dashboard that never exposes a signed-in user's list to any other account.
- [x] Build a month-grouped title dashboard with group counts and a visual month-by-month timeline.
- [x] Build the add-title form with title, exact type, month/year, exact status, and optional notes fields.
- [x] Add responsive search and filters for title, type, and watch status across all groups.
- [x] Support inline watch-status, type, and notes updates, plus protected title deletion.
- [x] Apply the refined visual system with premium typography, intentional whitespace, and accessible status indicators.
- [x] Restore the global utility styles and verify the dashboard renders with the intended premium layout.
- [x] Add Vitest coverage for validation, user isolation, CRUD behavior, and historical seeding.
- [x] Verify the finished dashboard on desktop and mobile, review the checklist, and create the delivery checkpoint.
