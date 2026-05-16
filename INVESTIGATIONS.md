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

### Fix

`acc288c` — added `overrides` to `package.json`:

```json
"overrides": {
  "next-intl": {
    "@swc/helpers": "^0.5.21"
  }
}
```

This hoists `@swc/helpers@0.5.21` to top-level `node_modules/@swc/helpers`, which satisfies the optional peer dep of nested `@swc/core@^1.15` directly — so the nested `next-intl/node_modules/@swc/helpers` entry is no longer needed in the lockfile. **Both npm 10 and npm 11 produce the same structural shape for this part of the lockfile**, so they converge.

Side-effect: top-level `@swc/helpers` went 0.5.15 → 0.5.21. `next` declares `0.5.15` (pinned exact), but is now using the hoisted 0.5.21 — a six-patch bump within 0.5.x, no API change. Build and tests pass.

The cosmetic `fsevents dev:true` drift still happens between npm 10 and npm 11, but it does not break `npm ci` (verified in isolation).

### Verification

- `npm run build` succeeds with the new lockfile.
- `npm test` — 428 tests pass, 38 snapshots match.
- `npm ci` succeeds on both npm-10-generated and npm-11-generated lockfiles produced with the override in place.
- Re-running `npm install` produces zero lockfile drift (md5 stable).
- Simulated dependabot full flow: `npm 11 install --package-lock-only` after `next` version bump → resulting lockfile passes `npm ci` with npm 10.

### Alternative fix considered (not taken)

Move everything to npm 11 (upgrade local `npm install -g npm@11`, add `- run: npm install -g npm@11` after `setup-node` in both workflows, regenerate lockfile once). Eliminates all drift including the cosmetic fsevents one. Heavier change; not worth it while the npm 11 regressions remain open and the override fix is sufficient.

Dependabot does not expose an npm-version config, so converging to npm 10 there is not possible without self-hosted runners or switching to Renovate.

### Files touched

- `package.json` (+5 lines)
- `package-lock.json` (rewritten — net `+3 / -14` lines)
