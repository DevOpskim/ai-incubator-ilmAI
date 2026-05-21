# Step 5: Build the AI Chat Companion

## Objective
Create a grounded conversational interface that answers questions using only the user's uploaded materials.

## Why this matters
Users must trust the AI to stay within their own content and provide references, not hallucinations.

## Deliverables
- Chat UI with conversation history
- Backend retrieval of relevant document chunks
- Prompt assembly for grounded responses
- Citation of exact source text
- Language support for Uzbek, Russian, and English
- Mentor-style guidance that asks follow-up questions and nudges the learner through the current stage

## Tasks
1. Build chat UI components:
   - message list
   - input box
   - streaming response support
2. Implement backend search:
   - query vector store
   - return top relevant chunks
3. Create a prompt template that:
   - limits the model to user materials
   - asks for sources and citations
   - uses a warm, patient, Socratic mentor tone
   - encourages the learner to think through the current stage before advancing
4. Add language handling for response language selection.
5. Return chat transcripts and memory per session.

## Onboarding notes
- Use short, clear system prompts to enforce grounded answers.
- Save the retrieval context so every response can link back to a material segment.
- Keep UI simple: users should see the citation and be able to open the source.
