import { defineCommand, option } from "@bunli/core";
import { existsSync } from "fs";
import { z } from "zod";
import { loadConfig } from "../config.ts";

export default defineCommand({
  name: "start",
  description: "Start the Conan Exiles server in a tmux session",
  options: {
    config: option(z.string().optional(), {
      description: "Path to config.yaml",
      short: "c",
    }),
  },
  handler: async ({ flags, shell, colors }) => {
    const cfg = loadConfig(flags.config);
    const { dir, binary } = cfg.server;
    const { session } = cfg.tmux;
    const { map, name, max_players, port, query_port, rcon_port, rcon_enabled } = cfg.params;

    const sessionRunning = await shell`tmux has-session -t ${session}`.nothrow().quiet();
    if (sessionRunning.exitCode === 0) {
      console.log(colors.yellow(`Session '${session}' is already running.`));
      console.log(`  Attach: tmux attach -t ${session}`);
      console.log(`  Stop:   conan stop`);
      return;
    }

    const binaryPath = `${dir}/${binary}`;
    if (!existsSync(binaryPath)) {
      console.error(colors.yellow(`Binary not found: ${binaryPath}`));
      console.error("Run `conan install` first.");
      process.exit(1);
    }
    await shell`chmod +x ${binaryPath}`.quiet();

    // Fix game.db filename case (Linux is case-sensitive)
    const savedDir = `${dir}/ConanSandbox/Saved`;
    if (existsSync(savedDir)) {
      await shell`find ${savedDir} -maxdepth 1 -iname "game.db" ! -name "game.db" -exec bash -c 'mv "$1" "$(dirname "$1")/game.db"' _ {} \\;`
        .nothrow()
        .quiet();
    }

    // Build the launch command that tmux will type into the terminal
    const launchCmd = [
      `cd ${dir}`,
      `&&`,
      binaryPath,
      map,
      `-port=${port}`,
      `-QueryPort=${query_port}`,
      `-RCONPort=${rcon_port}`,
      `-RCONEnabled=${rcon_enabled}`,
      `-MaxPlayers=${max_players}`,
      `-ServerName="${name}"`,
      `-log`,
      `-userdir=${dir}/ConanSandbox`,
    ].join(" ");

    await shell`tmux new-session -d -s ${session}`;
    await shell`tmux send-keys -t ${session} ${launchCmd} Enter`;

    console.log(colors.green(`Server started in tmux session '${session}'.`));
    console.log(`  Attach:  tmux attach -t ${session}`);
    console.log(`  Logs:    tail -f ${dir}/ConanSandbox/Saved/Logs/ConanSandbox.log`);
    console.log(`  Status:  conan status`);
  },
});
