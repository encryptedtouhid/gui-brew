const { exec, spawn } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Get Homebrew path - works for both Intel and Apple Silicon Macs
const getBrewPath = () => {
  const paths = [
    '/opt/homebrew/bin/brew',  // Apple Silicon
    '/usr/local/bin/brew',      // Intel
    '/home/linuxbrew/.linuxbrew/bin/brew'  // Linux
  ];

  for (const p of paths) {
    try {
      require('fs').accessSync(p);
      return p;
    } catch (e) {
      continue;
    }
  }
  return 'brew'; // fallback to PATH
};

const BREW_PATH = getBrewPath();

// Execute brew command with timeout
const runBrewCommand = async (args, timeout = 300000) => {
  return new Promise((resolve, reject) => {
    const child = spawn(BREW_PATH, args, {
      env: { ...process.env, HOMEBREW_NO_AUTO_UPDATE: '1' }
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Command timed out'));
    }, timeout);

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ success: true, output: stdout, stderr });
      } else {
        resolve({ success: false, output: stdout, error: stderr || stdout, code });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
};

// Check if Homebrew is installed
const checkHomebrew = async () => {
  try {
    const result = await runBrewCommand(['--version']);
    return { installed: result.success, version: result.output.trim() };
  } catch (error) {
    return { installed: false, error: error.message };
  }
};

// Get Homebrew info
const getBrewInfo = async () => {
  try {
    const result = await runBrewCommand(['--version']);
    const configResult = await runBrewCommand(['--prefix']);
    return {
      success: true,
      version: result.output.trim(),
      prefix: configResult.output.trim()
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get Homebrew config
const getConfig = async () => {
  const result = await runBrewCommand(['config']);
  return result;
};

// List installed packages
const listInstalled = async (type = 'all') => {
  try {
    let formulae = [];
    let casks = [];

    if (type === 'all' || type === 'formulae') {
      const formulaeResult = await runBrewCommand(['list', '--formula', '-1']);
      if (formulaeResult.success && formulaeResult.output.trim()) {
        formulae = formulaeResult.output.trim().split('\n').map(name => ({
          name,
          type: 'formula'
        }));
      }
    }

    if (type === 'all' || type === 'casks') {
      const casksResult = await runBrewCommand(['list', '--cask', '-1']);
      if (casksResult.success && casksResult.output.trim()) {
        casks = casksResult.output.trim().split('\n').map(name => ({
          name,
          type: 'cask'
        }));
      }
    }

    return {
      success: true,
      formulae,
      casks,
      all: [...formulae, ...casks]
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Search packages
const search = async (query) => {
  try {
    const result = await runBrewCommand(['search', query]);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    const lines = result.output.trim().split('\n');
    const formulae = [];
    const casks = [];
    let currentSection = 'formulae';

    for (const line of lines) {
      if (line.includes('==> Formulae')) {
        currentSection = 'formulae';
        continue;
      }
      if (line.includes('==> Casks')) {
        currentSection = 'casks';
        continue;
      }
      if (line.trim() && !line.startsWith('==>')) {
        // Handle multiple packages per line (space separated)
        const packages = line.trim().split(/\s+/);
        for (const pkg of packages) {
          if (pkg) {
            if (currentSection === 'formulae') {
              formulae.push({ name: pkg, type: 'formula' });
            } else {
              casks.push({ name: pkg, type: 'cask' });
            }
          }
        }
      }
    }

    return { success: true, formulae, casks };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get package info
const getPackageInfo = async (name, isCask = false) => {
  try {
    const args = isCask ? ['info', '--cask', name] : ['info', name];
    const result = await runBrewCommand(args);

    // Also try to get JSON info for more structured data
    const jsonArgs = isCask ? ['info', '--cask', '--json=v2', name] : ['info', '--json=v2', name];
    const jsonResult = await runBrewCommand(jsonArgs);

    let jsonData = null;
    if (jsonResult.success) {
      try {
        jsonData = JSON.parse(jsonResult.output);
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    return {
      success: result.success,
      info: result.output,
      json: jsonData,
      error: result.error
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Install package
const install = async (name, isCask = false) => {
  const args = isCask ? ['install', '--cask', name] : ['install', name];
  return await runBrewCommand(args, 600000); // 10 min timeout for installs
};

// Uninstall package
const uninstall = async (name, isCask = false) => {
  const args = isCask ? ['uninstall', '--cask', name] : ['uninstall', name];
  return await runBrewCommand(args);
};

// Update Homebrew
const update = async () => {
  // Remove HOMEBREW_NO_AUTO_UPDATE for this command
  return new Promise((resolve, reject) => {
    const child = spawn(BREW_PATH, ['update'], {
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout || 'Already up-to-date.' });
      } else {
        resolve({ success: false, error: stderr || stdout });
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
};

// Upgrade packages
const upgrade = async (name = null, isCask = false) => {
  let args = ['upgrade'];
  if (name) {
    if (isCask) {
      args = ['upgrade', '--cask', name];
    } else {
      args.push(name);
    }
  }
  return await runBrewCommand(args, 600000);
};

// Get outdated packages
const getOutdated = async () => {
  try {
    const formulaeResult = await runBrewCommand(['outdated', '--formula']);
    const casksResult = await runBrewCommand(['outdated', '--cask']);

    const formulae = formulaeResult.output.trim()
      ? formulaeResult.output.trim().split('\n').map(line => {
          const parts = line.split(' ');
          return { name: parts[0], type: 'formula', info: line };
        })
      : [];

    const casks = casksResult.output.trim()
      ? casksResult.output.trim().split('\n').map(line => {
          const parts = line.split(' ');
          return { name: parts[0], type: 'cask', info: line };
        })
      : [];

    return { success: true, formulae, casks, all: [...formulae, ...casks] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Cleanup
const cleanup = async (dryRun = false) => {
  const args = dryRun ? ['cleanup', '-n'] : ['cleanup'];
  return await runBrewCommand(args);
};

// Doctor
const doctor = async () => {
  return await runBrewCommand(['doctor'], 120000);
};

// Autoremove
const autoremove = async () => {
  return await runBrewCommand(['autoremove']);
};

// Get leaves (packages not depended on)
const getLeaves = async () => {
  const result = await runBrewCommand(['leaves']);
  if (result.success && result.output.trim()) {
    return {
      success: true,
      leaves: result.output.trim().split('\n')
    };
  }
  return { success: true, leaves: [] };
};

// Services
const getServices = async () => {
  try {
    const result = await runBrewCommand(['services', 'list']);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    const lines = result.output.trim().split('\n');
    const services = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/\s+/);
      if (parts.length >= 2) {
        services.push({
          name: parts[0],
          status: parts[1],
          user: parts[2] || '',
          file: parts[3] || ''
        });
      }
    }

    return { success: true, services };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const startService = async (name) => {
  return await runBrewCommand(['services', 'start', name]);
};

const stopService = async (name) => {
  return await runBrewCommand(['services', 'stop', name]);
};

const restartService = async (name) => {
  return await runBrewCommand(['services', 'restart', name]);
};

// Taps
const listTaps = async () => {
  const result = await runBrewCommand(['tap']);
  if (result.success && result.output.trim()) {
    return {
      success: true,
      taps: result.output.trim().split('\n')
    };
  }
  return { success: true, taps: [] };
};

const addTap = async (name) => {
  return await runBrewCommand(['tap', name]);
};

const removeTap = async (name) => {
  return await runBrewCommand(['untap', name]);
};

// Pinning
const pin = async (name) => {
  return await runBrewCommand(['pin', name]);
};

const unpin = async (name) => {
  return await runBrewCommand(['unpin', name]);
};

const getPinned = async () => {
  const result = await runBrewCommand(['list', '--pinned']);
  if (result.success && result.output.trim()) {
    return {
      success: true,
      pinned: result.output.trim().split('\n')
    };
  }
  return { success: true, pinned: [] };
};

// Dependencies
const getDependencies = async (name) => {
  const result = await runBrewCommand(['deps', '--tree', name]);
  return result;
};

const getUses = async (name) => {
  const result = await runBrewCommand(['uses', '--installed', name]);
  if (result.success && result.output.trim()) {
    return {
      success: true,
      uses: result.output.trim().split('\n')
    };
  }
  return { success: true, uses: [] };
};

// Run custom command
const runCustomCommand = async (args) => {
  if (typeof args === 'string') {
    args = args.split(/\s+/).filter(a => a);
  }
  return await runBrewCommand(args, 300000);
};

module.exports = {
  checkHomebrew,
  getBrewInfo,
  getConfig,
  listInstalled,
  search,
  getPackageInfo,
  install,
  uninstall,
  update,
  upgrade,
  getOutdated,
  cleanup,
  doctor,
  autoremove,
  getLeaves,
  getServices,
  startService,
  stopService,
  restartService,
  listTaps,
  addTap,
  removeTap,
  pin,
  unpin,
  getPinned,
  getDependencies,
  getUses,
  runCustomCommand
};
