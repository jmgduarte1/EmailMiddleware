# Project Decisions

This document records significant technical and product decisions for the Email Middleware project.

Its purpose is to preserve the reasoning behind important choices, make architectural intent explicit, and provide a reliable reference for future development.

Decisions should remain in this document when superseded so the evolution of the project stays visible.

---

## MD-001 — Node.js / Express as the Backend Runtime

**Status:** Accepted

The Email Middleware is implemented as a Node.js application using Express.

### Rationale

Node.js and Express provide a lightweight backend suitable for:

* A focused HTTP API.
* Server-side validation.
* Email-provider integration.
* Middleware-based security controls.
* Independent deployment from the Angular portfolio.
* Straightforward testing and maintenance.

### Consequences

* The project remains intentionally small and focused.
* Express route handlers should remain thin.
* Application logic should be separated from HTTP concerns where practical.
* Additional frameworks should not be introduced without a clear requirement.

---

## MD-002 — Separate Repository from the Angular Portfolio

**Status:** Accepted

The Email Middleware is maintained in a repository separate from the Angular portfolio.

### Rationale

The middleware has different:

* Runtime requirements.
* Security responsibilities.
* Deployment lifecycle.
* Configuration.
* Dependencies.
* Testing requirements.

Keeping the projects separate allows each application to evolve independently.

### Consequences

* The Angular application depends only on the documented HTTP API.
* Backend internals must not leak into frontend code.
* Changes to middleware internals should not require Angular changes when the API contract remains stable.

---

## MD-003 — Independent Deployment Under an API Subdomain

**Status:** Accepted

The middleware will be deployed independently under a dedicated API subdomain.

Conceptually:

```text
https://www.example.com
        |
        v
Angular Portfolio

https://api.example.com
        |
        v
Email Middleware
```

### Rationale

The selected hosting model favors independent applications connected to separate domains or subdomains.

This preserves deployment independence while providing a clear public API boundary.

### Consequences

* Production requests from the portfolio are cross-origin.
* CORS must explicitly allow the production portfolio origin.
* The frontend must configure the API origin centrally.
* The middleware deployment can change independently as long as the public API contract remains stable.

---

## MD-004 — Stable Contact API Contract

**Status:** Accepted

The primary public endpoint is:

```http
POST /api/contact
```

Expected request body:

```json
{
  "name": "Recruiter Name",
  "email": "recruiter@example.com",
  "company": "Company Name",
  "message": "Opportunity details."
}
```

### Rationale

The Angular frontend should depend on a simple, stable contract rather than middleware or provider-specific behavior.

### Consequences

* Provider changes should not affect the request contract.
* Internal refactoring should not affect the endpoint unnecessarily.
* Contract changes require explicit compatibility review.
* Frontend integration documentation must be updated when the contract changes.

---

## MD-005 — Server-Side Validation Is Mandatory

**Status:** Accepted

All contact submissions must be validated by the middleware.

### Rationale

Client-side validation improves usability but cannot be trusted as a security boundary.

All external input must be treated as untrusted.

### Consequences

Validation should cover:

* Required fields.
* Expected types.
* Email format.
* Reasonable field lengths.
* Empty or malformed payloads.
* Normalization where appropriate.

Invalid requests must be rejected before provider delivery logic executes.

---

## MD-006 — HTTP Handlers Remain Thin

**Status:** Accepted

Express routes/controllers should remain focused on HTTP responsibilities.

### Rationale

Keeping route handlers small improves:

* Testability.
* Maintainability.
* Separation of concerns.
* Provider independence.

### Consequences

Controllers should primarily:

1. Receive validated input.
2. Call application/service logic.
3. Return normalized HTTP responses.

Controllers should not contain substantial:

* SMTP logic.
* Provider authentication.
* Email composition logic.
* Environment configuration.
* Validation implementation.

---

## MD-007 — Email Provider Isolated Behind a Boundary

**Status:** Accepted

Provider-specific email delivery logic will remain isolated from the rest of the application.

Conceptually:

```text
Contact Route
      |
      v
Contact Service
      |
      v
Email Provider Interface
      |
      +--> SMTP Provider
      |
      +--> Future Provider
```

### Rationale

The middleware should not be tightly coupled to Gmail, SMTP, or any single email provider.

### Consequences

Changing providers should not require rewriting:

* Routes.
* Validation.
* API contracts.
* Core contact-processing logic.

Provider-specific configuration and behavior remain isolated.

---

## MD-008 — Secrets Come from Runtime Configuration

**Status:** Accepted

Secrets must be provided through secure runtime configuration.

### Rationale

Credentials must not exist in source code or public Git history.

### Consequences

Secrets may be provided through:

* Environment variables.
* Hosting-platform secret configuration.
* A dedicated secret manager if later required.

Never commit:

* SMTP passwords.
* Application passwords.
* API keys.
* Authentication tokens.
* Production credentials.

---

## MD-009 — Configuration Is Centralized

**Status:** Accepted

Runtime configuration will be loaded and normalized through a centralized configuration layer.

### Rationale

Scattered access to environment variables makes validation, testing, and maintenance harder.

### Consequences

Configuration may include values such as:

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

Required production configuration should fail clearly during startup when missing.

---

## MD-010 — Restrictive CORS Policy

**Status:** Accepted

Production CORS configuration will allow only explicitly approved frontend origins.

### Rationale

The middleware is intended to serve the portfolio application, not act as an unrestricted public browser API.

### Consequences

Development may allow an origin such as:

```text
http://localhost:4200
```

Production will allow the deployed portfolio origin.

Permissive wildcard CORS should not be introduced without a documented requirement.

---

## MD-011 — Rate Limiting Before Public Release

**Status:** Accepted

The public contact endpoint must use rate limiting before production release.

### Rationale

The endpoint can otherwise be abused for automated submissions or email flooding.

### Consequences

* Rate limits should be configurable.
* Exceeded limits should return predictable HTTP behavior.
* Rate-limit behavior should be testable where practical.

---

## MD-012 — Spam Protection Before Public Release

**Status:** Accepted

The middleware must include spam/abuse protection before being publicly exposed.

### Rationale

A publicly accessible contact endpoint is inherently susceptible to automated abuse.

### Consequences

The exact mechanism may evolve and may include:

* Rate limiting.
* Honeypot techniques.
* Challenge/verification services.
* Behavioral checks.
* Provider-side protection.

The chosen mechanism should not require changing the public API contract unnecessarily.

---

## MD-013 — Safe Error Normalization

**Status:** Accepted

Internal and provider errors must be normalized before being returned to API clients.

### Rationale

Raw backend or provider errors may expose implementation or security information and create unstable frontend behavior.

### Consequences

API responses must not expose:

* Stack traces.
* SMTP authentication errors.
* Credentials.
* Environment variables.
* Internal host information.
* Sensitive provider payloads.

Detailed diagnostic information should remain server-side where appropriate.

---

## MD-014 — Sensitive-Safe Logging

**Status:** Accepted

Application logging must avoid credentials and unnecessary personal information.

### Rationale

Logs are operational data and should not become an accidental store for secrets or contact-message content.

### Consequences

Logs may include:

* Timestamp.
* Request outcome.
* Request/correlation identifier.
* Validation failure category.
* Provider delivery result.
* Error category.

Logs must not include:

* SMTP passwords.
* API keys.
* Tokens.
* Authentication credentials.

Full contact payloads should not be logged by default.

---

## MD-015 — Contact Data Is Not Persisted Unnecessarily

**Status:** Accepted

The middleware's primary responsibility is to process and deliver contact submissions, not to maintain a permanent contact-message database.

### Rationale

Minimizing stored personal information reduces operational complexity and unnecessary data retention.

### Consequences

* Contact payloads should not be persisted unless a future requirement explicitly justifies it.
* Logs should not act as an implicit message store.
* A future persistence requirement must be recorded as a new architectural decision.

---

## MD-016 — User Input Is Never Trusted HTML

**Status:** Accepted

User-provided contact content must not be treated as trusted HTML.

### Rationale

Contact fields are external input and may contain malicious or malformed content.

### Consequences

* Email content must be generated safely.
* Raw user input must not be injected into unsafe HTML.
* If HTML email formatting is used, user-provided values must be escaped or encoded appropriately.

---

## MD-017 — Controlled Sender Identity and Reply-To

**Status:** Accepted

The authenticated sender identity remains controlled by server configuration.

The visitor's validated email may be used as the reply-to address where supported.

### Rationale

The middleware should not impersonate arbitrary user-provided email addresses as the authenticated sender.

### Consequences

Conceptually:

```text
From:
Configured middleware sender

Reply-To:
Validated visitor email
```

This preserves provider authentication requirements while allowing convenient replies.

---

## MD-018 — Automated Tests Do Not Send Real Production Email

**Status:** Accepted

Normal unit tests, integration tests, and CI runs must not send real emails through the production provider.

### Rationale

Real provider delivery makes tests:

* Slow.
* Fragile.
* Potentially expensive.
* Dependent on external infrastructure.
* Capable of generating unwanted email.

### Consequences

* Provider behavior should be mocked or replaced in normal automated tests.
* Real delivery should be reserved for deliberate integration/end-to-end validation.
* Production credentials must never be required for the normal test suite.

---

## MD-019 — Security and Failure Paths Are Part of Testing

**Status:** Accepted

Tests must cover more than successful contact delivery.

### Rationale

The main risks in this middleware exist in validation, abuse prevention, provider failure, security configuration, and error handling.

### Consequences

Important test categories include:

* Missing required fields.
* Invalid email.
* Invalid payload shape.
* Excessive lengths.
* Valid request.
* Rate limiting.
* Service failure.
* Provider failure.
* Stable response schema.
* Correct HTTP status behavior.
* Disallowed origins where practical.
* Sensitive information absent from responses.

---

## MD-020 — Production Readiness Requires Security Controls

**Status:** Accepted

Successful local email delivery alone is not sufficient for production readiness.

### Rationale

A public backend requires operational and security controls beyond functional success.

### Consequences

Production readiness requires:

* Server-side validation.
* Restricted CORS.
* Rate limiting.
* Spam protection.
* Secrets outside source control.
* Safe logging.
* Safe error responses.
* Critical-path tests.
* HTTPS.
* Validated production configuration.
* End-to-end delivery verification.

---

## MD-021 — Public API Remains Provider-Independent

**Status:** Accepted

The API response contract must remain independent from the configured email provider.

### Rationale

The Angular portfolio should not need to understand whether delivery uses SMTP, Gmail, a transactional provider, or another mechanism.

### Consequences

Do not expose fields such as:

```text
smtpResponse
messageIdFromGmail
providerName
providerError
```

as required parts of the frontend contract.

Provider-specific diagnostic data remains internal.

---

## MD-022 — Architecture and Integration Documentation Have Separate Ownership

**Status:** Accepted

The Email Middleware repository is the authoritative source for backend implementation architecture.

The Angular portfolio repository documents the frontend integration contract.

### Rationale

Duplicating full middleware architecture in both repositories creates conflicting sources of truth.

### Consequences

The Email Middleware repository owns documentation for:

* Backend request processing.
* Validation.
* Provider integration.
* Security.
* Logging.
* Configuration.
* Deployment.
* Backend testing.

The Angular portfolio repository owns documentation for:

* Frontend request behavior.
* API-origin configuration.
* Contact UI states.
* Frontend accessibility.
* Integration expectations.

Changes to the shared API contract may require documentation updates in both repositories.

---

## Decision Maintenance

Record a new decision when it materially affects:

* Public API contracts.
* Backend architecture.
* Security.
* Input validation.
* Email-provider integration.
* Configuration.
* Logging.
* Deployment.
* Testing strategy.
* Data retention.
* Cross-origin behavior.

Each decision should include:

* Unique identifier.
* Status.
* Decision.
* Rationale.
* Important consequences.

Possible statuses include:

* Proposed
* Accepted
* Superseded
* Deprecated

When a decision changes:

1. Preserve the original entry.
2. Mark it as `Superseded` when appropriate.
3. Reference the decision that replaces it.

Do not rewrite project history simply to make the current architecture appear to have always existed.
