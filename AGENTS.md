# Ilm Agent — Dev Notes

## Build & Deploy
- Build images: `docker compose build`
- Push: `docker push avkeem999/ilm-agent-backend:latest && docker push avkeem999/ilm-agent-frontend:latest`
- Deploy on EC2: commit to main → GitHub Actions runs: test → build & push → SCP compose + Caddyfile → `docker compose pull && up -d`
- Manual SSH: `ssh -i ~/.ssh/aws-ec2.pem ubuntu@16.192.57.72`

## Lint / Typecheck
- Backend: `docker compose run --rm backend poetry run ruff check .`
- Frontend: `docker compose run --rm frontend npm run lint` (if available)

## Tests
- Backend: `docker compose run --rm backend poetry run pytest`
- Frontend: not yet configured

## EC2 .env Fix
If `BACKEND_INTERNAL_URL` has wrong hostname:
```
sed -i 's/ilm-agent-backend/backend/g' ~/ilm-agent/.env
docker compose down && docker compose up -d
```
