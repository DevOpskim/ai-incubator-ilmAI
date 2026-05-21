# Ilm AI MVP

A personal AI study mentor that guides learners through roadmap-based learning paths.

## Purpose
Ilm AI helps people learn a topic step by step instead of just giving them a pile of content.

It works like a mentor:
- You upload your own materials, such as PDFs, notes, docs, or pasted text
- Ilm AI organizes the topic into a roadmap, like `fundamentals -> basic -> advanced`
- You must finish the current stage before the next one unlocks
- Ilm AI chats with you in a supportive mentor style
- It generates quizzes to check understanding
- It generates flashcards inside the app
- It uses spaced repetition so weak cards show up more often
- It tracks progress, gaps, and what to study next

In short:
- Not a wiki
- Not just a chatbot
- Not just flashcards

It is a guided learning system that helps users actually finish a topic and understand it in order.

## Documentation Rule
If the product changes, update the docs immediately so the brief, README, and implementation plan stay aligned.

## Where the app runs
- **Production runtime:** AWS EC2 (Docker Compose on the instance).
- **Database:** Amazon RDS PostgreSQL with `pgvector`, or the Postgres service in `docker-compose.yaml` for a single-box MVP.
- **Laptop:** edit and review code only. Do **not** install Node, Poetry, Docker, or run the app locally unless you explicitly choose to.

## Deployment target
Keep the footprint small: one EC2 instance for frontend + backend containers. Prefer managed RDS for Postgres instead of running the database on the same instance when you move beyond the earliest MVP.

## Stack
- Frontend: Next.js + Tailwind CSS
- Backend: FastAPI (Python)
- Database: PostgreSQL with pgvector
- AI: OpenAI GPT-4o + LangChain
- Auth: JWT
- Runtime: Docker + Docker Compose on EC2

## Laptop workflow (no local app)
1. Clone the repo and edit code.
2. Compare changes against `Ilm AI.md` and the matching file in `MVP-Implementation/`.
3. Commit and push; deploy on EC2 (see below).
4. Verify on the server (`curl` health check, logs, browser against the EC2 public URL).

Static checks you can do without running anything:
- Config files exist (`docker-compose.yaml`, `.env.example`, Alembic migrations).
- Schema models match the step doc entity list.
- README and step docs stay aligned with the brief.

## EC2 deployment
Run these commands **on the EC2 instance** (Amazon Linux 2023 or Ubuntu), not on your laptop.

### One-time server setup
```bash
sudo yum update -y          # Amazon Linux
# sudo apt update && sudo apt upgrade -y   # Ubuntu

sudo yum install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
# log out and back in so docker group applies

sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Deploy application
```bash
git clone <your-repo-url> ilm-agent && cd ilm-agent
cp .env.example .env
# Edit .env: secrets, and DATABASE_URL (see .env.example)

docker compose up -d --build
docker compose ps
curl -s http://127.0.0.1:8000/health
```

Open security group ports as needed (e.g. `80`/`443` via a reverse proxy, or `3000` and `8000` for early testing).

Migrations run automatically when the backend container starts (`alembic upgrade head` in `docker-compose.yaml`).

### RDS instead of compose Postgres
1. Create RDS PostgreSQL 15+ and enable the `vector` extension.
2. Set `DATABASE_URL` in `.env` to the RDS endpoint.
3. Remove or disable the `db` service in `docker-compose.yaml` and drop `depends_on: db` from `backend` if nothing else uses it.
4. Redeploy with `docker compose up -d --build`.

## Commands (on EC2 only)
| Task | Command |
|------|---------|
| Start stack | `docker compose up -d --build` |
| View logs | `docker compose logs -f backend` |
| Stop stack | `docker compose down` |
| Run backend tests | `docker compose run --rm backend poetry run pytest -q` |
| Apply migrations manually | `docker compose run --rm backend alembic upgrade head` |

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user with email and password |
| POST | `/auth/login` | Log in with email and password |
| POST | `/auth/google` | Log in with Google OAuth (placeholder for MVP) |
| POST | `/auth/logout` | Log out the current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/profile` | Get current user's profile with stats, goals, and roadmap |

## Next steps
- Step 3: Authentication and profiles ✅
- Step 4: Material upload

See `MVP-Implementation/` for the full implementation plan.
