#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const packageJson = require('../package.json');
const VERSION = packageJson.version;

const axonDir = path.join(os.homedir(), '.axon');
const venvDir = path.join(axonDir, 'venv');
const versionFile = path.join(axonDir, '.npm_version');

const isWindows = process.platform === 'win32';
const pythonExe = isWindows 
  ? path.join(venvDir, 'Scripts', 'python.exe')
  : path.join(venvDir, 'bin', 'python');
const pipExe = isWindows 
  ? path.join(venvDir, 'Scripts', 'pip.exe')
  : path.join(venvDir, 'bin', 'pip');
const axonBin = isWindows
  ? path.join(venvDir, 'Scripts', 'axon-server.exe')
  : path.join(venvDir, 'bin', 'axon-server');

const packageDir = path.dirname(__dirname);

function getSystemPython() {
  const commands = ['python3', 'python'];
  for (const cmd of commands) {
    try {
      const output = execSync(`${cmd} --version`, { stdio: 'pipe' }).toString();
      if (output.includes('Python 3')) {
        return cmd;
      }
    } catch (e) {}
  }
  return null;
}

function setupVenv() {
  if (!fs.existsSync(axonDir)) {
    fs.mkdirSync(axonDir, { recursive: true });
  }

  const systemPython = getSystemPython();
  if (!systemPython) {
    console.error('Error: Python 3 (version >= 3.12) is required to run Axon Protocol Server.');
    console.error('Please install Python 3 and make sure it is in your system PATH.');
    process.exit(1);
  }

  console.log(`Setting up Axon local Python environment in ${venvDir}...`);
  try {
    execSync(`"${systemPython}" -m venv "${venvDir}"`, { stdio: 'inherit' });
  } catch (e) {
    console.error('Error creating virtual environment:', e.message);
    process.exit(1);
  }

  console.log('Installing Python dependencies (this may take a minute on the first run)...');
  try {
    // Upgrade pip first using python executable to avoid locking issues on Windows
    execSync(`"${pythonExe}" -m pip install --upgrade pip`, { stdio: 'inherit' });
    // Install the package locally
    execSync(`"${pipExe}" install "${packageDir}"`, { stdio: 'inherit' });
  } catch (e) {
    console.error('Error installing Python package:', e.message);
    process.exit(1);
  }

  fs.writeFileSync(versionFile, VERSION);
}

// 1. Check if setup is needed
let needsSetup = !fs.existsSync(pythonExe) || !fs.existsSync(axonBin);
if (!needsSetup && fs.existsSync(versionFile)) {
  const installedVersion = fs.readFileSync(versionFile, 'utf8').trim();
  if (installedVersion !== VERSION) {
    needsSetup = true;
  }
}

if (needsSetup) {
  setupVenv();
}

// 2. Spawn the axon server CLI
const args = process.argv.slice(2);
const child = spawn(axonBin, args, { stdio: 'inherit', shell: true });

child.on('close', (code) => {
  process.exit(code);
});
