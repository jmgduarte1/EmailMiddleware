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

  const normalized = {
    ...config,
    __source: filePath,
    server: {
      ...config.server,
      port: Number(process.env.PORT || config.server.port),
      allowedOrigins: readList(process.env.ALLOWED_ORIGINS) || config.server.allowedOrigins,
      trustProxy: readBoolean(process.env.TRUST_PROXY, config.server.trustProxy),
    },
    rateLimit: {
      windowMinutes: Number(process.env.RATE_LIMIT_WINDOW_MINUTES || config.rateLimit?.windowMinutes || 15),
      maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS || config.rateLimit?.maxRequests || 5),
    },
    smtp: {
      ...config.smtp,
      host: process.env.SMTP_HOST || config.smtp.host,
      port: Number(process.env.SMTP_PORT || config.smtp.port),
      secure: readBoolean(process.env.SMTP_SECURE, config.smtp.secure),
      user: process.env.SMTP_USER || config.smtp.user,
      password: process.env.SMTP_PASSWORD || config.smtp.password,
    },
    mail: {
      ...config.mail,
      to: process.env.MAIL_TO || config.mail.to,
      fromName: process.env.MAIL_FROM_NAME || config.mail.fromName,
      subjectPrefix: process.env.MAIL_SUBJECT_PREFIX || config.mail.subjectPrefix,
    },
    turnstile: {
      secretKey: process.env.TURNSTILE_SECRET_KEY || config.turnstile?.secretKey,
      expectedHostnames:
        readList(process.env.TURNSTILE_EXPECTED_HOSTNAMES) || config.turnstile?.expectedHostnames || [],
      expectedAction: readOptionalString(process.env.TURNSTILE_EXPECTED_ACTION, config.turnstile?.expectedAction, 'contact'),
      timeoutMs: Number(process.env.TURNSTILE_TIMEOUT_MS || config.turnstile?.timeoutMs || 5000),
    },
  };

  assertConfig(normalized, filePath);
  return normalized;
}

function assertConfig(config, filePath) {
  const missing = [];

  if (!config.server) missing.push('server');
  if (!config.smtp) missing.push('smtp');
  if (!config.mail) missing.push('mail');
  if (!config.turnstile) missing.push('turnstile');

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

  if (config.turnstile) {
    if (!config.turnstile.secretKey) missing.push('turnstile.secretKey');
    if (!Array.isArray(config.turnstile.expectedHostnames)) missing.push('turnstile.expectedHostnames');
  }

  if (missing.length) {
    throw new Error(`Invalid config at ${filePath}. Missing: ${missing.join(', ')}`);
  }
}

function readList(value) {
  return value ? value.split(',').map((item) => item.trim()).filter(Boolean) : undefined;
}

function readBoolean(value, fallback) {
  if (value === undefined) return fallback;
  return value === 'true';
}

function readOptionalString(envValue, configValue, fallback) {
  if (envValue !== undefined) return envValue;
  if (configValue !== undefined) return configValue;
  return fallback;
}

module.exports = {
  loadConfig,
};
