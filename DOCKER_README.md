# Roda Traden Docker Deployment Guide

## Overview

- `docker-compose-template.yml` contains a rodatraden-only setup with Traefik and Django.
- No database passwords are stored in the compose template.
- Domain and ACME email are injected through `.env` variables.
- SQLite database and media files are stored under `./data` by default.

## Database Recommendation

- SQLite is fine for small deployments and easy backups.
- For production with multiple users and heavier writes, use PostgreSQL or MySQL/MariaDB.
- The Django settings template supports all three through environment variables.

## Initial Setup

1. Copy the compose and env templates:

```bash
cp docker-compose-template.yml docker-compose.yml
cp .env.template .env
```

2. Edit `.env` and set real values:

```env
TRAEFIK_ACME_EMAIL=you@example.com
RODATRADEN_DOMAIN=rodatraden.example.com
TZ=Europe/Stockholm
DJANGO_SECRET_KEY=replace-with-a-long-random-secret
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=rodatraden.example.com
DJANGO_CSRF_TRUSTED_ORIGINS=https://rodatraden.example.com
```

3. Ensure `tf/settings.py` exists (copy from template if needed):

```bash
cp tf/settings-template.py tf/settings.py
```

The default template uses:
- `data/db.sqlite3` for the database
- `data/media/` for uploaded files

To switch to PostgreSQL or MySQL/MariaDB, set `DJANGO_DB_*` variables in `.env`.

---

## Data Persistence

Persistent project data is stored on the host in:
- `./data/db.sqlite3` (SQLite)
- `./data/media/` (user uploads)
- `./static/` (collected static files)

Traefik ACME certificates are stored in:
- `./letsencrypt/`

## Common Commands

### Start all services
```bash
docker compose up -d
```

### Stop all services
```bash
docker compose down
```

### View logs
```bash
# All services
docker compose logs -f

# Just rodatraden
docker compose logs -f rodatraden

# Just reverse proxy
docker compose logs -f reverse-proxy
```

### Restart rodatraden
```bash
docker compose restart rodatraden
```

---

## Updating Application

### After making code changes
```bash
docker compose up -d --build rodatraden
```

This rebuilds the image and restarts the app container.

### If you added new Python packages
1. Add them to `requirements.txt`
2. Rebuild: `docker compose up -d --build rodatraden`

---

## Database

By default, the database is SQLite stored at `./data/db.sqlite3`.

For production database engines, configure `.env`:

```env
DJANGO_DB_ENGINE=postgres
DJANGO_DB_NAME=rodatraden
DJANGO_DB_USER=rodatraden
DJANGO_DB_PASSWORD=replace-me
DJANGO_DB_HOST=127.0.0.1
DJANGO_DB_PORT=5432
```

### Run migrations
```bash
docker exec rodatraden python manage.py migrate
```

### Create superuser
```bash
docker exec -it rodatraden python manage.py createsuperuser
```

### Backup database
```bash
cp data/db.sqlite3 data/db.sqlite3.backup
```

### Restore database backup
```bash
cp data/db.sqlite3.backup data/db.sqlite3
```

---

## Static Files

If you add new static files (images, CSS, JS):
```bash
docker exec rodatraden python manage.py collectstatic --noinput
```

Or rebuild the container.

---

## Running Django Management Commands

### Via Docker (recommended for production)
```bash
docker exec rodatraden python manage.py <command>
```

Examples:
```bash
docker exec rodatraden python manage.py migrate
docker exec -it rodatraden python manage.py createsuperuser
docker exec rodatraden python manage.py shell
docker exec rodatraden python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission --indent 2 -o data/backup.json
```

### Via local venv (development/scripts)
```bash
source venv/bin/activate
python manage.py <command>
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 502 Bad Gateway | Check if container is running: `docker ps` |
| Static files 404 | Run `collectstatic` or rebuild |
| CSRF errors | Check `CSRF_TRUSTED_ORIGINS` and `ALLOWED_HOSTS` in `tf/settings.py` |
| SSL issues | Check Traefik logs, verify DNS |
| Database issues | Verify `data/db.sqlite3` exists and is writable |
