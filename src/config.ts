import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { parse } from "yaml";
import { z } from "zod";

const ModSchema = z.object({
  id: z.coerce.string(),
  name: z.string().optional(),
});

export const ConfigSchema = z.object({
  server: z.object({
    user: z.string().default("steam"),
    dir: z.string(),
    steamcmd: z.string().default("steamcmd"),
    steam_app_id: z.coerce.string().default("443030"),
    binary: z.string().default("ConanSandboxServer.sh"),
  }),
  tmux: z.object({
    session: z.string().default("conan"),
  }),
  params: z.object({
    map: z.string().default("ConanSandbox"),
    name: z.string().default("Conan Exiles Server"),
    max_players: z.number().int().default(40),
    port: z.number().int().default(7777),
    query_port: z.number().int().default(27015),
    rcon_port: z.number().int().default(25575),
    rcon_enabled: z.boolean().default(true),
  }),
  backups: z.object({
    keep: z.number().int().default(5),
    dir: z.string().optional(),
  }),
  mods: z.object({
    app_id: z.coerce.string().default("440900"),
    list: z.array(ModSchema).default([]),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(configPath?: string): Config {
  const path = resolve(process.cwd(), configPath ?? "config.yaml");
  if (!existsSync(path)) {
    throw new Error(
      `Config file not found: ${path}\n` +
        `Run \`conan init\` to create one, or pass --config <path>.`
    );
  }
  const raw = readFileSync(path, "utf-8");
  const parsed = parse(raw);
  // Pre-fill optional top-level sections so individual field defaults apply cleanly
  const withSectionDefaults = { tmux: {}, params: {}, backups: {}, mods: {}, ...parsed };
  return ConfigSchema.parse(withSectionDefaults);
}
