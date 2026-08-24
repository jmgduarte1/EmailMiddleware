const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

async function verifyTurnstile(config, token, remoteIp, fetchImpl = fetch) {
  let response;

  try {
    response = await fetchImpl(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        secret: config.turnstile.secretKey,
        response: token,
        remoteip: remoteIp,
      }),
      signal: AbortSignal.timeout(config.turnstile.timeoutMs),
    });
  } catch {
    return { ok: false, reason: 'provider-unavailable' };
  }

  if (!response.ok) return { ok: false, reason: 'provider-unavailable' };

  const result = await response.json();
  if (!result.success) return { ok: false, reason: 'challenge-failed' };
  if (
    config.turnstile.expectedHostnames.length > 0 &&
    !config.turnstile.expectedHostnames.includes(result.hostname)
  ) {
    return { ok: false, reason: 'hostname-mismatch' };
  }
  if (config.turnstile.expectedAction && result.action !== config.turnstile.expectedAction) {
    return { ok: false, reason: 'action-mismatch' };
  }

  return { ok: true };
}

module.exports = { verifyTurnstile };
