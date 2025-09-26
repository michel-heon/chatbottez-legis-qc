#!/usr/bin/env node
/**
 * Ensures the given TCP port is free by terminating any process currently bound to it.
 * Usage: node scripts/free-port.js <port>
 */
const { execSync } = require('child_process');

const port = parseInt(process.argv[2], 10);

if (!port) {
  console.error('Usage: node scripts/free-port.js <port>');
  process.exit(1);
}

function killPid(pid, signal = 'SIGTERM') {
  try {
    process.kill(Number(pid), signal);
    console.log(`[free-port] Sent ${signal} to PID ${pid}`);
  } catch (err) {
    if (signal === 'SIGTERM') {
      killPid(pid, 'SIGKILL');
    } else {
      console.warn(`[free-port] Unable to kill PID ${pid}: ${err.message}`);
    }
  }
}

try {
  if (process.platform === 'win32') {
    const output = execSync(`netstat -ano | findstr :${port}`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    if (!output) {
      process.exit(0);
    }

    const pids = new Set(
      output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.split(/\s+/).pop())
        .filter((pid) => pid && pid !== '0')
    );

    pids.forEach((pid) => {
      try {
        execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
        console.log(`[free-port] Terminated PID ${pid} via taskkill`);
      } catch (err) {
        console.warn(`[free-port] Failed to terminate PID ${pid}: ${err.message}`);
      }
    });
  } else {
    const output = execSync(`lsof -ti tcp:${port}`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();

    if (!output) {
      process.exit(0);
    }

    const pids = new Set(output.split(/\r?\n/).filter(Boolean));
    pids.forEach((pid) => killPid(pid));
  }
} catch (err) {
  // Ignore "command failed" errors when no process is using the port.
  if (err.status !== 1) {
    console.warn(`[free-port] Warning: ${err.message}`);
  }
}
