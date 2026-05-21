# Step 7: Knowledge Gap Detection

## Objective
Analyze quiz results to identify learning gaps and generate plain-language reports.

## Why this matters
Gap detection turns raw quiz data into actionable study guidance and makes the product feel intelligent.

## Deliverables
- Analysis of quiz performance over time
- Generated Gaps Report with strengths and weak areas
- Suggested document sections for review
- Auto-updating report after new sessions

## Tasks
1. Define performance metrics for each quiz:
   - accuracy
   - concept mastery
   - repeated mistakes
2. Implement a backend service to aggregate quiz history.
3. Build rules / prompt flow for gap identification.
4. Generate a user-facing report that includes:
   - what is known well
   - what needs work
   - recommended review material
5. Refresh the report automatically when new quiz sessions are completed.

## Onboarding notes
- Keep reports simple and actionable.
- Use exact topic labels from the user’s materials.
- Avoid jargon: explain gaps in plain language.
