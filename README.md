# Budget Flow Pro

Budget Flow Pro is the single merged app identity for this project.

## Merge note

**Budget Planner Premium+ has been merged into Budget Flow Pro.**

Use **Budget Flow Pro** everywhere going forward for:
- app name
- installed PWA name
- browser title
- Netlify deployment
- nevels1953.com
- receipt scanner
- OCR reader
- PDF export
- cloud backup
- expense categories
- admin dashboard
- Stripe subscription preparation

Budget Planner Premium+ should be treated as an older/alternate name and should not be used as a separate public app.

## Private beta deployment

This app is intended to run at:

```text
https://nevels1953.com
```

Recommended Netlify settings:

- Base directory: leave empty
- Build command: `echo 'Deploying Budget Flow Pro'`
- Publish directory: `.`
- Custom domain: `nevels1953.com`

## Private testing visibility

The app currently includes `noindex`, `nofollow`, and `noarchive` metadata so it can be tested privately before public launch.

## Camera/OCR testing

Camera access requires HTTPS. Test on:

- `https://nevels1953.com`
- Netlify HTTPS preview URL
- localhost during development

Plain HTTP will usually block the camera.

---

# Production SaaS / Native App Roadmap

This roadmap is the canonical plan for turning Budget Flow Pro into a production SaaS platform and native iPhone/Android app.

## Target product

Budget Flow Pro should become a secure multi-user budgeting, receipt scanning, expense reporting, and business/accountant platform.

## Phase 1 — Production backend

Recommended backend: **Supabase**.

Required backend features:
- Supabase Auth for email/password and magic-link login
- User profiles table
- Receipts table
- Receipt image storage bucket
- Expense categories table
- Business/team workspace table
- Team membership table
- Accountant/client relationship table
- Row Level Security policies for all user data
- Cloud sync from local beta receipts into Supabase
- Backup/restore endpoint for beta migration

Suggested tables:

```sql
profiles(id uuid primary key references auth.users(id), email text, full_name text, created_at timestamptz default now());
workspaces(id uuid primary key default gen_random_uuid(), name text not null, owner_id uuid references auth.users(id), type text default 'personal', created_at timestamptz default now());
workspace_members(id uuid primary key default gen_random_uuid(), workspace_id uuid references workspaces(id), user_id uuid references auth.users(id), role text default 'member', created_at timestamptz default now());
expense_categories(id uuid primary key default gen_random_uuid(), workspace_id uuid references workspaces(id), name text not null, color text, created_at timestamptz default now());
receipts(id uuid primary key default gen_random_uuid(), workspace_id uuid references workspaces(id), user_id uuid references auth.users(id), vendor text, amount numeric(12,2), category_id uuid references expense_categories(id), receipt_date date, image_path text, ocr_text text, ai_summary jsonb, created_at timestamptz default now());
accountant_clients(id uuid primary key default gen_random_uuid(), accountant_workspace_id uuid references workspaces(id), client_workspace_id uuid references workspaces(id), status text default 'active', created_at timestamptz default now());
```

## Phase 2 — Stripe subscriptions

Recommended product tiers:

- Free Trial — private beta/testing
- Personal Pro — individual users
- Business Pro — small business/team users
- Accountant Edition — accountants managing multiple clients

Required Stripe features:
- Stripe Checkout
- Stripe Customer Portal
- Webhook endpoint
- Subscription status stored on workspace
- Trial period support
- Feature gating by plan
- Hidden checkout during private beta until launch

Required webhook events:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Phase 3 — AI financial assistant

Recommended AI assistant features:
- AI receipt parsing
- Vendor cleanup
- Category prediction
- Duplicate receipt detection
- Monthly spending summaries
- Budget alerts
- Tax/category suggestions
- Accountant-ready insights
- Plain-English financial Q&A over the user’s receipts and budgets

Important production rule:
AI features should run server-side so API keys are never exposed in browser code.

## Phase 4 — Native iPhone / Android app

Recommended path: **Capacitor** wrapping the production PWA.

Native app requirements:
- iOS bundle id: `com.nevels.budgetflowpro`
- Android package id: `com.nevels.budgetflowpro`
- App name: `Budget Flow Pro`
- Camera permission
- Photo library/storage permission where needed
- App icons and splash screens
- Secure HTTPS backend only
- TestFlight beta build
- Google Play internal testing build
- Production privacy policy
- Terms of service
- Support URL

## Phase 5 — Accountant / Business Edition

Required features:
- Business workspaces
- Invite users to workspace
- Assign roles: owner, admin, member, accountant, viewer
- Accountant dashboard
- Client list
- Monthly reports
- PDF/CSV exports
- Shared receipt inbox
- Audit trail
- Notes/comments on receipts
- Tax category mapping

## Phase 6 — Shared team budgeting platform

Required features:
- Team budgets
- Department/category budgets
- Spending limits
- Approval workflow
- Shared receipt capture
- Team analytics
- Exportable reports
- Role-based permissions

## External accounts required before implementation can be completed

These cannot be created or connected from this repository alone:

- Supabase project and API keys
- Stripe account, products, prices, and webhook secret
- Apple Developer account
- Google Play Developer account
- App store screenshots/icons
- Privacy policy and terms URLs
- Production domain and SSL verification

## Launch policy

Keep the current private beta hidden from search until launch by retaining:

```html
<meta name="robots" content="noindex,nofollow,noarchive" />
```

Remove that only when ready for public discovery.
