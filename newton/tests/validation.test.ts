import { test } from "node:test";
import assert from "node:assert/strict";
import { allowLocalBootstrap } from "../src/lib/bootstrap";
test("Temporary bootstrap is restricted to explicit embedded local development", () => {
  const env = {
    LOCAL_BOOTSTRAP: "true",
    LOCAL_DATABASE: "true",
    NODE_ENV: "development",
  };
  assert.equal(allowLocalBootstrap(env), true);
  assert.equal(allowLocalBootstrap({ ...env, NODE_ENV: "production" }), false);
  assert.equal(
    allowLocalBootstrap({
      ...env,
      DATABASE_URL: "postgresql://example/database",
    }),
    false,
  );
  assert.equal(
    allowLocalBootstrap({ ...env, LOCAL_BOOTSTRAP: "false" }),
    false,
  );
});
import {
  safeUrl,
  csvCell,
  inquirySchema,
  schemas,
} from "../src/lib/validation";
test("URLs reject executable schemes and embedded credentials", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:image/svg+xml,<svg/>",
    "http://example.com/a",
    "https://user:password@example.com/image",
  ])
    assert.equal(safeUrl.safeParse(url).success, false);
  assert.equal(
    safeUrl.safeParse("https://cdn.example.com/photo.webp").success,
    true,
  );
});
test("CSV neutralizes spreadsheet formula injection and quotes correctly", () => {
  for (const v of [
    "=1+1",
    "+SUM(A1:A2)",
    "-1+2",
    "@SUM(1)",
    "  =cmd",
    "\t=cmd",
  ])
    assert.ok(csvCell(v).startsWith("\"'"));
  assert.equal(csvCell('hello,"world"'), '"hello,""world"""');
});
test("Inquiries require consent and meaningful project details", () => {
  const inquiry = {
    name: "Sample Person",
    company: "Example Company",
    email: "example@example.com",
    phone: "",
    country: "India",
    service: "Cloud migration",
    description: "We need to assess and migrate our existing infrastructure.",
    budget: "",
    consent: true,
  };
  assert.equal(inquirySchema.safeParse(inquiry).success, true);
  assert.equal(
    inquirySchema.safeParse({ ...inquiry, consent: false }).success,
    false,
  );
  assert.equal(
    inquirySchema.safeParse({ ...inquiry, description: "short" }).success,
    false,
  );
});
test("Pricing supports quote defaults and rejects unsupported currencies", () => {
  const p = {
    name: "Plan",
    description: "",
    amount: null,
    currency: "INR",
    interval: "month",
    features: [],
    addons: [],
    cta: "Request a quote",
    popular: false,
    position: 0,
    visible: false,
    service_id: null,
  };
  assert.equal(schemas.pricing.safeParse(p).success, true);
  assert.equal(
    schemas.pricing.safeParse({ ...p, currency: "BTC" }).success,
    false,
  );
  assert.equal(schemas.pricing.safeParse({ ...p, amount: -1 }).success, false);
});
