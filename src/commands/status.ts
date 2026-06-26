import { defineCommand, option } from "@bunli/core";
import { existsSync } from "fs";
import { join } from "path";
import { z } from "zod";
import { loadConfig } from "../config.ts";

export default defineCommand({
  name: "status",
  description: "Show the current server status",
  options: {
    config: option(z.string().optional(), {
      description: "Path to config.yaml",
      short: "c",
    }),
  },
  handler: async ({ flags, shell, colors }) => {
    const cfg = loadConfig(flags.config);
    const { dir } = cfg.server;
    const { session } = cfg.tmux;
    const { name, port, query_port } = cfg.params;
    const backupDir = cfg.backups.dir || join(dir, "backups");

    console.log("");
    console.log(colors.bold(`  Conan Exiles Server — ${name}`));
    console.log("");

    // tmux session status
    const sessionRunning = await shell`tmux has-session -t ${session}`.nothrow().quiet();
    if (sessionRunning.exitCode === 0) {
      console.log(colors.green(`  [running]  tmux session: ${session}`));
      const sessionInfo = await shell`tmux list-sessions -F "#{session_name}  created #{t:session_created}  windows: #{session_windows}" -f ${"#{==:#{session_name}," + session + "}"}`.text();
      console.log(`             ${sessionInfo.trim()}`);
    } else {
      console.log(colors.yellow(`  [stopped]  tmux session '${session}' not found`));
    }

    // Ports
    console.log("");
    console.log(`  Game port:   ${port}/udp`);
    console.log(`  Query port:  ${query_port}/udp`);
    console.log(`  RCON port:   ${cfg.params.rcon_port}/tcp  (enabled: ${cfg.params.rcon_enabled})`);

    // Installation
    const binaryPath = join(dir, cfg.server.binary);
    const installed = existsSync(binaryPath);
    console.log("");
    console.log(`  Server dir:  ${dir}  ${installed ? colors.green("(installed)") : colors.yellow("(not installed)")}`);

    // Backups
    if (existsSync(backupDir)) {
      const backups = await shell`find ${backupDir} -maxdepth 1 -type d -name "save_*"`.nothrow().text();
      const count = backups.trim().split("\n").filter(Boolean).length;
      console.log(`  Backups:     ${backupDir}  (${count} backup${count !== 1 ? "s" : ""})`);
    }

    // Mods
    const modlistPath = join(dir, "ConanSandbox/Mods/modlist.txt");
    if (existsSync(modlistPath)) {
      const modlines = (await Bun.file(modlistPath).text()).trim().split("\n").filter(Boolean);
      console.log(`  Mods loaded: ${modlines.length} (from modlist.txt)`);
    } else if (cfg.mods.list.length > 0) {
      console.log(`  Mods config: ${cfg.mods.list.length} mod(s) in config — run \`conan mods update\``);
    }

    console.log("");
  },
});
