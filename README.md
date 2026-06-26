# conan-exiles-cli

A CLI for managing a Conan Exiles dedicated server (native Linux UE5 binary) on a Linux host. Handles installation, updates, mod management, and lifecycle via tmux.

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- `tmux`
- `lib32gcc-s1` (required by SteamCMD — `apt install lib32gcc-s1`)
- A dedicated system user for the server (default: `steam`)

## Setup

```bash
git clone <repo-url>
cd conan-exiles-scripts
bun install
```

Copy and edit the config:

```bash
cp config.yaml my-server/config.yaml   # or keep it in the repo root
# edit server.dir, server.user, params.name, mods.list, etc.
```

The CLI looks for `config.yaml` in the current working directory by default, or accepts `--config <path>` on every command.

## Running Without Building

For development and testing, run the CLI directly with Bun — no build step needed:

```bash
bun src/index.ts status
bun src/index.ts start --config /path/to/config.yaml
bun src/index.ts mods update
```

This reflects code changes immediately.

## Building a Native Binary

```bash
bun run build
```

Produces a self-contained Linux x64 binary at `dist/conan`. It has no runtime dependencies — no Bun, no Node.

## Installing the CLI

### Global install via Bun link (development)

Makes `conan` available anywhere on your machine, running directly from source:

```bash
bun link
```

Uninstall with `bun unlink`.

### Copy binary to PATH (production / server)

After building, copy the binary to a directory on `$PATH`:

```bash
bun run build
sudo cp dist/conan /usr/local/bin/conan
```

Or for a single-user install:

```bash
cp dist/conan ~/.local/bin/conan   # ensure ~/.local/bin is on your PATH
```

Verify: `conan --version`

## Commands

All commands accept `--config <path>` / `-c <path>` to point at a non-default config file.

| Command | Description |
|---|---|
| `conan install` | Download SteamCMD and install the server |
| `conan update [--force]` | Backup saves, then update the server via SteamCMD; `--force` auto-stops a running server |
| `conan start` | Start the server in a detached tmux session |
| `conan stop [--kill]` | Gracefully stop the server; `--kill` skips the 5s wait |
| `conan status` | Show tmux session state, ports, install path, backups, and mods |
| `conan mods update` | Download Workshop mods and write `modlist.txt` |

## Configuration Reference

`config.yaml` is validated with Zod on startup. All fields except `server.dir` and `server.steamcmd_dir` have defaults.

```yaml
server:
  user: steam                        # system user that owns the server
  dir: /home/steam/exiles            # server installation directory
  steamcmd_dir: /home/steam/steamcmd
  steam_app_id: "443030"             # do not change
  binary: ConanSandboxServer.sh

tmux:
  session: conan
  width: 220
  height: 50

params:
  map: ConanSandbox                  # or ConanSandbox_DLC_Siptah
  name: "My Conan Exiles Server"
  max_players: 40
  port: 7777
  query_port: 27015
  rcon_port: 25575
  rcon_enabled: true

backups:
  keep: 5
  dir: ""                            # defaults to <server.dir>/backups

mods:
  app_id: "440900"                   # do not change
  list:
    - id: "880454836"
      name: "Pippi - User & Server Management"
```

## Typical Workflow

```bash
# First-time setup (run as the server user, e.g. sudo -u steam)
conan install

# Configure mods, then download them
conan mods update

# Start the server
conan start

# Watch it boot
tail -f /home/steam/exiles/ConanSandbox/Saved/Logs/ConanSandbox.log

# Update server (stops automatically with --force)
conan update --force
conan mods update   # re-run if mod updates are also needed
conan start
```
