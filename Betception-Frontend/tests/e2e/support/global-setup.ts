import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { get } from 'http';
import { join, resolve } from 'path';

// Betception-Frontend/ — playwright.config.ts lives here; global-setup.ts is 3 levels down
const PROJECT_ROOT = resolve(__dirname, '../../..');
const NG_BIN = join(PROJECT_ROOT, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');

export const SERVER_URL = 'http://127.0.0.1:4200';
export const PID_FILE = join(PROJECT_ROOT, '.ng-serve.pid');

function isServerUp(): Promise<boolean> {
  return new Promise((res) => {
    const req = get(SERVER_URL, (response) => {
      response.resume();
      res(true);
    });
    req.on('error', () => res(false));
    req.setTimeout(2000, () => {
      req.destroy();
      res(false);
    });
  });
}

async function waitForServer(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isServerUp()) return;
    await new Promise<void>((r) => setTimeout(r, 500));
  }
  throw new Error(`Timed out waiting for ${SERVER_URL} after ${timeoutMs}ms`);
}

export default async function globalSetup() {
  if (await isServerUp()) {
    console.log(`[e2e] Reusing existing server at ${SERVER_URL}`);
    return;
  }

  console.log('[e2e] Starting ng serve…');

  // Strip corporate proxy env vars so Node's http.get health-check reaches
  // 127.0.0.1 directly instead of going through a proxy (e.g. Bosch port 3128).
  // Safe to leave in place for non-proxy environments — deleting non-existent
  // env vars is a no-op.
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const k of ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy']) {
    delete env[k];
  }
  env['NO_PROXY'] = '127.0.0.1,localhost,::1';
  env['no_proxy'] = env['NO_PROXY'];

  const server = spawn(
    process.execPath, // node.exe — avoids shell quoting issues on Windows
    [NG_BIN, 'serve', '--host', '127.0.0.1', '--port', '4200', '--configuration', 'development'],
    {
      cwd: PROJECT_ROOT,
      env,
      // 'ignore' stdout prevents Windows pipe-buffer deadlock when Playwright
      // doesn't drain fast enough; pipe stderr so compilation errors are visible.
      stdio: ['ignore', 'ignore', 'pipe'],
    },
  );

  server.stderr?.on('data', (d: Buffer) => process.stderr.write(d));
  server.on('error', (err: Error) =>
    process.stderr.write(`[e2e] ng serve spawn error: ${err.message}\n`),
  );
  server.on('exit', (code: number | null) => {
    if (code !== null && code !== 0)
      process.stderr.write(`[e2e] ng serve exited early with code ${code}\n`);
  });

  // Store reference for teardown (works when setup + teardown share the same process)
  (global as Record<string, unknown>)['__E2E_NG_SERVER__'] = server;
  writeFileSync(PID_FILE, String(server.pid ?? ''));

  try {
    await waitForServer(120_000);
    console.log('[e2e] ng serve ready.');
  } catch (err) {
    server.kill();
    throw err;
  }
}
