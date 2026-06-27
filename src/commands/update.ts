import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { loadConfig } from "../config.ts";
import { checkSteamCmd, checkCurrentUser } from "../lib/checks.ts";
import { backupSaves } from "../lib/backup.ts";
import { stopServer, ensureBinaryExecutable } from "../lib/server.ts";

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
    await checkCurrentUser(user, "update", colors);

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
      await stopServer(session);
      console.log("Server stopped.");
    }

    await checkSteamCmd(steamcmd, colors);
    await backupSaves(dir, cfg.backups.dir, cfg.backups.keep, colors);

    console.log(colors.green(`Updating server (App ID: ${steam_app_id})...`));
    await shell`${steamcmd} +force_install_dir ${dir} +login anonymous +app_update ${steam_app_id} validate +quit`;

    await ensureBinaryExecutable(dir, binary);

    console.log("");
    console.log(colors.green("Update complete!"));
    console.log(`  Backups: ${cfg.backups.dir}`);
    console.log(`  Logs:    ${dir}/ConanSandbox/Saved/Logs/ConanSandbox.log`);
    console.log("");
    console.log("Run `conan start` to start the server.");
  },
});
