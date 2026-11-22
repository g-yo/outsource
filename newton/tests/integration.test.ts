import { settings as defaultSettings } from "../src/lib/defaults";
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
const base = "http://127.0.0.1:3107";
test(
  "Database-backed website and secure CMS workflows",
  { timeout: 240000 },
  async (t) => {
    const password = randomBytes(24).toString("base64url"),
      newPassword = randomBytes(24).toString("base64url");
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: "development",
      DATABASE_URL: "",
      LOCAL_DATABASE: "true",
      LOCAL_DATA_DIR: resolve(".data/tests/" + Date.now()),
      APP_URL: base,
      ADMIN_USERNAME: "integration-owner",
      ADMIN_PASSWORD: password,
      RESEND_API_KEY: "",
      TURNSTILE_SECRET_KEY: "",
      S3_BUCKET: "",
      TRUST_PROXY: "false",
    };
    for (const script of ["migrate", "seed", "provision"]) {
      const r = spawnSync(
        process.execPath,
        ["--import", "tsx", `scripts/${script}.ts`],
        { env, encoding: "utf8", windowsHide: true },
      );
      assert.equal(r.status, 0, r.stderr);
    }
    const fixtureRead = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        "-e",
        "const {query}=require('./src/lib/db.ts');Promise.all([query('SELECT * FROM page_content WHERE slug=$1',['about']),query('SELECT * FROM homepage_sections WHERE slug=$1',['services'])]).then(x=>{console.log(JSON.stringify(x));process.exit(0)}).catch(()=>process.exit(1));",
      ],
      { env, encoding: "utf8", windowsHide: true },
    );
    assert.equal(fixtureRead.status, 0, fixtureRead.stderr);
    const fixtures = JSON.parse(fixtureRead.stdout);
    const server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "dev",
        "--port",
        "3107",
        "--hostname",
        "127.0.0.1",
      ],
      { env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true },
    );
    let log = "";
    server.stdout.on("data", (c) => {
      log += c;
    });
    server.stderr.on("data", (c) => {
      log += c;
    });
    let cookie = "",
      csrf = "";
    async function call(
      path: string,
      data?: unknown,
      opts: {
        cookie?: string;
        csrf?: string;
        origin?: string;
        method?: string;
      } = {},
    ) {
      const headers: Record<string, string> = { Origin: opts.origin ?? base };
      const useCookie = opts.cookie ?? cookie;
      if (useCookie) headers.Cookie = useCookie;
      const token = opts.csrf ?? csrf;
      if (token) headers["x-csrf-token"] = token;
      if (data !== undefined) headers["Content-Type"] = "application/json";
      return fetch(base + path, {
        method: opts.method || (data === undefined ? "GET" : "POST"),
        headers,
        body: data === undefined ? undefined : JSON.stringify(data),
        redirect: "manual",
      });
    }
    async function expectRedirect(r: Response, target: string) {
      if (r.status === 307 || r.status === 308) {
        assert.ok(r.headers.get("location")?.includes(target));
        return;
      }
      const html = await r.text();
      assert.ok(
        html.includes("NEXT_REDIRECT") && html.includes(target),
        "Expected server or streamed redirect to " + target,
      );
    }
    async function expectNotFound(r: Response) {
      if (r.status === 404) return;
      assert.ok(
        (await r.text()).includes("PAGE NOT FOUND"),
        "Expected not-found page",
      );
    }
    async function signIn(username: string, pw: string) {
      const r = await call(
        "/api/auth/login",
        { username, password: pw },
        { cookie: "", csrf: "" },
      );
      assert.equal(r.status, 200, await r.clone().text());
      cookie = r.headers.get("set-cookie")!.split(";")[0];
      return r.json();
    }
    async function token() {
      const r = await call("/admin/security");
      const html = await r.text();
      const m = html.match(/csrf\\?":\\?"([A-Za-z0-9_-]+)"?/);
      assert.ok(m, "CSRF token must be passed to authenticated security form");
      csrf = m[1];
      return html;
    }
    async function post(path: string, data: unknown, status = 200) {
      const r = await call(path, data);
      const d = await r.json();
      assert.equal(r.status, status, JSON.stringify(d));
      return d;
    }
    try {
      let ready = false;
      for (let i = 0; i < 100; i++) {
        try {
          const r = await fetch(base + "/adm-login");
          if (r.status === 200) {
            ready = true;
            break;
          }
        } catch {}
        await new Promise((r) => setTimeout(r, 500));
      }
      assert.ok(ready, log);
      await t.test("All required public pages render", async () => {
        for (const path of [
          "/",
          "/about",
          "/services",
          "/solutions",
          "/pricing",
          "/industries",
          "/contact",
          "/privacy-policy",
          "/terms-and-conditions",
          "/services/custom-software-development",
          "/services/web-development",
          "/services/cloud-hosting",
          "/services/cloud-migration",
          "/services/managed-cloud-services",
          "/services/server-management",
          "/services/cybersecurity",
          "/services/security-auditing",
          "/services/devops-automation",
          "/sitemap.xml",
          "/robots.txt",
        ]) {
          const r = await call(path);
          assert.equal(r.status, 200, path);
        }
      });
      await t.test(
        "Unauthenticated admin pages redirect and API rejects",
        async () => {
          for (const path of [
            "/admin/dashboard",
            "/admin/content",
            "/admin/leads",
            "/admin/security",
            "/admin/users",
          ]) {
            const r = await call(path);
            await expectRedirect(r, "/adm-login");
          }
          await post(
            "/api/admin/services",
            { action: "create", data: {} },
            401,
          );
        },
      );
      await t.test(
        "Login rejects cross-origin requests and bad passwords",
        async () => {
          assert.equal(
            (
              await call(
                "/api/auth/login",
                { username: "integration-owner", password },
                { origin: "https://attacker.invalid" },
              )
            ).status,
            403,
          );
          await post(
            "/api/auth/login",
            { username: "integration-owner", password: "wrong" },
            401,
          );
        },
      );
      await t.test(
        "First login forces password rotation and revokes old session",
        async () => {
          const d = await signIn("integration-owner", password);
          assert.match(d.redirect, /security/);
          await expectRedirect(
            await call("/admin/dashboard"),
            "/admin/security",
          );
          await token();
          await post(
            "/api/admin/services",
            { action: "create", data: {} },
            403,
          );
          const old = cookie;
          const r = await call("/api/auth/password", {
            currentPassword: password,
            newPassword,
          });
          assert.equal(r.status, 200, await r.clone().text());
          cookie = r.headers.get("set-cookie")!.split(";")[0];
          await expectRedirect(
            await call("/admin/dashboard", undefined, { cookie: old }),
            "/adm-login",
          );
          await token();
          assert.equal((await call("/admin/dashboard")).status, 200);
        },
      );
      await t.test(
        "CSRF protection rejects missing or incorrect tokens",
        async () => {
          assert.equal(
            (
              await call(
                "/api/admin/services",
                { action: "create", data: {} },
                { csrf: "invalid" },
              )
            ).status,
            403,
          );
        },
      );
      await t.test(
        "Page, section, and company editors persist without leaking private configuration",
        async () => {
          const page = fixtures[0][0],
            section = fixtures[1][0];
          await post("/api/admin/content", {
            action: "update",
            id: page.id,
            data: { ...page, title: "Integration about title" },
          });
          assert.match(
            await (await call("/about")).text(),
            /Integration about title/,
          );
          await post("/api/admin/content", {
            action: "update",
            id: page.id,
            data: page,
          });
          await post("/api/admin/sections", {
            action: "update",
            id: section.id,
            data: {
              ...section,
              title: "Integration homepage section",
              visible: true,
            },
          });
          assert.match(
            await (await call("/")).text(),
            /Integration homepage section/,
          );
          await post("/api/admin/sections", {
            action: "update",
            id: section.id,
            data: {
              ...section,
              title: "Integration homepage section",
              visible: false,
            },
          });
          assert.doesNotMatch(
            await (await call("/")).text(),
            /Integration homepage section/,
          );
          await post("/api/admin/sections", {
            action: "update",
            id: section.id,
            data: section,
          });
          await post("/api/admin/settings", {
            action: "update",
            data: {
              ...defaultSettings,
              heroTitle: "Integration headline",
              notificationEmail: "private-test@example.invalid",
            },
          });
          const html = await (await call("/")).text();
          assert.match(html, /Integration headline/);
          assert.doesNotMatch(html, /private-test@example.invalid/);
          await post("/api/admin/settings", {
            action: "update",
            data: defaultSettings,
          });
        },
      );
      await t.test(
        "Referenced assets cannot be deleted and unsafe SVG uploads are rejected",
        async () => {
          const url = "https://assets.example.invalid/logo.webp";
          const m = await post("/api/admin/media", {
            action: "create",
            data: { name: "Referenced logo", url, alt: "Logo" },
          });
          await post("/api/admin/settings", {
            action: "update",
            data: { ...defaultSettings, logo: url },
          });
          await post("/api/admin/media", { action: "delete", id: m.id }, 409);
          await post("/api/admin/settings", {
            action: "update",
            data: defaultSettings,
          });
          await post("/api/admin/media", { action: "delete", id: m.id });
          const form = new FormData();
          form.set(
            "file",
            new Blob(
              [
                '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
              ],
              { type: "image/svg+xml" },
            ),
            "unsafe.svg",
          );
          const r = await fetch(base + "/api/admin/upload", {
            method: "POST",
            headers: { Origin: base, Cookie: cookie, "x-csrf-token": csrf },
            body: form,
          });
          assert.equal(r.status, 400, await r.text());
        },
      );
      await t.test(
        "Services support draft, publish, edit, reorder and delete",
        async () => {
          const d = {
            slug: "integration-service",
            title: "Integration service",
            division: "Software engineering",
            description: "Test service description",
            body: "Detailed service body",
            audience: "Test audience",
            benefits: "Test benefits",
            process: "Discover → Build",
            icon: "code",
            image: "",
            features: ["Feature A"],
            faqs: [],
            seo_title: "",
            seo_description: "",
            published: false,
            position: 99,
          };
          const created = await post("/api/admin/services", {
            action: "create",
            data: d,
          });
          await expectNotFound(await call("/services/integration-service"));
          await post("/api/admin/services", {
            action: "update",
            id: created.id,
            data: {
              ...d,
              published: true,
              title: "Updated integration service",
              position: 1,
            },
          });
          const r = await call("/services/integration-service");
          assert.equal(r.status, 200);
          assert.match(await r.text(), /Updated integration service/);
          await post("/api/admin/services", {
            action: "delete",
            id: created.id,
          });
          await expectNotFound(await call("/services/integration-service"));
        },
      );
      await t.test(
        "Pricing changes appear on public pages and can be removed",
        async () => {
          const d = {
            name: "Integration plan",
            description: "Scoped test plan",
            amount: 1234,
            currency: "INR",
            interval: "month",
            features: ["Test inclusion"],
            addons: [],
            cta: "Request scope",
            popular: false,
            position: 99,
            visible: true,
            service_id: null,
          };
          const c = await post("/api/admin/pricing", {
            action: "create",
            data: d,
          });
          assert.match(
            await (await call("/pricing")).text(),
            /Integration plan/,
          );
          await post("/api/admin/pricing", {
            action: "update",
            id: c.id,
            data: { ...d, visible: false },
          });
          assert.doesNotMatch(
            await (await call("/pricing")).text(),
            /Integration plan/,
          );
          await post("/api/admin/pricing", { action: "delete", id: c.id });
        },
      );
      await t.test(
        "FAQ persistence and safe image URL validation",
        async () => {
          const d = {
            question: "Integration FAQ?",
            answer: "A persistent answer.",
            position: 999,
            visible: true,
          };
          const c = await post("/api/admin/faqs", {
            action: "create",
            data: d,
          });
          assert.match(await (await call("/")).text(), /Integration FAQ/);
          await post("/api/admin/faqs", { action: "delete", id: c.id });
          await post(
            "/api/admin/media",
            {
              action: "create",
              data: { name: "Unsafe", url: "javascript:alert(1)", alt: "" },
            },
            400,
          );
          const m = await post("/api/admin/media", {
            action: "create",
            data: {
              name: "Reference image",
              url: "https://example.com/test.webp",
              alt: "Test alt",
            },
          });
          await post("/api/admin/media", { action: "delete", id: m.id });
        },
      );
      await t.test(
        "Contact form validates, stores leads and safely exports CSV",
        async () => {
          const d = {
            name: "=Test formula",
            company: "Test Company",
            email: "integration@example.invalid",
            phone: "",
            country: "India",
            service: "Cloud migration",
            description:
              "Integration test inquiry for cloud migration services.",
            budget: "",
            consent: true,
            website: "",
          };
          await post("/api/contact", { ...d, consent: false }, 400);
          await post("/api/contact", d, 201);
          const leads = await call("/admin/leads");
          assert.match(await leads.text(), /=Test formula/);
          const csv = await call("/api/admin/leads?export=csv");
          assert.equal(csv.status, 200);
          assert.match(await csv.text(), /'=Test formula/);
        },
      );
      await t.test(
        "Editor roles cannot access private leads, settings or administrator changes",
        async () => {
          const editorPassword = randomBytes(24).toString("base64url");
          await post("/api/admin/users", {
            action: "create",
            username: "integration-editor",
            password: editorPassword,
            role: "editor",
          });
          await signIn("integration-editor", editorPassword);
          await token();
          const r = await call("/api/auth/password", {
            currentPassword: editorPassword,
            newPassword: randomBytes(24).toString("base64url"),
          });
          assert.equal(r.status, 200);
          cookie = r.headers.get("set-cookie")!.split(";")[0];
          await token();
          await post(
            "/api/admin/leads",
            { action: "delete", id: "11111111-1111-4111-8111-111111111111" },
            403,
          );
          await post(
            "/api/admin/settings",
            { action: "update", data: {} },
            403,
          );
          await post("/api/admin/users", { action: "create" }, 403);
          assert.equal((await call("/api/admin/leads?export=csv")).status, 403);
          assert.doesNotMatch(
            await (await call("/admin/leads")).text(),
            /=Test formula/,
          );
        },
      );
      await t.test("Logout revokes the session", async () => {
        await post("/api/auth/logout", {});
        await expectRedirect(await call("/admin/dashboard"), "/adm-login");
      });
    } finally {
      server.kill();
    }
  },
);
