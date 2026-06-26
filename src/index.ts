import { createCLI } from "@bunli/core";
import initCommand from "./commands/init.ts";
import installCommand from "./commands/install.ts";
import backupCommand from "./commands/backup.ts";
import updateCommand from "./commands/update.ts";
import startCommand from "./commands/start.ts";
import stopCommand from "./commands/stop.ts";
import statusCommand from "./commands/status.ts";
import modsGroup from "./commands/mods.ts";

const cli = await createCLI({
  name: "conan",
  version: "1.0.0",
  description: "Conan Exiles dedicated server management",
});

cli.command(initCommand);
cli.command(installCommand);
cli.command(backupCommand);
cli.command(updateCommand);
cli.command(startCommand);
cli.command(stopCommand);
cli.command(statusCommand);
cli.command(modsGroup);

await cli.run();
