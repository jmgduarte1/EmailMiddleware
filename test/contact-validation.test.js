const test = require('node:test');
const assert = require('node:assert/strict');
const { validateContactSubmission } = require('../src/contact-validation');

test('accepts a valid contact submission', () => {
  const result = validateContactSubmission({
    name: 'Jane Recruiter',
    email: 'Jane.Recruiter@example.com',
    company: 'Example Co',
    message: 'I would like to discuss a senior frontend opportunity with you.',
    turnstileToken: 'valid-token',
    website: '',
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.email, 'jane.recruiter@example.com');
  assert.equal(result.value.company, 'Example Co');
  assert.match(result.value.createdAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('rejects invalid contact submissions', () => {
  const result = validateContactSubmission({
    name: 'J',
    email: 'not-an-email',
    company: 'x'.repeat(161),
    message: 'Too short',
    turnstileToken: '',
  });

  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result.errors), ['name', 'email', 'company', 'message', 'verification']);
});

test('rejects a populated honeypot field', () => {
  const result = validateContactSubmission({
    name: 'Jane Recruiter',
    email: 'jane@example.com',
    message: 'I would like to discuss a senior frontend opportunity with you.',
    turnstileToken: 'valid-token',
    website: 'https://spam.example',
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.verification, 'Verification failed.');
});
