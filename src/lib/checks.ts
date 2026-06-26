import { existsSync } from "fs";
import { join } from "path";

export function isServerInstalled(serverDir: string, binary: string): boolean {
  return existsSync(join(serverDir, binary));
}

export async function isSteamCmdInstalled(steamcmd: string): Promise<boolean> {
  if (steamcmd.includes("/")) {
    return existsSync(steamcmd);
  }
  return Bun.which(steamcmd) !== null;
}

export async function isServerRunning(session: string): Promise<boolean> {
  const result = await Bun.$`tmux has-session -t ${session}`.nothrow().quiet();
  return result.exitCode === 0;
}
