---
title: "DRAFT: Prompt injection against an AI agent (replace this title)"
summary: "TODO: one sentence saying what the agent could be made to do and through which input."
date: 2026-11-14
target: "TODO: LLM application or agent"
tags: [TODO]
draft: true
---

## Context

TODO: What the system is and how it was tested. Describe the model's role, the
tools and data it can reach, and where untrusted content enters (user chat,
retrieved documents, emails, web pages). Say whether this was a program, an
engagement or your own research.

## Threat model

TODO: Who the attacker is and what they control.

- What the attacker can write to (a message, a document, a web page).
- What the agent is allowed to do on a user's behalf.
- What would count as harm (data leaving, an action the user did not ask for).

## Finding

TODO: The injection and why it worked. Show the payload, where it was placed
and what the agent did. Note how reliable it was across repeated runs.

```text
TODO: redacted payload
```

## Impact

TODO: What an attacker gains in practice, and what limits it. Say how many
attempts it took and whether a user has to do anything for it to trigger.

## Fix

TODO: What you recommended (for example separating instructions from data,
limiting tool permissions, requiring confirmation for sensitive actions) and
what changed after you reported it.
