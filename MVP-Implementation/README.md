# Ilm AI MVP Implementation

This folder contains the step-by-step MVP implementation plan for Ilm AI.
Each numbered file is a self-contained onboarding document for a specific phase of the build.
The plan follows the required MVP scope in `Ilm AI.md`: private user spaces, material upload, grounded chat, quiz practice, knowledge gap detection, roadmap-driven learning plans, Telegram reminders, and premium tiers.
Stretch features from the brief are intentionally excluded from this MVP plan unless a later step explicitly says otherwise.

## Contents

1. `01-stack-and-repo.md` - stack selection and repository setup
2. `02-infrastructure-setup.md` - EC2 runtime, database schema, and API scaffolding
3. `03-auth-and-profiles.md` - user accounts, authentication, and profile pages
4. `04-material-upload.md` - document ingestion, parsing, and vector storage
5. `05-ai-chat-companion.md` - grounded AI chat interface
6. `06-quiz-practice-mode.md` - quiz sessions, flashcards, and spaced repetition
7. `07-knowledge-gap-detection.md` - gap analysis and reports
8. `08-learning-plan-generator.md` - personalized study plan generation
9. `09-telegram-integration.md` - bot reminders and quizzes on Telegram
10. `10-payment-premium-tier.md` - subscription model and payment integration
11. `11-test-and-launch.md` - validation, deployment, and pitch-ready launch checklist

## How to use

- Start with `01-stack-and-repo.md` and progress sequentially.
- Each step includes goals, tasks, deliverables, and onboarding notes.
- Use this as the core documentation for team onboarding and investor pitch preparation.

## Verification Workflow
After each task, verify it before moving to the next one.

1. Re-read the task in the numbered doc and compare it against `Ilm AI.md`.
2. Check the actual repo state, not just the written plan.
3. On a laptop, prefer static checks (files, schema, docs). Run commands only on EC2 unless you explicitly opt into local tooling.
4. Confirm the output matches the task’s deliverable.
5. If something is incomplete, fix it immediately and re-check.
6. Mark the task as done only when the requirement is satisfied in both the docs and the repository.

## Documentation Sync Rule
Any product change must be reflected in the docs immediately.

- If the brief changes, update `Ilm AI.md` first.
- If the implementation changes, update the relevant numbered step file at the same time.
- If the README changes, make sure it still matches the brief and the implementation plan.
- Do not leave the repo in a state where code, plan, and brief disagree.

## Step-by-Step Checks
- Planning tasks: compare wording against the brief and make sure there are no contradictions.
- Scaffold tasks: confirm files, folders, and configuration exist.
- Backend tasks: on EC2, run the app or test command and confirm it responds as expected.
- Frontend tasks: on EC2 (or the public URL), open the page and confirm the expected UI appears.
- Data/model tasks: verify the schema, migrations, or model definitions match the requirement.
- Integration tasks: test the end-to-end happy path and one failure case.
