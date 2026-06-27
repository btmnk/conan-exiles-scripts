import { Command } from "commander";
import chalk from "chalk";
import { loadConfig } from "../config.ts";
import { assertSteamCmd, getCurrentUser } from "../services/checks.ts";
import { backupSaves } from "../services/backup.ts";
import { isServerRunning, stopServer, ensureBinaryExecutable } from "../services/server.ts";

export function registerUpdate(program: Command): void {
  program
    .command("update")
    .description("Update the Conan Exiles server via SteamCMD (backs up saves first)")
    .option("-f, --force", "Stop a running server automatically before updating")
    .action(async (opts) => {
      const cfg = loadConfig(program.opts().config);
      const { user, dir, steamcmd, steam_app_id, binary } = cfg.server;
      const { session } = cfg.tmux;

      const currentUser = await getCurrentUser();
      if (currentUser !== user) {
        console.log(
          chalk.yellow(
            `Warning: running as '${currentUser}', expected '${user}'. Consider: sudo -u ${user} conan update`
          )
        );
      }

      const running = await isServerRunning(session);
      if (running) {
        if (!opts.force) {
          throw new Error(
            `Server is running (tmux session: '${session}').\nStop it first with \`conan stop\`, or pass --force to stop automatically.`
          );
        }
        console.log(chalk.yellow("Stopping running server for update..."));
        await stopServer(session);
        console.log("Server stopped.");
      }

      await assertSteamCmd(steamcmd);

      const backup = await backupSaves(dir, cfg.backups.dir, cfg.backups.keep);
      if (!backup.skipped) {
        console.log(chalk.green(`Backup created: ${backup.dest}`));
        if (backup.pruned > 0) {
          console.log(chalk.yellow(`Pruned ${backup.pruned} old backup(s), kept ${cfg.backups.keep}.`));
        }
      }

      console.log(chalk.green(`Updating server (App ID: ${steam_app_id})...`));
      await Bun.$`${steamcmd} +force_install_dir ${dir} +login anonymous +app_update ${steam_app_id} validate +quit`;

      await ensureBinaryExecutable(dir, binary);

      console.log("");
      console.log(chalk.green("Update complete!"));
      console.log(`  Backups: ${cfg.backups.dir}`);
      console.log(`  Logs:    ${dir}/ConanSandbox/Saved/Logs/ConanSandbox.log`);
      console.log("");
      console.log("Run `conan start` to start the server.");
    });
}
