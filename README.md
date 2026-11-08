# Sukie POS

Sukie is an offline-capable point-of-sale and shop management app for liquid soap sales. It includes inventory, sales, expenses, customer debts, receipts, and Ethiopian calendar formatting.

## Requirements

- Node.js 20.19+ or 22.12+ (required by the current Vite release)
- A Supabase project for sign-in and cloud sync

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the Supabase project's public API settings.
4. Run `npm run dev`.

The app requires a configured Supabase project. Local storage is used as a shop-scoped cache and write queue, not as authentication.

## Supabase setup and existing data

1. Back up your existing database. Before deploying this version, export each device's local JSON backup from the old app; after deployment, the sign-in screen also offers an export of any remaining legacy local data. Legacy local records are not automatically attached to a new account, to avoid exposing data from another user on a shared device.
2. In Supabase Auth settings, enable email/password and choose the email-confirmation behavior you need.
3. Run [`supabase_schema.sql`](./supabase_schema.sql) in the SQL editor. It adds shop membership, per-shop row-level security, transactional sale/void/repayment functions, and supporting columns.
4. Existing rows are assigned to the fixed legacy shop ID `11111111-1111-4111-8111-111111111111`. In Supabase Auth, create the owner user first. Then, in the SQL editor, add that user's UUID to `shop_members` with the legacy shop ID and role `owner`, and update the `shops` name. Do this before signing into the app with that account. Never disable RLS or add public read/write policies to make setup easier.
5. In **Authentication → URL Configuration**, set the Site URL to the deployed app URL (for this GitHub Pages project, `https://getachewabebe.github.io/HemenLargo/`) and add that URL to the Redirect URLs allow list. Signup confirmation returns to the page where registration started, so add your local development URL (for example, `http://localhost:5173/**`) too if you test signup locally. Then register an owner with a unique email address.
6. Deploy the site over HTTPS. Confirm one shop cannot read or modify another shop's rows before adding additional accounts.

Newly registered users automatically receive a new shop. Existing user accounts from the old local PIN login are not migrated; create Supabase Auth accounts and remove old browser-local credentials by signing in once.

## GitHub Pages production deployment

The workflow in [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) runs lint, tests, validates the Supabase project settings, builds the app, and deploys to GitHub Pages when changes are pushed to `main`.

Before deploying, add these repository Actions secrets under **Settings → Secrets and variables → Actions**:

- `VITE_SUPABASE_URL`: the Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: the Supabase publishable/anon client key.

These `VITE_` values are embedded into the public frontend bundle at build time. The key must be a publishable/anon key protected by the database's RLS policies; never use a Supabase service-role or secret key. The workflow fails before deployment if the settings are missing or a service-role key is detected. After setting the secrets, run the workflow from **Actions → Deploy to GitHub Pages → Run workflow**, or push to `main`.

In **Settings → Pages**, select **GitHub Actions** as the build and deployment source. Configure the `github-pages` environment with any required approval rules if production releases should require review.

## Offline behavior

The production service worker pre-caches the app shell and build assets. Data writes are kept in a per-shop browser outbox while the network is unavailable and are retried when connectivity returns. The footer distinguishes synced, pending, offline, and failed cloud states. Do not clear browser site data while pending changes remain. Offline receipts and changes are device-local until sync completes.

## Backups

Use the in-app JSON export regularly and store backups outside the device. Imports update the local shop cache only; verify imported data before choosing how to reconcile it with cloud records. Local storage and browser backups are not substitutes for Supabase database backups.

## Validation

- `npm test` runs the unit tests.
- `npm run lint` runs Oxlint.
- `npm run build` produces the production bundle and asset manifest consumed by the service worker.
