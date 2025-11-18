const { spawn } = require('child_process');
const path = require('path');

/**
 * Spawns `npm run <script>` inside the provided directory and keeps track of the process
 * so it can be torn down when another process exits or when the user stops the orchestrator.
 */
function startScript(name, cwd, script) {
  const child = spawn('npm', ['run', script], {
    cwd,
    env: process.env,
    shell: true,
    stdio: 'inherit',
  });

  child.on('exit', (code) => {
    if (!shuttingDown) {
      console.error(`\n[${name}] exited with code ${code ?? 0}. Shutting down remaining services...`);
      shutdown(code ?? 1);
    }
  });

  runningProcesses.push({ name, child });
  console.log(`[${name}] started in ${cwd}`);
}

const runningProcesses = [];
let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  for (const { name, child } of runningProcesses) {
    if (!child.killed) {
      console.log(`Stopping ${name}...`);
      child.kill('SIGINT');
    }
  }

  // Give child processes a moment to clean up.
  setTimeout(() => process.exit(exitCode), 500);
}

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Cleaning up...');
  shutdown(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM. Cleaning up...');
  shutdown(0);
});

const root = __dirname;
startScript('backend', path.join(root, 'Betception-Backend'), 'start');
startScript('frontend', path.join(root, 'Betception-Frontend'), 'start');

console.log('\nAll services are running. Press Ctrl+C to stop.');
