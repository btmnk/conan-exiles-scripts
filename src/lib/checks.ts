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

export async function checkSteamCmd(
  steamcmd: string,
  colors: { yellow: (s: string) => string }
): Promise<void> {
  const result = await Bun.$`${steamcmd} +quit`.nothrow().quiet();
  if (result.exitCode !== 0) {
    console.error(colors.yellow(`SteamCMD not working: ${steamcmd}`));
    console.error(`Install SteamCMD first, then set server.steamcmd in config.yaml if it is not on PATH.`);
    console.error(`  https://developer.valvesoftware.com/wiki/SteamCMD#Downloading_SteamCMD`);
    process.exit(1);
  }
}

export async function checkCurrentUser(
  expectedUser: string,
  commandName: string,
  colors: { yellow: (s: string) => string }
): Promise<void> {
  const currentUser = (await Bun.$`id -un`.text()).trim();
  if (currentUser !== expectedUser) {
    console.log(
      colors.yellow(
        `Warning: running as '${currentUser}', expected '${expectedUser}'. Consider: sudo -u ${expectedUser} conan ${commandName}`
      )
    );
  }
}
