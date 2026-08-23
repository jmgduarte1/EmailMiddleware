# Email Middleware Architecture

## Purpose

The Email Middleware is a standalone Node.js / Express backend responsible for securely receiving contact submissions from the portfolio application and delivering them through a configured email provider.

The middleware provides a stable HTTP API while isolating the frontend from:

* Email-provider credentials.
* SMTP implementation details.
* Server-side validation.
* Abuse prevention.
* Provider errors.
* Backend configuration.

The middleware is deployed independently from the Angular portfolio.

---

## Primary Responsibilities

The middleware is responsible for:

* Receiving contact submissions.
* Validating all external input.
* Restricting allowed frontend origins.
* Applying rate limiting.
* Applying spam/abuse protection.
* Normalizing API responses.
* Sending messages through an email provider.
* Protecting credentials and secrets.
* Logging operational information safely.
* Preventing provider-specific implementation details from leaking to API clients.

---

## High-Level Architecture

```text
Angular Portfolio
       |
       | HTTPS
       | POST /api/contact
       v
Express Application
       |
       v
Request Validation
       |
       v
Security / Abuse Controls
       |
       v
Contact Service
       |
       v
Email Provider Adapter
       |
       v
Email Provider
       |
       v
Destination Inbox
```

Cross-cutting concerns include:

```text
Configuration
Logging
Error Handling
Rate Limiting
CORS
Security
```

---

## Repository Boundary

The middleware lives in a repository separate from the Angular portfolio.

This separation reflects its independent:

* Runtime.
* Security responsibilities.
* Deployment lifecycle.
* Infrastructure.
* Configuration.
* Testing requirements.

The frontend depends only on the public contact API contract.

---

## API Contract

### Endpoint

```http
POST /api/contact
```

### Request Body

```json
{
  "name": "Recruiter Name",
  "email": "recruiter@example.com",
  "company": "Company Name",
  "message": "Opportunity details, including job post link if available."
}
```

### Success Response

```json
{
  "ok": true,
  "message": "Message sent."
}
```

The API contract should remain independent from the email provider.

---

## Request Processing Pipeline

A contact request should conceptually pass through the following sequence:

```text
Incoming HTTP Request
        |
        v
CORS Validation
        |
        v
Rate Limiting
        |
        v
Request Parsing
        |
        v
Schema / Field Validation
        |
        v
Spam / Abuse Checks
        |
        v
Contact Service
        |
        v
Email Provider Adapter
        |
        v
Provider Delivery
        |
        v
Normalized API Response
```

The exact Express middleware ordering should preserve security controls before provider delivery is attempted.

---

## Server-Side Validation

All externally supplied data must be validated server-side.

Client-side validation from the Angular application must never be trusted as sufficient validation.

Validation should cover:

* Required fields.
* Expected data types.
* Email format.
* Reasonable length limits.
* Whitespace normalization where appropriate.
* Invalid or unexpected payload structure.

Invalid requests should be rejected before email delivery logic executes.

---

## Controller Responsibilities

HTTP controllers or route handlers should remain thin.

They should primarily:

1. Receive validated input.
2. Call the appropriate application/service layer.
3. Translate the result into the documented API response.

Controllers should not contain:

* SMTP configuration.
* Provider authentication.
* Large validation implementations.
* Email template composition logic.
* Infrastructure-specific behavior.

---

## Contact Service

Application-level contact processing should be isolated from Express request/response objects.

Conceptually:

```text
Express Route
     |
     v
Contact Service
     |
     v
Email Provider Interface
```

This allows contact-processing logic to be tested without requiring HTTP or a real email provider.

---

## Email Provider Boundary

Provider-specific email behavior should be isolated behind an abstraction.

Conceptually:

```text
ContactService
      |
      v
EmailProvider
      |
      +--> SMTP implementation
      |
      +--> Future provider implementation
```

Changing providers should not require rewriting:

* Route handlers.
* Validation.
* API contracts.
* Contact-processing logic.

---

## Initial Email Provider Direction

The original implementation plan considered Gmail SMTP as an initial provider.

Provider configuration must remain server-side.

A typical SMTP configuration requires values equivalent to:

```text
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASSWORD
```

Actual credentials must not be stored in source code or committed configuration.

---

## Secret Management

Secrets must come from secure runtime configuration such as:

* Environment variables.
* Hosting-platform secret configuration.
* A dedicated secret manager if infrastructure later requires one.

Never commit:

* SMTP passwords.
* Application passwords.
* API secrets.
* Authentication tokens.
* Production credentials.

Never expose secrets through API responses.

---

## Application Configuration

Non-secret and secret runtime settings may include:

```text
PORT
NODE_ENV

ALLOWED_ORIGINS

SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASSWORD

MAIL_TO
MAIL_FROM_NAME
MAIL_SUBJECT_PREFIX
```

Configuration should be loaded centrally rather than accessing environment variables throughout unrelated application code.

Startup should fail clearly when required production configuration is missing.

---

## CORS

Browser requests should only be accepted from explicitly approved origins.

Development may allow:

```text
http://localhost:4200
```

Production should restrict CORS to the deployed portfolio origin or other intentionally approved origins.

Avoid permissive production configuration such as:

```text
Access-Control-Allow-Origin: *
```

for the contact API unless there is a documented reason.

---

## Rate Limiting

The contact endpoint must use rate limiting before public release.

Rate limiting should:

* Reduce automated abuse.
* Limit repeated contact attempts.
* Return a predictable HTTP response when the limit is exceeded.

Rate-limit configuration should be adjustable without changing application architecture.

---

## Spam and Abuse Protection

Spam protection must be implemented before the endpoint is publicly exposed.

The specific mechanism may evolve.

Possible layers include:

* Request throttling.
* Honeypot techniques.
* Challenge/verification services.
* Behavioral validation.
* Provider-specific abuse protection.

Spam logic should remain separate enough that the mechanism can change without modifying the public API contract.

---

## Error Handling

Errors should be normalized before reaching the API client.

The middleware must not expose:

* Stack traces.
* SMTP authentication errors.
* Provider credentials.
* Internal host information.
* Environment variables.
* Sensitive provider response payloads.

Conceptually:

```text
Internal Error
     |
     v
Server Logging
     |
     v
Error Normalization
     |
     v
Safe HTTP Response
```

---

## Logging

Logging should support diagnostics without exposing sensitive information.

Logs may include:

* Request timestamp.
* Request outcome.
* Correlation/request identifier.
* Validation failure category.
* Provider delivery result.
* Error category.

Logs must not include:

* SMTP passwords.
* API tokens.
* Authentication credentials.
* Secret configuration.

Personally identifying contact content should only be logged when there is a clear operational requirement.

---

## HTTP Response Strategy

Responses should remain stable and frontend-friendly.

### Successful Delivery

```http
200 OK
```

or another intentionally selected success status.

Example:

```json
{
  "ok": true,
  "message": "Message sent."
}
```

### Validation Failure

Use an appropriate 4xx response.

### Rate Limit

Use:

```http
429 Too Many Requests
```

### Unexpected Server Failure

Use an appropriate 5xx response without exposing implementation details.

The exact error response schema should remain consistent across error categories.

---

## Security Headers

The Express application should apply appropriate HTTP security headers.

Security middleware may be used where appropriate, but configuration should remain intentional rather than blindly accepting defaults.

---

## Email Content

Email content should be generated server-side from validated input.

User-provided input must not be interpreted as trusted HTML.

The email should clearly distinguish:

* Contact name.
* Reply email.
* Company.
* Message content.

Provider-specific formatting belongs outside the HTTP layer.

---

## Reply Behavior

The configured destination mailbox receives the contact submission.

Where supported, the visitor's validated email may be used as a reply-to address rather than impersonating the visitor as the sending account.

The middleware's authenticated sending identity should remain controlled by server configuration.

---

## Testing Strategy

Testing should cover application behavior without relying exclusively on real provider delivery.

Important test areas include:

### Validation

* Missing required fields.
* Invalid email addresses.
* Invalid payloads.
* Excessive field lengths.

### API

* Valid request.
* Validation rejection.
* Rate-limit response.
* Unexpected service failure.
* Stable response schema.

### Contact Service

* Correct mapping from contact request to provider message.
* Provider success.
* Provider failure.

### Security

* Disallowed origins.
* Sensitive information absent from responses.
* Credentials absent from logs where testable.

Provider integration tests should be separated from normal unit tests where practical.

---

## Deployment

The middleware is deployed independently from the Angular portfolio.

Conceptually:

```text
Portfolio Domain
      |
      | HTTPS
      v
Middleware API Domain
      |
      v
Node.js / Express
      |
      v
Email Provider
```

Production deployment must provide:

* HTTPS.
* Runtime secrets.
* Approved CORS origins.
* Rate limiting.
* Spam protection.
* Logging.
* Health/restart strategy appropriate to the hosting environment.

---

## Health and Operational Behavior

A lightweight health endpoint may be provided if required by the hosting environment.

Health checks should confirm that the application process is responsive without exposing sensitive configuration.

They should not reveal SMTP credentials or other private infrastructure details.

---

## Frontend Independence

The Angular frontend should never need to understand:

* SMTP.
* Gmail APIs.
* Provider authentication.
* Provider-specific errors.
* Middleware internal class structure.

Its only dependency is the documented contact API.

This boundary should be preserved when the middleware evolves.

---

## Architecture Change Policy

Before making a significant architecture change:

1. Inspect the existing implementation.
2. Review project decisions.
3. Identify why the current architecture is insufficient.
4. Prefer the smallest coherent change.
5. Preserve the public API contract where practical.
6. Record material architectural decisions.

Provider replacement alone should not require changing the frontend contract.

---

## Production Readiness Criteria

The middleware should not be considered production-ready until:

* Server-side validation is active.
* CORS is restricted appropriately.
* Rate limiting is active.
* Spam protection is active.
* Secrets are stored outside source control.
* Sensitive information is excluded from logs and API responses.
* Tests cover critical request and failure paths.
* Production HTTPS is configured.
* Contact delivery has been validated end-to-end.
