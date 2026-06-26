import { defineCommand, defineGroup, option } from "@bunli/core";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { z } from "zod";
import { loadConfig } from "../config.ts";

function findPakFiles(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findPakFiles(full));
    } else if ((entry.name as string).endsWith(".pak")) {
      results.push(full);
    }
  }
  return results;
}

const updateCommand = defineCommand({
  name: "update",
  description: "Install or update mods listed in config.yaml",
  options: {
    config: option(z.string().optional(), {
      description: "Path to config.yaml",
      short: "c",
    }),
  },
  handler: async ({ flags, shell, colors }) => {
    const cfg = loadConfig(flags.config);
    const { dir, steamcmd } = cfg.server;
    const { app_id, list } = cfg.mods;

    if (list.length === 0) {
      console.log(colors.yellow("No mods configured. Add mods to the `mods.list` section in config.yaml."));
      return;
    }

    const steamcmdCheck = await shell`${steamcmd} +quit`.nothrow().quiet();
    if (steamcmdCheck.exitCode !== 0) {
      console.error(colors.yellow(`SteamCMD not working: ${steamcmd}`));
      console.error(`Install SteamCMD first, then set server.steamcmd in config.yaml if it is not on PATH.`);
      console.error(`  https://developer.valvesoftware.com/wiki/SteamCMD#Downloading_SteamCMD`);
      process.exit(1);
    }

    console.log(colors.green(`Downloading ${list.length} mod(s) via SteamCMD...`));
    for (const mod of list) {
      console.log(`  ${mod.id}${mod.name ? `  ${mod.name}` : ""}`);
    }
    console.log("");

    const workshopArgs = list.flatMap((m) => ["+workshop_download_item", app_id, m.id]);

    // +@sSteamCmdForcePlatformType windows — mods are published as Windows Workshop items
    await shell`${steamcmd} +@sSteamCmdForcePlatformType windows +force_install_dir ${dir} +login anonymous ${workshopArgs} +quit`;

    // Build modlist.txt
    const modsContentDir = join(dir, "steamapps/workshop/content", app_id);
    const modlistDir = join(dir, "ConanSandbox/Mods");
    const modlistPath = join(modlistDir, "modlist.txt");

    await shell`mkdir -p ${modlistDir}`.quiet();

    const entries: string[] = [];
    for (const mod of list) {
      const modDir = join(modsContentDir, mod.id);
      const paks = findPakFiles(modDir);
      if (paks.length === 0) {
        console.log(colors.yellow(`  Warning: no .pak files found for mod ${mod.id}`));
      }
      entries.push(...paks);
    }

    await Bun.write(modlistPath, entries.join("\n") + (entries.length > 0 ? "\n" : ""));

    console.log("");
    console.log(colors.green(`modlist.txt updated: ${modlistPath}`));
    console.log(`  ${entries.length} .pak file(s) registered.`);
    if (entries.length > 0) {
      console.log("");
      console.log("Run `conan start` (or restart) to load the mods.");
    }
  },
});

export default defineGroup({
  name: "mods",
  description: "Manage server mods",
  commands: [updateCommand],
});
