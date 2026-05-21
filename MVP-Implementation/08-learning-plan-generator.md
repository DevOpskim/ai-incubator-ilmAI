# Step 8: Learning Plan Generator

## Objective
Generate personalized daily study plans based on uploaded materials, gaps, and user goals.

## Why this matters
A practical learning plan turns motivation into an actionable path and demonstrates value quickly.

## Deliverables
- Goal input form with target date
- Agent or prompt flow that creates a day-by-day plan
- Mapping of plan items to specific uploaded documents
- Plan updates after new sessions or goal changes
- Plan output grounded in the user’s uploaded materials and measured knowledge gaps
- Plan output organized as a roadmap with prerequisite gates and milestone checkpoints

## Tasks
1. Build goal input UI:
   - learning objective
   - target date
   - available study time
2. Implement backend agent tools:
   - `get_knowledge_gaps(user_id)`
   - `list_topics(user_id)`
   - `get_days_until_goal(user_id)`
   - `generate_plan(topics, gaps, days)`
3. Create the plan generation prompt template.
4. Ensure generated plans respect roadmap progression, and avoid generic advice.
5. Store and display the generated learning plan.
6. Recompute the plan when material, goal, or performance changes.

## Onboarding notes
- Keep the plan realistic and document-specific.
- Do not generate generic advice like “study more.”
- Use the uploaded materials as the actual study tasks.
