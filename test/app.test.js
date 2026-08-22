const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { createApp } = require('../src/app');

const config = {
  server: {
    allowedOrigins: ['http://localhost:4200'],
    trustProxy: false,
  },
  rateLimit: {
    windowMinutes: 15,
    maxRequests: 50,
  },
  smtp: {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    user: 'sender@example.com',
    password: 'secret',
  },
  mail: {
    to: 'destination@example.com',
    fromName: 'Portfolio Contact Form',
    subjectPrefix: '[Portfolio]',
  },
};

test('POST /api/contact validates and sends a contact submission', async () => {
  const sent = [];
  const server = createServer(
    createApp(config, {
      sendEmail: async (submission) => {
        sent.push(submission);
      },
    }),
  );

  await listen(server);

  try {
    const response = await fetch(`${baseUrl(server)}/api/contact`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:4200',
      },
      body: JSON.stringify({
        name: 'Jane Recruiter',
        email: 'jane@example.com',
        company: 'Example Co',
        message: 'I would like to discuss a senior frontend opportunity with you.',
      }),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      ok: true,
      message: 'Message sent.',
    });
    assert.equal(sent.length, 1);
    assert.equal(sent[0].email, 'jane@example.com');
  } finally {
    await close(server);
  }
});

test('POST /api/contact rejects invalid payloads before sending email', async () => {
  let sendCount = 0;
  const server = createServer(
    createApp(config, {
      sendEmail: async () => {
        sendCount += 1;
      },
    }),
  );

  await listen(server);

  try {
    const response = await fetch(`${baseUrl(server)}/api/contact`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:4200',
      },
      body: JSON.stringify({
        name: '',
        email: 'bad-email',
        message: 'short',
      }),
    });

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.ok, false);
    assert.equal(body.message, 'Invalid contact submission.');
    assert.equal(sendCount, 0);
  } finally {
    await close(server);
  }
});

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function baseUrl(server) {
  const address = server.address();
  return `http://${address.address}:${address.port}`;
}
