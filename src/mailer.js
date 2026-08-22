const nodemailer = require('nodemailer');

function createTransport(config) {
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.password,
    },
  });
}

async function sendContactEmail(config, submission, transport = createTransport(config)) {
  const subject = `${config.mail.subjectPrefix} Contact form submission from ${submission.name}`;

  return transport.sendMail({
    to: config.mail.to,
    from: {
      name: config.mail.fromName,
      address: config.smtp.user,
    },
    replyTo: {
      name: submission.name,
      address: submission.email,
    },
    subject,
    text: buildTextBody(submission),
    html: buildHtmlBody(submission),
  });
}

function buildTextBody(submission) {
  return [
    'New portfolio contact form submission',
    '',
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    `Company: ${submission.company || 'Not provided'}`,
    `Submitted at: ${submission.createdAt}`,
    '',
    'Message:',
    submission.message,
  ].join('\n');
}

function buildHtmlBody(submission) {
  return `
    <h1>New portfolio contact form submission</h1>
    <p><strong>Name:</strong> ${escapeHtml(submission.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(submission.email)}</p>
    <p><strong>Company:</strong> ${escapeHtml(submission.company || 'Not provided')}</p>
    <p><strong>Submitted at:</strong> ${escapeHtml(submission.createdAt)}</p>
    <h2>Message</h2>
    <p>${escapeHtml(submission.message).replace(/\n/g, '<br>')}</p>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = {
  buildHtmlBody,
  buildTextBody,
  sendContactEmail,
};
