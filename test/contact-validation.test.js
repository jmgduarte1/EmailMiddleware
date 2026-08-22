const test = require('node:test');
const assert = require('node:assert/strict');
const { validateContactSubmission } = require('../src/contact-validation');

test('accepts a valid contact submission', () => {
  const result = validateContactSubmission({
    name: 'Jane Recruiter',
    email: 'Jane.Recruiter@example.com',
    company: 'Example Co',
    message: 'I would like to discuss a senior frontend opportunity with you.',
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
  });

  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result.errors), ['name', 'email', 'company', 'message']);
});
