# Volunteer Match - Docker Setup

Compose development menjalankan Laravel dan Next.js dengan bind mount untuk perubahan kode secara langsung.
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

## Production

Copy `.env.prod.example` to `.env.prod`, then set strong values for `APP_KEY` and `DB_PASSWORD`. Generate an application key with:

```sh
docker run --rm php:8.4-cli php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"
```

Set `APP_URL`, `CORS_ALLOWED_ORIGINS`, and `NEXT_PUBLIC_API_URL` for the deployment. The public API URL is embedded in the frontend bundle at build time.

Build and start the independent production stack:

```sh
docker compose --env-file .env.prod -f compose.prod.yaml up -d --build
```

This builds the Next.js app and serves the production build with `npm start`. The Laravel image uses Apache, OPcache, and Laravel optimizations with `APP_ENV=production` and `APP_DEBUG=false`. Both application services have healthchecks.

Use HTTPS behind a production reverse proxy before exposing these services to the internet. View readiness with:

```sh
docker compose --env-file .env.prod -f compose.prod.yaml ps
```

Verify only the production frontend build from the test Compose file with:

```sh
docker compose -f compose.test.yaml --profile production-build build frontend-build
```
