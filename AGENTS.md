# AI Agents Overview

This repository is supported by a collection of specialized AI “agents” (bots) that help with cookbook-club site development, styling, deployment, and future rollouts. Each agent has a clearly defined role and scope. Use this document as a quick reference for which agent to call for what, and how to interact with them.

---

## 1. Code Agent

**Name:** `code-assistant`  
**Role:** Front-end Engineer  
**Primary Responsibilities:**  
- Generate, refactor, and correct HTML/CSS/JavaScript.  
- Propose lightweight, targeted diffs or pull-requests.  
- Ensure new code preserves existing functionality.  
- Explain each change with inline comments.  

**How to invoke:**  
> “@code-assistant, please update the two-column CSS grid so the hero is sticky on desktop and collapses on mobile.”  

---

## 2. Design Agent

**Name:** `design-assistant`  
**Role:** UI/UX Designer  
**Primary Responsibilities:**  
- Review mockups (desktop & mobile) and describe visual discrepancies.  
- Produce high-level style guidelines and polish UI details.  
- Translate visual requirements into CSS snippets or design tokens.  

**How to invoke:**  
> “@design-assistant, the placement of the recipe cards over the hero image is wrong—describe what’s happening and suggest how to fix it.”  

---

## 3. Docs Agent

**Name:** `doc-assistant`  
**Role:** Documentation Writer  
**Primary Responsibilities:**  
- Maintain and update `README.md`, `AGENTS.md`, and other docs.  
- Write usage examples, glossaries, and onboarding instructions.  
- Ensure documentation stays in sync with code and design changes.  

**How to invoke:**  
> “@doc-assistant, please update `AGENTS.md` to include our new “release-agent” and describe its workflow.”  

---

## 4. Release Agent

**Name:** `release-agent`  
**Role:** Release Manager / CI Coordinator  
**Primary Responsibilities:**  
- Automate build & deployment to GitHub Pages.  
- Tag new release commits and generate changelogs.  
- Run smoke tests against the staging branch.  

**How to invoke:**  
> “@release-agent, please deploy the `main` branch to GitHub Pages and notify me if it fails.”  

---

## 5. QA & Test Agent

**Name:** `test-agent`  
**Role:** Quality Assurance / Tester  
**Primary Responsibilities:**  
- Generate and run unit and end-to-end tests (e.g. Jest, Cypress).  
- Report broken tests or failing cases.  
- Suggest missing test coverage areas.  

**How to invoke:**  
> “@test-agent, run the full test suite on the `feature/css-grid` branch and summarize failures.”  

---

## 6. Scheduler Agent

**Name:** `schedule-agent`  
**Role:** Task Scheduler / Reminder  
**Primary Responsibilities:**  
- Set up reminders for release dates or design reviews.  
- Schedule periodic checks on site uptime or API usage.  
- Notify via your preferred channel (Slack, email, etc.).  

**How to invoke:**  
> “@schedule-agent, remind me next Monday at 9 AM to review the form’s mobile layout.”  

---

# Best Practices

- **Targeted prompts**  
  Always address a single agent by name and be as specific as possible about the scope, e.g. “@code-assistant, only change the media query at 768 px—nothing else.”

- **Preserve functionality**  
  Any styling or structural changes must maintain existing form behavior and data flows.

- **Explain changes**  
  Agents should include inline comments in code snippets and a brief human-readable summary of “what” and “why.”

- **Version control**  
  Agents should propose changes as diffs or PRs; never push directly to `main` without review.

---

With this setup, you can streamline your cookbook-club site development, keep roles clear, and ensure smooth collaboration between you and your AI helpers!
