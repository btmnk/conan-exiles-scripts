# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
bun run dev           # run CLI in dev mode (hot-reload via bunli dev)
bun run build         # compile to native linux-x64 binary (Bun runtime bundled)
bun run build:script  # bundled JS with shebang (requires Bun on PATH, much smaller)
```

There are no tests. Type-check only:
```bash
bunx tsc --noEmit
```

Run the CLI directly without building:
```bash
bun src/index.ts <command>
```

## Architecture

This is a **Bun + bunli CLI** (`@bunli/core`) that manages a Conan Exiles dedicated server on Linux. The compiled binary is named `conan`.

**Entry point:** `src/index.ts` — creates the CLI, registers all commands, and calls `cli.run()`.

**Config layer:** `src/config.ts` — reads `config.yaml` from CWD (or `--config <path>`), validates with Zod, and exports `loadConfig()`. Every command accepts a `--config`/`-c` flag and calls `loadConfig()` as its first step. Config sections: `server`, `tmux`, `params`, `backups`, `mods`.

**Commands** in `src/commands/`:
- `install` — verifies SteamCMD is available, then pulls the server via `+app_update 443030`
- `backup` — creates a timestamped copy of `ConanSandbox/Saved` and prunes old backups per `backups.keep`
- `update` — backs up saves, then re-runs SteamCMD update; `--force` auto-stops a running session
- `start` — creates a detached tmux session, fixes `game.db` case sensitivity on Linux, then sends the launch command into it
- `stop` — sends `C-c` to the tmux session, waits 5 s, then kills if still alive; `--kill` skips to immediate `tmux kill-session`
- `status` — shows tmux session state, ports, install path, backup count, and mod count
- `mods` — a `defineGroup` with a single subcommand `mods update` that downloads Workshop items via SteamCMD (`+@sSteamCmdForcePlatformType windows`) and writes `modlist.txt`

**Runtime dependency:** the server runs inside a **tmux** session (name from `config.yaml → tmux.session`). All lifecycle commands check tmux session state with `tmux has-session`.

**Shell helper:** bunli injects `shell` (a tagged-template wrapper around `Bun.$`) into every command handler. Use `.nothrow()` to ignore non-zero exit codes and `.quiet()` to suppress output.

## Key Paths (from default config)

| Purpose | Path |
|---|---|
| Server install | `/home/steam/exiles` (default `server.dir`) |
| SteamCMD | `steamcmd` on PATH (configurable via `server.steamcmd`) |
| Server logs | `<server.dir>/ConanSandbox/Saved/Logs/ConanSandbox.log` |
| Mod list | `<server.dir>/ConanSandbox/Mods/modlist.txt` |
| Workshop mods | `<server.dir>/steamapps/workshop/content/<app_id>/` |
| Backups | `<server.dir>/backups` (or `backups.dir` in config) |

## Config / Init sync rule

After **any** edit to `src/config.ts` or `src/commands/init.ts`, run the `/check-init-config` skill to verify that `makeDefaultConfig` in `init.ts` still covers every field in `ConfigSchema`. Fix any discrepancies before finishing the task.

## Adding a New Command

1. Create `src/commands/<name>.ts`, export a `defineCommand({...})` default.
2. Import and register it in `src/index.ts` with `cli.command(...)`.
3. Follow the existing pattern: accept `--config`/`-c`, call `loadConfig(flags.config)`, destructure what you need.
