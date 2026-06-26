import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { loadConfig } from "../config.ts";

export default defineCommand({
  name: "stop",
  description: "Stop the Conan Exiles server",
  options: {
    config: option(z.string().optional(), {
      description: "Path to config.yaml",
      short: "c",
    }),
    kill: option(z.coerce.boolean().default(false), {
      description: "Kill the session immediately without a graceful shutdown wait",
      short: "k",
      argumentKind: "flag",
    }),
  },
  handler: async ({ flags, shell, colors, spinner }) => {
    const cfg = loadConfig(flags.config);
    const { session } = cfg.tmux;

    const sessionRunning = await shell`tmux has-session -t ${session}`.nothrow().quiet();
    if (sessionRunning.exitCode !== 0) {
      console.log(colors.yellow(`Session '${session}' is not running.`));
      return;
    }

    if (flags.kill) {
      await shell`tmux kill-session -t ${session}`.quiet();
      console.log(colors.green(`Session '${session}' killed.`));
      return;
    }

    const spin = spinner(`Stopping server (session: ${session})...`);
    await shell`tmux send-keys -t ${session} C-c`.quiet();
    await Bun.sleep(5000);

    const stillRunning = await shell`tmux has-session -t ${session}`.nothrow().quiet();
    if (stillRunning.exitCode === 0) {
      await shell`tmux kill-session -t ${session}`.quiet();
    }

    spin.succeed("Server stopped.");
  },
});
