const { spawn } = require('child_process');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const processes = [
  { name: 'backend', cwd: 'backend', color: '\x1b[36m' },
  { name: 'dashboard', cwd: 'web-dashboard', color: '\x1b[35m' },
];

const reset = '\x1b[0m';
const children = [];
let shuttingDown = false;

const writePrefixed = (stream, label, color, chunk) => {
  const text = chunk.toString();
  const lines = text.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!line && index === lines.length - 1) {
      continue;
    }

    stream.write(`${color}[${label}]${reset} ${line}\n`);
  }
};

const shutdown = (exitCode = 0, signal) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill(signal || 'SIGTERM');
    }
  }

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(exitCode);
};

for (const processConfig of processes) {
  const child = spawn(npmCommand, ['run', 'dev'], {
    cwd: processConfig.cwd,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env,
    shell: process.platform === 'win32',
  });

  children.push(child);

  child.stdout.on('data', (chunk) => {
    writePrefixed(process.stdout, processConfig.name, processConfig.color, chunk);
  });

  child.stderr.on('data', (chunk) => {
    writePrefixed(process.stderr, processConfig.name, processConfig.color, chunk);
  });

  child.on('error', (error) => {
    process.stderr.write(`${processConfig.name} failed to start: ${error.stack || error}\n`);
    shutdown(1);
  });

  child.on('close', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    if (signal) {
      process.stderr.write(`${processConfig.name} exited with signal ${signal}\n`);
      shutdown(1);
      return;
    }

    if ((code ?? 0) !== 0) {
      process.stderr.write(`${processConfig.name} exited with code ${code}\n`);
      shutdown(code ?? 1);
      return;
    }

    process.stdout.write(`${processConfig.name} stopped.\n`);
    shutdown(0);
  });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => shutdown(0, signal));
}
