# conan-exiles-cli

CLI for managing a Conan Exiles dedicated server on Linux. Handles installation, updates, mod management, and lifecycle via tmux.

## Quick Start

**Prerequisites:** [Bun](https://bun.sh) ≥ 1.0, `tmux`, SteamCMD on PATH

```bash
git clone <repo-url> && cd conan-exiles-scripts
bun install
```

**Option A — standalone binary** (no Bun needed at runtime, ~90 MB):
```bash
bun run build              # produces bin/conan
sudo cp bin/conan-standalone /usr/local/bin/conan
```

**Option B — script bundle** (requires Bun on PATH, much smaller):
```bash
bun run build:script       # produces bin/conan
chmod +x bin/conan
sudo cp bin/conan /usr/local/bin/conan
```

```bash
conan init                 # creates config.yaml in CWD
# edit config.yaml — set server.dir at minimum
conan install              # downloads server files via SteamCMD (~15 GB)
conan start
```

## Commands

All commands accept `-c <path>` / `--config <path>` for a non-default config file.

| Command | Description |
|---|---|
| `conan init` | Create `config.yaml` with defaults |
| `conan install` | Download the server via SteamCMD |
| `conan start` | Start server in a detached tmux session |
| `conan stop [--kill]` | Stop server gracefully; `--kill` force-kills immediately |
| `conan status` | Show session state, ports, install path, backups, mods |
| `conan backup` | Snapshot save files and prune old backups |
| `conan update [--force]` | Backup saves, then update via SteamCMD; `--force` auto-stops |
| `conan mods update` | Download Workshop mods and write `modlist.txt` |

## Configuration

`conan init` generates a commented `config.yaml`. Only `server.dir` is required; everything else has a default.

```yaml
server:
  dir: /home/steam/exiles      # required
  user: steam
  steamcmd: steamcmd           # command name or absolute path
  steam_app_id: "443030"
  binary: ConanSandboxServer.sh

tmux:
  session: conan

params:
  map: ConanSandbox            # or DLC_Isle_of_Siptah
  name: "Conan Exiles Server"
  max_players: 40
  port: 7777
  query_port: 27015
  rcon_port: 25575
  rcon_enabled: true
  # password: ""
  # admin_password: ""

backups:
  keep: 5
  # dir: /home/steam/exiles/backups

mods:
  app_id: "440900"
  list:
    - id: "880454836"
      name: "Pippi - User & Server Management"
```

## Development

```bash
bun run dev                  # hot-reload via bunli dev
bun src/index.ts <command>   # run directly without building
bunx tsc --noEmit            # type-check
```
