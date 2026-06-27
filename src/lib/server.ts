import { existsSync } from "fs";
import { join } from "path";

export async function stopServer(session: string): Promise<void> {
  await Bun.$`tmux send-keys -t ${session} C-c`.quiet();
  await Bun.sleep(5000);
  const stillRunning = await Bun.$`tmux has-session -t ${session}`.nothrow().quiet();
  if (stillRunning.exitCode === 0) {
    await Bun.$`tmux kill-session -t ${session}`.quiet();
  }
}

// Returns true if the named binary was found and chmod'd, false if it fell back to all .sh files.
export async function ensureBinaryExecutable(dir: string, binary: string): Promise<boolean> {
  const binaryPath = join(dir, binary);
  if (existsSync(binaryPath)) {
    await Bun.$`chmod +x ${binaryPath}`.quiet();
    return true;
  }
  await Bun.$`find ${dir} -maxdepth 2 -name "*.sh" -exec chmod +x {} \\;`.nothrow().quiet();
  return false;
}
