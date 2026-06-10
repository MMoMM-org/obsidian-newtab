# Security Policy

## Reporting a Vulnerability

If you discover a security issue in New Tab, please **do not** open a public GitHub issue. Instead, email **marcus@mmomm.org** with:

- A clear description of the issue
- Steps to reproduce (or a proof-of-concept if applicable)
- The New Tab version + Obsidian version + OS

I aim to respond within 7 days. Coordinated disclosure is appreciated for issues that affect user vault contents or credential handling.

---

## What ships to your vault

New Tab is an Obsidian plugin. Only the bundled `main.js` (built with esbuild) runs inside Obsidian. Build/test/CI tooling **never executes in the user environment**.

### Production dependencies (bundled in `main.js`)

<!-- List every runtime dependency with one-line purpose. Keep in sync with package.json `dependencies`. -->

| Package | Purpose |
|---|---|
| _none_ | _Plugin currently has no runtime dependencies._ |

These are the only packages whose vulnerabilities can affect users in their vaults.

### Build/test/CI dependencies (never shipped)

`vitest`, `vite` (transitive), `esbuild`, `typescript`, `semantic-release`, `jsdom`, ESLint plugins, etc. — these run only on the maintainer's machine and in GitHub Actions. They never reach a user's Obsidian instance.

---

## Dependabot alert triage

GitHub Dependabot scans the full `package-lock.json` and may surface alerts for **transitive dependencies** that are not part of the shipped bundle. Triage policy:

| Alert location | User-impact | Action |
|---|---|---|
| Direct production dep with exploitable surface | **HIGH** | Fix immediately, release patch |
| Direct production dep, vulnerability in unused feature | Low | Track, fix at next regular update |
| Transitive of production dep, unused feature | Low | Track, upgrade via parent dep |
| Build/test/CI tooling | None | Auto-merge Dependabot patch bumps |

---

## Supported versions

Only the latest minor version receives security patches. New Tab follows semantic versioning; the most recent release on `master` is the only supported branch.
