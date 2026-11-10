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

Product selling prices are configured per product in **Inventory → Edit** (or **Add Soap Variety**): set independent 1 L and 0.5 L prices. Container sizes in the sales register use these prices for half-liter increments; custom quantities that are not half-liter increments use the 1 L rate proportionally. Every sale records liters dispensed and the ETB amount charged.

For an already-migrated Supabase database, apply this additive product-pricing migration in the SQL Editor before deploying the version that saves 0.5 L prices:

```sql
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price_per_half_liter NUMERIC;
```

## Supabase setup and existing data

1. Back up your existing database. Before deploying this version, export each device's local JSON backup from the old app; after deployment, the sign-in screen also offers an export of any remaining legacy local data. Legacy local records are not automatically attached to a new account, to avoid exposing data from another user on a shared device.
2. In Supabase Auth settings, enable email/password and choose the email-confirmation behavior you need.
3. Run [`supabase_schema.sql`](./supabase_schema.sql) in the SQL editor. It adds shop membership, per-shop row-level security, transactional sale/void/repayment functions, and supporting columns.
4. Existing rows are assigned to the fixed legacy shop ID `11111111-1111-4111-8111-111111111111`. In Supabase Auth, create the owner user first. Then, in the SQL editor, add that user's UUID to `shop_members` with the legacy shop ID and role `owner`, and update the `shops` name. Do this before signing into the app with that account. Never disable RLS or add public read/write policies to make setup easier.
5. In **Authentication → URL Configuration**, set the Site URL to the deployed app URL (for this GitHub Pages project, `https://getachewabebe.github.io/HemenLargo/`) and add that URL to the Redirect URLs allow list. Signup confirmation returns to the page where registration started, so add your local development URL (for example, `http://localhost:5173/**`) too if you test signup locally. Then register an owner with a unique email address.
6. Deploy the site over HTTPS. Confirm one shop cannot read or modify another shop's rows before adding additional accounts.

Newly registered users automatically receive a new shop. Existing user accounts from the old local PIN login are not migrated; create Supabase Auth accounts and remove old browser-local credentials by signing in once.

### Upgrading an existing database

`supabase_schema.sql` is safe to re-run; it is the migration. **Run it in the SQL Editor before deploying an app version that depends on it.** The current app calls `upsert_product`, `restock_product` and `create_manual_debt`; until the schema has been re-run, product edits, restocks and manual debts will appear under **Settings → Sync issues**.

### Roles: owner and cashier

Each user belongs to one shop with the role `owner` or `cashier` (`shop_members.role`).

| Action | Owner | Cashier |
| --- | --- | --- |
| Record sales (cash or credit), record debt repayments, add manual debts, add expenses | ✅ | ✅ |
| Add/edit/delete products, restock tanks | ✅ | ❌ |
| Void sales, delete expenses or debts, clear sales, change shop settings | ✅ | ❌ |
| Read the audit log | ✅ | ❌ |

The database enforces these rules; the app also hides or blocks owner-only actions for cashiers. To add a cashier, create the user in Supabase Auth, then in the SQL editor:

```sql
INSERT INTO shop_members (user_id, shop_id, role)
VALUES ('<cashier auth user id>', '<shop id>', 'cashier');
```

Add the cashier **before** they sign in for the first time; otherwise the app creates a separate shop for them.

### Audit log

`audit_log` keeps an append-only record of restocks, voids, and a full copy of every deleted product, sale, debt, payment and expense (including rows removed by **Clear Sales**). Owners can query it in the SQL editor, for example:

```sql
SELECT created_at, user_id, action, table_name, record_id, details
FROM audit_log ORDER BY created_at DESC LIMIT 50;
```

### How stock stays consistent across devices

Stock is only changed on the server by relative amounts: sales subtract, voids and restocks add. Editing a product's name or price never sends a stock number for an existing product, so a device with out-of-date stock cannot overwrite sales or restocks made on another device.

Restocking with a batch cost updates the product's cost per liter to the **weighted average** of the liters already in the tank and the new batch (for example, 50 L @ 60 + 10 L @ 90 → 65 per liter), so profit on remaining stock stays accurate.

### Password reset

**Forgot password?** on the sign-in screen emails a reset link. The link returns to the app's Site URL (configured in step 5 above), where the user chooses a new password before continuing. Customize the email under **Authentication → Email Templates → Reset Password** if needed.

## GitHub Pages production deployment

The workflow in [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) runs lint, tests, validates the Supabase project settings, builds the app, and deploys to GitHub Pages when changes are pushed to `main`.

Before deploying, add these repository Actions secrets under **Settings → Secrets and variables → Actions**:

- `VITE_SUPABASE_URL`: the Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: the Supabase publishable/anon client key.

These `VITE_` values are embedded into the public frontend bundle at build time. The key must be a publishable/anon key protected by the database's RLS policies; never use a Supabase service-role or secret key. The workflow fails before deployment if the settings are missing or a service-role key is detected. After setting the secrets, run the workflow from **Actions → Deploy to GitHub Pages → Run workflow**, or push to `main`.

In **Settings → Pages**, select **GitHub Actions** as the build and deployment source. Configure the `github-pages` environment with any required approval rules if production releases should require review.

## Offline behavior

Production builds include a Content-Security-Policy that only allows scripts from the app itself and network requests to the configured Supabase project. The app asks the browser for persistent storage so offline sales and the sync outbox are not evicted under storage pressure.

The production service worker pre-caches the app shell and build assets. Every change is first saved to a per-shop outbox in the browser and then sent to the cloud in order, so a closed tab, restart, or dropped connection never loses a change, and changes reach the cloud in the order they were made. Requests time out after 20 seconds and are retried later. All cloud operations are idempotent, so a change re-sent after a crash is not applied twice. Live updates from other devices are paused until the outbox is empty.

If the cloud **rejects** a change (for example, a sale recorded offline for stock that another device already sold, or an owner-only action on a cashier device), it is moved to **Settings → Sync issues** instead of blocking later changes. From there you can retry it, discard it (the device then reloads the cloud's data), or export the list as JSON. The footer distinguishes synced, pending, offline, and sync-issue states. Do not clear browser site data while pending changes remain. Offline receipts and changes are device-local until sync completes.

## Backups

### Automatic nightly database backup

[`.github/workflows/backup.yml`](./.github/workflows/backup.yml) runs every night at 00:30 Addis Ababa time (and on demand from **Actions → Nightly database backup → Run workflow**). It dumps the `public` schema, compresses it, **encrypts it with AES-256**, and keeps it as a workflow artifact for 90 days. It is encrypted because anyone signed in to GitHub can download artifacts from a public repository.

Add these repository secrets:

- `SUPABASE_DB_URL`: the **Session pooler** connection string from **Project Settings → Database → Connection string** (GitHub runners have no IPv6, so the direct `db.<ref>.supabase.co` host does not work). Include the database password.
- `BACKUP_PASSPHRASE`: a long random passphrase (at least 20 characters). Keep a copy somewhere safe outside GitHub; without it the backups cannot be decrypted.

To restore, download the artifact and run:

```sh
gpg --decrypt sukie-backup-<date>.sql.gz.gpg | gunzip | psql "<target database url>"
```

Practice a restore into a spare Supabase project once, so you know it works before you need it.

### Device backups

This device keeps the most recent 180 days of sales (fewer if browser storage fills up); the cloud keeps the full history. The **Export Backup** button in Settings exports everything currently loaded in the app, not just the device cache.

Use the in-app JSON export regularly and store backups outside the device. Imports update the local shop cache only; verify imported data before choosing how to reconcile it with cloud records. Local storage and browser backups are not substitutes for Supabase database backups.

## Validation

- `npm test` runs the unit tests.
- `npm run lint` runs Oxlint.
- `npm run test:db` applies `supabase_schema.sql` twice to a throwaway Postgres container and checks stock handling, roles, the audit log and shop isolation (requires Docker and `psql`).
- `npm run build` produces the production bundle and asset manifest consumed by the service worker.
