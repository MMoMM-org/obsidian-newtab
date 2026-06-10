#!/usr/bin/env node
// api-inspect.template.mjs
//
// Generic raw-HTTP diagnostic for an external API. Copy this file to
// scripts/<service>-inspect.mjs and customise BASE_URL, the auth scheme,
// and any request-shaping logic the service needs.
//
// Why: when an external-API integration breaks (wrong path, wrong
// content-type, missing scope, stale token), the SDK's error message is
// rarely actionable. Raw HTTP gives you status, headers, and body —
// usually enough to localise the bug in seconds. Ship this from day 1,
// not after the first 400 response.
//
// Usage:
//   node scripts/<service>-inspect.mjs <method> <path> [body-json]
// Examples:
//   node scripts/dropbox-inspect.mjs GET /2/users/get_current_account
//   node scripts/dropbox-inspect.mjs POST /2/files/list_folder '{"path":""}'

const BASE_URL = process.env.API_BASE_URL ?? "https://api.example.com";
const TOKEN = process.env.API_TOKEN;

if (!TOKEN) {
  console.error("Set API_TOKEN env var (export API_TOKEN=...)");
  process.exit(2);
}

const [, , method = "GET", path = "/", bodyArg] = process.argv;

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/json",
};

const init = { method, headers };

if (bodyArg) {
  headers["Content-Type"] = "application/json";
  init.body = bodyArg;
}

const url = `${BASE_URL}${path}`;
console.error(`→ ${method} ${url}`);
if (bodyArg) console.error(`  body: ${bodyArg}`);

const res = await fetch(url, init);

console.error(`← ${res.status} ${res.statusText}`);
console.error("  headers:");
for (const [k, v] of res.headers) console.error(`    ${k}: ${v}`);

const text = await res.text();
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2));
} catch {
  console.log(text);
}

process.exit(res.ok ? 0 : 1);
