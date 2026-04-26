const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const logsDir = path.join(projectRoot, 'logs');

fs.mkdirSync(logsDir, { recursive: true });

const stdoutPath = path.join(logsDir, 'expo-dev.log');
const stderrPath = path.join(logsDir, 'expo-dev.err.log');

const stdoutStream = fs.createWriteStream(stdoutPath, { flags: 'w' });
const stderrStream = fs.createWriteStream(stderrPath, { flags: 'w' });

const expoCliPath = require.resolve('expo/bin/cli', { paths: [projectRoot] });
const expoArgs = [expoCliPath, 'start', ...process.argv.slice(2)];

const child = spawn(process.execPath, expoArgs, {
  cwd: projectRoot,
  env: process.env,
  stdio: ['inherit', 'pipe', 'pipe'],
});

child.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  stdoutStream.write(chunk);
});

child.stderr.on('data', (chunk) => {
  process.stderr.write(chunk);
  stderrStream.write(chunk);
});

const closeStreams = () => {
  stdoutStream.end();
  stderrStream.end();
};

child.on('error', (error) => {
  process.stderr.write(`${error.stack || error}\n`);
  closeStreams();
  process.exit(1);
});

child.on('close', (code, signal) => {
  closeStreams();

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => {
    if (!child.killed) {
      child.kill(signal);
    }
  });
});
