import { existsSync } from "fs";
import { join } from "path";

export async function isServerRunning(session: string): Promise<boolean> {
  const result = await Bun.$`tmux has-session -t ${session}`.nothrow().quiet();
  return result.exitCode === 0;
}

export async function getSessionInfo(session: string): Promise<string | null> {
  const filter = `#{==:#{session_name},${session}}`;
  const output = await Bun.$`tmux list-sessions -F "#{session_name}  created #{t:session_created}  windows: #{session_windows}" -f ${filter}`
    .nothrow()
    .text();
  const trimmed = output.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function stopServer(session: string): Promise<void> {
  await Bun.$`tmux send-keys -t ${session} C-c`.quiet();
  await Bun.sleep(5000);
  const stillRunning = await Bun.$`tmux has-session -t ${session}`.nothrow().quiet();
  if (stillRunning.exitCode === 0) {
    await Bun.$`tmux kill-session -t ${session}`.quiet();
  }
}

export async function killServer(session: string): Promise<void> {
  await Bun.$`tmux kill-session -t ${session}`.quiet();
}

export async function startServer(session: string, launchCmd: string): Promise<void> {
  await Bun.$`tmux new-session -d -s ${session}`;
  await Bun.$`tmux send-keys -t ${session} ${launchCmd} Enter`;
}

export async function ensureBinaryExecutable(dir: string, binary: string): Promise<boolean> {
  const binaryPath = join(dir, binary);
  if (existsSync(binaryPath)) {
    await Bun.$`chmod +x ${binaryPath}`.quiet();
    return true;
  }
  await Bun.$`find ${dir} -maxdepth 2 -name "*.sh" -exec chmod +x {} \\;`.nothrow().quiet();
  return false;
}

export async function fixGameDbCase(dir: string): Promise<void> {
  const savedDir = join(dir, "ConanSandbox", "Saved");
  if (!existsSync(savedDir)) return;
  await Bun.$`find ${savedDir} -maxdepth 1 -iname "game.db" ! -name "game.db" -exec bash -c 'mv "$1" "$(dirname "$1")/game.db"' _ {} \\;`
    .nothrow()
    .quiet();
}

export interface LaunchCommandParams {
  dir: string;
  binary: string;
  map: string;
  name: string;
  maxPlayers: number;
  port: number;
  queryPort: number;
  rconPort: number;
  rconEnabled: boolean;
  password?: string;
  adminPassword?: string;
}

export function buildLaunchCommand(params: LaunchCommandParams): string {
  const binaryPath = join(params.dir, params.binary);
  return [
    `cd ${params.dir}`,
    `&&`,
    binaryPath,
    params.map,
    `-port=${params.port}`,
    `-QueryPort=${params.queryPort}`,
    `-RCONPort=${params.rconPort}`,
    `-RCONEnabled=${params.rconEnabled}`,
    `-MaxPlayers=${params.maxPlayers}`,
    `-ServerName="${params.name}"`,
    params.password ? `-ServerPassword="${params.password}"` : null,
    params.adminPassword ? `-AdminPassword="${params.adminPassword}"` : null,
    `-log`,
    `-userdir=${params.dir}/ConanSandbox`,
  ]
    .filter(Boolean)
    .join(" ");
}
