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

Edit `config.json` with your Gmail address, Gmail app password, destination email, allowed origins, and deployment port.

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
  "message": "Opportunity details, including job post link if available."
}
```

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
