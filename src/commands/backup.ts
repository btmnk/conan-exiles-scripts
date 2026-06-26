import { defineCommand, option } from "@bunli/core";
import { join } from "path";
import { z } from "zod";
import { loadConfig } from "../config.ts";
import { backupSaves } from "../lib/backup.ts";

export default defineCommand({
  name: "backup",
  description: "Create a backup of the server save files",
  options: {
    config: option(z.string().optional(), {
      description: "Path to config.yaml",
      short: "c",
    }),
  },
  handler: async ({ flags, shell, colors }) => {
    const cfg = loadConfig(flags.config);
    const { dir } = cfg.server;
    const backupDir = cfg.backups.dir || join(dir, "backups");

    await backupSaves(shell, dir, backupDir, cfg.backups.keep, colors);

    console.log(colors.green("Backup complete."));
    console.log(`  Backups: ${backupDir}`);
  },
});
