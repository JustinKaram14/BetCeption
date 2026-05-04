import { ChildProcess } from 'child_process';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { PID_FILE } from './global-setup';

export default async function globalTeardown() {
  // Prefer the in-memory handle when setup and teardown share the same process
  const server = (global as Record<string, unknown>)['__E2E_NG_SERVER__'] as
    | ChildProcess
    | undefined;
  if (server) {
    server.kill();
    console.log('[e2e] ng serve stopped.');
    return;
  }

  // Fallback: read the PID file written by globalSetup
  if (!existsSync(PID_FILE)) return;
  const pid = parseInt(readFileSync(PID_FILE, 'utf8').trim(), 10);
  if (!isNaN(pid)) {
    try {
      process.kill(pid);
      console.log(`[e2e] ng serve stopped (pid ${pid}).`);
    } catch {
      // Process already gone — nothing to do
    }
  }
  unlinkSync(PID_FILE);
}
