# newTon — technology services website & CMS

A Next.js 16 / React 19 / TypeScript application with Tailwind CSS, Radix UI primitives, PostgreSQL tables, an editable CMS, and server-side administrator authentication. No invented customer statistics, certifications, testimonials, partnerships, or commercial prices are included.

## Start locally

Requires Node.js 24 LTS and npm. From this directory:

```powershell
npm ci
Copy-Item .env.example .env
npm run db:migrate
npm run db:seed
powershell -ExecutionPolicy Bypass -File scripts/provision-admin.ps1
npm run dev
```

The supplied `.env.example` enables an embedded PostgreSQL-compatible PGlite database for local development. Data persists in `.data/postgres`. Use **http://localhost:3000** (the origin must match `APP_URL`). The login route is **/adm-login**. After the first login, change the initial password at **/admin/security** to unlock **/admin/dashboard**.

The PowerShell provisioning helper prompts for a username and a unique password without echoing it or placing it in command history. You can choose `admin` as the username. Provisioning runs only when no administrator exists. No shared default password is embedded in source, frontend bundles, seeds, or production data. Initial passwords normally require at least 16 characters. An explicit `LOCAL_BOOTSTRAP=true` opt-in accepts an initial password of at least eight characters only with embedded local storage, no PostgreSQL connection, and a non-production environment. No temporary credential is embedded in the provisioning code. Production always requires a strong unique password. The initial credential is replaced on first login with a new password of at least 16 characters.

On other operating systems, inject `ADMIN_USERNAME` and `ADMIN_PASSWORD` through your terminal's secure secret mechanism, run `npm run admin:provision`, and unset both values. Do not put real credentials in version control. Subsequent administrators are created by an owner through the CMS.

Run migration, seed, and provisioning commands **before** starting the local server. PGlite's on-disk database is single-process; do not open the same data directory in a second process. Production uses PostgreSQL and does not have this limitation. Local embedded storage is explicitly disabled when `NODE_ENV=production`.

## Included routes

Public: `/`, `/about`, `/services`, `/solutions`, `/pricing`, `/industries`, `/contact`, `/privacy-policy`, `/terms-and-conditions`.

Service pages: `/services/custom-software-development`, `/services/web-development`, `/services/cloud-hosting`, `/services/cloud-migration`, `/services/managed-cloud-services`, `/services/server-management`, `/services/cybersecurity`, `/services/security-auditing`, `/services/devops-automation`.

Administration: `/adm-login`, `/admin/dashboard`, `/admin/content`, `/admin/sections`, `/admin/services`, `/admin/pricing`, `/admin/faqs`, `/admin/media`, `/admin/leads`, `/admin/settings`, `/admin/seo`, `/admin/security`, `/admin/users`.

## CMS operations

- **Website content:** Edit page headings, introductions, body copy, legal text, and SEO. Existing system route names cannot be changed. Solutions and industry entries use one `Title|Description` per line.
- **Company settings:** Edit the brand, logo, favicon, homepage headline and CTA, contact details, trust statements, process steps, default currency, and footer. Process steps use `Title|Description`. Blank email/WhatsApp fields hide those public contact options. The notification recipient remains private.
- **Homepage sections:** Edit headings, descriptions, image URLs, background, display order, and visibility. System section identifiers remain fixed.
- **Services:** Create or edit a service, set a unique URL slug, add features and FAQs, choose a division and icon, and publish. Draft entries are excluded from public navigation, listings, and direct service pages. FAQ JSON uses `[{"question":"Question?","answer":"Answer."}]`.
- **Pricing:** Edit amount, currency, interval, inclusions, add-ons, button text, highlight, order, related service, and visibility. Blank amount means “Contact for quote.” Each plan has its own configured currency; there is no exchange-rate conversion. Related service IDs are displayed in the service editor.
- **Inquiries:** Owner accounts can search/filter submissions, update status, add notes, permanently delete records after confirmation, and export CSV with formula-injection protection. Notification delivery status is shown in the inquiry detail.
- **Media:** Register HTTPS URLs or upload images to object storage. Copy asset URLs into content fields. Replacing an uploaded image means uploading a new asset, updating content references, then deleting the unused old asset. In-use images cannot be deleted. Files are decoded and re-encoded as WebP; SVGs use a restrictive shape allowlist and are rasterized. Remote URLs are used only as image sources; the server does not fetch them.
- **Security:** Change password, inspect/revoke your own sessions, and review the latest 100 audit events. Password changes revoke all earlier sessions.
- **Administrators:** Owners create owner/editor accounts and enable/disable other accounts. Disabling revokes sessions. Editors manage content but cannot access leads, company settings, or administrator provisioning. There is no public registration.

Content reads are dynamic and request-scoped. Saved edits appear on the next public request without a redeployment. Deliberately empty lists remain empty; the application does not reintroduce deleted starter content. Fallback content is used only when no database is configured, to support initial preview/builds.

## Production deployment

This project targets **Node.js hosting** (a container, VM, or a Next.js-compatible platform). It is not a static export and must not be deployed as static files. The Sites plugin's native runtime expects a Cloudflare Worker bundle; this unadapted Next.js Node server cannot be uploaded there directly.

1. Provision PostgreSQL and a least-privilege application database user. Use your provider's TLS connection string. Set `DATABASE_URL`; disable/remove `LOCAL_DATABASE`.
2. Set `APP_URL` to the exact public HTTPS origin. Set the deployment's Node runtime to 24. Terminate TLS at a trusted reverse proxy or managed host.
3. Install with `npm ci`. Apply the versioned SQL migrations with `npm run db:migrate`. Run `npm run db:seed` once for starter content. Seeds do not create administrators. Back up your database before future schema changes.
4. Inject a unique `ADMIN_USERNAME` and `ADMIN_PASSWORD` through your hosting secret manager for the one-time `npm run admin:provision` command. Remove those provisioning variables immediately afterward. Complete the mandatory password change after first login.
5. Configure the media and contact integrations described below.
6. Build with `npm run build` and serve with `npm start`, or deploy the standalone Docker image. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` **at build time**, and its secret at runtime. Never expose server secrets through `NEXT_PUBLIC_` variables.
7. Run the integration suite against an isolated local environment, then smoke-test the deployed public pages, authentication, a real storage upload, a contact submission, and email notification delivery.
8. Configure database backups, provider-level request limits, application monitoring, and any agreed data-retention process. Use `TRUST_PROXY=true` only if your proxy overwrites `X-Forwarded-For`; otherwise IP rate limiting deliberately shares a conservative bucket rather than trusting spoofable headers.

Example container build (the site key is public configuration, not a secret):

```sh
docker build --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=YOUR_PUBLIC_SITE_KEY -t newton-site .
docker run --env-file /secure/path/newton-production.env -p 3000:3000 newton-site
```

Run migrations and initial provisioning from your deployment pipeline with database connectivity before starting the image. The minimal runtime image does not contain development CLI tooling. Never bake `.env`, local databases, or credentials into the image; `.dockerignore` and output tracing exclusions omit them.

### Durable media storage

Set `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and `MEDIA_PUBLIC_URL` (HTTPS). For R2 or another compatible provider, also set `S3_ENDPOINT`. Use a private write credential limited to `PutObject` and `DeleteObject` for the bucket's `media/` prefix. Configure read delivery using your storage provider/CDN public asset URL. Do not grant public write or bucket-list permissions.

Uploads are limited to 5 MB and 40 million decoded pixels, resized within 2400×2400, and re-encoded without metadata. Local filesystem uploads are deliberately not used. Without storage credentials, HTTPS URL registration still works and uploads return a clear configuration error. Live object-storage integration must be tested with your bucket.

### Contact spam protection & email

Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` before building and `TURNSTILE_SECRET_KEY` at runtime. Register your production hostname with Cloudflare Turnstile. Production submissions fail closed if Turnstile has not been configured. Local development uses a honeypot and persistent database rate limits without requiring a CAPTCHA provider.

Optional email notifications use Resend. Set `RESEND_API_KEY`, `NOTIFY_FROM` with a verified sending domain, and the private **notification email** in Company settings. Inquiries are saved before sending mail. Failed or unconfigured notifications do not discard leads; administrators can inspect the notification status in the lead detail. No automatic retries are currently scheduled. This build does not send any test email without your configuration.

### Security model

Argon2id hashes (64 MiB, three iterations), random 256-bit session tokens stored only as hashes, HTTP-only SameSite=Strict cookies, Secure cookies in production, eight-hour expiry, per-session CSRF tokens for administrator requests, exact Origin checks on mutations, server-side role checks, PostgreSQL-backed rate limits, bounded JSON bodies, Zod validation, parameterized SQL, safe CSV encoding, and audit events for administrator changes. Rendered copy uses React text escaping, not raw HTML. Security headers restrict framing, scripts, media, and browser permissions.

Do not place a cache in front of authenticated HTML or API responses. Support personnel should use individual administrator accounts. Production deployment requires configuring TLS, proxy header trust, database permissions, backup retention, and storage access for your environment.

## Data model

Versioned migration files define `admin_users`, `sessions`, `site_settings`, `page_content`, `homepage_sections`, `services`, `pricing_plans`, `media_assets`, `contact_inquiries`, `faqs`, `audit_logs`, and `rate_limits`. Foreign keys connect sessions and audit events to users and plans/FAQs to services. Text fields and small repeatable feature lists are stored as typed JSON arrays. Application queries use parameterized SQL through `pg`; development uses the same SQL through PGlite.

## Checks

```sh
npm run typecheck
npm test
npm run build
npm audit
```

The integration test provisions an isolated PGlite database under `.data/tests/`, starts a temporary server on port 3107, and uses random, non-shared test credentials. Stop `npm run dev` before testing because Next.js uses a development build lock. The test checks all specified public routes, anonymous access restrictions, Origin/CSRF checks, initial password rotation, session revocation, service and pricing publishing, FAQ persistence, inquiry validation/storage/export, and role boundaries. Next.js can issue redirects and not-found boundaries inside streamed responses, which the tests account for.

## Go-live content

The brand is **newTon**. Contact details, actual prices, office address, external profiles, and client credentials are intentionally blank. Replace the editable legal-policy starter text with the company's actual legal entity, retention policy, jurisdiction, and service-provider disclosures before publication. No official AWS, Azure, or Google Cloud partnership is claimed.

Implementation references: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Next.js Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route).
