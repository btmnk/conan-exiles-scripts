import { defineCommand, option } from "@bunli/core";
import { existsSync } from "fs";
import { join } from "path";
import { z } from "zod";
import { loadConfig } from "../config.ts";
import { backupSaves } from "../lib/backup.ts";

export default defineCommand({
  name: "update",
  description: "Update the Conan Exiles server via SteamCMD (backs up saves first)",
  options: {
    config: option(z.string().optional(), {
      description: "Path to config.yaml",
      short: "c",
    }),
    force: option(z.coerce.boolean().default(false), {
      description: "Stop a running server automatically before updating",
      short: "f",
      argumentKind: "flag",
    }),
  },
  handler: async ({ flags, shell, colors }) => {
    const cfg = loadConfig(flags.config);
    const { user, dir, steamcmd, steam_app_id, binary } = cfg.server;
    const { session } = cfg.tmux;
    const backupDir = cfg.backups.dir || join(dir, "backups");

    const currentUser = (await shell`id -un`.text()).trim();
    if (currentUser !== user) {
      console.log(
        colors.yellow(
          `Warning: running as '${currentUser}', expected '${user}'. Consider: sudo -u ${user} conan update`
        )
      );
    }

    // Check if server is running
    const sessionRunning = await shell`tmux has-session -t ${session}`.nothrow().quiet();
    if (sessionRunning.exitCode === 0) {
      if (!flags.force) {
        console.error(
          colors.yellow(`Server is running (tmux session: '${session}').`) +
            `\nStop it first with \`conan stop\`, or pass --force to stop automatically.`
        );
        process.exit(1);
      }
      console.log(colors.yellow("Stopping running server for update..."));
      await shell`tmux send-keys -t ${session} C-c`.quiet();
      await Bun.sleep(5000);
      await shell`tmux kill-session -t ${session}`.nothrow().quiet();
      console.log("Server stopped.");
    }

    const steamcmdCheck = await shell`${steamcmd} +quit`.nothrow().quiet();
    if (steamcmdCheck.exitCode !== 0) {
      console.error(colors.yellow(`SteamCMD not working: ${steamcmd}`));
      console.error(`Install SteamCMD first, then set server.steamcmd in config.yaml if it is not on PATH.`);
      console.error(`  https://developer.valvesoftware.com/wiki/SteamCMD#Downloading_SteamCMD`);
      process.exit(1);
    }

    await backupSaves(shell, dir, backupDir, cfg.backups.keep, colors);

    console.log(colors.green(`Updating server (App ID: ${steam_app_id})...`));
    await shell`${steamcmd} +force_install_dir ${dir} +login anonymous +app_update ${steam_app_id} validate +quit`;

    const binaryPath = `${dir}/${binary}`;
    if (existsSync(binaryPath)) {
      await shell`chmod +x ${binaryPath}`.quiet();
    } else {
      await shell`find ${dir} -maxdepth 2 -name "*.sh" -exec chmod +x {} \\;`.nothrow().quiet();
    }

    console.log("");
    console.log(colors.green("Update complete!"));
    console.log(`  Backups: ${backupDir}`);
    console.log(`  Logs:    ${dir}/ConanSandbox/Saved/Logs/ConanSandbox.log`);
    console.log("");
    console.log("Run `conan start` to start the server.");
  },
});
