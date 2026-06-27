import { Command } from "commander";
import chalk from "chalk";
import { registerInit } from "./commands/init.ts";
import { registerInstall } from "./commands/install.ts";
import { registerBackup } from "./commands/backup.ts";
import { registerUpdate } from "./commands/update.ts";
import { registerStart } from "./commands/start.ts";
import { registerStop } from "./commands/stop.ts";
import { registerStatus } from "./commands/status.ts";
import { registerMods } from "./commands/mods/index.ts";

const program = new Command();

program
  .name("conan")
  .description("Conan Exiles dedicated server management")
  .version("1.0.0")
  .option("-c, --config <path>", "path to config.yaml");

registerInit(program);
registerInstall(program);
registerBackup(program);
registerUpdate(program);
registerStart(program);
registerStop(program);
registerStatus(program);
registerMods(program);

program.parseAsync(process.argv).catch((err) => {
  console.error(chalk.red("Error:"), err.message);
  process.exit(1);
});
