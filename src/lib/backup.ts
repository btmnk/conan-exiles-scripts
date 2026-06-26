import { existsSync } from "fs";
import { join } from "path";

export async function backupSaves(
  shell: typeof Bun.$,
  serverDir: string,
  backupDir: string,
  keep: number,
  colors: { green: (s: string) => string; yellow: (s: string) => string }
) {
  const savedDir = join(serverDir, "ConanSandbox/Saved");
  if (!existsSync(savedDir)) return;

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "")
    .replace("T", "_")
    .slice(0, 15);
  const dest = join(backupDir, `save_${timestamp}`);

  await shell`mkdir -p ${backupDir}`;
  console.log(colors.green(`Creating backup: ${dest}`));
  await shell`cp -r ${savedDir} ${dest}`;

  const list = (await shell`find ${backupDir} -maxdepth 1 -type d -name "save_*"`.text())
    .trim()
    .split("\n")
    .filter(Boolean)
    .sort();

  if (list.length > keep) {
    const toDelete = list.slice(0, list.length - keep);
    for (const old of toDelete) {
      await shell`rm -rf ${old}`.quiet();
    }
    console.log(colors.yellow(`Pruned ${toDelete.length} old backup(s), kept ${keep}.`));
  }
}
