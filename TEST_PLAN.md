# Humor Chain — Full Test Plan

Last updated: 2026-04-24  
Environment: `http://localhost:3005` (Next.js 14 dev, Supabase backend)  
Tested by: automated browser workflow (Cursor AI agent)

---

## Prerequisites

| Item | Requirement |
|------|-------------|
| Account | Google OAuth account with `is_superadmin` or `is_matrix_admin = true` in `profiles` table |
| Running server | `npm run dev` in project root |
| Env vars | `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_BASE_URL` |

---

## Test Suite 1 — Authentication & Access Control

### TC-1.1 Unauthenticated redirect
- Navigate to `http://localhost:3005/`
- **Expected:** Redirects to `/` and shows "Sign in with Google" button

### TC-1.2 Unauthorized access denied
- Sign in with a Google account that does NOT have admin flags
- **Expected:** "Access Denied" message shown; cannot reach `/flavors`

### TC-1.3 Authorized access
- Sign in with an admin Google account (`is_superadmin` or `is_matrix_admin`)
- **Expected:** Redirected automatically to `/flavors`; Humor Flavors list shown

### TC-1.4 Session persistence
- Navigate between pages (flavors → steps → captions → test) without re-signing in
- **Expected:** Session maintained throughout; no unwanted redirect to login

---

## Test Suite 2 — Flavor List (CRUD)

### TC-2.1 View flavor list
- Navigate to `/flavors`
- **Expected:** Table shows slug, description, step count, creator email, created date, and action buttons (Edit, Steps, Captions, Duplicate, Delete)

### TC-2.2 Slug search filter
- Type a partial slug into the "Search by slug…" box
- **Expected:** Table updates immediately (client-side) to show only matching rows; clearing the box shows all rows

### TC-2.3 Email filter
- Type a partial email into "Filter by email…"
- **Expected:** Table filters to rows created by matching email addresses

### TC-2.4 Create flavor — valid input
- Click "+ New Flavor", enter a valid kebab-case slug (e.g. `my-new-flavor`) and optional description
- Click "Create Flavor"
- **Expected:** Modal closes, new row appears at top of table with 0 steps

### TC-2.5 Create flavor — invalid slug (client-side)
- Click "+ New Flavor", enter slug with uppercase/spaces/special chars (e.g. `Bad Slug!`)
- Click "Create Flavor"
- **Expected:** Browser native validation fires; "Please match the requested format." tooltip shown; form not submitted

### TC-2.6 Create flavor — duplicate slug (server-side)
- Click "+ New Flavor", enter a slug that already exists
- Click "Create Flavor"
- **Expected:** Server returns error; red alert "A flavor with this slug already exists." shown inside modal; modal stays open

### TC-2.7 Edit flavor
- Click "Edit" on any row → edit page `/flavors/{id}/edit`
- Change the description, click "Save Changes"
- **Expected:** "Saving…" then "Save Changes" button states; navigate back and verify description updated in table

### TC-2.8 Duplicate flavor
- Click "Duplicate" on any row → enter a unique new slug → click "Duplicate"
- **Expected:** Modal closes, duplicated flavor appears in table with same step count as source; all steps are cloned

### TC-2.9 Delete flavor — blocked when steps exist
- Click "Delete" on a flavor that has ≥1 step; confirm browser dialog
- **Expected:** Error message "Cannot delete: this flavor has N step(s). Delete the steps first." shown inline; flavor remains in table

### TC-2.10 Delete flavor — succeeds when 0 steps
- Delete all steps from a flavor first, then click "Delete"; confirm dialog
- **Expected:** Flavor disappears from table

---

## Test Suite 3 — Prompt Chain Steps (CRUD + Reorder)

### TC-3.1 View steps page (empty)
- Navigate to `/flavors/{id}/steps` for a flavor with 0 steps
- **Expected:** Only "+ Add Step" button shown, no step cards

### TC-3.2 Add step — valid
- Click "+ Add Step"; select LLM Model, Step Type, Input Type, Output Type; fill System Prompt and User Prompt; click "Add Step"
- **Expected:** "Saving…" then form closes; step card appears with correct badges (in/out/type) and prompt preview

### TC-3.3 Add step — required fields missing
- Click "+ Add Step"; leave Step Type at placeholder; click "Add Step"
- **Expected:** Browser validation prevents submission; required field highlighted

### TC-3.4 Add multiple steps — order buttons
- Add a second step
- **Expected:** Step 1 has ↑ disabled, ↓ enabled; Step 2 has ↑ enabled, ↓ disabled

### TC-3.5 Move step up
- Click ↑ on Step 2
- **Expected:** Steps swap; previously Step 2 is now Step 1 (verified by type badges)

### TC-3.6 Move step down
- Click ↓ on Step 1 (after a move-up)
- **Expected:** Steps swap back; verified by type badges

### TC-3.7 Edit step
- Click "Edit" on any step card → in-place form opens pre-populated with existing values
- Change System Prompt; click "Save Changes"
- **Expected:** "Saving…" → form closes; updated prompt shown in step card's preview

### TC-3.8 Show more / Show less toggle
- Click "Show more ↓" on a step card
- **Expected:** Full prompt text revealed; button changes to "Show less ↑"

### TC-3.9 Delete step
- Click "Delete" on a step; confirm browser dialog
- **Expected:** Step card disappears; remaining steps are renumbered (order_by values updated)

### TC-3.10 Delete last step
- Delete a flavor's final step
- **Expected:** Steps page shows empty state; "0 steps" reflected in flavor table

---

## Test Suite 4 — Test Flavor (Pipeline UI)

### TC-4.1 Test Flavor page loads
- Navigate to `/flavors/{id}/test` (or click "🧪 Test Flavor" link from steps page)
- **Expected:** Two input modes: "Image URL" and "Upload File"; "How the pipeline works" sidebar; template variable helper

### TC-4.2 Template variable helper shown
- **Expected:** `${stepNOutput}` variables listed for each step in the flavor; example showing multi-step chaining

### TC-4.3 Image URL tab — empty URL blocked
- Stay on Image URL tab; leave URL blank; click "Generate Captions"
- **Expected:** Button stays disabled or browser validation fires; no API call made

### TC-4.4 Image URL tab — invalid URL
- Enter a non-URL string (e.g. `not-a-url`); click "Generate Captions"
- **Expected:** Error message shown; pipeline does not proceed

### TC-4.5 Upload File tab
- Switch to "Upload File" tab
- **Expected:** File chooser input appears; image drag-drop or browse supported

### TC-4.6 Pipeline execution (requires live API)
- Enter a valid public image URL; click "Generate Captions"
- **Expected:** Step progress shown (Register image → Run chain steps); captions displayed on success; errors shown on failure

---

## Test Suite 5 — Captions Page

### TC-5.1 Captions page loads (empty)
- Navigate to `/flavors/{id}/captions` for a flavor with 0 captions
- **Expected:** "No captions yet. Test this flavor to generate captions." empty state shown

### TC-5.2 Gallery view (default)
- Navigate to captions page; Gallery button is active by default
- **Expected:** URL has no `?view=` param or `?view=gallery`; image thumbnails shown (if captions exist)

### TC-5.3 Table view
- Click "☰ Table"
- **Expected:** URL updates to `?view=table`; captions displayed in table format

### TC-5.4 Gallery view restoration
- Click "⊞ Gallery"
- **Expected:** URL updates back; gallery layout restored

### TC-5.5 Pagination (if >25 captions)
- For a flavor with many captions, verify page navigation controls appear and `?page=N` updates in URL

---

## Test Suite 6 — UI / UX

### TC-6.1 Dark mode
- Click "Set theme: Dark" button in sidebar
- **Expected:** Full dark theme applied immediately; persists on page navigation

### TC-6.2 Light mode
- Click "Set theme: Light"
- **Expected:** Light theme restored

### TC-6.3 System theme
- Click "Set theme: System"
- **Expected:** Follows OS preference

### TC-6.4 Sidebar navigation
- Click "🌶️ Flavors" in sidebar from any page
- **Expected:** Returns to `/flavors` list

### TC-6.5 Back navigation
- Click "← Back" from edit/steps/captions pages
- **Expected:** Returns to `/flavors` or appropriate parent page

---

## Known Limitations / Out-of-Scope

| Area | Notes |
|------|-------|
| Caption generation | Requires live `api.almostcrackd.ai` and valid Supabase session JWT — not fully testable in offline sandbox |
| File upload (S3) | Requires live presigned URL endpoint — network dependent |
| Performance under load | Not tested; consider adding rate-limit handling for Supabase `getUser()` at scale |

---

## Bug Fixed During Testing

**Bug:** `requireToolAccess()` in `src/lib/supabase/server.ts` called `redirect('/')` on ANY Supabase `getUser()` error, including transient network-level failures (DNS timeout, connection refused). This caused the user's session to appear expired and redirected them to the login page even when their auth cookies were still valid.

**Symptoms:** `POST /flavors/{id}/steps 303 in 63ms` — a redirect in 63ms is too fast for a real Supabase round-trip, indicating a network catch rather than an auth failure.

**Fix:** Wrapped `supabase.auth.getUser()` in a `try/catch` block. Network-level errors (`fetch failed`, `ENOTFOUND`, etc.) now throw an Error instead of redirecting to `/`. Auth-specific errors (invalid JWT, no session) still correctly redirect to the login page. Same pattern applied to `src/middleware.ts`.

**Files changed:**
- `src/lib/supabase/server.ts` — `requireToolAccess()` error handling
- `src/middleware.ts` — middleware session refresh error handling
