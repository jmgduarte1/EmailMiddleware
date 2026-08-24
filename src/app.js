const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { randomUUID } = require('node:crypto');
const { sendContactEmail } = require('./mailer');
const { validateContactSubmission } = require('./contact-validation');
const { verifyTurnstile } = require('./turnstile');

function createApp(config, options = {}) {
  const app = express();
  const sendEmail = options.sendEmail || ((submission) => sendContactEmail(config, submission));
  const verifyChallenge = options.verifyChallenge || ((token, remoteIp) => verifyTurnstile(config, token, remoteIp));

  if (config.server.trustProxy) {
    app.set('trust proxy', 1);
  }

  app.use(helmet());
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.setHeader('x-request-id', req.requestId);
    next();
  });
  app.use(express.json({ limit: '20kb' }));
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.server.allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        const error = new Error('Origin not allowed by CORS.');
        error.code = 'CORS_DENIED';
        callback(error);
      },
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/contact', createContactLimiter(config), async (req, res, next) => {
    const validation = validateContactSubmission(req.body);

    if (!validation.ok) {
      res.status(400).json({
        ok: false,
        message: 'Invalid contact submission.',
        errors: validation.errors,
      });
      return;
    }

    try {
      const verification = await verifyChallenge(validation.value.turnstileToken, req.ip);
      if (!verification.ok) {
        console.warn('Contact verification rejected:', { requestId: req.requestId, reason: verification.reason });
        res.status(400).json({ ok: false, message: 'Unable to verify this submission. Please try again.' });
        return;
      }

      const { turnstileToken: _turnstileToken, ...submission } = validation.value;
      await sendEmail(submission);
      res.status(200).json({
        ok: true,
        message: 'Message sent.',
      });
    } catch (error) {
      next(error);
    }
  });

  app.use((err, _req, res, _next) => {
    console.error('Request failed:', { requestId: _req.requestId, ...safeError(err) });
    const corsDenied = err?.code === 'CORS_DENIED';
    res.status(corsDenied ? 403 : 500).json({
      ok: false,
      message: corsDenied ? 'Request origin is not allowed.' : 'Unable to send message right now.',
    });
  });

  return app;
}

function createContactLimiter(config) {
  const windowMinutes = Number(config.rateLimit?.windowMinutes || 15);
  const maxRequests = Number(config.rateLimit?.maxRequests || 5);

  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit: maxRequests,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      ok: false,
      message: 'Too many contact requests. Please try again later.',
    },
  });
}

function safeError(error) {
  return {
    name: error?.name,
    category: error?.code || 'UNEXPECTED_ERROR',
  };
}

module.exports = {
  createApp,
};
