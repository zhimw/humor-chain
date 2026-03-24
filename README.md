# Prompt Chain Tool

A Next.js 14 App Router admin tool for managing **humor flavors** and their **LLM prompt chain steps**, built on Supabase.

## Tech Stack

- **Framework**: Next.js 14 (App Router, Server Components, Server Actions)
- **Auth & Database**: Supabase with `@supabase/ssr` (cookie-based SSR auth)
- **Styling**: Plain CSS (`globals.css`) — no Tailwind, no component libraries
- **Deployment**: Vercel

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local` and fill in your values:

```bash
# Required — Supabase project credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# External caption API
NEXT_PUBLIC_API_BASE_URL=https://api.almostcrackd.ai
API_SECRET_KEY=your-api-secret-key   # server-side only, sent as Bearer token
```

> ⚠️ **Never** add `SUPABASE_SERVICE_ROLE_KEY` — the app uses only the anon key with RLS.

### 3. Configure Supabase Auth

In your Supabase project → Authentication → URL Configuration:

- **Site URL**: `http://localhost:3000` (dev) / your production URL
- **Redirect URLs**: add `http://localhost:3000/auth/callback` and your production callback URL

Enable **Google** as an OAuth provider.

### 4. Run locally

```bash
npm run dev
```

---

## Access Control

The tool requires the authenticated user's `profiles` row to have either:
- `is_superadmin = true`, **or**
- `is_matrix_admin = true`

Users who sign in but lack these flags see an "Access Denied" screen with instructions to request access.

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Login gate / access denied / redirect to `/flavors` |
| `/flavors` | List all humor flavors with step counts |
| `/flavors/[id]/edit` | Edit flavor slug and description |
| `/flavors/[id]/steps` | Manage prompt chain steps (add, edit, delete, reorder) |
| `/flavors/[id]/test` | Test flavor by generating captions via the external API |
| `/flavors/[id]/captions` | Paginated list of captions for a flavor |

---

## External API

The test page calls `POST https://api.almostcrackd.ai/captions` via the internal route `/api/test-flavor`.

**Request body:**
```json
{
  "humor_flavor_id": 42,
  "image_url": "https://example.com/image.jpg"
}
```

**Auth**: The `API_SECRET_KEY` env var is sent as `Authorization: Bearer <key>`.

---

## Project Structure

```
src/
  middleware.ts                    # Session refresh on every request
  lib/supabase/
    client.ts                      # Browser Supabase client
    server.ts                      # Server client + requireToolAccess()
  app/
    globals.css                    # All styles and utility classes
    layout.tsx                     # Root layout with sidebar
    page.tsx                       # Login gate
    api/
      auth/signin/route.ts         # Google OAuth initiation
      auth/signout/route.ts        # Sign out
      test-flavor/route.ts         # Proxy to external API
    auth/callback/route.ts         # OAuth callback
    flavors/
      page.tsx                     # Flavor list
      actions.ts                   # create/update/delete flavor actions
      FlavorCreateModal.tsx
      FlavorDeleteButton.tsx
      [id]/
        edit/page.tsx
        edit/EditFlavorForm.tsx
        steps/page.tsx
        steps/actions.ts           # add/update/delete/move step actions
        steps/StepsManager.tsx
        steps/StepForm.tsx
        test/page.tsx
        test/TestFlavorForm.tsx
        captions/page.tsx
    components/
      NavLink.tsx
      SidebarAuth.tsx              # User email + sign-out (client)
      ThemeToggle.tsx              # Dark/Light/System toggle (client)
      DeleteButton.tsx             # Confirm-before-delete button (client)
      SavedToast.tsx               # Success notification (client)
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import repo in Vercel
3. Add all env vars in Vercel project settings
4. **Do not** enable Deployment Protection (leave default off)
5. Add the Vercel production URL to Supabase Auth redirect URLs
