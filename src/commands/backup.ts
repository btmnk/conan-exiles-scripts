import { Command } from "commander";
import chalk from "chalk";
import { loadConfig } from "../config.ts";
import { backupSaves } from "../services/backup.ts";

export function registerBackup(program: Command): void {
  program
    .command("backup")
    .description("Create a backup of the server save files")
    .action(async () => {
      const cfg = loadConfig(program.opts().config);
      const result = await backupSaves(cfg.server.dir, cfg.backups.dir, cfg.backups.keep);
      if (result.skipped) {
        console.log(chalk.yellow("No saves directory found, skipping backup."));
        return;
      }
      console.log(chalk.green(`Backup created: ${result.dest}`));
      if (result.pruned > 0) {
        console.log(chalk.yellow(`Pruned ${result.pruned} old backup(s), kept ${cfg.backups.keep}.`));
      }
      console.log(`  Backups: ${cfg.backups.dir}`);
    });
}
