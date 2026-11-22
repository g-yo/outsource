import { test } from "node:test";
import assert from "node:assert/strict";
import { isAllowedOrigin } from "../src/lib/origin";
test("development accepts equivalent loopback hosts on the actual server port", () => {
  for (const origin of [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://[::1]:3000",
  ])
    assert.equal(
      isAllowedOrigin(
        origin,
        "http://localhost:3000/api/auth/login",
        "http://localhost:3000",
        true,
      ),
      true,
    );
  assert.equal(
    isAllowedOrigin(
      "http://127.0.0.1:3001",
      "http://localhost:3001/api/auth/login",
      "http://localhost:3000",
      true,
    ),
    true,
  );
});
test("origin protection rejects external, missing, malformed, and mismatched-port requests", () => {
  for (const origin of [
    null,
    "null",
    "https://attacker.example",
    "http://localhost.attacker.example:3000",
    "http://127.0.0.1:4000",
    "https://localhost:3000",
    "http://localhost:3000/path",
  ])
    assert.equal(
      isAllowedOrigin(
        origin,
        "http://localhost:3000/api/auth/login",
        "http://localhost:3000",
        true,
      ),
      false,
    );
});
test("production only accepts the configured exact origin", () => {
  assert.equal(
    isAllowedOrigin(
      "https://newton.example",
      "http://localhost:3000/api/auth/login",
      "https://newton.example",
      false,
    ),
    true,
  );
  assert.equal(
    isAllowedOrigin(
      "http://127.0.0.1:3000",
      "http://localhost:3000/api/auth/login",
      "http://localhost:3000",
      false,
    ),
    false,
  );
});
