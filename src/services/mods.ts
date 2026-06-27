import { existsSync, readdirSync } from "fs";
import { join } from "path";

function findPakFiles(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findPakFiles(full));
    } else if (entry.name.endsWith(".pak")) {
      results.push(full);
    }
  }
  return results;
}

export interface ModsUpdateResult {
  modlistPath: string;
  pakCount: number;
  missingPakMods: string[];
}

export async function updateMods(
  serverDir: string,
  steamcmd: string,
  appId: string,
  mods: Array<{ id: string; name?: string }>
): Promise<ModsUpdateResult> {
  const workshopArgs = mods.flatMap((m) => ["+workshop_download_item", appId, m.id]);
  await Bun.$`${steamcmd} +@sSteamCmdForcePlatformType windows +force_install_dir ${serverDir} +login anonymous ${workshopArgs} +quit`;

  const modsContentDir = join(serverDir, "steamapps/workshop/content", appId);
  const modlistDir = join(serverDir, "ConanSandbox/Mods");
  const modlistPath = join(modlistDir, "modlist.txt");

  await Bun.$`mkdir -p ${modlistDir}`.quiet();

  const entries: string[] = [];
  const missingPakMods: string[] = [];

  for (const mod of mods) {
    const modDir = join(modsContentDir, mod.id);
    const paks = findPakFiles(modDir);
    if (paks.length === 0) {
      missingPakMods.push(mod.id);
    }
    entries.push(...paks);
  }

  await Bun.write(modlistPath, entries.join("\n") + (entries.length > 0 ? "\n" : ""));

  return { modlistPath, pakCount: entries.length, missingPakMods };
}

export async function countModlistEntries(serverDir: string): Promise<number> {
  const modlistPath = join(serverDir, "ConanSandbox/Mods/modlist.txt");
  if (!existsSync(modlistPath)) return 0;
  const content = await Bun.file(modlistPath).text();
  return content.trim().split("\n").filter(Boolean).length;
}
