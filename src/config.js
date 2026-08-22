const fs = require('node:fs');
const path = require('node:path');

const CONFIG_PATH = path.resolve(process.cwd(), 'config.json');
const EXAMPLE_CONFIG_PATH = path.resolve(process.cwd(), 'config.example.json');

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadConfig() {
  const filePath = fs.existsSync(CONFIG_PATH) ? CONFIG_PATH : EXAMPLE_CONFIG_PATH;
  const config = readJsonFile(filePath);

  assertConfig(config, filePath);

  return {
    ...config,
    __source: filePath,
    server: {
      ...config.server,
      port: Number(process.env.PORT || config.server.port),
    },
  };
}

function assertConfig(config, filePath) {
  const missing = [];

  if (!config.server) missing.push('server');
  if (!config.smtp) missing.push('smtp');
  if (!config.mail) missing.push('mail');

  if (config.server) {
    if (!config.server.port) missing.push('server.port');
    if (!Array.isArray(config.server.allowedOrigins)) missing.push('server.allowedOrigins');
  }

  if (config.smtp) {
    if (!config.smtp.host) missing.push('smtp.host');
    if (!config.smtp.port) missing.push('smtp.port');
    if (typeof config.smtp.secure !== 'boolean') missing.push('smtp.secure');
    if (!config.smtp.user) missing.push('smtp.user');
    if (!config.smtp.password) missing.push('smtp.password');
  }

  if (config.mail) {
    if (!config.mail.to) missing.push('mail.to');
    if (!config.mail.fromName) missing.push('mail.fromName');
    if (!config.mail.subjectPrefix) missing.push('mail.subjectPrefix');
  }

  if (missing.length) {
    throw new Error(`Invalid config at ${filePath}. Missing: ${missing.join(', ')}`);
  }
}

module.exports = {
  loadConfig,
};
