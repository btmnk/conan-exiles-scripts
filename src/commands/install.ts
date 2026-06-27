import { Command } from "commander";
import chalk from "chalk";
import { join } from "path";
import { loadConfig } from "../config.ts";
import { assertSteamCmd, getCurrentUser } from "../services/checks.ts";
import { ensureBinaryExecutable } from "../services/server.ts";

export function registerInstall(program: Command): void {
  program
    .command("install")
    .description("Install SteamCMD and download the Conan Exiles dedicated server")
    .action(async () => {
      const cfg = loadConfig(program.opts().config);
      const { user, dir, steamcmd, steam_app_id, binary } = cfg.server;

      const currentUser = await getCurrentUser();
      if (currentUser !== user) {
        console.log(
          chalk.yellow(
            `Warning: running as '${currentUser}', expected '${user}'. Consider: sudo -u ${user} conan install`
          )
        );
      }

      await assertSteamCmd(steamcmd);

      console.log(chalk.green(`Downloading server files (App ID: ${steam_app_id})...`));
      await Bun.$`mkdir -p ${dir}`;
      await Bun.$`${steamcmd} +force_install_dir ${dir} +login anonymous +app_update ${steam_app_id} validate +quit`;

      const found = await ensureBinaryExecutable(dir, binary);
      if (found) {
        console.log(chalk.green(`Binary set executable: ${join(dir, binary)}`));
      } else {
        console.log(chalk.yellow(`Warning: binary not found at ${join(dir, binary)}`));
      }

      console.log("");
      console.log(chalk.green("Installation complete!"));
      console.log(`  Config:  ${dir}/ConanSandbox/Saved/Config/LinuxServer/`);
      console.log(`  Logs:    ${dir}/ConanSandbox/Saved/Logs/ConanSandbox.log`);
      console.log("");
      console.log(`Next steps: edit config.yaml, then run \`conan start\`.`);
    });
}
