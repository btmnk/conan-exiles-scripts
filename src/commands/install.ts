import { defineCommand, option } from "@bunli/core";
import { join } from "path";
import { z } from "zod";
import { loadConfig } from "../config.ts";
import { checkSteamCmd, checkCurrentUser } from "../lib/checks.ts";
import { ensureBinaryExecutable } from "../lib/server.ts";

export default defineCommand({
  name: "install",
  description: "Install SteamCMD and download the Conan Exiles dedicated server",
  options: {
    config: option(z.string().optional(), {
      description: "Path to config.yaml",
      short: "c",
    }),
  },
  handler: async ({ flags, shell, colors }) => {
    const cfg = loadConfig(flags.config);
    const { user, dir, steamcmd, steam_app_id, binary } = cfg.server;

    await checkCurrentUser(user, "install", colors);
    await checkSteamCmd(steamcmd, colors);

    console.log(colors.green(`Downloading server files (App ID: ${steam_app_id})...`));
    await shell`mkdir -p ${dir}`;
    await shell`${steamcmd} +force_install_dir ${dir} +login anonymous +app_update ${steam_app_id} validate +quit`;

    const found = await ensureBinaryExecutable(dir, binary);
    if (found) {
      console.log(colors.green(`Binary set executable: ${join(dir, binary)}`));
    } else {
      console.log(colors.yellow(`Warning: binary not found at ${join(dir, binary)}`));
    }

    console.log("");
    console.log(colors.green("Installation complete!"));
    console.log(`  Config:  ${dir}/ConanSandbox/Saved/Config/LinuxServer/`);
    console.log(`  Logs:    ${dir}/ConanSandbox/Saved/Logs/ConanSandbox.log`);
    console.log("");
    console.log(`Next steps: edit config.yaml, then run \`conan start\`.`);
  },
});
