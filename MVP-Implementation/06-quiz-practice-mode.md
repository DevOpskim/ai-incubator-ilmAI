# Step 6: Add Quiz & Practice Mode

## Objective
Build a practice mode that generates questions from uploaded material and evaluates user answers.

## Why this matters
Quizzes make learning active, help users test understanding, and provide the data needed for gap detection.

## Deliverables
- Topic selection UI
- Difficulty level options
- Support for user-defined topics and collections, not preset school subjects
- Support for roadmap-based learning paths with progression gates
- Staged progression such as fundamentals -> basic -> advanced
- Roadmap checkpoints that must be completed before unlocking the next stage
- Question generation for multiple choice, short answer, and open response
- Answer evaluation with explanation and source links
- AI-generated flashcards from uploaded materials
- Anki-style flashcard note types: Cloze, Basic (type in the answer), and Basic (and reversed card)
- Spaced repetition review queue with adaptive scheduling
- Stored quiz performance data

## Tasks
1. Add quiz creation UI:
   - choose topic
   - choose level: gentle review, solid understanding, expert challenge
   - enforce progression so users complete roadmap checkpoints before unlocking the next module
   - show the current stage, completion requirements, and next locked stage
2. Create backend question generation flow:
   - retrieve relevant chunks
   - generate questions with the LLM
3. Implement answer evaluation:
   - compare user input against source material
   - generate feedback with explanations and exact source references
4. Build flashcard generation from roadmap milestones and uploaded materials.
   - support Cloze deletion cards
   - support Basic typed-answer cards
   - support Basic cards with reversed front/back direction
5. Implement a spaced repetition scheduler that prioritizes weak cards sooner.
6. Save quiz and flashcard review results in the database.
7. Display quiz history, flashcard review history, and performance summaries.

## Onboarding notes
- Keep questions fresh and tied to source text.
- Use the same grounding logic as chat to avoid hallucinated answers.
- Capture enough detail to analyze weak concepts later.
