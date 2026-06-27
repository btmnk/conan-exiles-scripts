import { existsSync } from "fs";
import { join } from "path";

export interface BackupResult {
  dest: string;
  pruned: number;
  skipped: boolean;
}

export async function backupSaves(serverDir: string, backupDir: string, keep: number): Promise<BackupResult> {
  const savedDir = join(serverDir, "ConanSandbox/Saved");
  if (!existsSync(savedDir)) {
    return { dest: "", pruned: 0, skipped: true };
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "")
    .replace("T", "_")
    .slice(0, 15);
  const dest = join(backupDir, `save_${timestamp}`);

  await Bun.$`mkdir -p ${backupDir}`;
  await Bun.$`cp -r ${savedDir} ${dest}`;

  const list = (await Bun.$`find ${backupDir} -maxdepth 1 -type d -name "save_*"`.text())
    .trim()
    .split("\n")
    .filter(Boolean)
    .sort();

  let pruned = 0;
  if (list.length > keep) {
    const toDelete = list.slice(0, list.length - keep);
    for (const old of toDelete) {
      await Bun.$`rm -rf ${old}`.quiet();
    }
    pruned = toDelete.length;
  }

  return { dest, pruned, skipped: false };
}

export async function countBackups(backupDir: string): Promise<number> {
  if (!existsSync(backupDir)) return 0;
  const output = await Bun.$`find ${backupDir} -maxdepth 1 -type d -name "save_*"`.nothrow().text();
  return output.trim().split("\n").filter(Boolean).length;
}
