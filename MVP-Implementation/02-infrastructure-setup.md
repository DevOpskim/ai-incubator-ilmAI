# Step 2: Set Up Core Infrastructure

## Objective
Build the EC2 runtime environment and core data model needed by the MVP.

## Why this matters
A reliable infra layer means the product can deploy cleanly on AWS and scale from prototype to production without depending on developer laptops.

## Deliverables
- Docker Compose stack intended for EC2 (frontend, backend, optional Postgres)
- PostgreSQL database with base schema
- Basic API scaffolding
- Environment config for EC2 and RDS

## Tasks
1. Create Docker Compose services for backend, frontend, and database.
2. Define the PostgreSQL schema for core entities:
   - `users`
   - `materials`
   - `uploads`
   - `topics`
   - `sessions`
   - `chat_sessions`
   - `chat_messages`
   - `quizzes`
   - `flashcards`
   - `review_sessions`
   - `review_queue`
   - `flashcard_note_types`
   - `gaps_reports`
   - `goals`
   - `subscriptions`
3. Add database migrations or schema setup script.
4. Add API scaffolding with simple health check endpoints.
5. Create `.env` and `.env.example` templates.

## Onboarding notes
- Keep schemas simple and extensible.
- Use UUIDs for primary keys if the product may expand to multiple services.
- Run `docker compose up -d --build` on EC2, not on developer laptops by default.
- Prefer RDS for Postgres when moving beyond a single-box MVP.

## Verification

### On a laptop (static, no installs)
1. Confirm `docker-compose.yaml`, Alembic migration, and SQLAlchemy models exist.
2. Confirm entity list in this doc matches `backend/app/models/tables.py`.
3. Confirm `.env.example` documents EC2 and RDS `DATABASE_URL` patterns.

### On EC2 (runtime)
1. Run `docker compose up -d --build` and confirm containers are healthy.
2. Confirm Alembic applies `backend/alembic/versions/*_initial_schema.py` without errors.
3. Run `docker compose run --rm backend poetry run pytest -q`.
4. Call `GET http://127.0.0.1:8000/health` and confirm `"database": "connected"`.
5. Confirm tables exist in Postgres: `users`, `materials`, `uploads`, `topics`, `sessions`, `chat_sessions`, `chat_messages`, `quizzes`, `flashcards`, `review_sessions`, `review_queue`, `flashcard_note_types`, `gaps_reports`, `goals`, `subscriptions`, plus `material_chunks` for embeddings.
6. Confirm `flashcard_note_types` is seeded with `cloze`, `basic_typed`, and `basic_reversed`.
