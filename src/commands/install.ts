import { defineCommand, option } from "@bunli/core";
import { existsSync } from "fs";
import { z } from "zod";
import { loadConfig } from "../config.ts";

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

    const currentUser = (await shell`id -un`.text()).trim();
    if (currentUser !== user) {
      console.log(
        colors.yellow(
          `Warning: running as '${currentUser}', expected '${user}'. Consider: sudo -u ${user} conan install`
        )
      );
    }

    const steamcmdCheck = await shell`${steamcmd} +quit`.nothrow().quiet();
    if (steamcmdCheck.exitCode !== 0) {
      console.error(colors.yellow(`SteamCMD not working: ${steamcmd}`));
      console.error(`Install SteamCMD first, then set server.steamcmd in config.yaml if it is not on PATH.`);
      console.error(`  https://developer.valvesoftware.com/wiki/SteamCMD#Downloading_SteamCMD`);
      process.exit(1);
    }

    console.log(colors.green(`Downloading server files (App ID: ${steam_app_id})...`));
    await shell`mkdir -p ${dir}`;
    await shell`${steamcmd} +force_install_dir ${dir} +login anonymous +app_update ${steam_app_id} validate +quit`;

    const binaryPath = `${dir}/${binary}`;
    if (existsSync(binaryPath)) {
      await shell`chmod +x ${binaryPath}`.quiet();
      console.log(colors.green(`Binary set executable: ${binaryPath}`));
    } else {
      console.log(colors.yellow(`Warning: binary not found at ${binaryPath}`));
      await shell`find ${dir} -maxdepth 2 -name "*.sh" -exec chmod +x {} \\;`.nothrow().quiet();
    }

    console.log("");
    console.log(colors.green("Installation complete!"));
    console.log(`  Config:  ${dir}/ConanSandbox/Saved/Config/LinuxServer/`);
    console.log(`  Logs:    ${dir}/ConanSandbox/Saved/Logs/ConanSandbox.log`);
    console.log("");
    console.log(`Next steps: edit config.yaml, then run \`conan start\`.`);
  },
});
