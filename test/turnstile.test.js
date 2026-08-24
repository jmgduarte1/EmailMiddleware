const test = require('node:test');
const assert = require('node:assert/strict');
const { verifyTurnstile } = require('../src/turnstile');

const config = {
  turnstile: {
    secretKey: 'server-secret', expectedHostnames: ['portfolio.example'],
    expectedAction: 'contact', timeoutMs: 1000,
  },
};

test('accepts a successful Turnstile result for the expected hostname and action', async () => {
  const fetchImpl = async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.secret, 'server-secret');
    assert.equal(body.response, 'browser-token');
    return { ok: true, json: async () => ({ success: true, hostname: 'portfolio.example', action: 'contact' }) };
  };
  assert.deepEqual(await verifyTurnstile(config, 'browser-token', '127.0.0.1', fetchImpl), { ok: true });
});

test('rejects mismatched hostnames and unavailable verification', async () => {
  const mismatch = async () => ({ ok: true, json: async () => ({ success: true, hostname: 'evil.example', action: 'contact' }) });
  assert.deepEqual(await verifyTurnstile(config, 'token', '127.0.0.1', mismatch), { ok: false, reason: 'hostname-mismatch' });
  assert.deepEqual(await verifyTurnstile(config, 'token', '127.0.0.1', async () => { throw new Error('offline'); }), { ok: false, reason: 'provider-unavailable' });
});
