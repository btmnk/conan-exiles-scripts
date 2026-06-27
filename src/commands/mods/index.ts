import { Command } from "commander";
import { registerModsUpdate } from "./update.ts";

export function registerMods(program: Command): void {
  const mods = program.command("mods").description("Manage server mods");
  registerModsUpdate(mods, program);
}
