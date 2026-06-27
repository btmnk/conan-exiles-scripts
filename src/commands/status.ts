import { Command } from "commander";
import chalk from "chalk";
import { existsSync } from "fs";
import { join } from "path";
import { loadConfig } from "../config.ts";
import { isServerRunning, getSessionInfo } from "../services/server.ts";
import { isServerInstalled } from "../services/checks.ts";
import { countBackups } from "../services/backup.ts";
import { countModlistEntries } from "../services/mods.ts";

export function registerStatus(program: Command): void {
  program
    .command("status")
    .description("Show the current server status")
    .action(async () => {
      const cfg = loadConfig(program.opts().config);
      const { dir } = cfg.server;
      const { session } = cfg.tmux;
      const { name, port, query_port } = cfg.params;

      console.log("");
      console.log(chalk.bold(`  Conan Exiles Server — ${name}`));
      console.log("");

      const running = await isServerRunning(session);
      if (running) {
        console.log(chalk.green(`  [running]  tmux session: ${session}`));
        const info = await getSessionInfo(session);
        if (info) console.log(`             ${info}`);
      } else {
        console.log(chalk.yellow(`  [stopped]  tmux session '${session}' not found`));
      }

      console.log("");
      console.log(`  Game port:   ${port}/udp`);
      console.log(`  Query port:  ${query_port}/udp`);
      console.log(`  RCON port:   ${cfg.params.rcon_port}/tcp  (enabled: ${cfg.params.rcon_enabled})`);

      const installed = isServerInstalled(dir, cfg.server.binary);
      console.log("");
      console.log(
        `  Server dir:  ${dir}  ${installed ? chalk.green("(installed)") : chalk.yellow("(not installed)")}`
      );

      if (existsSync(cfg.backups.dir)) {
        const count = await countBackups(cfg.backups.dir);
        console.log(`  Backups:     ${cfg.backups.dir}  (${count} backup${count !== 1 ? "s" : ""})`);
      }

      const modlistPath = join(dir, "ConanSandbox/Mods/modlist.txt");
      if (existsSync(modlistPath)) {
        const count = await countModlistEntries(dir);
        console.log(`  Mods loaded: ${count} (from modlist.txt)`);
      } else if (cfg.mods.list.length > 0) {
        console.log(`  Mods config: ${cfg.mods.list.length} mod(s) in config — run \`conan mods update\``);
      }

      console.log("");
    });
}
