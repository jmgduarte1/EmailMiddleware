# EmailMiddleware

Small Node.js / Express middleware for the PortfolioJMGD contact form.

## Setup

Install dependencies:

```bash
npm install
```

Create your private config:

```bash
copy config.example.json config.json
```

Edit `config.json` for local development only. Production secrets should be supplied directly as runtime environment variables; do not generate or deploy a file containing secrets.

Required production secret variables are `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_TO`, and `TURNSTILE_SECRET_KEY`. Set `ALLOWED_ORIGINS` and `TURNSTILE_EXPECTED_HOSTNAMES` as comma-separated lists.

For local Turnstile testing, Cloudflare provides the always-pass secret `1x0000000000000000000000000000000AA`, paired with the public site key in the Angular development configuration. Never use test keys in production.

## Run

```bash
npm start
```

The default local API is:

```http
POST http://localhost:8080/api/contact
```

## Request Body

```json
{
  "name": "Recruiter Name",
  "email": "recruiter@example.com",
  "company": "Company Name",
  "message": "Opportunity details, including job post link if available.",
  "turnstileToken": "single-use-token-from-the-widget",
  "website": ""
}
```

`website` is an intentionally empty honeypot field. Turnstile tokens are verified server-side and are never forwarded to email delivery.

## Success Response

```json
{
  "ok": true,
  "message": "Message sent."
}
```

## Gmail Notes

Use a Gmail app password, not your normal Gmail account password.

The sender account is the configured SMTP Gmail user. The visitor email is applied as `replyTo`, so replies go to the person who submitted the form.
