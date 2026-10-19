# Volunteer Match - Docker Setup
## Requirements
- Docker Desktop
- Docker Compose v2
- Git
## Quick Start
Run from repository root:
docker compose up -d --build
## Services
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- PostgreSQL: localhost:5433
## Commands
- Check containers: docker compose ps
- View logs: docker compose logs -f
- Stop services: docker compose down
## Notes
- Development environment only.
- Dependencies and Laravel migrations run automatically.
- Database data persists in a Docker volume.
- Do not use docker compose down -v unless deleting database data.
- Never commit real environment files or secrets.
