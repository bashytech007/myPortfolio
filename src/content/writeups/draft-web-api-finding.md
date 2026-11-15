---
title: "DRAFT: Web or API finding (replace this title)"
summary: "TODO: one sentence saying what was wrong and what it allowed an attacker to do."
date: 2026-11-15
target: "TODO: Web application or API"
tags: [TODO]
draft: true
---

## Context

TODO: What was tested and why. Describe the application in general terms (what
it does and who uses it). Do not name the client unless you have written
permission. Say what kind of test it was (black box, grey box, source
available) and what was in scope.

## Threat model

TODO: Who would attack this and what they would want.

- The assets that matter (accounts, payment data, admin functions).
- The attacker you assumed (anonymous, logged-in user, another tenant).
- The trust boundary you were probing.

## Finding

TODO: What you found and how you found it. Give the steps to reproduce with
redacted requests and responses, then explain the root cause.

```http
GET /api/v1/TODO HTTP/1.1
Host: redacted.example
Authorization: Bearer <redacted>
```

## Impact

TODO: What an attacker could do with this, in concrete terms. Include the
severity rating and how you arrived at it (for example a CVSS vector).

## Fix

TODO: What you recommended, what the team shipped, and how you retested it.
Add the disclosure timeline if there is one.
