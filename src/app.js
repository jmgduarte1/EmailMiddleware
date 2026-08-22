const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sendContactEmail } = require('./mailer');
const { validateContactSubmission } = require('./contact-validation');

function createApp(config, options = {}) {
  const app = express();
  const sendEmail = options.sendEmail || ((submission) => sendContactEmail(config, submission));

  if (config.server.trustProxy) {
    app.set('trust proxy', 1);
  }

  app.use(helmet());
  app.use(express.json({ limit: '20kb' }));
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.server.allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('Origin not allowed by CORS.'));
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
      await sendEmail(validation.value);
      res.status(200).json({
        ok: true,
        message: 'Message sent.',
      });
    } catch (error) {
      next(error);
    }
  });

  app.use((err, _req, res, _next) => {
    console.error('Request failed:', safeError(err));
    res.status(500).json({
      ok: false,
      message: 'Unable to send message right now.',
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
    message: error?.message,
  };
}

module.exports = {
  createApp,
};
