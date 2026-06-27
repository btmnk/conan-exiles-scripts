# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
bun run dev           # run CLI directly (no build step)
bun run build         # compile to native binary → bin/conan (Bun runtime bundled, ~90 MB)
bun run build:script  # bundle to JS → bin/conan.js (requires Bun on PATH, much smaller)
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

This is a **Bun + Commander.js** CLI that manages a Conan Exiles dedicated server on Linux. The compiled binary is named `conan`.

The codebase is split into two layers:

- **`src/commands/`** — CLI layer. Each file exports a `registerX(program)` function that adds a Commander command to the root program. Commands handle all user-facing output (chalk), parse flags, call services, and throw `Error` on failure. No `process.exit` here.
- **`src/services/`** — Business logic layer. Pure functions using `Bun.$` directly. No `console.log`, no chalk. Return structured results; throw `Error` with a descriptive message on failure.

**Entry point:** `src/index.ts` — creates the Commander program, registers all commands, and runs `program.parseAsync()`. The `.catch()` handler is the single point where errors are printed (chalk red) and `process.exit(1)` is called.

**Config layer:** `src/config.ts` — reads `config.yaml` from CWD (or `--config <path>`), validates with Zod, and exports `loadConfig()`. Config sections: `server`, `tmux`, `params`, `backups`, `mods`.

**Global flag:** `-c/--config <path>` lives on the root program. It must come **before** the subcommand name: `conan -c myconfig.yaml start`. Inside action closures, access it via `program.opts().config` (program is captured by closure).

**Commands** in `src/commands/`:
- `init` — writes a commented `config.yaml` to the path from `--config` (default `./config.yaml`); `--force` overwrites
- `install` — verifies SteamCMD, pulls the server via `+app_update 443030`
- `backup` — creates a timestamped copy of `ConanSandbox/Saved`, prunes old backups per `backups.keep`
- `update` — backs up saves, then re-runs SteamCMD update; `--force` auto-stops a running session
- `start` — creates a detached tmux session, fixes `game.db` case sensitivity on Linux, sends the launch command
- `stop` — sends `C-c` to the tmux session, waits 5 s, then kills if still alive; `--kill` skips to immediate kill
- `status` — shows tmux session state, ports, install path, backup count, and mod count
- `mods update` — downloads Workshop items via SteamCMD (`+@sSteamCmdForcePlatformType windows`) and writes `modlist.txt`

**Services** in `src/services/`:
- `backup.ts` — `backupSaves()` → `BackupResult`, `countBackups()`
- `checks.ts` — `isServerInstalled()`, `isSteamCmdInstalled()`, `assertSteamCmd()` (throws on failure), `getCurrentUser()`
- `server.ts` — `isServerRunning()`, `getSessionInfo()`, `stopServer()`, `killServer()`, `startServer()`, `ensureBinaryExecutable()`, `fixGameDbCase()`, `buildLaunchCommand()`
- `mods.ts` — `updateMods()` → `ModsUpdateResult`, `countModlistEntries()`

**Runtime dependency:** the server runs inside a **tmux** session (name from `config.yaml → tmux.session`). All lifecycle commands check tmux session state with `tmux has-session`.

**Shell:** use `Bun.$` directly in services. Use `.nothrow()` to ignore non-zero exit codes and `.quiet()` to suppress output.

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

1. Create `src/commands/<name>.ts` and export `registerX(program: Command): void`.
2. Inside, call `program.command("<name>")` and attach `.description()`, any local `.option()`s, and `.action(async (opts) => { ... })`.
3. In the action, read the config path via `program.opts().config` and call `loadConfig(...)`.
4. Put business logic in a new or existing file under `src/services/`. Services must be silent — no `console.log`, no chalk, throw `Error` on failure.
5. Import and call `registerX(program)` in `src/index.ts`.

If the command is a subcommand group (like `mods`), create `src/commands/<name>/index.ts` with `registerX(program)` and a separate file per subcommand following the same pattern.
