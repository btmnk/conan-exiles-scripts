import { defineCommand, option } from "@bunli/core";
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
  handler: async ({ flags, colors }) => {
    const cfg = loadConfig(flags.config);
    await backupSaves(cfg.server.dir, cfg.backups.dir, cfg.backups.keep, colors);

    console.log(colors.green("Backup complete."));
    console.log(`  Backups: ${cfg.backups.dir}`);
  },
});
