import { Command } from "commander";
import chalk from "chalk";
import { existsSync } from "fs";
import { join } from "path";
import { loadConfig } from "../config.ts";
import { isServerRunning, buildLaunchCommand, fixGameDbCase, startServer } from "../services/server.ts";

export function registerStart(program: Command): void {
  program
    .command("start")
    .description("Start the Conan Exiles server in a tmux session")
    .action(async () => {
      const cfg = loadConfig(program.opts().config);
      const { dir, binary } = cfg.server;
      const { session } = cfg.tmux;
      const { map, name, max_players, port, query_port, rcon_port, rcon_enabled, password, admin_password } = cfg.params;

      const running = await isServerRunning(session);
      if (running) {
        console.log(chalk.yellow(`Session '${session}' is already running.`));
        console.log(`  Attach: tmux attach -t ${session}`);
        console.log(`  Stop:   conan stop`);
        return;
      }

      const binaryPath = join(dir, binary);
      if (!existsSync(binaryPath)) {
        throw new Error(`Binary not found: ${binaryPath}\nRun \`conan install\` first.`);
      }

      await fixGameDbCase(dir);

      const launchCmd = buildLaunchCommand({
        dir,
        binary,
        map,
        name,
        maxPlayers: max_players,
        port,
        queryPort: query_port,
        rconPort: rcon_port,
        rconEnabled: rcon_enabled,
        password,
        adminPassword: admin_password,
      });

      await startServer(session, launchCmd);

      console.log(chalk.green(`Server started in tmux session '${session}'.`));
      console.log(`  Attach:  tmux attach -t ${session}`);
      console.log(`  Logs:    tail -f ${dir}/ConanSandbox/Saved/Logs/ConanSandbox.log`);
      console.log(`  Status:  conan status`);
    });
}
