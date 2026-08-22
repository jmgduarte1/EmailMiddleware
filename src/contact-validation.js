const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactSubmission(body) {
  const errors = {};
  const submission = {
    name: normalizeText(body?.name),
    email: normalizeText(body?.email).toLowerCase(),
    company: normalizeText(body?.company),
    message: normalizeMessage(body?.message),
  };

  if (submission.name.length < 2 || submission.name.length > 120) {
    errors.name = 'Name must be between 2 and 120 characters.';
  }

  if (!EMAIL_PATTERN.test(submission.email) || submission.email.length > 254) {
    errors.email = 'Email must be a valid email address.';
  }

  if (submission.company.length > 160) {
    errors.company = 'Company must be 160 characters or fewer.';
  }

  if (submission.message.length < 20 || submission.message.length > 5000) {
    errors.message = 'Message must be between 20 and 5000 characters.';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      ...submission,
      company: submission.company || undefined,
      createdAt: new Date().toISOString(),
    },
  };
}

function normalizeText(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function normalizeMessage(value) {
  return String(value ?? '').trim().replace(/\r\n/g, '\n');
}

module.exports = {
  validateContactSubmission,
};
