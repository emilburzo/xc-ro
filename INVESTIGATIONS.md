# Investigations

Long-form notes on tricky bugs and root-cause investigations. One section per investigation. Append new ones at the top.

---

## 2026-05-16: Dependabot PRs keep stripping `@swc/helpers` from `package-lock.json`

### Symptoms

- Every dependabot PR landed in this repo produced a `package-lock.json` missing the entry `node_modules/next-intl/node_modules/@swc/helpers`.
- Running `npm ci` locally (npm 10.8.2) on that lockfile failed:
  ```
  npm error code EUSAGE
  npm error Missing: @swc/helpers@0.5.21 from lock file
  ```
- CI jobs (`test`, `visual tests`) on those PRs failed at the `npm ci` step.
- The workaround had been: pull the PR, run `npm i` locally, commit the resulting diff as "fix package lock" (commit `89fdba2`). Repeat for each dependabot PR.
- Mistakenly attributed to `npm ci` itself "removing" the entry.

### Root cause

The cause is a **version mismatch between npm versions**, combined with **two open regressions in npm 11**:

| Actor | npm version | Behavior |
|---|---|---|
| Local dev (this repo) | 10.8.2 (Node 20) | Writes the optional-peer entry; requires it for `npm ci` |
| CI (`actions/setup-node@v4` with `node-version: 20`) | 10.x | Same as local |
| Dependabot updater container | 11.x (currently 11.14.x) | Strips the entry when regenerating the lockfile |

`npm ci` does **not** modify `package-lock.json` (verified — md5 unchanged before/after). What actually happens is npm 11 produces a different lockfile shape than npm 10, then npm 10's `npm ci` rejects it.

The npm 11 regressions:

- [npm/cli#8487](https://github.com/npm/cli/issues/8487) — introduced in npm 11.5.0 ([PR npm/cli#8431](https://github.com/npm/cli/pull/8431)). The "prune optional peer dependencies" change also incorrectly prunes optional dependencies *of* peer dependencies. This is the exact shape of our case: `next-intl` → depends on `@swc/core` → declares `@swc/helpers` as `peerDependenciesMeta.optional`.
- [npm/cli#9249](https://github.com/npm/cli/issues/9249) — npm 11.12.1. Over-pruning regression that also strips `"dev": true` from `playwright/node_modules/fsevents`. Cosmetic only — does not break `npm ci`.

Empirically bisected:

| npm version | `next-intl/.../@swc/helpers` entry | `playwright/.../fsevents` `dev:true` |
|---|---|---|
| 10.8.2 / 10.9.3 | kept | kept |
| 11.5.0 / 11.6.1 | **stripped** | kept |
| 11.14.1 (latest, dependabot) | **stripped** | **stripped** |

Both regressions were still open at time of investigation.

### First-attempt fix (BROKE the Docker build — superseded)

`4adeb1f` — added a nested-scope override:

```json
"overrides": {
  "next-intl": {
    "@swc/helpers": "^0.5.21"
  }
}
```

This hoisted `@swc/helpers@0.5.21` to top-level (its `>=0.5.17` satisfied `@swc/core`'s optional peer directly, no nested entry needed). Local build, tests, and `npm ci` on either npm-version's lockfile all passed.

**Then the production Docker container crashed on startup:**

```
Error: Cannot find module '/app/node_modules/@swc/helpers/esm/_interop_require_default.js'
    at /app/node_modules/next/dist/server/require-hook.js:57:36
```

Reproducible locally with `cd .next/standalone && node server.js`.

Cause: `@swc/helpers@0.5.17+` added a `"module-sync"` condition to its `package.json` exports field that points at `./esm/*.js`. In Node 20 (with `--experimental-require-module` defaulted on), `require("@swc/helpers/_/_interop_require_default")` resolves through the `"module-sync"` condition to the **ESM** `.js` file instead of the `.cjs` one — verified with `require.resolve` returning `.../esm/_interop_require_default.js`.

Next.js's standalone tracer (`nft`) does not handle the `"module-sync"` condition: it only copies the CJS resolutions of `@swc/helpers` into `.next/standalone/node_modules/@swc/helpers/cjs/` (3 files of the 438-file package). At runtime, the resolver looks for the ESM file and crashes.

With the pre-`acc288c` lockfile, top-level `@swc/helpers` was `0.5.15` (pinned by `next`), which has **no `"module-sync"` condition**, so `require()` correctly resolved to the CJS file the tracer had copied.

### Real fix

Change the override to pin `@swc/helpers` globally to `0.5.15`:

```json
"overrides": {
  "@swc/helpers": "0.5.15"
}
```

This:

- Forces every `@swc/helpers` in the tree to be `0.5.15`, the version `next` already pinned.
- Eliminates the nested `next-intl/node_modules/@swc/helpers` entry from the lockfile (npm doesn't add an entry for the optional peer when an override forbids any other version — the optional peer is simply unsatisfied, which is allowed).
- Both npm 10 and npm 11 produce the same lockfile shape — `npm ci` succeeds on either.
- Top-level `@swc/helpers` stays at `0.5.15`, which has no `"module-sync"` condition, so the standalone tracer's CJS-only copy is enough.

The version pin is deliberately exact (`"0.5.15"` not `"^0.5.15"`) so a patch-range bump to `0.5.17+` doesn't silently re-introduce the `"module-sync"` regression.

Cosmetic drift: npm 11 still strips `"dev": true` from `playwright/node_modules/fsevents` ([npm/cli#9249](https://github.com/npm/cli/issues/9249)). Verified in isolation — doesn't break `npm ci`.

### Verification

- `npm run build` succeeds on the new lockfile.
- `npm test` — 428 tests pass, 38 snapshots match.
- `cd .next/standalone && node server.js` boots Next.js cleanly (`✓ Starting...`).
- `npm ci` succeeds on both an npm-10-generated and an npm-11-bump-simulated lockfile.
- Simulated dependabot flow (bump `next` to `16.2.6` via npm 11) produces a lockfile with identical `@swc/helpers` shape; `npm ci` against it on npm 10 succeeds.

### Alternative fix considered (not taken)

Move everything to npm 11 (upgrade local `npm install -g npm@11`, add `- run: npm install -g npm@11` after `setup-node` in both workflows, regenerate lockfile once). Eliminates all drift including the cosmetic fsevents one. Heavier change; not worth it while the npm 11 regressions remain open and the override fix is sufficient.

Dependabot does not expose an npm-version config, so converging to npm 10 there is not possible without self-hosted runners or switching to Renovate.

### Files touched

- `package.json` (+5 lines)
- `package-lock.json` (rewritten — net `+3 / -14` lines)
