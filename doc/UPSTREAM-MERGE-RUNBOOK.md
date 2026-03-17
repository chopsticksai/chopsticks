# Upstream Merge Runbook

## Summary

This runbook is the operational checklist for merging upstream
`paperclipai/paperclip` changes into the Chopsticks fork.

Use this document to answer:

- which branch/remote to compare against
- which order to run merge steps in
- which audits must run before the PR is considered ready

This document is procedural. For normative rules, see:

- [`doc/MERGE-RENAME-RULES.md`](./MERGE-RENAME-RULES.md)
- [`doc/UI-LOCALIZATION.md`](./UI-LOCALIZATION.md)

## Terminology

- `upstream`: the canonical Paperclip repo, default remote `origin`
- `private fork`: the Chopsticks repo, default remote `private`
- `base branch`: the private-fork comparison target, usually `private/master`
- `UI-localized`: localized per [`doc/UI-LOCALIZATION.md`](./UI-LOCALIZATION.md)

## Source Docs To Read First

1. [`AGENTS.md`](../AGENTS.md)
2. [`doc/SPEC-implementation.md`](./SPEC-implementation.md)
3. [`doc/MERGE-RENAME-RULES.md`](./MERGE-RENAME-RULES.md)
4. [`doc/UI-LOCALIZATION.md`](./UI-LOCALIZATION.md)

## Recommended Flow

### 1. Confirm Roles and Fetch

- Confirm which remote is upstream and which is the private fork.
- Fetch both remotes before starting.

```sh
git remote -v
git fetch origin private
```

### 2. Create a Safety Branch

- Create a temporary safety branch from the current working branch before making
  merge changes.

```sh
git branch codex/<topic>-safety-YYYYMMDD
```

### 3. Align Ancestry With the Private Fork

- If the current branch is missing recent `private/master` ancestry, merge
  `private/master` first.
- If the resulting tree is equivalent, keep the history alignment and do not
  invent content changes.

```sh
git merge private/master
```

### 4. Merge Upstream With a Real Merge Commit

- Merge `origin/master` into the working branch.
- Use a real merge commit. Do not rebase or cherry-pick the upstream update.

```sh
git merge origin/master
```

### 5. Resolve Conflicts Using the Right Documents

- Use [`doc/MERGE-RENAME-RULES.md`](./MERGE-RENAME-RULES.md) for naming,
  exceptions, and post-merge requirements.
- Use [`doc/UI-LOCALIZATION.md`](./UI-LOCALIZATION.md) for any user-visible UI
  copy introduced or changed by the merge.
- Keep upstream behavior changes while re-applying Chopsticks naming and
  existing repository invariants.

### 6. Run Rename Audit

- Audit the files touched by the merge, not just the files that had textual
  conflicts.
- Treat remaining legacy names as bugs unless they clearly match an allowed
  exception in the merge rules.

Example PowerShell audit:

```powershell
$files = git diff --name-only private/master...HEAD
foreach ($file in $files) {
  if (Test-Path $file) {
    Select-String -Path $file -Pattern 'paperclipai|papercli|Paperclip|@paperclipai/'
  }
}
```

### 7. Run UI Audit

- Review touched UI pages, components, and supporting UI libs.
- Confirm newly merged UI is fully UI-localized:
  - headings and buttons
  - empty/error/fallback text
  - card descriptions and helper text
  - normalized `label` / `valueLabel` / `detail`
  - prompt/snippet/link output

### 8. Run Lockfile Audit

- Normal feature PRs must not include `pnpm-lock.yaml`.
- If the merge changed the lockfile, restore it to the base branch version
  before pushing the PR.

```sh
git diff --name-only private/master...HEAD -- pnpm-lock.yaml
```

If the output is non-empty, restore the lockfile to the base branch:

```sh
git restore --source=private/master --staged --worktree pnpm-lock.yaml
```

### 9. Run Quality Gates

```sh
pnpm -r typecheck
pnpm test:run
pnpm build
```

If any gate cannot be run, record exactly what was skipped and why.

### 10. Commit and PR Readiness Check

Before pushing:

- merge commit exists and conflict markers are gone
- rename audit is clean except for allowed exceptions
- UI audit is complete
- lockfile audit is clean
- quality gates passed

Recommended final checks:

```sh
git status --short
git log --oneline -n 3
```

## Paper Exercise

A runbook walkthrough is considered successful if another engineer can, without
extra chat context:

- identify the correct upstream/private/base-branch roles
- complete rename audit, UI audit, and lockfile audit
- explain which document answers which class of question

## References

- Normative merge rules:
  [`doc/MERGE-RENAME-RULES.md`](./MERGE-RENAME-RULES.md)
- UI localization rules:
  [`doc/UI-LOCALIZATION.md`](./UI-LOCALIZATION.md)
