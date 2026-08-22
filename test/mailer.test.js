const test = require('node:test');
const assert = require('node:assert/strict');
const { buildHtmlBody, buildTextBody } = require('../src/mailer');

const submission = {
  name: 'Jane <Recruiter>',
  email: 'jane@example.com',
  company: 'Example Co',
  message: 'Can we discuss this role?\nHere is the job post.',
  createdAt: '2026-08-22T12:00:00.000Z',
};

test('builds readable plain text email body', () => {
  const body = buildTextBody(submission);

  assert.match(body, /Name: Jane <Recruiter>/);
  assert.match(body, /Email: jane@example.com/);
  assert.match(body, /Here is the job post./);
});

test('escapes html email body content', () => {
  const body = buildHtmlBody(submission);

  assert.match(body, /Jane &lt;Recruiter&gt;/);
  assert.doesNotMatch(body, /Jane <Recruiter>/);
});
