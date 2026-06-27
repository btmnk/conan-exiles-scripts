import { Command } from "commander";
import chalk from "chalk";
import { loadConfig } from "../config.ts";
import { isServerRunning, stopServer, killServer } from "../services/server.ts";

export function registerStop(program: Command): void {
  program
    .command("stop")
    .description("Stop the Conan Exiles server")
    .option("-k, --kill", "Kill the session immediately without a graceful shutdown wait")
    .action(async (opts) => {
      const cfg = loadConfig(program.opts().config);
      const { session } = cfg.tmux;

      const running = await isServerRunning(session);
      if (!running) {
        console.log(chalk.yellow(`Session '${session}' is not running.`));
        return;
      }

      if (opts.kill) {
        await killServer(session);
        console.log(chalk.green(`Session '${session}' killed.`));
        return;
      }

      console.log(`Stopping server (session: ${session})...`);
      await stopServer(session);
      console.log(chalk.green("Server stopped."));
    });
}
