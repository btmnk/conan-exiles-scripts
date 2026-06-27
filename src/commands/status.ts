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
    console.log("");
    console.log(colors.bold(`  Conan Exiles Server — ${name}`));
    console.log("");

    const sessionRunning = await shell`tmux has-session -t ${session}`.nothrow().quiet();
    if (sessionRunning.exitCode === 0) {
      console.log(colors.green(`  [running]  tmux session: ${session}`));
      const filter = `#{==:#{session_name},${session}}`;
      const sessionInfo = await shell`tmux list-sessions -F "#{session_name}  created #{t:session_created}  windows: #{session_windows}" -f ${filter}`.text();
      console.log(`             ${sessionInfo.trim()}`);
    } else {
      console.log(colors.yellow(`  [stopped]  tmux session '${session}' not found`));
    }

    console.log("");
    console.log(`  Game port:   ${port}/udp`);
    console.log(`  Query port:  ${query_port}/udp`);
    console.log(`  RCON port:   ${cfg.params.rcon_port}/tcp  (enabled: ${cfg.params.rcon_enabled})`);

    const binaryPath = join(dir, cfg.server.binary);
    const installed = existsSync(binaryPath);
    console.log("");
    console.log(`  Server dir:  ${dir}  ${installed ? colors.green("(installed)") : colors.yellow("(not installed)")}`);

    if (existsSync(cfg.backups.dir)) {
      const backups = await shell`find ${cfg.backups.dir} -maxdepth 1 -type d -name "save_*"`.nothrow().text();
      const count = backups.trim().split("\n").filter(Boolean).length;
      console.log(`  Backups:     ${cfg.backups.dir}  (${count} backup${count !== 1 ? "s" : ""})`);
    }

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
