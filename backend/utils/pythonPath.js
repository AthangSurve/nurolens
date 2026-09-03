const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let cachedPythonPath = null;

/**
 * Discovers and returns a working Python executable path.
 * On Windows, avoids the Microsoft Store stub (AppData/Local/Microsoft/WindowsApps/python.exe)
 * which fails with "Python was not found".
 */
function getPythonPath() {
  if (cachedPythonPath) return cachedPythonPath;

  // 1. Explicit environment variable
  if (process.env.PYTHON_PATH && fs.existsSync(process.env.PYTHON_PATH)) {
    cachedPythonPath = process.env.PYTHON_PATH;
    return cachedPythonPath;
  }

  // 2. Windows-specific auto-discovery
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || '';
    const userProfile = process.env.USERPROFILE || '';

    const candidates = [
      path.join(localAppData, 'Python', 'bin', 'python.exe'),
      path.join(localAppData, 'Python', 'pythoncore-3.14-64', 'python.exe'),
      path.join(localAppData, 'Programs', 'Python', 'Python314', 'python.exe'),
      path.join(localAppData, 'Programs', 'Python', 'Python313', 'python.exe'),
      path.join(localAppData, 'Programs', 'Python', 'Python312', 'python.exe'),
      path.join(localAppData, 'Programs', 'Python', 'Python311', 'python.exe'),
      path.join(localAppData, 'Programs', 'Python', 'Python310', 'python.exe'),
      'C:\\Python314\\python.exe',
      'C:\\Python313\\python.exe',
      'C:\\Python312\\python.exe',
      'C:\\Python311\\python.exe',
      'C:\\Python310\\python.exe',
    ];

    for (const c of candidates) {
      if (fs.existsSync(c)) {
        cachedPythonPath = c;
        return cachedPythonPath;
      }
    }

    try {
      const output = execSync('where.exe python', { encoding: 'utf8' });
      const lines = output.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (!line.toLowerCase().includes('windowsapps') && fs.existsSync(line)) {
          cachedPythonPath = line;
          return cachedPythonPath;
        }
      }
    } catch (_) {}
  }

  // 3. Fallback to standard command names
  cachedPythonPath = process.platform === 'win32' ? 'python' : 'python3';
  return cachedPythonPath;
}

module.exports = { getPythonPath };
