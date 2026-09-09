# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Skill Registry is a CLI tool (`skill-registry`, package name `skill-registry`) written in TypeScript for centrally managing AI Agent Skills from Git repos and local directories. It caches skills in a global registry and deploys them into projects via symlinks to multiple agent "targets" (Claude Code, Cursor, Codex, Windsurf, etc.). Docs are in Chinese; code, comments, and CLI output are in English.

## Commands

```bash
npm run build      # tsc → dist/ (must rebuild before testing CLI changes)
npm run dev        # tsc --watch
npm link           # global install for manual testing (see TESTING.md for the full test playbook)
node dist/cli.js   # run the CLI directly without linking
```

There is **no test framework and no linter configured** — `npm test` and `npm lint` intentionally exit with an error. Verification is manual via `TESTING.md` workflows.

TypeScript is maximally strict: `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns` are on — unused variables fail the build.

## Architecture

Layered, no database — everything is derived from the filesystem (SKILL.md frontmatter, `.git/` directories) and two YAML config files.

```
src/cli.ts          Commander entry; registers command groups, then parses argv
src/commands/*      Thin CLI layer: arg parsing + chalk/ora output; delegates to core/
src/core/*          Business logic: skill.ts, project.ts, group.ts, target.ts
src/lib/*           Shared infrastructure: storage.ts, config.ts, git.ts, utils.ts
src/types/index.ts  All shared interfaces (SkillInfo, GlobalConfig, ProjectConfig, ...)
```

Dependencies flow one direction: `commands → core → lib`. Commands never touch lib/storage or lib/git directly.

### Key data model

- **Global registry** at `~/.skill-registry/`: `global.yaml` (default targets, groups, settings, optional custom `registry.path`) plus `skills/<name>/` — one directory per skill, name is unique, must contain `SKILL.md`.
- **Project config** at `<project>/.skill-registry/config.yaml`: list of skill names + optional target overrides. A project is any dir with this file (`isProjectDir`); the home dir is treated as just another project.
- **Targets** are deploy destinations (e.g. `claude-code` → `.claude/skills`). Global defaults live in `getDefaultGlobalConfig()` in `src/lib/config.ts` — new preset targets go there.
- **Target auto-detection**: at pull time, `getProjectTargetDetails()` (config.ts) unions the project's explicit `config.yaml` targets with global presets detected by `detectTargets()` (`src/lib/detect.ts`). The detection marker is derived from the target path's **first segment** (`.cursor/rules` → `.cursor/`) and matches when that directory exists in the project root — there is no separate detect config. Targets with `~/` or absolute paths (e.g. `claude-code-home`) are never auto-detected. Explicit config wins on name conflicts; if the union is empty it falls back to `settings.default_target`.
- **Pull is one-directional and incremental**: `pullProjectSkills()` creates symlinks from registry cache to each target dir and skips anything already present — it never deletes, to protect dynamically created files.
- **Git source format**: `git+https://host/user/repo.git#path/to/skill` — parsed by `parseGitUrl()` in `src/lib/utils.ts`; the `#fragment` selects a subdirectory of the repo. Git skills are cloned (depth 1) to a temp dir, then the skill subdir is copied into the registry.

### Gotchas

- `src/lib/storage.ts` keeps a **module-level cache** of the custom skills path (`customSkillsPath`). Any code path that changes `registry.path` must call `clearSkillsPathCache()` (`saveGlobalConfig()` already does).
- `getGlobalConfigPath()` is defined in **both** `storage.ts` and `config.ts` — keep them in sync or consolidate when editing.
- `getSkillInfo()` returns `null` for any directory without `SKILL.md`; this is how listing filters non-skills out of the registry.
- Skill metadata (name, description, source, version, branch) is always re-read from `SKILL.md` frontmatter and the `.git/` dir at query time — there is no metadata file to update on write.
- `dist/` is committed; rebuild after source changes so the linked `bin/skill-registry` reflects them.

## Documentation

- `README.md` — usage, core concepts, examples (Chinese)
- `TESTING.md` — step-by-step manual testing playbook
- `docs/` — design docs: `FINAL_DESIGN.md`, `QUICK_REFERENCE.md` (storage layout, config schemas, core API), plus `01-overview/`, `02-architecture/`, `03-cli/`, `04-mechanisms/` (registration, storage, target, update mechanisms)
