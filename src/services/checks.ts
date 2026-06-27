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

export async function assertSteamCmd(steamcmd: string): Promise<void> {
  const result = await Bun.$`${steamcmd} +quit`.nothrow().quiet();
  if (result.exitCode !== 0) {
    throw new Error(
      `SteamCMD not working: ${steamcmd}\n` +
        `Install SteamCMD first, then set server.steamcmd in config.yaml if it is not on PATH.\n` +
        `  https://developer.valvesoftware.com/wiki/SteamCMD#Downloading_SteamCMD`
    );
  }
}

export async function getCurrentUser(): Promise<string> {
  return (await Bun.$`id -un`.text()).trim();
}
