import { Command } from "commander";
import chalk from "chalk";
import { loadConfig } from "../../config.ts";
import { assertSteamCmd } from "../../services/checks.ts";
import { updateMods } from "../../services/mods.ts";

export function registerModsUpdate(mods: Command, program: Command): void {
  mods
    .command("update")
    .description("Install or update mods listed in config.yaml")
    .action(async () => {
      const cfg = loadConfig(program.opts().config);
      const { dir, steamcmd } = cfg.server;
      const { app_id, list } = cfg.mods;

      if (list.length === 0) {
        console.log(chalk.yellow("No mods configured. Add mods to the `mods.list` section in config.yaml."));
        return;
      }

      await assertSteamCmd(steamcmd);

      console.log(chalk.green(`Downloading ${list.length} mod(s) via SteamCMD...`));
      for (const mod of list) {
        console.log(`  ${mod.id}${mod.name ? `  ${mod.name}` : ""}`);
      }
      console.log("");

      const result = await updateMods(dir, steamcmd, app_id, list);

      for (const modId of result.missingPakMods) {
        console.log(chalk.yellow(`  Warning: no .pak files found for mod ${modId}`));
      }

      console.log("");
      console.log(chalk.green(`modlist.txt updated: ${result.modlistPath}`));
      console.log(`  ${result.pakCount} .pak file(s) registered.`);
      if (result.pakCount > 0) {
        console.log("");
        console.log("Run `conan start` (or restart) to load the mods.");
      }
    });
}
