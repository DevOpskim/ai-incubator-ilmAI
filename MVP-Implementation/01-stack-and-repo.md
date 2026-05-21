# Step 1: Choose the Stack and Prep the Repo

## Objective
Define the technology stack, initialize the codebase, and prepare a clean repository for the MVP.

## Why this matters
A strong stack choice and clean repo structure reduce early technical risk and make onboarding faster for teammates or investors.

## Deliverables
- Decision on frontend, backend, database, AI, and storage technologies
- Initialized repository with clear folder structure
- `.env.example` and README starter
- Docker Compose for EC2 runtime (not required on developer laptops)
- AWS free-tier-friendly project layout that can run on a single small app instance plus separate PostgreSQL

## Recommended stack
- Frontend: `Next.js + Tailwind CSS`
- Backend: `FastAPI` (Python) or `Node.js + Express`
- Database: `PostgreSQL`
- Vector store: `pgvector` (or Pinecone)
- Auth: `JWT`
- AI: OpenAI GPT-4o / Anthropic Claude + `LangChain` or `LlamaIndex`
- Storage: AWS S3 / Supabase Storage

## Tasks
1. Create repository in GitHub / GitLab
2. Add `.gitignore`, `LICENSE`, and core README
3. Create `frontend/` and `backend/` folders
4. Create `.env.example` with placeholders for secrets
5. Initialize Docker Compose with:
   - frontend service
   - backend service
   - PostgreSQL service
   - optional vector store service

## Onboarding notes
- Keep the repo minimal: one service per folder and one purpose per file.
- Use consistent naming for environment variables.
- Document commands in `README.md` for `dev`, `build`, and `test`.
- Keep the app footprint small enough to fit a basic AWS free-tier or low-cost MVP deployment.
- Avoid introducing load balancers, NAT gateways, or other always-on infrastructure in step 1.

## Verification
Check this step as follows:
1. Confirm the repository has the required top-level files and folders: `README.md`, `.gitignore`, `.env.example`, `LICENSE`, `frontend/`, `backend/`, and `docker-compose.yaml`.
2. Compare the chosen stack in `README.md` against `Ilm AI.md` and make sure it does not drift from the brief.
3. Validate that `docker-compose.yaml` includes frontend, backend, and PostgreSQL services.
4. Confirm the README includes `dev`, `build`, and `test` commands.
5. Confirm README documents EC2 deployment; laptops are for code review only unless explicitly opted in.
6. Treat the step as incomplete if any file exists but conflicts with the brief or cannot be used as documented on EC2.
